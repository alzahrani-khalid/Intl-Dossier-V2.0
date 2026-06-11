# Phase 57: Phase 52 Deviation Closure (D-19..D-23) - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the four Phase 52 PASS-WITH-DEVIATION carryovers (D-19, D-21, D-22, D-23 — D-20 already closed in v6.3 via `EngagementKanbanDialog` deletion) so v6.4 stabilization can ship without acknowledged kanban debt. Each deviation reaches a verified resolution recorded against the original deviation row in `.planning/phases/52-heroui-v3-kanban-migration/52-VERIFICATION.md`.

Scope anchors (from ROADMAP.md Phase 57 success criteria):

1. Mobile touch DnD on the shared `@dnd-kit/core` kanban primitive either works on a 768×1024 device OR has an explicit ADR scoping it out with a mobile read-only fallback in place (D-19).
2. The Phase 39 `kanban-*.spec.ts` Playwright specs run green against the shared `@dnd-kit/core` primitive in CI (D-21).
3. Re-running the kanban EN+AR visual baseline diff produces byte-distinct snapshots between LTR and RTL — no false byte-identity (D-22).
4. The live tasks-tab Playwright run executes on seeded staging data with a host operator and the artifact (run log, screenshots, summary) lands in the phase folder (D-23).

**Requirements covered:** DEVIATE-01 (D-19), DEVIATE-02 (D-21), DEVIATE-03 (D-22), DEVIATE-04 (D-23).

**Hard scope boundaries:**

- No new test-framework migrations (Playwright stays; vitest stays).
- No real-backend wiring for `useStakeholderInteractionMutations` (Phase 56 territory).
- No Tier-C design-token suppression cleanup (Phase 58).
- No mobile native or PWA capability work — D-19 closes via ADR per CLAUDE.md "desktop-primary analyst workstation".
- No new fixture engagement UUID — Phase 52 fixture is reused (D-23 decision).

</domain>

<decisions>
## Implementation Decisions

### D-19 — Mobile touch DnD scope-out

- **D-57-01:** Close D-19 via scope-out ADR. TasksTab keeps the existing `<select>` "Move to" mobile picker (`<lg` breakpoint). The shared `KanbanProvider`'s `TouchSensor` (already wired at `frontend/src/components/kanban/KanbanProvider.tsx:99-101` with `{ delay: 200, tolerance: 5 }`) stays available for future consumers but is not exercised by TasksTab on mobile. Rationale: CLAUDE.md "Responsive Design" already classifies mobile as read-mostly; the diplomatic-analyst workstation target is 1280–1400px.
- **D-57-02:** Produce TWO ADR artifacts: (a) phase artifact at `.planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-ADR-D-19-mobile-dnd-scope-out.md` capturing the deviation-closure trail, and (b) top-level ADR at `docs/adr/NNNN-mobile-dnd-scope-out.md` (planner picks the next ADR number) capturing the architectural rule. Both are ACCEPTED with posture: "Closed; reopen requires explicit UX research showing analyst mobile-DnD demand."
- **D-57-03:** No code change in TasksTab consumer or shared primitive — D-19 closure is docs + tests only. Skip-reason strings in `frontend/tests/e2e/tasks-tab-dnd.spec.ts:34` and `frontend/tests/e2e/tasks-tab-keyboard.spec.ts:27` already cite the policy; planner verifies they are crisp but does not refactor.
- **D-57-04:** Verification at 768×1024 reuses existing `tasks-tab-visual.spec.ts` (renders the mobile `<select>` cell) + `tasks-tab-a11y.spec.ts` (axe 768 cell). Add one new assertion (component-level test or a fifth `it()` in `tasks-tab-dnd.spec.ts`) that the mobile branch renders the `<select>` "Move to" picker AND that a programmatic select change updates `workflow_stage` end-to-end. No new spec file needed.
- **D-57-05:** Per-deviation ADRs. D-19 ADR documents the TasksTab mobile branch only; if D-21 ever flips to a scope-out path it would get its own ADR. Keeps closure trail 1:1 with deviation IDs in `52-VERIFICATION.md`.

### D-21 — Phase 39 specs vs shared primitive

