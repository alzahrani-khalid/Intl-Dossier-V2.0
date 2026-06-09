# Person Dossier Workflow Inspection

**Date:** 2026-06-09  
**Scope:** `person` dossier type only (excludes `elected_official` as a separate product surface, though elected officials share the `persons` extension table via `person_subtype`)  
**Mode:** Read-only code inspection (no source edits)

---

## Workflow map (as implemented)

| Step                                                                         | Route / entry                                                     | Data source                                                                                           | UI                                                                                       |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| List (canonical)                                                             | `/dossiers/persons` → `-PersonsListPage.tsx`                      | `usePersons` → `persons` edge fn → RPC `search_persons_advanced`                                      | `ListPageShell` + `PersonsGrid` (initials avatars)                                       |
| List (legacy)                                                                | `/persons` → `pages/persons/PersonsListPage.tsx`                  | Same `usePersons` hook                                                                                | Full-page cards → navigates to `/persons/$personId`                                      |
| Detail layout                                                                | `/dossiers/persons/$id` → `DossierShell` (`dossierType="person"`) | `useDossier` / `dossiers-get`                                                                         | Shared tab nav only (no person-specific tabs)                                            |
| Overview tab                                                                 | `/dossiers/persons/$id/overview` → `PersonOverviewTab`            | `useDossierOverview`                                                                                  | Summary stats, analytics, `PersonMetadataCard`, `EngagementHistoryCard`, recent activity |
| Engagements / docs / tasks                                                   | Shared dossier tab routes                                         | Cross-dossier services                                                                                | Generic dossier tab content                                                              |
| Timeline tab                                                                 | `/dossiers/persons/$id/timeline`                                  | `useDossierActivityTimeline` → `dossier-activity-timeline` edge fn → view `dossier_activity_timeline` | `DossierActivityTimeline` (work-item activity, not `PersonTimeline`)                     |
| Full person sections (profile, positions, affiliations, interaction history) | **Not routed**                                                    | `usePerson` → `get_person_full`                                                                       | Implemented in `PersonDossierDetail.tsx` only                                            |
| Legacy detail                                                                | `/persons/$personId` → `PersonDetailPage.tsx`                     | `usePerson`                                                                                           | Inline tabs with profile, network, engagements                                           |

**Dead / unrouted:** `pages/dossiers/PersonDossierPage.tsx` imports `components/dossier/PersonDossierDetail.tsx`; no route file references either.

**Person extension table (`persons`):** CTI on `dossiers.id`; key fields include `title_en`/`title_ar`, `organization_id`, `importance_level`, `person_subtype`, plus `person_roles`, `person_affiliations`, `person_engagements`, `person_relationships` child tables (see `backend/src/types/database.types.ts` ~20400).

**DossierGlyph:** `person` maps to Unicode `\u25CF` in a tinted circle (`DossierGlyph.tsx` ~31–35). Canonical persons list uses letter initials in `PersonsGrid`, not `DossierGlyph`.

---

## Findings (real defects only)

### CRITICAL

#### 1. Person-specific dossier sections are unreachable on the canonical detail route

**Location:**

- `frontend/src/routes/_protected/dossiers/persons/$id.tsx` (lines 16–22)
- `frontend/src/components/dossier/DossierTabNav.tsx` (lines 33–40)
- `frontend/src/components/dossier/PersonDossierDetail.tsx` (lines 14–18, 142–235)
- `frontend/src/pages/dossiers/PersonDossierPage.tsx` (lines 11–20)

**Why it is a bug:** The product’s canonical person detail path (`/dossiers/persons/$id/*`) mounts `DossierShell` with only the six shared tabs (overview, engagements, docs, tasks, timeline, audit). There are no routes or `extraTabs` for professional profile, positions held, organization affiliations, or interaction history. Those sections exist only inside `PersonDossierDetail`, which is imported exclusively by `PersonDossierPage` and is not registered in the TanStack Router tree. Users opening a person from `/dossiers/persons` never see the implemented section components (`ProfessionalProfile`, `PositionsHeld`, `OrganizationAffiliations`, `InteractionHistory`, `PersonTimeline`).

**Recommended fix:** Either (a) add person-specific tab routes under `/dossiers/persons/$id/` (e.g. `profile`, `positions`, `affiliations`, `interactions`) that render the existing section components, passing `extraTabs` into `DossierShell`, or (b) mount `PersonDossierDetail` (or its sections) inside the overview tab / a dedicated layout route and delete the dead `PersonDossierPage` wrapper. Prefer one canonical URL scheme and remove the duplicate legacy path once parity is reached.

---

