---
status: complete
phase: 101-ci-gates-green
plan: 4
completed: 2026-09-11
---

# P101-04 — CI workflow reshape

## Outcome

`.github/workflows/ci.yml` now carries the five plan decisions without renaming any retained job context:

- D-01: `Security Scan` keeps its exact name, grants `contents: read`, `actions: read`, and `security-events: write`, and uploads SARIF with `github/codeql-action/upload-sarif@v3`.
- D-07: the unrunnable `test-e2e` / `E2E Tests` job is deleted. The deployed-app suite remains in the untouched `.github/workflows/e2e.yml`.
- D-08/D-14: the one job named exactly `Docker Build` has no matrix, login, metadata, or push. Its three steps build the frontend, backend, and agent-runtime `Dockerfile.prod` images with `push: false`.
- D-06: `test-a11y`, `test-rtl-smokes`, and `test-rtl-responsive` each invoke Playwright exactly once through `node ../scripts/pw-run-reaped.mjs -- ...` from `./frontend`, with no HTML reporter argument.
- D-04: `Tests (integration)` retains its command and job-level `continue-on-error: true`.

The six criterion-5 names remain exactly:

1. `Security Scan`
2. `Tests (integration)`
3. `Accessibility Tests (RTL + WCAG AA)`
4. `RTL Portal + Component Smokes`
5. `RTL + Responsive Tests`
6. `Docker Build`

The existing required contexts remain named `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`, `Design Token Check`, and `react-i18next Factory Check`. This plan changes no retained job name.

## Counts and artifact paths

The YAML job-key count moves from **18 to 17** because D-07 removes the `test-e2e` key. The expected runtime-job count moves from **19 to 18**: `build` remains one YAML key with a two-way `backend`/`frontend` matrix and therefore expands into two runtime jobs. `docker-build` deliberately remains a single non-matrix runtime job so its reported context stays exactly `Docker Build`.

The three Playwright artifact paths change from `frontend/playwright-report/` to `frontend/test-results/`. Run mode appends `--reporter=json`; because the last Playwright reporter wins, the explicit `--reporter=html` arguments were removed. The wrapper publishes `pw-reaped-<nonce>.json` and traces under `frontend/test-results/`, so uploading the old HTML directory would produce an empty/misleading artifact.

## Full `ci.yml` diff and decision annotations

- Hunk `@@ -234,63 +234,6`: **D-07**, delete the redundant turbo/frontend E2E job; `e2e.yml` owns deployed-app E2E.
- Hunks `@@ -320`, `@@ -328`, `@@ -360`, `@@ -368`, `@@ -407`, and `@@ -415`: **D-06**, wrap each frontend Playwright invocation, remove the HTML reporter, and upload the wrapper report directory.
- Hunk `@@ -588,38 +531,40`: **D-08/D-14**, replace registry publication with three no-push production-image builds while preserving one exact `Docker Build` context.
- Hunk `@@ -632,6 +577,6` together with the permission lines in the preceding hunk: **D-01**, grant the SARIF permission and upgrade upload-sarif to v3 without changing `Security Scan`.
- **D-04** is intentionally a zero-diff decision: `test-integration` still runs `pnpm --filter intake-backend test:integration` with `continue-on-error: true`.

