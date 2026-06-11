---
phase: 50-test-infrastructure-repair
plan: 13b
type: execute
wave: 4
depends_on:
  - 50-13a
files_modified:
  - frontend/tests/setup.ts
  - frontend/tests/component/AssignmentDetailsModal.test.tsx
  - frontend/tests/component/BulkActionToolbar.test.tsx
  - frontend/tests/component/ConflictDialog.test.tsx
  - frontend/tests/component/ContributorsList.test.tsx
  - frontend/tests/component/EscalationDialog.test.tsx
  - frontend/tests/component/FilterPanel.test.tsx
  - frontend/tests/component/ReminderButton.test.tsx
  - frontend/vitest.config.ts
  - .planning/phases/50-test-infrastructure-repair/50-04-PLAN.md
  - .planning/phases/50-test-infrastructure-repair/50-05-PLAN.md
autonomous: true
requirements:
  - TEST-02
  - TEST-04
user_setup: []

must_haves:
  truths:
    - 'AT TASK START, executor samples 2-3 of the 7 cluster files and captures the failure signature. Recon already established that all 7 files render raw i18n keys (e.g., `waitingQueue.bulkActions.clear`) instead of translated text — same root cause as Plan 50-10. If the sampled signature contradicts this hypothesis, STOP and surface to operator.'
    - 'After Task 1 lands, all 7 cluster files pass green. The fix is single-rooted: extend `frontend/tests/setup.ts` translations map with the missing `waitingQueue.*` and `tasks.*` namespaces.'
    - 'After this plan lands (combined with 50-13a), `pnpm --filter intake-frontend test --run` exits 0 — the cumulative phase-exit-0 contract per D-01 is fully SATISFIED across the post-split plan set. NO `queued-with-rationale` files remain in the default runner.'
    - 'Plans 50-04 and 50-05 `depends_on` fields are updated to reference `50-13a` and `50-13b` (in place of the pre-split `50-13`). The edits are made via Edit tool, not full rewrites.'
    - 'Plan 50-13b runs in Wave 4. setup.ts edit is parallel-conflict-safe because 50-13a (also Wave 4) owns a different setup.ts region (indexedDB polyfill); 50-13b sequencing via depends_on=[50-13a] eliminates even the appearance of conflict.'
  artifacts:
    - path: 'frontend/tests/setup.ts'
      provides: 'Extended translations map covering all `waitingQueue.*` and `tasks.*` keys referenced by the 7 tests/component/ files'
      contains: 'waitingQueue.bulkActions.clear'
  key_links:
    - from: 'frontend/tests/utils/render.tsx renderWithProviders helper'
      to: 'frontend/tests/setup.ts translations map'
      via: 'i18n keys flow through `useTranslation().t` fallback — `(key, params) => translations[key] ?? key`. Missing keys render as the raw key string; the 7 cluster tests assert on the translated text.'
      pattern: "translations\\[.*\\]"
    - from: 'Final FE test runner output'
      to: 'D-01 phase-exit contract'
      via: '`pnpm --filter intake-frontend test --run` exits 0 → FE green proof across 50-13a + 50-13b'
      pattern: 'Test Files.*passed'
    - from: '.planning/phases/50-test-infrastructure-repair/50-04-PLAN.md depends_on'
      to: 'Replan plan IDs 50-09..50-13a/13b'
      via: 'Edit-tool replacement of pre-split `50-13` entry with `50-13a` and `50-13b`'
      pattern: 'depends_on:'
    - from: '.planning/phases/50-test-infrastructure-repair/50-05-PLAN.md depends_on'
      to: 'Replan plan IDs 50-09..50-13a/13b + 50-04'
      via: 'Edit-tool replacement; preserve `50-04`'
      pattern: 'depends_on:'
---

<objective>
Close the 7-file `tests/component/` i18n-key cluster surfaced by Plan 50-13's halt discovery and finalize the depends_on graph for downstream Plans 50-04 and 50-05.

Recon evidence (per the operator's split brief): all 7 cluster files use `renderWithProviders` from `frontend/tests/utils/render.tsx`, which wraps `LanguageProvider + QueryClient` but does NOT register i18next translations. Raw i18n keys render instead of translated text. Sample failure: `BulkActionToolbar.test.tsx` asserts `'1 items selected'` but the DOM emits `waitingQueue.bulkActions.clear` (the raw key). Probable single-commit fix: extend `frontend/tests/setup.ts` translations map with the missing `waitingQueue.*` and `tasks.*` namespaces (same family as Plan 50-10's batched fix).

