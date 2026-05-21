# Phase 58: Tier-C Design-Token Suppression Full Clear - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate every `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<basename>` suppression in `frontend/src/` (271 files / 2336 AST nodes / 2227 disable lines) by mechanically swapping the raw Tailwind palette literal it suppresses to a real design-token utility (`text-success`, `text-danger`, `text-warning`, `text-info`, `text-accent`, `text-muted-foreground`, `bg-*` tinted, `border-*` tinted, plus `bg-secondary` / `text-secondary-foreground` = `accent-soft` / `accent-ink` for purple-family overrides). Wave-staged by surface per ROADMAP §4 (forms, tables, drawers/dialogs, dossier rail, charts-residue, pages-routes-misc). After clear: `pnpm lint` exits 0 workspace-wide with the D-05 selectors at `error` severity, zero `Phase 51 Tier-C` strings remain in `frontend/src/`, and `eslint.config.mjs` carries no Tier-C-specific exception block (documented as N/A — no such block exists today, the ROADMAP §criterion-2 wording is paraphrase of the per-line annotation removal).

Scope anchors (from ROADMAP §"Phase 58 — Success Criteria"):

1. `grep -r "Phase 51 Tier-C" frontend/src` returns zero matches across all 271 originally-suppressed files / 2336 AST nodes (ROADMAP names the marker as `gsd-design-token-tier-c-allow` — that marker never existed in code; actual marker is `Phase 51 Tier-C:` per 51-DESIGN-AUDIT.md and live grep)
2. `eslint.config.mjs` carries no Tier-C-specific files-list block, rule allowlist, or comment-marker exception (verified by inspection — already N/A pre-Phase-58; documented in 58-VERIFICATION.md)
3. `pnpm lint` exits 0 workspace-wide with the D-05 selectors at `error` severity
4. Wave PRs organized by surface, each independently reviewable and revertable; 1 PR per wave; commits atomic per file inside each wave PR

Out of phase (deferred / OOS per v6.4 REQUIREMENTS.md):

- Net-new design tokens or direction variants (purple/violet/pink/indigo handled via existing `accent` + `accent-soft` family, not by adding tokens)
- Modifying the Tier-B carve-out at `eslint.config.mjs:247-270` (charts, flags, bootstrap, signature-visuals — intentional design statements, not Tier-C)
- New E2E specs beyond what wave verification regenerates
- Visual / OKLCH token retuning (mechanical swap only; if a swap reveals a chromatic regression, capture in deferred list, do NOT widen scope)

</domain>

<decisions>
## Implementation Decisions

### Wave Taxonomy & Ordering

- **D-01: Wave shape = strict ROADMAP 5 surfaces + 6th catch-all.** Six waves keyed to the ROADMAP §4 named surfaces with a single explicit catch-all for everything that doesn't fit:
  1. `forms` — `components/forms/**`, `components/empty-states/**`, `components/advanced-search/**`, `components/duplicate-detection/**`, form-shaped leaf components
  2. `tables` — `components/audit-logs/**` (table-shaped), `components/bulk-actions/**` (SelectableDataTable family), `components/assignments/KanbanTaskCard.tsx`, list-table leaves
  3. `drawers-dialogs` — `*Drawer.tsx`, `*Dialog.tsx`, `*Modal.tsx` leaves across all dirs (CommitmentDetailDrawer, BulkActionConfirmDialog, ConflictResolutionDialog, ComplianceSignoffDialog, etc.)
  4. `dossier-rail` — `components/dossier/**` (20 files), `components/dossier-recommendations/**`, `components/dossier-timeline/**`
  5. `charts-residue` — chart-adjacent leaves NOT already in the Tier-B carve-out (e.g., `components/sla-monitoring/**` filters, analytics leaves not in carve-out)
  6. `pages-routes-misc` — `routes/_protected/**` (18 files), `pages/**`, plus the long-tail dirs (compliance, audit-logs filters, calendar, commitments, positions, waiting-queue, intelligence, etc.) that don't fit waves 1-5
