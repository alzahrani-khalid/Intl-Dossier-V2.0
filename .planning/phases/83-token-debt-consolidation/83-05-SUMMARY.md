---
phase: 83-token-debt-consolidation
plan: 05
subsystem: frontend
tags:
  [
    design-tokens,
    shadows,
    radii,
    gradients,
    expandable-card,
    world-map,
    DEBT-02,
    DEBT-03,
    DEBT-04,
    DEBT-05,
  ]
requires:
  - phase: 83-token-debt-consolidation
    provides: dead-code deletion (plan 01) + chart/accent tokens (plan 02)
provides:
  - long-tail-banned-shadow-strip-repo-wide
  - hardcoded-radii-on-token-scale-pixel-identical
  - decorative-gradients-flattened-long-tail
  - expandable-card-literals-on-theme-utilities
  - world-map-token-migration-foldin
affects:
  - frontend/src/pages
  - frontend/src/components/ui
  - frontend/src/components/guided-tours
  - frontend/src/components/milestone-planning
  - frontend/src/styles/list-pages.css
tech-stack:
  added: []
  patterns:
    - 'Banned shadow strip is variant-aware: hover:/focus:/data-[..]:/group-.. prefixes on shadow-(sm|md|xl|2xl) are removed whole; shadow-lg (allowed tier) + hairline borders kept'
    - 'FAB idiom → single static shadow-lg (banned tier + hover escalation dropped); tooltip poppers → bg-popover (surface-3) + hairline, no shadow'
    - 'rounded-[2px] → rounded-xs (HeroUI @theme --radius-xs = calc(var(--radius)*.25) = 2px, byte-identical; verified in fresh dist CSS)'
    - 'CSS on-scale px → token (6→var(--radius-sm), 8→var(--radius), 12→var(--radius-lg)); half-scale 4px→calc(var(--radius)*0.5); canonical rounded-[var(--radius-*)] untouched (Pitfall 1)'
    - 'data-URI SVG colors (dotted-map getSVG) cannot resolve CSS var() — kept literal as rgba()/keywords with a ponytail rationale; live-SVG stroke/label route to tokens'
key-files:
  created:
    - .planning/phases/83-token-debt-consolidation/83-05-SUMMARY.md
  modified:
    - frontend/src/components/ui/context-aware-fab.tsx
    - frontend/src/components/ui/sidebar.tsx
    - frontend/src/components/ui/heroui-tabs.tsx
    - frontend/src/components/ui/floating-action-button.tsx
    - frontend/src/components/ui/file-upload.tsx
    - frontend/src/components/ui/tooltip.tsx
    - frontend/src/components/ui/expandable-card.tsx
    - frontend/src/components/ui/pull-to-refresh-indicator.tsx
    - frontend/src/components/ui/world-map.tsx
    - frontend/src/components/geographic-visualization/WorldMapVisualization.tsx
    - frontend/src/components/layout/Sidebar.tsx
    - frontend/src/components/guided-tours/TourTrigger.tsx
    - frontend/src/components/milestone-planning/MilestonePlannerEmptyState.tsx
    - frontend/src/pages/dossiers/DossierListPage.tsx
    - frontend/src/pages/WorkBoard/board.css
    - frontend/src/pages/Dashboard/widgets/dashboard.css
    - frontend/src/components/calendar/calendar.css
    - frontend/src/components/tweaks/tweaks-drawer.css
    - frontend/src/styles/list-pages.css
decisions:
  - 'A2 confirmed: rounded-xs compiles to 2px — freshly built dist CSS shows .rounded-xs{border-radius:calc(var(--radius) * .25)}; used the named form (not the calc fallback)'
  - 'expandable-card scrim bg-black/20 → bg-bg/60 (the plan-named alternative) — the DEBT-02 palette gate forbids bg-black; scrim renders as a dark backdrop in the app-default dark mode'
  - 'dashboard.css 10px snaps (.week-list panel, .kcard card) → var(--radius-lg) (12px) by surface role; 2px delta, eyeball at 83-07'
  - 'world-map default lineColor #0ea5e9 → var(--accent) (matches what the caller already passes); animated-arc <linearGradient> is functional data-viz — mechanism preserved, visible stops route through the lineColor token'
  - 'world-map dotted-map getSVG colors + label fill kept literal (rgba/keywords) with ponytail rationale — a data-URI <img> SVG cannot resolve CSS var(), and app-mode tokens would invert label/map contrast against the self-contained theme prop'
metrics:
  duration: 21min
  completed: 2026-07-04
  tasks: 3
  files: 75
requirements-completed: []
---

# Phase 83 Plan 05: Shadow + Radius + Gradient Long-Tail Summary

**Stripped every banned card shadow outside the 83-03/04/06 slices (64 files, variant-aware), swapped all hardcoded radii onto the Linear 6/8/12 token scale pixel-identically (canonical `rounded-[var(--radius-*)]` untouched), flattened the remaining decorative gradients, mapped expandable-card's Tailwind literals to `@theme` utilities, and folded in the live `world-map` token migration — 3 atomic commits, all DEBT-03/04/05 grep gates at zero (minus documented carve-outs).**

