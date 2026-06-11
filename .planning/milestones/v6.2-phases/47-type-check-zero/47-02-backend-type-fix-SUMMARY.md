---
phase: 47-type-check-zero
plan: 02
subsystem: type-check
tags: [typescript, tsc, supabase-types, ParsedQs, express, vitest, mocks]

requires:
  - phase: 47-01-frontend-type-fix
    provides: 47-EXCEPTIONS.md scaffold + phase-47-base tag + frontend baseline section (mirrored on backend side here)
provides:
  - backend type-check exit 0 (498 errors → 0)
  - backend half of TYPE-04 ledger (47-EXCEPTIONS.md backend baseline + final histogram)
  - systemic ParsedQs / return-path patterns applied across src/api/* (RESEARCH §7.4)
  - allowlisted generated Supabase types (database.types.ts + contact-directory.types.ts) via top-of-file @ts-nocheck
affects: [47-03 ci-gate-and-branch-protection, 48-lint-and-config-alignment, 49-bundle-budget-reset]

tech-stack:
  added: []
  patterns:
    - "ParsedQs argument narrowing: `String(req.query.foo ?? '')` or `const { foo } = req.query as { foo?: string }`"
    - "Express TS7030 'all paths return': every error branch becomes `return res.status(...).json(...)`; never widen handler return type to `void`"
    - 'Generated-file allowlisting: top-of-file `@ts-nocheck` on Supabase-codegen output, logged in 47-EXCEPTIONS.md retained-suppressions ledger'
    - 'Stale-test disposition (RESEARCH §11.8): TS2307 module drift is either fix-import or delete-test, never silenced via tsconfig'

key-files:
  created:
    - .planning/phases/47-type-check-zero/47-02-backend-type-fix-SUMMARY.md
  modified:
    - backend/package.json (type-check:summary script)
    - backend/src/types/database.types.ts (top-of-file @ts-nocheck only)
    - backend/src/types/contact-directory.types.ts (top-of-file @ts-nocheck only)
    - backend/src/types/{intake-entity-links,ai-suggestions,after-action,enhanced-search,intelligence-reports,dossier-context,multilingual-content,dashboard-widget,_remaining_}.types.ts (D-04-vetted deletions)
    - backend/src/api/after-action.ts (57 errors)
    - backend/src/api/{intake-entity-links,task-contributors,tasks,countries,mous,events,positions,signatures,permissions,ai/intake-linking,_remaining_}.ts (~175 errors)
    - backend/src/services/{interaction-note-service,clustering.service,auth.service,signature.service,query-parser.service,link.service,_remaining_}.ts (~124 errors)
    - backend/src/{models,middleware,config,utils}/* (~64 errors)
    - backend/src/ai/{agents/{brief-generator,chat-assistant},config.ts,embeddings-service,llm-router}.ts (Task 7)
    - backend/src/integrations/{DocuSignClient,PKIClient}.ts (Task 7)
    - backend/src/jobs/refresh-health-scores.job.ts (Task 7)
    - backend/src/lib/sentry.ts (Task 7 — shed 6 unused helpers)
    - backend/src/queues/digest-scheduler.ts (Task 7)
    - backend/src/services/__tests__/auth.service.test.ts (Task 8 — Supabase User/Session/AuthError mock fixtures hardened)
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (Backend baseline + final histograms; backend ledger rows)
  deleted:
    - backend/src/ai/__tests__/brief-generation.integration.test.ts (RESEARCH §11.8 — 357-line test references renamed/removed agent surface)
    - backend/src/models/__tests__/Country.test.ts (RESEARCH §11.8 — `../Country` model does not exist; only `country.service.ts` is the active surface)

key-decisions:
  - 'Adopted worktree A (tip 15b7588c, 6 commits, ~420 errors cleared) as canonical base for tasks 1-6; dropped worktree B (subset of A) entirely. See merge commit c7866bb9. Decision driven by Agent dispatch errors that left both worktrees stale-locked but with non-trivial divergent progress.'
  - 'Tasks 7-9 finished inline on the main working tree (no fresh executor subagent) per user instruction after recovery, to avoid burning more dispatch cycles.'
  - 'TS2307 module-drift dispositions per RESEARCH §11.8: BriefGenerationAgent test deleted (broader API drift, out of plan scope to rewrite); Country.test.ts deleted (model gone).'
  - "AuthError mocks cast as `unknown as AuthError` because Supabase's AuthError class has a protected `__isAuthError` member that plain object literals cannot satisfy. Cast is documented at the call sites and is test-only."
  - 'PKIClient unused method parameters dropped from signatures rather than `_`-prefixed (forbidden by D-03). Verified zero callers in repo (sole grep hit is a comment in signature.service.ts:364) so signature changes are non-breaking.'

patterns-established:
  - 'Generated Supabase types: top-of-file `// @ts-nocheck` is the canonical allowlist. Body of file remains byte-for-byte regenerable. Logged in 47-EXCEPTIONS.md.'
  - 'Express handlers: every error branch returns the Response object explicitly to satisfy TS7030 without widening the Router signature.'
  - 'Vitest Supabase auth mocks need `app_metadata`/`aud`/`token_type as const`/`code` literals to satisfy `@supabase/supabase-js` types; Session and AuthError types are not plain object literals.'

requirements-completed: [TYPE-02, TYPE-04]

duration: ~25min (orchestrator-side; subagent ran ~18min)
completed: 2026-05-09
---

# Phase 47-02: Backend Type-Check Zero Summary

**Backend `pnpm --filter intake-backend type-check` exits 0 (498 → 0). Plan 47-02 lands the second half of v6.2's quality-gate foundation — once 47-01 + 47-02 are both green, 47-03 can split the CI job and turn on branch protection without inheriting a red build.**

## Performance

- **Duration:** ~43 min total (subagent worktree A: ~18 min for tasks 1-6; orchestrator inline: ~25 min for tasks 7-9 after recovery)
- **Started:** 2026-05-08 (subagent dispatch)
- **Completed:** 2026-05-09
- **Tasks:** 9/9 (no deferrals)
- **Files modified:** 79 (subagent merge: 72; tasks 7-9 inline: 13 modified + 2 deleted; some overlap)

## Accomplishments

- Backend type-check residual: **498 → 0**. `pnpm --filter intake-backend type-check; echo $?` returns `exit=0`.
- Zero net-new `@ts-ignore` / `@ts-expect-error` introduced (`git diff phase-47-base..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0).
- Three new `@ts-nocheck` allowlists, all on Supabase-codegen output, all logged in 47-EXCEPTIONS.md retained-suppressions ledger.
- `backend/tsconfig.json` byte-unchanged — no test exclusions added (D-11 respected).
- Cross-workspace fence respected: 47-02-only frontend audit (`74b5d772..HEAD -- frontend/src`) shows zero changes.

## Task Commits

Each task committed atomically:

1. **Task 1: type-check:summary script + EXCEPTIONS baseline** — `e7f20fac` (chore)
2. **Task 2: types/\* cleanup + database.types.ts/contact-directory.types.ts allowlist** — `75a30d25` (chore)
3. **Task 3: src/api/\* systemic ParsedQs + return-path sweep** — `58b44b31` (fix, 175 errors cleared)
4. **Task 4: src/api/after-action.ts dedicated sweep** — `8619f1d6` (fix, 57 errors cleared)
5. **Task 5: src/services/\* cluster** — `47293d07` (fix, 124 errors cleared)
6. **Task 6: models/middleware/config/utils** — `15b7588c` (fix, 64 errors cleared)
7. **Subagent merge (worktree-agent-a870782a3bf7608ff)** — `c7866bb9` (merge, adopts tasks 1-6)
8. **Task 7: ai/lib/integrations/queues/jobs tail** — `8e674048` (fix, 28 errors cleared)
9. **Task 8: src/**/**tests**\*\* — `7dcfa546` (fix, 20 errors cleared)
10. **Task 9: zero confirm + EXCEPTIONS final histogram + plan summary** — _this commit_ (docs)