1. **Sample-confirm the cluster diagnosis** (Task 0): grep + spot-run 2-3 of the 7 files; if the shared-i18n-fallthrough hypothesis is wrong, halt.
2. **Single-root fix** (Task 1): extend `frontend/tests/setup.ts` translations map with all missing keys referenced by the 7 cluster files. Re-run full FE runner; expected outcome is all 7 turn green.
3. **Per-file escape hatch** (Task 2): for any file still failing after Task 1, apply per-file D-10 triage (TEST WRONG / IMPL DRIFTED / INFRASTRUCTURE-DEPENDENT / DEAD). If a file is genuinely integration-only, append to `frontend/vitest.config.ts` exclude with two-channel audit trail.
4. **Downstream depends_on rewire** (Task 3): update `50-04-PLAN.md` and `50-05-PLAN.md` frontmatter `depends_on:` to reference `50-09, 50-10, 50-11, 50-12, 50-13a, 50-13b` in place of the pre-split `50-06/07/08` and `50-13` IDs.

**D-01 is non-negotiable here.** This plan, combined with 50-13a, achieves `pnpm --filter intake-frontend test --run` exit code 0.

Purpose: Achieve the cluster-half of the phase-exit-0 contract per D-01 + finalize the depends_on graph so Plans 50-04 (audit + docs) and 50-05 (CI gate + ESLint rule) can run unblocked.

Output:

- `frontend/tests/setup.ts` translations map extended with missing `waitingQueue.*` + `tasks.*` keys.
- Each of the 7 cluster files passes green (or split-to-integration with audit row).
- `50-04-PLAN.md` and `50-05-PLAN.md` frontmatter `depends_on:` updated to point at the post-split plan set.
- `pnpm --filter intake-frontend test --run` exits 0 (combined with 50-13a).
  </objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/50-test-infrastructure-repair/50-CONTEXT.md
@.planning/phases/50-test-infrastructure-repair/50-RESEARCH.md
@.planning/phases/50-test-infrastructure-repair/50-PATTERNS.md
@.planning/phases/50-test-infrastructure-repair/50-VALIDATION.md
@.planning/phases/50-test-infrastructure-repair/50-13-PLAN.archived.md
@.planning/phases/50-test-infrastructure-repair/50-13-DISCOVERY.md
@.planning/phases/50-test-infrastructure-repair/50-13a-PLAN.md
@.planning/phases/50-test-infrastructure-repair/50-09-SUMMARY.md
@.planning/phases/50-test-infrastructure-repair/50-10-SUMMARY.md
@.planning/phases/50-test-infrastructure-repair/50-11-SUMMARY.md
@.planning/phases/50-test-infrastructure-repair/50-12-SUMMARY.md
@CLAUDE.md

<interfaces>
<!-- Shared root cause + downstream depends_on rewire targets. -->

From `frontend/tests/utils/render.tsx` (renderWithProviders helper):

- Wraps `LanguageProvider + QueryClient`. Does NOT register i18next translations.
- All 7 cluster files import and call `renderWithProviders` (confirmed by recon).
- i18n key resolution flows through `useTranslation().t` — the test setup mock is `(key, params) => translations[key] ?? key`, so missing keys emit the raw key string.

From `frontend/tests/setup.ts` (post-50-10 + post-50-12 state):

- Contains an inline `translations` map seeded with after-action keys + Plan 50-10's batched additions + Plan 50-12's design-system additions.
- The map is the canonical extension point for any new namespace.
- PATTERN: add entries in alphabetical-by-key order; group by namespace (waitingQueue._, tasks._).

From the 7 cluster files (per 50-13-DISCOVERY.md row order):

1. `tests/component/AssignmentDetailsModal.test.tsx` — assignment-detail modal copy
2. `tests/component/BulkActionToolbar.test.tsx` — bulk-action toolbar copy
3. `tests/component/ConflictDialog.test.tsx` — conflict-resolution dialog copy
4. `tests/component/ContributorsList.test.tsx` — contributors list copy
5. `tests/component/EscalationDialog.test.tsx` — escalation flow copy
6. `tests/component/FilterPanel.test.tsx` — filter panel labels
7. `tests/component/ReminderButton.test.tsx` — reminder button copy

From CONTEXT D-01 (as amended): `queued-with-rationale` is NOT acceptable; only `fixed-green`, `split-to-integration`, or `deleted-dead`.