## Performance

- **Duration:** ~21 min
- **Tasks:** 3
- **Files modified:** 75 unique (T1 shadow 64 · T2 radii 8 · T3 gradients/cards 5)

## Accomplishments

- **DEBT-03 long tail (D-83-03):** removed `shadow-(sm|md|xl|2xl)` across 64 files not owned by another slice. The strip is variant-aware — bare, `hover:`, `focus:`, `focus-visible:`, `group-hover/file:`, and arbitrary `data-[..]:`/`group-data-[..]:` prefixes were all removed whole (the word-boundary gate matches them). FABs (`context-aware-fab` ×2, `floating-action-button`, `OnboardingTourTrigger`) collapsed to a single static `shadow-lg`; tooltip poppers → `bg-popover` (surface-3) + hairline, no shadow. `shadow-lg` (allowed tier) and hairline borders untouched. `WorldMapVisualization.tsx` legend `shadow-sm` stripped (fold-in), its selected-country `shadow-lg` kept.
- **DEBT-04 (D-83-04):** `rounded-[2px]` → `rounded-xs` (Sidebar active-bar, tooltip arrow, file-upload swatch) — **A2 verified**: the fresh dist CSS emits `.rounded-xs{border-radius:calc(var(--radius) * .25)}` = 2px, byte-identical. CSS on-scale px → tokens across board/dashboard/calendar/tweaks-drawer/list-pages; half-scale 4px → `calc(var(--radius) * 0.5)`; the two off-scale 10px sites snapped to `var(--radius-lg)`. Canonical `rounded-[var(--radius-*)]` forms, pills (99/999/9999px), and micro radii (1-3px) all left untouched (Pitfall 1).
- **DEBT-05 long tail (D-83-05):** `TourTrigger` (×2), `MilestonePlannerEmptyState`, `pull-to-refresh-indicator` decorative gradients flattened to `bg-accent/5` / `bg-accent-soft` / `bg-muted/30`. The allowlist (tweaks-drawer hue-picker track, globe-loader radial glow, all masks) is byte-untouched.
- **DEBT-02 expandable-card (D-83-02):** 11 Tailwind literals → `@theme` utilities (`text-ink`, `text-ink-mute`, `bg-surface-4` modal card + close button, `bg-accent`/`text-accent-fg` CTA pill, `hover:bg-surface-raised`, `bg-bg/60` scrim); the `[mask:...]` fade preserved.
- **world-map fold-in:** default `lineColor` `#0ea5e9` → `var(--accent)`; dotted-map `getSVG` dot/bg colors kept literal as `rgba()`/CSS keywords with a `ponytail:` rationale (a data-URI `<img>` SVG is an isolated document that cannot resolve CSS `var()`); label fill `#fff`/`#000` → `white`/`black` keyword (keyed to the self-contained `theme` prop — app-mode tokens would invert contrast); the animated connection-arc `<linearGradient>` is functional data-viz — its mechanism is preserved and its visible stops route through the `lineColor` token. **Zero raw hex remains** in `world-map.tsx` and `WorldMapVisualization.tsx`.

## Task Commits

1. **Task 1: DEBT-03 long-tail shadow strip + FAB judgment** — `92ad36ff` (refactor)
2. **Task 2: DEBT-04 radii — TSX rounded-[2px] + CSS px literals** — `3a980821` (refactor)
3. **Task 3: DEBT-05 gradients + DEBT-02 expandable-card + world-map fold-in** — `b36028c0` (refactor)

## Shadow strip-list (Task 1 evidence)

Generated mechanically from the exclusion-scoped grep (66 files matched; `list-pages.css` shim + `KanbanCard.test.tsx` assertion excluded as carve-outs → 64 files stripped). Full list preserved at `scratchpad/83-05-shadow-striplist.txt`. Top offenders: `type-specific-fields/TypeSpecificFields.tsx` (11), `pages/dossiers/DossierListPage.tsx` (9), `router/index.tsx` (3), `ui/sidebar.tsx` (3). The remainder are 1-2 each across pages/, components/ui/, forms/, empty-states/, guided-tours/, cards, and list rows.

## Decisions Made

- **A2 (`rounded-xs`):** used the named utility rather than the `rounded-[calc(var(--radius)*0.25)]` fallback — `--radius-xs` is registered in the `@theme` namespace and the post-commit build emitted `.rounded-xs{border-radius:calc(var(--radius) * .25)}` (2px), proving pixel-identity. Satisfies the `contains: rounded-xs` artifact check on Sidebar.tsx.
- **Scrim (`bg-black/20` → `bg-bg/60`):** the DEBT-02 gate forbids `bg-black`; `bg-bg/60` is the plan's named alternative and reads as a dark modal backdrop in the app-default dark mode.
- **10px snap → `var(--radius-lg)`:** both sites (`.week-list` list panel, `.kcard` card) are surface containers → snap up to 12px by role (research §DEBT-04). 2px delta, flagged for the 83-07 eyeball.
- **world-map colors:** `lineColor` default routed to `var(--accent)` (the value the sole caller already passes). The dotted-map base colors and label fill stay literal — a data-URI SVG can't see CSS vars, and the labels are keyed to the component's self-contained `theme` prop (which the caller pins to `light`), so app-mode tokens would flip label/map contrast. Each literal carries a `ponytail:` comment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Variant-aware strip broke 4 arbitrary-variant shadow sites**

