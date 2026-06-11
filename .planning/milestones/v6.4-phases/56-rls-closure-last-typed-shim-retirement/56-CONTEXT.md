# Phase 56: RLS Closure & Last Typed-Shim Retirement - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Close two narrow v6.3 carryover items so v6.4 stabilization can ship:

1. **RLS-01 (D-54-04 closure):** `rls-audit.test.ts` exits 0 on `countries` without an acknowledged-pre-existing-fail allowance. `countries` is ISO reference data (no `organization_id` column, currently 1 SELECT-only policy on staging) — it cannot be tenant-scoped, so the test contract is refactored to distinguish org-scoped tables from global-reference tables.
2. **TYPE-05 (last v6.2 typed-shim retirement):** `useStakeholderInteractionMutations` hook declares an explicit return type at source; the single consumer (`StakeholderInteractionTimeline.tsx`) drops its `as unknown as StakeholderInteractionMutationsShim` cast.

Scope anchors (from ROADMAP success criteria):

1. `rls-audit.test.ts` exits 0 with `countries` present in the projection but absent from any acknowledged-pre-existing-fail list
2. `grep -r "useStakeholderInteractionMutations" frontend/src` shows zero `as` casts or typed-shim wrappers at consumer sites
3. The underlying `useStakeholderInteractionMutations` hook declares an explicit, non-`any`, non-`Promise.resolve({ success: true })` return type that consumers consume directly
4. `pnpm type-check` exits 0 across both workspaces with the shim removed

**Hard scope boundary:** Wiring `useStakeholderInteractionMutations` to real backend endpoints is OUT OF SCOPE. The hook stays a stub — but a typed stub whose bodies throw `'not implemented'` rather than returning `Promise.resolve({success: true})`. Real implementation is a future phase.

**REQUIREMENTS vs ROADMAP wording note:** REQUIREMENTS.md L18 reads "`countries` removed from `sensitiveTables` projection"; ROADMAP success criterion #1 reads "`countries` present in the projection but absent from any acknowledged-pre-existing-fail list". The ROADMAP wording is authoritative per phase contract — we keep `countries` in a projection but move it to a separate `globalReferenceTables` array with appropriate assertions. A REQUIREMENTS.md text fix (sub-decision under D-56-01) folds into this phase as part of the plan output.

</domain>

<decisions>
## Implementation Decisions

### RLS-01 — Test contract refactor

- **D-56-01:** Refactor `tests/security/rls-audit.test.ts`'s "sensitive tables have org-scoped policies (D-02)" assertion into TWO tiers — `sensitiveTables` (org-scoped policy required) and `globalReferenceTables` (authenticated-read policy required, role-gated writes acceptable). Matches ROADMAP criterion #1 (countries stays in a projection, just not the org-scoped one). Also fold an in-phase REQUIREMENTS.md text update so REQUIREMENTS L18 aligns with ROADMAP's "present in projection" phrasing.
- **D-56-03:** Define `globalReferenceTables = ['countries']` as a separate array next to `sensitiveTables`. Add a dedicated `it('global reference tables have authenticated-read policy')` block. Two arrays, two assertions. Extensible — future ref tables (currencies, languages, regions) plug in without reshaping the iteration.

### RLS-01 — DB policy reconciliation

- **D-56-02:** Restore the admin/editor write-side policies on `countries` that exist in repo migration `021_countries_rls.sql` but have drifted on staging (staging currently has only `countries_authenticated_read` with `qual=true`). The test's `globalReferenceTables` tier asserts both the SELECT-side authenticated-read policy AND the existence of role-gated INSERT/UPDATE/DELETE policies. Without reconciliation, the new tier asserts against drift.
- **D-56-04:** Land DB fix via a new dated migration `supabase/migrations/20260518xxxx_countries_rls_reconcile.sql` (planner picks exact prefix). Apply via Supabase MCP. Repo migrations remain the source of truth — no MCP-only patches that bypass the migrations folder. Aligns with Phase 54 D-54-01..04 pattern.

### TYPE-05 — Hook surface alignment

