---
phase: 50-test-infrastructure-repair
plan: 13a
type: execute
wave: 4
depends_on:
  - 50-01
  - 50-09
  - 50-10
  - 50-11
  - 50-12
files_modified:
  - frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts
  - frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts
  - frontend/src/hooks/__tests__/usePersonalCommitments.test.ts
  - frontend/src/lib/__tests__/api-client.test.ts
  - frontend/src/components/__tests__/ConsistencyPanel.test.tsx
  - frontend/tests/unit/analytics.cluster.test.tsx
  - frontend/tests/unit/routes.test.tsx
  - frontend/vitest.config.ts
  - frontend/tests/setup.ts
autonomous: true
requirements:
  - TEST-02
  - TEST-04
user_setup: []

must_haves:
  truths:
    - 'AT TASK START, the executor re-runs `pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tail -8` and counts failing files. The full FE runner failing-files count MUST be ≤8 after 50-09/10/11/12 land — otherwise STOP and surface to operator (phase scope misjudged).'
    - '`useCountryAutoFill` test fixture uses REST Countries v3.1 contract (`cca2`, `cca3`, `region`, `capital`) and the impl has 3 new `match.cca2 != null` / `match.cca3 != null` / `match.region != null` runtime null-guards (D-09 product hardening + D-10 test-contract preservation). This is the must-fix hot-list item preserved verbatim from the archived Plan 50-02 / 50-08 spec.'
    - 'After this plan lands (together with 50-13b for the cluster), `pnpm --filter intake-frontend test --run` exits 0 — the cumulative phase-exit-0 contract per D-01 is SATISFIED. NO `queued-with-rationale` files remain in the default runner.'
    - 'Each per-file fix has its own commit (`fix(50-13a): <file> — <verdict>`) so reviewers can audit per-file granularity per D-10.'
    - 'Plan 50-13a runs in Wave 4 (strictly after the Wave-3 cohort lands). Touching `frontend/tests/setup.ts` (indexedDB polyfill for routes.test.tsx) and `frontend/vitest.config.ts` (any final split-to-integration entries) is parallel-conflict-safe because the sibling Wave-4 plan 50-13b owns a different setup.ts region (translations map extension).'
  artifacts:
    - path: 'frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts'
      provides: 'Hook with `match.cca2 != null` / `match.cca3 != null` / `match.region != null` runtime null-guards (D-09 product hardening; mirror existing line-67 `match.capital != null` idiom)'
      contains: 'match.cca2 != null'
    - path: 'frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts'
      provides: "Test using REST Countries v3.1 fixture shape with `cca2: 'SA'`, `cca3: 'SAU'`, `region: 'Asia'`, `capital: ['Riyadh']` + assertion `region: 'asia'` post-REGION_MAP"
      contains: "cca2: 'SA'"
  key_links:
    - from: 'Final FE test runner output'
      to: 'D-01 phase-exit contract'
      via: '`pnpm --filter intake-frontend test --run` exits 0 → FE green proof across the full plan set (13a + 13b)'
      pattern: 'Test Files.*passed'
    - from: 'frontend/tests/setup.ts indexedDB polyfill (Task 2 sub-step for routes.test.tsx)'
      to: 'frontend/src/services/offline-queue.ts module-eval'
      via: 'Stub the IDBFactory at jsdom env-setup time so import-side-effects in routes.test.tsx do not crash'
      pattern: 'indexedDB'
---

<objective>
Close the phase-exit-0 contract for the frontend default runner — original 6-file scope preserved from the pre-split Plan 50-13. After Plans 50-09 (cross-cutting polyfills + provider migration), 50-10 (i18n-text drift), 50-11 (a11y/perf outliers), and 50-12 (design-system + route harness) land, the residual originally scoped to 50-13 was 6 per-file impl/test drift items + the must-fix `useCountryAutoFill` pair. Live discovery on 2026-05-14 found 13 failing files; the 7-file tests/component/ i18n cluster is split out to Plan 50-13b. This plan owns the original 6 files.

