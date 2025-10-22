# Database State Verification: Search & Retrieval

**Date**: 2025-10-05
**Project**: zkrcjzdemdmwhearhfgg (eu-west-2)
**Feature**: 015-search-retrieval-spec

---

## ✅ Extensions Verified

| Extension           | Version | Status       |
| ------------------- | ------- | ------------ |
| `pg_trgm`           | 1.6     | ✅ Installed |
| `vector` (pgvector) | 0.8.0   | ✅ Installed |

**Result**: Both required extensions are properly installed and ready for use.

---

## ✅ Search Vector Columns

All required tables have `search_vector` columns with proper tsvector type:

| Table                | Has search_vector | Index Type | Status             |
| -------------------- | ----------------- | ---------- | ------------------ |
| `dossiers`           | ✅ Yes            | GIN        | ✅ Ready           |
| `users`              | ✅ Yes            | GIN        | ✅ **ADDED TODAY** |
| `engagements`        | ✅ Yes            | GIN        | ✅ Ready           |
| `positions`          | ✅ Yes            | GIN        | ✅ Ready           |
| `attachments`        | ✅ Yes            | GIN        | ✅ Ready           |
| `external_contacts`  | ✅ Yes            | GIN        | ✅ Ready           |
| `briefs`             | ✅ Yes            | GIN        | ✅ Ready           |
| `intelligence_items` | ✅ Yes            | GIN        | ✅ Bonus           |

**Total**: 8 tables with search_vector columns

**Note**: `users` table search_vector was added today via migration `add_search_vector_users` to support people search. The database function `search_entities_fulltext` was also updated to use `users` instead of `staff_profiles`.

---

## ✅ Embedding Columns & HNSW Indexes

| Table         | Has embedding   | Index Type | Index Parameters         | Status   |
| ------------- | --------------- | ---------- | ------------------------ | -------- |
| `positions`   | ✅ Yes (vector) | HNSW       | m=16, ef_construction=64 | ✅ Ready |
| `attachments` | ✅ Yes (vector) | HNSW       | m=16, ef_construction=64 | ✅ Ready |
| `briefs`      | ✅ Yes (vector) | HNSW       | m=16, ef_construction=64 | ✅ Ready |

**Additional Embedding Tables**:

- `ai_embeddings` - IVFFlat index (lists=200)
- `document_embeddings` - IVFFlat index (lists=100)
- `position_embeddings` - IVFFlat indexes for EN/AR
- `query_embeddings` - No vector index (cache table)

**Total**: 5 tables with embedding support, 3 with HNSW indexes

---

## ✅ Database Functions

| Function                   | Arguments                                                         | Return Type       | Status               |
| -------------------------- | ----------------------------------------------------------------- | ----------------- | -------------------- |
| `search_entities_fulltext` | p_entity_type, p_query, p_language, p_limit, p_offset             | TABLE (8 columns) | ✅ **UPDATED TODAY** |
| `search_entities_semantic` | p_entity_type, p_query_embedding, p_similarity_threshold, p_limit | TABLE (6 columns) | ✅ Ready             |

**Updates Made**:

- `search_entities_fulltext` now searches `users` table instead of `staff_profiles` for "people" entity type
- Added proper handling for `users.name_en`, `users.name_ar`, and `users.is_active` fields

---

## ⚠️ Test Data Status

### Current Row Counts

| Table               | Total Rows | Notes                           |
| ------------------- | ---------- | ------------------------------- |
| `dossiers`          | **10**     | ✅ Sufficient for basic testing |
| `users`             | **6**      | ✅ Sufficient for people search |
| `engagements`       | **0**      | ⚠️ **EMPTY - Need test data**   |
| `positions`         | **0**      | ⚠️ **EMPTY - Need test data**   |
| `attachments`       | **0**      | ⚠️ **EMPTY - Need test data**   |
| `external_contacts` | **0**      | ⚠️ **EMPTY - Need test data**   |

