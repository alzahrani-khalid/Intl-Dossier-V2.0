# Phase 56: RLS Closure & Last Typed-Shim Retirement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 56-rls-closure-last-typed-shim-retirement
**Areas discussed:** RLS-01 fix path, TYPE-05 hook surface, TYPE-05 stub depth, Plan partition

---

## RLS-01 fix path

### Q1: Which path closes D-54-04 for `countries`?

| Option                              | Description                                                                                                                                                                                           | Selected |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Split test into tiers               | Refactor rls-audit's 'sensitive tables' test into two tiers: 'org-scoped' and 'global-reference' (countries only). Matches ROADMAP criterion #1. Preserves test coverage. Documents semantic reality. | ✓        |
| Drop countries from sensitiveTables | Remove 'countries' literal from the array. Matches REQUIREMENTS.md phrasing. Smallest diff. Risk: future regression gets no guard.                                                                    |          |
| Tenancy-scope countries             | Add organization_id + per-org rows + org-scoped policies. Semantically wrong for ISO 3166 data. Massive migration.                                                                                    |          |

**User's choice:** Split test into tiers
**Notes:** Matches ROADMAP wording authoritatively; REQUIREMENTS.md L18 text gets folded into Plan 01.

### Q2: Does the role-based write side of countries policy need restoring?

| Option                              | Description                                                                                 | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| Restore admin/editor write policies | Staging drift: migration 021 defined 5 policies; staging has 1. Apply migration to restore. | ✓        |
| Leave staging as-is                 | Just one SELECT policy. Test tier asserts only SELECT-side. Leaves drift.                   |          |
| Decide during planning              | Defer to research/planner.                                                                  |          |

**User's choice:** Restore admin/editor write policies
**Notes:** Repo source of truth wins over staging drift.

### Q3: Should the new test tier be defined inline or as a separate `globalReferenceTables` array?

| Option                                          | Description                                                              | Selected |
| ----------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| Separate `globalReferenceTables` array          | Two arrays, two assertions. Extensible for currencies/regions/languages. | ✓        |
| Inline conditional in existing block            | Per-table policy expectation map. Branchy logic.                         |          |
| Two separate `it()` blocks, no shared structure | Just add a fresh `it()`. Doesn't generalize.                             |          |

**User's choice:** Separate `globalReferenceTables` array
**Notes:** Future-proofs the test contract.

### Q4: Where does the policy fix actually land — repo migration or staging-only patch?

| Option                                   | Description                                                                       | Selected |
| ---------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| New migration in supabase/migrations/    | Dated migration, applied via MCP. Repo source of truth. Matches Phase 54 pattern. | ✓        |
| Patch staging via MCP, no repo migration | Direct execute_sql. Production rebuilds lose the fix.                             |          |
| Test-only change, no DB touch            | Existing single policy may satisfy new tier's assertion.                          |          |

**User's choice:** New migration in supabase/migrations/
**Notes:** Standard pattern; no migrations-folder bypass.

---

## TYPE-05 hook surface

### Q1: Hook surface mismatch — which side aligns?

| Option                 | Description                                                                                                               | Selected |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| Align hook to consumer | Rename hook return to {createInteraction, isCreating, createAnnotation, isAnnotating}. Drop unused names. Smallest delta. | ✓        |
| Align consumer to hook | Rewrite consumer to use addInteraction/updateInteraction/deleteInteraction. Larger blast radius.                          |          |
| Expose union surface   | Both name sets. Bloats hook.                                                                                              |          |

**User's choice:** Align hook to consumer
**Notes:** Matches the documented shim intent.

### Q2: What goes in the consumer's `createAnnotation`?

| Option                                     | Description                                                          | Selected |
| ------------------------------------------ | -------------------------------------------------------------------- | -------- |
| Add as first-class hook member             | New `createAnnotation` + `isAnnotating` alongside createInteraction. | ✓        |
| Reuse createInteraction with discriminator | One mutation, branchy payload.                                       |          |
| Decide during planning                     | Defer to planner.                                                    |          |

**User's choice:** Add as first-class hook member
**Notes:** Annotations and interactions are semantically distinct.

### Q3: Where does the typed contract live?

| Option                                          | Description                                                                                                                        | Selected |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Beside the hook in domains/misc                 | Export `UseStakeholderInteractionMutationsReturn` from hook file. Co-located precedent (`StakeholderTimelineState` already there). | ✓        |
| Move to types/stakeholder-interaction.types.ts  | Centralized but cross-file.                                                                                                        |          |
| Inline at hook signature, no exported interface | Smallest surface, hardest to reuse.                                                                                                |          |

**User's choice:** Beside the hook in domains/misc
**Notes:** Mirrors existing precedent in same file.

### Q4: Delete the deprecated re-export shim file?

| Option                                                     | Description                                                                              | Selected |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| Yes, delete `frontend/src/hooks/useStakeholderTimeline.ts` | Single consumer; update import to `@/domains/misc`. Aligns with TYPE-04 typed-at-source. | ✓        |
| Keep it, just retype                                       | Deprecation passthrough stays. Tech debt remains.                                        |          |
| Grep first                                                 | Researcher confirms no other consumers.                                                  |          |

**User's choice:** Yes, delete the re-export shim
**Notes:** Verified single consumer via grep during discussion.

---

## TYPE-05 stub depth

### Q1: Stub body — success criterion #3 forbids `Promise.resolve({success:true})`. What replaces it?

