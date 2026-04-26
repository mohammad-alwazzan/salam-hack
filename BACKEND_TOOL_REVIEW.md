# Mizan — Backend Tool Review & Logic Audit

This document outlines discrepancies between the intended behavior (as described in the project documentation) and the actual implementation of the backend agent tools.

---

## 1. Tool-to-Prompt Discrepancies

### `logTransaction` — Mandatory `bankAccountId`
- **Intended:** `SYSTEM_PROMPT.md` states that `bankAccountId` is optional and only used if the user specifies an account.
- **Actual:** The `logTransaction` tool schema (`log-transaction.ts`) and `transactionsService.createTransaction` both treat `bankAccountId` as a **mandatory number**.
- **Impact:** The agent will fail to log simple transactions like "I spent 50 riyals" unless it hallucinates an account ID or forces the user to clarify which account was used.

### Missing Tool Documentation
- **Issue:** The tools `payBill` and `showOptions` are fully implemented and available to the agent, but they are **not documented** in the tool summary section of `SYSTEM_PROMPT.md`.
- **Impact:** The LLM may not consistently understand the correct trigger conditions or parameter requirements for these tools.

### Redundancy in `getFinancialSummary`
- **Issue:** `AgentService.streamChat` injects the full financial summary (accounts, budget, alerts) directly into the `contextualPrompt` for every request.
- **Actual:** A separate `getFinancialSummary` tool exists for the agent to call.
- **Impact:** Calling the tool is redundant and wastes tokens, as the agent already has the data in its system context.

---

## 2. Logic & Robustness Issues

### ID Mapping Burden
- **Issue:** Tools like `payBill`, `executeTransfer`, and `logTransaction` require internal database IDs (integers).
- **Actual:** The LLM must look at the JSON summary in its prompt, find the name the user mentioned (e.g., "Al Rajhi"), and map it to an ID (e.g., `1`).
- **Impact:** This is a common point of failure for LLMs. If two accounts have similar names or if the agent loses track of the ID in a long conversation, it will pass incorrect data to the service.

### Simplistic `getPurchaseImpact` Logic
- **Issue:** `budget.service.ts` calculates purchase impact by defaulting to the first "discretionary" category it finds.
- **Actual:** It does not allow the agent to specify which category the purchase belongs to.
- **Impact:** If a user asks "Can I afford a new phone?", the system might check against the "Dining" category instead of "Electronics" or "Savings," providing an inaccurate impact assessment.

---

## 3. Recommended Fixes

| Priority | Action | Description |
|---|---|---|
| **High** | **Update `logTransaction` Schema** | Make `bankAccountId` optional in Zod; default to a primary account in the service logic. |
| **High** | **Sync `SYSTEM_PROMPT.md`** | Add `payBill` and `showOptions` to the tool descriptions in the system prompt. |
| **Medium** | **Name-based Lookup** | Update tools to accept names (e.g., `accountName`, `billTitle`) and perform a lookup in the service layer instead of requiring IDs. |
| **Medium** | **Refine `checkPurchaseImpact`** | Add an optional `categoryName` parameter to the tool so the LLM can target the correct budget line. |
| **Low** | **Deprecate `getFinancialSummary`** | Since data is provided in the prompt, this tool can be removed or simplified to only "refresh" data. |

---

## 4. Environment Observations
- **Missing Alerts Router:** While logic for `getAlerts` exists, there is no corresponding router in `backend/src/index.ts`, which may cause issues if the frontend or agent expects a dedicated REST endpoint for alerts.
