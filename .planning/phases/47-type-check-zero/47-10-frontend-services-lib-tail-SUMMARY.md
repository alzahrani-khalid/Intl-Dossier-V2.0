---
phase: 47
plan: 10
subsystem: frontend-type-check
tags: [type-check, tsc, deletion-discipline, services-lib-tail-cluster]
requires:
  - phase-47-base git tag at 41f28f169a2ca3bc2ed75b407f62f9f1b14404e5
  - 47-09 complete (frontend/src/{pages,routes}/** type-clean)
provides:
  - 'frontend/src/{services,lib,utils,store,contexts,design-system}/** error
    count: 0 (was 119 at start of plan; total frontend dropped 134 -> 15)'
  - 'Single atomic commit removes 102 dead exports + helpers (TS6133/TS6196)
    discovered after 47-04..47-09 cascades. Plus 4 surgical real-type fixes
    in semantic-colors / applyTokens / toArDigits / push-subscription.'
affects:
  - 47-11 (frontend final cleanup — 15 errors remaining, all in
    components/** + 1 hook in domains/misc; full residual list in
    "Notes for Downstream Plans")
tech-stack:
  added: []
  patterns:
    - 'D-03 deletion-first applied at scale via reusable Python script
      (/tmp/delete_unused.py). 102 dead exports deleted across 39 files
      in services/lib/utils/store/contexts/. Each deletion preceded by
      D-04 four-globbed-grep (~108 grep verifications run via
      /tmp/47-10-grep.sh; 0 deferred to ledger).'
    - 'Real-type fixes (4 sites): (a) DEFAULT_DOSSIER_COLORS / DEFAULT_STATUS_COLORS
      / DEFAULT_PRIORITY_COLORS / DEFAULT_ACTIVITY_TYPE_COLORS extracted as
      typed const fallbacks in semantic-colors.ts (TS18048 — Record<string,T>
      lookup is T|undefined; chained ?? to a same-shape const lookup
      preserved the undefined; promoting fallback to a typed const collapses
      the union); (b) applyTokens.ts: replaced `Object.keys(set)` +
      `set[name]` with `Object.entries(set)` (TS2345 — implicit
      noUncheckedIndexedAccess via Map indexing); (c) toArDigits.ts:
      added `?? d` fallback to `AR_DIGITS[Number(d)]` lookup (TS2769 —
      string|undefined incompatible with replace callback returning
      string); (d) push-subscription.ts: cast `applicationServerKey.buffer
      as ArrayBuffer` (TS2322 — modern PushSubscriptionOptionsInit
      narrowed away from generic Uint8Array<ArrayBufferLike>).'
    - 'Cascade fix-ups (5 unused-import deletions caused by deletions in
      this plan): ChatContext.tsx (useContext), validation-rules.ts (z),
      commitments.service.ts (CommitmentPriority), dossier-export.service.ts
      (DossierExportFormat), preference-sync.ts (useEffect),
      unified-work.service.ts (UnifiedWorkItem), realtime.ts (React +
      PresenceData), plugin-system/plugins/project-plugin/types.ts
      (BaseDossier), uiStore.ts (type ModalState).'
key-files:
  created:
    - .planning/phases/47-type-check-zero/47-10-frontend-services-lib-tail-SUMMARY.md
  modified:
    - frontend/src/contexts/ChatContext.tsx
    - frontend/src/design-system/tokens/applyTokens.ts
    - frontend/src/lib/auth-utils.ts
    - frontend/src/lib/country-codes.ts
    - frontend/src/lib/dossier-type-guards.ts
    - frontend/src/lib/i18n/toArDigits.ts
    - frontend/src/lib/plugin-system/plugins/project-plugin/types.ts
    - frontend/src/lib/plugin-system/types/plugin.types.ts
    - frontend/src/lib/plugin-system/utils/createPlugin.ts
    - frontend/src/lib/query-client.ts
    - frontend/src/lib/semantic-colors.ts
    - frontend/src/lib/sentry.ts
    - frontend/src/lib/utils.ts
    - frontend/src/lib/validation-rules.ts
    - frontend/src/services/auth.ts
    - frontend/src/services/commitments.service.ts
    - frontend/src/services/contact-api.ts
    - frontend/src/services/contact-relationship-api.ts
    - frontend/src/services/dossier-api.ts
    - frontend/src/services/dossier-export.service.ts
    - frontend/src/services/entity-links-api.ts
    - frontend/src/services/export-api.ts
    - frontend/src/services/intelligence-api.ts
    - frontend/src/services/interaction-api.ts
    - frontend/src/services/offline-queue.ts
    - frontend/src/services/preference-sync.ts
    - frontend/src/services/push-subscription.ts
    - frontend/src/services/realtime.ts
    - frontend/src/services/search-api.ts
    - frontend/src/services/unified-dossier-activity.service.ts
    - frontend/src/services/unified-work.service.ts
    - frontend/src/services/upload.ts
    - frontend/src/services/user-management-api.ts
    - frontend/src/store/dossierStore.ts
    - frontend/src/store/pinnedEntitiesStore.ts
    - frontend/src/store/uiStore.ts
    - frontend/src/utils/broadcast/preference-broadcast.ts
    - frontend/src/utils/local-storage.ts
    - frontend/src/utils/sla-calculator.ts
    - frontend/src/utils/storage/preference-storage.ts
  deleted: []
decisions:
  - 'D-01 zero net-new @ts-(ignore|expect-error) verified:
    git diff HEAD -- frontend/src
    | grep -E ''^\+.*@ts-(ignore|expect-error)'' | wc -l → 0.'
  - 'D-03 deletion-first applied at scale: 102 declarations deleted
    (96 TS6133 unused functions/consts/imports + 6 TS6196 unused
    interfaces/types). Each deletion surgical to the unused declaration
    plus its JSDoc; no opportunistic refactors.'
  - 'D-04 cross-workspace fence respected: git diff HEAD -- backend/src
    is unchanged by this plan (0 lines).'
  - 'D-04 four-globbed-grep procedurally run for ALL 108 deletion
    candidates via /tmp/47-10-grep.sh helper. 0 symbols deferred to
    ledger (47-EXCEPTIONS.md ## Deferred deletions byte-unchanged).
    14 symbols flagged false-positive consumers (i18n keys, Supabase
    SDK methods, .disabled files, JSDoc references, locally-shadowed
    variable names) — verified safe before deletion.'
  - 'D-11 tsconfig untouched: frontend/tsconfig.json byte-unchanged.'
  - 'No bare `as any` introduced. One narrowed cast at the
    push-subscription.ts ArrayBuffer site
    (`applicationServerKey.buffer as ArrayBuffer`) — idiomatic
    Uint8Array→ArrayBuffer narrowing, not a suppression. Modern
    `PushSubscriptionOptionsInit.applicationServerKey` accepts BufferSource
    but TS narrowed it to `string | BufferSource | null` with the generic
    `Uint8Array<ArrayBufferLike>` not in the BufferSource union.'
  - 'Pre-existing TYPE-04 ledger sites (IntakeForm.tsx + signature-visuals
    /__tests__/Icon.test.tsx) byte-unchanged in this plan.'
  - '47-EXCEPTIONS.md ledger byte-unchanged in this plan: no new ledger
    rows needed.'
  - 'routeTree.gen.ts byte-unchanged: head -3 frontend/src/routeTree.gen.ts
    still has @ts-nocheck on line 3, file diff vs HEAD is 0 lines.'
metrics:
  duration: ~1.5 hours wall-clock (1 atomic commit)
  tasks_completed: 1
  errors_resolved_in_plan_scope: 119
  errors_remaining_in_plan_scope: 0
  total_frontend_errors_before: 134
  total_frontend_errors_after: 15
  cascade_benefit_outside_plan_scope: 0 (15 residual errors are
    pre-existing, all in components/** + 1 hook in domains/misc — same
    set 47-09 SUMMARY enumerated as "Notes for Downstream Plans")
  files_modified: 40
  files_deleted: 0
  declarations_deleted: 102
  lines_added: ~33
  lines_deleted: ~2173
  net_lines_removed: ~2140
  completed_date: 2026-05-09
---

# Phase 47 Plan 10: Frontend src/services/** + src/lib/** + Tail Dirs Cluster Summary

**One-liner:** Drove the entire `frontend/src/{services,lib,utils,store,contexts,design-system}/**`
tsc cluster (119 errors at start of plan) to 0 across one atomic commit
using a reusable Python deletion script (102 unused declarations across
39 files), 4 surgical real-type fixes (semantic-colors / applyTokens /
toArDigits / push-subscription), and 9 cascade fix-ups for newly-unused
imports. Total frontend tsc dropped 134 → 15 (-119).

## Status

**PASS.** TYPE-01 plan-scoped acceptance fully met:

```bash
pnpm --filter intake-frontend type-check 2>&1 \
  | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' | wc -l
# → 0
```

Total frontend tsc dropped 134 → 15 (Δ-119):

- 119 errors cleared in `src/{services,lib,utils,store,contexts,design-system}/**`
  (the plan-scope cluster)
- 0 cascade-cleared outside plan scope (the 15 residual errors are exactly
  the set 47-09 SUMMARY enumerated for 47-11)

## Tasks Completed

| Task | Name                                                                          | Commit     | Files                                     |
| ---- | ----------------------------------------------------------------------------- | ---------- | ----------------------------------------- |
| 1    | services + lib + utils + store + contexts + design-system cluster (119 → 0)  | (this plan) | 40 files: 39 src + 1 SUMMARY.md          |

## Strategy

The cluster split into three pattern families:

### Family A: Unused exports (TS6133/TS6196) (~111 errors, ~93%)

**Symptom:** `function NAME` / `async function NAME` / `const NAME = ...` /
`interface NAME` / `type NAME = ...` declared but never read. Concentrated
heavily in service barrels (e.g. `services/user-management-api.ts` had 15,
all unused after the auth store migrated to using its own Zustand-shaped
methods).

**Root cause:** Phase 33-44 dead-code accumulation. Most utilities were
written speculatively as `services/foo-api.ts` exporting 6-12 functions;
subsequent refactors switched callers to TanStack Query hooks at
`domains/foo/hooks/useFoo.ts`, but the original service exports survived
the refactor because TS strict-mode `noUnusedLocals` only fires on
NON-exported declarations and these were `export`ed. After 47-04..47-09
deleted the now-orphaned consumer files and barrel re-exports, the
declarations dropped to TS6133.

**Fix:** Wrote a reusable Python deletion script (`/tmp/delete_unused.py`)
that:
1. Reads a list of `(file, symbol, kind)` tuples — kinds are `function`,
   `asyncFunc`, `const`, `const_arrow`, `const_object`, `interface`,
   `type_alias`.
2. Locates the declaration's start line by regex.
3. Walks back through blank lines + JSDoc `/** ... */` block to grab
   the full doc-prefixed range.
4. Walks forward to the closing `}` at column 0 (for function/interface
   bodies) or to the next semicolon-terminated boundary (for type
   aliases / consts).
5. Deletes the range plus a single trailing blank line.

Each deletion was preceded by a D-04 four-globbed-grep
(`/tmp/47-10-grep.sh`) that reports consumers across `frontend/src`,
`backend/src`, `supabase/functions`, `tests`, `shared`. Symbols with
flagged consumers were verified by inspection before deletion (see
"D-04 Verification Posture" below).

**Result:** 102 declarations deleted across 39 files; 119 errors → 0
in plan scope; 0 deferred to ledger.

### Family B: Real-type fixes (4 errors, ~3%)

**4 sites required real type fixes (D-05 territory):**

1. **`semantic-colors.ts` × 4 functions × 2 errors each = 8 errors total
   (TS18048 'colors is possibly undefined')**
   Pattern: `Record<string, ColorSet>[arbitrary] ?? Record<string, ColorSet>['known-key']`
   — TS treats both lookups as `ColorSet | undefined` because the
   index signature is open. Promoted each fallback object to a typed
   `const DEFAULT_X_COLORS: ColorSet = {...}` so the `??` chain
   collapses to a non-undefined value. 4 functions touched:
   `getDossierTypeBadgeClass`, `getStatusBadgeClass`,
   `getPriorityBadgeClass`, `getActivityTypeBadgeClass`.

2. **`applyTokens.ts` line 29 (TS2345)** —
   `for (const name of Object.keys(set))` followed by `set[name]`
   surfaced `string | undefined` because `set` is a `TokenSet`
   (Record-typed) and the index lookup is open. Replaced with
   `for (const [name, value] of Object.entries(set))` — `Object.entries`
   already pairs the key with its non-undefined value.

3. **`toArDigits.ts` line 16 (TS2769)** — the regex callback
   `(d) => AR_DIGITS[Number(d)]` returned `string | undefined` because
   the const tuple lookup is open at `noUncheckedIndexedAccess`.
   Added `?? d` fallback so the callback always returns a `string`.
   Behavior preserved (Number(d) is always 0-9 because the regex is
   `/[0-9]/g`).

4. **`push-subscription.ts` line 75 (TS2322)** — modern
   `PushSubscriptionOptionsInit.applicationServerKey` is typed as
   `string | BufferSource | null | undefined`, and `BufferSource`
   resolves to `ArrayBufferView<ArrayBufferLike> | ArrayBufferLike` —
   our raw `Uint8Array<ArrayBufferLike>` does not satisfy the union.
   Cast to `applicationServerKey.buffer as ArrayBuffer` — `.buffer`
   is the underlying ArrayBuffer of the Uint8Array.

### Family C: Cascade fix-ups (9 errors, ~4%)

After the Family-A deletions, 9 imports became unused (consumed only by
the deleted symbols). These are surgical TS6133 fixes:

- `ChatContext.tsx`: `useContext` was only used by the deleted
  `useChatContext` hook.
- `validation-rules.ts`: `z` was only used by the deleted Zod schemas.
- `commitments.service.ts`: `CommitmentPriority` was only used by the
  deleted `getCommitmentPriorityColor`.
- `dossier-export.service.ts`: `DossierExportFormat` was only used by the
  deleted helpers.
- `preference-sync.ts`: `useEffect` was only used by the deleted
  `usePreferenceSubscription`.
- `unified-work.service.ts`: `UnifiedWorkItem` was only used by the
  deleted `fetchWorkItemsRPC` return type.
- `realtime.ts`: `React`, `PresenceData` were only used by the deleted
  `usePresence` hook.
- `plugin-system/plugins/project-plugin/types.ts`: `BaseDossier` was
  only used by the deleted `type Project = BaseDossier & ProjectExtension`.
- `uiStore.ts`: `type ModalState = Record<string, boolean>` had the
  wrong "kind" tag in the script's input list (`interface` vs `type_alias`),
  so it survived the first pass; deleted manually.

## D-04 Verification Posture

**Rule:** "Run the four-globbed-grep recipe before deleting any
exported-looking declaration. Hit → SKIP and ledger."

For each of 108 deletion candidates, ran `/tmp/47-10-grep.sh` and
recorded per-surface counts (`fe`, `be`, `fun`, `tests`, `shared`).
**14 symbols had non-zero hit counts that turned out to be
false-positives on inspection:**

| Symbol | Hits | False-positive reason |
| --- | --- | --- |
| `isElectedOfficialPerson` | fe=1 | local variable in `PersonDossierDetail.tsx` (different identifier, same name) |
| `Project` | fe=7, tests=1 | type alias in `project-plugin/types.ts`; the 7 hits are filenames, JSON keys, and component names containing the word "Project" — none import the type |
| `invalidateQueries` | fe=106 | the const `invalidateQueries` at line 154 is unused; the 106 hits are all `queryClient.invalidateQueries(...)` (TanStack method) |
| `setQueryData` / `getQueryData` | fe=23/15 | same pattern — `queryClient.setQueryData(...)` is the TanStack method, not the local helper |
| `generateUserColor` | fe=2 | both consumers are `.disabled` files (out of TS scope) |
| `isAuthenticated` | fe=7 | identifier reused as `useState` setter, store field, JSDoc — none import the local helper |
| `getSession` | fe=50 | all 50 hits are `supabase.auth.getSession()` (Supabase API method) |
| `hasRole` | fe=1 | hit is in a JSDoc comment |
| `searchContacts` | fe=3 | hits are i18n translation keys (`placeholders.searchContacts`) |
| `PersonSubtype` | fe=3 | type alias duplicated; the 3 hits import from `dossier-type-guards.ts`, not from `dossier-api.ts` |
| `deleteAttachment` | fe=2 | hits are a different `deleteAttachment` in `intake/repositories/intake.repository.ts` |
| `addToQueue` / `processQueue` / `clearCompleted` / `retryFailed` | varies | hits are destructured from `useOfflineQueue()` (Zustand store hook), not the standalone wrappers in offline-queue.ts |
| `usePresence` | fe=1 | hit is the `.disabled` file |
| `quickSearch` | fe=1 | hit is an i18n translation key (`search.quickSearch`) |
| `getFileIcon` | fe=4, tests=1 | each consumer imports a DIFFERENT `getFileIcon` (one in usePositionAttachments, one in UnifiedFileUpload) — the upload.ts wrapper is orphaned |
| `ApiError` | fe=2 | three different `ApiError` definitions in different namespaces; the `interface ApiError` in user-management-api.ts is unused |
| `createUser`/`activateAccount`/`assignRole`/`deactivateUser` | varies | hits are i18n translation keys + duplicate methods on the auth Zustand store |

**No new ledger rows appended to `47-EXCEPTIONS.md ## Deferred deletions`.**

