# Frontend Implementation Progress - Mizan

## Foundation
- [x] API client generation (openapi-ts) ✅
- [x] Query Client setup ✅
- [x] AppProviders & Theme setup (Light mode default) ✅
- [x] Root layout & redirection ✅

## Hooks
- [x] `use-bills.ts` ✅
- [x] `use-budget.ts` ✅
- [x] `use-transactions.ts` ✅
- [x] `use-bank-accounts.ts` ✅
- [x] `use-transfers.ts` ✅
- [x] `use-agent-chat.ts` (Integrated with backend) ✅
- [x] `use-voice-tool-state.ts` (LiveKit data-channel tool state + cache invalidation) ✅

## Pages
- [x] `dashboard/page.tsx` (Overview, Balances, Recent TX, Budget, Bills) ✅
- [x] `bills/page.tsx` (List, Pay functionality) ✅
- [x] `budget/page.tsx` (Detailed categories, Progress) ✅
- [x] `transactions/page.tsx` (History, Search) ✅
- [x] `agent/page.tsx` (Voice/Chat interface) ✅
- [x] `budget/page.tsx` redesigned to match reference layout (summary card + monthly chart + categories + donut breakdown + activity) ✅
- [x] `chat/page.tsx` UX refresh: removed listening/speaking-state visuals, added empty-state prompt launcher, improved message timeline layout ✅
- [x] `budget/page.tsx` chart fix: corrected axis/grid overlap and progress indicator styling to reflect true usage ✅

## Components
- [x] `layout/PageShell.tsx` (Navigation, Header) ✅
- [x] `ui/` primitives (minimal Skeleton, Input, Dialog, Badge, etc.) ✅
- [x] `agent/_components/` (FinancialStrip, ToolCallBanner, OptionsSelector) ✅
- [x] `agents-ui/approval-sheet.tsx` ✅
- [x] `voice/_components/ToolCallBanner.tsx` wired to LiveKit `tool_start`/`tool_end` events ✅
- [x] `voice/page.tsx` registers `confirmPayment` + `confirmTransfer` RPC methods and resolves them through `ApprovalSheet` ✅

## Next Steps
- [x] Light-theme baseline applied (`THEME.md` updated + forced `.dark` removed from AppProviders) ✅
- [x] `dashboard/page.tsx` Base UI fix: set `nativeButton={false}` for `Button` components rendering `Link` ✅
- [x] Theme loosened with wider shell spacing (`PageShell` default/wide widths) ✅
- [x] Frontend build restored to green (`bun run build`) ✅
- [ ] Add "Add Transaction" modal to Dashboard/Transactions.
- [ ] Implement onboarding flow (Budget setup).
- [ ] Add detailed charts for budget trends.
- [ ] Polish Agent voice visualizers.
