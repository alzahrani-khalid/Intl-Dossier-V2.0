---
phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties
plan: 01
subsystem: ui
tags: [rtl, i18n, radix, direction-provider, react, useSyncExternalStore]

# Dependency graph
requires:
  - phase: 75-ui-component-migration-audit
    provides: direction-owner surface classification (75-AUDIT), per-file keep-custom tiers
provides:
  - ui/direction.tsx DirectionProvider — the single runtime dir/lang write-site, i18n-derived, bridged into html + Radix direction context (same-commit)
  - '@radix-ui/react-direction 1.1.2 installed (RTLB-01/02 portal-direction bridge)'
  - 4 legacy direction setters demoted to non-writing consumers (i18n/index.ts, LanguageProvider, DesignProvider.setLocale, RTLWrapper deleted)
  - AppShell drawer placement now reads the same-commit Radix direction context, not a render-time document.dir read
affects: [76-02, 76-03, 76-04, 76-05, 77-token-migration]

# Tech tracking
tech-stack:
  added: ['@radix-ui/react-direction@1.1.2']
  patterns:
    - "Single direction owner: useSyncExternalStore(i18n 'languageChanged') → useLayoutEffect DOM write + RadixDirectionProvider bridge in one commit"
    - 'Consumers read the Radix direction context via useDirection() instead of render-time document.dir reads (same-commit fresh)'

key-files:
  created:
    - frontend/src/components/ui/direction.tsx
    - frontend/src/components/ui/__tests__/direction.test.tsx
  modified:
    - frontend/package.json
    - pnpm-lock.yaml
    - frontend/src/App.tsx
    - frontend/src/i18n/index.ts
    - frontend/src/components/language-provider/language-provider.tsx
    - frontend/src/design-system/DesignProvider.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/components/layout/AppShell.test.tsx
    - frontend/src/components/layout/AppShell.a11y.test.tsx
    - frontend/src/components/tweaks/persistence.test.tsx
  deleted:
    - frontend/src/components/rtl-wrapper/RTLWrapper.tsx

key-decisions:
  - "Authored ui/direction.tsx from RESEARCH Pattern 1 + a direct pnpm add, skipping `shadcn add direction` to avoid components.json churn before Plan 76-04's isolated migrate commit"
  - "AppShell derives isRTL from Radix useDirection() context (same-commit fresh) rather than a render-time document.dir read, which would be one frame stale once the DOM write moved into the owner's layout effect"
  - "persistence.test.tsx's two setLocale→document.dir/lang assertions removed (Rule 1) — that behavior moved to the DirectionProvider owner; localStorage round-trip assertion retained"

patterns-established:
  - 'Single direction owner (RTLB-01 owner half): one i18n-derived write-site + Radix bridge, no coexisting second owner'
  - 'Whitelisted non-owner dir writers: bootstrap.js pre-paint set + ThemeErrorBoundary crash-fallback'

requirements-completed: [RTLB-01]

# Metrics
duration: 15min
completed: 2026-07-02
---

# Phase 76 Plan 01: Single Direction Owner (RTLB-01) Summary

**`ui/direction.tsx` DirectionProvider is now the sole runtime `<html dir/lang>` writer — i18n-derived via `useSyncExternalStore`, bridged into Radix's direction context in the same React commit — with all 4 legacy setters demoted and RTLWrapper deleted.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-02T13:44:16Z
- **Completed:** 2026-07-02T13:59:44Z
- **Tasks:** 2 (Task 1 TDD: chore→RED→GREEN; Task 2 consolidation)
- **Files modified:** 12 (2 created, 9 modified, 1 deleted)

## Accomplishments

- Installed `@radix-ui/react-direction@1.1.2` (exact pin; RESEARCH package audit [OK], no postinstall).
- Created `DirectionProvider` (RESEARCH Pattern 1): derives `dir` from `i18n.language` via `useSyncExternalStore` on `languageChanged`, performs the only runtime `<html dir/lang>` write in `useLayoutEffect`, and bridges the same value into `RadixDirectionProvider` — proven same-commit by a 3-case unit test (derivation, ar-flip A3, round-trip).
- Demoted all 4 legacy writers to non-writing consumers: removed 3 DOM-write sites in `i18n/index.ts`, 4 `document.documentElement` writes in `LanguageProvider` (2 effects), the sync write block in `DesignProvider.setLocale` (Pitfall 4), and deleted `RTLWrapper.tsx` (zero remaining refs, no CSS/test dependents).
- Switched `AppShell` drawer placement to read the Radix direction context via `useDirection()` (same-commit fresh) instead of a render-time `document.dir` read; deleted the orphaned `readDocumentDir` and refreshed the stale "LanguageProvider keeps lockstep" docstring.
- Verified zero seeded-locale cold-load regression: `rtl-switching.spec.ts` green for both `id.locale=ar` (dir=rtl) and `id.locale=en` (dir=ltr).

## Task Commits

1. **Task 1 (dep):** `bcb5096e` — chore(76-01): install @radix-ui/react-direction 1.1.2
2. **Task 1 (RED):** `226def05` — test(76-01): add failing same-commit DirectionProvider owner test
3. **Task 1 (GREEN):** `b324e360` — feat(76-01): add DirectionProvider single direction owner (RTLB-01)
4. **Task 2:** `509716f3` — refactor(76-01): make DirectionProvider the sole dir owner; demote 4 legacy setters
5. **Task 2 (deviation fix):** `9065e08e` — test(76-01): align tweaks persistence test with demoted setLocale

