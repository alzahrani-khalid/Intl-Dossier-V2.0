---
phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties
plan: 03
subsystem: ui
tags: [rtl, i18n, radix, direction-provider, react, vite, playwright, e2e]

# Dependency graph
requires:
  - phase: 76-01
    provides: ui/direction.tsx DirectionProvider (single runtime dir owner bridged into @radix-ui/react-direction context)
provides:
  - 8 Radix wrappers inherit direction from the DirectionProvider context (dir={dir}, no getDocDir() default)
  - getDocDir() removed from lib/utils.ts (orphaned by this change; cn retained)
  - Vite resolve.dedupe for @radix-ui/react-direction so the singleton direction context is shared (was silently duplicated in dep pre-bundling)
  - direction-portals.spec.ts — same-frame document+portal flip + portal edge-correctness e2e (RTLB-02, Wave 0 gap)
  - rtl-switching.spec.ts extended with a live topbar-toggle case (html dir + id.locale both directions)
affects: [77-shadcn-logical-properties, any-phase-touching-radix-portals-or-rtl]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Radix wrappers pass dir={dir} (undefined by default) → direction resolves from the DirectionProvider context, never a render-time document.dir read'
    - 'Singleton React context libs (react-direction) MUST be in Vite resolve.dedupe or dep pre-bundling forks the context'
    - 'Same-frame flip proof: rAF-gated page.evaluate reads <html> and portal direction in ONE frame'

key-files:
  created:
    - frontend/tests/e2e/direction-portals.spec.ts
  modified:
    - frontend/src/components/ui/accordion.tsx
    - frontend/src/components/ui/dropdown-menu.tsx
    - frontend/src/components/ui/heroui-tabs.tsx
    - frontend/src/components/ui/navigation-menu.tsx
    - frontend/src/components/ui/scroll-area.tsx
    - frontend/src/components/ui/select.tsx
    - frontend/src/components/ui/slider.tsx
    - frontend/src/components/ui/toggle-group.tsx
    - frontend/src/lib/utils.ts
    - frontend/vite.config.ts
    - frontend/tests/e2e/rtl-switching.spec.ts

key-decisions:
  - 'Dropped dir={dir ?? getDocDir()} → dir={dir} in all 8 wrappers; kept the dir prop in every signature so per-instance overrides (LtrIsolate) survive'
  - 'Deleted getDocDir() from lib/utils.ts only after the scoped grep confirmed zero remaining importers; cn untouched'
  - "Added resolve.dedupe:['@radix-ui/react-direction'] (deviation) — the ONLY way to make the DirectionProvider→portal bridge actually reach Radix Menu, which sets an explicit dir from context"

patterns-established:
  - 'Context-derived direction defaults for Radix wrappers (RTLB-01/02)'
  - 'rAF-gated same-frame portal-direction assertion pattern for RTL e2e'

requirements-completed: [RTLB-01, RTLB-02]

# Metrics
duration: 28min
completed: 2026-07-02
---

# Phase 76 Plan 03: Radix wrappers inherit direction from context; portal e2e proof Summary

**All 8 Radix wrappers now resolve direction from the DirectionProvider context (getDocDir removed), and a new e2e spec proves same-frame document+portal flip and portal edge-correctness in both directions — after fixing a Vite dep-duplication that silently forked the Radix direction context.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-07-02T14:22:00Z
- **Completed:** 2026-07-02T14:49:46Z
- **Tasks:** 2
- **Files modified:** 11 (10 modified + 1 created)

## Accomplishments

- Replaced `dir={dir ?? getDocDir()}` with `dir={dir}` in accordion, dropdown-menu, heroui-tabs, navigation-menu, scroll-area, select, slider, toggle-group — the DirectionProvider context (Plan 76-01) now supplies the default; per-instance `dir` overrides still work.
- Deleted the orphaned `getDocDir()` helper from `lib/utils.ts` (scoped grep = 0 importers); `cn` retained.
- **Root-caused and fixed a latent RTL regression** that dropping `getDocDir()` exposed: Vite's dep pre-bundling loaded `@radix-ui/react-direction` as two module instances → two `DirectionContext` objects → the owner wrote `rtl` to one and Radix Menu read the other (default `ltr`), so AR dropdowns rendered LTR. Fixed with `resolve.dedupe`.
- Added `direction-portals.spec.ts` (5 cases) proving same-frame `<html>` flip, portal-open-across-toggle, portal-opened-after-toggle edge correctness (dropdown + Sheet drawer geometry), `?lng=ar` cold-load over a conflicting seeded `id.locale`, and the DossierShell Export **Tooltip** portal opening RTL in AR.
- Extended `rtl-switching.spec.ts` with a live topbar-toggle case (asserts `html[dir]` and `id.locale` persistence both directions), keeping the two seeded tests.

