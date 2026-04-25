# Frontend Architecture

> **Stack:** Next.js · HeroUI · Tailwind CSS · Eden Treaty · TypeScript · Biome
> **Agent:** Frontend Stylist (Agent B) — Primary Domain: `/` (repo root)

---

## 1. Directory Structure

```
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
│   ├── components/                   # ← Shared, reusable components (cross-page)
│   │   ├── ui/                       # Thin wrappers / compositions over HeroUI
│   │   │   ├── AppButton.tsx
│   │   │   ├── AppCard.tsx
│   │   │   ├── AppInput.tsx
│   │   │   └── AppModal.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── PageShell.tsx
│   │   └── feedback/
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   └── worker/                       # ← Elysia backend (Bun worker)
│       └── src/
│           ├── core/
│           ├── drizzle/
│           ├── features/
│           └── index.ts              # Exports `App` type for Eden Treaty
│
├── api.ts                            # Eden Treaty client singleton
│
├── providers/                        # Context / wrapper providers
│   ├── AppProviders.tsx              # Composes all providers (Query, HeroUI, Theme)
│   └── ThemeProvider.tsx
│
├── public/                           # Static assets
└── next.config.ts
```

---

## 2. Component Placement Rules

| Component lives in… | When to use |
|---|---|
| `components/` | Used by **2 or more** pages / route groups. Purely presentational or shared business logic. |
| `app/[route]/_components/` | Used **only** by that specific `page.tsx`. Co-located, not exported outside the route. |

**Rule:** If a `_components/` component gets imported by a second page, promote it to `components/` immediately — never cross-import between `_components/` folders.

---

## 3. Eden Treaty — The Only Data Layer

### 3.1 Client Singleton

```ts
// api.ts (root)
import { treaty } from "@elysiajs/eden";
import type { App } from "@worker/src/index";

export const api = treaty<App>(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
);
```

`api` is the **single** entry point for all backend communication. Raw `fetch`, `axios`, or any other HTTP primitive is **forbidden** in this codebase.

### 3.2 Usage Pattern — Named Query Functions

Every data operation must live in a **named function** that describes the intent. Anonymous inline calls are not allowed.

```ts
// ✅ Correct — meaningful name, lives in the component or a dedicated hook
async function fetchUserProfile(userId: string) {
  const { data, error } = await api.users({ id: userId }).get();
  if (error) throw error;
  return data;
}

async function submitNewProject(payload: CreateProjectPayload) {
  const { data, error } = await api.projects.post(payload);
  if (error) throw error;
  return data;
}

// ❌ Forbidden — raw fetch / anonymous handler
const res = await fetch("/api/users");
const handler = async () => { await api.users.get(); }; // no name, no meaning
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

### 4.2 Color — HeroUI Semantic Colors Only

Use HeroUI's semantic color names. Never hardcode hex values in JSX.

```tsx
// ✅
<Button color="primary">Save</Button>
<Chip color="success">Active</Chip>

// ❌
<button className="bg-[#7C3AED]">Save</button>
```

For anything beyond HeroUI's semantic tokens, define surfaces as a CSS-in-JS object and consume it through a typed token helper — no raw CSS files: 
```ts
export const surface = {
  1: "hsl(var(--heroui-background))",
  2: "hsl(var(--heroui-content1))",
  3: "hsl(var(--heroui-content2))",
} as const;
```

### 4.3 Dark Mode

All components are dark-mode-first. Test every new component in both themes. Use `dark:` variants and HeroUI's `darkMode` class strategy set in `tailwind.config.ts`.

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
    <PageShell title="Overview">
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard />
      </section>
      <ActivityFeed />
    </PageShell>
  );
}
```

Pages are **server components by default**. Add `"use client"` only where interactivity or browser APIs are required. Prefer pushing `"use client"` down to leaf components.

---

## 6. Component Authoring Standards

### 6.1 Anatomy of a Shared Component

```tsx
// components/ui/AppCard.tsx
"use client"; // only if needed

import { Card, CardBody, CardHeader } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface AppCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AppCard({ title, children, className }: AppCardProps) {
  return (
    <Card className={cn("bg-content1", className)}>
      <CardHeader className="text-sm font-semibold text-foreground-600">
        {title}
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}
```

### 6.2 Anatomy of a Page-Specific Component with Data

```tsx
// app/(dashboard)/overview/_components/ActivityFeed.tsx
"use client";

import { Spinner } from "@heroui/react";
import { useRecentActivity } from "@/hooks/useRecentActivity"; // hook owns Eden call
import { EmptyState } from "@/components/feedback/EmptyState";

export function ActivityFeed() {
  const { data: activities, isLoading, isError } = useRecentActivity();

  if (isLoading) return <Spinner />;
  if (isError) return <EmptyState message="Could not load activity." />;
  if (!activities?.length) return <EmptyState message="No activity yet." />;

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
| Server / async | Eden Query |
| Global UI (theme, sidebar open, modals) | React Context in `providers/` |
| Local / ephemeral | `useState` / `useReducer` inside component |
| URL state | `useSearchParams` + `useRouter` |

No Zustand, Redux, or Jotai unless explicitly approved. Keep state as close to where it's used as possible.

---

## 8. Providers Setup

```tsx
// providers/AppProviders.tsx
"use client";

import { HeroUIProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
```

`AppProviders` is mounted once in `app/layout.tsx`.

---

## 9. Type Strategy

- **API types:** Always derived from `App` via Eden Treaty. Never manually redefine what the backend already exports.
- **UI-only types:** Live in `types/ui.ts` (e.g., tab variants, dropdown options).
- **Props:** Defined inline via `interface` directly above the component. No barrel `types/props.ts`.

```ts
// ✅ — derive from backend worker
import type { InferRouteBody } from "@elysiajs/eden";
import type { App } from "@worker/src/index";

type CreateProjectBody = InferRouteBody<App, "/projects", "post">;

// ❌ — manually duplicating a backend shape
interface CreateProjectBody {
  name: string;
  description: string;
}
```

---

## 10. Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Components | PascalCase | `ActivityFeed`, `AppButton` |
| Hooks | `use` + PascalCase noun | `useUserProfile`, `useRecentActivity` |
| Eden query functions | verb + noun | `fetchUserProfile`, `submitNewProject`, `deleteTaskById` |
| Query keys | `[resource, sub?, id?]` | `["projects", "detail", id]` |
| Files | Match export name | `ActivityFeed.tsx` exports `ActivityFeed` |
| Route groups | kebab-case in `()` | `(dashboard)`, `(auth)` |
| Page-specific dir | `_components` | `app/overview/_components/` |

---
## 11. Eden Sync Checklist

Before building any new page or component that consumes backend data:

- [ ] Confirm backend has exported the latest `App` type from `src/worker/src/index.ts`
- [ ] Check `progress/backend-progress.md` to confirm the relevant endpoint is implemented

If the endpoint is not ready, log a blocker in `progress/status.md` and build the UI shell with mock data using the correct types.

---

## 12. Progress Reporting

After completing every component or page, Agent B must update:

1. **`progress/frontend-progress.md`** — append a bullet with what was built and its status.
2. **`progress/status.md`** — update the Frontend health line and Current Goal.

```md
<!-- progress/frontend-progress.md example entry -->
- [x] `app/(dashboard)/overview/page.tsx` — scaffold + layout ✅
- [x] `_components/StatsCard.tsx` — static shell, awaiting `/stats` endpoint ⏳
```