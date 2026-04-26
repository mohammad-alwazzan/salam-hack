import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/drizzle/schema/index.ts",
	out: "./drizzle",
	dbCredentials: {
		url: "sqlite.db",
	},
});
