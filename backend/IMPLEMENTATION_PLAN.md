# Backend Re-Implementation Plan — Mizan

## Current State

- **Entry point** and **agent** feature exist (router, service, 5 tools).
- **2 schema files** exist (`bills`, `budgetCategories`) — both reference missing tables.
- **Missing everything else**: DB client, 4 schema files, 5 full features, tools index, 2 agent tools.

---

## Phase 0 — Foundation

### 0.1 Install missing packages
```
bun add drizzle-orm drizzle-zod @ai-sdk/groq @openrouter/ai-sdk-provider ai @elysiajs/openapi
bun add -d drizzle-kit
```

### 0.2 `src/core/db.ts` — Drizzle SQLite client singleton
```ts
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
export const db = drizzle(new Database('sqlite.db'));
```

---

## Phase 1 — Database Schema (`src/drizzle/schema/`)

All schemas follow the pattern in `ARCHITECURE.md`: table → `createInsertSchema` / `createSelectSchema` → export types.

| File | Table | Key Columns |
|------|-------|-------------|
| `bankAccounts.ts` | `bank_accounts` | `id`, `name`, `bank`, `balance`, `currency`, `type` (`checking`\|`savings`\|`remittance`) |
| `budgetMonths.ts` | `budget_months` | `id`, `month` (YYYY-MM), `totalIncome`, `createdAt` |
| `budgetCategories.ts` | already exists | references `budgetMonths.id` |
| `transactions.ts` | `transactions` | `id`, `description`, `amount`, `bankAccountId`, `categoryId`, `source` (`voice`\|`text`\|`manual`), `date`, `createdAt` |
| `bills.ts` | already exists | references `bank_accounts.id` |
| `transfers.ts` | `transfers` | `id`, `fromBankAccountId`, `amount`, `recipient`, `note`, `executedAt` |
| `index.ts` | re-export all | single import point for agent service & features |

---

## Phase 2 — Features (each = repository + service + router)

### 2.1 `features/bankAccounts/`
- **Repository**: `getAll()`, `getById(id)`, `create(data)`, `updateBalance(id, delta)`
- **Service**: `getAllAccounts()`, `getById(id)`, `create(data)`, `deduct(id, amount)` — throws if insufficient balance
- **Router**: `GET /bank-accounts`, `GET /bank-accounts/:id`, `POST /bank-accounts`

### 2.2 `features/bills/`
- **Repository**: `getAll()`, `getById(id)`, `create(data)`, `markPaid(id, bankAccountId)`
- **Service**: `getAllBills()`, `createBill(data)`, `payBill(id, bankAccountId)` — calls `bankAccountService.deduct()`, sets `status = "paid"`, `paidAt = now`
- **Router**: `GET /bills`, `GET /bills/:id`, `POST /bills`, `POST /bills/:id/pay`

### 2.3 `features/budget/`
- **Repository**: `getCurrentMonth()`, `upsertMonth(month, income)`, `getCategories(budgetMonthId)`, `upsertCategory(data)`, `getSpentByCategory(budgetMonthId)` — joins transactions
- **Service**:
  - `getCurrentBudget()` → `{ month, totalIncome, categories: [{ ...cat, spent, remaining }] }`
  - `getPurchaseImpact(amount)` → `{ remainingBefore, remainingAfter, percentOfBudgetUsedAfter, verdict, mostImpactedCategory }`
  - `upsertBudget(month, income, categories[])` — used by onboarding
- **Router**: `GET /budget`, `POST /budget`, `GET /budget/impact?amount=X`

### 2.4 `features/transactions/`
- **Repository**: `getAll(filters?)`, `create(data)`, `getRecurringPatterns()` — groups by description, finds repeating amounts
- **Service**: `createTransaction(data)`, `getAllTransactions(filters?)`, `detectPatterns()`
- **Router**: `GET /transactions`, `POST /transactions`

### 2.5 `features/transfers/`
- **Repository**: `create(data)`, `getAll()`
- **Service**: `execute({ fromBankAccountId, amount, recipient, note })` — calls `bankAccountService.deduct()`, logs via `transactionsService.createTransaction()`, saves transfer record; returns `{ success, account, transaction }`
- **Router**: `GET /transfers`, `POST /transfers`