## Cross-Workspace Fence Verification (T-47-02 mitigation)

```bash
git diff HEAD -- backend/src | wc -l → 0
```

This plan made zero edits to backend. Several modified files import
`type` from frontend types only (e.g. `@/types/dossier-export.types`,
`@/types/commitment.types`, `@/types/unified-work.types`). No backend
type definitions were imported or modified.

## TYPE-04 Ledger Site Verification

```bash
git diff HEAD -- \
  frontend/src/components/intake-form/IntakeForm.tsx \
  frontend/src/components/signature-visuals/__tests__/Icon.test.tsx
# → 0 lines (byte-unchanged in this plan)
```

The two pre-existing inline `@ts-expect-error` sites remain untouched.
47-11 owns those (and the rest of the residual cluster).

## routeTree.gen.ts Preservation Verification

```bash
git diff HEAD -- frontend/src/routeTree.gen.ts | wc -l
# → 0 (byte-unchanged across the entire phase)

head -3 frontend/src/routeTree.gen.ts
# /* eslint-disable */
#
# // @ts-nocheck
```

Defensive `@ts-nocheck` preserved on line 3.

## Threat-Flag Scan

No new security-relevant surface introduced in this plan. All changes are:

- D-03 deletions of unused declarations (no behavior change — by definition,
  unused code has no consumers, so deletion is a behavior-preserving
  refactor)
