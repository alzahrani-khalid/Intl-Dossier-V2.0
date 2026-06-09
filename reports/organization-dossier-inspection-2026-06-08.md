# Organization Dossier Workflow Inspection

**Date:** 2026-06-08  
**Scope:** End-to-end ORGANIZATION dossier workflow (list → detail → tabs → glyphs/cards → activity timeline edge function → create/link work items)  
**Method:** Static code trace against `frontend/src/types/database.types.ts`, route tree, hooks, services, edge functions, and i18n bundles. No live browser or staging API calls were executed.

---

## Workflow Map (Verified Live Path)

| Stage             | Entry                          | Primary implementation                                                                                                      |
| ----------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| List              | `/dossiers/organizations`      | `frontend/src/routes/_protected/dossiers/organizations/index.tsx` → `useOrganizations` → `DossierTable` + `DossierGlyph`    |
| Detail shell      | `/dossiers/organizations/$id`  | `frontend/src/routes/_protected/dossiers/organizations/$id.tsx` → `DossierShell` + nested `<Outlet />`                      |
| Default tab       | `/dossiers/organizations/$id/` | Redirects to `overview` (`$id/index.tsx`)                                                                                   |
| Tabs              | URL segments                   | `DossierTabNav` base tabs + org extra `mous`; routes under `$id/{overview,engagements,docs,tasks,timeline,audit,mous}.tsx`  |
| Overview          | `overview`                     | `OrganizationOverviewTab` + org-specific cards (`MembershipStructureCard`, `MoUStatusCard`, `KeyRepresentativesCard`, etc.) |
| Work items        | `tasks`                        | `DossierWorkItemsTab` → `fetchDossierOverview` / `WorkItemsSection`; create via `DossierShell` → `AddToDossierDialogs`      |
| Relationships     | Sidebar + engagements tab      | `DossierShell` relationship rail/graph; `DossierEngagementsTab` for related engagement dossiers + calendar events           |
| Activity timeline | `timeline`                     | `DossierActivityTimeline` → `useDossierActivityTimeline` → edge function `dossier-activity-timeline`                        |
| MoUs              | `mous`                         | `DossierMoUsTab` (direct `mous` query on signatory columns)                                                                 |
| Positions         | `docs` (not a dedicated tab)   | `fetchDocuments` in `dossier-overview.service.ts` loads positions via `position_dossier_links`                              |

**Superseded (not routed):** `OrganizationDossierPage`, `OrganizationDossierDetail`, `OrganizationTimeline` — no imports from current organization routes.

**Glyphs:** Organization list rows use `DossierGlyph` (`type="organization"` → `▲`). `UniversalDossierCard` is not referenced by organization list/detail routes (hub/search only).

---

## Findings

### 1. HIGH — Organization list engagement counts always zero

**Location:** `frontend/src/hooks/useOrganizations.ts` lines 47–76; `frontend/src/routes/_protected/dossiers/organizations/index.tsx` lines 42–51; contrast `frontend/src/hooks/useCountries.ts` lines 101–127.

**Why it is a real bug:** The list route maps `engagement_count` from each dossier row (`d.engagement_count`), but `useOrganizations` only selects from `dossiers` and never merges counts from `engagement_dossiers.host_organization_id` (a real column per `database.types.ts`). The countries hook explicitly documents and implements this merge for `host_country_id`. The organizations table column therefore always renders `0` even when `host_organization_id` is populated.

**Recommended fix:** After fetching organization dossier IDs, run a second query on `engagement_dossiers` selecting `host_organization_id` where `host_organization_id IN (ids)`, tally in JS, and merge `engagement_count` onto each row — mirror `useCountries.ts` lines 107–127 with `host_organization_id` instead of `host_country_id`.

---

### 2. CRITICAL — Documents tab MoU query selects nonexistent `mous.status` column

**Location:** `frontend/src/services/dossier-overview.service.ts` lines 486–496.

**Why it is a real bug:** `fetchDocuments` selects `id, title, status, created_at, updated_at` from `mous`. Generated schema (`frontend/src/types/database.types.ts` lines 18854–18892) defines `lifecycle_state` (enum `mou_state`) and `title` / `title_ar`, but **no `status` column**. PostgREST returns an error for invalid column selection; the code destructures only `{ data: mous1 }` / `{ data: mous2 }` and never checks `error`, so MoUs are silently omitted from the Documents section while positions/briefs may still load.

**Recommended fix:** Change the select to `id, title, title_ar, lifecycle_state, created_at, updated_at` (or `lifecycle_state as status` if the mapper expects `status`). Check `error` and surface or log failures instead of ignoring them. Map `lifecycle_state` in the document normalizer below (lines ~528+).

---

### 3. HIGH — MoU overview summary uses wrong `lifecycle_state` enum values

**Location:** `frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx` lines 58–69.

**Why it is a real bug:** The card buckets MoUs using `'renewed'`, `'cancelled'`, and `'pending'`, which are **not** members of `mou_state` (`draft`, `negotiation`, `pending_approval`, `signed`, `active`, `suspended`, `expired`, `terminated` per `database.types.ts` lines 39043–39051). Real states like `signed`, `negotiation`, and `pending_approval` fall into the `draft` bucket; `terminated` is misclassified as `expired`. Overview MoU badges are materially wrong for production data.