### Schema Discrepancies Found

During verification, several schema differences were discovered between the migration files and actual database:

1. **Engagements Table** ✅ **ACTUAL SCHEMA VERIFIED**:
   - **Actual schema**: `title` (text), `description` (text) - NOT bilingual
   - Search function expects: `title_en`, `title_ar`, `description_en`, `description_ar`
   - **Columns present**: id, dossier_id, title, engagement_type, engagement_date, location, description, created_by, created_at, updated_at, search_vector
   - **Impact**: Search function needs update to use `title` and `description` instead of bilingual variants
   - **Note**: search_vector column EXISTS ✅

2. **Positions Table** ✅ **ACTUAL SCHEMA VERIFIED**:
   - **Actual schema**: Uses `stance` (jsonb), `approval` (jsonb), `version` (jsonb) fields
   - Search function expects: `status` field with 'published' value
   - **Key fields**: id, topic (varchar), category (varchar), stance (jsonb), approval (jsonb), version (jsonb), search_vector, embedding
   - **Impact**: Search function filters by non-existent `status` field - needs to use `approval.status` or remove filter
   - **Note**: Both search_vector ✅ and embedding ✅ columns exist
   - **No bilingual title fields**: Uses `topic` (single varchar) instead of `title_en`/`title_ar`

3. **Users vs Staff Profiles**:
   - ✅ Successfully migrated from `staff_profiles` to `users`
   - Users table has: `name_en`, `name_ar`, `full_name`, `is_active`
   - This was fixed today!

### Required Test Data

For comprehensive testing, we need:

**Minimum Requirements**:

- ✅ 5+ dossiers with name_en/name_ar containing "climate"/"مناخ" (Currently: 10 dossiers exist)
- ✅ 3+ users (active) with names (Currently: 6 users exist)
- ⚠️ 3+ engagements (Currently: 0)
- ⚠️ 5+ positions (Currently: 0)
- ⚠️ 2+ attachments (Currently: 0)
- ⚠️ 2+ external_contacts (Currently: 0)

**For Semantic Search Testing**:

- Positions with embeddings (need to populate embedding column)
- Attachments with embeddings
- Briefs with embeddings

---

## 🔧 Required Fixes

### High Priority

1. **Fix Engagements Table Schema** (if bilingual search is required):

   ```sql
   ALTER TABLE engagements
     ADD COLUMN IF NOT EXISTS title_en text,
     ADD COLUMN IF NOT EXISTS title_ar text,
     ADD COLUMN IF NOT EXISTS description_en text,
     ADD COLUMN IF NOT EXISTS description_ar text;

   -- Migrate existing data
   UPDATE engagements SET title_en = title WHERE title_en IS NULL;
   ```

2. **Fix Positions Table Filter**:
   - Option A: Add `status` column to positions table
   - Option B: Update `search_entities_fulltext` function to use correct field
   - **Recommended**: Check positions table schema and update function accordingly

3. **Create Test Data**:
   - Generate sample engagements
   - Generate sample positions
   - Generate sample attachments
   - Generate sample external_contacts

### Medium Priority

4. **Verify Edge Function Field References**:
   - Check `search/index.ts` field references match actual schemas
   - Check `search-suggest/index.ts` field references match actual schemas
   - Update if needed

5. **Populate Embeddings**:
   - Run embedding queue processor to generate embeddings
   - Or manually insert sample embeddings for testing

---

## 📊 Edge Functions Status

| Function          | Status      | Last Deployed    | Table Mapping                  |
| ----------------- | ----------- | ---------------- | ------------------------------ |
| `search`          | ✅ Deployed | 2025-10-05 09:10 | Uses `users` for people ✅     |
| `search-suggest`  | ✅ Deployed | 2025-10-05 09:10 | Uses `users` for people ✅     |
| `search-semantic` | ✅ Deployed | 2025-10-05 08:58 | Ready (placeholder embeddings) |

