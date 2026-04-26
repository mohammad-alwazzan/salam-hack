# Frontend Implementation Plan — Mizan

## Current State

The frontend is Next.js (App Router) + Tailwind v4 + motion + TanStack Query. Four pages exist with real logic but are broken because they import components and hooks that don't exist yet. The app **cannot build or run** without resolving all items below.

---

## Broken Import Map

Every missing file that currently causes a compile error:

| Import | Imported By | Type |
|--------|------------|------|
| `@/src/components/agents-ui/approval-sheet` | `agent/page.tsx` | Component |
| `./agent/_components/ToolResultRenderer` | `agent/page.tsx`, `chat/page.tsx` | Component |
| `./agent/_components/FinancialStrip` | `agent/page.tsx`, `chat/page.tsx` | Component |
| `@/src/components/ui/badge` | `bills/_components/BillItem.tsx` | UI primitive |
| `./_components/PayBillModal` | `bills/page.tsx` | Component |
| `./_components/AddBillModal` | `bills/page.tsx` | Component |
| `./_components/CategoryRow` | `budget/page.tsx` | Component |
| `./_components/SpendingChart` | `budget/page.tsx` | Component |
| `./_components/MonthlyHistoryChart` | `budget/page.tsx` | Component |
| `./_components/LogTransactionModal` | `budget/page.tsx` | Component |
| `@/src/hooks/use-budget` | `budget/page.tsx` | Hook |
| `@/src/hooks/use-transactions` | `budget/page.tsx` | Hook |

Plus two stub files with no content:
- `src/app/layout.tsx` — root layout (empty, **critical**)
- `src/app/dashboard/page.tsx` — landing page (empty)

---

## Phase 0 — Root Layout (`src/app/layout.tsx`)

**Status:** Empty file. Nothing renders without this.

**What it needs:**
- HTML shell: `<html lang="en">`, `<body>`
- Dark mode class on `<html>` (Tailwind v4)
- `QueryClientProvider` from TanStack Query wrapping all children
- Bottom tab navigation bar for mobile: links to `/dashboard`, `/chat`, `/agent`, `/bills`, `/budget`
- Font setup (Geist or system-ui via `next/font`)

**Bottom nav links:**

| Icon | Label | Path |
|------|-------|------|
| LayoutDashboard | Dashboard | `/dashboard` |
| MessageSquare | Chat | `/chat` |
| Mic | Voice | `/agent` |
| Receipt | Bills | `/bills` |
| PieChart | Budget | `/budget` |

---

## Phase 1 — UI Primitive

### 1.1 `src/components/ui/badge.tsx`
Imported by `BillItem.tsx`. Needed variants: `default`, `secondary`, `destructive`, `outline`.

Pattern — match existing `button.tsx` style using `@base-ui/react` with CVA. Props: `variant`, `className`, `children`.

```tsx
// variants map:
// default   → bg-primary text-primary-foreground
// secondary → bg-secondary text-secondary-foreground
// destructive → bg-destructive text-destructive-foreground
// outline  → border border-border text-foreground
```

---

## Phase 2 — Hooks

### 2.1 `src/hooks/use-budget.ts`
Consumed by `budget/page.tsx` as:
```ts
const { budget, isLoading, error } = useBudget();
```

`budget` shape (from `use-agent-chat.ts` types):
```ts
{
  month: string;
  totalIncome: number;
  currency: string;
  totalSpent: number;
  remaining: number;
  categories: Array<{
    id: number;
    name: string;
    type: 'fixed' | 'discretionary';
    allocated: number;
    priority: number;
    emoji: string;
    spent: number;
  }>;
}
```

Uses: `useQuery(getBudgetCurrentOptions())` from the generated `@tanstack/react-query.gen`.

### 2.2 `src/hooks/use-transactions.ts`
Consumed by `budget/page.tsx` as:
```ts
const { transactions, isLoading, logTransaction } = useTransactions();
```

- `transactions` — array of `Transaction` (from `use-agent-chat.ts` types)
- `logTransaction(data)` — calls `postTransactionsMutation`, invalidates `getTransactionsQueryKey` and `getBudgetCurrentQueryKey` on success
- Uses: `useQuery(getTransactionsOptions())` + `useMutation(postTransactionsMutation())`

---

## Phase 3 — Agent Components (`src/app/agent/_components/`)

### 3.1 `FinancialStrip.tsx`
Used in: `agent/page.tsx` (inside `ActiveSessionView`), `chat/page.tsx` (header area).

A slim horizontal strip showing real-time account balances. Fetches via `useQuery(getBankAccountsOptions())`.

**Layout:** scrollable horizontal row of pills, one per account.