From the two plans that need depends_on updates:

`50-04-PLAN.md` frontmatter currently references `50-13` (post-original-plan write); needs to become `50-13a` + `50-13b`.

`50-05-PLAN.md` frontmatter currently references `50-13` similarly.

Read the actual frontmatter at task time to determine the exact pre-edit state. Use `Edit` tool, NOT full rewrites.

From PCH-50R-05: Wave-4 setup.ts edit is safe. 50-13a (also Wave 4) owns the indexedDB region of setup.ts; 50-13b owns the translations-map region. depends_on=[50-13a] sequences the two plans so no parallel-conflict risk exists.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 0: Cluster discovery — sample 2-3 files, confirm shared root cause</name>
  <files>.planning/phases/50-test-infrastructure-repair/50-13b-DISCOVERY.md</files>
  <read_first>
    - .planning/phases/50-test-infrastructure-repair/50-13-DISCOVERY.md (the halt snapshot — rows 5-11 list the 7 cluster files)
    - frontend/tests/utils/render.tsx (the renderWithProviders helper — confirms LanguageProvider + QueryClient only, no i18next registration)
    - frontend/tests/component/BulkActionToolbar.test.tsx (the operator's named sample file)
  </read_first>
  <action>
    Sample-confirm the shared-i18n-fallthrough hypothesis before applying the single-root fix.

    1. Run `pnpm --filter intake-frontend exec vitest --run tests/component/BulkActionToolbar.test.tsx tests/component/AssignmentDetailsModal.test.tsx tests/component/EscalationDialog.test.tsx 2>&1 | tee /tmp/phase50-13b-discovery.log`.

    2. For each sampled file, capture the top-line failure signature. Look for:
       - DOM contains raw i18n key (e.g., `waitingQueue.bulkActions.clear`) instead of translated text.
       - Test assertion expects translated text (e.g., `'1 items selected'`).

    3. Grep each of the 7 cluster files for `t\(['"]waitingQueue\.` and `t\(['"]tasks\.` to enumerate the namespaces actually used.

    4. Write `50-13b-DISCOVERY.md` with:
       ```
       # Plan 50-13b Discovery (Task 0 snapshot)
       Captured: <ISO 8601 timestamp>
       Total cluster files: 7
       Files (per 50-13-DISCOVERY.md):
       - <path>: <top-line failure signature; key on raw-key emission>
       - <path>: ...
       Hypothesis: shared i18n-key fallthrough; all 7 files use renderWithProviders + assert on translated text but emit raw keys.
       Namespaces missing from setup.ts translations map (grep evidence):
       - waitingQueue.<keys enumerated>
       - tasks.<keys enumerated>
       ```

    5. If the sampled signature DOES NOT show raw-key emission (i.e., a different root cause emerges), STOP and surface to operator with the actual signature. DO NOT proceed to Task 1.

    6. Commit: `chore(50-13b): record cluster discovery snapshot`.

  </action>
  <verify>
    <automated>test -f .planning/phases/50-test-infrastructure-repair/50-13b-DISCOVERY.md &amp;&amp; grep -q "waitingQueue\." .planning/phases/50-test-infrastructure-repair/50-13b-DISCOVERY.md</automated>
  </verify>
  <done>
    `50-13b-DISCOVERY.md` exists. Sampled cluster files exhibit raw-key emission (the hypothesis holds) OR an alternative hypothesis is written down and execution halts pending operator decision.
  </done>
</task>

<task type="auto">
  <name>Task 1: Extend setup.ts translations map for waitingQueue.* + tasks.* — single-root cluster fix</name>
  <files>frontend/tests/setup.ts</files>
  <read_first>
    - frontend/tests/setup.ts (full file — current translations map post-50-10/12; identify the existing map's literal location and alphabetical insertion order)
    - .planning/phases/50-test-infrastructure-repair/50-13b-DISCOVERY.md (Task 0 namespace enumeration)
    - Each of the 7 cluster files (full read — extract every `t('<key>', ...)` and `t("<key>", ...)` call site to enumerate the complete missing-key set)
  </read_first>
  <action>
    Extend the `translations` map in `frontend/tests/setup.ts` with all missing keys referenced by the 7 cluster files.

    Steps:

    1. Grep each of the 7 cluster files for `\bt\(['"]` to enumerate the complete set of keys they reference.

    2. Cross-reference against the existing `translations` map in `setup.ts`. The delta is the missing-key set.

    3. For each missing key, derive the English value from the prototype copy (look in `frontend/src/...` impl files that consume the same key — the prototype `translations` map mirrors the impl's expected `t()` call shape).

    4. Insert the missing entries into the `translations` map, grouped by namespace (`waitingQueue.*` block, `tasks.*` block). Maintain alphabetical order within each namespace.

    5. DO NOT touch other regions of `setup.ts` — only the translations map literal. The matchMedia polyfill, MSW server.listen, and the 50-13a-owned indexedDB region are outside this task's scope.

    6. Run `pnpm --filter intake-frontend exec vitest --run tests/component/ 2>&1 | tail -20`. Expected: all 7 cluster files pass green. If any file still fails, capture the signature for Task 2.

    7. Commit: `fix(50-13b): extend setup.ts translations map for waitingQueue.* + tasks.* (single-root cluster fix)`. Commit body lists the key count added per namespace and references the 7 cluster files as the consumers.

  </action>
  <verify>
    <automated>cd frontend &amp;&amp; grep -c "waitingQueue\.bulkActions" tests/setup.ts | awk '$1 &gt;= 1 { exit 0 } { exit 1 }' &amp;&amp; pnpm exec vitest --run tests/component/ 2&gt;&amp;1 | tail -5 | grep -E "Test Files" | awk '{ failed=0; for(i=1;i&lt;=NF;i++) if ($i ~ /failed/) { prev=$(i-1); gsub(/[^0-9]/, "", prev); failed=prev+0 } print "tests/component/ failures: " failed; exit (failed == 0 ? 0 : 1) }'</automated>
  </verify>
  <done>
    `frontend/tests/setup.ts` translations map contains entries with `waitingQueue.` prefix. Running `vitest --run tests/component/` reports 0 failing files. If 1-2 files still fail, Task 2 triages per-file.
  </done>
</task>

<task type="auto">
  <name>Task 2: Per-file escape hatch — D-10 triage for any cluster file still failing after Task 1</name>
  <files>frontend/tests/component/AssignmentDetailsModal.test.tsx, frontend/tests/component/BulkActionToolbar.test.tsx, frontend/tests/component/ConflictDialog.test.tsx, frontend/tests/component/ContributorsList.test.tsx, frontend/tests/component/EscalationDialog.test.tsx, frontend/tests/component/FilterPanel.test.tsx, frontend/tests/component/ReminderButton.test.tsx, frontend/vitest.config.ts</files>
  <read_first>
    - For EACH still-failing file: the test file in full; the impl file under test; `git log -p <test>` and `git log -p <impl>`
    - frontend/vitest.config.ts (current exclude array — append integration-only entries here)
    - .planning/phases/50-test-infrastructure-repair/50-CONTEXT.md D-01, D-09, D-10, D-11
  </read_first>
  <action>
    If Task 1 closed all 7 files, this task is a NO-OP — record "no per-file triage needed" in the upcoming SUMMARY and skip to Task 3.

    Otherwise, apply D-10 per remaining file:

    1. `pnpm --filter intake-frontend exec vitest --run <file> 2>&1 | tail -30` — capture failure.
    2. `git log --oneline -- <file>` and `git log --oneline -- <impl>` — archaeology.
    3. Determine verdict: TEST WRONG / IMPL DRIFTED / INFRASTRUCTURE-DEPENDENT / DEAD.
    4. Apply the fix:
       - TEST WRONG: update assertion to match current impl.
       - IMPL DRIFTED: update impl (rare for component tests; document rationale).
       - INFRASTRUCTURE-DEPENDENT: append file path to `frontend/vitest.config.ts` exclude array + add SUMMARY handoff entry for Plan 50-04 + Plan 50-05.
       - DEAD: delete the test (with rationale).
    5. Verify `pnpm exec vitest --run <file>` exits 0 OR file is split.
    6. Commit per file: `fix(50-13b): <file> — <verdict>` or `split(50-13b): <file> → integration` or `delete(50-13b): <file> — <rationale>`.

    Two-channel audit for split disposition: BOTH (a) `frontend/vitest.config.ts` exclude addition (visible in diff) AND (b) SUMMARY handoff entry for Plan 50-04 audit.

  </action>
  <verify>
    <automated>cd frontend &amp;&amp; pnpm exec vitest --run tests/component/ 2&gt;&amp;1 | tail -5 | grep -E "Test Files" | awk '{ failed=0; for(i=1;i&lt;=NF;i++) if ($i ~ /failed/) { prev=$(i-1); gsub(/[^0-9]/, "", prev); failed=prev+0 } exit (failed == 0 ? 0 : 1) }'</automated>
  </verify>
  <done>
    Running `vitest --run tests/component/` reports 0 failing files. Every per-file disposition (if any was needed) has a per-file commit. Files moved to integration runner (if any) appear in `frontend/vitest.config.ts` exclude AND in the upcoming SUMMARY handoff block.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update 50-04 + 50-05 depends_on lists to reference 50-13a + 50-13b</name>
  <files>.planning/phases/50-test-infrastructure-repair/50-04-PLAN.md, .planning/phases/50-test-infrastructure-repair/50-05-PLAN.md</files>
  <read_first>
    - .planning/phases/50-test-infrastructure-repair/50-04-PLAN.md (frontmatter only — confirm current depends_on line set; likely references pre-split `50-13` or pre-replan `50-06/07/08`)
    - .planning/phases/50-test-infrastructure-repair/50-05-PLAN.md (frontmatter only — confirm current depends_on line set)
  </read_first>
  <action>
    Two `Edit` operations (do NOT rewrite full plan files — only the frontmatter `depends_on:` block).

    **A) `50-04-PLAN.md` frontmatter `depends_on`:**

    Target end state:
    ```
    depends_on:
      - 50-01
      - 50-03
      - 50-09
      - 50-10
      - 50-11
      - 50-12
      - 50-13a
      - 50-13b
    ```

    Read the current state and use Edit tool to replace whatever current block exists (likely contains `50-06/07/08` or `50-13`) with the target state above. Preserve indentation (2 spaces) and dash-prefixed list items.

    **B) `50-05-PLAN.md` frontmatter `depends_on`:**

    Target end state:
    ```
    depends_on:
      - 50-01
      - 50-03
      - 50-04
      - 50-09
      - 50-10
      - 50-11
      - 50-12
      - 50-13a
      - 50-13b
    ```

    Read the current state and use Edit tool to replace the current block with the target state. Preserve `50-04` which is unaffected.

    Do NOT touch any other field in either file.

    Commit: `chore(50-13b): update 50-04 + 50-05 depends_on to reference 50-13a + 50-13b`.

  </action>
  <verify>
    <automated>grep -A12 "^depends_on:" .planning/phases/50-test-infrastructure-repair/50-04-PLAN.md | grep -q "50-13a" &amp;&amp; grep -A12 "^depends_on:" .planning/phases/50-test-infrastructure-repair/50-04-PLAN.md | grep -q "50-13b" &amp;&amp; grep -A12 "^depends_on:" .planning/phases/50-test-infrastructure-repair/50-05-PLAN.md | grep -q "50-13a" &amp;&amp; grep -A12 "^depends_on:" .planning/phases/50-test-infrastructure-repair/50-05-PLAN.md | grep -q "50-13b" &amp;&amp; ! grep -E "^[[:space:]]+- 50-0[678]$" .planning/phases/50-test-infrastructure-repair/50-04-PLAN.md .planning/phases/50-test-infrastructure-repair/50-05-PLAN.md &amp;&amp; ! grep -E "^[[:space:]]+- 50-13$" .planning/phases/50-test-infrastructure-repair/50-04-PLAN.md .planning/phases/50-test-infrastructure-repair/50-05-PLAN.md</automated>
  </verify>
  <done>
    `50-04-PLAN.md` and `50-05-PLAN.md` frontmatter `depends_on:` blocks reference `50-13a` AND `50-13b` (alongside `50-09, 50-10, 50-11, 50-12` and the preserved `50-01, 50-03`, plus `50-04` for 50-05). No references to `50-06`, `50-07`, `50-08`, or the bare `50-13` remain in the depends_on lists.
  </done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                       | Description                                                                                                                                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cluster-fix ↔ false-confidence in shared cause | Task 1 applies a single-root fix. If the cluster is actually multi-rooted, the runner stays red and Task 2's per-file triage catches the residue. Task 0's sample-confirm step gates this.                           |
| Split-to-integration ↔ Plan 50-04 audit        | Each split disposition requires two-channel record (vitest exclude + SUMMARY handoff) so a real regression cannot hide.                                                                                              |
| Downstream depends_on rewire ↔ wave graph      | If 50-04/05 depends_on still references the pre-split `50-13` or pre-replan `50-06/07/08`, the executor wave assignment in `gsd-execute-phase` will misroute. Task 3's Edit-tool replacement is the only mitigation. |

## STRIDE Threat Register

| Threat ID   | Category              | Component                                                                                        | Disposition | Mitigation Plan                                                                                                                                                           |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-50-13b-01 | T (Tampering)         | A split-to-integration disposition could silently exclude a real regression check.               | mitigate    | Task 2 split disposition requires explicit `vitest.config.ts` `exclude` addition (visible in diff) AND handoff entry in SUMMARY for Plan 50-04 audit. Two-channel record. |
| T-50-13b-02 | T (Tampering)         | Task 1's single-root fix could mask a divergent regression in one of the 7 files.                | mitigate    | Task 2 (per-file escape hatch) catches any residue after Task 1 and forces D-10 archaeology for it.                                                                       |
| T-50-13b-03 | R (Repudiation)       | A per-file commit could carry a wrong verdict, polluting audit.                                  | accept      | Plan 50-04 audit cross-checks each commit's diff vs verdict at audit time.                                                                                                |
| T-50-13b-04 | I (Information disc.) | Adding stub translations for a key the impl no longer uses could hide a dead-key cleanup signal. | accept      | The translations map is a TEST-ONLY mock; dead keys in the map don't affect runtime. Plan 50-04 audit can spot-check the map for orphaned entries if needed.              |

</threat_model>

<verification>
**Plan-level checks (post-plan):**

- `pnpm --filter intake-frontend exec vitest --run tests/component/` reports 0 failing files.
- `frontend/tests/setup.ts` contains `waitingQueue.bulkActions` entries (and any other `waitingQueue.*` / `tasks.*` keys required by the 7 cluster files).
- Per-file commits exist for any Task 2 escape-hatch dispositions (none required if Task 1's single-root fix closed all 7).
- `pnpm --filter intake-frontend lint` exits 0.
- Files moved to integration runner (if any) are listed in `50-13b-SUMMARY.md` AND excluded from `frontend/vitest.config.ts`.
- `.planning/phases/50-test-infrastructure-repair/50-04-PLAN.md` and `.../50-05-PLAN.md` frontmatter `depends_on:` reference `50-13a` AND `50-13b`. No references to `50-06/07/08` or the pre-split `50-13` remain.
- Combined with 50-13a, `pnpm --filter intake-frontend test --run` exits 0 — D-01 phase-exit-0 contract satisfied across the full post-split plan set.
  </verification>

<success_criteria>

- **TEST-02 cluster-half satisfied:** the 7 tests/component/ files all pass green.
- **D-01 satisfied (combined with 50-13a):** `pnpm --filter intake-frontend test --run` exits 0 with no `queued-with-rationale` carve-outs.
- **D-10 archaeology applied where escape hatch needed:** if any of the 7 files needed per-file triage post-Task-1, each disposition has a per-file commit with evidence.
- **Downstream plans rewired:** 50-04 and 50-05 depends_on now reference `50-13a + 50-13b`.
- **No regressions:** Plans 50-01/09/10/11/12/13a gains stay green.
- **PCH-50R-05 mitigation:** setup.ts edit is Wave-4 safe; sequencing via depends_on=[50-13a] eliminates parallel-conflict risk.

</success_criteria>

<output>
After completion, create `.planning/phases/50-test-infrastructure-repair/50-13b-SUMMARY.md` with:
- Task 0 cluster discovery snapshot: sampled-file failure signatures + namespace enumeration.
- Task 1 setup.ts diff highlight: keys added per namespace (count + alphabetical list).
- Task 2 per-file disposition table (empty if Task 1's single-root fix closed all 7).
- `vitest --run tests/component/` final output: `Test Files: 7 passed (7)` or equivalent.
- Full FE runner output (combined with 50-13a): `Test Files: N passed (N) | Tests: M passed (M)`, exit code 0 confirmation.
- Cross-plan handoff: any `split-to-integration` files for Plan 50-04 / 50-05 to absorb.
- Task 3 frontmatter-patch evidence: before/after `depends_on:` blocks of `50-04-PLAN.md` and `50-05-PLAN.md`.
- Phase-50-FE-exit attestation: TEST-02 satisfied at full-runner level; BE workspace green per `50-03-SUMMARY.md`; Plans 50-04 (audit + docs) and 50-05 (CI gate + ESLint rule) are unblocked.
- Retain `.planning/phases/50-test-infrastructure-repair/50-13b-DISCOVERY.md` as a permanent audit artifact for Plan 50-04.
</output>
