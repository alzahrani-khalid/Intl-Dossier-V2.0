# Search Schema Fix Plan

**Date**: 2025-10-05
**Issue**: Database function `search_entities_fulltext()` expects schemas that don't match reality
**Status**: Ready to Execute

---

## Schema Mismatches Identified

### 1. Engagements Table
**Expected by search function**:
- `title_en`, `title_ar`, `description_en`, `description_ar`

**Actual schema**:
- `title` (text) - single field, not bilingual
- `description` (text) - single field, not bilingual
- `search_vector` (tsvector) ✅ EXISTS

**Fix Required**: Update search function to use `title` and `description` fields

---

### 2. Positions Table
**Expected by search function**:
- `title_en`, `title_ar`
- `status` field with 'published' value for filtering

**Actual schema**:
- `topic` (varchar) - single field, not bilingual title
- `category` (varchar)
- `stance` (jsonb)
- `approval` (jsonb) - likely contains status
- `version` (jsonb)
- `search_vector` (tsvector) ✅ EXISTS
- `embedding` (vector) ✅ EXISTS

**Fix Required**:
1. Use `topic` instead of `title_en`/`title_ar`
2. Either use `approval->>'status'` for filtering OR remove status filter entirely

---

## Solution: Update search_entities_fulltext() Function

### Current Function Signature
```sql
CREATE OR REPLACE FUNCTION search_entities_fulltext(
  p_entity_type text,
  p_query text,
  p_language text DEFAULT 'english',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
```

### Required Changes

#### For Engagements (when p_entity_type = 'engagements')
```sql
-- OLD (doesn't work):
SELECT
  e.id as entity_id,
  e.title_en as entity_title_en,  -- Column doesn't exist!
  e.title_ar as entity_title_ar,  -- Column doesn't exist!
  ...

-- NEW (works with actual schema):
SELECT
  e.id as entity_id,
  e.title as entity_title_en,     -- Use title for both
  e.title as entity_title_ar,     -- Use title for both
  ts_headline(p_language, COALESCE(e.description, ''), v_tsquery, ...) as entity_snippet_en,
  ts_headline(p_language, COALESCE(e.description, ''), v_tsquery, ...) as entity_snippet_ar,
  ...
FROM engagements e
WHERE e.search_vector @@ v_tsquery
```

#### For Positions (when p_entity_type = 'positions')
```sql
-- OLD (doesn't work):
SELECT
  p.id as entity_id,
  p.title_en as entity_title_en,  -- Column doesn't exist!
  p.title_ar as entity_title_ar,  -- Column doesn't exist!
  ...
FROM positions p
WHERE p.search_vector @@ v_tsquery
  AND p.status = 'published'      -- Column doesn't exist!

-- NEW (works with actual schema):
SELECT
  p.id as entity_id,
  p.topic as entity_title_en,     -- Use topic as title
  p.topic as entity_title_ar,     -- Use topic for both languages
  ts_headline(p_language, COALESCE(p.rationale, p.usage_guidelines, ''), v_tsquery, ...) as entity_snippet_en,
  ts_headline(p_language, COALESCE(p.rationale, p.usage_guidelines, ''), v_tsquery, ...) as entity_snippet_ar,
  ...
FROM positions p
WHERE p.search_vector @@ v_tsquery
  AND p.is_deleted = false        -- Use is_deleted instead of status
  -- Optional: AND (p.approval->>'status') = 'approved'
```

---

## Migration File

**File**: `supabase/migrations/[timestamp]_fix_search_function_schemas.sql`

