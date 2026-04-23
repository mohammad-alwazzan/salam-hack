import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import db from "./core/db";
import { cards } from "./drizzle/schema/cards";

const app = new Elysia()
	.use(openapi())
	.get("/", () => "Hello Elysia")
	.post("/welcome", () => ({ message: "welcome" }))
	.get("/health", () => ({ status: "ok" }))
	.get("/cards", async () => {
		return { cards: await db.select().from(cards).execute() };
	})
	.listen(3001);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
