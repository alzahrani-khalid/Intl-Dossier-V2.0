---
phase: 34
plan: 08
plan_id: 34-08
subsystem: design-system-cleanup
tags: [theme-04, cleanup, deletion-sweep, useTheme-migration, language-toggle-removal]
status: complete
requires:
  - 34-04 # DesignProvider landing
  - 34-06 # Tweaks drawer
  - 34-07 # /themes redirect
provides:
  - 'Single locus of UI-preference control: the Tweaks drawer'
  - 'Zero legacy useTheme / ThemeProvider / LanguageToggle / LanguageSwitcher references'
  - 'CI gate (scripts/check-deleted-components.sh) exits 0'
affects:
  - frontend/src/App.tsx (sole DesignProvider wiring)
  - frontend/src/design-system/DesignProvider.tsx (doc cleanup)
tech-stack:
  added: []
  patterns:
    - 'Retrofit consumers to direct DesignProvider hooks (useMode, useDesignDirection) instead of compat shim'
    - 'Seed id.locale via addInitScript in Playwright (replaces dropdown click flow)'
key-files:
  created: []
  modified:
    - frontend/src/App.tsx
    - frontend/src/design-system/DesignProvider.tsx
    - frontend/src/providers/design-compliance-provider.tsx
    - frontend/src/components/modern-nav/IconRail/IconRail.tsx
    - frontend/src/pages/settings/SettingsPage.tsx
    - frontend/src/components/responsive/responsive-table.tsx
    - frontend/src/components/responsive/responsive-card.tsx
    - frontend/src/components/responsive/responsive-nav.tsx
    - frontend/src/components/layout/SiteHeader.tsx
    - frontend/src/components/layout/Header.tsx
    - frontend/src/components/layout/AppSidebar.tsx
    - frontend/src/auth/LoginPageAceternity.tsx
    - frontend/src/routes/_protected/responsive-demo.tsx
    - frontend/src/components/modern-nav/navigationData.ts
    - frontend/tests/e2e/rtl-switching.spec.ts
  deleted:
    - frontend/src/pages/Themes.tsx
    - frontend/src/components/language-toggle/LanguageToggle.tsx
    - frontend/src/components/language-switcher/LanguageSwitcher.tsx
    - frontend/src/components/language-switcher/language-switcher.tsx
    - frontend/src/components/ui/theme-toggle.tsx
    - frontend/src/hooks/useTheme.ts
    - frontend/src/components/theme-provider/theme-provider.tsx
decisions:
  - 'ThemeSelector.tsx (listed in plan deletion set) was already absent — no delete action needed'
  - 'Pre-existing TS6133/TS6196 unused-declaration warnings in src/types/* and src/utils/* are out of scope (per executor scope boundary); they pre-date 34-08'
metrics:
  duration_minutes: ~45 (split across 2 executors — 3 commits by prior, 1 commit by continuation)
  completed: 2026-04-21
  commits: 4
  files_modified: 15
  files_deleted: 7
---

# Phase 34 Plan 08: THEME-04 Final Cleanup Summary

Final sweep of Phase 34 — retrofits 6 `useTheme` consumers to direct DesignProvider hooks, strips 5 LanguageToggle/LanguageSwitcher render sites, purges the `/themes` nav entry, rewires the rtl-switching E2E to seed `id.locale` via `addInitScript`, and deletes 7 legacy UI-preference files. After this plan, the codebase has exactly one locus of UI-preference control (the Tweaks drawer), the CI gate `scripts/check-deleted-components.sh` exits 0, and the Phase 34 cleanup is complete.

## Commits

| SHA        | Message                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| `9d00ce83` | `refactor(34-08): migrate 6 useTheme consumers to DesignProvider hooks`                                     |
| `561325c1` | `chore(34-08): strip LanguageToggle/LanguageSwitcher render sites + purge /themes nav entry`                |
| `66d65281` | `test(34-08): seed id.locale directly instead of clicking LanguageSwitcher`                                 |
| `9f8f653e` | `chore(34-08): delete legacy ThemeProvider/useTheme shim, Themes page, language-switcher/toggle duplicates` |

## Files changed

### Retrofitted consumers (6) — `useTheme` shim → direct DesignProvider hooks

- `frontend/src/providers/design-compliance-provider.tsx` — `useDesignDirection` + `useMode`
- `frontend/src/components/modern-nav/IconRail/IconRail.tsx` — `useMode`
- `frontend/src/pages/settings/SettingsPage.tsx` — `useMode`
- `frontend/src/components/responsive/responsive-table.tsx` — `useDesignDirection`
- `frontend/src/components/responsive/responsive-card.tsx` — `useDesignDirection`
- `frontend/src/components/responsive/responsive-nav.tsx` — `useDesignDirection`

### Render-site strips (5) + nav entry removal (1)

- `frontend/src/components/layout/SiteHeader.tsx` — dropped `<LanguageToggle />`
- `frontend/src/components/layout/Header.tsx` — dropped `<LanguageToggle />`
- `frontend/src/components/layout/AppSidebar.tsx` — dropped `<LanguageToggle />`
- `frontend/src/auth/LoginPageAceternity.tsx` — dropped `<LanguageSwitcher />`
- `frontend/src/routes/_protected/responsive-demo.tsx` — dropped `<LanguageToggle />` (and `<LanguageSwitcher />` if present)
- `frontend/src/components/modern-nav/navigationData.ts` — removed `/themes` nav entry

