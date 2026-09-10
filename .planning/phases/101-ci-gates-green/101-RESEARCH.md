# Phase 101 — RESEARCH: the measurements, each with the command that reproduces it

Taken 2026-09-10 from repo HEAD `3ec257adc` (branch `milestone/v10.0-trust`), against GitHub
`alzahrani-khalid/Intl-Dossier-V2.0` and `origin/main` = `e990ed844`. Every number below sits beside
the command that produced it and that command's exit code. A grep zero carries a positive control.
Nothing was run that the brief forbids: no vitest, no playwright suite — `--list` only, `gh` read-only,
`git`, `grep`, `ls`, `node -e`, `lsof`.

Register note. The Phase 100 register re-derived catalog counts with `psql`. This phase's subject is
CI, so the equivalent authority is the GitHub Actions API: run ids, job ids, and job logs are cited by
id and can be re-fetched by anyone with `gh` and read access. Job logs were pulled with
`gh run view --job <id> --log-failed`; the ANSI colour codes were stripped with
`sed -E 's/\x1b\[[0-9;]*m//g'` before grepping.

## Project Constraints (from CLAUDE.md)

- Schema changes only via migration files; RLS on every end-user table — not touched by this phase.
- GSD is the sole workflow layer; tickmarkr executes plans; workers cannot read an untracked phase dir
  (commit the phase dir before a run).
- Playwright dev-stack sessions: the root config already routes through `scripts/pw-run-reaped.mjs`
  (RULING-P99-50); `frontend/playwright.config.ts` does not (Amendment 3 of that ruling defers it to
  CARRY-10 / this phase).
- `main` is protected; commits go through a PR with 8 required checks (§2). Branch-protection edits
  and secret writes are operator acts — an agent must not perform them.
- No `Agent` tool was used to produce this file (brief HARD RULE 1).

---

## §0 — Criterion → question map

| # | Roadmap criterion (ROADMAP.md:623-628) | Requirement | Sections |
| - | -------------------------------------- | ----------- | -------- |
| 1 | E2E suite green against the deployed app, or in-spec quarantine per failing spec | CARRY-02, E2ECRED-01, ORACLECAP-01 | §1.1, §1.3, §3, §8.1 |
| 2 | Integration suite green; decision D-3 resolved and recorded | CARRY-03 | §1.2, §4, §8.2 |
| 3 | At least one a11y spec demonstrated PASSING with run evidence | CARRY-04 | §1.3, §5, §8.3 |
| 4 | `test-rtl-smokes` a required context on `main`, proven by a smoke PR observed BLOCKED | CARRY-05 | §2, §8.4 |
| 5 | The six currently-red non-required suites green or honestly quarantined | CARRY-09 | §1, §7, §8.5 |
| 6 | Both Playwright configs leave zero attributed dev-stack sessions; refusal/unavailable fails the command | CARRY-10 | §6, §8.6 |

---

## §1 — `main` CI state (Q1)

### §1.0 The runs

```bash
gh run list --branch main --limit 8 --json databaseId,workflowName,conclusion,createdAt,headSha
```