### 2.6 `features/alerts/`
- **No router** — purely internal service consumed by agent tools
- **Service**: `getAlerts()` → array of alerts typed as `"bill_due" | "over_budget" | "recurring_pattern"`
  - `bill_due`: bills where `dueDate` is within 7 days and `status = "pending"`
  - `over_budget`: categories where `spent / allocated >= 0.9`
  - `recurring_pattern`: from `transactionsService.detectPatterns()`

---

## Phase 3 — Agent Tools

### 3.1 Missing tools to create
- `tools/show-options.ts` — `showOptions`: returns structured choices for the frontend to render as quick-reply buttons. Input: `{ prompt, options: string[] }`. No DB calls; pure UI hint.
- `tools/pay-bill.ts` — `payBill`: calls `billsService.payBill(billId, bankAccountId)`. Input: `{ billId, bankAccountId }`.

### 3.2 `tools/index.ts` — barrel export of all 7 tools

---

## Phase 4 — Wiring

- `drizzle.config.ts` — point to `./src/drizzle/schema/index.ts`, output to `./drizzle`
- `src/index.ts` — already correct, all 5 routers registered
- **Seed script** `src/seed.ts` — inserts Ahmed's demo data: 2 bank accounts (checking + remittance), 1 budget month with 5 categories (Remittances=fixed, Rent=fixed, Food=discretionary, Transport=discretionary, Wedding Fund=fixed), 3 bills, 5 past transactions

---

## Final File Tree

```
backend/src/
├── core/
│   └── db.ts
├── drizzle/
│   └── schema/
│       ├── bankAccounts.ts       ← NEW
│       ├── budgetMonths.ts       ← NEW
│       ├── budgetCategories.ts   ← exists
│       ├── bills.ts              ← exists
│       ├── transactions.ts       ← NEW
│       ├── transfers.ts          ← NEW
│       └── index.ts              ← NEW
├── features/
│   ├── agent/
│   │   ├── SYSTEM_PROMPT.md      ← exists
│   │   ├── agent.router.ts       ← exists
│   │   ├── agent.service.ts      ← exists
│   │   └── tools/
│   │       ├── index.ts          ← NEW
│   │       ├── check-purchase-impact.ts  ← exists
│   │       ├── execute-transfer.ts       ← exists
│   │       ├── get-alerts.ts             ← exists
│   │       ├── get-financial-summary.ts  ← exists
│   │       ├── log-transaction.ts        ← exists
│   │       ├── show-options.ts           ← NEW
│   │       └── pay-bill.ts               ← NEW
│   ├── bankAccounts/
│   │   ├── bankAccounts.repository.ts   ← NEW
│   │   ├── bankAccounts.service.ts      ← NEW
│   │   └── bankAccounts.router.ts       ← NEW
│   ├── bills/
│   │   ├── bills.repository.ts          ← NEW
│   │   ├── bills.service.ts             ← NEW
│   │   └── bills.router.ts              ← NEW
│   ├── budget/
│   │   ├── budget.repository.ts         ← NEW
│   │   ├── budget.service.ts            ← NEW
│   │   └── budget.router.ts             ← NEW
│   ├── transactions/
│   │   ├── transactions.repository.ts   ← NEW
│   │   ├── transactions.service.ts      ← NEW
│   │   └── transactions.router.ts       ← NEW
│   ├── transfers/
│   │   ├── transfers.repository.ts      ← NEW
│   │   ├── transfers.service.ts         ← NEW
│   │   └── transfers.router.ts          ← NEW
│   └── alerts/
│       └── alerts.service.ts            ← NEW (no router)
├── seed.ts                              ← NEW
└── index.ts                             ← exists
```

---

## Dependency Order (build in this sequence to avoid circular imports)

1. `core/db.ts`
2. `drizzle/schema/*` (bankAccounts → budgetMonths → budgetCategories → transactions → bills → transfers → index)
3. `bankAccounts` feature (no deps on other features)
4. `transactions` feature (depends on bankAccounts schema)
5. `transfers` feature (depends on bankAccounts + transactions services)
6. `budget` feature (depends on transactions repo for spent amounts)
7. `bills` feature (depends on bankAccounts service)
8. `alerts` service (depends on bills + budget + transactions services)
9. Agent tools (depend on all above services)
10. `agent.service.ts` (already imports all services — compiles once they exist)
11. `seed.ts`