1. **Applies the canonical `useCountryAutoFill` fix preserved verbatim from the archived Plan 50-02 / 50-08 spec** — REST Countries v3.1 fixture in the test + 3 runtime null-guards in the impl. This is the must-fix hot-list item and the canonical "TEST IS WRONG, IMPL ALSO NEEDS HARDENING" case.

2. **Per-file triage of the remaining 5 residual files** via D-10 archaeology:
   - `frontend/src/hooks/__tests__/usePersonalCommitments.test.ts` (4 of 6 fail)
   - `frontend/src/lib/__tests__/api-client.test.ts` (6 of 6 fail — MSW handler gap)
   - `frontend/src/components/__tests__/ConsistencyPanel.test.tsx` (9 of 17 fail)
   - `frontend/tests/unit/analytics.cluster.test.tsx` (1 of 1 fails — useLanguage missing AFTER 50-09; verify scope)
   - `frontend/tests/unit/routes.test.tsx` (13 of 14 fail — indexedDB + TanStack Router harness)

Plan 50-13a OWNS 9 file modifications (6 test/impl + 1 impl null-guard file + setup.ts + vitest.config.ts). This is at the ≤8 ceiling boundary; ceiling check at Task 0 governs progression. Wave 4 — no parallel-conflict risk for setup.ts (PCH-50R-05); 50-13b owns a different region of the same file (translations map extension).

**D-01 is non-negotiable here.** This plan, combined with 50-13b, achieves `pnpm --filter intake-frontend test --run` exit code 0. If a file cannot be fixed-green within the plan budget, escalate — DO NOT silently widen scope and re-create the original Plan 50-02 ceiling-overshoot situation.

Downstream housekeeping (50-04 / 50-05 depends_on rewire) lives in Plan 50-13b Task 3, NOT this plan.

Purpose: Achieve the original-scope half of the phase-exit-0 contract per D-01.

Output:

- `useCountryAutoFill.ts` with 3 added `!= null` guards.
- `useCountryAutoFill.test.ts` with REST Countries v3.1 fixture + corrected REGION_MAP assertion.
- Each other residual file either fixed-green or split-to-integration with per-file commit.
- `frontend/tests/setup.ts` may gain an indexedDB jsdom polyfill (Task 2 sub-step for routes.test.tsx).
- `frontend/vitest.config.ts` may gain exclude entries for split-to-integration residuals.
- This plan's contribution to `pnpm --filter intake-frontend test --run` exit 0 (the 7-file i18n cluster is closed by Plan 50-13b).
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
@.planning/phases/50-test-infrastructure-repair/50-09-SUMMARY.md
@.planning/phases/50-test-infrastructure-repair/50-10-SUMMARY.md
@.planning/phases/50-test-infrastructure-repair/50-11-SUMMARY.md
@.planning/phases/50-test-infrastructure-repair/50-12-SUMMARY.md
@CLAUDE.md

<interfaces>
<!-- Per-file diagnosis. Verbatim must-fix spec preserved from archived 50-08 / 50-02 via 50-13. -->

From `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts` (CURRENT impl per archived 50-08 Task 1 spec — 72 lines):

- `RestCountryResult` interface (lines 6-11): `cca2: string`, `cca3: string`, `region: string`, `capital?: string[]`.
- `REGION_MAP` (lines 14-21): `{ Asia: 'asia', Africa: 'africa', Europe: 'europe', Americas: 'americas', Oceania: 'oceania', Antarctic: 'antarctic' }`.
- `fetchCountryReference` (lines 23-33): fetches `https://restcountries.com/v3.1/name/${name}?fields=cca2,cca3,region,capital`.
- Lines 55-66: 4 fill-when-empty blocks. Lines 55, 58, 61 use only `match.cca2 !== ''` / `match.cca3 !== ''` / `match.region !== ''` (empty-string guard — `undefined` passes through, writing `undefined` to the form). Line 67 ALREADY uses `match.capital != null` — copy this idiom for cca2/cca3/region.

From `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts` (CURRENT test — 110 lines):

