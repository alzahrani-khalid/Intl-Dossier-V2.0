# Phase 51: Design-Token Compliance Gate - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up PR-blocking ESLint enforcement that prevents raw hex colors and Tailwind palette literals from re-entering `frontend/src/`, then clear the highest-signal existing violations using a tri-tier triage so the rule activates at zero workspace lint errors. Scope:

- **Rule activation** — Add `no-restricted-syntax` selectors to `eslint.config.mjs` for (a) raw hex outside an allowlist of token-definition / chart / flag-SVG files and (b) Tailwind palette literals (`text-red-*`, `bg-blue-*`, `border-green-*`, …) including ALL variant prefixes (`dark:`, `hover:`, `focus:`, responsive `md:`/`lg:`/`xl:`, `aria-*:`) on the banned palette names. Token-mapped utilities (`text-ink`, `bg-bg`, `text-accent`, `text-success`, `bg-sla-ok`, …) are NEVER matched by the regex, so no allowlist of token names needs to be enumerated in the rule.
- **Violation triage** — Tri-tier disposition (D-01..D-04): Tier-A (in-phase fix), Tier-B (rule-level allowlist), Tier-C (per-file `eslint-disable-next-line` with audit-row reference). Sweep produces `51-DESIGN-AUDIT.md` enumerating every Tier-C entry with file, count, token equivalent or rationale, and follow-up phase ticket.
- **CI gate restoration** — Fold the new rule under the existing `Lint` PR-blocking branch-protection context that Phase 48 D-15 wired on `main`. No new GHA job, no new required-context PUT. Smoke PR proves `Lint` red + `mergeStateStatus=BLOCKED` (Phase 48 D-16 / Phase 50 D-13 precedent).
- **Zero net-new suppression** — Mirror Phase 48 D-17: zero new `eslint-disable` / `eslint-disable-next-line` introduced outside the audit-traced Tier-C disables. Each Tier-C disable carries a `// eslint-disable-next-line ... /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<file> */` annotation.

**Out of phase boundary (do NOT attempt in Phase 51):**

- Refactoring chart palette files to a chart-palette token export (Tier-B holds them; future Tier-C cleanup phase owns the migration).
- Replacing `lib/semantic-colors.ts` Tailwind utility maps with direct token utilities (D-11 confirms both paths are valid).
- Cleaning raw hex comments out of `modern-nav-tokens.css` — D-08 keeps comments untouched (AST selector matches Literal nodes only).
- Re-enabling any of the `TODO(Phase 2+)` disabled rules in `eslint.config.mjs` (Phase 48 D-09 carries forward).
- Kanban migration / kibo-ui removal (Phase 52 owns).
- Bundle tightening (Phase 53 owns).

</domain>

<decisions>
## Implementation Decisions

### Scope + triage shape

