# Intl-Dossier AI Layer — Design

**Date:** 2026-05-22
**Branch:** phase-58/wave-5-charts-residue (work routed as direct-edit, GSD bypass approved by user)
**Source material:**

- Anthropic article — _How Claude Code works in large codebases: best practices and where to start_ (claude.com/blog)
- Cole Medin's `coleam00/helpline` demonstration repo (companion to the article)

## Purpose

Adapt the article's five harness extension points (the "AI Layer") to the Intl-Dossier monorepo. The current repo has a 30KB root `CLAUDE.md`, two write-capable specialist agents, custom commands, and one skills folder, but no subdirectory `CLAUDE.md` hierarchy, no self-improving hooks, no read-only explorer subagent, and no `paths:`-scoped project-specific skills. This spec defines the additions and the root-file thinning that bring the repo to the article's "lean, layered, self-maintaining" target state.

**Out of scope for this spec:** LSP setup doc (TypeScript already has tsserver in IDEs), custom MCP server (existing MCP coverage is sufficient), plugin packaging (no team distribution need for a solo project).

## Architecture — five pillars

| Article pillar                                     | Adaptation                                                                                                                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lean root `CLAUDE.md` + per-workspace files        | Thin root to ~5KB. New per-workspace files: `backend/CLAUDE.md`, `frontend/CLAUDE.md`, `supabase/CLAUDE.md`, `tests/CLAUDE.md`, `frontend/src/design-system/CLAUDE.md`.          |
| Hooks (SessionStart + self-improving Stop)         | Node.js (`.mjs`) port of helpline's Python hooks. SessionStart prints orientation; Stop splits into a cheap trigger (`propose`) and a detached background reflector (`reflect`). |
| `paths:`-scoped skills with progressive disclosure | Four skills: `supabase-migration-safety`, `edge-function-add`, `dossier-centric-link`, `scoped-tests`. Each has lean `SKILL.md` + `references/` for deep detail.                 |
| Read-only subagent                                 | `.claude/agents/explorer.md` with `tools: Read, Grep, Glob` only — no Write/Edit/Bash. Returns a structured report; parent does any writes.                                      |
| Supporting docs                                    | Repo-root `CODEBASE_MAP.md` (find-a-feature index) and `AI-LAYER.md` (article→artifact mapping + 3-patterns + 3–6 month review cadence). Extended `.claudeignore`.               |

## Detailed design

### 1. CLAUDE.md hierarchy

**Root (~5KB):** mission, tech stack one-liner, GSD enforcement rule (verbatim), pointers to subdirectory files + `CODEBASE_MAP.md`, 5–6 repo-wide gotchas (Supabase MCP for migrations, bilingual EN/AR required, no framework migrations, design system is the visual source of truth), commands.

**Content migration:**

| From root → To                               | Content                                                                                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| → `frontend/CLAUDE.md`                       | Visual design source of truth, design rules, responsive breakpoints, RTL section, Definition of Done UI checklist, component library cascade |
| → `backend/CLAUDE.md`                        | Work Item Terminology glossary, backend naming patterns, error handling conventions                                                          |
| → `supabase/CLAUDE.md`                       | Deployment config (project ID, MCP usage, migration patterns), test credentials note                                                         |
| → `tests/CLAUDE.md`                          | Testing requirements, AAA pattern, bilingual coverage rules, scoped commands                                                                 |
| → `frontend/src/design-system/CLAUDE.md`     | Token system port rules, FOUC bootstrap parity rule, density/direction system                                                                |
| → `dossier-centric-link` skill `references/` | Dossier-Centric architecture deep-dive                                                                                                       |
| → **delete from root**                       | Karpathy principles (duplicate of user-global `~/.claude/CLAUDE.md`); tag-signing setup (move to `docs/` if retained)                        |

Each subdirectory file ~30–60 lines: **Conventions** (3–5 enforceable bullets) + **Tests** (scoped command) + **Gotchas**.

### 2. Hooks

**`.claude/hooks/session-start-context.mjs`** — SessionStart, no input needed.

- Walks repo to find every directory with a `CLAUDE.md` → governed-areas set
- Maps `git status --porcelain` files to nearest governed area
- Reads `git log -5 --pretty=format:%h %s`
- Prints orientation block: active areas, recent commits, pointer to `CODEBASE_MAP.md`

**`.claude/hooks/propose-claude-md.mjs`** — Stop, cheap trigger.

- Recursion guard via env var `INTL_DOSSIER_REFLECT_LOCK=1`
- Computes touched areas + SHA-256 fingerprint of scoped `git diff HEAD -- <areas>`
- Compares against `.claude/.claude-md-review-state` for dedup (skip identical follow-up turns)
- On new diff: spawns reflector detached (`detached: true, stdio: 'ignore', unref()`), writes fingerprint, returns immediately
- Stderr one-liner: "[self-improving hook] N area(s) changed (…) — reflecting in background → .claude/claude-md-review.md"