- Lines 60-66 (first `it` block fixture — WRONG): `const mockMatch = { code: 'SA', code3: 'SAU', name_en: ..., name_ar: ..., region: 'Asia' }`.
- Line 77: `expect(form.setValue).toHaveBeenCalledWith('iso_code_2', 'SA')` — CURRENTLY fails because impl reads `match.cca2`, mock provides `code`.
- Line 78: same for `iso_code_3`.
- Line 79: `expect(form.setValue).toHaveBeenCalledWith('region', 'Asia')` — WRONG ASSERTION; impl maps `'Asia'` → `'asia'` via REGION_MAP.
- Line 106: `not.toHaveBeenCalledWith('region', 'Asia')` — update to `'asia'`.

From RESEARCH (per-file diagnostic notes for the remaining 5 files):

- `usePersonalCommitments.test.ts`: 4 of 6 fail. Likely impl drift in the hook's `useQuery` shape post-Phase 38 dashboard wiring.
- `api-client.test.ts`: 6 of 6 fail. Runner log shows `[MSW] Error: intercepted a request without a matching request handler`. The test relies on MSW handlers that don't exist; either add handlers OR use `vi.spyOn(global, 'fetch')` mocking.
- `ConsistencyPanel.test.tsx`: 9 of 17 fail. Per Plan 50-01 `93f56b2b` commit, this file was already touched (2 lines changed) but residual drift remains.
- `analytics.cluster.test.tsx`: 1 of 1 fails — `useLanguage must be used within a LanguageProvider`. Should have auto-closed via Plan 50-09 polyfill + the wrapper; verify whether the file uses bare `render`. If yes, migrate to `renderWithProviders`.
- `routes.test.tsx`: 13 of 14 fail. Migrated to renderWithProviders in 50-06, but additional drift: `indexedDB is not defined` (jsdom gap; needs polyfill or test rewrite), GoTrueClient instances warning (harmless), and the `vi.mock('../../src/hooks/useDossier')` not hoisted to module top.

From CONTEXT D-01 (as amended by operator gap brief):

- "Phase 50 ends when `pnpm --filter frontend test` exits 0."
- `queued-with-rationale` is NO LONGER acceptable for the default FE runner.
- Only `fixed-green`, `split-to-integration`, or `deleted-dead` are valid dispositions.

The `split-to-integration` mechanism:

- Add the file to `frontend/vitest.config.ts` `exclude` (post-Plan-50-01 already has `['node_modules/', 'dist/', 'build/', '**/*.spec.*']` — append the file path). This plan OWNS the `frontend/vitest.config.ts` edit in Wave 4 for its 6-file scope (50-13b owns separate exclude entries for the cluster files if any).
- Add a coordinated handoff entry to this plan's SUMMARY for Plan 50-04 audit + Plan 50-05 integration runner.

From PCH-50R-05 (Wave-4 setup.ts edit is safe):

