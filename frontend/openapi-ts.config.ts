import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@hey-api/openapi-ts";

loadEnvConfig(process.cwd());

const backendApiUrl = process.env.BACKEND_API;


export default defineConfig({
	input: `${backendApiUrl}/openapi/json`,
	output: "src/gen/api",
	plugins: [
		{
			name: "@tanstack/react-query",
			queryOptions: true,
		},
	],
});
