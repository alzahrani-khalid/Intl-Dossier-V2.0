# Phase 17: Seed Data & First Run — Research

**Researched:** 2026-04-07
**Domain:** Postgres seed migration + first-run UX
**Confidence:** HIGH (all findings verified by codebase grep/read)

## User Constraints (from CONTEXT.md)

All 15 decisions D-01..D-15 are locked. Refer to `17-CONTEXT.md`. Highlights:

- Hybrid SQL migration + `populate_diplomatic_seed()` SECURITY DEFINER RPC (D-06/07)
- `check_first_run()` RPC, HeroUI v3 Modal, admin-only populate (D-09/10/11)
- Idempotent on empty only via `is_seed_data` tag + deterministic UUIDs (D-13/14)
- All 8 dossier types represented; bilingual AR/EN (D-02/03)

## 1. Admin Role Helper

**Use `is_admin_or_manager(user_id UUID)`** — defined in `supabase/migrations/20250930001_helper_functions.sql:65-74`.

```sql
CREATE OR REPLACE FUNCTION is_admin_or_manager(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = is_admin_or_manager.user_id
    AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Alternative helpers found** (do NOT use for Phase 17 — different semantics):

- `is_admin(user_id UUID)` — referenced in `supabase/migrations/20250129010_create_policies.sql:55,115,176,183,187,194,344` but predates `user_roles` consolidation. Phase 17 should align with the newer canonical helper.
- `public.auth_has_role('admin')` — defined in `supabase/migrations/011_rls_policies.sql:186`, used heavily in `20260113500001_tenant_isolation_layer.sql` (lines 201, 248, 278, 415, 428, 437, 442, 451) and `023_mous_rls.sql:53,63`. String-arg variant.
- `user_has_role(p_user_id UUID, p_role TEXT)` — fixed in `20260124000001_fix_rls_helper_functions.sql:124`.

**Recommendation:** Phase 17 RPCs should call **`is_admin_or_manager(auth.uid())`** for `can_seed`. Per CONTEXT D-11 which says "admin role only", planner should clarify whether `manager` is included or whether a stricter `auth_has_role('admin')` check is required. Flag for discuss-phase confirmation.

## 2. Tables Needing `is_seed_data BOOLEAN`

No table currently has an `is_seed_data` column (verified — only matches are in `17-CONTEXT.md`). All seeded tables need the column added in a prerequisite migration.

**Multiple historical CREATE TABLE statements exist for the same names** — schema went through consolidations. Most recent canonical definitions:

| Table                | Canonical CREATE                                                      | Notes                                                                                                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dossiers`           | `supabase/migrations/20251022000001_create_unified_dossiers.sql:10`   | Unified dossiers table (post-consolidation). Earlier: `20250930002_create_dossiers_table.sql:6`.                                                                                                                                                                               |
| `countries`          | `supabase/migrations/20251022000002_create_extension_tables.sql:22`   | Extension table linked to dossier of type `country`. Earlier: `002_countries.sql:4`, `002_create_countries.sql:9`.                                                                                                                                                             |
| `organizations`      | `supabase/migrations/20251022000002_create_extension_tables.sql:41`   | Earlier: `003_organizations.sql:4`, `003_create_organizations.sql:12`, `20251026000001_create_contact_directory.sql:11`.                                                                                                                                                       |
| `forums`             | `supabase/migrations/20251022000002_create_extension_tables.sql:62`   | Earlier: `006_forums.sql:4`, `006_create_forums.sql:9`.                                                                                                                                                                                                                        |
| `engagements`        | `supabase/migrations/20251022000002_create_extension_tables.sql:79`   | Earlier: `20250930100_create_engagements_table.sql:5`.                                                                                                                                                                                                                         |
| `working_groups`     | `supabase/migrations/20251022000002_create_extension_tables.sql:105`  |                                                                                                                                                                                                                                                                                |
| `persons`            | `supabase/migrations/20251022000002_create_extension_tables.sql:121`  | NB: `elected_officials` was merged into `persons` per `20260202000001_merge_elected_official_into_person.sql` and `20260202000002_drop_elected_officials_table.sql`. **No separate `elected_officials` table to seed** — seed `persons` rows with the elected-official fields. |
| `topics`             | `supabase/migrations/20260202100000_fix_theme_to_topic_naming.sql:23` | Renamed from `themes`.                                                                                                                                                                                                                                                         |
| `work_item_dossiers` | `supabase/migrations/20260116500001_create_work_item_dossiers.sql:11` | Junction table; needs `is_seed_data` too per D-14.                                                                                                                                                                                                                             |

