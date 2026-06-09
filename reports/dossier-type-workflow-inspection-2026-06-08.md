# Dossier-Type Workflow Inspection Report

Date: 2026-06-08  
Inspector: Cursor agent (browser automation + live dev stack)  
Branch context: `quick/260608-c9b-country-dossier-workflow-fixes`

## Scope

Started backend and frontend dev servers, authenticated as the local test analyst, and inspected **one representative workflow per dossier type** (8 types). Each workflow was chosen to exercise type-specific UI or routing rather than only the shared overview shell.

## Dev environment

| Service  | Command / notes                                                                                                 | URL                     | Health                              |
| -------- | --------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------- |
| Backend  | `doppler run -- pnpm --filter intake-backend dev`                                                               | `http://localhost:5001` | `GET /health` → `200`, `status: ok` |
| Frontend | Existing Vite dev (Turbo); port **5174** used because **5173 is occupied** by the Understand Anything dashboard | `http://localhost:5174` | Login + dossier routes render       |
| Data     | Staging Supabase via Doppler; seed fixtures from `060-dashboard-demo.sql` and working-group migration           | —                       | Fixture UUIDs used for deep links   |

**Port note:** Default Vite port 5173 currently serves a different app (`Understand Anything`). Intl-Dossier was reachable on **5174**. For local QA, prefer `VITE_DEV_PORT=5174` or stop the conflicting process on 5173.

## Workflows inspected (one per type)

### 1. Country — attach / manage positions

| Item              | Detail                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Route             | `/dossiers/countries/b0000001-0000-0000-0000-000000000008/positions` (UAE)                                       |
| Type-specific tab | **Positions** (extra tab vs base shell)                                                                          |
| Steps             | List → UAE dossier → Positions tab → filters + “Attach Position”                                                 |
| Result            | **Pass (structure)** — tab renders “Attached Positions”, search, link-type and status filters, relationship rail |
| RTL               | **Pass** — Arabic labels (`المواقف المرفقة`, `إرفاق موقف`, tab `المواقف`)                                        |

**Defect:** Attach Position dialog shows **raw i18n keys** instead of copy:

- `positions.attach.dialogTitle`
- `positions.attach.searchPlaceholder`
- `positions.attach.dialogTrigger`
- `positions.attach.attachSelected`

Root cause: `AttachPositionDialog` uses `useTranslation()` (default namespace) but keys are written as `positions.attach.*` instead of `attach.*` under the `positions` namespace.

---

### 2. Organization — MoU registry

| Item              | Detail                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| Route             | `/dossiers/organizations/b0000001-0000-0000-0000-000000000005/mous` (OECD)   |
| Type-specific tab | **MOUs**                                                                     |
| Steps             | Open OECD → MoUs tab                                                         |
| Result            | **Pass** — empty state “No MoUs”; shell, tabs, and relationship sidebar load |

---

### 3. Forum — dossier-scoped work items

| Item     | Detail                                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Route    | `/dossiers/forums/b0000001-0000-0000-0000-000000000003/tasks` (G20 Data Gaps Initiative)                                                  |
| Workflow | **Tasks** tab with unified work-item strip                                                                                                |
| Steps    | Open forum → Tasks tab → filter chips All / Tasks / Commitments / Intakes                                                                 |
| Result   | **Pass** — “Work Items 2 · 2 Overdue”; shows task _Finalize G20 cooperation agreement_ and commitment _Draft after-action — G20 DGI call_ |

---

### 4. Engagement — workspace (non-shell route)

| Item     | Detail                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route    | `/engagements/b0000002-0000-0000-0000-000000000002/overview` (Prep session — G20)                                                                                                             |
| Workflow | Engagement **workspace** (redirect from `/dossiers/engagements/$id`)                                                                                                                          |
| Steps    | Overview → stage chips (Intake → Closed) → Tasks tab                                                                                                                                          |
| Result   | **Partial** — overview shows Participants, Recent Activity, Quick Actions, **Create Task**; Tasks tab shows stage pipeline but **“No tasks yet”** despite linked work on parent forum dossier |
| Note     | Engagements intentionally use `/engagements/$id/*`, not `DossierShell`                                                                                                                        |

---

### 5. Topic — positions on policy dossier

| Item              | Detail                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Route             | `/dossiers/topics/b0000001-0000-0000-0000-000000000007/positions` (Vision 2030 Alignment)       |
| Type-specific tab | **Positions** (same pattern as country)                                                         |
| Result            | **Pass** — “Attached Positions” + Attach control; same i18n defect as country when dialog opens |

---

### 6. Working group — linked engagements