## Files Created/Modified

See `key-files` frontmatter above.

## Decisions Made

See `key-decisions` frontmatter above. Two material decisions worth highlighting in body text:

1. **Worktree-A adoption.** The first two Agent() dispatches for plan 47-02 returned errors but left two stale-locked worktree branches with non-trivial work in them. Worktree A (tip `15b7588c`) had 6 commits and ~420 backend errors cleared; worktree B (tip `582d3378`) was a strict subset of A's work. The orchestrator unlocked both, captured A's one pending uncommitted hunk to a patch (`backend/src/ai/agents/brief-generator.ts`, 57 lines), merged A into DesignV2 with `--no-ff` (commit `c7866bb9`), applied the patch, and dropped both worktrees and branches. Worktree B's 4 divergent commits were discarded as redundant.

2. **Inline finish for tasks 7-9.** After recovery, the user opted to finish tasks 7-9 inline on DesignV2 rather than re-spawn a worktree-isolated executor. This avoided burning more dispatch attempts on a plan that was already 91% complete (498 → 48 residual after merge). Inline execution recorded as 3 atomic commits (`8e674048`, `7dcfa546`, this commit).

## Deviations from Plan

### Operational deviations

- **Subagent dispatch failures (orchestrator-side, not plan defects):** First two Agent() invocations returned tool-result errors (`internal error` and rejection), but the executor agents had already partially run inside their isolated worktrees. Recovered via the worktree adoption strategy described above; no work was lost.