**Tables NOT yet located in this research pass** (planner must verify before writing the column-add migration):

- `work_items` — canonical CREATE not located in this scan; very likely in a 2026-01 migration (referenced by `20260116500001_create_work_item_dossiers.sql`). Planner should `grep -n "CREATE TABLE.*work_items"` before drafting the ALTER.
- Any join/relationship tables for dossier-to-dossier links beyond `work_item_dossiers` (if seed needs cross-tier strategic/operational/informational links per D-05).

**PK type:** All tables sampled use `UUID PRIMARY KEY DEFAULT gen_random_uuid()` (consistent across `20250930106`, `20250129004`, `20251011214946`, `20260111300001`, `20260115400001`, etc.). Seed function can override the default with deterministic UUIDs from `uuid_generate_v5`.

**Action for planner:** prerequisite migration must `ALTER TABLE … ADD COLUMN is_seed_data BOOLEAN NOT NULL DEFAULT false` on each table above (plus `work_items` once located), with a partial index `CREATE INDEX … WHERE is_seed_data = true` for efficient idempotency check.

## 3. Dashboard Mount Point

**File:** `frontend/src/routes/_protected/dashboard.tsx`

This is the canonical dashboard route file (sibling variants exist: `dashboard.project-management.tsx`, `custom-dashboard.tsx`). The first-run modal should mount inside this route's component on first paint.

**No existing first-run / sample-data modal logic** — verified via grep `first.?run|firstRun|sample.?data|empty.?database` returned no matches in `dashboard.tsx`. Greenfield mount.

