# Voice Integration Plan — Frontend Agent Execution Guide

> **Goal:** Connect the LiveKit Python voice agent to the existing frontend voice UI, wire up confirmation dialogs, and replace the stale text-chat tool state with LiveKit-native data messages.
>
> **Execute tasks strictly in order.** Each task lists exact files, what to change, and the acceptance test.

---

## Context

- Python voice agent lives at `livekit-voice-agent/agent.py`
- Voice UI lives at `frontend/src/app/voice/page.tsx`
- LiveKit credentials changed — the `.env` in `frontend/` is stale
- `useAgentChat` (AI SDK text transport) currently drives `currentTool` state on the voice page — it must be replaced with a LiveKit-native hook
- The `ApprovalSheet` and its `show_approval` RPC handler already exist and work — they just need the Python agent to call them

### Tool name mapping (Python snake_case → frontend display)

| Python tool | Frontend label |
|---|---|
| `get_bank_accounts` | Get Bank Accounts |
| `get_bank_account` | Get Bank Account |
| `get_bills` | Get Bills |
| `pay_bill` | Pay Bill ⚠️ confirmation required |
| `get_transfers` | Get Transfers |
| `execute_transfer` | Execute Transfer ⚠️ confirmation required |
| `show_options` | Show Options (user pick) |

---

## Task 1 — Update frontend LiveKit credentials

**File:** `frontend/.env.local`

Replace the entire file content with:

```
LIVEKIT_URL=wss://testing-mgpo8jdx.livekit.cloud
LIVEKIT_API_KEY=APIAwSpnyFxQTWw
LIVEKIT_API_SECRET=PxE42n7k3UwtJZ1aJOpPYKRvjIpU2iQz8xWvgnL3AMA
NEXT_PUBLIC_LIVEKIT_AGENT_NAME=mizan-agent
DEEPGRAM_API_KEY=745a24a5aa5648cfcff356a93f6fede3f4d6ee1c
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyDknDE6bf8oMPoRCWw7moQmazhA4OoS7YU
```

**Acceptance:** `api/token/route.ts` picks up the new key/secret — test by calling `GET /api/token?room=test` and confirming no 500.

---

## Task 2 — Create `use-voice-tool-state.ts` hook

**File:** `frontend/src/hooks/use-voice-tool-state.ts`

This is the replacement for the `useAgentChat` dependency in the voice page. It:
- Listens to LiveKit data channel messages from the agent (`tool_start` / `tool_end`)
- Parses them into `currentTool` state
- Invalidates TanStack Query caches when a mutation tool completes so dashboard/bills refresh automatically

```ts
"use client";

import { useDataChannel } from "@livekit/components-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  getBankAccountsQueryKey,
  getBillsQueryKey,
  getBudgetQueryKey,
  getTransactionsQueryKey,
} from "@/gen/api/@tanstack/react-query.gen";

const MUTATION_TOOLS = new Set(["pay_bill", "execute_transfer"]);

export type VoiceToolCall = {
  toolName: string;
  input: Record<string, unknown>;
};

export function useVoiceToolState() {
  const [currentTool, setCurrentTool] = useState<VoiceToolCall | null>(null);
  const queryClient = useQueryClient();

  useDataChannel((msg) => {
    try {
      const event = JSON.parse(new TextDecoder().decode(msg.payload));
      if (event.event === "tool_start") {
        setCurrentTool({ toolName: event.tool, input: event.input ?? {} });
      } else if (event.event === "tool_end") {
        if (MUTATION_TOOLS.has(event.tool)) {
          queryClient.invalidateQueries({ queryKey: getBankAccountsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getBillsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getBudgetQueryKey() });
          queryClient.invalidateQueries({ queryKey: getTransactionsQueryKey() });
        }
        setCurrentTool(null);
      }
    } catch {
      // malformed message — ignore
    }
  });

  return { currentTool };
}
```

**Acceptance:** Hook compiles with no TS errors (`cd frontend && bun run build` passes).

---

## Task 3 — Create `ToolCallBanner` component

**File:** `frontend/src/app/voice/_components/ToolCallBanner.tsx`

Replace the existing `ToolResultRenderer` which is typed to the old AI SDK tool names. This one accepts the looser `VoiceToolCall` shape from the new hook:

```tsx
"use client";

import { Loader2, Settings2 } from "lucide-react";
import type { VoiceToolCall } from "@/hooks/use-voice-tool-state";

const TOOL_LABELS: Record<string, string> = {
  get_bank_accounts: "Checking accounts",
  get_bank_account: "Looking up account",
  get_bills: "Fetching bills",
  pay_bill: "Paying bill",
  get_transfers: "Fetching transfers",
  execute_transfer: "Sending transfer",
  show_options: "Waiting for your choice",
};

function summarizeInput(tool: VoiceToolCall): string {
  const i = tool.input;
  if (tool.toolName === "pay_bill")
    return `Bill #${i.bill_id} from account #${i.bank_account_id}`;
  if (tool.toolName === "execute_transfer")
    return `${i.amount} to ${i.recipient}`;
  if (tool.toolName === "show_options") return String(i.title ?? "");
  return "";
}

