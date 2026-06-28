# Implementation Lanes — disjoint-file plan

**Branch:** `fix/prod-quality-sweep-260627` · **HARD CONSTRAINT:** no source file appears in
more than one lane (workers run in parallel and must never edit the same file). All DB migrations
live in **one** lane (`L0-db`) because they serialize against the shared staging DB
(`zkrcjzdemdmwhearhfgg`), applied via the Supabase MCP, not files.

Lanes are ordered by the required priority: **security → silent-data-loss/save-broken → honesty →
validation → i18n → error-surfacing.** Each lane has a `_impl-brief-<lane>.md`.

---

## Lane summaries (priority order)

### L0-db — privilege-escalation guards (DB only) · priority 1 (security)

**Items:** D-1, D-2. **Files:** none (two `BEFORE UPDATE` triggers applied via Supabase MCP).
**Dep:** apply **after** L1 confirms admin edge fns (`assign-role`, `create-user`, deactivate/
reactivate) write `role`/`clearance_level`/`is_active` via the **service-role** client — else the
triggers would block the legit admin path. Independently verifiable via read-only SQL.

### L1-auth — server + client auth/MFA/admin-authz · priority 2 (security)

**Items:** D-3, D-11, D-12, D-13, D-14, D-22≡D-25, D-23, D-24, D-26, D-27, D-29, D-31.
**Files (11):** `backend/src/services/auth.service.ts`; `supabase/functions/create-user/index.ts`;
`supabase/functions/assign-role/index.ts`; `supabase/functions/deactivate-user/index.ts`;
`supabase/functions/reactivate-user/index.ts`; `supabase/functions/user-permissions/index.ts`;
`frontend/src/store/authStore.ts`; `frontend/src/auth/LoginPage.tsx`;
`frontend/src/auth/ResetPasswordPage.tsx`; `frontend/src/components/step-up-mfa/StepUpMFA.tsx`;
`frontend/src/lib/auth/require-admin.ts`.

### L2-settings-admin — settings save + ai-admin + notifications · priority 3 (save-broken/honesty)

**Items:** D-4≡E-1, D-5, D-6≡E-4, D-7, D-8, D-9(disable), D-16/D-28, D-17, D-18, D-20, D-21, D-30, D-39(partial).
**Files (12):** `frontend/src/pages/settings/SettingsPage.tsx`;
`frontend/src/components/settings/sections/ProfileSettingsSection.tsx`;
`.../sections/SecuritySettingsSection.tsx`; `.../sections/DataPrivacySettingsSection.tsx`;
`.../sections/NotificationsSettingsSection.tsx`; `.../sections/AppearanceSettingsSection.tsx`;
`.../sections/AccessibilitySettingsSection.tsx`; `.../sections/GeneralSettingsSection.tsx`;
`frontend/src/routes/_protected/admin/ai-settings.tsx`;
`frontend/src/routes/_protected/admin/ai-usage.tsx`;
`frontend/src/hooks/useNotificationCenter.ts`; `supabase/functions/notifications-center/index.ts`.

### L3-commitments-aa — after-action commitments · priority 4 (silent-data-loss, CRITICAL B-1)

**Items:** B-1≡C-1, B-6, B-7, B-9, B-17≡E-22, B-19≡E-18, B-20, E-6(CommitmentForm), E-19.
**Files (11):** `supabase/functions/after-actions-create/index.ts`;
`supabase/functions/detect-overdue-commitments/index.ts`;
`frontend/src/components/commitment-editor/CommitmentEditor.tsx`;
`frontend/src/components/after-action-form/AfterActionForm.tsx`;
`frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx`;
`frontend/src/hooks/useAfterAction.ts`; `frontend/src/services/commitments.service.ts`;
`frontend/src/components/commitments/CommitmentForm.tsx`;
`frontend/src/components/commitments/deliverables/AddDeliverableDialog.tsx`;
`frontend/src/i18n/en/commitments.json`; `frontend/src/i18n/ar/commitments.json`.

### L4-tasks-workboard — tasks + kanban + task i18n · priority 5 (silent-data-loss/i18n)

