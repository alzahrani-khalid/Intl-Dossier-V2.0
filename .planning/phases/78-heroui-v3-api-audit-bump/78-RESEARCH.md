# Phase 78: HeroUI v3 API Audit & Bump - Research

**Researched:** 2026-07-03
**Domain:** Dependency bump — `@heroui/react` + `@heroui/styles` 3.0.5 → 3.2.1, zero-regression sweep
**Confidence:** HIGH (every claim below verified against the installed 3.0.5 dist, the downloaded 3.2.1 tarballs, npm registry, and the official heroui-inc/heroui GitHub releases)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

Light dependency-bump phase with all decisions prescribed by REQUIREMENTS + the Phase 75 audit:

- **HEROUI-01:** bump `@heroui/react` AND `@heroui/styles` 3.0.5 → 3.2.1 **in lockstep** (they are version-coupled); no v2 package anywhere (there is none today). Verify the lockfile resolves both to 3.2.1.
- **HEROUI-02:** re-run the Phase 75 "Phase 78 re-run protocol" commands and expect the SAME output (8 import sites, type-check exit 0, 0 flat-prop stragglers, 0 removed-name imports). Convert any straggler only if one surfaces — expected: none. Do NOT re-open a v2→v3 migration narrative.
- **Regression sweep:** all routes using HeroUI components render without regression in EN and AR after the bump. Reuse existing Playwright/visual harness where it helps; the formal full-route re-compare is Phase 80's job.
- **Two documented nuances (avoid false positives in the sweep):** flat-named `Drawer` exports ARE v3 (Nuance 1); `Autocomplete` still exists as a 3.0.5 export (AUDIT-03 nuance) — do not flag these.

### Claude's Discretion

Changelog review between 3.0.5 and 3.2.1, exact regression-sweep tooling, and rollback handling are the planner's/executor's discretion.

### Deferred Ideas (OUT OF SCOPE)

None — light bump-and-sweep phase, fully prescribed by HEROUI-01/02 + the Phase 75 audit. Aceternity (Phase 79) and the final full-route verification (Phase 80) are out of scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                            | Research Support                                                                                                                                                    |
| --------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HEROUI-01 | `@heroui/react`/`@heroui/styles` bump from 3.0.5 → 3.2.1                               | §Version Coupling (lockstep mechanics + lockfile verification), §Changelog Diff, §Bundle Size, §Rollback                                                            |
| HEROUI-02 | Any residual flat-prop HeroUI call site converted to compound pattern (expected: none) | §Phase 75 Re-run Protocol (verbatim), §The One Breaking Change (the ONLY composition delta 3.0.5→3.2.1, and why the protocol cannot see it), §False-Positive Guards |

</phase_requirements>

## Summary

The bump is **near-clean but not zero-delta**. A full API-surface diff between the installed 3.0.5 dist and the downloaded 3.2.1 tarball shows type changes in only 11 components (calendar, calendar-year-picker, checkbox, date-picker, date-range-picker, fieldset, radio, range-calendar, switch, table, tooltip) plus one additive icon. Intersected with the project's actual imports, exactly **two components are affected: Checkbox and Switch** — hit by the single documented breaking change of the range (v3.2.0 toggles composition refactor). Everything else the project imports (Button, Card, Modal, Skeleton, Drawer + flat parts, TextField/Input/TextArea/Label/Description/FieldError, Select, `useOverlayState`) is **byte-identical** at the type level between 3.0.5 and 3.2.1. `[VERIFIED: diff of installed 3.0.5 dist vs npm-packed 3.2.1 tarball, 2026-07-03]`

The blast radius of that one breaking change is **an unconsumed module**: `heroui-forms.tsx` (which contains the affected `HeroUIFormCheckbox`/`HeroUIFormSwitch`) has **zero importers** anywhere in `frontend/src` — as does `heroui-modal.tsx`. No live route renders a HeroUI Checkbox, Switch, or Modal today. The live runtime HeroUI surface is: Drawer (AppShell + TweaksDrawer — every protected route), and the Button/Card/Skeleton primitives wrapped by `button.tsx`/`card.tsx`/`skeleton.tsx`. `[VERIFIED: grep of frontend/src, 2026-07-03]`

