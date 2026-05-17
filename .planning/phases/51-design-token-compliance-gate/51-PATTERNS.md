# Phase 51: Design-Token Compliance Gate — Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 1 config (modify) + 2 anchor TSX (modify) + 80–120 Tier-A sweep TSX (modify, executor-derived) + ~145 Tier-C TSX (modify, audit-driven inline disables) + 3 planning artifacts (create) + 1 optional fixture (create)
**Analogs found:** 7 / 7 (every file/operation has a verified in-tree analog from Phases 48 and 50)

The driving insight: **Phase 51 is structurally a Phase-48 lift.** Two new `no-restricted-syntax` selectors sit alongside the eleven Phase-48 RTL selectors (`eslint.config.mjs:148–198`); Tier-B per-file rule overrides reuse the Phase-48 `components/ui/**` carve-out shape verbatim (`eslint.config.mjs:215–221`); the Tier-A token-swap pass copies the surgical-change posture from Phase 48-02's RTL physical-property fixes; the smoke-PR proof copies Phase 48 D-16 / Phase 50-05 PR #11 verbatim. The optional regression fixture is a direct echo of `tools/eslint-fixtures/bad-vi-mock.ts` (Phase 50 D-15). No new plugin, no new CI job, no new branch-protection PUT — every moving part has a precedent.