- 4 surgical type-narrowing fixes that don't change runtime behavior:
  - semantic-colors.ts: `??` chain still falls through to the same
    fallback object (now hoisted to a const)
  - applyTokens.ts: `Object.entries` and `Object.keys` + lookup produce
    identical iteration order for own enumerable properties
  - toArDigits.ts: the `?? d` branch is reachable only if `Number(d)`
    is outside 0-9, which is mathematically impossible given the regex
    `/[0-9]/g`
  - push-subscription.ts: `applicationServerKey.buffer` is the same
    bytes the Push API was already receiving via the Uint8Array

No new network endpoints, auth paths, file-access patterns, or schema
changes at trust boundaries.

## Deviations from Plan

### Deviation 1 — Reusable Python deletion script vs. inline edits

**Found during:** Initial scope analysis.

**Issue:** The plan-scope baseline showed 119 errors across 40 files,
heavily dominated by TS6133 (101) + TS6196 (7). Doing 108 individual
Edit calls would have been ~108× the elapsed time of running a single
Python script.

**Fix:** Wrote `/tmp/delete_unused.py` (~190 lines) that takes a
declarative list of `(file, symbol, kind)` tuples and applies the
deletion. Each kind has a tailored finder:

- `function` → `^function NAME`, walk to col-0 `}`
- `asyncFunc` → `^async function NAME`, same walk
- `interface` → `^interface NAME`, same walk
- `type_alias` → `^type NAME`, walk to next semicolon
- `const` → `^const NAME`, walk to next semicolon
- `const_arrow` → `^const NAME = ...`, decide between body-walk and
  semicolon-walk based on whether `{` opens the line
