# Eventara Participant Site

Public Next.js 16 site for attendees: browse and register for events, show
check-in QR codes, leave feedback, explore and contribute venues, apply as a
volunteer, and manage a profile.

## Development

```bash
npm ci
npm run dev -- -p 3001          # http://localhost:3001
```

Requests to `/api/*` are proxied to the API through the rewrite in
`next.config.mjs`. Set `API_URL` to point elsewhere (default
`http://127.0.0.1:8000`). The API's `CORS_ORIGIN` should be this site's URL,
because verification, password-reset and reminder emails link here.

UI components use shadcn/ui (`npx shadcn@latest add <component>`) and Tailwind.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier |
| `npx tsc --noEmit` | TypeScript |
| `npm run openapi-ts` | Regenerate the API client in `api/` from `${API_URL}/openapi.json` |

## Deployment

Hosted on AWS Amplify (SSR) and defined in `infra/terraform/amplify.tf`.
