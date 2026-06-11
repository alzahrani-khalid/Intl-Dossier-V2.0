# Phase 47: Type-Check Zero — Research

**Researched:** 2026-05-08
**Domain:** TypeScript type-check / CI gating / mechanical cleanup at scale
**Confidence:** HIGH (everything in this document is `[VERIFIED]` from the local checkout, the live `tsc --noEmit` runs, or the GitHub API; no `[ASSUMED]` claims).

<user_constraints>

## User Constraints (from 47-CONTEXT.md)

### Locked Decisions

- **D-01** Absolute zero net-new `@ts-ignore` / `@ts-expect-error` introduced during Phase 47.
- **D-02** Genuinely unfixable third-party-typing edges land in `.planning/phases/47-type-check-zero/EXCEPTIONS.md` with file path, error code, upstream issue link, follow-up issue link.
- **D-03** Default fix for TS6133 / TS6196 is **deletion** of the unused declaration. No `_`-prefix renaming. No disabling of `noUnusedLocals` / `noUnusedParameters`.
- **D-04** Before deleting an exported declaration, verify it is not consumed by an unscanned surface (Edge Functions, Supabase generated types, runtime-only consumers). Anything ambiguous is flagged in the plan, not deleted by reflex.
- **D-05** Real type fixes are reserved for the residual non-TS6133/TS6196 tail. Produce a category histogram so the residual tail is sized before work starts. (Done — see §3.)
- **D-06** Frontend (1580) and backend (498) tackled as **two parallel plans** under Phase 47.
- **D-07/D-08** Type-check today runs inside the `lint` job (line 67–68). Phase 47 splits it into its own `type-check` job, parallel to `lint`, both depending only on `repo-policy`. **Split happens AFTER errors hit zero**, not before.
- **D-09** Branch protection on `main` must require both `lint` and `type-check`. Smoke-test PR proves the gate.
- **D-10** Do NOT add `tsc --noEmit` to `.husky/pre-commit`.
- **D-11** No tsconfig changes.
- **D-12** Do NOT add tsc to default `build` script. CI gate uses dedicated `type-check` (`tsc --noEmit`).
- **D-13** Done = both workspaces type-check exit 0 on fresh clone + smoke-test PR with deliberate TS error rejected + branch protection requires the new check.

### Claude's Discretion

- Exact deletion-vs-fix split per file is the executor's call, guided by D-03 and D-04.
- Sub-plan count under Phase 47 (one plan, two plans, or split-by-error-category). D-06 only locks the parallel posture.
- Whether to add a one-off `pnpm type-check:summary` script that prints the error histogram.

### Deferred Ideas (OUT OF SCOPE)

- `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` tightening — REQUIREMENTS.md "Future (deferred)".
- Pre-push tsc hook — revisit only if a TS regression slips past the new CI gate.
- Stylelint and a11y CI gates.
- Knip enforcement (currently `|| true` in `.husky/pre-commit`).
- Lint zero (LINT-06..09) — Phase 48.
- Bundle budget reset (BUNDLE-01..04) — Phase 49.
- Intelligence Engine (v7.0).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                    | Research Support                                                                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TYPE-01 | Frontend `pnpm type-check` exits 0 on a clean clone (1580 errors → 0). No new suppressions.                    | §3 histogram, §7 top-file clusters, §10 plan granularity, §11 pitfalls (cross-workspace import, generated `database.types.ts`, `routeTree.gen.ts`).                        |
| TYPE-02 | Backend `pnpm type-check` exits 0 on a clean clone (498 errors → 0). No new suppressions.                      | §3 histogram, §7 top-file clusters (backend), §11 pitfalls (test files in tsc graph), §10 plan granularity.                                                                |
| TYPE-03 | Type-check job runs as a PR-blocking CI gate; a single TS error cannot merge to `main`.                        | §2 Q1 resolution, §5 CI job split diff, §6 smoke-test mechanics. **Note: TYPE-03 is two work items — code change (split job) + repo-settings change (branch protection).** |
| TYPE-04 | Any retained `@ts-ignore` / `@ts-expect-error` carries inline reason + issue/follow-up reference; net new = 0. | §11 pitfalls (only 3 pre-existing suppressions in the repo today, all justified). §9 validation architecture (the gate itself enforces TYPE-04).                           |

</phase_requirements>

## 1. Summary

1. **The user-supplied error counts (1580 / 498) are exact** — verified against `pnpm exec tsc --noEmit` on `DesignV2` head (2026-05-08). No drift since the v6.2 measurement.
2. **CONTEXT D-03's premise — "errors are dominated by TS6133 + TS6196" — is partly wrong for this codebase.** Frontend: TS6133 + TS6196 = 795 / 1580 = **50%** of errors; the other 50% are real type bugs (TS2339 missing properties: 353, TS2322 type mismatches: 151, TS7006 implicit any: 124, TS18046 unknown narrowing: 48). Backend: TS6133 + TS6196 = 160 / 498 = **32%**; the other 68% are real type bugs (TS2345 argument: 132, TS7030 missing return: 59, TS2339: 28, TS2532 possibly undefined: 23). The plan must size both buckets and give the executor explicit policy for the real-type-bug tail (which is bigger than the rationale assumed).
3. **Q1 is resolved**: CI runs `pnpm typecheck` inside the `Lint` job; the job has been red on every push to `main` for ≥ 5 consecutive runs over 5 days; `main` has zero branch protection (`gh api .../branches/main/protection` returns 404). The CI job exists, the gate does not. See §2 and `.planning/research/Q1-ci-gate-status.md`.
4. **A frontend → backend cross-workspace type import chain exists.** `frontend/src/components/{tasks,entity-links}/*.tsx` imports from `../../../../backend/src/types/{database.types,intake-entity-links.types,ai-suggestions.types}.ts`. As a side effect, frontend `tsc --noEmit` includes those backend files in its compilation graph and produces 16 of the 1580 frontend errors _from backend type files_. This means: (a) frontend can be partially fixed by fixing backend types; (b) deleting "unused" exports in `backend/src/types/*` could break the frontend; (c) plan ordering must account for this if the workspaces are touched in parallel.
5. **The biggest risky-deletion trap is `database.types.ts` (Supabase-generated, 38 759 lines backend / 39 121 lines frontend).** Six of the TS6196 errors are inside this file (`Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`, `Constants`) — these are **standard helpers Supabase regenerates on every schema pull**. They must NOT be deleted. The same applies to `routeTree.gen.ts` (TanStack Router-generated, already has `@ts-nocheck`).

**Primary recommendation:** Three plans under Phase 47, executable in this order:

- **47-01 frontend-type-fix** (parallel with 47-02 once both branches are open). Plan-level entry: histogram + top-25 file table + cross-workspace import inventory + generated-file allowlist (database.types.ts, routeTree.gen.ts).
- **47-02 backend-type-fix** (parallel with 47-01).
- **47-03 ci-gate-and-branch-protection** (sequential; runs only after 47-01 and 47-02 hit zero). Splits the CI job, updates branch protection, runs the smoke-test PRs, deletes them.

