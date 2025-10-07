# Quickstart Guide: Search & Retrieval

**Feature**: 015-search-retrieval-spec  
**Purpose**: Validate search implementation with real-world scenarios  
**Estimated Time**: 30 minutes

---

## Prerequisites

### Required Services

1. **PostgreSQL 15** with extensions:
   ```bash
   # Verify extensions are installed
   psql -c "SELECT * FROM pg_extension WHERE extname IN ('pg_trgm', 'pgvector');"
   ```

2. **Redis 7.x** running:
   ```bash
   redis-cli ping
   # Expected: PONG
   ```

3. **Supabase Project** configured with:
   - RLS policies enabled
   - Auth configured
   - API keys generated

4. **AnythingLLM** (for semantic search):
   ```bash
   curl http://localhost:3001/api/health
   # Expected: {"status": "healthy"}
   ```

### Test Data

Run seed script to populate test entities:
```bash
psql -f specs/015-search-retrieval-spec/seed/test-data.sql
```

Expected test data:
- 50 dossiers (25 active, 15 archived, 10 with Arabic titles)
- 30 people (staff + external contacts)
- 20 engagements
- 40 positions (15 with embeddings)
- 25 documents (10 with embeddings)

---

## Step 1: Validate Database Setup

### Check Search Indexes

```sql
-- Verify tsvector columns exist
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = 'search_vector'
  AND table_schema = 'public';

-- Expected: 6 rows (dossiers, staff_profiles, engagements, positions, external_contacts, attachments)
```

### Check Vector Indexes

```sql
-- Verify HNSW indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE indexname LIKE '%embedding%';

-- Expected: 3 indexes (positions, attachments, briefs)
```

### Check Trigram Indexes

```sql
-- Verify trigram support
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE indexname LIKE '%trgm%';

-- Expected: 12 indexes (title_en, title_ar for 6 entity types)
```

---

## Step 2: Test Full-Text Search

### Test 1: Simple Keyword Search (English)

```bash
curl -X GET "http://localhost:8000/api/v1/search?q=climate&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200
- `counts.total` > 0
- Results contain "climate" in title or snippet
- `took_ms` < 500
- Results ordered by `rank_score` DESC

### Test 2: Bilingual Search (Arabic)

```bash
curl -X GET "http://localhost:8000/api/v1/search?q=مناخ&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200
- Arabic snippets with `<mark>` tags
- Both Arabic-titled and English-titled results (cross-language)
- `query.language_detected` = "ar"

### Test 3: Boolean Operators

```bash
curl -X GET 'http://localhost:8000/api/v1/search?q=climate%20AND%20(policy%20OR%20treaty)&limit=10' \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200
- `query.has_boolean_operators` = true
- Results contain climate + (policy OR treaty)
- Ranking respects boolean logic

### Test 4: Entity Type Filtering

```bash
curl -X GET "http://localhost:8000/api/v1/search?q=climate&type=dossiers,positions&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200
- `counts.people` = 0 (filtered out)
- `counts.engagements` = 0 (filtered out)
- Only dossiers and positions in results

### Test 5: Archived Items

```bash
curl -X GET "http://localhost:8000/api/v1/search?q=climate&include_archived=true&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- Results include items with `is_archived` = true
- Archived items have "Archived" badge indicator

---

## Step 3: Test Typeahead Suggestions

### Test 1: Prefix Search (Performance Critical)

```bash
# Measure response time
time curl -X GET "http://localhost:8000/api/v1/search/suggest?q=clim&type=all&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200
- `took_ms` < 200 (absolute requirement)
- 10 suggestions ordered by relevance
- `cache_hit` = false (first request)

### Test 2: Cache Hit Performance

```bash
# Run same request again
time curl -X GET "http://localhost:8000/api/v1/search/suggest?q=clim&type=all&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200
- `took_ms` < 10 (cache hit should be very fast)
- `cache_hit` = true
- Identical results to Test 1

### Test 3: Fuzzy Matching (Typo Tolerance)

```bash
curl -X GET "http://localhost:8000/api/v1/search/suggest?q=climat&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200
- Suggestions include "climate" items (typo corrected)
- Fuzzy match distance acceptable

### Test 4: Arabic Suggestions

```bash
curl -X GET "http://localhost:8000/api/v1/search/suggest?q=من&lang=ar&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200
- Arabic suggestions in `title_ar` fields
- Normalized Arabic (diacritics removed)

---

## Step 4: Test Semantic Search

### Test 1: Conceptual Similarity (No Keyword Overlap)

```bash
curl -X POST "http://localhost:8000/api/v1/search/semantic" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sustainable development goals",
    "entity_types": ["positions", "documents"],
    "similarity_threshold": 0.6,
    "limit": 10
  }'
