# Mizan Agent

An AI voice assistant with real-time chat, built with LiveKit (voice sessions), Google Gemini (streaming AI), and a full-stack TypeScript monolith.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · HeroUI · Tailwind CSS v4 · Motion |
| Backend | Elysia (Bun worker) · Drizzle ORM · SQLite |
| AI | Vercel AI SDK · Google Gemini |
| Voice | LiveKit |
| Bridge | Eden Treaty (type-safe, zero-fetch RPC) |
| Formatting | Biome |

## Project Structure

```
/
├── src/
│   ├── app/              # Next.js App Router (pages, layouts, API routes)
│   ├── components/       # Shared UI components
│   ├── hooks/            # Custom React hooks
│   └── worker/           # Elysia backend (Bun worker)
│       └── src/
│           ├── core/     # DB client + seed
│           ├── drizzle/  # Schema definitions (source of truth)
│           └── features/ # Feature modules (router + service)
├── api.ts                # Eden Treaty client singleton
├── providers/            # React context providers
└── public/               # Static assets
```

## Getting Started

Install dependencies:

```bash
bun install
```

Start the frontend (Next.js):

```bash
bun dev
```

Start the backend worker:

```bash
cd src/worker && bun run dev
```

Seed the database:

```bash
bun run seed
```

## Environment Variables

Copy `.env.local` and fill in the required values:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
LIVEKIT_URL=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## API

The Elysia worker runs on `http://localhost:3000` and exposes:

- `GET  /api/health` — health check
- `POST /api/agent/chat` — stream a Gemini chat response
- `GET  /openapi` — interactive OpenAPI docs (Scalar)

## Architecture Docs

- [`src/ARCHITECURE.md`](./src/ARCHITECURE.md) — frontend structure, component rules, Eden usage
- [`src/worker/ARCHITECURE.md`](./src/worker/ARCHITECURE.md) — backend worker patterns
- [`AGENTS.md`](./AGENTS.md) — multi-agent collaboration rules
- [`progress/status.md`](./progress/status.md) — current project status
