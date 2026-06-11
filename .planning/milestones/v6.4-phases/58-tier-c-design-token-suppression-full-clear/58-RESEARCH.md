# Phase 58: Tier-C Design-Token Suppression Full Clear — Research

**Researched:** 2026-05-19
**Domain:** Mechanical Tailwind palette-literal → semantic-token swap; wave-staged PR closure; visual baseline regen
**Confidence:** HIGH (live grep + audit-doc cross-checked; all D-decisions reconciled to source)

## Summary

Phase 58 is a **mechanical refactor**, not a feature build. Goal: delete every `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:` annotation in `frontend/src/` by swapping the raw Tailwind palette literal it suppresses to a semantic-token utility (`text-success`, `bg-danger/10`, `border-warning/20`, `text-accent`, `bg-secondary` / `text-secondary-foreground`, etc.). Live grep at the research baseline (`phase-57-base` @ `f16c3b63`) finds **2227 Tier-C disable lines in 268 unique files** — three audit-listed files (`KanbanTaskCard.tsx`, `KanbanBoard.tsx`, `pages/engagements/workspace/TasksTab.tsx`) are already Tier-C-clean (swept by Phases 52/57), explaining the 271→268 file delta from the CONTEXT.md headline number. The 2336 AST-Literal count from 51-VERIFICATION.md is the AST-level figure and is unaffected by file deletion; reconciliation is documented in 51-VERIFICATION D-12.

Every swap target utility already exists in `frontend/src/index.css` `@theme` (lines 43-118) — no new tokens, no `tailwind.config.ts` edits, no `index.css` edits. The state tokens (`--danger`, `--ok`, `--warn`, `--info`) are runtime-mode-flipped by `frontend/src/design-system/tokens/buildTokens.ts:59-69` (light/dark OKLCH pairs swapped per `isDark` flag), which is precisely why D-09 lets text-\* drop its `dark:` variant — the consuming utility automatically inherits the correct OKLCH at theme-flip time. D-08's bg/border alpha-bump preserves explicit dark variants where authors wrote them.

**Primary recommendation:** Ship the manifest in Wave 0 as a deterministic CSV-shaped markdown table (271 rows), then execute Waves 1-6 as `1 PR per wave × N atomic-per-file commits`. Hand-edit Waves 1-3 (lower volume + nuanced dark-variant handling); evaluate a `jscodeshift` or `ast-grep` codemod after Wave 1 for Waves 4-6 only if Wave 1's edit patterns are mechanically uniform. Reuse `frontend/src/lib/semantic-colors.ts` helpers (`getStatusBadgeClass`, `getDossierTypeBadgeClass`, `getPriorityBadgeClass`, `getActivityTypeBadgeClass`, `getInteractionTypeBadgeClass`) where the file's literal corresponds to a known semantic family — prevents parallel-map drift.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Wave Taxonomy & Ordering**

- **D-01: Wave shape = strict ROADMAP 5 surfaces + 6th catch-all.** Six waves keyed to ROADMAP §4 surfaces:
  1. `forms` — `components/forms/**`, `components/empty-states/**`, `components/advanced-search/**`, `components/duplicate-detection/**`, form-shaped leaf components
  2. `tables` — `components/audit-logs/**` (table-shaped), `components/bulk-actions/**` (SelectableDataTable family), `components/assignments/KanbanTaskCard.tsx`, list-table leaves
  3. `drawers-dialogs` — `*Drawer.tsx`, `*Dialog.tsx`, `*Modal.tsx` leaves across all dirs
  4. `dossier-rail` — `components/dossier/**` (20 files), `components/dossier-recommendations/**`, `components/dossier-timeline/**`
  5. `charts-residue` — chart-adjacent leaves NOT already in Tier-B carve-out (e.g., `components/sla-monitoring/**` filters, analytics leaves not in carve-out)
  6. `pages-routes-misc` — `routes/_protected/**`, `pages/**`, plus long-tail dirs (compliance, calendar, commitments, positions, waiting-queue, intelligence, etc.) that don't fit waves 1-5
- **D-02: Wave order = low-risk → high-risk.** `forms → tables → drawers-dialogs → dossier-rail → charts-residue → pages-routes-misc`
- **D-03: 1 PR per wave + Wave-0 manifest PR.** Wave 0 commits `58-WAVE-MANIFEST.md` FIRST with deterministic file→wave assignment. Total PRs: 7 (1 manifest + 6 surface waves)
- **D-04: 1 atomic commit per file inside each wave PR.** Each commit: swap all literals in 1 file + delete its `Phase 51 Tier-C:` annotation lines + run `pnpm lint frontend/src/<file>` green

**Token Swap Mapping (mechanical)**

- **D-05: Color-family → token mapping LOCKED:**
  - red / rose → `text-danger`, `bg-danger/N`, `border-danger/N`
  - amber / yellow / orange → `text-warning`, `bg-warning/N`, `border-warning/N`
  - green / emerald / lime → `text-success`, `bg-success/N`, `border-success/N`
  - blue → `text-accent` (links/CTAs) **OR** `text-info` (badges/informational) per audit row
  - sky / cyan / teal → `text-info`, `bg-info/N`, `border-info/N`
  - gray / slate / zinc / neutral / stone → `text-muted-foreground`, `bg-muted`, `border-line`
- **D-06: Purple-family → text-accent family (full clear).** purple, violet, fuchsia, pink, indigo all map to `accent` family
- **D-07: Blue+purple collision rule = blue→accent, purple→accent-soft.** When a single file contains BOTH blue-family AND purple-family literals, purple-family overrides to `bg-secondary` / `text-secondary-foreground` / `border-secondary`

**Dark-Variant Alpha Policy**

- **D-08: bg/border preserve dark variant with alpha bump.** `bg-X-100 dark:bg-X-900/30` → `bg-{semantic}/10 dark:bg-{semantic}/30`. `border-X-200 dark:border-X-800` → `border-{semantic}/20 dark:border-{semantic}/80`. Alpha: Tailwind 100→10, 200→20, …, 900→90; dark-variant alpha bumped one tier
- **D-09: text-\* drops dark variant entirely.** `text-X-700 dark:text-X-300` → `text-{semantic}` (NO dark variant)
- **D-10: dark-variant default ladder per surface.** No NET-NEW dark variant pairs

**Per-Wave Verification & Visual Baseline**

- **D-11: Per-wave full gate.** Before merging Wave N+1, Wave N PR must pass: `pnpm lint` 0, `pnpm type-check` 0, affected visual specs regenerated, affected unit tests green, `grep -rn "Phase 51 Tier-C" frontend/src` returns zero matches inside wave's file set
- **D-12: Per-wave visual baseline regen + LTR≠RTL byte check.** Each wave PR re-runs affected visual specs with `--update-snapshots`, re-asserts LTR vs RTL baselines byte-distinct (Phase 57 D-22 contract), and commits regenerated PNGs in the SAME wave PR
- **D-13: Criterion #2 ("`eslint.config.mjs` waiver token removal") = N/A documented.** ROADMAP §criterion-2 paraphrases the marker as `gsd-design-token-tier-c-allow` — that marker never existed in code. Actual marker is per-line `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:`. No Tier-C-specific block, allowlist, or comment-marker exception exists in `eslint.config.mjs` today

**Closure & Tag**

- **D-14: Test-coupling — same-PR updates.** Any test that grepped for an old palette class string updates in the SAME wave PR that swaps the source file. No separate "test-fix follow-up PR"
- **D-15: Phase-58-base annotated SSH-signed tag on closure.** After Wave 6 merges and final verification gate (D-11) passes, cut `phase-58-base` annotated + SSH-signed tag
- **D-16: 51-DESIGN-AUDIT.md closure annotation.** Final wave PR appends `## Phase 58 Closure` section documenting total swap count, 271 files / 2336 AST nodes / 2227 disable-lines reconciliation, cross-link to `58-VERIFICATION.md`, deferred-tier-c → cleared mapping

### Claude's Discretion

- Exact swap-pattern script (sed / codemod / manual edit) — pick per file complexity during planning. Mechanical files (lookup-table types) use codemod; nuanced files (drawers with composite conditionals) hand-edit
- Exact wave PLAN.md task ordering inside each wave (atomic-file granularity from manifest)
- Visual-spec selection per wave (read `58-WAVE-MANIFEST.md` `regen_targets` column; if a spec doesn't appear but touches the wave's files, regen anyway)
- PR titles + branch names (follow v6.4 milestone naming: `phase-58/wave-N-<surface>`)
- Closure-commit message format (follow repo convention from `git log phase-57-base..HEAD`)

### Deferred Ideas (OUT OF SCOPE)

