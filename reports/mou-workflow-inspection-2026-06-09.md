# MoU Workflow Inspection — 2026-06-09

**Scope:** Read-only audit of MoU list/library, create/edit, detail, parties/signatories, lifecycle/renewal/alerts, edge functions, and backend API.  
**Excluded (fixed this session):** `DossierMoUsTab` / `MoUStatusCard` lifecycle_state mapping, `deleted_at` filter, and status badge colors.  
**Schema reference (verified):** `mous` uses `title`, `title_ar`, `lifecycle_state` (`mou_state` enum: `draft`, `negotiation`, `pending_approval`, `signed`, `active`, `suspended`, `expired`, `terminated`), `signatory_1_dossier_id`, `signatory_2_dossier_id`, `dates` (jsonb), `deleted_at` / `is_deleted`. There is **no** `status`, `workflow_state`, `title_en`, `primary_party_id`, or `secondary_party_id` column on the live table.

---

## Workflow map (current state)

| Stage                    | Route / surface                                       | Data source            | Status                                                    |
| ------------------------ | ----------------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| Global library           | `/mous` → `MousPage`                                  | `mous_frontend` view   | Partially wired; filters/KPIs wrong; no detail navigation |
| Org dossier tab          | `/dossiers/organizations/$id/mous` → `DossierMoUsTab` | `mous` direct          | List works; click is no-op (no detail route)              |
| Overview card            | `MoUStatusCard` on org overview                       | `mous.lifecycle_state` | Fixed (excluded)                                          |
| Detail                   | `/mous/$id` (referenced)                              | —                      | **Route does not exist**                                  |
| Create / edit            | —                                                     | —                      | **No UI**                                                 |
| Parties                  | `mou_parties` table + `get_mou_parties` RPC           | DB only                | **No frontend**                                           |
| Renewals / expiry alerts | `mou-renewals` edge + SQL RPCs                        | Edge + DB              | Edge embeds broken; **no frontend consumer**              |
| Lifecycle transitions    | `mou-lifecycle` edge                                  | Edge                   | Wrong columns; **no frontend consumer**                   |
| CRUD API                 | `backend/src/api/mous.ts`                             | Express                | Uses obsolete `status` / `title_en` columns               |
| Legacy edge CRUD         | `supabase/functions/mous/index.ts`                    | Edge                   | Entire payload/schema obsolete                            |

**Frontend hooks:** No dedicated MoU hooks. Only inline `useQuery` in `MousPage`, `DossierMoUsTab`, and `MoUStatusCard`. No calls to `functions/v1/mou-*` from `frontend/src`.

---

## Findings

### CRITICAL

#### 1. MoU detail route missing; navigation targets 404

**Location:**

- `frontend/src/pages/DossierSearchPage.tsx` lines 151–152
- `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts` lines 97–98
- `frontend/src/routeTree.gen.ts` (only `/_protected/mous`, no `/_protected/mous/$id`)

**Why it is a bug:** Global search and the quick switcher navigate to `/mous/${id}`, but TanStack Router has no matching route file. Users selecting a MoU from search get a dead link. `MousPage` row click is also a TODO stub (lines 299–301).

**Recommended fix:** Add `frontend/src/routes/_protected/mous/$id.tsx` with a detail page (read from `mous` + `get_mou_parties` RPC). Wire `MousPage` `onRowClick`, `DossierMoUsTab` card `onClick`, and keep search URLs aligned.

---

#### 2. `MousPage` crashes rendering real `lifecycle_state` values

**Location:** `frontend/src/pages/MoUs/MousPage.tsx` lines 33–42, 44–76, 146

**Why it is a bug:** `WORKFLOW_STATES` only defines legacy keys (`internal_review`, `external_review`, `renewed`, …). The view maps `lifecycle_state` → `workflow_state`, so rows commonly carry `pending_approval`, `suspended`, or `terminated`. `WorkflowIndicator` does `stateConfig.color` without a guard; when `stateConfig` is `undefined`, React throws and the whole table fails.

**Recommended fix:** Replace `WORKFLOW_STATES` with the real `mou_state` enum. Guard unknown states: `const stateConfig = MOU_STATE_CONFIG[state] ?? MOU_STATE_CONFIG.draft`. Map colors/labels to `mous.status.*` keys under the `dossiers` namespace (or extend `common.mous.statuses`).

---

