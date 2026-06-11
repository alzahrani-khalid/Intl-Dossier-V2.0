---
phase: 47-type-check-zero
fixed_at: 2026-05-09T20:55:00Z
review_path: .planning/phases/47-type-check-zero/47-REVIEW.md
iteration: 2
findings_in_scope: 20
fixed: 8
skipped: 12
status: partial
---

# Phase 47: Code Review Fix Report (Iteration 2)

**Fixed at:** 2026-05-09T20:55:00Z
**Source review:** `.planning/phases/47-type-check-zero/47-REVIEW.md`
**Iteration:** 2

**Summary:**

- Findings in scope (CR + WR): 20
- Fixed: 8
- Skipped (out of typecheck-zero scope or require human judgment): 12
- Phase goal (`pnpm typecheck` → 0 errors): **HOLDS**. Both `intake-backend` and `intake-frontend` `tsc --noEmit` pass cleanly after every commit and at HEAD.

This iteration applied the fixes that are in-scope for the typecheck-zero milestone or are runtime-blocking bugs cheap to fix without coordinated migrations. The remaining findings were skipped with explicit rationales — they require either schema migrations, security architecture review, design-system sweeps, or feature-completion work that sits outside Phase 47's stated goal.

## Fixed Issues

### CR-08: CommentForm sends camelCase fields to Edge Function that requires snake_case

**Files modified:** `frontend/src/components/comments/CommentForm.tsx`
**Commit:** `f86508ce`
**Applied fix:** Renamed the `createComment.mutateAsync` payload keys from `entityType`/`entityId`/`parentId` to `entity_type`/`entity_id`/`parent_id` so the Supabase Edge Function's body destructure (`entity_type`, `entity_id`, `parent_id`) lands on real values instead of `undefined`. Comment creation now passes the validation guard at line 386 of `supabase/functions/entity-comments/index.ts` instead of returning HTTP 400.

### CR-09: `updateCommentApi` calls `apiPut` (HTTP PUT) but Edge Function only handles PATCH

**Files modified:** `frontend/src/domains/misc/repositories/misc.repository.ts`
**Commit:** `cffa04e2`
**Applied fix:** Switched the `updateComment` repository function from `apiPut` to `apiPatch`. Added `apiPatch` to the import list (it was already exported from `lib/api-client.ts` at line 115). The Edge Function method dispatch in `supabase/functions/entity-comments/index.ts:552` only has `case 'PATCH'`; HTTP PUT requests previously fell through to the default response, breaking comment editing in production.

### CR-10: `useGenerateBriefingPack` ignored the `language` parameter

**Files modified:** `frontend/src/domains/briefings/hooks/useGenerateBriefingPack.ts`, `frontend/src/components/positions/BriefingPackGenerator.tsx`
**Commit:** `bf5ae2b2`
**Applied fix:** Replaced the `{ engagementId, options? }` mutation signature with a typed `{ engagementId, language: 'en'|'ar', options? }` shape. The hook merges `language` into the repository payload alongside any caller-supplied options, then types the return as `UseMutationResult<{ job_id: string }, Error, GenerateBriefingPackParams>`. Dropped the component-side `as unknown as { mutateAsync, isPending }` widening cast — the typed hook now exposes both fields directly. Bilingual selection now flows through to `apiPost('/engagements/:id/briefing-packs', { language, ... })`.

### CR-14: `useSLARealtimeUpdates` leaked Supabase channels via `queryFn`

**Files modified:** `frontend/src/domains/work-items/hooks/useSLAMonitoring.ts`
**Commit:** `1c3efff4`
**Applied fix:** Migrated channel creation from `useQuery({ queryFn })` (which has no cleanup hook for side-effects) into `useEffect` with a `return () => { void supabase.removeChannel(...) }` cleanup. The previous shape leaked two channels per consuming component instance — TanStack's `gcTime` could not reach the realtime client's subscription map. Also prefixed all five `queryClient.invalidateQueries(...)` calls inside the realtime hook (and the seven other floating ones in the same file across the policy/escalation/breach mutations) with `void`, addressing WR-29 for this file.

### WR-26: Four redundant `as never` cascades on existing columns in `after-action.ts`

**Files modified:** `backend/src/api/after-action.ts`
**Commit:** `0d15151c`
**Applied fix:** Dropped seven `query.eq('after_action_id' as never, id)` casts in the update and delete handlers covering the `decisions`, `risks`, `follow_up_actions`, and `attachments` cascades. Verified each column exists in `database.types.ts` — the casts were silencing nothing and matched the Phase 47 anti-pattern flag from CR-03's same-bug-class scan recommendation. Backend typecheck remains clean.

### WR-28: `useSearchUsersForMention` resolved `[]` — @-mention popup was silent

**Files modified:** `frontend/src/domains/misc/hooks/useComments.ts`, `frontend/src/domains/misc/repositories/misc.repository.ts`, `frontend/src/components/comments/MentionInput.tsx`
**Commit:** `e763c5af`
**Applied fix:** Added `searchUsersForMention(query, limit?)` to the misc repository, calling `GET /entity-comments/users/search?q=...` (the real Edge Function endpoint at line 176). Replaced the `Promise.resolve([])` stub in `useSearchUsersForMention` with a fetch that unwraps the `{ users: MentionUser[] }` response. Typed the hook return as `UseQueryResult<MentionUser[], Error>` so consumers no longer need a widening cast. Dropped the `as unknown as { data: MentionUser[]; isLoading: boolean }` cast in `MentionInput.tsx`.