The one structural addition Phase 51 introduces is the **`TemplateElement[value.raw=/…/]`** companion selector, which closes a template-literal blind spot the Phase 48 RTL selectors share but never had to address (RTL utilities don't combine with variant prefixes; design-token utilities do, via `dark:`, `hover:`, `md:`, `aria-*:`). The companion selector follows the same `Literal[value=/…/]` regex grammar — only the AST node type differs.

## File Classification

| File                                                                                                                                                                                             | Role                  | Data Flow                                     | Closest Analog                                                                                                                                                                                 | Match Quality                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `eslint.config.mjs` (modify — add 2/3 new selectors + Tier-B override block)                                                                                                                     | config                | transform / lint policy                       | self — lines 148–198 (Phase 48 RTL selectors) + lines 215–221 (Phase 48 `components/ui/**` carve-out) + lines 224–240 (Phase 50 D-15 vi-mock guard)                                            | exact (self-extend)                          |
| `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx:193` (modify — raw hex swap)                                                                                         | component             | transform (one SVG prop)                      | self (line 182 already uses `border: '1px solid var(--line)'` — adjacent CSS-var read precedent in same file) + `frontend/src/lib/semantic-colors.ts:graphNodeColors` (CSS-var-string pattern) | exact (in-file analog)                       |
| `frontend/src/components/position-editor/PositionEditor.tsx` (modify — 19 palette literal swaps at lines 211, 237, 410, 412, 441, 442, 449, 486, 487, 495, 531)                                  | component             | transform (className strings + tiptap config) | `frontend/src/lib/semantic-colors.ts` (`bg-primary/10`, `text-warning` token-utility shape) + the in-prototype card example (`inteldossier_handoff_design/src/dashboard.jsx`)                  | exact (token-utility map)                    |
| ~80–120 Tier-A mechanical sweep files (e.g. `routes/_protected/admin/system.tsx`, `pages/MyAssignments.tsx`, `components/forms/FormErrorDisplay.tsx`, `components/dossier/DossierTypeGuide.tsx`) | component / route     | transform (className mechanical swap)         | `PositionEditor.tsx` (once swapped) + `frontend/src/lib/semantic-colors.ts` token map                                                                                                          | exact (same swap recipe)                     |
| ~145 Tier-C audited disable files (per-Literal inline disables)                                                                                                                                  | source                | transform (per-line comment annotation)       | Phase 48-02 D-17 net-new disable pattern (per-Literal `// eslint-disable-next-line ...` with phase rationale, scanned via `git diff phase-N-base..HEAD \| grep eslint-disable`)                | role-match (same shape, different rule name) |
| `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` (create)                                                                                                                   | docs / audit artifact | —                                             | `.planning/phases/50-test-infrastructure-repair/50-09-DISCOVERY.md` audit shape + `48-VERIFICATION.md` table-row shape + CONTEXT D-04 spec                                                     | exact (audit-table precedent)                |
| `.planning/phases/51-design-token-compliance-gate/51-SUMMARY.md` (create)                                                                                                                        | docs / audit artifact | —                                             | `.planning/phases/50-test-infrastructure-repair/50-05-SUMMARY.md` (smoke PR URL + protection state snapshot pattern)                                                                           | exact                                        |
| `tools/eslint-fixtures/bad-design-token.tsx` (optional create — permanent regression fixture)                                                                                                    | test fixture          | —                                             | `tools/eslint-fixtures/bad-vi-mock.ts` (Phase 50 D-15 fixture; 11 lines; identical shape — file under existing `tools/eslint-fixtures/**/*.{ts,tsx}` glob in `eslint.config.mjs:227`)          | exact (verbatim shape)                       |
| Smoke PR `smoke/phase-51-design-token-gate` (ephemeral branch + PR)                                                                                                                              | CI proof              | —                                             | Phase 48 PR #7 (in-tree JSX literal injection) + Phase 50-05 PR #11 (dedicated test file injection)                                                                                            | exact (verbatim recipe in RESEARCH §3)       |

**Files NOT touched** (per CONTEXT and RESEARCH):

- `.github/workflows/ci.yml` — D-09 folds under existing `Lint` job
- `main` branch protection — required-contexts already include `Lint`
- `frontend/package.json` / `backend/package.json` `lint` script — `pnpm lint` picks up new selectors automatically
- `turbo.json` `globalDependencies` — already lists `eslint.config.mjs`
- `frontend/src/index.css`, `frontend/src/styles/modern-nav-tokens.css`, `frontend/src/design-system/tokens/directions.ts`, `frontend/public/bootstrap.js` — Tier-B allowlisted; raw hex IS the design value
- `frontend/src/components/signature-visuals/flags/**` — Tier-B allowlisted (ISO 3166-1 sovereign colors)
- All Tier-B chart / graph / report-preview files (D-03 enumeration)

## Pattern Assignments

### `eslint.config.mjs` (root, modify) — config / transform

**Analog:** self — three precedents inside the same file:

1. **`Literal[value=/regex/]` selector grammar** — `eslint.config.mjs:148–198` (11 Phase 48 RTL selectors)
2. **Per-file rule override via `'no-restricted-syntax': 'off'`** — `eslint.config.mjs:215–221` (Phase 48 `components/ui/**` carve-out)
3. **Test-files override block shape** — `eslint.config.mjs:224–240` (Phase 50 D-15 vi-mock guard, including the existing `tools/eslint-fixtures/**/*.{ts,tsx}` glob at line 227 — Phase 51's optional regression fixture rides under this glob without a new `files:` entry)

**Imports pattern** (no change — D-05 adds zero new plugins). The existing imports at lines 1–8 are sufficient:

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import checkFile from 'eslint-plugin-check-file'
import rtlFriendly from 'eslint-plugin-rtl-friendly'
import eslintConfigPrettier from 'eslint-config-prettier'
```

**D-05 selector-extension pattern** — append three selectors to the existing `no-restricted-syntax` array in the frontend override block at `eslint.config.mjs:148–198`. The donor shape is line 167–169 (a single `Literal[value=/\bword\b/]` selector with a `message:` field):

Source shape (existing — verbatim at `eslint.config.mjs:167–169`):

```js
{
  selector: 'Literal[value=/\\btext-left\\b/]',
  message: 'Use text-start instead of text-left for RTL support.',
},
```

New selectors (D-05 + the companion `TemplateElement` selector closing the template-literal blind spot per RESEARCH Pitfall 1). Insert after the existing RTL selector at line 197 (the `border-r-` selector), inside the same array, BEFORE the closing `],` at line 198:

```js
// D-05 raw-hex selector — covers 3, 4, 6, and 8 hex digits (#fff, #ffff, #ffffff, #ffffffff).
// Fires on AST Literal nodes only — TS/CSS comments stay valid (D-08).
{
  selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
  message:
    'Raw hex colors are not allowed in frontend/src. Use a design token (var(--accent), var(--ink), var(--line), …) or a token-mapped Tailwind utility (text-accent, text-ink, border-line). See frontend/src/index.css @theme block and CLAUDE.md §Design rules — non-negotiable.',
},
// D-05 Tailwind palette-literal selector — variant-aware via (?:[a-z-]+:)*
// catches dark:, hover:, md:, aria-disabled: and compound chains (D-07).
{
  selector:
    'Literal[value=/(?:^|\\s)(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\\d{2,3}\\b/]',
  message:
    'Tailwind palette literals (text-blue-*, bg-red-*, border-amber-*, …) are not allowed in frontend/src. Use a token-mapped utility (text-accent, text-danger, text-success, text-warning, text-info, text-ink, bg-surface, border-line) or the semantic-colors.ts map. See frontend/src/index.css @theme block.',
},
// D-05 companion — close the template-literal blind spot (12 known files in frontend/src
// embed palette literals inside untagged template strings). TemplateElement is the AST node
// the Literal selector misses.
{
  selector:
    'TemplateElement[value.raw=/(?:^|\\s)(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\\d{2,3}\\b/]',
  message:
    'Tailwind palette literals are not allowed in frontend/src — including inside template literals. Use a token-mapped utility (text-accent, text-danger, text-success, text-warning, text-info, text-ink, bg-surface, border-line) or the semantic-colors.ts map.',
},
```

**Why this analog is exact:** Phase 48 D-06 (Phase 48-01) added the very RTL selectors above using the same `Literal[value=/regex/]` shape. The new selectors plug into the same array, in the same override block, with no new plugin import. The companion `TemplateElement` selector uses the same regex string against a different AST property (`value.raw` vs. `value`) — the typescript-eslint parser exposes both. No drift surface.

**D-03 Tier-B file-level carve-out** — append a NEW override block AFTER line 221 (the `components/ui/**` block) and BEFORE line 224 (the test-mock guard block). The donor shape is `eslint.config.mjs:215–221` verbatim:

Donor shape (existing — verbatim at `eslint.config.mjs:215–221`):

```js
// ── UI library exception: allow any + physical CSS in wrappers ────
{
  files: ['frontend/**/components/ui/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
},
```

New Tier-B block to insert (D-03 enumeration):

```js
// ── Design-token Tier-B carve-out (Phase 51 D-03 / D-13) ──────────
// Permanent design statements: token-definition + bootstrap files where raw hex
// IS the design value (must byte-match per CLAUDE.md §Visual Design Source of
// Truth); signature-visual flag SVGs (ISO 3166-1 sovereign codepoints); chart /
// graph palettes with no @theme equivalent (deferred until "chart palette
// tokens" phase). NOT deferred work — these never migrate.
{
  files: [
    'frontend/src/design-system/tokens/directions.ts',
    'frontend/public/bootstrap.js',
    'frontend/src/components/signature-visuals/flags/**/*.{tsx,ts}',
    'frontend/src/components/analytics/CommitmentFulfillmentChart.tsx',
    'frontend/src/components/analytics/RelationshipHealthChart.tsx',
    'frontend/src/components/analytics/WorkloadDistributionChart.tsx',
    'frontend/src/components/analytics/EngagementMetricsChart.tsx',
    'frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx',
    'frontend/src/components/analytics/ClusterVisualization.tsx',
    'frontend/src/components/analytics/sample-data.ts',
    'frontend/src/components/dashboard-widgets/ChartWidget.tsx',
    'frontend/src/components/sla-monitoring/SLAComplianceChart.tsx',
    'frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx',
    'frontend/src/components/stakeholder-influence/InfluenceReport.tsx',
    'frontend/src/components/relationships/RelationshipGraph.tsx',
    'frontend/src/components/dossier/MiniRelationshipGraph.tsx',
    'frontend/src/components/report-builder/ReportPreview.tsx',
  ],
  rules: {
    'no-restricted-syntax': 'off',
  },
},
```

Notes for the planner:

- `frontend/src/index.css` and `frontend/src/styles/modern-nav-tokens.css` are NOT in this `files:` array because the `frontend/**/*.{ts,tsx}` scope at line 72 doesn't include `.css`. They are protected by being outside the rule's file glob, not by an explicit override (D-08).
- `frontend/src/lib/semantic-colors.ts` is intentionally NOT included per RESEARCH Open Question 4 — its current content passes the new selectors without a carve-out, and including it preemptively would suggest false positives that don't exist. Leave it under the rule.
- Verify `MiniRelationshipGraph.tsx` actual path before commit — RESEARCH §"Files to Touch" flags it as potentially `frontend/src/components/dossiers/` (with `s`). `find frontend/src -name MiniRelationshipGraph.tsx` resolves this before the glob lands.
- `**Chart.tsx` is explicitly NOT used — each chart file is enumerated by name to avoid the future-glob-over-match pitfall (RESEARCH Pitfall 6).

**Optional D-10 regression fixture wiring** — if the optional `tools/eslint-fixtures/bad-design-token.tsx` ships, it lands automatically under the existing test-mock guard glob at `eslint.config.mjs:227` (`'tools/eslint-fixtures/**/*.{ts,tsx}'`). No new override block needed; the fixture file must contain a known-bad literal that fires the D-05 selectors.

Verification command (post-edit):

```bash
pnpm lint   # workspace-wide; MUST exit 0 with new selectors active
pnpm exec eslint -c eslint.config.mjs frontend/src/components/position-editor/PositionEditor.tsx  # confirms Tier-A swaps are clean
```

---

### `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx` (line 193 — raw hex swap) — component / transform

**Analog:** in-file precedent at line 182 (the adjacent `style={{ border: '1px solid var(--line)', ... }}` block already reads CSS variables for visual chrome). The file is already a mixed JS-side + CSS-side consumer of the token system — the swap extends the same pattern to the `lineColor` prop.

**Existing context** (lines 188–200 — current shape, verbatim from Read):

```tsx
<WorldMap
  dots={dots}
  markers={markers}
  lineColor="#3B82F6" // ← line 193 — the raw-hex violation
  theme="light"
  // ...
