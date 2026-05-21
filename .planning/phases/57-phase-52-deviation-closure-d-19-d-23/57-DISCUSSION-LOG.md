# Phase 57: Phase 52 Deviation Closure (D-19..D-23) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 57-Phase 52 Deviation Closure (D-19..D-23)
**Areas discussed:** D-19 mobile touch DnD scope, D-21 WorkBoard vs shared primitive, D-22 LTR/RTL byte-distinction path, D-23 live Playwright run shape

---

## D-19 mobile touch DnD scope

### Q1: D-19 fork — TasksTab support touch DnD at 768×1024 or stay scoped-out via ADR?

| Option                      | Description                                                                                                                                                                   | Selected |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Scope-out ADR (Recommended) | ADR documenting mobile = read-mostly per CLAUDE.md. Keep `<select>` 'Move to' picker. Keep `test.skip()` at 768. Cheapest; matches existing responsive rules.                 | ✓        |
| Enable mobile touch DnD     | Remove `<select>` branch; render shared KanbanProvider at all viewports. Un-skip 768 cells. TouchSensor already in primitive. Adds e2e maintenance + 44px touch-target audit. |          |
| Hybrid                      | ADR + leave skips, but add TouchSensor smoke test against the shared primitive (component-level) so primitive's touch path doesn't silently regress.                          |          |

**User's choice:** Scope-out ADR
**Notes:** Aligns with CLAUDE.md "desktop-primary analyst workstation" rule.

### Q2: Where should the D-19 ADR live and what's its open/closed posture?

| Option                                            | Description                                                                                                                   | Selected |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| `docs/adr/` — closed, revisit gated on UX request | Single top-level ADR file. Status: ACCEPTED. Posture: 'Closed; reopen requires explicit UX research'.                         |          |
| Phase artifact only                               | Document inside `.planning/phases/57-.../57-D-19-ADR.md`. No top-level ADR. Lighter; co-locates with deviation closure trail. |          |
| Both — phase artifact + top-level ADR             | Phase artifact records the closure; top-level ADR codifies the architectural rule. Most durable but two files.                | ✓        |

**User's choice:** Both — phase artifact + top-level ADR
**Notes:** Belt-and-suspenders: phase trail + architectural rule both preserved.

### Q3: What verification proves the mobile read-mostly fallback still works at 768×1024?

| Option                                            | Description                                                                                                                                                   | Selected |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Existing visual + a11y specs at 768 (Recommended) | `tasks-tab-visual.spec.ts` + `tasks-tab-a11y.spec.ts` already cover 768. Add one assertion that `<select>` 'Move to' picker renders + select-based move test. | ✓        |
| Net-new mobile-stage spec                         | Write `tasks-tab-mobile-fallback.spec.ts` to exercise the `<select>` picker e2e on 768. More explicit; one more file.                                         |          |
| Reuse keyboard spec at 768                        | Un-skip 768 cell of `tasks-tab-keyboard.spec.ts` and have it drive `<select>` via keyboard. Compact; reuses existing spec.                                    |          |

**User's choice:** Existing visual + a11y specs at 768 + new `<select>` assertion + select-based move test

### Q4: Does the closure require any code change in TasksTab consumer or shared primitive?

| Option                                           | Description                                                                                                                                  | Selected |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| No code change — docs + tests only (Recommended) | TouchSensor already in primitive; `<select>` branch already in place. Closure = ADR + verification test + skip-reason comment polish.        | ✓        |
| Tighten skip-reason comments + add ARIA labels   | Above, plus update `test.skip()` rationale strings to reference new ADR path. Add aria-label to `<select>` 'Move to' picker if missing.      |          |
| Refactor `<select>` picker for keyboard a11y     | Audit mobile `<select>` for keyboard-only operation (Tab order, focus visible, label). Targeted fix if axe flags. Pulls in small a11y scope. |          |

**User's choice:** No code change — docs + tests only

### Q5: Should the D-19 ADR also bind D-21's WorkBoard scope, or per-deviation ADRs?

