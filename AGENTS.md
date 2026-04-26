## 🌌 Project Overview
- **Stack:** Elysia (Bun) + SQLite (Drizzle) + Next.js + shadcn/ui.
- **Architecture:** Monorepo — Next.js frontend lives at `frontend/`; Elysia backend lives at `backend/`.
- **Bridge:** OpenAPI codegen via `@hey-api/openapi-ts`. Frontend generates typed clients from `backend`'s `/openapi/json` endpoint into `frontend/src/gen/api/`. Data fetching uses TanStack Query with generated query options.
- **Formatting:** Biome (Format on Save enabled).

---

## 🛠️ Role Definitions

### 1. Backend Architect (Agent A)
- **Primary Domain:** `backend/`
- **Core Skill:** `elysiajs` (Elysia, Bun, SQLite, Drizzle).
- **Deliverables:**
    - Type-safe API endpoints with validation.
    - Automatic OpenAPI docs (Scalar) at `/openapi`, JSON schema at `/openapi/json`.
    - Schema source of truth: `backend/src/drizzle/schema/`.
- **Reporting:** Update `progress/backend-progress.md` and `progress/status.md` after every feature completion.

### 2. Frontend Stylist (Agent B)
- **Primary Domain:** `frontend/`
- **Core Skill:** `ui-ux-pro-max` (Next.js, Tailwind, shadcn/ui).
- **Data Fetching:** Use TanStack Query with generated hooks from `frontend/src/gen/api/`. Re-generate via `cd frontend && bun run generate` after backend changes. Manual `fetch` calls are forbidden.
- **Aesthetic:** High-fidelity UI using shadcn/ui components, 8px grid, and dark-mode optimization.
- **Reporting:** Update `progress/frontend-progress.md` and `progress/status.md` after every component/page completion.

---

## 📜 The Three-File Recovery Protocol

To ensure seamless transitions between agents and tools, all agents must maintain:

1. **`progress/status.md` (High-Level):** Current system health, active blockers, and the single "Current Goal." Max 30 lines.
2. **`progress/backend-progress.md` / `progress/frontend-progress.md` (Task Logs):** Bulleted list of completed sub-tasks for recovery.
3. **`backend/ARCHITECTURE.md` (Contract):** How the backend is organized — schemas, features, endpoint contracts.
4. **`frontend/src/ARCHITECURE.md` (Contract):** UI designs, component structures, state management, and frontend code organization.

---

## 🚀 Operational Rules

* **Command Execution:** Always use `bun`. Run backend commands from `backend/` (`cd backend && bun [command]`). Run frontend commands from `frontend/` (`cd frontend && bun [command]`).
* **Parallel Safety:** Do not modify files outside your Primary Domain. If a cross-domain change is needed (e.g., a new backend endpoint), log it in `status.md` as a blocker for the other agent.
* **Formatting:** Biome is the source of truth. If conflicts arise with IDE-specific linters, prioritize `biome.json`.
* **API Sync:** Before building a frontend view that needs backend data, confirm the endpoint exists and regenerate the client: `cd frontend && bun run generate`. Check `progress/backend-progress.md` to verify the endpoint is implemented.

---

## 🔧 Recovery Instruction for New Sessions
> *"If the session restarts or tools switch: Read `progress/status.md` first, then the respective `progress/progress.md`. Resume from the 'Last Known Good State' and check `backend/ARCHITECTURE.md` or `frontend/src/ARCHITECURE.md` for code organization."*

---

### 📅 Initial Status Template (Copy to status.md)
```markdown
# Project Status
**Current Goal:** Initializing Workspace

## 🏗️ System Health
- **Backend:** ⚪ NOT STARTED
- **Frontend:** ⚪ NOT STARTED
- **API Client:** ⚪ NOT GENERATED

## 📍 Last Known Good State
- Project structure created.

## 🚧 Blockers / Next Steps
1. Backend Agent: Setup Elysia + OpenAPI + SQLite Schema.
2. Frontend Agent: Setup Next.js + shadcn/ui + run codegen after backend is up.
```

---

<!-- BEGIN:nextjs-agent-rules -->
## NextJS Rules
**This is NOT the Next.js you know**, This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