export function ToolCallBanner({ currentTool }: { currentTool: VoiceToolCall | null }) {
  if (!currentTool) return null;

  return (
    <div className="mx-auto mb-3 w-full max-w-sm rounded-xl border border-border/70 bg-card/95 px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        <Settings2 className="size-3.5" />
        {TOOL_LABELS[currentTool.toolName] ?? currentTool.toolName}
      </div>
      {summarizeInput(currentTool) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          <span className="truncate">{summarizeInput(currentTool)}</span>
        </div>
      )}
    </div>
  );
}
```

---

## Task 4 — Rewire `voice/page.tsx`

**File:** `frontend/src/app/voice/page.tsx`

Make these targeted changes — do NOT rewrite the entire file:

### 4a — Replace imports

Remove:
```ts
import { useAgentChat } from '@/hooks/use-agent-chat';
import { ShowOptionsInput } from '@/hooks/use-agent-chat';
import { ToolResultRenderer } from './_components/ToolResultRenderer';
```

Add:
```ts
import { useVoiceToolState } from '@/hooks/use-voice-tool-state';
import { ToolCallBanner } from './_components/ToolCallBanner';
```

### 4b — Replace `useAgentChat` call in `ActiveSessionView`

Remove:
```ts
const { setCurrentTool, error, currentTool, addToolOutput } = useAgentChat();
```

Add:
```ts
const { currentTool } = useVoiceToolState();
```

### 4c — Remove the `showOptions` handler block

Remove these lines (they rely on the old AI SDK tool call mechanism):
```ts
const handleOptionSelect = async (label: string, option: string) => { ... };
const showOptionsData = currentTool?.toolName === 'showOptions' ? ... : null;
```

### 4d — Register `show_options` RPC alongside `show_approval`

Inside the existing `useEffect` that registers RPC methods, add:

```ts
room.registerRpcMethod('show_options', async (data) => {
  const payload = JSON.parse(data.payload);
  // surface as a pending options pick — reuse pendingApproval pattern or a new state
  // For now, log so we can verify the wire is live
  console.log('[RPC] show_options received:', payload);
  return JSON.stringify({ label: '', value: '' }); // placeholder until OptionsSelector is wired
});
return () => {
  room.unregisterRpcMethod('show_approval');
  room.unregisterRpcMethod('show_options');
};
```

### 4e — Replace `ToolResultRenderer` in JSX

Replace:
```tsx
<ToolResultRenderer currentTool={currentTool} />
```

With:
```tsx
<ToolCallBanner currentTool={currentTool} />
```

### 4f — Fix `agentName`

Replace:
```ts
const session = useSession(tokenSource, { agentName: 'Dakota-db7' });
```

With:
```ts
const session = useSession(tokenSource, {
  agentName: process.env.NEXT_PUBLIC_LIVEKIT_AGENT_NAME ?? 'mizan-agent',
});
```

### 4g — Remove the `error` useEffect (dead code)

Remove:
```ts
useEffect(() => {
  if (error) console.log(error);
}, [error]);
```

**Acceptance:** `bun run build` passes. Opening `/voice` in the browser shows no console errors about `useAgentChat`.

---

## Task 5 — `OptionsSelector` — wire `show_options` RPC properly

**File:** `frontend/src/app/voice/page.tsx`

Now that the RPC stub is in place (Task 4d), complete the wire-up so `OptionsSelector` becomes functional.

Add state for pending options:

```ts
const [pendingOptions, setPendingOptions] = useState<{
  title: string;
  options: Array<{ label: string; value: string }>;
  resolve: (result: { label: string; value: string }) => void;
} | null>(null);
```

Update the `show_options` RPC handler to:

```ts
room.registerRpcMethod('show_options', async (data) => {
  const payload = JSON.parse(data.payload);
  return new Promise<string>((resolve) => {
    setPendingOptions({
      title: payload.title,
      options: payload.options,
      resolve: (result) => resolve(JSON.stringify(result)),
    });
  });
});
```

Add the selection handler:

```ts
const handleOptionSelect = (label: string, value: string) => {
  pendingOptions?.resolve({ label, value });
  setPendingOptions(null);
};
```

Pass into `OptionsSelector`:

```tsx
<OptionsSelector
  data={pendingOptions ? { title: pendingOptions.title, options: pendingOptions.options } : null}
  onSelect={handleOptionSelect}
/>
```

**Acceptance:** Starting a voice session and asking the agent "what would you like to do?" causes the options buttons to appear on screen.

---

## Completion Checklist

After all tasks are done, update `progress/status.md`:

- [ ] Task 1 — frontend env updated
- [ ] Task 2 — `use-voice-tool-state.ts` created
- [ ] Task 3 — `ToolCallBanner.tsx` created
- [ ] Task 4 — `voice/page.tsx` rewired (all sub-steps a–g)
- [ ] Task 5 — `OptionsSelector` fully wired to `show_options` RPC
- [ ] `bun run build` passes with zero errors
- [ ] Manual smoke test: open `/voice`, tap Start, speak "show me my bills" → `ToolCallBanner` appears → disappears when agent responds

### Do NOT touch
- `approval-sheet.tsx` — already correct
- `agent-session-provider.tsx` — already correct
- `api/token/route.ts` — already correct (just needs the updated env vars from Task 1)
- `use-agent-chat.ts` — leave in place, it's still used by the chat page if it exists
