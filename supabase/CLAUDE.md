# supabase — migrations, Edge Functions, RLS, seed

PostgreSQL 17 + Auth + Realtime + Storage. Project: **Intl-Dossier** (`zkrcjzdemdmwhearhfgg`, eu-west-2).

## Conventions

- **Apply migrations via the Supabase MCP, never `supabase db push` from a laptop.** The MCP is the only path that hits staging through the right credentials.
- **Every new table needs an RLS policy in the same migration.** No "I'll add RLS later." See `.claude/skills/supabase-migration-safety/references/rls-patterns.md`.
- **Additive ALTER ONLY.** New columns are nullable + backfilled in a follow-up migration before becoming NOT NULL. Never NOT NULL on first deploy.
- **Regen TypeScript types after any schema change** via the Supabase MCP (`generate_typescript_types`).
- **Forward-only.** Never edit an applied migration — write a new one.

## Edge Functions

- Live in `supabase/functions/<name>/index.ts` (Deno runtime).
- Handler signature: `(req: Request) => Promise<Response>`.
- Always validate inputs with Zod before any work.
- CORS via a shared helper, not inlined.
- JWT verify via `supabase.auth.getUser(token)` — never trust the token payload.
- Deploy via Supabase MCP (`deploy_edge_function`).

## Deployment

### Staging Environment

- **Project Name**: Intl-Dossier
- **Project ID**: zkrcjzdemdmwhearhfgg
- **Region**: eu-west-2
- **Database**: PostgreSQL 17.6.1.008
- **Host**: db.zkrcjzdemdmwhearhfgg.supabase.co

### Deployment Commands

- Migrations: Use Supabase MCP to apply migrations
- Edge Functions: Deploy via Supabase CLI or MCP
- Realtime: Enable via Supabase dashboard or MCP

### DigitalOcean Droplet (Production)

- **IP Address**: 138.197.195.242
- **SSH Access**: `ssh root@138.197.195.242` (key pre-configured)
- **App Directory**: `/opt/intl-dossier/`
- **Port**: 80 (HTTP), 443 (HTTPS - not yet configured)
- **Full Instructions**: See `deploy/DROPLET_INSTRUCTIONS.md`

**Quick Deploy:**

```bash
git push && ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build frontend && docker compose -f docker-compose.prod.yml up -d frontend"
```

## Test Credentials

When testing the application using browser automation tools (Chrome MCP, Playwright, etc.), use credentials from environment variables:

- **Email**: `$TEST_USER_EMAIL` (see `.env.test.example`)
- **Password**: `$TEST_USER_PASSWORD` (see `.env.test.example`)

For local development, set these in `.env.test` (not committed to git).

## Tests

```bash
pnpm test:integration                # runs against local Supabase
```

## Gotchas

- **`pg_constraint` is the truth about check constraints.** Query it before writing a seed INSERT — `activity_stream` uses imperative `action_type` (`create`/`update`), not past-tense.
- **No FK from `aa_commitments` to `dossiers`.** PostgREST embed gives 400; batch `.in('id', ids)` instead.
