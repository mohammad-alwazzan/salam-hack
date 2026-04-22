## 🌌 Project Overview
- **Stack:** Elysia (Bun) + SQLite + Next.js + HeroUI.
- **Architecture:** Monorepo with shared `node_modules` at root.
- **Bridge:** Type-safe Eden Treaty (Frontend imports types from `@/backend/src/index.ts`).
- **Formatting:** Biome (Format on Save enabled).

---

## 🛠️ Role Definitions

### 1. Backend Architect (Agent A)
- **Primary Domain:** `/backend`
- **Core Skill:** `elysia-master` (Elysia, Bun, SQLite, TypeBox).
- **Deliverables:**
    - Type-safe API endpoints with validation.
    - Automatic OpenAPI docs (Scalar) at `/openapi`.
    - **Exported Type:** `export type App = typeof app` in the entry file.
- **Reporting:** Update `progress/backend-progress.md` and `progress/status.md` after every feature completion.

### 2. Frontend Stylist (Agent B)
- **Primary Domain:** `/frontend`
- **Core Skill:** `heroui-wizard` + `design-skill` (Next.js, Tailwind, HeroUI).
- **Data Fetching:** **Strictly** use `@elysiajs/eden` treaty. Manual `fetch` calls are forbidden.
- **Aesthetic:** High-fidelity UI using HeroUI semantic colors, 8px grid, and dark-mode optimization.
- **Reporting:** Update `progress/frontend-progress.md` and `progress/status.md` after every component/page completion.

---

## 📜 The Three-File Recovery Protocol

To ensure seamless transitions between **Antigravity**, **Claude Code**, and **Copilot**, all agents must maintain:

1. **`progress/status.md` (High-Level):** Current system health, active blockers, and the single "Current Goal." Max 30 lines.
2. **`progress/backend-progress.md` / `progress/frontend-progress.md` (Task Logs):** Bulleted list of completed sub-tasks for recovery.
3. **`backend/ARCHITECTURE.md` (Contract):** Documentation of how the backend code should be organized, schemas, and endpoint contracts.
4. **`frontend/ARCHITECTURE.md` (Contract):** Documentation of UI designs, component structures, state management and how the frontend code should be organized.

---

## 🚀 Operational Rules

* **Command Execution:** Always use `bun`. Use `cd [folder] && bun [command]` to ensure correct scope.
* **Parallel Safety:** Do not modify files outside your Primary Domain. If a cross-domain change is needed (e.g., a backend type change), log it in `status.md` as a blocker for the other agent.
* **Formatting:** Biome is the source of truth. If conflicts arise with IDE-specific linters, prioritize `biome.json`.
* **Eden Sync:** Before building a frontend view, Agent B must verify that the Backend Agent has exported the latest `App` type.

---

## 🔧 Recovery Instruction for New Sessions
> *"If the session restarts or tools switch (e.g., moving to Claude Code): Read `progress/status.md` first, then the respective `progress/progress.md`. Resume from the 'Last Known Good State' and check `architecture.md` for code organization."*

---

### 📅 Initial Status Template (Copy to status.md)
```markdown
# Project Status
**Current Goal:** Initializing Workspace

## 🏗️ System Health
- **Backend:** ⚪ NOT STARTED
- **Frontend:** ⚪ NOT STARTED
- **Eden Bridge:** ⚪ DISCONNECTED

## 📍 Last Known Good State
- Project structure created.

## 🚧 Blockers / Next Steps
1. Backend Agent: Setup Elysia + OpenAPI + SQLite Schema.
2. Frontend Agent: Setup Next.js + HeroUI + Eden Client initialization.
```

---

<!-- BEGIN:nextjs-agent-rules -->
## NextJS Rules
**This is NOT the Next.js you know**, This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `frontend/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
