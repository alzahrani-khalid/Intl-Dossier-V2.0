---
phase: 45-schema-seed-closure
plan: 03
type: execute
wave: 2
depends_on: [45-01]
files_modified:
  - supabase/migrations/20260507211000_phase45_vip_iso_events.sql
  - frontend/src/domains/operations-hub/types/operations-hub.types.ts
  - frontend/src/hooks/useVipVisits.ts
  - frontend/src/hooks/__tests__/useVipVisits.test.ts
  - frontend/src/pages/Dashboard/widgets/VipVisits.tsx
  - frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx
  - frontend/src/i18n/en/dashboard-widgets.json
  - frontend/src/i18n/ar/dashboard-widgets.json
autonomous: true
requirements: [DATA-03]
must_haves:
  truths:
    - 'D-06: Extend the existing get_upcoming_events RPC instead of adding a dashboard-only VIP RPC.'
    - 'D-07: Add nullable person_id, person_name, person_name_ar, person_role, and person_iso fields to the RPC return shape and TimelineEvent type.'
    - 'D-08: Source ISO from persons.nationality_country_id -> countries.iso_code_2, with persons.country_id -> countries.iso_code_2 fallback.'
    - 'D-09: Derive VIP rows from engagement_dossiers plus engagement_participants; do not invent a vip_visit enum value.'
    - 'D-10: useVipVisits maps person_iso to personFlag, and VipVisits passes type="country" plus iso to DossierGlyph.'
    - 'UI-SPEC: VIP rows preserve the current list layout and use the country flag glyph as the visual anchor.'
  artifacts:
    - path: 'supabase/migrations/20260507211000_phase45_vip_iso_events.sql'
      provides: 'additive get_upcoming_events nullable person fields'
    - path: 'frontend/src/hooks/useVipVisits.ts'
      provides: 'VIP row adapter with person ISO mapping'
    - path: 'frontend/src/pages/Dashboard/widgets/VipVisits.tsx'
      provides: 'country flag glyph rendering'
  key_links:
    - from: 'get_upcoming_events.person_iso'
      to: 'useVipVisits.personFlag'
      via: 'TimelineEvent'
    - from: 'useVipVisits.personFlag'
      to: 'DossierGlyph'
      via: 'iso={visit.personFlag}'
---

# Plan 45-03: VIP ISO Closure

**Phase:** 45 (schema-seed-closure)
**Wave:** 2
**Depends on:** 45-01
**Type:** implementation
**TDD:** true for hook and widget behavior
**Estimated effort:** M (4-6 h)

## Goal

Extend the shared operations-hub timeline RPC with nullable VIP person fields,
map `person_iso` through `useVipVisits`, and render real country flags in the
VIP Visits widget without creating a new VIP event enum or dashboard-only RPC.

<execution_context>
@$HOME/.codex/get-shit-done/workflows/execute-plan.md
@$HOME/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/45-schema-seed-closure/45-CONTEXT.md
@.planning/phases/45-schema-seed-closure/45-RESEARCH.md
@.planning/phases/45-schema-seed-closure/45-UI-SPEC.md
@.planning/phases/45-schema-seed-closure/45-PATTERNS.md
@supabase/migrations/20260330000001_operations_hub_rpcs.sql
@supabase/migrations/20260110000006_create_engagement_dossiers.sql
@supabase/migrations/20260110000003_persons_entity_management.sql
@supabase/migrations/20260202000001_merge_elected_official_into_person.sql
@frontend/src/domains/operations-hub/types/operations-hub.types.ts
@frontend/src/hooks/useVipVisits.ts
@frontend/src/pages/Dashboard/widgets/VipVisits.tsx
@frontend/src/components/signature-visuals/DossierGlyph.tsx
</context>

<threat_model>
T-45-06 shared RPC regression: mitigated by adding only nullable columns after
the existing return columns and preserving the existing engagement/calendar rows.
T-45-07 false VIP event type: mitigated by recognizing VIP rows through person
metadata, not by adding a `vip_visit` enum/check value.
T-45-08 flag spoofing or fallback breakage: mitigated by passing the ISO only
to `DossierGlyph type="country"` and retaining name fallback when ISO is null.
Block on high severity: if existing operations-hub timeline consumers break or
the migration introduces a new `vip_visit` enum/check value, stop.
</threat_model>

## Files to create / modify