| Option                                | Description                                                                                                                                                     | Selected |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Per-deviation ADRs (Recommended)      | One ADR per deviation. D-19 covers TasksTab mobile. D-21 (if scope-out) gets its own. Cleaner traceability against ROADMAP success criteria.                    | ✓        |
| Single 'mobile responsive policy' ADR | One ADR codifies broader rule ('analyst mobile = read-mostly + `<select>` fallback'). D-19 + D-21 both reference it. Reduces ADR sprawl but couples deviations. |          |
| Decide after D-21 discussion          | Defer the binding question until D-21 fork resolves.                                                                                                            |          |

**User's choice:** Per-deviation ADRs

---

## D-21 WorkBoard vs shared primitive

### Q1: How do `kanban-*.spec.ts` specs become green against the shared `@dnd-kit/core` primitive?

| Option                                              | Description                                                                                                                                                       | Selected |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Migrate WorkBoard to shared primitive (Recommended) | Refactor `WorkBoard.tsx` to consume `@/components/kanban/*`. Specs then target shared primitive transitively. Closes parallel-implementation debt. Larger change. | ✓        |
| Scope-out ADR — keep parallel WorkBoard             | Acknowledge two kanban primitives. ADR. Fix only 4 observed regressions in WorkBoard. Cheaper; codifies dual primitive.                                           |          |
| Migrate specs, not WorkBoard                        | Repoint `/kanban` specs to `/engagements/$id/tasks` fixture. WorkBoard stays parallel but specs don't cover it. (Likely loses coverage.)                          |          |
| Investigate the 4 failures first — decide after     | Read 52-05 anchor-run summary; trivial vs structural. Defers the architectural call.                                                                              |          |

**User's choice:** Migrate WorkBoard to shared primitive

### Q2: Migration scope depth?

| Option                                                           | Description                                                                                                                           | Selected |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Surface swap — keep BoardColumn/KCard/BoardToolbar (Recommended) | Replace DndContext+sensors with KanbanProvider; map columns/cards into shared primitive API. Adapters stay. Smallest viable refactor. | ✓        |
| Full absorb — retire BoardColumn/KCard                           | Delete adapters; render via shared `KanbanProvider+KanbanBoard+KanbanCard`. Biggest blast radius.                                     |          |
| Surface swap + retire only `board.css`                           | Surface swap AND delete `board.css` if shared primitive's tokens cover all its visual rules. Middle ground.                           |          |

**User's choice:** Surface swap

### Q3: What guards prevent WorkBoard from drifting back to parallel `@dnd-kit/core` import?

| Option                                            | Description                                                                                                                                                     | Selected |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| ESLint `no-restricted-imports` rule (Recommended) | Ban direct `@dnd-kit/core` imports outside `@/components/kanban/*`. Mirrors Phase 52 KANBAN-03 pattern. Add `bad-direct-dndkit-import.tsx` fixture + meta-test. | ✓        |
| `scripts/check-deleted-components.sh` extension   | Grep that fails CI if any non-`@/components/kanban` file imports `@dnd-kit/core`. Lighter; bypasses lint pipeline.                                              |          |
| Both rule + script                                | ESLint for IDE feedback; script for belt-and-suspenders CI. Matches Phase 52 4-layer boundary.                                                                  |          |
| Skip the guard — trust review                     | Migration alone closes D-21. No new rule. Lowest cost; risks regression.                                                                                        |          |

**User's choice:** ESLint `no-restricted-imports` rule

### Q4: How are existing `/kanban` visual baselines handled?

| Option                                            | Description                                                                                                                                                | Selected |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Regenerate + commit (Recommended)                 | Migration changes DOM/CSS → baselines drift. Regenerate `kanban-{ltr,rtl}-{1280,768}-chromium-darwin.png` on operator machine. Commit alongside migration. | ✓        |
| Defer baselines to follow-up plan                 | Migrate WorkBoard first; ship baselines separately after human review. Cleaner commit but more plans.                                                      |          |
| Delete `/kanban` baselines — covered by tasks-tab | Argue identical primitive → one set suffices. (Likely wrong: different surrounding chrome.)                                                                |          |

**User's choice:** Regenerate + commit

### Q5: Triage 4 observed `kanban-*.spec.ts` failures before or during migration?