- **D-57-06:** Close D-21 by migrating `frontend/src/pages/WorkBoard/WorkBoard.tsx` to consume the shared `@/components/kanban/*` primitive instead of its current direct `@dnd-kit/core` imports (L32-40). The `kanban-*.spec.ts` files keep pointing at `/kanban`; the route now renders the shared primitive transitively. ROADMAP criterion #2 satisfied literally — "specs run green against the shared `@dnd-kit/core` primitive".
- **D-57-07:** Migration scope = **surface swap, not full absorb**. Replace WorkBoard's `DndContext` + raw sensors with `KanbanProvider`. Keep `BoardColumn`, `KCard`, `BoardToolbar`, and `board.css` — these become render adapters/styling injected as `children` of `KanbanProvider` + `KanbanBoard` + `KanbanCard` slots. Preserves WorkBoard's filter/toolbar logic and KCard styling; smallest viable refactor.
- **D-57-08:** Add an ESLint `no-restricted-imports` rule banning direct `@dnd-kit/core` imports anywhere under `frontend/src/pages/**` and `frontend/src/components/**` EXCEPT `frontend/src/components/kanban/**`. Mirrors the Phase 52 KANBAN-03 boundary-hardening pattern (which banned `@/components/kibo-ui/*`). Add a positive-failure fixture at `tools/eslint-fixtures/bad-direct-dndkit-import.tsx` + meta-test asserting the ban fires. Planner adds the bad-fixture to `.eslintignore` only for the meta-test path if needed.
- **D-57-09:** Regenerate AND commit the four `/kanban` visual baselines (`kanban-{ltr,rtl}-{1280,768}-chromium-darwin.png`) as part of the migration plan. Render output drifts because the shared primitive renders different DOM/CSS than raw `@dnd-kit/core`. Operator-driven regeneration on the canonical macOS chromium host (matches Phase 46 + Phase 52 baseline-regeneration precedent). Rationale committed in the plan SUMMARY.
- **D-57-10:** Triage the 4 observed `kanban-*.spec.ts` regressions FIRST. Plan's task 1: re-run the 8 `kanban-*.spec.ts` files against current `main` HEAD, record exact failures (test names + stack traces) in `.planning/phases/57-.../57-PRE-MIGRATION-FAILURES.md`, decide which are likely fixed-by-migration vs structural. If any are structural (not migration-induced), fold the fix into the migration scope. Clean causality for failure attribution (echoes Phase 55 D-13 + Phase 56 D-56-15).

### D-22 — LTR/RTL visual baseline byte-distinction

- **D-57-11:** Fix byte-identity via `?lng=ar` (and `?lng=en`) URL params in `page.goto()` instead of the current `addInitScript` on `localStorage.i18nextLng`. The i18next URL detector fires before React mounts → first render is in the target language → baselines diverge. Planner first verifies that the URL detector (`querystring`) is in the i18n.ts detector chain; if absent, planner adds it as a sub-task — small, well-bounded edit to `frontend/src/i18n/i18n.ts`.
- **D-57-12:** Apply the `?lng` fix to BOTH `frontend/tests/e2e/kanban-visual.spec.ts` (currently L13-15 broken) AND `frontend/tests/e2e/tasks-tab-visual.spec.ts` (audit then fix — tasks-tab may already be correct; verify before re-baselining). Re-baseline both spec files in one operator pass alongside D-21 baseline regen (D-57-09) so the operator runs a single host-side regen pass.
- **D-57-13:** Prove byte-distinction in CI via a hash-comparison check that asserts `md5sum kanban-ltr-1280-*.png != md5sum kanban-rtl-1280-*.png` (and the 768 pair). Lives at `scripts/check-baseline-byte-distinction.sh` (or equivalent), wired into the existing `Bundle Size Check (size-limit)` adjacent CI step (planner picks the least-invasive wiring point — could be a standalone job, or appended to the visual-snapshot-related job). Mechanical, unambiguous, fast.
- **D-57-14:** Add a meta-rule to prevent regression: ESLint `no-restricted-syntax` selector banning `CallExpression[callee.property.name='addInitScript']` whose argument source contains the literal `'i18nextLng'` inside `frontend/tests/e2e/**`. Add positive-failure fixture at `tools/eslint-fixtures/bad-i18n-init.spec.ts` + meta-test. Mirrors the v6.3 D-05 design-token selector pattern AND the Phase 55 react-i18next factory check convention. Folds D-22 into the same boundary-hardening style used across v6.2–v6.4.

