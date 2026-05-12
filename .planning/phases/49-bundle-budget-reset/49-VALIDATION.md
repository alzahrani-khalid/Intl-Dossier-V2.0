---
phase: 49
slug: bundle-budget-reset
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 49 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | vitest 2.x (frontend unit/integration), playwright (E2E), size-limit 12.x (bundle gate), gh CLI (branch protection + smoke-PR checks) |
| **Config file**        | `frontend/vitest.config.ts`, `frontend/.size-limit.json`, `.github/workflows/ci.yml`, `frontend/playwright.config.ts`                 |
| **Quick run command**  | `pnpm -C frontend size-limit`                                                                                                         |
| **Full suite command** | `pnpm -C frontend size-limit && pnpm -C frontend build && pnpm -C frontend test --run && pnpm -C frontend test:e2e`                   |
| **Estimated runtime**  | size-limit: ~60s · build: ~45s · vitest: ~90s · playwright: ~180s · total ~6m                                                         |

---

## Sampling Rate

- **After every task commit:** Run `pnpm -C frontend size-limit` (the gate the phase is restoring — must stay green locally)
- **After every plan wave:** Run `pnpm -C frontend build && pnpm -C frontend size-limit` (proves chunk topology + ceilings still match)
- **Before `/gsd-verify-work`:** Full suite must be green; smoke PRs must show `Bundle Size Check (size-limit)` as failed + `mergeStateStatus: BLOCKED`
- **Max feedback latency:** ~60s (size-limit alone)

---

## Per-Task Verification Map

> Populated by planner during plan generation. Task IDs follow `49-{plan}-{task}` shape.