#### 3. Backend MoU API queries nonexistent `status` column

**Location:**

- `backend/src/api/mous.ts` lines 126–139 (`/stats`)
- `backend/src/services/mou.service.ts` lines 165–168, 175–180, 196–198, 288, 301–302, 355–379
- `backend/src/api/mous.ts` lines 386–387 (`renew` → `transitionMoUStatus(id, 'renewed', …)`)

**Why it is a bug:** Live `mous` rows use `lifecycle_state`, not `status`. `/api/mous/stats` filters `.eq('status', 'active'|'expired'|'draft')`, which PostgREST rejects or returns empty. `getMoUs` search uses `title_en` (column is `title`). `renewed` is not a `mou_state` value. Any client of `/api/mous` gets errors or silent empty data.

**Recommended fix:** Rename all filters/updates to `lifecycle_state` with `mou_state` enum values. Search: `title.ilike` + `title_ar.ilike`. Renewal should set `lifecycle_state: 'active'` (or a dedicated renewal record) per `20260110400001_mou_renewal_workflow.sql`. Add `.is('deleted_at', null)` on list queries.

---

#### 4. `supabase/functions/mous/index.ts` — full schema mismatch

**Location:** `supabase/functions/mous/index.ts` lines 5–33, 61–66, 95–112, 150–176, 202–240, 344–348

**Why it is a bug:** The edge function reads/writes `workflow_state`, `title_en`, `primary_party_id`, `secondary_party_id`, `owner_id`, and embeds `primary_party:primary_party_id(...)`. None of these exist on the current `mous` table. GET list/detail, POST insert, transition, and DELETE guards all fail against staging/production schema.

**Recommended fix:** Retire or rewrite against `title`, `title_ar`, `lifecycle_state`, `signatory_*_dossier_id`, `dates`, `mou_parties`. Prefer delegating to existing SQL RPCs (`initiate_mou_renewal`, `get_expiring_mous`) rather than duplicating CRUD here.

---

#### 5. `mou-renewals` edge — PostgREST embeds select removed columns

**Location:** `supabase/functions/mou-renewals/index.ts` lines 129–138, 213–237, 263–283, 362–376, 490–497

**Why it is a bug:** Select graphs request `title_en`, `workflow_state`, and `primary_party:primary_party_id(...)`. PostgREST returns 400 (“column does not exist” / “Could not find a relationship”). List/detail renewal views, alert panels, and acknowledge flows break even though `get_expiring_mous` RPC (lines 109–112) is correctly implemented in SQL.

**Recommended fix:** Change embeds to `title`, `lifecycle_state`, and join signatories via `signatory_1_dossier_id` / `signatory_2_dossier_id` → `dossiers(full_name_en, full_name_ar)`, matching `get_expiring_mous` in `20260110400001_mou_renewal_workflow.sql`.

---

### HIGH

#### 6. `MousPage` filters and KPIs use obsolete workflow vocabulary

**Location:** `frontend/src/pages/MoUs/MousPage.tsx` lines 33–42, 194, 221–222, 247–250, 276–284

**Why it is a bug:** Filter chips include `internal_review`, `external_review`, `renewed` — not in `mou_state`. “In progress” counts only those three states, so `negotiation` and `pending_approval` MoUs are excluded. “Active” count uses `workflow_state === 'active'` only (misses `signed` if treated as active elsewhere). Filters return empty sets for most chips while data exists.

**Recommended fix:** Drive filters from `mou_state` enum. KPI buckets: active = `active` + `signed`; in progress = `negotiation` + `pending_approval`; include `suspended` in a dedicated bucket or warning state.

---

#### 7. `mous_frontend` view omits soft-delete filter

**Location:** `supabase/migrations/036_update_mous_frontend_view.sql` lines 5–25

**Why it is a bug:** The view selects `FROM public.mous m` with no `WHERE deleted_at IS NULL` (or `is_deleted = false`). Soft-deleted MoUs appear in the global library while dossier-scoped queries (`DossierMoUsTab`, overview service) correctly filter them out — inconsistent UX and data leak.

**Recommended fix:** Add `WHERE m.deleted_at IS NULL AND m.is_deleted IS NOT TRUE` to the view definition (new migration).

---

#### 8. Library party column reads stale `parties` jsonb, not signatory dossiers

**Location:**

- `supabase/migrations/036_update_mous_frontend_view.sql` lines 17–24
- `frontend/src/pages/MoUs/MousPage.tsx` lines 128–139