- **D-02: Wave order = low-risk → high-risk.** `forms → tables → drawers-dialogs → dossier-rail → charts-residue → pages-routes-misc`. Forms are leaf-most and least cross-coupled; pages/routes are last because they coordinate cross-component visual state. Front-loading lowest-risk wave validates the swap pattern before touching the dossier rail (most user-visible).
- **D-03: 1 PR per wave + Wave-0 manifest PR.** Wave 0 (the FIRST plan, before any swap) commits `58-WAVE-MANIFEST.md` — a deterministic table mapping every Tier-C row (51-DESIGN-AUDIT.md `<basename>` anchor) → wave label + per-row override columns (blue-vs-accent collision flag, purple→accent or accent-soft flag, dark-variant alpha override if non-default). Manifest commits FIRST so each subsequent wave plan reads it; no file is claimed by two waves; no orphan files. Manifest is the single source of truth for file→wave assignment. PRs total: 7 (1 manifest + 6 surface waves) with an implicit 8th = phase-58-base tag push commit on the final wave.
- **D-04: 1 atomic commit per file inside each wave PR.** Each commit: swap all literals in 1 file + delete its `Phase 51 Tier-C:` annotation lines + run `pnpm lint frontend/src/<file>` green. Bisectable. Lints green at every commit. Matches Phase 51 Plan 04 atomic-per-file precedent.

### Token Swap Mapping (mechanical)

- **D-05: Color-family → token mapping locked from 51-DESIGN-AUDIT.md `proposed_token_map`:**
  - red / rose → `text-danger`, `bg-danger/N`, `border-danger/N`
  - amber / yellow / orange → `text-warning`, `bg-warning/N`, `border-warning/N`
  - green / emerald / lime → `text-success`, `bg-success/N`, `border-success/N`
  - blue → `text-accent` (links/CTAs) **OR** `text-info` (badges/informational) per audit row; in collision cases see D-07
  - sky / cyan / teal → `text-info`, `bg-info/N`, `border-info/N`
  - gray / slate / zinc / neutral / stone → `text-muted-foreground`, `bg-muted`, `border-line`
- **D-06: Purple-family → text-accent family (full clear).** purple, violet, fuchsia, pink, indigo all map to the `accent` token family (`oklch(58% 0.14 32)` — IntelDossier brand hue). Closest "category alt" semantic. Honors v6.4 OOS clause banning net-new tokens. ~102 files / ~450 literal instances affected.
- **D-07: Blue+purple collision rule = blue→accent, purple→accent-soft.** When a single file contains BOTH blue-family AND purple-family literals (e.g. dossier-type maps where `topic=purple`, `country=blue`), purple-family overrides to `bg-secondary` / `text-secondary-foreground` / `border-secondary` (where `--color-secondary` already resolves to `var(--accent-soft)` and `--color-secondary-foreground` to `var(--accent-ink)` per `frontend/src/index.css`). Preserves chromatic distinction without new tokens. Per-row override captured in Wave-0 manifest's `blue_purple_collision` column.

### Dark-Variant Alpha Policy

- **D-08: bg/border preserve dark variant with alpha bump.** Transform: `bg-X-100 dark:bg-X-900/30` → `bg-{semantic}/10 dark:bg-{semantic}/30`. `border-X-200 dark:border-X-800` → `border-{semantic}/20 dark:border-{semantic}/80`. Alpha rule: Tailwind palette suffix 100→10, 200→20, …, 900→90; dark-variant alpha bumped one tier up from source since OKLCH semantic tokens are mode-invariant (single `:root` definition, no `.dark`-scoped redefinition for state tokens). Matches Phase 51 Tier-A swap precedent (see `components/collaboration/EditingLockIndicator.tsx`, `components/availability-polling/AvailabilityPollResults.tsx`).
- **D-09: text-\* drops dark variant entirely.** `text-X-700 dark:text-X-300` → `text-{semantic}` (NO dark variant). Semantic ink tokens are mode-invariant by design — same OKLCH lightness reads correctly on both bg modes. Reduces diff churn (~1368 dark-prefixed literals shrink to ~600 once text-\* dark variants are dropped). Matches the existing 80%-no-dark convention (503 `bg-{semantic}/N` uses, only 95 with `dark:` variant).
- **D-10: dark-variant default ladder per surface.** When source has NO dark variant: do not introduce one. When source HAS dark variant on bg/border: preserve per D-08. When source has dark variant on text-\*: drop per D-09. No file may add a NET-NEW dark variant pair not present in source.

### Per-Wave Verification & Visual Baseline

- **D-11: Per-wave full gate.** Before merging Wave N+1, Wave N PR must pass:
  - `pnpm lint` exits 0 workspace-wide (D-05 selectors at `error` — no new violations introduced)
  - `pnpm type-check` exits 0
  - Affected visual specs regenerated and reasserted (see D-12)
  - Affected unit tests green (including any tests that grep for old palette class names — those tests update in the same wave PR per D-14)
  - `grep -rn "Phase 51 Tier-C" frontend/src` returns zero matches inside the wave's file set
