# Phase 77: Linear Token System - Research

**Researched:** 2026-07-02
**Domain:** Design-token migration (Linear dark-canonical re-skin of an existing OKLCH/hex token engine on React 19 + Vite + Tailwind v4)
**Confidence:** HIGH (every load-bearing claim verified against the live repo, live CI, or an executed probe in this session)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Default theme (USER DECISION — 2026-07-02)

- **Default `id.theme` = dark (Linear-canonical).** New/unset users first-paint dark, faithful to the milestone's stated dark-canonical direction. Existing users' explicitly-persisted `id.theme` is preserved (only the default for new/unset changes). This resolves the TOKEN-04 open decision.

#### Token sourcing & wiring (TOKEN-01, TOKEN-02)

- Dark + light token sets sourced from the Linear reference values in `.planning/research/STACK.md` **verbatim** (shadcn.io/design/linear) — NOT `frontend/DESIGN.md` (outgoing Bureau spec, rewritten under DOC-01).
- Wire through `directions.ts` / `buildTokens.ts` / `applyTokens.ts`. Zero raw hex / Tailwind color literals in app code (Design Token Check stays green).
- `bootstrap.js` palette/font literals **byte-match** `directions.ts`; a CI guard (FOUC-01, TOKEN-02) fails the build on divergence (byte-match, not just type-check); the two files change in the same commit.

#### Gap-filled palettes (TOKEN-03)

- Derive form-error/warning colors + a 6-value status-tag palette in Linear's dark-surface luminance band; all must pass WCAG AA contrast. Exact values are the planner's/executor's derivation within that band.

#### Direction switcher retirement + legacy migration (TOKEN-04)

- Remove the 4-direction switcher (Bureau/Chancery/Situation/Ministerial) from `tokens/types.ts`, `TweaksDrawer`, `Topbar`, `AppearanceSettingsSection`. Linear is the only selectable direction.
- **Coerce legacy persisted `id.dir`** (every existing user holds one of the four retired directions) to `linear` in BOTH `bootstrap.js` and `DesignProvider` — the old `P.bureau.light` fallback literal vanishes with the old palette map, so without coercion first paint silently loses ALL tokens. This is the load-bearing migration (see [[project_v8_preexec_review_durable_facts]] — bootstrap id.dir coercion trap).

#### Fonts + primitive re-skin (TOKEN-05, TOKEN-06)

- Latin stack: Inter (500/600/700) + JetBrains Mono, self-hosted, mirrored in `bootstrap.js` (Bureau already uses these — verify weights/wiring; add no proprietary Linear fonts). **Preserve the Tajawal Arabic cascade for `dir="rtl"`** (Inter has no Arabic coverage).
- Re-skin `components/ui/*` per Linear's button/card/input recipes: no drop shadows, hairline borders, `surface-1..4` ladder.
- The ~74 color literals in the `components/ui` ESLint carve-out (charts/maps/animated primitives, not caught by the Design Token Check) get an **explicit keep-as-is vs migrate decision per item** — made against the actual code during execution, recorded in the summary.

#### Documentation source-of-truth (DOC-01)

- Update root `/CLAUDE.md` + `frontend/CLAUDE.md` design-system sections off Bureau-canonical; rewrite `frontend/DESIGN.md` as the Linear spec; retire or repoint `frontend/design-system/inteldossier_handoff_design/`. Also fixes the MD-01/LO-02 doc drift carried over from Phase 76 (stale RTLWrapper reference).

### Claude's Discretion

Exact derived color values (within the prescribed Linear band), per-literal keep/migrate calls, CI-guard implementation, and file organization are at the planner/executor's discretion.

### Deferred Ideas (OUT OF SCOPE)

None — the one genuine product decision (default theme) was captured from the user; the rest is prescribed by TOKEN-01..06 / FOUC-01 / DOC-01.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                                 | Research Support                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| TOKEN-01 | Dark (canonical) + light token sets from the Linear reference, wired into `directions.ts`/`buildTokens.ts`/`applyTokens.ts` | §Token engine anatomy, §Linear reference completeness (dark verbatim-complete; light is 4 values + derivation), §Pattern 1                            |
| TOKEN-02 | `bootstrap.js` byte-matches new `directions.ts` literals, enforced by CI guard                                              | §Pattern 2 (guard design), §Three-copy problem (proven live drift in `:root`)                                                                         |
| TOKEN-03 | Form-error/warning + 6-value status-tag palette in Linear's dark-surface band, WCAG AA                                      | §Pattern 4 (culori derivation + verification, measured reference contrasts)                                                                           |
| TOKEN-04 | Retire 4-direction switcher; coerce legacy `id.dir` in bootstrap + DesignProvider; explicit default `id.theme`              | §Pattern 3 (coercion), §Blast radius (19 src + 8 test files enumerated), §Runtime State Inventory                                                     |
| TOKEN-05 | Inter (500/600/700) + JetBrains Mono self-hosted, mirrored in bootstrap; Tajawal RTL cascade preserved                      | §Font findings — **latent bug found**: `'Inter'`/`'JetBrains Mono'` are not registered families; fix = `'Inter Variable'`/`'JetBrains Mono Variable'` |
| TOKEN-06 | `components/ui/*` re-skin per Linear recipes; ~74-literal carve-out gets per-item keep/migrate decision                     | §Carve-out inventory (exactly 74 palette-literal lines across 12 files, per-file table), §Primitive anatomy                                           |
| FOUC-01  | CI script fails the build if `bootstrap.js` and `directions.ts` literals diverge                                            | §Pattern 2 — dependency-free `.mjs` + vm execution + native TS import, verified feasible on Node 22.22/22.23                                          |
| DOC-01   | Design source-of-truth migrated off Bureau (CLAUDE.md ×3, DESIGN.md, handoff dir)                                           | §DOC-01 scope (exact files + the Phase-76 MD-01/LO-02 drift locations)                                                                                |

Gating (owned by Phase 80 but executed pre-swap here): **VERIFY-01** baseline capture — §Visual baseline gate.
</phase_requirements>

## Summary

Phase 77 re-skins an **existing, healthy token engine** — it does not build one. The engine is a pure pipeline: `PALETTES`/`FONTS` literals in `tokens/directions.ts` → `buildTokens.ts` (pure mapper, mode-branching semantics + hue-driven OKLCH accent/SLA families) → `applyTokens.ts` (sole DOM writer) → `:root` CSS custom properties → the Tailwind v4 `@theme` remap in `src/index.css` that keeps ~1,437 utility call sites (`bg-bg`, `text-ink`, `border-line`…) working with **zero churn**. Swapping Bureau for Linear is therefore mostly a literals change in two byte-coupled files (`directions.ts` + `public/bootstrap.js`) plus a third, currently-drifting copy in the `index.css` `:root` fallback block — this session found **live drift** there (`--ink-faint: #9a9082` vs directions.ts `#736b60`; `--accent-fg` likewise), which is direct evidence the manual sync discipline fails and FOUC-01's automated guard is warranted.

Three discoveries change the plan materially. **(1)** The Linear reference (shadcn.io/design/linear/raw) is verbatim-complete for **dark only**; light mode ships just 4 values (`#ffffff`, `#f5f6f6`, `#f6f7f7`, `#000000`) — the light set is a _derivation_ task under dark-canonical discipline, not a transcription. **(2)** The Latin font stack is **broken today**: `@fontsource-variable/inter` registers the family `'Inter Variable'`, but `directions.ts`/`bootstrap.js` reference `'Inter'` — an unregistered name that silently falls through to `system-ui`. TOKEN-05's "verify wiring" resolves as: switch to `'Inter Variable'` / `'JetBrains Mono Variable'` (this is what STACK.md already prescribes). **(3)** The accent family is **hue-parameterized OKLCH** (`oklch(58% 0.14 h)` off a persisted `id.hue` slider), and no hue value reproduces Linear's verbatim `#5e6ad2` (best fit `oklch(56.7% 0.159 275.2)`; the current formula at h=275 yields `#6470cc`). Honoring "verbatim" requires moving the accent family to palette literals, which forces a decision on the hue slider's fate (recommendation in §Open Questions).

