---
phase: 41
phase_name: dossier-drawer
status: gaps_found
verdict: SMOKE-PARTIAL-GAPS-FOUND
requirements:
  - id: DRAWER-01
    description: Drawer trigger inventory wired across surfaces
    status: PARTIAL-INTEGRATION-GAP
  - id: DRAWER-02
    description: Drawer body anatomy (head/meta/cta/kpi/summary/upcoming/activity/commitments)
    status: VERIFIED-CODE
  - id: DRAWER-03
    description: Drawer a11y (focus trap + ESC + RTL slide + axe-core green)
    status: PARTIAL-FAIL-CONTRAST
playwright_pass: 7
playwright_fail: 7
playwright_total: 14
last_updated: 2026-05-02
---

# Phase 41 — Dossier Drawer — Verification

This document captures the canonical phase verdict for Phase 41 plus every
deviation locked during the wave executions.  It is finalized by the user
after the human smoke checkpoint in plan 41-07 Task 4.

## Verdict

**SMOKE-PARTIAL-GAPS-FOUND** — orchestrator-driven Playwright run on
2026-05-02 lands 7/14 automated tests green and 7/14 red. The drawer
fundamentals (mount, ESC, focus trap, deep-link with corrected fixture,
all 3 CTA buttons, LTR baseline) all pass. The 7 failures cluster in
two buckets: real implementation gaps (axe contrast, mobile box-shadow,
RTL `document.dir`, calendar `data-dossier-id` attribute) and unrelated
WIP regressions (Dashboard composer no longer mounts `RecentDossiers`/
`ForumsStrip`/`Digest` after the user's pre-existing layout work was
snapshotted in `e8f3341a`). See "Smoke Results — 2026-05-02" below.

Path forward: `/gsd-plan-phase 41 --gaps` will read the gap table below
and produce gap-closure plans.

The original sign-off path (verdict → `PASS-WITH-DEVIATION`) is paused
until the integration gaps either land in a 41.1 gap-closure phase or
the user explicitly accepts them as deviations.

| Requirement | Status         | Evidence                                                                                          |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------- |
| DRAWER-01   | VERIFIED-CODE  | 4 trigger surfaces wired (RecentDossiers, OverdueCommitments, ForumsStrip, calendar) — plan 41-06 |
| DRAWER-02   | VERIFIED-CODE  | 7 sections rendered with real data (head/meta/cta/kpi/summary/upcoming/activity/commitments)      |
| DRAWER-03   | VERIFIED-CODE  | RTL slide + focus trap + ESC + axe-core gate — plan 41-07 Tasks 1 + 3                             |

Code-level verification:

| Gate                                                  | Result                                  |
| ----------------------------------------------------- | --------------------------------------- |
| Wave 0 + 1 + 2 vitest                                 | All green at plan completion (see SUMMARYs)        |
| Playwright `--list dossier-drawer`                     | 12 tests across 8 spec files (Task 1)  |
| Playwright `--list dossier-drawer-visual`              | 2 tests (Task 2)                       |
| Playwright `--list dossier-drawer-axe`                 | 2 tests (Task 3)                       |
| 10 D-13 cases referenced by name                       | All present (grep loop in plan 41-07 Task 1 verify) |
| TypeScript surface delta                              | 0 new errors on Phase 41 surface       |
| Logical-property violations                           | 0 hits on Phase 41 files               |

Live execution (Playwright + visual baselines + axe-core run-time) is gated by:

- A dev server (`pnpm dev`) on port 5173 — this worktree is sandboxed and
  cannot start one autonomously.
- `.env.test` populated with `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`.
- A seeded fixture dossier matching `E2E_DOSSIER_FIXTURE_ID` (default
  `seed-country-sa`).

Per Phase 40 (40-11) precedent, runtime execution is deferred to the human
smoke checkpoint and CI replay.

## Smoke Results — 2026-05-02 (orchestrator-run)

**Environment:** local Playwright run, dev server auto-spawned by
`webServer` block in `frontend/playwright.config.ts`. Logged in as
`TEST_USER_EMAIL`. Fixture id `seed-country-sa`.