/>
```

**Token-mapping recipe** (RESEARCH §5.1 — three viable approaches; choose at execute time after a 30-min spike):

Recipe A (preferred when var() resolves in SVG): swap to `var(--accent)`.

```tsx
<WorldMap
  dots={dots}
  markers={markers}
  lineColor="var(--accent)" // ← Tier-A swap, recipe A
  theme="light"
  // ...
/>
```

Recipe B (fallback when var() does not resolve in the WorldMap's SVG renderer): runtime CSS-var read.

```tsx
// Inside the component body, before the return:
const accentColor = React.useMemo(
  () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  [],
)

// Then:
<WorldMap
  dots={dots}
  markers={markers}
  lineColor={accentColor}
  theme="light"
  // ...
/>
```

Recipe C (idiomatic — use the existing `graphEdgeColors` map at `frontend/src/lib/semantic-colors.ts:386`, which already returns `var(...)`-prefixed strings for React-Flow / data-viz consumers).

**Execute-time decision rule** (per RESEARCH Open Question 3): try Recipe A first (one-line change). Mount the component on a dev page; verify the SVG renders the connection lines with the theme accent color. If the SVG renderer fails to resolve `var()`, fall back to Recipe B. Recipe C is the cleanest long-term answer if the consumer already uses `graphEdgeColors`; for a one-prop swap, Recipe A is the surgical (Karpathy §3) choice.

**Visual-fidelity guarantee** (UI-SPEC §"Visual Fidelity Guarantee"):

- Bureau-light baseline at 1280px — pre-swap screenshot vs. post-swap screenshot. Hue shifts from blue 217° to Bureau accent terracotta 32° — that IS the intent (UI-SPEC: MINOR visual-diff risk, intentional).
- RTL + Tajawal — re-screenshot in `<html dir="rtl" lang="ar">`. Line color unchanged.
- Dark mode — toggle `--theme: dark` (or whatever DesignProvider invokes). Lines re-paint via the dark-side `--accent` value automatically.

---

### `frontend/src/components/position-editor/PositionEditor.tsx` (~19 palette literal swaps) — component / transform

**Analog:** `frontend/src/lib/semantic-colors.ts` (the token-utility map: `bg-primary/10`, `text-warning`, `border-success/30`, etc. — the canonical migration anchor per CONTEXT D-11). Also: the closest UI-prototype analog is `frontend/design-system/inteldossier_handoff_design/src/dashboard.jsx`'s Card / KPI patterns (per CLAUDE.md §"Required reading order before building or modifying any UI").

**Existing context** (5 named anchor sites from CONTEXT D-02, verbatim from Read):

- **Line 211** (tiptap `Link.configure` for English editor):
  ```tsx
  class: 'text-blue-600 underline',
  ```
- **Line 237** (tiptap `Link.configure` for Arabic editor):
  ```tsx
  class: 'text-blue-600 underline',
  ```
- **Lines 410–412** (error card):
  ```tsx
  <Card className="border-red-200 bg-red-50">
    <CardContent className="pt-4">
      <div className="flex items-center gap-2 text-red-800">
  ```
- **Line 531** (conflict dialog icon):
  ```tsx
  <AlertCircle className="size-5 text-red-600" />
  ```

**Additional mechanical sites** in the same file (lines 441, 442, 449, 486, 487, 495 — all matching `border-gray-300` / `bg-gray-100` / `focus:ring-blue-500` from the chrome pass; verify via `pnpm exec eslint -c eslint.config.mjs frontend/src/components/position-editor/PositionEditor.tsx` after the named swaps).

**Token-mapping recipe** (UI-SPEC §"Color" + Token-replacement contract + RESEARCH §5):

| Source utility (banned)                                                  | Token-mapped swap               | Source for the swap                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `text-blue-600 underline` (lines 211, 237 — tiptap Link decorations)     | `text-accent underline`         | UI-SPEC §"Token-replacement contract" row 1; `--color-accent` declared at `frontend/src/index.css:57`           |
| `border-red-200 bg-red-50` (line 410 — error card chrome)                | `border-danger/30 bg-danger/10` | UI-SPEC row 2; `--color-danger` at `index.css:64`; Tailwind v4 `/opacity` modifier is core syntax               |
| `text-red-800` (line 412 — error message body)                           | `text-danger`                   | UI-SPEC row 3; same token                                                                                       |
| `text-red-600` (line 531 — conflict-dialog icon)                         | `text-danger`                   | UI-SPEC row 4                                                                                                   |
| `border-gray-300` (lines 441, 449, 486, 495 — input + container borders) | `border-line` OR `border-input` | `--color-border: var(--line)` at `index.css:86`; `--color-input: var(--line)` at `index.css:87` — either passes |
| `bg-gray-100` (lines 442, 487 — `readOnly` disabled state)               | `bg-muted` OR `bg-line-soft`    | `--color-muted: var(--surface)` at `index.css:95`; semantic intent here is "disabled" → `bg-muted` reads better |
| `focus:ring-blue-500` (lines 441, 486 — focus ring)                      | `focus:ring-accent`             | `--color-ring: var(--accent)` at `index.css:98`; variant prefix preserved automatically                         |

**Mechanical diff shape** (lines 410–412, the error card):

```diff
- <Card className="border-red-200 bg-red-50">
+ <Card className="border-danger/30 bg-danger/10">
    <CardContent className="pt-4">