```

**Expected Response**:
- HTTP 200
- Results include items about "green economy", "environmental policy", etc. (semantic matches)
- `similarity_score` >= 0.6 for all results
- `match_type` = "semantic" for related items
- `performance.embedding_generation_ms` < 300

### Test 2: Hybrid Search (Exact + Semantic)

```bash
curl -X POST "http://localhost:8000/api/v1/search/semantic" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "climate change policy",
    "entity_types": ["positions", "documents"],
    "include_keyword_results": true,
    "limit": 10
  }'
```

**Expected Response**:
- HTTP 200
- `exact_matches` array has items with exact keyword matches
- `results` array has semantic matches
- Exact matches ranked higher than semantic matches
- Total `took_ms` < 500

### Test 3: Cross-Language Semantic Search

```bash
curl -X POST "http://localhost:8000/api/v1/search/semantic" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "سياسة المناخ",
    "entity_types": ["positions"],
    "similarity_threshold": 0.6,
    "limit": 10
  }'
```

**Expected Response**:
- HTTP 200
- Results include English-titled positions about climate policy
- Cross-language matching works (Arabic → English)

---

## Step 5: Test Performance Targets

### Test 1: Concurrent Suggestion Requests

```bash
# Install Apache Bench if not already installed
# apt-get install apache2-utils

# 100 requests, 10 concurrent
ab -n 100 -c 10 \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  "http://localhost:8000/api/v1/search/suggest?q=clim&limit=10"
```

**Expected Results**:
- 100% successful requests (no 500 errors)
- p95 < 200ms
- p99 < 300ms
- Throughput > 50 req/sec

### Test 2: Concurrent Search Requests

```bash
ab -n 100 -c 10 \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  "http://localhost:8000/api/v1/search?q=climate&limit=20"
```

**Expected Results**:
- 100% successful requests
- p95 < 500ms
- p99 < 1000ms
- Throughput > 20 req/sec

### Test 3: Load Test (50 Concurrent Users)

```bash
# Install hey if not installed
# go install github.com/rakyll/hey@latest

hey -n 500 -c 50 -m GET \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  "http://localhost:8000/api/v1/search?q=climate&limit=20"
```

**Expected Results**:
- No degradation under 50 concurrent users
- p95 < 500ms maintained
- Error rate < 1%

---

## Step 6: Test Error Handling

### Test 1: Empty Query

```bash
curl -X GET "http://localhost:8000/api/v1/search?q=&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 400
- Error message in both English and Arabic
- `error` = "bad_request"

### Test 2: Query Too Long (>500 characters)

```bash
curl -X GET "http://localhost:8000/api/v1/search?q=$(printf 'a%.0s' {1..600})&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200 (query truncated, not rejected)
- `warnings` array contains "Query truncated to 500 characters"
- Results still returned

### Test 3: Invalid Entity Type

```bash
curl -X GET "http://localhost:8000/api/v1/search?q=climate&type=invalid&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 400
- Error explaining valid entity types

### Test 4: Unauthorized Request

```bash
curl -X GET "http://localhost:8000/api/v1/search?q=climate&limit=10"
# No Authorization header
```

**Expected Response**:
- HTTP 401
- Bilingual error message

### Test 5: Rate Limit Exceeded

```bash
# Send 100 requests rapidly
for i in {1..100}; do
  curl -X GET "http://localhost:8000/api/v1/search?q=climate&limit=10" \
    -H "Authorization: Bearer $SUPABASE_TOKEN"
done
```

**Expected Response (after ~60 requests in 1 minute)**:
- HTTP 429
- `retry_after` header with seconds to wait
- Bilingual error message

---

## Step 7: Test RLS & Permissions

### Test 1: Restricted Results

```bash
# Login as limited-permission user
curl -X GET "http://localhost:8000/api/v1/search?q=confidential&limit=10" \
  -H "Authorization: Bearer $LIMITED_USER_TOKEN"
```

**Expected Response**:
- HTTP 200
- `counts.restricted` > 0
- `metadata.restricted_message` = "X additional results require higher permissions"
- No sensitive data in returned results

### Test 2: Public Results Only

```bash
# Unauthenticated search (if public search enabled)
curl -X GET "http://localhost:8000/api/v1/search?q=climate&limit=10"
```

**Expected Response**:
- HTTP 200 (or 401 if auth required)
- Only public entities returned
- Private/internal entities excluded

---

## Step 8: Test Redis Cache Fallback

### Test 1: Redis Down Scenario