**Items:** B-2, B-3, B-4, B-21, B-22≡E-11, B-23, B-24, B-25, B-26.
**Files (13):** `supabase/functions/tasks-create/index.ts`;
`supabase/functions/tasks-update/index.ts`; `frontend/src/components/tasks/TaskEditDialog.tsx`;
`frontend/src/components/tasks/DeleteTaskDialog.tsx`; `frontend/src/components/tasks/ConflictDialog.tsx`;
`frontend/src/hooks/useTasks.ts`; `frontend/src/hooks/useUnifiedKanban.ts`;
`frontend/src/pages/WorkBoard/WorkBoard.tsx`;
`frontend/src/components/unified-kanban/utils/column-definitions.ts`;
`frontend/src/components/unified-kanban/utils/status-transitions.ts`;
`frontend/src/i18n/en/tasks-page.json`; `frontend/src/i18n/ar/tasks-page.json`;
`frontend/src/components/tasks/TaskDetail.tsx` (opportunistic LOW only).

### L5-work-palette-intake — work-creation palette + intake · priority 6 (validation/honesty)

**Items:** B-5, B-8, B-10, B-11, B-12, B-13≡E-13, B-14, B-15, B-16, B-27, B-28, B-29, E-6(QuickForm), E-30.
**Files (12):** `frontend/src/components/work-creation/forms/TaskQuickForm.tsx`;
`.../forms/CommitmentQuickForm.tsx`; `.../forms/IntakeQuickForm.tsx`;
`frontend/src/components/work-creation/WorkCreationPalette.tsx`;
`frontend/src/components/work-creation/WorkCreationProvider.tsx`;
`frontend/src/components/work-creation/DossierPicker.tsx`;
`supabase/functions/intake-tickets-create/index.ts`;
`supabase/functions/intake-tickets-update/index.ts`;
`supabase/functions/intake-tickets-assign/index.ts`;
`frontend/src/components/intake-form/IntakeForm.tsx`;
`frontend/src/i18n/en/intake.json`; `frontend/src/i18n/ar/intake.json`.

### L6-dossier-wizard — create-wizard validation + office_type · priority 7 (validation)

**Items:** A-3≡E-5, A-4, A-5(folded), A-6.
**Files (5):** `frontend/src/components/Dossier/wizard/hooks/useCreateDossierWizard.ts`;
`frontend/src/components/ui/form-wizard.tsx`;
`frontend/src/components/Dossier/wizard/config/engagement.config.ts`;
`frontend/src/components/Dossier/wizard/steps/OfficeTermStep.tsx`;
`frontend/src/components/Dossier/wizard/config/person.config.ts`.

### L7-positions-calendar-rel-mou — assorted entity forms · priority 8 (honesty/error/i18n)

**Items:** C-2, C-4, C-5≡E-9, C-6, C-7, C-8, C-9, C-10, C-11, E-2, E-7, E-14, E-15, E-16, E-17, E-23, E-24, E-25 (+ C-3/D-? honest-disables noted).
**Files (15):** `frontend/src/components/positions/AttachPositionDialog.tsx`;
`frontend/src/components/positions/PositionDossierLinker.tsx`;
`frontend/src/components/position-editor/PositionEditor.tsx`;
`frontend/src/components/positions/AttachmentUploader.tsx`;
`frontend/src/components/calendar/CalendarEntryForm.tsx`;
`supabase/functions/calendar-create/index.ts`;
`frontend/src/domains/calendar/hooks/useRecurringEvents.ts`;
`frontend/src/components/relationships/RelationshipForm.tsx`;
`frontend/src/pages/MoUs/MousPage.tsx`;
`frontend/src/components/legislation/LegislationForm.tsx`;
`frontend/src/components/contacts/InteractionNoteForm.tsx`;
`frontend/src/i18n/en/common.json`; `frontend/src/i18n/ar/common.json`;
`frontend/src/i18n/en/positions.json`; `frontend/src/i18n/ar/positions.json`.
_Large lane; may be split into L7a (positions+attachments+positions.json) / L7b (calendar+rel+mou+
legislation+contacts+common.json) for more parallelism — the file groups are already disjoint._

### L8-shared-client — centralized client infra · priority 9 (error-surfacing/a11y, app-wide)

**Items:** E-3≡S1, E-10≡S6. **Files (2):** `frontend/src/lib/api-client.ts`;
`frontend/src/components/ui/form.tsx`. **Isolated by design:** `api-client.ts` is consumed by
~22 repositories and `ui/form.tsx` (`FormMessage`) by every RHF form — nothing else may edit them.

---

## File → Lane disjointness proof

Every source file edited by a FIX-NOW lane, listed **exactly once**. No path repeats → lanes are
file-disjoint. (L0 edits no files; it applies DB triggers via the Supabase MCP.)