- **Net-new design tokens for purple/violet** — explicitly OOS per v6.4 REQUIREMENTS.md
- **Tier-B carve-out audit / shrinking** — `eslint.config.mjs:247-270` 16-file carve-out (charts, flags, bootstrap, signature-visuals) is intentional per Phase 51 D-03/D-13
- **Codemod tool generalization** — if Wave 1 produces a reusable codemod, preserve in `tools/codemods/` for v7.0+ but do NOT bake into Phase 58 deliverables
- **Snapshot-spec consolidation** — Phase 58 only regenerates baselines; does not consolidate
- **51-DESIGN-AUDIT.md migration to historical archive** — leave in 51 folder
- **`gsd-design-token-tier-c-allow` marker rename in ROADMAP §criterion-2** — cosmetic, out of scope
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID           | Description                                                                                                                                                                                             | Research Support                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TOKEN-01** | Zero `// gsd-design-token-tier-c-allow` suppressions remaining — full clear of 271 suppressions / 2336 AST nodes via token swaps, wave-staged by surface (forms, tables, charts, drawers, dossier rail) | Live-grep canonicalizes 268 files / 2227 disable lines (3 already-cleared files: `KanbanTaskCard.tsx`, `KanbanBoard.tsx`, `pages/engagements/workspace/TasksTab.tsx`). 51-DESIGN-AUDIT.md Tier-C Disposition Table provides per-file `proposed_token_map` (D-05). All swap-target utilities already exist in `frontend/src/index.css` `@theme`. Wave taxonomy (D-01..D-04) pre-locked. Tier-A precedent files (`FormCompletionProgress.tsx`, `EditingLockIndicator.tsx`, `AvailabilityPollResults.tsx`) demonstrate canonical swap shape |
| **TOKEN-02** | `pnpm lint` exits 0 without the Tier-C waiver token present in `eslint.config.mjs` (waiver removed from config; lint clean without it)                                                                  | D-13 disambiguation: no Tier-C-specific block, allowlist, or comment-marker exception exists in `eslint.config.mjs` at planning baseline (verified by `grep -n "tier-c\|Tier-C\|design-token-tier" eslint.config.mjs` → zero structural matches). The `designTokenSyntaxRestrictions` selectors (lines 10-28) at `error` severity, plus the Tier-B carve-out (lines 247-270, OOS), are the only design-token-rule machinery. TOKEN-02 satisfied by absence — closure verified by repeat grep returning zero matches                      |

</phase_requirements>

## Architectural Responsibility Map

| Capability                                                           | Primary Tier                                                                | Secondary Tier                                       | Rationale                                                                                          |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Palette literal → semantic token swap                                | Browser / Client (TSX leaf components)                                      | —                                                    | Pure UI-string refactor; all targets in `frontend/src/**`                                          |
| ESLint `no-restricted-syntax` enforcement                            | Build tooling (eslint.config.mjs)                                           | CI (`Lint` required context)                         | The enforcement that catches regressions lives in lint config + CI; `pnpm lint` exit 0 is the gate |
| Visual baseline integrity                                            | E2E (Playwright `*-visual.spec.ts`)                                         | CI (visual-regression context)                       | Each wave's swap must not regress LTR/RTL byte-distinct baselines                                  |
| Test-coupling regression (`expect(...).toHaveClass('text-red-600')`) | Unit (Vitest)                                                               | —                                                    | Same-PR updates per D-14                                                                           |
| Token definition (the swap targets)                                  | Design system (`frontend/src/index.css` `@theme` + `tokens/buildTokens.ts`) | —                                                    | Already locked; no edits needed in Phase 58 — Phase 58 only CONSUMES the existing token utilities  |
| Git tag signing for `phase-58-base`                                  | Developer machine (SSH key + allowed_signers)                               | GitHub (Signing Key enrollment for "Verified" badge) | Per CLAUDE.md §"Tag signing setup"; already configured for phase-NN-base tags through Phase 57     |

## Standard Stack

### Core

| Library                        | Version                 | Purpose                                                                    | Why Standard                                                                                                                            |
| ------------------------------ | ----------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind CSS v4                | 4.x (already installed) | Utility generator for `bg-success`, `text-danger`, etc. via `@theme` block | [VERIFIED: codebase] Used everywhere; `frontend/src/index.css:43-118` defines all `--color-*` aliases the swap targets resolve to       |
| `eslint` + `typescript-eslint` | (already installed)     | The `no-restricted-syntax` selectors that detect palette literals          | [VERIFIED: codebase] `eslint.config.mjs:10-28`                                                                                          |
| Playwright                     | (already installed)     | Visual regression specs (`*-visual.spec.ts`)                               | [VERIFIED: codebase] `frontend/tests/e2e/*-visual.spec.ts` (12 specs, see Visual-Spec Impact Map)                                       |
| Vitest                         | (already installed)     | Unit tests including 2 that grep palette literals                          | [VERIFIED: codebase] `frontend/tests/unit/FormInput.test.tsx`, `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` |

### Supporting

| Library                               | Version   | Purpose                                                 | When to Use                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------- | --------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/lib/semantic-colors.ts` | (in-repo) | Canonical status/priority/dossier-type/activity helpers | When a file's literal corresponds to a known semantic family (status, priority, dossier-type, activity, interaction). Reuse `getStatusBadgeClass`, `getDossierTypeBadgeClass`, `getPriorityBadgeClass`, `getActivityTypeBadgeClass`, `getInteractionTypeBadgeClass`. **DO NOT** introduce a parallel map [VERIFIED: codebase] |

### Alternatives Considered

| Instead of          | Could Use                     | Tradeoff                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hand-edit per file  | `jscodeshift` AST codemod     | Pro: deterministic on simple lookup tables (e.g. `types/legislation.types.ts` with 63 disables). Con: D-07 blue+purple collision rule + D-08 alpha-bump need per-file context; AST codemod can't decide accent vs accent-soft from collision presence alone. Recommendation: hand-edit Waves 1-3, evaluate codemod for Waves 4-6 |
| `sed` regex codemod | `ast-grep` structural codemod | `sed` is fragile against multi-line `dark:` patterns and `cn(...)` calls. `ast-grep` understands TSX literals. Not installed; would need `pnpm add -D` (out of scope per OOS clause if it forces a new dependency). Stick with hand-edit                                                                                         |
| Single mega-PR      | 6 wave PRs (D-03)             | Mega-PR is unreviewable at 268 files / ~4625 occurrences. Wave PRs honor D-01..D-04 locked decisions                                                                                                                                                                                                                             |

**Installation:**

None required. All swap-target Tailwind utilities and helper functions already exist in the repo. No `pnpm add`, no new tools.

**Version verification:** N/A — no new package installs in Phase 58.

## Package Legitimacy Audit

**N/A — Phase 58 installs no new packages.** Every swap target (`text-success`, `bg-danger`, `border-line`, `bg-secondary`, etc.) resolves through `frontend/src/index.css` `@theme` block to existing CSS variables defined in `:root` and updated by `frontend/src/design-system/tokens/buildTokens.ts`. Every helper function reused (`getStatusBadgeClass`, etc.) already exists in `frontend/src/lib/semantic-colors.ts`. If Wave 1 evaluation surfaces a codemod tool that would materially reduce risk (e.g., `jscodeshift`), it goes into the Deferred Ideas list per CONTEXT.md, not Phase 58.

## Architecture Patterns

### System Architecture Diagram

```
                         Phase 58 closure workflow
                         =========================

   ┌─────────────────────┐       ┌─────────────────────────────────┐
   │  phase-57-base tag  │       │  51-DESIGN-AUDIT.md             │
   │  (origin / signed)  │──────▶│  Tier-C Disposition Table       │
   └─────────────────────┘       │  (271 rows × proposed_token_map)│
              │                  └────────────────┬────────────────┘
              ▼                                   │
   ┌─────────────────────────────────────────────▼────────┐
   │  Wave 0: 58-WAVE-MANIFEST.md                          │
   │  - audit_slug → wave assignment (271 rows)            │
   │  - blue_purple_collision flag (79 files)              │
   │  - dark_variant_present flag                          │
   │  - multi_literal_line flag                            │
   │  - regen_targets list (per file)                      │
   │  - test_grep_hits flag (3 files)                      │
   └─────────────────────────────┬─────────────────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
       Wave 1: forms      Wave 2: tables      Wave 3: drawers-dialogs
       (≈18 files)        (≈18 files)         (≈18 files)
            │                    │                    │
            ▼                    ▼                    ▼
       Wave 4: dossier-   Wave 5: charts-    Wave 6: pages-routes-misc
       rail (≈27)         residue (≈15)     (≈172 — catch-all)
            │                    │                    │
            └────────────────────┴────────────────────┘
                                 │
                                 ▼
            Per-wave full gate (D-11):
              pnpm lint 0 · pnpm type-check 0 ·
              affected visual specs regen + LTR≠RTL byte-distinct (D-12) ·
              affected unit tests green · grep -rn "Phase 51 Tier-C" wave-files == 0
                                 │
                                 ▼
            Wave 6 merges + final gate
                                 │
                                 ▼
            ┌────────────────────────────────────────────┐
            │  51-DESIGN-AUDIT.md ## Phase 58 Closure    │
            │  section appended (D-16)                   │
            │  + phase-58-base annotated SSH-signed tag  │
            │  pushed to origin (D-15)                   │
            └────────────────────────────────────────────┘
