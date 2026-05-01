---
phase: 41
slug: dossier-drawer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-01
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source of truth: `41-RESEARCH.md` § "Validation Architecture".

---

## Test Infrastructure

| Property               | Value                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Framework**          | Vitest 4.x (unit) + Playwright (E2E) + axe-core 4.x (a11y)                         |
| **Config file**        | `frontend/vitest.config.ts` (unit) + `frontend/playwright.config.ts` (E2E)         |
| **Quick run command**  | `pnpm --filter frontend test:unit -- DossierDrawer`                                |
| **Full suite command** | `pnpm --filter frontend test && pnpm --filter frontend test:e2e -- dossier-drawer` |
| **Estimated runtime**  | ~90 seconds (unit ~15s + E2E ~75s)                                                 |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test:unit -- DossierDrawer`
- **After every plan wave:** Run `pnpm --filter frontend test && pnpm --filter frontend test:e2e -- dossier-drawer`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement   | Threat Ref | Secure Behavior                                                                               | Test Type    | Automated Command                                   | File Exists | Status     |
| -------- | ---- | ---- | ------------- | ---------- | --------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------- | ----------- | ---------- |
| 41-00-\* | 00   | 0    | DRAWER-01     | T-V5-01    | `validateSearch` rejects unknown `dossierType`                                                | unit         | `pnpm test:unit -- useDossierDrawer.test.tsx`       | ❌ W0       | ⬜ pending |
| 41-00-\* | 00   | 0    | —             | —          | relativeTime utility renders bilingual relative format                                        | unit         | `pnpm test:unit -- relativeTime.test.ts`            | ❌ W0       | ⬜ pending |
| 41-01-\* | 01   | 1    | DRAWER-02     | —          | DrawerHead renders DOSSIER + CONFIDENTIAL chips when `sensitivity_level >= 3`                 | unit         | `pnpm test:unit -- DrawerHead.test.tsx`             | ❌ W1       | ⬜ pending |
| 41-02-\* | 02   | 1    | DRAWER-02     | —          | MiniKpiStrip renders 4 cells with locked KPI mapping (D-04)                                   | unit         | `pnpm test:unit -- MiniKpiStrip.test.tsx`           | ❌ W1       | ⬜ pending |
| 41-03-\* | 03   | 1    | DRAWER-02     | —          | Summary renders italic-serif paragraph from `description_{en,ar}` with bilingual fallback     | unit         | `pnpm test:unit -- SummarySection.test.tsx`         | ❌ W1       | ⬜ pending |
| 41-04-\* | 04   | 1    | DRAWER-02     | —          | Upcoming renders top-2 entries from `calendar_events.upcoming`                                | unit         | `pnpm test:unit -- UpcomingSection.test.tsx`        | ❌ W1       | ⬜ pending |
| 41-05-\* | 05   | 1    | DRAWER-02     | —          | RecentActivity renders top-4 entries from `activity_timeline.recent_activities`               | unit         | `pnpm test:unit -- RecentActivitySection.test.tsx`  | ❌ W1       | ⬜ pending |
| 41-06-\* | 06   | 1    | DRAWER-02     | —          | OpenCommitments renders rows from `work_items.by_source.commitments` filtered by status       | unit         | `pnpm test:unit -- OpenCommitmentsSection.test.tsx` | ❌ W1       | ⬜ pending |
| 41-07-\* | 07   | 1    | DRAWER-01     | —          | Open triggers wired on RecentDossiers / MyTasks / OverdueCommitments / ForumsStrip / calendar | E2E          | `pnpm test:e2e -- dossier-drawer-trigger-*`         | ❌ W2       | ⬜ pending |
| 41-08-\* | 08   | 2    | DRAWER-01..03 | —          | 10 Playwright E2E + LTR/AR visual @ 1280 + axe-core + size-limit                              | E2E + visual | `pnpm test:e2e -- dossier-drawer`                   | ❌ W2       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx` — shell rendering test (unit) — covers DRAWER-01 mount
- [ ] `frontend/src/hooks/__tests__/useDossierDrawer.test.tsx` — open/close + URL search-param mutation (unit) — covers DRAWER-01 + V5 input validation
- [ ] `frontend/src/lib/i18n/__tests__/relativeTime.test.ts` — bilingual relative-time formatter (unit)
- [ ] `frontend/tests/e2e/support/dossier-drawer-fixture.ts` — shared Playwright fixture (login + open-drawer helper) — consumed by all 9 Wave 2 specs
- [ ] No framework install needed; vitest + playwright + axe-core already in `package.json`

---

## Manual-Only Verifications

| Behavior                                                                                        | Requirement | Why Manual                                                                                                                                                                  | Test Instructions                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Drawer animation feel (subjective polish)                                                       | DRAWER-01   | Motion timing perception is qualitative                                                                                                                                     | At 1280×800, click a RecentDossiers row; verify slide-in feels smooth (no jank), backdrop fades in, no layout shift; repeat in AR locale |
| Sensitivity threshold (A2) — confirm `level >= 3` matches user mental model                     | DRAWER-02   | Codebase has two conflicting interpretations (`dossier.ts` says Confidential, `list-page/sensitivity.ts` says Restricted). Visual matches handoff `chip-warn` for level ≥ 3 | Open a dossier with `sensitivity_level = 3` → CONFIDENTIAL chip renders. Open one with `level = 2` → no chip                             |
| Calendar prefill mechanism (A1) — `stats.calendar_events_count` reflects engagement-type events | DRAWER-02   | Backend behavior — verify with a dossier that has known engagement count                                                                                                    | Open dossier with N engagements; verify KPI strip shows N (not 0 / inflated count)                                                       |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (drawer shell, hook, fixture, i18n, relativeTime)
- [ ] No watch-mode flags in CI commands
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0 sign-off)

**Approval:** pending
