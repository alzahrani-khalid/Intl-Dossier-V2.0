# Intl-Dossier v2.0 — Production Quality Milestone

Diplomatic dossier management. React 19 + TanStack + Tailwind v4 frontend; Express + DDD backend; Supabase PostgreSQL + Auth + Realtime; AnythingLLM for AI; bilingual EN/AR (LTR + RTL).

## Where things live

See **`CODEBASE_MAP.md`** for the full tree. Each workspace has its own `CLAUDE.md`:

- `backend/CLAUDE.md` — Express API, DDD layers, Work Item terminology
- `frontend/CLAUDE.md` — React + design system, RTL, responsive rules
- `frontend/src/design-system/CLAUDE.md` — the runtime token port
- `supabase/CLAUDE.md` — migrations, Edge Functions, deployment, RLS
- `tests/CLAUDE.md` — Vitest + Playwright + a11y, scoped commands

The AI Layer meta-doc is `AI-LAYER.md`.

## Critical repo-wide rules

- **Apply Supabase migrations via the Supabase MCP, never `supabase db push` from a laptop.** Details in `supabase/CLAUDE.md` + `.claude/skills/supabase-migration-safety/`.
- **The IntelDossier prototype is the visual source of truth.** `frontend/design-system/inteldossier_handoff_design/`. Default direction: **Bureau**. Details in `frontend/CLAUDE.md`.
- **Bilingual (EN + AR) is mandatory.** Every UI feature renders in both directions. No `ml-*`/`mr-*`/`text-left` — logical properties only. Full rules in `frontend/CLAUDE.md`.
- **No framework migrations.** Stay within React 19, TanStack, Express, Supabase, Tailwind v4.
- **No regressions.** All existing features must keep working after any change.

## Dossier-centric architecture (one-line rule)

Everything starts with a Dossier. New work items link via `work_item_dossiers` with an explicit `inheritance_source`. Deep-dive: `.claude/skills/dossier-centric-link/references/dossier-patterns.md`.

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

- `/gsd:quick` — small fixes, doc updates, ad-hoc tasks
- `/gsd:debug` — investigation and bug fixing
- `/gsd:execute-phase` — planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

## Commands

```bash
pnpm dev                      # all workspaces (Turborepo)
pnpm build                    # production build
pnpm test                     # full suite
pnpm --filter <ws> test       # scoped (see tests/CLAUDE.md)
pnpm lint && pnpm typecheck   # checks
```

## AI Layer

This repo runs an "AI Layer" — CLAUDE.md hierarchy + path-scoped skills + self-improving Stop hook + read-only explorer subagent + meta-docs. See **`AI-LAYER.md`** for the full mapping. Review every 3–6 months and after major model releases.