Wave 4 follows Wave 3. Plan 50-10 (Wave 3) owns setup.ts for translation-map additions. Plan 50-13a (Wave 4) may extend setup.ts with an indexedDB polyfill (or a per-test stub in `routes.test.tsx`). Plan 50-13b (Wave 4, sequential after 13a per its depends_on) may extend the translations map further. The two regions are non-overlapping. The Task 2 routes.test.tsx sub-step chooses between a per-test stub (preferred for surgical fix) and a setup.ts addition (preferred if multiple files need indexedDB) based on grep evidence at task time.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 0: Discovery + ceiling-check — re-run FE runner; enumerate residual; halt if >8 files</name>
  <files>.planning/phases/50-test-infrastructure-repair/50-13a-DISCOVERY.md</files>
  <read_first>
    - .planning/phases/50-test-infrastructure-repair/50-09-SUMMARY.md
    - .planning/phases/50-test-infrastructure-repair/50-10-SUMMARY.md
    - .planning/phases/50-test-infrastructure-repair/50-11-SUMMARY.md
    - .planning/phases/50-test-infrastructure-repair/50-12-SUMMARY.md
    - .planning/phases/50-test-infrastructure-repair/50-13-DISCOVERY.md (the halt snapshot that triggered the split — confirms expected residual for 13a is the 6 files NOT in tests/component/)
  </read_first>
  <action>
    Discovery + halt gate (mirrors the archived 50-08 Task 0 pattern with a tighter ceiling).

    1. Run `pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tee /tmp/phase50-13a-discovery.log`.

    2. Extract the list of failing test files.

    3. **Ceiling check (scoped to 13a):** Filter the failing list to exclude the 7 files owned by 50-13b (`tests/component/AssignmentDetailsModal`, `BulkActionToolbar`, `ConflictDialog`, `ContributorsList`, `EscalationDialog`, `FilterPanel`, `ReminderButton`). If the post-filter count > 8, STOP and write a halt message:
       - "Discovery at Plan 50-13a Task 0 shows N failing files in 13a-owned scope (> 8 ceiling)."
       - The full list of failing files (13a-owned only).
       - "Phase scope was misjudged. Surface to operator for: (a) ratify scope expansion, (b) further split 50-13a, or (c) absorb (N-8) files as `split-to-integration` and via vitest.config.ts exclude."
       - DO NOT proceed to Task 1+.

    4. If count ≤ 8, write `50-13a-DISCOVERY.md` with the enumerated residual list (each file's last-failure-line signature). Note the 13b-owned 7 files separately as "out-of-scope for 13a; will close in 13b".

    5. Commit: `chore(50-13a): record post-50-09/10/11/12 residual for ≤8 ceiling check`.

  </action>
  <verify>
    <automated>cd frontend &amp;&amp; pnpm exec vitest --run --reporter=default 2&gt;&amp;1 | tee /tmp/phase50-13a-discovery.log | tail -8 | grep -E "Test Files" &amp;&amp; test -f .planning/phases/50-test-infrastructure-repair/50-13a-DISCOVERY.md</automated>
  </verify>
  <done>
    Either (a) the post-filter (excluding 13b's 7 files) count is ≤8 AND `50-13a-DISCOVERY.md` exists with the list, OR (b) post-filter count is >8 AND this task halts WITHOUT advancing.
  </done>
</task>

<task type="auto">
  <name>Task 1: Fix useCountryAutoFill regression — REST Countries v3.1 fixture + 3 impl null-guards (must-fix from archived 50-02/50-08)</name>
  <files>frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts, frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts</files>
  <read_first>
    - frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts (full file — current 72-line impl reading `match.cca2`, `match.cca3`, `match.region`, `match.capital`)
    - frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts (full file — current 110-line test with wrong `code`/`code3` mock and wrong `'Asia'` assertion)
    - .planning/phases/50-test-infrastructure-repair/50-08-PLAN.archived.md Task 1 (the canonical spec — preserved verbatim here)
    - .planning/phases/50-test-infrastructure-repair/50-CONTEXT.md D-09 (root-cause fixes allowed), D-10 (test name = contract spec)
  </read_first>
  <action>
    Two-file fix preserved verbatim from archived Plan 50-08 Task 1 (and originally Plan 50-02). This is the canonical "TEST IS WRONG, IMPL ALSO NEEDS HARDENING" case.

    **A) Fix the test (`useCountryAutoFill.test.ts`) — primary fix per TEST WRONG verdict:**

    - In the first `it('auto-fills empty form fields when reference match found', ...)` block (around lines 59-80):
      - Change the `mockMatch` literal at lines 60-66 from `{ code: 'SA', code3: 'SAU', name_en: ..., name_ar: ..., region: 'Asia' }` to the REST Countries v3.1 contract `{ cca2: 'SA', cca3: 'SAU', region: 'Asia', capital: ['Riyadh'] }`. Drop `name_en` / `name_ar` — they were never on `RestCountryResult` and never read.
      - Change line 79 assertion from `expect(form.setValue).toHaveBeenCalledWith('region', 'Asia')` to `expect(form.setValue).toHaveBeenCalledWith('region', 'asia')` (post-REGION_MAP).
      - Add a new assertion immediately after line 79: `expect(form.setValue).toHaveBeenCalledWith('capital_en', 'Riyadh')` — covers the capital field.

    - In the second `it('does not overwrite user-entered values', ...)` block (lines 82-109):
      - Apply the SAME mockMatch shape fix at lines 83-89.
      - Update line 106 from `not.toHaveBeenCalledWith('region', 'Asia')` to `not.toHaveBeenCalledWith('region', 'asia')`.

    - Do NOT touch the `vi.mock('@tanstack/react-query', ...)` block at lines 7-9 or the `vi.mocked(useQuery).mockReturnValue(...)` per-test overrides — those are correct.

    **B) Harden the impl (`useCountryAutoFill.ts`) — D-09 product hardening:**

    - Line 55: extend `if (current.iso_code_2 === '' && match.cca2 !== '')` to `if (current.iso_code_2 === '' && match.cca2 != null && match.cca2 !== '')`.
    - Line 58: same for `iso_code_3` / `match.cca3`.
    - Line 61: same for `region` / `match.region`.
    - Do NOT touch the `match.capital != null` guard at line 67 — it's already correct.
    - Do NOT widen the `RestCountryResult` interface to make fields optional — that would cascade through callers. The null-guard is runtime-only per PATTERNS §useCountryAutoFill.ts Gotchas.

    Commit: `fix(50-13a): useCountryAutoFill — REST Countries v3.1 fixture + 3 null-guards (D-09 + D-10)`. Body lists 5 test-file edits + 3 impl-file edits.

  </action>
  <verify>
    <automated>cd frontend &amp;&amp; grep -c "cca2: 'SA'" src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts | awk '$1 &gt;= 1 { exit 0 } { exit 1 }' &amp;&amp; grep -c "match.cca2 != null" src/components/dossier/wizard/hooks/useCountryAutoFill.ts | grep -q "^1$" &amp;&amp; grep -c "match.cca3 != null" src/components/dossier/wizard/hooks/useCountryAutoFill.ts | grep -q "^1$" &amp;&amp; grep -c "match.region != null" src/components/dossier/wizard/hooks/useCountryAutoFill.ts | grep -q "^1$" &amp;&amp; pnpm exec vitest --run src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts 2&gt;&amp;1 | tail -5 | grep -E "Test Files.*passed" | grep -vE "[1-9]+[0-9]* failed"</automated>
  </verify>
  <done>
    Both `it` blocks in `useCountryAutoFill.test.ts` pass green. `grep "cca2: 'SA'"` returns ≥1 (both fixtures fixed). `grep "match.cca2 != null"` / `cca3 != null` / `region != null` each return 1 in the impl. `RestCountryResult` interface unchanged.
  </done>