**`.claude/hooks/reflect-claude-md.mjs`** — slow LLM call, runs detached.

- Recursion guard
- Builds prompt: scoped diff (truncated to ~12KB) + current CLAUDE.md of each touched area
- Calls `claude -p --output-format text` with lock env var set (so nested Claude's Stop hook no-ops)
- 180s timeout
- Success: writes timestamped reflection to `.claude/claude-md-review.md`
- Failure (no `claude` binary, non-zero exit, timeout): deterministic fallback — writes "re-check these areas by hand" note listing each touched area

**`.claude/settings.json`** — add SessionStart + Stop entries; add `Bash(pnpm test:*)`, `Bash(pnpm typecheck:*)`, `Bash(pnpm lint:*)` to allow list.

**`.gitignore`** — add `.claude/claude-md-review.md`, `.claude/.claude-md-review-state` (per-machine state).

### 3. Skills

Each skill: `.claude/skills/<name>/SKILL.md` with `paths:` frontmatter for auto-scoping + `references/` for progressive disclosure.

**`supabase-migration-safety/`** — `paths: supabase/migrations/**`

- Rules: apply via Supabase MCP only; RLS on every new table (no exceptions); pre-check `pg_constraint` before seed INSERTs; additive ALTERs only (nullable + backfill, never NOT NULL on first deploy); regen TS types after schema change; forward-only (no edits to applied migrations)
- `references/rls-patterns.md` (org-scoped, user-scoped, role-based templates; `auth.uid()` gotcha; service-role bypass rule)
- `references/migration-checklist.md` (pre-flight: constraints/FKs/indexes; staging deploy; type regen; rollback)

**`edge-function-add/`** — `paths: supabase/functions/**`

- Rules: handler signature `(req: Request) => Promise<Response>`; Zod validation before any work; CORS via shared helper; JWT verify via `supabase.auth.getUser(token)`; secrets via `Deno.env.get()` with null check; deploy via Supabase MCP
- `references/function-checklist.md` (worked example: imports, CORS preflight, auth, body parse + validate, business logic, error envelope, deploy)

**`dossier-centric-link/`** — `paths: frontend/src/domains/**, backend/src/api/**`

- Rules: `work_item_dossiers` junction with explicit `inheritance_source`; URLs via `getDossierRouteSegment()`; type validation via `isValidDossierType()`; `<DossierContextBadge>` on work-item UI; `useResolveDossierContext()` for inheritance
- `references/dossier-patterns.md` — receives the deep-dive currently in root CLAUDE.md (8 dossier types table, linking SQL, component usage)

**`scoped-tests/`** — `paths: tests/**, **/*.test.ts, **/*.test.tsx`

- Decision table mapping changed-paths → narrowest pnpm command
- Rule: shared/core changes → full suite; single-workspace change → scoped suite
- Every new UI test covers both EN (LTR) and AR (RTL) cases (AAA structure)

### 4. Explorer subagent

`.claude/agents/explorer.md`:

- `tools: Read, Grep, Glob` only — no Write/Edit/Bash (the restriction is the guarantee)
- `model: sonnet`
- Invocation contract: one subsystem path
- Procedure: read subsystem CLAUDE.md → Glob/Grep for entry points, public exports, imports from `shared/` and `backend/src/core/domain/`, reverse imports → identify gotchas
- Return format: Entry points / Key types & functions / Dependencies / Gotchas / Suggested fixes (described, not applied)
- Coexists with existing write-capable `dossier-crud-specialist` and `ui-ux-designer` (different roles)

### 5. Supporting docs

**`CODEBASE_MAP.md`** (repo root):

- Top-level table (backend/, frontend/, supabase/, shared/, tests/, deploy/, docs/)
- `backend/src/` table (api, core/domain, core/ports, adapters, middleware, utils)
- `frontend/src/` table (routes, domains, components, design-system, hooks, contexts, providers)
- `supabase/` table (migrations, functions, seed)
- "Finding a feature" bullets (dossier behavior → ..., RLS policy → grep `CREATE POLICY` in `supabase/migrations/`, design token → `frontend/src/design-system/tokens/`, bilingual string → `frontend/src/i18n/<ns>/`)
- Maintenance note

**`AI-LAYER.md`** (repo root):

- Article→artifact→where-it-lives table (same shape as helpline's)
- The 3 configuration patterns from the article applied to Intl-Dossier (navigable codebase / active CLAUDE.md maintenance / ownership)
- "Review every 3–6 months" cadence note

**`.claudeignore`** extensions:

- `frontend/design-system/inteldossier_handoff_design/handoff/**` (compiled artifacts)
- `**/.turbo/`, `**/dist/`, `**/build/`, `**/.next/`, `coverage/`
- `**/*.log`, `pnpm-lock.yaml`
- `.claude/claude-md-review.md`, `.claude/.claude-md-review-state`
- `.claude/worktrees/`

## Build order

Atomic commits per logical chunk.

**Phase A — Foundation (additive only):**

1. Create 5 subdirectory `CLAUDE.md` files (additive — no content removed yet from root)
2. Write `CODEBASE_MAP.md`
3. Extend `.claudeignore`; add review-state to `.gitignore`
4. Commit: `chore(ai-layer): add subdirectory CLAUDE.md hierarchy + CODEBASE_MAP`

**Phase B — Thin the root:** 5. Move content per the migration table; root lands at ~5KB 6. Diff-review against the original to confirm no silent drops 7. Commit: `refactor(ai-layer): thin root CLAUDE.md to ~5KB`

**Phase C — Skills (4 commits, one each):** 8. `supabase-migration-safety` (SKILL.md + 2 references) 9. `edge-function-add` (SKILL.md + 1 reference) 10. `dossier-centric-link` (SKILL.md + 1 reference receiving root content) 11. `scoped-tests` (SKILL.md only)

**Phase D — Hooks + subagent:** 12. 3 hook scripts in `.claude/hooks/` 13. Update `.claude/settings.json` (hooks block + pnpm permissions) 14. `.claude/agents/explorer.md` 15. Commit: `chore(ai-layer): add self-improving hooks + explorer subagent`

**Phase E — Meta-doc:** 16. `AI-LAYER.md` 17. Commit: `docs(ai-layer): add AI-LAYER meta-doc`

## Validation (manual smoke checks after each phase)

- **A:** `find backend frontend supabase tests -maxdepth 2 -name CLAUDE.md` returns 5 paths; `CODEBASE_MAP.md` opens; new `.claudeignore` lines present
- **B:** `wc -c CLAUDE.md` reports under 6000; no broken internal references in moved content (visual diff)
- **C:** each `SKILL.md` parses as valid YAML frontmatter (`name`, `description`, `paths` fields present); `references/` files load relative-linked
- **D:** `node .claude/hooks/session-start-context.mjs < /dev/null` prints orientation block; `node .claude/hooks/propose-claude-md.mjs < /dev/null` exits 0 cleanly with no working-tree changes; settings.json validates against schema
- **E:** `AI-LAYER.md` renders; all repo-internal links resolve via `grep -oP '\]\(\K[^)]+' AI-LAYER.md | xargs -I{} test -e {}`

## Deliverables summary

- 6 new `CLAUDE.md` (5 sub + 1 thinned root)
- 4 new skills (8 files: 4 SKILL.md + 4 reference docs)
- 3 new hook scripts
- 1 new subagent
- 2 new meta-docs (`CODEBASE_MAP.md`, `AI-LAYER.md`)
- Updated `.claudeignore`, `.gitignore`, `.claude/settings.json`
- **Total: ~25 new files, 3 modified, 5 commits**

## Risks & mitigations

| Risk                                                          | Mitigation                                                                                                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root CLAUDE.md content gets dropped silently during thinning  | Phase A is additive (new files exist before root is thinned). Phase B includes a manual diff-review step against the pre-thinning root.                   |
| Reflector calls `claude -p` recursively forever               | Recursion guard via `INTL_DOSSIER_REFLECT_LOCK=1` env var: both `propose` and `reflect` no-op when set; the headless `claude` it spawns inherits the env. |
| Stop hook fires every turn and re-reflects on identical diffs | Diff-fingerprint dedup against `.claude/.claude-md-review-state`.                                                                                         |
| Slow LLM call blocks turn end                                 | Reflector runs detached (`stdio: 'ignore', unref()`); propose returns immediately.                                                                        |
| Existing skills/agents conflict with new explorer             | Explorer is read-only — different role from write-capable specialists. No naming collision (existing names: `dossier-crud-specialist`, `ui-ux-designer`). |
| New skills auto-load globally and bloat context               | All 4 skills have `paths:` frontmatter — surface only in matching directories.                                                                            |
| GSD enforcement rule blocks the work                          | User explicitly authorized direct-edit bypass during brainstorming (recorded in this spec).                                                               |

## Out-of-scope (deferred or rejected)

- LSP setup doc — TypeScript already has tsserver via IDE; no separate setup needed
- Custom MCP `codebase-search` server — existing MCP coverage (`auggie__codebase-retrieval`, etc.) is sufficient
- Plugin packaging (`tooling/<name>-ai-layer/`) — no team distribution need; solo project
- Optional skills not selected: `design-system-tokens`, `work-item-terminology`, `rtl-bilingual-component` (covered by existing global RTL skill and per-workspace CLAUDE.md rules)
- Video map (helpline has one because they're producing a video; we are not)