The "two parallel plans" CONTEXT D-06 maps cleanly onto 47-01 and 47-02; D-08 maps onto 47-03.

## 2. Q1 Resolution (CI gate status)

Full evidence and action items are in **`.planning/research/Q1-ci-gate-status.md`** (created in this research pass).

**One-paragraph summary for the planner:** The `Lint` job (`.github/workflows/ci.yml` line 43–68) runs `pnpm run typecheck` at line 68 with no `continue-on-error`, so it does fail when type-check errors. It has been failing on every push to `main` for the last 5 runs (`gh run list --branch main --workflow ci.yml --limit 5`: 5/5 conclusion=failure). The reason red CI does not block work: `main` has no branch protection at all (`gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection` returns `{"message":"Branch not protected","status":"404"}`). The `needs: [lint]` chains on `test-rtl-responsive`, `test-a11y`, `bundle-size-check`, and `build` cause those jobs to skip when `lint` fails — they do not enforce a merge block; they just refuse to run. **TYPE-03 therefore decomposes into two parts: (a) split type-check into its own CI job for clean attribution; (b) add a branch-protection rule on `main` requiring both `Lint` and `type-check` checks.** Without (b), red CI remains advisory.

## 3. Error Histogram (D-05 deliverable)

### Methodology — verified commands (work today, output sample below)

```bash
# Total error count per workspace (use 'error TS' filter, not all stderr — captures error rows only)
pnpm --filter frontend exec tsc --noEmit 2>&1 | grep -E 'error TS' | wc -l   # → 1580
pnpm --filter backend exec tsc --noEmit 2>&1 | grep -E 'error TS' | wc -l    # → 498

# Per-code histogram (this is the canonical D-05 output)
pnpm --filter frontend exec tsc --noEmit 2>&1 | grep -oE 'TS[0-9]+' | sort | uniq -c | sort -rn

# Per-file top-N (drives plan task granularity — see §7)
pnpm --filter frontend exec tsc --noEmit 2>&1 | grep -oE '^[^(]+\.tsx?' | sort | uniq -c | sort -rn | head -25

# Per-top-level-directory (drives parallelization — see §7)
pnpm --filter frontend exec tsc --noEmit 2>&1 | grep -oE '^src/[^/]+' | sort | uniq -c | sort -rn
```

`tsc` outputs in default (`pretty: true`) form on a TTY but switches to plain `path(line,col): error TSXXXX: msg` when piped — the regexes above work against the piped form, which is what CI gives. No `--pretty=false` flag needed.

**Recommendation on D-05's "type-check:summary" script (Claude's discretion):** Add `pnpm type-check:summary` at the workspace level. One liner, useful for burn-down tracking during execution; trivial to remove once errors hit zero. Suggested form:

```jsonc
// frontend/package.json + backend/package.json scripts.type-check:summary
"type-check:summary": "tsc --noEmit 2>&1 | grep -oE 'TS[0-9]+' | sort | uniq -c | sort -rn || true"
```

The trailing `|| true` is required because `tsc --noEmit` exits non-zero when errors exist; without it, the pipe's exit status would mask the histogram.

### Frontend histogram (1580 total)

| TS code | Count | % of total | Class                                                          | D-03 default fix                |
| ------- | ----- | ---------- | -------------------------------------------------------------- | ------------------------------- |
| TS6133  | 500   | 31.6%      | Unused locals / parameters / imports                           | DELETE                          |
| TS2339  | 353   | 22.3%      | Property does not exist on type                                | REAL FIX                        |
| TS6196  | 295   | 18.7%      | Unused exported declaration                                    | DELETE (with D-04 verification) |
| TS2322  | 151   | 9.6%       | Type X not assignable to Y                                     | REAL FIX                        |
| TS7006  | 124   | 7.8%       | Parameter implicitly has any type                              | REAL FIX (annotate)             |
| TS18046 | 48    | 3.0%       | X is of type 'unknown'                                         | REAL FIX (narrow)               |
| TS2554  | 21    | 1.3%       | Wrong number of arguments                                      | REAL FIX                        |
| TS18048 | 15    | 0.9%       | X is possibly 'undefined'                                      | REAL FIX (guard)                |
| TS2345  | 12    | 0.8%       | Argument type mismatch                                         | REAL FIX                        |
| TS2307  | 12    | 0.8%       | Cannot find module                                             | REAL FIX (path/dep)             |
| TS7053  | 11    | 0.7%       | Element implicitly any (index access)                          | REAL FIX (key the type)         |
| TS2532  | 8     | 0.5%       | Object is possibly 'undefined'                                 | REAL FIX (guard)                |
| TS2353  | 8     | 0.5%       | Object literal has unknown property                            | REAL FIX                        |
| TS2503  | 6     | 0.4%       | Cannot find namespace                                          | REAL FIX                        |
| Others  | 16    | 1.0%       | TS2769, TS2678, TS2352, TS2724, TS2367, TS2739, TS2698, TS2561 | mixed                           |

**Buckets:** Deletion-eligible (TS6133 + TS6196) = 795 / 1580 = **50.3%**. Real-fix tail = 785 / 1580 = **49.7%**.

### Backend histogram (498 total)

| TS code                                                                                 | Count | % of total | Class                                | D-03 default fix                                                      |
| --------------------------------------------------------------------------------------- | ----- | ---------- | ------------------------------------ | --------------------------------------------------------------------- |
| TS2345                                                                                  | 132   | 26.5%      | Argument type mismatch               | REAL FIX                                                              |
| TS6133                                                                                  | 123   | 24.7%      | Unused locals / parameters / imports | DELETE                                                                |
| TS7030                                                                                  | 59    | 11.8%      | Not all code paths return a value    | REAL FIX (handler)                                                    |
| TS6196                                                                                  | 37    | 7.4%       | Unused exported declaration          | DELETE (with D-04 verification)                                       |
| TS2339                                                                                  | 28    | 5.6%       | Property does not exist on type      | REAL FIX                                                              |
| TS2532                                                                                  | 23    | 4.6%       | Object is possibly 'undefined'       | REAL FIX (guard)                                                      |
| TS18048                                                                                 | 13    | 2.6%       | X is possibly 'undefined'            | REAL FIX (guard)                                                      |
| TS7006                                                                                  | 12    | 2.4%       | Parameter implicitly has any         | REAL FIX                                                              |
| TS2769                                                                                  | 11    | 2.2%       | No overload matches this call        | REAL FIX                                                              |
| TS2322                                                                                  | 10    | 2.0%       | Type X not assignable to Y           | REAL FIX                                                              |
| TS2739                                                                                  | 7     | 1.4%       | Type missing properties              | REAL FIX                                                              |
| TS18047                                                                                 | 6     | 1.2%       | Value possibly 'null'                | REAL FIX (guard)                                                      |
| TS2741                                                                                  | 5     | 1.0%       | Property X missing in type           | REAL FIX                                                              |
| TS2589                                                                                  | 5     | 1.0%       | Type instantiation excessively deep  | REAL FIX (often Supabase chain — sometimes legitimate D-02 exception) |
| TS2551, TS2459, TS2554, TS2307, TS18046, TS1205, TS2365, TS2352, TS2740, TS2538, TS2430 | 27    | 5.4%       | Mixed                                | mixed                                                                 |

