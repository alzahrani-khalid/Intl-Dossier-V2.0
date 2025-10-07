# Assignment Engine & SLA - Implementation Session 1

**Date**: 2025-10-02
**Branch**: `013-assignment-engine-sla`
**Status**: Database migrations created, ready for manual application

## Summary

This session created the foundational database migrations for the Assignment Engine & SLA feature. These migrations establish the schema for organizational units, skills, staff profiles, and assignment rules.

## Migrations Created

### ✅ Completed Migrations

| File | Task | Description | Dependencies |
|------|------|-------------|--------------|
| `20251002000_create_helper_functions.sql` | T011 (moved) | Helper functions for optimistic locking and timestamp updates | None |
| `20251002001_create_assignment_enums.sql` | T001 | Create 5 enums (availability_status, work_item_type, priority_level, assignment_status, escalation_reason) | None |
| `20251002002_create_organizational_units.sql` | T002 | Organizational units table with bilingual fields, WIP limits, hierarchy | T001 |
| `20251002003_create_skills.sql` | T003 | Skills table with bilingual names and categories | None |
| `20251002004_create_staff_profiles.sql` | T004 | Staff profiles with skills array, WIP limits, availability, optimistic locking | T000, T001, T002 |
| `20251002005_create_assignment_rules.sql` | T005 | Assignment routing rules with skill requirements | T002, T003 |

### 📋 Remaining Migrations to Create

**Phase 3.1 - Database Schema** (T006-T023):
- T006: `sla_configs` table with deadline matrix
- T007: `assignments` table (core entity)
- T008: `assignment_queue` table
- T009: `escalation_events` table (audit trail)
- T010: `capacity_snapshots` table (analytics)
- T012: SLA deadline calculator function
- T013: Assignment count maintenance function
- T014: Queue processing trigger
- T015: SLA monitoring function (for pg_cron)
- T016: Escalation recipient resolver function
- T017-T019a: pg_cron job setup (SLA monitoring, capacity snapshots, queue fallback, escalation cleanup)
- T020-T023: RLS policies for all tables

## Manual Application Instructions

### Option 1: Apply via Supabase Dashboard

1. Navigate to your Supabase project: `Intl-Dossier` (zkrcjzdemdmwhearhfgg)
2. Go to **SQL Editor** → **New query**
3. Apply migrations in order:
   ```sql
   -- Step 1: Helper functions
   \i supabase/migrations/20251002000_create_helper_functions.sql

   -- Step 2: Enums
   \i supabase/migrations/20251002001_create_assignment_enums.sql

   -- Step 3: Organizational units
   \i supabase/migrations/20251002002_create_organizational_units.sql

   -- Step 4: Skills
   \i supabase/migrations/20251002003_create_skills.sql

   -- Step 5: Staff profiles
   \i supabase/migrations/20251002004_create_staff_profiles.sql

   -- Step 6: Assignment rules
   \i supabase/migrations/20251002005_create_assignment_rules.sql
   ```

### Option 2: Apply via Supabase MCP

Use the `mcp__supabase__apply_migration` tool:

```typescript
// For each migration file:
await mcp__supabase__apply_migration({
  project_id: "zkrcjzdemdmwhearhfgg",
  name: "create_helper_functions",
  query: "<contents of 20251002000_create_helper_functions.sql>"
});
```

### Option 3: Apply via Supabase CLI

```bash
cd /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0

# Link to remote project
supabase link --project-ref zkrcjzdemdmwhearhfgg

# Push migrations
supabase db push
```

## Verification

After applying migrations, verify tables created:

```sql
-- Check enums
SELECT typname FROM pg_type WHERE typname LIKE '%status' OR typname LIKE '%level' OR typname LIKE '%reason';

-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizational_units', 'skills', 'staff_profiles', 'assignment_rules');

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('increment_version_column', 'update_updated_at_column');
```

## Next Session Tasks

### Priority 1: Complete Database Schema (T006-T023)

1. **T006**: Create `sla_configs` table with seed data (SLA matrix from spec)
2. **T007**: Create `assignments` table (core entity with triggers)
3. **T008**: Create `assignment_queue` table
4. **T009**: Create `escalation_events` table (immutable audit trail)
5. **T010**: Create `capacity_snapshots` table

