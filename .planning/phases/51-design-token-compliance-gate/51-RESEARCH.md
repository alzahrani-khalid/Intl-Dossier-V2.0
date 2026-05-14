# Phase 51: Design-Token Compliance Gate — Research

**Researched:** 2026-05-15
**Domain:** ESLint flat-config policy, AST `Literal` selectors, Tailwind v4 `@theme` tokens, GitHub branch-protection PR-blocking context registration
**Confidence:** HIGH

## Summary

Phase 51 stands up a PR-blocking ESLint gate that prevents raw hex colors and Tailwind palette literals from entering `frontend/src/`. The mechanism is **two new `no-restricted-syntax` selectors** appended to the existing frontend override block in `eslint.config.mjs`, alongside the eleven Phase 48 RTL selectors at lines 148–198 and the Phase 50 D-15 vi-mock guard at lines 224–240. No new ESLint plugin, no new CI job, no new branch-protection PUT — the rule rides under the existing `Lint` PR-blocking context that was wired by Phase 48 D-15 and re-verified in Phase 50-05 (`main` currently requires `Lint`, `type-check`, `Security Scan`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`, all with `enforce_admins=true`).

The execution surface is a **tri-tier triage** across the 337 raw-hex and ~2,950 palette-literal hits in `frontend/src/`. Tier-A (in-phase mechanical token swaps), Tier-B (file-level `'no-restricted-syntax': 'off'` carve-outs scoped to chart palettes, flag SVGs, and token-definition files), Tier-C (per-Literal `eslint-disable-next-line` annotations backed by a `51-DESIGN-AUDIT.md` row with a follow-up phase ticket). The rule activates at zero workspace lint errors with the audit artifact as the standing inventory of deferred work.

**Primary recommendation:** Implement two `no-restricted-syntax` selectors plus a `TemplateElement[value.raw=/.../]` companion selector to cover the template-literal blind spot left over from Phase 48 RTL rules (12 files in frontend/src embed banned palette literals inside `` `...` `` strings — they pass today's RTL selectors and would pass a Literal-only design-token selector for the same reason). Verify the gate with a real-component smoke PR mirroring Phase 48 D-16 / Phase 50-05's PR #11 — the recipe is proven and the protection state is already correct.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (Tri-tier triage):** Phase 51 closes the design-token gate with three tiers. Tier-A fixed in-phase. Tier-B permanently allowlisted in `eslint.config.mjs` (per-file `'no-restricted-syntax': 'off'`). Tier-C lives behind audited per-file `eslint-disable-next-line` directives, each pointing to a row in `51-DESIGN-AUDIT.md`. Rule activates everywhere in `frontend/src/`; no broad ignore-block masks remaining drift. Phase ends when `pnpm lint` exits 0 with new selectors active.
- **D-02 (Tier-A scope):** Named anchors — `WorldMapVisualization.tsx:193` `lineColor="#3B82F6"` → token-equivalent CSS-var read; `PositionEditor.tsx` lines 211 / 237 (`text-blue-600 underline`), 410 (`border-red-200 bg-red-50`), 412 (`text-red-800`), 531 (`text-red-600`) → `text-accent` (link) and `text-danger` / `border-danger` / `bg-danger/10`; plus mechanical-swap status/badge/alert literals across the sweep (`text-red-* → text-danger`, `text-amber-* → text-warning`, `text-emerald-*`/`text-green-* → text-success`, `text-blue-* → text-info` or `text-accent` per semantic role).
- **D-03 (Tier-B file-level exemptions):**
  - Token-definition + bootstrap: `frontend/src/design-system/tokens/directions.ts`, `frontend/src/index.css`, `frontend/src/styles/modern-nav-tokens.css`, `frontend/public/bootstrap.js`.
  - Signature visuals (flag SVGs): `frontend/src/components/signature-visuals/flags/**/*.{tsx,ts}`.
  - Chart palettes + React-Flow + relationship graphs: `frontend/src/components/analytics/*Chart.tsx`, `AnalyticsPreviewOverlay.tsx`, `dashboard-widgets/ChartWidget.tsx`, `sla-monitoring/SLAComplianceChart.tsx`, `stakeholder-influence/InfluenceMetricsPanel.tsx`, `stakeholder-influence/InfluenceReport.tsx`, `relationships/RelationshipGraph.tsx`, `dossier/MiniRelationshipGraph.tsx`, `report-builder/ReportPreview.tsx`.
  - Tailwind-utility map module: `frontend/src/lib/semantic-colors.ts`.
- **D-04 (Tier-C audit artifact):** `51-DESIGN-AUDIT.md` enumerates every other file with violations; columns: `file`, `raw_hex_count`, `palette_literal_count`, `proposed_token_map`, `disposition` (always `deferred-tier-c`), `follow_up_phase`. One `// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<filename> */` per offending Literal.
- **D-05 (no-restricted-syntax regex on Literal):** Two new selectors in `eslint.config.mjs` frontend override block — raw hex (`Literal[value=/#[0-9a-fA-F]{3,8}\b/]`) and Tailwind palette literal with variant prefix support `(?:[a-z-]+:)*` covering the 21 banned palette names against the standard property roots.
- **D-06 (token-utility allowlist is implicit):** The palette-literal regex matches ONLY the 21 banned palette names; every `@theme`-mapped utility passes by default. No rule-side allowlist enumeration needed.
- **D-07 (variant prefix coverage):** `(?:[a-z-]+:)*` prefix catches every variant chain: `dark:`, `hover:`, `focus:`, responsive `md:`/`lg:`/`xl:`, `aria-disabled:`, and compound combinations like `md:dark:hover:`.
- **D-08 (CSS files — AST Literal only):** Selectors fire on AST `Literal` nodes only. CSS / TS comment hex is parsed as a comment node and stays valid. `frontend/src/index.css` and `modern-nav-tokens.css` are Tier-B-allowlisted regardless.
- **D-09 (Fold into existing Lint context):** New selectors live in `eslint.config.mjs` and run under the existing `Lint` PR-blocking branch-protection context. No new GHA job, no new required-context PUT.
- **D-10 (Smoke PR proves BLOCK):** Mirrors Phase 48 D-16 / Phase 50-05 PR #11. Inject a known-bad literal into a real component; prove (1) `Lint` job red, (2) `mergeStateStatus=BLOCKED`, (3) PR closed without merge. URL recorded in `51-SUMMARY.md`.
- **D-11 (semantic-colors.ts as canonical migration anchor):** Tier-A fixes default to either (a) `semantic-colors.ts` import if the use case matches an existing map entry, or (b) direct token utility (`text-success`, `bg-danger/10`) for one-off literals. Both paths valid. New map entries NOT required for every Tier-A swap.
- **D-12 (Zero net-new eslint-disable outside Tier-C):** Executor greps the diff for new `eslint-disable*` strings before commit; failure if the count exceeds the explicit Tier-C count tracked in `51-DESIGN-AUDIT.md`. Each Tier-C disable carries a phase-and-row annotation.
- **D-13 (Tier-B = OFF, not disable):** Tier-B uses config-level `rules: { 'no-restricted-syntax': 'off' }` (lines 215–221 pattern). Tier-C uses in-source `eslint-disable-next-line`. Not interchangeable.
- **D-14 (Plan now, execute after Phase 50 ships):** Plan content depends on `eslint.config.mjs` structure (not on test infra). Plan execution waits for Phase 50 ship — Phase 50 IS now closed (commit `e24e92d1`, smoke PR #11 closed 2026-05-14).

### Claude's Discretion

- D-01: Plan slicing (one plan vs. one per tier) — planner's call. Phase 48 ran rule-config + violation-fix as a single phase under multiple plans; same shape is reasonable.
- D-02: Order of Tier-A files within the executor wave — `WorldMapVisualization.tsx` and `PositionEditor.tsx` are anchors, but a mechanical-swap pass may go before or after.
- D-03 vs D-04 boundary: Files with mixed Tier-B and Tier-C content — planner's call per file; default Tier-B if >3 chart-palette literals, Tier-A if the literal is unambiguously a status / error / badge with clean token map.
- D-05: Exact regex grammar — published shape is a starting point; planner may add/remove redundant property roots.
- D-09: Whether to add a `pnpm lint:design-tokens` local script for pre-commit fast feedback — planner's call; not required.
- D-10: Smoke PR style (separate PR vs. branch on a throwaway broken commit) — executor judgment. Anchor is `mergeStateStatus = BLOCKED`.

### Deferred Ideas (OUT OF SCOPE)

- **Chart palette tokens.** A future "chart palette tokens" phase would add `--chart-series-1..--chart-series-8` to `index.css` and migrate the Tier-B chart files. Out of Phase 51 scope.
- **Tier-C cleanup waves.** `51-DESIGN-AUDIT.md` rows queue files for one or more future "design-token Tier-C cleanup" phases (estimated 200–250 files across 2–4 future phases).
- **CSS-side ESLint pass.** A future phase could introduce `eslint-plugin-css` or `stylelint` integration to enforce on CSS Declarations directly. Out of scope; D-08 sidesteps via file allowlist.
- **Pre-commit `pnpm lint:design-tokens` fast-feedback script.** Optional planner addition; not required.
- **`tools/eslint-plugin-intl-dossier/` project-local plugin scaffold.** Phase 51 explicitly chose `no-restricted-syntax` over a local plugin.
- **Migrating `lib/semantic-colors.ts` to direct token utilities.** Aesthetic, not correctness; deferred.
- **Re-enabling `TODO(Phase 2+)` disabled rules in `eslint.config.mjs`.** Phase 48 D-09 carry-forward; Phase 51 does NOT touch.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                                                                 | Research Support                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DESIGN-01 | ESLint rule bans raw hex colors (`#[0-9a-fA-F]{3,8}`) in `frontend/src/**/*.{ts,tsx,css}` outside token-definition files                                    | Implementation Approach §"Regex validation"; D-05 raw-hex selector; D-03 Tier-B carve-outs for `index.css`, `modern-nav-tokens.css`, `directions.ts`, `bootstrap.js`; D-08 covers CSS via file allowlist      |
| DESIGN-02 | ESLint rule bans Tailwind color literals (`text-blue-*`, `bg-red-*`, `border-green-*`, etc.) in `frontend/src/**/*.{ts,tsx}`; allows token-mapped utilities | Implementation Approach §"Regex validation"; D-05 palette-literal selector with variant prefix; D-06 implicit allowlist (regex matches only the 21 banned palette names — `@theme` tokens automatically pass) |
| DESIGN-03 | All existing violations fixed (`WorldMapVisualization.tsx:193`, `PositionEditor.tsx` color literals, plus any others surfaced by sweep)                     | Implementation Approach §"Token-mapping cookbook"; D-02 named anchors; D-01 tri-tier triage; Files to Touch §"Tier-A worklist"; Sweep delta (337 hex + 2,950 palette literals)                                |
| DESIGN-04 | Workspace `pnpm lint` exits 0 with new rules active; PR-blocking CI context registered on `main`                                                            | Implementation Approach §"Smoke PR recipe"; D-09 fold into existing `Lint` context; Dependencies §"Phase 50 branch-protection state — already correct"; Validation Architecture §"Regression anchor"          |

</phase_requirements>

## Architectural Responsibility Map

| Capability                                  | Primary Tier                 | Secondary Tier | Rationale                                                                                                                                                                                                          |
| ------------------------------------------- | ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ESLint rule grammar (D-05 selectors)        | Build / Lint config          | —              | `eslint.config.mjs` is the single source of policy; the rule runs at lint time, not runtime. No backend, no API, no DB.                                                                                            |
| Tier-A token swaps (TSX call sites)         | Frontend SSR / Browser       | —              | Tailwind class strings live in JSX; the swap is a source-code edit that the bundler resolves to CSS at build time. No SSR-specific concern.                                                                        |
| Tier-B file allowlist (config-level OFF)    | Build / Lint config          | —              | `eslint.config.mjs` per-file rule override; same tier as D-05.                                                                                                                                                     |
| Tier-C audit artifact + per-Literal disable | Build / Lint config + Source | —              | Config provides the rule; source code embeds the audited disable line. Audit doc is a planning artifact under `.planning/`.                                                                                        |
| Smoke PR mechanics                          | CI / GitHub                  | Source         | Branch-protection PUT is a GitHub API setting; the smoke commit lives in source. Verification is `gh pr view --json mergeStateStatus`.                                                                             |
| Token vocabulary (the implicit allowlist)   | CSS / Tailwind `@theme`      | Frontend SSR   | `frontend/src/index.css` declares the `@theme` block; Tailwind v4 emits utilities from it; consumers reference utilities like `text-success` in JSX. Token names in `@theme` are not browser-resolved differently. |

**Why this matters:** The entire Phase 51 surface lives at the _build / lint config_ tier. There is no runtime contract change, no API change, no DB change, no FOUC implication. The two anchor files (`WorldMapVisualization.tsx`, `PositionEditor.tsx`) are the only ones whose rendered output could plausibly shift, and the plan ships visual-parity testing for them. This map exists so the planner does not invent a mid-tier worker (e.g., a "design-token migration service") — there is no such thing.

## Standard Stack

### Core

| Library                     | Version | Purpose                                                      | Why Standard                                                                                                                                                                                                       |
| --------------------------- | ------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `eslint`                    | 9.39.4  | Lint runner with flat-config support                         | Already in use repo-wide; Phase 48 D-01 made root `eslint.config.mjs` the single source of truth. `[VERIFIED: node_modules/.pnpm path]`                                                                            |
| `@typescript-eslint/parser` | 8.57.2  | Parses `.ts` / `.tsx` into ESTree-compatible AST             | Used by all existing rules in `eslint.config.mjs`. `Literal[value=/.../]` selectors run against this AST. `[VERIFIED: node_modules/.pnpm path]`                                                                    |
| `typescript-eslint`         | 8.57.2  | Flat-config shareable presets                                | Already wired in `eslint.config.mjs` line 30 (`...tseslint.configs.recommended`). `[VERIFIED: eslint.config.mjs:30]`                                                                                               |
| `tailwindcss`               | 4.x     | Source of `@theme`-mapped utilities (the implicit allowlist) | Tailwind v4 `@theme { --color-* }` declarations in `frontend/src/index.css` lines 43–118 define every utility that the palette-literal regex deliberately does NOT match. `[CITED: frontend/src/index.css:43-118]` |

### Supporting

| Library           | Version  | Purpose                                          | When to Use                                                                                                                      |
| ----------------- | -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `gh` (GitHub CLI) | (system) | Branch-protection inspection + smoke-PR creation | Used at smoke-PR step only. Same recipe as Phase 48 D-16 / Phase 50-05 PR #11. `[VERIFIED: gh api .../branches/main/protection]` |
| `ripgrep` (`rg`)  | (system) | Pre-flight per-file violation histogram          | Sweep step — the planner produces a per-file count via `rg -c` to size the Tier-A vs Tier-B/C cut.                               |

### Alternatives Considered

| Instead of                                      | Could Use                                                       | Tradeoff                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-restricted-syntax` (D-05)                   | `tools/eslint-plugin-intl-dossier/` project-local rule          | A custom rule could provide better error messages, fixer-mode autofix, and template-literal coverage. Rejected by D-05 because the regex-on-Literal pattern fits cleanly; the plugin scaffold (Phase 50 D-15 considered) was rejected for the same reason. Re-evaluate if 3+ such rules accumulate. |
| `eslint-plugin-tailwindcss`                     | Upstream plugin with built-in class-name parsing                | Already attempted in prior phases; conflicts with `eslint-plugin-rtl-friendly` plugin ordering. Phase 48 D-09 explicitly froze plugin set; D-05 stays inside the existing plugin set.                                                                                                               |
| Adding `eslint-plugin-css` for CSS Declarations | Direct AST enforcement on `index.css` / `modern-nav-tokens.css` | Out of scope per D-08 — Tier-B file allowlist achieves the same outcome with zero new plugin surface. A future hardening phase can add this.                                                                                                                                                        |
| `tw-prefix-collision` / `flowbite-react` rules  | Other Tailwind-aware ecosystem rules                            | Out of scope; the project does NOT use these libraries. `[ASSUMED]`                                                                                                                                                                                                                                 |

**Installation:** No new dependencies. The two new selectors plug into the existing `frontend/**/*.{ts,tsx}` override block at `eslint.config.mjs` lines 70–200.

## Architecture Patterns

### System Architecture Diagram

```
                ┌──────────────────────────────────┐
                │  developer authors .tsx / .ts    │
                │  ('text-red-500' / '#3B82F6')    │
                └────────────────┬─────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────────────┐
                │  pnpm lint  (local OR `Lint` CI job)   │
                └────────────────┬───────────────────────┘
                                 │
                                 ▼
       ┌──────────────────────────────────────────────────────────┐
       │  eslint -c eslint.config.mjs (root, single source)       │
       │  ├─ frontend override block (files: ['frontend/**'])     │
       │  │  ├─ no-restricted-syntax (lines 148-198) — RTL        │
       │  │  ├─ NEW: D-05 Literal[value=/#[hex]/]                 │
       │  │  ├─ NEW: D-05 Literal[value=/<palette>/]              │
       │  │  └─ NEW: D-05 TemplateElement[value.raw=/<palette>/]  │
       │  │                                                       │
       │  ├─ components/ui/** override (lines 215-221)            │
       │  │  └─ 'no-restricted-syntax': 'off'  (carve-out)        │
       │  │                                                       │
       │  └─ NEW: Tier-B file overrides (per D-03)                │
       │     └─ 'no-restricted-syntax': 'off' per glob            │
       └──────────────┬───────────────────────┬─────────────────────┘
                      │                       │
                      ▼                       ▼
       ┌──────────────────────┐    ┌────────────────────────────┐
       │  AST traversal:      │    │  Tier-C inline annotation: │
       │  Literal value       │    │  // eslint-disable-next-   │
       │  + TemplateElement   │    │  line no-restricted-syntax │
       │  value.raw matched   │    │  /* Phase 51 Tier-C: see   │
       │  against regex       │    │  51-DESIGN-AUDIT.md#... */ │
       └──────────────┬───────┘    └────────────┬───────────────┘
                      │                         │
                      ▼                         ▼
              ┌────────────────────────────────────────┐
              │  Match found  →  exit 1, gate red      │
              │  No match     →  exit 0, gate green    │
              └────────────────┬───────────────────────┘
                               │
                               ▼
              ┌────────────────────────────────────────┐
              │  GitHub Actions `Lint` job status      │
              │  → PR mergeStateStatus = BLOCKED       │
              │    if branch-protection requires Lint  │
              │    (already wired — Phase 48 D-15)     │
              └────────────────────────────────────────┘
```

### Component Responsibilities

| File / Location                                                                                                      | Responsibility                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs` (frontend override block, lines 70–200)                                                          | Hosts D-05 selectors next to Phase 48 RTL selectors and Phase 50 D-15 vi-mock guard.                                                            |
| `eslint.config.mjs` (new section, after line 221 `components/ui/**` carve-out)                                       | Hosts Tier-B file-level `'no-restricted-syntax': 'off'` overrides per D-03.                                                                     |
| `frontend/src/components/territory-map/WorldMapVisualization.tsx` (note: actual path is `geographic-visualization/`) | Tier-A anchor #1: `lineColor="#3B82F6"` → resolved hex from CSS-var read OR fallback literal pinned to `--accent` value.                        |
| `frontend/src/components/position-editor/PositionEditor.tsx`                                                         | Tier-A anchor #2: 19 palette literals (5 named in D-02 + 14 mechanical `bg-gray-*` / `border-gray-*` / `bg-red-*` / `text-blue-*`).             |
| Tier-A mechanical sweep files                                                                                        | ~50–100 files with ≤5 palette literals AND clear semantic mapping. Mechanical token swap.                                                       |
| Tier-B files (D-03)                                                                                                  | Permanently allowlisted. No source edit. Just add per-file `'no-restricted-syntax': 'off'` in `eslint.config.mjs`.                              |
| Tier-C files (audit-only)                                                                                            | Each offending Literal gets one `// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: ... */`. Tracked in `51-DESIGN-AUDIT.md`. |
| `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md`                                                | New file. Audit row per Tier-C file (`file`, `raw_hex_count`, `palette_literal_count`, `proposed_token_map`, `disposition`, `follow_up_phase`). |
| `.planning/phases/51-design-token-compliance-gate/51-SUMMARY.md`                                                     | Records smoke PR URL + branch-protection state confirmation (no PUT performed).                                                                 |

### Pattern 1: Adjacent `no-restricted-syntax` selectors

**What:** Add D-05's two/three new selectors to the existing `no-restricted-syntax` array in the frontend override block.

**When to use:** Whenever the rule needs to fire on a `Literal` (string-valued JSX attribute, string argument to a function, object property value) or `TemplateElement` (untagged template literal segment).

**Example:**

```js
// Source: existing pattern in eslint.config.mjs lines 148–198, extended per D-05
{
  files: ['frontend/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      // ... existing 11 RTL selectors (lines 151–197) ...
      {
        // D-05: raw hex literals (3, 4, 6, or 8 hex digits — covers #fff, #ffff, #ffffff, #ffffffff)
        selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
        message:
          'Raw hex colors are forbidden in frontend/src. Use design tokens from frontend/src/index.css @theme block (text-ink, bg-accent, text-danger, etc.). See CLAUDE.md §Design rules.',
      },
      {
        // D-05: Tailwind palette literals — banned palette names with optional variant chain
        selector:
          'Literal[value=/(?:^|\\s)(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|accent|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\\d{2,3}\\b/]',
        message:
          'Tailwind color literals are forbidden in frontend/src. Use token-mapped utilities (text-ink, bg-accent, text-success, text-danger, etc.) from frontend/src/index.css @theme block, or import a map from frontend/src/lib/semantic-colors.ts. See CLAUDE.md §Design rules.',
      },
      {
        // D-05 companion: cover untagged template literals (e.g. `text-red-500 ${...}`)
        // — Phase 48 RTL selectors miss these today (12 known files in frontend/src);
        // adding the companion closes a known coverage gap rather than punting it forward.
        selector:
          'TemplateElement[value.raw=/(?:^|\\s)(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|accent|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\\d{2,3}\\b/]',
        message:
          'Tailwind color literals are forbidden in frontend/src — including inside template literals. Use token-mapped utilities.',
      },
    ],
  },
},
```

### Pattern 2: Per-file Tier-B carve-out (D-03 / D-13)

**What:** Add a new section under the frontend override that scopes `'no-restricted-syntax': 'off'` to a specific file glob — mirroring the existing `components/ui/**` block at lines 215–221.

**Example:**

```js
// D-03 Tier-B exemption — chart palette files use discrete data-viz palettes that
// have no @theme equivalent. Future "chart palette tokens" phase owns migration.
{
  files: [
    'frontend/src/design-system/tokens/directions.ts',
    'frontend/src/index.css',                          // CSS not parsed today; documented for completeness
    'frontend/src/styles/modern-nav-tokens.css',       // ditto
    'frontend/public/bootstrap.js',
    'frontend/src/components/signature-visuals/flags/**/*.{tsx,ts}',
    'frontend/src/components/analytics/**Chart.tsx',
    'frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx',
    'frontend/src/components/analytics/sample-data.ts', // 10 hex hits — chart fixture data
    'frontend/src/components/dashboard-widgets/ChartWidget.tsx',
    'frontend/src/components/sla-monitoring/SLAComplianceChart.tsx',
    'frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx',
    'frontend/src/components/stakeholder-influence/InfluenceReport.tsx',
    'frontend/src/components/relationships/RelationshipGraph.tsx',
    'frontend/src/components/dossier/MiniRelationshipGraph.tsx',
    'frontend/src/components/report-builder/ReportPreview.tsx',
    'frontend/src/lib/semantic-colors.ts',
  ],
  rules: {
    'no-restricted-syntax': 'off',
  },
},
```

### Pattern 3: Tier-C per-Literal `eslint-disable-next-line`

**What:** Each remaining offending Literal in a Tier-C file gets a single-line disable comment with phase-and-row annotation.

**Example:**

```tsx
// Inside frontend/src/components/some-tier-c-file.tsx — one annotation per offending Literal:

return (
  <div
    // eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#some-tier-c-file */
    className="text-yellow-700 dark:text-yellow-300"
  >
    ...
  </div>
)
```

### Anti-Patterns to Avoid

- **Disabling at file top via `/* eslint-disable no-restricted-syntax */`.** Violates D-12 (zero net-new blanket disables). Tier-B uses the config-side override; Tier-C uses per-Literal annotations only.
- **Adding token names to a rule-side allowlist.** D-06 makes this unnecessary — the regex enumerates banned palette names, so any `@theme` utility automatically passes. Adding a rule-side allowlist creates drift surface.
- **Editing the `globalDependencies` block in `turbo.json` again.** It already lists `eslint.config.mjs` (line 3), so Turbo invalidates the lint cache automatically. No change.
- **Putting Tier-B globs in the root `ignores:` block (lines 12–25).** That would also disable file-naming, import-restriction, and RTL rules — too broad. Tier-B is rule-scoped `off`, not file-scoped ignore.
- **Trying to write the rule with `eslint-plugin-tailwindcss`.** Phase 48 D-09 froze the plugin set; D-05 explicitly chose regex-on-Literal because it fits the existing pattern.
- **Adding `eslint-plugin-css` for the `index.css` / `modern-nav-tokens.css` enforcement step.** D-08 + D-03 Tier-B together satisfy DESIGN-01's `.css` scope without a new plugin.

## Don't Hand-Roll

| Problem                                                       | Don't Build                                                    | Use Instead                                                                                                                  | Why                                                                                                                                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AST traversal for hex / palette detection                     | A bespoke ESLint plugin in `tools/eslint-plugin-intl-dossier/` | `no-restricted-syntax` with regex-on-Literal (D-05) and regex-on-TemplateElement                                             | The two new rules fit cleanly into the existing pattern (11 RTL selectors at lines 148–198). A plugin requires `RuleTester`, package wiring, version-pinning, and contributor cognitive overhead.   |
| Variant prefix handling (`dark:`, `hover:`, `md:dark:hover:`) | A multi-rule cascade with separate selectors per variant       | Single regex with `(?:[a-z-]+:)*` capturing the variant chain (D-07)                                                         | One regex catches the full Tailwind variant grammar including aria-_, data-_, group-_, peer-_. Maintenance cost is one regex line, not N.                                                           |
| Token-utility allowlist maintenance                           | An enumerated list of legal token names in the rule config     | Implicit allowlist via D-06 — regex only matches the 21 banned palette names; everything else passes by definition.          | New tokens added to `@theme` auto-pass with no rule edit. Eliminates drift surface entirely.                                                                                                        |
| CSS-side hex enforcement                                      | An `eslint-plugin-css` integration or stylelint pipeline       | File-allowlist for the only two CSS files containing hex declarations (`index.css`, `modern-nav-tokens.css`) per D-03 / D-08 | The CSS surface is two files. A plugin adds plugin-version maintenance for a problem that file-allowlist solves immediately.                                                                        |
| Branch-protection PR-blocking gate                            | A new `Design Tokens` CI job + new required-context PUT        | Fold under the existing `Lint` PR-blocking context (D-09)                                                                    | `eslint.config.mjs` is one file; `pnpm lint` runs the new selectors automatically. A separate job adds checkout + install overhead with no attribution benefit (ESLint message names the selector). |
| Smoke-PR mechanics                                            | A documentation-only "we believe the gate blocks" claim        | Real-component literal injection PR proving `mergeStateStatus=BLOCKED` (D-10, Phase 48 D-16 precedent)                       | Protection-API response alone doesn't prove the gate BLOCKS — see Phase 47 D-13 / Phase 48 Deviation 1. The smoke PR is the only ground-truth.                                                      |

**Key insight:** Phase 51's mechanism is one regex-style rule shape applied twice (hex + palette) inside an already-mature config. The bulk of work is the source-side **mechanical swap pass** — and the only place where hand-rolling tempts a contributor is the smoke PR's deliberate-bad commit. That is also already a solved-precedent pattern (Phase 48 D-16, Phase 50-05 PR #11).

## Implementation Approach

### 1. Regex grammar validation

**Tested locally on 2026-05-15. Both selectors are concretely safe with one known limitation:**

**Hex regex (`Literal[value=/#[0-9a-fA-F]{3,8}\b/]`):**

| Test surface                                             |          Match?           | Risk?                                                                                                                                                                                                                        |
| -------------------------------------------------------- | :-----------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'#3B82F6'` (real color, 6-char)                         |            YES            | DESIGN-01 fires correctly                                                                                                                                                                                                    |
| `'#fff'` / `'#FFF'` (3-char)                             |            YES            | Correct — 3-char is valid CSS color                                                                                                                                                                                          |
| `'#1A1D26'` (uppercase 6-char)                           |            YES            | Correct                                                                                                                                                                                                                      |
| `'bg-[#5558AF]'` (Tailwind arbitrary-value)              |            YES            | Correct — it IS a raw hex, even though Tailwind-wrapped                                                                                                                                                                      |
| `'url(#path-gradient)'` (SVG `<linearGradient id>` ref)  |            NO             | `\b` correctly halts at `path` (not all hex). Verified.                                                                                                                                                                      |
| `'href="#"'` (empty anchor)                              |            NO             | Correct — no chars after `#`                                                                                                                                                                                                 |
| `'route#anchor'` (URL fragment with letters)             |            NO             | `anchor` is not all hex                                                                                                                                                                                                      |
| `'0 0 162.98 233.12'` (SVG viewBox)                      |            NO             | No `#` prefix                                                                                                                                                                                                                |
| `'// #L444-446'` / `// #GET'` (JSDoc handoff references) |            NO             | These live in _comments_, which are `Block`/`Line` nodes, NOT `Literal` (D-08). Confirmed via grep: 11 such handoff `#L<digits>` references exist; all are in comments. No risk.                                             |
| `'issue #1234 in tracker'` (issue ref in string literal) | YES (false positive risk) | `1234` is 4 hex digits → matches. **Mitigation:** grep on `frontend/src/**/*.{ts,tsx}` for this shape returns zero hits (verified 2026-05-15). If a future ref appears, the disable-next-line Tier-C escape hatch covers it. |

**Palette literal regex (`Literal[value=/(?:^|\s)(?:[a-z-]+:)*(text|bg|border|...)-(red|blue|...)-\d{2,3}\b/]`):**

| Test surface                                             | Match? | Risk?                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------- | :----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'text-red-500'`                                         |  YES   | DESIGN-02 fires correctly                                                                                                                                                                                                                                                                                                                     |
| `'dark:text-red-400'`                                    |  YES   | D-07 variant chain covered                                                                                                                                                                                                                                                                                                                    |
| `'md:dark:hover:text-amber-600'`                         |  YES   | Compound chain covered                                                                                                                                                                                                                                                                                                                        |
| `'aria-disabled:text-gray-400'`                          |  YES   | `aria-*` variants covered                                                                                                                                                                                                                                                                                                                     |
| `'text-red-500 hover:bg-red-600'` (whitespace-separated) |  YES   | First-match suffices; ESLint reports one violation per Literal node                                                                                                                                                                                                                                                                           |
| `'text-ink'` / `'bg-accent'` / `'text-success'` (tokens) |   NO   | Token utility name not in regex banned-palette enumeration → automatically passes (D-06)                                                                                                                                                                                                                                                      |
| `'text-success-foreground'`                              |   NO   | `success-foreground` ≠ palette-name-`<num>` shape                                                                                                                                                                                                                                                                                             |
| `'text-balance'` / `'border-l-2'`                        |   NO   | `balance` ≠ palette name; `l` ≠ palette name                                                                                                                                                                                                                                                                                                  |
| `'text-[length:10px]'`                                   |   NO   | Arbitrary-value with non-color syntax — `length:10px` doesn't match palette shape                                                                                                                                                                                                                                                             |
| `` `text-red-500 ${variant}` `` (template literal)       |   NO   | **Known gap** — Literal selector misses TemplateLiteral nodes. 12 files in frontend/src have palette literals in template strings. **Mitigation:** add a `TemplateElement[value.raw=/.../]` companion selector (same regex). This is the single point where the rule could quietly leak past — closing it is cheap (one more selector entry). |

**Word-boundary `\b` behavior (verified):**

- `text-red-500` matches; `\b` is between `0` and end-of-string or whitespace.
- `text-red-50` matches (50 ≥ 2 digits); `\b` between `0` and next char.
- `text-red-500-extra` — `500-` has `\b` between `0` and `-`; matches `text-red-500` substring. Acceptable (not a real Tailwind class anyway).
- `text-red-5` (1 digit) — does NOT match. Tailwind doesn't have 1-digit palette suffixes anyway.

**False-positive surfaces investigated:**

1. **`cn()` / `clsx()` template literals** — Yes, real risk (12 files). Companion `TemplateElement` selector closes the gap.
2. **`dangerouslySetInnerHTML` raw HTML strings** — TS-AST parses these as Literal/TemplateLiteral. The regex would fire on `<div class="text-red-500">` embedded in such strings. **Mitigation:** zero hits in current codebase (verified). If introduced later, Tier-C disable covers.
3. **Storybook CSF arg objects** — Project does not use Storybook (Phase 33-08 deferred). Not applicable today.
4. **JSDoc strings** — Live in `Block` comment nodes, NOT Literal (D-08). Not a risk.
5. **TypeScript-as-string template contexts** — Tagged template literals (`tw\`...\``) parse as `TaggedTemplateExpression`whose`quasi`is`TemplateLiteral`. The companion `TemplateElement` selector covers these.

### 2. Tier-A worklist sizing

**Sweep commands (run before plan, again before execute):**

```bash
PALETTE='(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\d{2,3}\b'

# Per-file palette-literal histogram excluding Tier-B carve-outs
rg -c "$PALETTE" --type-add 'tsxts:*.{ts,tsx}' -ttsxts frontend/src/ 2>/dev/null \
  | grep -vE '/components/ui/|/signature-visuals/flags/|/analytics/.*Chart\.tsx|AnalyticsPreviewOverlay\.tsx|ChartWidget\.tsx|SLAComplianceChart\.tsx|InfluenceMetricsPanel\.tsx|InfluenceReport\.tsx|RelationshipGraph\.tsx|MiniRelationshipGraph\.tsx|ReportPreview\.tsx|semantic-colors\.ts|directions\.ts|tests/|__tests__|/index\.css|/modern-nav-tokens\.css|analytics/sample-data\.ts' \
  | sort -t: -k2 -rn

# Per-file raw-hex histogram (same exclusions)
rg -c '#[0-9a-fA-F]{3,8}\b' --type-add 'tsxts:*.{ts,tsx}' -ttsxts frontend/src/ 2>/dev/null \
  | grep -vE '/components/ui/|/signature-visuals/flags/|/analytics/|/types/.*\.types\.ts|/lib/semantic-colors\.ts|directions\.ts|/dashboard-widgets/|/sla-monitoring/|/stakeholder-influence/|/relationships/RelationshipGraph|MiniRelationshipGraph|ReportPreview' \
  | sort -t: -k2 -rn
```

**Observed sweep delta (verified 2026-05-15 against `frontend/src/`):**

- **Raw hex:** 63 files, 337 total hits. After Tier-B carve-outs (chart/graph/types/flags/semantic-colors), **~5–8 files remain** as Tier-A or Tier-C. Most hex hits sit in chart/types files (`analytics.types.ts` = 21, `stakeholder-influence.types.ts` = 11, `tag-hierarchy.types.ts` = 10) and `directions.ts` (82, Tier-B).
- **Palette literals:** 331 files, ~2,950 total hits. After Tier-B carve-outs, **311 files remain**:
  - 145 files have ≤5 hits → Tier-A candidates (mechanical-swap)
  - 166 files have >5 hits → split between Tier-A (if mechanical) and Tier-C (if contextually complex)

**Classification heuristic:**

| Condition                                                                                                 | Disposition                                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| File is in D-03 enumerated Tier-B list                                                                    | Tier-B (config-level OFF)                                                                                                           |
| File has > 5 distinct palette-color FAMILIES (e.g., red + blue + green + amber + purple + …) ≥ 5 unique   | Tier-C (likely a chart/graph; needs a follow-up tokens phase) — confirm by reading the file                                         |
| File has ≤ 5 hits AND every hit is a status/error/badge/alert color (`bg-red-50`, `text-amber-600`, etc.) | Tier-A (mechanical swap)                                                                                                            |
| File has 6–20 hits AND all hits map to ≤ 3 semantic categories (status + link + border)                   | Tier-A (more work but still mechanical — example: `PositionEditor.tsx` has 19 hits mapping to status + link + form-control + error) |
| File has > 20 hits OR mixed semantics requiring per-line judgment                                         | Tier-C with proposed_token_map column populated for the reader                                                                      |

**Defensible value of N (CONTEXT.md hint):** 5 is a fair default for the "ALL mechanical AND ALL semantically clean" bar; the executor's call is to push individual files to Tier-A even when count > 5 if the mapping is obvious (PositionEditor at 19 is the canonical case).

**Estimated Tier-A file count (post-classification):** **~80–120 files**, ~600–900 literal swaps. Reasoning: D-03 removes ~25 high-count Tier-B files; ~140 ≤5-hit files plus ~50 mechanical >5-hit files land in Tier-A. The rest (~145 files) go Tier-C with audit rows.

**Top 10 anchor files for Tier-A worklist seeding (sorted by mechanical-swap potential, NOT raw hit count):**

| File                                                                              | Palette hits | Disposition     | Reasoning                                                                 |
| --------------------------------------------------------------------------------- | -----------: | --------------- | ------------------------------------------------------------------------- |
| `position-editor/PositionEditor.tsx`                                              |           19 | Tier-A          | D-02 anchor; all literals map to status/link/form-control/error           |
| `geographic-visualization/WorldMapVisualization.tsx` (path: not `territory-map/`) |        1 hex | Tier-A          | D-02 anchor; single `lineColor="#3B82F6"` — see Token-mapping cookbook §3 |
| `routes/_protected/admin/system.tsx`                                              |           23 | Tier-A          | Mostly status badges; mechanical                                          |
| `routes/_protected/admin/data-retention.tsx`                                      |           19 | Tier-A          | Admin status panels                                                       |
| `pages/MyAssignments.tsx`                                                         |           17 | Tier-A          | Status/priority chips                                                     |
| `components/forms/FormErrorDisplay.tsx`                                           |           20 | Tier-A          | All error / warning / info states                                         |
| `components/forms/FormCompletionProgress.tsx`                                     |           36 | Tier-A          | Progress states; mostly green / red / amber                               |
| `components/duplicate-comparison/DuplicateComparison.tsx`                         |           39 | Tier-A or split | Diff highlights — verify before committing the cut                        |
| `components/dossier/DossierTypeGuide.tsx`                                         |           26 | Tier-A          | Type-color showcase; check vs `semantic-colors.ts.dossierTypeColors`      |
| `components/dossier/dossier-overview/sections/WorkItemsSection.tsx`               |           18 | Tier-A          | Work-item status chips                                                    |

[VERIFIED: `rg -c` outputs 2026-05-15]

### 3. Smoke PR recipe

**Phase 48 D-16 / Phase 50-05 PR #11 precedent is proven and locally usable. The recipe:**

```bash
# Phase 50-05 PR #11 used a dedicated smoke test FILE under frontend/tests/.
# Phase 48 PR #7 used an inline JSX literal injection into App's render tree.
# For Phase 51, mirror Phase 48's pattern: a real-component literal injection
# is more legible as a "design-token rule fires" proof than a test file would be.

# 1) Pre-flight: confirm protection state matches expected
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --jq '.required_status_checks.contexts'
# Expected output (verified 2026-05-15):
# ["type-check", "Security Scan", "Lint", "Bundle Size Check (size-limit)",
#  "Tests (frontend)", "Tests (backend)"]

# 2) On a smoke branch off main HEAD, inject a real-component literal:
git checkout -b smoke/phase-51-design-token-gate
# Edit a non-load-bearing JSX file to add e.g.:
#   <div className="bg-red-500">smoke</div>
# inside an existing render tree so TS noUnusedLocals does not flag it
# (Phase 48 PR #6 → PR #7 deviation: a module-scope unused literal
#  triggered TS6133 and polluted the attribution. Place it inside an
#  already-rendered subtree.)

git commit -m "test: deliberate-bad design-token literal for smoke gate proof — DELETE BEFORE MERGE"
git push -u origin smoke/phase-51-design-token-gate

# 3) Open the PR
gh pr create \
  --title "Phase 51 smoke: design-token gate proof (DO NOT MERGE)" \
  --body "Smoke PR for Phase 51 D-10. Injects a known-bad Tailwind palette literal to verify the Lint job fails and main protection blocks merge. To be closed --delete-branch immediately after evidence capture."

# 4) Wait for CI to settle (gh pr view --json mergeStateStatus is eventually consistent
#    — poll on a 5s cadence for up to 3 minutes; status moves through UNSTABLE → BLOCKED
#    once the Lint check resolves to non-success.)
gh pr view <PR_NUM> --json mergeStateStatus,statusCheckRollup \
  | jq '{mergeStateStatus, lint: (.statusCheckRollup[] | select(.name == "Lint"))}'

# 5) Expected post-CI state:
#    mergeStateStatus: "BLOCKED"
#    statusCheckRollup Lint: { state: "FAILURE", bucket: "fail" }
#    Other contexts (type-check, Security Scan, Bundle Size Check (size-limit),
#    Tests (frontend), Tests (backend)) should be "SUCCESS" / "pass" so attribution
#    is clean (Phase 48 Deviation 1 — keep the smoke literal inside the render
#    tree to avoid TS6133).

# 6) Close + delete branch
gh pr close <PR_NUM> --comment "Smoke evidence captured for Phase 51 D-10. See 51-SUMMARY.md." --delete-branch
```

**Permanent regression fixture (Phase 50 D-15 alternative shape):**

The plan **MAY OPTIONALLY** ship `tools/eslint-fixtures/bad-design-token.tsx` mirroring `bad-vi-mock.ts` (Phase 50). If chosen:

- File contains a known-bad literal (e.g., `const _bad = <div className="bg-red-500" />`).
- Scoped into the rule's `files` glob via a new override block.
- Run via `pnpm lint tools/eslint-fixtures/bad-design-token.tsx` — must exit 1 with the D-05 message.
- Adds an EVERY-CI regression anchor that doesn't depend on a one-time smoke PR.

**Recommendation:** Keep the smoke PR as the gate-proof anchor (matches D-10's "real component" framing) AND add the permanent fixture as a CI-time regression guard (matches Phase 50 D-15's "fixture survives forever" framing). Both are cheap; together they cover one-time gate verification AND ongoing rule-firing verification.

**`mergeStateStatus` polling cadence (verified pattern from Phase 50-05 PR #11):**

- PR creation → check `statusCheckRollup` immediately: 0–5 jobs reported as `PENDING`.
- ~30s after creation → most jobs report `IN_PROGRESS`; `mergeStateStatus` is `UNSTABLE`.
- ~2–4min after creation → `Lint` resolves first (it's a fast job). `mergeStateStatus` flips to `BLOCKED` once any required context resolves to non-success.
- Poll on 10–15s cadence; total wait < 5 minutes in practice. Phase 50-05 PR #11 CI run `25883479613` took ~3 minutes to surface `Tests (frontend) = FAILURE`.

### 4. Phase 50 branch-protection state — already correct

**Live state captured 2026-05-15 (after Phase 50-05 close, commit `e24e92d1`):**

```json
{
  "required_status_checks": {
    "contexts": [
      "type-check",
      "Security Scan",
      "Lint",
      "Bundle Size Check (size-limit)",
      "Tests (frontend)",
      "Tests (backend)"
    ],
    "strict": true
  },
  "enforce_admins": { "enabled": true }
}
```

[VERIFIED: `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection`]

**Implications for Phase 51:**

1. **NO PUT required.** D-09's fold-into-existing-`Lint` posture is satisfied as-is.
2. **Context name is `Lint`** (capital L, no suffix). The case-sensitive context name maps to the GitHub Actions job `name:` field — must remain byte-exact in any smoke PR proof step.
3. **No pending Phase 50 PRs.** Phase 50-05 SUMMARY (commit `e24e92d1`) confirms the protection PUT landed on 2026-05-14 with the full 6-context list. Smoke PR #11 was closed `--delete-branch` 2026-05-14. STATE.md still shows Phase 50 paused — but that is documentation lag; the actual GitHub state matches the post-execution expectation.
4. **`enforce_admins=true` preserved.** Any future protection change MUST preserve this field (Phase 47 D-09 / Phase 48 D-15 / Phase 50-05 D-13 carry-forward).

**Risk between plan-time and execute-time:** If another phase modifies branch protection before Phase 51 ships, the executor must re-confirm `Lint ∈ contexts` before relying on D-09. There are no in-flight phases that touch protection on the current STATE.md.

### 5. Token-mapping cookbook

**The `@theme` block in `frontend/src/index.css` lines 43–118 declares the full implicit allowlist. Mapping rules for Tier-A swaps:**

| Banned palette                                                                     | Target token utility                                           | Source                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text-red-*`, `text-rose-*`, `text-red-{600,700,800,900}`                          | `text-danger`                                                  | `--color-danger: var(--danger)` (index.css:64) — `--danger` = `oklch(52% 0.18 25)` in `:root`                                                                                             |
| `bg-red-*` (status background, opacity ≤ 20%)                                      | `bg-danger/10` or `bg-danger/5`                                | Tailwind v4 supports `/` opacity modifier on token utilities                                                                                                                              |
| `border-red-*`                                                                     | `border-danger/30` or `border-danger`                          | Same opacity-modifier pattern                                                                                                                                                             |
| `text-amber-*`, `text-yellow-*`                                                    | `text-warning`                                                 | `--color-warning: var(--warn)` (index.css:68)                                                                                                                                             |
| `bg-amber-*`, `bg-yellow-*`                                                        | `bg-warning/10`                                                | —                                                                                                                                                                                         |
| `text-green-*`, `text-emerald-*`                                                   | `text-success`                                                 | `--color-success: var(--ok)` (index.css:66)                                                                                                                                               |
| `bg-green-*`, `bg-emerald-*`                                                       | `bg-success/10`                                                | —                                                                                                                                                                                         |
| `text-blue-*` for **links** (PositionEditor:211/237)                               | `text-accent` OR `text-primary`                                | Link semantic = accent in this design system; both resolve to `var(--accent)` via `@theme`. Prefer `text-accent` for new code; `text-primary` is the legacy semantic remap (index.css:82) |
| `text-blue-*` for **informational** badges                                         | `text-info`                                                    | `--color-info: var(--info)` (index.css:72)                                                                                                                                                |
| `bg-blue-*` (information state)                                                    | `bg-info/10`                                                   | —                                                                                                                                                                                         |
| `text-gray-*`, `text-slate-*`, `text-zinc-*`, `text-neutral-*`, `text-stone-*`     | `text-muted-foreground` OR `text-ink-mute` OR `text-ink-faint` | Three legitimate options depending on hierarchy: muted-foreground (legacy remap → `--ink-mute`), ink-mute (direct), ink-faint (lowest contrast). `[CITED: index.css:48-50, 85]`           |
| `bg-gray-*` (subtle backgrounds, `gray-50`/`gray-100`)                             | `bg-muted` OR `bg-line-soft`                                   | `--color-muted: var(--surface)` (index.css:95) for surface contexts; `bg-line-soft` for inline separators                                                                                 |
| `border-gray-*`                                                                    | `border-line` OR `border`                                      | `--color-border: var(--line)` (index.css:86)                                                                                                                                              |
| `text-purple-*`, `text-violet-*`, `text-fuchsia-*`, `text-pink-*`, `text-indigo-*` | (no clean token target)                                        | These are chart/data-viz colors with no `@theme` equivalent. Push the file to Tier-B (chart) or Tier-C with rationale.                                                                    |

**Specific anchor recipes:**

**1) `WorldMapVisualization.tsx:193` — `lineColor="#3B82F6"`**

The `WorldMap` component (frontend/src/components/ui/world-map.tsx) accepts `lineColor?: string` and interpolates it into SVG `fill=`, `stop-color=`, and `stroke=` attributes (lines 138, 151, 157, 183, 189, 217). **SVG attributes do NOT accept `var(--accent)` in all renderers** — they need a resolved color string at paint time.

Three viable Tier-A approaches:

- **(a) Read CSS var at runtime:** Use `getComputedStyle(document.documentElement).getPropertyValue('--accent')` and pass the resolved string. Adds a runtime token-resolution helper. **Risk:** `--accent` is `oklch(58% 0.14 32)` and the SVG renderer may not support `oklch()` in all browsers without color-mix — verify in Chrome / Safari.
- **(b) Use the canonical fallback literal:** The `:root { ... }` block at `frontend/src/index.css:137` declares the Bureau-light fallback. The hex equivalent of Bureau-light's `--accent` `oklch(58% 0.14 32)` is approximately `#C2553D` (warm rust). Pin a Tier-A-safe constant via the semantic-colors.ts module or a dedicated `--chart-accent-hex` token export. **NOT** the right answer because it doesn't follow theme switching.
- **(c) Use the existing `graphNodeColors` pattern in `semantic-colors.ts`:** Lines 370–381 export `graphNodeColors` as CSS-var-string values (e.g., `'var(--heroui-accent)'`). React-Flow / data-viz components already use this pattern. Pass `lineColor={graphEdgeColors.related_to ?? 'var(--heroui-accent)'}` — but this assumes the consumer (SVG `<stop stopColor=...>`) accepts `var()` references.

**Recommended:** Approach (a) with a small `useTokenColor(name: string)` hook that returns `getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()`, with a default to the Bureau-light hex if the var is empty (FOUC fallback). This is the same shape the FOUC bootstrap.js already uses for the inverse direction. Document with a CSS-var read comment per Plan 33-03 precedent.

**Alternative recommended:** Convert `WorldMap` consumer to derive the line color from the project's existing `graphEdgeColors` map (semantic-colors.ts:386) — it already uses CSS-var strings. Verify the SVG renderer accepts them (Chrome and Safari both support `var()` in SVG presentation attributes since 2021; Firefox since 2022 — should be safe across the project's supported browsers).

**Spike check during execution:** mount the component with the chosen approach in a temporary dev page and confirm the SVG actually renders the lines. Phase 51 plan must include this verification step.

**2) `PositionEditor.tsx:211/237` — `class: 'text-blue-600 underline'` (tiptap Link extension)**

These are tiptap `Link.configure({ HTMLAttributes: { class: ... } })` decoration strings. The `class` field is interpolated into the rendered `<a class="..." />` HTML — Tailwind sees them at runtime if they're tree-shaken correctly. Safe to swap to `'text-accent underline'`. Verify tiptap doesn't strip Tailwind-resolved classes (it doesn't — it passes the attribute string through).

**3) `PositionEditor.tsx:410` — `<Card className="border-red-200 bg-red-50">`**

Direct swap: `<Card className="border-danger/30 bg-danger/10">`. Verify Tailwind v4 emits the opacity-modified utility — it does (`bg-{token}/{opacity}` is core Tailwind v4 syntax for arbitrary `--color-*` tokens). [CITED: tailwindcss v4 docs on opacity modifiers + index.css `@theme` block]

**4) `PositionEditor.tsx:412` — `<div className="text-red-800">`**

Swap: `text-danger`. The `-800` variant in the source = "darkest red" semantic; `text-danger` is darker than `text-danger/80` so semantic intent is preserved.

**5) `PositionEditor.tsx:531` — `<AlertCircle className="size-5 text-red-600" />`**

Swap: `text-danger`. Identical reasoning.

**Mechanical mapping for everything else (~80-120 Tier-A files):** Use the table at the top of this section as the rule book. For ambiguous cases, default to the closest semantic anchor and verify visually in the Tier-A wave's smoke step.

## Files to Touch

**Pure-config files (D-05, D-13):**

- `eslint.config.mjs` — add two/three new `no-restricted-syntax` selectors in the existing frontend override block (around line 198); add a new section after line 221 with Tier-B file overrides.

**Tier-A anchor files (D-02):**

- `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx` (line 193) — see Token-mapping cookbook §3.1
- `frontend/src/components/position-editor/PositionEditor.tsx` (lines 60, 70, 82, 95, 107, 120, 132, 145, 211, 237, 410, 412, 441, 442, 449, 486, 487, 495, 531) — full mechanical sweep

**Tier-A mechanical-swap files (planner produces concrete list from the rg histogram):**

- Estimated 80–120 files. Top 10 candidates listed in Implementation Approach §2.

**Tier-B carve-out enumeration in config (D-03):**

```
frontend/src/design-system/tokens/directions.ts
frontend/src/index.css                              (already not scanned by ts/tsx files glob; included for explicit documentation)
frontend/src/styles/modern-nav-tokens.css           (ditto)
frontend/public/bootstrap.js                        (also not in ts/tsx glob; explicit)
frontend/src/components/signature-visuals/flags/**/*.{tsx,ts}
frontend/src/components/analytics/CommitmentFulfillmentChart.tsx
frontend/src/components/analytics/RelationshipHealthChart.tsx
frontend/src/components/analytics/WorkloadDistributionChart.tsx
frontend/src/components/analytics/EngagementMetricsChart.tsx
frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx
frontend/src/components/analytics/ClusterVisualization.tsx
frontend/src/components/analytics/sample-data.ts
frontend/src/components/dashboard-widgets/ChartWidget.tsx
frontend/src/components/sla-monitoring/SLAComplianceChart.tsx
frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx
frontend/src/components/stakeholder-influence/InfluenceReport.tsx
frontend/src/components/relationships/RelationshipGraph.tsx
frontend/src/components/dossier/MiniRelationshipGraph.tsx       (note: actual path may be `frontend/src/components/dossiers/` — verify before adding glob)
frontend/src/components/report-builder/ReportPreview.tsx
frontend/src/lib/semantic-colors.ts                 (uses token utilities — but has raw `var(--heroui-accent)` strings that are NOT hex/palette, so this carve-out is defensive, not strictly necessary)
```

**Tier-C audited disables (per-file, ~145 files):**

- Each file in `51-DESIGN-AUDIT.md` gets one `// eslint-disable-next-line` per offending Literal with phase-and-row annotation.
- File-list is generated from the sweep delta minus Tier-A minus Tier-B.

**Audit artifact (D-04):**

- `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` — new file.

**Summary artifact (D-10):**

- `.planning/phases/51-design-token-compliance-gate/51-SUMMARY.md` — new file. Records smoke PR URL + protection state snapshot.

**Optional permanent regression fixture (Phase 50 D-15 echo):**

- `tools/eslint-fixtures/bad-design-token.tsx` — deliberately-bad literal; CI-time regression guard.
- `eslint.config.mjs` — extend the existing `tools/eslint-fixtures/**/*.{ts,tsx}` `files` glob (lines 226–228) to include the new fixture under the rule's selector scope.

**Files NOT touched in Phase 51:**

- `.github/workflows/ci.yml` (no new job; D-09)
- Branch protection on `main` (no new required-context PUT; already correct)
- `frontend/package.json` (no lint script change)
- `backend/**/*` (frontend-only rule scope)
- `turbo.json` (`globalDependencies` already includes `eslint.config.mjs`)

## Dependencies and Patterns

### Carry-forward from prior phases

**Phase 48 (lint-config-alignment):**

- **D-15 PR-blocking `Lint` context already wired on `main`.** D-09 reuses verbatim — no PUT needed.
- **`components/ui/**` carve-out shape (lines 215–221)\*\* is the exact precedent for Tier-B per-file overrides (D-03 / D-13).
- **`no-restricted-syntax` selector grammar with `Literal[value=/\\bword\\b/]`** is reused 11× in the RTL block (lines 148–198). D-05 follows the same shape.
- **Variant-prefix-aware regex pattern** is NOT yet in the codebase — D-05 introduces `(?:[a-z-]+:)*` for the first time. The Phase 48 RTL selectors use plain `\b` without variants because RTL utilities don't combine with variant prefixes.
- **No-emoji rule-message convention** (Phase 48 D-06) — D-05 messages cite `CLAUDE.md §Design rules` and `semantic-colors.ts` with no emoji.
- **Smoke PR pattern (D-16)** — PR #7 / PR #8 closed `--delete-branch` after `Lint=fail` + `mergeStateStatus=BLOCKED` was captured. D-10 reuses verbatim.
- **D-17 zero net-new `eslint-disable`** — D-12 mirrors with a Tier-C-tracked exemption.

**Phase 50 (test-infrastructure-repair):**

- **D-04 audit artifact shape (`50-TEST-AUDIT.md`)** — columns `workspace | file | failure_class | disposition | rationale`. D-04 audit in Phase 51 mirrors with `file | raw_hex_count | palette_literal_count | proposed_token_map | disposition | follow_up_phase`.
- **D-13 two PR-blocking contexts (`Tests (frontend)` + `Tests (backend)`)** — added to branch protection 2026-05-14 (commit `9710664f`, PR #11 evidence). Phase 51 does NOT modify this list.
- **D-15 project-local ESLint rule via `no-restricted-syntax` (vi-mock guard) at lines 224–240** — shape used as an alternative for D-05; rejected because the regex-on-Literal pattern fits cleanly with the existing 11 selectors. Phase 51 may add a similar `tools/eslint-fixtures/` regression fixture for ongoing CI-time guard.
- **`scripts/lint.mjs`** — preserves `pnpm lint` workspace-wide and adds `pnpm lint <path>` for targeted runs. Phase 51 uses this for the fixture verification (`pnpm lint tools/eslint-fixtures/bad-design-token.tsx`).

### Existing `eslint.config.mjs` precedent shapes (line numbers verified 2026-05-15)

| Pattern                                                                 | Source                        | How Phase 51 reuses                                                        |
| ----------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| `Literal[value=/\\bword\\b/]` selector                                  | Lines 151–197 (RTL)           | D-05 hex + palette regexes follow the same shape                           |
| Per-file `'no-restricted-syntax': 'off'` rule override                  | Lines 215–221 (components/ui) | D-03 Tier-B files use the identical block shape                            |
| `files: ['frontend/**/*.{ts,tsx}']` + `rules: { ... }` override section | Lines 70–200                  | D-05 selectors slot inside the same block                                  |
| Separate override block for test-specific files                         | Lines 224–240 (vi-mock guard) | Optional D-10 regression fixture block follows the same shape              |
| Global `ignores:` block (lines 12–25)                                   | Lines 12–25                   | NOT used by Phase 51 — Tier-B is rule-scoped `off`, not file-scoped ignore |
| Single-message-per-rule policy with no emoji                            | Lines 152, 156, 168, 172      | D-05 messages cite `CLAUDE.md §Design rules` + token names                 |
| Plugin-set freeze (no new plugin imports)                               | Lines 1–8                     | D-05 adds zero new plugins                                                 |

### CLAUDE.md alignment

The plan output must comply with:

- **§"Visual Design Source of Truth"** — Tier-B for `directions.ts` / `index.css` / `bootstrap.js` honors the byte-match rule.
- **§"Design rules — non-negotiable"** — D-05's selector message cites this section directly.
- **§"Definition of Done — UI checklist"** — Tier-A swaps make the "all colors resolve to design tokens" check enforceable, not just aspirational.
- **§"Karpathy Coding Principles" — Surgical Changes** — Phase 51 explicitly does NOT refactor adjacent code during the swap pass. Per-file disable annotation in Tier-C is the surgical minimum.
- **§"Component Library Strategy"** — Tier-B for `components/ui/**` is already carved out (Phase 48); no Phase 51 change.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | ESLint 9.39.4 (flat config) + Vitest 3.x (existing test suite for visual-parity Tier-A spot-checks)                                                                                                 |
| Config file        | `eslint.config.mjs` (root); `frontend/vitest.config.ts` (visual-parity spot-checks)                                                                                                                 |
| Quick run command  | `pnpm lint` (workspace-wide; ESLint v9 flat config picks up D-05 selectors automatically)                                                                                                           |
| Targeted command   | `pnpm lint tools/eslint-fixtures/bad-design-token.tsx` (if fixture path added) — exits non-zero on D-05 rule fire; OR `pnpm exec eslint -c eslint.config.mjs frontend/src/<path>` for a single file |
| Full suite command | `pnpm lint` (workspace lint) + `pnpm --filter frontend test --run` (component tests covering Tier-A files) — both must exit 0                                                                       |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                                            | Test Type           | Automated Command                                                                                                                          | File Exists?                                                      |
| --------- | --------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| DESIGN-01 | Raw hex in a .ts/.tsx file is flagged                                                               | static lint         | `pnpm exec eslint -c eslint.config.mjs <tier-c-file-with-known-hex>` → exits 1 with hex-rule message                                       | ✅ verify on commit                                               |
| DESIGN-02 | Tailwind palette literal (with or without variant prefix) is flagged                                | static lint         | `pnpm exec eslint -c eslint.config.mjs <tier-c-file-with-known-palette>` → exits 1 with palette-rule message                               | ✅ verify on commit                                               |
| DESIGN-02 | Token-mapped utility (`text-ink`, `bg-accent`, `text-success`) passes                               | static lint         | `pnpm lint <Tier-A-file-after-swap>` → exits 0                                                                                             | ✅ verify on commit                                               |
| DESIGN-02 | Banned palette literal inside a template literal is flagged                                         | static lint         | If `TemplateElement` companion selector ships: `pnpm lint <file-with-template-literal-palette>` → exits 1                                  | ✅ verify on commit                                               |
| DESIGN-03 | `WorldMapVisualization.tsx` renders the SVG line with theme-derived color (visual parity unchanged) | component/visual    | `pnpm --filter frontend test --run -- territory-map` OR Playwright visual spec if Tier-A swap warrants                                     | ⚠️ check if test exists; may need new                             |
| DESIGN-03 | `PositionEditor.tsx` renders identically pre/post swap on default theme                             | component snapshot  | `pnpm --filter frontend test --run -- position-editor`                                                                                     | ⚠️ check if test exists; otherwise add visual-parity step in plan |
| DESIGN-04 | `pnpm lint` exits 0 workspace-wide with new selectors active                                        | static lint         | `pnpm lint`                                                                                                                                | ✅ standard                                                       |
| DESIGN-04 | A PR with a known-bad literal cannot merge to `main`                                                | integration / smoke | `gh pr view <smoke-pr> --json mergeStateStatus` → `BLOCKED`                                                                                | ✅ recipe in §3 above                                             |
| D-12      | Diff introduces 0 net-new `eslint-disable*` outside Tier-C audit                                    | grep                | `git diff phase-51-base..HEAD -- 'frontend/src' \| grep -E '^\+.*eslint-disable' \| wc -l` → equals Tier-C count from `51-DESIGN-AUDIT.md` | ✅ standard pattern from Phase 48-03                              |

### Sampling rate

- **Per task commit:** `pnpm lint <touched-files>` runs in <10s; commit it as the per-commit gate.
- **Per wave merge (multi-file Tier-A sweep):** `pnpm lint` workspace-wide + `pnpm --filter frontend test --run` on Tier-A-touched modules. Catches drift across the wave.
- **Phase gate:** `pnpm lint` workspace-wide green + smoke PR `mergeStateStatus=BLOCKED` evidence captured + `51-DESIGN-AUDIT.md` Tier-C row count equals `git diff` `eslint-disable` count.

### Wave 0 Gaps

- [ ] `tools/eslint-fixtures/bad-design-token.tsx` — optional permanent regression fixture; recommended for parity with Phase 50 D-15 pattern.
- [ ] No new vitest framework install needed — Vitest is already wired (Phase 50 D-03).
- [ ] Tier-A visual-parity verification: NO formal Playwright visual baselines exist for `PositionEditor` or `WorldMapVisualization`. The plan should either (a) accept eyeball-verification on a dev page as the parity check for these two anchors, or (b) add component snapshot tests for the post-swap render. (a) matches the project's existing posture for non-baseline components; (b) is more defensible if a regression were to slip.
- [ ] `51-DESIGN-AUDIT.md` template — populate row-1 with a representative Tier-C example so the executor has a concrete shape to follow.

## Common Pitfalls

### Pitfall 1: Template-literal blind spot in Phase 48 RTL selectors

**What goes wrong:** A developer writes ``className={`text-red-500 ${isActive && 'bg-red-100'}`}``. The outer template literal is `TemplateLiteral`, not `Literal`; D-05's first two selectors don't fire. The second string `'bg-red-100'` IS a Literal — that gets caught — but the leading `text-red-500` inside the template quasi slips through.

**Why it happens:** ESLint AST distinguishes `Literal` (quoted string) from `TemplateElement` (template-string segment). The Phase 48 RTL selectors have this gap today (12 known files in frontend/src embed banned palette utilities inside template literals — they would survive a Literal-only design-token selector).

**How to avoid:** Add a third selector with the same regex against `TemplateElement[value.raw=/.../]`. This is the lowest-cost coverage extension; estimated 12 additional files to swap to Tier-A (or push to Tier-C if the literals are conditionally interpolated).

**Warning signs:** A Tier-A swap pass that leaves `pnpm lint` clean but has template-literal palette classes still rendering. Spot-check by `rg "\`[^\`]\*\\bbg-red-[0-9]" frontend/src/` after the swap.

### Pitfall 2: `WorldMap` SVG renderer compatibility with `var()` references

**What goes wrong:** Tier-A swaps `lineColor="#3B82F6"` to `lineColor="var(--accent)"`. The SVG `<stop stop-color="var(--accent)">` works in Chrome/Safari/Firefox today (var() support in SVG presentation attributes is stable), but the `dotted-map` library or React 19 reconciliation may pass the string through a code path that fails the resolve.

**Why it happens:** Some SVG libraries pre-parse color strings; some don't. `dotted-map` is opaque to the consumer.

**How to avoid:** Verify with a dev-page mount before committing. Fallback to a resolved-at-runtime approach via `getComputedStyle(...).getPropertyValue('--accent')` — this returns a guaranteed-resolvable string regardless of SVG-attribute semantics.

**Warning signs:** SVG renders with no line / black line / fallback color in Chrome devtools "computed" panel.

### Pitfall 3: TypeScript `noUnusedLocals` interaction with smoke-PR injection

**What goes wrong:** Smoke PR author injects `const _bad = <div className="bg-red-500">smoke</div>` at module scope. Phase 48 PR #6 hit this exact trap — `noUnusedLocals: true` in `frontend/tsconfig.json` flagged TS6133, polluting attribution from "Lint fails" to "Lint AND type-check fail".

**Why it happens:** Module-scope literals with no consumer trigger `noUnusedLocals`.

**How to avoid:** Place the smoke literal inside an already-rendered JSX subtree (Phase 48 PR #7's fix). Concretely: pick a route component, add `<div className="bg-red-500">smoke</div>` inside its existing return tree, commit, push, open PR.

**Warning signs:** Smoke PR shows BOTH `Lint=fail` AND `type-check=fail`. Close that PR with `--delete-branch` and try again with the in-tree injection.

### Pitfall 4: Tier-C disable count drift vs. audit

**What goes wrong:** Executor adds Tier-C disables file-by-file. The audit row claims `palette_literal_count: 12` but the actual disabled-line count is 13 (off-by-one from a missed literal) — or vice versa. D-12's diff-greppable count verification fails.

**Why it happens:** Manual counting across many files invites drift.

**How to avoid:** After each Tier-C wave, regenerate the count from source via `rg -c 'eslint-disable-next-line no-restricted-syntax' <file>` and reconcile against `51-DESIGN-AUDIT.md` BEFORE committing. The audit table is the source of truth; the source code's disable count must match.

**Warning signs:** D-12 gate fails at phase close (`git diff` shows N net-new disables, audit claims M, N ≠ M).

### Pitfall 5: Path drift between CONTEXT.md and the actual repo

**What goes wrong:** CONTEXT.md D-02 names `frontend/src/components/territory-map/WorldMapVisualization.tsx`. The actual file is at `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx`. A plan task referencing the wrong path will silently fail to find the file.

**Why it happens:** Path was inferred from an earlier-phase artifact and not re-grepped.

**How to avoid:** Plan task descriptions should `find` the file by basename before referencing it. Or: use a `__verify` step at task start that `ls`s the target path.

**Warning signs:** Plan execution starts with a `Read` tool call returning "file does not exist."

### Pitfall 6: Tier-B carve-out glob over-matches a Tier-A file

**What goes wrong:** Tier-B glob `'frontend/src/components/analytics/**Chart.tsx'` accidentally matches a future `AnalyticsLineChart.tsx` that DOES have mechanical literals worth Tier-A swap. The carve-out turns off the rule there even though it shouldn't.

**Why it happens:** `**Chart.tsx` is a wildcard, not a literal-name list.

**How to avoid:** Either (a) enumerate Tier-B file names explicitly (not globs) where possible, or (b) accept the over-match risk and document in CHANGELOG / audit-row for future re-tier reviews.

**Warning signs:** A new chart file lands in `analytics/` and goes design-token-noncompliant without lint error.

## Code Examples

### Verified Pattern: D-05 selector block (final shape)

```js
// Source: eslint.config.mjs extension to existing frontend override block
// Lines 148–198 already have 11 RTL selectors; D-05 appends after them.
//
// Note: messages mirror the no-emoji single-sentence convention from Phase 48 D-06.

'no-restricted-syntax': [
  'error',
  // ... existing 11 RTL selectors ...
  {
    // D-05 raw-hex selector — covers 3, 4, 6, and 8 hex digits.
    selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
    message:
      'Raw hex colors are forbidden in frontend/src. Use design tokens (text-ink, bg-accent, text-danger, etc.) from frontend/src/index.css @theme block. See CLAUDE.md §Design rules.',
  },
  {
    // D-05 Tailwind palette literal — variant-aware via (?:[a-z-]+:)*
    selector:
      'Literal[value=/(?:^|\\s)(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\\d{2,3}\\b/]',
    message:
      'Tailwind color literals are forbidden in frontend/src. Use token-mapped utilities (text-ink, bg-accent, text-success, text-danger, etc.) or import from frontend/src/lib/semantic-colors.ts. See CLAUDE.md §Design rules and frontend/src/index.css @theme block.',
  },
  {
    // D-05 companion — close the template-literal blind spot (12 known files).
    selector:
      'TemplateElement[value.raw=/(?:^|\\s)(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\\d{2,3}\\b/]',
    message:
      'Tailwind color literals are forbidden in frontend/src — including inside template literals. Use token-mapped utilities.',
  },
],
```

### Verified Pattern: Tier-A swap recipe (mechanical)

```diff
- <Card className="border-red-200 bg-red-50">
+ <Card className="border-danger/30 bg-danger/10">
     <CardContent className="pt-4">
-      <div className="flex items-center gap-2 text-red-800">
+      <div className="flex items-center gap-2 text-danger">
         <AlertCircle className="size-4" />
         <span>{error}</span>
       </div>
```

### Verified Pattern: Tier-C disable annotation

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

### Verified Pattern: 51-DESIGN-AUDIT.md row shape

```markdown
| file                                    | raw_hex_count | palette_literal_count | proposed_token_map                                                                                                                  | disposition     | follow_up_phase                        |
| --------------------------------------- | ------------: | --------------------: | ----------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------- |
| components/triage-panel/TriagePanel.tsx |             0 |                    53 | text-yellow-700 → text-warning; text-green-600 → text-success; text-orange-600 → text-warning (or accent if "in progress" semantic) | deferred-tier-c | TBD-design-token-tier-c-cleanup-wave-1 |
```

## State of the Art

| Old Approach                                         | Current Approach                                                                           | When Changed | Impact                                                                                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tailwind.config.ts` `theme.extend.colors = { ... }` | Tailwind v4 `@theme { --color-* }` declarations in `index.css`                             | Phase 33-06  | The "implicit allowlist" (D-06) works because every `@theme`-declared color name is exposed as a utility automatically; new tokens added there auto-pass the rule with zero rule edits. |
| `eslint-plugin-tailwindcss` for class-name parsing   | `no-restricted-syntax` with regex-on-Literal (Phase 48 D-09 froze the plugin set)          | Phase 48     | Phase 51 reuses the regex pattern; no new plugin dependency.                                                                                                                            |
| Aggregate `Unit Tests` CI job                        | Split into `Tests (frontend)` + `Tests (backend)` (Phase 50-05)                            | 2026-05-14   | Branch-protection now requires both. Phase 51 does NOT add `Lint` again (already there since Phase 48-03 PR #7/PR #8) — only one PUT to protection happens per CI-gate phase.           |
| `eslint-disable` blanket file-top                    | Per-Literal `eslint-disable-next-line` with phase-and-row annotation (Phase 48 D-17 carry) | Phase 48     | Phase 51 D-12 reuses; Tier-C disables are auditable per-Literal, not per-file.                                                                                                          |
| `frontend/eslint.config.js` (workspace-local)        | Root `eslint.config.mjs` (Phase 48 D-01)                                                   | Phase 48     | Single source of truth for all lint policy; Phase 51 modifies one file, not multiple.                                                                                                   |

**Deprecated / outdated:**

- The notion of a "Design Tokens" dedicated CI job — superseded by D-09 (fold into existing `Lint`).
- The notion of needing to write a custom ESLint plugin for Phase 51 — superseded by D-05 regex-on-Literal fitting cleanly into the existing pattern.
- The "≤5 literals → Tier-A; >5 → Tier-C" hard rule — replaced by a smarter semantic-cleanliness heuristic in Implementation Approach §2 (PositionEditor at 19 is Tier-A because the mapping is mechanical).

## Assumptions Log

| #   | Claim                                                                                                                                                                                            | Section                             | Risk if Wrong                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | SVG presentation attributes (`stop-color`, `fill`, `stroke`) in Chrome / Firefox / Safari accept `var(--token)` references in dotted-map / WorldMap component.                                   | Implementation Approach §5.1        | Smoke-test the WorldMap swap on a dev page; if `var()` fails, fall back to runtime `getComputedStyle` resolution.                                                                                                                  |
| A2  | The 12 files identified with palette literals inside template strings are the complete set in `frontend/src/`.                                                                                   | Pitfall 1                           | Re-run `rg "\`[^\`]\*<palette regex>"` at execute time; the count may have drifted up by phase-execution time. Companion selector still catches whatever is present.                                                               |
| A3  | `STATE.md` "Phase 50 paused" is stale documentation, not an active block — actual GitHub state already reflects Phase 50-05 close (smoke PR #11 closed, contexts include `Tests (*)`).           | §"Phase 50 branch-protection state" | If a second protection PUT happens between research time and execute time, the executor must re-confirm `Lint ∈ contexts` and `enforce_admins=true`. Current evidence (live `gh api`) is correct.                                  |
| A4  | The estimated Tier-A file count of 80–120 holds after the actual classification pass.                                                                                                            | Implementation Approach §2          | Plan should size by file count, not by literal count. If the count is materially different post-classification, the plan slicing should adapt (more sub-waves vs. fewer).                                                          |
| A5  | The `lineColor` SVG renderer in `WorldMap` is unchanged from the Phase 49-02 `React.lazy()` conversion; the current `lineColor: string` API is the contract.                                     | Implementation Approach §5.1        | If the WorldMap component is replaced or its API changes between now and execute time, the Tier-A swap recipe needs to be re-derived. Probability low; the component is feature-stable.                                            |
| A6  | The `text-blue-*` → `text-accent` vs. `text-info` mapping is correctly disambiguated at execute time. Link semantics = accent; informational badge semantics = info.                             | Token-mapping cookbook              | Mis-mapping yields a visual change, not a regression. Spot-check the rendered DOM during Tier-A sweep.                                                                                                                             |
| A7  | The companion `TemplateElement` selector does not introduce false-positives via tagged template literals (e.g., `tw\`...\``). The project does not appear to use tagged-template Tailwind today. | Pitfall 1                           | `rg 'tw\`'`on frontend/src — if hits, verify the companion selector doesn't fire incorrectly inside tagged templates. Tagged templates DO produce`TemplateElement` children, so the selector WILL fire — this is correct behavior. |

**These assumptions need user confirmation only if the Tier-A mapping for `text-blue-*` (A6) or the WorldMap SVG approach (A1) is contentious. Everything else is verifiable at execute time.**

## Open Questions (RESOLVED)

1. **Template-literal coverage scope — selector vs. punt forward.**
   - What we know: 12 files in frontend/src have palette literals inside untagged template strings; Phase 48 RTL selectors share this blind spot today.
   - What's unclear: Whether to add the third selector (`TemplateElement[value.raw=/.../]`) in Phase 51 or accept it as a known carry-forward.
   - Recommendation: **Add the companion selector.** The 12 files include `routes/_protected/admin/system.tsx` (Tier-A candidate at 23 hits) and `pages/word-assistant/WordAssistantPage.tsx` (status indicator) — leaving the coverage gap means the rule's promise ("design tokens only") isn't fully delivered. The extra selector is one config-line; the coverage cost is high.
   - **RESOLVED:** Ship the TemplateElement companion selector — implemented as Plan 51-01 Task 2 step (c) (the `TemplateElement[value.raw=...]` palette selector appended alongside the Literal hex + Literal palette selectors in the same `no-restricted-syntax` array).

2. **Smoke PR style — JSX literal injection vs. permanent fixture file.**
   - What we know: Phase 48 D-16 used real-component JSX injection (PRs #7/#8). Phase 50 D-15 used a permanent fixture file (`tools/eslint-fixtures/bad-vi-mock.ts`).
   - What's unclear: Phase 51 D-10 says "real component"; planner discretion permits either or both.
   - Recommendation: **Both.** The smoke PR is the one-time gate-block proof per D-10; the fixture is the ongoing CI-time regression guard. Both are cheap.
   - **RESOLVED:** In-tree JSX literal injection per Phase 48 PR #7 donor — implemented as Plan 51-04 Task 4 (smoke branch `smoke/phase-51-design-token-gate`, deliberate `<div className="bg-red-500">smoke</div>` inside an existing rendered JSX subtree, NEVER module scope per Pitfall 3). The permanent fixture is shipped separately in Plan 51-01 Task 4.

3. **`WorldMap` lineColor approach — `var()` reference vs. `getComputedStyle` runtime read.**
   - What we know: SVG presentation attributes accept `var()` in current browsers, but `dotted-map`'s opacity layer is opaque.
   - What's unclear: Whether `var()` survives the WorldMap render pipeline.
   - Recommendation: **Try `var()` first** (one-line change: `lineColor="var(--accent)"`); fall back to a runtime `useTokenColor()` hook only if rendering fails. The runtime hook adds complexity Phase 51 doesn't need if the simpler path works.
   - **RESOLVED:** Recipe A/B/C `var(--accent)` via `getComputedStyle` spike — implemented as Plan 51-02 Task 1 (the SPIKE → CHOOSE RECIPE → SWAP three-step approach; executor commits to Recipe A `lineColor="var(--accent)"`, B `getComputedStyle(documentElement).getPropertyValue('--accent')`, or C `graphEdgeColors` import after dev-page verification).

4. **`semantic-colors.ts` Tier-B inclusion — defensive vs. strict.**
   - What we know: The file uses token utilities (`bg-primary/10`, `text-warning`) — these PASS the new selectors. The `graphNodeColors` / `graphEdgeColors` maps return `'var(--heroui-accent)'` strings — these are NOT hex/palette literals, so they ALSO PASS.
   - What's unclear: Whether to include `semantic-colors.ts` in the Tier-B allowlist defensively or leave it under the rule.
   - Recommendation: **Leave it under the rule.** All current strings pass; including it in Tier-B suggests it has design-rule-violating literals when it doesn't. If a future addition violates the rule, that's the right place for it to surface and be fixed.
   - **RESOLVED:** Tier-B via `components/ui/**` carve-out + token-map files (semantic-colors.ts intentionally NOT in carve-out) — implemented as Plan 51-01 Task 3 (the D-03 Tier-B override block enumerates explicit chart/flag/token-map files; `semantic-colors.ts` is deliberately omitted because its current content passes the new selectors).

5. **`51-DESIGN-AUDIT.md` row count expectation.**
   - What we know: ~145 Tier-C files post-classification estimated.
   - What's unclear: How the future-cleanup phase breakdown should anticipate this volume. 200–250 across 2–4 phases (per CONTEXT deferred section) may be an underestimate if Tier-C count comes in higher.
   - Recommendation: Audit Tier-C row count BEFORE Phase 51 ships; if >175, propose the cleanup phases now via a roadmap PR so v6.4 / v7.x can schedule them.
   - **RESOLVED:** Histogram-driven; freeze ~80-120 Tier-A rows in `51-DESIGN-AUDIT.md` — implemented as Plan 51-03 Task 1 (live `rg -c` histogram with Tier-B exclusions + classification heuristic; the frozen Tier-A worklist seeds Plan 51-04 Task 1's Tier-C delta calculation).

## Environment Availability

| Dependency                | Required By                                             | Available | Version  | Fallback                                    |
| ------------------------- | ------------------------------------------------------- | --------- | -------- | ------------------------------------------- |
| ESLint                    | D-05 selector evaluation                                | ✓         | 9.39.4   | —                                           |
| @typescript-eslint/parser | AST parsing for Literal / TemplateElement               | ✓         | 8.57.2   | —                                           |
| Node.js                   | `pnpm` + lint runner                                    | ✓         | 22.x+    | —                                           |
| pnpm                      | Workspace lint                                          | ✓         | 10.29.1+ | —                                           |
| `gh` (GitHub CLI)         | Smoke PR creation + branch-protection inspection (D-10) | ✓         | (system) | Manual GitHub web UI possible but slower    |
| `rg` (ripgrep)            | Pre-flight violation histogram                          | ✓         | (system) | `grep -rE` works but is slower              |
| Turbo                     | `pnpm lint` workspace orchestration                     | ✓         | (deps)   | Direct `pnpm exec eslint` works as fallback |

**No missing dependencies. No external services. No new tool installs.**

## Security Domain

**Phase 51 has no security surface.** No auth changes, no user-facing endpoints, no PII handling, no input validation, no cryptography. The new ESLint rule operates at lint time on source code and has no runtime effect.

| ASVS Category         | Applies | Standard Control |
| --------------------- | ------- | ---------------- |
| V2 Authentication     | no      | n/a              |
| V3 Session Management | no      | n/a              |
| V4 Access Control     | no      | n/a              |
| V5 Input Validation   | no      | n/a              |
| V6 Cryptography       | no      | n/a              |

The smoke PR step uses `gh` CLI which authenticates via an existing token; no new credentials are introduced.

## Project Constraints (from CLAUDE.md)

The planner MUST honor these CLAUDE.md directives during Phase 51:

1. **§"Visual Design Source of Truth"** — IntelDossier prototype is the visual reference; `directions.ts` / `index.css` / `bootstrap.js` MUST byte-match (justifies D-03 Tier-B).
2. **§"Design rules — non-negotiable"** — "No raw hex. No Tailwind color literals" is the source-of-truth statement that Phase 51 makes machine-enforceable.
3. **§"Definition of Done — UI checklist"** — Tier-A swaps must keep colors resolving to tokens; no `text-blue-500` post-swap.
4. **§"Arabic RTL Support Guidelines"** — Tier-A swaps MUST preserve logical-property usage (`ms-*`, `pe-*`). No accidental physical-property reintroduction.
5. **§"Component Library Strategy"** — Primitive cascade is locked (HeroUI v3 → Radix → custom). Tier-A swaps MUST NOT introduce new component libraries.
6. **§"No emoji in user-visible copy"** — D-05 rule messages have zero emoji.
7. **§"Karpathy Coding Principles" — Surgical Changes** — Tier-A swap pass MUST NOT touch adjacent code, comments, or formatting. Each changed line traces directly to the design-token rule.
8. **§"GSD Workflow Enforcement"** — Phase 51 runs under `/gsd:execute-phase` after planning; no out-of-band edits.

**Treat these with the same authority as locked decisions from CONTEXT.md.**

## Sources

### Primary (HIGH confidence)

- `eslint.config.mjs` (lines 1–495) — single source of truth for lint policy; D-05 / D-13 modify lines 148–198 and append after line 221. [VERIFIED 2026-05-15]
- `frontend/src/index.css` §`@theme` block (lines 43–118) — full enumeration of `--color-*` names mapped to Tailwind utilities. [VERIFIED 2026-05-15]
- `frontend/src/index.css` §`:root` block (lines 125–266) — the fallback / runtime color declarations (`--accent`, `--danger`, `--ok`, `--warn`, `--info`, etc.) and the SLA + chip colors that the @theme block aliases. [VERIFIED 2026-05-15]
- `frontend/src/lib/semantic-colors.ts` (442 lines) — Tailwind-utility maps (`dossierTypeColors`, `statusColors`, `priorityColors`, `graphNodeColors`) — the canonical migration anchor per D-11. [VERIFIED 2026-05-15]
- `.planning/phases/48-lint-config-alignment/48-CONTEXT.md` — D-15 (PR-blocking Lint context), D-16 (smoke-PR proof pattern), D-17 (zero net-new `eslint-disable`). [VERIFIED 2026-05-15]
- `.planning/phases/48-lint-config-alignment/48-03-ci-gate-and-branch-protection-SUMMARY.md` — verbatim recipe for the smoke-PR flow (commands, PR shape, attribution-isolation deviation handling). [VERIFIED 2026-05-15]
- `.planning/phases/50-test-infrastructure-repair/50-CONTEXT.md` — D-13 (two PR-blocking contexts), D-15 (project-local ESLint rule shape). [VERIFIED 2026-05-15]
- `.planning/phases/50-test-infrastructure-repair/50-05-SUMMARY.md` — Phase 50 close-out evidence (smoke PR #11, branch-protection PUT, fixture pattern). [VERIFIED 2026-05-15]
- `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection` (live capture 2026-05-15) — current required-contexts list confirms `Lint` present. [VERIFIED 2026-05-15]
- `CLAUDE.md` §"Visual Design Source of Truth" + §"Design rules — non-negotiable" — project conventions. [VERIFIED 2026-05-15]

### Secondary (MEDIUM confidence)

- `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx` (190 lines) — confirms `lineColor="#3B82F6"` location and that `WorldMap` is React.lazy()'d under Phase 49-02. The CONTEXT.md "territory-map" path is a typo; the actual directory is `geographic-visualization/`. [VERIFIED 2026-05-15]
- `frontend/src/components/position-editor/PositionEditor.tsx` (line range 60–531) — confirms 19 distinct palette-literal sites and their semantic categories. [VERIFIED 2026-05-15]
- Local regex validation script (node REPL on 2026-05-15) — confirms hex and palette regexes' match behavior against 25 test surfaces. [VERIFIED via Bash tool 2026-05-15]
- `rg -c` outputs on frontend/src for hex and palette-literal counts (337 raw hex hits across 63 files; 2,950 palette hits across 331 files). [VERIFIED via Bash tool 2026-05-15]

### Tertiary (LOW confidence)

- Tier-A file-count estimate (80–120 files post-classification) — derived from histogram + heuristic; the actual cut should be re-baselined by the planner. [ASSUMED — recommended re-baseline pre-execute]
- SVG `var()` reference behavior across all current-target browsers — generally supported since 2021 (Chrome/Safari) and 2022 (Firefox), but `dotted-map` pipeline behavior is unverified. [ASSUMED — recommend a 30-min spike before locking the WorldMap recipe]
- Future Tier-C cleanup phase count (2–4 phases for 200–250 files) — derived from CONTEXT.md hints; the actual breakdown is a downstream-roadmap decision. [ASSUMED]

## Metadata

**Confidence breakdown:**

- **Standard stack:** HIGH — every dependency is already in repo; no new install needed.
- **Architecture (rule shape, Tier-B carve-out shape, audit shape):** HIGH — three concrete precedents (Phase 48 D-15 / D-16 / D-17 + Phase 50 D-04 / D-13 / D-15) verified in repo.
- **Pitfalls:** HIGH — five of six pitfalls are direct echoes of Phase 48 deviations (PRs #6 → #7 transition documented in 48-03-SUMMARY); the sixth (template-literal blind spot) is verified via `rg` showing 12 affected files.
- **Token-mapping cookbook:** HIGH for status / link / form-control mappings; MEDIUM for `WorldMap` SVG approach (the `var()` vs. `getComputedStyle` choice needs a 30-min spike at execute time).
- **Tier-A file count estimate:** MEDIUM — based on histogram + heuristic, but actual classification work belongs to the plan, not research.

**Research date:** 2026-05-15
**Valid until:** 30 days (2026-06-14) — refresh if eslint config or branch protection drifts between research and execute time.

## RESEARCH COMPLETE
