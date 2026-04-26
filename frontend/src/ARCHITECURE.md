# Frontend Architecture

> **Stack:** Next.js · shadcn/ui · Tailwind CSS · @hey-api/openapi-ts · TanStack Query · TypeScript · Biome
> **Agent:** Frontend Stylist (Agent B) — Primary Domain: `frontend/`

---

## 1. Directory Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router root
│   │   ├── layout.tsx                # Root layout (providers, fonts, global styles)
│   │   ├── page.tsx                  # Landing / root page
│   │   ├── globals.css               # Tailwind base + CSS custom properties
│   │   └── (dashboard)/              # Route group – authenticated shell
│   │       ├── layout.tsx            # Dashboard shell (sidebar, topbar)
│   │       ├── overview/
│   │       │   ├── page.tsx
│   │       │   └── _components/
│   │       │       ├── StatsCard.tsx
│   │       │       └── ActivityFeed.tsx
│   │       └── settings/
│   │           ├── page.tsx
│   │           └── _components/
│   │               └── ProfileForm.tsx
│   │
│   ├── components/                   # Shared, reusable components (cross-page)
│   │   ├── ui/                       # shadcn/ui primitives (auto-generated, do not edit)
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Topbar.tsx
│   │       └── PageShell.tsx
│   │
│   ├── gen/
│   │   └── api/                      # Auto-generated — DO NOT EDIT
│   │       ├── @tanstack/
│   │       │   └── react-query.gen.ts  # Generated query/mutation options
│   │       └── types.gen.ts          # Generated request/response types
│   │
│   └── hooks/                        # Custom hooks wrapping generated query options
│       ├── use-bills.ts
│       ├── use-budget.ts
│       └── use-transactions.ts
│
└── openapi-ts.config.ts              # Codegen config (input: backend /openapi/json)
```

---

## 2. Component Placement Rules

| Component lives in… | When to use |
|---|---|
| `components/` | Used by **2 or more** pages / route groups. Purely presentational or shared business logic. |
| `app/[route]/_components/` | Used **only** by that specific `page.tsx`. Co-located, not exported outside the route. |

**Rule:** If a `_components/` component gets imported by a second page, promote it to `components/` immediately — never cross-import between `_components/` folders.

---

## 3. Data Layer — openapi-ts + TanStack Query

### 3.1 Codegen

The API client is fully generated from the backend's OpenAPI schema. Never write manual fetch calls.

```bash
# Run from frontend/
bun run generate
# Reads: http://localhost:3001/openapi/json
# Writes: src/gen/api/
```

Config lives in `frontend/openapi-ts.config.ts`:

```ts
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:3001/openapi/json",
  output: "src/gen/api",
  plugins: [{ name: "@tanstack/react-query", queryOptions: true }],
});
```

### 3.2 Usage Pattern — Custom Hooks

Wrap generated query options in a named hook. Never call generated options inline inside components.

```ts
// hooks/use-bills.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBillsOptions,
  postBillsMutation,
} from "@/gen/api/@tanstack/react-query.gen";

export function useBills() {
  const queryClient = useQueryClient();
  const query = useQuery(getBillsOptions());
  const create = useMutation({
    ...postBillsMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["getBills"] }),
  });
  return { ...query, create };
}
```

```tsx
// ❌ Forbidden — raw fetch
const res = await fetch("/api/bills");

// ❌ Forbidden — generated options used directly in a component without a hook
const { data } = useQuery(getBillsOptions());
```

---

## 4. Styling System

### 4.1 Design Tokens

| Token | Value | Usage |
|---|---|---|
| Grid unit | `8px` | All spacing must be multiples of 8 |
| Radius SM | `rounded-md` (6px) | Inputs, badges |
| Radius MD | `rounded-xl` (12px) | Cards, modals |
| Radius LG | `rounded-2xl` (16px) | Sheets, drawers |
| Focus ring | `ring-2 ring-primary/60` | All interactive elements |

### 4.2 Color — shadcn/ui Semantic Tokens Only

Use CSS variable-based semantic tokens. Never hardcode hex values in JSX.

```tsx
// ✅
<Button variant="default">Save</Button>
<Badge variant="secondary">Active</Badge>

