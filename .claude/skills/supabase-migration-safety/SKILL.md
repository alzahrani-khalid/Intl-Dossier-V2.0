---
name: supabase-migration-safety
description: >-
  Use when creating or editing files under supabase/migrations/. Enforces
  Intl-Dossier's migration rules — apply via MCP only, RLS on every new table,
  additive ALTERs, forward-only, regen TS types after schema changes.
paths: supabase/migrations/**
---

# Supabase migration safety

Activates for work in `supabase/migrations/`. The rules below are non-negotiable; only deepen them, never skip.

## The rules (load every time)

1. **Apply migrations via the Supabase MCP only.** Never `supabase db push` from a laptop — that bypasses the staging credential path.
2. **Every new table gets an RLS policy in the same migration.** No "I'll add RLS later." See [references/rls-patterns.md](references/rls-patterns.md).
3. **Additive ALTER ONLY.** A new column is nullable + backfilled in a follow-up migration before becoming NOT NULL. Never NOT NULL on first deploy.
4. **Regen TypeScript types** via the Supabase MCP (`generate_typescript_types`) after any schema change. Commit the regenerated types in the same PR.
5. **Forward-only.** Never edit an applied migration. If it's wrong, write a new one to undo it.
6. **Query `pg_constraint` before any seed INSERT.** Check-constraint surprises (e.g. `activity_stream.action_type` is imperative `create`/`update`, not past-tense) burn time silently.

## When you need detail

- Full pre-flight checklist (constraints, FKs, indexes, type regen, rollback): [references/migration-checklist.md](references/migration-checklist.md)
- RLS templates (org-scoped, user-scoped, role-based) + the `auth.uid()` gotcha: [references/rls-patterns.md](references/rls-patterns.md)