```

### Recommended Project Structure

No new structure. Phase 58 edits only existing files:

```
frontend/src/                              # only changed files: 268 Tier-C files
├── components/                            # 175 Tier-C files across Waves 1-5
├── routes/_protected/                     # 18 files, Wave 6
├── pages/                                 # 35 files, Wave 6
├── types/                                 # 22 .types.ts files, Wave 6
├── hooks/ + domains/ + lib/ + router/     # 6 files, Wave 6
└── (no edits to:)
    ├── index.css                          # @theme block already correct
    ├── design-system/tokens/              # token defs already correct
    └── styles/list-pages.css              # legacy bridge — DO NOT TOUCH

.planning/phases/58-tier-c-design-token-suppression-full-clear/
├── 58-CONTEXT.md                          # already committed
├── 58-RESEARCH.md                         # this file
├── 58-WAVE-MANIFEST.md                    # Wave 0 deliverable
├── 58-00-wave-manifest-PLAN.md            # Wave 0 plan
├── 58-01-wave-1-forms-PLAN.md             # Wave 1 plan
├── 58-02-wave-2-tables-PLAN.md            # Wave 2 plan
├── 58-03-wave-3-drawers-dialogs-PLAN.md   # Wave 3 plan
├── 58-04-wave-4-dossier-rail-PLAN.md      # Wave 4 plan
├── 58-05-wave-5-charts-residue-PLAN.md    # Wave 5 plan
├── 58-06-wave-6-pages-routes-misc-PLAN.md # Wave 6 plan
└── 58-VERIFICATION.md                     # post-closure
```

### Pattern 1: Canonical Tier-A Swap Shape (Reuse Template)

**What:** The 50 Tier-A files already swapped under Plan 51-02/51-03 are the canonical reference. Read these BEFORE starting any Wave PR.

**When to use:** Always — every Wave PR's first task should be "read 2-3 Tier-A precedent files for the swap shape".

**Example:** `frontend/src/components/forms/FormCompletionProgress.tsx` (from live read, line 56-280):

```tsx
// Source: frontend/src/components/forms/FormCompletionProgress.tsx (Tier-A reference)

// BEFORE (Tier-C suppression form):
//   // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#FormCompletionProgress
//   bg-amber-100 dark:bg-amber-900/30
//   // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#FormCompletionProgress
//   text-amber-700 dark:text-amber-300

// AFTER (Tier-A target shape):
if (percentage === 100) return 'bg-success'
if (percentage >= 75) return 'bg-warning'
return 'bg-muted'

// In JSX:
<CheckCircle2 className="w-5 h-5 text-success" />
<AlertCircle  className="w-5 h-5 text-danger" />
<AlertTriangle className="w-5 h-5 text-warning" />
<CircleDot className="w-5 h-5 text-info" />

// Composite (D-08 bg + border + D-09 text-* no-dark):
'bg-success/10 text-success dark:bg-success/30 dark:text-success'
// ↑ Note: text-success kept WITHOUT dark variant per D-09 — but here author kept
//   `dark:text-success` (a no-op since semantic ink tokens are mode-invariant via
//   buildTokens.ts state-token swap). D-09 says DROP this; the canonical Wave PRs
//   should remove the redundant `dark:text-success` mirror.
```

### Pattern 2: D-07 Blue+Purple Collision (per-file)

**What:** When a file has BOTH blue-family and purple-family literals (79 files identified, see Wave Surface Mapping), the purple-family overrides to `bg-secondary` / `text-secondary-foreground` / `border-secondary` (`--color-secondary` resolves to `var(--accent-soft)` and `--color-secondary-foreground` to `var(--accent-ink)` per `index.css:96-97`).

**Example:** `components/activity-feed/ActivityFeedFilters.tsx` (live grep — 49 disables, 13 blue, 10 purple literals):

```tsx
// Source: frontend/src/components/activity-feed/ActivityFeedFilters.tsx (lines 88-130)

// BEFORE:
//   country: { ..., color: 'text-blue-600' },
//   organization: { ..., color: 'text-purple-600' },
//   person: { ..., color: 'text-green-600' },
//   theme: { ..., color: 'text-pink-600' },
//   brief: { ..., color: 'text-violet-600' },

