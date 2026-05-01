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

Real plans on disk are 41-01..41-07 (7 plans, no 41-00 / 41-08). Rows below match each plan's actual `<verify><automated>` block.

| Task ID  | Plan | Wave | Requirement   | Threat Ref | Secure Behavior                                                                                                                                                 | Test Type    | Automated Command                                                                                           | File Exists | Status     |
| -------- | ---- | ---- | ------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 41-01-T1 | 01   | 0    | DRAWER-01     | T-41-01-01 | useDossierDrawer hook + validateSearch rejects unknown `dossierType` + relativeTime utility renders bilingual format                                            | unit         | `pnpm test:unit -- useDossierDrawer relativeTime --run --reporter=basic`                                    | ❌ W0       | ⬜ pending |
| 41-01-T2 | 01   | 0    | DRAWER-01     | T-41-01-07 | DossierDrawer shell mounts on \_protected.tsx + section stubs + DrawerSkeleton + Skeleton primitive verified to exist                                           | unit         | `pnpm test:unit -- DossierDrawer --run --reporter=basic` (preceded by `ls src/components/ui/skeleton*`)     | ❌ W0       | ⬜ pending |
| 41-02-T1 | 02   | 1    | DRAWER-02     | T-41-02-01 | DrawerHead renders DOSSIER + CONFIDENTIAL chips when `sensitivity_level >= 3`                                                                                   | unit         | `pnpm test:unit -- DrawerHead --run --reporter=basic`                                                       | ❌ W1       | ⬜ pending |
| 41-02-T2 | 02   | 1    | DRAWER-02     | —          | DrawerMetaStrip renders 4 segments separated by middle dots                                                                                                     | unit         | `pnpm test:unit -- DrawerMetaStrip --run --reporter=basic`                                                  | ❌ W1       | ⬜ pending |
| 41-02-T3 | 02   | 1    | DRAWER-02     | T-41-02-03 | DrawerCtaRow — Log engagement wired + Brief/Follow stubs + Open full dossier ghost + RTL chevron flip deterministic                                             | unit         | `pnpm test:unit -- DrawerCtaRow --run --reporter=basic`                                                     | ❌ W1       | ⬜ pending |
| 41-03-T1 | 03   | 1    | DRAWER-02     | T-41-03-03 | MiniKpiStrip renders 4 cells with locked KPI mapping (D-04 + D-04 amendment 2026-05-02 → `by_source.commitments.length`)                                        | unit         | `pnpm test:unit -- MiniKpiStrip --run --reporter=basic`                                                     | ❌ W1       | ⬜ pending |
| 41-03-T2 | 03   | 1    | DRAWER-02     | T-41-03-01 | SummarySection renders italic-serif paragraph from `description_{en,ar}` with bilingual fallback                                                                | unit         | `pnpm test:unit -- SummarySection --run --reporter=basic`                                                   | ❌ W1       | ⬜ pending |
| 41-04-\* | 04   | 1    | DRAWER-02     | —          | UpcomingSection + RecentActivitySection bodies (top-2 / top-4 slices)                                                                                           | unit         | `pnpm test:unit -- UpcomingSection RecentActivitySection --run --reporter=basic`                            | ❌ W1       | ⬜ pending |
| 41-05-\* | 05   | 1    | DRAWER-02     | —          | OpenCommitmentsSection rows filtered by `status not in [completed, cancelled]`                                                                                  | unit         | `pnpm test:unit -- OpenCommitmentsSection --run --reporter=basic`                                           | ❌ W1       | ⬜ pending |
| 41-06-T1 | 06   | 1    | DRAWER-01     | T-41-06-01 | Open triggers swapped on RecentDossiers / OverdueCommitments / ForumsStrip; OverdueCommitments uses `group.dossierType ?? 'country'` with console.warn fallback | unit         | `pnpm test:unit -- RecentDossiers OverdueCommitments ForumsStrip --run --reporter=basic`                    | ❌ W1       | ⬜ pending |
| 41-06-T2 | 06   | 1    | DRAWER-01     | T-41-06-02 | UnifiedCalendar onEventClick → openDossier when `event.dossier_id` is set; MyTasks deferral documented                                                          | grep         | `grep -E "onEventClick=\{" frontend/src/routes/_protected/calendar.tsx` + `grep -c "event\.dossier_id"` ≥ 1 | ❌ W1       | ⬜ pending |
| 41-07-T1 | 07   | 2    | DRAWER-01..03 | —          | 8 Playwright E2E specs covering D-13 cases 1-10; RTL spec uses geometry-based assertion (rectLeft===0)                                                          | E2E (list)   | `pnpm playwright test --list \| grep -c "dossier-drawer-"` ≥ 8 + per-case grep loop                         | ❌ W2       | ⬜ pending |
| 41-07-T2 | 07   | 2    | DRAWER-03     | —          | LTR + AR visual baselines @ 1280×800 with `maxDiffPixelRatio: 0.02`                                                                                             | E2E (visual) | `pnpm playwright test dossier-drawer-visual --list` (LTR + AR enumerated)                                   | ❌ W2       | ⬜ pending |
| 41-07-T3 | 07   | 2    | DRAWER-03     | —          | axe-core zero serious/critical EN + AR; `pnpm size` Total JS budget passes (drawer chunk delta recorded as INFO)                                                | E2E (a11y)   | `pnpm playwright test dossier-drawer-axe --list \| grep -c "zero violations"` == 2 + `pnpm size` exit 0     | ❌ W2       | ⬜ pending |
| 41-07-T4 | 07   | 2    | DRAWER-01..03 | —          | Human checkpoint — staging smoke + VERIFICATION.md sign-off                                                                                                     | manual       | n/a (resume-signal "approved")                                                                              | ❌ W2       | ⬜ pending |

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

## Deviations from CONTEXT

| ID    | Decision | Deviation                                                                                     | Source / Reason                                                                                                                                       |
| ----- | -------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEV-1 | D-04     | path adjusted per RESEARCH §2 (`by_source.commitments.length` instead of `items.filter(...)`) | See `41-CONTEXT.md` D-04 Amendment 2026-05-02. Output identical; access path is the canonical pre-grouped form. Plan 41-03 uses the `by_source` path. |

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (drawer shell, hook, fixture, i18n, relativeTime)
- [ ] No watch-mode flags in CI commands
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0 sign-off)

**Approval:** pending
