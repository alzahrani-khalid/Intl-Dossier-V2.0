# Elected Official Dossier Workflow Inspection

**Date:** 2026-06-09  
**Scope:** End-to-end `elected_official` workflow (list → detail shell → overview/committees tabs → section components → backend/DB contracts → i18n → RTL)  
**Mode:** Read-only code inspection (no source edits)

---

## Workflow map (as implemented)

| Stage           | Route / entry                                   | Data source                                                                                                  | UI surface                                                                                                     |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| List            | `/_protected/dossiers/elected-officials/`       | Express `GET /api/elected-officials` → RPC `search_persons_advanced` (`person_subtype = 'elected_official'`) | `ElectedOfficialListTable` + `elected-officials` i18n namespace                                                |
| Create          | `/_protected/dossiers/elected-officials/create` | Wizard → dossier `type='person'` + `persons.person_subtype='elected_official'`                               | Form wizard (`OfficeTermStep`, etc.)                                                                           |
| Detail shell    | `/_protected/dossiers/elected-officials/$id/*`  | `useDossier` → Edge `dossiers-get` → `persons` `SELECT *`                                                    | `DossierShell` (`dossierType="elected_official"` is routing-only; DB type is `person`)                         |
| Overview tab    | `.../$id/overview`                              | **Broken path:** `useElectedOfficial` → Express `GET /api/elected-officials/:id`                             | `ElectedOfficialOverviewTab` + office/committees cards                                                         |
| Committees tab  | `.../$id/committees`                            | Same broken `useElectedOfficial`                                                                             | Committees table/cards                                                                                         |
| Rich sections   | **Not routed**                                  | Would use `PersonDossierDetail` → `dossier.extension` from `useDossier`                                      | `ElectedOfficialProfile`, `TermHistory`, `CommitteeAssignments`, `ContactPreferencesSection`, `StaffDirectory` |
| Alternate entry | `/_protected/dossiers/persons/$id/*`            | Same `person` row; no subtype redirect                                                                       | Generic `PersonOverviewTab` (no committees tab, no EO cards)                                                   |

**DB model (verified):** Elected officials are `persons` rows with `person_subtype = 'elected_official'`. Term, committee, staff, and contact-preference data live in `persons` columns (`committee_assignments`, `contact_preferences`, `staff_contacts` JSONB, etc.) per migration `20260202000001_merge_elected_official_into_person.sql`. There is no `elected_officials` table and no `person_roles` / separate committee table for this feature.

---

## Findings (real defects only)

### 1. CRITICAL — Detail API returns 404 for every elected official

**Location:** `backend/src/api/elected-officials.ts` lines 186–217

**Why it is a bug:** `GET /api/elected-officials/:id` calls RPC `get_person_full`, which returns a nested JSON object `{ person: { …, person_subtype, committee_assignments, … }, roles, affiliations, … }` (see `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` lines 428–482). The handler assigns that object to `personData` and checks `personData?.person_subtype !== 'elected_official'`. `person_subtype` lives on `personData.person`, not the root, so the check always fails and the route responds **404** for valid elected officials.

**Recommended fix:** After the RPC call, normalize: `const profile = Array.isArray(data) ? data[0] : data; const person = profile?.person ?? profile;` then verify `person.person_subtype === 'elected_official'` and return a **flat** `ElectedOfficial` payload (merge dossier fields from `person` with elected-official columns), e.g. `res.json({ data: person })` without the extra nesting, or unwrap in the hook.

---

### 2. CRITICAL — `useElectedOfficial` response shape does not match consumers

**Location:** `frontend/src/domains/elected-officials/hooks/useElectedOfficials.ts` lines 66–71; consumers at `ElectedOfficialOfficeCard.tsx` (28–29), `ElectedOfficialCommitteesCard.tsx` (26–41), `committees.tsx` (32–44)

**Why it is a bug:** Even if finding #1 were fixed to return 200, the handler currently does `res.json({ data: personData })` where `personData` is the full `get_person_full` envelope. The hook types the result as `ElectedOfficial` and cards read `official?.office_name_en`, `official?.committee_assignments`, etc. Those fields are on `data.person`, not the root—so overview office card, overview committees card, and the Committees tab would show empty / “no data” despite valid DB rows.

**Recommended fix:** In `useElectedOfficial`, unwrap: `const res = await apiGet<{ data: ElectedOfficial }>(...); return res.data` (after backend returns a flat person row). Align `ElectedOfficial` type with the flattened RPC/backend shape.

---

### 3. HIGH — Elected-official section components are unreachable in the live app