- **D-56-05:** Align hook to consumer expectations — `useStakeholderInteractionMutations` returns `{ createInteraction, isCreating, createAnnotation, isAnnotating }`. Drop the unused `addInteraction`/`updateInteraction`/`deleteInteraction` returns (no consumers). Smallest call-site delta; matches the documented intent of the shim ("typed contract until the real implementation lands").
- **D-56-06:** Add `createAnnotation` + `isAnnotating` as first-class hook members alongside `createInteraction`/`isCreating`. Annotations are semantically distinct from interactions (different request type — `CreateAnnotationRequest` vs `CreateInteractionRequest`). Two separate `useMutation` instances inside the hook.
- **D-56-07:** Co-locate the typed contract with the hook. Export `UseStakeholderInteractionMutationsReturn` interface from `frontend/src/domains/misc/hooks/useStakeholderTimeline.ts` (same file as the hook). Consumer imports the interface and types its destructure against it. Mirrors the `StakeholderTimelineState` precedent already in the same file.
- **D-56-08:** Delete the deprecated re-export shim `frontend/src/hooks/useStakeholderTimeline.ts` (currently a passthrough re-export from `@/domains/misc`). Update the sole consumer (`StakeholderInteractionTimeline.tsx` lines 42-46) to import from `@/domains/misc` directly. Aligns with the v6.2 "typed-at-source over consumer cast" decision.

### TYPE-05 — Stub depth

- **D-56-09:** Typed-but-stub bodies — replace each `mutationFn: (_data) => Promise.resolve({ success: true })` with a typed stub: `mutationFn: (_data: TVariables): Promise<TData> => { throw new Error('useStakeholderInteractionMutations: not implemented — see PHASE 47-07 follow-up') }`. Satisfies success criterion #3 (no `Promise.resolve({success:true})`, no `any`, explicit return types) WITHOUT scope-creeping into real backend wiring. The component's existing error boundary surfaces the message during runtime; consumers compile cleanly.
- **D-56-10:** Domain types from `frontend/src/types/stakeholder-interaction.types.ts` drive `TData`. `createInteraction` mutationFn: `Promise<StakeholderTimelineEvent>` (the created event); `createAnnotation` mutationFn: `Promise<TimelineAnnotation>` (the created annotation). `useMutation<TData, Error, TVariables>` generics naturally produce `isCreating: boolean` / `isAnnotating: boolean` from `isPending`.

### TYPE-05 — Test coverage

- **D-56-11:** Add Vitest unit tests covering both the hook (returns typed mutations; `mutationFn` invocation throws `'not implemented'`; no `as` casts inside hook body) and the consumer (destructures without TypeScript error; types flow through from hook). Matches Phase 50/51 test discipline. Files: `frontend/src/domains/misc/hooks/useStakeholderTimeline.test.ts` (hook surface assertions) + light addition to existing `StakeholderInteractionTimeline.test.tsx` (consumer destructure assertion).
- **D-56-12:** No new ESLint rule. The combination of `@typescript-eslint/no-explicit-any` (error, workspace-wide) + `pnpm type-check` (gate context on `main`) already prevents regression. Adding a custom no-unknown-cast rule is high-cost, low-marginal-value. Skip.

### Plan partition & execution

- **D-56-13:** Two plans, parallel-eligible — `56-01-PLAN.md` (RLS-01: test refactor + countries migration + REQUIREMENTS.md L18 reconciliation) and `56-02-PLAN.md` (TYPE-05: hook retype + consumer cast removal + shim file deletion + tests). No shared files. Cleaner per-requirement traceability matches the Phase 55 multi-plan precedent.
- **D-56-14:** Execute inline on `main` (no worktree per plan). Scope per plan is ~3-5 files; matches Phase 54 D-54-01-INLINE rationale. If a plan discovers wider ripple during execution, executor may escalate to a worktree mid-flight (deviation captured per standard pattern).
- **D-56-15:** Verification is SEQUENTIAL even though plans execute parallel — RLS-01 verifies first (DB + test layer), TYPE-05 verifies second. Reason: TYPE-05's `pnpm test` triggers `rls-audit.test.ts`; if RLS-01 hasn't landed, signals conflate. Sequential verification → unambiguous failure attribution (continues Phase 55 D-13 attribution-clarity preference).
- **D-56-16:** After BOTH plans pass verification, issue annotated + SSH-signed `phase-56-base` tag on the phase-completion commit. Push to origin. `git tag -v phase-56-base` must exit 0 with `Good "git" signature`. Continues the v6.2/v6.3/v6.4-Phase-55 closing convention.

