---
phase: 83-token-debt-consolidation
plan: 06
subsystem: ui
tags: [css, design-tokens, tailwind-v4, modern-nav, linear-design-system, lucide]

# Dependency graph
requires:
  - phase: 83-01
    provides: Wave-1 dead-code deletion + DEBT gate scaffolding (check-deleted-components guard)
  - phase: 77
    provides: Linear design-system token engine (index.css :root — --sidebar-bg/--surface-3/--line/--ink/--ok/--danger/--accent/--radius-lg)
provides:
  - modern-nav-tokens.css consumes DS tokens (no parallel --shadow-*/--radius-*/--space-*/hsl ladders)
  - copilot-theme.css DEBT-06 half closed (dead --shadow-sm hover deleted; --copilot-kit-* aliases untouched)
  - modern-nav components flat + token-driven (gradients removed, radius tokenized, dingbats → lucide Check)
affects: [83-07, token-debt DEBT gates, modern-nav-standalone demo]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Bespoke CSS token ladders deleted; component recipes consume the Linear DS :root tokens directly'
    - 'Deletion-safety protocol: per-var zero-external-consumer grep OR proof it resolves against surviving index.css :root before removal'

key-files:
  created: []
  modified:
    - frontend/src/styles/modern-nav-tokens.css
    - frontend/src/components/copilot/copilot-theme.css
    - frontend/src/components/modern-nav/IconRail/IconButton.tsx
    - frontend/src/components/modern-nav/IconRail/IconRail.tsx
    - frontend/src/components/modern-nav/NavigationShell/NavigationShell.tsx
    - frontend/src/routes/modern-nav-standalone.tsx

key-decisions:
  - 'D-83-06 RE-SKIN (not delete): re-pointed modern-nav to DS tokens; /modern-nav-standalone demo route kept, restyled flat'
  - 'bg-panel/text-content-text/bg-badge/text-icon-rail-* are undefined no-op utilities (no @theme/config mapping) — the real var() consumers were the modern-nav-tokens.css component classes + IconButton.tsx only'
  - 'Radii re-pointed to var(--radius-lg) (12px) and 9999px pills — dependency-free, not reliant on deleted/HeroUI --radius-xl/--radius-full'

patterns-established:
  - 'Pattern 1: flat token surface for nav chrome — bg-sidebar + border border-line (no gradients, no card shadows)'
  - 'Pattern 2: DRY checklist via ReferenceColumn(map) + lucide Check instead of per-line dingbat glyphs'

requirements-completed: [DEBT-04, DEBT-05, DEBT-06]

# Metrics
duration: ~20min
completed: 2026-07-04
---

# Phase 83 Plan 06: Modern-nav + Copilot Token-Ladder Deletion Summary

**Deleted the last bespoke parallel token ladders (modern-nav-tokens.css shrank 613→190 lines: --shadow-_/--radius-_/--space-\* scales + hsl color tables + glassmorphism all gone), re-pointed every consumer onto the Linear design-system tokens, and flattened the modern-nav demo chrome.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-04T22:01:00+03:00 (approx)
- **Completed:** 2026-07-04T22:21:38+03:00
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- **DEBT-06 (D-83-06):** modern-nav-tokens.css no longer defines a parallel `--shadow-*` ladder, a multiplicative `--radius-*` scale, a `--space-*` scale, or its own `hsl()` color tables. Its component recipes now consume `var(--sidebar-bg)/--surface-3/--surface/--surface-raised/--line/--line-strong/--ink/--ink-mute/--ok/--danger/--accent`. `hsl(` count in the file = **0**.
- **DEBT-06 copilot half:** closed satisfied-by-evidence — the `--copilot-kit-*` block already aliases DS tokens; only change is deleting the dead `.copilot-thread-row:hover { box-shadow: var(--shadow-sm) }` (already resolved to `none` via index.css `:root`, pixel-identical). The pills and alias block are untouched.
- **DEBT-05 (D-83-05):** glassmorphism radials, panel-item shine, MD3 `!important` elevation shadows, and all text-shadows deleted/flattened; IconRail separator → `1px solid var(--line)` hairline, rail bottom section → flat `bg-sidebar border border-line`. The NavigationShell two-identical-stop tint (`:243`) is KEPT (allowlisted; renders flat).
- **DEBT-04 (D-83-04):** `NavigationShell rounded-e-[12px]` → `rounded-e-[var(--radius-lg)]` (pixel-identical 12px).
- **DEBT-08 (optional-add):** standalone checklist dingbats → lucide `Check` via a DRY `ReferenceColumn`; the inert `(#1A1D26)` demo prose reworded to `(sidebar-bg token)` so the hex grep goes quiet.