```bash
# Stop Redis
docker stop redis

# Test suggestions (should fallback to database)
curl -X GET "http://localhost:8000/api/v1/search/suggest?q=clim&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

**Expected Response**:
- HTTP 200 (still works!)
- `took_ms` between 300-500 (degraded but acceptable)
- `cache_hit` = false
- Loading indicator should show on frontend

```bash
# Restart Redis
docker start redis
```

---

## Step 9: Validate Accessibility

### Test 1: Keyboard Navigation

**Manual Test**:
1. Open search interface
2. Press `/` (or configured hotkey) to focus search box
3. Type "climate"
4. Press ↓ arrow key
5. Navigate through suggestions with ↑/↓
6. Press Enter to select
7. Press Escape to close

**Expected Behavior**:
- Focus moves correctly
- Selected suggestion highlighted
- Enter opens result
- Escape closes dropdown

### Test 2: Screen Reader Compatibility

**Manual Test** (with NVDA/JAWS):
1. Navigate to search input
2. Verify label is announced
3. Type query
4. Verify "X results found" announcement
5. Navigate through results
6. Verify each result title is announced

**Expected Announcements**:
- "Search input, edit"
- "27 results found for climate"
- "Climate Action Partnership, dossier, updated October 1st"

### Test 3: ARIA Labels (Automated)

```bash
# Run accessibility tests
npm run test:a11y -- --grep "search"
```

**Expected**:
- All search inputs have `aria-label`
- Result lists have `role="listbox"`
- Suggestions have `role="option"`
- Loading states have `aria-busy`

---

## Success Criteria

### Functional Requirements ✓

- [x] FR-001: Global search accessible from all pages
- [x] FR-002: Searches across all 6 entity types
- [x] FR-003: Typeahead suggestions with entity grouping
- [x] FR-004: Suggestions < 200ms absolute
- [x] FR-005: Bilingual search (Arabic + English)
- [x] FR-006: Bilingual snippets with `<mark>` tags
- [x] FR-007: Tabbed result views
- [x] FR-008: Result counts per tab
- [x] FR-009: Keyboard navigation works
- [x] FR-010: Entity type filtering works
- [x] FR-011: Semantic search for positions/docs/briefs
- [x] FR-013: Redis caching with fallback
- [x] FR-014: RLS policies enforced
- [x] FR-015: Snippet highlighting works
- [x] FR-016: Clear search button works
- [x] FR-017: Concurrent searches don't block
- [x] FR-018: Exact vs semantic match separation
- [x] FR-019: Typo suggestions on no results
- [x] FR-020: Search tips on no results
- [x] FR-021: 500-char limit enforced
- [x] FR-022: Boolean operators supported

### Performance Requirements ✓

- [x] NFR-001: Exact matches ranked first
- [x] NFR-002: 50-100 concurrent users supported
- [x] NFR-003: Real-time index updates
- [x] NFR-004: Performance at 10k-50k entities
- [x] NFR-005: 60% similarity threshold enforced

### Constitution Compliance ✓

- [x] §1 Bilingual Excellence: Arabic/English equal support
- [x] §2 Type Safety: TypeScript strict mode
- [x] §3 Security-First: RLS, rate limiting, input validation
- [x] §4 Data Sovereignty: Self-hosted (PostgreSQL, Redis, AnythingLLM)
- [x] §5 Resilient Architecture: Redis fallback, error boundaries
- [x] §6 Accessibility: WCAG 2.1 AA, keyboard nav, screen reader
- [x] §7 Container-First: Redis containerized

---

## Troubleshooting

### Issue: Suggestions slow (>200ms)

**Diagnosis**:
```bash
# Check Redis connection
redis-cli ping

# Check cache hit rate
redis-cli INFO stats | grep keyspace_hits
```

**Fix**:
- Warm cache with common prefixes
- Increase Redis memory limit
- Check PostgreSQL index usage

### Issue: No semantic results

**Diagnosis**:
```sql
-- Check if embeddings exist
SELECT COUNT(*) FROM positions WHERE embedding IS NOT NULL;
```

**Fix**:
- Run embedding queue processor
- Verify AnythingLLM connection
- Check `embedding_update_queue` for errors

### Issue: Search returns restricted results user can access

**Diagnosis**:
```sql
-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'dossiers';
```

**Fix**:
- Update RLS policies
- Check user permissions in `staff_profiles`
- Verify JWT claims in auth token

---

## Next Steps

After successful quickstart validation:

1. ✅ Run full test suite: `npm test`
2. ✅ Deploy to staging environment
3. ✅ Performance test with production data volume
4. ✅ User acceptance testing with GASTAT staff
5. ✅ Monitor error rates and latencies in production

---

**Quickstart Completion Time**: _________  
**Tests Passed**: _____ / 40  
**Ready for Production**: ☐ Yes ☐ No (see notes)

**Notes**:
_______________________________________________________
_______________________________________________________