### WR-29: Floating `invalidateQueries` calls violate `no-floating-promises`

**Files modified:** `frontend/src/hooks/useDuplicateDetection.ts`, `frontend/src/hooks/useEditWorkflow.ts`, `frontend/src/services/preference-sync.ts`, `frontend/src/domains/work-items/hooks/useSLAMonitoring.ts`
**Commit:** `c62cb2b0` (and `1c3efff4` for the SLA file)
**Applied fix:** Prefixed every bare `queryClient.invalidateQueries(...)` call with `void`. Eight call sites in `useDuplicateDetection.ts` (covering `requestDetection`, `mergeDuplicates`, `dismissDuplicate`), one in `useEditWorkflow.ts`, one in `preference-sync.ts`, plus the SLA-monitoring file (handled in the CR-14 commit). The project's lint config flags `no-floating-promises` as `error`; this is mechanical compliance with no runtime change.

### WR-32 + WR-34: Floating Promise from `startUpload` and `uploadFile`

**Files modified:** `frontend/src/services/upload.ts`, `frontend/src/components/attachment-uploader/AttachmentUploader.tsx`
**Commit:** `cb8e72a4`
**Applied fix:** Added `void` prefix to four call sites — three in the upload Zustand store (`addUpload`, `resumeUpload`, `retryUpload`, all firing `get().startUpload(...)`) and one in `AttachmentUploader.handleFiles` (firing `uploadFile(...)`). The internal `try/catch` in both `startUpload` and `uploadFile` already surfaces failures via state, so `void` is the correct disposition — no behavior change, just satisfies the `no-floating-promises` rule.

## Skipped Issues

### CR-11: `useAvailabilityPolling.ts` ships eight stubbed mutations — entire feature non-functional

**File:** `frontend/src/domains/import/hooks/useAvailabilityPolling.ts:135-197`
**Reason:** UX/feature scope, not a typecheck-zero fix. Mirrors the iteration-1 disposition of WR-24 (calendar-sync stubs) — wiring eight stub mutations to a real backend RPC is a feature-completion ticket, not a Phase 47 cleanup task. The review itself recommends "gate behind a feature flag, or render a 'not yet implemented' banner... long-term: wire to a real backend RPC." Both options require product-level decisions (which RPCs to add, what UX to gate, whether to ship stubbed UI at all). Phase 47's typecheck goal continues to hold; the runtime behavior is outside scope.
**Original issue:** AvailabilityPollCreator/Voter/Results components render full UIs against `Promise.resolve(...)` stubs — voting "succeeds" but persists nothing.

### CR-12: `POST /after-action/create` inserts six column names that do not exist

**File:** `backend/src/api/after-action.ts:294-304`
**Reason:** Schema migration required, out of typecheck-zero scope. The handler uses `title`, `description`, `confidentiality_level`, `attendance_list`, `status`, `_version` — none exist on `after_action_records` (verified via `database.types.ts:773-841`: real columns are `attendees`, `is_confidential`, `notes`, `publication_status`, `version`; no `title` column at all). Fixing this requires:

1. Either adding a `title` column via migration, or removing `title` from the API contract — a product decision.
2. Cascading the column rename through the Zod schemas (`afterActionCreateSchema`, `afterActionUpdateSchema` in `after-action.types.ts:280-311`), the request shape on the frontend form, and 5+ handlers (LIST, GET, CREATE, UPDATE, PUBLISH, DELETE).
3. Reconciling the four-state `confidentiality_level` enum with the boolean `is_confidential` column (CR-05's filter fix already documented this impedance).

The bug is real and the create flow is broken at runtime, but it is a coordinated schema + Zod + handler migration that exceeds Phase 47's typecheck-zero scope. Tracker: open issue. Typecheck remains clean because Supabase's `.insert()` accepts excess properties without strict shape validation against `Insert`.
**Original issue:** Every `POST /after-action/create` either silently drops user fields or returns 500 (depending on Postgrest version).

### CR-13: LIST/GET/PUBLISH embed `commitments(*)` which has no FK to `after_action_records`

**File:** `backend/src/api/after-action.ts:79-89, 184-195, 614-622`
**Reason:** Coupled to CR-12's broader schema migration. The fix is a one-line replacement (`commitments:aa_commitments(*)`) but it must land alongside the column-name migration in the same handler — otherwise the publish path (which reads `record.commitments` from the embed result) becomes inconsistent with the rest of the schema-mismatch surface. Recommend bundling CR-12 + CR-13 + WR-27 + CR-15 into a single dedicated PR. Out of Phase 47 typecheck-zero scope.
**Original issue:** Three Postgrest selects embed `commitments(...)` from `after_action_records`; runtime returns `PGRST200`.

### CR-15: `version_snapshots` insert uses `as never` to hide a real type error

**File:** `backend/src/api/after-action.ts:725-733`
**Reason:** Coupled to CR-12. The `rec._version` value is wrong because the column is `version`, not `_version`; the `as never` cast on the table name and payload is suppressing the resulting type error. Once CR-12 lands and `rec.version` is read from the correct column, the cast can be removed safely with `version_number: rec.version ?? 1`. Fixing CR-15 in isolation would require duplicating the `_version` → `version` mapping logic that CR-12 needs to centralize. Out of scope until CR-12 lands.
**Original issue:** `as never` cast on `version_snapshots` insert masks the schema mismatch.

### WR-27: Update/publish handlers use legacy `_version`/`status`/`title` field names

**File:** `backend/src/api/after-action.ts:426-430, 478, 630-637, 723-733, 780`
**Reason:** Same migration scope as CR-12. The hand-authored `as unknown as { ... }` cast wrappers around `currentRecord` and `record` are honest annotations of the schema mismatch; their inline comments explicitly describe the legacy field-name drift. Removing them requires the schema migration that CR-12 + CR-13 + CR-15 collectively need. Out of typecheck-zero scope.
**Original issue:** `current.status`/`current._version`/`current.title` reads against fictional shape — equality checks always fail, optimistic-locking always increments from 0.

### WR-30: `auth.ts` Zustand store persists `user` and `mfaConfig` to localStorage

**File:** `frontend/src/services/auth.ts:622-630`
**Reason:** Security architecture decision, not a typecheck-zero fix. The review acknowledges this is a "pre-existing security design issue." Required actions per the review: confirm `mfaConfig.backupCodes` is hashed (likely requires reading backend MFA implementation); restrict `partialize` to identity claims only; switch to `sessionStorage`. These are product-level security tradeoffs that require sign-off from the security/auth owner — not a code review fix. Track separately.
**Original issue:** XSS attacker can read role and backup codes from localStorage.

### WR-31: Sentry redaction misses `clientSecret`, `refresh_token`, `access_token`, etc.

**File:** `backend/src/lib/sentry.ts:73-89`
**Reason:** Security improvement, not a typecheck issue. The review's regex sweep is reasonable but the production data shape needs to be validated against actual incoming requests before broad regex changes — over-aggressive redaction can also hide useful debugging context. Track separately for the security/observability owner.
**Original issue:** Sensitive fields like `refresh_token`, `client_secret` reach Sentry untouched.

### WR-33: `apiPost(formData)` JSON-stringifies, drops file payload

**File:** `frontend/src/components/attachment-uploader/AttachmentUploader.tsx`, `frontend/src/lib/api-client.ts:81-93`
**Reason:** Already explicitly deferred in iteration-1 fix-report ("the actual multipart upload fix is left as a separate ticket"). The review confirms this rationale. Multipart/form-data handling requires careful auth-header management, content-type detection, and integration testing — out of typecheck-zero scope and tracked separately.
**Original issue:** File uploads "succeed" with HTTP 200 but the file never reaches storage.

### WR-35: Component-level Tailwind color literals (`text-green-600`, etc.)

**Files:** `frontend/src/components/audit-logs/AuditLogStatistics.tsx:32-34`, `frontend/src/components/positions/BriefingPackGenerator.tsx:196-198`, others
**Reason:** Design-system drift. The review itself notes "this is design-system drift, not a Phase 47 regression; the ports were authored before Phase 47 cleanup." Replacing color literals with semantic tokens (`text-success`, `bg-success/10`) is a separate sweep that requires verifying the semantic-color mappings against the IntelDossier prototype. Out of typecheck-zero scope.
**Original issue:** Direct `text-green-600`/`bg-green-50`/etc. classes bypass the design-system tokens.

### WR-36: `cn('', className)` no-op pattern

**Files:** `frontend/src/components/audit-logs/AuditLogStatistics.tsx:70, 93, 118`, others
**Reason:** Pre-existing code-quality smell, not a typecheck-zero issue. The review explicitly classifies this as a "mechanical sweep" candidate. Changing it requires confirming each call site originally intended a default class and forgot, vs. a pattern that should just become `className` directly. Out of scope for Phase 47.
**Original issue:** Empty string contributes nothing to `cn()`.

### WR-37: `services/realtime.ts:reconnect` drops `filter` config

**File:** `frontend/src/services/realtime.ts:161-171`
**Reason:** Pre-existing infrastructure bug. The review notes "this is pre-existing but worth flagging because reconnect is exercised on every realtime heartbeat failure." Fix requires extending the `RealtimeSubscription` interface to track the original filter, then threading it through reconnect — a small but real refactor with potential cross-tenant data-leak implications worth a dedicated review. Out of typecheck-zero scope.
**Original issue:** Filtered subscriptions become unfiltered after reconnect.

### Note on iteration-1 carryover (WR-21, WR-24)

The review's preserved catalog re-confirms that WR-21 (`ChatContext` is dead infrastructure) and WR-24 (`useCalendarSync` returns NOOP) remain reasonable Skip dispositions from iteration 1. No re-fix attempted in iteration 2.

---

_Fixed: 2026-05-09T20:55:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