The highest-risk change remains the TOKEN-04 legacy coercion: `bootstrap.js:58`'s `(P[d] && P[d][m]) || P.bureau.light` fallback vanishes with the old map, and every existing user's `id.dir` holds a retired direction. The blast radius is 19 source files (not just the 4 named in CONTEXT) plus 113 `.dir-*`/`data-direction` CSS references across 4 stylesheets — all enumerated below. Server-side, `user_preferences.theme` stores legacy direction names but its only consumer hook (`usePreferenceSync`) has **zero importers** (orphaned), so no data migration is required — only the live Zod enums and fallback literals. The pre-swap visual baseline (VERIFY-01 gate) must follow the Phase 46 protocol (seeded staging data + local darwin capture + human review + committed PNGs) because the `Visual Regression (Phase 46)` CI job runs against a deployed URL with stale secrets and is red on main (verified: 3 consecutive `E2E Tests` failures).

**Primary recommendation:** Execute as literals-swap + coercion + guard, in this order: (1) capture pre-swap baselines (gate), (2) land the FOUC parity guard against the _current_ Bureau values to prove it works, (3) swap `directions.ts`+`bootstrap.js`+`:root` in one commit with the coercion, (4) retire the switcher surfaces, (5) re-skin/decide carve-outs, (6) rewrite docs.

## Architectural Responsibility Map