</task>

<task type="auto">
  <name>Task 2: Per-file triage of remaining 5 residual files (D-10 archaeology) — close the 13a slice</name>
  <files>frontend/src/hooks/__tests__/usePersonalCommitments.test.ts, frontend/src/lib/__tests__/api-client.test.ts, frontend/src/components/__tests__/ConsistencyPanel.test.tsx, frontend/tests/unit/analytics.cluster.test.tsx, frontend/tests/unit/routes.test.tsx, frontend/tests/setup.ts, frontend/vitest.config.ts</files>
  <read_first>
    - .planning/phases/50-test-infrastructure-repair/50-13a-DISCOVERY.md (Task 0 output — authoritative residual list)
    - For EACH file in the residual list, read: the test file in full; the impl file under test; `git log -p <test>` and `git log -p <impl>`
    - frontend/tests/mocks/server.ts (MSW server — needed for api-client.test.ts handler additions if disposition is repair-with-handlers)
    - frontend/tests/setup.ts (POST-50-10/50-12 — current translations map + polyfills)
    - frontend/vitest.config.ts (POST-50-11 — current exclude array)
    - .planning/phases/50-test-infrastructure-repair/50-CONTEXT.md D-01, D-09, D-10, D-11
  </read_first>
  <action>
    Per-file triage. Each file is independent; commit per file. Setup.ts and vitest.config.ts are touched only when the corresponding disposition (indexedDB polyfill / split-to-integration) is chosen.

    **D-10 Per-File Procedure (apply per file):**

    1. `pnpm --filter intake-frontend exec vitest --run <file> 2>&1 | tail -30` — capture failure signature.
    2. `git log --oneline -- <file>` and `git log --oneline -- <impl>` — archaeology.
    3. Determine verdict: TEST WRONG / IMPL DRIFTED / INFRASTRUCTURE-DEPENDENT / DEAD.
    4. Apply the fix.
    5. Verify `pnpm exec vitest --run <file>` exits 0 (or file is split-to-integration).
    6. Commit per file.

    **Per-file starting hypotheses (verify before fixing):**

    **A) `usePersonalCommitments.test.ts` (4 of 6 fail):**

    Hook drift since Phase 38 dashboard. Read `frontend/src/hooks/usePersonalCommitments.ts` (impl) + the test. If the hook's return shape changed (e.g., added a `data` field that the test asserts isn't there), update the test. If the test mocks `useQuery` with a stale shape, update the mock.

    Commit: `fix(50-13a): usePersonalCommitments test — align return-shape assertions (D-10: <verdict>)`.

    **B) `api-client.test.ts` (6 of 6 fail):**

    The captured log shows `[MSW] Error: intercepted a request without a matching request handler` for every test. The test uses real `fetch` but MSW intercepts and finds no handler → throws.

    Two disposition paths:
    - **Repair (add handlers):** Add per-test handlers using `server.use(http.get(...), ...)` (MSW 2.x API). Each `it` block adds the handler before the action.
    - **Repair (mock fetch directly):** Bypass MSW for this file via `vi.stubGlobal('fetch', vi.fn(...))`. This is cleaner per Karpathy §2 for a test of `apiClient` (the unit under test); MSW is overkill for verifying the client's HTTP shape.

    Default action: stub `fetch` directly per test. Each `it` block sets up a fetch mock matching the expected URL/method, then asserts the apiClient called fetch with the right args + handled the response correctly.

    Commit: `fix(50-13a): api-client test — replace MSW with vi.stubGlobal(fetch) per-test stubs`.

    **C) `ConsistencyPanel.test.tsx` (9 of 17 fail):**

    Already touched in Plan 50-01 commit `93f56b2b` (2 lines changed). Residual drift = 9 failing tests. Read failures + apply D-10 per case.

    The 8 already-passing tests anchor the contract; failing tests likely assert on i18n keys (resolve via translations map extension — but setup.ts is Plan 50-10 owned; if a NEW key is needed beyond 50-10's batched edit, append to setup.ts in this plan with a single-key commit) or on impl-markup that drifted (Phase 33+).

    Commit: `fix(50-13a): ConsistencyPanel test — reconcile <N> assertions (D-10: TEST WRONG)`.

    **D) `analytics.cluster.test.tsx` (1 of 1 fails):**

    Single failure: `Error: useLanguage must be used within a LanguageProvider`. Plan 50-09 added the polyfill + helper, but this file may not have been migrated.

    Quick fix: migrate to `renderWithProviders` (same pattern as Plan 50-09 Task 2). Single test file, one-import-change diff.

    Commit: `fix(50-13a): analytics.cluster test — migrate to renderWithProviders (CC-3 closure)`.

    **E) `routes.test.tsx` (13 of 14 fail):**

    Already migrated to renderWithProviders in Plan 50-06 (verified via grep). Residual failures stem from:
    1. `indexedDB is not defined` — jsdom doesn't ship indexedDB; the test indirectly imports `frontend/src/services/offline-queue.ts` which uses indexedDB at module-eval.
    2. `vi.mock('../../src/hooks/useDossier')` not at module top (hoisting warning in the log).
    3. TanStack Router harness setup may need adjustment.

    Disposition tree:
    - **Repair:** Add `vi.stubGlobal('indexedDB', { ... stub ... })` at test-file top (preferred for surgical fix) OR in `setup.ts` if the gap is widespread (Wave 4 — no parallel conflict). Hoist the `vi.mock` to module top. Update Router harness if needed.
    - **Split-to-integration:** If the test fundamentally needs real IndexedDB / Router behavior, append the file glob to `frontend/vitest.config.ts` exclude array.

    Given that this is the LAST file standing between the 13a slice and phase-exit-0, and given the indexedDB jsdom gap is fixable via stub:

    Step 1: Decide between per-test stub and setup.ts polyfill. If ONLY `routes.test.tsx` needs indexedDB, prefer the per-test stub (surgical, no setup.ts edit). If grep shows ≥2 test files import `offline-queue` (or similar IDB-using modules), prefer the setup.ts polyfill:
    ```
    if (typeof globalThis.indexedDB === 'undefined') {
      globalThis.indexedDB = {
        open: () => ({ onsuccess: null, onerror: null, result: null }),
        deleteDatabase: () => ({ onsuccess: null, onerror: null }),
      } as unknown as IDBFactory
    }
    ```
    Place in setup.ts after the matchMedia polyfill (Plan 50-09 Task 1 block) — Wave 4 means no parallel-conflict risk (PCH-50R-05); 50-13b owns a different region (translations map).

    Step 2: Hoist the `vi.mock('../../src/hooks/useDossier', ...)` to module top of `routes.test.tsx` (currently in describe). And import `useDossier` at module top so `vi.mocked()` resolves if used.

    Step 3: If individual route-render tests still fail on TanStack Router internals (e.g., `<MemoryRouter>` shape), inspect each failure and reconcile.

    Commit (likely two): `fix(50-13a): add indexedDB jsdom polyfill (setup.ts | per-test)` AND `fix(50-13a): routes test — hoist vi.mock + reconcile Router harness (D-10)`.

    **CRITICAL — phase-exit-0 contract (13a slice):**

    After ALL per-file fixes land in this plan, run `pnpm --filter intake-frontend test --run`. The 7 files owned by 50-13b will still fail at this point (they close in 50-13b); the 6 files owned by 13a MUST be green. Confirm by filtering the failure list to the 13a-owned set and asserting 0 remain. If any 13a-owned file is still failing AND not split, STOP and escalate.

  </action>
  <verify>
    <automated>cd frontend &amp;&amp; pnpm exec vitest --run --reporter=default 2&gt;&amp;1 | tail -50 | tee /tmp/phase50-13a-verify.log &amp;&amp; ! grep -E "(useCountryAutoFill|usePersonalCommitments|api-client|ConsistencyPanel|analytics\.cluster|routes)\.(test|spec)\.(ts|tsx)" /tmp/phase50-13a-verify.log | grep -E "(FAIL|×)" &amp;&amp; pnpm --filter intake-frontend lint</automated>
  </verify>
  <done>
    The 6 files in 13a's scope are all green (`useCountryAutoFill` pair + `usePersonalCommitments` + `api-client` + `ConsistencyPanel` + `analytics.cluster` + `routes`). Every per-file disposition has a per-file commit. Workspace lint exits 0. Files passed to integration runner (if any) are listed in this plan's SUMMARY AND excluded from `frontend/vitest.config.ts`. Plan 50-13b will close the remaining 7 cluster files independently.
  </done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                     | Description                                                                                                                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test runner ↔ phase-exit-0 contract          | The FE default runner's exit code is the single source of truth for D-01; a false-positive green (e.g., file silently excluded without disposition record) invalidates Plans 50-04 and 50-05 downstream. |
