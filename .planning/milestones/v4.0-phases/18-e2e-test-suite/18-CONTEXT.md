# Phase 18: E2E Test Suite - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver Playwright E2E coverage for 10 critical user flows (TEST-01..TEST-10) plus CI integration with failure artifacts (TEST-11). Scope is fixed by ROADMAP.md — no new test categories or feature work. Discussion clarified the _how_, not the _what_.

Flows in scope:

1. Login (email/password, session persistence, logout)
2. Engagement creation & lifecycle transition
3. Dossier navigation (list → detail → tabs → RelationshipSidebar)
4. Cmd+K quick switcher
5. Notifications (receive, read, mark-all-read, preferences)
6. Work item CRUD (create task, drag kanban, complete)
7. Calendar events (create, view, lifecycle dates)
8. Export/import from dossier list
9. AI briefing generation from Docs tab
10. Operations Hub dashboard (zones, role switching, navigation)
11. CI integration with screenshots + traces on failure

</domain>

<decisions>
## Implementation Decisions

### Test Architecture

- **D-01:** Use **Page Object Model** — one POM class per major surface (`LoginPage`, `DossierListPage`, `DossierDetailPage`, `WorkItemKanbanPage`, `OperationsHubPage`, `CommandPalettePage`, `NotificationsPage`, `CalendarPage`, `EngagementPage`, `BriefingPage`).
- **D-02:** Shared **auth fixture** using Playwright `storageState` — cache login per role, reuse across specs. No per-test login overhead.
- **D-03:** **Consolidate to a single root `playwright.config.ts`**. The existing `frontend/playwright.config.ts` must be reconciled or removed during planning. One source of truth.
- **D-04:** Spec organization: `tests/e2e/{flow}.spec.ts` for new flows; shared utilities in `tests/e2e/support/` (POMs, fixtures, helpers).

### Test Data Strategy

- **D-05:** **Phase 17 seed data** is the baseline. Tests run against the seeded DB and assume deterministic seed entities exist.
- **D-06:** **Per-test isolation via unique IDs** — entities created during a test use suffixes like `e2e-{nanoid}` so parallel runs never collide. Tests clean up their own entities via API/Supabase calls in `afterEach` where practical.
- **D-07:** Dedicated E2E user accounts per role (admin, analyst, intake officer, etc.) seeded in Phase 17 or provisioned during CI setup. Auth fixture caches each role's `storageState`.
- **D-08:** No global DB reset between tests — relies on isolation discipline (D-06). Reset only between full CI runs if needed.

### Bilingual Coverage

- **D-09:** **English is the default** for all 10 specs.
- **D-10:** **Arabic smoke pack** covers 3 RTL-critical flows: **login, dossier navigation, and Cmd+K**. Captures RTL/i18n regressions without doubling CI time.
- **D-11:** AR smoke specs use the same POMs but switch language via the language selector or a `?lang=ar` URL hint, then assert `dir="rtl"` and a few key Arabic strings.

### CI Execution & Flake Policy

- **D-12:** **Chromium only** (matches our user base; avoids Safari/Firefox quirks not worth chasing yet).
- **D-13:** **2 parallel shards** in CI to keep wall time reasonable.
- **D-14:** **2 retries** on failure — flaky-test tolerance, but log retried tests for visibility.
- **D-15:** Run on **every PR + every push to main**. Block merges on failure.
- **D-16:** **Screenshots + Playwright traces** uploaded as CI artifacts **only on failure**. Retention: GitHub Actions default (90 days) unless cost dictates otherwise.
- **D-17:** Headless mode in CI; `--headed` available locally via npm script.

### Existing Specs Handling

- **D-18:** **Refactor and fold in** the 5 existing specs (`calendar-event-creation`, `country-analyst-relationships`, `intake-officer-processing`, `policy-officer-multi-dossier`, `staff-assignments-context`) to use the new POM + auth fixture pattern. They overlap with TEST-02 / TEST-03 / TEST-06 / TEST-07 — reuse don't rewrite. Map each to its requirement during planning.