**Why it is a bug:** Canonical linking is `signatory_1_dossier_id` / `signatory_2_dossier_id` (see `20251022000009_update_polymorphic_refs.sql`). The view builds `primary_party` / `secondary_party` from `m.parties->0/1`, which is often empty when signatories are dossier-linked. The list shows blank party names despite valid relationships.

**Recommended fix:** Rewrite view joins: `LEFT JOIN dossiers d1 ON m.signatory_1_dossier_id = d1.id` (same for d2), expose `full_name_en` / `full_name_ar`. Fallback to `parties` jsonb only when dossier IDs are null.

---

#### 9. No create or edit MoU UI

**Location:** `frontend/src/pages/MoUs/MousPage.tsx` lines 200–203

**Why it is a bug:** “Add MOU” button has no `onClick`, no route, and no form component exists under `frontend/src`. The workflow cannot start from the app; analysts can only view partial lists.

**Recommended fix:** Add create/edit routes (or drawer) posting to a single API layer that writes `title`, `title_ar`, `lifecycle_state`, signatory dossier IDs, and `mou_parties` rows. Reuse IntelDossier form patterns and `dossiers.mous.fields` i18n keys already present in EN (partial AR).

---

#### 10. `mou-lifecycle` edge uses wrong column names and parallel lifecycle model

**Location:** `supabase/functions/mou-lifecycle/index.ts` lines 101–106, 148–149, 183–226

**Why it is a bug:** GET selects `title_en` and `lifecycle_stage`; PATCH updates `lifecycle_stage` with values like `cabinet_approved`, `in_force`. Authoritative status column per schema is `lifecycle_state` (`mou_state`). `title_en` does not exist (`title` does). Any consumer gets 400/500 from PostgREST. This duplicates but does not align with `lifecycle_state` used by notification triggers and renewal RPCs.

**Recommended fix:** Either (a) deprecate this edge in favor of `lifecycle_state` transitions aligned with `mou_state`, or (b) document `lifecycle_stage` as a separate sub-track and stop selecting `title_en`. Frontend should use one field only.

---

#### 11. Query failures on library page shown as empty state

**Location:** `frontend/src/pages/MoUs/MousPage.tsx` lines 84–107, 293–305

**Why it is a bug:** `useQuery` destructures only `data` and `isLoading`, not `isError` / `error`. On PostgREST failure, `mous` is undefined and the UI renders `t('common.noData')`, hiding the real error (contrast `DossierMoUsTab` which surfaces errors).

**Recommended fix:** Destructure `isError, error` and render an alert panel (same pattern as `DossierMoUsTab` lines 115–126).

---

#### 12. Dossier MoU tab — click handler is still a no-op

**Location:** `frontend/src/components/dossiers/DossierMoUsTab.tsx` lines 151–153

**Why it is a bug:** Cards are `cursor-pointer` but `onClick` is an empty TODO. Users expect navigation to detail; nothing happens.

**Recommended fix:** Same as finding #1 — navigate to `/mous/$id` once route exists.

---

#### 13. No frontend parties / signatories management

**Location:** DB: `mou_parties`, RPC `get_mou_parties` (`database.types.ts` ~34171); frontend: **no references**

**Why it is a bug:** Multi-party signing (`mou_parties` migration `20260206120002_mou_parties.sql`) is implemented in DB with RLS and helper RPC, but there is zero UI to list, add, or update signatories. `mou-lifecycle` reads `mou_parties` server-side only.

**Recommended fix:** Add a parties section on MoU detail using `supabase.rpc('get_mou_parties', { p_mou_id })` and CRUD against `mou_parties` with role/status fields.

---

### MEDIUM

#### 14. Arabic i18n gaps on global MoU library status labels

**Location:**

- `frontend/src/pages/MoUs/MousPage.tsx` line 60 (`t(\`mous.statuses.${state}\`)` default namespace)
- `frontend/src/i18n/en/common.json` lines 290–298
- `frontend/src/i18n/ar/common.json` lines 290–298

**Why it is a bug:** `common.mous.statuses` lists only legacy states. Real values like `pending_approval`, `suspended`, `terminated` have no AR/EN entries. i18next falls back to raw keys or English in Arabic mode on the library page.