| Per-file disposition ↔ Plan 50-04 audit      | Each per-file commit's verdict feeds the `50-TEST-AUDIT.md` rows; falsifying a verdict lets a regression hide.                                                                                           |
| Wizard hook fixture ↔ product hook           | `useCountryAutoFill` mocks `useQuery` with controlled data; the impl null-guards prevent malformed REST Countries responses from writing `undefined` to the form.                                        |
| Wave-4 setup.ts + vitest.config.ts ownership | Plan 50-13a owns the indexedDB-polyfill region; Plan 50-13b owns the translations-map region. The two regions are non-overlapping; per-region commits keep parallel-conflict risk at zero.               |

## STRIDE Threat Register

| Threat ID   | Category                   | Component                                                                                        | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                    |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-50-13a-01 | T (Tampering)              | A split-to-integration disposition could silently exclude a real regression check.               | mitigate    | Task 2 split disposition requires explicit `vitest.config.ts` `exclude` addition (visible in diff) AND handoff entry in SUMMARY for Plan 50-04 audit. Two-channel record.                                                                                                                          |
| T-50-13a-02 | D (DoS via test hangs)     | Per-file triage at scale could exhaust context if >8 files actually need investigation.          | mitigate    | Task 0 ceiling check halts before triage if >8 in 13a-owned scope.                                                                                                                                                                                                                                 |
| T-50-13a-03 | T (Tampering)              | `useCountryAutoFill` interface widening would cascade through callers.                           | mitigate    | Task 1 explicitly forbids widening `RestCountryResult` — null-guard is runtime-only.                                                                                                                                                                                                               |
| T-50-13a-04 | R (Repudiation)            | A per-file commit could carry a wrong verdict, polluting audit.                                  | accept      | Plan 50-04 audit cross-checks each commit's diff vs verdict at audit time.                                                                                                                                                                                                                         |
| T-50-13a-05 | I (Information disclosure) | An overly broad indexedDB polyfill in setup.ts could mask a real IDB regression in product code. | mitigate    | Task 2 Step 1 prefers per-test stub for surgical scope; setup.ts polyfill is chosen only when ≥2 test files demonstrably need it. The polyfill's stub returns `null`/`undefined` for every operation (no business logic) so it cannot mask functional behavior — only crash-on-eval is suppressed. |

