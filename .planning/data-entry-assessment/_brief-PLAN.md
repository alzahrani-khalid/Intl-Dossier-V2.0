# Phase 2 — Planning / Triage brief (single planning agent)

You are the **planning agent** for a data-entry quality sweep. Five read-only audit agents have
written findings to `.planning/data-entry-assessment/findings-{A,B,C,D,E}-*.md`. Your job is to turn
those into a de-duped, ranked backlog AND a set of **disjoint-file implementation lanes** with
ready-to-run worker briefs. You write planning docs only — do NOT modify source code.

## Inputs (read all five)

- `findings-A-dossiers.md`, `findings-B-workitems.md`, `findings-C-engagement-adjacent.md`,
  `findings-D-auth-admin-settings.md`, `findings-E-crosscutting.md`
- `_FORMAT.md` for the source-of-truth schema facts. Branch: `fix/prod-quality-sweep-260627`.

## Step 1 — De-dupe

Merge duplicate findings across slices into one backlog item (keep all cited file:line refs). Known
duplicates to confirm and merge: **B-1 ≡ C-1** (after-actions-create omits NOT NULL `aa_commitments.title`);
**D-4 ≡ E-1** (SettingsPage upsert to ~23 non-existent `public.users` columns); **D-6 ≡ E-4** (MFA
"Set up Two-Factor" button has no onClick + persists `mfa_enabled` without secret); **C-5 ≡ E-9**
(PositionDossierLinker swallows errors). Find any others.

## Step 2 — Triage each merged item into exactly one bucket

- **FIX-NOW** — a clear, safe, self-contained bug fix or honest-disable, implementable without new
  product/UX decisions, new third-party infra, or building a whole new feature/route from scratch.
  (Includes DB migrations that close a definite bug/security hole.)
- **NEEDS-DECISION** — requires a product/UX call, a new sizeable feature/route, new infra
  (e.g. a storage bucket), or is ambiguous. Examples likely here: MoU create-from-scratch (C-3),
  ConsistencyPanel real wiring (E-8), avatars bucket (D-9), user-management create/detail routes (D-10).
  For each, give the 1-line decision the user must make + the cheap honest-disable fallback.
- **DEFER** — LOW severity / cosmetic; list briefly, don't lane them.

Re-verify every CRITICAL/HIGH you keep against the actual code at its cited file:line (the findings are
fresh but confirm the line still matches). Drop or downgrade anything you cannot reproduce; note it.

## Step 3 — Carve disjoint-file lanes for the FIX-NOW items (HARD CONSTRAINT)

Group FIX-NOW items into lanes such that **no source file appears in more than one lane** — workers run
in parallel and must never edit the same file. Put all **DB migrations in ONE dedicated lane** (`L0-db`)
because they serialize against the shared staging DB (applied via Supabase MCP, not files). Aim for
**6–9 lanes** total, each independently implementable AND independently verifiable. Order lanes by
priority: **security → silent-data-loss / save-broken → honesty (fake-success) → validation → i18n →
error-surfacing**.

Seed grouping (refine + verify file-disjointness; adjust as the code requires):

- **L0-db** — migrations only: D-1 (BEFORE UPDATE trigger on `public.users` blocking non-service-role
  `role` change), D-2 (same for `profiles.clearance_level`), plus any column/table the FIX-NOW code
  changes depend on (e.g. a real settings/prefs table for D-4 if you choose that route). Applied via
  Supabase MCP against staging `zkrcjzdemdmwhearhfgg`.