## Task Commits

1. **Task 1: delete the ladders, re-point consumers, flatten glass; copilot :758 cleanup** — `7be4eedd` (refactor)
2. **Task 2: modern-nav component files — gradients, radius, checklist dingbats** — `05640b23` (refactor)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `frontend/src/styles/modern-nav-tokens.css` — rewritten (613→190 lines): only modern-nav layout constants in `:root`; flat token-consuming component recipes; ladders + glass deleted.
- `frontend/src/components/copilot/copilot-theme.css` — deleted the dead `.copilot-thread-row:hover` shadow rule (empty after the declaration went; the live `--shadow-lg` drawer shadow at `:125` and the `--copilot-kit-*` aliases stay).
- `frontend/src/components/modern-nav/IconRail/IconButton.tsx` — re-pointed the 3 `var(--icon-rail-active-indicator)/var(--icon-rail-bg)` refs to `var(--accent)/var(--sidebar-bg)`.
- `frontend/src/components/modern-nav/IconRail/IconRail.tsx` — separator gradient → hairline; bottom section HSL gradient + arbitrary shadow → flat surface.
- `frontend/src/components/modern-nav/NavigationShell/NavigationShell.tsx` — radius token swap; tint kept.
- `frontend/src/routes/modern-nav-standalone.tsx` — lucide `Check` checklist via `ReferenceColumn` + arrays; hex prose reworded.

## Deletion-Safety Greps (per-var, recorded)

Every deleted custom property was proven safe before removal (`rg 'var(--<name>)'` outside `styles/modern-nav-tokens.css` + `components/modern-nav/`):

| Deleted group                                                                        | External consumers                                                                                                                                                                                            | Resolves against (survives)                                                                                                       |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `--shadow-xs/sm/md/lg/xl`                                                            | `--shadow-lg` × 6 (intelligence/dossier/signals), `--shadow-sm` (copilot:758 — also deleted)                                                                                                                  | index.css `:root` `--shadow-sm: none`, `--shadow`, `--shadow-lg` (index.css already wins the cascade — currently pixel-identical) |
| `--radius-xs/md/xl/2xl/3xl/full/DEFAULT`                                             | **none**                                                                                                                                                                                                      | internal modern-nav refs re-pointed to `var(--radius-lg)` (index.css 12px) + `9999px` pills                                       |
| `--space-0…16`                                                                       | `--space-2/3/4/6/12` (dossier/signals/relationships)                                                                                                                                                          | index.css `:root` `--space-N` (px, equal at 16px root)                                                                            |
| color tables `--icon-rail-*/--panel-*/--content-*/--badge-*/--success-*/--warning-*` | **none external** (the `bg-panel`/`text-content-text`/`bg-badge`/`text-icon-rail-*` Tailwind classes are undefined no-ops; only real consumers were the tokens-file recipes + IconButton.tsx, all re-pointed) | Linear DS tokens                                                                                                                  |
| `--transition-fast/base/slow/slower`, `--ease-out/in/in-out/bounce`, `--z-*`         | `--transition-base` × 7 in index.css itself                                                                                                                                                                   | index.css `:root` defines `--transition-fast/base/slow` + `--ease-out` identically; `--ease-in-out` inlined at its one use-site   |

Carve-outs byte-untouched: `git diff --name-only` shows **0** hits for `src/index.css`; `design-system/tokens/`, `public/bootstrap.js`, `list-pages.css` `[class~=…]` shim, and `types/*` migration comments were not touched.

## Decisions Made