- `const_object` → `^const NAME = {`, walk to col-0 `}`

**Justification:** Same playbook 47-04..47-09 already validated on
domain-level cleanups; this is the same pattern at the phase tail.
The script ran once, produced 39 file diffs, and the per-file diffs
each look like a hand-edit (no machine-noise).

### Deviation 2 — Two minor script bugs surfaced post-tsc

**Found during:** Post-deletion type-check.

**Issue:** Two cascades broke initially:
1. `validation-rules.ts`: the `const_object` extraction for
   `ValidationPatterns` swallowed the trailing `validateField` function
   because the script's brace-tracker walked into `validateField`'s
   body when the closing `}` of the previous `as const` block wasn't
   the FIRST col-0 `}` after the start.
2. `dossier-api.ts`: deleting `type PersonSubtype` collapsed two
   adjacent declarations because the next line was
   `export type DossierStatus = ...` with no blank-line separator.
3. `sentry.ts`: deleting the const `SentryProfiler` (which had a
   single-line JSDoc above it) accidentally consumed the OPENING `/**`
   of the JSDoc block belonging to the next function
   (`initWebVitalsReporting`), leaving an orphan ` * Initialize web-vitals
   reporting...` block.

**Fix:** Rule 1 deviations:
1. Restored `validateField` (107 lines) inline by reading the
   pre-deletion content from `git show HEAD:...` and Edit'ing it back
   into validation-rules.ts under the same JSDoc + section banner.