-     <div className="flex items-center gap-2 text-red-800">
+     <div className="flex items-center gap-2 text-danger">
        <AlertCircle className="size-4" />
        <span>{error}</span>
      </div>
    </CardContent>
  </Card>
```

**Visual-fidelity guarantee** (UI-SPEC §"Visual Fidelity Guarantee" applied to PositionEditor):

- Bureau-light baseline at 1280px — render with a sample document in both EN and AR locales. Screenshot link state and error card pre-swap. Swap. Re-render. Re-screenshot.
- Expected: link hue shifts from blue 217° to Bureau accent terracotta 32° (intentional MINOR diff per UI-SPEC).
- Expected: error card stays pale-red (Bureau danger oklch(52% 0.18 25) at 10% / 30% alpha — no perceivable shift from red-50 / red-200).
- RTL + Tajawal — Arabic editor's link hue swaps identically; no font-family or `textAlign: 'right'` introduced (CLAUDE.md RTL rule 3).
- Dark mode — both link and error card re-paint via dark-side token values.

**Surgical-change boundary** (CLAUDE.md §"Karpathy Coding Principles" §3):

- ONLY change the className strings at the cited line numbers. Do NOT reflow surrounding JSX, rename props, or refactor the tiptap config shape.
- Do NOT remove the trailing `,` on the tiptap config object — match existing style.
- Do NOT add new components, imports, or hooks.

---

### Tier-A mechanical-swap files (~80–120 files, executor-derived from rg sweep) — component / route / transform

**Analog:** `PositionEditor.tsx` (above) once swapped — every file in this wave follows the same token-mapping cookbook. The token map is the source of truth.

**Top-10 anchor files for the executor's worklist** (RESEARCH §2; sort by mechanical-swap potential, NOT raw hit count):

| File                                                                             | Palette hits | Disposition     | Reasoning                                                                  |
| -------------------------------------------------------------------------------- | -----------: | --------------- | -------------------------------------------------------------------------- |
| `frontend/src/components/position-editor/PositionEditor.tsx`                     |           19 | Tier-A          | D-02 anchor; full mechanical sweep                                         |
| `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx`     |        1 hex | Tier-A          | D-02 anchor; single raw hex                                                |
| `frontend/src/routes/_protected/admin/system.tsx`                                |           23 | Tier-A          | Status badges; mechanical                                                  |
| `frontend/src/routes/_protected/admin/data-retention.tsx`                        |           19 | Tier-A          | Admin status panels                                                        |
| `frontend/src/pages/MyAssignments.tsx`                                           |           17 | Tier-A          | Status/priority chips                                                      |
| `frontend/src/components/forms/FormErrorDisplay.tsx`                             |           20 | Tier-A          | Error/warning/info states                                                  |
| `frontend/src/components/forms/FormCompletionProgress.tsx`                       |           36 | Tier-A          | Progress states (green/red/amber)                                          |
| `frontend/src/components/duplicate-comparison/DuplicateComparison.tsx`           |           39 | Tier-A or split | Diff highlights — verify before commit                                     |
| `frontend/src/components/dossier/DossierTypeGuide.tsx`                           |           26 | Tier-A          | Type-color showcase; cross-check vs `semantic-colors.ts.dossierTypeColors` |
| `frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx` |           18 | Tier-A          | Work-item status chips                                                     |

**Sweep command** (verbatim from RESEARCH §2; planner regenerates at execute time):

```bash
PALETTE='(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\d{2,3}\b'

rg -c "$PALETTE" --type-add 'tsxts:*.{ts,tsx}' -ttsxts frontend/src/ 2>/dev/null \
  | grep -vE '/components/ui/|/signature-visuals/flags/|/analytics/.*Chart\.tsx|AnalyticsPreviewOverlay\.tsx|ChartWidget\.tsx|SLAComplianceChart\.tsx|InfluenceMetricsPanel\.tsx|InfluenceReport\.tsx|RelationshipGraph\.tsx|MiniRelationshipGraph\.tsx|ReportPreview\.tsx|semantic-colors\.ts|directions\.ts|tests/|__tests__|/index\.css|/modern-nav-tokens\.css|analytics/sample-data\.ts' \
  | sort -t: -k2 -rn