Planner should `Read` the file at planning time to identify the top-level component and a stable insertion point (likely inside the route's main JSX wrapper, after auth gate but before widgets).

## 4. Existing RPC + RLS Conventions

**Reference RPC:** `supabase/migrations/20260406_lifecycle_notification_trigger.sql:5-38` — `notify_lifecycle_stage_change()`.

Conventions observed:

- `CREATE OR REPLACE FUNCTION name(...) RETURNS … AS $$ … $$ LANGUAGE plpgsql SECURITY DEFINER;` (line 38).
- Variables prefixed `v_` (e.g., `v_owner_id`, `v_dossier_title`).
- Uses `PERFORM create_categorized_notification(...)` for side effects.
- No explicit GRANT in this file — relies on default `authenticated` role grant. **Phase 17 RPCs MUST add explicit `GRANT EXECUTE ON FUNCTION populate_diplomatic_seed() TO authenticated;` and same for `check_first_run()`** because they are user-invoked from supabase-js, not trigger-only.
- Helper-function pattern (admin checks): see `20250930001_helper_functions.sql:25-40` (`can_edit_dossier`) — top-of-function role check via `is_admin_or_manager(auth.uid())`.

**Phase 17 RPCs should:**

1. Begin with explicit role check; raise `EXCEPTION` or return `{status: 'forbidden'}` JSON if not admin.
2. Return `jsonb` (use `jsonb_build_object('is_empty', …, 'can_seed', …, 'counts', …)`) — matches `create_categorized_notification`-style payloads.
3. Be `SECURITY DEFINER` with `SET search_path = public` (defensive — not consistently set in older migrations but recommended).
4. End with `GRANT EXECUTE … TO authenticated;`.

## 5. TanStack Query Keys to Invalidate Post-Seed

Confirmed key patterns from grep (limited to top 25 hits):

| Domain                   | Key                                      | File:Line                                                         |
| ------------------------ | ---------------------------------------- | ----------------------------------------------------------------- |
| Work items (per-dossier) | `['work-items', dossierId, 'follow-up']` | `frontend/src/components/Dossier/sections/FollowUpActions.tsx:42` |
| Dashboard metrics        | `['dashboard-success-metrics']`          | `frontend/src/hooks/useDashboardSuccessMetrics.ts:81`             |
| Dashboard trends         | `['dashboard-trends', range]`            | `frontend/src/hooks/useDashboardTrends.ts:115`                    |
| Dossiers (briefs picker) | `['dossiers-for-brief']`                 | `frontend/src/pages/Briefs/BriefsPage.tsx:96`                     |

**Gap:** The canonical "dossiers list" and "work items list" query keys used by the main list pages were NOT located in this pass. The codebase appears to use **string-prefix arrays without a centralized factory** (no `frontend/src/domains/*/queryKeys.ts` factory found via the limited grep). Planner should:

1. Read `frontend/src/routes/_protected/dossiers/` and `frontend/src/hooks/useDossiers.ts` (if exists) to find the list query key.
2. Use **broad invalidation** as the safe pattern: `queryClient.invalidateQueries({ queryKey: ['dossiers'] })`, `['work-items']`, `['dashboard-success-metrics']`, `['dashboard-trends']` — TanStack Query v5 prefix-matches array keys, so invalidating `['dossiers']` invalidates `['dossiers', 'list', filters]` etc.
3. Also invalidate any `['countries']`, `['organizations']`, `['forums']`, `['engagements']` prefixes — verify existence at plan time.

## 6. HeroUI v3 Modal Compound API

**Wrapper:** `frontend/src/components/ui/heroui-modal.tsx` (verified exists, 60+ lines read).

**Findings:**

- File **wraps `Modal` from `@heroui/react`** (line 14: `import { Modal, Button, useOverlayState } from '@heroui/react'`).
- Exposes `HeroUIModal` root component with controlled/uncontrolled `open` state (lines 44-60), backed by `ModalContext`.
- Re-exports `useOverlayState` (line 19).
- Uses `useDirection` hook for RTL (line 16) — RTL-ready out of the box.
- The full subcomponent surface (`HeroUIModalHeader`, `Body`, `Footer`, etc.) was not exhaustively read; planner should `Read` the full file (it is short) before writing modal JSX.

**Quick example pattern (from CLAUDE.md HeroUI v3 strategy + observed wrapper):**

```tsx
<HeroUIModal open={isFirstRun} onOpenChange={setOpen}>
  <Modal.Header>{t('first-run.title')}</Modal.Header>
  <Modal.Body>{t('first-run.body')}</Modal.Body>
  <Modal.Footer>
    <Button onPress={onSeed}>{t('first-run.populate')}</Button>
    <Button variant="ghost" onPress={onSkip}>
      {t('first-run.skip')}
    </Button>
  </Modal.Footer>
</HeroUIModal>
```

**Note:** CLAUDE.md says HeroUI v3 uses compound components (`Card.Header`, `Modal.Body`). Exact subcomponent names available on the wrapper need verification at plan time by reading the rest of `heroui-modal.tsx`.

## 7. i18next Namespace Strategy

**Existing namespaces** (from `frontend/src/i18n/index.ts:5-188`, ~90 namespaces) — there is **no `first-run` namespace**, but several closely related ones already exist:

- `'sample-data'` — `frontend/src/i18n/en/sample-data.json` (lines 103-104, 245)
- `'onboarding'` — `frontend/src/i18n/en/onboarding.json` (lines 105-106, 246)
- `'empty-states'` — `frontend/src/i18n/en/empty-states.json` (lines 87-88, 237)
- `'guided-tours'` — (lines 101-102, 244)

**Recommendation:** **Reuse the existing `'sample-data'` namespace** for the first-run modal copy. It is the closest semantic fit (the modal IS about populating sample data), avoids adding a 91st namespace, and keeps related strings co-located. If `sample-data.json` is already populated for unrelated UI, add a nested `firstRun.*` key group inside it. Planner should `Read` `sample-data.json` to confirm capacity before deciding.

**Pattern for adding a new namespace** (if reuse rejected): add 6 lines (import en, import ar, register in `en` resources object, register in `ar` resources object) in `frontend/src/i18n/index.ts`. Most recent additions follow this pattern (e.g., `dossier-shell`, `elected-officials` at lines 185-188, 286-287, 381-382).

## 8. Deterministic UUID Generation in Postgres

**`pgcrypto`** is in heavy use across the schema — `gen_random_uuid()` is called in dozens of CREATE TABLE defaults (verified samples: `20250930106`, `20250129004`, `20251011214946`, `20251115030217`, `20250930108`, `20260111300001` lines 44/92/118/136/156, `008_create_intelligence_reports.sql:19`, `20260115400001:35`, `20251205000004:6,50`).

**`uuid-ossp` (which provides `uuid_generate_v5`):** **NOT verified as enabled** by this research pass. Grep for `uuid-ossp` and `uuid_generate_v5` returned only `gen_random_uuid` matches.

**Action:** The seed migration MUST start with:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

…then use `uuid_generate_v5(namespace_uuid, name)` with a fixed namespace UUID literal (e.g., the project should pick one and document it in the migration header — CONTEXT D-14 specifics says "namespaced uuid_generate_v5 from a fixed `seed.gastat.diplomatic` namespace").

**Alternative if `uuid-ossp` is undesirable:** Hardcode UUID literals directly in the seed function (acceptable since seed is small — ~100 entities). Avoids extension dependency. Planner's call.

## Code Examples (Reference Only — for planner)

### SECURITY DEFINER pattern

See `supabase/migrations/20260406_lifecycle_notification_trigger.sql:5-38`.

### Helper function with role check

See `supabase/migrations/20250930001_helper_functions.sql:25-40` (`can_edit_dossier`).

## Open Questions

1. **Admin definition (D-11 ambiguity):** Does "admin only" include `manager` role (`is_admin_or_manager`) or strictly `admin` (`auth_has_role('admin')`)? **Recommend discuss-phase confirmation before planning RPC.**
2. **`work_items` table location:** Canonical CREATE TABLE not located in this scan. Planner must locate before writing the column-add migration.
3. **Dossier-to-dossier relationship tables:** D-05 requires cross-tier links — does this use `work_item_dossiers` only, or is there a separate `dossier_relationships` table needing `is_seed_data`?
4. **Centralized query key factory:** None found. Confirm broad-prefix invalidation strategy is acceptable, or plan to introduce a tiny factory module for the post-seed use case.
5. **`sample-data` namespace reuse vs. new `first-run` namespace:** Planner to inspect `sample-data.json` content and decide.

## Sources

All sources are local files in this repo, verified at the cited line numbers in this session:

- `supabase/migrations/20250930001_helper_functions.sql`
- `supabase/migrations/20250129010_create_policies.sql`
- `supabase/migrations/011_rls_policies.sql`
- `supabase/migrations/20260124000001_fix_rls_helper_functions.sql`
- `supabase/migrations/20260113500001_tenant_isolation_layer.sql`
- `supabase/migrations/20251022000001_create_unified_dossiers.sql`
- `supabase/migrations/20251022000002_create_extension_tables.sql`
- `supabase/migrations/20260116500001_create_work_item_dossiers.sql`
- `supabase/migrations/20260202000001_merge_elected_official_into_person.sql`
- `supabase/migrations/20260202100000_fix_theme_to_topic_naming.sql`
- `supabase/migrations/20260406_lifecycle_notification_trigger.sql`
- `frontend/src/components/ui/heroui-modal.tsx`
- `frontend/src/i18n/index.ts`
- `frontend/src/components/Dossier/sections/FollowUpActions.tsx`
- `frontend/src/hooks/useDashboardSuccessMetrics.ts`
- `frontend/src/hooks/useDashboardTrends.ts`
- `frontend/src/pages/Briefs/BriefsPage.tsx`
- `frontend/src/routes/_protected/dashboard.tsx` (existence verified)
- `.planning/phases/17-seed-data-first-run/17-CONTEXT.md`

## Confidence

| Area            | Level       | Reason                                                                                                           |
| --------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| Admin helper    | HIGH        | Function definition read directly                                                                                |
| Tables to tag   | MEDIUM      | All except `work_items` located by line; `work_items` deferred to planner                                        |
| Dashboard mount | HIGH        | File existence + absence of prior first-run logic verified                                                       |
| RPC conventions | HIGH        | Reference RPC read in full                                                                                       |
| Query keys      | MEDIUM      | Sampled keys verified; centralized factory absence noted                                                         |
| HeroUI Modal    | MEDIUM-HIGH | Wrapper file head read; full subcomponent surface deferred                                                       |
| i18n strategy   | HIGH        | Full namespace list inspected                                                                                    |
| UUID extension  | MEDIUM      | `pgcrypto` confirmed; `uuid-ossp` not confirmed enabled — defensive `CREATE EXTENSION IF NOT EXISTS` recommended |