### Plan-text deviations

- **Acceptance criterion drift on plan task 9:** the plan specifies `git diff phase-47-base..HEAD -- frontend/src | wc -l` returns 0 to prove 47-02 left frontend untouched. That diff returns **10** on this branch — but the 10 lines come entirely from 47-01 commit `ab3d573b` (`chore(47-01): allowlist frontend/src/types/database.types.ts via @ts-nocheck`), which preceded any 47-02 work. The 47-02-only audit (`74b5d772..HEAD -- frontend/src`) returns 0, confirming the cross-workspace fence is respected. Documented in 47-EXCEPTIONS.md "Backend final histogram" section.

### Stale-test dispositions (RESEARCH §11.8 outcomes)

- `backend/src/ai/__tests__/brief-generation.integration.test.ts` → **deleted**. Test imports `BriefGenerationAgent` from `../agents/brief-generation`; production module was renamed to `brief-generator` exporting `BriefGeneratorAgent`. Beyond the rename, the public method `generateBrief` was renamed to `generate`, breaking ~10 call sites in the 357-line test. Rewriting the test against the current agent API is out of plan scope.
- `backend/src/models/__tests__/Country.test.ts` → **deleted**. No `Country` model exists in `backend/src/models/` (only `country.service.ts` remains as a Country surface). Test is dead.
- `backend/src/ai/__tests__/brief-generation.integration.test.ts` (the import-fix path was attempted first via `BriefGenerationAgent → BriefGeneratorAgent` and `../agents/brief-generation → ../agents/brief-generator`, which surfaced 10 follow-on TS2339 errors — confirming the deeper API drift). Reverted before deletion.

## Verification

```bash
$ pnpm --filter intake-backend type-check; echo "exit=$?"
> intake-backend@1.0.0 type-check
> tsc --noEmit
exit=0

$ pnpm --filter intake-backend type-check:summary
> intake-backend@1.0.0 type-check:summary
> tsc --noEmit 2>&1 | grep -oE 'TS[0-9]+' | sort | uniq -c | sort -rn || true
(empty output)

$ git diff phase-47-base..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l
0

$ git diff phase-47-base..HEAD -- backend/tsconfig.json | wc -l
0

$ git diff 74b5d772..HEAD -- frontend/src | wc -l
0
```

All success criteria from `47-02-backend-type-fix-PLAN.md` satisfied:

- TYPE-02 ✅
- TYPE-04 (backend half) ✅
- D-04 cross-workspace fence ✅
- D-11 tsconfig untouched ✅
- D-13 input ready (47-03 can now split CI job) ✅
