# Plan — everything still outstanding after the data-entry quality sweep

**Branch:** `fix/prod-quality-sweep-260627` · **PR:** [#72](https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/72) (open, base `main`)
**Planner pass:** 2026-06-28 · **Source of truth:** `git diff e72b928d..HEAD` + live staging (`zkrcjzdemdmwhearhfgg`) + `gh pr checks 72`.
**Read with:** `_LANES.md` (lane map + NEEDS-DECISION text), `_BACKLOG.md` (item detail), `findings-{A..E}-*.md` (evidence).

> This plan covers **all** outstanding work and is intended to be executed item-by-item. It does **not**
> change code. Effort key: **S** ≤ half-day · **M** 1–2 days · **L** 3+ days.

---

## 0. ⚠ STATUS CORRECTION — the sweep is NOT fully landed (read first)

The orchestration log (`_ORCHESTRATION.md` T5/line 169 + "LOOP COMPLETE") claims **"All 9 lanes done."**
**The git diff disproves this.** Lane **L7** (positions / calendar / MoU / relationships / legislation /
contacts — 15 files, 19 items) is **byte-for-byte unchanged from the base commit `e72b928d`**, and two
honest-disable fallbacks never landed either. This is consistent with the known _shared-branch index
clobber_ failure mode (workers self-committed into one shared tree with no worktrees → L7's commits were
swept/lost). **Git is ground truth; trust it over the log.**

### What actually landed (8 of 9 lanes, 77 commits)

| Lane                              | State                              | Items shipped (in branch)                                                                                                               |
| --------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| L0-db                             | ✅ landed + **applied to staging** | D-1, D-2 privilege-escalation triggers (`guard_users_role_change` `20260627122349`, `guard_profiles_clearance_change` `20260627122351`) |
| L1-auth                           | ✅ landed                          | D-3, D-11, D-12, D-13, D-14, D-22/25, D-23, D-24, D-27, D-29, D-31                                                                      |
| L2-settings-admin                 | ✅ landed                          | D-4/E-1, D-5, D-6/E-4, D-7, D-8, **D-9 (avatar honest-disable)**, D-16/28, D-17, D-18, D-20, D-21, D-30                                 |
| L3-commitments-aa                 | ✅ landed                          | B-1/C-1, B-6, B-7, B-9, B-17/E-22, B-19/E-18, B-20, B-38, E-6, E-19                                                                     |
| L4-tasks-workboard                | ✅ landed                          | B-2, B-3, B-4, B-21, B-22/E-11, B-23, B-24, B-25, B-26, B-30, B-36, B-37                                                                |
| L5-work-palette-intake            | ✅ landed                          | B-5, B-8, B-10..B-16, B-27, B-28, B-29, B-32, B-33, B-35, E-30                                                                          |
| L6-dossier-wizard                 | ✅ landed                          | A-3/E-5, A-4, A-5, A-6                                                                                                                  |
| L8-shared-client                  | ✅ landed                          | E-3/S1 (`api-client.ts`), E-10 (`ui/form.tsx` `role="alert"`)                                                                           |
| **L7-positions-calendar-rel-mou** | ❌ **NOT landed**                  | **all 19 items below are outstanding**                                                                                                  |

### L7 — outstanding FIX-NOW work (must re-do; includes a CRITICAL)

Verified UNCHANGED from base: `AttachPositionDialog.tsx`, `PositionDossierLinker.tsx`, `PositionEditor.tsx`,
`AttachmentUploader.tsx`, `CalendarEntryForm.tsx`, `supabase/functions/calendar-create/index.ts`,
`useRecurringEvents.ts`, `RelationshipForm.tsx`, `MousPage.tsx`, `LegislationForm.tsx`,
`InteractionNoteForm.tsx`, `i18n/{en,ar}/positions.json`, `i18n/{en,ar}/common.json`.

| ID            | Sev          | Item                                                       | One-line fix (per `_BACKLOG.md`)                                                                                                                                                          |
| ------------- | ------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E-2**       | **CRITICAL** | AttachmentUploader renders raw i18n key                    | `positions.json` defines `attachments` as a **string**; author nested `attachments_uploader.*` EN+AR and repoint the component (`grep attachments_uploader positions.json` = **0** today) |
| C-2           | HIGH         | Calendar participants silently dropped                     | Persist participants, or remove the control (today `attendee_ids:[]` hardcoded)                                                                                                           |
| C-4           | HIGH         | AttachPositionDialog swallows error                        | `toast.error(t('positions:attach.attachError'))` + keep dialog open on failure                                                                                                            |
| C-5/E-9       | HIGH         | PositionDossierLinker create+delete `console.error` only   | Surface `toast.error` in both catches; add delete confirm                                                                                                                                 |
| E-7           | HIGH         | RelationshipForm no validation                             | Add `zodResolver` (`to_contact_id`,`relationship_type`); gate submit; route via `FormMessage`                                                                                             |
| C-6           | MED          | Calendar title not required                                | Require `title_en\|title_ar` client + 400 in edge                                                                                                                                         |
| C-7           | MED          | Calendar `reminder_minutes` data-loss                      | Accept+persist, or remove the control                                                                                                                                                     |
| C-8           | MED          | MoU status labels missing                                  | Add `pending_approval`/`suspended`/`terminated` EN+AR; drop dead labels                                                                                                                   |
| C-9           | MED          | MoU transition button dead `onClick`                       | Hide/disable the placeholder                                                                                                                                                              |
| C-10          | MED          | Calendar recurring detect wrong table                      | Query `calendar_entries`, not empty `calendar_events.series_id`                                                                                                                           |
| C-11          | MED          | PositionDossierLinker label a11y                           | Bind `htmlFor`→`id`; `aria-required`                                                                                                                                                      |
| E-14          | MED          | CalendarEntryForm blocking `alert()`                       | Replace with toast/inline `role="alert"`; validate title client-side                                                                                                                      |
| E-15          | MED          | `common.saving` key missing                                | Add the key or point at an existing one                                                                                                                                                   |
| E-16          | MED          | LegislationForm edit can't blank fields                    | Send `null` for cleared fields, not strip                                                                                                                                                 |
| E-17          | MED          | InteractionNoteForm double-creates note on partial failure | Track created note id; don't re-create on resubmit                                                                                                                                        |
| E-23          | MED          | AttachmentUploader error keys hit an object                | Use leaf keys (`common:errors.generic`)                                                                                                                                                   |
| E-24          | MED          | PositionEditor i18n/a11y                                   | Colon-form `t('common:…')`; `role="alert"`; exclude `autoSaving` from manual-save guard                                                                                                   |
| E-25          | MED          | PositionDossierLinker labels                               | Existing pending key; `htmlFor`/`id` pairs                                                                                                                                                |
| C-3 (disable) | HIGH         | MoU "Add MoU" button looks functional                      | **Honest-disable** the dead button (`MousPage.tsx:210`) — see NEEDS-DECISION C-3                                                                                                          |

**Also never landed (honest-disables that the PR description implies but does not ship):**

- **D-10 disable** — `UsersListPage.tsx` is unchanged; the dead "Create User"/row-nav buttons (`:189,193`) still look functional.
- **E-8 disable** — `routes/_protected/positions/$id.tsx` is unchanged; the inert ConsistencyPanel (`:218`) still ships modify/accept/escalate/view buttons that do nothing.

**Recommendation:** re-execute L7 + the D-10/E-8/C-3 honest-disables as **one disjoint relanding lane** and
push into PR #72 **before merge**. Until then the PR ships an un-fixed CRITICAL (E-2) and three lying
surfaces. Use a **git worktree or explicit `git commit -- <pathspec>`** per file to avoid repeating the
index clobber (see Risk notes, §6).

---

## 1. NEEDS-DECISION (10) — question, options, recommendation

Each needs a product/UX or infra call. The **honest-disable fallback** is the cheap "not now" default.
The **Ships today?** column reflects the _real_ branch state (§0), not the log's claim.

### Quick table

| ID   | Sev  | Area                          | Recommendation                            | Effort  | Honest-disable ships today?               |
| ---- | ---- | ----------------------------- | ----------------------------------------- | ------- | ----------------------------------------- |
| A-1  | HIGH | Dossier **edit** surface      | Build — reuse create wizard in edit mode  | L       | n/a (create-only; nothing lies)           |
| A-2  | HIGH | `dossiers-update` edge fn     | Rewrite to live schema, **with A-1**      | M       | dead fn, 0 callers (safe)                 |
| C-3  | HIGH | MoU create                    | Ship disable now; build form later        | S / M   | ❌ **not yet** (re-do in L7 relanding)    |
| D-9  | HIGH | Avatars bucket                | Build the bucket + RLS (low-risk)         | S–M     | ✅ avatar control hidden (L2 landed)      |
| D-10 | HIGH | User-mgmt routes              | Ship disable now; build routes later      | S / M–L | ❌ **not yet** (re-do in relanding)       |
| E-8  | HIGH | ConsistencyPanel              | Ship disable now; wire later              | S / M–L | ❌ **not yet** (re-do in relanding)       |
| A-7  | MED  | Country flag/pop/area fields  | Document derived/seed-only                | S       | n/a (no lie)                              |
| B-18 | MED  | AA nested edits (update)      | Ship disable now; build diff/upsert later | M / L   | ❌ not yet (no relanding target assigned) |
| D-15 | MED  | AI-settings multi-admin scope | Defer; document sole-admin limit          | S       | works for today's 1 admin                 |
| D-19 | MED  | MFA secret at rest            | Adopt envelope encryption before MFA GA   | M       | plaintext, already flagged (no UI lie)    |

### Detail

**A-1 — Dossier edit surface (HIGH).** _Q:_ build dossier editing — reuse the create wizard in edit mode,
or inline-edit on detail pages? _Options:_ **(a) wizard-in-edit** — reuses validation (now real post-A-3),
one code path, but the wizard is multi-step-heavy for a one-field tweak; **(b) inline-edit per detail page**
— faster for small edits, but 8 dossier types × N sections = large surface and duplicated validation.
_Recommendation:_ **(a)** — DRY, and A-3 already gave the wizard real per-step validation. _Effort:_ **L.**
_Files:_ new edit route(s) + `Dossier/wizard/*` in edit mode. _Ships today:_ create-only; no control claims edit.

**A-2 — `dossiers-update` rewrite (HIGH).** _Q:_ the edge fn is contract-drifted (PUT vs POST, reads a
non-existent `version` col, wrong `sensitivity_level` type, phantom columns) — rewrite to live `dossiers`,
but to which edit-UI contract? _Recommendation:_ rewrite to the live schema + `POST {id,...}` **jointly with
A-1** (its contract defines the payload). _Effort:_ **M.** _Files:_ `supabase/functions/dossiers-update/index.ts`.
_Ships today:_ dead fn, **0 callers** — safe to leave until A-1.

**C-3 — MoU create (HIGH).** _Q:_ build a MoU create form/route writing `mous`
(`type`,`mou_category`,dates,parties,`lifecycle_state`)? _Options:_ **(a)** full create form (M); **(b)**
honest-disable the dead "Add MoU" button now (S). _Recommendation:_ **(b) now, (a) later** — ship the disable
in the L7 relanding; schedule the form. _Effort:_ disable **S** / form **M.** _Files:_ `pages/MoUs/MousPage.tsx:210`
(disable); new route + form (build). _Ships today:_ ❌ — **disable did not land**; button still looks functional.

**D-9 — Avatars bucket (HIGH).** _Q:_ create the `avatars` storage bucket + RLS? _Recommendation:_ **build it**
— Supabase Storage bucket + standard owner-scoped RLS is well-trodden and unblocks a visible feature; then
un-hide the upload control. _Effort:_ **S–M.** _Files:_ one storage migration (bucket + policies) via Supabase
MCP; un-hide in `settings/sections/ProfileSettingsSection.tsx`. _Ships today:_ ✅ avatar control is hidden (L2 landed).

**D-10 — User-management routes (HIGH).** _Q:_ build `/users/create` + `/users/:id` and implement
`userManagementApi` against the (L1-hardened) edge fns? _Options:_ **(a)** build both routes (M–L); **(b)**
remove the dead buttons now (S). _Recommendation:_ **(b) now, (a) next** — the edge fns (`create-user`,
`assign-role`, `deactivate/reactivate-user`) are hardened, so this is mostly UI wiring. _Effort:_ disable **S** /
routes **M–L.** _Files:_ `pages/users/UsersListPage.tsx:189,193` (disable); new routes + `userManagementApi`.
_Ships today:_ ❌ — **disable did not land**.

**E-8 — ConsistencyPanel (HIGH).** _Q:_ wire a real consistency-check query + action handlers? _Note:_ the DB
side exists (`create_consistency_checks`, `position_consistency_checker` migrations) so wiring is feasible.
_Recommendation:_ **hide the inert panel now (S), wire later (M–L).** _Effort:_ disable **S** / wire **M–L.**
_Files:_ `routes/_protected/positions/$id.tsx:218` (hide); query + handlers (build). _Ships today:_ ❌ — **hide did not land**.

**A-7 — Country flag/population/area (MED).** _Q:_ should `flag_url`/`population`/`area_sq_km`/`subregion` be
user-editable at create? _Recommendation:_ **document as derived/seed-only** (flags already derive from ISO).
_Effort:_ **S** (doc only, zero code). _Ships today:_ n/a — no control claims to edit them.

**B-18 — After-action nested edits (MED).** _Q:_ implement nested commitment/decision/risk persistence
(diff/upsert) in `after-actions-update`? _Recommendation:_ **honest-disable now** — remove nested entities
from `UpdateAfterActionRequest` and disable the nested editors in AA **edit** mode so the 200 stops implying a
save; build diff/upsert later. _Effort:_ disable **M** / full **L.** _Files:_ `after-actions-update/index.ts`,
AA edit-mode editors, `UpdateAfterActionRequest` type. _Ships today:_ ❌ not yet (no lane was assigned this disable).

**D-15 — AI-settings multi-admin scoping (MED).** _Q:_ seed `organization_members`(admin/owner) +
`default_organization_id` for every intended admin, or derive the write-org from `users.role`?
_Recommendation:_ **defer + document** — correct for today's sole admin; revisit when a 2nd admin is added
(prefer seeding `organization_members` over deriving from role). _Effort:_ **S** (doc). _Ships today:_ works for 1 admin.

**D-19 — MFA secret at rest (MED).** _Q:_ adopt envelope/at-rest encryption (pgsodium/Vault/KMS) for
`users.mfa_secret` (currently plaintext base32)? _Recommendation:_ **adopt before MFA goes GA to real users**
— now that D-3 makes TOTP verification real, the plaintext secret is the remaining weak link. Acceptable to
defer short-term (already flagged in the security commit; no UI lie). _Effort:_ **M** (new infra). _Files:_
`users.mfa_secret` column + `auth.service.ts` read/write path. _Ships today:_ plaintext, flagged.

---

## 2. Deferred mechanical sweeps

### E-20 — locale-correct digits — **🟡 IN PROGRESS (sibling agent now)**

A sibling agent is executing `_brief-SWEEP-E20-locale-digits.md` against this same branch and will push to
update PR #72. **Do not double-assign.** Scope/helpers (confirmed in code):

- **Numbers/percent:** `new Intl.NumberFormat(toFormatLocale(i18n.language), …)` — `toFormatLocale` lives at
  `frontend/src/lib/format-locale.ts` (maps `'ar'`→`'ar-SA'`; bare `'ar'` renders **Latin** digits in Chrome).
- **Dates/times:** `formatDayFirst(date, locale)` / `formatTime(date, locale)` from `frontend/src/lib/format-date.ts`
  (day-first `Tue 28 Apr`, `14:30 GST`, Arabic-Indic via `toArDigits`).
- **Raw digit swap:** `toArDigits(str, locale)` from `frontend/src/lib/i18n/toArDigits`.
- **Surface:** ~40+ bare call-sites; only 5 files use the helper today. Anchors: `IntelligenceTabContent.tsx:375,390`,
  `WebhooksPage.tsx:433,1012`, `KpiWidget.tsx:134`, `MyAssignments.tsx:128,155`. Prioritize KPI/dashboard, table
  cells, counts, currency, dates in forms/detail pages.
- **Verify:** `cd frontend && pnpm exec tsc --noEmit` + `pnpm lint` (both must pass). Commit `HUSKY=0`, explicit paths.

### E-21 — i18n ternaries → namespace keys — **deferred, NOT started**

_Measured live (`rg "isRTL \? '"` over `frontend/src`):_ **1,175 occurrences across 354 files** app-wide —
far broader than the "33+ files" in the backlog. The 33 is the **data-entry/form subset** (the assessment's
scope); the other ~320 files are out-of-scope read surfaces.

- **Target pattern:** replace `isRTL ? 'English' : 'عربى'` literals with `t('<ns>:<key>')`; reserve the ternary
  only for genuinely dynamic copy. Also fold hard-coded English `placeholder="…"` strings into keys.
- **How to find the in-scope set:** `rg -l "isRTL \? '" frontend/src/components/{positions,calendar,relationships,
commitments,intake-form,work-creation,Dossier,contacts,legislation} frontend/src/pages/{persons,users,MoUs}` —
  that intersection (~33 files) is the form scope. Start with `pages/persons/PersonCreatePage.tsx:167,197,359,407`
  and `pages/MyAssignments.tsx:128,155`.
- **Per file:** add EN+AR keys to the already-registered namespace for that surface (no new `i18n/index.ts`
  registration needed for existing namespaces); swap ternaries for `t()`; keep one key shape per string.
- **Verify:** `pnpm lint` (runs `scripts/check-i18n-namespaces.mjs`) + `rg -c "isRTL \? '" <file>` should trend
  to 0 in touched files; spot-check AR render. **Sequence AFTER E-20 + the L7 relanding** so the three sweeps
  don't collide on the same form files.
- **Effort:** **L** for the 33-file scope (mechanical but high-volume). Do NOT attempt all 354 in one pass.

### 33 LOW deferred — grouped by theme + disposition

Several "LOW-opportunistic" items **already landed** inside their lanes (B-30, B-32, B-33, B-35, B-36, B-37,
B-38). The remainder:

| Theme                    | Items                                                                                                                                                                                                                                                 | Disposition                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **i18n key hygiene**     | B-31/C-13 (`'critical'`→`'urgent'` AA type), B-34 (`after_action_record`→`after_action`), D-37 (prune dead keys), E-27 (ContactForm `name_ar` copies EN), E-28 (date-fns AR locale)                                                                   | Fold opportunistically into the **E-21** form sweep where files overlap; otherwise a single tidy commit. **S each.**                                        |
| **a11y residuals**       | A-9 (OfficeTermStep `aria-required`), D-32 (auth-error `role="alert"`), D-35 (ai-settings label `htmlFor`), E-33 (NewPositionDialog lookup-error `role="alert"`), E-29 (dup of B-16, landed)                                                          | One small a11y pass. E-29 already covered. **S.**                                                                                                           |
| **RTL double-flips**     | E-32 (PositionDossierLinker `ms-2`)                                                                                                                                                                                                                   | Lives in an L7 file — fold into the **L7 relanding**. **S.**                                                                                                |
| **dead-code / cleanup**  | B-39 (resolve owner/dossier UUIDs in display), C-15/16/17/19 (relationship barrel/repo/health-score), C-18 (bulk-attach `link_type`), D-34 (test backdoors→fixtures), D-36 (`alert_threshold_percent` unwired), D-40 (delete dead `services/auth.ts`) | Backlog-clean later; **D-40** pairs with D-3 (the Express MFA path was hardened — confirm `services/auth.ts` is truly dead before deleting). **S–M total.** |
| **validation / UX nits** | A-8 (Select `defaultValue`→`value`), C-12/C-14 (calendar `alert()`→toast, end>start — fold into E-14/L7), E-26 (PersonCreatePage placeholders), E-31 (AttachmentUploader fake progress — L7)                                                          | Calendar/positions ones ride the **L7 relanding**; the rest are cosmetic, defer. **S.**                                                                     |

---

## 3. ⚠ Edge-function DEPLOYMENT — the largest live gap

**The committed edge-function fixes are inert on staging until deployed.** Several CRITICAL/HIGH fixes do not
take effect on merge — they take effect on **deploy**. Verified against live staging
(`mcp__supabase__list_edge_functions`): the deployed versions predate the sweep, and **two functions are not
deployed at all.**

| Function                     | Lane | Deployed now                      | Pending fix (inert until deploy)                                       | Sev      |
| ---------------------------- | ---- | --------------------------------- | ---------------------------------------------------------------------- | -------- |
| `after-actions-create`       | L3   | **v15 · 2025-10-02** (8 mo stale) | **B-1 NOT NULL `title`** — every AA-with-commitment 500s               | **CRIT** |
| `deactivate-user`            | L1   | **NOT DEPLOYED**                  | D-11 `is_active`, D-24 CORS/rate-limit/service-role, D-31 cleanup cols | HIGH     |
| `reactivate-user`            | L1   | **NOT DEPLOYED**                  | D-11 `is_active`                                                       | HIGH     |
| `create-user`                | L1   | v1 · 2026-06-27 AM (pre-sweep)    | D-14 fail-on-role-write-miss, D-23 clearance                           | HIGH     |
| `user-permissions`           | L1   | v1 · 2026-06-27 AM (pre-sweep)    | D-29 embed/select + error check                                        | MED      |
| `detect-overdue-commitments` | L3   | v3 · 2025-11-15                   | B-9 owner cols (fn currently 500s; overdue flagging never runs)        | HIGH     |
| `tasks-create`               | L4   | v2 · 2026-06-08                   | B-2 tenant lookup, B-25 enum validation                                | HIGH     |
| `tasks-update`               | L4   | v2 · 2026-02-06                   | B-3 status-from-stage, B-25 enums                                      | HIGH     |
| `intake-tickets-create`      | L5   | v19 · 2025-10-20                  | B-10/B-12/B-14/B-15                                                    | MED      |
| `intake-tickets-update`      | L5   | v22 · 2025-09-30                  | B-15 generic error                                                     | MED      |
| `intake-tickets-assign`      | L5   | v22 · 2025-09-30                  | B-15 generic error                                                     | MED      |
| `notifications-center`       | L2   | v2 · 2026-01-13                   | D-18 `.maybeSingle()` + email-error handling                           | MED      |

**Excluded (planned in lanes but NOT edited this sweep → no redeploy):** `assign-role` (v1, current),
`calendar-create` (would only change if the **L7 relanding** ships C-2/C-6/C-7 — redeploy it then).

### Deploy procedure

Deploy from the branch HEAD so the deployed code byte-matches the committed fix. Per machine, `supabase`
CLI is linked to staging; the project ref is `zkrcjzdemdmwhearhfgg`.

```bash
# Preferred: CLI deploy from repo (one per function)
supabase functions deploy after-actions-create --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy deactivate-user       --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy reactivate-user       --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy create-user           --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy user-permissions      --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy detect-overdue-commitments --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy tasks-create          --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy tasks-update          --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy intake-tickets-create --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy intake-tickets-update --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy intake-tickets-assign --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy notifications-center  --project-ref zkrcjzdemdmwhearhfgg
```

(Alternatively the **Supabase MCP `deploy_edge_function`** per function — pass the file contents from the
branch. The CLI is preferred so what deploys matches the repo exactly.)

**Order:** (1) the two **first-time deploys** `deactivate-user` + `reactivate-user`; (2) the **CRITICAL**
`after-actions-create`; (3) the rest. Deploy can run **on staging now** (independent of the PR merge) to
validate, then re-deploy nothing on merge (staging IS the target).

### Deploy-time caveats (from prior incidents)

- **Auth token:** edge fns must import `@supabase/supabase-js@2` and call `getUser(token)` (a bare
  `getUser()` 401s valid tokens). Confirm the touched fns kept this pattern before deploying.
- **CORS:** `ALLOWED_ORIGINS` is a **Supabase secret**, not in the repo. If a smoke-check returns
  `ACAO: null` / localhost-only, run `supabase secrets set ALLOWED_ORIGINS=…`.

### Smoke check (per function, after deploy)

| Function                              | Smoke check                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `after-actions-create`                | Create an after-action **with a commitment** → expect 201 and a row in `aa_commitments` **with `title`** (previously 500).                                               |
| `deactivate-user` / `reactivate-user` | Toggle a test user → 200 and `public.users.is_active` flips (previously 404 / not deployed).                                                                             |
| `create-user`                         | Create a user with a role+clearance → 201; `users.role` + `profiles.clearance_level` written via service-role; a forced role-write failure now fails the request (D-14). |
| `user-permissions`                    | GET for a user → `allowed_resources` populated (not `undefined`).                                                                                                        |
| `detect-overdue-commitments`          | Invoke → 200, no 42703; overdue commitments flagged.                                                                                                                     |
| `tasks-create` / `tasks-update`       | Create a task → correct `organization_id`; update stage `done` → `status=completed` (SLA stops firing); bad enum → 400 generic error.                                    |
| `intake-tickets-create`               | Missing `title_ar` → **400** (not a 500 NULL insert); bad `request_type`/`urgency` → 400.                                                                                |
| `notifications-center`                | Trigger a digest for a user with 0 `email_notification_preferences` rows → handled (no swallowed PGRST116).                                                              |

---

## 4. Frontend / droplet deploy

The frontend (and the L2/L3/L4/L5/L6/L8 React fixes) ships to production via the **DigitalOcean droplet Docker
pipeline on merge** (`138.197.195.242`, `/opt/intl-dossier/`). Per CLAUDE.md Quick Deploy:

```bash
git push && ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && \
  docker compose -f docker-compose.prod.yml build frontend && \
  docker compose -f docker-compose.prod.yml up -d frontend"
```

**Post-deploy verification (analyst widths 1024 + 1400, EN + AR):**

- Settings → Save persists and reloads real values (D-4/D-5); avatar control absent (D-9); notification toggles named (D-21).
- Login re-throws on bad creds (no false nav); decorative MFA input gone (D-13); step-up MFA initiates (D-12/D-27).
- After-action with a commitment saves (B-1) — **requires the edge deploy in §3 first**.
- WorkBoard drag-to-Done sets completion; `+Add` opens the palette (B-21/B-24); task edit i18n correct in AR (B-22).
- API errors surface localized server messages (E-3); RHF errors announce via `role="alert"` (E-10).

**Risk:** the droplet is 4 GB and has OOM'd on heavy in-place builds before; a frontend-only `build frontend`
should fit, but watch the build. A failed build + `up -d` silently keeps the **old** image — confirm the new
container actually started (`docker compose ps` + check a changed string in the served bundle). Droplet is also
many commits behind `main`; `git pull` will pull the whole delta — confirm `pnpm` stays pinned to `10.29.1`.

---

## 5. PR #72 merge path

**State (live):** `MERGEABLE` but `mergeStateStatus: BEHIND` (branch is behind `main`); `reviewDecision`
empty (no review requested); not a draft.

### Required checks (8 — branch-protection on `main`)

| Required check                     | Now                                     |
| ---------------------------------- | --------------------------------------- |
| type-check                         | ✅ pass                                 |
| Lint                               | ✅ pass                                 |
| Security Scan                      | ✅ pass                                 |
| Tests (frontend)                   | ✅ pass                                 |
| Tests (backend)                    | ✅ pass                                 |
| Design Token Check                 | ✅ pass                                 |
| react-i18next Factory Check        | ✅ pass                                 |
| **Bundle Size Check (size-limit)** | ❌ **FAIL — the only required blocker** |

**Non-required, currently failing (do not block merge):** `E2E Tests`, `Visual Regression (Phase 46)`,
`Tests (integration)` — these are the known-non-required suites (E2E tracked in issue #31; they test the
deployed app vs staging, not this PR's code). Confirm they're failing for the usual reasons, not a new regression.

### The one required blocker — Bundle Size Check

`frontend/.size-limit.json` budgets are exceeded. To diagnose:

1. `cd frontend && pnpm exec size-limit` locally to reproduce.
2. **Grep the CI log for _every_ `exceeded` line** (failures stack and the log hides all but the first) —
   `gh run view <run-id> --log | grep -i exceeded`.
3. Likely cause: a sweep edit pulled previously-lazy weight (assistant-ui / markdown / charts) into the entry
   chunk, or grew a tracked chunk past budget. Fix by restoring the dynamic import or trimming; **do not** just
   raise the budget without cause.

### Merge sequence

```bash
# 1. Land the outstanding work into the PR first (see §6): L7 relanding, E-20 (sibling), Bundle fix.
# 2. Update the branch from main (it is BEHIND) — re-runs checks:
gh pr update-branch 72            # or: git fetch origin main && git merge origin/main (resolve), then push
# 3. Watch required checks only, fail fast:
gh pr checks 72 --watch --required --fail-fast
# 4. Merge once all 8 required are green (auto-merge is disabled on this repo):
gh pr merge 72 --merge
```

### Manual smoke list before merging (beyond CI)

- The **L7 CRITICAL E-2** is fixed (AttachmentUploader renders real AR strings, not a raw key).
- The three honest-disables are live (no functional-looking dead buttons): MoU "Add" (C-3), user-mgmt
  Create/row-nav (D-10), ConsistencyPanel (E-8).
- Edge functions in §3 are deployed to staging and smoke-checked (the PR's backend fixes are otherwise inert).
- A quick AR pass at 1024/1400 on the touched forms (Settings, WorkBoard, after-action, intake, wizard).

---

## 6. Recommended sequencing + risk notes

Ordered by what unblocks/derisks the most, and what _must_ precede the PR merge.

| #   | Step                                                        | Why / gate                                                                                                                                                     | Effort    | Risk                                                                                                                 |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | **Re-land L7 + D-10/E-8/C-3 honest-disables** into PR #72   | Ships an un-fixed **CRITICAL (E-2)** + 3 lying surfaces otherwise; §0                                                                                          | M–L       | **Index clobber recurrence** — use a worktree or `git commit -- <path>` per file; verify with `git show HEAD:<file>` |
| 2   | **Fix Bundle Size Check**                                   | Only **required** merge blocker; §5                                                                                                                            | S–M       | Don't paper over by raising budgets; find the chunk regression                                                       |
| 3   | **Deploy the 12 edge functions to staging** + smoke-check   | Backend fixes (incl. CRITICAL B-1) are **inert until deployed**; §3 — can run in parallel with 1–2                                                             | S–M       | Token `getUser(token)` + `ALLOWED_ORIGINS` secret; first-time deploys for deactivate/reactivate                      |
| 4   | **Let E-20 sibling finish + push**                          | Already in progress; §2 — keep off the same files as step 1 until both merge                                                                                   | (sibling) | File collision with L7 relanding / E-21 — sequence them                                                              |
| 5   | **Update branch from `main`** (it's BEHIND) → re-run checks | §5                                                                                                                                                             | S         | Merge conflicts with `main` drift; resolve, re-verify gate                                                           |
| 6   | **Merge PR #72**                                            | After 1–5: all 8 required green + L7 + edge deployed                                                                                                           | S         | Auto-merge disabled — merge manually after `--watch --required`                                                      |
| 7   | **Droplet frontend deploy** + verify                        | §4                                                                                                                                                             | S         | 4 GB OOM; failed-build-keeps-old-image; pnpm pin                                                                     |
| 8   | **E-21 form-scope sweep** (33 files)                        | Post-merge; §2 — after E-20 so they don't collide                                                                                                              | L         | Scope creep to all 354 files — hold the line at the form subset                                                      |
| 9   | **NEEDS-DECISION resolution**                               | Surface the 10 to the user; ship any remaining honest-disables immediately, schedule feature builds (A-1+A-2, D-9 bucket, D-10 routes, E-8 wiring, B-18, D-19) | varies    | Don't build features before the product call (§1)                                                                    |

### Cross-cutting risks

- **Shared-tree index clobber (root cause of the L7 loss).** Any future multi-worker pass on this branch must
  use isolated **git worktrees** or strictly `git commit -- <explicit pathspec>` and then **verify each file
  actually landed** (`git diff --quiet <base>..HEAD -- <file>`), because a "DONE" report is not proof — the L7
  worker reported done and its commits were not in the tree.
- **Order matters for security:** the L0 triggers (live on staging) reject any non-service-role write to
  `users.role` / `profiles.clearance_level`. The admin write paths already use the service-role client
  (verified in L1), so deploying `create-user`/`deactivate-user`/`reactivate-user` is safe — **do not** add a
  non-service-role role/clearance write or it will be blocked.
- **Migrations are already applied** (`guard_users_role_change`, `guard_profiles_clearance_change`). The local
  files `20260628000001/02` carry a later timestamp than the applied `20260627122349/51` (an apply-via-MCP
  artifact) — same content, harmless. Separately, project memory flags an **unapplied staging-drift migration
  `20260116600001` with a `profiles.id` bug** — out of scope here, but reconcile it before the next DB pass.
- **Inert-until-deployed is the silent trap:** merging PR #72 alone does **not** fix the CRITICAL after-action
  bug or any backend item — step 3 (edge deploy) is what makes them real. Treat §3 as part of "done," not a follow-up.

---

### Appendix — outstanding count at a glance

- **1 CRITICAL** unshipped (E-2, in L7) + **4 HIGH** (C-2, C-4, C-5/E-9, E-7) + **13 MED** (rest of L7) = **L7 relanding**.
- **3 honest-disables** not yet shipped (C-3, D-10, E-8) + **B-18** disable.
- **12 edge functions** to deploy (2 first-time).
- **10 NEEDS-DECISION** feature/infra calls.
- **2 systemic sweeps** (E-20 in progress, E-21 scoped to ~33 files).
- **~26 LOW** still deferred (7 already landed opportunistically).
- **1 required CI blocker** (Bundle Size) + branch **BEHIND** main.