### Claude's Discretion

- Exact dated prefix for the new migration filename (planner picks the next available `20260518xxxx_*` slot consistent with the migrations folder convention).
- Commit message subject lines (follow existing repo Conventional Commits precedent: `fix(56-01): ...`, `test(56-01): ...`, `feat(56-02): ...`).
- Migration body exact SQL — the role-gated INSERT/UPDATE/DELETE clauses follow repo `021_countries_rls.sql` shape; planner may adapt syntax to match newer migration conventions (e.g., `users` vs `user_profiles` table name if renamed).
- The exact error message string inside the typed-but-stub `throw new Error(...)` body — planner picks wording that's discoverable in logs but doesn't leak phase metadata into production traces.
- Test layout (one file vs split files) for the hook+consumer Vitest tests — planner decides based on co-location precedent in `domains/misc`.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements

- `.planning/REQUIREMENTS.md` §"Security / RLS" L18 (RLS-01) and §"Type correctness" L22 (TYPE-05) — locked acceptance text. Note REQUIREMENTS L18 wording disagreement with ROADMAP — ROADMAP wins per D-56-01.
- `.planning/ROADMAP.md` §"Phase 56: RLS Closure & Last Typed-Shim Retirement" L189-201 — 4 success criteria are the test oracle.
- `.planning/STATE.md` — current milestone status (v6.4, Phase 55 verified, 56+57 parallel-eligible).
- `.planning/notes/v6.4-milestone-shape.md` §3-4 — milestone scope origin.

### Prior phase artifacts (D-54-04 origin)

- `.planning/phases/54-intelligence-engine-schema-groundwork/54-04-SUMMARY.md` §"D-54-04-RLS-AUDIT-PRE-EXISTING-FAIL" — origin of the deviation, MCP probe verification of Phase 54 entries.
- `.planning/phases/54-intelligence-engine-schema-groundwork/54-VERIFICATION.md` — context on why the pre-existing fail wasn't blocked in Phase 54.
- `.planning/milestones/v6.3-MILESTONE-AUDIT.md` §7 — carryover entry.

### RLS-01 source files

- `tests/security/rls-audit.test.ts` — the test under refactor; `sensitiveTables` array at L66-83, the failing `it()` block at L64-115.
- `supabase/migrations/021_countries_rls.sql` — repo source of truth for countries policies (5 policies: SELECT-active, SELECT-authenticated, INSERT-editor, UPDATE-editor, DELETE-admin). Staging is drifted to 1 policy — reconciliation target.
- Staging snapshot: `pg_policy` for `public.countries` currently shows only `countries_authenticated_read` (`polcmd='r'`, `qual='true'`).
- `supabase/migrations/002_countries.sql` + `002_create_countries.sql` + `20250107011_seed_countries.sql` — table shape (no `organization_id`); seed data anchors.

### TYPE-05 source files

- `frontend/src/domains/misc/hooks/useStakeholderTimeline.ts` L95-116 — `useStakeholderInteractionMutations` hook stub body (current `Promise.resolve({success:true})` form).
- `frontend/src/hooks/useStakeholderTimeline.ts` — deprecated re-export passthrough (DELETE in D-56-08).
- `frontend/src/components/stakeholder-timeline/StakeholderInteractionTimeline.tsx` L65-70 (`StakeholderInteractionMutationsShim` interface), L277-278 (the `as unknown as` cast — REMOVE), L42-46 (the import path — UPDATE to `@/domains/misc`).
- `frontend/src/types/stakeholder-interaction.types.ts` — `TimelineAnnotation` L79, `StakeholderTimelineEvent` L148, `CreateInteractionRequest` L246, `CreateAnnotationRequest` L278. Drives the `TData`/`TVariables` generics for `useMutation`.

### Test conventions

- `.planning/codebase/TESTING.md` — Vitest patterns, test naming, location conventions.
- Phase 50 test infrastructure (TEST-01..04) — `vi.mock("react-i18next")` factory, MSW patterns; relevant for the new hook test.