- **RE-SKIN over delete (D-83-06 locked):** the demo route and component stay; only the parallel ladders and glass die.
- **No-op Tailwind classes left as-is:** `bg-panel`/`text-content-text`/`bg-badge`/etc. have no `@theme` or config mapping so they never resolved to the deleted vars — leaving them is a pre-existing, out-of-scope condition (fixing them is not in this plan). The demo renders with inherited color, which is acceptable for a render-parity-exempt surface.
- **Radius re-point to `var(--radius-lg)` + `9999px`** rather than relying on the deleted local scale or HeroUI's `--radius-xl`/`--radius-full` — makes the recipes dependency-free and satisfies "radii → 6/8/12 + allowlisted pills".

## Deviations from Plan

**None material — plan executed as written.** Two clarifying refinements within plan authority:

- **[Plan discretion — copilot] Deleted the whole now-empty `.copilot-thread-row:hover {}` rule**, not just the declaration line, to avoid leaving an empty CSS block. The only semantic change is still the one dead `--shadow-sm` shadow (the plan's "exactly the one dead box-shadow line" intent is preserved; aliases/pills untouched).
- **[Plan discretion — transitions/z] Deleted the entire `--transition-*`/`--ease-*`/`--z-*` block** (plan gave "keep-or-inline per discretion"): `--transition-fast/base/slow` and `--ease-out` are byte-duplicates of index.css `:root` (and index.css _itself_ consumes `--transition-base`, so it was never modern-nav-owned); the one internal `--ease-in-out` use was inlined as `cubic-bezier(0.4,0,0.2,1)`; the `--z-*`/`--transition-slower`/`--ease-in`/`--ease-bounce` had zero consumers.

## Issues Encountered

- **Root-caused the color-table consumer graph before deleting:** initial concern was that deleting `--panel-*`/`--content-*`/`--badge-*` would break the `bg-panel`/`text-content-text` Tailwind classes across ~10 component files. Verified against `tailwind.config.ts` (no `extend.colors`) and index.css `@theme` (only DS + success/warning) that those classes are **undefined no-ops** — the true var() consumers were confined to the tokens file recipes + IconButton.tsx. Deletion is therefore safe.

## Render Evidence

- **Render-check Chrome (CDP `http://[::1]:9222`) was not running** at execution time. Per the plan's carve-out discipline, screenshots are supporting evidence only and the demo restyle is deliberate + render-parity-exempt; before/after capture is **deferred to the 83-07 human render-parity walk**. The ladder deletion + token re-point (the deliverable) is complete and gate-verified.
- Verified programmatically instead: `pnpm build` exit 0 (12.5s), `pnpm type-check` exit 0, full `pnpm lint` green (ESLint + i18n + duplicate-rtl + **bootstrap-parity byte-match** + date-formatting).

## Verification Results

- DEBT-06 gate: `--shadow-(xs|sm|md|lg|xl):` in modern-nav-tokens.css → **0**; parallel radius/space scale defs → **0**; `hsl(` → **0**; copilot dead shadow → **0**.
- DEBT-05 gate: `bg-gradient-|from-[hsl` in `components/modern-nav` → **0**. Global gradient survivors are exactly the allowlisted set — NavigationShell tint, `globe-loader.css`, `tweaks-drawer.css` hue track + 3 `[mask:…]` fades (masks, out of DEBT-05 scope).
- DEBT-04 gate: numeric arbitrary radii in `components/modern-nav` → **0**.
- DEBT-08: dingbats/`#1A1D26` in standalone route → **0**.
- Blast radius confined to `/modern-nav-standalone` (importer-verified); all other routes pixel-unchanged.

## Next Phase Readiness

- DEBT-04/05/06 modern-nav shares closed; DEBT-06 is the last real parallel ladder — done. Ready for 83-07 (validation / human render-parity walk).
- **Follow-up for 83-07:** capture the `/modern-nav-standalone` before/after render walk when the render-check Chrome is available; optionally retire the no-op `bg-panel`/`text-content-text`/`bg-badge` Tailwind classes in the demo components (pre-existing, out of this plan's scope).

## Self-Check: PASSED

- Files verified on disk: `83-06-SUMMARY.md`, `modern-nav-tokens.css`, `modern-nav-standalone.tsx` — all FOUND.
- Commits verified in git: `7be4eedd`, `05640b23` — both FOUND.

---

_Phase: 83-token-debt-consolidation_
_Completed: 2026-07-04_
