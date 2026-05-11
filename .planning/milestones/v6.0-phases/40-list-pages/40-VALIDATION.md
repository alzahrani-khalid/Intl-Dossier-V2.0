---
phase: 40
slug: list-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 40 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                         |
| ---------------------- | ------------------------------------------------------------- |
| **Framework**          | vitest (unit) + Playwright (E2E + visual + a11y)              |
| **Config file**        | `frontend/vitest.config.ts` + `frontend/playwright.config.ts` |
| **Quick run command**  | `cd frontend && pnpm vitest run --reporter=dot`               |
| **Full suite command** | `cd frontend && pnpm vitest run && pnpm exec playwright test` |
| **Estimated runtime**  | ~120 seconds (vitest ~25s, playwright ~95s)                   |

---

## Sampling Rate

- **After every task commit:** Run quick command for the touched file's test
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds (per-task vitest), 120 seconds (full suite)

---

## Per-Task Verification Map

> Populated by gsd-planner after PLAN.md files are written. Each task's `<automated>` block must reference a row here. Wave 0 fixtures land in the `File Exists` column once created.

| Task ID                | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
| ---------------------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ----------------- | ----------- | ------ |
| _populated by planner_ |      |      |             |            |                 |           |                   |             |        |

---

## Wave 0 Requirements

- [ ] `frontend/src/components/list-page/__tests__/ListPageShell.test.tsx` — chrome composition + slots + skeleton + empty state
- [ ] `frontend/src/components/list-page/__tests__/GenericListPage.test.tsx` — rows variant render + status chip slot + ≥44px row height
- [ ] `frontend/src/components/list-page/__tests__/DossierTable.test.tsx` — header + row anatomy + RTL chevron `scaleX(-1)`
- [ ] `frontend/src/components/list-page/__tests__/PersonsGrid.test.tsx` — 44px avatar + VIP chip conditional render
- [ ] `frontend/src/components/list-page/__tests__/EngagementsList.test.tsx` — search debounce + 4 filter pills + week-list grouping + load-more
- [ ] `frontend/src/hooks/__tests__/useCountries.test.ts` — Supabase adapter contract (mirrors `useForums` test)
- [ ] `frontend/src/hooks/__tests__/useOrganizations.test.ts` — Supabase adapter contract
- [ ] `frontend/src/hooks/__tests__/useEngagementsInfinite.test.ts` — `useInfiniteQuery` cursor/offset contract + `getNextPageParam`
- [ ] `frontend/public/locales/en/list-pages.json` + `frontend/public/locales/ar/list-pages.json` — shared list-pages namespace
- [ ] `frontend/public/locales/{en,ar}/{countries,organizations,persons,forums,topics,working-groups,engagements}.json` — 14 entity namespace files (CREATE — research confirms none exist)
- [ ] `frontend/.size-limit.json` — bumped Total JS budget 800 → 815 KB

---

## E2E + Visual + A11y Gates (Wave 2)

- [ ] **Visual regression:** 14 baselines (7 pages × LTR + AR) at 1280px viewport, 2% maxDiffPixelRatio (`pnpm exec playwright test --update-snapshots` only on intentional change)
- [ ] **Render assertions @ 320 + 768 + 1280:** every page renders without overflow; tables collapse to row cards under 768
- [ ] **Touch targets:** Playwright assertion `boundingBox().height >= 44 && boundingBox().width >= 44` for every row, chevron, filter pill, load-more button, search input
- [ ] **Filter pills:** click `Confirmed` → only `status === 'confirmed'` engagements visible; click `All` → reset; assert `aria-pressed` toggles
- [ ] **Load-more:** click load-more → `<GlobeSpinner>` + bilingual "Loading more engagements…" / "جارٍ تحميل المزيد من الارتباطات…" visible during `isFetchingNextPage`; new rows append on resolve
- [ ] **RTL chevron flip:** with `<html dir="rtl">`, computed `transform` on `.chevron` includes `scaleX(-1)` (or `matrix(-1, ...)`)
- [ ] **Click target navigation:** click country row → URL becomes `/dossiers/countries/$countryId`; click engagement row → URL becomes `/engagements/$engagementId/overview`
- [ ] **axe-core a11y:** zero violations across all 7 pages (`new AxeBuilder({ page }).analyze()` returns `[]` violations)
- [ ] **Logical-properties lint:** `pnpm lint` enforces no `ml-*/mr-*/pl-*/pr-*/left-*/right-*/text-left/text-right/rounded-l-*/rounded-r-*` in any new Phase 40 file
- [ ] **size-limit budget:** `pnpm size-limit` exits 0 against bumped 815 KB budget

---

## Manual-Only Verifications

| Behavior                                   | Requirement | Why Manual                                    | Test Instructions                                                                                                                                                 |
| ------------------------------------------ | ----------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card aesthetic parity with `dashboard.png` | LIST-02     | Visual qualitative judgment beyond pixel diff | Open `/dossiers/persons` at 1280px LTR + AR; compare side-by-side with `dashboard.png` cards — same radius, shadow, padding                                       |
| Handoff PNG parity for 7 pages             | LIST-01..04 | First-run baseline must be human-approved     | Compare `/dossiers/{type}` at 1280px LTR against handoff `reference/{countries,organizations,forums,engagements}.png` — approve baseline before Wave 2 freezes it |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
