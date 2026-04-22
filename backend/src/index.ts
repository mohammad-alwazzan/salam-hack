import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";

const app = new Elysia()
	.use(openapi())
	.get("/", () => "Hello Elysia")
	.post("/welcome", () => ({ message: "welcome" }))
	.listen(3001);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