// AFTER (D-07 collision rule applied):
country: { ..., color: 'text-accent' },              // blue → accent
organization: { ..., color: 'text-secondary-foreground' }, // purple → accent-ink
person: { ..., color: 'text-success' },              // green → success
theme: { ..., color: 'text-secondary-foreground' },  // pink (purple-family) → accent-ink
brief: { ..., color: 'text-secondary-foreground' },  // violet (purple-family) → accent-ink
```

### Pattern 3: D-08 / D-09 Dark-Variant Handling (lookup-table types)

**What:** Files with explicit `dark:` variants (especially `types/*.types.ts` lookup tables) follow D-08 for bg/border (preserve+alpha-bump) and D-09 for text-\* (drop dark variant).

**Example:** `frontend/src/types/legislation.types.ts` (live read — 63 disables across `bg-X-50 dark:bg-X-900/20`, `text-X-700 dark:text-X-300`, `border-X-200 dark:border-X-700` triples):

```tsx
// Source: frontend/src/types/legislation.types.ts (lines 89-118 as observed)

// BEFORE:
//   bg: 'bg-gray-50 dark:bg-gray-900/20',
//   text: 'text-gray-700 dark:text-gray-300',
//   border: 'border-gray-200 dark:border-gray-700',
//   bg: 'bg-blue-50 dark:bg-blue-900/20',
//   text: 'text-blue-700 dark:text-blue-300',
//   border: 'border-blue-200 dark:border-blue-700',

// AFTER:
bg: 'bg-muted/5 dark:bg-muted/20',                   // gray-50 → muted/5; dark:gray-900/20 → muted/20
text: 'text-muted-foreground',                        // dropped dark variant per D-09
border: 'border-line dark:border-line/70',           // gray-200 → border-line; dark:gray-700 → border-line/70 (alpha bump)
bg: 'bg-info/10 dark:bg-info/30',                    // blue badge → info; D-08 alpha bump (50→10, 900/20→/30)
text: 'text-info',                                    // dropped dark variant per D-09
border: 'border-info/20 dark:border-info/80',        // 200→20, 700→80
```

### Pattern 4: Reuse `semantic-colors.ts` Helpers (Don't Hand-Roll)

**What:** When a file's literal palette corresponds to a known semantic family, replace the inline literal with the helper.

**Example:** `frontend/src/lib/semantic-colors.ts` `statusColors`, `priorityColors`, `dossierTypeColors`, `activityTypeColors`, `interactionTypeColors` already exist with canonical mappings. **DO NOT** add a parallel map in any Tier-C file.

### Anti-Patterns to Avoid

- **Adding NEW semantic tokens** — banned by v6.4 OOS clause. Use `accent`, `accent-soft`, `accent-ink`, `secondary` family for purple-family overrides; never invent `--purple` or `--violet`
- **Modifying the Tier-B carve-out (`eslint.config.mjs:247-270`)** — chart/flag/bootstrap exceptions are intentional per Phase 51 D-03/D-13. Touching them is OOS
- **Touching `frontend/src/styles/list-pages.css`** — the `legacy-tailwind-token-bridge` block (lines 1113-1450) deliberately retains `[class~='text-red-600']`, `[class~='bg-blue-50']`, `[class~='border-gray-200']` selectors. `frontend/tests/unit/design-system/handoff-css-contract.test.ts:60-67` asserts these strings remain. The bridge is a CSS file (no JS Literals → ESLint Tier-C rule doesn't apply); it must stay byte-identical
- **Touching `tools/eslint-fixtures/bad-design-token.tsx`** — positive-failure fixture; ESLint MUST continue to error on it
- **Leaving partial annotation orphans** — every deleted `Phase 51 Tier-C:` line must correspond to a swapped literal in the same commit
- **Adding NET-NEW dark variants** where source had none (D-10)
- **Snapshot regen in a separate PR** — D-12 mandates same-PR regen
- **Cross-wave file claim** — every file appears in EXACTLY ONE wave per manifest (D-03)
- **`--no-verify` on commits/merge** — signing/hooks intact per repo convention
- **Manual `git push --force` to main** — branch protection blocks; never needed in Phase 58

## Don't Hand-Roll

| Problem                                    | Don't Build                      | Use Instead                                                                                                              | Why                                                                                                                                          |
| ------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Status/priority badge color map            | New `Record<Status, ColorSet>`   | `frontend/src/lib/semantic-colors.ts` — `statusColors`, `priorityColors`, `getStatusBadgeClass`, `getPriorityBadgeClass` | Single source of truth; prevents drift                                                                                                       |
| Dossier-type color map                     | New per-component lookup         | `dossierTypeColors` / `getDossierTypeBadgeClass` from same file                                                          | Already canonicalized                                                                                                                        |
| Activity/interaction badge                 | Inline literal                   | `getActivityTypeBadgeClass`, `getInteractionTypeBadgeClass`                                                              | Same                                                                                                                                         |
| Dark-mode class duplication for state text | `text-success dark:text-success` | `text-success` alone                                                                                                     | `--ok`/`--warn`/`--info`/`--danger` are flipped at runtime by `buildTokens.ts:59-69` per `isDark`; the `dark:` variant on text-\* is a no-op |
| Alpha-bump arithmetic                      | Per-file judgement               | D-08 deterministic ladder (100→10, 200→20, …, 900→90; dark bumps one tier)                                               | Mechanical, lossless                                                                                                                         |
| Codemod from scratch                       | Custom regex `sed`               | `jscodeshift` or `ast-grep` (if absolutely needed)                                                                       | But: D-07 collision and D-08 alpha policy need per-file context; hand-edit + reuse of `semantic-colors.ts` is safer                          |

**Key insight:** The bulk of "Don't hand-roll" energy in Phase 58 is **don't re-invent the color maps that already exist in `semantic-colors.ts`** — the 50 Tier-A swaps already demonstrate the consume-pattern. Tier-C swaps follow the same shape.

## Runtime State Inventory

> Phase 58 is a code-only refactor in `frontend/src/**`. There is no rename, no migration, no rebrand, no string-replace against external systems. Runtime state inventory below is included for completeness; all categories return "None — verified by inspection".

| Category            | Items Found                                                                                                                                      | Action Required |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| Stored data         | None — no database keys, no Mem0 user_ids, no Redis keys, no n8n workflow content reference `gsd-design-token-tier-c-allow` or any Tier-C marker | none            |
| Live service config | None — no Datadog tags, Tailscale ACL tags, Cloudflare Tunnel names reference the marker                                                         | none            |
| OS-registered state | None — no Windows Task Scheduler, pm2, launchd, systemd registrations carry the marker                                                           | none            |
| Secrets/env vars    | None — no SOPS keys, .env vars, CI/CD env vars reference the marker                                                                              | none            |
| Build artifacts     | None — Tier-C marker exists only in TSX source. No compiled artifacts, no pip egg-info, no Docker image tags carry it                            | none            |

**Canonical question answer:** _After every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?_ — **Nothing**. The marker is source-code-only and there is no rename happening; the marker is being **deleted** (not renamed to a new value), so there is no "old vs new" drift to manage.

## Common Pitfalls

### Pitfall 1: Disable-line count ≠ AST-node count

**What goes wrong:** Counting `Phase 51 Tier-C` disable lines gives 2227; counting AST Literal/TemplateElement nodes gives 2336; counting palette-literal substring occurrences gives ≈4625. Using the wrong number in closure docs causes audit-trail confusion.
**Why it happens:** ESLint per-line semantics means one `// eslint-disable-next-line` covers multiple literals on the next line; some literal STRINGS contain multiple class-name substrings (`bg-blue-50 dark:bg-blue-900/20` is one string but two semantic class names).
**How to avoid:** D-12 closure-grep methodology counts removed `^-.*Phase 51 Tier-C` lines vs the source-of-truth 2227 disable-line count from 51-DESIGN-AUDIT.md. The 51-VERIFICATION reconciliation note (lines 8-17) is canonical.
**Warning signs:** Closure-summary lists a count that doesn't match `grep -c "Phase 51 Tier-C" frontend/src` against `phase-57-base`.

### Pitfall 2: D-09 mis-read as "remove all `dark:` variants"

**What goes wrong:** Author drops `dark:bg-success/30` in addition to `dark:text-success`; dark-mode background tint loses its visual hierarchy.
**Why it happens:** D-08 and D-09 differ — bg/border PRESERVE+alpha-bump, text-_ DROPS.
**How to avoid:** Distinct mental model: state-token RUNTIME swap (light/dark OKLCH pairs in `buildTokens.ts`) makes `dark:text-X` redundant. But `bg-X/N` alpha **is** a per-mode visual choice — `dark:bg-X/30` strengthens the tint in dark mode. Don't conflate.
**Warning signs:** Pre/post diff shows a `dark:bg-_`deletion (NOT just a`dark:text-\*` deletion).

### Pitfall 3: Touching `list-pages.css` legacy bridge

**What goes wrong:** Author searches for `text-red-600` and "fixes" the legacy bridge in `frontend/src/styles/list-pages.css`; `frontend/tests/unit/design-system/handoff-css-contract.test.ts` breaks.
**Why it happens:** Search-and-destroy reflex; the test asserts the bridge selectors remain.
**How to avoid:** Phase 58 scope is `frontend/src/**/*.{tsx,ts}` ONLY. CSS files are out of scope. List-pages.css bridge is intentional.
**Warning signs:** `pnpm test:unit handoff-css-contract` fails after a wave PR.

### Pitfall 4: Touching `eslint-fixtures/bad-design-token.tsx`

**What goes wrong:** Author "fixes" the fixture; Phase 59 POLISH-04 positive-failure assertion can't trigger.
**How to avoid:** The fixture is outside `frontend/src/` (it's in `tools/eslint-fixtures/`); follow scope strictly.
**Warning signs:** Grep for `text-red-500` matches the fixture file after a wave PR.

### Pitfall 5: LTR vs RTL baseline collapse

**What goes wrong:** After visual-spec `--update-snapshots`, LTR and RTL PNGs are byte-identical (Phase 57 D-22 violation).
**Why it happens:** A swap accidentally removed direction-dependent class application (`ms-*` vs `me-*` mis-paired, or `text-start` swapped to `text-left`).
**How to avoid:** D-12 contract — after each `--update-snapshots`, run `diff <ltr-png> <rtl-png>` and assert exit-code non-zero. Same check the verifier will run.
**Warning signs:** Visual spec passes but `diff frontend/tests/e2e/<spec>-snapshots/<name>-ltr-*.png frontend/tests/e2e/<spec>-snapshots/<name>-rtl-*.png` exits 0.

### Pitfall 6: Re-introducing parallel color maps

**What goes wrong:** A wave PR introduces an inline `Record<Status, ColorSet>` in a Tier-C file instead of importing from `semantic-colors.ts`.
**How to avoid:** Read `semantic-colors.ts` before swapping any file whose literals carry status/priority/dossier-type/activity/interaction semantics. Reuse helpers.
**Warning signs:** New `Record<.*, { bg: ..., text: ..., border: ...}>` block appears in a Wave PR diff.

### Pitfall 7: Annotation orphan after partial swap

**What goes wrong:** Author swaps the literal but forgets to delete the `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:` comment above it; the comment becomes a dangling reference to a vanished violation.
**How to avoid:** Per-commit checklist: "literals swapped" + "annotation lines deleted" + "`pnpm lint frontend/src/<file>` exit 0" must all hold for the atomic commit.
**Warning signs:** `pnpm lint frontend/src/<file>` flags `Unused eslint-disable directive` after a wave commit.

### Pitfall 8: Wave 6 ballooning

**What goes wrong:** Wave 6 becomes 172+ files at PR-time, making review intractable.
**Why it happens:** "Catch-all" wave; everything not claimed by W1-W5 ends up here.
**How to avoid:** Wave 0 manifest pre-allocates ALL 268 files; if W6 exceeds ~80 files, raise the cap to the planner and consider re-bucketing borderline files into earlier waves.
**Warning signs:** `wc -l` of W6-claimed files in the manifest exceeds 80.

## Code Examples

### Wave-Boundary Detection (Wave 0 manifest builder logic)

```bash
# Live-grep canonical file list
grep -rln "Phase 51 Tier-C" frontend/src | sed 's|^.*frontend/src/||' | sort -u > .planning/phases/58-tier-c-design-token-suppression-full-clear/manifest-input.txt