### E2E rewiring (1)

- `frontend/tests/e2e/rtl-switching.spec.ts` — replaced LanguageSwitcher click flow with `page.addInitScript` seeding `localStorage['id.locale']`

### App.tsx + DesignProvider.tsx (final sweep commit)

- `frontend/src/App.tsx` — removed `ThemeProvider` wrapper + its import; `DesignProvider` now sole UI-preference root
- `frontend/src/design-system/DesignProvider.tsx` — doc comment cleanup (dropped dangling reference to deleted `theme-provider.tsx`)

### Deletions (7 legacy files)

- `frontend/src/pages/Themes.tsx`
- `frontend/src/components/language-toggle/LanguageToggle.tsx`
- `frontend/src/components/language-switcher/LanguageSwitcher.tsx`
- `frontend/src/components/language-switcher/language-switcher.tsx`
- `frontend/src/components/ui/theme-toggle.tsx`
- `frontend/src/hooks/useTheme.ts`
- `frontend/src/components/theme-provider/theme-provider.tsx`

## Tasks completed

| Plan task                                                            | Commit(s)              | Status                           |
| -------------------------------------------------------------------- | ---------------------- | -------------------------------- |
| Task 1 — Retrofit useTheme consumers to DesignProvider hooks         | `9d00ce83`             | done                             |
| Task 2 — Strip LanguageToggle render sites + purge /themes nav entry | `561325c1`, `9f8f653e` | done                             |
| Task 3 — Update rtl-switching.spec.ts to seed id.locale              | `66d65281`             | done                             |
| Task 4 — Delete 8 legacy files + confirm CI gate                     | `9f8f653e`             | done (7 actual — see Deviations) |

## Verification

| Gate                                                                                                                                  | Result                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `bash scripts/check-deleted-components.sh`                                                                                            | PASS — "zero references to deleted Phase 34 components" |
| `cd frontend && pnpm build`                                                                                                           | PASS — `✓ built in 11.91s`                              |
| `cd frontend && pnpm exec vitest run src/components/tweaks src/design-system/directionDefaults.test.ts src/i18n/label-parity.test.ts` | PASS — 4 files / 15 tests green                         |
| `cd frontend && pnpm exec vitest run tests/bootstrap/migrator.test.ts`                                                                | PASS — 1 file / 9 tests green                           |
| `grep -rn "from.*useTheme\|from.*theme-provider\|from.*language-toggle\|from.*language-switcher" frontend/src`                        | PASS — 0 matches                                        |

## Deviations

1. **Plan listed 8 deletions; only 7 files existed on disk.** `frontend/src/components/theme-selector/ThemeSelector.tsx` was already absent from the repo at plan-execution time (likely removed in an earlier wave). No `git rm` was needed. The CI gate's deletion pattern already covers `ThemeSelector` references and exits 0, confirming no residue.

2. **Pre-existing TS6133 / TS6196 unused-declaration warnings remain in unrelated files** (`src/types/*`, `src/utils/*`, and two symbols in files this plan touched — `getAllNavigationItems` and `ResponsiveDataGrid`, both pre-existing unused exports per `git show 6ead7a8e`). Per executor scope boundary (only auto-fix issues DIRECTLY caused by current task's changes), these are out of scope. They do NOT block build (`pnpm build` exits 0 — the project uses `pnpm build` as the deployment gate, not strict `pnpm type-check`).

3. **Continuation split across 2 executor sessions.** Prior executor landed 3 commits (`9d00ce83`, `561325c1`, `66d65281`) but paused before committing the final deletions + App.tsx/DesignProvider.tsx cleanup. This continuation executor landed the 4th commit (`9f8f653e`) and the SUMMARY. Plan intent preserved; no scope widening.

4. **`frontend/test-results/.last-run.json` intentionally left unstaged.** Transient Playwright runner output not part of plan artifacts.

## Phase 34 Closure

Plan 34-08 is the **final plan of Phase 34 Wave 4**. With its completion:

- Tweaks drawer is the sole locus of UI-preference control (mode, direction, hue, density, language)
- Legacy `useTheme` shim, `ThemeProvider`, `LanguageToggle`, `LanguageSwitcher`, `/themes` page, and `theme-toggle` are fully excised
- CI gate `scripts/check-deleted-components.sh` exits 0 and will catch future regressions
- Phase 34 objective (THEME-01 through THEME-04) delivered

## Self-Check: PASSED

- [x] SUMMARY.md exists: `.planning/phases/34-tweaks-drawer/34-08-SUMMARY.md`
- [x] All 4 commit SHAs present in `git log`: `9d00ce83`, `561325c1`, `66d65281`, `9f8f653e`
- [x] All 7 deleted files absent on disk
- [x] `scripts/check-deleted-components.sh` exits 0
- [x] `pnpm build` exits 0
- [x] Phase 34 scoped tests (15 + 9) all green