| Option                              | Description                                                                                                                               | Selected |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Triage first (Recommended)          | Task 1: re-run 8 specs vs current main; record failures. Decide fixed-by-migration vs structural. If structural, fold fix into migration. | ✓        |
| Migrate first, then re-run          | Migration is primary; failures may resolve transitively. Faster but blends migration-induced + pre-existing regressions.                  |          |
| Snapshot pre-migration failure list | Migrate first + capture exact 4 failure names + traces in `57-FIXTURE.md` before migration. Unambiguous diff.                             |          |

**User's choice:** Triage first

---

## D-22 LTR/RTL byte-distinction path

### Q1: How do EN vs AR baselines become byte-distinct?

| Option                               | Description                                                                                                                                | Selected |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `?lng=ar` URL param (Recommended)    | `page.goto('/kanban?lng=ar' \| '/kanban?lng=en')`. i18next URL detector fires before mount → first render in target language. Cheapest.    | ✓        |
| Render-after-language-load gate      | `await page.waitForFunction(() => document.documentElement.lang === expectedLang)`. Works regardless of detector chain. Slower; more code. |          |
| `storageState` fixture per direction | Two Playwright projects with pre-seeded `i18nextLng` in storageState. Cleanest but requires config + globalSetup. Overkill.                |          |
| Combine `?lng` + dir-attribute wait  | URL param AND `waitForFunction`. Defense-in-depth.                                                                                         |          |

**User's choice:** `?lng=ar` URL param
**Notes:** Planner first verifies i18next URL detector is in the detector chain.

### Q2: Which spec files get the fix?

| Option                                                             | Description                                                                                                               | Selected |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| `kanban-visual.spec.ts` + `tasks-tab-visual.spec.ts` (Recommended) | Both at risk of the same bug. Fix both in one pass. Re-baseline both.                                                     | ✓        |
| `kanban-visual.spec.ts` only                                       | D-22 is named against `kanban-*.spec.ts`. tasks-tab baselines may already be correct. Lighter; risk missing parallel bug. |          |
| All e2e specs that `addInitScript` `i18nextLng`                    | grep + fix every match. Most thorough; kills anti-pattern workspace-wide.                                                 |          |

**User's choice:** `kanban-visual.spec.ts` + `tasks-tab-visual.spec.ts`

### Q3: How is byte-distinction proven after the fix?

| Option                              | Description                                                                                                                      | Selected |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Hash comparison in CI (Recommended) | One-shot check asserting `md5sum kanban-ltr-1280-*.png != md5sum kanban-rtl-1280-*.png` (and 768 pair). Mechanical, unambiguous. | ✓        |
| Human visual review only            | Operator regenerates baselines and eyeballs EN vs AR. Phase 46 precedent. Cheaper; risks oversight.                              |          |
| Both — hash + human review          | Hash catches accidental byte-identity; human catches semantic correctness. Belt + suspenders.                                    |          |

**User's choice:** Hash comparison in CI

### Q4: Should the fix include a meta-test/rule to lock the anti-pattern?

| Option                                                     | Description                                                                                                                                                                 | Selected |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Yes — ESLint rule via `no-restricted-syntax` (Recommended) | Ban `addInitScript` callees with arg containing `'i18nextLng'` in `frontend/tests/e2e/**`. Bad-fixture + meta-test. Mirrors D-05 + react-i18next factory check conventions. | ✓        |
| No rule — doc + review                                     | Update `frontend/tests/e2e/README.md` with canonical pattern. Trust review. Lowest cost; relies on memory.                                                                  |          |
| Grep-based CI assertion                                    | Add to scripts/check-* a grep that fails on `addInitScript.*i18nextLng`. Cheaper; no IDE feedback.                                                                          |          |

**User's choice:** Yes — ESLint rule via `no-restricted-syntax`

---

## D-23 live Playwright run shape

### Q1: Who runs the live tasks-tab Playwright pass?

| Option                                         | Description                                                                                                                                                   | Selected |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Local operator on seeded staging (Recommended) | Operator runs 4 `tasks-tab-*.spec.ts` locally against staging Supabase + fixture engagement UUID `00000000-0000-0052-0000-000000000001`. Doppler `.env.test`. | ✓        |
| CI worker on ephemeral staging branch          | Supabase MCP `create_branch` for ephemeral staging. Reproducible but pulls D-15 migration scope.                                                              |          |
| Local operator + record-only CI replay         | Local operator runs canonical pass; CI replays with `--report=html`. Hybrid coverage.                                                                         |          |

