---
phase: 38
slug: dashboard-verbatim
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 38 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.x (unit/integration) + Playwright 1.x (E2E + visual regression) + axe-core (a11y) |
| **Config file** | `frontend/vitest.config.ts`, `frontend/playwright.config.ts` |
| **Quick run command** | `pnpm --filter frontend test -- dashboard` |
| **Full suite command** | `pnpm --filter frontend test && pnpm --filter frontend test:e2e -- dashboard` |
| **Estimated runtime** | ~90s (unit) + ~120s (E2E × 4 directions) = ~210s |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- <widget-slug>` (widget-scoped vitest)
- **After every plan wave:** Run `pnpm --filter frontend test && pnpm --filter frontend test:e2e -- dashboard`
- **Before `/gsd-verify-work`:** Full suite must be green including 8 visual-regression snapshots (LTR-light / LTR-dark / RTL-light / RTL-dark × 2 breakpoints: 768/1280)
- **Max feedback latency:** ~30s per widget-scoped run

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 38-00-01 | 00 | 0 | — | T-38-01 | Route renders without placeholder data | unit | `pnpm --filter frontend test -- routes/index` | ❌ W0 | ⬜ pending |
| 38-00-02 | 00 | 0 | DASH-08 | T-38-02 | useWeekAhead adapter returns typed groups | unit | `pnpm --filter frontend test -- hooks/useWeekAhead` | ❌ W0 | ⬜ pending |
| 38-00-03 | 00 | 0 | DASH-08 | T-38-09 | usePersonalCommitments filters to internal owners | unit | `pnpm --filter frontend test -- hooks/usePersonalCommitments` | ❌ W0 | ⬜ pending |
| 38-01-01 | 01 | 1 | DASH-01, DASH-08 | T-38-02 | KpiStrip hydrates 4 cards from useDashboardStats | unit | `pnpm --filter frontend test -- KpiStrip` | ❌ W0 | ⬜ pending |
| 38-01-02 | 01 | 1 | DASH-01 | — | 3rd card carries accent top-bar | unit | `pnpm --filter frontend test -- KpiStrip -t "accent bar"` | ❌ W0 | ⬜ pending |
| 38-02-01 | 02 | 1 | DASH-02, DASH-08 | T-38-09 | WeekAhead groups by day/date/time | unit | `pnpm --filter frontend test -- WeekAhead` | ❌ W0 | ⬜ pending |
| 38-03-01 | 03 | 1 | DASH-02, DASH-08 | T-38-09 | OverdueCommitments grouped by dossier + expand toggle | unit | `pnpm --filter frontend test -- OverdueCommitments` | ❌ W0 | ⬜ pending |
| 38-04-01 | 04 | 1 | DASH-03, DASH-08 | T-38-10 | Digest renders tag/headline/source + refresh invokes GlobeSpinner overlay | unit | `pnpm --filter frontend test -- Digest` | ❌ W0 | ⬜ pending |
| 38-05-01 | 05 | 1 | DASH-03, DASH-08 | T-38-05 | SlaHealth combines Donut + 14-day Sparkline | unit | `pnpm --filter frontend test -- SlaHealth` | ❌ W0 | ⬜ pending |
| 38-06-01 | 06 | 1 | DASH-03, DASH-08 | T-38-10 | VipVisits T−N countdown + name/role/when | unit | `pnpm --filter frontend test -- VipVisits` | ❌ W0 | ⬜ pending |
| 38-07-01 | 07 | 1 | DASH-04, DASH-08 | — | MyTasks checkbox + glyph + title + due chip row | unit | `pnpm --filter frontend test -- MyTasks` | ❌ W0 | ⬜ pending |
| 38-08-01 | 08 | 1 | DASH-04, DASH-08 | — | RecentDossiers + ForumsStrip (4-of-8 monogram chips) | unit | `pnpm --filter frontend test -- RecentDossiers` | ❌ W0 | ⬜ pending |
| 38-09-01 | 09 | 2 | DASH-09 | T-38-05 | RTL mirrors chevrons (rotate-180) and logical props | e2e | `pnpm --filter frontend test:e2e -- dashboard-rtl` | ❌ W0 | ⬜ pending |
| 38-09-02 | 09 | 2 | DASH-05 | T-38-06 | 8-snapshot visual regression (LTR-light/dark × RTL-light/dark × 768/1280) | visual | `pnpm --filter frontend test:e2e -- dashboard-visual` | ❌ W0 | ⬜ pending |
| 38-09-03 | 09 | 2 | DASH-06, DASH-07 | — | axe-core zero-violations on `/` route | a11y | `pnpm --filter frontend test:e2e -- dashboard-a11y` | ❌ W0 | ⬜ pending |
| 38-09-04 | 09 | 2 | DASH-07 | — | Responsive layout 320/768/1280 breakpoints render without overflow | e2e | `pnpm --filter frontend test:e2e -- dashboard-responsive` | ❌ W0 | ⬜ pending |
| 38-09-05 | 09 | 2 | DASH-09 | T-38-01 | Legacy OperationsHub + placeholder data swept from codebase | integration | `pnpm --filter frontend test -- -t "no placeholder data"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Requirement Coverage Map

| REQ-ID | Verification Types | Plans |
|--------|--------------------|-------|
| DASH-01 | unit + visual | 01 |
| DASH-02 | unit + visual + e2e | 02, 03 |
| DASH-03 | unit + visual | 04, 05, 06 |
| DASH-04 | unit + visual | 07, 08 |
| DASH-05 | visual regression (8 snapshots) | 09 |
| DASH-06 | a11y (axe) | 09 |
| DASH-07 | e2e responsive + a11y | 09 |
| DASH-08 | unit (hook contracts) + integration | 00, 01–08 |
| DASH-09 | e2e (RTL) + integration (placeholder sweep) | 09 |

Every requirement has at least 2 verification types.

---

## Wave 0 Requirements

- [ ] `frontend/src/hooks/useWeekAhead.ts` — adapter hook (D-07)
- [ ] `frontend/src/hooks/usePersonalCommitments.ts` — adapter hook (D-07, must filter `ownerType: 'internal'`)
- [ ] `frontend/src/components/dashboard/__tests__/` — shared test fixtures for all widgets
- [ ] `frontend/tests/e2e/dashboard/` — Playwright fixture scaffold (theme-toggle, direction-toggle)
- [ ] `frontend/tests/e2e/dashboard/__screenshots__/` — snapshot directory for 8 baselines

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pixel-exact match to `reference/dashboard.png` (initial baseline) | DASH-05 | First snapshot requires human approval before it becomes regression baseline | Run `test:e2e -- --update-snapshots`, open HTML diff report, compare each snapshot to `reference/dashboard.png`, approve by committing snapshot PNGs |
| Digest refresh animation feels correct with GlobeSpinner overlay | DASH-03 | Subjective motion check; reduced-motion variant handled in automated a11y | Click refresh, confirm GlobeSpinner covers card briefly, confirm no layout shift after overlay clears |
| Visual brand consistency across light/dark toggles | DASH-05 | Token sampling only catches token drift, not visual weight | Toggle theme 3× on `/`, confirm no flash-of-wrong-theme and token usage matches phase 33 contract |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (widget-scoped) / < 210s (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