| #   | File                                                                         | Lane               |
| --- | ---------------------------------------------------------------------------- | ------------------ |
| 1   | `backend/src/services/auth.service.ts`                                       | L1                 |
| 2   | `supabase/functions/create-user/index.ts`                                    | L1                 |
| 3   | `supabase/functions/assign-role/index.ts`                                    | L1                 |
| 4   | `supabase/functions/deactivate-user/index.ts`                                | L1                 |
| 5   | `supabase/functions/reactivate-user/index.ts`                                | L1                 |
| 6   | `supabase/functions/user-permissions/index.ts`                               | L1                 |
| 7   | `frontend/src/store/authStore.ts`                                            | L1                 |
| 8   | `frontend/src/auth/LoginPage.tsx`                                            | L1                 |
| 9   | `frontend/src/auth/ResetPasswordPage.tsx`                                    | L1                 |
| 10  | `frontend/src/components/step-up-mfa/StepUpMFA.tsx`                          | L1                 |
| 11  | `frontend/src/lib/auth/require-admin.ts`                                     | L1                 |
| 12  | `frontend/src/pages/settings/SettingsPage.tsx`                               | L2                 |
| 13  | `frontend/src/components/settings/sections/ProfileSettingsSection.tsx`       | L2                 |
| 14  | `frontend/src/components/settings/sections/SecuritySettingsSection.tsx`      | L2                 |
| 15  | `frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx`   | L2                 |
| 16  | `frontend/src/components/settings/sections/NotificationsSettingsSection.tsx` | L2                 |
| 17  | `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx`    | L2                 |
| 18  | `frontend/src/components/settings/sections/AccessibilitySettingsSection.tsx` | L2                 |
| 19  | `frontend/src/components/settings/sections/GeneralSettingsSection.tsx`       | L2                 |
| 20  | `frontend/src/routes/_protected/admin/ai-settings.tsx`                       | L2                 |
| 21  | `frontend/src/routes/_protected/admin/ai-usage.tsx`                          | L2                 |
| 22  | `frontend/src/hooks/useNotificationCenter.ts`                                | L2                 |
| 23  | `supabase/functions/notifications-center/index.ts`                           | L2                 |
| 24  | `supabase/functions/after-actions-create/index.ts`                           | L3                 |
| 25  | `supabase/functions/detect-overdue-commitments/index.ts`                     | L3                 |
| 26  | `frontend/src/components/commitment-editor/CommitmentEditor.tsx`             | L3                 |
| 27  | `frontend/src/components/after-action-form/AfterActionForm.tsx`              | L3                 |
| 28  | `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx`  | L3                 |
| 29  | `frontend/src/hooks/useAfterAction.ts`                                       | L3                 |
| 30  | `frontend/src/services/commitments.service.ts`                               | L3                 |
| 31  | `frontend/src/components/commitments/CommitmentForm.tsx`                     | L3                 |
| 32  | `frontend/src/components/commitments/deliverables/AddDeliverableDialog.tsx`  | L3                 |
| 33  | `frontend/src/i18n/en/commitments.json`                                      | L3                 |
| 34  | `frontend/src/i18n/ar/commitments.json`                                      | L3                 |
| 35  | `supabase/functions/tasks-create/index.ts`                                   | L4                 |
| 36  | `supabase/functions/tasks-update/index.ts`                                   | L4                 |
| 37  | `frontend/src/components/tasks/TaskEditDialog.tsx`                           | L4                 |
| 38  | `frontend/src/components/tasks/DeleteTaskDialog.tsx`                         | L4                 |
| 39  | `frontend/src/components/tasks/ConflictDialog.tsx`                           | L4                 |
| 40  | `frontend/src/hooks/useTasks.ts`                                             | L4                 |
| 41  | `frontend/src/hooks/useUnifiedKanban.ts`                                     | L4                 |
| 42  | `frontend/src/pages/WorkBoard/WorkBoard.tsx`                                 | L4                 |
| 43  | `frontend/src/components/unified-kanban/utils/column-definitions.ts`         | L4                 |
| 44  | `frontend/src/components/unified-kanban/utils/status-transitions.ts`         | L4                 |
| 45  | `frontend/src/i18n/en/tasks-page.json`                                       | L4                 |
| 46  | `frontend/src/i18n/ar/tasks-page.json`                                       | L4                 |
| 47  | `frontend/src/components/tasks/TaskDetail.tsx`                               | L4 (opportunistic) |
| 48  | `frontend/src/components/work-creation/forms/TaskQuickForm.tsx`              | L5                 |
| 49  | `frontend/src/components/work-creation/forms/CommitmentQuickForm.tsx`        | L5                 |
| 50  | `frontend/src/components/work-creation/forms/IntakeQuickForm.tsx`            | L5                 |
| 51  | `frontend/src/components/work-creation/WorkCreationPalette.tsx`              | L5                 |
| 52  | `frontend/src/components/work-creation/WorkCreationProvider.tsx`             | L5                 |
| 53  | `frontend/src/components/work-creation/DossierPicker.tsx`                    | L5                 |
| 54  | `supabase/functions/intake-tickets-create/index.ts`                          | L5                 |
| 55  | `supabase/functions/intake-tickets-update/index.ts`                          | L5                 |
| 56  | `supabase/functions/intake-tickets-assign/index.ts`                          | L5                 |
| 57  | `frontend/src/components/intake-form/IntakeForm.tsx`                         | L5                 |
| 58  | `frontend/src/i18n/en/intake.json`                                           | L5                 |
| 59  | `frontend/src/i18n/ar/intake.json`                                           | L5                 |
| 60  | `frontend/src/components/Dossier/wizard/hooks/useCreateDossierWizard.ts`     | L6                 |
| 61  | `frontend/src/components/ui/form-wizard.tsx`                                 | L6                 |
| 62  | `frontend/src/components/Dossier/wizard/config/engagement.config.ts`         | L6                 |
| 63  | `frontend/src/components/Dossier/wizard/steps/OfficeTermStep.tsx`            | L6                 |
| 64  | `frontend/src/components/Dossier/wizard/config/person.config.ts`             | L6                 |
| 65  | `frontend/src/components/positions/AttachPositionDialog.tsx`                 | L7                 |
| 66  | `frontend/src/components/positions/PositionDossierLinker.tsx`                | L7                 |
| 67  | `frontend/src/components/position-editor/PositionEditor.tsx`                 | L7                 |
| 68  | `frontend/src/components/positions/AttachmentUploader.tsx`                   | L7                 |
| 69  | `frontend/src/components/calendar/CalendarEntryForm.tsx`                     | L7                 |
| 70  | `supabase/functions/calendar-create/index.ts`                                | L7                 |
| 71  | `frontend/src/domains/calendar/hooks/useRecurringEvents.ts`                  | L7                 |
| 72  | `frontend/src/components/relationships/RelationshipForm.tsx`                 | L7                 |
| 73  | `frontend/src/pages/MoUs/MousPage.tsx`                                       | L7                 |
| 74  | `frontend/src/components/legislation/LegislationForm.tsx`                    | L7                 |
| 75  | `frontend/src/components/contacts/InteractionNoteForm.tsx`                   | L7                 |
| 76  | `frontend/src/i18n/en/common.json`                                           | L7                 |
| 77  | `frontend/src/i18n/ar/common.json`                                           | L7                 |
| 78  | `frontend/src/i18n/en/positions.json`                                        | L7                 |
| 79  | `frontend/src/i18n/ar/positions.json`                                        | L7                 |
| 80  | `frontend/src/lib/api-client.ts`                                             | L8                 |
| 81  | `frontend/src/components/ui/form.tsx`                                        | L8                 |