| Item     | Detail                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------- |
| Route    | `/dossiers/working_groups/a0000000-0000-0000-0000-000000000401/engagements` (Climate Coordination WG) |
| Workflow | **Engagements** tab on WG dossier                                                                     |
| Result   | **Pass (empty)** — section heading “Engagements” renders; no rows in fixture data                     |

---

### 7. Person — VIP profile overview

| Item          | Detail                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route         | `/dossiers/persons/b0000011-0000-0000-0000-000000000001/overview` (Dr. Sari Widodo, seed participant)                                                |
| Workflow      | Person **overview** (Profile, Engagement History, Analytics cards)                                                                                   |
| Result        | **Pass** on direct deep link                                                                                                                         |
| List workflow | `/dossiers/persons` shows title **Key Contacts** (intentional i18n) but **no person cards** despite seed row — list discovery broken or filtered out |

---

### 8. Elected official — create wizard (list empty)

| Item               | Detail                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| List route         | `/dossiers/elected-officials`                                                                                                   |
| Workflow inspected | **Create** wizard (no seeded elected officials)                                                                                 |
| Route              | `/dossiers/elected-officials/create`                                                                                            |
| Result             | **Pass** — 4-step wizard: Identity → Person Details → Office & Term → Review; bilingual fields, country selector, date spinners |
| List               | Empty table; **Add Elected Official** CTA present                                                                               |

---

## Cross-cutting workflow: Add to Dossier (country)

Triggered from UAE overview (**Add to Dossier** / `إضافة إلى الملف`). Menu offers:

1. New intake request
2. New task
3. New commitment
4. New position
5. Schedule event
6. Add relationship
7. Create AI brief
8. Upload document

**Result:** **Pass** — menu renders correctly in Arabic with clear actions.

## Shared dossier shell (all types using `DossierShell`)

Base tabs confirmed on country dossier:

`Overview · Engagements · Documents · Tasks · Timeline · Audit Log` + type-specific extra tab.

Country overview (UAE) sections: Summary, Analytics, Bilateral Summary, Key Contacts, Engagements by Stage, Recent Activity, Relationship Map.

## Summary matrix

| Dossier type     | Workflow inspected            | Status  | Notes                                     |
| ---------------- | ----------------------------- | ------- | ----------------------------------------- |
| Country          | Positions tab + attach dialog | Partial | UI shell OK; attach dialog i18n keys leak |
| Organization     | MoUs tab                      | Pass    | Empty state OK                            |
| Forum            | Tasks / work items            | Pass    | 2 items, overdue badge                    |
| Engagement       | Workspace overview + tasks    | Partial | Overview OK; tasks empty vs forum linkage |
| Topic            | Positions tab                 | Partial | Same attach i18n issue as country         |
| Working group    | Engagements tab               | Pass    | Empty list OK                             |
| Person           | Overview (VIP)                | Partial | Detail OK; list empty                     |
| Elected official | Create wizard                 | Pass    | No list rows to inspect                   |

## Issues (prioritized)

### High

1. **Attach Position dialog i18n** — Raw keys visible (`positions.attach.*`). Fix: `useTranslation('positions')` and `t('attach.dialogTitle')`, or register keys in default namespace.

### Medium

2. **Persons list empty** — Seed person `b0000011-…` opens via direct URL but `/dossiers/persons` shows no cards. Blocks “browse → open person” workflow.

3. **Engagement tasks disconnected from dossier work items** — Forum dossier shows 2 work items; engagement workspace Tasks tab shows none. May be inheritance/query gap.

4. **Dev port collision** — Port 5173 serves another Vite app; Intl-Dossier may bind elsewhere without explicit `VITE_DEV_PORT`.

### Low

5. **Backend API errors during session** — Winston logged intermittent `API Error` / `Security event: HTTP error response` while browsing (likely 401/404 on unauthenticated probes). Worth correlating with request paths.

6. **Elected officials** — No seed data; only create path verifiable.

## Recommendations

1. Fix `AttachPositionDialog` translation namespace (quick win; affects country + topic positions workflows).
2. Investigate `usePersons` / persons list RPC — why seed VIP is excluded from list results.
3. Align engagement workspace Tasks tab with `work_item_dossiers` inheritance from parent forum/country dossiers.
4. Document/localize dev port: `VITE_DEV_PORT=5174` in `.env.test.example` when 5173 is shared.
5. Add elected-official seed row (optional) so list + Committees tab can be inspected end-to-end.

## Verification artifacts

- Live URLs exercised on `http://localhost:5174` with authenticated session
- Fixture UUIDs: `supabase/seed/060-dashboard-demo.sql`, `supabase/migrations/20260426120000_seed_working_groups_test_data.sql`
- Related prior report: `reports/dev-workflow-report-2026-06-08.md` (auth/proxy setup)

No application source code was modified for this inspection.
