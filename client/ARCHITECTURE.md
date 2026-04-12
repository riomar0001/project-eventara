# Next.js — Architecture

This project follows **Clean Architecture** (Robert C. Martin), organizing code into concentric dependency layers where inner layers have zero knowledge of outer ones. Dependencies always point **inward**.

> This is a **client-side only** Next.js application. There are no API route handlers — all data communication goes through external APIs via Axios and HeyAPI-generated clients.

---

## Layer Breakdown

### 1. Domain — `types/` + `interfaces/`

The innermost circle. Pure TypeScript — no framework imports, no I/O.

- **`types/`**: Global API request/response shapes, entity types, component prop types, ambient declarations
- **`interfaces/`**: Abstract contracts that outer layers must implement
- Has **no dependencies** on any other layer

---

### 2. Application — `store/` + `hooks/`

Orchestrates domain types to fulfill a single business goal.

- **`store/`**: Zustand global state — auth, UI, and theme slices
- **`store/slices/`**: Domain-scoped state slices
- **`hooks/`**: Custom React hooks for state access, data fetching, and UI utilities
- Depends only on the **Domain** layer

---

### 3. Interface Adapters — `api/` + `constants/`

Translates between the external API and the application layer. All HTTP communication is handled here via **Axios** and **HeyAPI**-generated clients.

- **`api/`**: API service calls per resource
- **`api/generated/`**: HeyAPI auto-generated API client — do not edit manually
- **`constants/`**: Routes, API URLs, config, and UI string constants
- Depends on the **Application** layer; never imports UI directly

---

### 4. Core — `lib/`

Cross-cutting concerns shared across all layers.

| Sub-package | Responsibility |
|---|---|
| `lib/` | Axios instance, HeyAPI client configuration, utilities |

---

### 5. Presentation — `app/` + `components/`

The outermost circle. All framework coupling lives here. Pages are client-rendered only.

- **`app/`**: Next.js App Router — route groups, layouts, pages
- **`components/ui/`**: Primitive design-system components
- **`components/layout/`**: Structural components (Navbar, Sidebar, Footer)
- **`components/features/`**: Feature-scoped components per domain

---

## Dependency Rule

> Source code dependencies must point **inward only**.

```
components  →  hooks / store  →  api       →  types
                                 lib           interfaces
                                 api/generated
```

Components never call `api/` directly — they go through hooks. All HTTP calls live inside `api/` using the Axios instance or the HeyAPI-generated client.

---

## Tech Stack

| Concern | Library |
|---------|---------|
| Framework | Next.js (App Router, client-side only) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State management | Zustand |
| HTTP client | Axios |
| API client generator | HeyAPI |
| Validation | Zod |
| Formatting | Prettier |

---

## Project Structure

```
├── api/
│   └── generated/
│
├── app/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── features/
│
├── constants/
│
├── hooks/
│
├── interfaces/
│
├── lib/
│
├── public/
│
├── store/
│   └── slices/
│
├── ARCHITECTURE.md
├── AGENTS.md
├── CLAUDE.md
├── next.config.ts
├── openapi-ts.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── .prettierrc.json
```

### File Naming Convention

| Layer | Pattern | Examples |
|-------|---------|----------|
| Domain types | `<resource>.types.ts` | `auth.types.ts`, `user.types.ts` |
| Interfaces | `<resource>.interface.ts` | `auth.interface.ts`, `user.interface.ts` |
| Hooks | `use<Resource>.ts` | `useAuth.ts`, `useDebounce.ts` |
| Store slices | `<resource>Slice.ts` | `authSlice.ts`, `uiSlice.ts` |
| API services | `<resource>.api.ts` | `auth.api.ts`, `user.api.ts` |
| Components | `<Resource>.tsx` | `LoginForm.tsx`, `StatsCard.tsx` |

---

## Key Design Principles

- **Dependency Inversion**: Hooks and store depend on service abstractions, not raw Axios calls.
- **Single Responsibility**: One slice per domain concern; one service file per resource.
- **Generated Clients**: HeyAPI generates type-safe API clients from the OpenAPI spec (`openapi-ts.config.ts`) — never edit `api/generated/` manually.
- **Testability**: Domain types and hooks are fully testable without a network — mock the service, not the Axios instance.
- **Replaceability**: Swap Axios for another HTTP client by updating `lib/` and `api/` only — zero changes to components or hooks.