```sql
-- Fix search_entities_fulltext() to match actual table schemas
-- Date: 2025-10-05
-- Issue: Function expects bilingual fields that don't exist

DROP FUNCTION IF EXISTS search_entities_fulltext(text, text, text, int, int);

CREATE OR REPLACE FUNCTION search_entities_fulltext(
  p_entity_type text,
  p_query text,
  p_language text DEFAULT 'english',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  entity_id uuid,
  entity_type text,
  entity_title_en text,
  entity_title_ar text,
  entity_snippet_en text,
  entity_snippet_ar text,
  rank_score real,
  updated_at timestamptz
) AS $$
DECLARE
  v_tsquery tsquery;
  v_table_name text;
BEGIN
  -- Convert query to tsquery
  v_tsquery := websearch_to_tsquery(p_language, p_query);

  -- Map entity type to table name
  v_table_name := CASE p_entity_type
    WHEN 'dossiers' THEN 'dossiers'
    WHEN 'people' THEN 'users'
    WHEN 'engagements' THEN 'engagements'
    WHEN 'positions' THEN 'positions'
    WHEN 'mous' THEN 'mous'
    WHEN 'documents' THEN 'attachments'
    WHEN 'external_contacts' THEN 'external_contacts'
    ELSE NULL
  END;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;

  -- Execute search based on table
  IF v_table_name = 'dossiers' THEN
    RETURN QUERY
    SELECT
      d.id as entity_id,
      'dossier'::text as entity_type,
      d.name_en as entity_title_en,
      d.name_ar as entity_title_ar,
      ts_headline(p_language, COALESCE(d.summary_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_en,
      ts_headline(p_language, COALESCE(d.summary_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_ar,
      ts_rank_cd(d.search_vector, v_tsquery) as rank_score,
      d.updated_at
    FROM dossiers d
    WHERE d.search_vector @@ v_tsquery
    ORDER BY rank_score DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF v_table_name = 'users' THEN
    RETURN QUERY
    SELECT
      u.id as entity_id,
      'person'::text as entity_type,
      COALESCE(u.name_en, u.full_name) as entity_title_en,
      u.name_ar as entity_title_ar,
      ts_headline(p_language, COALESCE(u.department, u.email, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_en,
      ts_headline(p_language, COALESCE(u.department, u.email, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_ar,
      ts_rank_cd(u.search_vector, v_tsquery) as rank_score,
      u.updated_at
    FROM users u
    WHERE u.search_vector @@ v_tsquery
      AND u.is_active = true
    ORDER BY rank_score DESC
    LIMIT p_limit OFFSET p_offset;

  -- FIX: Engagements uses 'title' not 'title_en'/'title_ar'
  ELSIF v_table_name = 'engagements' THEN
    RETURN QUERY
    SELECT
      e.id as entity_id,
      'engagement'::text as entity_type,
      e.title as entity_title_en,      -- Use single title field
      e.title as entity_title_ar,      -- Use single title field
      ts_headline(p_language, COALESCE(e.description, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_en,
      ts_headline(p_language, COALESCE(e.description, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_ar,
      ts_rank_cd(e.search_vector, v_tsquery) as rank_score,
      e.updated_at
    FROM engagements e
    WHERE e.search_vector @@ v_tsquery
    ORDER BY rank_score DESC
    LIMIT p_limit OFFSET p_offset;

  -- FIX: Positions uses 'topic' not 'title_en'/'title_ar', and 'is_deleted' not 'status'
  ELSIF v_table_name = 'positions' THEN
    RETURN QUERY
    SELECT
      p.id as entity_id,
      'position'::text as entity_type,
      p.topic as entity_title_en,      -- Use topic as title
      p.topic as entity_title_ar,      -- Use topic for both
      ts_headline(p_language, COALESCE(p.rationale, p.usage_guidelines, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_en,
      ts_headline(p_language, COALESCE(p.rationale, p.usage_guidelines, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_ar,
      ts_rank_cd(p.search_vector, v_tsquery) as rank_score,
      p.updated_at
    FROM positions p
    WHERE p.search_vector @@ v_tsquery
      AND p.is_deleted = false         -- Use is_deleted instead of status
    ORDER BY rank_score DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF v_table_name = 'attachments' THEN
    RETURN QUERY
    SELECT
      a.id as entity_id,
      'document'::text as entity_type,
      a.file_name as entity_title_en,
      a.file_name as entity_title_ar,
      ts_headline(p_language, COALESCE(a.description, a.file_type, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_en,
      ts_headline(p_language, COALESCE(a.description, a.file_type, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_ar,
      ts_rank_cd(a.search_vector, v_tsquery) as rank_score,
      a.updated_at
    FROM attachments a
    WHERE a.search_vector @@ v_tsquery
    ORDER BY rank_score DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF v_table_name = 'external_contacts' THEN
    RETURN QUERY
    SELECT
      ec.id as entity_id,
      'person'::text as entity_type,
      ec.name_en as entity_title_en,
      ec.name_ar as entity_title_ar,
      ts_headline(p_language, COALESCE(ec.organization, ec.title, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_en,
      ts_headline(p_language, COALESCE(ec.organization, ec.title, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50') as entity_snippet_ar,
      ts_rank_cd(ec.search_vector, v_tsquery) as rank_score,
      ec.updated_at
    FROM external_contacts ec
    WHERE ec.search_vector @@ v_tsquery
    ORDER BY rank_score DESC
    LIMIT p_limit OFFSET p_offset;

  ELSE
    RAISE EXCEPTION 'Unsupported table: %', v_table_name;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_entities_fulltext(text, text, text, int, int) TO authenticated;
```

---

## Expected Impact

### After Fix:
1. ✅ Engagements search will work (using `title` field)
2. ✅ Positions search will work (using `topic` field, `is_deleted` filter)
3. ✅ Search results will return actual data instead of NULL
4. ✅ Contract tests should improve significantly

### Test Data Requirements After Fix:
Since engagements and positions tables are currently empty, we still need to create test data:
- At least 3 engagements with searchable titles
- At least 5 positions with searchable topics

---

## Execution Steps

1. **Apply Migration**:
   ```bash
   # Use Supabase MCP to apply migration
   supabase.apply_migration(
     project_id='zkrcjzdemdmwhearhfgg',
     name='fix_search_function_schemas',
     query=[SQL above]
   )
   ```

2. **Verify Function**:
   ```sql
   -- Test engagements search (after creating test data)
   SELECT * FROM search_entities_fulltext('engagements', 'test', 'english', 10, 0);

   -- Test positions search (after creating test data)
   SELECT * FROM search_entities_fulltext('positions', 'climate', 'english', 10, 0);
   ```

3. **Create Test Data**:
   - Generate 3 engagements with varied titles
   - Generate 5 positions with climate/energy topics
   - Verify search_vector is populated automatically

4. **Run Tests**:
   ```bash
   cd backend
   npm test -- tests/contract/search-get.test.ts
   ```

---

## Success Criteria

✅ **Function applies without errors**
✅ **Engagements search returns results**
✅ **Positions search returns results**
✅ **Contract tests pass rate improves from 70% to 85%+**

---

**Status**: Ready to execute
**Next Action**: Apply migration to fix function schemas
