import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import db from "./core/db";
import { agentRouter } from "./features/agent/agent.router";
import { cards } from "./drizzle/schema/cards";

export const app = new Elysia({ prefix: "/api" })
  .use(openapi())
  .get("/", () => "Hello Elysia")
  .get("/cards", async () => ({ cards: await db.select().from(cards) }))
  .get("/health", () => ({ status: "ok" }))
  .use(agentRouter);

export type App = typeof app;
