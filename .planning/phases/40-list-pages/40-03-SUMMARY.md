---
phase: 40-list-pages
plan: 03
status: PASS-WITH-DEVIATION
type: execute
requirements: [LIST-01]
completed: 2026-04-26
---

# 40-03 — Countries list page

**Status:** PASS-WITH-DEVIATION (executor truncated before final SUMMARY commit; orchestrator salvaged the uncommitted vitest fixture from the worktree and authored this summary).

## Scope delivered

Replaced the body of `frontend/src/routes/_protected/dossiers/countries/index.tsx` (266 lines → 82 lines) with `<ListPageShell>` + `<DossierTable>` driven by `useCountries`. Per LIST-01.

### Files

| File | Action |
|---|---|
| `frontend/src/routes/_protected/dossiers/countries/index.tsx` | Body rewrite — ListPageShell + DossierTable composition (commit `14a88f82`) |
| `frontend/src/routes/_protected/dossiers/countries/__tests__/CountriesListPage.test.tsx` | New vitest fixture (salvaged from executor worktree by orchestrator after truncation) |

## Imports wired

```ts
import { ListPageShell, DossierTable, type DossierTableRow } from '@/components/list-page'
import { useCountries } from '@/hooks/useCountries'
```

The page maps `useCountries` results into `DossierTableRow[]` (id, type='country', iso, name_en, name_ar, engagement_count, last_touch, sensitivity_level) and renders inside `<ListPageShell title={t('countries.title')}>` with isLoading/empty switches.

## Deviations

| # | What | Why |
|---|------|-----|
| 1 | Executor truncated mid-plan after committing the page (commit `88ab98af` in worktree) | Subagent context exhaustion (84k tokens, 18 tool uses). Stopped before committing the test or writing SUMMARY. The uncommitted `__tests__/CountriesListPage.test.tsx` was salvaged by the orchestrator from the worktree and committed under the same authorship. |
| 2 | This SUMMARY authored by orchestrator post-hoc | Same context-budget cause as deviation #1. SUMMARY authored from the executor's stdout result + worktree spot-check. |

## Acceptance

- ✓ `<ListPageShell>` consumed (1 match)
- ✓ `<DossierTable>` consumed (1 match)
- ✓ `useCountries` consumed
- ✓ EN/AR name swap via `i18n.language === 'ar'`
- ✓ Sensitivity chip via `sensitivityChipClass(level)` (handled inside DossierTable primitive — not rewired in page)
- ✓ DossierGlyph renders via DossierTable (not in page directly)
- ✓ Mobile (<md) collapses to card list (handled by primitive)
- ✓ Touch targets ≥ 44×44px (handled by primitive)
- ✓ Logical Tailwind only (no `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`)

## Commits (post-merge SHAs on DesignV2)

```
14a88f82 feat(40-03): replace countries list page with ListPageShell + DossierTable
[orchestrator-salvage] test(40-03): rescue uncommitted CountriesListPage test fixture
[orchestrator-salvage] docs(40-03): SUMMARY (authored post-hoc after executor truncation)
```
