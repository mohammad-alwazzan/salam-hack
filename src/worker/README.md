# Backend Worker (Elysia + Bun)

This is the Elysia backend, running as a Bun worker inside the Next.js project at `src/worker/`.

## Structure

```
src/worker/
├── src/
│   ├── core/
│   │   ├── db.ts          # Drizzle client (SQLite)
│   │   └── seed.ts        # DB seed script
│   ├── drizzle/
│   │   └── schema/        # Drizzle table definitions (source of truth)
│   ├── features/          # Feature modules (router + service per feature)
│   └── index.ts           # App entry — exports `App` type for Eden Treaty
├── drizzle/               # Drizzle migration files
└── utils/
```

## Development

Run the worker from the repo root:

```bash
cd src/worker && bun run dev
```

## OpenAPI Docs

Available at `http://localhost:3001/openapi` when the worker is running.

## Eden Treaty Integration

The `App` type exported from `src/index.ts` is consumed by the frontend via the `@worker/src/index` path alias defined in the root `tsconfig.json`.
