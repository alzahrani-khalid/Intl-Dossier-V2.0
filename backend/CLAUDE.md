# Backend guidance (Express API)

Directory-specific notes for `backend/`. The root `/CLAUDE.md` is the source of
truth for project-wide conventions (tech stack, work-item terminology,
dossier-centric patterns, code style, deployment). This file covers only what is
specific to the backend service. Read the root file first.

## What this service is

An Express + TypeScript API (entry `src/index.ts`, default port 5001). It is one
of several backends in the system — the Supabase Edge Functions under
`supabase/functions/` serve a large share of the app's data path directly from
the frontend. This Express service owns auth, the REST routers under `src/api/`,
Redis-backed caching, BullMQ queues/schedulers, and the intelligence workers.

## Actual source layout (read this, not ARCHITECTURE.md)

`src/ARCHITECTURE.md` describes a hexagonal `core/ports`, `core/domain`,
`adapters/repositories`, `container/` layout. **That layout does not exist on
disk** — it is aspirational. The real structure is:

```
src/
├── index.ts          # app bootstrap: security mw → /api router → error handlers → startServer()
├── api/              # Express routers, one file per feature (countries.ts, tasks.ts, …)
│   ├── index.ts      # mounts all routers; applies authenticateToken globally
│   ├── ai/           # AI routers (briefs.ts) mounted under /api/ai
│   └── contract/     # in-memory mock routers for contract tests — NODE_ENV-guarded
├── services/         # business logic as classes/functions; call supabaseAdmin directly
├── adapters/intelligence/   # the ONLY real adapters: notification channel adapters
├── ai/               # on-prem LLM agents (brief-generator, etc.)
├── jobs/             # node-cron scheduled jobs (gated by ENABLE_SCHEDULED_JOBS)
├── queues/           # BullMQ workers + schedulers (notifications, digests, intel alerts)
├── middleware/       # auth.ts, security.ts, rate-limit.middleware.ts, rbac.ts, validation.ts
├── config/           # supabase.ts, redis.ts, cache-ttl.config.ts
├── lib/              # sentry.ts and other cross-cutting libs
├── types/            # *.types.ts and express.d.ts (req.user augmentation)
└── utils/            # logger.ts (Winston), validation.ts (Zod helpers + error classes)
```

The data flow is: **router (`api/*.ts`) → service (`services/*.ts`) →
`supabaseAdmin`**. There is no repository/port indirection in practice.

## Router organization and registration

- One router file per feature under `src/api/`, default-exporting an Express `Router`.
- `src/api/index.ts` is the composition root. Order matters:
  1. `apiLimiter` rate limit + request-logging middleware
  2. public routes first: `/auth`, then `/ai` and `/push-subscriptions` (these
     mount **before** the global auth gate because they do their own auth or
     expose a public sub-route)
  3. `apiRouter.use(authenticateToken)` — everything mounted after this is protected
  4. protected feature routers (`/countries`, `/tasks`, `/positions`, …)
  5. the API 404 handler and the API error handler (last)
- `src/index.ts` mounts `apiRouter` at `/api`, plus the `contract/*` mock routers
  at top-level paths **only when `NODE_ENV !== 'production'`**. Those mocks
  authorize on a hard-coded `test-auth-token`; never let them load in prod (they
  would expose a fixed-token admin surface). Keep that guard intact.

To add a route, see the recipe at the bottom.

## Auth: `authenticateToken` is the global gate

`src/middleware/auth.ts` exports `authenticateToken` (aliased `supabaseAuth` via
`middleware/supabase-auth.ts`). It is mounted once in `api/index.ts` and:

1. extracts the Bearer token,
2. validates it with **`supabaseAdmin.auth.getUser(token)`** (Supabase Auth first),
3. falls back to a legacy custom-JWT verify (`JWT_SECRET`) if Supabase rejects it,
4. calls `fetchUserContext(userId)` to populate `req.user`.

`req.user` is `{ id, email, role, organization_id, clearance_level, permissions,
fullName?, department? }` (type lives in `src/types/express.d.ts` — do not
redeclare it in `auth.ts`).

Two schema landmines that turn every valid token into a 401 — both are commented
in `fetchUserContext`, keep them that way:

- The live `users` table has **no `permissions` column**; selecting it 42703s the
  query. `req.user.permissions` is populated as `[]`.
- The live `profiles` table has **no `role` column**; selecting it nulls
  `organization_id` and fail-closes every route. Authorization is unified on
  `public.users.role`. `organization_id` and `clearance_level` come from
  `profiles` (keyed `profiles.user_id = userId`).

Authorization helpers:

- `middleware/rbac.ts` — `requireMinRole`, `requirePermission`, `requireClearance`
  (prefer these; `ROLE_HIERARCHY` defines the order).
- `middleware/auth.ts` also exports legacy `requireRole`, `requireOwnershipOrAdmin`,
  and `optionalAuth`.

The `/api/ai/briefs` router uses its own inline `verifySupabaseToken` gate
(defined in `src/api/ai/briefs.ts`) rather than the global middleware, because it
mounts before `authenticateToken`. Mirror the same getUser-based check if you add
a sibling AI route.

## `supabaseAdmin` (service-role) vs JWT-scoped clients — RLS matters

`src/config/supabase.ts` exports two clients:

- **`supabaseAdmin`** — service-role key, `autoRefreshToken: false`,
  `persistSession: false`. **Bypasses RLS.** Almost all services use this. Because
  it ignores RLS, the service layer is responsible for every tenant/clearance
  check itself (e.g. `link.service.ts` reads `profiles.clearance_level,
organization_id` and enforces it in code). When you use `supabaseAdmin`, always
  scope queries by `organization_id` / clearance explicitly — RLS will not save you.
- **`supabaseAnon`** — anon key, used for genuinely public operations only.

Rule of thumb: if the data is tenant- or clearance-scoped and you are inside this
Express service, you are almost certainly on `supabaseAdmin`, so the filter must
be in your query. (Edge Functions take the opposite stance — they build a
JWT-scoped client and let RLS enforce, see `supabase/CLAUDE.md`.)

## Validation: Zod, not express-validator

Despite older docs mentioning express-validator, the API layer uses **Zod**. No
router under `src/api/` imports express-validator.

- Define `z.object(...)` schemas at the top of the router file.
- Gate the handler with the `validate({ body, query, params })` factory from
  `src/utils/validation.ts`. It parses with `parseAsync`, writes the coerced value
  back onto `req`, and throws `ValidationError` (→ 400 with `details[]`) on failure.
- Reusable schemas live in `utils/validation.ts`: `paginationSchema`,
  `idParamSchema`, `searchQuerySchema`, `bilingualFieldSchema`, `dateRangeSchema`,
  `fileUploadSchema`.

## Error handling: typed error classes + discriminated unions

- `utils/validation.ts` defines `ValidationError`, `UnauthorizedError`,
  `ForbiddenError`. Throw these from handlers/services; the API error handler in
  `api/index.ts` maps them to 400/401/403 by `err.name`. Everything else → 500
  (message hidden unless `NODE_ENV === 'development'`).
- Services return discriminated unions for outcome-bearing operations
  (`{ success: true }` / `{ success: false, error }`, e.g. `document.service.ts`).
  Some older services throw plain `{ code, message, statusCode }` objects
  (e.g. `link.service.ts`) — both patterns exist; match the file you are editing.
- Never swallow errors silently. Handlers wrap in `try/catch` and call
  `next(error)` after `logError(...)`.

## Logging: Winston only

Use `logInfo`, `logError`, `logWarn` (and `logApiRequest`, `logSecurityEvent`,
`logAuthEvent`) from `src/utils/logger.ts`. `logError(message, error?, meta?)`
serializes the error's name/message/stack into structured meta. No
`console.log`; ESLint allows only `console.warn`/`console.error` and even those
should be the Winston helpers here. Logs go to `logs/all.log` and
`logs/error.log` plus colorized console in development.

## Briefs: `briefs` vs `ai_briefs` are different tables

- **`briefs`** (`007_briefs.sql`) — human-authored summary documents:
  `reference_number`, `title_en/ar`, `summary_en/ar`, `category`, `is_published`.
  Read/written by `services/brief.service.ts` (`.from('briefs')`).
- **`ai_briefs`** (`20251206000001_ai_briefs.sql`) — AI brief generation records:
  `status`, `run_id`, `executive_summary`, `talking_points`, `citations`,
  `full_content` JSONB. Served by `src/api/ai/briefs.ts`.
- AI brief _generation_ in this Express service is **retired** (Phase 74):
  `BriefService.generate*` throws a migration-path error. New AI briefs are
  produced by the on-prem copilot `propose_brief` HITL flow, which persists under
  the caller's JWT via the `persist_brief` SECURITY INVOKER RPC (no service-role,
  zero external egress). Do not reintroduce an external-LLM brief generator here.

## Other infra notes

- **Rate limiting** (`middleware/rate-limit.middleware.ts`): exported as
  `apiLimiter`, `authLimiter`, `uploadLimiter`, `aiLimiter`, plus role-based
  variants. `apiLimiter` is applied globally in `api/index.ts`.
- **Queues/schedulers** (`src/queues/`): BullMQ. Started in `startServer()` only
  when Redis is available. BullMQ rejects `:` in `jobId` — use hyphens.
- **Scheduled jobs** (`src/jobs/`): only run when `ENABLE_SCHEDULED_JOBS=true`.
- **Redis** (`config/redis.ts`): initialized explicitly; cache ops fail gracefully
  to direct DB queries when Redis is down.
- **Sentry** (`lib/sentry.ts`): `initSentry()` runs before the app is created;
  request/tracing handlers are the first middleware, the error handler is before
  the local error handler.
- Local dev: port 5000 collides with macOS AirPlay — this service defaults to 5001.

## How to add a new API route

1. Create `src/api/<feature>.ts` exporting a default `Router`.
2. Put business logic in `src/services/<feature>.service.ts`; it calls
   `supabaseAdmin` and enforces `organization_id`/clearance itself.
3. Define Zod schemas in the router and gate handlers with
   `validate({ body|query|params })`.
4. In each handler: `try { … } catch (error) { logError(...); return next(error) }`.
   Throw `ValidationError`/`UnauthorizedError`/`ForbiddenError` for expected failures.
5. Register it in `src/api/index.ts` **after** `apiRouter.use(authenticateToken)`
   (or before it, with its own auth gate, if it needs a public sub-route).
6. Add types as `src/types/<feature>.types.ts`. Explicit return types are required
   by ESLint (`@typescript-eslint/explicit-function-return-type`); no `any`.
7. If it needs new tables/RLS, add a migration via the Supabase MCP — see
   `supabase/CLAUDE.md`.
