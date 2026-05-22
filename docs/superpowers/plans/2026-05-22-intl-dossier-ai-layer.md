# Intl-Dossier AI Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt Anthropic's "AI Layer" pattern (CLAUDE.md hierarchy, self-improving hooks, path-scoped skills, read-only explorer subagent, supporting docs) to the Intl-Dossier monorepo.

**Architecture:** Lean root CLAUDE.md + per-workspace files (loaded additively as Claude walks the tree); Node.js (ESM, no deps) port of helpline's Python hooks with a cheap `propose` trigger and a detached LLM `reflect` worker; 4 path-scoped skills with progressive disclosure into `references/`; a read-only `explorer` agent with restricted tools; `CODEBASE_MAP.md` + `AI-LAYER.md` meta-docs.

**Tech Stack:** Node.js 22 (hooks), Markdown (CLAUDE.md / skills / docs), YAML frontmatter, git CLI, headless `claude -p`, existing pnpm/Turbo/Supabase MCP toolchain.

**Source spec:** `docs/superpowers/specs/2026-05-22-intl-dossier-ai-layer-design.md` (committed `b30f54c5`)

---

## File map

| Path                                                                                                                 | Action                | Phase |
| -------------------------------------------------------------------------------------------------------------------- | --------------------- | ----- |
| `backend/CLAUDE.md`                                                                                                  | create                | A     |
| `frontend/CLAUDE.md`                                                                                                 | create                | A     |
| `supabase/CLAUDE.md`                                                                                                 | create                | A     |
| `tests/CLAUDE.md`                                                                                                    | create                | A     |
| `frontend/src/design-system/CLAUDE.md`                                                                               | create                | A     |
| `CODEBASE_MAP.md`                                                                                                    | create                | A     |
| `.claudeignore`                                                                                                      | modify                | A     |
| `.gitignore`                                                                                                         | modify                | A     |
| `CLAUDE.md` (root)                                                                                                   | modify (thin to ~5KB) | B     |
| `.claude/skills/supabase-migration-safety/{SKILL.md, references/rls-patterns.md, references/migration-checklist.md}` | create                | C     |
| `.claude/skills/edge-function-add/{SKILL.md, references/function-checklist.md}`                                      | create                | C     |
| `.claude/skills/dossier-centric-link/{SKILL.md, references/dossier-patterns.md}`                                     | create                | C     |
| `.claude/skills/scoped-tests/SKILL.md`                                                                               | create                | C     |
| `.claude/hooks/session-start-context.mjs`                                                                            | create                | D     |
| `.claude/hooks/propose-claude-md.mjs`                                                                                | create                | D     |
| `.claude/hooks/reflect-claude-md.mjs`                                                                                | create                | D     |
| `.claude/agents/explorer.md`                                                                                         | create                | D     |
| `.claude/settings.json`                                                                                              | modify                | D     |
| `AI-LAYER.md`                                                                                                        | create                | E     |

**Commit boundary:** 5 atomic commits — one per phase (A foundation, B root-thin, C skills bundle, D hooks+agent, E meta-doc). Phase C is a single commit covering all 4 skills (consolidated from the spec's 4-commits-per-skill for cleaner history).

---

## PHASE A — Foundation (additive only, no behavior change yet)

### Task 1: Create `backend/CLAUDE.md`

**Files:**

- Create: `backend/CLAUDE.md`

- [ ] **Step 1: Confirm the file does not exist yet**

```bash
test ! -f backend/CLAUDE.md && echo "OK: new file"
```

Expected: `OK: new file`

- [ ] **Step 2: Identify source content in current root CLAUDE.md**

Read the current root `CLAUDE.md`. Source sections that move here:

- "Work Management Terminology (MANDATORY)" — full section (the Unified Terms table, Source Types, Tracking Types, Workflow Stages, Code Usage, Database Column Naming)
- Subset of "Conventions" relevant to backend: Naming Patterns (Middleware, Types/Interfaces, Test files), Error Handling, Logging (Winston), Module Design
- Backend-side of "Cross-Cutting" (Auth, Validation, Rate limiting, Caching)

- [ ] **Step 3: Write `backend/CLAUDE.md` with this structure** (target: 60–150 lines)

````markdown
# backend — Express + TypeScript API (DDD layers)

The HTTP API. Domain logic in `src/core/domain/`, ports/adapters in `src/core/ports/` + `src/adapters/`, request handlers in `src/api/`. JWT auth, Winston logging, Supabase-backed.

## Conventions

- **Domain layer is framework-agnostic.** Nothing in `src/core/domain/` imports Express, Supabase, or anything in `src/adapters/`. The dependency arrow points inward.
- **Handlers raise typed errors, they don't return error envelopes.** Use the error hierarchy + `errorHandler` middleware; never hand-build `{status: 404}`.
- **No floating promises.** `@typescript-eslint/no-floating-promises` is error-level — always `await` or explicit `.catch`.
- **camelCase functions, explicit return types** (ESLint enforced). Single-quote strings, no semicolons, 100-col print width.
- **Middleware files**: hyphenated with `.middleware.ts` suffix (e.g. `rate-limit.middleware.ts`). Types: `.types.ts` suffix.

## Work Item Terminology (MANDATORY)

Move the full "Work Management Terminology" section from the previous root CLAUDE.md here verbatim — the Unified Terms table, Source/Tracking types, Workflow Stages, Code Usage block, and Database Column Naming table. This terminology is the single source of truth for any feature touching work items.

## Tests

\```bash
pnpm --filter backend test # backend suite
pnpm --filter backend test <file> # one file
pnpm --filter backend typecheck # types only
\```

## Gotchas

- **Floating-promise lint rule is error-level.** Don't suppress — fix the call site.
- **`src/core/domain/` changes ripple across all API routes.** Run the full backend suite, not just one route's tests.
- **Rate-limit middleware variants:** `apiLimiter`, `authLimiter`, `uploadLimiter`, `aiLimiter` — use the right one for the endpoint kind.
````

The "Work Item Terminology" subsection should reproduce the existing terminology content verbatim (tables and all) from the current root CLAUDE.md — do not paraphrase, do not drop the database column naming table.

- [ ] **Step 4: Verify file size and content**

```bash
wc -l backend/CLAUDE.md && grep -c "Unified Terms\|Database Column Naming\|Workflow Stages" backend/CLAUDE.md
```

Expected: line count 60–150; grep count ≥ 3 (all three landmark phrases present).

---

### Task 2: Create `frontend/CLAUDE.md`

**Files:**

- Create: `frontend/CLAUDE.md`

- [ ] **Step 1: Source content from current root CLAUDE.md**

Sections that move here (move verbatim from current root):

- "Visual Design Source of Truth (READ BEFORE ANY UI WORK)" — full section (file hierarchy, required reading order, design rules, Definition of Done UI checklist)
- "Responsive Design" — full section (breakpoints table, rules)
- "Arabic RTL Support Guidelines (MANDATORY)" — full section (RTL detection, logical properties table, component template)
- "Component Library Strategy" — full section (HeroUI/Radix cascade, banned libraries, file locations)

- [ ] **Step 2: Write `frontend/CLAUDE.md`** (target: 200–280 lines)

Structure:

````markdown
# frontend — React 19 + TanStack + IntelDossier Design System

Desktop-primary analyst workstation. Default direction: **Bureau**. Target width: 1280–1400px.

## Visual Design Source of Truth (READ BEFORE ANY UI WORK)

[Move the entire "Visual Design Source of Truth" section from root CLAUDE.md verbatim — including the file hierarchy, the required-reading-order, the non-negotiable design rules, and the Definition of Done UI checklist.]

## Responsive Design

[Move the entire "Responsive Design" section verbatim — breakpoints table + rules.]

## Arabic RTL Support Guidelines (MANDATORY)

[Move the entire "Arabic RTL Support Guidelines" section verbatim — RTL Detection, the logical-properties Avoid/Use table, and the RTL Component Template.]

## Component Library Strategy

[Move the entire "Component Library Strategy" section verbatim — primitive cascade, banned libraries, file locations.]

## Tests

\```bash
pnpm --filter frontend test # frontend suite
pnpm --filter frontend test <file> # one file
pnpm --filter frontend typecheck
pnpm --filter frontend test:e2e # Playwright
\```

## Gotchas

- **Theme tokens MUST resolve to design-system tokens.** No raw hex, no `text-blue-500` literals. Use `var(--*)` or the @theme-mapped Tailwind utilities (`bg-bg`, `text-ink`, etc.).
- **No `ml-*`/`mr-*`/`pl-*`/`pr-*`/`text-left`/`text-right`.** Logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`).
- **No card shadows.** Borders are `1px solid var(--line)`. Shadow only on drawers + hovered list rows.
- **FOUC bootstrap parity:** if you touch `frontend/src/design-system/tokens/directions.ts`, the literals in `frontend/public/bootstrap.js` must byte-match. See `frontend/src/design-system/CLAUDE.md`.
````