**All functions updated** to use `users` table instead of `staff_profiles` for people search.

---

## 🎯 Test Readiness Assessment

### Can Run Tests Now ✅

- ✅ GET /search with `type=dossiers` (10 dossiers available)
- ✅ GET /search with `type=people` (6 users available)
- ✅ GET /search-suggest with `type=dossiers` (10 dossiers available)
- ✅ GET /search-suggest with `type=people` (6 users available)
- ✅ Basic error handling tests (don't need data)
- ✅ Validation tests (malformed requests)

### Cannot Run Tests Yet ⚠️

- ⚠️ GET /search with `type=engagements` (0 engagements)
- ⚠️ GET /search with `type=positions` (0 positions + schema issue)
- ⚠️ GET /search with `type=documents` (0 attachments)
- ⚠️ GET /search with `type=all` (will be incomplete)
- ⚠️ POST /search-semantic (no embeddings populated)
- ⚠️ Integration tests requiring multiple entity types

### Schema Issues Blocking Tests 🚫

- 🚫 Engagements search (missing bilingual title/description columns)
- 🚫 Positions search (filtering by non-existent `status` field)

---

## 💡 Recommended Next Steps

### Option 1: Fix Schemas First (Recommended)

1. Investigate actual engagements table schema
2. Update engagements to have bilingual fields OR update search function
3. Investigate actual positions table schema
4. Update positions filtering in search function
5. Create test data for all entity types
6. Run full test suite

### Option 2: Test What Works Now

1. Run contract tests for dossiers and people search only
2. Document which tests are blocked by missing data
3. Fix schemas after initial test results
4. Create test data
5. Re-run blocked tests

### Option 3: Create Test Data with Current Schema

1. Create test engagements using actual schema (non-bilingual)
2. Create test positions using actual schema
3. Update search functions to match actual schemas
4. Run all tests
5. Fix failing tests based on results

---

## 🔍 Suggested SQL Queries

### Check Actual Engagements Schema

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'engagements' AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Check Actual Positions Schema

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'positions' AND table_schema = 'public'
AND column_name LIKE '%status%' OR column_name LIKE '%stance%' OR column_name LIKE '%state%'
ORDER BY ordinal_position;
```

### Check Dossiers for "Climate" Data

```sql
SELECT id, name_en, name_ar, search_vector IS NOT NULL as has_search_vector
FROM dossiers
WHERE name_en ILIKE '%climate%' OR name_ar LIKE '%مناخ%'
LIMIT 5;
```

### Check Users Data

```sql
SELECT id, name_en, name_ar, full_name, is_active, search_vector IS NOT NULL as has_search_vector
FROM users
WHERE is_active = true
LIMIT 5;
```

---

## Summary

### ✅ What's Working

- All PostgreSQL extensions installed
- All search_vector columns exist (including newly added users table)
- All HNSW embedding indexes exist
- Both database functions exist and are updated
- All Edge Functions deployed with correct table mappings
- Basic test data exists for dossiers (10) and users (6)

### ⚠️ What Needs Attention

- Engagements table schema doesn't match expectations (not bilingual)
- Positions table missing `status` field (has `stance` instead)
- Missing test data for: engagements, positions, attachments, external_contacts
- No embeddings populated for semantic search testing

### 🚫 Blocking Issues

1. **Schema mismatches** between migration expectations and actual database
2. **Missing test data** for 4 out of 6 entity types
3. **No embeddings** for semantic search testing

---

**Recommendation**: Before running tests, investigate and fix the schema mismatches for engagements and positions tables. This will prevent spurious test failures due to database structure issues rather than code issues.

**Next Action**: Choose one of the three options above and proceed accordingly.

---

**Last Updated**: 2025-10-05 09:30 UTC
**Status**: Database infrastructure ✅ Ready | Test data ⚠️ Partial | Schemas 🚫 Need Investigation