**Assertion:** 81 distinct file paths, each mapped to exactly one lane → **no file repeats. Lanes
are file-disjoint.** `frontend/src/i18n/index.ts` is edited by **no** lane (verified: `tasks`
keys go in the already-registered `tasks-page` ns; `commitments`/`positions`/`intake`/`common`
namespaces are already registered).

### Disjointness notes (cross-lane findings split by file)

- **E-6** (due_date GST 1-day-early) lives in two files → `CommitmentForm.tsx` (L3) **and**
  `CommitmentQuickForm.tsx` (L5). Each lane fixes only its own file; same one-liner.
- **B-28** (double toast) edits 3 files, all inside L5 (`WorkCreationProvider.tsx`,
  `TaskQuickForm.tsx`, `IntakeQuickForm.tsx`) → no cross-lane split.
- **B-17≡E-22** is fixed in `commitments.service.ts` (L3); the form that _sends_ the fields
  (`CommitmentQuickForm.tsx`) is in L5 but needs no change for this item.
- **B-5** edits `CommitmentQuickForm.tsx` (L5); the commitment **service** (L3) is untouched by B-5.

---

## Cross-lane dependencies & ordering

1. **L0 depends on L1.** The D-1/D-2 triggers reject any non-`service_role` change to
   `users.role` / `profiles.clearance_level`. L1 must first ensure the legitimate admin writers
   (`assign-role`, `create-user`, `deactivate-user`, `reactivate-user`) perform those privileged
   writes with the **service-role** client. **Land + verify L1 before applying L0's triggers**
   (or apply them in the same integration step) to avoid a window where admin role/clearance
   assignment breaks. All other lanes are independent.