**Location:** `frontend/src/components/dossier/PersonDossierDetail.tsx` (entire elected-official branch, lines 75–160); `frontend/src/pages/dossiers/PersonDossierPage.tsx` (only importer)

**Why it is a bug:** `ElectedOfficialProfile`, `TermHistory`, `CommitteeAssignments`, `ContactPreferencesSection`, and `StaffDirectory` are **only** rendered from `PersonDossierDetail`. `PersonDossierPage` is not imported by any route under `frontend/src/routes/`. The live elected-official detail flow uses tab routes (`overview`, `committees`, …) inside `DossierShell`, not `PersonDossierDetail`. Users never see contact preferences, staff directory, term history, or the full profile section in production routes—only the thinner overview cards and committees tab (which are themselves broken via finding #2).

**Recommended fix:** Add a detail tab (e.g. `profile`) under `elected-officials/$id` that loads `useDossier` and renders `PersonDossierDetail` when `extension.person_subtype === 'elected_official'`, or mount those sections on the overview tab using `useDossier` extension data.

---

### 4. HIGH — List pagination total ignores active filters

**Location:** `backend/src/api/elected-officials.ts` lines 151–165

**Why it is a bug:** List results come from `search_persons_advanced` with `p_office_type`, `p_party`, `p_is_current_term`, `p_country_id`, and `p_search_term`, but `total` is computed with a separate head count: `persons` where `person_subtype = 'elected_official'` only. Filtered lists show wrong page counts and can display empty pages while `total` still reflects the full universe.

**Recommended fix:** Add an RPC `count_persons_advanced` with the same filter parameters, or run a filtered count query mirroring the RPC `WHERE` clause; return that as `total`.

---

### 5. HIGH — Arabic list columns always show English field values

**Location:** `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` lines 258–275, 320–324

**Why it is a bug:** Display names respect RTL via `formatPersonLabel` and `identityMap`, but office, party, district, and country cells always bind `office_name_en`, `party_en`, `district_en`, and `country_name_en`. In Arabic mode (`isRTL === true`), users see English office/party/district/country text while names are Arabic—a bilingual data contract mismatch on the same row.

**Recommended fix:** For each column, use the same pattern as overview cards: `isRTL ? (item.office_name_ar ?? item.office_name_en) : item.office_name_en` (extend list RPC to return `*_ar` and `country_name_ar` if missing).

---

### 6. HIGH — Committee analytics metric uses wrong stat

**Location:** `frontend/src/domains/analytics/hooks/useAnalyticsForDossier.ts` lines 138–149; used from `ElectedOfficialOverviewTab.tsx` line 34

**Why it is a bug:** For `dossierType === 'elected_official'`, the “Committees” metric sets `value: s.related_dossiers_count ?? 0`. `related_dossiers_count` counts linked dossiers from overview stats, not `persons.committee_assignments` length. The overview card label implies committee memberships; the number reflects relationship graph size.

**Recommended fix:** Pass `committee_assignments.length` from `useDossier` extension (or from a dedicated overview field), or rename the metric to match `related_dossiers_count`.

---

### 7. MEDIUM — Pagination controls use wrong i18n keys (English fallback in Arabic)

**Location:** `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` lines 340–351

**Why it is a bug:** Previous/Next buttons call `t('termStatus.expired', { ns: 'common', defaultValue: 'Previous' })` and `t('termStatus.current', { ns: 'common', defaultValue: 'Next' })`. Those keys do not exist in the `common` namespace (`common.previous` / `common.next` do). i18next falls back to English `defaultValue`, so Arabic sessions get English pagination labels.

**Recommended fix:** Use `t('common:previous')` and `t('common:next')` (or `common.actions.previous` / `common.actions.next`).

---

### 8. MEDIUM — `sections.electedOfficial.*`, `importance.*`, `status.currentTerm`, `dataSource.*` missing from active i18n bundles

**Location:** Section components under `frontend/src/components/dossier/sections/` (e.g. `ElectedOfficialProfile.tsx` lines 77–81, 107, 121); active bundles `frontend/src/i18n/en/dossier.json` and `frontend/src/i18n/ar/dossier.json` (no `sections.electedOfficial` block—confirmed via search; `sections` ends at `workingGroup` / `topic` without `electedOfficial`)

**Why it is a bug:** The app loads dossier strings from `frontend/src/i18n/*/dossier.json` (`frontend/src/i18n/index.ts`). Duplicate keys exist only in **unused** `frontend/public/locales/*/dossier.json`. If section components are wired up (finding #3), UI will show raw keys like `sections.electedOfficial.profile` and `importance.regular` in both EN and AR. `TermHistory` also uses `dataSource.*` (line 160), which is absent from src bundles.

**Recommended fix:** Copy `sections.electedOfficial`, `importance`, `status.currentTerm`, and `dataSource` from `public/locales` into `src/i18n/en/dossier.json` and `src/i18n/ar/dossier.json`, or delete the stale `public/locales` copies to avoid drift.

---

### 9. MEDIUM — No error handling on `useElectedOfficial` in overview/committees UI

**Location:** `ElectedOfficialOfficeCard.tsx` (28–29, no `isError`); `ElectedOfficialCommitteesCard.tsx` (26–27); `committees.tsx` (32–52)

**Why it is a bug:** When the detail API fails (404/500 from findings #1–#2), queries error but components only branch on `isLoading` and empty data. Users see “No office data” / “No committee assignments” instead of an error state—indistinguishable from legitimately empty records.

**Recommended fix:** Handle `isError` / `error` from `useQuery` and surface `elected-officials:list.error` or a dedicated detail error message.

---

### 10. MEDIUM — Persons list does not route elected officials to the elected-official detail workflow

**Location:** `frontend/src/routes/_protected/dossiers/persons/-PersonsListPage.tsx` line 78; `persons/$id.tsx` uses `dossierType="person"` without subtype check

**Why it is a bug:** `usePersons` does not exclude `person_subtype = 'elected_official'`. Clicking an elected official from `/dossiers/persons` opens the **person** shell (no Committees tab, `PersonOverviewTab` instead of `ElectedOfficialOverviewTab`). The same DB row is presented with a reduced workflow versus `/dossiers/elected-officials/$id`.

**Recommended fix:** In list navigation or `persons/$id` `beforeLoad`, if `extension.person_subtype === 'elected_official'`, redirect to `/dossiers/elected-officials/$id/overview`; or filter elected officials out of the persons list.

---

### 11. LOW — `is_current_term === null` rendered as “Expired”

**Location:** `ElectedOfficialListTable.tsx` lines 265–272, 307–317

**Why it is a bug:** Term badge uses strict `=== true` for current; any other value (including `null` from RPC) shows the expired badge. Ambiguous term state is mislabeled.

**Recommended fix:** Treat `null`/`undefined` as a third “unknown” state or default to schema default (`TRUE`).

---

### 12. LOW — Stale duplicate i18n file not wired to the app

**Location:** `frontend/public/locales/en/dossier.json` and `ar/dossier.json` (contain full `sections.electedOfficial` + `importance`) vs `frontend/src/i18n/*/dossier.json`

**Why it is a bug:** Not a runtime bug today because `public/locales` is not loaded, but it causes false confidence that elected-official dossier strings are translated. Contributes to finding #8.

**Recommended fix:** Remove or sync; single source of truth under `src/i18n`.

---

## RTL review (section components + list)

- Elected-official **section** components use logical properties (`text-start`, `me-*`, `ms-*`) and no `ml-*` / `mr-*` / `text-left` / `text-right` in `frontend/src/components/dossier/sections/` (grep clean).
- **List table** RTL issue is **content locale** (finding #5), not physical CSS direction.

---

## Data contract notes (verified OK)

| Concern                                                                                                          | Status                                                                                            |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `search_persons_advanced` selects `p.email`, `p.phone`                                                           | OK — `persons.email` / `persons.phone` exist (used in search vector migration)                    |
| `dossiers-get` loads elected-official JSONB via `persons` `SELECT *`                                             | OK for shell / potential `PersonDossierDetail`                                                    |
| `committee_assignments` / `staff_contacts` / `contact_preferences` column names match frontend `PersonExtension` | OK in types and migration                                                                         |
| Separate `staff_contacts` **table** (migration `20260206120010`)                                                 | Different feature; `StaffDirectory` correctly reads `persons.staff_contacts` JSONB (not a defect) |

---

## Priority summary

| Severity | Count | Top items                                                                        |
| -------- | ----- | -------------------------------------------------------------------------------- |
| CRITICAL | 2     | Detail API 404 + response shape mismatch                                         |
| HIGH     | 4     | Dead section UI, wrong pagination total, AR list columns, wrong committee metric |
| MEDIUM   | 4     | Pagination i18n, missing dossier keys, silent API errors, dual person/EO routes  |
| LOW      | 2     | Null term badge, stale public locales                                            |

**Suggested fix order:** (1) Backend detail flatten + subtype check → (2) Hook unwrap → (3) Wire `PersonDossierDetail` or migrate cards to `useDossier` → (4) List i18n/RTL + pagination total → (5) Sync `src/i18n` dossier keys.

---

_Inspection performed against repository state on 2026-06-09. Backend health check: `http://localhost:5001/health` OK; elected-officials list requires auth (401 without token)._