| Capability                            | Primary Tier                         | Secondary Tier    | Rationale                                                                                                                 |
| ------------------------------------- | ------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| First-paint token painting (FOUC)     | Browser (blocking inline script)     | —                 | `public/bootstrap.js` runs `<script blocking="render">` before any stylesheet parses; must stay ES5-safe, dependency-free |
| Runtime token state + persistence     | Browser / Client (React)             | —                 | `DesignProvider` owns direction/mode/hue/density, persists to localStorage `id.*` keys                                    |
| Token math (palette → CSS vars)       | Browser / Client (pure module)       | —                 | `buildTokens.ts` is pure/deterministic; SSR-safe; unit-testable                                                           |
| Tailwind utility exposure             | Build (CSS)                          | —                 | `@theme` block in `src/index.css` maps `--color-*` → runtime `var(--*)`                                                   |
| Byte-match CI guard                   | CI (Node script)                     | Local `pnpm lint` | Mirror of `scripts/check-duplicate-rtl.mjs` precedent; runs in the `Lint` job of `ci.yml`                                 |
| WCAG contrast derivation/verification | Dev-time script/test                 | —                 | `culori@4.0.2` already a devDependency; derivation is a one-time computation, verification a committed test               |
| Visual baseline capture               | Seeded dev machine (darwin)          | CI replay         | Phase 46 precedent; CI `Visual Regression` job is red (stale-secret class, issue #31)                                     |
| Legacy preference migration           | Browser (bootstrap + DesignProvider) | —                 | Coercion at read-time in both first-paint and React layers; no server migration needed (sync hook orphaned)               |
| Docs source-of-truth                  | Repo docs                            | —                 | CLAUDE.md ×3, DESIGN.md, handoff dir                                                                                      |

## Standard Stack

No new runtime or dev packages are required. Everything needed is already installed and verified in this session.

### Core (all already installed — verified against `frontend/package.json` + `node_modules`)

| Library                                           | Version               | Purpose                                          | Why Standard                                                                                                                       |
| ------------------------------------------------- | --------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `tailwindcss` + `@tailwindcss/vite`               | 4.3.0                 | `@theme` token exposure                          | Already the token → utility bridge; untouched by this phase [VERIFIED: repo]                                                       |
| `@fontsource-variable/inter`                      | ^5.2.8                | Linear body/display analog                       | Already installed; registers family **`'Inter Variable'`** (verified in `node_modules/.../wght.css`) [VERIFIED: repo]              |
| `@fontsource-variable/jetbrains-mono`             | ^5.2.8                | Linear mono analog                               | Registers **`'JetBrains Mono Variable'`** [VERIFIED: repo]                                                                         |
| `@fontsource/tajawal`                             | ^5.2.7                | Arabic RTL cascade (400/500/700)                 | Registers plain `'Tajawal'`; cascade rules live at `index.css:434-460` [VERIFIED: repo]                                            |
| `culori`                                          | 4.0.2 (devDependency) | OKLCH conversion + `wcagContrast()` for TOKEN-03 | Already installed; probe executed successfully this session [VERIFIED: executed]                                                   |
| `vitest` + existing `tests/bootstrap/` vm harness | repo-pinned           | Bootstrap behavioral tests (coercion)            | `tests/bootstrap/migrator.test.ts` already executes `bootstrap.js` in `node:vm` + JSDOM with stubbed localStorage [VERIFIED: repo] |
| `@playwright/test`                                | repo-pinned           | Visual baseline capture/replay                   | 12 live `*-visual.spec.ts` + 51 committed `-chromium-darwin` PNGs [VERIFIED: repo]                                                 |

### Node capability check (for the FOUC guard)

`node --version` local = **v22.23.1**; CI `ci.yml` pins `NODE_VERSION: '22.22.0'`. Native TypeScript type-stripping (unflagged since Node 22.18) was **probe-verified this session**: `import('./frontend/src/design-system/tokens/directions.ts')` and `densities.ts` resolve and return live `PALETTES`/`FONTS`/`DENSITIES` objects under plain `node` (their only imports are `import type`, which erases). `buildTokens.ts` does NOT import natively (extensionless `'./densities'` specifier) — the guard should import the two **data modules** directly, not `buildTokens`. [VERIFIED: executed probe]

### Alternatives Considered

| Instead of                              | Could Use                                                                                                 | Tradeoff                                                                                                                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Native TS import in the guard script    | Regex/brace-walk extraction of `PALETTES` from TS source (precedent: `scripts/check-i18n-namespaces.mjs`) | Regex parsing is format-brittle; native import compares real exported values. Keep regex as the documented fallback if Node's type-stripping ever regresses                                                        |
| Standalone `.mjs` guard in the Lint job | Vitest test in `tests/bootstrap/` comparing vm-applied vars to `buildTokens` output                       | A vitest test is also byte-exact and uses the existing harness, but the requirement + repo precedent (check-duplicate-rtl) want a standalone CI script; do BOTH — script as the gate, vitest for coercion behavior |
| `culori` for contrast                   | Hand-rolled WCAG relative-luminance math                                                                  | culori is already installed and its `wcagContrast()` was verified; no reason to hand-roll                                                                                                                          |

**Installation:** none.

## Package Legitimacy Audit

No new packages are installed by this phase. All tooling (culori, vitest, playwright, @fontsource-\*) is pre-existing in the lockfile. **Packages removed due to slopcheck [SLOP] verdict:** none. **Packages flagged [SUS]:** none. (Slopcheck not run — nothing to check.)

## The Linear reference — completeness audit

Fetched live this session from `https://www.shadcn.io/design/linear/raw` [CITED: shadcn.io/design/linear/raw]. This **supersets** the STACK.md excerpt — STACK.md's block is confirmed accurate but omits several dark values and understates the light-mode gap:

**Dark (complete, verbatim-usable):**

| Token             | Value     | Maps to (current engine name)          |
| ----------------- | --------- | -------------------------------------- |
| canvas            | `#010102` | `--bg`                                 |
| surface-1         | `#0f1011` | `--surface`                            |
| surface-2         | `#141516` | `--surface-raised`                     |
| surface-3         | `#18191a` | **new tier** (drawers/popovers)        |
| surface-4         | `#191a1b` | **new tier**                           |
| ink               | `#f7f8f8` | `--ink`                                |
| ink-muted         | `#d0d6e0` | `--ink-mute`                           |
| ink-subtle        | `#8a8f98` | `--ink-faint`                          |
| ink-tertiary      | `#62666d` | **new tier** (faintest)                |
| hairline          | `#23252a` | `--line`                               |
| hairline-strong   | `#34343a` | `--line-soft`\*                        |
| hairline-tertiary | `#3e3e44` | **new tier**                           |
| primary           | `#5e6ad2` | `--accent`                             |
| primary-hover     | `#828fff` | **new** (hover state)                  |
| primary-focus     | `#5e69d1` | `--accent-soft` (per STACK.md mapping) |
| on-primary        | `#ffffff` | `--accent-fg`                          |
| semantic-success  | `#27a644` | `--ok`                                 |
| semantic-overlay  | `#000000` | (scrim)                                |
| brand-secure      | `#7a7fad` | (optional)                             |

\* Naming caution: in the Bureau engine `--line-soft` is _lighter/softer_ than `--line`; Linear's `hairline-strong` is _stronger_. The planner must fix the semantic mapping direction once (STACK.md maps `--line-soft: #34343a` = hairline-strong) and keep it consistent across all three literal copies.

**Light (incomplete — 4 values only):** `inverse-canvas #ffffff`, `inverse-surface-1 #f5f6f6`, `inverse-surface-2 #f6f7f7`, `inverse-ink #000000`. Everything else in the light set (muted/subtle ink tiers, hairlines, soft accents, semantic soft washes) **must be derived**, consistent with the CONTEXT "dark is canonical: derive dark first, then light as the secondary set." Derived light values are Claude's-discretion territory but must pass the same WCAG AA verification as TOKEN-03 colors.

**Type/radius/spacing:** weights 400/500/600 (Linear uses these; TOKEN-05 says 500/600/700 — the variable-axis `wght.css` covers all, no conflict); radius ladder `4/6/8/12/16/24/9999` — STACK.md prescribes `--radius-sm/--radius/--radius-lg` = `6/8/12` with the fuller ladder pulled in only where needed. Fonts "Linear Display/Text/Mono" are proprietary → Inter/JetBrains analogs per locked decision.

**No error/warning hex exists in the reference in either mode** — confirms TOKEN-03 is a real derivation gap, not a transcription miss.

## Token engine anatomy (what actually changes)

### The pipeline (verified by reading every file)

```
localStorage (id.dir/id.theme/id.hue/id.density/id.classif/id.locale)
        │
        ├─► public/bootstrap.js  (ES5, <script blocking="render">)     ── first paint
        │      P table (palettes) ─ byte-couples ─► tokens/directions.ts PALETTES
        │      F table (fonts)    ─ byte-couples ─► tokens/directions.ts FONTS
        │      D table (density)  ─ byte-couples ─► tokens/densities.ts DENSITIES
        │      writes ~40 vars via r.style.setProperty + .dark class + dir-* class
        │
        └─► DesignProvider.tsx (React mount)                            ── steady state
               ├─ lazy-init state from localStorage (guards: isDirection/isMode/…)
               ├─ buildTokens({direction,mode,hue,density})  ← pure, tests exist
               │     (tests/unit/design-system/buildTokens.test.ts)
               └─ applyTokens(tokens) → :root  + .dark + data-direction/.dir-* classes
                       │
                       ▼
        src/index.css @theme  (--color-bg: var(--bg), … + legacy remap)
                       │  1,437 call sites: bg-bg / text-ink / border-line / bg-accent …
                       ▼
        src/index.css :root  ← THIRD literal copy (defense-in-depth fallback,
                                Bureau-light, ALREADY DRIFTED — see Pitfall 2)
```

### What "slot the Linear values in" concretely means

1. **`tokens/types.ts`** — `Direction` union `'chancery'|'situation'|'ministerial'|'bureau'` → `'linear'`. `DirectionModePalette` gains fields for the new tiers the recipes need (`surface3`, `surface4`, optionally `inkTertiary`, `lineStrong`, plus accent-family literals per §Open Questions Q1). Sidebar fields (`sidebar`, `sidebarInk`) stay — the shell consumes `--sidebar-bg/--sidebar-ink`.
2. **`tokens/directions.ts`** — `PALETTES` collapses to `{ linear: { dark: {…verbatim…}, light: {…4 verbatim + derived…} } }`; `FONTS` to `{ linear: { display/body: "'Inter Variable', system-ui, sans-serif", mono: "'JetBrains Mono Variable', ui-monospace, monospace" } }` (exact strings must byte-match bootstrap's F table). Radius `6px/8px/12px`.
3. **`tokens/buildTokens.ts`** — palette lookup unchanged; emit the new tier vars (`--surface-3`, `--surface-4`, …); accent family per Q1 decision; TOKEN-03 derived `--danger/--warn/--ok` families move from hue-locked OKLCH mode-branches to the Linear-band derived values (dark + light branches).
4. **`tokens/densities.ts`** — unchanged (density is orthogonal to Linear; verified bootstrap D table currently byte-matches it).
5. **`public/bootstrap.js`** — P/F tables rewritten to linear-only; fallback + coercion per Pattern 3; default mode `'dark'`; keep ES5 (no arrows/const/template literals — stated invariant at the top of the file).
6. **`src/index.css`** — `:root` fallback block rewritten to Linear-dark literals (new default); `@theme` gains `--color-surface-3/4` (+ any new semantic names); the `.btn-primary`/`.btn-ghost`/`.card`/`.id-input` recipes and the `html[dir='rtl']` Tajawal cascade (lines ~434-460) update family names `'Inter'` → `'Inter Variable'`.
7. **`src/fonts.ts`** — remove now-dead imports (Fraunces, Public Sans, Space Grotesk, IBM Plex Sans ×4, IBM Plex Mono ×2 — all were per-direction fonts of retired directions). Keep Inter/JetBrains variable + Tajawal 400/500/700. This is a bundle-size win and `Bundle Size Check` is a required CI gate — re-verify `pnpm exec size-limit` locally after the swap [VERIFIED: repo memory + `.size-limit.json` gate].
8. **`App.tsx`** — `initialDirection="linear"`, `initialMode="dark"`, `initialHue` per Q1, `fallbackDirection="linear"` (ThemeErrorBoundary prop).

## Blast radius — every file that references a retired direction

Verified by grep this session (excludes `.understand-anything`):

**Source (19):**

| File                                                          | What references                                                                        | Action class                                                               |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `design-system/tokens/types.ts`                               | `Direction` union                                                                      | Collapse to `'linear'`                                                     |
| `design-system/tokens/directions.ts`                          | `PALETTES`/`FONTS` 4-direction maps                                                    | Replace with linear                                                        |
| `design-system/tokens/buildTokens.ts`                         | palette lookup + semantics                                                             | Extend/re-derive                                                           |
| `design-system/DesignProvider.tsx`                            | `isDirection` guard, defaults                                                          | Guard → `'linear'` + coercion + write-back                                 |
| `design-system/directionDefaults.ts`                          | `DIRECTION_DEFAULTS` 4 entries                                                         | Collapse (or delete with the D-16 click-reset behavior — switcher is gone) |
| `public/bootstrap.js`                                         | P/F tables, `\|\| 'bureau'` default, `P.bureau.light` fallback, `dir-*` classes        | Rewrite + coerce                                                           |
| `App.tsx`                                                     | `initialDirection="bureau"`, `fallbackDirection="bureau"`, `initialMode`, `initialHue` | New defaults                                                               |
| `components/tweaks/TweaksDrawer.tsx`                          | `DIRECTIONS` 4-array + direction buttons + hue presets                                 | Remove direction section (hue per Q1)                                      |
| `components/layout/Topbar.tsx`                                | `DIRECTIONS` 4-array segmented radio (lines 48, 141-167)                               | Remove switcher block                                                      |
| `components/settings/sections/AppearanceSettingsSection.tsx`  | direction radio group + hue slider                                                     | Remove direction control (hue per Q1)                                      |
| `pages/settings/SettingsPage.tsx:54`                          | `z.enum(['chancery','situation','ministerial','bureau'])`                              | → `z.literal('linear')` or drop field                                      |
| `types/settings.types.ts:83,196`                              | same Zod enum + default `'chancery'`                                                   | Same                                                                       |
| `components/theme-error-boundary/ThemeErrorBoundary.tsx:6,41` | `fallbackDirection` union + default `'chancery'`                                       | → `'linear'`                                                               |
| `components/layout/ClassificationBar.tsx:98-124`              | `switch(direction)` banner variants                                                    | Keep the bureau/ministerial `.cls-chip` branch as the linear variant       |
| `components/layout/AppShell.tsx`                              | comments only                                                                          | Doc touch-up                                                               |
| `pages/Dashboard/widgets/WidgetCard.tsx`, `WidgetHeader.tsx`  | comments referencing `.dir-bureau` CSS                                                 | Follow the CSS rename                                                      |
| `utils/storage/preference-storage.ts`                         | comments                                                                               | Doc touch-up                                                               |
| `services/preference-sync.ts:75`                              | `theme: preferences.theme \|\| 'chancery'` fallback                                    | → `'linear'` (hook is orphaned — see Runtime State Inventory)              |

**`engagement.types.ts` is a FALSE POSITIVE** — its `'ministerial'` (lines 62, 490) is an _engagement-level_ domain enum, unrelated to design directions. A blind grep-replace would corrupt the engagement domain. See Pitfall 3.

**Tests (8):** `Topbar.test.tsx`, `AppShell.test.tsx`, `AppShell.a11y.test.tsx`, `ClassificationBar.test.tsx`, `TweaksDrawer.test.tsx`, `directionDefaults.test.ts`, `i18n/label-parity.test.ts`, `tests/unit/design-system/buildTokens.test.ts`, plus `tests/bootstrap/migrator.test.ts` (harness reused, assertions extended).

**CSS (113 references across 4 files):** `.dir-bureau`/`.dir-chancery`/`.dir-situation`/`.dir-ministerial`/`data-direction` selectors — `styles/list-pages.css` (76), `pages/Dashboard/widgets/dashboard.css` (30), `index.css` (6, including the load-bearing `html[dir='rtl'] .dir-bureau` Tajawal-button override at :459 and :492), `components/calendar/calendar.css` (1). Strategy decision for the planner: since only one direction remains, either (a) rename `.dir-bureau` selectors to `.dir-linear` and delete the chancery/situation/ministerial rule blocks, or (b) flatten direction-scoped rules into unscoped ones and stop emitting `dir-*` classes entirely. **(a) is the lower-risk, mechanical option** and keeps the `data-direction`/class mechanism (which bootstrap + DesignProvider already emit); (b) is cleaner but touches selector specificity ordering — the `html[dir='rtl'] .dir-bureau .btn-*` !important Tajawal rules were specifically placed to win specificity battles ([VERIFIED: repo memory project_tailwindv4_translate_property_and_rtl_btn_font]).

**i18n:** direction labels live in `src/i18n/{en,ar}/common.json` (`shell.direction.*`, `tweaks.*` direction entries) and `{en,ar}/settings.json` (`appearance.direction.*`) — 4 files. `label-parity.test.ts` asserts EN/AR parity over these keys.

## Architecture Patterns

### Pattern 1: Literal swap discipline (TOKEN-01/02)

**What:** All three literal copies change in ONE commit: `tokens/directions.ts`, `public/bootstrap.js`, `index.css :root` block. The `@theme` block stays var-indirected (no literals) — zero churn at utility call sites.
**When to use:** Every palette/font/radius value change, forever (this is the v6.0 invariant, now CI-enforced).

### Pattern 2: FOUC byte-match CI guard (FOUC-01) — prescriptive design

Mirror the `check-duplicate-rtl.mjs` + `ci.yml` precedent exactly (dependency-free `scripts/*.mjs`, wired into the `Lint` job + `pnpm lint` chain, with a positive-failure fixture step):

```
scripts/check-bootstrap-parity.mjs        (node:fs, node:vm, node:path only)
tools/bootstrap-fixtures/bad-bootstrap.js (one literal deliberately diverged)
```

**Mechanism (all probe-verified this session):**

1. **Truth side:** `await import('<repo>/frontend/src/design-system/tokens/directions.ts')` and `densities.ts` — Node ≥22.18 native type stripping resolves these (their only imports are `import type`, which erase). CI pins Node 22.22.0 ✓, local 22.23.1 ✓. Do NOT import `buildTokens.ts` (extensionless `'./densities'` specifier fails native resolution — verified).
2. **Bootstrap side:** execute `public/bootstrap.js` (or the CLI-arg fixture path) in `node:vm` with a stubbed `localStorage` + minimal `document` stub whose `documentElement.style.setProperty` collects into a `Map` (also stub `classList` {toggle,add,remove}, `setAttribute`, `dataset`, `lang`, `dir` — the exact surface `tests/bootstrap/migrator.test.ts` already stubs via JSDOM; a hand stub avoids the jsdom dependency at script level).
3. **Compare:** for each `{mode: dark,light} × {density: comfortable,compact,dense}` run with `id.dir='linear'`, assert collected `--bg/--surface/--surface-raised/--ink/--ink-mute/--ink-faint/--line/--line-soft/--sidebar-bg/--sidebar-ink/--radius-*/--font-*/--pad*/--gap/--row-h` (+ new tier vars) `===` the imported palette/font/density strings. String `===` IS the byte-match. Divergence → list offenders → `process.exit(1)`.
4. **Coercion probe (TOKEN-04 regression):** one extra run with `id.dir='bureau'` asserting the linear palette still lands (guards the fallback path forever).
5. **Wiring:** `frontend/package.json` `lint` script gains `&& node scripts/check-bootstrap-parity.mjs`; `ci.yml` Lint job gains the run step + `! node scripts/check-bootstrap-parity.mjs tools/bootstrap-fixtures/bad-bootstrap.js` positive-failure step (exact `check-duplicate-rtl` shape at `ci.yml:76-82`).
6. **Recommended extension (cheap, justified by proven drift):** also regex-extract the `:root` literal block from `index.css` and compare the palette-token subset against linear-dark values. Requirement text only binds bootstrap↔directions, so mark this step advisory-or-included at planner's discretion — but the drift found this session (`--ink-faint`, `--accent-fg`) argues for included.

**Anti-pattern:** comparing file bytes or ASTs of the two files — they are structurally different (TS nested objects vs ES5 tables with different key names `rSm/r/rLg`). Compare _painted values against exported values_.

### Pattern 3: Legacy `id.dir` coercion (TOKEN-04) — the load-bearing migration

**bootstrap.js** (ES5-safe, first paint):

```js
// Source: designed against verified current bootstrap.js:9,58
var d = localStorage.getItem('id.dir');
if (d !== 'linear') {
  d = 'linear';
  try { localStorage.setItem('id.dir', 'linear'); } catch (eDir) { /* read-only storage */ }
}
var m = localStorage.getItem('id.theme') || 'dark';   // dark-canonical default (USER DECISION)
if (m !== 'light' && m !== 'dark') m = 'dark';
...
var p = (P.linear && P.linear[m]) || P.linear.dark;   // fallback now inside the new map
```

**DesignProvider.tsx** (React layer — must not rely on bootstrap having run; storage may have been written by an old tab):

```ts
// isDirection collapses to: value === 'linear'
const [direction] = useState<Direction>(() => 'linear') // single-direction: state can be constant
// One-time write-back effect (mirrors the existing 'spacious'→'dense' WR-10 pattern:
// NO localStorage writes in lazy initializers — StrictMode double-invokes them):
useEffect(() => {
  if (safeGetItem(LS_DIR) !== 'linear') safeSetItem(LS_DIR, 'linear')
}, [])
```

Mode default: `initialMode` prop default flips `'light'` → `'dark'` AND `App.tsx` passes `initialMode="dark"`. Users with an explicitly persisted `id.theme` keep it (the lazy initializer already prefers the stored value — verified `DesignProvider.tsx:166-169`). The cross-tab `storage` listener's `isDirection` guard naturally ignores legacy values.

**Why write-back matters:** without it, every load re-runs the coercion forever and any code that reads `id.dir` raw (tests, future features) sees a retired value. The WR-10 comment in DesignProvider documents the established idempotent-write-back-in-effect pattern to copy.

### Pattern 4: TOKEN-03 derivation + verification with culori

```js
// Source: probe executed this session with culori@4.0.2 (already a devDependency)
import { oklch, formatHex, wcagContrast } from 'culori'
// Linear accent anchor: #5e6ad2 = oklch(0.5674 0.1585 275.2)  [measured]
// Reference contrasts measured on the verbatim dark set:
//   ink #f7f8f8 on canvas #010102        → 19.61:1
//   ink-subtle #8a8f98 on surface-1      →  5.86:1
//   semantic-success #27a644 on surface-1 →  6.01:1
//   on-primary #ffffff on primary #5e6ad2 →  4.70:1  (AA normal-text ✓)
```

**Approach:** pick error/warning hues in OKLCH (error ≈ h 25-30, warning ≈ h 75-85), set L/C so `wcagContrast(fg, '#0f1011') >= 4.5` (text usage) — the success anchor `#27a644` at 6.0:1 defines the band's feel. The 6-value status-tag palette: 6 hues at matched L/C in the same band, each with a `-soft` wash derived against the surface ladder, each verified ≥4.5:1 (tag text) or ≥3:1 (large/graphical, only if the tag renders ≥18.66px bold — safer to hold everything to 4.5). **Commit the verification as a vitest unit test** (`expect(wcagContrast(...)).toBeGreaterThanOrEqual(4.5)`) so the values can't drift below AA silently — same pattern as the existing WCAG-bump comments in `buildTokens.ts` (Plans 40-15/41-09/42-11) but automated. Light-mode derived counterparts verified against `#ffffff`/`#f5f6f6`.

### Pattern 5: Visual baseline gate (VERIFY-01 pre-swap moment)

**Current state (verified):** 12 live specs in `tests/e2e/*-visual.spec.ts`, 51 committed PNGs, all `-chromium-darwin` (captured on macOS). Matrix: 12 list/detail pages × EN+AR (light only), kanban + tasks-tab × ltr/rtl × 1280/768, dossier-drawer × ar/ltr, 8 dashboard-widget shots, settings ×3, plus **8 direction×mode "focused-primitive" shots (bureau/chancery/situation/ministerial × light/dark) that become structurally obsolete** — that spec must be rewritten linear-only (dark+light = 2 shots) as part of capture. `tests/visual/theme-visual.spec.ts` references dead `gastat`/`blue-sky` themes — it is stale legacy, not part of the live baseline; ignore or delete.

**CI reality:** the `Visual Regression (Phase 46)` job (`e2e.yml:96`, macos-latest) runs against `E2E_BASE_URL` secrets (deployed app) and the `E2E Tests` workflow is red on main — verified `gh run list`: 3 consecutive failures (issue #31 stale-secret class). **Do not gate on CI going green.**

**Recommended protocol (Phase 46 precedent, from `46-01`/`46-04` SUMMARYs):**

1. Refresh the deterministic staging seed rows (`b0000002-*` engagement_dossiers dates → today-relative) via Supabase MCP so widgets render non-empty.
2. Local capture: no `E2E_BASE_URL` → `playwright.config.ts` auto-starts `pnpm dev` (verified line 137); run `pnpm -C frontend exec playwright test <the 12 visual specs> --update-snapshots` on the dev Mac.
3. Non-empty readiness checks already exist in the specs (skeleton-wait fixes from 46-04).
4. Human review of every PNG (the Phase 46 deliverable shape: a VALIDATION log), then commit.
5. **Order gate:** this capture commit must land BEFORE any `directions.ts` literal change (no baseline laundering). Re-comparison is Phase 80's job — do not design it here.
6. **Forward-compat requirement for Phase 80:** specs must pin `{theme, locale}` explicitly (e.g., seed `localStorage.id.theme` in the spec setup) rather than relying on the app default — after this phase the default flips light→dark, and any baseline that depended on "default" would diff apples-to-oranges in Phase 80. Verify each of the 12 specs pins its state; fix the ones that don't as part of the capture plan.

### Anti-Patterns to Avoid

- **Parallel token system** — never add a second engine or put Linear hex in `@theme`/components; hex lives only in `directions.ts` + `bootstrap.js` (+ `:root` fallback) [locked by STACK.md + ESLint].
- **Blind grep-replace of direction names** — corrupts `engagement.types.ts` (`'ministerial'` engagement level) and i18n keys for unrelated domains.
- **Retrofitting bootstrap with modern JS** — the file's stated invariant is ES5-safe (no arrows/const/template literals); the coercion must follow.
- **Capturing baselines after the swap** — defeats VERIFY-01 entirely.
- **Renaming `--line-soft` semantics silently** — decide the hairline-strong mapping once, document it in the rewritten DESIGN.md.

## Don't Hand-Roll

| Problem                               | Don't Build               | Use Instead                                                                                 | Why                                                  |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| WCAG contrast math                    | luminance formula by hand | `culori` `wcagContrast()` (installed, verified)                                             | edge cases (sRGB linearization) already solved       |
| Bootstrap execution harness for tests | ad-hoc eval               | `tests/bootstrap/migrator.test.ts` vm+JSDOM pattern                                         | already stubs the exact DOM/localStorage surface     |
| TS parsing in the CI guard            | regex AST                 | native `import()` of the data modules (Node ≥22.18, probe-verified)                         | compares real exported values, immune to formatting  |
| CI guard scaffolding                  | new job shape             | `check-duplicate-rtl.mjs` + `ci.yml:76-82` shape + `tools/*-fixtures` positive-failure step | established, reviewed precedent                      |
| Visual capture protocol               | new tooling               | Phase 46 protocol + existing 12 specs                                                       | seeds, readiness checks, human-review flow all exist |
| Font self-hosting                     | `@font-face` by hand      | existing `@fontsource-*` imports in `src/fonts.ts`                                          | subsetting/unicode-range handled by fontsource       |

**Key insight:** every mechanism this phase needs already exists in the repo — the work is literals, coercion, deletion, and wiring, not construction.

## Runtime State Inventory

Rename/migration phase — all five categories answered explicitly:

| Category             | Items Found                                                                                                                                                                                                                                                                                    | Action Required                                                                                                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stored data (server) | `user_preferences.theme` column holds legacy direction names (and pre-Phase-33 names like `canvas`/`azure`) per `preference-sync.ts` comments. **BUT `usePreferenceSync` has zero importers** (grep-verified — only its own file) — the sync path is orphaned code.                            | Code edit only: update the fallback literal (`'chancery'` → `'linear'`) and the Zod enums (`settings.types.ts:83,196`, `SettingsPage.tsx:54`). **No data migration** — rows are never read by live code. Optionally note a follow-up to either wire or remove the orphan (out of scope). |
| Stored data (client) | `localStorage`: `id.dir` (100% of existing users hold a retired value), `id.theme` (persisted only if user explicitly toggled), `id.hue` (persisted `32` or a preset for users who touched the slider — see Q1), `user-preferences` JSON blob (theme field, read by orphaned merge path only). | `id.dir`: coerce + write-back in bootstrap AND DesignProvider (Pattern 3). `id.theme`: preserve if valid; default `dark` when unset. `id.hue`: per Q1 decision — recommend ignore/stop-reading + one-time removal alongside the coercion write-back.                                     |
| Live service config  | None — no external service (Doppler/CI secret/dashboard) references direction names. CI secrets referenced by the visual job are URL/credentials only. Verified by grep over `.github/workflows/*`.                                                                                            | None.                                                                                                                                                                                                                                                                                    |
| OS-registered state  | None — verified: no launchd/cron/Task-Scheduler style registration references directions.                                                                                                                                                                                                      | None.                                                                                                                                                                                                                                                                                    |
| Secrets/env vars     | None — no env var carries a direction name (grep over `.env*` examples + workflows).                                                                                                                                                                                                           | None.                                                                                                                                                                                                                                                                                    |
| Build artifacts      | Committed Playwright snapshot PNGs named `bureau-*/chancery-*/situation-*/ministerial-*-focused-primitive-*` (8 files) embed direction names and become obsolete.                                                                                                                              | Regenerated/renamed during the VERIFY-01 capture (the direction-matrix spec is rewritten linear-only).                                                                                                                                                                                   |

## Common Pitfalls

### Pitfall 1: The bootstrap fallback vanishes with the old map (the headline risk)

**What goes wrong:** `bootstrap.js:58` — `var p = (P[d] && P[d][m]) || P.bureau.light;`. Swap P to `{linear:…}` without coercion and every existing user (`id.dir='bureau'` etc.) gets `P[d]` undefined → `P.bureau.light` undefined → TypeError inside the try/catch → **silently zero tokens at first paint**, falling to the `:root` static block (which would then be the only thing standing — another reason to update it in the same commit).
**How to avoid:** Pattern 3 coercion in BOTH files, same commit; the guard's `id.dir='bureau'` probe run makes regression build-breaking.
**Warning signs:** flash of unstyled/wrong-palette content on a profile with legacy localStorage; test by seeding `id.dir='bureau'` in a vm-harness test.

### Pitfall 2: Three literal copies, and the third has ALREADY drifted

**What goes wrong:** `index.css :root` fallback block (defense-in-depth for blocked localStorage) currently holds `--ink-faint: #9a9082` vs directions.ts `#736b60` (Phase 42-11 WCAG bump never propagated) and `--accent-fg: oklch(99% 0.01 32)` vs buildTokens `oklch(100% 0 0)` — **live drift found this session**.
**Why it happens:** the byte-match discipline was doc-enforced only, and docs said "bootstrap ↔ directions.ts", omitting `:root`.
**How to avoid:** rewrite `:root` to Linear-dark in the swap commit; extend the parity guard to cover it (Pattern 2 step 6).

### Pitfall 3: Grep-replace corrupts unrelated domains

**What goes wrong:** `engagement.types.ts` defines `'ministerial'` as an engagement level (with AR translation); i18n JSONs contain unrelated `direction` keys (`calendar-sync`, `citations` use "direction" for sort/text direction).
**How to avoid:** change-by-enumerated-file (the Blast Radius table), never repo-wide sed.

### Pitfall 4: `'Inter'` is not a registered font family

**What goes wrong:** assuming Bureau's `'Inter', system-ui` renders Inter. Verified: `@fontsource-variable/inter/wght.css` registers **`'Inter Variable'`** only; no `@font-face` anywhere in `src/` registers `'Inter'`. Today's Latin UI actually renders `system-ui` (visually close on macOS — that's why nobody noticed). Copying `'Inter'` into the Linear FONTS entry would perpetuate the bug and TOKEN-05 would fail honest verification.
**How to avoid:** `'Inter Variable'` / `'JetBrains Mono Variable'` in FONTS + bootstrap F + the `index.css` RTL cascade lines (439/442 list `'Tajawal', 'Inter', …`). Verify with DevTools rendered-fonts panel or a Playwright `document.fonts.check("16px 'Inter Variable'")` probe.

### Pitfall 5: Persisted `id.hue` fights the verbatim accent

**What goes wrong:** users who touched the hue slider have `id.hue` ≠ Linear's hue; if accent stays hue-driven, their accent won't be Linear lavender; if accent becomes a literal but SLA stays hue-driven, their SLA family sits outside the Linear band.
**How to avoid:** resolve Q1 explicitly in the plan; whatever the decision, add `id.hue` handling to the coercion (ignore, clamp, or remove).

### Pitfall 6: Visual specs that rely on the default theme break the Phase-80 re-compare

**What goes wrong:** baselines captured under default-light; after the swap the default is dark; Phase 80's re-compare diffs light-vs-dark and produces 100% noise.
**How to avoid:** capture plan pins `{theme, locale}` per spec (seed `id.theme` in spec setup) — audit all 12 specs during the capture plan.

### Pitfall 7: ES5 bootstrap discipline

**What goes wrong:** coercion written with `const`/arrow syntax breaks old-browser first paint silently (and violates the file's stated invariant).
**How to avoid:** ES5 only in bootstrap.js; the vm-harness tests execute the real file, catching syntax accidents.

### Pitfall 8: Density/`.dark`/`data-direction` side contracts

**What goes wrong:** HeroUI v3 keys off the `.dark` class (DesignProvider effect, `bootstrap.js:51`); handoff CSS keys off `.dir-*` classes; deleting the class emission while CSS still expects it silently disables 113 rules.
**How to avoid:** pick CSS strategy (a) rename-to-`.dir-linear` (recommended) and keep emitting; grep-verify zero `.dir-{retired}` selectors remain.

## Code Examples

Verified patterns from this repo (authoritative precedents to copy):

### Executing bootstrap.js against stubbed storage (for coercion tests)

```ts
// Source: frontend/tests/bootstrap/migrator.test.ts (existing)
const ctx = createContext({
  localStorage: stubbedLocalStorage,
  document: dom.window.document,
  parseInt,
  isNaN,
})
new Script(readFileSync(BOOTSTRAP_PATH, 'utf8')).runInContext(ctx)
// assert: dom.window.document.documentElement.style.getPropertyValue('--bg') === PALETTES.linear.dark.bg
```

### CI guard wiring shape

```yaml
# Source: .github/workflows/ci.yml:76-82 (existing check-duplicate-rtl precedent)
- name: Check bootstrap token parity
  run: node scripts/check-bootstrap-parity.mjs
- name: Assert parity check fails on bad fixture (positive-failure)
  shell: bash
  run: |
    set -e
    ! node scripts/check-bootstrap-parity.mjs tools/bootstrap-fixtures/bad-bootstrap.js
```

### Native TS data import from a plain .mjs script

```js
// Probe-verified this session on Node 22.23.1 (CI: 22.22.0; works ≥22.18)
const { PALETTES, FONTS } = await import(
  pathToFileURL(resolve(repoRoot, 'frontend/src/design-system/tokens/directions.ts')).href
)
const { DENSITIES } = await import(
  pathToFileURL(resolve(repoRoot, 'frontend/src/design-system/tokens/densities.ts')).href
)
// NOTE: buildTokens.ts does NOT import natively (extensionless './densities' specifier) — don't import it here.
```

### WCAG verification test shape (TOKEN-03)

```ts
// culori@4.0.2 devDependency — probe-verified
import { wcagContrast } from 'culori'
expect(wcagContrast(TOKENS_DARK['--danger'], PALETTES.linear.dark.surface)).toBeGreaterThanOrEqual(
  4.5,
)
```

## TOKEN-06 carve-out inventory (counted this session)

The "~74" is exact: **74 Tailwind-palette-literal lines** across 12 files in `components/ui/**` (the ESLint block at `eslint.config.mjs:236-241` disables `no-restricted-syntax` for the whole directory), plus **20 raw-hex occurrences** in 4 files. Per-file, with the Phase-75 audit verdict attached:

| File                                | Palette-literal lines | Hex | Phase-75 status   | Recommended framework bucket                                                           |
| ----------------------------------- | --------------------- | --- | ----------------- | -------------------------------------------------------------------------------------- |
| `file-upload.tsx`                   | 15                    | —   | live              | **migrate** (UI chrome: status colors → semantic tokens)                               |
| `enhanced-progress.tsx`             | 9                     | —   | live              | **migrate**                                                                            |
| `sidebar-collapsible.tsx`           | 8                     | —   | live              | **migrate**                                                                            |
| `timeline.tsx`                      | 7                     | —   | live              | **migrate**                                                                            |
| `pull-to-refresh-indicator.tsx`     | 7                     | —   | live              | **migrate**                                                                            |
| `form-wizard.tsx`                   | 3                     | —   | live              | **migrate**                                                                            |
| `chart.tsx`                         | —                     | 5   | live              | **keep-as-is** (chart palette; deferred chart-token phase per Phase-51 D-03 rationale) |
| `world-map.tsx`                     | —                     | 5   | live (1 importer) | **keep-as-is** (map data colors)                                                       |
| `expandable-card.tsx`               | 8                     | —   | dead (P79 delete) | **skip** — deletion supersedes                                                         |
| `floating-dock.tsx`                 | 6                     | —   | dead (P79)        | **skip**                                                                               |
| `placeholders-and-vanish-input.tsx` | 5                     | 1   | dead (P79)        | **skip**                                                                               |
| `background-boxes.tsx`              | 3                     | 9   | dead (P79)        | **skip**                                                                               |
| `animated-tooltip.tsx`              | 2                     | —   | dead (P79)        | **skip**                                                                               |
| `moving-border.tsx`                 | 1                     | —   | dead (P79)        | **skip**                                                                               |

Per CONTEXT, the final call is made per-item against the actual code during execution and recorded in the SUMMARY — the table above is the researched starting position, not the decision. Re-count at execution (the numbers can move under parallel work). The 7 dead files (25 palette lines + 10 hex) should be _skipped with a one-line annotation_ pointing at Phase 79's deletion — migrating them would be wasted work.

**Primitive anatomy (re-skin surface):** `ui/button.tsx` re-exports `heroui-button.tsx` whose variants map to `.btn-primary`/`.btn-ghost` CSS classes; `ui/input.tsx` uses `.id-input` + `var(--*)` utilities. The recipes live in `index.css` (handoff port) — the Linear re-skin is (a) automatic via token values for color, (b) explicit for metrics: radius 6/8/12, hairline `#23252a` borders, no card shadows (`--shadow-card` token exists in buildTokens — decide keep-at-none vs remove), surface-1..4 ladder assignments (cards on surface-1, popovers/drawers on surface-3/4 per Linear reference).

## DOC-01 scope (exact files)

| File                                                  | Current state                                                                                                                                                                                        | Action                                                                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/CLAUDE.md`                                          | "Visual Design Source of Truth" section = IntelDossier prototype + Bureau default + Bureau radii/rules                                                                                               | Rewrite section to Linear (dark-canonical, new radii, surface ladder, hairline rules)                                                     |
| `frontend/CLAUDE.md`                                  | Provider tree at line 21 says `LanguageProvider → RTLWrapper → AppRouter` — **stale** (Phase 76 replaced RTLWrapper with DirectionProvider; MD-01 carryover); design-token section references Bureau | Fix provider tree + Linear-ize token prose                                                                                                |
| `frontend/src/design-system/CLAUDE.md`                | "Bureau is the default direction" section; byte-match doc lists only 2 sync sites                                                                                                                    | Rewrite to Linear; document all THREE literal copies + the CI guard                                                                       |
| `frontend/DESIGN.md`                                  | Full Bureau spec (YAML-front-matter, 4-direction narrative) — verified exists                                                                                                                        | Rewrite as the Linear spec (include the hairline-strong mapping decision + derived light set + TOKEN-03 palettes)                         |
| `frontend/design-system/inteldossier_handoff_design/` | Referenced by root `CLAUDE.md`, `design-system/CLAUDE.md`, `eslint.config.mjs` (ignore entry)                                                                                                        | Retire or repoint per CONTEXT; if directory is kept as historical reference, mark it superseded; if deleted, drop the eslint ignore entry |
| `frontend/src/design-system/hooks/useLocale.ts`       | LO-02: doc comment describes `setLocale` calling `i18n.changeLanguage` directly (behavior now delegates via dynamic import — Phase 76)                                                               | Comment fix                                                                                                                               |

## State of the Art

| Old Approach                                          | Current Approach                                | When Changed               | Impact                                                                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4 interchangeable directions, doc-enforced byte-match | Single Linear direction, CI-enforced byte-match | this phase                 | Guard + coercion replace discipline                                                                                                                      |
| Hue-slider-driven OKLCH accent                        | Verbatim palette accent (pending Q1)            | this phase                 | TweaksDrawer/Appearance hue surfaces affected                                                                                                            |
| Default light                                         | Default dark (Linear-canonical)                 | this phase (USER DECISION) | bootstrap `\|\| 'dark'`, App.tsx `initialMode="dark"`, `:root` block = dark values                                                                       |
| `'Inter'` (unregistered → system-ui)                  | `'Inter Variable'` (registered)                 | this phase                 | First honest Inter rendering; visual delta expected in baselines — capture happens BEFORE this change, so Phase 80 will (correctly) flag the font change |

## Assumptions Log

| #   | Claim                                                                                                                                                                                           | Section                 | Risk if Wrong                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | The `user_preferences` table's RLS/usage has no OTHER reader of `theme` beyond the orphaned `usePreferenceSync` (checked frontend only; backend not grepped for `user_preferences.theme` reads) | Runtime State Inventory | Low — a backend reader would still only see a string; nothing styles off it server-side. Planner may add a 1-line backend grep to the migration task |
| A2  | Node type-stripping remains available in future CI Node bumps (currently 22.22.0, works ≥22.18)                                                                                                 | Pattern 2               | Guard fails loudly at CI, not silently; regex-extraction fallback documented                                                                         |
| A3  | `wcagContrast()` (culori) matches the WCAG 2.x definition the org audits against                                                                                                                | Pattern 4               | Values could need ±L adjustment; verification test makes any recalibration mechanical                                                                |
| A4  | The 8 direction×mode "focused-primitive" snapshots belong to a spec that can be rewritten linear-only without losing intended coverage                                                          | Pattern 5               | If the spec guards something else, keep 2 linear shots + document the delta in the capture VALIDATION log                                            |

## Open Questions

1. **Fate of the hue axis (`id.hue`, `useHue`, `HUE_PRESETS`, Appearance hue slider) — needs an explicit plan decision.**
   - What we know: Linear's accent is verbatim `#5e6ad2` = oklch(0.567 0.159 275.2) [measured]; the current formula `oklch(58% 0.14 h)` cannot reproduce it at any h (h=275 → `#6470cc`) [probe-verified]. The SLA family also tracks hue (`+55°` shift). CONTEXT retires the _direction_ switcher but is silent on hue; TOKEN-01 says values are verbatim.
   - What's unclear: whether the hue tweak is a product feature worth keeping once accent is literal.
   - **Recommendation:** move the accent family (`--accent/--accent-fg/--accent-ink/--accent-soft` + hover) to palette literals; retire the hue control from TweaksDrawer + AppearanceSettingsSection in the same sweep as the direction switcher; pin the SLA hue math to the Linear accent hue (275) as an internal constant; stop reading `id.hue` (remove key in the coercion write-back). This is the only combination that satisfies "verbatim" + "no desyncable knobs". If the planner prefers keeping hue, it must be scoped to SLA-only and documented as intentionally off-reference.
2. **`--shadow-card` token** — Linear = no card shadows; token exists in buildTokens and `:root`. Recommend keeping the token name but setting it to `none` (removing it risks unset-var fallout at consumers) — planner's call; grep consumers first.
3. **`.dir-*` CSS strategy** — recommend option (a) mechanical rename to `.dir-linear` + delete retired blocks (see Blast radius); flattening is a candidate for a later cleanup phase, not this one.

## Environment Availability

| Dependency                    | Required By                      | Available                       | Version                                                                | Fallback         |
| ----------------------------- | -------------------------------- | ------------------------------- | ---------------------------------------------------------------------- | ---------------- |
| Node (type-stripping ≥22.18)  | FOUC guard                       | ✓                               | 22.23.1 local / 22.22.0 CI                                             | regex extraction |
| pnpm                          | all scripts                      | ✓                               | 10.29.1                                                                | —                |
| culori                        | TOKEN-03                         | ✓                               | 4.0.2 (devDep)                                                         | —                |
| Playwright + chromium         | VERIFY-01 capture                | ✓                               | repo-pinned; snapshots are `-darwin` (this Mac is the capture machine) | —                |
| Supabase MCP                  | staging seed refresh for capture | ✓ (session-connected)           | —                                                                      | manual SQL       |
| gh CLI                        | CI status checks                 | ✓ (verified `gh run list`)      | —                                                                      | —                |
| Staging Supabase reachability | dev-server capture               | ✓ (established in prior phases) | —                                                                      | —                |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest (unit/bootstrap) + Playwright (visual/e2e), both repo-pinned                                                                             |
| Config file        | `frontend/vitest.config.ts` (+ `vitest.a11y.config.ts`), `frontend/playwright.config.ts`                                                        |
| Quick run command  | `pnpm -C frontend exec vitest run tests/bootstrap tests/unit/design-system`                                                                     |
| Full suite command | `pnpm -C frontend test` (vitest) + `pnpm lint` (includes token/parity/i18n/rtl checks) + `pnpm -C frontend exec playwright test <visual specs>` |

### Phase Requirements → Test Map

| Req ID             | Behavior                                                                                                                                    | Test Type         | Automated Command                                                                      | File Exists?                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| TOKEN-01           | buildTokens emits Linear dark/light sets for every input combo                                                                              | unit              | `pnpm -C frontend exec vitest run tests/unit/design-system/buildTokens.test.ts`        | ✅ exists — assertions rewritten to Linear values                           |
| TOKEN-02 / FOUC-01 | bootstrap paints values byte-equal to directions.ts/densities.ts                                                                            | CI script         | `node scripts/check-bootstrap-parity.mjs` (+ positive-failure fixture step)            | ❌ Wave 0                                                                   |
| TOKEN-03           | derived error/warn + 6 status tags ≥ 4.5:1 on their surfaces (dark + light)                                                                 | unit              | `pnpm -C frontend exec vitest run tests/unit/design-system/contrast.test.ts`           | ❌ Wave 0                                                                   |
| TOKEN-04           | legacy `id.dir` (all 4 retired values) coerces to linear in bootstrap AND provider; unset `id.theme` → dark; persisted `id.theme` preserved | unit (vm harness) | `pnpm -C frontend exec vitest run tests/bootstrap/`                                    | ✅ harness exists (`migrator.test.ts`); coercion spec file ❌ Wave 0        |
| TOKEN-04           | switcher gone from Topbar/TweaksDrawer/Appearance; no retired-direction i18n keys                                                           | unit              | existing `Topbar.test.tsx` / `TweaksDrawer.test.tsx` / `label-parity.test.ts` reworked | ✅ exist — rewritten                                                        |
| TOKEN-05           | `'Inter Variable'`/`'JetBrains Mono Variable'` registered + resolved; Tajawal cascade under `dir=rtl`                                       | e2e probe         | Playwright `document.fonts.check(...)` assertions in a font spec                       | ❌ Wave 0 (small spec)                                                      |
| TOKEN-06           | zero NEW raw hex / palette literals outside carve-outs                                                                                      | lint              | `pnpm lint` (Design Token Check) + carve-out decisions recorded in SUMMARY             | ✅ exists                                                                   |
| DOC-01             | no Bureau-canonical prose remains in the 5 doc targets                                                                                      | manual + grep     | `grep -rn "Bureau is the default" CLAUDE.md frontend/`                                 | manual-only (doc review) — justified: prose quality isn't machine-checkable |
| VERIFY-01 (gate)   | pre-swap baselines committed + replay green locally without `--update-snapshots`                                                            | visual            | `pnpm -C frontend exec playwright test <12 visual specs>` on the capture machine       | ✅ specs exist — re-capture + pin-state audit                               |

### Sampling Rate

- **Per task commit:** `pnpm -C frontend exec vitest run tests/bootstrap tests/unit/design-system` + `node scripts/check-bootstrap-parity.mjs` (once it exists)
- **Per wave merge:** `pnpm lint && pnpm -C frontend test` + local visual replay of affected specs
- **Phase gate:** full lint + vitest green; parity guard green (both polarity steps); visual replay green on capture machine before `/gsd:verify-work` (CI visual job stays red-by-infrastructure — do not treat as the gate)

### Wave 0 Gaps

- [ ] `scripts/check-bootstrap-parity.mjs` — covers TOKEN-02/FOUC-01 (+ `tools/bootstrap-fixtures/bad-bootstrap.js` fixture + ci.yml Lint-job steps + `pnpm lint` chain entry)
- [ ] `frontend/tests/bootstrap/coercion.test.ts` — covers TOKEN-04 (extends existing vm harness; cases: each retired dir, unset dir, unset theme→dark, persisted theme kept, blocked-storage path)
- [ ] `frontend/tests/unit/design-system/contrast.test.ts` — covers TOKEN-03 (culori wcagContrast assertions, dark + light)
- [ ] Font-registration probe spec (Playwright, `document.fonts.check`) — covers TOKEN-05
- [ ] **Ordering constraint:** VERIFY-01 baseline capture commit must precede the first `directions.ts` literal change (this is a wave-ordering rule, not a file gap)

## Security Domain

This phase is CSS-token/docs/client-preference work — no auth, session, crypto, or server input surface changes.

### Applicable ASVS Categories

| ASVS Category         | Applies      | Standard Control                                                                                                                                                                                                                                                                          |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no           | —                                                                                                                                                                                                                                                                                         |
| V3 Session Management | no           | —                                                                                                                                                                                                                                                                                         |
| V4 Access Control     | no           | —                                                                                                                                                                                                                                                                                         |
| V5 Input Validation   | yes (narrow) | localStorage values are untrusted input to bootstrap/DesignProvider — the existing guard-function pattern (`isDirection`/`isMode`/whitelist-else-default) must be preserved in the coercion; never `eval`/interpolate stored values into CSS beyond `setProperty` of whitelisted mappings |
| V6 Cryptography       | no           | —                                                                                                                                                                                                                                                                                         |

### Known Threat Patterns for this stack

| Pattern                                                                                  | STRIDE    | Standard Mitigation                                                                                                                                                  |
| ---------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stored-value injection via localStorage (`id.*` keys writable by any same-origin script) | Tampering | Whitelist-coerce every read (existing pattern, extended by TOKEN-04 coercion); values only ever reach `style.setProperty` from the static P/F/D tables, never raw    |
| CI-guard fixture path traversal (CLI arg)                                                | Tampering | Mirror check-duplicate-rtl: `path.resolve(repoRoot, cliArg)` + read-only, no subprocess/dynamic execution beyond the vm sandbox with a stubbed, network-free context |

## Sources

### Primary (HIGH confidence)

- Live repo reads this session: `tokens/{directions,buildTokens,applyTokens,types,densities}.ts`, `DesignProvider.tsx`, `public/bootstrap.js`, `index.css` (`@theme` + `:root` + RTL cascade), `fonts.ts`, `eslint.config.mjs` (carve-out blocks), `scripts/check-duplicate-rtl.mjs`, `.github/workflows/ci.yml` + `e2e.yml`, `playwright.config.ts`, `tests/bootstrap/migrator.test.ts`, TweaksDrawer/Topbar/AppearanceSettingsSection/ClassificationBar/ThemeErrorBoundary/preference-sync/preference-storage/settings.types, Phase 75 audit + Phase 46 SUMMARYs/VERIFICATION
- Executed probes: `node` native TS import of directions/densities (✓) and buildTokens (✗ extensionless), culori oklch/wcagContrast measurements, `@fontsource-variable` family-name grep in node_modules, literal counts in `components/ui` (74 palette lines / 20 hex), `gh run list` (E2E red ×3)
- https://www.shadcn.io/design/linear/raw — full dark+light token extraction (WebFetch this session)
- `.planning/research/STACK.md` (2026-07-01) — Linear dark excerpt + integration prescriptions (consistent with the live fetch)

### Secondary (MEDIUM confidence)

- Phase 46 planning docs (`46-01`/`46-04` SUMMARYs) for the capture protocol — authoritative for what was done, applied here as precedent
- Node.js type-stripping availability window (≥22.18 unflagged) — behavior probe-verified locally on 22.23.1; CI version 22.22.0 read from ci.yml but not probe-executed in CI itself

### Tertiary (LOW confidence)

- None load-bearing.

## Metadata

**Confidence breakdown:**

- Token engine + blast radius: HIGH — every file read, every count executed
- FOUC guard design: HIGH — every mechanism probe-verified (vm harness precedent, native TS import, CI wiring shape)
- Linear values: HIGH (dark, verbatim fetch) / MEDIUM (light — 4 verbatim values, rest is prescribed derivation)
- TOKEN-03 derivation: MEDIUM — method verified (culori), exact values intentionally left to execution per CONTEXT
- Visual baseline protocol: HIGH — Phase 46 precedent read, CI red status verified live

**Research date:** 2026-07-02
**Valid until:** 2026-08-01 (stable domain; re-verify CI Node version and the E2E-red status before execution if delayed)