**Buckets:** Deletion-eligible (TS6133 + TS6196) = 160 / 498 = **32.1%**. Real-fix tail = 338 / 498 = **67.9%**.

**Key planning takeaway:** the backend is harder per-error (more real type fixes, fewer mechanical deletions) but smaller in raw count. The frontend is bigger but more mechanical. Wall-clock should be similar; D-06 parallel posture is correct.

## 4. Risky-Deletion Safe List (D-04)

D-04 says: before deleting any exported declaration, verify it is not consumed by an unscanned surface. Below are the surfaces and the verification recipes.

### 4.1 Generated files — DO NOT touch

| File                                                                     | Lines   | How regenerated                              | Disposition                                                     |
| ------------------------------------------------------------------------ | ------- | -------------------------------------------- | --------------------------------------------------------------- |
| `frontend/src/types/database.types.ts`                                   | 39 121  | `supabase gen types typescript`              | Allowlist — deletions are no-ops; the next regen restores them. |
| `backend/src/types/database.types.ts`                                    | 38 759  | Same                                         | Allowlist — same.                                               |
| `frontend/src/routeTree.gen.ts`                                          | (gen)   | `@tanstack/router-plugin` on Vite startup    | Already carries `// @ts-nocheck`; ignore.                       |
| `shared/types/*.d.ts` (commitment-tracking, dossier-stats, health-score) | (small) | Hand-maintained `.d.ts` shims; no .ts source | Treat as authored, not generated.                               |

The TS6196 errors inside `database.types.ts` (`Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`, `Constants` — six identical hits per workspace) are **standard Supabase-generated helpers** that the codebase doesn't import yet but that downstream code or future PRs may. **Do not delete them.** Two viable resolutions:

- **Recommended:** add `database.types.ts` to the per-workspace `tsconfig.json` `exclude` array — but this contradicts D-11 ("no tsconfig changes"). The cleaner read of D-11 is "don't tighten" — adding a generated file to the exclude list is not a tightening, it's a hygiene fix. Flag this for the planner to confirm.
- **Alternative:** suppress just inside the generated file via a top-of-file `// @ts-nocheck` comment, mirroring the pattern already used in `routeTree.gen.ts`. This is **not** a net-new D-01 violation because (a) it's a single comment in a generated file, not in source, and (b) it lands in TYPE-04's "documented exception" bucket (inline reason: "supabase gen types output; helpers are exported for downstream consumers").

The planner should pick one of the two options in the plan and lock it before the executor starts.

### 4.2 Cross-workspace consumers — verify before deleting

**Frontend → Backend imports** (verified 2026-05-08):

```
frontend/src/components/tasks/TaskEditDialog.tsx       → ../../../../backend/src/types/database.types
frontend/src/components/tasks/TaskCard.tsx             → ../../../../backend/src/types/database.types
frontend/src/components/tasks/ContributorsList.tsx     → ../../../../backend/src/types/database.types
frontend/src/components/tasks/TaskDetail.tsx           → ../../../../backend/src/types/database.types
frontend/src/components/kanban/KanbanBoard.tsx         → ../../../../backend/src/types/database.types
frontend/src/components/entity-links/LinkTypeBadge.tsx       → ../../../../backend/src/types/intake-entity-links.types
frontend/src/components/entity-links/LinkList.tsx            → ../../../../backend/src/types/intake-entity-links.types
frontend/src/components/entity-links/AISuggestionPanel.tsx   → ../../../../backend/src/types/ai-suggestions.types
frontend/src/components/entity-links/EntityLinkManager.tsx   → ../../../../backend/src/types/intake-entity-links.types
frontend/src/components/entity-links/EntitySearchDialog.tsx  → ../../../../backend/src/types/intake-entity-links.types
```

These imports use deep relative paths (`../../../../backend`), which means the frontend `tsc --noEmit` graph **transitively pulls in `backend/src/types/{database.types,intake-entity-links.types,ai-suggestions.types}.ts`**. Verified by running `tsc --listFilesOnly` in frontend — those three backend files appear in the file list. The 16 frontend errors against `../backend/src/types/*.ts` are emitted by the frontend tsc run but live in backend source.

**Verification recipe before deleting any exported type from `backend/src/types/*`:**

```bash
# (a) In-repo grep — covers frontend cross-workspace imports
grep -rn "MyType" frontend/src backend/src 2>/dev/null

# (b) Edge Functions — Deno runtime, separate from tsc graph
grep -rn "MyType" supabase/functions 2>/dev/null

# (c) Tests directory (top-level — backend tsconfig excludes "tests")
grep -rn "MyType" tests 2>/dev/null

# (d) Shared package
grep -rn "MyType" shared 2>/dev/null
```

If all four are empty, the export is genuinely unused and D-03 deletion applies. If any returns a hit, flag in plan rather than delete.

### 4.3 Edge Functions (`supabase/functions/`) — separate Deno runtime

Edge Functions run on Deno, not in the workspace `tsc` graph. They live in `supabase/functions/<name>/index.ts` and `supabase/functions/_shared/*.ts`. They do not import from `frontend/` or `backend/` (verified: `grep -rE "import.*backend|import.*frontend" supabase/functions` returns empty). They have their own `Database` type imports inline. Therefore **deletions in `frontend/src/types/*` or `backend/src/types/*` cannot break edge functions**.

### 4.4 Test files (`*.test.ts`, `*.test.tsx`)