**Recommended fix:** Align `common.mous.statuses` with `mou_state` enum (mirror `dossiers.mous.status` in `en/dossiers.json` lines 506–517 and `ar/dossiers.json` lines 288–297).

---

#### 15. Signed date jsonb key inconsistency (`signed` vs `signing_date`)

**Location:**

- `frontend/src/components/dossiers/DossierMoUsTab.tsx` lines 174–178 (`dates.signed`)
- `supabase/migrations/036_update_mous_frontend_view.sql` line 12 (`dates->>'signing_date'`)

**Why it is a bug:** Library view and dossier tab use different keys for the same logical date. If `dates` jsonb stores `signing_date`, the dossier tab never shows signed date; if it stores `signed`, the library column is null.

**Recommended fix:** Standardize on one key in DB seed/write paths; read with fallback: `dates?.signed ?? dates?.signing_date` in UI.

---

#### 16. `WorkflowIndicator` ChevronRight not flipped in RTL

**Location:** `frontend/src/pages/MoUs/MousPage.tsx` lines 71–72

**Why it is a bug:** Directional chevron without `isRTL ? 'rotate-180' : ''` violates project RTL rules; transition affordance points the wrong way in Arabic.

**Recommended fix:** Use `useDirection()` inside `WorkflowIndicator` and apply logical rotation, or replace with a chevron that uses `rtl:rotate-180`.

---

#### 17. `countryService.getMoUs` uses jsonb `parties` contains filter

**Location:** `backend/src/services/country.service.ts` lines 161–166

**Why it is a bug:** Queries `.contains('parties', [{ country_id: countryId }])` while signatory model prefers dossier IDs. Country-linked MoUs linked only via `signatory_*_dossier_id` or `country_id` column are missed.

**Recommended fix:** Query `country_id = $id OR signatory dossiers resolving to that country`, or use `mou_parties` join.

---

### LOW

#### 18. Renewal / notification edges unreachable from UI

**Location:** `supabase/functions/mou-renewals/index.ts`, `supabase/functions/mou-notifications/index.ts`; frontend: no imports

**Why it is a bug:** Substantial renewal and alert infrastructure exists (RPCs, `mou_expiration_alerts`, cron endpoints `process-alerts`, `auto-expire`) but no page, hook, or widget calls them. Expiry chips on `MousPage` are client-side only (30-day window) and not tied to `mou_expiration_alerts`.

**Recommended fix:** Add renewal inbox widget or dossier-level alert strip calling `mou-renewals?action=alerts` / `get_expiring_mous`.

---

#### 19. E2E MoU workflow test is a no-op placeholder

**Location:** `e2e/tests/mou-workflow.spec.ts` lines 4–8

**Why it is a bug:** Test always passes (`expect(true).toBe(true)`); nav testid `nav-mous` is not present in codebase grep. Provides false confidence.

**Recommended fix:** Implement real flow: open `/mous`, assert table loads, filter by `negotiation`, skip detail until route exists.

---

#### 20. Contract tests target obsolete edge schema

**Location:** `tests/contract/mous.test.ts` (uses `primary_party_id`, `workflow_state`, etc.)

**Why it is a bug:** Tests encode the pre-migration `004_mous.sql` shape, not current `lifecycle_state` / `title` schema. CI can pass against mocks while production fails.

**Recommended fix:** Regenerate contract tests from `database.types.ts` `mous` Row and `mou_state` enum.

---

## Surfaces intentionally excluded from findings

Per inspection brief, the following were **not** re-reported after this session’s fixes:

- `DossierMoUsTab` / `MoUStatusCard` `lifecycle_state` mapping
- `deleted_at` filtering on dossier-scoped queries
- Status badge color mapping on those components

## Summary

The MoU workflow is **list-only and fragmented**. Dossier-scoped lists query the real `mous` table correctly; the global library uses a view with legacy workflow vocabulary and wrong party resolution. **Detail, create, edit, and parties management are missing entirely.** Backend and edge layers contain large blocks still targeting the old `workflow_state` / `title_en` / `primary_party_id` schema, while SQL RPCs in `20260110400001_mou_renewal_workflow.sql` already use the correct shape — the codebase needs consolidation on `lifecycle_state` and signatory dossier IDs.

**Priority order:** (1) detail route + navigation, (2) fix `MousPage` crash and filters, (3) fix `mous_frontend` view (soft-delete + parties), (4) align edge/backend contracts, (5) build create/edit + parties UI.
