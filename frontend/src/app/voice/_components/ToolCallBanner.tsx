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
  if (tool.toolName === "pay_bill") {
    return `Bill #${String(i.bill_id)} from account #${String(i.bank_account_id)}`;
  }
  if (tool.toolName === "execute_transfer") {
    return `${String(i.amount)} to ${String(i.recipient)}`;
  }
  if (tool.toolName === "show_options") {
    return String(i.title ?? "");
  }
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