| Option                             | Description                                                                                                  | Selected |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- |
| Typed-but-stub                     | Each mutationFn returns Promise<TData> with explicit type, throws 'not implemented'. No real backend wiring. | ✓        |
| Wire to real repository            | Implement against actual endpoints. Scope creep.                                                             |          |
| Type-only declaration via overload | Cast inside body. Doesn't satisfy criterion #3 (Promise.resolve stays in source).                            |          |

**User's choice:** Typed-but-stub
**Notes:** Hard scope boundary — no real backend wiring in Phase 56.

### Q2: Concrete return shape for typed mutations — what's TData?

| Option                                          | Description                                                                                           | Selected |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Domain types from stakeholder-interaction.types | createInteraction → StakeholderTimelineEvent; createAnnotation → TimelineAnnotation. Domain-accurate. | ✓        |
| Generic `{id: string; success: boolean}`        | Minimal envelope. Loses entity propagation.                                                           |          |
| `Promise<void>`                                 | Mutations return nothing; consumer relies on invalidation.                                            |          |

**User's choice:** Domain types from stakeholder-interaction.types
**Notes:** Existing types `TimelineAnnotation` (L79) and `StakeholderTimelineEvent` (L148) already defined.

### Q3: Do existing tests cover the consumer behavior after retype?

| Option                           | Description                                                                        | Selected |
| -------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| Add tests for hook + consumer    | Vitest unit tests for hook surface + consumer destructure. Phase 50/51 discipline. | ✓        |
| Type-check only, no runtime test | `pnpm type-check` exit 0 is the test.                                              |          |
| Defer to planner                 | Planner decides.                                                                   |          |

**User's choice:** Add tests for hook + consumer
**Notes:** Regression guard for future cast reintroduction.

### Q4: Should the `as unknown as` cast removal be enforced by lint?

| Option                      | Description                                                                                 | Selected |
| --------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| No lint rule                | `no-explicit-any` + `pnpm type-check` already prevent regression. Custom rule is high-cost. | ✓        |
| Add scoped lint rule        | ESLint custom rule banning `as unknown as` in stakeholder-timeline scope.                   |          |
| Add grep-based CI assertion | `grep -r 'as unknown as.*Shim' frontend/src` exit 1 in CI.                                  |          |

**User's choice:** No lint rule
**Notes:** Existing gates sufficient.

---

## Plan partition

### Q1: Plan structure?

| Option                       | Description                                                           | Selected |
| ---------------------------- | --------------------------------------------------------------------- | -------- |
| Two plans, parallel-eligible | 56-01 RLS, 56-02 TYPE. No shared files. Cleaner per-req traceability. | ✓        |
| One combined plan            | Single PR. Mixed DB+frontend domain. Revert harder.                   |          |
| Three plans                  | Split RLS into migration + test, plus frontend. Over-split.           |          |

**User's choice:** Two plans, parallel-eligible
**Notes:** Matches Phase 55 multi-plan precedent.

### Q2: Execute inline on main or via worktree?

| Option                 | Description                                 | Selected |
| ---------------------- | ------------------------------------------- | -------- |
| Inline on main         | Match Phase 54 D-54-01-INLINE. Small scope. | ✓        |
| Worktree per plan      | Standard isolation. Overkill.               |          |
| Decide during executor | Executor picks.                             |          |

**User's choice:** Inline on main
**Notes:** Mechanical scope; escalation allowed if ripple discovered.

### Q3: Issue `phase-56-base` SSH-signed tag after both plans verify?

| Option                                  | Description                                                  | Selected |
| --------------------------------------- | ------------------------------------------------------------ | -------- |
| Yes, after both plans pass verification | Match Phase 53/54/55. Required for v6.4 milestone integrity. | ✓        |
| No tag (skip)                           | Breaks v6.2+ convention.                                     |          |
| Tag after plan 01 only, not 02          | Doesn't match precedent.                                     |          |

**User's choice:** Yes, after both plans pass verification
**Notes:** `git tag -v phase-56-base` must exit 0 per phase-close convention.

### Q4: Verification ordering — which runs first?

| Option                                        | Description                                                                              | Selected |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| RLS-01 verification then TYPE-05 verification | TYPE-05 verification includes `pnpm test` which triggers rls-audit; must be green first. | ✓        |
| TYPE-05 first, then RLS-01                    | Conflates signals (rls-audit currently red).                                             |          |
| Verify both at once                           | Single pass, muddied attribution.                                                        |          |

**User's choice:** RLS-01 verification then TYPE-05 verification
**Notes:** Continues Phase 55 D-13 attribution-clarity preference.

---

## Claude's Discretion

- Exact dated prefix for the new migration filename (`20260518xxxx_*` slot).
- Commit message subject lines (Conventional Commits per repo precedent).
- Migration body exact SQL (adapt to current `users` table shape if changed since 021).
- Exact error message string inside typed-but-stub `throw new Error(...)`.
- Test layout for hook + consumer Vitest tests (one file vs split).

## Deferred Ideas

- Real backend implementation of `useStakeholderInteractionMutations` — future stakeholder-interactions feature phase.
- Custom ESLint rule banning `as unknown as` in components — revisit if another `as unknown as` shim surfaces.
- Generalized `globalReferenceTables` for other ref data (currencies, languages, regions) — future phases extend.
- Codifying countries RLS policies in IaC / Terraform — out of v6.4 scope.
- Replacing `frontend/src/types/stakeholder-interaction.types.ts` with generated types — not Phase 56's problem.