- **Frontend** `tsconfig.json` excludes tests: lines 38–45 list `src/**/__tests__`, `src/**/*.test.ts(x)`, `src/**/*.spec.ts(x)`, `src/stories/**/*`. Tests do NOT participate in the frontend type-check gate. Verified via `tsc --listFilesOnly | grep -E "test|spec"` — empty.
- **Backend** `tsconfig.json` excludes only `["node_modules", "dist", "tests"]` (top-level `tests/` directory). Unit tests inside `backend/src/**/__tests__/*.test.ts` are **NOT** excluded — they run through the type-check. Verified: backend errors include `src/ai/__tests__/brief-generation.integration.test.ts(8,38): TS2307` and `src/models/__tests__/Country.test.ts:* TS2307/TS18047`. The plan must explicitly account for fixing these test-file errors (they are a real component of TYPE-02's 498).

### 4.5 Runtime-only consumers

Two patterns were checked:

- **Dynamic `import()`** — `grep -rE "import\(['\"]" frontend/src backend/src` returned 0 hits (nothing currently uses dynamic import in source). Skipping a "dynamically imported types" check is safe.
- **JSDoc `@type` references** — none in this codebase (TypeScript-first, no JSDoc-typed JS).

### 4.6 Backend test imports of source modules

Test files import production modules. When deleting a "TS6196 unused exported type" in `backend/src/api/foo.ts`, you must also grep `backend/src/**/__tests__/`. Recipe:

```bash
grep -rn "MyType" backend/src --include="*.ts"   # covers __tests__ subdirs
```

## 5. CI Job Split (D-08) — Concrete Diff Hints

This change happens in plan 47-03 **after** 47-01 + 47-02 land green. The diff against `.github/workflows/ci.yml`:

### 5.1 Insert a new `type-check` job parallel to `lint`

Insert after the existing `lint` job ends (~line 68). The new job mirrors `lint`'s setup but skips the `lint` step:

```yaml
type-check:
  name: type-check
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
    - name: Type-check frontend
      run: pnpm --filter frontend type-check
    - name: Type-check backend
      run: pnpm --filter backend type-check
```

**Why call the per-workspace scripts directly instead of `pnpm typecheck`:** The root `typecheck` script proxies to `turbo run type-check`, and `turbo.json` line 23 declares `dependsOn: ["build"]` for the `type-check` task. That makes turbo run `build` first, which is dead weight for `tsc --noEmit`. Calling `pnpm --filter <ws> type-check` skips the build step. (`turbo.json` could also be edited to drop the `dependsOn: ["build"]` for `type-check` — that's a one-line change and arguably cleaner. Planner's call.)

### 5.2 Remove the redundant `Check TypeScript` step from the `lint` job

`.github/workflows/ci.yml` line 67–68 currently does:

```yaml
- name: Check TypeScript
  run: pnpm run typecheck
```

Delete those two lines. After the split, the `lint` job runs only ESLint; the new `type-check` job owns tsc. This is the "clean attribution" benefit D-08 calls out.

### 5.3 Update downstream `needs:` arrays

| File:line  | Current                    | New                                    |
| ---------- | -------------------------- | -------------------------------------- |
| ci.yml:156 | `needs: [lint]`            | `needs: [lint, type-check]`            |
| ci.yml:192 | `needs: [lint]`            | `needs: [lint, type-check]`            |
| ci.yml:228 | `needs: [lint, test-unit]` | `needs: [lint, type-check, test-unit]` |
| ci.yml:263 | `needs: [lint]`            | `needs: [lint, type-check]`            |

Rationale: every job that today gates on "code is ESLint-clean" should equally gate on "code is type-clean," because both are the same surface (compileable, lintable source) and one passing without the other gives a misleading green dashboard.

`security-scan` (line 372) currently has no `needs:` — leave alone. It scans filesystem artifacts and doesn't care about source compileability.

### 5.4 Validate locally before opening PR

```bash
# Lint workflow on a feature branch through gh:
gh workflow view ci.yml
# After the change lands, push to a throwaway branch, observe both lint and type-check appear as separate checks on the PR.
```

## 6. Smoke-Test PR Mechanics (D-13)

### 6.1 Recommended primary verification: live PR

D-13 calls for a "deliberately broken PR" to prove the gate blocks. The safest mechanic:

1. After plan 47-03 lands the CI split AND branch protection is updated, create branch `chore/test-type-check-gate-frontend` from latest `main`.
2. Inject one TS error in a frontend file. Recommended pattern (smallest possible diff):
   ```typescript
   // in any frontend/src file, add:
   const _smokeTest: string = 42 // TS2322
   ```
3. `git push -u origin chore/test-type-check-gate-frontend` and `gh pr create --base main --title 'chore: smoke-test type-check gate (DO NOT MERGE)' --body 'verifies TYPE-03 gate blocks; will close without merging'`.
4. Wait for CI. Observe: `type-check` check status = failure. PR mergeable status = `BLOCKED`.
5. Verify via API that branch protection is enforcing:
   ```bash
   gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
     --jq '.required_status_checks.contexts'
   # expected: includes "type-check"
   ```
6. `gh pr close <number> --delete-branch`. Repeat for backend with `chore/test-type-check-gate-backend`.

### 6.2 Backup verification (run alongside primary)

Even without opening a PR, confirm the protection rule itself is in place:

```bash
# This MUST return 200 with required_status_checks set (not 404 like today):
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --jq '{required_status_checks: .required_status_checks.contexts, enforce_admins: .enforce_admins.enabled}'
```

Expected response shape after plan 47-03:

```json
{
  "required_status_checks": ["Lint", "type-check"],
  "enforce_admins": true
}
```

(Note: GitHub uses the `name:` value of each job, not the YAML key. The current `lint` job has `name: Lint`, so the required-checks string is `"Lint"`. The new `type-check` job should have `name: type-check` to match its key for ergonomic API listings.)

### 6.3 What NOT to do

- **Do not skip the live PR step** in favor of only the API check — the API can lie if a check name typo means the rule names a check that never runs (silently making the rule a no-op). The live PR is the only way to observe "did GitHub actually block this?"
- **Do not run the smoke test before plan 47-03 lands.** Before the split, type-check failures would attribute to `Lint` and the smoke-test PR would surface as a `Lint` failure — confusing and misleading.
- **Do not merge the smoke-test PR.** Close + delete branch.

## 7. Top-File Error Clusters (drives plan task granularity)

### 7.1 Frontend — top 25 files by error count (sum: ~480 / 1580 = 30%)

```
35  src/pages/persons/PersonDetailPage.tsx
32  src/components/report-builder/ReportBuilder.tsx
31  src/components/calendar/CalendarSyncSettings.tsx
29  src/routes/_protected/admin/data-retention.tsx
28  src/components/tags/TagAnalytics.tsx
27  src/components/onboarding/OnboardingChecklist.tsx
25  src/components/tags/TagSelector.tsx
23  src/components/stakeholder-timeline/StakeholderInteractionTimeline.tsx
22  src/routes/_protected/stakeholder-influence.tsx
22  src/pages/webhooks/WebhooksPage.tsx
22  src/components/compliance/ComplianceRulesManager.tsx
21  src/components/triage-panel/TriagePanel.tsx
20  src/pages/audit-logs/AuditLogsPage.tsx
17  src/types/enhanced-search.types.ts
17  src/pages/WaitingQueue.tsx
17  src/domains/intake/hooks/useIntakeApi.ts
16  src/types/intelligence-reports.types.ts
16  src/types/dossier-context.types.ts
16  src/hooks/useLegislation.ts
16  src/components/availability-polling/AvailabilityPollResults.tsx
15  src/types/multilingual-content.types.ts
15  src/services/user-management-api.ts
15  src/components/ui/content-skeletons.tsx
14  src/types/dashboard-widget.types.ts
14  src/hooks/useMeetingMinutes.ts
```

Distribution: long tail. Top 25 files = ~30% of errors; the remaining 70% is spread across hundreds of files with 1–13 errors each.

### 7.2 Frontend — by top-level directory

```
550  src/components       (35%)
373  src/types            (24%)
153  src/hooks            (10%)
153  src/domains          (10%)
142  src/pages            ( 9%)
 74  src/routes           ( 5%)
 59  src/services         ( 4%)
 44  src/lib              ( 3%)
  9  src/utils
  5  src/store
  1  src/design-system
  1  src/contexts
```

### 7.3 Backend — top 25 files by error count (sum: ~280 / 498 = 56%)

```
57  src/api/after-action.ts
30  src/services/interaction-note-service.ts
20  src/api/intake-entity-links.ts
17  src/api/task-contributors.ts
16  src/api/tasks.ts
15  src/services/clustering.service.ts
14  src/api/countries.ts
12  src/services/auth.service.ts
12  src/services/__tests__/auth.service.test.ts
11  src/api/mous.ts
11  src/api/ai/intake-linking.ts
10  src/services/signature.service.ts
10  src/api/events.ts
 9  src/types/ai-suggestions.types.ts
 9  src/services/query-parser.service.ts
 9  src/services/link.service.ts
 9  src/api/signatures.ts
 9  src/api/positions.ts
 8  src/types/after-action.types.ts
 8  src/api/permissions.ts
 7  src/utils/logger.ts
 7  src/models/position-consistency.model.ts
 7  src/models/__tests__/Country.test.ts
 7  src/middleware/optimistic-locking.ts
 7  src/config/redis.ts
```

Distribution: more concentrated than frontend. Top 25 files = ~56% of errors. `src/api/after-action.ts` alone owns 57 errors (11.4% of backend total).

### 7.4 Backend — by top-level directory

```
232  src/api          (47%)
136  src/services     (27%)
 30  src/types        ( 6%)
 25  src/models       ( 5%)
 21  src/middleware   ( 4%)
 13  src/config       ( 3%)
 12  src/utils
 10  src/ai
  6  src/lib
  6  src/integrations
  4  src/queues
  3  src/jobs
```

`src/api` is the dominant cluster. Most errors are TS2345 (132) "ParsedQs not assignable to string" and TS7030 (59) "not all code paths return" — both stem from Express handlers not narrowing `req.query` or not handling all branches. These are **systemic patterns** that the executor can fix with a small set of repeated micro-edits per file (e.g. `String(req.query.foo ?? '')`), not 132 unique fixes.

## 8. Cross-Workspace Type Surface

| Surface                                       | Path                                                                                                                                                | Used by                                                                                                            | Disposition during Phase 47                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Backend `Database` type (Supabase-generated)  | `backend/src/types/database.types.ts`                                                                                                               | Backend internally; **frontend** via `../../../../backend/...` deep import                                         | **DO NOT DELETE** — generated; allowlist. Six TS6196 hits inside this file are expected and ignorable. |
| Frontend `Database` type (Supabase-generated) | `frontend/src/types/database.types.ts`                                                                                                              | Frontend internally via `@/types/database.types`                                                                   | Same — generated; allowlist.                                                                           |
| `intake-entity-links.types`                   | `backend/src/types/intake-entity-links.types.ts`                                                                                                    | Backend; **frontend** via deep import (5 files in `components/entity-links/`)                                      | Verify cross-workspace consumers before deleting any export (D-04 recipe in §4.2).                     |
| `ai-suggestions.types`                        | `backend/src/types/ai-suggestions.types.ts`                                                                                                         | Backend; **frontend** via deep import in `AISuggestionPanel.tsx`                                                   | Same.                                                                                                  |
| Generated route tree                          | `frontend/src/routeTree.gen.ts`                                                                                                                     | Frontend (TanStack Router)                                                                                         | Already `@ts-nocheck`. Don't touch.                                                                    |
| `shared/` workspace                           | `shared/types/*.d.ts` (commitment-tracking, dossier-stats, health-score)                                                                            | **Nobody currently** — `grep -rl "from.*['\"]shared/\|from.*['\"]@shared" frontend/src backend/src` returns empty. | Out of scope for Phase 47; treat as inert.                                                             |
| Path mappings                                 | `frontend/tsconfig.json` `paths` (`@/*`, `@/components/*`, etc.); `backend/tsconfig.json` `paths` (`@/*`, `@/types/*`, `@/services/*`, `@/utils/*`) | Internal aliases only — none crosses workspace boundaries.                                                         | Inert; no Phase 47 changes per D-11.                                                                   |
| Edge Functions                                | `supabase/functions/**`                                                                                                                             | Deno runtime; not in tsc graph; no imports from frontend/backend.                                                  | Out of scope — deletions in workspace types cannot reach edge functions.                               |

**Implication for plan ordering:** if 47-01 (frontend) and 47-02 (backend) run truly in parallel, the executor on each plan must not delete exports in `backend/src/types/{intake-entity-links,ai-suggestions}.types.ts` without checking the frontend consumers. The plan should call this out as a "shared edit fence" — both plans treat those three files as read-only by default and any deletion requires the verification recipe in §4.2.

## 9. Validation Architecture (Nyquist Dimension 8)

### Test Framework

| Property                 | Value                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| Framework                | TypeScript compiler 5.9.3 (frontend) / 5.9.3 (backend) via `tsc --noEmit`  |
| Config file (frontend)   | `frontend/tsconfig.json`                                                   |
| Config file (backend)    | `backend/tsconfig.json`                                                    |
| Quick run command        | `pnpm --filter <ws> type-check`                                            |
| Full suite command       | `pnpm typecheck` (runs both via turbo, but with build dependency — slower) |
| Verified runtime (local) | frontend ≈ 21s, backend ≈ 33s on M-series Mac (2026-05-08)                 |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                 | Test Type    | Automated Command                                                                                                                                                  | Already exists?                                                                                                 |
| ------- | ------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| TYPE-01 | Frontend has zero TS errors                                              | tsc gate     | `pnpm --filter frontend type-check`                                                                                                                                | ✅ Script exists (`frontend/package.json:19`); CI step exists (`ci.yml:68` indirectly via `pnpm run typecheck`) |
| TYPE-02 | Backend has zero TS errors                                               | tsc gate     | `pnpm --filter backend type-check`                                                                                                                                 | ✅ Script exists (`backend/package.json:15`); CI step exists                                                    |
| TYPE-03 | Type-check is PR-blocking on `main`                                      | manual + API | `gh api repos/.../branches/main/protection` returns 200 with `type-check` in `required_status_checks.contexts` AND a smoke-test PR with one TS error is `BLOCKED`. | ❌ Branch protection does not exist today. Plan 47-03 creates it.                                               |
| TYPE-04 | Net new `@ts-ignore` / `@ts-expect-error` = 0 with documented exceptions | grep-diff    | In each plan task verification: `git diff origin/main -- 'frontend/src' 'backend/src' \| grep -E '@ts-(ignore\|expect-error)' \| wc -l` should equal 0             | ✅ Pattern feasible; pre-commit hook could add this if desired (out of scope per D-10).                         |

### Sampling Rate

- **Per task commit:** `pnpm --filter <ws> type-check` (the workspace under edit)
- **Per plan merge into phase branch:** both workspace type-checks
- **Phase gate (TYPE-03 verification):** smoke-test PR procedure (§6) + branch-protection API verification

### Wave 0 Gaps

The validation infrastructure is already in place — both workspaces have `tsc --noEmit` scripts and a CI workflow that calls them. Wave 0 work is **negative**: the only thing missing for full validation is branch protection, which plan 47-03 owns as a deliverable, not as a Wave 0 gap.

The `pnpm type-check:summary` script proposed in §3 is a small Wave 0 add (executor convenience for histogram during burn-down) and should be bundled into the first task of plans 47-01 and 47-02.

**Validation insight specific to this phase:** The CI gate IS the validation. There is no separate test suite to write — TYPE-01..04 are satisfied iff `tsc --noEmit` exits 0 in both workspaces, the new CI job is required by branch protection, and the smoke-test PR demonstrates it blocks. No Vitest/Playwright work needed.

## 10. Plan Granularity Recommendation

Given the constraints:

- D-06: parallel frontend + backend cleanup is locked.
- D-08: CI split happens AFTER zero, not before.
- D-13: smoke-test PR after CI split + branch protection.

The simplest plan structure that respects all three is **3 plans**, executed in the order shown:

### Plan 47-01: frontend-type-fix

**Goal:** `pnpm --filter frontend type-check` exits 0.
**Owner of:** TYPE-01.
**Parallel-safe with:** 47-02. Must finish before 47-03 starts.
**Estimated tasks:** ~10–14, sized by directory cluster.

Suggested task breakdown (driven by §7.2 directory distribution):

1. (Wave 0) Add `pnpm type-check:summary` script + commit baseline histogram to `EXCEPTIONS.md`.
2. Decide and lock the strategy for `database.types.ts` six TS6196 hits (§4.1: top-of-file `@ts-nocheck` vs `tsconfig.json` exclude). This is a planning decision, not a task — but must be captured in the plan header.
3. `src/types/*` cleanup (~373 errors — mostly TS6196, very mechanical, but D-04 verification needed for cross-workspace consumers in `entity-links.types`/`ai-suggestions.types` which are actually backend-side).
4. `src/components/*` — split into 3–4 batches by sub-directory size (e.g. `components/{tasks,kanban,entity-links}` first because they hit the cross-workspace issue; then `components/{calendar,onboarding,tags,...}`).
5. `src/hooks/*` (~153 errors).
6. `src/domains/*` (~153 errors).
7. `src/pages/*` (~142 errors).
8. `src/routes/*` (~74 errors).
9. `src/services/*` + `src/lib/*` (~103 combined).
10. `src/utils/*` + `src/store/*` + `src/contexts/*` + `src/design-system/*` (~16 combined).
11. (Final task) Re-run histogram, confirm 0, commit `EXCEPTIONS.md` updated to reflect any TYPE-04 documented exceptions, create plan summary.

### Plan 47-02: backend-type-fix

**Goal:** `pnpm --filter backend type-check` exits 0.
**Owner of:** TYPE-02.
**Parallel-safe with:** 47-01. Must finish before 47-03 starts.
**Estimated tasks:** ~7–10, sized by directory cluster + the API systemic pattern.

Suggested task breakdown (driven by §7.4):

1. (Wave 0) Add `pnpm type-check:summary` script + commit baseline histogram to `EXCEPTIONS.md`.
2. `src/types/*` cleanup (~30 errors — careful: these are imported by frontend; D-04 recipe).
3. **`src/api/*` systemic ParsedQs/return-path sweep** (232 errors — mostly TS2345 + TS7030; one repeated pattern fix per file). This single task drives down ~47% of backend errors.
4. `src/api/after-action.ts` deserves its own task (57 errors, largest single file).
5. `src/services/*` (~136 errors).
6. `src/models/*` + `src/models/__tests__/*` (~32 errors — note tests are in tsc graph here).
7. `src/middleware/*` + `src/config/*` + `src/utils/*` + `src/ai/*` + `src/lib/*` + `src/integrations/*` + `src/queues/*` + `src/jobs/*` (~62 combined).
8. `src/services/__tests__/*` + `src/ai/__tests__/*` (~19 combined; includes TS2307 module-not-found cases — may be code rot, may need real fix).
9. (Final task) Re-run histogram, confirm 0.

### Plan 47-03: ci-gate-and-branch-protection

**Goal:** TYPE-03 + TYPE-04 enforced.
**Owner of:** TYPE-03 + TYPE-04 (the verification half of TYPE-04).
**Sequential dependency:** must run after 47-01 and 47-02 are merged.
**Estimated tasks:** 4–5.

1. Edit `.github/workflows/ci.yml`: insert `type-check` job (§5.1), remove redundant TypeScript step from `lint` job (§5.2), update four downstream `needs:` arrays (§5.3). Optionally edit `turbo.json` to drop the `dependsOn: ["build"]` from `type-check` (small win, can defer).
2. Push to a feature branch, open PR, observe both `Lint` and `type-check` checks appear as separate, both green. Merge.
3. Update branch protection on `main` via `gh api` PUT `repos/.../branches/main/protection` requiring `["Lint", "type-check"]` in `required_status_checks.contexts` and `enforce_admins: true`. (Repo-settings change, not a code change.)
4. Smoke test (§6): two test PRs, frontend + backend, observe `BLOCKED`, close + delete.
5. Verify TYPE-04 net-new suppression count = 0 across the entire phase: `git diff <phase-base>..HEAD -- 'frontend/src' 'backend/src' | grep -E '@ts-(ignore|expect-error)' | wc -l` must be 0 (or accompanied by `EXCEPTIONS.md` entries per D-02).

### Why not fewer / more plans

- **One plan** would couple frontend and backend cleanups, contradicting D-06.
- **Two plans (frontend, backend, CI rolled into either)** would put 47-03's CI work on whichever workspace finishes first, blocking the slower workspace from a clean parallel finish; also makes the post-zero CI split harder to reason about as a single chunk.
- **Four plans** (Q1 research, frontend, backend, CI) over-fragments — Q1 is already resolved by this research (§2 + the separate Q1 file), so it's not a plan.
- **Per-error-category plans** would multiply coordination overhead without reducing risk; categories are mostly orthogonal to file boundaries, so a per-file slice is a more natural unit.

## 11. Pitfalls

### 11.1 Generated `database.types.ts` will regenerate the deleted lines

Cause: `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`, `Constants` are emitted by `supabase gen types typescript`. Even if the executor deletes them to silence TS6196, the next schema regen restores them.
Avoidance: Allowlist the file (`@ts-nocheck` or tsconfig `exclude`). Lock decision in plan header.

### 11.2 Cross-workspace deep-relative imports hide consumers

Cause: `frontend/src/components/entity-links/*.tsx` imports from `../../../../backend/src/types/intake-entity-links.types`. A grep for "consumer of `EntityLink`" in `backend/src` would miss these.
Avoidance: D-04 verification recipe (§4.2) globs `frontend/src` AND `backend/src` together for every export deletion in the three named files.

### 11.3 Backend tests are in the tsc graph

Cause: `backend/tsconfig.json` excludes only `node_modules`, `dist`, `tests` (top-level). Unit tests in `backend/src/**/__tests__/*.test.ts` flow through. Errors in those tests count toward the 498 and must be fixed.
Avoidance: Plan 47-02 explicitly includes tasks for `src/**/__tests__/*` (~19 errors). Do NOT "fix" by adding `**/__tests__/**` to the exclude list — that contradicts D-11 and would silently drop test type-checking.

### 11.4 Frontend tests are NOT in the tsc graph

Cause: `frontend/tsconfig.json` excludes test files (`src/**/__tests__`, `src/**/*.test.ts(x)`, `src/**/*.spec.ts(x)`).
Implication: frontend test file errors are invisible to the gate. Phase 47 does not need to fix frontend test files for TYPE-01 to pass. (They may have errors; out of scope here.)

### 11.5 `turbo run type-check` runs `build` first

Cause: `turbo.json` line 23 has `dependsOn: ["build"]`. Calling `pnpm typecheck` from CI builds both workspaces unnecessarily.
Avoidance: The new CI `type-check` job calls `pnpm --filter <ws> type-check` directly. Optionally drop `dependsOn` in `turbo.json`.

### 11.6 Editor "Organize Imports" can over-delete

Cause: VS Code's auto-import-cleanup may strip imports it can't see in JSX (e.g. a type used only as a generic argument or a JSX namespace). Manual deletion guided by the actual tsc errors is safer.
Avoidance: Disable "Organize Imports on Save" while doing the deletion sweep. Use the histogram + per-file error list as the source of truth.

### 11.7 `tsx` runtime files (e.g. `backend/src/seed.ts`) still run through tsc

Cause: `seed.ts` is invoked at runtime via `tsx src/seed.ts`. tsx is permissive (just transpiles), but the tsc gate is strict and will report errors for it.
Avoidance: treat `seed.ts` like any other source file — fix its errors. Do not exclude it (would drop a real surface).

### 11.8 TS2307 "Cannot find module" might mean a missing file, not a wrong import

Cause: `backend/src/ai/__tests__/brief-generation.integration.test.ts` errors with `TS2307: Cannot find module '../agents/brief-generation'`. The test was written against a module that no longer exists.
Avoidance: The executor must distinguish "fix the import" (path drift) from "delete the test" (module truly removed). Do not auto-resolve TS2307 — flag for human read.

### 11.9 TS2589 "Type instantiation excessively deep" can be a Supabase upstream issue

Cause: Backend has 5 TS2589 hits, often from chained `.from(...).select(...)` calls. Sometimes legitimately a Supabase types issue (upstream `.d.ts`).
Avoidance: D-02 case — a candidate for `EXCEPTIONS.md` if no clean fix is available. Do not silently `@ts-ignore`.

### 11.10 Vite-only types

Confirmed: `frontend/src/vite-env.d.ts` contains `/// <reference types="vite/client" />`. So `import.meta.env`, `?raw`, `?url`, etc. are typed. No action needed.

### 11.11 Scope creep into Phase 48 (lint)

The same files have lint errors (Phase 48). Tempting to fix both at once. Per D-03 + Karpathy "surgical changes": **only edits that resolve a TS error count toward Phase 47.** Lint-only edits (e.g. converting `==` to `===`) belong to Phase 48 even if a file is open.

### 11.12 Pre-existing suppressions are minimal — keep that posture

Verified: only 3 suppressions exist today across `frontend/src` + `backend/src`:

```
frontend/src/routeTree.gen.ts:                         // @ts-nocheck       (generated; standard)
frontend/src/components/intake-form/IntakeForm.tsx:    // @ts-expect-error Type instantiation too deep
frontend/src/components/signature-visuals/__tests__/Icon.test.tsx: // @ts-expect-error — runtime fallback for typing escapes
```

Per TYPE-04, the two `@ts-expect-error` need an issue/follow-up reference appended (the inline reason exists; the issue link does not). Bundle into the final task of plan 47-01 since both are frontend.

## 12. Files-to-Modify Inventory (planner uses this to seed tasks)

### Plan 47-01 frontend-type-fix — read_first hints

| Path                                                                                                                       | Errors            | Read first because…                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `frontend/tsconfig.json`                                                                                                   | —                 | To confirm strict + noUnused\* + noUncheckedIndexedAccess baseline (do NOT modify per D-11).                  |
| `frontend/package.json`                                                                                                    | —                 | `type-check` script lives at line 19. Add `type-check:summary` here.                                          |
| `frontend/src/types/database.types.ts`                                                                                     | (allowlist)       | Generated by Supabase. Do NOT delete unused types here.                                                       |
| `frontend/src/routeTree.gen.ts`                                                                                            | (already nocheck) | Generated. Already excluded via `@ts-nocheck`.                                                                |
| `frontend/src/types/enhanced-search.types.ts`                                                                              | 17                | Hand-authored types module — eligible for D-04 deletion.                                                      |
| `frontend/src/types/intelligence-reports.types.ts`                                                                         | 16                | Same.                                                                                                         |
| `frontend/src/types/dossier-context.types.ts`                                                                              | 16                | Same.                                                                                                         |
| `frontend/src/types/multilingual-content.types.ts`                                                                         | 15                | Same.                                                                                                         |
| `frontend/src/types/dashboard-widget.types.ts`                                                                             | 14                | Same.                                                                                                         |
| `frontend/src/components/tasks/{TaskEditDialog,TaskCard,ContributorsList,TaskDetail}.tsx`                                  | (mixed)           | **Cross-workspace consumer of `backend/src/types/database.types`.** D-04 surface.                             |
| `frontend/src/components/kanban/KanbanBoard.tsx`                                                                           | (mixed)           | Same.                                                                                                         |
| `frontend/src/components/entity-links/{LinkTypeBadge,LinkList,EntityLinkManager,EntitySearchDialog,AISuggestionPanel}.tsx` | (mixed)           | **Cross-workspace consumer of `backend/src/types/{intake-entity-links,ai-suggestions}.types`.** D-04 surface. |
| Top 25 frontend files in §7.1                                                                                              | 480 / 1580        | Drives the bulk of plan 47-01's task budget.                                                                  |
| `frontend/src/components/intake-form/IntakeForm.tsx`                                                                       | 1 suppression     | TYPE-04 retroactive — add issue/follow-up reference inline.                                                   |
| `frontend/src/components/signature-visuals/__tests__/Icon.test.tsx`                                                        | 1 suppression     | Same.                                                                                                         |

### Plan 47-02 backend-type-fix — read_first hints

| Path                                                                                                                      | Errors      | Read first because…                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `backend/tsconfig.json`                                                                                                   | —           | Confirm strict baseline; **NOTE the `exclude: [..., "tests"]` does NOT exclude `src/**/**tests**`\*\*. |
| `backend/package.json`                                                                                                    | —           | `type-check` script lives at line 15. Add `type-check:summary` here.                                   |
| `backend/src/types/database.types.ts`                                                                                     | (allowlist) | Generated by Supabase.                                                                                 |
| `backend/src/types/intake-entity-links.types.ts`                                                                          | (D-04)      | Consumed by frontend. Do NOT delete exports without §4.2 grep.                                         |
| `backend/src/types/ai-suggestions.types.ts`                                                                               | 9 + (D-04)  | Consumed by frontend. Same.                                                                            |
| `backend/src/api/after-action.ts`                                                                                         | 57          | Largest single file. Mostly TS2345 (ParsedQs) + TS7030 (return path) — systemic pattern.               |
| `backend/src/api/{intake-entity-links,task-contributors,tasks,countries,mous,events,positions,signatures,permissions}.ts` | (sum ~92)   | Same systemic API pattern. Bulk-fix candidate.                                                         |
| `backend/src/api/ai/intake-linking.ts`                                                                                    | 11          | Same pattern.                                                                                          |
| `backend/src/services/interaction-note-service.ts`                                                                        | 30          | Largest service file.                                                                                  |
| `backend/src/services/{clustering,auth,signature,query-parser,link}.service.ts`                                           | (sum ~55)   | Service-layer cluster.                                                                                 |
| `backend/src/services/__tests__/auth.service.test.ts`                                                                     | 12          | Test in tsc graph; may be TS2307 (drift) or actual narrowing.                                          |
| `backend/src/ai/__tests__/brief-generation.integration.test.ts`                                                           | (TS2307)    | Module deleted? Flag for human read.                                                                   |
| `backend/src/models/__tests__/Country.test.ts`                                                                            | 7           | TS2307 + TS18047.                                                                                      |
| `backend/src/types/after-action.types.ts`                                                                                 | 8           | Hand-authored; D-03 deletion candidate.                                                                |
| `backend/src/middleware/optimistic-locking.ts`                                                                            | 7           |                                                                                                        |
| `backend/src/config/redis.ts`                                                                                             | 7           |                                                                                                        |
| `backend/src/utils/logger.ts`                                                                                             | 7           |                                                                                                        |

### Plan 47-03 ci-gate-and-branch-protection — read_first hints

| Path                           | Lines                     | Read first because…                                                                                                            |
| ------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `.github/workflows/ci.yml`     | 43–68, 156, 192, 228, 263 | Existing `lint` job (template) and four downstream `needs: [lint]` consumers that need `type-check` added.                     |
| `turbo.json`                   | 22–25                     | `type-check` task definition with `dependsOn: ["build"]` (optional drop).                                                      |
| `package.json`                 | 28                        | Root `typecheck` script — leave as-is; the new CI job calls per-workspace scripts directly.                                    |
| `frontend/package.json`        | 19                        | `type-check` script (`tsc --noEmit`) — the script the new CI job calls.                                                        |
| `backend/package.json`         | 15                        | Same.                                                                                                                          |
| `.husky/pre-commit`            | all                       | DO NOT extend per D-10. Read to confirm it's not silently running tsc anywhere.                                                |
| (no path) GitHub UI / `gh api` | —                         | Branch protection PUT call. Not a file. The plan must record the exact `gh api` command in its task body so it's reproducible. |

---

## Sources

### Primary (HIGH confidence — verified locally on 2026-05-08)

- `pnpm --filter frontend exec tsc --noEmit` — actual error count 1580; histogram §3.
- `pnpm --filter backend exec tsc --noEmit` — actual error count 498; histogram §3.
- `pnpm --filter frontend exec tsc --noEmit --listFilesOnly` — confirmed cross-workspace inclusion of `backend/src/types/{database,intake-entity-links,ai-suggestions}.types.ts`.
- `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection` — returned 404 "Branch not protected".
- `gh run list --branch main --workflow ci.yml --limit 5` — 5/5 conclusion=failure.
- `gh run view 24610946095 --json jobs` — Lint job conclusion=failure; downstream jobs conclusion=skipped.
- File contents verified directly: `.github/workflows/ci.yml`, `turbo.json`, `package.json`, `frontend/package.json`, `backend/package.json`, `frontend/tsconfig.json`, `backend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.build.json`, `.husky/pre-commit`, `frontend/src/vite-env.d.ts`.
- `grep -rE '@ts-(ignore|expect-error|nocheck)' frontend/src backend/src` — 3 hits enumerated in §11.12.
- `grep -rl ".../backend/src/types" frontend/src` — 10 cross-workspace import sites enumerated in §4.2.

### Secondary

- `.planning/REQUIREMENTS.md` — TYPE-01..04 verbatim.
- `.planning/ROADMAP.md` lines 134–153 — Phase 47 entry condition + success criteria.
- `.planning/notes/v6.2-rationale.md` — milestone shape; histogram methodology referenced.
- `.planning/research/questions.md` Q1.
- `.planning/phases/47-type-check-zero/47-CONTEXT.md` — D-01..D-13 verbatim.
- `.planning/codebase/{STRUCTURE,CONVENTIONS}.md`.
- `CLAUDE.md` "Karpathy Coding Principles" surgical-changes rule.

### No `[ASSUMED]` claims in this research

Every factual claim above is either `[VERIFIED]` from a tool run on the local checkout or `[CITED]` from a file at a specific path:line. Counts, file paths, error codes, and CI run results were observed today, not recalled. No external library docs were consulted (none were needed — the entire phase operates on local code and CI configuration).

## Metadata

**Confidence breakdown:**

- Q1 resolution: HIGH — answered against live `gh api` and CI run history.
- Histogram methodology: HIGH — commands run, output captured.
- Risky-deletion safe list: HIGH — every cross-workspace import enumerated; generated files confirmed by content inspection.
- CI split diff: HIGH — file:line cited; YAML structure verified.
- Plan granularity: MEDIUM — 3-plan structure is recommended, not locked. Planner may rebalance task boundaries; the 3-plan top-level shape is the minimum that respects D-06, D-08, D-13.
- Pitfalls: HIGH — every pitfall has a verified cause (file:line or command output).

**Research date:** 2026-05-08
**Valid until:** 2026-05-22 (14 days). Counts will drift the moment the executor starts; histograms must be re-run at the start of each plan task.

## RESEARCH COMPLETE
