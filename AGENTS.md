# Repository Guidelines

## Project Structure & Module Organization
- `backend/` Express + TypeScript API (`src/api`, `src/services`, `src/middleware`, `src/config`).
- `frontend/` React 19 + Vite app (`src/components`, `src/pages`, `src/hooks`, `src/store`).
- `backend/migrations/` SQL migrations; `supabase/` local config + `seed.sql`.
- `e2e/` Playwright specs; `tests/` unit/integration (web + backend).
- `docs/` general docs; `specs/001-project-docs-gastat/` specs, contracts, data model.
- `docker/` monitoring configs; `scripts/` helper scripts.

## Build, Test, and Development Commands
- Dev (monorepo): `npm run dev` — runs frontend and backend via Turborepo.
- Build: `npm run build` • Typecheck: `npm run typecheck` • Lint: `npm run lint`.
- Tests: `npm run test` (Vitest + Playwright setup).
- DB: `npm run db:migrate` • `npm run db:seed` • `npm run db:rollback` • `npm run db:reset`.
- Docker: `npm run docker:up` • `npm run docker:down` • `npm run docker:logs`.
- Example: run a single e2e file → `npx playwright test e2e/tests/auth.spec.ts`.

## Coding Style & Naming Conventions
- TypeScript strict; 2‑space indentation; prefer explicit types.
- ESLint + Prettier enforce style; run before pushing.
- React components: PascalCase filenames (e.g., `MainLayout.tsx`); utilities/hooks: kebab-case; tests: `*.test.ts[x]`.
- SQL migrations: `YYYYMMDDHHMMSS_description.sql` (create via `cd backend && npm run migrate:create`).

## Testing Guidelines
- Frameworks: Vitest (unit/integration), Playwright (E2E), `axe-playwright` (a11y).
- Place unit tests near code or under `tests/`; keep small and focused.
- CI expects green unit + e2e for core flows (login, dashboard).
- Example: run a single Playwright test as above; keep fixtures minimal.

## Commit & Pull Request Guidelines
- Conventional Commits (e.g., `feat(api): add MoU endpoints`, `fix(ui): correct RTL spacing`).
- Keep PRs small (≤300 LOC preferred); include: clear description, linked issue(s), screenshots/GIFs for UI changes, test notes (commands run), and any schema impacts.

## Security & Configuration Tips
- Never commit secrets. Copy `.env.example` → `.env`.
- Backend requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `REDIS_URL`.
- Health checks: backend `GET /health`, API `GET /api/health`.
- Helmet, CORS, and rate limiting are enabled; respect them when adding routes.

## Architecture Overview
- Backend: Express, Supabase client, Redis cache, Winston logging.
- Frontend: React + TanStack Router/Query, RTL/LTR i18n.
- DB: PostgreSQL via migrations; seed data in `supabase/seed.sql`.