### Claude's Discretion

- Exact POM API surface (method names, parameter shapes) — planner/executor decides.
- Selector strategy (data-testid attributes vs role-based queries) — Playwright best practice is role-first, fall back to `data-testid`. Add testids where roles are ambiguous.
- Naming convention for E2E user accounts.
- Whether AR smoke runs as a separate Playwright project or tagged tests.
- Sharding mechanism (Playwright native shards vs matrix strategy in GitHub Actions).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements

- `.planning/ROADMAP.md` §"Phase 18: E2E Test Suite" — goal, success criteria, dependencies
- `.planning/REQUIREMENTS.md` TEST-01..TEST-11 — acceptance criteria

### Existing Test Infrastructure

- `playwright.config.ts` — root Playwright config (reconcile with frontend config)
- `frontend/playwright.config.ts` — frontend-scoped config (consolidate)
- `tests/e2e/calendar-event-creation.spec.ts` — refactor target
- `tests/e2e/country-analyst-relationships.spec.ts` — refactor target
- `tests/e2e/intake-officer-processing.spec.ts` — refactor target
- `tests/e2e/policy-officer-multi-dossier.spec.ts` — refactor target
- `tests/e2e/staff-assignments-context.spec.ts` — refactor target

### Dependent Phases

- `.planning/phases/17-seed-data-first-run/` — seed data baseline (D-05)
- Phase 14 CI pipeline (`.github/workflows/`) — extension point for E2E job (D-15)

### Project Conventions

- `CLAUDE.md` — bilingual + RTL rules, test credentials via `$TEST_USER_EMAIL` / `$TEST_USER_PASSWORD`
- `.env.test.example` — credential pattern for CI

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- 5 existing E2E specs in `tests/e2e/` — partial coverage of engagement, dossier, work item, calendar flows. Refactor into new POM pattern.
- `playwright.config.ts` (root) — Playwright already installed and configured.
- `$TEST_USER_EMAIL` / `$TEST_USER_PASSWORD` env pattern documented in CLAUDE.md.
- Phase 17 seed data + first-run modal — predictable starting state for E2E.

### Established Patterns

- TanStack Router URL-driven state — easy to navigate via URL in tests.
- HeroUI v3 / React Aria components — prefer role-based selectors (`getByRole`).
- i18n via i18next — language switch is a known mechanism (Cmd+K or settings).
- Supabase auth — `storageState` JSON captures session token cleanly.

### Integration Points

- CI pipeline established in Phase 14 — add a Playwright job (matrix shards).
- Supabase test/staging project for E2E DB target.
- Bilingual (`isRTL`) detection lives in components — assert `dir` attribute in AR smoke pack.

### Constraints

- Two `playwright.config.ts` files — must consolidate (D-03).
- E2E must not pollute the staging DB used by humans for UAT.

</code_context>

<specifics>
## Specific Ideas

- AR smoke pack is intentionally narrow (login + dossier nav + Cmd+K) — captures the highest-value RTL regressions (auth, navigation chrome, search overlay) without 2x CI cost.
- POM + storageState fixture is the de-facto Playwright pattern for medium-large suites — research-backed default.
- "2 retries" policy is a flake bandaid, not a license to write flaky tests. Log retries so persistent flakes get fixed at the source.

</specifics>

<deferred>
## Deferred Ideas

- **Cross-browser coverage (Firefox, WebKit)** — defer until user base demands it. Belongs in a future tech-debt or QA phase.
- **Visual regression testing** (Percy / Playwright snapshots) — separate concern, future phase.
- **Load/perf testing in CI** — out of scope for Phase 18.
- **Accessibility audit automation** (axe-core in E2E) — could be folded into a future a11y phase.
- **Test data factory library** beyond simple unique-ID helpers — only if D-06 proves insufficient during execution.

</deferred>

---

_Phase: 18-e2e-test-suite_
_Context gathered: 2026-04-07_