| Task ID  | Plan | Wave | Requirement          | Threat Ref | Secure Behavior                                                                                                          | Test Type            | Automated Command                                                                                                                         | File Exists | Status                                      |
| -------- | ---- | ---- | -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------- | -------- | ---------- |
| 49-01-01 | 01   | 1    | BUNDLE-01, BUNDLE-04 | —          | Audit captures top-20 chunks + lazy candidates from a clean `ANALYZE=true pnpm build`                                    | manual artifact      | `ANALYZE=true pnpm -C frontend build && ls -la frontend/dist/stats.html`                                                                  | ✅ wired    | ⬜ pending                                  |
| 49-01-02 | 01   | 1    | BUNDLE-01            | —          | `.size-limit.json` ceilings rewritten per D-01..D-03 + new sub-vendor entries                                            | unit (assert-script) | `pnpm -C frontend build && node frontend/scripts/assert-size-limit-matches.mjs`                                                           | ✅ wired    | ⬜ pending                                  |
| 49-02-01 | 02   | 1    | BUNDLE-04            | —          | `vite.config.ts` `manualChunks` adds heroui-vendor / sentry-vendor / dnd-vendor branches before `return 'vendor'`        | unit                 | `pnpm -C frontend build && grep -E '(heroui                                                                                               | sentry      | dnd)-vendor' frontend/dist/assets/\*.js -l` | ✅ wired | ⬜ pending |
| 49-02-02 | 02   | 2    | BUNDLE-02            | —          | Audit-identified ≥30 KB gz non-initial components converted to `React.lazy()` w/ GlobeSpinner or token skeleton fallback | unit + E2E           | `pnpm -C frontend test --run && pnpm -C frontend test:e2e`                                                                                | ✅ wired    | ⬜ pending                                  |
| 49-02-03 | 02   | 2    | BUNDLE-04            | —          | `frontend/docs/bundle-budget.md` lists every chunk >100 KB gz with rationale                                             | manual artifact      | `test -f frontend/docs/bundle-budget.md && wc -l frontend/docs/bundle-budget.md`                                                          | ⚠️ W0       | ⬜ pending                                  |
| 49-02-04 | 02   | 2    | BUNDLE-01, BUNDLE-02 | —          | Initial JS under 450 KB gz + Total JS under 1.8 MB gz (or escalation with numbers per D-02)                              | unit                 | `pnpm -C frontend size-limit`                                                                                                             | ✅ wired    | ⬜ pending                                  |
| 49-03-01 | 03   | 1    | BUNDLE-03            | —          | `Bundle Size Check (size-limit)` added to `main` required_status_checks with `enforce_admins: true` preserved            | unit                 | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \| jq '.required_status_checks.contexts'`                       | ✅ wired    | ⬜ pending                                  |
| 49-03-02 | 03   | 2    | BUNDLE-03            | —          | Smoke PR-A pushes Initial JS > 450 KB → `bundle-size-check` fails → `mergeStateStatus: BLOCKED`                          | manual gate proof    | `gh pr checks <PR-A> --json name,state \| jq '.[] \| select(.name == "Bundle Size Check (size-limit)")'`                                  | ⚠️ W0       | ⬜ pending                                  |
| 49-03-03 | 03   | 2    | BUNDLE-03            | —          | Smoke PR-B pushes a sub-vendor chunk > its ceiling → `bundle-size-check` fails → `mergeStateStatus: BLOCKED`             | manual gate proof    | `gh pr checks <PR-B> --json name,state \| jq '.[] \| select(.name == "Bundle Size Check (size-limit)")'`                                  | ⚠️ W0       | ⬜ pending                                  |
| 49-03-04 | 03   | 3    | D-14 phase-close     | —          | Zero net-new `eslint-disable` / `@ts-ignore` / `@ts-expect-error` / size-limit ceiling-raise vs `main` baseline          | unit                 | `git diff main...HEAD -- 'frontend/**' \| grep -cE '^\\+.*((eslint-disable)\|(@ts-ignore)\|(@ts-expect-error))' \| awk '{exit ($1 > 0)}'` | ✅ wired    | ⬜ pending                                  |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

_W0 = Wave 0 setup creates the artifact/PR; not pre-existing._

---

## Wave 0 Requirements

- [ ] `frontend/docs/bundle-budget.md` — new file (Plan 02 Task 03). Initial scaffold with table header before audit numbers fill it.
- [ ] Smoke PR-A branch + draft PR — Wave 0 of Plan 03; created before Wave 2 push.
- [ ] Smoke PR-B branch + draft PR — Wave 0 of Plan 03; created before Wave 2 push.
- [ ] `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` — one-shot artifact (Plan 01 Task 01).

_Existing infrastructure (`pnpm size-limit`, `assert-size-limit-matches.mjs`, `ANALYZE=true` + `rollup-plugin-visualizer`, `gh api` flow from Phase 47/48) covers all other phase verifications._

---

## Manual-Only Verifications

| Behavior                                                                                                                   | Requirement                            | Why Manual                                                                                                                              | Test Instructions                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit summary captures top-20 chunks + suspected eager-import culprits                                                     | BUNDLE-01, BUNDLE-04                   | Audit is a one-shot human-readable artifact (`49-BUNDLE-AUDIT.md`) — values change with every dep update; not pinnable to an assertion  | Run `ANALYZE=true pnpm -C frontend build`, open `frontend/dist/stats.html`, populate `49-BUNDLE-AUDIT.md` top-20 table + lazy candidate list                |
| Smoke PRs show `mergeStateStatus: BLOCKED`                                                                                 | BUNDLE-03                              | GitHub `mergeable_state` is a UI/GraphQL signal; not directly exposed via `gh pr checks`. Use `gh pr view <PR> --json mergeStateStatus` | `gh pr view <PR-A> --json mergeStateStatus,statusCheckRollup` and confirm `BLOCKED`                                                                         |
| Branch-protection `enforce_admins: true` preserved after D-10 update                                                       | BUNDLE-03, Phase 47 D-09 carry-forward | `enforce_admins` setting is in protection config and must be re-asserted on every PUT (API does not preserve unset fields)              | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \| jq '.enforce_admins.enabled'` → must be `true`                                 |
| Suspense fallback styling respects CLAUDE.md design rules (1px border, no shadow, density tokens, GlobeSpinner for routes) | D-13                                   | Visual + token-scan; combine an `rg` for raw hex/`shadow`/`text-blue` in changed files with a Chromium visual smoke at 1280px LTR + RTL | `rg -n '(#[0-9a-f]{3,6}\b\|box-shadow\|text-(left\|right))' $(git diff --name-only main...HEAD -- 'frontend/src/**')` should return zero, plus visual check |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (bundle-budget.md scaffold, smoke-PR drafts, audit artifact)
- [ ] No watch-mode flags (vitest `--run`, no `--watch`)
- [ ] Feedback latency < 60s for the gate the phase is restoring (`pnpm size-limit`)
- [ ] `nyquist_compliant: true` set in frontmatter after planner finalizes task-id ↔ requirement-id map

**Approval:** pending
