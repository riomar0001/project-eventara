import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: process.env.API_URL ?? 'http://127.0.0.1:8000/openapi.json',
  output: {
    path: './api',
    clean: false
  },
  plugins: [
    {
      name: '@hey-api/client-axios',
      baseUrl: '/api'
    },
    {
      name: '@hey-api/sdk',
      operations: 'byTags',
      validator: 'zod'
    }
  ]
});