### Priority 2: Database Functions (T012-T016)

6. **T012**: SLA deadline calculator function
7. **T013**: Assignment count maintenance trigger
8. **T014**: Queue processing trigger (pg_notify)
9. **T015**: SLA monitoring function (pg_cron job)
10. **T016**: Escalation recipient resolver

### Priority 3: pg_cron Jobs (T017-T019a)

11. **T017**: Schedule SLA monitoring (every 30 seconds)
12. **T018**: Schedule capacity snapshots (daily at midnight)
13. **T019**: Schedule queue fallback processor (every 60 seconds)
14. **T019a**: Schedule escalation cleanup (daily at 02:00 UTC)

### Priority 4: RLS Policies (T020-T023)

15. **T020**: RLS for `staff_profiles`
16. **T021**: RLS for `assignments`
17. **T022**: RLS for `escalation_events`
18. **T023**: RLS for `assignment_queue`

### Priority 5: Implementation (Phase 3.3+)

After database schema is complete:
- Skip tests initially (Phase 3.2 - T024-T039)
- Implement core services (T040-T045)
- Implement Edge Functions (T046-T052)
- Add UI components and hooks (T053-T063)

## Technical Notes

### Optimistic Locking Strategy

The `staff_profiles` table uses a `version` column for optimistic locking to prevent race conditions during concurrent assignment operations. The `increment_version_column()` trigger automatically increments this field on every update.

**Usage Pattern**:
```typescript
// 1. Read with version
const staff = await db.from('staff_profiles').select('*').eq('id', staffId).single();

// 2. Update with version check
const { error } = await db
  .from('staff_profiles')
  .update({ current_assignment_count: staff.current_assignment_count + 1 })
  .eq('id', staffId)
  .eq('version', staff.version); // Optimistic lock

if (error || !data) {
  // Concurrent modification detected, retry
}
```

### Skills Array Foreign Keys

The `skills` column in `staff_profiles` and `required_skills` in `assignment_rules` use `UUID[]` arrays. PostgreSQL doesn't enforce array element foreign keys at the constraint level, so validation must happen at the application layer.

**Validation Example**:
```sql
-- Check if all skill IDs exist
SELECT COUNT(*) = array_length($1, 1)
FROM skills
WHERE id = ANY($1::uuid[]);
```

### Hierarchical Organization Units

The `organizational_units` table supports self-referencing hierarchy via `parent_unit_id`. The unique constraint on names uses `COALESCE` to handle NULL parent units (top-level units).

## Files Modified

### Created
- `supabase/migrations/20251002000_create_helper_functions.sql`
- `supabase/migrations/20251002001_create_assignment_enums.sql`
- `supabase/migrations/20251002002_create_organizational_units.sql`
- `supabase/migrations/20251002003_create_skills.sql`
- `supabase/migrations/20251002004_create_staff_profiles.sql`
- `supabase/migrations/20251002005_create_assignment_rules.sql`
- `specs/013-assignment-engine-sla/IMPLEMENTATION_SESSION_1.md` (this file)

### To Update in Next Session
- `specs/013-assignment-engine-sla/tasks.md` - Mark T001-T005 as completed

## Estimated Completion

**Session 1** (Completed): 6 migrations (T000-T005)
**Session 2** (Recommended): Complete database schema (T006-T023) - ~2-3 hours
**Session 3**: Core services and Edge Functions (T040-T052) - ~3-4 hours
**Session 4**: UI components and hooks (T053-T063) - ~2-3 hours
**Session 5**: Tests and polish (T024-T083) - ~4-5 hours

**Total Estimated**: 12-16 hours for full feature implementation

## References

- **Spec**: `specs/013-assignment-engine-sla/spec.md`
- **Data Model**: `specs/013-assignment-engine-sla/data-model.md`
- **Research**: `specs/013-assignment-engine-sla/research.md`
- **API Contracts**: `specs/013-assignment-engine-sla/contracts/api-spec.yaml`
- **Tasks**: `specs/013-assignment-engine-sla/tasks.md`

---

**Next Action**: Apply these 6 migrations to Supabase, then continue with T006-T023 in next session.
