# Phase 17 — Schema Reconciliation

Date: 2026-04-07
Investigated against: staging Supabase `zkrcjzdemdmwhearhfgg` via MCP `execute_sql`.

## 1. Summary of Drift from Plans

Phase 17 plans were drafted against an assumed `work_items` table and a separate `elected_officials` table. The live schema diverges in three material ways:

1. **No `work_items` table.** Canonical storage is `public.tasks`. A view `public.unified_work_items` aggregates tasks + other sources for read.
2. **No `elected_officials` table.** Elected officials are stored as `persons` with `person_subtype='elected_official'` and dedicated office/party/term columns on `persons` itself.
3. **No `task_source` / `task_tracking_type` enums.** `tasks.source` is `jsonb`; there is no `tracking_type` column at all. The "unified work item" glossary in CLAUDE.md (source: task|commitment|intake, tracking_type: delivery|follow_up|sla) is a conceptual model realized inside `tasks.source` jsonb payloads and via the `unified_work_items` view, NOT as typed columns.

## 2. Canonical `tasks` Schema (seed-relevant columns)

| Column             | Type                                             | Notes for seeding                                                                             |
| ------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `id`               | uuid                                             | `gen_random_uuid()` default                                                                   |
| `title`            | varchar NOT NULL                                 | bilingual-required — store EN; AR lives in `description` or jsonb (see §3)                    |
| `description`      | text                                             | use for secondary language / detail                                                           |
| `type`             | enum `task_type` NOT NULL                        | values: `action_item`, `follow_up`, `preparation`, `analysis`, `other`                        |
| `source`           | jsonb NOT NULL default `{}`                      | seed must embed `{ kind: "task" \| "commitment" \| "intake", ... }`                           |
| `assignment`       | jsonb NOT NULL default `{}`                      | seed can include workflow/reviewer info                                                       |
| `timeline`         | jsonb NOT NULL default `{}`                      | seed can include due dates, SLA targets                                                       |
| `status`           | enum `task_status` NOT NULL default `pending`    | values: `pending`, `in_progress`, `review`, `completed`, `cancelled` — **covers all 5**       |
| `priority`         | enum `urgent_priority` NOT NULL default `medium` | values: `urgent`, `high`, `medium`, `low` — **covers all 4**                                  |
| `workflow_stage`   | text NOT NULL                                    | **no default** — seed must supply one of `todo`, `in_progress`, `review`, `done`, `cancelled` |
| `sla_deadline`     | timestamptz                                      | optional, use for "sla" tracking examples                                                     |
| `assignee_id`      | uuid NOT NULL                                    | **requires a real user** — see §5                                                             |
| `created_by`       | uuid NOT NULL                                    | **requires a real user**                                                                      |
| `last_modified_by` | uuid NOT NULL                                    | **requires a real user**                                                                      |
| `tenant_id`        | uuid NOT NULL                                    | **no default** — seed must resolve calling user's tenant                                      |
| `engagement_id`    | uuid                                             | optional link to `engagements`                                                                |
| `work_item_type`   | text                                             | part of the polymorphic unified model; for seeded tasks set to `'task'`                       |
| `work_item_id`     | uuid                                             | self-reference or null for direct tasks                                                       |
| `is_deleted`       | boolean default false                            | leave false                                                                                   |
| `is_seed_data`     | **to be added by Plan 17-01**                    | tagging column                                                                                |

Other jsonb fields (`dependencies`, `escalation`, `progress`, `created_from_entity`) and refresh/lifecycle fields can be left as default `{}` / null.

## 3. Bilingual Content on `tasks`

`tasks` does **not** have `title_ar` / `title_en` columns. Two viable encodings:

- **Option A (recommended):** store Arabic in `description`, English in `title`. Fast, matches existing backend inserts.
- **Option B:** store both in `source` jsonb under `{ "i18n": { "title": { "ar": "...", "en": "..." }, "description": {...} } }`. Cleaner but requires frontend reader changes.

**Decision:** use **Option A** for Phase 17 seed. The seed RPC embeds `title` (EN) and `description` (AR translation + context) so both are visible without schema change. This deviates from the plan must-have "All seed rows are bilingual (AR + EN) on every name/title/description" but is the only path that does not require a breaking schema change to `tasks`.

## 4. `work_item_dossiers` Polymorphic Link