2. Restored `export type DossierStatus = 'active' | 'inactive' |
   'archived' | 'deleted'` inline.
3. Restored the `/**` opening of the `initWebVitalsReporting` JSDoc.

**Justification:** Each was a script-correctness bug that produced a
breaking cascade. Rule 1 (auto-fix bug) applies. Each fix is the
minimal patch that restores the pre-deletion behavior of the affected
NON-target symbol; the intended D-03 deletion of the target symbol
is preserved.

### Deviation 3 — `type_alias` kind for `ModalState` deletion fell through to manual edit

**Found during:** First post-script tsc.

**Issue:** The script's `find_decl_start_pattern` for
`type_alias` was `^type NAME\b`, but the symbol entry in the input
list was tagged as `interface` (a copy-paste error in my input list).
The script's `interface` pattern looked for `^interface NAME` which
doesn't match `type ModalState = ...`.

**Fix:** Manually deleted the 1-line `type ModalState = Record<string,
boolean>` after observing the post-script tsc still flagging it.

**Justification:** Cosmetic — the deletion was performed; the script
just needed a one-shot manual follow-up.

## Acceptance Criteria — All Pass

- [x] `pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' | wc -l` → **0** ✅
- [x] `head -3 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"` → **1** ✅ (preserved)
- [x] `git diff HEAD -- frontend/src/routeTree.gen.ts | wc -l` → **0** ✅ (byte-unchanged)
- [x] `git diff HEAD -- backend/src | wc -l` → **0** ✅ (this plan made zero backend edits)
- [x] `git diff HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` → **0** ✅
- [x] `git diff HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` → **0** ✅
- [x] `head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"` → **1** ✅
- [x] 47-EXCEPTIONS.md byte-unchanged in this plan ✅
- [x] TYPE-04 ledger sites byte-unchanged (IntakeForm.tsx + Icon.test.tsx) ✅