**Test fixture fix applied during smoke (committed as part of this
update):** `frontend/tests/e2e/support/dossier-drawer-fixture.ts` default
route changed from `/` (which redirects to `/dashboard` and *strips*
search params via the unauthenticated index route) to `/dashboard`
(a protected route under `_protected.tsx` where 41-01 D-02 wired
`validateSearch`). Without this fix all 14 tests timed out at the dialog
visibility assertion. After the fix, 7/14 pass.

**Pass (7/14):**
| Spec | Test | Verifies |
|------|------|----------|
| `dossier-drawer-a11y.spec.ts` | ESC closes drawer + strips `?dossier=` | DRAWER-03 keyboard a11y |
| `dossier-drawer-a11y.spec.ts` | Tab/Shift+Tab focus trap | DRAWER-03 focus trap |
| `dossier-drawer-cta.spec.ts` | Open-full-dossier navigates `/dossiers/{type}/{id}` | DRAWER-02 CTA |
| `dossier-drawer-cta.spec.ts` | Log-engagement navigates `/dossiers/engagements/create` | DRAWER-02 CTA |
| `dossier-drawer-cta.spec.ts` | Brief stub aria-disabled, no nav | DRAWER-02 CTA |
| `dossier-drawer-deeplink.spec.ts` | `/dashboard?dossier=...` opens drawer + survives reload | DRAWER-02 deep link |
| `dossier-drawer-rtl.spec.ts` | EN sanity — drawer at physical right edge | DRAWER-03 RTL inverse |

**Fail (7/14):**
| # | Spec | Failure | Category | Owner |
|---|------|---------|----------|-------|
| G1 | `dossier-drawer-trigger-recent.spec.ts` | `getByTestId('recent-dossier-trigger')` not found on `/dashboard` | WIP-REGRESSION (RecentDossiers no longer mounted in `Dashboard/index.tsx` after `e8f3341a`) | User WIP |
| G2 | `dossier-drawer-trigger-calendar.spec.ts` | `[data-dossier-id]` locator times out on `/calendar` | IMPL-GAP (UnifiedCalendar / CalendarEventPill never expose `data-dossier-id` — Plan 41-06 Task 2 wired the `onEventClick` callback only) | Phase 41-06 |
| G3 | `dossier-drawer-axe.spec.ts` (EN) | axe contrast violation: `#fff9f8` on `#bf5542` = 4.38 (need 4.5) — `--sla-bad` token converted | DESIGN-SYSTEM (handoff token `--sla-bad: oklch(54% 0.20 25)` fails WCAG AA — affects every consumer of red severity tokens, not just drawer) | Cross-phase |
| G4 | `dossier-drawer-axe.spec.ts` (AR) | Same contrast violation in AR locale | DESIGN-SYSTEM | Cross-phase |
| G5 | `dossier-drawer-mobile.spec.ts` | `box-shadow != 'none'` at 390×844 — drawer's `max-md:shadow-none` Tailwind utility not winning specificity over Sheet primitive's default shadow | IMPL-GAP (Phase 41-01 mobile chrome) | Phase 41-01 |
| G6 | `dossier-drawer-rtl.spec.ts` (AR) | `document.dir !== 'rtl'` after AR locale switch — `loginForListPages('ar')` setAttribute call doesn't survive a re-render | TEST-INFRA (login helper used by Phase 40 specs already; not Phase 41 specific) | Cross-phase |
| G7 | `dossier-drawer-commitment-click.spec.ts` | `dossier-drawer-commitments` testid never visible — `useDossierOverview('seed-country-sa')` returns no data, section unmounts | TEST-DATA (fixture id `seed-country-sa` is a placeholder; needs a real seeded UUID) | Phase 41-07 |

**Visual baselines:** NOT generated this run — visual regression spec
(`dossier-drawer-visual.spec.ts`, 2 tests) needs `--update-snapshots`
on a deterministic environment. Still deferred to HUMAN-UAT as the
executor noted.

**Total JS size budget:** `pnpm size` confirms pre-existing config drift —
2.42 MB / 815 KB ceiling, overage 1.6 MB. Drawer chunk is ≈330 B gz, far
below the noise floor. OUT-OF-SCOPE for Phase 41 (already documented
under "Total JS size-limit budget pre-existing overage" deviation below).

