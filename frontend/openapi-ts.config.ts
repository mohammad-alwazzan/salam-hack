import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:3001/openapi/json',
  output: {
    path: 'src/gen/api',
    postProcess: ['biome:format'],
  },
  plugins: ['@hey-api/typescript', '@hey-api/sdk', '@tanstack/react-query'],
});