- **D-01 (Tri-tier triage):** Phase 51 closes the design-token gate with three tiers. Tier-A is fixed in-phase. Tier-B is permanently allowlisted in `eslint.config.mjs` (per-file ignores or rule-level overrides). Tier-C lives behind audited per-file `eslint-disable-next-line` directives, each pointing to a row in `51-DESIGN-AUDIT.md`. Rule activates everywhere in `frontend/src/`; no broad ignore-block masks remaining drift. Counterpart of Phase 50 D-04 audit pattern. Phase ends when `pnpm lint` exits 0 with new selectors active.
- **D-02 (Tier-A scope):** In-phase fixes cover (a) `frontend/src/components/territory-map/WorldMapVisualization.tsx:193` `lineColor="#3B82F6"` → token-equivalent CSS-var read or `text-accent` derivation, (b) `frontend/src/components/position-editor/PositionEditor.tsx` lines 211 / 237 (`text-blue-600 underline`), 410 (`border-red-200 bg-red-50`), 412 (`text-red-800`), 531 (`text-red-600`) → mapped to `text-accent` (link) and `text-danger` / `border-danger` / `bg-danger/10` per `@theme` block in `index.css`, and (c) every other status / badge / alert literal whose token map is mechanical (`text-red-* → text-danger`, `text-amber-* → text-warning`, `text-emerald-*` / `text-green-* → text-success`, `text-blue-* → text-info` or `text-accent` depending on semantic role). The planner produces a per-file Tier-A worklist and a Tier-B/Tier-C disposition list from `rg` sweep output before execution begins.
- **D-03 (Tier-B allowlist — file-level exemptions for raw hex and palette literals):**
  - **Token-definition + bootstrap** (raw hex is the source of truth here, NOT drift): `frontend/src/design-system/tokens/directions.ts`, `frontend/src/index.css`, `frontend/src/styles/modern-nav-tokens.css`, `frontend/public/bootstrap.js`. Justifies via `CLAUDE.md §Visual Design Source of Truth` — bootstrap.js and directions.ts MUST byte-match.
  - **Signature visuals** (national flag SVG codepoints): `frontend/src/components/signature-visuals/flags/**/*.{tsx,ts}` — ISO 3166-1 sovereign flag colors are intentional literal values, not design tokens. Mirrors the existing `**/signature-visuals/flags/**` carve-out in `eslint.config.mjs` for kebab-case file naming (lines 287, 347, 369, 391).
  - **Chart palettes + React-Flow + relationship graphs** (data-viz series need a discrete palette, no `@theme` map exists yet): `frontend/src/components/analytics/*Chart.tsx`, `frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx`, `frontend/src/components/dashboard-widgets/ChartWidget.tsx`, `frontend/src/components/sla-monitoring/SLAComplianceChart.tsx`, `frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx`, `frontend/src/components/stakeholder-influence/InfluenceReport.tsx`, `frontend/src/components/relationships/RelationshipGraph.tsx`, `frontend/src/components/dossier/MiniRelationshipGraph.tsx`, `frontend/src/components/report-builder/ReportPreview.tsx`. Tier-B is a STAY decision — these files DO NOT receive any literal swap in Phase 51. A future "chart palette tokens" phase owns their cleanup.
  - **Tailwind-utility map module**: `frontend/src/lib/semantic-colors.ts` (the data-viz palette + Tailwind utility map already centralizes the project's color decisions; D-11 confirms it stays as the canonical migration target).
  - Each allowlist entry uses an ESLint config `ignores` glob scoped to the new selectors only (the per-rule disable shape `{ files: ['...'], rules: { 'no-restricted-syntax': 'off' } }` already used in `eslint.config.mjs` lines 215–221 for `components/ui/**`).
- **D-04 (Tier-C audit artifact):** `51-DESIGN-AUDIT.md` enumerates every other file with violations (`rg` sweep delta minus Tier-A minus Tier-B). Columns: `file`, `raw_hex_count`, `palette_literal_count`, `proposed_token_map`, `disposition` (always `deferred-tier-c` at this stage), `follow_up_phase`. Each Tier-C row gets one `// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<filename> */` per offending Literal. No bulk-disable comments at file top; per-Literal disables only. Verification anchor for downstream audit / cleanup phases.

### Rule implementation mechanism

- **D-05 (no-restricted-syntax regex on Literal):** New selectors live in `eslint.config.mjs` under the existing frontend override block, alongside the RTL selectors at lines 148–198 and the vi-mock guard at lines 230–238. Two new selectors:
  - **Raw hex:** `Literal[value=/#[0-9a-fA-F]{3,8}\b/]` — fires on any string literal whose value contains a hex color of 3, 4, 6, or 8 hex digits. Comments (`/* #1A1D26 */`) are AST `Block` / `Line` nodes, not `Literal` — the rule does NOT fire on them (D-08). Scoped to `frontend/src/**/*.{ts,tsx}` via the existing `files` glob; CSS coverage handled via the same selector grammar (PostCSS / stylelint integration NOT needed — ESLint reads CSS only when a CSS plugin is registered, which Phase 51 does not introduce; the CSS `.css` portion of the requirement is met by the `frontend/src/index.css` token allowlist + grep gate in CI rather than an ESLint-on-CSS pass). Files in Tier-B allowlist (D-03) get a per-file override turning the rule off.
  - **Tailwind palette literal:** `Literal[value=/(?:^|\\s)(?:(?:[a-z-]+:)*)(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|accent|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\\d{2,3}\\b/]` — fires on any string literal containing a Tailwind palette utility (with optional variant chain like `dark:` / `hover:` / `md:` / `aria-disabled:`) on any of the 21 banned palette names. Token-mapped utilities (`text-ink`, `bg-accent`, `text-success`, etc.) NEVER match because their names are not in the banned palette enumeration; no token-utility allowlist needs to be maintained in the rule.
  - Both selectors live inside the existing `files: ['frontend/**/*.{ts,tsx}']` block at line 72, so they automatically respect the existing `components/ui/**` carve-out at line 215. No new plugin dependency, no new GHA wiring.
- **D-06 (token-utility allowlist is implicit, not enumerated):** Because the palette-literal regex matches ONLY the 21 banned palette names, every `@theme`-mapped utility passes by default — including the full enumeration from `frontend/src/index.css` (`bg`, `surface`, `surface-raised`, `ink`, `ink-mute`, `ink-faint`, `line`, `line-soft`, `sidebar`, `sidebar-ink`, `accent`, `accent-ink`, `accent-soft`, `accent-fg`, `accent-foreground`, `danger`, `danger-foreground`, `success`, `success-foreground`, `warning`, `warning-foreground`, `ok`, `warn`, `info`, `info-foreground`, `sla-ok`, `sla-risk`, `sla-bad`, `primary`, `primary-foreground`, `foreground`, `muted-foreground`, `border`, `input`, `background`, `card`, `card-foreground`, `popover`, `popover-foreground`, `destructive`, `destructive-foreground`, `muted`, `secondary`, `secondary-foreground`). No drift risk if new tokens are added to `@theme` — they automatically pass without rule edits.
- **D-07 (variant prefix coverage):** The palette-literal regex's `(?:[a-z-]+:)*` prefix group catches every variant chain: `dark:text-red-400`, `hover:bg-red-500`, `md:dark:hover:text-amber-600`, `aria-disabled:text-gray-400`, etc. Forces BOTH light- and dark-mode color usage through `@theme` tokens (which already provide dark-mode values via `--accent-fg` etc.). Eliminates the "dark variant snuck in" failure mode.
- **D-08 (CSS files — AST Literal only, comments untouched):** The new selectors fire on AST `Literal` nodes (TypeScript / JSX string values). CSS comment syntax (`/* ... */`) is parsed as a comment node by the ESLint CSS-aware parser, NOT a Literal — so `modern-nav-tokens.css` lines like `--icon-rail-bg: hsl(220 15% 10%); /* #1A1D26 */` stay valid. CSS `.css` source-file enforcement is satisfied by (a) the existing `frontend/src/index.css` allowlist entry in Tier-B (the only file with raw hex in CSS declarations) and (b) `modern-nav-tokens.css` allowlist entry. No new CSS-pass ESLint plugin introduced.

### CI gate + smoke PR

- **D-09 (Fold into existing Lint context — no new GHA job):** The new selectors live in `eslint.config.mjs` and run under the existing `Lint` PR-blocking branch-protection context that Phase 48 D-15 wired on `main` (`type-check`, `Lint`, `Security Scan`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`). No new required-context PUT on branch protection. The roadmap's "new PR-blocking branch-protection context for design-token compliance" is satisfied semantically — the rule is NEW and the context is PR-blocking. Saves a CI checkout + install pair vs. a dedicated `Design Tokens` job; failure attribution stays clear because ESLint output cites the selector name.
- **D-10 (Smoke PR proves BLOCK):** Mirrors Phase 48 D-16 / Phase 50 D-13 pattern. One smoke PR injects a known-bad literal into a real component (candidate: a temporary `<div className="bg-red-500">` in a route-level component, or `dark:text-blue-400`) and proves: (1) GitHub Actions `Lint` job exits red, (2) `gh pr view --json mergeStateStatus` returns `BLOCKED`, (3) PR closed without merge. Branch-protection-API response alone is NOT sufficient (Phase 47 D-13 precedent). Smoke PR URL recorded in `51-SUMMARY.md`.
- **D-11 (semantic-colors.ts as canonical migration anchor):** `frontend/src/lib/semantic-colors.ts` already maps dossier-type / status / sentiment colors to Tailwind utilities (`bg-primary/10`, `text-primary`, `bg-success/10`, etc.) — these utilities ALL pass the new selectors because they target `@theme`-mapped names. Tier-A fixes default to either (a) `semantic-colors.ts` import if the use case matches an existing map entry, or (b) direct token utility (`text-success`, `bg-danger/10`) for one-off literals. Both paths are valid. Adding a new entry to `semantic-colors.ts` is NOT required for every Tier-A swap — keeps the map focused on actually-shared color semantics.

### Suppression posture + Phase 48 carry-forward

- **D-12 (Zero net-new eslint-disable outside Tier-C):** Mirrors Phase 48 D-17. Executor greps the diff for new `eslint-disable*` strings before commit; failure if the count exceeds the explicit Tier-C count tracked in `51-DESIGN-AUDIT.md`. Each Tier-C disable carries a phase-and-row annotation (`/* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<filename> */`). No file-top blanket disables. No disables outside Tier-C rows.
- **D-13 (Tier-B = OFF, not disable):** Tier-B exemption uses the ESLint config-level `rules: { 'no-restricted-syntax': 'off' }` override per the `components/ui/**` precedent at lines 215–221 — a config-level decision recorded in `eslint.config.mjs`. Tier-C uses in-source `eslint-disable-next-line` — a per-Literal annotation recorded in the source file with a back-pointer to the audit row. The two mechanisms are NOT interchangeable: Tier-B is a permanent design statement; Tier-C is a queued-for-cleanup marker.

### Phase 50 dependency posture

- **D-14 (Plan now, execute after Phase 50 ships):** ROADMAP says Phase 51 depends on Phase 50 ("green test infra so lint-driven fixes don't mask test regressions"). Phase 50 is at the human-verify branch-protection checkpoint (STATE.md, `.continue-here.md`); code-side work is committed at `720d135a`. Phase 51 planning (`/gsd-plan-phase 51`) can proceed NOW because plan content depends on `eslint.config.mjs` structure (not on test infra). Plan execution waits for Phase 50 ship — the executor must confirm `pnpm --filter frontend test` exits 0 on the base commit before applying Tier-A fixes, so a Tier-A literal swap that quietly breaks a test surfaces immediately.

### Claude's Discretion

- D-01: Plan slicing (one plan covering rule + Tier-A + audit + smoke PR, vs. one plan per tier) — planner's call. Phase 48 ran rule-config + violation-fix as a single phase under multiple plans; same shape is reasonable here.
- D-02: Order of Tier-A files within the executor wave — `WorldMapVisualization.tsx` and `PositionEditor.tsx` are the named anchors per ROADMAP, but a mechanical-swap pass (status/badge/alert) may go either before or after. Executor's call.
- D-03 vs D-04 boundary: Whether a file with mixed Tier-B and Tier-C content (e.g., a chart that has both palette literals for series AND a one-off `text-red-500` for an error banner) gets fully Tier-B'd or has the error-banner literal split out for Tier-A. Planner's call per file — default: Tier-B if more than 3 literals; Tier-A if the literal is unambiguously a status / error / badge that maps cleanly.
- D-05: Exact regex grammar for the palette-literal selector — the published shape in D-05 above is a starting point; planner may simplify or generalize (e.g., adding `accent`, `decoration` etc. as redundant since they were already in the regex). Either choice satisfies the success criteria.
- D-09: Whether the rule fires under `Lint` only, or also under a quick `pnpm lint:design-tokens` local script for pre-commit fast feedback. Planner's call; not required.
- D-10: Smoke PR style (separate PR vs. branch on a deliberately broken commit pushed to a throwaway branch) — executor judgment. The verification anchor is `mergeStateStatus = BLOCKED`.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope + requirements

- `.planning/ROADMAP.md` §"Phase 51: Design-Token Compliance Gate" — Goal, depends-on, requirements list, 4 success criteria (lines covering DESIGN-01..04).
- `.planning/REQUIREMENTS.md` §"Design tokens (DESIGN)" — DESIGN-01..04 verbatim with file-glob scopes and exact regex prose.
- `.planning/STATE.md` — Phase 50 branch-protection checkpoint state (informs D-14 dependency posture); existing required-contexts list (informs D-09).

### Prior phase context (carry-forward decisions)

- `.planning/phases/48-lint-config-alignment/48-CONTEXT.md` — Phase 48 D-15 (Lint as PR-blocking required context), D-16 (smoke-PR proof pattern), D-17 (zero net-new `eslint-disable`). D-09 / D-10 / D-12 build directly on these.
- `.planning/phases/50-test-infrastructure-repair/50-CONTEXT.md` — Phase 50 D-04 (audit artifact pattern — informs D-04 audit shape), D-13 (two PR-blocking contexts + smoke PR — informs D-09/D-10), D-15 (project-local ESLint rule shape — alternative D-05 considered, rejected for Phase 51 in favor of `no-restricted-syntax` simplicity).
- `.planning/phases/50-test-infrastructure-repair/.continue-here.md` — Phase 50 status + critical anti-patterns (branch-protection ordering, required-contexts payload). Phase 51 inherits the branch-protection PATCH posture by reusing the same context (no new PUT).

### Project conventions (non-negotiable — DESIGN-01..04 source of truth)

- `CLAUDE.md §"Visual Design Source of Truth (READ BEFORE ANY UI WORK)"` — the IntelDossier prototype path, FOUC bootstrap byte-match rule, design rules ("No raw hex. No Tailwind color literals."). Justifies Tier-B allowlist for `directions.ts` / `index.css` / `bootstrap.js` (D-03).
- `CLAUDE.md §"Design rules — non-negotiable"` — explicit list of forbidden patterns (`text-blue-500` cited) and required token names (`bg-bg`, `bg-surface`, `text-ink`, `border-line`, `bg-accent`). Source of truth for the rule's regex and the implicit token-utility allowlist (D-05, D-06).
- `CLAUDE.md §"Definition of Done — UI checklist"` — "All colors resolve to design tokens (no raw hex; no `text-blue-500`)". Anchors the verification step for Tier-A swaps.

### ESLint / CI wiring (read before changing)

- `eslint.config.mjs` lines 70–200 (frontend override block) — existing `files: ['frontend/**/*.{ts,tsx}']` scope, `no-restricted-imports` patterns (lines 113–145), `no-restricted-syntax` RTL selectors (lines 148–198), the precedent shape for D-05's new selectors.
- `eslint.config.mjs` lines 215–221 — existing `components/ui/**` carve-out via `'no-restricted-syntax': 'off'`. Pattern reused for Tier-B allowlist (D-03 / D-13).
- `eslint.config.mjs` lines 224–240 — Phase 50 D-15 vi-mock guard. Lives in the same file alongside D-05's new selectors — reinforces "one file owns lint policy" posture from Phase 48 D-01.
- `eslint.config.mjs` lines 11–25 — global `ignores:` block. New per-rule ignores in D-03 go via per-section `files` + `rules: { ...: 'off' }` blocks, NOT the global `ignores`, because Tier-B files still need every OTHER rule active.
- `frontend/package.json` `lint` script — `eslint -c ../eslint.config.mjs src/...` per Phase 48 D-02. New rule activates automatically with no script change.
- `.github/workflows/ci.yml` `Lint` job — runs `pnpm lint` workspace-wide via `turbo run lint`. No YAML changes for D-09.

### Token system (where the regex's implicit allowlist lives)

- `frontend/src/index.css` §`@theme` block (lines 43–110) — full enumeration of `--color-*` names that resolve to `@theme`-mapped Tailwind utilities. The regex's "banned palette" list deliberately excludes every name in this block, so no rule-side allowlist enumeration is needed (D-06).
- `frontend/src/design-system/tokens/directions.ts` — `PALETTES` constant; the source of truth for raw hex per direction. Tier-B allowlisted (D-03).
- `frontend/public/bootstrap.js` — FOUC-safe palette literal block (must byte-match `directions.ts`). Tier-B allowlisted (D-03).
- `frontend/src/lib/semantic-colors.ts` — Tailwind-utility mapping module (dossier-type colors, sentiment, status, sla, persona). Canonical migration target for Tier-A swaps where a shared semantic exists (D-11). Already uses token-mapped utilities (`bg-primary/10`, `text-warning`); NOT a violation source.
- `frontend/src/styles/modern-nav-tokens.css` — secondary token file (nav-rail tokens). Tier-B allowlisted (D-03). Comment-side hex stays (D-08).

### Known violation anchors (for Tier-A worklist)

- `frontend/src/components/territory-map/WorldMapVisualization.tsx:193` `lineColor="#3B82F6"` — raw hex passed to a React-Flow / map prop. Tier-A fix per ROADMAP success criterion 3.
- `frontend/src/components/position-editor/PositionEditor.tsx` lines 211, 237 (`text-blue-600 underline`), 410 (`border-red-200 bg-red-50`), 412 (`text-red-800`), 531 (`text-red-600`) — Tier-A fixes per ROADMAP success criterion 3.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Phase 48 ESLint rule shape** — `eslint.config.mjs` already has eleven `no-restricted-syntax` selectors for RTL (lines 148–198) using `Literal[value=/regex/]`. D-05's two new selectors slot into the same array; no new plugin, no new file.
- **Phase 48 `components/ui/**`carve-out** — lines 215–221 turn off`no-restricted-syntax`for a specific file glob via`rules: { 'no-restricted-syntax': 'off' }`. Tier-B (D-03) reuses this exact shape.
- **Phase 48 D-15 PR-blocking Lint context** — `Lint` is already on `main` branch protection (`gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection`). D-09 needs no new PUT.
- **Phase 50 D-13 smoke PR pattern** — proven recipe for `mergeStateStatus = BLOCKED` verification. D-10 follows it.
- **Phase 50 D-04 audit artifact shape** — `50-TEST-AUDIT.md` columns (workspace, file, failure class, disposition, rationale). D-04 audit artifact mirrors this with design-token-specific columns.
- **`frontend/src/lib/semantic-colors.ts`** — already provides `dossierTypeColors`, `sentimentColors`, `statusColors`, `slaColors`, `personaColors` Tailwind-utility maps using token-mapped names. Anchor for D-11 mechanical Tier-A swaps.
- **`frontend/src/index.css` `@theme` block** — every token-mapped utility is declared once; new tokens auto-allow without rule edits (D-06).

### Established Patterns

- **`Literal[value=/regex/]` selector grammar with anchored `\\b` word boundary** — used by all eleven Phase 48 RTL selectors. D-05's hex + palette-literal regexes follow the same shape. Examples: lines 151 (`/\\bml-/`), 167 (`/\\btext-left\\b/`), 175 (`/\\bleft-/`).
- **Single-message-per-rule policy** — every `no-restricted-syntax` selector in `eslint.config.mjs` has its own `message:` field that names the canonical fix (e.g., line 152: "Use ms-_ (margin-start) instead of ml-_ for RTL support."). D-05's new selectors follow the pattern: hex rule cites `CLAUDE.md §Design rules`; palette-literal rule cites `frontend/src/index.css @theme block` and `semantic-colors.ts`.
- **Per-file rule overrides via additional `files`-blocks** — the canonical pattern for Tier-B (D-03 / D-13). NOT the global `ignores:` block, which would also disable file-naming and import rules. Each Tier-B file needs ONLY `no-restricted-syntax` off; everything else stays on.
- **No emoji in messages** — CLAUDE.md §"No emoji in user-visible copy" applies to ESLint rule messages (Phase 48 D-06 documented this — replaced the 💡-prefixed Aceternity message). D-05's new messages contain none.
- **Variant prefix matching via `(?:[a-z-]+:)*`** — supports the Tailwind variant chain syntax (`dark:`, `hover:`, `md:`, `aria-*:`, compound like `md:dark:hover:`). Captures D-07 dark-mode coverage in a single regex.

### Integration Points

- **`eslint.config.mjs` (D-01..D-08, D-13)** — primary structural change. Two new selectors in the frontend override block; ~12 Tier-B file overrides appended. No new files.
- **`frontend/src/components/territory-map/WorldMapVisualization.tsx`** + **`frontend/src/components/position-editor/PositionEditor.tsx`** — Tier-A anchor files (D-02).
- **Tier-A status / badge / alert files** — ~50–80 files (estimate from sweep) with simple `text-red-*` / `bg-amber-*` / `text-emerald-*` literals; mechanical token swap via `text-danger` / `bg-warning/10` / `text-success`.
- **`51-DESIGN-AUDIT.md`** (D-04) — new file in `.planning/phases/51-design-token-compliance-gate/`. One row per Tier-C file.
- **`51-SUMMARY.md`** — records smoke PR URL (D-10) and branch-protection state (no new PUT but the existing list is re-noted for posterity).
- **GitHub branch protection on `main`** — NO change in Phase 51 (D-09). Existing required-contexts list reused as-is.
- **`pnpm lint` workspace-wide** — must exit 0 with new selectors active (DESIGN-04 / D-01 verification anchor).
- **`turbo.json` `lint` task** — no change; `eslint.config.mjs` is read at startup; new selectors active automatically.

### Sweep delta (from rg, 2026-05-14)

- **Raw hex in tsx/ts in `frontend/src`:** 337 matches across files. Hotspot files: `MiniRelationshipGraph.tsx` (20), `CommitmentFulfillmentChart.tsx` (11), `background-boxes.tsx` (9, in `components/ui/**` so already off via existing carve-out), `InfluenceMetricsPanel.tsx` (8), `ReportPreview.tsx` (8), `cn.tsx` flag SVG (6), `RelationshipGraph.tsx` (6), `ChartWidget.tsx` (5), `AnalyticsPreviewOverlay.tsx` (5), other flag SVGs (3–4 each). Virtually all hex hits fall under Tier-B (D-03).
- **Tailwind palette literals (banned palette names, excluding `components/ui/**`and`**tests**/**`):** ~2,950 occurrences across ~315 files. Distribution: status/badge/alert one-offs across `routes/`, `pages/`, `components/`. The planner's first task is producing a per-file violation histogram (analogue of Phase 47's per-error-code histogram + Phase 48's per-rule histogram) so the executor can size the Tier-A vs Tier-C cut. Heuristic: files with ≤ 5 palette literals and clear semantic mapping go Tier-A; files with > 5 literals or chart/graph content go Tier-B/Tier-C.
- **Variant prefix presence:** `dark:` variants confirmed in `RegisterPage.tsx`, `router/index.tsx`, `styles/list-pages.css` selectors. D-07 regex covers these via `(?:[a-z-]+:)*`.

</code_context>

<specifics>
## Specific Ideas

- **Roadmap's "two files" framing is a known undercount, not a scope re-statement.** ROADMAP §Phase 51 names `WorldMapVisualization.tsx:193` + `PositionEditor.tsx` because they were the visible anchors during v6.2 audit. The phase boundary is the full design-token gate per DESIGN-01..04 — DESIGN-03 says "plus any others surfaced by sweep". D-01 / D-02 codify that explicit "surfaced by sweep" expectation as the tri-tier triage.
- **D-06's implicit-allowlist trick is the key insight.** Because every banned palette name is enumerated in the regex and every token-mapped utility uses a name OUTSIDE that enumeration, the rule self-maintains as new tokens get added to `@theme`. No rule-side change needed when `text-some-new-token` lands in `index.css`. Mirrors Phase 48's posture that lint policy lives in one file and stays declarative.
- **Tier-B is a permanent design statement; Tier-C is a queue.** D-13 separates the two so future agents know which files will NEVER be migrated (charts need a separate palette system) versus which are temporarily exempt pending a follow-up phase. This distinction matters for downstream prioritization (Tier-C audit rows have follow-up phase tickets; Tier-B rows do not).
- **Phase 50 dependency is for execution, not planning.** D-14 splits the dependency: plan content is structural (eslint config + tier triage) and depends on `eslint.config.mjs` + ROADMAP, not on test infra. Plan execution depends on Phase 50 because a Tier-A swap that breaks a test must surface immediately. This mirrors Phase 48's posture that ran in parallel with Phase 47 type-check work but waited for Phase 47 zero-state before flipping the required-contexts switch.
- **Smoke PR target is a real component, not a fixture.** D-10 follows the Phase 48 D-16 precedent: real-component injection proves the gate fires under realistic conditions. The Phase 50 D-15 `tools/eslint-fixtures/bad-vi-mock.ts` pattern (deliberate-bad-fixture file scoped into the rule's `files` glob) is the alternative — viable here as a permanent regression fixture, but the smoke PR is the proof-of-block step regardless.

</specifics>

<deferred>
## Deferred Ideas

- **Chart palette tokens.** The Tier-B chart files (`*Chart.tsx`, `MiniRelationshipGraph.tsx`, `RelationshipGraph.tsx`, `ReportPreview.tsx`, etc.) use discrete series palettes that have no `@theme` equivalent. A future "chart palette tokens" phase would add `--chart-series-1` … `--chart-series-8` to `index.css` and migrate these files. Out of Phase 51 scope; tracked in roadmap backlog.
- **Tier-C cleanup waves.** `51-DESIGN-AUDIT.md` rows queue files for one or more future "design-token Tier-C cleanup" phases. Estimated 200–250 files across 2–4 future phases depending on slicing.
- **CSS-side ESLint pass.** Phase 51 satisfies DESIGN-01's `.css` scope via file allowlist for the two token-definition CSS files. A future phase could introduce `eslint-plugin-css` or `stylelint` integration to enforce the rule on CSS Declarations directly. Out of scope; D-08 sidesteps the ambiguity by relying on the file allowlist.
- **Pre-commit `pnpm lint:design-tokens` fast-feedback script.** Mentioned in D-09 Claude's-discretion notes. Useful for developer-local feedback before push; not required for the PR-blocking gate. Planner may add or skip.
- **`tools/eslint-plugin-intl-dossier/` project-local plugin scaffold.** Phase 50 D-15 proposed this path for `vi-mock-exports-required`. Phase 51 D-05 explicitly chose `no-restricted-syntax` over a local plugin because the two new rules fit the regex-on-Literal pattern cleanly. The plugin scaffold is still a viable future investment if 3+ project-local rules accumulate.
- **Migrating `lib/semantic-colors.ts` to direct token utilities.** D-11 confirms `semantic-colors.ts` Tailwind-utility maps stay valid. A future refactor could replace the indirection with direct token-utility imports (`text-success` at call sites instead of `statusColors.completed.text`). Aesthetic, not correctness; deferred.
- **Re-enabling `TODO(Phase 2+)` disabled rules in `eslint.config.mjs`.** Phase 48 D-09 deferred re-enablement; Phase 51 does NOT touch it.

</deferred>

---

_Phase: 51-design-token-compliance-gate_
_Context gathered: 2026-05-14_