### D-23 — Live tasks-tab Playwright run

- **D-57-15:** Local operator (Khalid or designated host operator) executes the canonical run against staging Supabase (`zkrcjzdemdmwhearhfgg`, region `eu-west-2`) using the existing fixture engagement UUID `00000000-0000-0052-0000-000000000001`. Doppler-managed `.env.test` supplies secrets per `.env.test.example`. Matches `52-FIXTURE.md` contract + v6.3 baseline-regeneration operator precedent. No ephemeral staging branch (keeps D-23 inside Phase 57 scope; ephemeral branch flow stays a Phase-58/59-style infrastructure question if it ever resurfaces).
- **D-57-16:** Reuse the Phase 52 fixture UUID (`00000000-0000-0052-0000-000000000001`). Plan task: verify the engagement still exists on staging with the exact 8-row `workflow_stage` composition from `52-FIXTURE.md` (todo×2, in_progress×2, review×1, done×2, cancelled×1). If drifted (rows added/removed/reassigned), reseed via Supabase MCP or a one-shot SQL script committed at `.planning/phases/57-.../57-FIXTURE-RESEED.sql` so the operator and any reviewer can replay deterministically.
- **D-57-17:** Artifact package committed in the phase folder: (a) `57-LIVE-RUN-SUMMARY.md` — pass/fail per spec table + operator + timestamp + commit SHA + environment + `playwright --version`, (b) raw Playwright stdout run log at `57-LIVE-RUN.log`, (c) one representative screenshot per spec at `.planning/phases/57-.../live-run-screenshots/{visual,a11y,dnd,keyboard}.png`. NO full HTML report bundle (too large for the repo); NO trace.zip unless a spec fails (then the failing spec's trace.zip gets committed alongside).
- **D-57-18:** Acceptance bar = **all 30 tests pass** under the canonical run. Existing `test.skip()` entries (D-19 mobile cells + "no cards seeded" fixture skips) remain skips and count as expected-skip, not failure. No flake budget; if the first run shows non-deterministic failure, operator diagnoses root cause rather than re-running. Strict bar keeps closure unambiguous.

### Plan partition & execution

- **D-57-19:** Four plans, one per deviation, parallel-eligible WHERE FILES DON'T COLLIDE — `57-01-PLAN.md` (D-19 ADRs + verification assertion), `57-02-PLAN.md` (D-21 WorkBoard migration + ESLint guard + baseline regen), `57-03-PLAN.md` (D-22 `?lng` fix + hash check + ESLint guard + baseline regen), `57-04-PLAN.md` (D-23 live run + artifacts). D-21 and D-22 both regenerate visual baselines and both touch e2e specs — planner sequences them or co-locates the operator pass so the regen runs ONCE on the host machine. D-23 depends on D-21 (WorkBoard migration may shift `kanban-*.spec.ts` outcomes — the live run wants stable specs).
- **D-57-20:** Execute inline on `main` (no worktree per plan). Scope per plan is small-to-medium; matches Phase 54 D-54-01-INLINE + Phase 56 D-56-14 precedent. If D-21's migration discovers wider ripple in WorkBoard's filter/toolbar/KCard adapters, executor may escalate to a worktree mid-flight (deviation captured per standard pattern).
- **D-57-21:** Verification SEQUENCING: D-19 (docs + assertion) → D-22 (spec-level fix) → D-21 (WorkBoard migration + regen) → D-23 (live run). Reason: D-22 fixes the visual baseline mechanism before D-21 regenerates baselines; D-21 stabilizes `kanban-*.spec.ts` before D-23 measures green-ness. Cleanest failure attribution.
- **D-57-22:** After all 4 plans pass verification, issue annotated + SSH-signed `phase-57-base` tag on the phase-completion commit. Push to origin. `git tag -v phase-57-base` must exit 0 with `Good "git" signature`. Continues the v6.2/v6.3/v6.4-Phase-55-56 closing convention.

### Claude's Discretion

- Exact ADR number for the top-level `docs/adr/NNNN-mobile-dnd-scope-out.md` file (planner picks next available `docs/adr/` slot or creates the folder if it doesn't exist yet).
- ESLint rule message wording for the `no-restricted-imports @dnd-kit/core` ban and the `no-restricted-syntax addInitScript+i18nextLng` ban — planner picks copy that's discoverable in IDE tooltips and clearly names the alternative path.
- Whether the hash-comparison check is a vitest meta-test, a bash script, or a Playwright reporter hook — planner picks the option that minimizes new tooling (vitest meta-test most likely).
- Exact placement of the new mobile-fallback assertion (new fifth `it()` in `tasks-tab-dnd.spec.ts` vs a co-located component test) — planner decides based on e2e-vs-component cost/benefit at planning time.
- Whether `57-FIXTURE-RESEED.sql` is required upfront vs created only if drift is observed — planner verifies staging on plan kick-off and creates the reseed artifact only if needed.
- Migration plan task layout for D-21 (single big PR vs surface-swap-then-test-pass) — planner sequences atomic commits.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements

- `.planning/REQUIREMENTS.md` §DEVIATE-01..04 (lines around DEVIATE bullets) — locked acceptance text for each deviation closure.
- `.planning/ROADMAP.md` §"Phase 57: Phase 52 Deviation Closure (D-19..D-23)" — 4 success criteria are the test oracle.
- `.planning/STATE.md` — current milestone status (v6.4, Phase 56 complete, Phase 57 unblocked).
- `.planning/PROJECT.md` §"Current Milestone: v6.4 Stabilization & Carryover Sweep" — phase shape + scope outline.

### Phase 52 origin artifacts (D-19..D-23 source of truth)

- `.planning/phases/52-heroui-v3-kanban-migration/52-VERIFICATION.md` — `deviations_acknowledged` frontmatter block defines each of D-19..D-23 verbatim. Updates to this file at phase-57 close (per ROADMAP "verified resolution recorded against the original deviation rows").
- `.planning/phases/52-heroui-v3-kanban-migration/52-FIXTURE.md` — fixture engagement UUID `00000000-0000-0052-0000-000000000001` + 8-row workflow_stage composition. Reused for D-23 (D-57-16).
- `.planning/phases/52-heroui-v3-kanban-migration/52-SUMMARY.md` — Phase 52 closure summary; cross-references the deviations.
- `.planning/phases/52-heroui-v3-kanban-migration/52-05-SUMMARY.md` — anchor run results including the 4 observed kanban-\*.spec.ts regressions (D-21 triage source).
- `.planning/milestones/v6.3-MILESTONE-AUDIT.md` §7 — carryover entries for D-19..D-23.

### D-19 source files (mobile DnD scope-out)

- `frontend/src/components/kanban/KanbanProvider.tsx` L99-101 — `TouchSensor` already wired with `{ delay: 200, tolerance: 5 }`. Untouched by Phase 57; cited in ADR for proof that the primitive supports touch.
- `frontend/src/components/kanban/index.ts` — shared primitive re-exports.
- `frontend/tests/e2e/tasks-tab-dnd.spec.ts` L14-16, L28-34 — `768×1024` cells with `test.skip()` and rationale strings. Phase 57 may tighten rationale wording but does not un-skip.
- `frontend/tests/e2e/tasks-tab-keyboard.spec.ts` L13-15, L27 — same shape.
- `frontend/tests/e2e/tasks-tab-visual.spec.ts` — already renders 768 cell (mobile `<select>` branch).
- `frontend/tests/e2e/tasks-tab-a11y.spec.ts` — axe spec at 768 (current pass status confirmed in Phase 52 audit).
- TasksTab consumer (locate via planner): the file that renders the `<select>` "Move to" picker on `<lg` and the `KanbanProvider` on `≥lg`. Likely under `frontend/src/components/` or `frontend/src/pages/engagements/`.
- `CLAUDE.md` §"Responsive Design" — desktop-primary analyst workstation rule; ADR cites this verbatim.

### D-21 source files (WorkBoard migration)

- `frontend/src/pages/WorkBoard/WorkBoard.tsx` L29-50 — current direct `@dnd-kit/core` + `@dnd-kit/sortable` imports; replaced by `@/components/kanban/*` consumption.
- `frontend/src/pages/WorkBoard/BoardColumn.tsx` — render adapter for column cell; stays as `KanbanBoard` child.
- `frontend/src/pages/WorkBoard/BoardToolbar.tsx` — filter/search/toolbar; lives outside the provider scope (no migration delta).
- `frontend/src/pages/WorkBoard/KCard.tsx` — card render adapter; becomes `KanbanCard` child.
- `frontend/src/pages/WorkBoard/board.css` — column/card styling; retained.
- `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` — vitest unit tests; planner re-verifies after migration.
- `frontend/src/routes/_protected/kanban.tsx` — `/kanban` route, `lazy(() => import('@/pages/WorkBoard'))`. Unchanged.
- `frontend/src/hooks/useUnifiedKanban.ts` — data hook consumed by WorkBoard; unchanged.
- `frontend/tests/e2e/kanban-{dnd,a11y,filters,render,responsive,rtl,search,visual}.spec.ts` — 8 Phase 39 specs that target `/kanban`. Become the verification surface.
- `frontend/tests/e2e/kanban-visual.spec.ts-snapshots/` — 4 baselines to regenerate (D-57-09).
- `eslint.config.mjs` — host of the new `no-restricted-imports` rule for `@dnd-kit/core` (D-57-08).
- `tools/eslint-fixtures/bad-kibo-ui-import.tsx` — Phase 52 KANBAN-03 fixture; reference shape for the new `bad-direct-dndkit-import.tsx` fixture.
- `frontend/src/components/kanban/__tests__/eslint-ban.test.ts` — Phase 52 meta-test pattern; mirror for the new ban.
- `scripts/check-deleted-components.sh` — NOT extended in this phase (the new ban lives in ESLint per D-57-08).

### D-22 source files (byte-distinction)

- `frontend/tests/e2e/kanban-visual.spec.ts` L13-15 — broken `addInitScript(i18nextLng)` block; replaced with `?lng` URL param.
- `frontend/tests/e2e/tasks-tab-visual.spec.ts` — audit + fix (verify before re-baselining).
- `frontend/src/i18n/i18n.ts` — i18next detector chain; verify `querystring` (URL param) detector is present. Add if absent.
- `frontend/tests/e2e/kanban-visual.spec.ts-snapshots/` — 4 PNG baselines (regenerate alongside D-21).
- `frontend/tests/e2e/tasks-tab-visual.spec.ts-snapshots/` — re-baseline only if fix changes any byte (likely yes for the AR cell).
- `eslint.config.mjs` — host of the new `no-restricted-syntax` rule for `addInitScript(i18nextLng)` (D-57-14).
- `tools/eslint-fixtures/bad-i18n-init.spec.ts` — new positive-failure fixture (D-57-14).
- `tools/eslint-fixtures/bad-vi-mock.ts` + `tools/eslint-fixtures/bad-design-token.tsx` — pattern references for the new fixture's shape and the meta-test that exercises it.
- `scripts/check-baseline-byte-distinction.sh` (new) OR vitest meta-test (planner picks) — hash-comparison enforcement (D-57-13).

### D-23 source files (live Playwright run)

- `frontend/tests/e2e/tasks-tab-{visual,a11y,dnd,keyboard}.spec.ts` — 4 spec files; 30 tests total per Phase 52 enumeration.
- `frontend/playwright.config.ts` — Playwright config; planner inspects for project + retry config.
- `.env.test.example` — env-var contract for the live run.
- `CLAUDE.md` §"Test Credentials for Browser/Chrome MCP" — `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` pattern.
- `.planning/phases/52-heroui-v3-kanban-migration/52-FIXTURE.md` §"Engagement composition contract" — the 8-row workflow_stage table used to verify fixture integrity.
- Live-run artifacts land under `.planning/phases/57-phase-52-deviation-closure-d-19-d-23/`:
  - `57-LIVE-RUN-SUMMARY.md` (planner spec'd; operator filled at run-time)
  - `57-LIVE-RUN.log` (raw stdout)
  - `live-run-screenshots/{visual,a11y,dnd,keyboard}.png`
  - On failure only: `live-run-traces/<failing-spec>.zip`

### v6.4 milestone gates (must remain green)

- `eslint.config.mjs` — D-05 design-token rule at `error`; the two NEW rules (D-57-08 + D-57-14) inherit `error` severity.
- `.github/workflows/ci.yml` — 8 required contexts on `main` per Phase 55 D-13 (`type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`, `Design Token Check`, `react-i18next Factory Check`). Phase 57 may add a new context if the hash-comparison check warrants its own job — planner picks.
- `tests/security/rls-audit.test.ts` — Phase 56 RLS-01 contract; must remain green.

### Tag provenance

- `phase-47-base`, `phase-48-base`, `phase-49-base`, `phase-54-base`, `phase-55-base`, `phase-56-base` — SSH-signed annotated tags reachable from `main`. Phase 57 must NOT regress any. New `phase-57-base` issues at phase completion per D-57-22.

### Deployment + project guardrails

- `CLAUDE.md` §"Deployment Configuration" — staging project ID `zkrcjzdemdmwhearhfgg`, region `eu-west-2`. Live run targets this.
- `CLAUDE.md` §"Visual Design Source of Truth" — no design system work in this phase, but baseline regeneration must not introduce token regressions.
- `CLAUDE.md` §"Arabic RTL Support Guidelines" — logical properties + `dir={isRTL ? 'rtl' : 'ltr'}` rules. WorkBoard migration must not regress.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Shared `@dnd-kit/core` kanban primitive at `frontend/src/components/kanban/`** — already in place from Phase 52: `KanbanProvider`, `KanbanBoard`, `KanbanCard`, `KanbanCards`, `KanbanHeader`. WorkBoard migration (D-21) consumes these directly.
- **`TouchSensor` activation constraint pattern** — `{ delay: 200, tolerance: 5 }` in `KanbanProvider.tsx:99-101`. Standard `@dnd-kit/core` mobile tuning; ADR cites it as proof the primitive is touch-ready even though TasksTab opts out.
- **Phase 52 KANBAN-03 boundary-hardening template** — `eslint.config.mjs` ban + `tools/eslint-fixtures/bad-kibo-ui-import.tsx` positive-failure fixture + `frontend/src/components/kanban/__tests__/eslint-ban.test.ts` meta-test. Mirror exactly for D-57-08 (`bad-direct-dndkit-import.tsx`) and D-57-14 (`bad-i18n-init.spec.ts`).
- **`addInitScript` → `page.goto('?lng=...')` swap pattern** — replaces the current 2-line block in `kanban-visual.spec.ts` L13-15. Simple textual transform.
- **`page.waitForLoadState('networkidle')` + `document.fonts.ready` pre-screenshot block** — preserved in D-22 fix; existing pattern in `kanban-visual.spec.ts:23-25`.
- **Phase 53/54/55/56 phase-base tag pattern** — `git tag -as phase-NN-base -m "..."`. Continue exactly for D-57-22.
- **Phase 52 fixture engagement UUID** `00000000-0000-0052-0000-000000000001` — reused for D-23.
- **`mcp__claude_ai_Supabase__execute_sql`** — staging fixture verification path. If drifted, also `mcp__claude_ai_Supabase__apply_migration` for the reseed.

### Established Patterns

- **Per-deviation closure trails** — each PASS-WITH-DEVIATION row in 52-VERIFICATION.md gets a corresponding closure artifact in Phase 57. Updates to 52-VERIFICATION.md happen at phase close (status flips from `passed_with_deviation` to `passed` if all 5 deviations land — though D-20 already shipped; D-19/21/22/23 are the new closures).
- **Inline-on-main mechanical fixes (Phase 54 D-54-01-INLINE + Phase 56 D-56-14)** — small-blast-radius edits ride directly on the current branch with atomic per-task commits; no worktree ceremony.
- **Sequential verification despite parallel-eligible plans (Phase 55 D-13 + Phase 56 D-56-15)** — when one plan's verification depends on another's outcome, verify sequentially in dependency order to keep failure attribution clean. D-57-21 applies the same rule.
- **Operator-driven baseline regeneration (Phase 46 + Phase 52)** — visual baselines regenerate on the canonical macOS chromium host with human review; CI replays for verification.
- **ESLint rule + positive-failure fixture + meta-test (KANBAN-03)** — 3-layer boundary hardening. D-57-08 and D-57-14 reuse this exact shape.
- **Annotated + SSH-signed `phase-NN-base` tag at close (BUNDLE-06)** — `git tag -v` exits 0 with `Good "git" signature`. D-57-22 continues.

### Integration Points

- **`frontend/src/pages/WorkBoard/WorkBoard.tsx`** — primary refactor surface for D-21. The component owns the route's React tree under `/kanban`.
- **`eslint.config.mjs`** — gains TWO new rules (D-57-08 + D-57-14). Both at `error` severity; both wired into the existing `Lint` PR-blocking context (no new CI job for ESLint).
- **`frontend/tests/e2e/`** — visual specs (`kanban-visual.spec.ts`, `tasks-tab-visual.spec.ts`) modified for D-22; 4 PNG baselines under `kanban-visual.spec.ts-snapshots/` regenerated for D-21+D-22; 30-test enumeration across `tasks-tab-*.spec.ts` exercised for D-23.
- **`scripts/` (or vitest meta-test slot)** — new hash-comparison enforcement (D-57-13). Planner picks placement.
- **`.planning/phases/57-.../` (phase folder)** — D-19 ADR + D-23 artifacts land here.
- **`docs/adr/`** — top-level ADR lands here (D-57-02). Create folder if absent.
- **`.planning/phases/52-heroui-v3-kanban-migration/52-VERIFICATION.md`** — updated at phase close to record D-19/21/22/23 resolution status against the original deviation rows.
- **Supabase staging** (`zkrcjzdemdmwhearhfgg`, `eu-west-2`) — D-23 fixture verification + optional reseed.

### Anti-patterns to avoid

- **Un-skipping the 768 cells in `tasks-tab-dnd/keyboard.spec.ts` without a TasksTab mobile branch refactor** — D-19 is scope-out; the `<select>` mobile branch remains canonical. Don't write touch-DnD e2e tests against an unimplemented surface.
- **Migrating WorkBoard but leaving `board.css` to fight shared-primitive tokens** — verify token compatibility during D-21 (D-05 design-token rule at `error` will flag raw hex regressions; trust the gate).
- **Re-introducing `addInitScript(i18nextLng)` in any new spec** — D-57-14's ESLint rule prevents this once installed; until then, planner must hand-check during D-22 implementation.
- **Re-baselining without the fix landing first** — D-22 fix MUST land before any baseline regen, else the regen captures the same byte-identical pair. Sequencing in D-57-21 enforces this.
- **Committing the full Playwright HTML report bundle for D-23** — too large; explicitly out of scope per D-57-17.
- **Creating a new fixture engagement UUID for Phase 57** — explicit scope-out per D-57-16. Reuse `00000000-0000-0052-0000-000000000001`.
- **Touching `tools/eslint-fixtures/bad-design-token.tsx` or `bad-vi-mock.ts`** — those are owned by Phase 55 (existing) + Phase 59 (POLISH-04 positive-failure assertion). Phase 57 only ADDS `bad-direct-dndkit-import.tsx` + `bad-i18n-init.spec.ts`.
- **MCP-only DB patches for the fixture reseed (no committed migration/SQL)** — if reseed is needed, commit a one-shot SQL file (or repo migration if persistent change). Aligns with Phase 56 D-56-04 rule.

</code_context>

<specifics>
## Specific Ideas

- **Top-level ADR filename:** planner picks the next available `docs/adr/` slot. If `docs/adr/` doesn't exist yet, create with a brief README explaining the directory's purpose + numbering convention. Filename shape: `NNNN-mobile-dnd-scope-out.md`.
- **Phase artifact ADR filename:** `.planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-ADR-D-19-mobile-dnd-scope-out.md`.
- **ESLint rule message text (D-57-08):** suggested copy — `"Import @dnd-kit/core directly is banned outside frontend/src/components/kanban/*. Use the shared primitive (KanbanProvider, KanbanBoard, KanbanCard) from @/components/kanban instead."`. Planner refines.
- **ESLint rule message text (D-57-14):** suggested copy — `"addInitScript() with 'i18nextLng' is banned in e2e specs (causes EN/AR byte-identical baselines). Use page.goto(url + '?lng=ar') instead — see 57-CONTEXT.md D-57-11."`. Planner refines.
- **Hash-comparison check name:** `scripts/check-baseline-byte-distinction.sh` (preferred) OR a vitest meta-test at `frontend/tests/security/baseline-byte-distinction.test.ts`. Planner picks based on existing repo CI wiring patterns.
- **Migration commit cadence for D-21:** one atomic commit per task (triage results → migration → tests pass → guard rule → baseline regen → SUMMARY). Echoes Phase 52 KANBAN-01..04 cadence.
- **D-23 SUMMARY narrative:** match the Phase 52 acknowledged-deviation prose style — environment, fixture composition snapshot, operator, timestamp, pass/fail table, links to screenshots.
- **Phase-57-base tag message body:** match Phase 53/54/55/56 precedent — single-line subject + multi-line body listing the closed deviations (D-19, D-21, D-22, D-23) and the commit anchor.
- **Verification spec per plan:**
  - Plan 01 (D-19): both ADR files exist + 1 new assertion passes in `tasks-tab-dnd.spec.ts` (or co-located component test) + `grep -E "test.skip.*768" frontend/tests/e2e/tasks-tab-{dnd,keyboard}.spec.ts` still returns the expected skips (unchanged).
  - Plan 02 (D-21): 8 `kanban-*.spec.ts` files all green; `frontend/src/pages/WorkBoard/WorkBoard.tsx` imports `@/components/kanban` (not `@dnd-kit/core` directly); `pnpm exec eslint tools/eslint-fixtures/bad-direct-dndkit-import.tsx` exits 1; 4 regenerated baselines committed; meta-test green.
  - Plan 03 (D-22): `md5sum kanban-ltr-1280-*.png != md5sum kanban-rtl-1280-*.png` (and 768 pair); `pnpm exec eslint tools/eslint-fixtures/bad-i18n-init.spec.ts` exits 1; visual specs green against new baselines.
  - Plan 04 (D-23): all 30 tests pass (or expected-skip); 57-LIVE-RUN-SUMMARY.md + 57-LIVE-RUN.log + 4 screenshots committed.
- **Cross-phase update:** the final task of the last plan updates `.planning/phases/52-heroui-v3-kanban-migration/52-VERIFICATION.md` to record each of D-19/21/22/23 as RESOLVED with cross-link to the Phase 57 plan + commit SHA. Frontmatter `status` field flips from `passed_with_deviation` to `passed` if all 5 deviations land closed (D-20 already closed in v6.3).
- **MCP project ID confirmation:** `zkrcjzdemdmwhearhfgg` (eu-west-2) per CLAUDE.md.

</specifics>

<deferred>
## Deferred Ideas

- **Mobile native DnD via Capacitor / Expo** — out of scope; v6.4 keeps web-only. ADR's reopen clause covers this if analyst UX research surfaces demand.
- **Full WorkBoard absorb (delete BoardColumn/KCard/board.css)** — D-57-07 picks surface-swap; full absorb is a future cleanup phase if the adapter layer fights the shared primitive's evolution.
- **Ephemeral Supabase branch for D-23 live run** — discussed; not adopted (D-57-15 picks local-operator-on-staging). Revisit if CI-driven live runs ever become a milestone goal.
- **Full Playwright HTML report committed per phase** — explicit scope-out (D-57-17 picks summary + screenshots). Trace.zip on failures only.
- **Generalized `?lng` URL-param contract documented in `frontend/tests/e2e/README.md`** — sub-ideal; can be a follow-up doc task if e2e onboarding becomes a recurring question.
- **`scripts/check-deleted-components.sh` extension for direct `@dnd-kit/core` imports** — discussed as alternative to ESLint rule; rejected in favor of ESLint (D-57-08) for IDE feedback. Revisit if ESLint rule proves slow.
- **Re-baselining `tasks-tab-visual.spec.ts` snapshots as part of D-22 even if audit finds they're already correct** — gated on audit outcome. Planner skips re-baselining if audit shows the current snapshots already pass post-fix.
- **Net-new fixture engagement UUID for phase isolation** — discussed and rejected (D-57-16). Phase 52 UUID reused.
- **Custom Playwright reporter for run-summary auto-generation** — over-engineering. Operator hand-writes `57-LIVE-RUN-SUMMARY.md` from the canonical run.

</deferred>

---

_Phase: 57-Phase 52 Deviation Closure (D-19..D-23)_
_Context gathered: 2026-05-18_