- [ ] **Step 3: Verify content moved completely**

```bash
grep -c "Visual Design Source of Truth\|Definition of Done\|RTL Detection\|Component Library Strategy" frontend/CLAUDE.md
```

Expected: ≥ 4 (all four section landmarks present).

---

### Task 3: Create `supabase/CLAUDE.md`

**Files:**

- Create: `supabase/CLAUDE.md`

- [ ] **Step 1: Source from current root CLAUDE.md**

- "Deployment Configuration" — full section (Staging Environment, Deployment Commands, Test Credentials note)
- The Supabase MCP rule from user-global `~/.claude/CLAUDE.md` summarized here as a 1-line gotcha

- [ ] **Step 2: Write `supabase/CLAUDE.md`** (target: 50–80 lines)

````markdown
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

[Move the existing "Deployment Configuration" section from root CLAUDE.md verbatim — project ID, region, host, deployment commands, droplet IP + quick deploy snippet.]

## Test Credentials

[Move the existing "Test Credentials for Browser/Chrome MCP" note verbatim — points to `.env.test.example` env vars; do not commit secrets.]

## Tests

\```bash
pnpm test:integration # runs against local Supabase
\```

## Gotchas

- **`pg_constraint` is the truth about check constraints.** Query it before writing a seed INSERT — `activity_stream` uses imperative `action_type` (`create`/`update`), not past-tense.
- **No FK from `aa_commitments` to `dossiers`.** PostgREST embed gives 400; batch `.in('id', ids)` instead.
````

- [ ] **Step 3: Verify**

```bash
test -f supabase/CLAUDE.md && grep -q "Supabase MCP" supabase/CLAUDE.md && echo OK
```

Expected: `OK`

---

### Task 4: Create `tests/CLAUDE.md`

**Files:**

- Create: `tests/CLAUDE.md`

- [ ] **Step 1: Write `tests/CLAUDE.md`** (target: 40–60 lines)

````markdown
# tests — Vitest + Playwright + axe-core

Pyramid: unit (Vitest) → integration (Vitest + local Supabase) → E2E (Playwright + axe-core).

## Conventions

- **AAA structure.** Arrange / Act / Assert blocks, named explicitly when non-trivial.
- **Every new UI component test covers both EN (LTR) and AR (RTL)** — render twice with the appropriate `dir` and `i18n.language`.
- **Coverage target: 80% minimum** for new code (project-wide rule).
- **Test names describe behavior**, not implementation: `returns empty array when no matches` ✅, not `test getById()` ❌.
- **No floating promises in tests either** — `await` every `expect(...).resolves` / Playwright assertion.

## Scoped commands (the AI Layer's `scoped-tests` skill enforces this)

| What you changed                                                  | Run                                              |
| ----------------------------------------------------------------- | ------------------------------------------------ |
| `frontend/src/components/<x>/**`                                  | `pnpm --filter frontend test src/components/<x>` |
| `frontend/src/domains/<x>/**`                                     | `pnpm --filter frontend test src/domains/<x>`    |
| `backend/src/api/<feat>/**`                                       | `pnpm --filter backend test src/api/<feat>`      |
| `supabase/migrations/**`                                          | `pnpm test:integration`                          |
| `backend/src/core/domain/**` or `shared/**`                       | `pnpm test` (FULL — repo-wide imports)           |
| `frontend/src/design-system/**` or `frontend/public/bootstrap.js` | full frontend suite + visual regression          |

## Tests for tests

\```bash
pnpm test # full
pnpm test:e2e # Playwright only
pnpm test:a11y # axe-core
\```

## Gotchas

- **Vitest watch mode + Supabase Realtime subscriptions leak across tests.** Use `vi.useFakeTimers()` and `afterEach(cleanup)` religiously.
- **Playwright tests must run with the dev server up.** `pnpm dev` in another shell, or rely on the global setup.
````

- [ ] **Step 2: Verify**

```bash
test -f tests/CLAUDE.md && grep -c "AAA\|EN (LTR) and AR\|80%" tests/CLAUDE.md
```

Expected: ≥ 3.

---

### Task 5: Create `frontend/src/design-system/CLAUDE.md`

**Files:**

- Create: `frontend/src/design-system/CLAUDE.md`

- [ ] **Step 1: Write the file** (target: 40–60 lines)

````markdown
# frontend/src/design-system — runtime port of the IntelDossier prototype

This directory ports `frontend/design-system/inteldossier_handoff_design/src/themes.jsx` into the production runtime. The prototype is the visual source of truth; this is the executable mirror.

## Conventions

- **DesignProvider owns the cascade.** `DesignProvider.tsx` reads density/direction/theme/hue, builds the token set via `tokens/buildTokens.ts`, applies via `tokens/applyTokens.ts`. Never set CSS custom properties from a component.
- **`tokens/directions.ts` and `frontend/public/bootstrap.js` must byte-match on palette + font literals.** The FOUC bootstrap paints the first frame before React mounts; any drift causes a visible flash. There is no automated test for this — diff by hand on any change.
- **Direction = Bureau** by default. Chancery, Situation, Ministerial are present in the codebase but ignored unless a task explicitly references them.
- **Hooks (`hooks/`) are thin wrappers** over context — no business logic, just `useDesign()`-style accessors.

## Tests

\```bash
pnpm --filter frontend test src/design-system
\```

## Gotchas

- **Tailwind v4 `@theme` mapping is the bridge** — utilities like `bg-bg`, `text-ink`, `border-line` exist only because of the `@theme` block. If you add a token, add the matching `@theme` entry.
- **Touching this directory triggers the full frontend suite** in the `scoped-tests` skill — every component depends on tokens.
- **Don't touch `frontend/design-system/inteldossier_handoff_design/`** from here. That's the prototype (read-only source of truth). This port reads it conceptually, not as a runtime dependency.
````

- [ ] **Step 2: Verify**

```bash
test -f frontend/src/design-system/CLAUDE.md && grep -q "byte-match" frontend/src/design-system/CLAUDE.md && echo OK
```

Expected: `OK`

---

### Task 6: Create `CODEBASE_MAP.md`

**Files:**

- Create: `CODEBASE_MAP.md` (repo root)

- [ ] **Step 1: Inventory current top-level directories**

```bash
ls -d */ | sort
```

- [ ] **Step 2: Inventory backend and frontend src structure**

```bash
ls -d backend/src/*/ frontend/src/*/ 2>/dev/null
```

Use the actual output to populate the tables — don't invent paths that don't exist.

- [ ] **Step 3: Write `CODEBASE_MAP.md`**

```markdown
# Intl-Dossier — Codebase Map

Find where a feature lives _before_ reading files. Keep current when adding a domain or service.

## Top level

| Path        | What it is                                                                   |
| ----------- | ---------------------------------------------------------------------------- |
| `backend/`  | Express + TypeScript API. Domain-driven layers.                              |
| `frontend/` | React 19 + Vite + TanStack Router/Query. Desktop-primary, bilingual EN/AR.   |
| `supabase/` | Migrations, Edge Functions (Deno), seed data, RLS policies.                  |
| `shared/`   | Cross-workspace types & utilities (if present in current tree).              |
| `tests/`    | Cross-workspace integration + E2E. Per-workspace tests live beside the code. |
| `deploy/`   | Docker Compose for production (DigitalOcean droplet).                        |
| `docs/`     | Architecture decisions, runbooks, plans/specs (`docs/superpowers/`).         |
| `scripts/`  | One-off ops scripts.                                                         |

## backend/src/

[Populate from `ls backend/src/`. Expected entries:]
| Path | Entry points | Responsibility |
|------|--------------|----------------|
| `api/` | feature subdirs, each with an Express router | HTTP surface — validate, call domain, shape response |
| `core/domain/` | per-aggregate folders | Business logic, framework-agnostic |
| `core/ports/` | interface files | Contracts the domain depends on |
| `adapters/` | Supabase, AI, email, Redis | Concrete implementations of ports |
| `middleware/` | `*.middleware.ts` | Auth, rate-limit, security headers, error handler |
| `utils/` | logger, helpers | Cross-cutting utilities |

## frontend/src/

