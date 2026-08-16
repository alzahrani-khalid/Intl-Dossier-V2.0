---
phase: 94
slug: write-paths
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-16
---

# Phase 94 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `94-RESEARCH.md` §Validation Architecture. Task-level rows are filled by the
> planner; this document fixes the infrastructure, the sampling rate, and the Wave 0 set.

**This file exists because Phase 93's did not.** `nyquist_validation: true` has been configured
throughout, `93-RESEARCH.md` carries the `## Validation Architecture` heading the workflow greps
for, and `93-VALIDATION.md` was never created — the step's own "if not created, STOP" never fired
and the phase closed anyway (`GATESTD-02`). Its existence here was **verified by command**, not
assumed from the step having run.

---

## Test Infrastructure

<!-- prettier-ignore -->
| Property | Value |
| --- | --- |
| **Frameworks** | Vitest (unit/component — jsdom frontend, node backend) + Playwright (E2E) |
| **Config files** | `frontend/vitest.config.ts` (includes `**/*.test.{ts,tsx}`, excludes `*.spec.*`) · `backend/vitest.config.ts` (unit, **required** CI) vs `backend/vitest.integration.config.ts` (**non-required**) · root `playwright.config.ts` (testDir `tests/e2e`) · `frontend/playwright.config.ts` (testDir `frontend/tests`, `globalSetup` logs in with `TEST_USER_*`) |
| **Quick run** | `pnpm -C frontend exec vitest run <file>` · `pnpm -C backend exec vitest run <file>` |
| **Full suite** | `pnpm test` (Turbo — **pass `--continue`**, it aborts without it) · E2E: `pnpm -C frontend test:e2e` · root: `pnpm exec playwright test <specs> --no-deps` |

### Instrument constraints that change how commands are written

These are not trivia — each one has silently produced a wrong result in this repo before.

- **Root Playwright projects depend on `setup` and carry a stale `storageState`.** Every root-config
  project (`chromium-en`, `chromium-ar-smoke`, `chromium-mobile`) has `dependencies: ['setup']` and
  `storageState: tests/e2e/support/storage/admin.json` (last written Jun 4). `E2ECRED-01` is an
  operator act that has not happened. **Root specs run `--no-deps` with inline `TEST_USER_*` auth** —
  the pattern 11 shipped specs across P92/P93 already use (`D-27`). Not optional.
- **Spec paths are FILTERS** (`D-26`). Two or more paths with at least one match silently drops the
  rest and exits 0. Assert file existence first; **hardcode** the expected test count; never derive
  it from `--list`. `--list` also includes a dependency project's tests unless `--no-deps` is passed
  (GATE-STANDARD C6).
- **Colocated backend tests never run.** Anything under `backend/src/**/__tests__/` sits outside
  every vitest `include` glob, so `backend/src/services/__tests__/auth.service.test.ts` is a
  **non-oracle**. New backend tests for `AUDIT-DROP-01` go under `backend/tests/`.
- **Root `tests/` vitest cannot resolve `@`→`frontend/src`** (`ROOTALIAS-01`, Phase 101). New unit
  tests for frontend files go under `frontend/`, never root `tests/`.
- **`timeout` does not exist on this machine.** A `timeout N <cmd>` gate line dies with
  `command not found`, emits nothing, and a piped `wc -l` reads `0` — indistinguishable from a clean
  result. Three "measurements" during this phase's planning were that error.
- **`grep` is a shell function wrapping ugrep 7.5.0 that honours `.gitignore`.** Recursive sweeps
  rooted at the repo root do not see `.tickmarkr/`. Gates that sweep must use explicit file
  arguments or `find … -print0 | xargs -0 grep`, and must be instrument-tested against a
  known-present token before a zero is believed.
- **tickmarkr gates run `bash -lc`, where Node resolves to 20.11.1** — below the repo's engines
  floor. Gate commands must not invoke node-version-sensitive tooling bare.
- **The GATE-STANDARD C9b script fails open under zsh** (unquoted `$ROOTS` does not word-split, so
  it searches one nonexistent multi-line path) and misses ~48 colocated `__tests__` directories.
  Run it under `bash` explicitly and derive the colocated roots too.

---

## Sampling Rate

- **After every task commit:** the touched file's quick vitest run + `pnpm -C frontend type-check`
- **After every plan wave:** `pnpm lint` (carries the i18n key-set-equality gate) + the affected
  Playwright specs with `--no-deps`
- **Phase gate:** full vitest suites green; E2E judged against the **`E2ESTALE-01` known-red
  inventory** (6 pre-existing reds), not against absolute green — absolute E2E green is Phase 101's
  criterion, and claiming it here would import another phase's debt; plus the gate drill and the
  deploy probes
- **Max feedback latency:** quick run seconds; wave-level minutes

---

## Per-Task Verification Map

**Requirement-level map, from research. The planner fills task ids and threat refs when the plans
exist** — this table is the contract those rows must satisfy, not a substitute for them.