// ❌
<button className="bg-[#7C3AED]">Save</button>
```

### 4.3 Theme Mode

All components are light-mode-first. Do not force `.dark` at app root. Use semantic tokens and optional `dark:` variants only as secondary support.

---

## 5. Page Anatomy

Every `page.tsx` follows this skeleton:

```tsx
// app/(dashboard)/overview/page.tsx
import { PageShell } from "@/components/layout/PageShell";
import { StatsCard } from "./_components/StatsCard";
import { ActivityFeed } from "./_components/ActivityFeed";

export default function OverviewPage() {
  return (
    <PageShell title="Overview" width="default">
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard />
      </section>
      <ActivityFeed />
    </PageShell>
  );
}
```

Pages are **server components by default**. Add `"use client"` only where interactivity or browser APIs are required. Push `"use client"` down to leaf components.

`PageShell` supports:
- `width="default"` → `max-w-[760px]`
- `width="wide"` → `max-w-[1120px]` for chart-heavy pages

---

## 6. Component Authoring Standards

### 6.1 Shared Component

```tsx
// components/ui/AppCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface AppCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AppCard({ title, children, className }: AppCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

### 6.2 Page-Specific Component with Data

```tsx
// app/(dashboard)/overview/_components/ActivityFeed.tsx
"use client";

import { useRecentActivity } from "@/hooks/use-recent-activity";

export function ActivityFeed() {
  const { data: activities, isLoading, isError } = useRecentActivity();

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;
  if (isError) return <p className="text-destructive text-sm">Could not load activity.</p>;
  if (!activities?.length) return <p className="text-muted-foreground text-sm">No activity yet.</p>;

  return (
    <ul className="space-y-2">
      {activities.map((item) => (
        <li key={item.id}>{item.description}</li>
      ))}
    </ul>
  );
}
```

---

## 7. State Management

| State type | Solution |
|---|---|
| Server / async | TanStack Query (via generated hooks) |
| Global UI (theme, sidebar open, modals) | React Context in `providers/` |
| Local / ephemeral | `useState` / `useReducer` inside component |
| URL state | `useSearchParams` + `useRouter` |

No Zustand, Redux, or Jotai unless explicitly approved.

---

## 8. Type Strategy

- **API types:** Always derived from `frontend/src/gen/api/types.gen.ts`. Never manually redefine backend shapes.
- **UI-only types:** Live in `types/ui.ts` (e.g., tab variants, dropdown options).
- **Props:** Defined inline via `interface` directly above the component.

```ts
// ✅ — derive from generated types
import type { PostBillsData } from "@/gen/api/types.gen";
type CreateBillBody = PostBillsData["body"];

// ❌ — manually duplicating a backend shape
interface CreateBillBody { name: string; amount: number; }
```

---

## 9. Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Components | PascalCase | `ActivityFeed`, `AppCard` |
| Hooks | `use-` + kebab noun | `use-bills`, `use-budget` |
| Files | kebab-case for hooks, PascalCase for components | `use-bills.ts`, `ActivityFeed.tsx` |
| Route groups | kebab-case in `()` | `(dashboard)`, `(auth)` |
| Page-specific dir | `_components` | `app/overview/_components/` |

---

## 10. API Sync Checklist

Before building any new page or component that consumes backend data:

- [ ] Confirm the backend endpoint is implemented (check `progress/backend-progress.md`)
- [ ] Backend is running (`cd backend && bun run dev`)
- [ ] Re-generate the client (`cd frontend && bun run generate`)
- [ ] Verify new types/options appear in `src/gen/api/`

If the endpoint is not ready, log a blocker in `progress/status.md` and build the UI shell with mock data typed to match the expected generated shape.

---

## 11. Progress Reporting

After completing every component or page, Agent B must update:

1. **`progress/frontend-progress.md`** — append a bullet with what was built and its status.
2. **`progress/status.md`** — update the Frontend health line and Current Goal.

```md
<!-- progress/frontend-progress.md example entry -->
- [x] `app/(dashboard)/overview/page.tsx` — scaffold + layout ✅
- [x] `hooks/use-bills.ts` — wraps generated getBillsOptions ✅
- [ ] `_components/StatsCard.tsx` — static shell, awaiting `/stats` endpoint ⏳
```