| Path                                                                | Action | Notes                                                               |
| ------------------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `supabase/migrations/20260507211000_phase45_vip_iso_events.sql`     | create | Replaces `get_upcoming_events` with additive nullable person fields |
| `frontend/src/domains/operations-hub/types/operations-hub.types.ts` | modify | Adds nullable person fields to `TimelineEvent`                      |
| `frontend/src/hooks/useVipVisits.ts`                                | modify | Uses person metadata and ISO                                        |
| `frontend/src/hooks/__tests__/useVipVisits.test.ts`                 | modify | Covers official_visit/person metadata path                          |
| `frontend/src/pages/Dashboard/widgets/VipVisits.tsx`                | modify | Uses country glyph with ISO                                         |
| `frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx` | modify | Covers glyph type/ISO and copy                                      |
| `frontend/src/i18n/en/dashboard-widgets.json`                       | modify | VIP copy from UI-SPEC                                               |
| `frontend/src/i18n/ar/dashboard-widgets.json`                       | modify | Arabic VIP copy from UI-SPEC                                        |

<tasks>
<task id="45-03-01" type="execute">
<name>Create additive get_upcoming_events migration</name>
<read_first>
- supabase/migrations/20260330000001_operations_hub_rpcs.sql
- supabase/migrations/20260110000006_create_engagement_dossiers.sql
- supabase/migrations/20260110000003_persons_entity_management.sql
- supabase/migrations/20260202000001_merge_elected_official_into_person.sql
- .planning/phases/45-schema-seed-closure/45-CONTEXT.md
</read_first>
<files>
- create: supabase/migrations/20260507211000_phase45_vip_iso_events.sql
</files>
<action>
Create `supabase/migrations/20260507211000_phase45_vip_iso_events.sql` with
`CREATE OR REPLACE FUNCTION get_upcoming_events(...)` copied from
`20260330000001_operations_hub_rpcs.sql`, then make these exact additive
changes:

- Append these return columns after `lifecycle_stage TEXT`:
  - `person_id UUID`
  - `person_name TEXT`
  - `person_name_ar TEXT`
  - `person_role TEXT`
  - `person_iso TEXT`
- In the engagement `RETURN QUERY`, add a `LEFT JOIN LATERAL` named
  `vip_person`:

```sql
LEFT JOIN LATERAL (
  SELECT
    p.id AS person_id,
    pd.name_en AS person_name,
    pd.name_ar AS person_name_ar,
    COALESCE(NULLIF(p.title_en, ''), NULLIF(ep.external_title_en, ''), ep.role) AS person_role,
    COALESCE(nationality.iso_code_2, represented.iso_code_2) AS person_iso
  FROM engagement_participants ep
  JOIN persons p ON p.id = ep.participant_dossier_id
  JOIN dossiers pd ON pd.id = p.id
  LEFT JOIN countries nationality ON nationality.id = p.nationality_country_id
  LEFT JOIN countries represented ON represented.id = p.country_id
  WHERE ep.engagement_id = ed.id
    AND ep.participant_type = 'person'
    AND ep.role IN ('head_of_delegation', 'guest', 'delegate', 'speaker')
  ORDER BY
    CASE ep.role
      WHEN 'head_of_delegation' THEN 1
      WHEN 'guest' THEN 2
      WHEN 'delegate' THEN 3
      WHEN 'speaker' THEN 4
      ELSE 5
    END,
    ep.created_at ASC
  LIMIT 1
) vip_person ON TRUE
```

- Add these values to the engagement SELECT after `ed.lifecycle_stage::TEXT`:
  - `vip_person.person_id`
  - `vip_person.person_name`
  - `vip_person.person_name_ar`
  - `vip_person.person_role`
  - `vip_person.person_iso`
- Add these NULL casts to the calendar SELECT after `NULL::TEXT AS lifecycle_stage`:
  - `NULL::UUID AS person_id`
  - `NULL::TEXT AS person_name`
  - `NULL::TEXT AS person_name_ar`
  - `NULL::TEXT AS person_role`
  - `NULL::TEXT AS person_iso`
- Preserve `SECURITY DEFINER`.
- End with `GRANT EXECUTE ON FUNCTION get_upcoming_events(UUID, INTEGER) TO authenticated;`.

Do not add `vip_visit` to any CHECK constraint or enum.
</action>
<verify>
rg "person_id UUID|person_name TEXT|person_name_ar TEXT|person_role TEXT|person_iso TEXT" supabase/migrations/20260507211000_phase45_vip_iso_events.sql
rg "LEFT JOIN LATERAL" supabase/migrations/20260507211000_phase45_vip_iso_events.sql
rg "nationality.iso_code_2|represented.iso_code_2|p.nationality_country_id|p.country_id" supabase/migrations/20260507211000_phase45_vip_iso_events.sql
rg "NULL::UUID AS person_id|NULL::TEXT AS person_iso" supabase/migrations/20260507211000_phase45_vip_iso_events.sql
! rg "CHECK.*vip_visit|ADD VALUE.*vip_visit|ALTER TYPE.\*vip_visit" supabase/migrations/20260507211000_phase45_vip_iso_events.sql
</verify>
<acceptance_criteria>