```diff
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
index a065509ed..5ccf0048e 100644
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -234,63 +234,6 @@ jobs:
       - name: Run backend integration tests
         run: pnpm --filter intake-backend test:integration

-  test-e2e:
-    name: E2E Tests
-    runs-on: ubuntu-latest
-    needs: [repo-policy]
-    env:
-      # Map the analyst test user + Supabase config from existing E2E_* secrets
-      # so the Playwright global-setup can authenticate (was the cred wall).
-      TEST_USER_EMAIL: ${{ secrets.E2E_ANALYST_EMAIL }}
-      TEST_USER_PASSWORD: ${{ secrets.E2E_ANALYST_PASSWORD }}
-      VITE_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
-      VITE_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
-    services:
-      postgres:
-        image: postgres:16-alpine
-        env:
-          POSTGRES_USER: postgres
-          POSTGRES_PASSWORD: postgres
-          POSTGRES_DB: test_db
-        ports:
-          - 5432:5432
-        options: >-
-          --health-cmd pg_isready
-          --health-interval 10s
-          --health-timeout 5s
-          --health-retries 5
-
-    steps:
-      - uses: actions/checkout@v4
-
-      - name: Setup pnpm
-        uses: pnpm/action-setup@v4
-
-      - name: Setup Node.js
-        uses: actions/setup-node@v4
-        with:
-          node-version: ${{ env.NODE_VERSION }}
-          cache: 'pnpm'
-
-      - name: Install dependencies
-        run: pnpm install --frozen-lockfile
-
-      - name: Install Playwright Browsers
-        run: pnpm exec playwright install --with-deps
-
-      - name: Run E2E tests
-        run: pnpm run test:e2e
-        env:
-          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
-
-      - name: Upload Playwright report
-        if: always()
-        uses: actions/upload-artifact@v4
-        with:
-          name: playwright-report
-          path: playwright-report/
-          retention-days: 30
-
   test-rtl-responsive:
     name: RTL + Responsive Tests
     runs-on: ubuntu-latest
@@ -320,7 +263,7 @@ jobs:
         run: pnpm exec playwright install --with-deps chromium

       - name: Run RTL + Responsive tests
-        run: pnpm exec playwright test tests/e2e/dossier-rtl-mobile.spec.ts --reporter=html
+        run: node ../scripts/pw-run-reaped.mjs -- e2e/dossier-rtl-mobile.spec.ts --project=chromium
         working-directory: ./frontend

       - name: Upload RTL + Responsive test report
@@ -328,7 +271,7 @@ jobs:
         uses: actions/upload-artifact@v4
         with:
           name: rtl-responsive-report
-          path: frontend/playwright-report/
+          path: frontend/test-results/
           retention-days: 30

   test-a11y:
@@ -360,7 +303,7 @@ jobs:
         run: pnpm exec playwright install --with-deps chromium

       - name: Run Accessibility tests
-        run: pnpm exec playwright test --project=a11y --reporter=html
+        run: node ../scripts/pw-run-reaped.mjs -- --project=a11y
         working-directory: ./frontend

       - name: Upload Accessibility test report
@@ -368,7 +311,7 @@ jobs:
         uses: actions/upload-artifact@v4
         with:
           name: a11y-report
-          path: frontend/playwright-report/
+          path: frontend/test-results/
           retention-days: 30

   # CONTEXT decision "CI smoke gating (FOUC-02)": ship the RTL/portal smokes as a
@@ -407,7 +350,7 @@ jobs:
         run: pnpm exec playwright install --with-deps chromium

       - name: Run RTL portal + component smokes
-        run: pnpm exec playwright test direction-portals.spec.ts calendar-rtl.spec.ts rtl-component-smokes.spec.ts --project=chromium --reporter=html
+        run: node ../scripts/pw-run-reaped.mjs -- e2e/direction-portals.spec.ts e2e/calendar-rtl.spec.ts e2e/rtl-component-smokes.spec.ts --project=chromium
         working-directory: ./frontend

       - name: Upload RTL smokes report
@@ -415,7 +358,7 @@ jobs:
         uses: actions/upload-artifact@v4
         with:
           name: rtl-smokes-report
-          path: frontend/playwright-report/
+          path: frontend/test-results/
           retention-days: 30

   build:
@@ -588,38 +531,40 @@ jobs:
       - name: Set up Docker Buildx
         uses: docker/setup-buildx-action@v3

-      - name: Log in to GitHub Container Registry
-        uses: docker/login-action@v3
+      - name: Build frontend image (no push)
+        uses: docker/build-push-action@v5
         with:
-          registry: ghcr.io
-          username: ${{ github.actor }}
-          password: ${{ secrets.GITHUB_TOKEN }}
+          context: ./frontend
+          file: ./frontend/Dockerfile.prod
+          push: false
+          cache-from: type=gha
+          cache-to: type=gha,mode=max

-      - name: Extract metadata
-        id: meta
-        uses: docker/metadata-action@v5
+      - name: Build backend image (no push)
+        uses: docker/build-push-action@v5
         with:
-          images: ghcr.io/${{ github.repository }}
-          tags: |
-            type=ref,event=branch
-            type=ref,event=pr
-            type=semver,pattern={{version}}
-            type=semver,pattern={{major}}.{{minor}}
-            type=sha
-
-      - name: Build and push Docker images
+          context: ./backend
+          file: ./backend/Dockerfile.prod
+          push: false
+          cache-from: type=gha
+          cache-to: type=gha,mode=max
+
+      - name: Build agent-runtime image (no push)
         uses: docker/build-push-action@v5
         with:
-          context: .
-          push: true
-          tags: ${{ steps.meta.outputs.tags }}
-          labels: ${{ steps.meta.outputs.labels }}
+          context: ./agent-runtime
+          file: ./agent-runtime/Dockerfile.prod
+          push: false
           cache-from: type=gha
           cache-to: type=gha,mode=max

   security-scan:
     name: Security Scan
     runs-on: ubuntu-latest
+    permissions:
+      contents: read
+      actions: read
+      security-events: write
     steps:
       - uses: actions/checkout@v4

@@ -632,6 +577,6 @@ jobs:
           output: 'trivy-results.sarif'

       - name: Upload Trivy results to GitHub Security tab
-        uses: github/codeql-action/upload-sarif@v2
+        uses: github/codeql-action/upload-sarif@v3
         with:
           sarif_file: 'trivy-results.sarif'
```