### v6.4 milestone gates (must remain green)

- `eslint.config.mjs` — D-05 design-token rule at `error`; `@typescript-eslint/no-explicit-any` at `error`.
- `.github/workflows/ci.yml` — 8 required contexts on `main` per Phase 55 D-13: `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`, `Design Token Check`, `react-i18next Factory Check`.
- `tools/eslint-fixtures/bad-design-token.tsx` + `tools/eslint-fixtures/bad-vi-mock.ts` — positive-failure fixtures referenced by Phase 55 D-14 jobs; planner aware they exist but Phase 56 does not modify them.

### Tag provenance

- `phase-47-base`, `phase-48-base`, `phase-49-base`, `phase-54-base`, `phase-55-base` — SSH-signed annotated tags reachable from `main` post-Phase-55 merge. Phase 56 must NOT regress any. New `phase-56-base` issues at phase completion per D-56-16.

### Deployment + project guardrails

- `CLAUDE.md` §"Deployment Configuration" — staging project ID `zkrcjzdemdmwhearhfgg`, region `eu-west-2`. Migration applies here via Supabase MCP.
- `CLAUDE.md` §"Visual Design Source of Truth" — no UI work in this phase, but consumer `StakeholderInteractionTimeline.tsx` already complies; do not regress.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`useMutation<TData, TError, TVariables>` generics from `@tanstack/react-query`** — already used in the same hook file (`useAddTimelineEvent` at L74-83). Pattern: typed mutationFn + `onSuccess` for query invalidation. The retyped `createInteraction`/`createAnnotation` adopt the same shape.
- **`StakeholderTimelineState` exported interface in the same file** — precedent for "co-locate return-type interface with hook" pattern. D-56-07 mirrors this.
- **`misc.repository.ts`** — exports `addTimelineEvent`, `getTimelineCategories`. Already wired; the hook references them. Real-implementation phase (future) wires `createInteraction` → `addTimelineEvent`; phase 56 leaves this path stubbed.
- **`vi.mock("react-i18next")` factory at `frontend/src/test/setup.ts:46-50`** — TEST-01 baseline used by all consumer-level tests. The hook test consumes the same setup.
- **Phase 53/54/55 phase-base tag pattern** — SSH-signed annotated tags via `git tag -as phase-NN-base -m "..."`. Continue exactly.

### Established Patterns

- **Typed-at-source over consumer cast (v6.2 TYPE-04 lineage)** — hooks export their return shape; consumers don't widen via `as unknown as`. Phase 56 D-56-05..07 closes the last holdover.
- **Two-array test contracts in rls-audit** — D-56-03 adds `globalReferenceTables` alongside `sensitiveTables`. The Phase 54 addition pattern ("// Phase 54 additions:" inline comment) extends to "// Global reference tables:" markers.
- **Inline-on-main mechanical fixes (Phase 54 D-54-01-INLINE)** — small-blast-radius edits ride directly on the current branch with atomic per-task commits; no worktree ceremony.
- **Migration via Supabase MCP** — Phase 54 + 55 used `mcp__claude_ai_Supabase__apply_migration` against `zkrcjzdemdmwhearhfgg`; D-56-04 follows.
- **Sequential verification despite parallel execution (Phase 55 D-15 echo)** — when one plan's verification depends on another's outcome, verify sequentially in dependency order to keep failure attribution clean.

### Integration Points

- **`tests/security/rls-audit.test.ts`** — RLS-01 lands here (test refactor) AND triggers via `pnpm test`/`pnpm exec vitest` from the standard CI `Tests (backend)` context.
- **`supabase/migrations/`** — new migration file lands here; applied via MCP to `zkrcjzdemdmwhearhfgg` once approved.
- **`pnpm type-check` (root) → both workspaces** — TYPE-05 lands clean here per success criterion #4.
- **`frontend/src/components/stakeholder-timeline/`** — TYPE-05's single consumer. No new component logic, just an import path update + cast removal.
- **`grep -r "useStakeholderInteractionMutations" frontend/src`** — verification grep per success criterion #2. Must show zero `as` casts and zero shim wrappers after Plan 02 lands.

### Anti-patterns to avoid