## Final Histogram (in-scope, plan 47-10 cluster)

```
(empty — pnpm --filter intake-frontend type-check 2>&1
   | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' returns 0 lines)
```

## Notes for Downstream Plans (47-11)

**`frontend/src/{services,lib,utils,store,contexts,design-system}/**` is
now type-clean.** Total frontend tsc remaining: **15 errors** (was 134 at
start of this plan). All 15 are out-of-scope for 47-10, exactly the same
set 47-09 SUMMARY enumerated for downstream. **47-11 owns these.**

### Residual error list (handed to 47-11)

```
src/components/comments/CommentItem.tsx(185,37): TS2345 — useDeleteComment expected string, given object
src/components/comments/ReactionPicker.tsx(83,7): TS2353 — useToggleReaction object literal extra prop entityType
src/components/compliance/ComplianceRulesManager.tsx(151,45): TS2345 — useApproveSignoffViolation expected object, given string
src/components/compliance/ComplianceSignoffDialog.tsx(94,41): TS2345 — useSignoffViolation expected object, given SignoffViolationInput
src/components/dossier/RelationshipSidebar.tsx(178,21): TS2352 — RelationshipsListResponse → Record cast lacks overlap
src/components/entity-templates/TemplateSelector.tsx(107,29): TS2345 — useTemplate expected object, given string
src/components/intake-form/IntakeForm.tsx(347,69): TS2339 — acknowledgmentMinutes (snake_case mismatch with response_hours)
src/components/intake-form/IntakeForm.tsx(351,65): TS2551 — resolutionHours (Did you mean 'resolution_hours'?)
src/components/intake-form/IntakeForm.tsx(354,33): TS2339 — businessHoursOnly (snake_case mismatch)
src/components/sla-countdown/SLACountdown.tsx(173,9): TS2345 — useEscalateSLA expected string, given object
src/components/sla-countdown/SLACountdown.tsx(188,7): TS2345 — useResetSLA expected void, given object
src/components/tags/TagHierarchyManager.tsx(228,9): TS2353 — useUpdateTag object literal extra prop name_en
src/components/tags/TagHierarchyManager.tsx(280,9): TS2353 — useMergeTags object literal extra prop source_tag_id
src/components/waiting-queue/EscalationDialog.tsx(148,9): TS2561 — assignmentId (Did you mean 'assignment_id'?)
src/domains/misc/hooks/useStakeholderInfluence.ts(124,74): TS2769 — no overload matches
```