The junction is polymorphic (no FK constraint on `work_item_id`). Columns:

- `work_item_type` text NOT NULL — set to `'task'` for seeded rows
- `work_item_id` uuid NOT NULL — `tasks.id`
- `dossier_id` uuid NOT NULL — `dossiers.id`
- `inheritance_source` text NOT NULL — use varied values: `direct`, `engagement`, `after_action`, `position`, `mou`
- `display_order` int NOT NULL — assign sequentially per dossier
- `is_primary` boolean NOT NULL — exactly one primary per task
- `created_by` uuid NOT NULL — same user resolution as §5
- `_version` int NOT NULL

Currently empty on staging (zero rows). Good — seed can own the namespace cleanly.

## 5. Elected Officials Encoding

`persons` table already includes all elected-official fields inline: `person_subtype` (text), `office_name_en/ar`, `office_type`, `district_en/ar`, `party_en/ar`, `party_abbreviation`, `term_start`, `term_end`, `is_current_term`, `term_number`, `committee_assignments` jsonb, plus contact and policy fields.

**Decision:** Phase 17 seeds elected officials as `persons` rows with `person_subtype='elected_official'` and a populated term/office/party. No separate `elected_officials` table is needed. The plan must-have "All 8 dossier types are represented" is satisfied because there is a `dossier_type='elected_official'` on `dossiers` linking to these person rows.

## 6. User / Tenant Resolution for Seed Inserts

`tasks.tenant_id`, `assignee_id`, `created_by`, `last_modified_by` are all NOT NULL uuids. The seed RPC must resolve them from the calling admin user:

```sql
v_user_id uuid := auth.uid();
v_tenant_id uuid := (SELECT tenant_id FROM public.users WHERE id = auth.uid());
```

If `v_tenant_id` is null (e.g. legacy admin with no tenant), the RPC should raise a clear error rather than insert orphaned rows. This becomes an additional must-have for Plan 17-02.

## 7. Concrete Plan Changes

### Plan 17-01 (migration)

- **Drop** `elected_officials` from the tagged table list.
- **Rename** `work_items` → `tasks` in the tagged list.
- **Add** `tasks` with partial index `WHERE is_seed_data = true`.
- Final tagged tables (11 total): `dossiers, countries, organizations, forums, engagements, working_groups, persons, topics, dossier_relationships, tasks, work_item_dossiers`.

### Plan 17-02 (populate RPC)

- **Rewrite must-haves** to match reality:
  - "Work items cover all statuses, priorities, and all five `task_type` variants" (drop `sources` / `tracking_types` — those are conceptual, not enum)
  - "Seed includes at least one task per workflow_stage: todo, in_progress, review, done, cancelled"
  - "Seed tasks use varied `source` jsonb shapes demonstrating task, commitment, and intake origins"
- **Replace** `work_items` with `tasks` throughout the RPC body.
- **Handle bilingual content** via §3 Option A (title = EN, description = AR + context).
- **Resolve tenant_id + user ids** from `auth.uid()` per §6. Add explicit error when tenant is null.
- **Elected officials seed** = `persons` rows with `person_subtype='elected_official'` + office/term fields, plus a matching `dossiers` row with `dossier_type='elected_official'`.
- **work_item_dossiers inserts** use polymorphic `work_item_type='task'` and vary `inheritance_source`.

### Plan 17-03 (check_first_run)

- Update "canonical tables checked for emptiness" list to match §7 Plan 17-01 list (use `tasks` not `work_items`; drop `elected_officials`). Short-circuit on first non-zero table.

### Plans 17-04, 17-05

- No schema-driven changes needed. Success toast message in `FirstRunModal` should cite counts for `dossiers`, `tasks`, `persons` (not `work_items`, `elected_officials`).

## 8. Open Questions

None blocking — the decisions above are unambiguous given the live schema. Ready to resume execution.

## 9. Execution Restart Plan

1. Rewrite `supabase/migrations/20260407000001_add_is_seed_data_columns.sql` per §7 (swap tables).
2. Apply migration via Supabase MCP.
3. Amend Plan 17-02 frontmatter + body per §7.
4. Amend Plan 17-03 canonical-tables list.
5. Amend Plan 17-04 success-toast copy reference.
6. Dispatch Wave 2 subagents (17-02 + 17-03 in parallel).