# Bucket by wave (deterministic order — applied in this exact sequence; first match wins)
# Wave 1: forms
grep -E "^(components/forms|components/empty-states|components/advanced-search|components/duplicate-detection|components/duplicate-comparison|components/form-auto-save|components/actionable-errors|components/active-filters|components/validation)/" manifest-input.txt > wave-1.txt

# Wave 2: tables
grep -E "^(components/audit-logs|components/bulk-actions|components/elected-officials|components/entity-comparison|components/scheduled-reports|components/version-history-viewer|components/version-comparison|components/risk-list|components/triage-panel|components/working-groups)/" manifest-input.txt > wave-2.txt

# Wave 3: drawers-dialogs (filename pattern)
grep -iE "(Drawer|Dialog|Modal)\.tsx$" manifest-input.txt > wave-3.txt

# Wave 4: dossier-rail
grep -E "^(components/dossier|components/dossier-recommendations|components/dossier-timeline|components/dossiers|pages/dossiers)/" manifest-input.txt > wave-4.txt

# Wave 5: charts-residue
grep -E "^(components/analytics|components/sla-monitoring|components/sla-countdown|components/dashboard-widgets|components/realtime-status|components/offline-indicator|components/scenario-sandbox|components/signature-visuals)/" manifest-input.txt > wave-5.txt