```

**Classification heuristic** (RESEARCH §2):

- File in D-03 enumerated Tier-B list → Tier-B
- File has >5 distinct palette-color families → Tier-C (likely chart/graph) — confirm by reading file
- File has ≤5 hits AND all are status/error/badge/alert → Tier-A (mechanical)
- File has 6–20 hits AND all hits map to ≤3 semantic categories → Tier-A (PositionEditor at 19 is the canonical case)
- File has >20 hits OR mixed semantics → Tier-C with `proposed_token_map` row in audit

**Token-mapping cookbook** (consolidated from UI-SPEC + RESEARCH §5):

| Banned palette                                                    | Target token utility                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `text-red-*`, `text-rose-*`                                       | `text-danger`                                                   |
| `bg-red-*` (status background)                                    | `bg-danger/10` (or `/5`)                                        |
| `border-red-*`                                                    | `border-danger/30` (or `border-danger`)                         |
| `text-amber-*`, `text-yellow-*`                                   | `text-warning`                                                  |
| `bg-amber-*`, `bg-yellow-*`                                       | `bg-warning/10`                                                 |
| `text-green-*`, `text-emerald-*`                                  | `text-success`                                                  |
| `bg-green-*`, `bg-emerald-*`                                      | `bg-success/10`                                                 |
| `text-blue-*` for **links**                                       | `text-accent`                                                   |
| `text-blue-*` for **info badges**                                 | `text-info`                                                     |
| `bg-blue-*` for info state                                        | `bg-info/10`                                                    |
| `text-gray/slate/zinc/neutral/stone-*` (body text)                | `text-muted-foreground` / `text-ink-mute` / `text-ink-faint`    |
| `bg-gray/slate/zinc/neutral/stone-*` (subtle bg)                  | `bg-muted` or `bg-line-soft`                                    |
| `border-gray/slate/zinc/neutral/stone-*`                          | `border-line` or `border`                                       |
| Variant-prefixed (`dark:text-blue-400`, `hover:bg-red-500`, etc.) | Variant prefix preserved: `dark:text-accent`, `hover:bg-danger` |
| `text-purple/violet/fuchsia/pink/indigo-*` (data-viz only)        | NO clean target — push to Tier-B (chart file) or Tier-C         |

**Surgical-change boundary** (Karpathy §3 + Phase 48-02 precedent):

- Each changed line traces directly to one of the D-02 rule entries.
- Do NOT refactor adjacent code, rename props, or "fix" things you noticed.
- Do NOT introduce new components, imports, or hooks.
- Match existing style (semicolons, quotes, JSX line-wrap).
- Match existing logical-property usage (CLAUDE.md §"Arabic RTL Support Guidelines"). Do NOT reintroduce `ml-*` / `pl-*` / `text-left` while swapping colors.

**Verification per file** (after each Tier-A swap):

```bash
pnpm exec eslint -c eslint.config.mjs <changed-file>   # MUST exit 0
```

---

### Tier-C audited disable files (~145 files, per-Literal inline disables) — source / transform

**Analog:** Phase 48 D-17 net-new-disable pattern + Phase 48-02 inline rationale shape. The exact comment shape comes from CONTEXT D-04 and is reproduced verbatim in UI-SPEC §"Copywriting Contract".

**Per-Literal disable shape** (CONTEXT D-04 + UI-SPEC §"Lint Rule Contract" §"Deferred"):

```tsx
return (
  <div
    // eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TriagePanel */
    className="text-yellow-700 dark:text-yellow-300"
  >
    {warningCount}
  </div>
)
```

**Rules** (CONTEXT D-04 + D-12):

- ONE disable per offending Literal — never bulk-disable at file top.
- The `<filename>` anchor in the comment matches the audit table row's `file` column (basename without extension, slug-safe).
- The disable comment goes ON THE LINE IMMEDIATELY BEFORE the offending Literal (this is what `eslint-disable-next-line` requires).
- For template-literal violations (caught by the third D-05 selector), the disable goes on the line containing the template expression — verify each case.

**D-12 net-new disable scan** (mirrors Phase 48-03 Task 6 verbatim):

```bash
# At phase open (first plan, before any source edit):
git rev-parse phase-51-base 2>/dev/null || git tag phase-51-base $(git rev-parse HEAD)
git push origin phase-51-base 2>/dev/null || true

# After all Tier-A + Tier-C waves land:
git diff phase-51-base..HEAD -- 'frontend/src' \
  | grep -E '^\+.*eslint-disable' \
  | grep -vE '^\+\+\+' \
  > /tmp/51-eslint-disable-additions.txt

wc -l < /tmp/51-eslint-disable-additions.txt   # MUST equal the Tier-C row count in 51-DESIGN-AUDIT.md
```

---

### `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` (create) — docs / audit artifact

**Analog:** Phase 50 D-04 audit-shape (`50-09-DISCOVERY.md`, `50-10-DISCOVERY.md`, etc.) + Phase 48 verification-table shape. CONTEXT D-04 spec is the column-list source of truth.

**Verified row shape** (RESEARCH §"Verified Pattern: 51-DESIGN-AUDIT.md row shape"):

```markdown
| file                                    | raw_hex_count | palette_literal_count | proposed_token_map                                                                                                                  | disposition     | follow_up_phase                        |
| --------------------------------------- | ------------: | --------------------: | ----------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------- |
| components/triage-panel/TriagePanel.tsx |             0 |                    53 | text-yellow-700 → text-warning; text-green-600 → text-success; text-orange-600 → text-warning (or accent if "in progress" semantic) | deferred-tier-c | TBD-design-token-tier-c-cleanup-wave-1 |
```

**Audit-file scaffold** (planner produces; populated by executor from the rg sweep delta):

```markdown
# Phase 51: Design-Token Compliance Gate — Tier-C Audit

**Generated:** <date>
**Total Tier-C rows:** <count>
**Total Tier-C `eslint-disable-next-line` annotations:** <count> (MUST equal D-12 diff-grep count)