- **D-12: Per-wave visual baseline regen + LTR≠RTL byte check.** Each wave PR includes:
  - Re-run affected visual specs with `--update-snapshots`: at minimum `tasks-tab-visual.spec.ts`, `kanban-visual.spec.ts`, `dossier-drawer-visual.spec.ts`, `list-pages-visual.spec.ts`, `tailwind-remap-visual.spec.ts`, `theme-visual.spec.ts`, plus any wave-specific spec named in 58-WAVE-MANIFEST.md `regen_targets` column
  - Re-assert LTR vs RTL baselines byte-distinct (Phase 57 D-22 contract preserved — both directions regenerated, post-regen `diff` between LTR and RTL PNGs must be non-zero per spec, NOT byte-identical)
  - Commit regenerated PNGs in the SAME wave PR (not a separate baseline-regen PR)
- **D-13: Criterion #2 ("`eslint.config.mjs` waiver token removal") = N/A documented.** ROADMAP §"Phase 58 — Success Criterion 2" predates 51-DESIGN-AUDIT.md and uses paraphrased marker (`gsd-design-token-tier-c-allow`). Actual marker is per-line `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:`. No Tier-C-specific block, allowlist, or comment-marker exception exists in `eslint.config.mjs` today (verified by `grep -n "tier-c\|Tier-C\|design-token-tier" eslint.config.mjs` returning zero structural matches at planning time). 58-VERIFICATION.md documents this as: "Criterion #2 satisfied by absence — no Tier-C waiver token, block, or exception in eslint.config.mjs at planning baseline; closure verified by repeat grep returning zero matches."

### Closure & Tag

- **D-14: Test-coupling — same-PR updates.** Any test that grepped for an old palette class string (e.g., `expect(...).toHaveClass('text-red-600')`, `getByText('bg-blue-100')`, snapshot text containing the literal) updates in the SAME wave PR that swaps the source file. No separate "test-fix follow-up PR" allowed. Wave-0 manifest's `test_grep_hits` column flags files where this is expected.
- **D-15: Phase-58-base annotated SSH-signed tag on closure.** After Wave 6 merges and final verification gate (D-11) passes, cut `phase-58-base` annotated + SSH-signed tag per v6.2/v6.3/v6.4-prior closing convention. `git tag -v phase-58-base` must exit 0 with `Good "git" signature`. Push to origin.
- **D-16: 51-DESIGN-AUDIT.md closure annotation.** Final wave PR appends a `## Phase 58 Closure` section to `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` documenting: (a) total swap count, (b) reconciliation between 271 files / 2336 AST nodes / 2227 disable lines and actual closure counts, (c) cross-link to `58-VERIFICATION.md`, (d) deferred-tier-c → cleared mapping showing every TBD `follow_up_phase` placeholder resolved to "Phase 58". Audit doc stays in 51 folder; not moved.

### Claude's Discretion

- Exact swap-pattern script (sed / codemod / manual edit) — Claude picks per file complexity during planning. Mechanical files (lookup-table types) use codemod; nuanced files (drawers with composite conditionals) hand-edit.
- Exact wave PLAN.md task ordering inside each wave (Claude picks atomic-file granularity from manifest)
- Visual-spec selection per wave (Claude reads 58-WAVE-MANIFEST.md `regen_targets` column; if a spec doesn't appear in manifest but touches the wave's files, regen anyway)
- PR titles + branch names (Claude follows v6.4 milestone naming convention: `phase-58/wave-N-<surface>`)
- Closure-commit message format (Claude follows existing repo convention from `git log phase-57-base..HEAD`)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & roadmap

