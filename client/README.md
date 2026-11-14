# Eventara Admin Dashboard

Next.js 16 app for organisers and administrators: events and sessions, QR
check-in, venues, volunteers, users and roles, feedback, analytics, audit logs
and the background-job queue. Layering is described in
[ARCHITECTURE.md](ARCHITECTURE.md).

## Development

```bash
npm ci
npm run dev -- -p 3000          # http://localhost:3000
```

Requests to `/api/*` are proxied to the API through the rewrite in
`next.config.ts`. Set `API_URL` to point elsewhere (default
`http://127.0.0.1:8000`). `NEXT_PUBLIC_STORAGE_PUBLIC_URL` allows uploaded
images to load through `next/image`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` / `npm run format:check` | Prettier (CI runs the check) |
| `npm run type-check` | TypeScript |
| `npm run openapi-ts` | Regenerate the API client in `api/` from `${API_URL}/openapi.json` |

## Deployment

Hosted on AWS Amplify (SSR) and defined in `infra/terraform/amplify.tf`.
Amplify builds this folder on every push to the configured branch, with
`API_URL` pointing at the HTTP API.