Each pill shows:
```
[Bank name] · [balance] [currency]
```

- Loading state: 3 skeleton pills
- Empty state: hidden (render nothing)
- Error state: hidden (render nothing)

### 3.2 `ToolResultRenderer.tsx`
Used in: `chat/page.tsx` inside `MessageBubble` for `tool-invocation` parts.
Used in: `agent/page.tsx` (imported but not rendered in transcript — keep the import working).

Receives: `toolInvocation` (a tool-invocation part from the AI SDK message).

Renders a card based on `toolInvocation.toolName`:

| `toolName` | What to render |
|------------|---------------|
| `getFinancialSummary` | Compact account balance list + budget remaining |
| `logTransaction` | "Transaction logged" confirmation card with description + amount |
| `executeTransfer` | Transfer success/failure card with recipient + amount |
| `checkPurchaseImpact` | Impact card: remaining before/after, verdict badge (comfortable=green, tight=amber, over=red) |
| `getAlerts` | List of alert items with severity icons |
| `showOptions` | Nothing (handled by `OptionsSelector`) |
| `payBill` | "Bill paid" confirmation card |
| `toolName` not recognized | Nothing (`null`) |

Only render when `toolInvocation.state === 'result'` (don't show while still calling).

### 3.3 `src/components/agents-ui/approval-sheet.tsx`
Imported in `agent/page.tsx` as:
```tsx
import { ApprovalSheet, type ApprovalData } from '@/src/components/agents-ui/approval-sheet';
```

Used as:
```tsx
<ApprovalSheet
  approval={pendingApproval}   // ApprovalData | null
  onAccept={handleAccept}
  onCancel={handleCancel}
/>
```

`ApprovalData` type (inferred from usage — define it in this file):
```ts
export type ApprovalData = {
  type: 'transfer';
  recipient: string;
  amount: number;
  currency: string;
  fromAccount: string;
  note?: string;
}
```

**Behavior:** When `approval` is non-null, render a bottom sheet / modal overlay with:
- Title: "Confirm Transfer"
- Recipient, amount, account, note
- Two buttons: "Confirm" (calls `onAccept`) and "Cancel" (calls `onCancel`)
- Animate in with `motion` from bottom
- When `approval` is null, render nothing

---

## Phase 4 — Bills Components (`src/app/bills/_components/`)

### 4.1 `PayBillModal.tsx`
Triggered when user clicks "Pay Now" on a `BillItem`.

Props:
```ts
bill: Bill | null        // null = closed
onClose: () => void
onConfirm: (bankAccountId: number) => Promise<void>
```

**Behavior:**
- Fetches bank accounts via `useQuery(getBankAccountsOptions())` to populate a selector
- Shows: bill title, amount, currency, due date
- Select input to choose which bank account to pay from (show account name + balance)
- "Pay [amount] [currency]" confirm button — calls `onConfirm(bankAccountId)`, shows loading state
- Closes on success or cancel
- When `bill` is null, renders nothing

### 4.2 `AddBillModal.tsx`
Triggered by "Add New Bill" button on bills page.

Props:
```ts
isOpen: boolean
onClose: () => void
onConfirm: (bill: NewBill) => Promise<void>
```

`NewBill` from `PostBillsData['body']` (already imported in `bills/page.tsx`). Fields:
- `title` (text, required)
- `category` (text, required — show preset options: Electricity, Water, Internet, Rent, Other)
- `amount` (number, required)
- `currency` (text, default "SAR")
- `dueDate` (date picker or text input in YYYY-MM-DD)
- `description` (text, optional)

Submit calls `onConfirm(formData)`, shows loading, closes on success.

---

## Phase 5 — Budget Components (`src/app/budget/_components/`)

### 5.1 `CategoryRow.tsx`
Rendered inside the Categories card for each budget category.

Props:
```ts
category: {
  id: number;
  name: string;
  emoji: string;
  type: 'fixed' | 'discretionary';
  allocated: number;
  spent: number;
}
currency: string
```

**Layout (single row):**
```
[emoji] [name]                [spent] / [allocated] [currency]
        [type badge]          [progress bar — full width below]
```

Progress bar color:
- `>= 100%` spent → `bg-rose-500`
- `>= 80%` → `bg-amber-500`
- else → `bg-primary`

### 5.2 `SpendingChart.tsx`
A donut/pie breakdown of spending by category.

Props:
```ts
categories: Array<{ name: string; emoji: string; spent: number }>
currency: string
```

**Implementation:** Pure CSS + SVG donut — no chart library needed. Each segment is an SVG `<circle>` with `stroke-dasharray`. Show a legend below with emoji + name + amount. If all `spent` are 0, show an "No spending yet" empty state.

### 5.3 `MonthlyHistoryChart.tsx`
A simple bar chart showing last 6 months of spending vs budget.

Props: none — fetches its own data or uses mock data.

**Implementation:** Since the backend has no history endpoint yet, use **static mock data** for 6 months so the UI renders. Each bar: budget bar (primary color, full height) + spent bar (emerald if under, rose if over), overlaid. X-axis: month abbreviations (e.g. "Jan", "Feb"). This can be replaced later when the backend exposes history.

### 5.4 `LogTransactionModal.tsx`
Triggered by "Log" button in the Activity card.

Props:
```ts
isOpen: boolean
onClose: () => void
onConfirm: (data: LogTransactionData) => Promise<void>
categories: BudgetCategory[]
```

`LogTransactionData`:
```ts
{
  description: string;
  amount: number;       // positive = income, negative = expense
  categoryId?: number;
  bankAccountId: number;
  source: 'manual';
  date: string;         // YYYY-MM-DD
}
```

Fields:
- Description (text)
- Amount (number — show toggle "Expense / Income" to negate)
- Category (select from `categories` prop, optional)
- Bank Account (select from `getBankAccountsOptions()`)
- Date (defaults to today)

---

## Phase 6 — Dashboard Page (`src/app/dashboard/page.tsx`)

The landing page. Uses `PageShell`. Shows a summary of the user's financial position and quick-launch buttons.

**Sections:**
1. **Greeting card** — "Good morning" + month/year + big remaining balance number (from `useBudget()`)
2. **Quick actions row** — 4 icon buttons linking to: Chat (`/chat`), Voice (`/agent`), Bills (`/bills`), Budget (`/budget`)
3. **Bank accounts strip** — small cards per account from `useQuery(getBankAccountsOptions())`
4. **Alerts section** — fetches `getAlertsOptions()`, renders up to 3 alerts as colored banners (bill_due=amber, over_budget=rose, recurring_pattern=blue). Empty state: "All clear" green banner.
5. **Recent transactions** — last 5 from `useTransactions()`, same row style as `budget/page.tsx`

---

## Build Order (no circular deps)

1. `src/components/ui/badge.tsx`
2. `src/hooks/use-budget.ts`
3. `src/hooks/use-transactions.ts`
4. `src/components/agents-ui/approval-sheet.tsx`
5. `src/app/agent/_components/FinancialStrip.tsx`
6. `src/app/agent/_components/ToolResultRenderer.tsx`
7. `src/app/bills/_components/PayBillModal.tsx`
8. `src/app/bills/_components/AddBillModal.tsx`
9. `src/app/budget/_components/CategoryRow.tsx`
10. `src/app/budget/_components/SpendingChart.tsx`
11. `src/app/budget/_components/MonthlyHistoryChart.tsx`
12. `src/app/budget/_components/LogTransactionModal.tsx`
13. `src/app/dashboard/page.tsx`
14. `src/app/layout.tsx`

---

## Final File Tree (new files only)

```
frontend/src/
├── app/
│   ├── layout.tsx                              ← FILL (currently empty)
│   ├── dashboard/
│   │   └── page.tsx                            ← FILL (currently empty)
│   ├── agent/
│   │   └── _components/
│   │       ├── FinancialStrip.tsx              ← NEW
│   │       ├── ToolResultRenderer.tsx          ← NEW
│   │       └── OptionsSelector.tsx             ← exists ✓
│   ├── bills/
│   │   └── _components/
│   │       ├── BillItem.tsx                    ← exists ✓
│   │       ├── PayBillModal.tsx                ← NEW
│   │       └── AddBillModal.tsx                ← NEW
│   └── budget/
│       └── _components/
│           ├── CategoryRow.tsx                 ← NEW
│           ├── SpendingChart.tsx               ← NEW
│           ├── MonthlyHistoryChart.tsx         ← NEW
│           └── LogTransactionModal.tsx         ← NEW
├── components/
│   ├── agents-ui/
│   │   └── approval-sheet.tsx                 ← NEW
│   └── ui/
│       └── badge.tsx                          ← NEW
└── hooks/
    ├── use-budget.ts                           ← NEW
    └── use-transactions.ts                     ← NEW
```

---

## Notes

- All modals use `motion/react` for enter/exit animations — consistent with the rest of the app.
- No new dependencies needed — everything required is already in `package.json`.
- `MonthlyHistoryChart` uses mock data until the backend exposes a `/budget/history` endpoint.
- The generated API client at `src/gen/api/` is assumed up-to-date once the backend is seeded and `bun run generate` is run.