[Populate from `ls frontend/src/`. Expected entries:]
| Path | Entry points | Responsibility |
|------|--------------|----------------|
| `routes/` | `__root.tsx`, `_protected.tsx`, feature route files | TanStack Router definitions |
| `domains/<feature>/` | `types`, `repositories`, `hooks`, `services` per feature | Feature-domain code |
| `components/` | `ui/`, feature components | Reusable UI bound to design tokens |
| `design-system/` | `DesignProvider`, `tokens/`, `hooks/` | Runtime port of the IntelDossier prototype |
| `hooks/` | `useAuth`, `useDossiers`, etc. | Cross-feature hooks |
| `contexts/`, `providers/` | Auth, theme, language | Global React state |
| `i18n/<ns>/` | `en.json`, `ar.json` per namespace | Bilingual strings |

## supabase/

| Path                | What it is                                        |
| ------------------- | ------------------------------------------------- |
| `migrations/`       | Forward-only SQL migrations applied via MCP       |
| `functions/<name>/` | Deno Edge Functions (each has its own `index.ts`) |
| `seed/`             | Seed scripts (respect pg_constraint check first)  |

## Finding a feature

- **A dossier type's UI behavior** → `frontend/src/domains/dossiers/`, then its components in `frontend/src/components/Dossier/`
- **A dossier type's API** → `backend/src/api/dossiers/`, then its domain in `backend/src/core/domain/dossiers/`
- **A work item workflow rule** → `backend/src/core/domain/work-items/`; UI in `frontend/src/components/UnifiedKanban*`
- **An RLS policy** → `grep -r 'CREATE POLICY' supabase/migrations/`
- **A design token** → `frontend/src/design-system/tokens/`
- **A bilingual string** → `frontend/src/i18n/<ns>/{en,ar}.json`
- **A route** → `frontend/src/routes/` (TanStack file-based routing)
- **An Edge Function** → `supabase/functions/<name>/index.ts`
- **An MCP integration** → `.mcp.json` at repo root + `backend/src/adapters/` for clients
```

- [ ] **Step 4: Verify referenced paths exist**

```bash
for p in backend frontend supabase tests deploy docs scripts; do
  test -d "$p" && echo "✓ $p" || echo "✗ $p (drop from map)"
done
for p in backend/src/api backend/src/core/domain frontend/src/routes frontend/src/domains frontend/src/design-system supabase/migrations supabase/functions; do
  test -d "$p" && echo "✓ $p" || echo "✗ $p (adjust map)"