## Tier-C Disposition Table

| file                      | raw_hex_count | palette_literal_count | proposed_token_map | disposition     | follow_up_phase |
| ------------------------- | ------------: | --------------------: | ------------------ | --------------- | --------------- |
| <one row per Tier-C file> |               |                       |                    | deferred-tier-c |                 |

## Slug index (for `# 51-DESIGN-AUDIT.md#<slug>` back-references)

- TriagePanel — components/triage-panel/TriagePanel.tsx
- <one slug per Tier-C file>
```

**Why this analog is exact:** Phase 50 D-04 (which produced `50-10-DISCOVERY.md` and similar) used the same `file | failure_class | disposition | rationale` column shape. Phase 51's columns are domain-specific (raw_hex_count, palette_literal_count, proposed_token_map) but the table-with-back-references pattern is identical.

---

### `.planning/phases/51-design-token-compliance-gate/51-SUMMARY.md` (create) — docs / audit artifact

**Analog:** `.planning/phases/50-test-infrastructure-repair/50-05-SUMMARY.md` (Phase 50 D-13 smoke-PR + protection-state snapshot pattern).

**Required sections** (lifted from `50-05-SUMMARY.md` lines 1–120):

1. **YAML frontmatter** — `phase`, `plan`, `subsystem`, `tags`, `requires`, `provides`, `affects`, `tech-stack`, `key-files`, `key-decisions`, `requirements-completed`, `duration`, `completed`.
2. **Accomplishments** — what shipped under D-05 / D-09 / Tier-A waves / Tier-C wave; commit SHAs.
3. **Verification** — `pnpm lint` exit code, smoke PR URL, `mergeStateStatus = BLOCKED` evidence, `enforce_admins = true` re-confirmation (no PUT performed).
4. **Pre-state / Post-state branch-protection JSON snapshots** — for Phase 51, the two snapshots are IDENTICAL (no PUT). Document this explicitly per RESEARCH §4.
5. **Smoke PR evidence** — PR number, run ID, `Lint = FAILURE` capture, PR closed `--delete-branch`.
6. **D-12 diff-grep evidence** — `wc -l` output equals Tier-C row count.

**Donor JSON snapshot shape** (verbatim from `50-05-SUMMARY.md:73–100`):

```json
{
  "enforce_admins": true,
  "contexts": [
    "type-check",
    "Security Scan",
    "Lint",
    "Bundle Size Check (size-limit)",
    "Tests (frontend)",
    "Tests (backend)"
  ],
  "strict": true,
  "reviews": null,
  "restrictions": null
}
```

(For Phase 51 the pre-state and post-state JSONs are identical — D-09 fold-into-existing-Lint posture.)

---

### `tools/eslint-fixtures/bad-design-token.tsx` (optional create — permanent regression fixture) — test fixture

**Analog:** `tools/eslint-fixtures/bad-vi-mock.ts` (Phase 50 D-15 fixture) — verbatim shape, 11 lines.

**Donor shape** (verbatim from `tools/eslint-fixtures/bad-vi-mock.ts`):

```ts
// Phase 50 D-15 regression fixture for vi-mock-exports-required.
// `pnpm lint tools/eslint-fixtures/bad-vi-mock.ts` MUST exit non-zero.
// The mock factory deliberately omits the SpreadElement from vi.importActual.
// See frontend/docs/test-setup.md §The react-i18next mock contract.

import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
```

**New shape** (Phase 51 equivalent — same comment-header rhythm, same one-violation-per-file size):

```tsx
// Phase 51 D-10 regression fixture for design-token compliance gate.
// `pnpm lint tools/eslint-fixtures/bad-design-token.tsx` MUST exit non-zero.
// Contains one banned Tailwind palette literal AND one raw hex literal so
// both D-05 selectors fire.
// See frontend/src/index.css @theme block and CLAUDE.md §Design rules.

const _bad = (
  <div className="bg-red-500" style={{ color: '#3B82F6' }}>
    smoke
  </div>
)

export {}
```

**Wiring:** the file lands automatically under the existing `tools/eslint-fixtures/**/*.{ts,tsx}` glob at `eslint.config.mjs:227` — no new override block needed.

**Verification command:**

```bash
pnpm lint tools/eslint-fixtures/bad-design-token.tsx   # MUST exit non-zero with D-05 messages
```

**Why optional:** the smoke PR is the canonical one-time gate-block proof per D-10. The fixture adds an EVERY-CI regression guard (matches Phase 50 D-15's "fixture survives forever" framing). RESEARCH §3 recommends shipping both; the planner's call per CONTEXT Claude's discretion item D-10.

---

### Smoke PR `smoke/phase-51-design-token-gate` (ephemeral branch + PR) — CI proof

**Analog:** Two precedents, both verbatim-usable:

1. **Phase 48 PR #7** — in-tree JSX literal injection (`<div className="text-left">x</div>` inside an existing render tree). Source: `.planning/phases/48-lint-config-alignment/48-03-ci-gate-and-branch-protection-SUMMARY.md`.
2. **Phase 50-05 PR #11** — dedicated smoke-test file at `frontend/tests/_smoke-50-05-gate.test.ts`. Source: `.planning/phases/50-test-infrastructure-repair/50-05-SUMMARY.md:33–34`.

**Recommended shape for Phase 51:** Phase 48 PR #7 pattern (in-tree JSX literal). UI-SPEC §"Copywriting Contract" provides the title and body verbatim.

**Verbatim recipe** (lifted from RESEARCH §3, condensed):

```bash
# 1) Pre-flight — confirm protection state
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --jq '.required_status_checks.contexts'
# Expected: ["type-check","Security Scan","Lint","Bundle Size Check (size-limit)","Tests (frontend)","Tests (backend)"]

# 2) On a smoke branch off main HEAD, inject ONE literal into an existing render tree.
#    Per Phase 48 Pitfall 3 — must be inside an already-rendered subtree so noUnusedLocals
#    doesn't pollute attribution with TS6133.
git fetch origin main
git checkout -b smoke/phase-51-design-token-gate origin/main

