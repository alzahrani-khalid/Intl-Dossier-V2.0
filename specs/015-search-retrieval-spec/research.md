# Research: Search & Retrieval

**Feature**: 015-search-retrieval-spec
**Date**: 2025-10-04
**Status**: Complete

## Overview

This document consolidates research findings for implementing a high-performance, bilingual search system with both keyword and semantic search capabilities. The research focuses on PostgreSQL full-text search, Redis caching, vector embeddings, and performance optimization strategies.

---

## 1. PostgreSQL Full-Text Search (pg_trgm + pg_tsvector)

### Decision: Hybrid approach using GIN indexes for tsvector + trigram indexes for fuzzy matching

**Rationale**:
- **pg_tsvector** provides language-aware tokenization and stemming for exact keyword matching
- **pg_trgm** enables fuzzy matching and typo tolerance using trigram similarity
- Combining both gives exact match precision with fuzzy match recall

**Implementation Pattern**:
```sql
-- Create tsvector column for full-text search
ALTER TABLE dossiers ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(title_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(description_ar, '')), 'B')
  ) STORED;

-- GIN index for fast tsvector search
CREATE INDEX idx_dossiers_search_vector ON dossiers USING GIN(search_vector);

-- Trigram index for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_dossiers_title_en_trgm ON dossiers USING GIN(title_en gin_trgm_ops);
CREATE INDEX idx_dossiers_title_ar_trgm ON dossiers USING GIN(title_ar gin_trgm_ops);
```

**Ranking Strategy**:
1. Exact tsvector matches ranked with `ts_rank_cd()` (cover density ranking)
2. Apply position-based weights: title (A=1.0), description (B=0.4), content (C=0.2)
3. Boost recent entities using `log(1 + extract(epoch from age(now(), updated_at)))`
4. Trigram similarity as secondary ranking factor for fuzzy matches

**Bilingual Considerations**:
- Use separate text search configurations: `'english'` and `'arabic'`
- Arabic requires custom stop words list (common words like "من", "في", "على")
- Normalize Arabic text: remove diacritics, handle different forms of letters
- Store both language vectors in same tsvector column with language labels

**Performance**:
- GIN indexes provide O(log N) lookup time
- Expected: <50ms for tsvector queries on 50k entities
- Trigram queries slightly slower: <100ms for similarity threshold 0.3

**Alternatives Considered**:
- ❌ **Elasticsearch**: Rejected due to Data Sovereignty principle (external service)
- ❌ **pg_search gem patterns**: Rejected (Ruby-specific, not applicable to TypeScript)
- ❌ **LIKE queries**: Rejected (too slow for 50k entities, no ranking)

---

## 2. Redis Caching Strategy for Suggestions

### Decision: Prefix-based caching with 5-minute TTL and LRU eviction

**Rationale**:
- Typeahead suggestions are highly cacheable (same prefix → same suggestions)
- 200ms performance target requires cache hit for popular queries
- Short TTL ensures fresh results without stale data issues

**Implementation Pattern**:
```typescript
// Cache key structure: search:suggest:{entityType}:{prefix}
const cacheKey = `search:suggest:${entityType}:${normalizePrefix(prefix)}`;

// Cache structure: ZSET with scores for ranking
await redis.zadd(cacheKey,
  ...suggestions.map(s => [s.score, JSON.stringify(s)])
);
await redis.expire(cacheKey, 300); // 5 minutes

// Retrieval
const cached = await redis.zrevrange(cacheKey, 0, 9); // Top 10
```

**Cache Warming Strategy**:
- Pre-populate common search prefixes on deployment
- Track top 100 search queries daily, warm cache proactively
- Background job: regenerate cache for popular prefixes every 3 minutes

**Fallback Mechanism**:
```typescript
async function getSuggestions(prefix: string, entityType: string) {
  const cacheKey = `search:suggest:${entityType}:${prefix}`;

  // Try cache first
  const cached = await redis.zrevrange(cacheKey, 0, 9).catch(() => null);
  if (cached) return cached.map(JSON.parse);

  // Cache miss or Redis down → database query
  const results = await db.query(/* direct PostgreSQL query */);

  // Try to cache for next time (fire-and-forget)
  redis.zadd(cacheKey, ...results).catch(() => {});

  return results;
}
```

