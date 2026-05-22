# Intl-Dossier — Codebase Map

Find where a feature lives _before_ reading files. Keep current when adding a domain or service.

## Top level

| Path        | What it is                                                                   |
| ----------- | ---------------------------------------------------------------------------- |
| `backend/`  | Express + TypeScript API. DDD-aligned layers under `src/`.                   |
| `frontend/` | React 19 + Vite + TanStack Router/Query. Desktop-primary, bilingual EN/AR.   |
| `supabase/` | Migrations, Edge Functions (Deno), seed data, RLS policies.                  |
| `shared/`   | Cross-workspace types (currently `shared/types/`).                           |
| `tests/`    | Cross-workspace integration + E2E. Per-workspace tests live beside the code. |
| `deploy/`   | Docker Compose for production (DigitalOcean droplet).                        |
| `docs/`     | Architecture decisions, runbooks, plans/specs (`docs/superpowers/`).         |
| `scripts/`  | One-off ops scripts.                                                         |

## backend/src/

| Path            | What it is                                                             |
| --------------- | ---------------------------------------------------------------------- |
| `api/`          | Express routers, feature-organized. The HTTP boundary.                 |
| `services/`     | Business-logic services (brief, commitment, clustering, auth, etc.).   |
| `models/`       | Data models / domain entities.                                         |
| `ai/`           | AI integration code (briefings, extraction, embeddings).               |
| `integrations/` | Third-party clients (AnythingLLM, email, etc.).                        |
| `middleware/`   | Express middleware: auth, rate-limit, security headers, error handler. |
| `queues/`       | Background-job queue producers.                                        |
| `jobs/`         | Background job handlers.                                               |
| `lib/`          | Shared backend helpers.                                                |
| `utils/`        | Logger (Winston), formatters, small utilities.                         |
| `types/`        | Backend-internal TypeScript types.                                     |
| `config/`       | Runtime configuration loading.                                         |
| `templates/`    | Email / document templates.                                            |
| `swagger/`      | OpenAPI / Swagger definitions.                                         |
| `index.ts`      | Server entry point.                                                    |

> `backend/src/ARCHITECTURE.md` documents the intended DDD layering (domain / ports / adapters). The current tree organizes that work under `api/` + `services/` + `models/` + `integrations/`.

## frontend/src/

| Path             | What it is                                                                  |
| ---------------- | --------------------------------------------------------------------------- |
| `routes/`        | TanStack Router file-based routes (`__root.tsx` → `_protected.tsx` → …).    |
| `domains/`       | Feature domains (dossiers, briefings, calendar, intake, etc.) — 20+ today.  |
| `components/`    | Shared components; `components/ui/` for token-bound primitives.             |
| `design-system/` | Runtime port of the IntelDossier prototype (DesignProvider, tokens, hooks). |
| `pages/`         | Page-level compositions referenced by routes.                               |
| `modules/`       | Cross-cutting feature modules.                                              |
| `contexts/`      | React contexts (auth, theme, language).                                     |
| `providers/`     | App-level providers (query client, design provider, i18n).                  |
| `hooks/`         | Shared hooks (`useAuth`, `useDossiers`, etc.).                              |
| `services/`      | Frontend service layer (API clients, business helpers).                     |
| `store/`         | Zustand stores for complex client state.                                    |
| `lib/`           | Utilities and helpers.                                                      |
| `i18n/`          | i18next config + translation namespaces.                                    |
| `auth/`          | Auth flows + guards.                                                        |
| `router/`        | Router setup beyond file routes.                                            |
| `styles/`        | Global stylesheets.                                                         |
| `assets/`        | Static assets imported by JS.                                               |
| `types/`         | Shared frontend TypeScript types.                                           |
| `utils/`         | Small utilities.                                                            |
| `__tests__/`     | Cross-cutting frontend tests.                                               |

Plus `frontend/public/` for static files including `bootstrap.js` (FOUC token paint — must byte-match `src/design-system/tokens/directions.ts`).

## supabase/

| Path          | What it is                                                            |
| ------------- | --------------------------------------------------------------------- |
| `migrations/` | SQL migrations (forward-only). 400+ files today — append, never edit. |
| `functions/`  | Deno-runtime Edge Functions, one directory per function + `_shared/`. |
| `seed/`       | Seed data for local + staging.                                        |

## Finding a feature

1. **UI surface?** → `frontend/src/routes/` to find the route file, then jump to the matching `frontend/src/domains/<name>/` or `frontend/src/components/`.
2. **API endpoint?** → `backend/src/api/` (organized by feature), with logic in `backend/src/services/<name>.service.ts`.
3. **Schema change?** → `supabase/migrations/` (newest at the bottom alphabetically). Apply via Supabase MCP.
4. **Edge Function?** → `supabase/functions/<name>/index.ts`.
5. **Design token / theme?** → `frontend/src/design-system/` (and the prototype at `frontend/design-system/inteldossier_handoff_design/`).
6. **Work-item terminology?** → `backend/CLAUDE.md` (single source of truth for terms, source types, tracking types, DB columns).

Keep this map honest: when you add a top-level directory or a new `backend/src/*/` or `frontend/src/*/` subtree, update the matching row here.