**Recommended fix:** Map each `mou_state` value explicitly, e.g. `active` → active; `expired` / `terminated` / `suspended` → expired or separate buckets; `draft` / `negotiation` → draft; `pending_approval` → pending; `signed` → signed or active per product rules. Reuse the same mapping in `DossierMoUsTab.getStatusColor` (lines 65–80), which has the same stale union type.

---

### 4. HIGH — Broken deep links from overview cards (MoUs and contacts)

**Location:**

- `frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx` lines 147–150
- `frontend/src/pages/dossiers/overview-cards/KeyRepresentativesCard.tsx` lines 111–114

**Why it is a real bug:** Links navigate to `/dossiers/organizations/$id` with `search: { tab: 'mous' }` or `search: { tab: 'contacts' }`. The live shell uses **nested URL routes** (`DossierTabNav` in `frontend/src/components/dossier/DossierTabNav.tsx` lines 33–40), not search-param tab state. There is no `contacts` tab in the organization shell. Users land on the default overview tab instead of MoUs; “View all representatives” does nothing useful.

**Recommended fix:** Change MoU link to `to: '/dossiers/organizations/$id/mous'` (no search param). For representatives, link to an existing surface (e.g. related person dossiers in the sidebar, a contacts route if added, or remove the link until a tab exists).

---

### 5. MEDIUM — Activity timeline tab ignores Arabic titles in RTL

**Location:** `frontend/src/components/dossier/ActivityTimelineItem.tsx` lines 190–191; contrast `frontend/src/pages/dossiers/overview-cards/SharedRecentActivityCard.tsx` lines 93–95.

**Why it is a real bug:** The edge function and `useDossierActivityTimeline` expose `activity_title_ar` (see `supabase/functions/dossier-activity-timeline/index.ts` lines 27–28). Overview recent activity respects RTL Arabic titles; the dedicated Timeline tab always renders `activity.activity_title` (English). Arabic users see English commitment/intake titles on the timeline tab.

**Recommended fix:** In `ActivityTimelineItem`, use the same pattern as `SharedRecentActivityCard`: `isRTL && activity.activity_title_ar ? activity.activity_title_ar : activity.activity_title`.

---

### 6. MEDIUM — Organization overview cards lack i18n keys (English `defaultValue` in Arabic)

**Location:**

- `frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx` lines 47–88
- `frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx` lines 92–154
- `frontend/src/pages/dossiers/overview-cards/KeyRepresentativesCard.tsx` lines 121–124

**Why it is a real bug:** Keys such as `overview.membership.*`, `overview.mou.*`, and `overview.representatives.*` are absent from both `frontend/src/i18n/en/dossier.json` and `frontend/src/i18n/ar/dossier.json` (grep returns no matches). Components pass English `defaultValue` strings; in Arabic locale i18next falls back to those English defaults, violating bilingual requirements for the organization overview.

**Recommended fix:** Add the full key trees under `overview.membership`, `overview.mou`, and `overview.representatives` in `en/dossier.json` and `ar/dossier.json`, then remove inline English `defaultValue` where keys exist.

---

### 7. MEDIUM — MoUs tab Arabic bundle missing entire `mous` section

**Location:** `frontend/src/components/dossiers/DossierMoUsTab.tsx` lines 111–128; `frontend/src/i18n/en/dossiers.json` lines 491–504; `frontend/src/i18n/ar/dossiers.json` (no `mous` object — file ends at line 278).

**Why it is a real bug:** `DossierMoUsTab` uses namespace `dossiers` with keys `mous.error_loading`, `mous.no_mous`, `mous.signed`, etc. English defines these under `mous`; Arabic `dossiers.json` has only a tab label string `"mous": "مذكرات التفاهم"` at line 193, not the nested `mous.*` keys. Arabic UI shows raw keys or English fallbacks on the MoUs tab (empty, error, date labels).

**Recommended fix:** Port the `mous` block from `en/dossiers.json` into `ar/dossiers.json` with Arabic translations.

---

### 8. MEDIUM — Engagements tab empty state uses nonexistent i18n key

**Location:** `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx` line 85; `frontend/src/i18n/en/dossier-shell.json` lines 47–55 (has `empty.engagements.title`, not `emptyState.noEngagements`).

**Why it is a real bug:** The tab uses `t('emptyState.noEngagements', { defaultValue: 'No engagements' })` with namespace `dossier-shell`. That key does not exist; Arabic users get the English default instead of `empty.engagements.title` / body already translated in `ar/dossier-shell.json`.

**Recommended fix:** Replace with `t('empty.engagements.title')` and optionally `t('empty.engagements.body')` for the description.

---

### 9. MEDIUM — Audit tab placeholder uses nonexistent i18n key

**Location:** `frontend/src/routes/_protected/dossiers/organizations/$id/audit.tsx` line 19.

**Why it is a real bug:** Uses `emptyState.comingSoon`, which is not defined in `dossier-shell.json` (neither en nor ar). Placeholder text falls back to English “Content coming soon” in Arabic mode.

