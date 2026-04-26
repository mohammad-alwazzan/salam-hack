import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "http://localhost:3001/openapi/json",
	output: "src/gen/api",
	plugins: [
		{
			name: "@tanstack/react-query",
			queryOptions: true,
		},
	],
});