**Recommended remediation order if a 41.1 gap-closure phase is created:**
1. G2 (calendar attr) + G5 (mobile shadow) — focused 41 implementation fixes
2. G7 (fixture data) — needs a real UUID seed in test setup
3. G3/G4 (axe contrast) — consider as part of design-system token review
4. G6 (RTL doc.dir) — patch `loginForListPages` once for the entire suite
5. G1 (RecentDossiers mount) — only relevant if user re-mounts the widget
   on the dashboard; otherwise the trigger spec is stale

## Locked Deviations

### D-08 revised — commitment row navigates, not a dialog

**Source:** Plan 41-05 SUMMARY; RESEARCH §4.

**Original expectation (D-08 in 41-CONTEXT.md):** clicking a commitment row
inside the drawer opens a work-item detail dialog.

**Reality:** No work-item detail dialog component exists in the codebase
(grep confirms — RESEARCH §4).  The Phase 39 WorkBoard pattern instead
routes commitments to `/commitments?id=<uuid>`.

**Resolution:** `OpenCommitmentsSection.handleRowClick` mirrors the WorkBoard
pattern.  Drawer auto-closes because the next route's `validateSearch`
drops the `?dossier=` key.  Wave 2 spec
`dossier-drawer-commitment-click.spec.ts` (D-13 case 10) verifies.

**Status:** ACCEPTED — UX is identical from the user's POV (click row
→ see commitment detail).

### Engagement-create prefill deferred (RESEARCH §3)

**Source:** Plan 41-02 SUMMARY; RESEARCH §3.

**Original expectation:** Clicking "Log engagement" navigates to
`/dossiers/engagements/create` with the dossier_id pre-populated on the
target form.

**Reality:** The engagements-create form does not yet read prefilled
dossier_id from search params or location state.  Wiring the prefill
is a touch beyond Phase 41's scope (it would change the engagements
domain).

**Resolution:** Phase 41 ships navigation only; Wave 2 spec
`dossier-drawer-cta.spec.ts` (D-13 case 9) asserts URL change without
prefill checks.  Tracked for Phase 42 (`remaining-pages`) or a polish
plan.

**Status:** ACCEPTED — DEFERRED.

### CONFIDENTIAL chip threshold confirmed at sensitivity_level >= 3

**Source:** Plan 41-02 SUMMARY; RESEARCH §1.

**Resolution:** Threshold matches the handoff visual `chip-warn` cue that
fires at sensitivity_level 3.  Plan 41-02 Task 1 unit test asserts the
behavior.

**Status:** CONFIRMED.

### MyTasks open-trigger DEFERRED

**Source:** `deferred-items.md`; RESEARCH §9 row 2; plan 41-06 Task 2.

**Reason:** MyTasks renders `DossierGlyph` + title with no clear dossier
affordance separate from the existing checkbox + work-item navigation.
Adding a drawer trigger here would degrade the existing widget UX.

**Status:** DEFERRED to Phase 42 with explicit user feedback on click-target
precedence.

### OverdueCommitments dossierType propagation DEFERRED

**Source:** `deferred-items.md`; plan 41-06 Task 1.

**Reason:** `usePersonalCommitments`'s `GroupedCommitment` interface does
NOT expose `dossierType`.  Phase 41-06 falls back to `'country'` plus a
`console.warn` whenever the fallback fires.

**Status:** DEFERRED — production behaves correctly for the dominant
country case; non-country drift surfaces during dev.  Track in a polish
phase by extending the hook or adding a per-row dossier lookup.

### Visual baselines deferred to HUMAN-UAT

**Source:** Plan 41-07 Task 2 SUMMARY; Phase 40 (40-11) precedent.

**Reason:** Sandboxed worktree cannot start `pnpm dev` or seed test
credentials.  `dossier-drawer-visual.spec.ts` enumerates 2 tests
(LTR + AR @ 1280×800) but the PNG baselines under
`tests/e2e/dossier-drawer-visual.spec.ts-snapshots/` will be generated
by the operator running `pnpm playwright test dossier-drawer-visual --update-snapshots`
on a dev machine with `.env.test` set.

