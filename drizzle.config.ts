import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./backend/src/drizzle/schema",
	out: "./backend/drizzle",
	dbCredentials: {
		url: "file:sqlite.db",
	},
});