done
```

Any `✗` means the map references a non-existent directory — remove that row before continuing.

---

### Task 7: Extend `.claudeignore` + `.gitignore`

**Files:**

- Modify: `.claudeignore`
- Modify: `.gitignore`

- [ ] **Step 1: Read current `.claudeignore`**

```bash
cat .claudeignore
```

- [ ] **Step 2: Append to `.claudeignore`** (skip lines already present)

```
# AI Layer additions
**/.turbo/
**/dist/
**/build/
**/.next/
coverage/
**/*.log

# Compiled prototype artifacts
frontend/design-system/inteldossier_handoff_design/handoff/

# Self-improving hook state (per-machine, not source)
.claude/claude-md-review.md
.claude/.claude-md-review-state

# Agent worktrees double the file count for greps
.claude/worktrees/

# Huge machine-generated lockfile
pnpm-lock.yaml
```

- [ ] **Step 3: Append to `.gitignore`** (skip lines already present)

```
# Self-improving Stop hook state — per-machine, never committed
.claude/claude-md-review.md
.claude/.claude-md-review-state
```

- [ ] **Step 4: Verify**

```bash
grep -c "claude-md-review.md\|\.turbo\|inteldossier_handoff_design/handoff" .claudeignore
grep -c "claude-md-review.md" .gitignore
```

Expected: `.claudeignore` ≥ 3; `.gitignore` ≥ 1.

---

### Task 8: Commit Phase A

- [ ] **Step 1: Stage and commit**

```bash
git add backend/CLAUDE.md frontend/CLAUDE.md supabase/CLAUDE.md tests/CLAUDE.md frontend/src/design-system/CLAUDE.md CODEBASE_MAP.md .claudeignore .gitignore
git status
git commit -m "$(cat <<'EOF'
chore(ai-layer): add subdirectory CLAUDE.md hierarchy + CODEBASE_MAP

Phase A of the AI Layer adaptation (spec b30f54c5). Additive only —
the root CLAUDE.md is untouched until Phase B.

- 5 per-workspace CLAUDE.md files (backend, frontend, supabase, tests, design-system)
- CODEBASE_MAP.md as the find-a-feature index
- Extended .claudeignore (turbo/dist/build/.next/coverage/logs, prototype handoff artifacts, hook state, worktrees, pnpm lock)
- .gitignore for per-machine hook state

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: clean commit, no hook errors.

---

## PHASE B — Thin the root CLAUDE.md

### Task 9: Thin root `CLAUDE.md` to ~5KB pointers + repo-wide truths

**Files:**

- Modify: `CLAUDE.md` (currently ~30KB)

- [ ] **Step 1: Snapshot the current root for diff-review**

```bash
cp CLAUDE.md /tmp/CLAUDE.md.pre-thin
wc -c CLAUDE.md
```

Expected: > 25000 characters.

- [ ] **Step 2: Rewrite root `CLAUDE.md`** (target ≤ 6000 characters)

````markdown
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

\```bash
pnpm dev # all workspaces (Turborepo)
pnpm build # production build
pnpm test # full suite
pnpm --filter <ws> test # scoped (see tests/CLAUDE.md)
pnpm lint && pnpm typecheck # checks
\```

## AI Layer

This repo runs an "AI Layer" — CLAUDE.md hierarchy + path-scoped skills + self-improving Stop hook + read-only explorer subagent + meta-docs. See **`AI-LAYER.md`** for the full mapping. Review every 3–6 months and after major model releases.
````

- [ ] **Step 3: Verify size and that nothing critical was dropped silently**

```bash
wc -c CLAUDE.md
diff -u /tmp/CLAUDE.md.pre-thin CLAUDE.md | head -60
```

Expected: under 6000 bytes. Diff should show the migrated sections removed — visually confirm each removed section now lives in the right subdirectory CLAUDE.md (from Tasks 1–5).

- [ ] **Step 4: Spot-check that moved content actually landed**

```bash
grep -q "Work Item Terminology\|Unified Terms" backend/CLAUDE.md && echo "backend ✓" || echo "backend ✗ MISSING TERMINOLOGY"
grep -q "Visual Design Source of Truth\|Definition of Done" frontend/CLAUDE.md && echo "frontend ✓" || echo "frontend ✗"
grep -q "Deployment Configuration\|zkrcjzdemdmwhearhfgg" supabase/CLAUDE.md && echo "supabase ✓" || echo "supabase ✗"
```

Expected: three `✓`. Any `✗` means stop and re-do the relevant Task 1–5 before committing.

---

### Task 10: Commit Phase B

- [ ] **Step 1: Commit**

```bash
git add CLAUDE.md
git diff --cached --stat
git commit -m "$(cat <<'EOF'
refactor(ai-layer): thin root CLAUDE.md to ~5KB pointers

Content moved into per-workspace CLAUDE.mds (Phase A) and the
dossier-centric-link skill's references/ folder (Phase C, next).
Root now holds only repo-wide truths + pointers — the article's
lean-root principle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## PHASE C — Path-scoped skills (4 skills, one commit)

### Task 11: `supabase-migration-safety` skill

**Files:**

- Create: `.claude/skills/supabase-migration-safety/SKILL.md`
- Create: `.claude/skills/supabase-migration-safety/references/rls-patterns.md`
- Create: `.claude/skills/supabase-migration-safety/references/migration-checklist.md`

- [ ] **Step 1: Create directory**

```bash
mkdir -p .claude/skills/supabase-migration-safety/references
```

- [ ] **Step 2: Write `SKILL.md`**

```markdown
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
```

- [ ] **Step 3: Write `references/rls-patterns.md`**

````markdown
# RLS patterns for Intl-Dossier

## Templates

### Org-scoped (most tables)

```sql
CREATE POLICY "Users see only their org's rows"
  ON public.<table>
  FOR SELECT
  USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));
```

### User-scoped (personal data)

```sql
CREATE POLICY "Users see only their own rows"
  ON public.<table>
  FOR SELECT
  USING (user_id = auth.uid());
```

### Role-based (admin override)

```sql
CREATE POLICY "Admins see all"
  ON public.<table>
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

## Gotchas

- **`auth.uid()` returns NULL when called from the service role.** Service-role queries bypass RLS by design; don't write policies that assume `auth.uid()` is always set.
- **Subqueries in USING clauses can be slow.** For a hot table, materialize the org/user lookup with a SECURITY DEFINER function and reference it.
- **ENABLE ROW LEVEL SECURITY before adding policies.** `CREATE TABLE` does not enable it automatically.

```sql
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
```

- **Test by querying as the user.** Use the Supabase MCP's `execute_sql` with the user's JWT to confirm the policy actually filters.
````

- [ ] **Step 4: Write `references/migration-checklist.md`**

```markdown
# Migration pre-flight checklist

## Before writing the migration

- [ ] Does the change require new RLS? (almost always yes for new tables)
- [ ] Does it depend on a table or column that doesn't exist in staging? (check via Supabase MCP)
- [ ] Are there foreign-key references that need to exist first? (order matters within a single migration)
- [ ] Will any check constraint be tightened? (that's a destructive change — split into two migrations)

## Writing the migration

- [ ] File named `YYYYMMDDHHMMSS_<descriptive_snake_case>.sql`
- [ ] Idempotent if possible (`CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS` — Postgres 15+)
- [ ] `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` for every new table
- [ ] RLS policy SQL in the same file
- [ ] Indexes for foreign keys and any filtered column

## Applying

- [ ] Apply via Supabase MCP (`apply_migration`), never CLI direct
- [ ] After apply: regen types via MCP (`generate_typescript_types`)
- [ ] Commit the type regen in the same PR

## Verification

- [ ] Confirm RLS is on: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = '<table>';`
- [ ] Confirm policy exists: `SELECT polname FROM pg_policy WHERE polrelid = '<table>'::regclass;`
- [ ] Query as a real user via the MCP — does the policy filter as expected?

## Rollback

- Never edit the applied migration.
- Write a new forward migration that reverses the change (`DROP COLUMN`, `DROP POLICY`, etc.).
- Document the reason in the new migration's filename and a header comment.
```

- [ ] **Step 5: Verify frontmatter**

```bash
head -6 .claude/skills/supabase-migration-safety/SKILL.md
```

Expected: starts with `---`, has `name:`, `description:`, `paths:`, ends with `---`.

---

### Task 12: `edge-function-add` skill

**Files:**

- Create: `.claude/skills/edge-function-add/SKILL.md`
- Create: `.claude/skills/edge-function-add/references/function-checklist.md`

- [ ] **Step 1: Create directory and `SKILL.md`**

```bash
mkdir -p .claude/skills/edge-function-add/references
```

```markdown
---
name: edge-function-add
description: >-
  Use when adding or changing an Edge Function under supabase/functions/.
  Walks the gateway conventions — Zod validation, shared CORS helper, JWT
  verify via supabase.auth.getUser, MCP-only deploy.
paths: supabase/functions/**
---

# Adding a Supabase Edge Function

Activates for work in `supabase/functions/`. Follow these steps in order.

1. **Create the function directory** — `supabase/functions/<name>/index.ts`. Name in `kebab-case`.
2. **Handler signature:** `export default async (req: Request): Promise<Response> => { … }`. Deno runtime.
3. **Validate inputs with Zod BEFORE any work.** Parse the URL/query/body into a schema; reject malformed input with a 400 + helpful error envelope.
4. **CORS via the shared helper** in `supabase/functions/_shared/cors.ts`. Never inline `Access-Control-Allow-*` headers per-function.
5. **JWT verify via `supabase.auth.getUser(token)`** — never trust the JWT payload. Extract the token from `Authorization: Bearer …`, hand it to the SDK, get back the user (or a 401).
6. **Secrets via `Deno.env.get('NAME')`** with explicit null check. Missing secret → 500 with a server-side log; never expose env state in the response.
7. **Deploy via Supabase MCP** (`deploy_edge_function`). Local `supabase functions deploy` is for the platform team only.

Full worked example: [references/function-checklist.md](references/function-checklist.md).
```

- [ ] **Step 2: Write `references/function-checklist.md`**

````markdown
# Edge Function — worked example

```ts
// supabase/functions/example/index.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const Body = z.object({
  dossierId: z.string().uuid(),
  payload: z.record(z.unknown()),
})

export default async (req: Request): Promise<Response> => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Auth — verify with the SDK, do not trust the payload
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'missing_token' }, 401)
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return json({ error: 'invalid_token' }, 401)
  }

  // 3. Validate body
  let parsed: z.infer<typeof Body>
  try {
    parsed = Body.parse(await req.json())
  } catch (e) {
    return json({ error: 'validation_failed', details: e.issues }, 400)
  }

  // 4. Business logic (orchestrate; don't put DB queries inline if there's a domain layer)

  // 5. Response
  return json({ ok: true, dossierId: parsed.dossierId }, 200)
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

## Deploy

Via the Supabase MCP in your Claude Code session:

```
mcp__plugin_supabase_supabase__deploy_edge_function({
  project_id: "zkrcjzdemdmwhearhfgg",
  function_name: "example",
  source: <contents of index.ts>,
});
```

## Common mistakes

- **Inlining CORS headers per-function** — breaks consistency, easy to drop one.
- **Reading `Deno.env.get(...)` without null-check** — runtime crash in prod that maps to a generic 500.
- **Returning a body without `Content-Type: application/json`** — some clients treat the response as plain text.
- **Catching `userError` but proceeding anyway** — auth bypass; never do this.
````

- [ ] **Step 3: Verify**

```bash
head -6 .claude/skills/edge-function-add/SKILL.md
test -f .claude/skills/edge-function-add/references/function-checklist.md && echo OK
```

Expected: frontmatter present, `OK`.

---

### Task 13: `dossier-centric-link` skill

**Files:**

- Create: `.claude/skills/dossier-centric-link/SKILL.md`
- Create: `.claude/skills/dossier-centric-link/references/dossier-patterns.md`

- [ ] **Step 1: Create directory and `SKILL.md`**

```bash
mkdir -p .claude/skills/dossier-centric-link/references
```

```markdown
---
name: dossier-centric-link
description: >-
  Use when adding work items, API routes, or UI cards that touch dossiers.
  Enforces the dossier-centric architecture — work_item_dossiers junction,
  inheritance_source, DossierContextBadge, getDossierRouteSegment.
paths:
  - frontend/src/domains/**
  - backend/src/api/**
  - frontend/src/components/**
---

# Dossier-centric linking

Activates for work in domain code and API routes. Intl-Dossier is built around dossiers as the central organizing concept — every new feature must connect to them properly.

## The rules

1. **Every new work item links to its dossiers via the `work_item_dossiers` junction table** — never a foreign-key column directly on the work item.
2. **Always include `inheritance_source`** — one of `direct`, `engagement`, `after_action`, `position`, `mou`. Tracks how the work item came to be associated.
3. **URLs via `getDossierRouteSegment(type)`** — never hardcode `/countries/`, `/organizations/`, etc. The mapping is the only source of truth.
4. **Type validation via `isValidDossierType(type)`** before any cross-type operation.
5. **Show dossier context on work-item UI** with `<DossierContextBadge dossier={…} inheritanceSource="…" />`.
6. **Inheritance chains** resolve via `useResolveDossierContext(parentType, parentId)` — do not walk them by hand.

## When you need detail

- The 8 dossier types, the junction schema, full component usage, and worked SQL: [references/dossier-patterns.md](references/dossier-patterns.md)
```

- [ ] **Step 2: Write `references/dossier-patterns.md`**

This file receives the "Dossier-Centric Development Patterns" section that lived in root CLAUDE.md before Phase B. Copy it from the pre-thin snapshot (`/tmp/CLAUDE.md.pre-thin` from Task 9, Step 1) — full section verbatim, including:

- "Core Principle" subsection
- "Dossier Types (8 total)" table
- "Key Utilities & Functions" code block
- "Component Usage" code block
- "Database Linking Pattern" SQL block
- "Architecture Documentation" link list

Add at the top:

```markdown
# Dossier-centric patterns — deep dive

This is the deep-dive companion to the `dossier-centric-link` skill. Load this when:

- Designing a new feature that needs to know which dossier types apply
- Writing a migration that links a new entity to dossiers
- Building a UI card that displays a work item's dossier context

[… full content moved from pre-thin root CLAUDE.md …]
```

- [ ] **Step 3: Verify**

```bash
grep -q "work_item_dossiers" .claude/skills/dossier-centric-link/references/dossier-patterns.md && echo "patterns ✓"
grep -q "inheritance_source" .claude/skills/dossier-centric-link/SKILL.md && echo "skill ✓"
```

Expected: both ✓.

---

### Task 14: `scoped-tests` skill

**Files:**

- Create: `.claude/skills/scoped-tests/SKILL.md`

- [ ] **Step 1: Create directory and `SKILL.md`**

```bash
mkdir -p .claude/skills/scoped-tests
```

```markdown
---
name: scoped-tests
description: >-
  Use after changing code, before claiming work is done. Picks the narrowest
  pnpm test command instead of running the full suite — saves context and time
  on single-workspace changes.
paths:
  - tests/**
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/*.spec.ts'
---

# Scoped test runner

Running the full suite on a one-workspace change wastes context and time. Pick the narrowest command that still covers the change.

## Decision table

| What you changed                                                  | Run                                                |
| ----------------------------------------------------------------- | -------------------------------------------------- |
| `frontend/src/components/<x>/**`                                  | `pnpm --filter frontend test src/components/<x>`   |
| `frontend/src/domains/<x>/**`                                     | `pnpm --filter frontend test src/domains/<x>`      |
| `frontend/src/routes/**`                                          | `pnpm --filter frontend test src/routes`           |
| `backend/src/api/<feat>/**`                                       | `pnpm --filter backend test src/api/<feat>`        |
| `backend/src/adapters/**`                                         | `pnpm --filter backend test src/adapters`          |
| `supabase/migrations/**`                                          | `pnpm test:integration`                            |
| `supabase/functions/<name>/**`                                    | `pnpm test:integration src/functions/<name>`       |
| `backend/src/core/domain/**` or `shared/**`                       | `pnpm test` (FULL — these are imported everywhere) |
| `frontend/src/design-system/**` or `frontend/public/bootstrap.js` | full frontend suite + visual regression            |

## Rules

- **Shared/core changes → full suite.** `backend/src/core/domain/` and any `shared/**` package ripple everywhere.
- **Single-workspace changes → scoped suite.** A change to `backend/src/api/dossiers` only needs `backend/src/api/dossiers` tests plus any cross-cutting integration tests in `tests/`.
- **Every new UI test covers EN (LTR) and AR (RTL).** Two `render()` calls, one per `dir`/`i18n.language`.
- **AAA structure** — Arrange / Act / Assert blocks, named when non-trivial.

## When in doubt

Run the scoped suite first. If it passes, also run `pnpm typecheck && pnpm lint` to catch anything the scoped tests miss. Only escalate to the full suite if the scoped run flags something cross-cutting.
```

- [ ] **Step 2: Verify**

```bash
head -8 .claude/skills/scoped-tests/SKILL.md
```

Expected: frontmatter has `name`, `description`, multi-line `paths:` list.

---

### Task 15: Commit Phase C

- [ ] **Step 1: Stage and commit**

```bash
git add .claude/skills/
git status
git commit -m "$(cat <<'EOF'
chore(ai-layer): add 4 path-scoped skills

- supabase-migration-safety (paths: supabase/migrations/**)
  Rules: MCP-only apply, RLS on every new table, additive ALTERs,
  forward-only, regen types after schema change, pg_constraint pre-check.
  References: rls-patterns.md, migration-checklist.md.

- edge-function-add (paths: supabase/functions/**)
  Rules: Zod validation, shared CORS helper, supabase.auth.getUser JWT,
  Deno.env.get with null-check, MCP-only deploy.
  References: function-checklist.md (worked example).

- dossier-centric-link (paths: frontend/src/domains/**, backend/src/api/**,
  frontend/src/components/**)
  Rules: work_item_dossiers junction, inheritance_source,
  getDossierRouteSegment, isValidDossierType, DossierContextBadge,
  useResolveDossierContext.
  References: dossier-patterns.md (the deep-dive moved out of root CLAUDE.md).

- scoped-tests (paths: tests/**, **/*.test.ts, **/*.test.tsx)
  Decision table for narrowest pnpm command per workspace.
  Rule: shared/core changes → full; single workspace → scoped.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## PHASE D — Hooks + explorer subagent

### Task 16: `session-start-context.mjs` (SessionStart hook)

**Files:**

- Create: `.claude/hooks/session-start-context.mjs`
- Create: `.claude/hooks/__tests__/session-start-context.test.mjs`

- [ ] **Step 1: Create directories**

```bash
mkdir -p .claude/hooks/__tests__
```

- [ ] **Step 2: Write the hook**

```javascript
#!/usr/bin/env node
/**
 * SessionStart hook — dynamic per-workspace orientation.
 * Walks the repo to find every CLAUDE.md-governed directory, maps
 * `git status --porcelain` files to their nearest governed area, prints
 * a short orientation block to stdout. Claude Code injects stdout into
 * the session context.
 */
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync } from 'node:child_process'