exit 0. The newest push to `main` is `e990ed844` (merge of PR #98, 2026-08-14T22:58:38Z). Nothing has
been pushed to `main` since; `git fetch origin main && git rev-parse origin/main` → `e990ed844`
(exit 0). The three most recent `CI` runs on `main` and the three most recent `E2E Tests` runs on
`main` are all `failure`. So "main is red" is 26 days old and has no newer data point.

| workflow | run id | conclusion |
| -------- | ------ | ---------- |
| CI | 31848669701 | failure |
| E2E Tests | 31848669722 | failure |
| Deploy | 31849466636 | skipped |

### §1.1 Every job, with conclusion

```bash
gh run view 31848669701 --json jobs -q '.jobs[] | "\(.databaseId)\t\(.conclusion)\t\(.name)"'   # exit 0
gh run view 31848669722 --json jobs -q '.jobs[] | "\(.databaseId)\t\(.conclusion)\t\(.name)"'   # exit 0
```

**CI (19 jobs — 12 success, 7 failure):**

| job id | conclusion | job `name:` | job key | required? |
| ------ | ---------- | ----------- | ------- | --------- |
| 94920109121 | success | Repo Policy (Secrets/Artifacts) | `repo-policy` | no |
| 94920109130 | **failure** | Security Scan | `security-scan` | **YES** |
| 94920141343 | success | Design Token Check | `design-token-check` | yes |
| 94920141352 | success | Tests (frontend) | `test-frontend` | yes |
| 94920141355 | success | type-check | `type-check` | yes |
| 94920141376 | success | Tests (backend) | `test-backend` | yes |
| 94920141420 | success | Lint | `lint` | yes |
| 94920141438 | **failure** | E2E Tests | `test-e2e` | no |
| 94920141442 | **failure** | Tests (integration) | `test-integration` | no (`continue-on-error`) |
| 94920141487 | success | react-i18next Factory Check | `i18next-factory-check` | yes |
| 94920552740 | **failure** | RTL + Responsive Tests | `test-rtl-responsive` | no |
| 94920552761 | **failure** | RTL Portal + Component Smokes | `test-rtl-smokes` | no |
| 94920552778 | success | Eval Gate | `eval-gate` | no |
| 94920552794 | **failure** | Accessibility Tests (RTL + WCAG AA) | `test-a11y` | no |
| 94920552827 | success | Bundle Size Check (size-limit) | `bundle-size-check` | yes |
| 94920943088 | success | Build (frontend) | `build` (matrix) | no |
| 94920943116 | success | Build (backend) | `build` (matrix) | no |
| 94921234470 | success | Lighthouse CI | `lighthouse-ci` | no |
| 94921234540 | **failure** | Docker Build | `docker-build` | no |

**E2E Tests workflow (5 jobs — 1 success, 4 failure):**

| job id | conclusion | job `name:` | job key |
| ------ | ---------- | ----------- | ------- |
| 94920109119 | **failure** | E2E (shard 1/2) | `e2e` |
| 94920109185 | **failure** | E2E (shard 2/2) | `e2e` |
| 94920109160 | **failure** | QA Sweep (axe / responsive / keyboard / focus-outline) | `qa-sweep` |
| 94920109214 | **failure** | Visual Regression (Phase 46) | `visual-regression-phase-46` |
| 94923049079 | success | Merge Playwright reports | `merge-reports` |

**Population note for CARRY-09.** The requirement names "E2E" as one of six. There are TWO things
called E2E on `main`: the `ci.yml` job `E2E Tests` (frontend config, dev server, `pnpm run test:e2e`)
and the `e2e.yml` workflow's two `E2E (shard n/2)` jobs (root config, deployed app at `E2E_BASE_URL`).
They fail for different reasons (§1.3). Criterion 1 says "against the deployed app", so it names the
`e2e.yml` shards; CARRY-09's list reads as the `ci.yml` job names. The planner must name both or
the phase closes on the wrong one. Also outside the six but red: `Security Scan` (required — §9 F1),
`QA Sweep`, `Visual Regression (Phase 46)` (the latter is CARRY-06's, Phase 102).

### §1.2 Failing step per suite

```bash
for id in 94920141438 94920141442 94920552794 94920552761 94920552740 94921234540; do
  gh api "repos/alzahrani-khalid/Intl-Dossier-V2.0/actions/jobs/$id" \
    -q '.steps[] | select(.conclusion=="failure") | "STEP#\(.number) \(.name)"'; done   # exit 0 ×6
```

| suite | failing step | log lines fetched (`gh run view --job <id> --log-failed`, exit 0) |
| ----- | ------------ | --- |
| E2E Tests (ci.yml) | STEP#8 Run E2E tests | 2403 |
| Tests (integration) | STEP#6 Run backend integration tests | 32929 |
| Accessibility Tests (RTL + WCAG AA) | STEP#7 Run Accessibility tests | 2901 |
| RTL Portal + Component Smokes | STEP#7 Run RTL portal + component smokes | 862 |
| RTL + Responsive Tests | STEP#7 Run RTL + Responsive tests | 2901 |
| Docker Build | STEP#6 Build and push Docker images | 828 (`gh api .../logs`) |

(`gh api .../jobs/<id>/logs` refused the Playwright logs with "the response contains terminal escape
sequences"; `gh run view --job <id> --log-failed` returned them.)

### §1.3 FIRST failure cause, classified, with the log line

**E2E Tests (`ci.yml` job, 94920141438) — CONFIG.** The job sets `TEST_USER_EMAIL` /
`TEST_USER_PASSWORD` at job level from `E2E_ANALYST_*` secrets (`ci.yml:241-246`; the log masks
them as `***` in the env dump, so they were populated), then runs `pnpm run test:e2e` = `turbo run
test:e2e`. Log line 2253:

```
2026-08-14T23:02:01.1715960Z Error: TEST_USER_EMAIL / TEST_USER_PASSWORD missing — see .env.test (Doppler dev config).
   at e2e/global-setup.ts:34
```

Turbo 2.9.14 (`pnpm exec turbo --version`, exit 0) runs tasks in strict env mode; `turbo.json`'s
`test:e2e` task declares no `env`/`passThroughEnv` (only `dev` has `"passThroughEnv": ["*"]`;
`grep -n "envMode\|strict" turbo.json` → nothing, exit 1). The job-level env never reaches the
Playwright child. Corroboration: the three sibling jobs that call `pnpm exec playwright test`
directly (no turbo) authenticated and reached assertions (below). **Not credentials-missing at the
GitHub layer** — the secrets exist (§3) — a turbo env-filter config defect.

Second, latent cause behind the first (measured locally, `--list` only):

```bash
cd frontend && pnpm exec playwright test --list 2>&1 | grep -E "^Total|Error"
```

exit 0, `Total: 0 tests in 0 files`, preceded by **10 load errors**: 5 × `ReferenceError: __dirname
is not defined in ES module scope` (`ai-extraction`, `attachment-limit`, `file-size-limit`,
`invalid-file-type`, `virus-detection` specs), 1 × `Cannot find package '@faker-js/faker'`
(`sla-tracking.spec.ts`; `grep -n faker frontend/package.json package.json` → none, exit 1), and
4 × `test file "e2e/dashboard-{a11y,responsive,rtl,visual}.spec.ts" should not import test file
"e2e/dashboard.spec.ts"`. Positive control: `pnpm exec playwright test tests/e2e/direction-portals.spec.ts
--project=chromium --list` → `Total: 5 tests in 1 file`. So even after the env fix this job fails at
load, with zero tests collected — the bare frontend `playwright test` has never been a runnable
suite. 153 spec files sit under `frontend/tests/e2e` (`ls | wc -l`).

**E2E (shard 1/2, 94920109119) and (shard 2/2, 94920109185) — REAL TEST FAILURE, against the
deployed app.** Setup authenticated: no `did not run` in either summary
(`grep -E "did not run|passed"` on the stripped log → nothing, exit 0 with no output; the summaries
are `##[notice]  27 failed` and `##[notice]  36 failed`). First failure, shard 1 log line 599-600:

```
##[error]  1) [chromium-en] › tests/e2e/01-login.spec.ts:10:7 › TEST-01 authentication › signs in with email/password and reaches dashboard
    Error: locator.fill: Error: strict mode violation: getByLabel(/password|كلمة المرور/i) resolved to 2 elements:
```

Shard 2 first failure, line 587-588: `tests/e2e/token-engine-sc.spec.ts:86:7 › SC-1 …
TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.` Second in shard 1 (line 663-668):
`03-dossier-navigation … strict mode violation: getByRole('complementary') resolved to 2 elements`.
These are spec-vs-app drift (duplicate `complementary` landmark, a second password-labelled control,
a Phase-33 token-engine contract) — real assertions, credentials were not the wall. 63 failures
across 220 listed tests (`pnpm exec playwright test --project=chromium-en --project=chromium-ar-smoke
--no-deps --list` → `Total: 220 tests in 65 files`, exit 0).

**Tests (integration, 94920141442) — INFRA (no DB).** Log line 666-678:

```
TypeError: fetch failed
    code: 'ECONNREFUSED',
```

Summary line 20284: `Test Files  204 failed | 31 passed (235)`, duration 27.03 s. The job has no
`services:` and no `env:` (`ci.yml:214-235`). §4.

**Accessibility Tests (RTL + WCAG AA, 94920552794) — REAL TEST FAILURE.** Auth worked (182 tests
ran: `Running 182 tests using 2 workers`; `18 failed / 56 skipped / 108 passed (9.4m)`). First
failing assertion, line 991-1006: `dossiers-rtl-a11y.spec.ts … expect(received).toBe(expected)` at
the `missingLabels` check (spec line 248 — buttons/links without an accessible name). An
`AggregateError [ECONNREFUSED]` from the vite proxy at line 698 is the `/api` proxy to a backend
that the job never starts (`vite.config.ts:110-113`, `backendProxyTarget`); it is noise on
analytics routes, not the first failure. Note this spec was GREEN 61/61 in the 2026-08-13 local
run (`.tickmarkr/overseer/ORCH-2-RESULT.md`) and red in CI — an environment-dependent assertion.

**RTL Portal + Component Smokes (94920552761) — REAL TEST FAILURE.** `Running 9 tests … 3 failed /
6 passed (1.8m)`. First, line 540-547:

```
1) [chromium] › tests/e2e/calendar-rtl.spec.ts:33:3 › Phase 39: Calendar RTL — Arabic dow + Indic digits › renders Arabic short…
    Error: expect(locator).toHaveCount(expected) failed
    Locator:  locator('.cal-dow')   Expected: 7   Received: 0   Timeout: 5000ms
```

Then `rtl-component-smokes … TimeoutError: locator.waitFor: Timeout 15000ms exceeded` (line 669).
The `.cal-dow` class no longer exists on the calendar (Phase 81-85 Linear refinement postdates this
spec's 2026-07-04 authoring, `git log -- .github/workflows/ci.yml` → `7014fdba1 2026-07-04`).
**This is the suite CARRY-05 wants to make REQUIRED; it is 6/9 today.**

**RTL + Responsive Tests (94920552740) — REAL TEST FAILURE.** `Running 98 tests … 21 failed / 77
passed (6.7m)`. First, line 618-634:

```
1) [chromium] › tests/e2e/dossier-rtl-mobile.spec.ts:265:9 › … › iPhone SE (320x568)
    Expected: "rtl"   Received: "ltr"
    > 88 |   expect(htmlDir).toBe('rtl')
```

The spec (dated 2026-04-02 on disk) switches language by a mechanism the app no longer honours
(language persists under `id.locale` — see project memory); `<html dir>` stays `ltr`.

**Docker Build (94921234540) — CONFIG.** Log line 777:

```
ERROR: failed to build: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory
```

The job builds `context: .` with no `file:` (`ci.yml:604-612`). `git ls-files | grep -i dockerfile`
(exit 0) → `agent-runtime/Dockerfile.prod backend/Dockerfile backend/Dockerfile.prod
frontend/Dockerfile frontend/Dockerfile.prod`; `test -f Dockerfile` → exit 1. §7.

**Security Scan (94920109130) — CONFIG, and it is a REQUIRED context.** Step 4 `Upload Trivy
results to GitHub Security tab`, line 541-550: `##[error]CodeQL Action major versions v1 and v2
have been deprecated` then `##[error]Resource not accessible by integration`
(`github/codeql-action/upload-sarif@v2`, no `permissions: security-events: write`). Outside the six.
§9 F1.

### §1.4 Classification summary

| suite | first cause | class |
| ----- | ----------- | ----- |
| E2E Tests (ci.yml) | turbo strips `TEST_USER_*`; then 10 spec load errors, 0 tests | config |
| E2E shards (e2e.yml) | strict-mode locator drift vs deployed app | real test failure |
| Tests (integration) | `ECONNREFUSED` to `localhost:54321` | infra (no DB) |
| Accessibility (RTL + WCAG AA) | unlabeled controls on a dossier page | real test failure |
| RTL Portal + Component Smokes | `.cal-dow` count 0 | real test failure |
| RTL + Responsive | `<html dir>` stays `ltr` | real test failure |
| Docker Build | no root `Dockerfile` | config |

Zero of the six are credentials-missing at the GitHub layer.

---

## §2 — Branch protection on `main` (Q2)

```bash
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection
```

exit 0. `required_status_checks.strict` = **true**. `enforce_admins.enabled` = **true**.
`required_signatures` false, linear history false, force-push false, conversation resolution false.
Eight contexts, all `app_id` 15368 (GitHub Actions):

```
type-check, Security Scan, Lint, Bundle Size Check (size-limit), Tests (frontend),
Tests (backend), Design Token Check, react-i18next Factory Check
```

**Context string.** A GitHub Actions status context is the job's display `name:`, not its YAML
key. Evidence in the same list: `Lint` is the `name:` of key `lint`; `Tests (frontend)` is the
`name:` of key `test-frontend`; `type-check` is both. So the context CARRY-05 must add is the string
**`RTL Portal + Component Smokes`** (`ci.yml:381`), not `test-rtl-smokes` (`ci.yml:380`, the key).
Adding `test-rtl-smokes` literally would create a context that no job ever reports, which with
`strict: true` blocks every PR forever — the neighbouring-wrong case.

Drill (read-only, exit 1 = not present today):

```bash
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks/contexts \
  | grep -q '"RTL Portal + Component Smokes"'    # exit 1 at HEAD
```

**The API call that adds it — RECORDED, NOT RUN:**

```bash
gh api -X POST repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks/contexts \
  --input - <<< '["RTL Portal + Component Smokes"]'
```

(POST appends; PUT replaces the whole list. Removal is DELETE with the same body.) Operator act:
branch protection on `main`, and the job is 6/9 today (§1.3) — promoting it before it is green
blocks every merge.

**`continue-on-error: true`** (`grep -n continue-on-error .github/workflows/*.yml`, exit 0): three
hits in `ci.yml` — line 218 (job `test-integration`, the only one of the six), line 534 (the
deploy-gated live-judge step inside `eval-gate`), line 569 (the `lhci autorun` step inside
`lighthouse-ci`). None in `e2e.yml`. So `Tests (integration)` reports `failure` at the job level but
does not fail the workflow; the other five red suites fail the workflow outright and are simply not
required.

---

## §3 — E2E credentials (Q3)

**What `tests/e2e/support/auth.setup.ts` requires** (read, 71 lines): all six of
`E2E_{ADMIN,ANALYST,INTAKE}_{EMAIL,PASSWORD}`; it throws `Missing E2E_<ROLE>_EMAIL or _PASSWORD` for
any undefined pair (line 18-22), signs in via `/login`, clears the password field before the first
failable assertion (RULING-P99-188), and writes `tests/e2e/support/storage/<role>.json`. The root
config's `chromium-en`, `chromium-ar-smoke`, `chromium-mobile` all carry `dependencies: ['setup']`
and read `storage/admin.json`.

**What `frontend/tests/e2e/global-setup.ts` requires**: `TEST_USER_EMAIL` + `TEST_USER_PASSWORD`
(throws at line 34 otherwise), writes `frontend/tests/e2e/.auth/storageState.json`.

**`.env.test` key names** (`grep -E '^[A-Z0-9_]+=' .env.test | cut -d= -f1`, exit 0; 867 bytes,
mtime 2026-08-20):

```
SUPABASE_ANON_KEY  SUPABASE_SERVICE_ROLE_KEY  SUPABASE_URL  TEST_USER_EMAIL  TEST_USER_PASSWORD
PHASE_52_FIXTURE_ENGAGEMENT_ID  SUPABASE_DB_URL
```

`.env.test.example` carries the same minus the fixture id. **None of the six `E2E_*` keys is present
locally** — E2ECRED-01 (REQUIREMENTS.md:806-816) reproduces. Consequence: any local non-`--no-deps`
root run fails at `setup`; the frontend config works locally (the a11y ORCH-2 run proved it).

**GitHub Actions secrets** (`gh secret list`, exit 0 — names and updated dates only):

| name | updated |
| ---- | ------- |
| E2E_ADMIN_EMAIL | 2026-05-28 |
| E2E_ADMIN_PASSWORD | 2026-05-28 |
| E2E_ANALYST_EMAIL | 2026-06-27 |
| E2E_ANALYST_PASSWORD | 2026-06-27 |
| E2E_BASE_URL | 2026-04-08 |
| E2E_INTAKE_EMAIL | 2026-05-28 |
| E2E_INTAKE_PASSWORD | 2026-05-28 |
| E2E_SUPABASE_ANON_KEY | 2026-05-05 |
| E2E_SUPABASE_URL | 2026-04-08 |

`E2E_SUPABASE_SERVICE_ROLE_KEY` (referenced by `e2e.yml:28,70,105` — corrected round 1; the earlier `24,64,99` was stale) is **absent** from the secret
store — whatever consumes it in CI gets an empty string. `EVAL_AI_URL`, `EVAL_AI_API_KEY`,
`LHCI_GITHUB_APP_TOKEN` (referenced by `ci.yml`) are also absent; those steps are gated or
`continue-on-error`, so this is not the first cause of anything in §1.

**So the six credentials EXIST in CI and WORK**: the `e2e.yml` shards ran 220 listed tests through
`setup` and failed on assertions (§1.3). The credential wall is a LOCAL wall only.

**CARRY-01 rotation status — NOT DONE.** `92-10-SUMMARY.md` front-matter: `status: PARKED — not
executed, blocked on an operator act`, gate `92-10_g1: RED`, `completed: null`; RULING-P92-45 parked
it. The secret dates corroborate: the youngest `E2E_*` secret write is 2026-06-27, before Phase 92
(2026-08-15) and before P88-02's exposure was filed. No rotation has happened since. The P88-02 values
are therefore still the live ones, and they are the ones CI is using successfully.

---

## §4 — Integration suite and decision D-3 (Q4)

**What runs.** `node -e` over `backend/package.json` (exit 0):
`test:integration => vitest --config ./vitest.integration.config.ts --run`. That config merges the
base and sets `include: ['tests/contract/**/*.test.ts','tests/contracts/**/*.test.ts',
'tests/integration/**/*.test.ts','tests/performance/**/*.test.ts']`, 60 s timeouts. Base config
`setupFiles: tests/setup.ts`, which loads root `.env` then `backend/.env.test` and `vi.mock`s
`@/config/supabase` with a chainable stub — so anything going through the app's Supabase client is
mocked, and only tests that construct their own client or `fetch()` a URL need a live endpoint.

**CI's measurement**: 235 files, 204 failed, 31 passed (§1.3) — the 235 matches the 89-SUMMARY
figure exactly.

**Where `localhost:54321` is assumed** (`grep -rl 54321 backend/tests | wc -l`, exit 0):

| population | files |
| ---------- | ----- |
| `backend/tests` (all) | 85 |
| `tests/contract` | 41 |
| `tests/contracts` | 2 |
| `tests/integration` | 28 |
| `tests/performance` | 10 |

Shape, from `grep -rn 54321 backend/tests/integration | head`: `process.env.SUPABASE_URL ||
'http://localhost:54321'` (a fallback), and in `mention-validation-unauthorized-users.test.ts:59,90,132`
a hard-coded `fetch('http://localhost:54321/functions/v1/…')` (no env escape). Positive control for
the grep instrument: `git grep -c SUPABASE_URL -- backend/src` returns hits in three files.
Tracked non-test mentions: `.env.example:2,41,43`, `backend/README.md:706`, two contract-test
READMEs; no tracked source under `backend/src` mentions the port.

**`supabase/config.toml` exists** (979 bytes, 2026-04-02): `[api] port = 54321`, `[db] port = 54322,
major_version = 17`, studio 54323, inbucket 54324, edge runtime enabled, three `[functions]` entries.
So `supabase start` would put a stack on exactly the assumed port. It has never run in CI: the job
has no `services:` and no `supabase` CLI step.

**What D-3 says.** `grep -rn -E "\bD-3\b[^0-9]" .planning/ROADMAP.md .planning/REQUIREMENTS.md
.planning/phases/89-*/*.md` (exit 0) → three hits. `89-SUMMARY.md:33` is the recording: *"the
integration suite is broadly red for one environmental reason — 235 files expect a database at
`localhost:54321`. Recorded as decision D-3; CI cannot do better today (`ci.yml:214-235` has
`continue-on-error: true`, no `env:`, no Supabase service)"* and `:70`: *"D-3 — how 235 integration
test files get a database."* **D-3 is a named open question, not a decision with content.** No file
under `.planning` records a resolution; `grep -rln 54321 .planning` (exit 0) lists only ROADMAP,
the v9.0 archives, Phase 50/54 archived plans, and 89-SUMMARY.

**Candidate resolutions, with cost.**

| option | what it needs | cost | what it proves |
| ------ | ------------- | ---- | -------------- |
| (a) `supabase start` in CI (`supabase/setup-cli` + `supabase start` + `supabase db reset`) | Docker on the runner (present on `ubuntu-latest`), ~3-5 min startup, 88 migrations to apply cleanly, seed data the 235 files expect, edge functions served by the local runtime | HIGH — the migration set has never been proven to apply from zero in CI; the seed the tests assume is undocumented | the suite as written |
| (b) point at staging (`SUPABASE_URL` = `E2E_SUPABASE_URL`, service key secret) | the missing `E2E_SUPABASE_SERVICE_ROLE_KEY` secret; the hard-coded `fetch('http://localhost:54321…')` sites edited; tests that INSERT would write to staging | MEDIUM, and it mutates staging from CI — a data-integrity risk the Phase 102 fixture purge would then fight | that staging answers, not that the code is correct against a clean schema |
| (c) quarantine: keep `continue-on-error`, narrow `include` to the files that pass without a DB (31 today), record D-3 as "no local DB in CI; the 204 are integration-in-name-only until (a) is funded" | one config edit, one recorded decision | LOW | honest: the job stops asserting what it cannot measure |

Recommendation for the planner: (c) closes criterion 2 honestly and cheaply tonight-shaped; (a) is
the real fix and is a phase of its own. (b) is rejected — it turns the integration job into a
staging mutator. Whatever is chosen, the SUMMARY must carry the D-3 decision text; the roadmap
criterion says "resolved and recorded", and the record is what is missing.

---

## §5 — a11y specs (Q5)

**Enumeration.** `ls frontend/tests/a11y frontend/tests/accessibility; find tests/e2e -iname
'*a11y*'` (exit 0): 15 files under `a11y/` (14 `.spec.ts` + `wcag-compliance.test.tsx`, a vitest
file), 3 under `accessibility/` (2 `.spec.ts` + `waiting-queue-a11y.test.tsx`), and
`tests/e2e/signature-visuals/a11y.spec.ts` at the root.

**Per-config `--list`** (each `pnpm exec playwright test <file> --project=<p> --list 2>&1 | grep
-oE "Total: [0-9]+ tests"`, all exit 0). `a11y` = the frontend `a11y` project; `chromium` = the
frontend default project; root = `--project=chromium-en --no-deps`:

| spec | a11y | chromium | root | fixme/skip (grep) | CI job |
| ---- | ---- | -------- | ---- | ----------------- | ------ |
| `a11y/dossiers-a11y.spec.ts` | 16 | 0 | – | 0 | Accessibility (RTL + WCAG AA) |
| `a11y/dossiers-rtl-a11y.spec.ts` | 61 | 0 | – | 0 | same |
| `a11y/positions-a11y-en.spec.ts` | 6 | 0 | – | 2 | same |
| `a11y/positions-a11y-ar.spec.ts` | 5 | 0 | – | 2 | same |
| `a11y/intake-accessibility.spec.ts` | 9 | 0 | – | 4 | same |
| `a11y/editor-keyboard-nav.spec.ts` | 8 | 0 | – | 8 (all) | same |
| `a11y/positions-keyboard-nav.spec.ts` | 13 | 0 | – | 13 (all) | same |
| `a11y/positions-screen-reader-bilingual.spec.ts` | 16 | 0 | – | 16 (all) | same |
| `a11y/screen-reader-en.spec.ts` | 3 | 0 | – | 3 (all) | same |
| `a11y/screen-reader-ar.spec.ts` | 2 | 0 | – | 2 (all) | same |
| `a11y/keyboard-navigation.spec.ts` | 2 | 0 | – | 1 | same |
| `a11y/color-contrast.spec.ts` | 2 | 0 | – | 1 | same |
| `a11y/wcag-aa-comprehensive-audit.spec.ts` | 39 | 0 | – | 2 | same |
| `a11y/focus-indicators.spec.ts` | **0** | 0 | – | 0 | **none** (not in the admit list; hard-codes a login) |
| `accessibility/entity-search.a11y.spec.ts` | 0 | 12 | – | 0 | **none** — matched by `chromium` only, which the ci.yml `E2E Tests` job would run but that job never loads (§1.3) |
| `accessibility/tasks-wcag.spec.ts` | 0 | 14 | – | 0 | none (same) |
| `tests/e2e/signature-visuals/a11y.spec.ts` | – | – | 1 | 0 | E2E (shard n/2) — root config |

Full a11y project: `pnpm exec playwright test --project=a11y --list` → `Total: 182 tests in 13 files`
(exit 0), matching CI's `Running 182 tests`. The fixme grep instrument's positive control:
`grep -c fixme frontend/tests/a11y/positions-keyboard-nav.spec.ts` → 13. The 56 CI skips = the
fixme total (2+2+4+8+13+16+3+2+1+1+2 = 54) plus 2 inside `intake-accessibility`'s `describe`.

**Prior run evidence**: `.tickmarkr/overseer/ORCH-2-RESULT.md` (2026-08-13, local, interpreter
v24.5.0): 126 passed / 26 failed / 30 skipped; six specs fully green — `dossiers-rtl-a11y` 61/61,
`dossiers-a11y` 16/16, `positions-a11y-en` 4+2 fixme, `positions-a11y-ar` 3+2, `intake-accessibility`
3+4, `keyboard-navigation` and `color-contrast` 1 red each. CI a day later: 18 failed, with
`dossiers-rtl-a11y` among the red (§1.3). The roadmap's *"No a11y spec has ever been shown green"* is
therefore not literally true (§9 F4) — but the criterion asks for run evidence attached to THIS
phase, and none of that evidence sits in a phase record.

**The ONE cheapest candidate: `frontend/tests/a11y/dossiers-a11y.spec.ts` (16 tests).** Why:
(1) zero `fixme`/`skip` — "not skipped, not annotated" is satisfiable without editing the spec;
(2) 16/16 green in ORCH-2 and its runtime is axe over six seeded dossier routes with
`storageState` inherited — no language switching, no `data-testid` that does not exist, no
`/_protected` route-id URLs; (3) its fixture ids (`dossier-fixtures.ts:28-35`) are the same seeded
rows Phase 100's census used; (4) it runs under the SAME job and config as CI, so the run evidence
transfers. `dossiers-rtl-a11y` is the runner-up but it was red in CI on the `missingLabels` check and
61 tests is four times the runtime. `signature-visuals/a11y.spec.ts` (1 test, root config) is
smaller but sits behind the six absent `E2E_*` keys locally, i.e. behind CARRY-01. Drill:
`pnpm exec playwright test tests/a11y/dossiers-a11y.spec.ts --project=a11y --list` → `Total: 16
tests`, exit 0. The run itself is forbidden tonight (brief) and is the plan's work.

---

## §6 — CARRY-10, Playwright dev-stack sessions (Q6)

**What Phase 99 shipped for the ROOT config.** `git log --oneline -8 -- scripts/pw-run-reaped.mjs
playwright.config.ts` (exit 0): `e6bc3af99` (the gate that starts a server owns stopping it),
`cb84310b2`, `320c6147e` (reap the webServer that escapes our process group), `223dbec50`
(resolve `.env.test` inside a worktree), `a0a1d3173` (recover orphaned sessions), `379ba792a`
(RULING-P99-177), `4511adab0` (RULING-P99-185: census LISTENERS), `b67196931` (RULING-P99-186:
archive reports out of the worktree). The 99-01/02/03 SUMMARYs are ruling-closure records
(RULING-P99-48); the reaper's design authority is `rulings/RULING-P99-50-REAPER-PLAN-ACCEPT-WITH-AMENDMENTS.md`
and its dead-writer repair `RULING-P99-84`. `scripts/pw-run-reaped.mjs` is 2011 lines (`wc -l`).

Root `playwright.config.ts` today: `webServer.command = 'node scripts/pw-run-reaped.mjs --lease-exec
-- env NODE_ENV=development pnpm dev'`, `reuseExistingServer: process.env.PW_REUSE === '1'` (opt-in),
`timeout: 120_000`. The run mode (`test:e2e:ci => node scripts/pw-run-reaped.mjs -- --project=chromium-en
--project=chromium-ar-smoke`, root `package.json`) mints `PW_LEASE_NONCE/DIR/ROOT`, sweeps orphan
leases for its root before spawning, and reaps only the leased session at finish.

**Frontend config today** (`frontend/playwright.config.ts`): `webServer.command = 'NODE_ENV=development
pnpm dev'`, `reuseExistingServer: !process.env.CI` (implicit reuse locally — the RULING-P99-17 wrong-tree
trap), `globalSetup: './tests/e2e/global-setup.ts'`. `grep -rn -i "globalTeardown" playwright.config.ts
frontend/playwright.config.ts` → **no globalTeardown in either config** (exit 1; the same grep finds
`globalSetup` at `frontend/playwright.config.ts:39`, the positive control). No lease writer, no
wrapper: the frontend `pnpm dev` stack is started `detached: true` by Playwright and nothing owns
stopping it.

**What `frontend/tests/e2e/global-setup.ts` does** (78 lines): launches chromium, signs in once via
`#email`/`#password`, waits for a post-login URL, pre-dismisses tour overlays via `localStorage`,
writes `.auth/storageState.json`, closes the browser. It touches no dev-server process.

**"Attributed dev-stack session" in Phase 99's vocabulary.** A session (POSIX `sid`) whose lease
file `.pw-leases/<nonce>.lease` records `{pid, pgid, sid, lstart, cwd}` written from INSIDE the
web-server session by `--lease-exec`. *Attributed* = provably ours by that spawn-time identity, never
by port, cwd, pid order, or ancestry (F2). The instrument that counts them is the same file:
`node scripts/pw-run-reaped.mjs --sweep <root>` (orphan recovery census over `.pw-leases/` +
`lsof -ti tcp:<port> -sTCP:LISTEN` listener census, exit 0 only when every lease is consumed and
the gate ports are free), and inside a run the finish census that produces the single `clean`
verdict (header lines 34-45). Tonight: `ls -A .pw-leases | wc -l` → 0; `lsof -ti tcp:5173 -sTCP:LISTEN
| wc -l` → 0 (exit 0); same for 5001 → 0. A zero here is a healthy-at-rest reading and proves nothing
about the instrument (memory: a control expecting zero proves nothing) — the plan's proof must
plant a session and watch it be reaped.

**Cleanup-refusal and unavailable-instrument paths in the root slice** (`grep -n -i "refus|unavailable"
scripts/pw-run-reaped.mjs`, 80+ hits; the shapes the frontend slice must mirror):

- A new port holder with **no matching lease** is a REFUSAL, never a target (line 22, 427).
- Any census row the runtime cannot parse invalidates the WHOLE census → `unavailable` (line 101-102);
  `lsof` exit >1 or malformed output → `null` = unavailable (247-274); `ps` non-ESRCH errors →
  `unavailable`, never `dead` (377-392).
- Own-pgid unavailable/unsafe → refuse the entire operation, nothing signalled (449-450, 482-485).
- Dead writer + unavailable session census → refuse (366); empty session + unavailable port census
  → refuse (371).
- **Exit composition**: `verdict === 'clean'` → Playwright's own exit code; anything else → **exit 90**,
  the pending report moved to `<jsonOut>.unclean-<nonce>.json`, the final report path never created
  (46-59, 1398-1408). This is the "unavailable instrumentation fails the invoking command rather than
  reporting an empty success" clause of CARRY-10, already implemented for the root.
- Locale is bound (`LC_ALL=C`) for every census subprocess (96-105).

**What the frontend slice needs, minimally.** The wrapper is config-agnostic: `--lease-exec` writes
the lease for whatever command follows it, and run mode passes through Playwright args. The
cheapest correct change is (1) `frontend/playwright.config.ts` `webServer.command` →
`node ../scripts/pw-run-reaped.mjs --lease-exec -- env NODE_ENV=development pnpm dev` with
`reuseExistingServer: process.env.PW_REUSE === '1'`, and (2) the CI steps and `frontend/package.json`
scripts that invoke `playwright test` under that config go through run mode. RULING-P99-50 Amendment
4 forbids grep-for-bytes acceptance: the proof is a planted-session drill (lease contents, pre/post
sid census, bystander survival, zero survivors) for BOTH configs, plus the exit-composition cases
(clean / refused / unavailable / survivors). The root drill harness the amendment names (D1–D9,
T1–T15) was a P99 artifact; `ls scripts | grep -i pw` → `pw-red-assert.mjs pw-run-reaped.mjs` only,
so no selftest file survives in tree (RULING-P99-84 §5: "no selftest resurrection").

**Interrupted-run path**: `.tickmarkr/config.yaml`'s `setup` hook materialises `.env.test` per
worktree; SIGINT/SIGTERM/SIGHUP all route to the finisher (header line 62-68); SIGKILL is uncatchable
and is recovered by the next run's pre-spawn sweep or `--sweep`. The frontend proof must show the
same three signals plus a SIGKILL-then-sweep recovery.

---

## §7 — Docker Build job (Q7)

`ci.yml:579-618`. Runs only on `push` to `main`/`develop`, `needs: [build]`. Steps: buildx →
`docker/login-action@v3` to `ghcr.io` with `github.actor` / `secrets.GITHUB_TOKEN` (the built-in
token; no extra secret needed, and the log shows login succeeded — the failure is at step 6) →
`docker/metadata-action@v5` for `ghcr.io/alzahrani-khalid/Intl-Dossier-V2.0` tags → `docker/build-push-action@v5`
with `context: .`, `push: true`, GHA cache.

**Why it fails**: §1.3 — `open Dockerfile: no such file or directory`. There is no root `Dockerfile`
and never was one for this job's shape: `git log -S'docker-build:' -- .github/workflows/ci.yml`
(exit 0) dates the job to `325417d45 2025-09-27`; the five tracked Dockerfiles are per-package and
production deploys build from `deploy/docker-compose.prod.yml` with `context: ../frontend
dockerfile: Dockerfile.prod`, `../backend`, `../agent-runtime` (lines 40-42, 64-66, 201-203).
Pushing to ghcr.io also needs `permissions: packages: write`; the workflow declares no `permissions:`
block, so even with a Dockerfile the push may 403 on the default token scope — untested tonight
because the build never reaches push.

Resolution candidates: (a) matrix the three `Dockerfile.prod` contexts with `push: false` (a build
check, no registry, no permissions) — LOW cost, proves the images build; (b) delete the job and
record that the droplet compose build is the only Docker path — LOWEST, honest quarantine; (c) fix
`file:` + add `packages: write` and actually publish — MEDIUM, and it creates a registry artifact
nothing consumes. (a) or (b) for this phase.

---

## §8 — Oracle candidates, drilled (Q8)

Style: one command per criterion, hard-coded expectation, exit 0 = met, 1 = not met, 3 =
instrument cannot run. Preamble for every `gh` oracle:

```bash
command -v gh >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: gh absent"; exit 3; }
gh auth status >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: gh not authenticated"; exit 3; }
R=alzahrani-khalid/Intl-Dossier-V2.0
```

### §8.1 Criterion 1 — E2E green against the deployed app

```bash
RUN=$(gh run list -R $R --branch main --workflow "E2E Tests" --limit 1 --json databaseId,conclusion -q '.[0]' 2>&1); RC=$?
[ "$RC" = "0" ] || { echo "INSTRUMENT-CANNOT-RUN: gh run list exited $RC :: $RUN"; exit 3; }
ID=$(printf '%s' "$RUN" | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).databaseId')
J=$(gh run view -R $R "$ID" --json jobs -q '[.jobs[] | select(.name|startswith("E2E (shard")) | .conclusion]' 2>&1); RC=$?
[ "$RC" = "0" ] || { echo "INSTRUMENT-CANNOT-RUN: gh run view exited $RC :: $J"; exit 3; }
echo "P101-C1 run=$ID shards=$J expected [\"success\",\"success\"]"
[ "$J" = '["success","success"]' ] || { echo "FAIL: E2E shards not both success"; exit 1; }; echo PASS
```

**Drill tonight**: `P101-C1 run=31848669722 shards=["failure","failure"] expected ["success","success"]`
→ `FAIL`, **exit 1**. Positive control: the same query on `merge-reports` returns `"success"`.
**Cannot close tonight** — it needs a push to `main` (a merged PR) to produce a new run. The
quarantine branch of the criterion (in-spec `test.fixme(true, '<tracked reason>')` per failing spec)
is codeable in a worktree, but the green run itself is a human gate → `autonomous: false`.

### §8.2 Criterion 2 — integration suite green, D-3 recorded

```bash
ID=$(gh run list -R $R --branch main --workflow CI --limit 1 --json databaseId -q '.[0].databaseId')
C=$(gh run view -R $R "$ID" --json jobs -q '.jobs[] | select(.name=="Tests (integration)") | .conclusion')
grep -qE '^- \*\*D-3\*\*.+(resolved|RESOLVED)' .planning/phases/101-ci-gates-green/101-*-SUMMARY.md 2>/dev/null; G=$?
echo "P101-C2 run=$ID integration=$C d3_recorded_rc=$G expected success 0"
[ "$C" = "success" ] && [ "$G" = "0" ] || { echo "FAIL"; exit 1; }; echo PASS
```

**Drill tonight**: `P101-C2 run=31848669701 integration=failure d3_recorded_rc=1` → **exit 1**.
The D-3 clause is a positive-presence grep on a phase SUMMARY the plan writes; it fails at HEAD
because no SUMMARY exists (`ls .planning/phases/101-ci-gates-green/` → `101-RESEARCH.md` only
after this file). Local half (no CI needed): with option (c) of §4 the `include` list shrinks and
`--list`-style discovery can be asserted; with (a) the job needs a CI run → human gate.

### §8.3 Criterion 3 — one a11y spec PASSING with evidence

```bash
cd frontend || exit 3
L=$(pnpm exec playwright test tests/a11y/dossiers-a11y.spec.ts --project=a11y --list 2>&1 | grep -oE "Total: [0-9]+ tests"); 
[ "$L" = "Total: 16 tests" ] || { echo "INSTRUMENT-CANNOT-RUN: expected 16 listed, got [$L]"; exit 3; }
J=test-results/p101-a11y.json
PLAYWRIGHT_JSON_OUTPUT_NAME=$J pnpm exec playwright test tests/a11y/dossiers-a11y.spec.ts --project=a11y --reporter=json >/dev/null 2>&1; PRC=$?
node -e '
const r=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
const st=r.stats; console.log(`P101-C3 expected=${st.expected} unexpected=${st.unexpected} skipped=${st.skipped} flaky=${st.flaky} want expected=16 others=0`);
process.exit(st.expected===16&&st.unexpected===0&&st.skipped===0&&st.flaky===0?0:1)' "$J"
```

**Drill tonight**: only the `--list` half ran (brief forbids the run): `Total: 16 tests`, exit 0.
The run half is the plan's work and is local (frontend config authenticates from `.env.test`,
ORCH-2 proved it) → **can close inside a worktree** without CI. The hard-coded 16 and the
`skipped=0` clause make an all-fixme spec fail and a stale admit list exit 3. **Wrap the run in
`node ../scripts/pw-run-reaped.mjs -- …` once §6's frontend slice lands**, otherwise this oracle
itself leaks a session.

### §8.4 Criterion 4 — required context + smoke PR observed BLOCKED

```bash
C=$(gh api repos/$R/branches/main/protection/required_status_checks/contexts 2>&1); RC=$?
[ "$RC" = "0" ] || { echo "INSTRUMENT-CANNOT-RUN: gh api exited $RC :: $C"; exit 3; }
echo "P101-C4 contexts=$C"
printf '%s' "$C" | grep -q '"RTL Portal + Component Smokes"' || { echo "FAIL: context absent"; exit 1; }
printf '%s' "$C" | grep -q '"test-rtl-smokes"' && { echo "FAIL: the KEY was added, not the name — this context can never report"; exit 1; }
echo PASS
```

**Drill tonight**: contexts = the eight in §2, `FAIL: context absent`, **exit 1**. The
neighbouring-wrong arm (key added instead of name) is explicit. The second half — "a smoke PR
observed BLOCKED" — is `gh pr view <n> --json mergeStateStatus -q .mergeStateStatus` = `BLOCKED`
on a PR whose `RTL Portal + Component Smokes` check is red; it needs a real PR and the operator's
protection edit → **`autonomous: false`**, human gate. Ordering constraint: the job is 6/9 (§1.3);
promote only after §8.5's smoke row is green or every merge blocks.

### §8.5 Criterion 5 — the six suites green or quarantined

```bash
ID=$(gh run list -R $R --branch main --workflow CI --limit 1 --json databaseId -q '.[0].databaseId')
S=$(gh run view -R $R "$ID" --json jobs -q '[.jobs[] | select(.name=="E2E Tests" or .name=="Tests (integration)" or .name=="Accessibility Tests (RTL + WCAG AA)" or .name=="RTL Portal + Component Smokes" or .name=="RTL + Responsive Tests" or .name=="Docker Build") | .conclusion] | "\(length) jobs, \(map(select(.=="success"))|length) success"')
echo "P101-C5 run=$ID $S expected 6 jobs, 6 success"
[ "$S" = "6 jobs, 6 success" ] || { echo FAIL; exit 1; }; echo PASS
```

**Drill tonight**: `P101-C5 run=31848669701 6 jobs, 0 success` → **exit 1**. The `6 jobs` clause is
the positive control against a renamed or deleted job silently shrinking the population: if Docker
Build is deleted under §7(b), this oracle must be edited to `5 jobs, 5 success` in the same commit
that records the quarantine, never left to pass on a smaller set. **Cannot close tonight** — needs
a `main` run → human gate. The per-suite quarantine edits (fixme with reason, Docker job matrix)
are worktree work.

### §8.6 Criterion 6 — zero attributed sessions, both configs

```bash
ROOT=$(git rev-parse --show-toplevel); cd "$ROOT" || exit 3
command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent"; exit 3; }
node scripts/pw-run-reaped.mjs --sweep "$ROOT"; SRC=$?
[ "$SRC" = "0" ] || { echo "FAIL: pre-sweep exited $SRC"; exit 1; }
# the frontend slice, once routed through run mode, must produce the same clean verdict:
node scripts/pw-run-reaped.mjs -- --config frontend/playwright.config.ts tests/e2e/direction-portals.spec.ts --project=chromium --list >/dev/null 2>&1; FRC=$?
L=$(ls -A .pw-leases 2>/dev/null | wc -l | tr -d ' '); P1=$(lsof -ti tcp:5173 -sTCP:LISTEN | wc -l | tr -d ' '); P2=$(lsof -ti tcp:5001 -sTCP:LISTEN | wc -l | tr -d ' ')
echo "P101-C6 frontend_rc=$FRC leases=$L listeners_5173=$P1 listeners_5001=$P2 expected 0 0 0 0"
[ "$FRC" = "0" ] && [ "$L" = "0" ] && [ "$P1" = "0" ] && [ "$P2" = "0" ] || { echo FAIL; exit 1; }; echo PASS
```

**Drill tonight — partial, and honest about what it is**: `leases=0 listeners_5173=0
listeners_5001=0` (exit 0 each), the at-rest reading. The `--sweep` and the run-mode invocation were
NOT executed (a tickmarkr run is live; a sweep is a destructive instrument against a live target —
memory rule). This oracle as written is a **zero-expecting control and proves nothing on its own**;
the plan's acceptance must be the planted-session drill from §6 (start a stack under the frontend
config, record its sid from the lease, SIGINT the run, census the sid empty, then the SIGKILL +
`--sweep` recovery), with the exit-90 composition asserted by planting a foreign listener on 5173
and requiring the command to exit 90, not 0. **Closable in a worktree** — no CI, no push.

### §8.7 Closure map

| criterion | closable in a worktree tonight-shaped | needs push / PR / operator | task flag |
| --------- | ------------------------------------- | -------------------------- | --------- |
| 1 E2E | quarantine edits, `--list` proof | green `main` run | `autonomous: false` for the run |
| 2 integration | option (c) config + D-3 record | green `main` run of the job | `autonomous: false` for the run |
| 3 a11y | **yes** — local run, JSON reporter | — | autonomous |
| 4 required context | oracle only | operator POST + smoke PR BLOCKED | `autonomous: false` |
| 5 six suites | quarantine edits, Docker job reshape | green `main` run | `autonomous: false` for the run |
| 6 CARRY-10 | **yes** — planted-session drills | — | autonomous |
| CARRY-01 rotation | no | operator only (92-10 checklist) | `autonomous: false`, precedes 1 and 4 by the roadmap's own dependency line |

---

## §9 — Findings: numbers and claims that did not reproduce

**F1 — A REQUIRED context is red on `main`: `Security Scan`.** Not among CARRY-09's six. Its failing
step is the SARIF upload with `codeql-action/upload-sarif@v2` (deprecated) and `Resource not
accessible by integration` (no `security-events: write`). On a PR from the same repo the step may
pass with a differently-scoped token — PR #98 did merge — but on every `main` push it fails, so
"main green" is unreachable without touching a job the requirements do not name. Recommend the
planner add it to the criterion-5 population explicitly or record its exclusion.

**F2 — "The Playwright `setup` project cannot authenticate, so every dependent E2E project is
blocked" (E2ECRED-01) is true LOCALLY and FALSE in CI.** `gh secret list` shows all six `E2E_*`
keys (dated 2026-05-28 / 06-27), and the `e2e.yml` shards ran 220 tests to 63 assertion failures
with no `did not run`. The E2E red on `main` is spec drift, not credentials. What is missing in CI
is `E2E_SUPABASE_SERVICE_ROLE_KEY` (referenced by `e2e.yml`, absent from the store).

**F3 — "Every currently-red suite" includes one that CI cannot even LOAD.** The `ci.yml` `E2E
Tests` job's command collects 0 tests locally with 10 load errors (§1.3). Fixing its env
(turbo passthrough) exposes a job that has never had a runnable suite. Quarantining it means
deciding what `pnpm run test:e2e` is FOR — the root `test:e2e:ci` is the reaped, sharded suite;
the turbo one is a 2025 leftover.

**F4 — "No a11y spec has ever been shown green" (ROADMAP:625, CARRY-04) does not reproduce.**
ORCH-2 (2026-08-13) recorded six specs fully green with per-spec counts, and CI job 94920552794
passed 108 of 182. What is true: no green sits in a phase VERIFICATION/SUMMARY as the closing
evidence of a criterion. The criterion should be read as "shown green IN THIS PHASE'S RECORD".

**F5 — `test-rtl-smokes` is a job KEY, not a context.** The context is `RTL Portal + Component
Smokes`. Every requirement line that says `test-rtl-smokes` (CARRY-05, ROADMAP:626) names the wrong
string for the API call; §2 records the right one and the neighbouring-wrong failure it prevents.

**F6 — D-3 is not a decision.** It is the label of an open question ("how 235 integration test
files get a database"). Nothing in `.planning` resolves it. Criterion 2's "resolved and recorded"
requires writing the decision, not finding it.

**F7 — The 235 figure reproduces; the "expect a database" population does not.** CI ran 235 files.
Only 85 of `backend/tests` mention `54321` at all (41 contract / 2 contracts / 28 integration / 10
performance = 81 inside the config's globs); 204 failed. So ~120 failures are not the port literal —
they are `fetch failed` through the mocked client, missing env, or other causes. "235 files expect a
DB at 54321" overstated the port-literal population by ~3×; the DB-dependence claim may still hold
through `SUPABASE_URL` fallbacks the grep does not see.

**F8 — The suite CARRY-05 promotes is red.** `RTL Portal + Component Smokes` is 6/9 on `main`
(`.cal-dow` gone, an RTL smoke timing out). Promoting it as required before it is green blocks all
merges under `strict: true` + `enforce_admins: true`. Dependency: criterion 5's smoke row before
criterion 4.

**F9 — CARRY-01's "Phase 92 → gates CARRY-02 and CARRY-05" dependency is weaker than stated.**
Rotation is still owed (§3), but CI is authenticating with the unrotated values today; neither the
E2E green nor the branch-protection promotion is mechanically blocked by the rotation. It IS
blocked as a security matter (exposed values live), which is a different sentence.

**F10 — `frontend/tests/a11y/focus-indicators.spec.ts` is in no gate and hard-codes a login** with
literal credentials (`test-staff@gastat.gov.sa`, a literal password) at lines 10-13 — a secret-shaped
literal in a tracked test file. Not echoed further here; recommend it be deleted or retargeted in
the a11y quarantine pass.

**F11 — Neither config has a globalTeardown**, and the frontend config's `reuseExistingServer:
!process.env.CI` is exactly the implicit-reuse shape RULING-P99-17 measured serving a 42-hour-old
tree. CARRY-10's frontend slice is a config change plus a proof, not a new runtime.

## §10 — Planner drills (2026-09-10)

Every `oracle: command` in `101-01..07-PLAN.md` was run tonight from the repo root at HEAD `3ec257adc`
with `bash -c "$(cat <script>)"` — the byte-identical text that sits in each plan's `command:` block
(verified by parsing the front-matter with js-yaml and comparing to the drilled files). No vitest or
Playwright SUITE ran: the three oracles that would run one exit 3 at a precondition that is false at HEAD
(the frontend config is not routed through the lease writer), and `--list` / `vitest list --filesOnly`
are discovery, not execution. No `Agent` tool was used.

### §10.1 The drill table

| plan | oracle | what it asserts | exit at HEAD | last output line | round |
| ---- | ------ | --------------- | ------------ | ---------------- | ----- |
| 101-01 | `o01-drill` | planted-session drill, both configs | **3** | `INSTRUMENT-CANNOT-RUN: frontend/playwright.config.ts is not yet routed through the lease writer - the drill has no subject (P101-01 task 1 not landed)` | **round 1** (re-drilled after the fix) |
| 101-02 | `o02-a11y-run` | dossiers-a11y 16/16 via wrapper | **3** | `INSTRUMENT-CANNOT-RUN: frontend/playwright.config.ts is not routed through the lease writer (P101-01) - an unwrapped run would leak the session CARRY-10 is about (D-13)` | round 0 |
| 101-02 | `o02-focus-del` | focus-indicators deleted, a11y list 182/13 | **1** | `FAIL: focus-indicators.spec.ts still tracked/present (D-11: deleted, secret-shaped literals gone from the tree)` | round 0 |
| 101-03 | `o03-include` | integration include = the 31 + D-3 line | **1** | `FAIL: the integration job would still collect 236 files (205 outside the CI-green 31, 0 of the 31 missing) - D-04 narrows include to exactly the files run 31848669701 passed` | round 0 |
| 101-04 | `o04-ci-yaml` | ci.yml structural read (js-yaml) | **1** | `  FAIL: D-14: ci.yml declares 18 job keys, want 17 (18 at planning minus test-e2e; build is a 2-way matrix so the API reports 18 runtime jobs)` | round 0 |
| 101-05 | `o05-bound` | 29 files present, markers = register rows (section-fenced), cells column | **1** | `FAIL: 0 markers carry a run id 3184866*, 0 carry P101-QUAR at all - every reason names the run id (D-09)` | **round 1** (re-drilled after the fix) |
| 101-05 | `o05-fe-run` | smokes 9 / rtl-mobile 98 / a11y 182 via wrapper, skipped >= cells >= rows | **3** | `INSTRUMENT-CANNOT-RUN: frontend/playwright.config.ts is not routed through the lease writer (P101-01) - D-13 forbids an unwrapped run` | **round 1** (re-drilled after the fix) |
| 101-06 | `o06-secrets` | 7 secrets dated after 2026-09-10T18:00:00Z | **1** | `FAIL: CARRY-01 rotation and the E2E_SUPABASE_SERVICE_ROLE_KEY write are not all recorded after the planning date` | **round 1** (re-drilled after the fix) |
| 101-07 | `o07-c1` | C1 E2E shards success on a run after 18:00Z | **1** | `FAIL: the latest main E2E run predates this phase (created 2026-08-14T22:58:38Z) - no phase PR has been merged` | **round 1** (re-drilled after the fix) |
| 101-07 | `o07-c2` | C2 integration success + D-3 line, run after 18:00Z | **1** | `FAIL: the latest main CI run predates this phase (created 2026-08-14T22:58:38Z)` | **round 1** (re-drilled after the fix) |
| 101-07 | `o07-c5` | C5 6 jobs 6 success, total 18, no E2E Tests, run after 18:00Z | **1** | `FAIL: the latest main CI run predates this phase (created 2026-08-14T22:58:38Z)` | **round 1** (re-drilled after the fix) |
| 101-07 | `o07-c4` | C4 context by name, 9 contexts, smoke PR BLOCKED + check FAILURE via --json | **1** | `FAIL: context 'RTL Portal + Component Smokes' absent from required_status_checks` | **round 1** (re-drilled after the fix) |

Reading the table. Nine oracles exit **1** (RED at HEAD, each with its control read alive: the a11y list
control 182/13, the base vitest config discovering 26 files, Lint / merge-reports reading `success`,
E2E_BASE_URL visible in the secret store, the fixme grep control 13, the root list 220/65). Three exit
**3** at the same precondition — `frontend/playwright.config.ts` does not yet contain
`pw-run-reaped.mjs --lease-exec` — because each would otherwise start a Playwright suite (D-13; brief rule
6 tonight). **The phases of `o01-drill` beyond that precheck are UNDRILLED tonight**: the executor's first
full run is the drill of the drill, and the plan says so. No oracle exits 0 at HEAD.

### §10.2 The red-spec population for 101-05 (derived, 29 files)

The `gh run view --log-failed` output stores each ANSI escape as the two characters `^[` followed by
`[…m` — `sed -E 's/\x1b\[[0-9;]*m//g'` (§ preamble) does not strip it on BSD sed; what does is:

```bash
R=alzahrani-khalid/Intl-Dossier-V2.0
for j in 94920109119 94920109185 94920552794 94920552761 94920552740; do
  gh run view -R $R --job $j --log-failed | sed -E 's/\^\[\[[0-9;]*m//g' > /tmp/job-$j.clean
  grep -oE '\[[a-z0-9-]+\] › tests/[A-Za-z0-9_./-]+\.spec\.ts:[0-9]+:[0-9]+ › .*$' /tmp/job-$j.clean \
    | sed -E 's/ \(retry #[0-9]+\)//; s/[ ─]+$//' | sort -u \
    | sed -E 's/^\[[a-z0-9-]+\] › //; s/:[0-9]+:[0-9]+ › .*//' | sort | uniq -c
  grep -oE '[0-9]+ failed' /tmp/job-$j.clean | tail -1
done
```

exit 0 ×5. (`[a-z-]+` misses the `a11y` project because of the digits — measured: 0 rows until the class
admitted `0-9`.) Files per job, with the CI notice beside each:

| job | notice | distinct files | files |
| --- | ------ | -------------- | ----- |
| E2E (shard 1/2) 94920109119 | 27 failed | 14 | `01-login`, `03-dossier-navigation`, `04-command-palette`, `05-notifications`, `06-work-item-crud`, `07-calendar-events`, `08-export-import`, `10-operations-hub`, `elected-official-create`, `engagement-create`, `forum-create`, `fouc-bootstrap`, `person-identity-fields`, `phase-36-shell` (all `tests/e2e/*.spec.ts`) |
| E2E (shard 2/2) 94920109185 | 36 failed | 7 | `ar-smoke/command-palette.ar`, `ar-smoke/dossier-navigation.ar`, `ar-smoke/login.ar`, `tailwind-remap-visual` (24 cells of one parametrised test at `:35:15`), `token-engine-sc` (5), `typography` (3), `working-group-create` |
| Accessibility (RTL + WCAG AA) 94920552794 | 18 failed | 5 | `frontend/tests/a11y/` `dossiers-rtl-a11y` (12, two tests × six dossier types), `intake-accessibility` (2), `positions-a11y-ar` (1), `positions-a11y-en` (2), `wcag-aa-comprehensive-audit` (1) |
| RTL Portal + Component Smokes 94920552761 | 3 failed | 2 | `frontend/tests/e2e/calendar-rtl` (1), `rtl-component-smokes` (2) |
| RTL + Responsive 94920552740 | 21 failed | 1 | `frontend/tests/e2e/dossier-rtl-mobile` (21: 18 cells of the viewport loop at `:265:9` + 3 at `:461:7`) |

Total **105 red tests across 29 files** = `files_modified` of 101-05 (plus its SUMMARY). Dedupe note for
the executor: parametrised tests share `file:line:col`; dedupe on the full row and drop a row that is a
strict prefix of another — the log truncates one line per job, which is why a naive `sort -u` reads 28
and 37 instead of 27 and 36.

Overlap check with 101-02's files (`dossiers-a11y.spec.ts`, `focus-indicators.spec.ts`): none. With
101-01's (`frontend/playwright.config.ts`, `frontend/package.json`): none. No two of 101-01..05 share a
file (verified by parsing all five front-matters).

### §10.3 The 31 integration files for 101-03 (derived) and why 236 are discovered today

```bash
gh run view -R $R --job 94920141442 --log-failed | sed -E 's/\^\[\[[0-9;]*m//g' > /tmp/int.clean
grep -oE '✓ tests/[A-Za-z0-9_./-]+\.test\.ts' /tmp/int.clean | sed 's/✓ //' | sort -u | wc -l     # 30
grep -oE '✓ [^ ]+' /tmp/int.clean | sort -u | grep -v '^✓ tests/'                                    # ✓ src/utils/__tests__/validation.test.ts (+ three non-path tokens)
grep -oE '(❯|×) tests/[A-Za-z0-9_./-]+\.test\.ts' /tmp/int.clean | sed -E 's/^(❯|×) //' | sort -u | wc -l   # 204
grep -E 'Test Files' /tmp/int.clean | tail -1     # Test Files  204 failed | 31 passed (235)
```

30 under `tests/` + `src/utils/__tests__/validation.test.ts` = **31**, matching the summary line; passed ∩
failed = 0. The 31 are unit / services / intelligence / root-level files — the BASE config's include —
because `backend/vitest.integration.config.ts` builds with `mergeConfig(baseConfig, …)` and Vite's
mergeConfig **concatenates** `include` arrays. Measured:
`cd backend && pnpm exec vitest list --filesOnly --config ./vitest.integration.config.ts | grep -cE '\.test\.ts$'`
→ **236** (exit 0; 235 in CI on 2026-08-14 — one file added since), by directory: contract 129,
contracts 11, integration 55, performance 9, intelligence 10, unit 15, services 1, src 1, five root files.
The base config alone lists 26. So "the integration suite" CI runs is every backend test, and the 31 it
passes are the ones that never touch a database. 101-03 sets `include` explicitly after the merge (the
same way `exclude` already is). Recorded, not judged: those 31 are also run by `Tests (backend)`.

### §10.4 Other measurements the plans rely on

- **Playwright 1.60.0** (`pnpm exec playwright --version`) file filters under the frontend config: bare
  `direction-portals.spec.ts`, `e2e/direction-portals.spec.ts`, `tests/a11y/dossiers-a11y.spec.ts`,
  `a11y/dossiers-a11y.spec.ts` and `dossiers-a11y` ALL resolved (5 / 5 / 16 / 16 / 16) on the final
  probe — but an earlier batch of the same `--list` calls, run back-to-back, printed
  `Error: No tests found. / Total: 0 tests in 0 files` for five of six forms and 5 for the sixth, then
  3/3 on immediate retry. Cause not established (a tickmarkr run was live and links the root
  `node_modules` into worktrees). Consequence in the plans: every `--list` precheck exits **3** on a
  mismatch, never 1, and the executor re-runs a zero before believing it.
- Populations hard-coded in the plans, all `--list`, exit 0: frontend `e2e/direction-portals.spec.ts`
  5, `e2e/calendar-rtl.spec.ts` 1, `e2e/rtl-component-smokes.spec.ts` 3 (smokes = **9**),
  `e2e/dossier-rtl-mobile.spec.ts` **98**, `--project=a11y` **182 in 13 files**,
  `tests/a11y/dossiers-a11y.spec.ts --project=a11y` **16**; root
  `--project=chromium-en --project=chromium-ar-smoke --no-deps` **220 in 65 files**; root
  `tests/e2e/signature-visuals/a11y.spec.ts --project=chromium-en --no-deps` 1.
- `ci.yml` job KEYS = **18** (js-yaml `Object.keys(jobs).length`); runtime jobs on run 31848669701 = 19
  because `build` is a two-way matrix. After D-07 deletes `test-e2e`: 17 keys, 18 runtime jobs. The
  101-04 static oracle asserts 17; the 101-07 C5 oracle asserts 18 runtime jobs and 0 named `E2E Tests`.
- `frontend/src/components/calendar/CalendarMonthGrid.tsx:82` still emits `className="cal-dow"
  data-testid="cal-dow"` at HEAD — so the smokes' `.cal-dow` count 0 (§1.3) is not "the class is gone";
  101-05 tells the executor to read the trace before assuming the drift.
- Tooling under `bash -c` from the root: node v26.7.0, pnpm 10.29.1, python3, lsof, gh (authenticated),
  js-yaml resolvable from the root `node_modules`; `actionlint` and `yq` absent (so 101-04's oracle is a
  js-yaml structural read, not a lint).
- Secret store (`gh secret list`, names only): the nine of §3, unchanged; `E2E_SUPABASE_SERVICE_ROLE_KEY`
  still absent. Required contexts: the eight of §2, unchanged. Latest `main` runs: 31848669701 (CI,
  failure), 31848669722 (E2E Tests, failure), both created 2026-08-14T22:58:38Z.

### §10.5 Planner rulings recorded here (the CONTEXT §3 map is otherwise followed row for row)

- **101-05 is wave 3, `depends_on: [101-01, 101-02]`** (the map said wave 1). D-13 forbids an unwrapped
  frontend run, and a wrapped run before 101-01 lands starts an UNLEASED stack, which the wrapper refuses
  (exit 90, report withheld) — so 101-05's frontend acceptance is impossible in wave 1. It also waits for
  101-02 so that two wrapped runs never contend for port 5173 in one wave (both start the frontend dev
  stack on 5173; the wrapper's pre-spawn census would read the other worktree's server as a foreign
  holder). 101-06 stays wave 3 with no dependency; 101-07 is wave 4 after all six.
- **D-08 "matrix" is implemented as three build steps in ONE job named exactly `Docker Build`.** A
  `strategy.matrix` renames every runtime job to `Docker Build (<ctx>)`, which would make the six-name
  population of the C5 oracle read 5 jobs and fail by construction (D-14). The three contexts, `push:
  false`, no login, `push` to main/develop only — D-08's substance — are asserted by the 101-04 oracle.
- **The criterion-5 population is SIX** (D-07 removes `E2E Tests`, D-01 adds `Security Scan`), per the
  brief; D-01's own "SEVEN" sentence predates the D-07 deletion and is superseded by D-07 + D-14.
- **`e2e.yml` is not in any plan's `files_modified`.** Its shards run the root config against
  `E2E_BASE_URL` (no webServer, nothing to wrap); its only defect is the absent secret, which is
  101-06's operator step.
- **The wrapper has never run on Linux.** `e2e.yml` calls Playwright directly and no CI job uses the root
  run mode. 101-04 routes three CI steps through it (D-06), so P101-07's `main` run is its first Linux
  execution; 101-04 owns a wrapper-caused red there. Stated in both plans as a bound, not hidden.
### §10.6 Round 1 (plan-checker verdict FAIL-with-issues, same evening)

Eight oracles were changed and re-drilled with `bash -c` from the repo root; four were not touched
(`o02-a11y-run`, `o02-focus-del`, `o03-include`, `o04-ci-yaml`) and keep their round-0 rows. Exit codes
and last lines are unchanged at HEAD for every re-drilled oracle except the printed cut-off strings:

- **Issue 1 (BLOCKER, 101-07 C4):** `gh pr checks | awk '{print $2}'` split the space-bearing job name and
  could never read `fail`. Now `gh pr checks --json name,state -q '.[] | select(.name=="RTL Portal +
  Component Smokes") | .state'` compared to `FAILURE` — measured on PR 98: `FAILURE` (its
  `mergeStateStatus` reads `UNKNOWN`, the PR being merged). At HEAD the context-absent arm still fires
  first, so the drill row is unchanged and the smoke-check arm is vouched for by the PR-98 measurement.
- **Issue 2 (101-05 register grep):** fenced to the `## Quarantine register` section (awk from that heading
  to the next `## `); the FIXED table lives under `## Fixed tests` with rows beginning `| FIXED |`.
- **Issue 3 (D-15, parametrised tests):** the register gains a fifth column `cells` (reporter cells one
  marker skips). `o05-bound` requires every row numeric and `sum(cells) >= rows`; `o05-fe-run` reads the
  register rows for each suite's spec files and asserts `skipped >= sum(cells) >= rows` (`>=`, not `==`,
  because pre-existing fixmes also skip — 56 of them in the a11y project). Parser drilled on a fixture:
  2 rows / 19 cells counted, a `| FIXED |` row and a row outside the section ignored. An empty register
  reads 0 rows / 0 cells / 0 non-numeric (a first draft counted the empty line as one bad row).
- **Issue 4 (D-01 SEVEN):** CONTEXT already amended by the overseer to SIX; no plan quotes SEVEN
  (`grep -n SEVEN 101-0*-PLAN.md` → only "the SEVENTH secret" in 101-06).
- **Issue 5 (drill phase F race):** the squatter is planted only after `wait_lease` succeeds, and the
  wrapper log is grepped for the refusal arm (`arm=[...]`), recorded either way; only 90-with-no-report
  passes.
- **Issue 6 (`wait_pw_gone`):** now waits on the lease file disappearing (wrapper-owned) OR a looser
  pgrep on the first spec token, bounded 180 s; returns true only when no lease remains.
- **Issue 7 (date cut-off):** every date comparison is now a full-ISO compare against the planning START
  `2026-09-10T18:00:00Z` (`o06-secrets`, `o07-c1/c2/c5`); a `//` comment inside a `node -e` one-liner
  swallowed the following statement on the first re-drill (`bad is not defined`) — replaced with `/* */`.
- **Issue 8 (§3 line numbers):** `e2e.yml:24,64,99` corrected to `28,70,105` in §3 above.

RESEARCH-101-END