- `supabase/migrations/20260507211000_phase45_vip_iso_events.sql` contains `person_iso TEXT`.
- The migration contains `LEFT JOIN LATERAL`.
- The migration contains `nationality.iso_code_2` and `represented.iso_code_2`.
- The migration contains `p.nationality_country_id` and `p.country_id`.
- The migration contains `NULL::UUID AS person_id` and `NULL::TEXT AS person_iso`.
- The migration contains `GRANT EXECUTE ON FUNCTION get_upcoming_events(UUID, INTEGER) TO authenticated`.
- `rg "CHECK.*vip_visit|ADD VALUE.*vip_visit|ALTER TYPE.*vip_visit" supabase/migrations/20260507211000_phase45_vip_iso_events.sql` returns no matches.
  </acceptance_criteria>
  </task>

<task id="45-03-02" type="tdd">
<name>Map VIP person fields through frontend types and hook</name>
<read_first>
- frontend/src/domains/operations-hub/types/operations-hub.types.ts
- frontend/src/hooks/useVipVisits.ts
- frontend/src/hooks/__tests__/useVipVisits.test.ts
- .planning/phases/45-schema-seed-closure/45-RESEARCH.md
</read_first>
<files>
- modify: frontend/src/domains/operations-hub/types/operations-hub.types.ts
- modify: frontend/src/hooks/useVipVisits.ts
- modify: frontend/src/hooks/__tests__/useVipVisits.test.ts
</files>
<action>
In `TimelineEvent`, append nullable fields:

```ts
person_id: string | null
person_name: string | null
person_name_ar: string | null
person_role: string | null
person_iso: string | null
```

In `useVipVisits.ts`:

- keep `export const VIP_EVENT_TYPE = 'vip_visit'` only as a legacy fallback
- add `nameAr?: string` to `VipVisit`
- update the VIP filter to include rows where `event.person_id !== null`
- keep legacy support for `event.event_type === VIP_EVENT_TYPE`
- map `name` from `event.person_name ?? event.title`
- map `nameAr` from `event.person_name_ar ?? event.title_ar ?? undefined`
- map `role` from `event.person_role ?? event.engagement_name ?? ''`
- map `personFlag` from `event.person_iso ?? undefined`
- map `dossierId` from `event.person_id ?? event.engagement_id ?? undefined`

In `useVipVisits.test.ts`:

- update `makeEvent` to include nullable person fields by default
- add a test named `treats official_visit rows with person metadata as VIP visits`
- update the mapping test to assert `personFlag === 'ID'`, `name === 'Dr. Sari Widodo'`, and `role === 'Head of delegation'`
- keep a legacy fallback test for `event_type === VIP_EVENT_TYPE` with no person metadata
  </action>
  <verify>
  pnpm -C frontend exec vitest run src/hooks/**tests**/useVipVisits.test.ts
  rg "person_id: string \\| null|person_iso: string \\| null" frontend/src/domains/operations-hub/types/operations-hub.types.ts
  rg "event.person_id !== null|person_iso|personFlag" frontend/src/hooks/useVipVisits.ts frontend/src/hooks/**tests**/useVipVisits.test.ts
  </verify>
  <acceptance_criteria>
- `frontend/src/domains/operations-hub/types/operations-hub.types.ts` contains `person_iso: string | null`.
- `frontend/src/hooks/useVipVisits.ts` contains `event.person_id !== null`.
- `frontend/src/hooks/useVipVisits.ts` contains `personFlag: event.person_iso ?? undefined`.
- `frontend/src/hooks/__tests__/useVipVisits.test.ts` contains `official_visit`.
- `frontend/src/hooks/__tests__/useVipVisits.test.ts` contains `Head of delegation`.
- `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts` exits 0.
  </acceptance_criteria>
  </task>

<task id="45-03-03" type="execute">
<name>Render VIP country flags and copy</name>
<read_first>
- frontend/src/pages/Dashboard/widgets/VipVisits.tsx
- frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx
- frontend/src/components/signature-visuals/DossierGlyph.tsx
- frontend/src/i18n/en/dashboard-widgets.json
- frontend/src/i18n/ar/dashboard-widgets.json
- .planning/phases/45-schema-seed-closure/45-UI-SPEC.md
</read_first>
<files>
- modify: frontend/src/pages/Dashboard/widgets/VipVisits.tsx
- modify: frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx
- modify: frontend/src/i18n/en/dashboard-widgets.json
- modify: frontend/src/i18n/ar/dashboard-widgets.json
</files>
<action>
In `VipVisits.tsx`:
- import/use `i18n` from `useTranslation('dashboard-widgets')`
- in `VipRow`, render display name as `i18n.language === 'ar' && visit.nameAr ? visit.nameAr : visit.name`
- call `DossierGlyph` exactly as:

```tsx
<DossierGlyph
  type="country"
  iso={visit.personFlag}
  name={displayName}
  size={20}
  className="vip-flag"
/>
```

- keep `LtrIsolate`, `.vip-row`, `.vip-name`, `.vip-role`, `.vip-countdown`, and `.icon-flip`
- render empty state as:
  - `t('vip.empty.heading')`
  - `t('vip.empty.body')`
- render error state with `t('vip.error')`
- keep the link but use `t('actions.viewAll')`

In `frontend/src/i18n/en/dashboard-widgets.json`, update:

```json
"vip": {
  "title": "VIP Visits",
  "empty": {
    "heading": "No VIP visits with country data.",
    "body": "Add VIP participant data to the dashboard seed, then refresh the widget."
  },
  "error": "VIP visits could not load. Check event data and try again."
},
"actions": {
  "viewAll": "View all VIP visits"
}
```

In `frontend/src/i18n/ar/dashboard-widgets.json`, update:

```json
"vip": {
  "title": "زيارات كبار الشخصيات",
  "empty": {
    "heading": "لا توجد زيارات لكبار الشخصيات ببيانات دولة.",
    "body": "أضف بيانات المشاركين من كبار الشخصيات إلى بيانات لوحة التحكم، ثم حدّث العنصر."
  },
  "error": "تعذر تحميل زيارات كبار الشخصيات. تحقق من بيانات الفعاليات ثم أعد المحاولة."
},
"actions": {
  "viewAll": "عرض جميع زيارات كبار الشخصيات"
}
```

In `VipVisits.test.tsx`:

- update the DossierGlyph mock to assert `data-type="country"` and `data-iso="ID"`
- rename the existing glyph test to `renders DossierGlyph with type="country" + ISO + row content`
- change empty/error assertions to `vip.empty.heading`, `vip.empty.body`, and `vip.error`
- keep the countdown LTR isolate and max 6 row tests
- update the RTL arrow test to assert `.icon-flip`, not `.rotate-180`
  </action>
  <verify>
  pnpm -C frontend exec vitest run src/hooks/**tests**/useVipVisits.test.ts src/pages/Dashboard/widgets/**tests**/VipVisits.test.tsx
  rg 'type="country"' frontend/src/pages/Dashboard/widgets/VipVisits.tsx frontend/src/pages/Dashboard/widgets/**tests**/VipVisits.test.tsx
  rg "iso=\\{visit.personFlag\\}|personFlag|person_iso" frontend/src/pages/Dashboard/widgets/VipVisits.tsx frontend/src/hooks/useVipVisits.ts frontend/src/domains/operations-hub/types/operations-hub.types.ts
  rg "View all VIP visits|عرض جميع زيارات كبار الشخصيات|No VIP visits with country data" frontend/src/i18n/en/dashboard-widgets.json frontend/src/i18n/ar/dashboard-widgets.json
  </verify>
  <acceptance_criteria>
- `frontend/src/pages/Dashboard/widgets/VipVisits.tsx` contains `type="country"`.
- `frontend/src/pages/Dashboard/widgets/VipVisits.tsx` contains `iso={visit.personFlag}`.
- `frontend/src/hooks/useVipVisits.ts` contains `person_iso`.
- `frontend/src/i18n/en/dashboard-widgets.json` contains `View all VIP visits`.
- `frontend/src/i18n/ar/dashboard-widgets.json` contains `عرض جميع زيارات كبار الشخصيات`.
- `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx` exits 0.
  </acceptance_criteria>
  </task>
  </tasks>

## Verification

```bash
pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx
rg "person_iso TEXT|LEFT JOIN LATERAL|nationality.iso_code_2|represented.iso_code_2" supabase/migrations/20260507211000_phase45_vip_iso_events.sql
rg 'type="country"' frontend/src/pages/Dashboard/widgets/VipVisits.tsx
rg "person_iso|personFlag" frontend/src/domains/operations-hub/types/operations-hub.types.ts frontend/src/hooks/useVipVisits.ts
! rg "CHECK.*vip_visit|ADD VALUE.*vip_visit|ALTER TYPE.*vip_visit" supabase/migrations/20260507211000_phase45_vip_iso_events.sql
```

## Requirements satisfied

- DATA-03 full at source level: `get_upcoming_events` exposes nullable person
  ISO data, `useVipVisits` maps it, and `DossierGlyph` consumes the ISO in
  country mode.