**Recommended fix:** Add `emptyState.comingSoon` to both locale files, or use an existing key such as `empty.audit.title` / `detail.tab_coming_soon` from `dossiers.json`.

---

### 10. MEDIUM — Organization analytics “Member Countries” metric is semantically wrong

**Location:** `frontend/src/domains/analytics/hooks/useAnalyticsForDossier.ts` lines 73–84; `frontend/src/services/dossier-overview.service.ts` line 899.

**Why it is a real bug:** For `organization`, the hook labels the first metric “Member Countries” (`analytics.memberCountries`) but binds `stats.related_dossiers_count`, which is the **total count of all related dossiers** from `fetchRelatedDossiers`, not country members only. `MembershipStructureCard` already exposes relationship-type breakdowns; this KPI misleads analysts on the overview analytics strip.

**Recommended fix:** Either count only related dossiers where `type === 'country'` and relationship is `has_member` / `member_of`, or rename the metric and i18n key to “Related dossiers” / `analytics.linkedDossiers` to match the data source.

---

### 11. MEDIUM — MoU queries omit soft-delete filter on dedicated MoUs tab and overview card

**Location:**

- `frontend/src/components/dossiers/DossierMoUsTab.tsx` lines 53–56
- `frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx` lines 43–46

**Why it is a real bug:** Both query `mous` without `.is('deleted_at', null)` (and without `is_deleted = false`). `fetchDocuments` correctly filters `deleted_at` (lines 490, 496). Deleted MoUs can appear in the MoUs tab and overview summary counts, inconsistent with the documents service and likely RLS expectations.

**Recommended fix:** Add `.is('deleted_at', null)` (and `.eq('is_deleted', false)` if enforced at app layer) to both queries, matching `fetchDocuments`.

---

### 12. MEDIUM — MoUs tab status styling does not cover real `mou_state` values

**Location:** `frontend/src/components/dossiers/DossierMoUsTab.tsx` lines 32, 65–80.

**Why it is a real bug:** Local `MoU` type and `getStatusColor` handle `pending`, `cancelled`, `renewed` but not `negotiation`, `pending_approval`, `signed`, `suspended`, `terminated`. Those states hit `default` styling, so badges misrepresent lifecycle on the dedicated MoUs tab (separate from overview bucketing in finding #3).

**Recommended fix:** Align `getStatusColor` and displayed labels with `mou_state` enum; drive labels from `t('mous.statuses.<state>')` with keys for all enum values.

---

### 13. LOW — RTL text alignment uses physical `text-end` toggle instead of logical `text-start`

**Location:** `frontend/src/components/dossiers/DossierMoUsTab.tsx` lines 151–163.

**Why it is a real bug:** Title and description use `isRTL ? 'text-end' : 'text-start'` while the parent already sets `dir` via `useDirection`. Project RTL guidelines require logical `text-start` with `dir` on the container, not physical end alignment toggles.

**Recommended fix:** Replace with `text-start` on elements inside a `dir={direction}` wrapper (or rely on document `dir` from `DesignProvider`).

---

### 14. LOW — Dead organization dossier UI (unreachable from router)

**Location:**

- `frontend/src/pages/dossiers/OrganizationDossierPage.tsx`
- `frontend/src/components/dossier/OrganizationDossierDetail.tsx`
- `frontend/src/pages/Organizations.tsx` (mock static list)

**Why it is a real bug:** Grep shows no route or parent imports these components; organization detail is fully handled by `DossierShell` nested routes. Maintainers may edit dead tabs (e.g. legacy `OrganizationTimeline`) believing they ship. This is maintenance debt, not a runtime defect on the live path.

**Recommended fix:** Delete or archive behind a clear `@deprecated` comment with pointer to `DossierShell` routes; remove mock `Organizations.tsx` if unused in route tree.

---

## Areas Traced Without Defects (for this pass)

- **Activity timeline edge function contract:** `dossier-activity-timeline/index.ts` response shape matches `useDossierActivityTimeline` types; migration `20260608120000_fix_dossier_activity_timeline_aa_commitments.sql` aligns view with `aa_commitments` (repo state; staging deploy not verified here).
- **Create/link work item from organization shell:** `AddToDossierDialogs.tsx` invalidates `['dossier-tab', 'work_items', dossierId]` and timeline keys after task creation (line 353+); pattern matches `DossierWorkItemsTab` query keys.
- **List glyph rendering:** `DossierTable` passes `type="organization"` to `DossierGlyph` (lines 120–121); symbol map includes organization (▲).
- **Tab routing:** `DossierTabNav` builds paths as `/dossiers/organizations/$id/{tab}` — consistent with organization `$id/*.tsx` routes.

---

## Summary Counts

| Severity | Count |
| -------- | ----- |
| CRITICAL | 1     |
| HIGH     | 3     |
| MEDIUM   | 8     |
| LOW      | 2     |

**Highest-impact fixes:** (1) repair `fetchDocuments` MoU column selection, (2) merge `host_organization_id` engagement counts in `useOrganizations`, (3) fix MoU `lifecycle_state` mapping and deep links to `/mous`.