# Pick a non-load-bearing route file (e.g. frontend/src/App.tsx or a 404 route).
# Add inside the existing return tree:
#   <div className="bg-red-500">smoke</div>

git commit -m "chore(51-smoke): verify Lint blocks raw palette literal (DO NOT MERGE)"
git push -u origin smoke/phase-51-design-token-gate

# 3) Open PR (UI-SPEC §Copywriting Contract for verbatim title/body)
gh pr create --base main \
  --title "chore(51-smoke): verify Lint blocks raw palette literal" \
  --body "Smoke PR for Phase 51 DESIGN-04. Injects a deliberate bg-red-500 violation into <route-level component>. Expected: Lint job fails; mergeStateStatus=BLOCKED. Close without merge."

PR=$(gh pr view --json number -q .number)

# 4) Poll on 10–15s cadence; total wait < 5 min in practice
gh pr view "$PR" --json mergeStateStatus,statusCheckRollup \
  | jq '{mergeStateStatus, lint: (.statusCheckRollup[] | select(.name == "Lint"))}'

# 5) Required assertions
gh pr checks "$PR" --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'  # MUST be "fail"
gh pr view "$PR" --json mergeStateStatus -q .mergeStateStatus                              # MUST be "BLOCKED"

# 6) Close and delete
gh pr close "$PR" --comment "Smoke evidence captured for Phase 51 D-10. See 51-SUMMARY.md." --delete-branch
```

**Three load-bearing invariants** (carry forward from Phases 47-03 / 48-03 / 50-05 verbatim):

1. **`mergeStateStatus = "BLOCKED"`**, NOT `mergeable = "MERGEABLE"` (Phase 47-03 Issue 2 fix — `mergeable` is true for branches without git conflicts even when required checks fail).
2. **Branch name `smoke/phase-51-design-token-gate`** — visible "DO NOT MERGE" naming + Phase 48 D-16 prefix convention.
3. **`gh pr close --delete-branch`** is the safe disposition — never merge.

**Attribution-isolation rule** (RESEARCH Pitfall 3): inject the smoke literal INSIDE an existing rendered JSX subtree. A module-scope `const _smoke = ...` triggers `noUnusedLocals` / TS6133 in `frontend/tsconfig.json` and pollutes the attribution from "Lint fails" to "Lint AND type-check fail" — Phase 48 PR #6 hit this exact trap, Phase 48 PR #7 fixed it.

---

## Shared Patterns

### Phase-base git tag for diff audits

**Source:** `.planning/phases/47-type-check-zero/47-01-frontend-type-fix-PLAN.md:171–177` (Task 1 step 0) — also used verbatim in Phase 48 Wave 0.

**Apply to:** Phase 51 Wave 0 — first plan's first task, BEFORE any source edit. Required by D-12 net-new disable scan.

```bash
git rev-parse phase-51-base 2>/dev/null || git tag phase-51-base $(git rev-parse HEAD)
git push origin phase-51-base 2>/dev/null || true
```

The `2>/dev/null || ...` guard makes the command idempotent — safe if multiple plans race to set up.

### Surgical no-source-edit posture (Karpathy §3)

**Source:** CLAUDE.md §"Karpathy Coding Principles" §3 + Phase 47 D-03 / Phase 48 D-05 precedent.

**Apply to:** every Tier-A wave, every Tier-C disable annotation, every Tier-B carve-out edit.

- Don't "improve" adjacent code while swapping color literals.
- Match existing style: semicolons, quotes, JSX wrap, logical-property usage (`ms-*`, `pe-*`).
- Every changed line traces directly to one of the D-01..D-13 rule entries.
- If a swap exposes unrelated dead code, mention it — don't delete it.

This is the meta-rule for keeping the violation-fix waves from drifting into refactor. RESEARCH §2 estimates 80–120 Tier-A files at ~600–900 literal swaps; the surgical posture is what keeps that scope mechanical.

### Per-rule `'no-restricted-syntax': 'off'` carve-out shape (Tier-B)

**Source:** `eslint.config.mjs:215–221` (Phase 48 `components/ui/**` carve-out).

**Apply to:** Phase 51's new Tier-B block (D-03 enumeration).

```js
{
  files: [
    /* enumerated Tier-B paths — no broad globs that could over-match (Pitfall 6) */
  ],
  rules: {
    'no-restricted-syntax': 'off',
  },
},
```

- NEVER use the global `ignores:` block at `eslint.config.mjs:12–25` — that would also disable file-naming, no-restricted-imports, and other rules. Tier-B is rule-scoped, not file-scoped.
- Each entry is an explicit file path or scoped glob (`components/signature-visuals/flags/**`), never a wildcard like `**Chart.tsx`.

### Per-Literal `eslint-disable-next-line` with phase-and-row annotation (Tier-C)

**Source:** Phase 48-02 D-17 inline-rationale shape + Phase 48 §"Inline rationale for any rule downgrade".

**Apply to:** Phase 51 Tier-C — every offending Literal in a Tier-C file.

```tsx
// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<filename> */
className = 'text-yellow-700 dark:text-yellow-300'
```

- ONE disable per offending Literal — never bulk-disable.
- Anchor matches `51-DESIGN-AUDIT.md` row's slug.
- Annotation format is exact: `Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<filename>` — D-12 scan greps for this.

### Read-then-merge-then-write — NOT NEEDED for Phase 51

**Source:** Phase 47-03 Task 4 + Phase 48-03 PUT pattern + Phase 50-05 PUT.

**Apply to:** Phase 51 — explicitly NOT used. D-09 folds under the existing `Lint` context which is already in `main`'s required-contexts list (RESEARCH §4 live capture 2026-05-15). No PUT is performed. The 51-SUMMARY records this as "no PUT performed" with the pre/post JSON snapshots being identical.

This is a structural difference from Phases 47-03, 48-03, and 50-05 — important for the planner not to write a no-op PUT step that confuses the audit trail.

### Smoke-PR proof-of-block

**Source:** Phase 47-03 Task 5 + Phase 48-03 PR #7 + Phase 50-05 PR #11.

**Apply to:** Phase 51 D-10 smoke-PR plan task (recipe in §"Smoke PR" assignment above).

Three load-bearing invariants:

1. `mergeStateStatus = "BLOCKED"` (not `mergeable`).
2. Branch name `smoke/phase-51-design-token-gate` with visible "DO NOT MERGE" framing.
3. `gh pr close --delete-branch` disposition.

### No emoji in ESLint rule messages

**Source:** Phase 48 D-06 (replaced 💡-prefixed Aceternity message) + CLAUDE.md §"No emoji in user-visible copy" + UI-SPEC §"Copywriting Contract".

**Apply to:** D-05 selector messages — confirmed in the pattern assignment above (no emoji, sentence case, no exclamation marks).

### Single-message-per-rule policy

**Source:** Every existing `no-restricted-syntax` selector in `eslint.config.mjs:148–198` has its own `message:` field.

**Apply to:** Phase 51's three new selectors — each has a dedicated message naming the canonical fix (token utility / `var(--*)` token / `semantic-colors.ts` map). No shared message.

## No Analog Found

All file/operation classifications have a closest analog in the codebase. The two cases worth flagging explicitly:

1. **`TemplateElement[value.raw=/…/]` selector** — Phase 48 RTL selectors never needed template-literal coverage (RTL utilities don't combine with variant prefixes), so the AST-node-type difference (`TemplateElement` vs. `Literal`) is genuinely new ground in this repo. RESEARCH §"Pattern 1" gives the verified shape; the regex grammar is identical to the `Literal` palette selector, only the AST property differs (`value.raw` vs. `value`). LOW risk because the regex tests against the same string surface; the only execution-time gotcha is verifying it doesn't false-positive on tagged template literals (RESEARCH Assumption A7).

2. **`getComputedStyle(documentElement).getPropertyValue('--accent')` runtime CSS-var read** — if Recipe B is the path chosen for `WorldMapVisualization.tsx`. No in-repo analog for this pattern in a React component body, though `frontend/public/bootstrap.js` reads CSS vars at FOUC-bootstrap time. RESEARCH §5.1 recommends a `useTokenColor(name: string)` hook shape; the planner can either land the hook in `frontend/src/hooks/` or inline the call in the WorldMap consumer. The hook is the cleaner shape; the inline call is more surgical (Karpathy §3).

Neither gap is blocking — both have verified specs in RESEARCH and can be validated via a 30-min dev-page spike at execute time.

## Metadata

**Analog search scope:**

- `eslint.config.mjs` (495 lines) — root single-source-of-truth lint config; three precedents (lines 148–198, 215–221, 224–240) all donate to Phase 51
- `.planning/phases/48-lint-config-alignment/` — 48-CONTEXT, 48-PATTERNS, 48-03-SUMMARY, 48-VERIFICATION (smoke PR, branch protection, D-17 scan donors)
- `.planning/phases/50-test-infrastructure-repair/` — 50-05-SUMMARY (smoke PR #11, fixture pattern), `tools/eslint-fixtures/bad-vi-mock.ts` (regression fixture shape)
- `.planning/phases/47-type-check-zero/47-01-frontend-type-fix-PLAN.md` — phase-base git-tag step 0 shape
- `.github/workflows/ci.yml` (top + Lint job) — confirms no YAML change required for D-09
- `frontend/src/index.css` `@theme` block (lines 43–118) — implicit token-utility allowlist source
- `frontend/src/lib/semantic-colors.ts` (442 lines) — canonical Tier-A migration anchor per D-11
- `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx` (lines 180–205) — verifies `lineColor="#3B82F6"` site + adjacent CSS-var read precedent
- `frontend/src/components/position-editor/PositionEditor.tsx` (lines 200–540) — verifies all 19 palette-literal sites named in D-02
- `tools/eslint-fixtures/bad-vi-mock.ts` (11 lines) — donor shape for the optional Phase 51 fixture
- `scripts/lint.mjs` (26 lines) — confirms `pnpm lint <path>` works for targeted fixture / Tier-A file verification

**Files read (full or relevant ranges):** 16
**Files scanned via `ls` / `Bash`:** 7 (phase 48 + phase 50 artifacts, eslint fixtures dir, workflows dir, project skills dir)

**Pattern extraction date:** 2026-05-15

**Cross-references for planner:**

- `eslint.config.mjs:148–198` (Phase 48 RTL selectors) → Phase 51 D-05 selectors
- `eslint.config.mjs:215–221` (Phase 48 `components/ui/**` carve-out) → Phase 51 D-03 Tier-B block
- `eslint.config.mjs:227` (Phase 50 `tools/eslint-fixtures/**/*.{ts,tsx}` glob) → Phase 51 optional regression fixture wiring (no new override block)
- `frontend/src/lib/semantic-colors.ts` (`dossierTypeColors`, `statusColors`, `priorityColors`) → Phase 51 D-11 canonical migration anchor (preserves token-utility map; not a violation source)
- `frontend/src/index.css:43–118` (`@theme` block) → Phase 51 D-06 implicit token-utility allowlist
- `tools/eslint-fixtures/bad-vi-mock.ts` → Phase 51 optional `bad-design-token.tsx` fixture
- `.planning/phases/50-test-infrastructure-repair/50-05-SUMMARY.md:73–100` (protection JSON snapshot) → Phase 51 `51-SUMMARY.md` pre/post snapshots (identical, no PUT)
- Phase 48-02 D-17 net-new disable scan → Phase 51 D-12 diff-grep verification
- Phase 48 PR #7 (in-tree JSX literal injection) + Phase 50-05 PR #11 (dedicated test-file injection) → Phase 51 smoke PR (Phase 48 PR #7 shape recommended per UI-SPEC)
