# Q1 — CI Gate Status (resolved 2026-05-08)

**Source:** `.planning/research/questions.md` §Q1
**Resolved by:** Phase 47 research (`.planning/phases/47-type-check-zero/47-RESEARCH.md`)
**Status:** ANSWERED — gate is wired but unenforced because `main` has no branch protection.

---

## Question

Are `pnpm type-check` and `pnpm lint` actually run on PRs and `main` builds? If yes, why do they not block despite 1580 frontend + 498 backend TS errors and 723 lint problems?

## Answer

**Both checks run on every push and pull_request, both have been failing on every recent run, and `main` is not protected — so red CI is informational, not enforcing.**

### Evidence

#### 1. The `Lint` job runs both `pnpm run lint` and `pnpm run typecheck`

`.github/workflows/ci.yml` lines 43–68:

```yaml
lint:
  name: Lint
  runs-on: ubuntu-latest
  needs: [repo-policy]
  steps:
    - uses: actions/checkout@v4
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
      with:
        version: ${{ env.PNPM_VERSION }}
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'pnpm'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Run linting
      run: pnpm run lint # line 65
    - name: Check TypeScript
      run: pnpm run typecheck # line 68
```

There is no `continue-on-error: true` on either step. A non-zero exit from either step fails the `Lint` job.

#### 2. The `Lint` job is currently failing on every push to `main`

`gh run list --branch main --workflow ci.yml --limit 5`:

```
2026-04-18T18:20:29Z   failure   push   main
2026-04-18T16:39:54Z   failure   push   main
2026-04-16T23:24:34Z   failure   push   main
2026-04-14T06:29:34Z   failure   push   main
2026-04-13T02:20:10Z   failure   push   main
```

Per-job breakdown of run `24610946095` (most recent main push, 2026-04-18):

| Job                    | Conclusion                         |
| ---------------------- | ---------------------------------- |
| Repo Policy            | success                            |
| **Lint**               | **failure**                        |
| Unit Tests             | failure                            |
| E2E Tests              | failure                            |
| Security Scan          | failure                            |
| RTL + Responsive Tests | skipped (needs: [lint])            |
| Accessibility Tests    | skipped (needs: [lint])            |
| Bundle Size Check      | skipped (needs: [lint])            |
| Build                  | skipped (needs: [lint, test-unit]) |
| Lighthouse CI          | skipped (needs: [build])           |
| Docker Build           | skipped (needs: [build])           |

The `Lint` job has been red on `main` for at least 5 consecutive pushes spanning 5 days. Downstream jobs that depend on `lint` via `needs:` are `skipped` (not green, not red) because GitHub Actions treats an unsatisfied `needs:` as "do not run" rather than "fail."

#### 3. `main` has zero branch protection

```
$ gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection
{"message":"Branch not protected","status":"404"}
```

There is no `required_status_checks` array, no `enforce_admins` flag, and no PR-required policy. **Anything can be pushed or merged to `main` regardless of CI status.** This is why a red `Lint` job has been allowed to persist indefinitely without blocking work.

#### 4. Downstream `needs: [lint]` is a soft dependency, not an enforcing gate

In `.github/workflows/ci.yml`:

- line 156: `test-rtl-responsive` → `needs: [lint]`
- line 192: `test-a11y` → `needs: [lint]`
- line 228: `build` → `needs: [lint, test-unit]`
- line 263: `bundle-size-check` → `needs: [lint]`

These are declared as workflow-level dependencies. They prevent the dependent jobs from _running_ when `lint` fails, but they do not by themselves prevent a merge — that requires branch-protection rules at the repo level naming each check by its `name:` value.

## Implications for Phase 47 plan

1. **TYPE-03 is two separate work items, not one.**
   - **a. Code change:** split type-check into its own CI job (per CONTEXT.md D-08) so failures attribute to the right check name and downstream jobs that should _not_ require typecheck (e.g. `security-scan`) stay decoupled.
   - **b. Repo-settings change:** add a `required_status_checks` rule on `main` listing the new `type-check` job (and `lint`, and any other gate the team intends to enforce). This is a GitHub UI / API change, not a code change. Without it, a green `type-check` job on a PR proves the code is type-clean but does not actually block a merge with red checks.

2. **The CI split must happen _after_ TYPE-01 + TYPE-02 land.** Splitting first means the new `type-check` job is born red and persists red until the workspace cleanups land. Splitting after means the new job is green from its first commit, which is the only state that lets us turn it into a required check without immediately blocking unrelated PRs.

3. **The smoke-test PR (CONTEXT D-13) is the only proof the gate enforces.** Steps after wiring lands:
   - Create branch `chore/test-type-check-gate-frontend` with one deliberate TS error in a frontend file.
   - Open PR; observe `type-check` check fails red.
   - Confirm GitHub UI says "Required" and "Merging is blocked" because of the failing required check.
   - Close PR (do not merge, do not push to main).
   - Repeat for backend with `chore/test-type-check-gate-backend`.

4. **Existing `needs: [lint]` chains may need updating.** When `type-check` becomes its own job:
   - If a downstream job needs _both_ lint and typecheck to be green before running, change its `needs:` to `[lint, type-check]`.
   - If a downstream job needs neither (e.g. `security-scan`), leave it alone.
   - The four current `needs: [lint]` consumers (`test-rtl-responsive`, `test-a11y`, `bundle-size-check`, and `build` via `[lint, test-unit]`) all imply "the source must be lint-clean and type-clean before running this expensive job," so all four should become `needs: [lint, type-check]`.

5. **`turbo run type-check` has `dependsOn: ["build"]` in `turbo.json`.** This is dead weight for a `tsc --noEmit` gate (build is not needed to type-check). The CI job should call the per-workspace script directly (`pnpm --filter frontend type-check && pnpm --filter backend type-check`) to skip the build step and shave seconds-to-minutes off PR latency.

## Files referenced

- `.github/workflows/ci.yml` lines 43–68, 156, 192, 228, 263
- `turbo.json` lines 22–25 (`type-check` task with `dependsOn: ["build"]`)
- `package.json` line 28 (`typecheck` → `turbo run type-check`)
- `frontend/package.json` line 19 (`type-check` → `tsc --noEmit`)
- `backend/package.json` line 15 (`type-check` → `tsc --noEmit`)

## Runtime checks the executor must perform during plan execution

These cannot be answered from the filesystem:

| Check                                   | Command                                                                         | Required state                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Branch protection exists on `main`      | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection`      | Returns 200 (not 404)                                                                                            |
| `type-check` is a required status check | Same response, look at `.required_status_checks.contexts[]`                     | Includes `"type-check"`                                                                                          |
| `lint` is also still required           | Same response                                                                   | Includes `"Lint"` (note: GitHub uses the `name:` value, which is the title-cased "Lint", not the job key `lint`) |
| Smoke-test PR for frontend is rejected  | Open `chore/test-type-check-gate-frontend` with one TS error; observe PR status | Mergeable: false; failing check: type-check                                                                      |
| Smoke-test PR for backend is rejected   | Open `chore/test-type-check-gate-backend` with one TS error; observe PR status  | Mergeable: false; failing check: type-check                                                                      |

After verifying, all five smoke-test branches should be deleted; nothing here should land on `main`.

---

_Resolved: 2026-05-08 — answer captured before Phase 47 plan-phase per ROADMAP entry condition._