**Plan metadata:** docs(76-01) commit (SUMMARY + STATE + ROADMAP)

## Files Created/Modified

- `frontend/src/components/ui/direction.tsx` — DirectionProvider single direction owner (created)
- `frontend/src/components/ui/__tests__/direction.test.tsx` — same-commit owner unit test, 3 cases (created)
- `frontend/package.json` / `pnpm-lock.yaml` — @radix-ui/react-direction 1.1.2
- `frontend/src/App.tsx` — DirectionProvider mounted in RTLWrapper's old slot
- `frontend/src/i18n/index.ts` — 3 DOM-write sites removed; getDirection/isRTL/detector/default kept
- `frontend/src/components/language-provider/language-provider.tsx` — 4 DOM writes removed; setDirection state + localStorage + events kept
- `frontend/src/design-system/DesignProvider.tsx` — setLocale sync document write removed; persistence + i18n delegation + designChange kept
- `frontend/src/components/layout/AppShell.tsx` — isRTL from Radix context; readDocumentDir deleted; docstring refreshed
- `frontend/src/components/layout/AppShell.test.tsx` / `AppShell.a11y.test.tsx` — RTL cases wrapped in RadixDirectionProvider (setAttribute lines kept)
- `frontend/src/components/tweaks/persistence.test.tsx` — obsolete setLocale→dir/lang assertions removed (deviation)
- `frontend/src/components/rtl-wrapper/RTLWrapper.tsx` — deleted

## Decisions Made

- Authored `direction.tsx` from RESEARCH Pattern 1 + a direct `pnpm add` instead of `shadcn add direction`, to avoid `components.json` churn before Plan 76-04's isolated `migrate rtl` commit (documented discretion note in the plan).
- `AppShell` reads the Radix direction context, not `document.dir`: once the DOM write moved into the owner's `useLayoutEffect`, a render-time `document.dir` read (triggered by the same `languageChanged` batch) would run before the layout effect and read the stale direction, opening the drawer from the wrong physical edge after a live toggle.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `tweaks/persistence.test.tsx` asserted the removed `setLocale`→DOM write**

- **Found during:** Task 2 (post-edit regression sweep of tests touching `document.documentElement.dir`)
- **Issue:** The `round-trip: id.locale en/ar` test rendered `DesignProvider` alone and asserted `setLocale('ar')` synchronously set `document.documentElement.dir='rtl'`/`lang='ar'`. Plan 76-01 intentionally removes that sync write (RESEARCH Pitfall 4), so the assertion failed. The plan's interfaces block mischaracterized this file as only "setting dir/lang to simulate the owner" — it actually asserted the write. `persistence.test.tsx` is not in `files_modified`.
- **Fix:** Removed the two obsolete `document.documentElement.dir/lang` assertions; retained the `storage.get('id.locale') === 'ar'` persistence assertion (still setLocale's responsibility). The same-commit dir/lang flip is fully covered by the new `ui/__tests__/direction.test.tsx`.
- **Files modified:** frontend/src/components/tweaks/persistence.test.tsx
- **Verification:** `vitest run persistence.test.tsx` → 6/6 pass; the a11y/other `documentElement.dir` tests confirmed to only _assign_ dir (setup), not assert a setter write.
- **Committed in:** `9065e08e`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug).
**Impact on plan:** Test-only alignment with the plan's intentional behavior change; no production-scope change. All plan verification gates pass.

## Issues Encountered

None — plan executed as written apart from the one test-alignment deviation above.

## User Setup Required

None - no external service configuration required.

## Verification Results

- `vitest run ui/__tests__/direction.test.tsx` — 3/3 green (derivation, ar same-commit flip A3, round-trip)
- Single WRITE-site gate — prints exactly `frontend/src/components/ui/direction.tsx`
- setAttribute('dir' non-test gate — only `ThemeErrorBoundary.tsx` (whitelisted crash-fallback)
- RTLWrapper gate — 0 refs in `frontend/src`+`frontend/tests`; file deleted
- `vitest run AppShell.test.tsx AppShell.a11y.test.tsx persistence.test.tsx` — green (18 tests)
- `playwright test tests/e2e/rtl-switching.spec.ts` — 2/2 green (seeded id.locale ar→rtl, en→ltr)
- `pnpm type-check` — exit 0
- `pnpm run lint` — exit 0 (eslint --max-warnings 0 + i18n namespace check)
- `git diff frontend/public/bootstrap.js` — empty (byte-match invariant untouched); 68 per-field `dir="rtl"` attributes untouched

## Next Phase Readiness

- RTLB-01 **owner half** satisfied: exactly one i18n-derived runtime write-site, bridged into `<html>` + Radix context, same-commit by construction (unit-proven). The wrapper-default cleanup half of RTLB-01 (dropping the 8 `?? getDocDir()` defaults) is Plan 76-03.
- Ready for **76-02** (duplicate-`rtl:` CI guard). 76-03 builds directly on this owner (portal same-frame + per-portal edge e2e).
- No blockers.

## Self-Check: PASSED

- Created files verified on disk: `ui/direction.tsx`, `ui/__tests__/direction.test.tsx`, `76-01-SUMMARY.md`.
- Task commits verified in git log: `bcb5096e`, `226def05`, `b324e360`, `509716f3`, `9065e08e`.
- `RTLWrapper.tsx` deletion confirmed. All plan verification gates re-run green.

---

_Phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties_
_Completed: 2026-07-02_