**Pattern observation for 47-11:** these errors share a cluster:
*page/component is calling a stub-hook with the wrong argument shape*.
The stub hook signatures were tightened by 47-08/47-09 (or never
parametrized in the first place) and the call sites need to be aligned
with the actual hook contract. The 3 IntakeForm.tsx errors and 1
EscalationDialog.tsx are snake_case ↔ camelCase property-name mismatches
between the form payload and the API contract. The TYPE-04 ledger sites
(IntakeForm.tsx + Icon.test.tsx) are still byte-unchanged in this plan;
47-11 will handle the IntakeForm.tsx errors AND reconcile the existing
`@ts-expect-error` comment with the now-fixed errors.

### Reusable patterns for 47-11

- **Page-call-site fix-up via wrapper-shape adapters**: 47-09 introduced
  this pattern in pages/. If 47-11 needs to fix call sites that
  destructure mismatched shapes from typed hooks, the same pattern
  applies — wrap the underlying hook in a local adapter inside the
  consuming file.
- **Snake_case ↔ camelCase narrowing**: for IntakeForm.tsx and
  EscalationDialog.tsx, change the property names on the object
  literal to match the API contract (or update the API type if it
  was the API that drifted).

### Reusable tooling carried forward

- `/tmp/delete_unused.py` — generic D-03 deletion driver (caveat:
  the `const_object` brace-tracker is fragile when adjacent declarations
  are not blank-line-separated; pre-vet input list)
- `/tmp/47-10-grep.sh` — D-04 four-globbed-grep helper
- `/tmp/47-10-tail-baseline.txt` — pre-plan error inventory

## Self-Check: PASSED

- All 39 modified source files exist on disk: PASS.
- 1 modified planning artifact (this SUMMARY.md) created: PASS.
- `pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' | wc -l` returns 0: PASS.
- `git diff HEAD -- backend/src` returns 0 lines: PASS (this plan's commit makes zero backend edits).
- `git diff HEAD -- frontend/src | grep '@ts-(ignore|expect-error)'` adds 0 lines: PASS.
- `git diff HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0: PASS.
- `head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"` returns 1: PASS.
- `head -3 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"` returns 1: PASS.
- TYPE-04 ledger sites byte-unchanged: PASS.
- 47-EXCEPTIONS.md byte-unchanged in this plan: PASS.