**Eviction Policy**:
- Use Redis `maxmemory-policy allkeys-lru`
- Set `maxmemory 512mb` for suggestion cache
- LRU ensures frequently accessed suggestions stay cached

**Performance**:
- Cache hit: <5ms (Redis in-memory lookup)
- Cache miss: <200ms (PostgreSQL query + cache write)
- Fallback mode (Redis down): 300-500ms acceptable

**Alternatives Considered**:
- ❌ **In-memory Node.js cache**: Rejected (doesn't scale across instances)
- ❌ **Longer TTL (30 min)**: Rejected (stale results when entities updated)
- ❌ **Application-level LRU cache**: Rejected (Redis provides better eviction algorithms)

---

## 3. Vector Embeddings for Semantic Search

### Decision: Use existing vector.service with pgvector, OpenAI text-embedding-3-small model (locally hosted via AnythingLLM)

**Rationale**:
- Project already has `vector.service.ts` for embeddings (reuse existing infrastructure)
- pgvector extension provides efficient L2/cosine similarity search
- 0.6 similarity threshold filters low-quality matches

**Implementation Pattern**:
```sql
-- Add vector column to searchable entities
ALTER TABLE positions ADD COLUMN embedding vector(1536);
ALTER TABLE documents ADD COLUMN embedding vector(1536);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_positions_embedding ON positions
  USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64);
```

**Embedding Generation**:
- Generate embeddings on entity create/update via background job
- Concatenate title + description + key fields (max 8000 tokens)
- Bilingual approach: Embed both English and Arabic text together for cross-language matching

**Search Query**:
```typescript
// Generate query embedding
const queryEmbedding = await vectorService.generateEmbedding(searchQuery);

// Find similar entities
const results = await db.query(`
  SELECT *,
    1 - (embedding <=> $1) as similarity
  FROM positions
  WHERE 1 - (embedding <=> $1) > 0.6  -- 60% threshold
  ORDER BY embedding <=> $1
  LIMIT 20
`, [queryEmbedding]);
```

**Hybrid Search Strategy**:
1. Execute keyword search (tsvector) first
2. Execute semantic search (vector) in parallel
3. Merge results: exact matches first, then semantic matches in "Related" section
4. De-duplicate by entity ID

**Performance**:
- Embedding generation: 100-300ms per entity (async, not blocking)
- Vector search: <100ms for k-NN lookup with HNSW index
- Combined hybrid search: <500ms p95

**Alternatives Considered**:
- ❌ **Pinecone/Weaviate**: Rejected (external services, Data Sovereignty violation)
- ❌ **Local FAISS**: Rejected (requires separate service, pgvector simpler)
- ❌ **Higher similarity threshold (0.8)**: Rejected (too strict, misses relevant results)

---

## 4. Boolean Operator Parsing

### Decision: Custom parser with tsquery conversion for PostgreSQL compatibility

**Rationale**:
- PostgreSQL tsvector supports native boolean operations via tsquery
- Custom parser allows user-friendly syntax: `climate AND (policy OR treaty)`
- Prevents SQL injection by parameterizing converted tsquery

**Implementation Pattern**:
```typescript
function parseQueryToTsquery(userQuery: string, language: 'en' | 'ar'): string {
  // Tokenize and sanitize
  const tokens = userQuery
    .replace(/[^\w\s"'AND|OR|NOT|(|)]/g, '') // Remove unsafe characters
    .match(/(".*?"|'.*?'|\S+)/g) || [];

  // Convert to tsquery syntax
  const tsquery = tokens.map(token => {
    if (token === 'AND') return '&';
    if (token === 'OR') return '|';
    if (token === 'NOT') return '!';
    if (token.startsWith('"') || token.startsWith("'")) {
      // Quoted phrase → phraseto_tsquery
      return `phraseto_tsquery('${language}', ${token})`;
    }
    // Regular word → plainto_tsquery
    return `plainto_tsquery('${language}', '${token}')`;
  }).join(' ');

  return tsquery;
}

// Usage in query
const tsquery = parseQueryToTsquery('climate AND "sustainable development"', 'en');
const results = await db.query(`
  SELECT * FROM dossiers
  WHERE search_vector @@ to_tsquery('english', $1)
`, [tsquery]);
```

**Security Measures**:
- Whitelist allowed operators: AND, OR, NOT, quoted phrases
- Remove all special characters except quotes, parentheses, operators
- Use parameterized queries (never string concatenation)
- Limit query length to 500 characters

**User Experience**:
- If user doesn't use operators, treat as implicit OR (plainto_tsquery handles this)
- Show syntax help on parse error: "Use AND, OR, NOT for advanced search"
- Fallback to simple search if parsing fails

**Alternatives Considered**:
- ❌ **Full Lucene syntax**: Rejected (too complex for GASTAT users)
- ❌ **No boolean operators**: Rejected (spec explicitly requires it)
- ❌ **Third-party query parser**: Rejected (security risk, dependency overhead)

---

## 5. Real-Time Index Updates

### Decision: PostgreSQL triggers + background queue for vector updates

**Rationale**:
- tsvector GENERATED column updates automatically on row changes (zero delay)
- Vector embeddings updated asynchronously (acceptable 1-2 minute delay for semantic search)
- Prevents blocking user writes with embedding generation

**Implementation Pattern**:
```sql
-- tsvector auto-updates (already shown above with GENERATED ALWAYS AS)

-- Trigger for vector embedding queue
CREATE OR REPLACE FUNCTION queue_embedding_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO embedding_update_queue (entity_type, entity_id)
  VALUES (TG_TABLE_NAME, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_positions_embedding_update
AFTER INSERT OR UPDATE OF title_en, title_ar, description_en, description_ar
ON positions
FOR EACH ROW
EXECUTE FUNCTION queue_embedding_update();
```

**Background Worker**:
```typescript
// Queue processor (runs every 30 seconds)
async function processEmbeddingQueue() {
  const batch = await db.query(`
    SELECT * FROM embedding_update_queue
    ORDER BY created_at ASC
    LIMIT 100
  `);

  for (const item of batch.rows) {
    const entity = await fetchEntity(item.entity_type, item.entity_id);
    const embedding = await vectorService.generateEmbedding(
      `${entity.title_en} ${entity.title_ar} ${entity.description_en} ${entity.description_ar}`
    );

    await db.query(`
      UPDATE ${item.entity_type}
      SET embedding = $1
      WHERE id = $2
    `, [embedding, item.entity_id]);

    await db.query(`DELETE FROM embedding_update_queue WHERE id = $1`, [item.id]);
  }
}
```

**Performance Trade-offs**:
- Keyword search: Real-time (0ms delay)
- Semantic search: 1-2 minute delay acceptable (spec doesn't require real-time for vectors)
- Batch processing prevents embedding service overload

**Alternatives Considered**:
- ❌ **Synchronous embedding generation**: Rejected (blocks writes, 100-300ms per entity)
- ❌ **Debounced updates**: Rejected (complexity, potential data loss on crashes)
- ❌ **Change Data Capture**: Rejected (overkill for this use case)

---

## 6. Result Ranking Algorithm

### Decision: Multi-factor scoring with exact match priority

**Rationale**:
- Spec requires exact matches before semantic matches
- Combine multiple signals for relevance: text match quality, recency, entity type

**Ranking Formula**:
```typescript
// Exact match score (0-100)
const exactScore = (
  tsRankCd * 40 +           // PostgreSQL ts_rank_cd (cover density)
  titleMatchBoost * 30 +    // Title match = 30 points
  exactPhraseBoost * 20 +   // Exact phrase = 20 points
  recencyBoost * 10         // Recent entities = up to 10 points
);

// Semantic match score (0-100)
const semanticScore = (
  vectorSimilarity * 60 +   // Vector similarity (0.6-1.0 → 36-60 points)
  recencyBoost * 10 +       // Recent entities = up to 10 points
  entityTypeBoost * 30      // Preferred entity types = up to 30 points
);

// Final ranking: Exact matches always score > 100, semantic matches < 100
const finalScore = isExactMatch ? 100 + exactScore : semanticScore;
```

**Recency Boost**:
```typescript
const daysSinceUpdate = (Date.now() - entity.updated_at) / (1000 * 60 * 60 * 24);
const recencyBoost = Math.max(0, 10 - Math.log10(daysSinceUpdate + 1));
```

**Entity Type Preferences**:
- User's recent activity: Boost entity types they've viewed recently
- Global preferences: Dossiers = +5, Positions = +3, Documents = +0

**Presentation**:
- Sort by `finalScore DESC`
- Section 1: Exact matches (score >= 100)
- Section 2: Related (semantic matches, score < 100)

**Alternatives Considered**:
- ❌ **Pure tf-idf**: Rejected (doesn't consider recency or entity type)
- ❌ **Machine learning ranking**: Rejected (insufficient training data, complexity)
- ❌ **Equal weight exact/semantic**: Rejected (spec requires exact match priority)

---

## 7. Performance Optimization Strategies

### Decision: Multi-layered caching + query optimization + monitoring

**Strategies Implemented**:

**1. Database Query Optimization**:
```sql
-- Partition large tables by year for faster queries
CREATE TABLE dossiers_2024 PARTITION OF dossiers FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE dossiers_2025 PARTITION OF dossiers FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Covering indexes to avoid table lookups
CREATE INDEX idx_dossiers_search_covering ON dossiers (id, title_en, title_ar, updated_at)
WHERE status = 'active';

-- Analyze and vacuum regularly
ANALYZE dossiers;
```

**2. Connection Pooling**:
```typescript
// Supabase client with connection pool
const supabase = createClient(url, key, {
  db: {
    pool: {
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000
    }
  }
});
```

**3. Query Result Caching**:
- Cache full search results for 1 minute (popular queries)
- Cache count queries for 5 minutes (tab counts)
- Cache user's recent searches for autocomplete

**4. Lazy Loading & Pagination**:
- Initial load: 10 results per entity type
- Load more on scroll or tab click
- Prefetch next page in background

**5. Debouncing & Request Cancellation**:
```typescript
// Debounce typeahead suggestions (200ms)
const debouncedSearch = debounce(async (query: string) => {
  const controller = new AbortController();
  currentRequest.current?.abort(); // Cancel previous request
  currentRequest.current = controller;

  const results = await fetch('/api/search/suggest', {
    signal: controller.signal,
    body: JSON.stringify({ query })
  });
}, 200);
```

**6. Monitoring & Alerting**:
- Track p50, p95, p99 latencies for suggestions and results
- Alert if p95 > 200ms for suggestions or > 500ms for results
- Monitor Redis cache hit rate (target: >80%)

**Performance Targets**:
- ✓ Suggestions: <200ms absolute (cache hit <5ms, cache miss <200ms)
- ✓ Results: <500ms p95 (typical <300ms)
- ✓ Concurrent users: 50-100 without degradation
- ✓ Dataset: 10k-50k entities

**Alternatives Considered**:
- ❌ **CDN caching**: Rejected (search results too user-specific)
- ❌ **Materialized views**: Rejected (adds complexity, triggers handle updates)
- ❌ **Denormalization**: Rejected (increases storage, harder to maintain)

---

## 8. Bilingual Search Challenges & Solutions

### Challenge: Different tokenization and stemming rules for Arabic vs English

**Solution**: Use language-specific text search configurations
- English: Built-in `'english'` config with Porter stemmer
- Arabic: Custom `'arabic'` config with Arabic stemmer
- Store both in same tsvector column with language labels

### Challenge: Right-to-left (RTL) vs left-to-right (LTR) result rendering

**Solution**: Use CSS logical properties and dir="auto"
```css
.search-result {
  text-align: start; /* Not left */
  margin-inline-start: 1rem; /* Not margin-left */
}
```

### Challenge: Code-switching (mixing Arabic and English in same query)

**Solution**: Split query by language, search both
```typescript
const arabicTokens = query.match(/[\u0600-\u06FF\s]+/g) || [];
const englishTokens = query.replace(/[\u0600-\u06FF\s]+/g, '').trim();

// Search both languages, merge results
const arabicResults = await searchInLanguage(arabicTokens, 'ar');
const englishResults = await searchInLanguage(englishTokens, 'en');
```

### Challenge: Arabic diacritics and letter variations

**Solution**: Normalize before indexing and searching
```typescript
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, '') // Remove diacritics
    .replace(/أ|إ|آ/g, 'ا')           // Normalize alef variants
    .replace(/ة/g, 'ه')              // Normalize taa marbuta
    .replace(/ى/g, 'ي');              // Normalize alef maksura
}
```

---

## 9. "People Also Looked For" Co-Click Suggestions

### Decision: Deferred to implementation phase (low priority)

**Recommended Approach** (when implemented):
- Track search query → clicked result pairs in `search_click_events` table
- Build co-occurrence matrix: query A → query B (users who searched A also searched B)
- Use collaborative filtering algorithm (item-item similarity)
- Cache top 5 related queries per search term
- Privacy: Aggregate data only (no user-level tracking), anonymize after 90 days

**Privacy Considerations**:
- Store only aggregate counts, not user IDs
- Minimum threshold: Show suggestion only if ≥10 users clicked same pattern
- GDPR compliance: Right to erasure applies to aggregates (rebuild matrix)

**Implementation Deferred Because**:
- FR-012 marked as low priority in spec
- Requires significant click data before useful (cold start problem)
- Core search functionality more critical for MVP

---

## 10. Edge Cases & Error Handling

### Edge Case: User has no permission to view search results

**Solution**: Count-only display
```typescript
const restrictedCount = await db.query(`
  SELECT COUNT(*) FROM dossiers
  WHERE search_vector @@ to_tsquery($1)
  AND NOT rls_check_read_permission(user_id, id)
`, [tsquery]);

if (restrictedCount > 0) {
  results.metadata.restrictedResultsMessage =
    `${restrictedCount} additional result(s) require higher permissions`;
}
```

### Edge Case: No results found

**Solution**: Typo suggestions + search tips
```typescript
if (results.length === 0) {
  // Fuzzy match for typo suggestions
  const suggestions = await db.query(`
    SELECT DISTINCT title_en, similarity(title_en, $1) as score
    FROM dossiers
    WHERE similarity(title_en, $1) > 0.3
    ORDER BY score DESC
    LIMIT 3
  `, [query]);

  return {
    results: [],
    suggestions: suggestions.rows.map(s => s.title_en),
    tips: [
      'Try different keywords',
      'Use OR to expand your search',
      'Check spelling and try again'
    ]
  };
}
```

### Edge Case: Very long query (>500 characters)

**Solution**: Truncate and extract key terms
```typescript
if (query.length > 500) {
  query = query.substring(0, 500);

  // Extract key terms using TF-IDF or just most frequent words
  const terms = extractKeyTerms(query, { maxTerms: 10 });

  return {
    warning: 'Query truncated to 500 characters. Key terms extracted.',
    processedQuery: terms.join(' ')
  };
}
```

### Edge Case: Redis cache unavailable

**Solution**: Graceful degradation
```typescript
async function getSuggestions(query: string) {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    logger.warn('Redis unavailable, falling back to database', error);
    // Continue to database query
  }

  const results = await db.query(/* direct query */);
  return results;
}
```

### Edge Case: Simultaneous updates to same entity

**Solution**: Optimistic locking with version field
```sql
UPDATE dossiers
SET title_en = $1, version = version + 1, updated_at = NOW()
WHERE id = $2 AND version = $3; -- Version check prevents lost updates
```

---

## Summary of Key Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Full-text search** | pg_tsvector + pg_trgm | Language-aware + fuzzy matching |
| **Caching** | Redis prefix cache, 5-min TTL | Meets 200ms target for popular queries |
| **Semantic search** | pgvector + existing vector.service | Reuse infrastructure, 0.6 threshold |
| **Boolean operators** | Custom parser → tsquery | PostgreSQL-native, secure |
| **Real-time updates** | Triggers + background queue | Zero delay for keywords, 1-2 min for vectors |
| **Ranking** | Multi-factor scoring | Exact match priority per spec |
| **Performance** | Multi-layer optimization | Indexing + pooling + caching |
| **Bilingual** | Dual text configs + normalization | Handles Arabic/English equally |
| **Co-click suggestions** | Deferred to post-MVP | Insufficient data for MVP |

---

## Compliance Check

✅ **Bilingual Excellence**: Separate text search configs, normalization, RTL/LTR support
✅ **Type Safety**: TypeScript interfaces for all search types
✅ **Security-First**: Parameterized queries, input sanitization, RLS enforcement
✅ **Data Sovereignty**: PostgreSQL (Supabase), Redis (containerized), no external services
✅ **Resilient Architecture**: Redis fallback, error boundaries, timeout controls
✅ **Accessibility**: Keyboard navigation, ARIA labels (to be verified in Phase 1)
✅ **Container-First**: Redis containerized, PostgreSQL via Supabase

---

**Research Complete**: All technical unknowns resolved. Ready for Phase 1 (Design & Contracts).