- **Found during:** Task 1 (scripted shadow strip)
- **Issue:** the initial strip regex removed `shadow-sm` but left dangling arbitrary-variant prefixes (`group-data-[variant=inset]:`, `data-[active=true]:`, `data-[state=active]:`) in `ui/sidebar.tsx` (2), `ui/heroui-tabs.tsx` (1), and `pages/my-work/components/WorkItemTabs.tsx` (1) — the variant character class did not include `[`/`]`/`=`.
- **Fix:** reverted those files and re-stripped the full `<arbitrary-variant>:shadow-sm` token by hand; re-scanned the whole change set for dangling `]:` artifacts (0 remain).
- **Files modified:** ui/sidebar.tsx, ui/heroui-tabs.tsx, pages/my-work/components/WorkItemTabs.tsx
- **Verification:** type-check exit 0; lint clean; gate returns 0 banned shadows in scope.
- **Committed in:** `92ad36ff` (Task 1 commit)

### Folded-in scope

**world-map token migration** — `ui/world-map.tsx` + `WorldMapVisualization.tsx` were assumed dead by 83-01 but are LIVE (`/geographic-visualization` route → lazy `ui/world-map`). Their unowned token debt (2+ hex, self-contained theme colors) was cleaned here so 83-07's tightened ESLint (raw hex allowed only in the 3 palette holders) does not choke. Both files carry zero unowned raw hex; anything intentionally literal has a `ponytail:` rationale.

## Carve-outs Honored

- `styles/list-pages.css`: exactly one line changed (:294 `border-radius: 8px` → `var(--radius)`); `git diff --numstat` = `1+1`; the `[class~=…]` compat shim (`grep -c 'class~'` on the diff = 0) is byte-identical.
- `types/*.ts` migration comments, `design-system/tokens/`, `index.css` `:root`, `public/bootstrap.js` — untouched.
- Radii: canonical `rounded-[var(--radius-*)]` (`git diff | grep -c 'rounded-\[var('` = 0), pills, and micro 1-3px radii all preserved.
- Gradient allowlist (`tweaks-drawer.css` hue track, `globe-loader.css` glow, masks) byte-untouched.

## Gate Results

- DEBT-03: `rg 'shadow-(sm|md|xl|2xl)' src -g'!index.css' -g'!modern-nav*' -g'!copilot'` → 2 remaining, both carve-outs (`list-pages.css:1367` shim selector, `KanbanCard.test.tsx:74` `.not.toMatch` assertion). No card shadow remains.
- DEBT-04: `rg 'rounded-(s-|e-|t-|b-)?\[[0-9]' src` → 1 (`NavigationShell rounded-e-[12px]` = 83-06-owned). Target CSS files: 0 `border-radius: 6|8|10|12px` literals.
- DEBT-05: `rg 'bg-gradient-|linear-gradient|radial-gradient' src` (minus masks + modern-nav) → 2, both allowlisted (`globe-loader.css` glow, `tweaks-drawer.css` hue track).
- `(cd frontend && pnpm type-check)` → exit 0. Lint clean on all touched files. `vitest run tests/unit/design-system/` → 181/181 passed. Pre-commit `pnpm build` → frontend `✓ built in 12.07s`.

## Known Stubs

None introduced.

## Threat Flags

None. Class/CSS-value swaps in presentation files only — no new inputs, endpoints, deps, or data paths. T-83-05 (list-pages.css shim) mitigated via the surgical single-line edit + byte-identity check.

## Next Phase Readiness

- DEBT-03/04/05 are closed for every slice except 83-06 (modern-nav/copilot). Requirement-level completion is deferred to 83-06/83-07 — not marked complete here since the modern-nav slice still holds banned shadows/radii/gradients.
- `world-map` + `WorldMapVisualization` are token-clean and ready for 83-07's tightened ESLint.
- Render-parity eyeballs deferred to 83-07: the two 10px→12px radius snaps, the shadow removals, the 4 gradient flattens, and the world-map arc/label rendering.

## Self-Check: PASSED

- Commits verified present: `92ad36ff`, `3a980821`, `b36028c0`
- Key files verified on disk (19 listed + SUMMARY)
- Gates re-run at expected values (DEBT-03/04/05 minus documented carve-outs); type-check exit 0; design-system vitest 181/181; A2 proven in built CSS
- Carve-outs byte-verified (list-pages.css shim 1+1 line, canonical rounded-[var( untouched, gradient allowlist untouched)

---

_Phase: 83-token-debt-consolidation_
_Completed: 2026-07-04_