- `.planning/REQUIREMENTS.md` §"Design token cleanup (Tier-C full clear)" — TOKEN-01 + TOKEN-02 acceptance text; v6.4 OOS clause banning net-new tokens
- `.planning/ROADMAP.md` §"Phase 58: Tier-C Design-Token Suppression Full Clear" — 4 success criteria are the test oracle (criterion #2 disambiguation captured in D-13)
- `.planning/STATE.md` — v6.4 milestone progress, current position, dependency on Phase 55

### Phase 51 Tier-C source-of-truth

- `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` — Tier-C Disposition Table (271 rows, columns: file, raw_hex_count, palette_literal_count, proposed_token_map, disposition, follow_up_phase). EVERY swap decision derives from a row in this table. Slug index at the bottom is the `<basename>` anchor target referenced by every annotation.
- `.planning/phases/51-design-token-compliance-gate/51-VERIFICATION.md` — DESIGN-03 deferral provenance (2336 vs 2245 reconciliation), per-Literal annotation form, audit-doc back-reference contract
- `.planning/phases/51-design-token-compliance-gate/51-04-tier-c-severity-flip-smoke-pr-PLAN.md` §D-12 — diff-grep verification methodology (re-used inverted at Phase 58 closure: `git diff phase-58-base^..HEAD -- 'frontend/src' | grep -c '^-.*Phase 51 Tier-C'` must equal the manifest's total annotation count)

### Design-token semantic API

- `frontend/src/index.css` §`@theme` block (lines 43-100) — semantic Tailwind utilities mapped: `bg`, `surface`, `ink`, `line`, `accent` (+soft/ink/fg), `danger` (+soft), `info` (+soft), `success`, `warning`, `muted`. `--color-secondary` = `var(--accent-soft)`, `--color-secondary-foreground` = `var(--accent-ink)` — drives D-07 blue+purple collision rule
- `frontend/src/lib/semantic-colors.ts` — canonical status/priority/dossier-type/activity color maps. Wave PLANs reuse these helpers where applicable (`getDossierTypeBadgeClass`, `getStatusBadgeClass`, `getPriorityBadgeClass`, `getActivityTypeBadgeClass`); do NOT introduce parallel maps
- `frontend/src/design-system/tokens/directions.ts` — direction × mode hex pairs; semantic state tokens are mode-invariant (no `.dark`-scoped redefinition) — drives D-08/D-09 alpha policy
- `frontend/design-system/inteldossier_handoff_design/colors_and_type.css` — canonical token names + exact OKLCH values; visual source of truth per CLAUDE.md

### v6.3 gate definitions (must remain green)

- `eslint.config.mjs` — `designTokenSyntaxRestrictions` (lines 10-28) D-05 selectors at `error` severity; Tier-B carve-out (lines 247-270) is OUT OF SCOPE for Phase 58 and must not be modified
- `tools/eslint-fixtures/bad-design-token.tsx` — positive-failure fixture; if Phase 58 swap touches this file path or pattern, do NOT swap — fixture must continue to produce its expected lint error

### Phase 57 D-22 contract (visual baseline byte-distinction)

- `.planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-CONTEXT.md` §D-22 — LTR vs RTL baselines MUST be byte-distinct post-regen; Phase 58 D-12 preserves this invariant per wave
- `frontend/tests/e2e/tasks-tab-visual.spec.ts` + `.spec.ts-snapshots/` — LTR/RTL baselines locked by Phase 57; regenerated per wave that touches tasks-tab surface
- `frontend/tests/e2e/kanban-visual.spec.ts` + `.spec.ts-snapshots/` — same contract
- `frontend/tests/e2e/dossier-drawer-visual.spec.ts` + `.spec.ts-snapshots/` — regenerated when Wave 3 (drawers-dialogs) or Wave 4 (dossier-rail) ships
- `frontend/tests/e2e/list-pages-visual.spec.ts` + `.spec.ts-snapshots/` — regenerated by Wave 6 (pages-routes-misc)
- `frontend/tests/e2e/tailwind-remap-visual.spec.ts` — broad-spectrum sanity check; regenerated by Wave 2+

### Tag-signing & closure

- `CLAUDE.md` §"Tag signing setup" — SSH-signed annotated tag protocol for `phase-58-base`
- `phase-57-base` (origin) — current baseline; Wave 1 branches off this

### Project guardrails

- `CLAUDE.md` §"Visual Design Source of Truth" — prototype is canonical; no new gradient backgrounds, no card shadows, no emoji in copy, no marketing voice; logical properties for spacing — Phase 58 swaps must not regress any
- `CLAUDE.md` §"Definition of Done — UI checklist" — every wave PR self-validates against this checklist

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`frontend/src/lib/semantic-colors.ts`** — already canonicalizes status/priority/dossier-type/activity/interaction-type/stat-variant/activity-action color sets via `bg-*/text-*/border-*` semantic utilities. Wave plans MUST reuse these helpers when the target file's literal corresponds to a known semantic (e.g., a status badge with `bg-amber-100 text-amber-700` → reuse `statusColors.pending`). Prevents parallel-map drift.
- **`frontend/src/index.css` `@theme` block** — Tailwind v4 source of truth for the D-16 token engine. Every swap target utility exists here today: `text-success`, `text-danger`, `text-warning`, `text-info`, `text-accent` (+ `text-secondary-foreground` for accent-ink), `text-muted-foreground`, plus `bg-*`/`border-*` with `/N` alpha fractions. No utility additions needed.
- **Phase 51 Tier-A swap output** — 50 files already swapped under Plan 51-02/51-03 (e.g., `components/forms/FormCompletionProgress.tsx`, `components/forms/UnifiedFileUpload.tsx`). Pattern reference: read these for the canonical swap shape before starting Wave 1.
- **`51-DESIGN-AUDIT.md` Tier-C Disposition Table** — 271 rows pre-computed `proposed_token_map`. Wave-0 manifest builds on top of this, doesn't re-derive.
- **Atomic-commit + signed-tag closure precedent** — Phases 53/55/56/57 all closed with annotated SSH-signed `phase-NN-base` tags. Repo + CLAUDE.md protocol stable.
- **`gh pr create` + per-wave PR pattern** — Phase 55 D-13/D-15 established wave-style sequenced PR shipping with branch protection respected; Phase 58 inherits.

### Established Patterns

- **Per-literal eslint-disable annotation form (Phase 51 D-14)** — `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<basename>`. Phase 58 deletes these EXACTLY (no partial / orphan annotations left).
- **Multi-Literal-on-one-line edge case (51-VERIFICATION D-12 delta)** — 91-line delta between 2336 AST nodes and 2245 source lines comes from cases where one disable comment covers two literals on the same line. Phase 58 swap MUST handle both literals on such lines; manifest's `multi_literal_line` column flags these.
- **Token + dark alpha pairing convention** — 503 existing `bg-{semantic}/N` uses, ~20% pair with `dark:bg-{semantic}/M` (typically M = N + 10 to N + 20). Phase 58 D-08/D-09 codify this.
- **LTR/RTL baseline byte-distinction (Phase 57 D-22)** — visual baselines per direction must NOT be byte-identical post-regen. Phase 58 D-12 preserves; each wave validates.
- **PR-based merges with `enforce_admins=true`** — `main` branch protection respects owner; no admin bypass; 8 required contexts (Phase 55 D-13). Wave PRs all must pass.

### Integration Points

- **`phase-57-base` → Wave 1 branch base** — `git checkout -b phase-58/wave-0-manifest phase-57-base` (or `main` if main already past `phase-57-base`); subsequent waves branch off the previous wave's merge-commit on main
- **`51-DESIGN-AUDIT.md` closure annotation** — final wave PR appends `## Phase 58 Closure` section (per D-16)
- **`phase-58-base` annotated SSH-signed tag** — issued after final wave merges + verification gate green; pushed to origin
- **`58-VERIFICATION.md`** — produced by `/gsd:verify-work 58` post-execution; documents D-13 criterion #2 N/A interpretation + total swap reconciliation

### Anti-patterns to avoid

- **Adding NEW semantic tokens** — banned by v6.4 OOS clause. Use `accent`, `accent-soft`, `accent-ink`, `secondary` family for purple-family overrides; never `--purple` or `--violet`.
- **Modifying the Tier-B carve-out (`eslint.config.mjs:247-270`)** — chart/flag/bootstrap exceptions are intentional design statements per Phase 51 D-03/D-13. Touching them is OOS.
- **Leaving partial annotation orphans** — every deleted `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:` line must correspond to a swapped literal in the same commit; no dangling annotations after swap.
- **Adding NET-NEW dark variants** where source had none (D-10) — increases diff surface; user did not authorize cross-mode parity work.
- **Snapshot regen in a separate PR** — D-12 mandates same-PR regen so the swap PR's evidence trail is self-contained.
- **Cross-wave file claim** — every file appears in EXACTLY ONE wave per Wave-0 manifest (D-03); no file is touched by two wave PRs.
- **`--no-verify` on commits/merge** — signing/hooks intact per repo convention.
- **Manual `git push --force` to main** — branch protection blocks; not needed at any point in Phase 58.

</code_context>

<specifics>
## Specific Ideas

- **`58-WAVE-MANIFEST.md` columns:** `audit_slug` (anchor in 51-DESIGN-AUDIT.md), `file_path` (relative to repo root), `wave` (1-6 + 0 for manifest itself), `surface` (forms/tables/drawers-dialogs/dossier-rail/charts-residue/pages-routes-misc), `raw_hex_count` (copied from audit), `palette_literal_count` (copied from audit), `blue_purple_collision` (yes/no — drives D-07), `dark_variant_present` (yes/no — drives D-08/D-09 ladder), `multi_literal_line` (yes/no — drives 51-VERIFICATION D-12 delta handling), `regen_targets` (visual specs to regen for this file's wave), `test_grep_hits` (test files that may need same-PR updates per D-14), `override_notes` (free-text per-row exception capture).
- **Wave 0 plan (the manifest plan) is its own atomic task list** — generates manifest deterministically from `51-DESIGN-AUDIT.md` + grep over `frontend/src/` for `dark:` / blue+purple co-occurrence / multi-Literal-per-line / test grep hits. Manifest commits with a single `chore(58): commit Phase 58 wave manifest (271 files, 2336 nodes mapped to 6 surfaces)` commit message.
- **Per-wave commit-message convention:** `style(58-W{N}/<file-basename>): swap Tier-C palette literals to <semantic-family> tokens (N nodes, M annotations cleared)`. Wave-level closure commit: `chore(58-W{N}): regen visual baselines (<spec list>) + LTR≠RTL byte-distinction reasserted`.
- **Closure commit on Wave 6:** `chore(58): close Phase 58 — Tier-C suppressions cleared (271 files / 2336 nodes / 2227 lines), 51-DESIGN-AUDIT.md closure annotation appended, phase-58-base SSH-signed tag pushed`.
- **Phase-58-base tag message body:** "Phase 58 — Tier-C design-token suppression full clear. 271 files / 2336 AST nodes / 2227 disable lines cleared via wave-staged token swaps. TOKEN-01 + TOKEN-02 satisfied. `pnpm lint` exits 0; `grep -r 'Phase 51 Tier-C' frontend/src` returns zero. Criterion #2 (eslint.config.mjs waiver token removal) — N/A by absence, documented in 58-VERIFICATION.md."
- **Visual-spec regen guard:** for each wave, the post-regen diff between LTR and RTL baselines for that wave's specs must be non-zero (matching Phase 57 D-22 contract). If a regen produces byte-identical LTR/RTL pair: STOP, investigate (may indicate the swap accidentally broke direction-dependent class application).
- **51-DESIGN-AUDIT.md closure annotation contents (per D-16):** appended `## Phase 58 Closure` section with table: `wave | files | annotations_cleared | nodes_swapped | regen_targets_updated | commit_sha_range`, plus a reconciliation note matching the 51-VERIFICATION 2336/2245/91-delta accounting.

</specifics>

<deferred>
## Deferred Ideas

- **Net-new design tokens for purple/violet category color** — explicitly OOS per v6.4 REQUIREMENTS.md; if a v7.0+ phase decides to extend the token palette (e.g. for category coding in the Intelligence Engine), purple-family literals were already neutralized via `accent` + `accent-soft` and can be retuned in the new phase without re-touching the swapped files.
- **Tier-B carve-out audit / shrinking** — the 16-file Tier-B carve-out in `eslint.config.mjs:247-270` (charts, flags, bootstrap, signature-visuals) is intentional per Phase 51 D-03/D-13. A future chart-token phase could shrink this list, but Phase 58 leaves it untouched.
- **Codemod tool generalization** — if Wave 1 produces a reusable codemod script (e.g., a `tsx-codemod` jscodeshift transform), preserve it in `tools/codemods/` for v7.0+ token-system extensions; do NOT bake it into Phase 58 deliverables.
- **Snapshot-spec consolidation** — multiple visual specs touch overlapping surfaces; a future polish phase could consolidate them. Phase 58 only regenerates baselines; does not consolidate.
- **51-DESIGN-AUDIT.md migration to historical archive** — once Phase 58 closure annotation is appended (per D-16), the audit doc serves as a historical record. A v7.0+ cleanup could move it to `.planning/milestones/v6.x-archive/` but Phase 58 leaves it in 51 folder for back-reference continuity.
- **`gsd-design-token-tier-c-allow` marker rename** — the ROADMAP §criterion-2 paraphrase implies this marker exists; it never did. A v6.5 cosmetic phase could rewrite ROADMAP §Phase-58 wording to use the actual marker name (`Phase 51 Tier-C:`). Out of scope for Phase 58 execution; documented in 58-VERIFICATION.md.

</deferred>

---

_Phase: 58-tier-c-design-token-suppression-full-clear_
_Context gathered: 2026-05-19_