**Status:** DEFERRED to HUMAN-UAT — spec is in place, baselines pending.

### Total JS size-limit budget pre-existing overage (UNRELATED to Phase 41)

**Source:** Plan 41-07 Task 3.

**Observation:** `pnpm size` reports Total JS at 2.42 MB gz vs the 815 KB
ceiling (overage 1.6 MB).  Verified the dossier-drawer chunk itself is
**~485 B raw / ~330 B gz** (`dist/assets/useDossierDrawer-*.js`) — trivially
small and **not the cause** of the overage.

**Root cause (suspected):** Vite build now emits a separate `vendor-*.js`
super-chunk of 651 KB gz that did not exist when the Phase 40 ceiling
was set.  This is a build-config drift, not a Phase 41 regression.

**Phase 41 contribution to Total JS:** ≈ 0 KB gz (the drawer chunk is
within the noise floor of bundler hashing).

**Resolution:** Recorded as INFO per RESEARCH §15 / A6 — no per-component
drawer entry was added (correct decision).  The overall Total JS budget
overage is **out of scope** for Phase 41 and tracked as a
pre-existing baseline drift.  Do NOT raise the budget without explicit
user sign-off.

**Status:** OUT-OF-SCOPE — track in a future bundle-budget reconciliation
plan.

## Threat Model — Final Status

| Threat ID                  | Status         | Notes                                                                       |
| -------------------------- | -------------- | --------------------------------------------------------------------------- |
| T-41-01-01..07 (plan 41-01)| MITIGATED + 2 DEFERRED  | T-41-01-04 (open-redirect on Open-full-dossier) closed in plan 41-02 by hard-coding `getDossierDetailPath`; T-41-01-07 (focus trap) closed by Wave 2 a11y spec |
| T-41-02..06 (Wave 1)        | MITIGATED      | All trigger + body sections enforce typed inputs and JSX-text rendering    |
| T-41-07-01..03              | MITIGATED + ACCEPTED | Visual baselines use the seeded fixture only; localStorage mutation in tests is isolated per Playwright context |

## Plans

| Plan  | Wave | Title                                       | Verdict | Summary                                                       |
| ----- | ---- | ------------------------------------------- | ------- | ------------------------------------------------------------- |
| 41-01 | 0    | Drawer infrastructure + i18n + URL mount    | PASS    | 15/15 vitest; 8 section stubs ready for Wave 1                |
| 41-02 | 1    | Drawer head anatomy (chips/meta/cta)        | PASS    | 27/27 vitest; D-08 navigation; sensitivity threshold confirmed |
| 41-03 | 1    | KPI strip + summary section                 | PASS    | KPI mapping locked verbatim; bilingual fallback chain         |
| 41-04 | 1    | Upcoming + RecentActivity sections          | PASS    | top-2/top-4 fixed slices; LtrIsolate around mono cells        |
| 41-05 | 1    | Open commitments section                    | PASS    | D-08 revised → /commitments?id=<id>; 12/12 vitest             |
| 41-06 | 1    | Trigger surfaces (3 widgets + calendar)     | PASS    | 25/25 vitest; MyTasks + dossierType propagation deferred      |
| 41-07 | 2    | Wave 2 phase gate (this plan)               | PENDING-HUMAN-SMOKE | 12 + 2 + 2 = 16 Playwright tests enumerate; baselines deferred |

## Sign-off Checklist (filled in by operator after smoke)

- [ ] All 10 D-13 case smokes pass on staging
- [ ] `pnpm playwright test dossier-drawer` green (functional + a11y)
- [ ] `pnpm playwright test dossier-drawer-visual --update-snapshots` produced 2 baselines
- [ ] Baseline PNGs committed under `frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/`
- [ ] axe-core EN + AR runs zero serious/critical
- [ ] Total JS overage logged as deferred (DO NOT raise the limit)
- [ ] This file's frontmatter `verdict` flipped to `PASS-WITH-DEVIATION`

After all boxes are checked, the phase is complete and Phase 42 is unblocked.