<!-- prettier-ignore -->
| Requirement | Behaviour to verify | Test type | Automated command | File exists |
| --- | --- | --- | --- | --- |
| `WRITE-01` | Create-mode Save enables on content; publish wired end-to-end | component + **probe** | `pnpm -C frontend exec vitest run tests/component/AfterActionForm.test.tsx` (extend with create-mode cases) · `node scripts/probe-after-action-publish.mjs` (create → publish → **read back** `publication_status === 'published'`) | ✅ component (extend) · ❌ probe Wave 0 |
| `WRITE-02` | List renders rows including the degraded join; detail shows translated copy, not a raw key | e2e / probe | new spec or authenticated probe against the **deployed** `after-actions-list-all` (assert 200 + row shape); detail spec forces the query error and asserts no raw key | ❌ Wave 0 |
| `WRITE-03` | `/intake/new` submits with a **non-RFC-uuid** dossier id | component | `pnpm -C frontend exec vitest run tests/component/IntakeForm.test.tsx` (extend; the existing "zod blocks submit" case must survive) | ✅ (extend) |
| `WRITE-04` | Drag persists **by read-back**; `review` rejects with a bilingual alert; own-column drop is a no-op; a would-be-coerced drag is refused | unit (mapper) + component (`onDragEnd` capture) + live read-back probe | `pnpm -C frontend exec vitest run src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` (update in-task) · new mapper unit test · staging read-back probe | ✅ WorkBoard.test (update) · ❌ mapper test Wave 0 |
| `WRITE-05` | Save succeeds; `users` row **and** category prefs read back changed; survives reload | e2e + probe | new `settings-save` spec (frontend config, real login) asserting reload persistence + SQL read-back | ❌ Wave 0 |
| `WRITE-06` | No `42P17` on report reads; **`D-22` two-sided** visibility holds | SQL probe + e2e | post-migration authenticated PostgREST reads (200, not 500/`42P17`); fixture-based A/B/C visibility assertion; tightened `93-report-notfound.spec.ts` | spec ✅ (tightened) · probes ❌ Wave 0 |
| `AUDIT-DROP-01` | `logSecurityEvent` lands a row; a failed insert is surfaced | backend unit/integration | new test **under `backend/tests/`** (colocated never runs) + staging row-count delta probe | ❌ Wave 0 |
| `AUDIT-ZERO-01` | Repaired writers insert a valid shape **and are deployed** | probe + derivation | re-run the both-quote-styles key-diff derivation → 0 broken; post-deploy probe exercising a representative, then `select count(*) from audit_logs` > 0 | derivation exists in research · probe ❌ Wave 0 |
| `ARMA-01` | Spec asserts the 404 arm **alone** and passes | e2e | `pnpm exec playwright test tests/e2e/93-report-notfound.spec.ts --no-deps` (**hardcode `1 passed`**, per `D-26`) | ✅ (edited in-plan, ordered after the migration) |

> **`WRITE-01`'s e2e nomination was WRONG and is corrected above (`RULING-P94-06` B6).** This table
> originally nominated `frontend/tests/e2e/after-action-create.spec.ts`. That spec navigates to
> **`/after-action/create`** (`:249`, awaiting a response on the same path at `:181`) — **a route
> that does not exist**. The tree has `/after-actions/…` (plural: list + detail) and
> `/engagements/$engagementId/after-action`. Verified independently by listing
> `frontend/src/routes/**/*after-action*`. A spec pointed at a nonexistent route yields an
> uninformative red, so it could never have been criterion 1's oracle. Replaced by a read-back
> probe. Both stale specs are filed to `E2ESTALE-01` (Phase 101) with this fact.

_Status legend for the planner's expansion: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Commitment-status mapper unit test, beside `useUnifiedKanban`
- [ ] `settings-save` reload-persistence spec (frontend Playwright config)
- [ ] After-actions list/detail error-state spec or authenticated probe
- [ ] Backend audit-write test **under `backend/tests/`**
- [ ] `D-22` two-sided visibility probe with seeded report/share fixtures — **blocked on
      `PARK-94-07`** (second identity); both report tables hold 0 rows, so fixtures are required
      regardless of how that park is ruled
- [ ] Deploy-probe checklist for the redeploy round, reusing `scripts/probe-edge-auth.sh`

---

## Manual-Only Verifications

<!-- prettier-ignore -->
| Behaviour | Requirement | Why manual | Instructions |
| --- | --- | --- | --- |
| RTL render of any new error/reject copy | `WRITE-04`, `WRITE-02` | Inherited operator park — Arabic has been verified as JSON key-sets and string inequality, **never as pixels**, since Phase 92 (`RULING-P93-06` order 2). The key-set-equality gate proves the keys exist in both locales; it does not prove the Arabic renders correctly | Load the surface with `dir="rtl"`, confirm Tajawal applies and the alert reads correctly in Arabic |

Everything else in this phase has an automated verification or an explicit Wave 0 entry.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Every Playwright command carries `--no-deps` and a hardcoded expected count
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending — the planner completes the task-level rows; this contract is what they must
satisfy.