Two more planning-relevant facts: (1) the Phase 75 re-run protocol **cannot detect** the toggles breaking change — tsc still exits 0 (children are `ReactNode`) and the dot-notation greps are unchanged — so the plan must handle it explicitly, not rely on the protocol; (2) there is **one expected, intentional visual delta**: Drawer bodies gain thin scrollbars (upstream `scrollbar` utility applied in 3.2.1's drawer.css) — the sweep must not chase this as a regression. Bonus de-risk: `@heroui-pro/react@1.0.0-beta.6` peer-requires `@heroui/react >=3.2.0` — the current 3.0.5 install _violates_ that peer range; this bump satisfies it.

**Primary recommendation:** bump both packages to exact `3.2.1` in one commit, migrate the two toggle wrappers in `heroui-forms.tsx` to the new `*.Content` composition in the same phase (10-line change, unconsumed module), re-run the Phase 75 protocol verbatim, then validate with type-check + `ConcurrentDrawers.test.tsx` + build/size-limit + a lightweight EN/AR browser smoke of the drawers.

## Standard Stack

No new libraries. This phase changes two existing pinned versions:

| Package          | From                               | To    | npm `latest` (verified 2026-07-03) | Published                             |
| ---------------- | ---------------------------------- | ----- | ---------------------------------- | ------------------------------------- |
| `@heroui/react`  | 3.0.5 (`frontend/package.json:44`) | 3.2.1 | 3.2.1                              | 2026-06-17 `[VERIFIED: npm registry]` |
| `@heroui/styles` | 3.0.5 (`frontend/package.json:45`) | 3.2.1 | 3.2.1                              | 2026-06-17 `[VERIFIED: npm registry]` |

Intermediate releases crossed: 3.1.0 (2026-05-25), 3.2.0 (2026-06-15), 3.2.1 (2026-06-17). `[VERIFIED: npm view time]`

**Peer dependencies — unchanged, all satisfied:** both 3.0.5 and 3.2.1 require `react >=19.0.0`, `react-dom >=19.0.0`, `tailwindcss >=4.0.0`. Project has react 19.2.6, tailwindcss 4.3.0. No peer bump risk. `[VERIFIED: npm view peerDependencies]`

**Transitive changes inside `@heroui/react` 3.2.1:** `react-aria-components` 1.17.0 → 1.18.0 (exact pin), NEW direct dep `react-aria@3.49.0` (because 3.2.1 stopped vendoring react-aria code — PR #6653), patch bumps of `@react-aria/*`. `[VERIFIED: npm view dependencies]`

**Bump command (from repo root):**

```bash
# edit frontend/package.json lines 44-45 to "3.2.1", then:
pnpm install
```

## Package Legitimacy Audit

No NEW package names are introduced — this is a version bump of two packages already in the lockfile, delivered from the public npm registry by the official HeroUI org.

| Package          | Registry | Age                                                  | Source Repo                                                | Provenance                                              | Disposition |
| ---------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- | ----------- |
| `@heroui/react`  | npm      | v3 line since 2025-07 (alphas), stable since 2026-03 | github.com/heroui-inc/heroui (`repository` field verified) | Existing dep; releases cross-checked on official GitHub | Approved    |
| `@heroui/styles` | npm      | same release cadence, publishes in lockstep          | github.com/heroui-inc/heroui                               | Existing dep                                            | Approved    |

**Packages removed due to slopcheck [SLOP] verdict:** none. **Flagged [SUS]:** none. slopcheck not run — no new package names; both packages verified via npm registry metadata + official GitHub releases (authoritative source).

## Changelog Diff 3.0.5 → 3.2.1

Full release notes fetched from the official GitHub releases. `[CITED: github.com/heroui-inc/heroui/releases — v3.1.0, v3.2.0, v3.2.1]`

### v3.1.0 — no breaking changes

- Soft-foreground theme tokens made accessible (`--accent/danger/warning-soft-foreground` change from flat `var(--accent)` to `color-mix(...)` blends) — a **default-style change** in `themes/default/variables.css`. Impact here: **none observed** — no live HeroUI surface uses soft variants (grep verified; the only "soft" hit is `skeleton.tsx` using the app's own `--line-soft` Linear token).
- Shared scrollbar utility system (`@utility scrollbar/-thin/-default/-none` + `--scrollbar-*` theme vars).
- RTL fixes (Table logical border-radius, logical inline-end/start for chevrons/indicators, pickers/ListBox/Menu) — beneficial for this app.
- Link underline-on-hover change (app does not use HeroUI Link), toast fixes, `useTheme` SSR fix, overlay placement/Dialog focus fixes.

### v3.2.0 — ONE breaking change (see next section) + React Aria 1.18.0

- **Breaking:** `Radio`, `Checkbox`, `Switch` move to explicit `*.Content` composition (details below).
- React Aria upgrade to RAC 1.18.0.
- Additive: Calendar week/day views, `Table.SortableColumnHeader`, Autocomplete Virtualizer, tooltip delay CSS vars, `Switch.Icon` part.
- Style fixes: modal scroll-inside height cap, Select/Autocomplete invalid-state background, RTL table column separator/resizer.

### v3.2.1 — packaging fix, no API change

- `@heroui/react` **no longer bundles its own vendored copy of react-aria** — subpaths externalized to the real `react-aria`/`react-aria-components` packages (PR #6653). This is the main **bundle-chunk mover** (see §Bundle Size).
- Tooltip duplicate-instance fix, SwitchGroup horizontal layout fix.

### Verdict per import site (API-surface diff, installed 3.0.5 dist vs 3.2.1 tarball)

| Project import                                                                  | Type surface 3.0.5 → 3.2.1                             | Risk                                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| `Button`, `Card`, `Skeleton`, `Modal`, `Select`, `TextField`/`Input`/`TextArea` | **byte-identical**                                     | none                                                                     |
| `Label`, `Description`, `FieldError` (fieldset module)                          | trivial diff (a `children` destructure; no API change) | none                                                                     |
| `Drawer` + flat parts (`DrawerBackdrop/Content/Dialog/Header/Body`)             | **byte-identical** (export line 66 identical in 3.2.1) | none at type level; runtime moves to external react-aria (smoke-test it) |
| `useOverlayState`                                                               | still exported (`dist/hooks/use-overlay-state.d.ts`)   | none                                                                     |
| `Checkbox`, `Switch`                                                            | **CHANGED** — v3.2.0 toggles refactor                  | see next section                                                         |

`[VERIFIED: per-component diff of dist/components/*/index.d.ts, 2026-07-03]`

## The One Breaking Change: Toggles `*.Content` Composition (v3.2.0)

### What shipped (verified against the 3.2.1 dist, not just release notes)

- Checkbox parts in 3.2.1: `Root` (now extends `CheckboxFieldPrimitive` — the root is **no longer the `<label>` element**, it's a Field wrapper), `Content` (extends `CheckboxButtonPrimitive` — the clickable `<label>`), `Control`, `Indicator`. Switch adds `Icon`; `Switch.Thumb` **still exists**.
- Note a naming trap: PR #6614's body describes a `*.Button` part; the **shipped** part name is `*.Content` (the release-notes summary is accurate; the dist confirms `Checkbox.Content`/`Switch.Content` exist and no `.Button` part does).
- **Control-only fallback:** rendering `*.Control` directly inside the root (no `*.Content`) still works — the control self-wraps into a clickable element. Label-less usages need no change. `[CITED: github.com/heroui-inc/heroui/pull/6614]`

Canonical new anatomy `[CITED: heroui.com/docs/react/components/checkbox]`:

```tsx
<Checkbox>
  <Checkbox.Content>
    <Checkbox.Control>
      <Checkbox.Indicator />
    </Checkbox.Control>
    Label text here {/* plain text — no nested <Label> */}
  </Checkbox.Content>
  <Description>…</Description> {/* sibling of Content */}
  <FieldError>…</FieldError> {/* sibling of Content */}
</Checkbox>
```

### Where it hits this codebase

`frontend/src/components/ui/heroui-forms.tsx` only:

- `HeroUIFormCheckbox` (lines 190-209): `<Checkbox>` root → `<Checkbox.Control>` + sibling `<div><Label/><Description/></div>`
- `HeroUIFormSwitch` (lines 244-260): `<Switch>` root → `<div><Label/><Description/></div>` + `<Switch.Control><Switch.Thumb/></Switch.Control>`

Under 3.2.1 this old markup still **compiles** (children are `ReactNode`) and the Control self-wraps, but the root stops being a `<label>`: the visible Label loses click-to-toggle association and the accessible name moves, and root layout classes (`flex items-start gap-3`) now sit on a Field wrapper instead of the label element. This is a **behavioral/a11y regression that tsc cannot see**.

### Why the blast radius is minimal

**`heroui-forms.tsx` has ZERO consumers.** No file imports from it, and `HeroUIFormCheckbox`/`HeroUIFormSwitch`/`HeroUICheckbox`/`HeroUISwitch` appear nowhere else in `frontend/src` (no ui barrel exists either). `heroui-modal.tsx` likewise has zero consumers. No live route renders a HeroUI Checkbox/Switch/Modal today. `[VERIFIED: grep frontend/src, 2026-07-03]`

### Recommended handling (planner)

Update the two wrapper components in `heroui-forms.tsx` to the `*.Content` composition **in the same phase** (the module exists "for new forms" per its docstring — leaving it silently broken violates its purpose):

```tsx
// HeroUIFormCheckbox body — new composition
<HeroUICheckbox name={name} isSelected={isSelected} ... className={cn('min-h-11 sm:min-h-10', className)}>
  <HeroUICheckbox.Content className="flex items-start gap-3">
    <HeroUICheckbox.Control className="mt-0.5">
      <HeroUICheckbox.Indicator />
    </HeroUICheckbox.Control>
    {label}
  </HeroUICheckbox.Content>
  {description && <HeroUIDescription className="text-xs">{description}</HeroUIDescription>}
</HeroUICheckbox>
```

(Mirror for `HeroUIFormSwitch`: `Switch.Content` wrapping label text + `Switch.Control`/`Switch.Thumb`; `justify-between` layout moves onto `Content`.) Pair with a small vitest render test asserting label-click toggles selection — that is the only oracle that would have caught this class of change.

**HEROUI-02 framing:** this is NOT a v2 flat-prop straggler (protocol still expects 0 of those). It is a new-in-3.2.0 v3-minor composition change; handle it under the regression sweep, not by re-opening a migration narrative.

## Version Coupling & Lockfile Verification

- `@heroui/react@3.2.1` declares `"@heroui/styles": "3.2.1"` as an **exact regular dependency** — the coupling is mechanical. `[VERIFIED: npm view dependencies]`
- **Primary failure mode:** bumping only `@heroui/react` in `package.json` while the direct `@heroui/styles` pin stays 3.0.5 → pnpm installs TWO styles copies. `frontend/src/index.css` imports (`@heroui/styles/base`, `themes/default`, `utilities`, `variants`, `components/drawer.css` — lines 28-33) resolve through the **direct** dependency (3.0.5 CSS) while component BEM classnames/behavior come from 3.2.1 → class/style desync (e.g., the drawer-body `scrollbar` class with no matching utility).
- **Verification after `pnpm install`:**

```bash
grep -nE "'@heroui/(react|styles)@" pnpm-lock.yaml   # expect ONLY @3.2.1 entries, zero 3.0.5 remnants
pnpm --dir frontend list @heroui/react @heroui/styles # both 3.2.1
```

- **Bonus:** `@heroui-pro/react@1.0.0-beta.6` peer-requires `@heroui/react >=3.2.0` + `@heroui/styles >=3.2.0` — currently violated at 3.0.5; the bump satisfies it (Pro remains 0-import; no `HEROUI_AUTH_TOKEN` CI wiring needed this phase). `[VERIFIED: installed @heroui-pro/react package.json]`
- The app's direct `react-aria-components: 1.19.0` pin (`frontend/package.json:117`, present for Pro's peer) has **zero imports in src** — heroui's own exact-pinned copy (1.18.0 post-bump) is the only RAC that bundles. No bundle duplication.

## CSS Delta the App Actually Imports (styles 3.0.5 → 3.2.1)

Diffed file-by-file for the exact subpaths in `frontend/src/index.css:28-33`:

| Imported file                        | Delta                                                                                                                                                                      | Impact                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base/base.css`                      | 0 lines                                                                                                                                                                    | none                                                                                                                                                                                                                      |
| `themes/default` (shell `index.css`) | shell identical, but its `variables.css` import changed **102 lines**: new `--scrollbar-*` vars, new `--default-soft*`, `*-soft-foreground` colors become color-mix blends | Low — no live surface uses soft variants; app Linear tokens own all visible color. Watch, don't fear                                                                                                                      |
| `utilities/index.css`                | +27 lines — additive `@utility scrollbar/-thin/-default/-none`                                                                                                             | No collision: app defines no `--scrollbar-*` vars or `scrollbar` utilities `[VERIFIED: grep src css]`                                                                                                                     |
| `variants/index.css`                 | 0 lines                                                                                                                                                                    | none                                                                                                                                                                                                                      |
| `components/drawer.css`              | **exactly 1 rule**: drawer body `@apply min-h-0 flex-1` → `@apply min-h-0 flex-1 scrollbar`                                                                                | **The one expected visual delta**: Drawer bodies (AppShell drawers + TweaksDrawer) gain thin scrollbars (`color-mix(foreground 15%)` thumb). Intentional upstream change — record as expected, do NOT chase as regression |

`[VERIFIED: diff installed @heroui/styles@3.0.5 dist vs 3.2.1 tarball, 2026-07-03]`

The `@heroui/styles` exports map is identical between versions — all five `@import` subpaths keep resolving (incl. `components/drawer.css` via the `./components/*.css` export key). The Phase 33 "skip the JS plugin, compose CSS directly" workaround remains valid; do not switch to `@plugin '@heroui/styles'`.

## The 8 Import Sites (re-verified 2026-07-03, unchanged from Phase 75)

| File                                           | Imports                                                                                | Bump risk                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `components/ui/heroui-button.tsx`              | `Button`                                                                               | none (type-identical; wrapper fully re-skins via `.btn-*` recipes)                  |
| `components/ui/heroui-card.tsx`                | `Card` (compound)                                                                      | none — consumed by `ui/card.tsx` (app-wide)                                         |
| `components/ui/heroui-skeleton.tsx`            | `Skeleton`                                                                             | none — consumed by `ui/skeleton.tsx`                                                |
| `components/ui/heroui-forms.tsx`               | `TextField, Input, TextArea, Label, Description, FieldError, Select, Checkbox, Switch` | **Checkbox/Switch composition change — the only real work.** Module has 0 consumers |
| `components/ui/heroui-modal.tsx`               | `Modal, Button, useOverlayState`                                                       | none (Modal type-identical; 0 consumers)                                            |
| `components/layout/AppShell.tsx`               | `Drawer, useOverlayState`                                                              | type-identical; runtime moves to external react-aria → smoke drawers                |
| `components/tweaks/TweaksDrawer.tsx`           | flat `Drawer*` parts                                                                   | flat exports identical in 3.2.1 (Nuance 1 holds)                                    |
| `components/layout/ConcurrentDrawers.test.tsx` | `Drawer` (test)                                                                        | reusable regression asset                                                           |

## False-Positive Guards for the Sweep

1. **Flat-named Drawer exports ARE v3** (Nuance 1) — `DrawerBackdrop/Content/Dialog/Header/Body/...` export line in `dist/components/drawer/index.d.ts:66` is **identical** in 3.2.1. Do not flag `TweaksDrawer.tsx`. `[VERIFIED: 3.2.1 tarball]`
2. **`Autocomplete` still exists in 3.2.1** (`dist/components/autocomplete/` present) — the AUDIT-03 claim stays import-evidence ("0 imports of the 9 names"), not a removal claim. `[VERIFIED: 3.2.1 tarball]`
3. **`heroui-*` filename ≠ HeroUI usage** (Nuance 2): `heroui-chip.tsx`, `heroui-switch.tsx`, `heroui-tabs.tsx` contain no `@heroui/react` import. The stale `heroui-chip.tsx` docstring ("Real @heroui/react Chip primitive" — it's cva + Radix Slot) is the **Phase 75-flagged cleanup item for this phase**: correct the docstring, no behavior change. Note: fixing it changes the loose `grep -rln "@heroui"` text-match count (12 → 11) — another reason the protocol mandates the import-specific grep.
4. **`CheckboxRenderProps` is deprecated (not removed)** in 3.2.1 typings (aliased to `CheckboxFieldRenderProps`) — a deprecation warning is not a straggler.
5. **`Switch.Icon` and expanded Calendar/Table APIs are additive** — new exports appearing in `list`-style audits are not regressions.

## Phase 75 Re-run Protocol (verbatim — the plan re-runs these and diffs)

From `.planning/phases/75-ui-component-migration-audit/75-AUDIT-heroui-confirmation.md`:

| #   | Command (repo root)                                                                                                                                                                                     | Expected output                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | `grep -rlnE "from ['\"]@heroui/react['\"]" --include='*.tsx' --include='*.ts' frontend/src`                                                                                                             | The same 8-file list (`Import-site count: 8`). NEVER the loose `@heroui` text match (over-counts to 12) |
| 2   | `grep -rnE "import\s*\{[^}]*\b(Navbar\|Snippet\|User\|Spacer\|Image\|Code\|Autocomplete\|DateInput\|Ripple)\b[^}]*\}\s*from\s*['\"]@heroui/react['\"]" --include='*.tsx' --include='*.ts' frontend/src` | 0 hits, **exit 1**                                                                                      |
| 3   | `pnpm --dir frontend type-check`                                                                                                                                                                        | **exit 0**                                                                                              |
| 4   | `grep -rn "Modal\.\|Checkbox\.\|Switch\.\|Card\." frontend/src/components/ui/heroui-modal.tsx frontend/src/components/ui/heroui-forms.tsx frontend/src/components/ui/heroui-card.tsx`                   | Compound dot-notation present in all three wrappers                                                     |

**Critical caveat the plan must encode:** this protocol is **blind to the v3.2.0 toggles breaking change**. tsc exits 0 either way (children are `ReactNode`), and command #4's grep still matches `Checkbox.Control`/`Switch.Control` whether or not `*.Content` wraps them. If the plan migrates `heroui-forms.tsx` to the new composition, command #4's raw output gains `Checkbox.Content`/`Switch.Content` lines — an **expected, explainable delta** to record in the re-run artifact, not a failure. The only oracle for the toggles change is a rendered DOM/behavior check.

## Regression-Sweep Tooling (what exists, what to reuse)

| Asset                                                             | Location                                                                                                                                         | Verdict                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ConcurrentDrawers.test.tsx`                                      | `frontend/src/components/layout/`                                                                                                                | **Reuse.** Vitest + jsdom; mounts two real HeroUI Drawers, asserts no-throw, Tab focus containment, ≥2 dialog FocusScopes. Directly exercises the react-aria externalization path post-bump. Run: `pnpm --dir frontend test run ConcurrentDrawers`        |
| `theme-visual.spec.ts`                                            | `frontend/tests/visual/`                                                                                                                         | **STALE — do not reuse.** References pre-Linear `gastat`/`blue-sky` themes and `[aria-label*="Select theme"]` UI that no longer exists post-Phase 77                                                                                                      |
| qa-sweep specs (`qa-sweep-axe/responsive/keyboard/focus-outline`) | `frontend/tests/e2e/`                                                                                                                            | Available via `pnpm --dir frontend test:qa-sweep` — heavier than needed; full-route verification is Phase 80's job. Optional, not required                                                                                                                |
| Browser smoke (recommended)                                       | browser-harness + dedicated headless Chrome (`BU_CDP_URL`, see MEMORY: dedicated headless Chrome :9222 — harness cannot attach to user's Chrome) | Dev server (`:5173`), log in, load dashboard, open AppShell drawer + TweaksDrawer, assert zero console errors; repeat with `?lng=ar` (querystring detector flips language at first paint — `frontend/CLAUDE.md` i18n section) and confirm `html[dir=rtl]` |
| Playwright config                                                 | `frontend/playwright.config.ts` — `baseURL` `http://localhost:5173`, `testDir: frontend/tests`, pre-authenticated storageState                   | Available if the planner prefers a scripted smoke over browser-harness                                                                                                                                                                                    |

**Smoke surface (minimal but sufficient):** the drawers are the ONLY high-traffic component whose runtime code materially changes (react-aria externalized + RAC 1.17→1.18 + the drawer.css scrollbar line). Buttons/cards/skeletons are type-identical and chrome-overridden by app recipes. EN + AR drawer open/close + console-error check ≈ the whole real risk.

## Bundle Size (REQUIRED CI gate)

Budgets in `frontend/.size-limit.json` (all gzip): Initial JS 476 KB, React vendor 285 KB, TanStack 63 KB, **HeroUI vendor 9 KB**, Sentry 9 KB, DnD 22 KB, Copilot 145 KB, **Total JS 2.78 MB**, signature-visuals 55/12 KB.

**Expected movement mechanism:** in ≤3.2.0, `@heroui/react` dist inlined a vendored copy of react-aria subpaths → that code lived under `node_modules/@heroui/...` → `heroui-vendor` chunk (vite `manualChunks` routes `id.includes('@heroui')` there, `vite.config.ts:163`). In 3.2.1 those imports are external → resolve to `react-aria`/`react-aria-components` → match **no** named chunk rule → fall to the `vendor` catch-all (`vite.config.ts:248`), which has no dedicated budget; only **Total JS** sees it. Net prediction: `heroui-vendor` shrinks or holds ≤9 KB; `Total JS` shifts slightly (RAC 1.17→1.18 delta). No duplication risk (zero direct RAC imports in src).

**Local verification (before pushing):**

```bash
pnpm --dir frontend build && pnpm --dir frontend size   # or: pnpm --dir frontend build:ci
```

If CI fails, grep the log for ALL `exceeded` lines — failures stack hidden (MEMORY: project_bundle_size_required_check_budgets).

## Rollback

Make the bump a **single atomic commit** touching only `frontend/package.json` (2 lines) + `pnpm-lock.yaml`. Then:

```bash
git revert <bump-sha>        # restores both files
pnpm install                 # re-syncs node_modules to 3.0.5
pnpm --dir frontend type-check && pnpm --dir frontend build   # confirm restored baseline
```

If the sweep fails BEFORE committing: `git restore frontend/package.json pnpm-lock.yaml && pnpm install` (safe here only because those two files carry nothing but the bump; per MEMORY, never checkout files carrying other uncommitted work). Do not partially roll back one package — lockstep applies in both directions. Keep the `heroui-forms.tsx` composition migration in a **separate commit** from the bump so either can be reverted independently.

## Don't Hand-Roll

| Problem                   | Don't Build                                           | Use Instead                                                                                        | Why                                                                                               |
| ------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Toggle label/press wiring | Custom label-click handlers on the old markup         | The shipped `*.Content` part                                                                       | It IS react-aria's `CheckboxButton`/`SwitchButton` — press, a11y name, and focus handled upstream |
| Drawer scrollbar styling  | App-level scrollbar CSS overrides to "undo" the delta | Accept the upstream `scrollbar` utility (or set `--scrollbar-*` vars via tokens if design objects) | Vars are the supported theming seam                                                               |
| Version-match checking    | Custom scripts                                        | `pnpm list` + lockfile grep                                                                        | Already deterministic                                                                             |

## Common Pitfalls

### Pitfall 1: Trusting the protocol's exit-0 as "no regression"

**What goes wrong:** tsc exit 0 + unchanged greps are read as full pass while the toggles composition change silently degrades label semantics.
**How to avoid:** treat the protocol as necessary-not-sufficient; add the rendered toggle check (vitest) and drawer smoke.

### Pitfall 2: Bumping only one package

**What goes wrong:** direct `@heroui/styles@3.0.5` pin survives; two styles copies install; index.css serves 3.0.5 CSS to 3.2.1 components (e.g., drawer-body `scrollbar` class resolves to nothing).
**Warning sign:** `grep "'@heroui/" pnpm-lock.yaml` shows two versions.

### Pitfall 3: Flagging the drawer thin-scrollbar as a regression

**What goes wrong:** the sweep burns time chasing the one intentional upstream delta.
**How to avoid:** record it as expected up front (this document, §CSS Delta).

### Pitfall 4: "Fixing" the sweep greps

Command #1 must stay the import-specific grep (loose text match over-counts, and the heroui-chip docstring fix changes the loose count). Command #4's new `*.Content` lines post-migration are expected deltas — document, don't suppress.

### Pitfall 5: Worktree without node_modules

Phase 75 noted GSD worktrees share no `frontend/node_modules`. Protocol command #3 and the build must run in an environment with deps installed (main checkout has them — verified today).

## Project Constraints (from CLAUDE.md)

- Tokens only: no raw hex, no Tailwind color literals; wrappers re-skin HeroUI via Linear tokens, never default chrome (any wrapper edit must preserve token classes).
- Logical properties only (`ms-*`, `ps-*`, `text-start`); RTL must keep working — AR smoke required.
- Bundle Size Check is a REQUIRED CI gate; `scripts/check-bootstrap-parity.mjs` runs in `pnpm lint` — the three-copy token byte-match is untouched by this phase but must stay green.
- Protected `main`: work lands via PR with 8 required checks (`gh pr checks <n> --watch --required --fail-fast`); pre-commit hook builds every commit; use `pnpm`, never `npx`.
- No emoji/marketing voice in any copy touched (docstring fix included).
- GSD workflow entry points for any code change.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Framework          | Vitest (unit, jsdom) + Playwright (E2E, `frontend/playwright.config.ts`, baseURL `:5173`) |
| Config file        | `frontend/vitest.*.config.ts`, `frontend/playwright.config.ts`                            |
| Quick run command  | `pnpm --dir frontend test run ConcurrentDrawers`                                          |
| Full suite command | `pnpm --dir frontend type-check && pnpm --dir frontend build && pnpm --dir frontend size` |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                               | Test Type         | Automated Command                                                                                    | File Exists?                                        |
| --------- | ---------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| HEROUI-01 | Lockfile resolves BOTH packages to 3.2.1, no 3.0.5 remnant             | script            | `grep -E "'@heroui/(react\|styles)@" pnpm-lock.yaml` → only `@3.2.1`                                 | ✅ (lockfile)                                       |
| HEROUI-01 | Tree compiles against 3.2.1 typings                                    | type              | `pnpm --dir frontend type-check` → exit 0                                                            | ✅                                                  |
| HEROUI-01 | Bundle budgets hold                                                    | build             | `pnpm --dir frontend build && pnpm --dir frontend size` → green                                      | ✅ (`.size-limit.json`)                             |
| HEROUI-01 | Drawers mount + focus containment on new react-aria                    | unit              | `pnpm --dir frontend test run ConcurrentDrawers`                                                     | ✅                                                  |
| HEROUI-01 | Key HeroUI routes render, EN + AR, zero console errors                 | smoke (manual-ok) | browser-harness headless Chrome: dashboard + AppShell drawer + TweaksDrawer, then `?lng=ar` re-check | ❌ Wave 0 (session procedure, not a committed spec) |
| HEROUI-02 | Protocol re-run output matches Phase 75 records (mod. expected deltas) | script            | 4 protocol commands (§above), diff vs `75-AUDIT-heroui-confirmation.md`                              | ✅ (commands recorded)                              |
| HEROUI-02 | Migrated toggles: label-click toggles selection                        | unit              | new vitest for `HeroUIFormCheckbox`/`HeroUIFormSwitch`                                               | ❌ Wave 0                                           |

### Sampling Rate

- **Per task commit:** `pnpm --dir frontend type-check` (pre-commit hook also builds).
- **Per wave merge:** quick run + protocol re-run.
- **Phase gate:** full suite (type-check + build + size-limit) green, smoke recorded, before `/gsd:verify-work`.

### Wave 0 Gaps

- [ ] `frontend/src/components/ui/heroui-forms.test.tsx` (or colocated) — renders migrated `HeroUIFormCheckbox`/`HeroUIFormSwitch`, asserts label-click toggles + `Content` DOM present — covers HEROUI-02's real oracle.
- [ ] EN/AR drawer smoke procedure (browser-harness; no committed spec needed for a light phase — record output in the verification artifact).

**The real "did the bump regress anything" oracle, ranked:** (1) lockfile dual-version check, (2) `ConcurrentDrawers` vitest on the new package, (3) rendered toggle test, (4) size-limit, (5) EN/AR drawer smoke. tsc exit 0 is necessary but proven insufficient for this specific range.

## Environment Availability

| Dependency                        | Required By      | Available                               | Version                     | Fallback                                    |
| --------------------------------- | ---------------- | --------------------------------------- | --------------------------- | ------------------------------------------- |
| Node.js                           | build/test       | ✓                                       | v22.23.1                    | —                                           |
| pnpm                              | install/bump     | ✓                                       | 10.29.1 (pinned)            | —                                           |
| `frontend/node_modules`           | type-check/build | ✓                                       | installed                   | run from main checkout, not a bare worktree |
| npm registry access               | fetch 3.2.1      | ✓                                       | verified today (`npm view`) | —                                           |
| headless Chrome + browser-harness | EN/AR smoke      | ✓ (per MEMORY: dedicated :9222 pattern) | —                           | Playwright smoke spec instead               |

**Missing dependencies with no fallback:** none.

## Assumptions Log

| #   | Claim                                                                                                                                             | Section         | Risk if Wrong                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| A1  | The 3.0.5→3.2.1 runtime behavior of Drawer under external react-aria/RAC 1.18 is equivalent (type surface identical, but runtime not byte-diffed) | Import sites    | Drawer focus/dismiss quirk — mitigated by `ConcurrentDrawers` vitest + smoke               |
| A2  | react-aria code lands in the `vendor` catch-all chunk post-bump (inferred from `manualChunks` rules, not from an actual build)                    | Bundle Size     | A different chunk breaches its budget — caught by local `pnpm size` before push            |
| A3  | The old toggle markup still _renders_ (control-only self-wrap) rather than throwing — per PR #6614 description, not executed                      | Breaking change | Worst case is louder, not quieter: a render error surfaces immediately in the vitest/smoke |

All other claims are `[VERIFIED]` against dist diffs, npm registry, GitHub releases, official docs, or the live codebase.

## Open Questions (RESOLVED)

1. **Should the toggles migration + docstring fix land even though the module is unconsumed?**
   - RESOLVED: yes, land it (separate commit). Implemented by plan 78-02.
   - What we know: 0 consumers; module exists "for new forms"; HEROUI-02 expects conversion of stragglers that surface.
   - Recommendation: yes — it's the honest close of HEROUI-02, ~15 lines across one file plus one small test, and it prevents the next consumer inheriting a broken pattern. Keep it a separate commit from the bump.

## Sources

### Primary (HIGH confidence)

- npm registry: `npm view @heroui/react|@heroui/styles` (versions, times, deps, peerDeps) — 2026-07-03
- Downloaded tarballs `@heroui/react@3.2.1`, `@heroui/styles@3.2.1` diffed against installed 3.0.5 dists (pnpm store) — full API + CSS surface
- github.com/heroui-inc/heroui — releases v3.1.0 / v3.2.0 / v3.2.1; PR #6614 (toggles), PR #6653 (react-aria externalization)
- heroui.com/docs/react/components/checkbox — canonical `*.Content` anatomy
- Live codebase greps: import sites, consumers, `index.css`, `vite.config.ts`, `.size-limit.json`, test assets
- `.planning/phases/75-ui-component-migration-audit/75-AUDIT-heroui-confirmation.md` — protocol + expected outputs

### Secondary (MEDIUM confidence)

- Project memory: bundle-check behavior, worktree node_modules gap, browser-harness headless-Chrome pattern

## Metadata

**Confidence breakdown:**

- Changelog/breaking-change analysis: HIGH — release notes cross-checked against shipped dist typings and official docs
- Blast radius (consumers): HIGH — direct greps, corroborated by absence of a ui barrel
- Bundle movement: MEDIUM — mechanism verified, magnitudes not (no build executed)
- Sweep tooling: HIGH — assets inspected file-by-file (incl. staleness of theme-visual.spec.ts)

**Research date:** 2026-07-03
**Valid until:** ~2026-08-02 (re-check `npm view @heroui/react version` at plan time; a 3.2.2/3.3.0 release would need a changelog delta review)