## Static oracle

The plan's exact `js-yaml` structural oracle ran from the repository root. `js-yaml` resolved successfully (otherwise the command would have exited 3). Output, verbatim:

```text
P101-04 jobs=17 test-e2e=false sarif=github/codeql-action/upload-sarif@v3 secperm={"contents":"read","actions":"read","security-events":"write"} docker_builds=["./agent-runtime|./agent-runtime/Dockerfile.prod|false","./backend|./backend/Dockerfile.prod|false","./frontend|./frontend/Dockerfile.prod|false"] findings=0
PASS
```

This positively asserts all five decisions: no `test-e2e` key/name, SARIF v3 and `security-events: write`, one non-matrix/no-login Docker job with exactly the three required no-push tuples, exactly one wrapped Playwright run in each frontend job from `./frontend` without `--reporter=html`, integration `continue-on-error: true`, all six names, and exactly 17 job keys.

## Population and zero controls

Command:

```bash
git diff --stat -- .github/workflows/ci.yml
grep -c 'name: ' .github/workflows/ci.yml
for n in 'Security Scan' 'Tests (integration)' 'Accessibility Tests (RTL + WCAG AA)' 'RTL Portal + Component Smokes' 'RTL + Responsive Tests' 'Docker Build'; do
  c=$(grep -Fxc "    name: $n" .github/workflows/ci.yml || true)
  printf '%s\t%s\n' "$c" "$n"
done
printf 'test-e2e key hits\t'; grep -c '^  test-e2e:' .github/workflows/ci.yml || true
printf 'E2E Tests name hits\t'; grep -c '^    name: E2E Tests$' .github/workflows/ci.yml || true
printf 'Playwright wrapper run steps\t'; grep -c 'run: node ../scripts/pw-run-reaped.mjs -- ' .github/workflows/ci.yml
printf 'html reporter args\t'; grep -c -- '--reporter=html' .github/workflows/ci.yml || true
printf 'wrapper report upload paths\t'; grep -c 'path: frontend/test-results/' .github/workflows/ci.yml
git diff --check -- .github/workflows/ci.yml
git status --short
```

Output before the workflow commit, verbatim:

```text
 .github/workflows/ci.yml | 115 +++++++++++++----------------------------------
 1 file changed, 30 insertions(+), 85 deletions(-)
108
1	Security Scan
1	Tests (integration)
1	Accessibility Tests (RTL + WCAG AA)
1	RTL Portal + Component Smokes
1	RTL + Responsive Tests
1	Docker Build
test-e2e key hits	0
E2E Tests name hits	0
Playwright wrapper run steps	3
html reporter args	0
wrapper report upload paths	3
 M .github/workflows/ci.yml
```

The two E2E zeros are meaningful because the same exact-name instrument reads one hit for each of the six retained criterion-5 names. The HTML-reporter zero is paired with three wrapper invocations and three wrapper-directory upload paths. `git diff --check` emitted no output.

## Validation boundary and P101-04 responsibility

Nothing changed here has run on `ubuntu-latest`. The commit hook executed repository checks locally on macOS, but that is not a Linux result. The wrapper has never executed on Linux: `.github/workflows/e2e.yml` runs Playwright unwrapped against `E2E_BASE_URL`, and the root run mode is not used by any CI job. Therefore the first `main` run observed by P101-07 is also the first Linux run of `scripts/pw-run-reaped.mjs`.

A red first `main` run whose first cause is the wrapper— including Linux `ps lstart` output shape, absence of `lsof`, or absence/behavior of `python3`—is a **P101-04 defect to fix under this plan, not a quarantine**. P101-07 owns producing and observing that `main` run; this plan owns correcting any wrapper-first Linux failure it reveals.

No Playwright suite or Docker build was invoked directly as part of this plan. No push, PR, branch-protection mutation, or secret mutation occurred.
