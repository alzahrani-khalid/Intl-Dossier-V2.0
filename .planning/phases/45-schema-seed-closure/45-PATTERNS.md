# Phase 45: Schema & Seed Closure - Pattern Map

**Generated:** 2026-05-07
**Status:** Ready for planning

## Scope Extracted

Phase 45 touches four implementation seams:

| Target                                                                    | Role                                                           | Closest analog                                                                                                                                                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` | New tenant-scoped table plus idempotent staging apply artifact | `supabase/migrations/20260113500001_tenant_isolation_layer.sql` for `tenant_isolation.rls_*_policy`; `supabase/seed/060-dashboard-demo.sql` for deterministic `b00000xx-*` fixture IDs |
| `supabase/seed/060-dashboard-demo.sql`                                    | Canonical dashboard seed source                                | Existing sections 1-11 in the same file: declared UUID variables, delete/reinsert idempotency, ordered fixture inserts                                                                 |
| `frontend/src/hooks/useIntelligenceDigest.ts`                             | Dashboard data hook for digest rows                            | `frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts` and `frontend/src/hooks/useVipVisits.ts` for TanStack Query hook shape and display-row adapter                        |
| `frontend/src/pages/Dashboard/widgets/Digest.tsx`                         | Widget consumer that renders publication source                | Existing `Digest.tsx` structure, but replace `useActivityFeed` import with the new hook and remove `actor_name` mapping                                                                |
| `supabase/migrations/20260507211000_phase45_vip_iso_events.sql`           | Additive RPC replacement for `get_upcoming_events`             | `supabase/migrations/20260330000001_operations_hub_rpcs.sql` existing function body                                                                                                    |
| `frontend/src/domains/operations-hub/types/operations-hub.types.ts`       | Add nullable person fields to shared timeline type             | Existing optional/null field style in `TimelineEvent`                                                                                                                                  |
| `frontend/src/hooks/useVipVisits.ts`                                      | VIP adapter from operations-hub events to widget rows          | Existing `toVipVisit` mapper; update it to use `person_*` fields and preserve legacy fallback                                                                                          |
| `frontend/src/pages/Dashboard/widgets/VipVisits.tsx`                      | Flag glyph rendering                                           | `frontend/src/components/signature-visuals/DossierGlyph.tsx` country+ISO branch                                                                                                        |
| `frontend/tests/e2e/dossier-drawer-*.spec.ts`                             | Seed-dependent verification                                    | `frontend/tests/e2e/support/dossier-drawer-fixture.ts` fixture contract                                                                                                                |

## Concrete Patterns

### Supabase RLS

Use the tenant isolation helpers already present in
`supabase/migrations/20260113500001_tenant_isolation_layer.sql`:

```sql
tenant_isolation.rls_select_policy(organization_id)
tenant_isolation.rls_update_policy(organization_id)
tenant_isolation.rls_delete_policy(organization_id)
public.auth_has_any_role(ARRAY['admin', 'editor'])
```

For inserts, do not use `tenant_isolation.rls_insert_policy` alone. It only
checks membership. Phase 45 must add the role gate explicitly.

### Dashboard Seed

`supabase/seed/060-dashboard-demo.sql` uses deterministic variables and
delete/reinsert idempotency:

```sql
v_user_id UUID := 'de2734cf-f962-4e05-bf62-bc9e92efff96';
DELETE FROM activity_stream WHERE id::text LIKE 'b0000009-%';
INSERT INTO activity_stream (...) VALUES (...);
```

Phase 45 should mirror this style with `b0000010-*` for
`intelligence_digest`, `b0000011-*` for person dossiers, and `b0000012-*`
for engagement participants.

### Digest Widget

Current anti-pattern in `Digest.tsx`:

```ts
import { useActivityFeed } from '@/hooks/useActivityFeed'
source: a.actor_name
```

Target pattern:

```ts
import { useIntelligenceDigest } from '@/hooks/useIntelligenceDigest'
const { data: rows, isLoading, error, refetch } = useIntelligenceDigest()
```

The widget keeps `.digest`, `.digest-item`, `.digest-tag`, `.digest-head`,
`.digest-source`, `.digest-overlay`, `WidgetSkeleton`, `GlobeSpinner`, and the
ghost `Button`.

### VIP ISO Path

`DossierGlyph` only renders flags through the country branch:

```tsx
<DossierGlyph type="country" iso={visit.personFlag} name={visit.name} />
```

`useVipVisits` should treat nullable person metadata returned by
`get_upcoming_events` as the VIP signal and keep `event_type === 'vip_visit'`
only as a legacy fallback.

### Test Commands

Use the focused commands from `45-VALIDATION.md`:

```bash
pnpm -C frontend exec vitest run src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx
doppler run -- pnpm --filter frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts
```

## Landmines

- `country_iso_codes` in REQUIREMENTS.md is conceptual. The repo-backed source
  is `countries.iso_code_2`.
- `frontend/seeds/060-dashboard-demo.sql` is stale. The canonical path is
  `supabase/seed/060-dashboard-demo.sql`.
- `get_upcoming_events` is shared. Any RPC change must be additive and nullable.
- The live staging apply must use Supabase MCP for project
  `zkrcjzdemdmwhearhfgg`; do not plan a direct `psql` apply.
- The worktree already contains unrelated deleted historical planning files.
  Phase 45 executors must not restore or commit those deletions.