</threat_model>

<verification>
**Plan-level checks (post-plan):**

- The 6 files in 13a's scope all pass green: `useCountryAutoFill` pair + `usePersonalCommitments` + `api-client` + `ConsistencyPanel` + `analytics.cluster` + `routes`.
- `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts` contains `match.cca2 != null`, `match.cca3 != null`, `match.region != null` (3 new null-guards).
- `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts` contains `cca2: 'SA'` and `cca3: 'SAU'` in both `it` block fixtures.
- Per-file commits exist for each fixed/split residual (`git log --oneline 50-13a` shows ≥1 per file).
- `pnpm --filter intake-frontend lint` exits 0.
- Files moved to integration runner (if any) are listed in `50-13a-SUMMARY.md` AND excluded from `frontend/vitest.config.ts`.
- Zero 13a-owned files in `queued-with-rationale` state.
- The 4 wizard tests from Plan 50-01 still pass green (no regression).
- Plans 50-09/10/11/12 closures still hold.
- If indexedDB polyfill was added to `frontend/tests/setup.ts`, that change is visible in `git log -p` and listed in the SUMMARY.
- The full `pnpm --filter intake-frontend test --run` exit-0 contract is satisfied ONLY after Plan 50-13b also lands. 13a alone is not sufficient.
  </verification>