2. **L2 is independent of L0** by design: the chosen settings fix routes prefs to existing tables
   (`users` real cols, `notification_category_preferences`) + DesignProvider/local — **no new
   migration**. Server-side persistence of accessibility/density is the D-19-adjacent
   NEEDS-DECISION, not part of the FIX-NOW.
3. Every other lane is fully independent and can run in parallel.

---

## NEEDS-DECISION (10) — question + cheap honest fallback

> The user must answer these. Until then, ship the fallback (most are tiny honest-disables that
> ride an existing FIX-NOW lane — they make the UI stop lying without building the feature).

1. **A-1 — Dossier edit surface (HIGH).** _Q:_ Build dossier editing — reuse the create wizard in
   edit mode, or inline-edit on the detail pages? _Fallback:_ none required (create-only today; no
   control falsely advertises edit). No code.
2. **A-2 — `dossiers-update` rewrite (HIGH).** _Q:_ The edge fn is contract-drifted (PUT vs POST,
   reads a non-existent `version` col, wrong `sensitivity_level` type, phantom columns). Rewrite to
   the live `dossiers` schema — but against which edit-UI contract (depends on A-1)? _Fallback:_
   leave the dead fn (0 callers); implement together with A-1.
3. **C-3 — MoU create (HIGH).** _Q:_ Build a MoU create form/route writing `mous`
   (`type`,`mou_category`,dates,parties,`lifecycle_state`)? _Fallback (FIX-NOW, L7):_ disable the
   dead "Add MoU" button at `MousPage.tsx:210` so it stops looking functional.
4. **D-9 — Avatars bucket (HIGH).** _Q:_ Create the `avatars` storage bucket + RLS? _Fallback
   (FIX-NOW, L2):_ hide the avatar-upload control in `ProfileSettingsSection.tsx` until it exists.
5. **D-10 — User-management routes (HIGH).** _Q:_ Build `/users/create` + `/users/:id` and
   implement `userManagementApi` against the (now L1-hardened) edge fns? _Fallback:_ remove the
   dead "Create User"/row-nav buttons in `UsersListPage.tsx:189,193`.
6. **E-8 — ConsistencyPanel (HIGH).** _Q:_ Wire a real consistency-check query + action handlers?
   _Fallback:_ hide the inert panel at `routes/_protected/positions/$id.tsx:218` (it ships
   modify/accept/escalate/view buttons that are permanently dead).
7. **A-7 — Country flag/population/area (MED).** _Q:_ Should `flag_url`/`population`/`area_sq_km`/
   `subregion` be user-editable at create? _Fallback:_ document as derived/seed-only (flags already
   derived from ISO). No code.
8. **B-18 — After-action nested edits (MED).** _Q:_ Implement nested commitment/decision/risk
   persistence (diff/upsert) in `after-actions-update`? _Fallback:_ remove the nested entities from
   `UpdateAfterActionRequest` + disable the nested editors in AA **edit** mode so the 200 stops
   implying they saved.
9. **D-15 — AI-settings multi-admin scoping (MED).** _Q:_ Seed `organization_members`(admin/owner)
   - `default_organization_id` for every intended admin, or derive the write-org from
     `users.role`? _Fallback:_ works for today's sole admin; document the limitation.
10. **D-19 — MFA secret at rest (MED).** _Q:_ Adopt envelope/at-rest encryption (pgsodium/KMS) for
    `users.mfa_secret` (currently plaintext base32)? _Fallback:_ accept plaintext for now (already
    flagged in the security commit); no user-facing lie. New-infra decision.

---

## DEFER

33 LOW + 2 systemic MED — see `_BACKLOG.md` ## DEFER for the full list. Not laned. The two MED
**systemic sweeps** (E-20 locale digits ~40 files; E-21 i18n ternaries 33+ files) must run as a
**single sequential pass after the disjoint lanes merge** (they touch files across every lane, so
they cannot be a parallel disjoint lane). Each lane brief lists the LOWs in its own files as
_opportunistic_ (fix only if trivial and in-passing; never required).