# Wave 6: catch-all (everything not yet claimed)
sort -u wave-{1..5}.txt > claimed.txt
comm -23 manifest-input.txt claimed.txt > wave-6.txt
```

### D-12 LTR≠RTL Byte-Distinction Check

```bash
# After Playwright update-snapshots for a wave's specs:
for snap_dir in frontend/tests/e2e/*-visual.spec.ts-snapshots/; do
  spec_name=$(basename "$snap_dir" -snapshots/)
  for variant in 1280 768; do
    ltr="$snap_dir${spec_name%-visual.spec.ts}-ltr-$variant-chromium-darwin.png"
    rtl="$snap_dir${spec_name%-visual.spec.ts}-rtl-$variant-chromium-darwin.png"
    if [[ -f "$ltr" && -f "$rtl" ]]; then
      if cmp -s "$ltr" "$rtl"; then
        echo "FAIL: $ltr and $rtl are byte-identical (D-22 violation)"
        exit 1
      fi
    fi
  done
done
echo "OK: all LTR/RTL pairs byte-distinct"
```

### Tier-A Reference Files (read these BEFORE Wave 1)

```bash
# Read all 4 in sequence — these are the canonical swap shape:
cat frontend/src/components/forms/FormCompletionProgress.tsx       # 36-literal example
cat frontend/src/components/forms/UnifiedFileUpload.tsx            # 32-literal example
cat frontend/src/components/collaboration/EditingLockIndicator.tsx # warning-only example
cat frontend/src/components/availability-polling/AvailabilityPollResults.tsx # status example
```

## State of the Art

| Old Approach                                                                                                    | Current Approach                                                                          | When Changed              | Impact                                                                                            |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| Raw Tailwind palette literals (`text-red-600`, `bg-blue-100`) gated behind per-line `eslint-disable` (Phase 51) | Mechanical swap to semantic tokens (`text-danger`, `bg-info/10`) consuming `@theme` block | Phase 58 (v6.4)           | Removes 2227 suppression annotations; preserves all visual semantics; lint stays 0 without waiver |
| Inline color maps duplicated per component                                                                      | `semantic-colors.ts` helper functions                                                     | Phase 47 / Phase 51       | Single source; reuse via `getStatusBadgeClass(...)`                                               |
| Per-component `dark:` variants for text state tokens                                                            | Runtime OKLCH swap in `buildTokens.ts` (mode-invariant text)                              | Phase 33-06 + Phase 40-15 | D-09 codifies dropping the redundant `dark:text-X`                                                |

**Deprecated/outdated:**

- The string `gsd-design-token-tier-c-allow` in ROADMAP §"Phase 58 — Success Criterion 2" never existed in code — D-13 documents this as paraphrase. Verifier should grep for `Phase 51 Tier-C` (actual marker), not the ROADMAP wording.

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                                                                                                                                                                                                               | Section                    | Risk if Wrong                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Codemod evaluation (`jscodeshift`/`ast-grep`) is a _consideration_, not a commitment — planner picks per-file complexity per Claude's Discretion (CONTEXT.md §"Claude's Discretion")                                                                                                                                                                                                                                | Alternatives Considered    | Low — if codemod proves wrong, hand-edit fallback is always safe; no time wasted on tooling install                                                                                                                 |
| A2  | The 79 blue+purple collision files identified via simultaneous-presence grep is a **superset** of files needing D-07 treatment — some "blue" matches may be `bg-blue-500/0` (opacity edge) or comment text. Manifest must verify each per-file before flipping `blue_purple_collision=yes`                                                                                                                          | Wave-Surface Mapping below | Medium — over-marking causes extra `bg-secondary` swaps that visually pass anyway (purple→accent-soft is the right semantic); under-marking causes blue+purple visual collision (purple stays accent, same as blue) |
| A3  | 1520 multi-literal-lines I counted is overcounted vs. the 91-delta from 51-VERIFICATION because my regex matches substring (e.g. `bg-blue-50 dark:bg-blue-900` counts as 2). Phase 51's 91-delta is AST-Literal-count vs disable-line-count. **Use 51-VERIFICATION's 91 as canonical**, not my 1520 — but flag in manifest the files where 2+ literals appear _in distinct string literals on the same source line_ | Per-File Metrics           | Medium — if Wave 0 manifest mis-flags multi_literal_line, individual file swap may miss the second literal. Mitigation: every commit's `pnpm lint frontend/src/<file>` exit-0 check catches missed swaps            |
| A4  | Wave-6 catch-all sized to ≈172 files in my bucketing is a planning-time concern; the planner may redistribute borderline `components/calendar/*` and `components/commitments/*` (the largest sub-leftover groups) into more granular surfaces if W6 grows unwieldy                                                                                                                                                  | Wave Surface Mapping       | Low — D-01 permits the catch-all; if planner restructures, it stays within the 1-PR-per-wave constraint                                                                                                             |
| A5  | The "deferred-tier-c" `proposed_token_map` entries in 51-DESIGN-AUDIT.md that say "purple/violet/fuchsia/pink/indigo -> TBD (likely chart-token cleanup wave)" are **resolved by Phase 58 D-06** to map to `accent` family (with D-07 collision override). The audit doc closure annotation (D-16) must reflect this resolution                                                                                     | TOKEN-01 support           | Low — confirmed by reading CONTEXT.md decisions; D-06 explicitly closes the TBD                                                                                                                                     |
| A6  | The 2336 vs 2227 vs 2336 (audit) vs 2245 (D-12 grep) count discrepancies are pre-existing source-vs-doc reconciliation, captured in 51-VERIFICATION D-12; Phase 58 closure document must NOT attempt to "fix" these — it documents `original count = 2336 AST nodes / 2245 source lines added (D-12) / 2227 surviving disable lines at phase-57-base` and shows the closure delta                                   | TOKEN-01 closure           | Low — 51-VERIFICATION provides the canonical reconciliation note (lines 8-17)                                                                                                                                       |

## Wave Surface Mapping

> Per-wave file allocation derived from live grep at `phase-57-base` baseline. Wave 0 manifest will canonicalize.

### Per-Wave File Counts (Live Bucketing)

| Wave      | Surface           | Bucketing Rule                                                                                                                                                                           | File Count                  |
| --------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 0         | manifest          | `58-WAVE-MANIFEST.md` itself                                                                                                                                                             | 1 doc                       |
| 1         | forms             | `components/(forms\|empty-states\|advanced-search\|duplicate-detection\|duplicate-comparison\|form-auto-save\|actionable-errors\|active-filters\|validation)/**`                         | 18                          |
| 2         | tables            | `components/(audit-logs\|bulk-actions\|elected-officials\|entity-comparison\|scheduled-reports\|version-history-viewer\|version-comparison\|risk-list\|triage-panel\|working-groups)/**` | 18                          |
| 3         | drawers-dialogs   | filename ends `Drawer.tsx\|Dialog.tsx\|Modal.tsx` (any dir)                                                                                                                              | 18                          |
| 4         | dossier-rail      | `components/(dossier\|dossier-recommendations\|dossier-timeline\|dossiers)/**` + `pages/dossiers/**`                                                                                     | 27                          |
| 5         | charts-residue    | `components/(analytics\|sla-monitoring\|sla-countdown\|dashboard-widgets\|realtime-status\|offline-indicator\|scenario-sandbox\|signature-visuals)/**` minus Tier-B carve-out            | 15                          |
| 6         | pages-routes-misc | `routes/_protected/**` (18) + `pages/**` (33) + `types/**` (22) + `hooks/+domains/+lib/+router/` (6) + unclaimed `components/**` (≈98)                                                   | ≈172 (catch-all)            |
| **Total** |                   |                                                                                                                                                                                          | **268** (matches live grep) |

**Wave 6 sub-bucketing recommendation:** Within Wave 6's PR, organize atomic commits in this internal order to keep review tractable:

1. `types/*.types.ts` (22 files — lookup tables, mechanical D-08/D-09 pattern, ideal codemod candidate)
2. `hooks/ + domains/ + lib/ + router/` (6 files — sparse, hand-edit)
3. `routes/_protected/**` (18 files — page routes)
4. `pages/**` (33 files — page components)
5. `components/calendar/**` + `components/commitments/**` + remaining unclaimed components (≈98 files — leaf components by sub-dir)

### Per-File Density (Top 25 by Tier-C disable count)

| Disables | File                                                          | Notes                                                                                                                                                 |
| -------: | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
|       68 | `components/dossiers/CustomNodes.tsx`                         | React-Flow node renderers; check Tier-B carve-out — may be misclassified (graph viz); needs flagged-row treatment                                     |
|       63 | `types/legislation.types.ts`                                  | Pure lookup table; ideal codemod candidate (W6)                                                                                                       |
|       62 | `components/search/DossierFirstSearchResults.tsx`             | Search result chrome (W6)                                                                                                                             |
|       53 | `components/triage-panel/TriagePanel.tsx`                     | W2                                                                                                                                                    |
|       49 | `components/activity-feed/ActivityFeedFilters.tsx`            | W6; blue+purple collision (D-07)                                                                                                                      |
|       45 | `types/meeting-minutes.types.ts`                              | Lookup table (W6)                                                                                                                                     |
|       41 | `components/activity-feed/EnhancedActivityFeed.tsx`           | W6; blue+purple collision                                                                                                                             |
|       40 | `domains/search/hooks/useSavedSearchTemplates.ts`             | W6; hook with embedded color map                                                                                                                      |
|       38 | `components/duplicate-comparison/DuplicateComparison.tsx`     | W1                                                                                                                                                    |
|       37 | `types/compliance.types.ts`                                   | Lookup table (W6)                                                                                                                                     |
|       36 | `components/entity-links/EntitySearchDialog.tsx`              | W3                                                                                                                                                    |
|       35 | `types/commitment-deliverable.types.ts`                       | Lookup table (W6)                                                                                                                                     |
|       28 | `components/export-import/ImportValidationResults.tsx`        | W6                                                                                                                                                    |
|       26 | `components/dossier/DossierTypeGuide.tsx`                     | W4; blue+purple collision                                                                                                                             |
|       25 | `types/sla.types.ts`                                          | Lookup table (W6)                                                                                                                                     |
|       25 | `components/stakeholder-timeline/StakeholderTimelineCard.tsx` | W6                                                                                                                                                    |
|       24 | `types/availability-polling.types.ts`                         | Lookup table (W6)                                                                                                                                     |
|       23 | `types/commitment.types.ts`                                   | Lookup table (W6)                                                                                                                                     |
|       23 | `components/bulk-actions/BulkActionPreviewDialog.tsx`         | W2/W3 boundary — bulk-actions is W2 but `Dialog.tsx` is W3. **Per D-04 atomic-file rule, manifest must pick one; recommend W3 (filename trumps dir)** |
|       21 | `types/engagement-recommendation.types.ts`                    | Lookup table (W6)                                                                                                                                     |

**Critical surfacing for the planner:**

- `components/dossiers/CustomNodes.tsx` has 68 disables but is a React-Flow node renderer — verify it is NOT in the Tier-B carve-out. If it should be carved out (graph viz), CONTEXT.md/D-13 confirms the carve-out is OOS for Phase 58 — but the carve-out path patterns (`eslint.config.mjs:247-270`) don't list `dossiers/CustomNodes.tsx`. So it stays in Phase 58 scope; flag in manifest's `override_notes` column for chromatic regression watching
- `components/bulk-actions/BulkActionPreviewDialog.tsx` — wave-boundary collision (bulk-actions=W2, \*Dialog.tsx=W3). D-04 atomic-file rule forces one assignment. Recommend **filename pattern wins**: it's a Dialog → Wave 3
- The 22 `types/*.types.ts` files (most uniformly mechanical) are the strongest codemod candidate; planner may prototype a `jscodeshift` transform JUST for these and hand-edit the rest

### Blue+Purple Collision Files (79 candidates for D-07 treatment)

Live-grep result counts both blue-family (`blue|sky|cyan|teal|indigo`) and purple-family (`purple|violet|fuchsia|pink`) literals per file. **Note A2:** This is a superset; manifest must verify each per-file before flipping `blue_purple_collision=yes`.

Sample (top 25 by combined density):

| File                                                    | Blue hits | Purple hits | Wave |
| ------------------------------------------------------- | --------: | ----------: | ---- |
| `components/activity-feed/ActivityFeedFilters.tsx`      |        13 |          10 | W6   |
| `components/activity-feed/EnhancedActivityFeed.tsx`     |        10 |           9 | W6   |
| `components/dossier/DossierTypeGuide.tsx`               |         9 |           6 | W4   |
| `components/dossier/TopicDossierDetail.tsx`             |         6 |           9 | W4   |
| `components/dossier-timeline/DossierTimeline.tsx`       |         6 |           2 | W4   |
| `components/approval-chain/ApprovalChain.tsx`           |         4 |           1 | W6   |
| `components/calendar/CalendarEmptyWizard.tsx`           |         4 |           2 | W6   |
| `components/collaboration/ConflictResolutionDialog.tsx` |         4 |           1 | W3   |
| `components/dashboard-widgets/EventsWidget.tsx`         |         3 |           3 | W5   |
| `components/bulk-actions/BulkActionPreviewDialog.tsx`   |         3 |           1 | W3   |
| `components/dashboard-widgets/NotificationsWidget.tsx`  |         2 |           2 | W5   |
| `components/dossier/DossierTypeSelector.tsx`            |         3 |           2 | W4   |
| `components/contacts/InteractionTimeline.tsx`           |         1 |           1 | W6   |
| `components/calendar/CalendarEntryForm.tsx`             |         2 |           2 | W6   |
| `components/dashboard-widgets/TaskListWidget.tsx`       |         2 |           2 | W5   |

(Full list: 79 files. Generate during Wave 0 manifest build via the bucketing script in Code Examples.)

### Test-Grep Hits (3 files — same-PR updates per D-14)

Only 3 unit-test files reference Tailwind palette literals; all must be updated in the same wave PR that swaps the source.

| Test File                                                                        | Asserts                                                                                                                                                 | Source File (Wave)                                                                                     | Required Change                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/tests/unit/FormInput.test.tsx:111,119`                                 | `expect(input).toHaveClass('border-red-500')`, `expect(input).toHaveClass('border-gray-300')`                                                           | `components/forms/FormInput.tsx` (W1)                                                                  | Update to `toHaveClass('border-danger')` and `toHaveClass('border-line')` after FormInput swap                                                                                                                                                         |
| `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx:111-115` | passes `className="text-emerald-500"` as a prop value and asserts the rendered SVG includes the literal                                                 | `components/signature-visuals/Sparkline.tsx` (Tier-B carve-out — `signature-visuals/**` is carved out) | **Verify Sparkline source is in carve-out**; if so, the test is testing pass-through behavior with arbitrary class — likely no source change needed, but the test file's literal usage is fine. Document as "no source change; test stays" in manifest |
| `frontend/tests/unit/design-system/handoff-css-contract.test.ts:64-66`           | `expect(css).toContain("[class~='text-red-600']")`, etc. — asserts the `legacy-tailwind-token-bridge` selectors in `frontend/src/styles/list-pages.css` | `frontend/src/styles/list-pages.css` (NOT in Phase 58 scope — CSS bridge, not Tailwind literal in TSX) | **DO NOT TOUCH** — bridge is intentional per the contract test                                                                                                                                                                                         |

### Multi-Literal-Per-Line Cases (per 51-VERIFICATION D-12 91-line delta)

The 91-line delta in 51-VERIFICATION (2336 AST Literal nodes vs 2245 source lines added) is the canonical count of multi-Literal-on-one-line cases. My local grep cannot AST-distinguish; see Assumption A3. The manifest's `multi_literal_line` column should be populated by:

1. Per-Tier-C file, parse with `tsx`/`babel-parser`, count Literal+TemplateElement nodes matching the palette regex per source line
2. Flag any line where `node_count_for_line >= 2`
3. Cross-check: total flagged lines across all files should equal `2336 - 2245 = 91`

Until the AST script is run, the manifest can use a heuristic (lines containing 2+ palette-literal substrings) as a SUPERSET; the per-file `pnpm lint <file>` exit-0 check on each atomic commit is the safety net that catches any missed literal regardless of pre-classification.

## Visual-Spec Impact Map (per Wave)

12 visual specs exist in `frontend/tests/e2e/`:

- `activity-page-visual.spec.ts` — activity feed surfaces (touches W6 ActivityFeedFilters/EnhancedActivityFeed)
- `after-actions-page-visual.spec.ts` — after-action forms (touches W1 components/forms/\* + W6 page)
- `briefs-page-visual.spec.ts` — briefs / AI surfaces (touches W6 BriefViewer)
- `calendar-visual.spec.ts` — calendar (touches W3 calendar dialogs + W6 calendar leaves)
- `dashboard-visual.spec.ts` — dashboard widgets (touches W5)
- `dashboard-widgets-visual.spec.ts` — dashboard-widgets/\*\* (touches W5)
- `dossier-drawer-visual.spec.ts` — dossier rail + drawers (touches W3 dossier dialogs + W4 dossier-rail)
- `kanban-visual.spec.ts` — kanban (Phase 52 cleared most; W3 ConflictResolutionDialog still applies)
- `list-pages-visual.spec.ts` — list pages (touches W2 tables + W6 routes)
- `settings-page-visual.spec.ts` — settings (touches W6 settings)
- `tasks-page-visual.spec.ts` — tasks (touches W3 task drawers + W6 tasks leaves)
- `tasks-tab-visual.spec.ts` — tasks tab (Phase 57 D-23 baseline; W3 + W6 may touch)

### Per-Wave `regen_targets` Recommendations

| Wave                  | Recommended specs to `--update-snapshots`                                                                                 | Rationale                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 0                     | none                                                                                                                      | manifest only                       |
| 1 (forms)             | `after-actions-page-visual`, `tailwind-remap-visual` (if exists)                                                          | Forms surface                       |
| 2 (tables)            | `list-pages-visual`, `tailwind-remap-visual`                                                                              | Table chrome                        |
| 3 (drawers-dialogs)   | `dossier-drawer-visual`, `calendar-visual`, `kanban-visual`, `tasks-page-visual`                                          | Dialog/Drawer/Modal surfaces        |
| 4 (dossier-rail)      | `dossier-drawer-visual` (re-affirm), `dashboard-visual` (dossier widgets)                                                 | Dossier rail                        |
| 5 (charts-residue)    | `dashboard-visual`, `dashboard-widgets-visual`                                                                            | Chart/widget chrome                 |
| 6 (pages-routes-misc) | `activity-page-visual`, `briefs-page-visual`, `list-pages-visual` (re-affirm), `settings-page-visual`, `tasks-tab-visual` | Long-tail pages + final integration |

**Phase 57 D-22 contract (D-12):** Each regen MUST be followed by the LTR≠RTL byte-distinction check (see Code Examples).

**`tailwind-remap-visual.spec.ts`:** referenced in CONTEXT.md D-12 — verify it exists at planning time. If it does, regen it broadly (W2+). If it doesn't, document the omission in manifest's `override_notes`.

## Open Questions

1. **Should `components/dossiers/CustomNodes.tsx` (68 disables) be carved out as graph viz?**
   - What we know: It's a React-Flow node renderer (graph visualization). The Tier-B carve-out in `eslint.config.mjs:247-270` lists `components/relationships/RelationshipGraph.tsx`, `components/dossier/MiniRelationshipGraph.tsx`, and chart files — but NOT `components/dossiers/CustomNodes.tsx`
   - What's unclear: Whether the omission is intentional or an oversight. CONTEXT.md D-13 says modifying the carve-out is OOS for Phase 58
   - Recommendation: Treat as in-scope (Phase 58 swaps it). If chromatic regression appears in graph view, append a `## Deferred` note to manifest and treat the regression as a follow-up phase candidate

2. **Does `tailwind-remap-visual.spec.ts` exist at `phase-57-base`?**
   - What we know: CONTEXT.md D-12 lists it as a regen target
   - What's unclear: My probe didn't find it in `frontend/tests/e2e/*-visual.spec.ts` (only the 12 specs listed in the Visual-Spec Impact Map). May be `tailwind-remap-visual.spec.ts` exists elsewhere or under a different name
   - Recommendation: Manifest's `regen_targets` column should `ls frontend/tests/e2e/` first; if no `tailwind-remap-visual` spec exists, drop it from D-12's enumerated list and document in 58-VERIFICATION

3. **Is `bg-secondary` always the correct purple-family target, or should it sometimes be `bg-accent-soft`?**
   - What we know: D-07 says `bg-secondary` / `text-secondary-foreground` / `border-secondary`, and `--color-secondary` → `var(--accent-soft)`, `--color-secondary-foreground` → `var(--accent-ink)` per `index.css:96-97`. So functionally equivalent
   - What's unclear: Whether the canonical utility class is `bg-secondary` or `bg-accent-soft` (both resolve identically). Style consistency suggests one
   - Recommendation: Use `bg-secondary` / `text-secondary-foreground` / `border-secondary` (D-07's literal wording). It's the existing utility shape. Maintain consistency with Phase 51 Tier-A precedent files (`semantic-colors.ts` uses `bg-secondary`/`text-secondary-foreground`)

## Environment Availability

| Dependency                     | Required By                           | Available                     | Version                                       | Fallback                                                                      |
| ------------------------------ | ------------------------------------- | ----------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm`                         | Build / lint / type-check             | ✓                             | (per package.json engines)                    | —                                                                             |
| `eslint` + `typescript-eslint` | Lint gate (TOKEN-02)                  | ✓                             | per `eslint.config.mjs` deps                  | —                                                                             |
| `vitest`                       | Unit tests (FormInput.test.tsx, etc.) | ✓                             | per `package.json`                            | —                                                                             |
| `playwright`                   | Visual specs (D-12 regen)             | ✓                             | per `frontend/package.json`                   | —                                                                             |
| `git` w/ SSH signing           | `phase-58-base` tag (D-15)            | ✓                             | configured per CLAUDE.md §"Tag signing setup" | If signing breaks: `git tag -v phase-57-base` smoke-checks the existing setup |
| `gh` CLI                       | Wave PR creation                      | ✓ (per Phase 55 D-13 pattern) | —                                             | —                                                                             |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None — all required tooling available at `phase-57-base`.

## Validation Architecture

> Validation Architecture per workflow.nyquist_validation enabled. Test pyramid keyed to wave deliverables.

### Test Framework

| Property                             | Value                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| Unit framework                       | Vitest (`pnpm test:unit` from frontend workspace)                                          |
| E2E framework                        | Playwright (`pnpm test:e2e --grep <spec-name>`)                                            |
| Visual specs                         | `frontend/tests/e2e/*-visual.spec.ts` (12 specs)                                           |
| Config files                         | `vitest.config.ts`, `frontend/tests/e2e/playwright.config.ts`                              |
| Quick run command                    | `pnpm lint frontend/src/<file>` (per-file fast lint check)                                 |
| Full suite commands (per wave merge) | `pnpm lint && pnpm type-check && pnpm test:unit && pnpm test:e2e --grep <wave-regen-list>` |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                                                                        | Test Type    | Automated Command                                                                                                                                        | File Exists?                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| TOKEN-01 | Zero `Phase 51 Tier-C` markers in `frontend/src/` after each wave's file set                                    | smoke (grep) | `! grep -rn 'Phase 51 Tier-C' frontend/src/<wave-files>`                                                                                                 | ✅ (per-wave applies)                                                       |
| TOKEN-01 | Visual baselines preserved per wave (no semantic-token swap regresses chrome)                                   | visual / e2e | `pnpm playwright test <wave-regen-list> --update-snapshots && git diff <snapshots>` (manual inspection of diff)                                          | ✅                                                                          |
| TOKEN-01 | LTR vs RTL baselines byte-distinct per wave (Phase 57 D-22 invariant)                                           | smoke (cmp)  | `cmp -s <ltr.png> <rtl.png>` exits non-zero                                                                                                              | ✅ (snapshots exist for tasks-tab, kanban, dossier-drawer at phase-57-base) |
| TOKEN-01 | Unit tests that grep palette literals updated in same wave PR (D-14)                                            | unit         | `pnpm test:unit frontend/tests/unit/FormInput.test.tsx`                                                                                                  | ✅                                                                          |
| TOKEN-02 | Lint exits 0 workspace-wide with D-05 selectors at `error` severity (waiver removal N/A by absence — D-13)      | lint         | `pnpm lint` exits 0                                                                                                                                      | ✅                                                                          |
| TOKEN-02 | `eslint.config.mjs` carries no Tier-C-specific block, allowlist, or comment-marker exception (verified by grep) | smoke (grep) | `! grep -E 'tier-c\|Tier-C\|design-token-tier' eslint.config.mjs` (must return zero structural matches; only the Tier-B carve-out remains, which is OOS) | ✅                                                                          |

### Sampling Rate

- **Per atomic commit:** `pnpm lint frontend/src/<file>` (per-file, < 5s)
- **Per wave PR (D-11 gate):** `pnpm lint && pnpm type-check && pnpm test:unit && pnpm playwright test <wave-regen-list>`
- **Per wave merge to main:** All 8 required CI contexts (Phase 55 D-13) pass on PR; protected-branch enforcement blocks otherwise
- **Phase gate (Wave 6 closure):** Full suite green; `! grep -rn 'Phase 51 Tier-C' frontend/src` returns zero; `git tag -v phase-58-base` exits 0 with `Good "git" signature`

### Wave 0 Gaps

- [ ] `58-WAVE-MANIFEST.md` — covers Wave 0 deliverable
- [ ] `58-00-wave-manifest-PLAN.md` — Wave 0 plan
- [ ] No new test files required; existing infrastructure covers all phase requirements
- [ ] No framework install required

_Test infrastructure complete at `phase-57-base`. All validation tooling exists and is wired._

## Security Domain

> N/A — Phase 58 is a UI refactor with zero data-flow, auth, network, or session changes. No ASVS categories apply. Security enforcement remains at the existing baseline (Phase 56 RLS audit passes; Phase 51 design-token gate at `error`; Phase 55 CI gate enforcement live).

**Confirmation:**

- V2 Authentication: not touched (no auth code changes)
- V3 Session: not touched
- V4 Access Control: not touched (no RLS or route guard changes)
- V5 Input Validation: not touched (no form schema changes)
- V6 Cryptography: not touched (no key/hash/JWT code)

### Known threat patterns for this stack — N/A

Phase 58 changes only Tailwind class names in TSX files; no new attack surface introduced.

## Project Constraints (from CLAUDE.md)

**MUST honor — these constrain implementation choices regardless of token-swap mechanics:**

1. **Visual Design Source of Truth.** IntelDossier prototype at `frontend/design-system/inteldossier_handoff_design/` is canonical. Phase 58 swaps must preserve current visual fidelity — token swaps are mechanical (chromatic equivalents); visual output should be byte-identical post-Playwright-regen for unchanged surfaces.
2. **No raw hex; no Tailwind color literals.** Phase 58 is the work to REMOVE these. Closure: zero raw palette literals in `frontend/src/**/*.{tsx,ts}` outside Tier-B carve-out.
3. **Borders are `1px solid var(--line)`; no drop-shadows on cards.** Phase 58 swaps must not alter border-width or introduce shadows.
4. **Buttons follow `.btn-primary` / `.btn-ghost`.** No new button variants in Phase 58.
5. **Row heights use `var(--row-h)`; corners use `--radius-sm/--radius/--radius-lg`.** Not affected by color swaps.
6. **No emoji in user-visible copy; no marketing voice.** Closure-commit messages and PLAN files must follow.
7. **Logical properties (`ms-*`, `pe-*`, `text-start`).** Phase 58 swaps must NOT swap `text-left`/`text-right` (RTL-breaking); only color literals.
8. **RTL: D-22 byte-distinction.** Each wave's visual regen must preserve LTR vs RTL byte-distinction (D-12).
9. **Tag signing setup.** `phase-58-base` annotated SSH-signed tag closure per established protocol (Phases 53-57 precedent).
10. **HeroUI v3 / Radix UI / Build-it-yourself cascade.** No new primitive libraries installed.
11. **GSD workflow enforcement.** Phase 58 work proceeds through `/gsd:plan-phase 58` → `/gsd:execute-phase 58` → `/gsd:verify-work 58` → `/gsd:milestone-audit` (when v6.4 ships).

## Sources

### Primary (HIGH confidence)

- `[VERIFIED: codebase]` `frontend/src/index.css` (lines 43-118) — `@theme` block: all swap-target utilities defined. Lines 96-97 confirm `--color-secondary` → `var(--accent-soft)`, `--color-secondary-foreground` → `var(--accent-ink)` (D-07 wiring)
- `[VERIFIED: codebase]` `frontend/src/design-system/tokens/buildTokens.ts` (lines 59-69) — state tokens (`--danger`, `--ok`, `--warn`, `--info` + `-soft`) have light/dark OKLCH branches set per `isDark`; this is the runtime mode-flip that makes D-09 (drop `dark:text-X`) correct
- `[VERIFIED: codebase]` `frontend/src/lib/semantic-colors.ts` (entire file) — canonical maps for status / priority / dossier-type / activity / interaction / stat-variant / activity-action / verified-pending-badge / brief-success-manual
- `[VERIFIED: codebase]` `eslint.config.mjs` (lines 10-28 + 247-270) — `designTokenSyntaxRestrictions` selectors at `error` severity; Tier-B carve-out (OOS) at lines 247-270
- `[VERIFIED: codebase]` Live grep at `phase-57-base` (`f16c3b63`) — `grep -rln "Phase 51 Tier-C" frontend/src` → 268 files; `grep -rhc "Phase 51 Tier-C" ... | awk '{s+=$1}'` → 2227 disable lines
- `[VERIFIED: codebase]` `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` — Tier-C Disposition Table = 271 rows (reconciled to 268 live files via `KanbanTaskCard.tsx`, `KanbanBoard.tsx`, `pages/engagements/workspace/TasksTab.tsx` already-cleared)
- `[VERIFIED: codebase]` `.planning/phases/51-design-token-compliance-gate/51-VERIFICATION.md` (lines 8-17) — canonical reconciliation note: 2336 AST nodes / 2245 source-lines / 2227 disable-lines at closure baseline
- `[VERIFIED: codebase]` Tier-A precedent files: `components/forms/FormCompletionProgress.tsx`, `components/forms/UnifiedFileUpload.tsx`, `components/collaboration/EditingLockIndicator.tsx`, `components/availability-polling/AvailabilityPollResults.tsx`
- `[VERIFIED: codebase]` `frontend/tests/unit/design-system/handoff-css-contract.test.ts` (lines 60-67) — `legacy-tailwind-token-bridge` selectors asserted; `frontend/src/styles/list-pages.css` (lines 1113-1450) — bridge implementation
- `[VERIFIED: codebase]` `.planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-CONTEXT.md` §D-22 — LTR vs RTL byte-distinction contract
- `[VERIFIED: codebase]` `tools/eslint-fixtures/bad-design-token.tsx` — positive-failure fixture; lines 7-16 confirm raw hex + palette literal + template literal violations
- `[VERIFIED: codebase]` `git tag -v phase-57-base` exits 0 with `Good "git" signature` (ED25519 key) — signing protocol verified working

### Secondary (MEDIUM confidence)

- `[CITED: CLAUDE.md §"Visual Design Source of Truth", §"Tag signing setup", §"Definition of Done — UI checklist"]` — project guardrails
- `[CITED: .planning/REQUIREMENTS.md]` — TOKEN-01, TOKEN-02 acceptance text; v6.4 OOS clause banning net-new tokens
- `[CITED: .planning/ROADMAP.md §"Phase 58"]` — 4 success criteria (criterion #2 disambiguated by D-13 to "absence verified by grep")
- `[CITED: .planning/STATE.md]` — Phase 57 complete, phase-57-base @ `f16c3b63`, v6.4 progress 12/14

### Tertiary (LOW confidence — none required for this phase)

Phase 58 is a mechanical refactor with no external library dependencies. No web search needed; no version verification needed; all knowledge sourced from in-repo files.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — verified via codebase reads; zero new packages
- Architecture: HIGH — wave taxonomy locked by CONTEXT.md decisions D-01..D-04; live-grep confirms file allocation
- Pitfalls: HIGH — 8 pitfalls derived from CONTEXT.md anti-patterns + live-code observation (handoff-css-contract test asserting bridge selectors stay)
- Closure protocol: HIGH — Phases 53/55/56/57 already shipped this exact tag-signing + audit-doc-closure protocol; `git tag -v phase-57-base` exits 0 verifying the local setup works

**Research date:** 2026-05-19
**Valid until:** 2026-05-26 (1 week — phase scope is mechanical and won't drift, but the live-grep file count can drift if other branches land Tier-C-touching changes before Phase 58 execution. Re-run live grep at execution start)