<success_criteria>

- **13a slice satisfied:** the 6 files in 13a's scope all pass green; no `queued-with-rationale` carve-outs.
- **D-09 hardening:** `useCountryAutoFill.ts` has 3 new `!= null` guards.
- **D-10 archaeology applied:** Each per-file disposition has a per-file commit with evidence.
- **No regressions:** Plans 50-01/09/10/11/12 gains stay green.
- **Ceiling discipline honored:** Task 0 verified ≤8 files in 13a's scope; escalation path explicit if exceeded.
- **PCH-50R-05 mitigation:** setup.ts + vitest.config.ts edits are Wave-4 safe (indexedDB region only; translations-map region owned by 50-13b).
- **Phase-exit-0 contract partial:** D-01 is fully satisfied ONLY when 50-13b also lands; this plan closes the original 6-file slice.

</success_criteria>

<output>
After completion, create `.planning/phases/50-test-infrastructure-repair/50-13a-SUMMARY.md` with:
- Task 0 discovery snapshot: count of residual files at task start + enumerated list with failure signatures (13a-owned only).
- Per-file disposition table for Task 2: `file | verdict | commit hash | archaeology evidence`.
- Final FE test runner output filtered to the 6 13a-owned files: all green, ≥0 in 13a's scope.
- Cross-plan handoff: any `split-to-integration` files for Plan 50-04 / 50-05 to absorb.
- Note that the full `pnpm --filter intake-frontend test --run` exit-0 contract requires Plan 50-13b to land for the 7-file i18n cluster.
- Retain `.planning/phases/50-test-infrastructure-repair/50-13a-DISCOVERY.md` as a permanent audit artifact for Plan 50-04 (per PCH-50R-08 — DO NOT delete).
</output>