- **L1-backend-auth** — `backend/src/services/auth.service.ts` (D-3 real TOTP or remove the Express MFA
  path), `supabase/functions/create-user/index.ts` (D-14 don't swallow role-write failure),
  `supabase/functions/deactivate-user/` + `reactivate-user/` (D-11 `status`→`is_active`).
- **L2-commitments** — `supabase/functions/after-actions-create/index.ts` (B-1/C-1 title),
  commitment forms/services (B-5/B-6/B-7 owner+tracking, E-6 due_date timezone): `CommitmentEditor`,
  `CommitmentQuickForm.tsx`, `CommitmentForm.tsx`, `services/commitments.service.ts`,
  the after-action route passing `availableUsers`.
- **L3-tasks** — `tasks-create/index.ts` (B-2 tenant), `tasks-update/index.ts` + `TaskEditDialog.tsx`
  (B-3 status/stage), `useTasks.ts` (B-4 i18n), `TaskQuickForm.tsx` (B-8 link error).
- **L4-dossier-wizard** — `form-wizard.tsx`, `useCreateDossierWizard.ts`, `engagement.config.ts`
  (A-3/E-5 validation, A-4 participants), and `dossiers-update/index.ts` + `dossier-api.ts` if you
  scope the edit path (A-1/A-2) here — else mark A-1/A-2 NEEDS-DECISION (it builds a new edit surface).
- **L5-settings** — `SettingsPage.tsx` + settings section components (D-4/E-1 columns, D-5 load,
  D-6/E-4 MFA button, D-7 export, D-8 delete). This is large; if a real prefs table is needed it
  depends on L0-db. Keep avatar bucket (D-9) as NEEDS-DECISION.
- **L6-positions-calendar-rel** — positions error handling (C-4 `AttachPositionDialog.tsx`,
  C-5/E-9 `PositionDossierLinker.tsx`), `AttachmentUploader.tsx` + `i18n/en|ar/positions.json` (E-2),
  calendar participants (C-2 `CalendarEntryForm.tsx` + `calendar-create/index.ts`),
  `RelationshipForm.tsx` (E-7). **Split this if files collide with another lane.**
- **L7-api-client** — `frontend/src/lib/api-client.ts` (E-3 parse error body). This file is shared by
  ~22 repos, so it MUST be its own lane (nothing else may edit it). Step-up/login MFA (D-12 `StepUpMFA.tsx`,
  D-13 `authStore.ts`/`LoginPage.tsx`) can ride here or be their own lane — keep files disjoint.

## Step 4 — Outputs (write these files, nothing else)

1. **`_BACKLOG.md`** — the merged, ranked backlog. Table: `ID | sev | bucket | entity | type | files | one-line fix`.
   Start with counts (CRITICAL/HIGH/MED/LOW and FIX-NOW/NEEDS-DECISION/DEFER tallies).
2. **`_LANES.md`** — for each lane: priority rank, the item IDs it covers, its **exact file list**, and
   a **file→lane disjointness proof** (a table listing every file once with its lane; assert no file
   repeats). Plus a `## NEEDS-DECISION` section: each item + the decision question + the honest-disable
   fallback. Plus a `## DEFER` list.
3. **`_impl-brief-<lane>.md`** for each FIX-NOW lane (e.g. `_impl-brief-L1-backend-auth.md`). Each brief
   is a self-contained worker order: the lane's files, per-item concrete fix spec (what to change, where,
   the correct columns/values per the source-of-truth facts), how to verify (exact `pnpm`/`tsc`/grep
   commands or the migration to apply via Supabase MCP), and the instruction to make **atomic commits**
   (one per item, conventional-commit messages) and to NOT push or open PRs. For `L0-db`, the brief
   lists each migration's SQL intent + that it is applied via the Supabase MCP to staging.

## Rules

- Be concrete: an implementer reading a brief should need zero further discovery. Cite the real
  columns/values from `_FORMAT.md` (e.g. `is_active` not `status`, `owner_user_id` not `owner_id`,
  `sla_deadline`, `tracking_mode` internal⇒automatic/external⇒manual, `due_date` formatted local).
- Keep lanes file-disjoint. If two needed fixes share a file, put both in the SAME lane.
- Work fully autonomously; never ask a question. When done, print: `PLAN COMPLETE` and stop.