### HIGH

#### 2. Persons list includes elected officials despite VIP-only intent

**Location:**

- `supabase/functions/persons/index.ts` (lines 227–234)
- `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` (lines 546–619, filter at 619)

**Why it is a bug:** The list handler calls `search_persons_advanced` without `p_person_subtype`. When that parameter is NULL, the RPC returns every `dossiers.type = 'person'` row, including `person_subtype = 'elected_official'`. The canonical list page subtitle (`persons:subtitle` — “VIPs and key contacts”) and Phase 40 list design assume non-official VIP persons only.

**Recommended fix:** Pass `p_person_subtype: 'standard'` (or `IS DISTINCT FROM 'elected_official'`) from the list endpoint and expose an optional query param for elected-official-only views. Align pagination `total` with the same filter (see finding #10).

---

#### 3. `get_person_full` engagement payload lacks display names — UI reads nonexistent columns

**Location:**

- `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` (lines 512–520)
- `backend/src/types/database.types.ts` — `engagements` row (lines 11008–11016: no `name_en`/`name_ar`)
- `frontend/src/types/person.types.ts` (lines 283–293)
- `frontend/src/components/dossier/sections/InteractionHistory.tsx` (lines 123–126)
- `frontend/src/pages/persons/PersonDetailPage.tsx` (lines 683–691)

**Why it is a bug:** `recent_engagements` embeds `row_to_json(e)` from the `engagements` extension table. Engagement display names live on the parent `dossiers` row (CTI: `engagements.id` → `dossiers.id`), not on `engagements`. The frontend type and both consumers read `engagement.name_en` / `engagement.name_ar`, which are always `undefined`, so engagement titles render blank wherever `usePerson` data is shown (legacy detail page and the unreachable `InteractionHistory` section).

**Recommended fix:** Change the RPC to join `dossiers d ON d.id = e.id` and emit `name_en`/`name_ar` (or alias as `engagement: json_build_object(...)`). Update types to match. Add a regression test against `get_person_full` JSON shape.

---

#### 4. `PersonMetadataCard` shows dossier description as role/title

**Location:**

- `frontend/src/pages/dossiers/overview-cards/PersonMetadataCard.tsx` (lines 66–71)
- `frontend/src/services/dossier-overview.service.ts` — `fetchDossierCore` (lines 294–323, selects `dossiers` only)

**Why it is a bug:** The “Role / Title” row binds to `data.dossier.description_en` / `description_ar`. Person job titles are stored on the `persons` extension as `title_en` / `title_ar` (also returned by `search_persons_advanced` on the list). Overview never loads the `persons` row, so the card cannot show the correct field even if mapped properly; it may show unrelated dossier narrative text or “-”.

**Recommended fix:** Extend overview fetch (or this card) to load `persons.title_en`, `title_ar`, and `organization_id` (with org dossier name join). Bind the role row to `title_*`, not `description_*`.

---

#### 5. Missing `overview.person.*` i18n keys — Arabic UI falls back to English

**Location:**

- `frontend/src/pages/dossiers/overview-cards/PersonMetadataCard.tsx` (lines 58–59, 68–69, 75–79, 88)
- `frontend/src/i18n/en/dossier.json` — no `overview.person` block (grep: no matches)
- `frontend/src/i18n/ar/dossier.json` — same

**Why it is a bug:** All labels use `t('overview.person.*', { defaultValue: 'English…' })`. Because keys are absent from both locale bundles, Arabic sessions display English strings for Organization, Role/Title, Last Engagement, Profile title, and “None recorded”.

**Recommended fix:** Add `overview.person.organization`, `role`, `lastEngagement`, `noEngagement`, `title` to `en/dossier.json` and `ar/dossier.json` with proper Arabic copy.

---

### MEDIUM

#### 6. Missing `overview.engagementHistory.*` i18n keys

**Location:**

- `frontend/src/pages/dossiers/overview-cards/EngagementHistoryCard.tsx` (lines 77–78, 83–84, 116–118)
- `frontend/src/i18n/en/dossier.json` / `ar/dossier.json` — no `overview.engagementHistory`

**Why it is a bug:** Same pattern as #5; active overview card titles and empty state fall back to English defaults in Arabic.

**Recommended fix:** Add `overview.engagementHistory.title`, `empty`, `viewAll` to both locale files.

---

#### 7. Person analytics KPIs use wrong metrics

**Location:**

- `frontend/src/domains/analytics/hooks/useAnalyticsForDossier.ts` (lines 125–136)
- `frontend/src/services/dossier-overview.service.ts` — `calculateStats` (lines 902–924)

**Why it is a bug:** For `person`, “Interactions” displays `recent_activities_count`, which is the count of work items in `dossier_activity_timeline` (tasks/commitments/intake linked to the dossier), not `person_engagements` or calendar interactions. “Affiliations” displays `related_dossiers_count` (all related dossiers of any type), not `person_affiliations` row count or organization memberships. Labels mislead analysts on the canonical overview tab.

**Recommended fix:** For `person`, either rename KPIs to reflect work-item activity / related dossiers, or fetch dedicated counts from `person_affiliations` and `person_engagements` (or RPC aggregates) and wire those into `useAnalyticsForDossier`.

---

#### 8. `PersonMetadataCard` primary organization ignores `persons.organization_id`

**Location:**

- `frontend/src/pages/dossiers/overview-cards/PersonMetadataCard.tsx` (lines 49–64)
- `search_persons_advanced` returns `organization_name` from `persons.organization_id` (migration lines 588–589)

**Why it is a bug:** Organization is taken from the first entry in `related_dossiers.by_dossier_type.organization` (dossier relationship graph). A person whose primary org is only set via `persons.organization_id` (common on create/list) but has no `dossier_relationships` edge shows “-” on overview while the list card shows the correct org name.

**Recommended fix:** Prefer `persons.organization_id` + joined org dossier name when present; fall back to related org relationships.

---

#### 9. `get_person_full` network graph related persons missing display names

**Location:**

- `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` (lines 499–510)
- `frontend/src/pages/persons/PersonDetailPage.tsx` (lines 639–646)

**Why it is a bug:** `related_person` is `row_to_json(rp)` from `persons` only. `name_en` / `name_ar` are on `dossiers`, not `persons`. Legacy network tab renders empty names and “?” initials for related contacts.

**Recommended fix:** In the RPC, build `related_person` as `json_build_object` merging `persons` fields with `d.name_en`, `d.name_ar` from the joined dossiers row (already joined at line 509 but not merged into JSON).

---

#### 10. Persons list `pagination.total` ignores search filters and subtype

**Location:**

- `supabase/functions/persons/index.ts` (lines 240–245)

**Why it is a bug:** Total count queries all non-archived `dossiers` with `type = 'person'`, regardless of `search`, `importance_level`, or elected-official exclusion applied in the RPC result set. UI pagination and counts disagree with filtered results.

**Recommended fix:** Use a filtered count query mirroring RPC WHERE clauses, or have `search_persons_advanced` return `total_count` via window function / companion count RPC.

---

#### 11. List route `search` URL param validated but not consumed

**Location:**

- `frontend/src/routes/_protected/dossiers/persons/index.tsx` (lines 11–15)
- `frontend/src/routes/_protected/dossiers/persons/-PersonsListPage.tsx` (lines 68–70)

**Why it is a bug:** Route schema accepts `?search=`, but the page initializes search from local `useState('')` only. Deep links and back/forward cannot restore search state; inconsistent with other list routes.

**Recommended fix:** Read `Route.useSearch()` (or `useSearch` from TanStack Router) to seed and sync `search` state with the URL.

---

#### 12. `EngagementHistoryCard` uses relationship `created_at` as engagement date

**Location:**

- `frontend/src/pages/dossiers/overview-cards/EngagementHistoryCard.tsx` (lines 52–58)

**Why it is a bug:** Engagement dossiers in the timeline are sorted by `d.created_at` (relationship/dossier creation), not engagement event date from calendar or engagement metadata. Ordering can misrepresent “last engagement” on overview.

**Recommended fix:** Join engagement extension or calendar events for actual event dates; sort on `start_datetime` or engagement scheduled date.

---

#### 13. Activity timeline edge function denies archived dossiers

**Location:**

- `supabase/functions/dossier-activity-timeline/index.ts` (lines 129–135)

**Why it is a bug:** Dossiers with `status = 'archived'` receive 403 “not found or access denied”, so the timeline tab fails for archived persons while other read-only views may still be intended. If archive is read-only review, this blocks legitimate access.

**Recommended fix:** Allow read-only timeline fetch for archived dossiers for authorized users, or align archive behavior across all dossier tabs and document the restriction.

---

### LOW

#### 14. Dead code: `PersonDossierPage` and unrouted `PersonDossierDetail`

**Location:**

- `frontend/src/pages/dossiers/PersonDossierPage.tsx` (entire file)
- `frontend/src/components/dossier/PersonDossierDetail.tsx` (entire file)

**Why it is a bug:** Maintains a full parallel UI implementation that never runs in production routes, increasing drift risk (already diverged from `DossierShell` tabs).

**Recommended fix:** Wire into routes (see CRITICAL #1) or remove after migrating section components to active routes.

---

#### 15. Dual list/detail URL schemes

**Location:**

- Canonical: `/dossiers/persons` → `/dossiers/persons/$id` (`-PersonsListPage.tsx` line 78)
- Legacy: `/persons` → `/persons/$personId` (`PersonsListPage.tsx` lines 85–86)

**Why it is a bug:** Not a runtime crash, but navigation, bookmarks, and tests split across two flows with different detail richness; easy to link users to the thin shell while full data exists only on legacy pages.

**Recommended fix:** Consolidate on `/dossiers/persons/*`, add redirects from `/persons/*`, update nav links.

---

#### 16. “View all engagements” on overview is non-interactive

**Location:**

- `frontend/src/pages/dossiers/overview-cards/EngagementHistoryCard.tsx` (lines 114–119)

**Why it is a bug:** Styled as link (`cursor-pointer`, primary color) but has no `onClick` or `Link` to engagements tab/list.

**Recommended fix:** Link to `/dossiers/persons/$id/engagements` or expand inline list.

---

#### 17. Additional missing `sections.person.*` / `importance.*` keys (mostly unreachable UI)

**Location:**

- `ProfessionalProfile.tsx` (lines 48–55) — `importance.regular|important|key|vip|critical`
- `InteractionHistory.tsx`, `OrganizationAffiliations.tsx`, `PositionsHeld.tsx` — `sections.person.linkEngagement`, `addAffiliation`, `addRole`, `currentPosition`, `present`, `since`, `*Count` keys with English `defaultValue`
- `frontend/src/i18n/en/dossier.json` — `sections.person` block ends ~463 without these keys; no `importance.*` namespace

**Why it is a bug:** If section components are wired back (CRITICAL #1), Arabic will show English for action buttons and importance badges. Currently impact is limited because components are unrouted.

**Recommended fix:** Add missing keys when restoring routes; reuse existing `persons` namespace where overlap exists.

---

## RTL inspection

**Canonical person workflow** (`-PersonsListPage`, `PersonOverviewTab`, `PersonMetadataCard`, `EngagementHistoryCard`, `DossierShell`, `DossierActivityTimeline`, `PersonDossierDetail`): uses logical properties (`ms`/`me`/`ps`/`pe`/`start`/`text-start`) and `dir` where appropriate. **No `ml-*` / `mr-*` / `pl-*` / `pr-*` / `text-left` / `text-right` violations found** in these files.

Legacy `PersonsListPage` uses `ChevronRight` with `icon-flip` class (line 387) for RTL — acceptable pattern.

---

## Verified OK (no defect reported)

| Area                                                    | Evidence                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| List hook response shape                                | `-PersonsListPage.tsx` `extractList` handles `{ data: [] }` from edge fn                                                                    |
| List card mapping                                       | `toCard` uses `title_en`/`title_ar` when `role` absent (lines 35–42)                                                                        |
| Activity timeline pagination                            | `useDossierActivityTimeline.ts` uses `next_cursor` (lines 57–61, 210) matching edge fn                                                      |
| Timeline i18n (tab component)                           | `dossier-context.json` `timeline.*` present in en and ar                                                                                    |
| `dossiers-get` person extension                         | Maps `person` → `persons` table for extension payload                                                                                       |
| `person_roles` / `person_affiliations` column contracts | Match frontend `PersonRole` / affiliation field names when `usePerson` is used                                                              |
| `DossierGlyph` person symbol                            | `\u25CF` in `SYMBOL_MAP` (line 33) — functional; list grid chooses initials instead                                                         |
| Core `sections.person.*` section titles                 | Present in en/ar `dossier.json` ~446–463                                                                                                    |
| Recent activity view                                    | Migration `20260608120000_fix_dossier_activity_timeline_aa_commitments.sql` fixes commitment join to `aa_commitments` + `activity_title_ar` |

---

## Summary counts

| Severity | Count |
| -------- | ----- |
| CRITICAL | 1     |
| HIGH     | 4     |
| MEDIUM   | 8     |
| LOW      | 4     |

**Highest-impact fix order:** Restore person section routes on canonical detail (CRITICAL #1) → fix `get_person_full` engagement and related-person JSON (HIGH #3, #9) → exclude elected officials from VIP list (HIGH #2) → fix `PersonMetadataCard` data + i18n (HIGH #4–5, MEDIUM #6–8).

---

_Report generated by static analysis of `frontend/`, `supabase/functions/`, and migrations. No runtime Supabase or browser verification was performed in this pass._