**User's choice:** Local operator on seeded staging

### Q2: What lands in the phase folder as the D-23 artifact?

| Option                                                                  | Description                                                                                                                | Selected |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| Run log + per-spec screenshots + `57-LIVE-RUN-SUMMARY.md` (Recommended) | (1) Playwright stdout log, (2) 1 screenshot per spec, (3) summary doc with pass/fail + environment + operator + timestamp. | ✓        |
| Full Playwright HTML report bundle                                      | Entire `playwright-report/` tree. Most thorough; tens of MB; repo bloat.                                                   |          |
| Summary doc only                                                        | Just summary doc. Lightest; weak provenance.                                                                               |          |
| Summary + trace.zip on failures only                                    | Summary always. `trace.zip` only for failing specs. Best signal-to-noise.                                                  |          |

**User's choice:** Run log + per-spec screenshots + `57-LIVE-RUN-SUMMARY.md`
**Notes:** On failure, also commit failing spec's `trace.zip` under `live-run-traces/`.

### Q3: Acceptance bar — how green is 'green enough'?

| Option                                   | Description                                                                                                                     | Selected |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| All 30 tests pass (Recommended)          | All tests pass under canonical run. Existing `test.skip()` entries remain skips (expected-skip, not failure). Cleanest closure. | ✓        |
| All non-skipped tests pass + skip ledger | Document each `test.skip()` rationale in summary's skip ledger. Closes ambiguity for reviewers.                                 |          |
| All non-skipped + N known-flaky budget   | Allow up to N re-runs on flaky tests; document flake. Pragmatic but precedent-setting.                                          |          |

**User's choice:** All 30 tests pass

### Q4: Fixture seeding — reuse 52-FIXTURE.md UUID or fresh seed?

| Option                                               | Description                                                                                                                                   | Selected |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Reuse 52 fixture UUID + verify staging (Recommended) | Use `00000000-0000-0052-0000-000000000001` + 8-task distribution. Phase 57 task verifies engagement exists with contract; reseeds if drifted. | ✓        |
| Fresh phase-57 fixture UUID                          | Create `00000000-0000-0057-0000-000000000001`. More provenance overhead; risks fixture proliferation.                                         |          |
| Re-derive fixture seed from migration                | Add `supabase/seed/` file that idempotently seeds. Most reproducible; biggest scope.                                                          |          |

**User's choice:** Reuse 52 fixture UUID + verify staging composition

---

## Claude's Discretion

- Exact ADR number for the top-level `docs/adr/NNNN-mobile-dnd-scope-out.md` file (planner picks).
- ESLint rule message wording for the two new rules (D-57-08 + D-57-14) — planner refines suggested copy.
- Whether the hash-comparison check is a vitest meta-test, bash script, or Playwright reporter hook (planner picks).
- Exact placement of the new mobile-fallback assertion (new fifth `it()` in `tasks-tab-dnd.spec.ts` vs co-located component test).
- Whether `57-FIXTURE-RESEED.sql` is required upfront vs created only if drift is observed.
- Migration plan task layout for D-21 (atomic commit cadence).

## Deferred Ideas

- Mobile native DnD via Capacitor / Expo — out of scope; v6.4 keeps web-only.
- Full WorkBoard absorb (delete BoardColumn/KCard/board.css) — future cleanup if adapter layer fights primitive evolution.
- Ephemeral Supabase branch for D-23 live run — not adopted; revisit if CI-driven live runs become a milestone goal.
- Full Playwright HTML report committed per phase — explicit scope-out (D-57-17).
- Generalized `?lng` URL-param contract documented in `frontend/tests/e2e/README.md` — sub-ideal follow-up.
- `scripts/check-deleted-components.sh` extension for direct `@dnd-kit/core` imports — rejected in favor of ESLint rule.
- Re-baselining `tasks-tab-visual.spec.ts` snapshots if audit finds they're already correct — gated on audit outcome.
- Net-new fixture engagement UUID for phase isolation — rejected.
- Custom Playwright reporter for run-summary auto-generation — over-engineering.