- **MCP-only DB patches (no repo migration)** — production rebuilds/staging resets would lose the fix. D-56-04 mandates the migration file.
- **Promoting the consumer's `StakeholderInteractionMutationsShim` interface into the hook file** — that codifies the wrong direction (consumer types leak into hook source). The interface must be authored fresh in the hook file per D-56-07; the consumer-side shim interface deletes with the consumer cast.
- **Touching `tools/eslint-fixtures/*` files** — owned by Phase 55 (CI jobs) + Phase 59 (POLISH-04 positive-failure assertion). Phase 56 stays out of their path.
- **Wiring `useStakeholderInteractionMutations` to real backend endpoints** — explicit scope-out per "Hard scope boundary" above. Hook stays a typed stub.
- **Adding `organization_id` column to `countries`** — discussed and rejected (semantically wrong for ISO 3166 data). Don't reintroduce during planning.
- **Re-folding the D-09 design-token rule back into `Lint` context** — explicit scope-out per Phase 55 D-13 reversal. Phase 56 doesn't touch ci.yml.

</code_context>

<specifics>
## Specific Ideas

- **Migration filename slot:** planner queries `ls supabase/migrations/ | tail` to pick the next dated slot (`20260518xxxx_countries_rls_reconcile.sql` shape; xxxx is sequence within day).
- **Hook return interface name:** `UseStakeholderInteractionMutationsReturn` (sentence-case, hook-prefixed, "Return" suffix). Match `StakeholderTimelineState` naming convention from the same file.
- **Error message in typed-but-stub bodies:** include a reference to the future implementation phase, e.g., `'useStakeholderInteractionMutations: not implemented — wire to real backend in future stakeholder-interactions feature phase'`. Avoid leaking phase numbers (those drift).
- **REQUIREMENTS.md L18 fix:** Plan 01 must update the wording from "removed from `sensitiveTables` projection" to "moved from `sensitiveTables` to `globalReferenceTables` projection" (or similar) so the requirements text matches the actual implementation. Tracked as a sub-task in Plan 01.
- **Phase-56-base tag message body:** match the Phase 53/54/55 precedent — single-line subject + multi-line body listing the closed requirements (RLS-01, TYPE-05) and the commit anchor.
- **Verification spec:**
  - Plan 01 verification: `pnpm exec vitest run tests/security/rls-audit.test.ts --exclude='.claude/worktrees/**'` exits 0 with the new `globalReferenceTables` block passing for `countries`; `grep -E "countries.*pre-existing" tests/` returns empty.
  - Plan 02 verification: `pnpm type-check` exits 0 both workspaces; `grep -r "as unknown as.*Shim" frontend/src/components/stakeholder-timeline` returns empty; `grep -rn "useStakeholderInteractionMutations" frontend/src | grep " as "` returns empty.
- **MCP project ID confirmation:** `zkrcjzdemdmwhearhfgg` (eu-west-2) per CLAUDE.md and the staging snapshot captured during this discussion.

</specifics>

<deferred>
## Deferred Ideas

- **Real backend implementation of `useStakeholderInteractionMutations`** — wiring to actual API endpoints (POST /stakeholder-interactions, POST /annotations). Belongs in a future stakeholder-interactions feature phase, not Phase 56. Phase 56 only delivers the typed contract.
- **Custom ESLint rule banning `as unknown as` in components** — discussed and rejected (D-56-12). Type-check + existing `no-explicit-any` cover regression. Revisit if a future phase finds another `as unknown as` shim.
- **Generalized `globalReferenceTables` for other ref data** — e.g., `currencies`, `languages`, `regions`. Currently only `countries` qualifies. Future phases adding new ref tables extend the array without re-discussing the test contract.
- **Codifying countries RLS policies in IaC / Terraform** — Phase 55 deferred this for branch protection; same principle applies to RLS. Out of v6.4 scope.
- **Replacing `frontend/src/types/stakeholder-interaction.types.ts` with generated types from `database.types.ts`** — possible long-term cleanup, but the file already mixes derived + bespoke types (e.g., `StakeholderTimelineEvent` is a UI-layer aggregate). Not Phase 56's problem.

</deferred>

---

_Phase: 56-RLS Closure & Last Typed-Shim Retirement_
_Context gathered: 2026-05-18_
