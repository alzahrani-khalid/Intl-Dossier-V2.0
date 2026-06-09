# Approvals Workflow Inspection Report

**Date:** Wed 10 Jun 2026  
**Scope:** Read-only code + contract inspection of the approver-facing `/approvals` route; Sidebar Administration item `admin-approvals` and `badgeCount: counts.approvals`; page list, filters, stats, pending-approval/action affordances, and step-up MFA wiring; approval-related Supabase tables/RLS/edge functions; generated Supabase type validation; EN+AR i18n registration/parity, RTL/design-token compliance, and honest-UI checks  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only. The only file write is this report.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

Prior coverage note: positions/approval-chain internals were inspected in round 2 (`968378ba`; escalated: approval action UI #8-9, reassign stub #16). The admin reassignment panel `/admin/approvals` was i18n-fixed in `88812ddd` + `e5fe80e1`. This report does not re-review those internals; it targets the Sidebar item `admin-approvals` at `/approvals`, i.e. the pending-approvals queue shown to an approver.

---

## Scope

### Routes traced

| URL                        | Nav source                                                                                                                                                                                                                                                                                                                | Route file                                                         | Page / component                                                                                                                      | Result                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/approvals`               | Administration item `admin-approvals` at `frontend/src/components/layout/navigation-config.ts:212-216`; Administration group emitted only when `isAdmin` is true at `frontend/src/components/layout/navigation-config.ts:166-220`; Sidebar passes static counts at `frontend/src/components/layout/Sidebar.tsx:46,63-64`. | `frontend/src/routes/_protected/approvals/index.tsx:18-20`         | `MyApprovalsPage` with inline `fetchMyApprovals`, TanStack Query, three filter badges, three stat cards, and a linked positions list. | Mounted, but it is a generic under-review positions list, not a verified current-user pending-approval queue. No approve/reject/request-revisions/delegate action is mounted. |
| `/admin/approvals`         | Separate route, not this inspection target.                                                                                                                                                                                                                                                                               | `frontend/src/routes/_protected/admin/approvals.tsx:37-50`         | Admin reassignment panel.                                                                                                             | Uses `useTranslation('admin')` and its own `admin.approvals` keys; noted only to avoid duplicating prior admin-panel coverage.                                                |
| `/positions/$id/approvals` | Position detail approval-history tab.                                                                                                                                                                                                                                                                                     | `frontend/src/routes/_protected/positions/$id/approvals.tsx:27-31` | `ApprovalChain` history view.                                                                                                         | Prior coverage area; not re-reviewed here except to distinguish it from the queue route.                                                                                      |

### Child components & hooks

| Surface              | Files                                                                     | Role                                                                  | Current wiring                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Page shell / fetcher | `frontend/src/routes/_protected/approvals/index.tsx:24-43,45-53`          | Gets Supabase session and calls `positions-list?status=under_review`. | Active, but does not pass current approver, current stage, pagination, or filter state.                                                   |
| Filters              | `frontend/src/routes/_protected/approvals/index.tsx:47,72-92`             | All / Pending / Completed controls.                                   | UI state only; `filter` is in the query key but ignored by `fetchMyApprovals`. Badges are clickable spans, not keyboard-operable buttons. |
| Stats                | `frontend/src/routes/_protected/approvals/index.tsx:97-139`               | Pending / approved this month / returned for revisions cards.         | Pending is raw list length; approved and returned stats are hard-coded `0`.                                                               |
| List                 | `frontend/src/routes/_protected/approvals/index.tsx:142-184`              | Shows each position and links to `/positions/$id`.                    | No action controls, no detail drawer, no step-up MFA, and raw `author_id` is displayed as submitter.                                      |
| Step-up MFA          | `frontend/src/components/step-up-mfa/StepUpMFA.tsx:62-70,153-164,218-229` | Existing modal for elevated-token initiation/completion.              | Not imported or mounted by `/approvals`; repo search found only `PDFGeneratorButton` uses it.                                             |

### Backend / Supabase surfaces

| Surface                                                                                 | Role                                                                                               | Type validation against `database.types.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                  | Wired from `/approvals`?                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Edge Function `positions-list`                                                          | Lists positions, including `status=under_review`, with RLS-enforced Supabase user client.          | Selected columns `id`, `title_en`, `title_ar`, `thematic_category`, `status`, `current_stage`, `created_at`, `updated_at`, `version`, `emergency_correction`, `author_id` at `supabase/functions/positions-list/index.ts:84-99` validate against `frontend/src/types/database.types.ts:21683-21716`.                                                                                                                                                                         | Yes. This is the route's only backend read.                                                                                                                                                                                                         |
| Table `positions` + RLS                                                                 | Holds approval-chain JSON/current stage and controls visible under-review rows.                    | `approval_chain_config`, `current_stage`, `status`, and title columns validate at `frontend/src/types/database.types.ts:21683-21716`. RLS policy references `approvals.approver_id` for current-stage visibility at `supabase/migrations/20250101011_rls_positions.sql:17-30`; admin bypass at `:69-77`.                                                                                                                                                                     | Indirectly through `positions-list`. Live RLS behavior is **VERIFY vs live**.                                                                                                                                                                       |
| Table `approvals`                                                                       | Audit trail of approval actions. Also used by positions RLS as if it identifies current approvers. | Generated `approvals` shape validates columns at `frontend/src/types/database.types.ts:2451-2500`; migration defines action/step-up/delegation/reassign columns at `supabase/migrations/20250101005_create_approvals.sql:5-49`.                                                                                                                                                                                                                                              | Not directly read by `/approvals`; only affects RLS and action functions. Pending-assignment semantics are **VERIFY vs live** because `positions-submit` only flips `status/current_stage` at `supabase/functions/positions-submit/index.ts:40-45`. |
| Edge Functions `positions-approve`, `positions-request-revisions`, `positions-delegate` | Approval, revision request, and draft delegation functions.                                        | `positions-approve` and `positions-request-revisions` insert into typed `approvals` columns at `supabase/functions/positions-approve/index.ts:31-38` and `supabase/functions/positions-request-revisions/index.ts:20-26`. `positions-delegate` references `position_delegations` and `positions.delegates` at `supabase/functions/positions-delegate/index.ts:160-187,195-210`, but neither appears in the checked-in generated type; deployed schema is **VERIFY vs live**. | Not wired from `/approvals`.                                                                                                                                                                                                                        |
| Table `pending_role_approvals` + `approve-role-change`                                  | Separate dual-approval workflow for admin role changes.                                            | Migration defines it at `supabase/migrations/20251011214943_create_pending_role_approvals.sql:6-23`; policies at `supabase/migrations/20251011214948_setup_rls_policies.sql:100-136`. Repo search found no `pending_role_approvals` table in `frontend/src/types/database.types.ts`; **VERIFY vs live**.                                                                                                                                                                     | Not wired from `/approvals`; separate from position approvals.                                                                                                                                                                                      |
| Sidebar badge count                                                                     | Displays numeric badge next to `admin-approvals`.                                                  | No DB/type surface; `SECTION_BADGE_COUNTS` is a local constant.                                                                                                                                                                                                                                                                                                                                                                                                              | Wired, but always receives `0`.                                                                                                                                                                                                                     |

### i18n namespaces

| Namespace / key group           | Routes / components            | EN                                                                                             | AR                                                                               | Registered in `i18n/index.ts`                                                        | Notes                                                                                                                            |
| ------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `common.navigation.approvals`   | Sidebar label for `/approvals` | `frontend/src/i18n/en/common.json:136-156`                                                     | `frontend/src/i18n/ar/common.json:136-156`                                       | `translation` and `common` resources at `frontend/src/i18n/index.ts:254-258,381-384` | EN+AR nav key exists.                                                                                                            |
| `approvals.*` default namespace | Active `/approvals` route      | No `frontend/src/i18n/en/approvals.json`; keys only appear as fallback defaults in route code. | No `frontend/src/i18n/ar/approvals.json`; Arabic falls back to English defaults. | No `approvals` namespace in resources at `frontend/src/i18n/index.ts:254-506`.       | No dot-form leak expected because every active call supplies `defaultValue`, but AR parity is missing.                           |
| `admin.approvals.*`             | `/admin/approvals` only        | `frontend/src/i18n/en/admin.json:32-54`                                                        | `frontend/src/i18n/ar/admin.json:32-54`                                          | `admin` resource at `frontend/src/i18n/index.ts:366,492`                             | Key diff verified: 47 EN keys, 47 AR keys, no missing keys. Not used by `/approvals`.                                            |
| `positions.stepUp.*`            | `StepUpMFA`                    | `frontend/src/i18n/en/positions.json`                                                          | `frontend/src/i18n/ar/positions.json`                                            | `positions` resource at `frontend/src/i18n/index.ts:262,388`                         | Step-up namespace exists but is not mounted by `/approvals`. Whole-file diff has one unrelated `positions.status.review` AR gap. |

Active-route RTL/design-token scan: the route mostly uses direction-neutral layout utilities (`gap`, `items-end`, `text-muted-foreground`, semantic colors like `bg-warning/10`, `text-success`, `text-danger`). No major left/right utility violation was found in `/approvals`. The actionable design/a11y issue is that filter badges are used as clickable controls and the UI advertises non-functional filters/stats.

---

## Environment

| Check                             | Result                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend health                    | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T21:44:37.838Z","environment":"development"}` |
| Frontend `/approvals` shell       | `HEAD http://127.0.0.1:5175/approvals` -> **200** SPA HTML (`Content-Type: text/html`)                                             |
| Frontend `/admin/approvals` shell | `HEAD http://127.0.0.1:5175/admin/approvals` -> **200** SPA HTML (`Content-Type: text/html`)                                       |
| Authenticated browser UAT         | Not performed; inspection stayed read-only and did not send write requests.                                                        |
| Live Supabase DB/RLS/schema       | Not probed with auth. Deployed table shapes, RLS behavior, and trigger/edge-function coverage are **VERIFY vs live**.              |
| Typecheck / tests                 | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint.                          |
| Worktree note                     | Existing modified file observed: `frontend/src/routeTree.gen.ts`. It was not touched.                                              |

---

## Findings

### 1. [APPROVALS-QUEUE] `/approvals` is not a verified current-user pending-approvals queue

**Severity:** HIGH  
**Location:** `frontend/src/routes/_protected/approvals/index.tsx:24-42,49-53`, `frontend/src/components/layout/navigation-config.ts:166-217`, `frontend/src/components/layout/Sidebar.tsx:46,63-64`, `supabase/functions/positions-list/index.ts:84-99,133-151`, `supabase/migrations/20250101011_rls_positions.sql:17-30,69-77`, `supabase/functions/positions-submit/index.ts:40-45`

**Root cause:** The page title says "My Approvals", but the fetcher calls the generic `positions-list?status=under_review` endpoint. It sends no current-user, current-stage, approver, delegation, or pagination parameter. The Sidebar also hides this route inside the admin-only Administration group, so ordinary approvers do not discover it via navigation, while direct-link access has only the parent `_protected` auth guard. The backend query relies on `positions` RLS for user scoping, but that RLS checks `approvals.approver_id` at the current stage. The `approvals` table is defined as an audit trail of actions, and `positions-submit` only updates `status='under_review'` and `current_stage=1`; no inspected submit path creates pending approval assignments.

**Suggested fix:** Add a dedicated pending-approvals contract for the current user. It should resolve assigned approvers from the canonical source (`approval_chain_config`, a real pending-approval table, or normalized assignment rows), include delegations/reassignments if supported, and return count/list data scoped to the authenticated approver. Move `/approvals` navigation out of admin-only visibility if it is meant for approvers, or rename it if it is actually an admin queue. Mark RLS/assignment behavior **VERIFY vs live** before closing.

---

### 2. [APPROVALS-ACTIONS] The approver queue has no approve, request-revisions, reject, delegate, or step-up MFA flow

**Severity:** HIGH  
**Location:** `frontend/src/routes/_protected/approvals/index.tsx:6-16,142-176`, `frontend/src/components/step-up-mfa/StepUpMFA.tsx:62-70,153-164,218-229`, `supabase/functions/positions-approve/index.ts:9-15,31-38`, `supabase/functions/positions-request-revisions/index.ts:8-26`, `supabase/functions/positions-delegate/index.ts:14-19`

**Root cause:** The active queue renders each row as a link to `/positions/$id`; it imports no action buttons, mutation hooks, dialog components, or `StepUpMFA`. The repo has a `StepUpMFA` component and position action edge functions, but `/approvals` does not mount or call them. There is also no inspected `positions-reject` function; the implemented negative action is `positions-request-revisions`.

**Suggested fix:** Decide whether `/approvals` is an action queue or a review-only inbox. If it is an action queue, add approve and request-revisions controls wired through `StepUpMFA` and the position action functions, with explicit loading/error states and query invalidation. If actions intentionally live only on the position detail page, the queue should say so honestly and deep-link users to the actionable section.

---

### 3. [APPROVALS-BADGE] Sidebar `counts.approvals` is a hard-coded zero

**Severity:** MEDIUM  
**Location:** `frontend/src/components/layout/Sidebar.tsx:46,63-64,172-176`, `frontend/src/components/layout/navigation-config.ts:212-216`

**Root cause:** The badge path exists, but `Sidebar` calls `createNavigationGroups(SECTION_BADGE_COUNTS, isAdmin)` where `SECTION_BADGE_COUNTS` is `{ tasks: 0, approvals: 0, engagements: 0 }`. `navigation-config.ts` correctly attaches `badgeCount: counts.approvals` to `admin-approvals`, but no live query or store ever supplies the count. The route can have pending items while the nav badge remains absent.

**Suggested fix:** Wire `counts.approvals` to the same canonical pending-approvals count contract as finding 1. Until that contract exists, remove the badge plumbing for approvals or document it as intentionally unavailable to avoid a false zero.

---

### 4. [APPROVALS-HONEST-UI] Filters and stats are visible but not functional

**Severity:** MEDIUM  
**Location:** `frontend/src/routes/_protected/approvals/index.tsx:47-52,72-92,97-139,142-184`

**Root cause:** The All / Pending / Completed controls mutate local `filter` state and change the query key, but `fetchMyApprovals` ignores the filter and always requests `status=under_review`. "Approved This Month" and "Returned for Revisions" are hard-coded to `0`, while "Pending" is just the length of whatever `positions-list` returned. The filters are also clickable `Badge` elements with no button semantics, keyboard handling, or pressed state.

**Suggested fix:** Either remove the inactive controls/stat cards or wire them to real list/status counts. Use buttons, tabs, or a segmented control with accessible names and selected state. Derive approved/revisions metrics from the canonical approvals endpoint rather than hard-coded values.

---

### 5. [APPROVALS-I18N] Active `/approvals` copy falls back to English in Arabic

**Severity:** MEDIUM  
**Location:** `frontend/src/routes/_protected/approvals/index.tsx:46,68-91,107,121,135,158,163,169,182`, `frontend/src/i18n/index.ts:254-506`, `frontend/src/i18n/en/common.json:136-156`, `frontend/src/i18n/ar/common.json:136-156`, `frontend/src/i18n/en/admin.json:32-54`, `frontend/src/i18n/ar/admin.json:32-54`

**Root cause:** The active route uses default `useTranslation()` and calls keys like `approvals.myApprovals`, `approvals.stats.approved`, and `approvals.noPositions` with English fallback strings. There is no registered `approvals` namespace and no `frontend/src/i18n/en|ar/approvals.json`. The Sidebar nav label is translated through `common.navigation.approvals`, and `/admin/approvals` has parity through `admin.approvals`, but those do not cover `/approvals`.

**Suggested fix:** Add a registered `approvals` namespace with EN+AR parity and use `useTranslation('approvals')`, or move the active route keys into an existing registered namespace and reference it explicitly. Add a key-diff check for the new namespace. Keep default values only as developer fallback, not as the primary Arabic UI.

---

### 6. [APPROVALS-CONTRACT] Approval-adjacent backend contracts are split and some generated types are stale

**Severity:** MEDIUM  
**Location:** `frontend/src/types/database.types.ts:2451-2500,21683-21716`, `supabase/migrations/20251011214943_create_pending_role_approvals.sql:6-23`, `supabase/migrations/20251011214948_setup_rls_policies.sql:100-136`, `supabase/functions/approve-role-change/index.ts:176-177,239-243,329-333,424-428`, `supabase/functions/positions-delegate/index.ts:160-187,195-210`

**Root cause:** The route name and nav copy say approvals, but the repo contains at least three approval-adjacent models: position action audit rows in `approvals`, role-change approvals in `pending_role_approvals`, and draft editing delegation in `position_delegations` / `positions.delegates`. Only `approvals` and `positions` appear in the checked-in generated frontend database types. `pending_role_approvals` has migrations and edge-function usage but no generated type entry, and `positions-delegate` references `position_delegations` plus `positions.delegates`, neither of which appears in the generated `positions` type.

**Suggested fix:** For this queue, document which approval model it owns. Regenerate database types from the live schema and either migrate the missing tables/columns into the generated contract or remove/deprecate stale function references. Keep role-change approvals separate from position approvals unless product explicitly wants one combined approvals inbox. All schema claims here are **VERIFY vs live**.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope                                                                                               | Why                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 4          | Remove or correctly wire inactive filters/stats; replace clickable badges with accessible controls. | Route-local UI cleanup with no schema decision required if inactive controls are removed. |
| 5          | Add `/approvals` EN+AR keys and explicit namespace usage.                                           | Localized copy can be added without changing workflow semantics.                          |
| 3          | Remove the false approvals badge until a real count endpoint exists.                                | Avoids misleading UI while the planned count contract is designed.                        |

### (B) Needs planned phase

| Finding ID | Scope                                                                                            | Why                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1          | Canonical current-user pending-approvals source and nav/route policy.                            | Requires deciding how pending approvers are assigned and exposed, plus RLS/live-schema verification. |
| 2          | Approve/request-revisions/delegate action queue with step-up MFA.                                | Requires workflow/product decisions and mutation wiring; should follow the canonical queue contract. |
| 3          | Real `counts.approvals` query.                                                                   | Depends on the same canonical pending-approvals count/list source as finding 1.                      |
| 6          | Schema/type normalization across `approvals`, `pending_role_approvals`, and delegation surfaces. | Requires live DB verification, type regeneration, and possible migration/deprecation work.           |

Summary: `/approvals` is mounted and visible from the admin Sidebar, but it is not yet a reliable approver-facing pending queue. It reads generic under-review positions, has no current-user queue contract, does not mount approval actions or step-up MFA, shows inactive filters and hard-coded stats, and has a placeholder badge count. The active route's own copy is not localized into Arabic. The generated types validate the immediate `positions`/`approvals` columns used by the current list and audit functions, but role-approval and delegation-adjacent surfaces need **VERIFY vs live** before they are folded into this workflow.

Recommended phase order: first define the canonical pending-approval model and route/nav access policy; then add a typed list/count endpoint for current-user approvals; then wire `/approvals` actions through step-up MFA or explicitly make the route review-only; then normalize approval-adjacent schemas and regenerate types; finally land i18n, a11y, RTL, and honest-UI cleanup.