## Task Commits

1. **Task 1: Drop getDocDir() defaults; delete the orphaned helper** — `3f45d964` (refactor)
2. **Deviation: dedupe @radix-ui/react-direction** — `7a90fccb` (fix)
3. **Task 2: direction-portals.spec.ts + extend rtl-switching.spec.ts** — `49e1ee0a` (test)

## Files Created/Modified

- `frontend/src/components/ui/{accordion,dropdown-menu,heroui-tabs,navigation-menu,scroll-area,select,slider,toggle-group}.tsx` — `dir={dir}`; dropped `getDocDir` import
- `frontend/src/lib/utils.ts` — removed `getDocDir()` + JSDoc; `cn` retained
- `frontend/vite.config.ts` — `resolve.dedupe: ['@radix-ui/react-direction']`
- `frontend/tests/e2e/direction-portals.spec.ts` — new 5-case RTLB-01/02 proof
- `frontend/tests/e2e/rtl-switching.spec.ts` — live topbar-toggle case added

## Decisions Made

- Kept the `dir` prop in every wrapper signature (Radix prop overrides context when defined) so `LtrIsolate`-style per-instance overrides survive — matches the Phase 75 "dir wiring must survive reskin" audit intent.
- Removed `getDocDir()` from `lib/utils.ts` only after zero importers remained.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vite duplicated the Radix direction context; dropdown/select/menu portals rendered LTR in AR**

- **Found during:** Task 2 (running direction-portals cases 2 & 3)
- **Issue:** With `getDocDir()` removed, the dropdown-menu content rendered `dir="ltr"` in AR even though `<html>`, `<body>`, and the owner all reported `rtl`. Live instrumentation confirmed the owner's `RadixDirectionProvider` value WAS `rtl` (`data-owner-dir="rtl"`) yet the dropdown's `useDirection()` returned `ltr`. Cause: Vite's dep pre-bundling loaded `@radix-ui/react-direction` twice (standalone + bundled inside `@radix-ui/react-dropdown-menu`), producing two `DirectionContext` objects. `getDocDir()` had masked this by reading `document.dir` at render time. The production Rollup build dedupes to one physical copy, so this bit the dev server (and the local e2e gate); the dedupe makes dev match prod and hardens the bridge.
- **Fix:** Added `resolve.dedupe: ['@radix-ui/react-direction']` to `frontend/vite.config.ts`, killed the stale dev server, cleared `node_modules/.vite`, re-verified: owner `dir=rtl` AND dropdown-menu-content `dir=rtl` in AR.
- **Files modified:** frontend/vite.config.ts
- **Verification:** Live probe (owner vs portal dir) + full e2e gate 10/10 green.
- **Committed in:** `7a90fccb`

---

**Total deviations:** 1 auto-fixed (1 blocking). **Impact:** Necessary for the plan's core success criterion — the single direction owner could not reach Radix Menu/Select/Dropdown portals without it. No scope creep; `resolve.dedupe` is a minimal, standard singleton-context fix.

## Issues Encountered

None beyond the deviation above (which was root-caused and fixed).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- RTLB-01 and RTLB-02 are e2e-proven: same-frame document+portal flip in both directions; Dropdown/Select, Tooltip, and the Sheet drawer each directly asserted to open from the inline-start-correct edge in AR; Popover shares the identical Radix direction-context mechanism.
- Zero non-context direction defaults remain on Radix wrappers.
- Note: the local dev server on :5173 was restarted during the dedupe fix (Playwright auto-starts one for the e2e gate). Any developer with a long-running dev server should restart it once to pick up the new `resolve.dedupe` (and clear `node_modules/.vite` if portals still look LTR).

## Verification

- `grep -rln "getDocDir" frontend/src --include='*.ts' --include='*.tsx'` → 0
- `cd frontend && pnpm type-check` → 0 errors
- `pnpm exec vitest run src/components/ui/__tests__/direction.test.tsx` → 3/3 pass
- `pnpm exec playwright test direction-portals.spec.ts rtl-switching.spec.ts dossier-drawer-rtl.spec.ts` → 10/10 pass

## Self-Check: PASSED

- `frontend/tests/e2e/direction-portals.spec.ts` exists on disk (189 lines) — FOUND
- Commits `3f45d964`, `7a90fccb`, `49e1ee0a` present in `git log` — FOUND
- All acceptance criteria (grep 0, `dir={dir}` ×8, `cn` exported, ltr-isolate untouched, rAF/data-lang/tooltip-content present, 10/10 e2e) — PASS

---

_Phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties_
_Completed: 2026-07-02_