const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.pytest_cache',
  '__pycache__',
  '.venv',
  '.claude',
])

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

function claudeMdAreas(root) {
  const areas = new Set()
  function walk(dir) {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    if (entries.some((e) => e.name === 'CLAUDE.md' && e.isFile()) && dir !== root) {
      areas.add(relative(root, dir).split(/[\\/]/).join('/'))
    }
    for (const e of entries) {
      if (e.isDirectory() && !EXCLUDE_DIRS.has(e.name)) walk(join(dir, e.name))
    }
  }
  walk(root)
  return areas
}

function areaOf(changed, areas) {
  const parts = changed.split('/')
  for (let depth = parts.length - 1; depth > 0; depth--) {
    const c = parts.slice(0, depth).join('/')
    if (areas.has(c)) return c
  }
  return null
}

function workingTreeChanges(root) {
  try {
    const out = execFileSync('git', ['status', '--porcelain'], {
      cwd: root,
      encoding: 'utf-8',
      timeout: 5000,
    })
    return out
      .split('\n')
      .filter((line) => line.length > 3)
      .map((line) => line.slice(3).trim().replace(/\\/g, '/'))
  } catch {
    return []
  }
}

function recentCommits(root, limit = 5) {
  try {
    const out = execFileSync('git', ['log', `-${limit}`, '--pretty=format:%h %s'], {
      cwd: root,
      encoding: 'utf-8',
      timeout: 5000,
    })
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function activeAreas(root, paths) {
  const governed = claudeMdAreas(root)
  const found = new Set()
  for (const p of paths) {
    const a = areaOf(p, governed)
    if (a) found.add(a)
  }
  return [...found].sort()
}

export function buildOrientation(root = projectRoot()) {
  const lines = ['## Intl-Dossier — session orientation', '']
  const changes = workingTreeChanges(root)
  const areas = activeAreas(root, changes)

  if (areas.length > 0) {
    lines.push(`Active area(s) this session: **${areas.join(', ')}**.`)
    lines.push('Load the matching `CLAUDE.md` in each before editing.')
  } else {
    lines.push('Working tree is clean — no area has pending work.')
  }

  const commits = recentCommits(root)
  if (commits.length > 0) {
    lines.push('')
    lines.push('Recent commits (newest first):')
    for (const c of commits) lines.push(`- ${c}`)
  }

  lines.push('')
  lines.push('Use `CODEBASE_MAP.md` to find where a feature lives before exploring.')
  return lines.join('\n')
}

function main() {
  try {
    process.stdin.resume()
    process.stdin.on('data', () => {})
  } catch {}
  console.log(buildOrientation())
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
```

- [ ] **Step 3: Write a smoke test**

```javascript
// .claude/hooks/__tests__/session-start-context.test.mjs
import { strict as assert } from 'node:assert'
import { buildOrientation } from '../session-start-context.mjs'

const out = buildOrientation()
assert(out.includes('Intl-Dossier — session orientation'), 'missing header')
assert(out.includes('CODEBASE_MAP.md'), 'missing CODEBASE_MAP pointer')
assert(
  out.includes('Active area(s)') || out.includes('Working tree is clean'),
  'missing active-area or clean-tree line',
)
console.log('session-start-context.test.mjs: OK')
```

- [ ] **Step 4: Run the test**

```bash
node .claude/hooks/__tests__/session-start-context.test.mjs
```

Expected: `session-start-context.test.mjs: OK`

- [ ] **Step 5: Run the hook standalone**

```bash
node .claude/hooks/session-start-context.mjs < /dev/null
```

Expected: prints an orientation block starting with `## Intl-Dossier — session orientation`.

---

### Task 17: `propose-claude-md.mjs` + `reflect-claude-md.mjs` (Stop hook split)

**Files:**

- Create: `.claude/hooks/propose-claude-md.mjs`
- Create: `.claude/hooks/reflect-claude-md.mjs`
- Create: `.claude/hooks/__tests__/propose-claude-md.test.mjs`

- [ ] **Step 1: Write `propose-claude-md.mjs` (cheap trigger half)**

```javascript
#!/usr/bin/env node
/**
 * Stop hook trigger — cheap, deterministic half of the self-improving AI Layer.
 * Detects which CLAUDE.md-governed areas changed, dedupes via SHA-256 fingerprint
 * of the scoped diff, spawns the reflector in the background, returns immediately.
 * Guards: recursion (INTL_DOSSIER_REFLECT_LOCK=1), dedup (.claude/.claude-md-review-state),
 * spawn failure (logs + exit 0).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'

const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '__pycache__',
  '.venv',
  '.claude',
])
const LOCK_ENV = 'INTL_DOSSIER_REFLECT_LOCK'
const STATE_FILE = '.claude/.claude-md-review-state'
const REFLECTOR = 'reflect-claude-md.mjs'

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

function gitSafe(args, root) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf-8', timeout: 5000 })
  } catch {
    return ''
  }
}

function claudeMdAreas(root) {
  const areas = new Set()
  function walk(dir) {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    if (entries.some((e) => e.name === 'CLAUDE.md' && e.isFile()) && dir !== root) {
      areas.add(relative(root, dir).split(/[\\/]/).join('/'))
    }
    for (const e of entries) {
      if (e.isDirectory() && !EXCLUDE_DIRS.has(e.name)) walk(join(dir, e.name))
    }
  }
  walk(root)
  return areas
}

function areaOf(changed, areas) {
  const parts = changed.split('/')
  for (let depth = parts.length - 1; depth > 0; depth--) {
    const c = parts.slice(0, depth).join('/')
    if (areas.has(c)) return c
  }
  return null
}

function touchedAreas(root) {
  const governed = claudeMdAreas(root)
  const touched = new Set()
  for (const line of gitSafe(['status', '--porcelain'], root).split('\n')) {
    if (line.length <= 3) continue
    const path = line.slice(3).trim().replace(/\\/g, '/')
    const a = areaOf(path, governed)
    if (a) touched.add(a)
  }
  return touched
}

function diffFingerprint(root, areas) {
  const raw = gitSafe(['diff', 'HEAD', '--', ...[...areas].sort()], root)
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

function spawnReflector(reflectorPath, root) {
  try {
    const child = spawn(process.execPath, [reflectorPath], {
      cwd: root,
      detached: true,
      stdio: 'ignore',
      env: process.env,
    })
    child.unref()
    return true
  } catch (err) {
    process.stderr.write(`[self-improving hook] could not start reflector: ${err.message}\n`)
    return false
  }
}

function main() {
  try {
    process.stdin.resume()
    process.stdin.on('data', () => {})
  } catch {}

  if (process.env[LOCK_ENV]) return 0

  const root = projectRoot()
  const areas = touchedAreas(root)
  if (areas.size === 0) return 0

  const fp = diffFingerprint(root, areas)
  const statePath = join(root, STATE_FILE)
  try {
    const prev = readFileSync(statePath, 'utf-8').trim()
    if (prev === fp) return 0
  } catch {
    /* no prior state */
  }

  const reflectorPath = join(root, '.claude/hooks', REFLECTOR)
  try {
    statSync(reflectorPath)
  } catch {
    process.stderr.write(`[self-improving hook] ${REFLECTOR} missing — skipped\n`)
    return 0
  }

  if (!spawnReflector(reflectorPath, root)) return 0

  try {
    mkdirSync(join(root, '.claude'), { recursive: true })
    writeFileSync(statePath, fp, 'utf-8')
  } catch {
    /* best-effort */
  }

  process.stderr.write(
    `[self-improving hook] ${areas.size} area(s) changed ` +
      `(${[...areas].sort().join(', ')}) — reflecting in background → .claude/claude-md-review.md\n`,
  )
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main())
}

export { touchedAreas, diffFingerprint, claudeMdAreas }
```

- [ ] **Step 2: Write `reflect-claude-md.mjs` (LLM-call half)**

````javascript
#!/usr/bin/env node
/**
 * Reflector — the reasoning half of the self-improving Stop hook.
 * Reads scoped diff + touched-area CLAUDE.mds, asks headless `claude -p` to
 * judge whether the conventions still hold, writes proposal to
 * .claude/claude-md-review.md. Deterministic fallback if `claude` is missing
 * or fails. Recursion guard via INTL_DOSSIER_REFLECT_LOCK.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '__pycache__',
  '.venv',
  '.claude',
])
const LOCK_ENV = 'INTL_DOSSIER_REFLECT_LOCK'
const REVIEW_FILE = '.claude/claude-md-review.md'
const MAX_DIFF_CHARS = 12_000
const CLAUDE_TIMEOUT_MS = 180_000

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

function gitSafe(args, root) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf-8', timeout: 10_000 })
  } catch {
    return ''
  }
}

function claudeMdAreas(root) {
  const areas = new Set()
  function walk(dir) {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    if (entries.some((e) => e.name === 'CLAUDE.md' && e.isFile()) && dir !== root) {
      areas.add(relative(root, dir).split(/[\\/]/).join('/'))
    }
    for (const e of entries) {
      if (e.isDirectory() && !EXCLUDE_DIRS.has(e.name)) walk(join(dir, e.name))
    }
  }
  walk(root)
  return areas
}

function areaOf(changed, areas) {
  const parts = changed.split('/')
  for (let depth = parts.length - 1; depth > 0; depth--) {
    const c = parts.slice(0, depth).join('/')
    if (areas.has(c)) return c
  }
  return null
}

function touchedAreas(root) {
  const governed = claudeMdAreas(root)
  const counts = {}
  for (const line of gitSafe(['status', '--porcelain'], root).split('\n')) {
    if (line.length <= 3) continue
    const path = line.slice(3).trim().replace(/\\/g, '/')
    const a = areaOf(path, governed)
    if (a) counts[a] = (counts[a] || 0) + 1
  }
  return counts
}

function buildPrompt(root, areas, diff) {
  const blocks = []
  for (const area of Object.keys(areas).sort()) {
    const claudeMd = join(root, area, 'CLAUDE.md')
    let content
    try {
      content = readFileSync(claudeMd, 'utf-8')
    } catch {
      content = '(this area has no CLAUDE.md yet)'
    }
    blocks.push(`### ${area}/CLAUDE.md\n\n${content}`)
  }
  return [
    "You are auditing whether a codebase's CLAUDE.md files still match reality",
    'after a coding session. CLAUDE.md is the instruction file an AI coding agent',
    'loads for that part of the repo.',
    '',
    "Below is the git diff of the session's uncommitted changes, then the current",
    'CLAUDE.md for every area that changed.',
    '',
    'For EACH area, output exactly one of:',
    '- `No change needed` — the CLAUDE.md still holds; or',
    '- a concrete proposed edit: the specific line(s) to add, change, or remove,',
    '  plus one sentence on why.',
    '',
    'Only propose an update when the diff introduces a genuine new convention,',
    'gotcha, command, or constraint that the CLAUDE.md does not yet capture. Do',
    'not propose stylistic rewrites. Be terse. Respond in plain text; do not use',
    'tools.',
    '',
    '## Git diff (uncommitted work this session)',
    '',
    '```diff',
    diff,
    '```',
    '',
    '## Current CLAUDE.md file(s)',
    '',
    blocks.join('\n\n'),
  ].join('\n')
}

function runClaude(prompt, root) {
  let claudePath
  try {
    claudePath = execFileSync('which', ['claude'], { encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
  if (!claudePath) return null

  const env = { ...process.env, [LOCK_ENV]: '1' }
  const result = spawnSync(claudePath, ['-p', '--output-format', 'text'], {
    cwd: root,
    input: prompt,
    encoding: 'utf-8',
    env,
    timeout: CLAUDE_TIMEOUT_MS,
  })
  if (result.error || result.status !== 0) return null
  const out = (result.stdout || '').trim()
  return out || null
}

function deterministicNote(root, areas, stamp) {
  const lines = [
    `# CLAUDE.md review — ${stamp}`,
    '',
    '_`claude` CLI unavailable — deterministic fallback. The areas below changed this session; re-check their CLAUDE.md by hand._',
    '',
  ]
  for (const area of Object.keys(areas).sort()) {
    const claudeMd = join(root, area, 'CLAUDE.md')
    let exists = false
    try {
      statSync(claudeMd)
      exists = true
    } catch {}
    if (exists) {
      lines.push(
        `- **${area}** (${areas[area]} file(s)) — re-read \`${area}/CLAUDE.md\`: do its conventions still hold?`,
      )
    } else {
      lines.push(
        `- **${area}** (${areas[area]} file(s)) — no \`${area}/CLAUDE.md\` exists; consider adding one.`,
      )
    }
  }
  return lines.join('\n') + '\n'
}

function reflect() {
  if (process.env[LOCK_ENV]) return 0

  const root = projectRoot()
  const areas = touchedAreas(root)
  if (Object.keys(areas).length === 0) return 0

  let diff = gitSafe(['diff', 'HEAD', '--', ...Object.keys(areas).sort()], root)
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + '\n... (diff truncated for the reflection)'
  }
  if (!diff.trim()) return 0

  const stamp = new Date().toISOString().slice(0, 19)
  const reflection = runClaude(buildPrompt(root, areas, diff), root)

  let body, mode
  if (reflection) {
    body =
      `# CLAUDE.md review — ${stamp}\n\n` +
      `_Reflection by \`claude -p\` over ${Object.keys(areas).length} touched area(s): ` +
      `${Object.keys(areas).sort().join(', ')}._\n\n` +
      `${reflection}\n`
    mode = 'LLM reflection'
  } else {
    body = deterministicNote(root, areas, stamp)
    mode = 'deterministic fallback'
  }

  const reviewPath = join(root, REVIEW_FILE)
  try {
    mkdirSync(join(root, '.claude'), { recursive: true })
    writeFileSync(reviewPath, body, 'utf-8')
  } catch (err) {
    process.stderr.write(`[reflector] could not write ${REVIEW_FILE}: ${err.message}\n`)
    return 1
  }
  process.stderr.write(`[reflector] wrote ${REVIEW_FILE} (${mode})\n`)
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(reflect())
}

export { reflect, touchedAreas, claudeMdAreas, buildPrompt }
````

- [ ] **Step 3: Write smoke tests**

```javascript
// .claude/hooks/__tests__/propose-claude-md.test.mjs
import { strict as assert } from 'node:assert'
import { claudeMdAreas, diffFingerprint } from '../propose-claude-md.mjs'
import { spawnSync } from 'node:child_process'

const root = process.cwd()

// Test 1: claudeMdAreas discovers governed areas
const areas = claudeMdAreas(root)
assert(areas.size > 0, 'should find at least one CLAUDE.md area after Phase A')
console.log(`✓ claudeMdAreas: found ${areas.size} area(s): ${[...areas].slice(0, 5).join(', ')}`)

// Test 2: diffFingerprint is stable
const fp1 = diffFingerprint(root, new Set(['backend']))
const fp2 = diffFingerprint(root, new Set(['backend']))
assert.equal(fp1, fp2, 'fingerprint must be stable')
assert.equal(fp1.length, 64, 'SHA-256 hex is 64 chars')
console.log(`✓ diffFingerprint: stable, 64-char SHA-256`)

// Test 3: hook exits 0
const result = spawnSync(process.execPath, ['.claude/hooks/propose-claude-md.mjs'], {
  cwd: root,
  encoding: 'utf-8',
  input: '',
})
assert.equal(result.status, 0, `hook should exit 0, got ${result.status}; stderr: ${result.stderr}`)
console.log(`✓ propose-claude-md hook exits 0`)

// Test 4: recursion guard
const guarded = spawnSync(process.execPath, ['.claude/hooks/propose-claude-md.mjs'], {
  cwd: root,
  encoding: 'utf-8',
  input: '',
  env: { ...process.env, INTL_DOSSIER_REFLECT_LOCK: '1' },
})
assert.equal(guarded.status, 0, 'guarded run must exit 0')
assert.equal(guarded.stderr, '', 'guarded run must produce no output')
console.log(`✓ recursion guard no-ops when INTL_DOSSIER_REFLECT_LOCK=1`)

console.log('propose-claude-md.test.mjs: OK')
```

- [ ] **Step 4: Run tests**

```bash
node .claude/hooks/__tests__/propose-claude-md.test.mjs
```

Expected: all four `✓` lines + `propose-claude-md.test.mjs: OK`.

- [ ] **Step 5: Smoke-test the reflector standalone (deterministic-fallback path)**

```bash
# Only meaningful if there are uncommitted changes in a governed area.
# Force the no-claude path by clearing PATH to verify the fallback branch.
mkdir -p /tmp/empty-path-test
PATH=/tmp/empty-path-test node .claude/hooks/reflect-claude-md.mjs
test -f .claude/claude-md-review.md && head -5 .claude/claude-md-review.md
```

Expected: with uncommitted changes in a governed area, a markdown file starting with `# CLAUDE.md review — <timestamp>` and the deterministic fallback prose. If working tree is clean, the script exits 0 silently — that's correct.

- [ ] **Step 6: Make hooks executable**

```bash
chmod +x .claude/hooks/session-start-context.mjs .claude/hooks/propose-claude-md.mjs .claude/hooks/reflect-claude-md.mjs
```

---

### Task 18: Update `.claude/settings.json`

**Files:**

- Modify: `.claude/settings.json`

- [ ] **Step 1: Read current settings.json**

```bash
cat .claude/settings.json
```

- [ ] **Step 2: Update the file**

Preserve existing keys (`permissions`, `env`, anything else already present). Merge in:

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm test:*)",
      "Bash(pnpm typecheck:*)",
      "Bash(pnpm lint:*)",
      "Bash(pnpm --filter:*)",
      "Bash(node .claude/hooks/:*)"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start-context.mjs\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/propose-claude-md.mjs\""
          }
        ]
      }
    ]
  }
}
```

If `permissions.allow` already exists, append the 5 new entries to its array. If `hooks` already exists, merge SessionStart and Stop entries with existing ones — Claude Code runs all entries; don't drop pre-existing hooks.

- [ ] **Step 3: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json', 'utf-8')); console.log('valid')"
```

Expected: `valid`.

---

### Task 19: Create `explorer` subagent

**Files:**

- Create: `.claude/agents/explorer.md`

- [ ] **Step 1: Write the agent definition**

````markdown
---
name: explorer
description: >-
  Read-only subsystem explorer. Dispatch this BEFORE editing an unfamiliar
  area — it maps the subsystem in its own context window and reports back, so
  the main agent edits with the full picture instead of burning context on
  discovery. Implements the article's "split exploration from editing" pattern.
tools: Read, Grep, Glob
model: sonnet
---

# Explorer subagent

You map one subsystem of the Intl-Dossier monorepo. You are **genuinely read-only**: your only tools are `Read`, `Grep`, and `Glob` — no `Write`, `Edit`, or `Bash`. The restriction is the guarantee, not a polite request.

## When you are invoked

You will be given one subsystem to map — typically a path like:

- `backend/src/api/<feature>/`
- `backend/src/core/domain/<aggregate>/`
- `frontend/src/domains/<feature>/`
- `frontend/src/components/<feature>/`
- `supabase/functions/<name>/`
- `supabase/migrations/` (for a sweep — RLS policies, schema sections)

## What to do

1. **Read that subsystem's `CLAUDE.md` first** if one exists (walking up to the nearest governed area — `backend/CLAUDE.md`, `frontend/CLAUDE.md`, etc.).
2. **Glob the entry points.** For backend: `routes.ts`, `index.ts`, `*.controller.ts`. For frontend: `index.ts`, route files, the main component. For migrations: `CREATE TABLE`/`CREATE POLICY` declarations.
3. **Grep for imports** — what does this subsystem import from `shared/`, `backend/src/core/domain/`, `frontend/src/design-system/`? What imports IT (reverse-grep)?
4. **Identify gotchas** — shared state, RLS policies, type contracts, error hierarchies, anything surprising.
5. **Return your findings as your final report**, structured under these exact headings.

## Return format

```markdown
## <Subsystem name>

### Entry points

- `path/to/file.ts` — what work starts here

### Key types & functions

- `TypeName` (`path/to/file.ts:LINE`) — purpose
- `functionName()` (`path/to/file.ts:LINE`) — purpose

### Dependencies

- **Imports from:** `shared/...`, `backend/src/core/domain/...`
- **Imported by:** `path/to/consumer.ts`, ...

### Gotchas

- Surprise that would bite an editor

### Suggested fixes

- Describe (only). You cannot apply changes.
```

## How your output is used

Your report **is** your output. The parent agent receives it as your final tool result and decides what to edit with the full picture in hand. If a persistent record is wanted, the parent writes your report to `docs/exploration/<subsystem>.md` — writing files is not your job and not your capability.

## Why read-only

Running exploration and editing in one session spends the editing context on discovery. A separate read-only explorer keeps them apart. Having no write tools is the guarantee of that separation, not a polite request you could break.
````

- [ ] **Step 2: Verify**

```bash
head -8 .claude/agents/explorer.md
grep -q "tools: Read, Grep, Glob" .claude/agents/explorer.md && echo OK
```

Expected: frontmatter visible, `OK`.

---

### Task 20: Commit Phase D

- [ ] **Step 1: Commit**

```bash
git add .claude/hooks/ .claude/agents/explorer.md .claude/settings.json
git status
git commit -m "$(cat <<'EOF'
chore(ai-layer): add self-improving hooks + explorer subagent

Hooks (Node.js ESM, no deps):
- session-start-context.mjs — prints orientation block on session start
  (active CLAUDE.md areas + recent commits + CODEBASE_MAP pointer).
- propose-claude-md.mjs — Stop trigger; computes touched areas + diff
  fingerprint, dedupes against .claude/.claude-md-review-state, spawns
  reflector detached, returns immediately.
- reflect-claude-md.mjs — runs detached; calls headless `claude -p` to
  reflect on the scoped diff + current CLAUDE.mds, writes proposal to
  .claude/claude-md-review.md. Deterministic fallback if `claude` is
  unavailable. Recursion guard via INTL_DOSSIER_REFLECT_LOCK.

Subagent:
- explorer.md — tools: Read, Grep, Glob only. Maps one subsystem and
  returns a structured report; parent does all writes.

settings.json: SessionStart + Stop wiring, pnpm permissions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## PHASE E — Meta-doc

### Task 21: Create `AI-LAYER.md`

**Files:**

- Create: `AI-LAYER.md` (repo root)

- [ ] **Step 1: Write the file**

````markdown
# Intl-Dossier AI Layer

The harness around Claude Code in this repo — the configuration, context, and reusable workflows that make an agent productive _in this codebase specifically_. Adapted from Anthropic's article [_How Claude Code works in large codebases: best practices and where to start_](https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start) and Cole Medin's [`coleam00/helpline`](https://github.com/coleam00/helpline) companion repo.

**Article thesis:** the harness — the ecosystem built around the model — determines how Claude Code performs more than the model alone.

## Extension points — article → artifact

| Extension point                 | Article guidance                                                                                                                      | Built here                                                                                                                                                                                                                                                    | Location                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **CLAUDE.md hierarchy**         | Loaded first; lean root, subdirectory files load additively as Claude walks the tree                                                  | Lean root (~5KB) + 5 per-workspace files                                                                                                                                                                                                                      | `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`, `supabase/CLAUDE.md`, `tests/CLAUDE.md`, `frontend/src/design-system/CLAUDE.md` |
| **Hooks**                       | Self-improving setup, not just prevention. A Stop hook can reflect on a session and propose CLAUDE.md updates while context is fresh. | `SessionStart` prints dynamic orientation. `Stop` splits into a cheap trigger (`propose`) and a detached LLM reflector (`reflect`) that writes proposed edits to `.claude/claude-md-review.md`. Recursion guard + fingerprint dedup + deterministic fallback. | `.claude/hooks/session-start-context.mjs`, `propose-claude-md.mjs`, `reflect-claude-md.mjs`                                             |
| **Skills**                      | On-demand expertise, progressive disclosure, scoped to specific paths                                                                 | 4 skills, each with `paths:` frontmatter + `references/` for deep detail                                                                                                                                                                                      | `.claude/skills/supabase-migration-safety/`, `edge-function-add/`, `dossier-centric-link/`, `scoped-tests/`                             |
| **Subagents**                   | Split exploration from editing — read-only mapper, separate context window                                                            | `explorer` — `tools: Read, Grep, Glob` only. Returns a structured report.                                                                                                                                                                                     | `.claude/agents/explorer.md`                                                                                                            |
| **Codebase map + ignore rules** | Make the codebase navigable; cut noise from search                                                                                    | `CODEBASE_MAP.md` (find-a-feature index) + extended `.claudeignore`                                                                                                                                                                                           | `CODEBASE_MAP.md`, `.claudeignore`                                                                                                      |
| **LSP**                         | Symbol-level precision instead of text-pattern false positives                                                                        | Existing TS toolchain via IDE tsserver — no separate setup needed                                                                                                                                                                                             | (IDE-provided)                                                                                                                          |
| **MCP**                         | Expose structured search as callable tools                                                                                            | Existing MCP coverage (`auggie__codebase-retrieval`, `plugin_supabase_supabase`, etc.)                                                                                                                                                                        | `.mcp.json`                                                                                                                             |
| **Plugins**                     | Bundle skills/hooks/MCP into installable packages                                                                                     | Not adopted — solo project, no team distribution need                                                                                                                                                                                                         | n/a                                                                                                                                     |

## Configuration patterns (from the article, applied here)

### Pattern 1 — Make the codebase navigable

- **Lean root CLAUDE.md** (~5KB pointers) + 5 per-workspace files
- **`CODEBASE_MAP.md`** — find where a feature lives before reading files
- **`.claudeignore`** — excludes generated artifacts, lockfiles, agent worktrees
- **Scoped test commands** — the `scoped-tests` skill picks the narrowest pnpm command instead of the full suite

### Pattern 2 — Actively maintain CLAUDE.md as models evolve

- The **`Stop` hook** is the proactive half. `propose-claude-md.mjs` cheaply detects which areas changed; `reflect-claude-md.mjs` asks headless `claude -p` to reflect on the diff against current CLAUDE.mds and draft concrete edits into `.claude/claude-md-review.md`. Recursion guard via `INTL_DOSSIER_REFLECT_LOCK`. Deterministic fallback if `claude` is unavailable.
- **Review cadence:** a full `CLAUDE.md` / skills / hooks review every **3–6 months**, and after any major model release. Rules written for an older model's limits become drag once newer models can handle more — delete them when that happens.

### Pattern 3 — Ownership

Solo project — single DRI is the project owner. No plugin marketplace needed; configuration lives in version control and travels with the repo.

## Manual verification

After any AI Layer change, run these by hand:

```bash
node .claude/hooks/session-start-context.mjs < /dev/null     # prints orientation block
node .claude/hooks/propose-claude-md.mjs < /dev/null         # exits 0 cleanly
node .claude/hooks/__tests__/session-start-context.test.mjs  # smoke test
node .claude/hooks/__tests__/propose-claude-md.test.mjs      # smoke tests
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json'))" && echo "settings.json valid"
```
````

- [ ] **Step 2: Verify referenced links resolve**

```bash
for path in CLAUDE.md backend/CLAUDE.md frontend/CLAUDE.md supabase/CLAUDE.md tests/CLAUDE.md frontend/src/design-system/CLAUDE.md CODEBASE_MAP.md .claudeignore .claude/hooks/session-start-context.mjs .claude/hooks/propose-claude-md.mjs .claude/hooks/reflect-claude-md.mjs .claude/agents/explorer.md .claude/skills/supabase-migration-safety .claude/skills/edge-function-add .claude/skills/dossier-centric-link .claude/skills/scoped-tests; do
  test -e "$path" && echo "✓ $path" || echo "✗ $path"
done
```

Expected: every line `✓`. Any `✗` means a prior task did not produce the expected artifact — go back and fix before committing.

---

### Task 22: Commit Phase E and final verification

- [ ] **Step 1: Commit AI-LAYER.md**

```bash
git add AI-LAYER.md
git commit -m "$(cat <<'EOF'
docs(ai-layer): add AI-LAYER.md meta-doc

Maps every article extension point to the artifact built in this repo.
The reading entry point for understanding the AI Layer in one pass.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 2: Final cross-cutting verification**

```bash
git log --oneline -5
node .claude/hooks/__tests__/session-start-context.test.mjs
node .claude/hooks/__tests__/propose-claude-md.test.mjs
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json'))" && echo "settings ✓"
wc -c CLAUDE.md
```

Expected: 5 atomic commits in `git log`, both smoke tests print `OK`, `settings ✓`, root CLAUDE.md ≤ 6000 bytes.

- [ ] **Step 3: Optional — end-to-end live test of the self-improving hook**

In a _new_ Claude Code session in this repo:

1. Make a small change to any file under `backend/` (e.g. add a comment to a file in `backend/src/api/`).
2. End the turn (let the Stop hook fire).
3. Wait ~30s for the background reflector.
4. `cat .claude/claude-md-review.md` — should show either an LLM reflection or the deterministic fallback note, scoped to `backend`.
5. Revert the change.

This step is optional because it requires a fresh session and the headless `claude` binary on PATH — but it's the only way to confirm the full reflection loop wires through.

---

## Done

After Task 22, the AI Layer is complete:

- 5 atomic commits (`chore(ai-layer)` × 3, `refactor(ai-layer)` × 1, `docs(ai-layer)` × 1)
- 6 CLAUDE.md files (5 sub + 1 thinned root)
- 4 skills with progressive-disclosure references
- 3 hooks + 2 smoke tests
- 1 read-only explorer subagent
- `CODEBASE_MAP.md` + `AI-LAYER.md`
- Updated `.claudeignore`, `.gitignore`, `.claude/settings.json`

The Stop hook will now propose CLAUDE.md updates after sessions that touched governed areas — review `.claude/claude-md-review.md` and apply edits by hand when the suggestions are good.
