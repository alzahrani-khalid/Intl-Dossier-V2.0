# Search & Retrieval API Documentation

**Version**: 1.0.0
**Base URL**: `/api/v1` (Supabase Edge Functions)
**Authentication**: Required (Bearer token)
**Last Updated**: 2025-10-04

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
   - [GET /search](#get-search)
   - [GET /search/suggest](#get-searchsuggest)
   - [POST /search/semantic](#post-searchsemantic)
6. [Performance Targets](#performance-targets)
7. [OpenAPI Specifications](#openapi-specifications)

---

## Overview

The Search & Retrieval API provides global, bilingual search capabilities across the GASTAT International Dossier System. It supports:

- **Full-text search** across 6 entity types (dossiers, people, engagements, positions, MoUs, documents)
- **Typeahead suggestions** with <200ms performance target
- **Semantic search** using vector embeddings (positions, documents, briefs)
- **Boolean operators** (AND, OR, NOT) with quoted phrase support
- **Bilingual support** (Arabic and English with RTL/LTR)

**Key Features**:
- Redis caching for optimal performance
- Row Level Security (RLS) enforcement
- Graceful degradation when services unavailable
- Bilingual error messages

---

## Authentication

All search endpoints require authentication via Supabase JWT token.

### Request Header

```http
Authorization: Bearer <SUPABASE_JWT_TOKEN>
```

### Obtaining a Token

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Use data.session.access_token for API requests
```

### Unauthorized Response

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Authentication required",
    "message_ar": "المصادقة مطلوبة"
  }
}
```

**HTTP Status**: 401

---

## Rate Limiting

To ensure fair usage and system stability, the following rate limits apply:

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /search | 60 requests | per minute per user |
| GET /search/suggest | 120 requests | per minute per user |
| POST /search/semantic | 30 requests | per minute per user |

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Please try again in 45 seconds.",
    "message_ar": "عدد كبير جداً من الطلبات. يرجى المحاولة مرة أخرى بعد 45 ثانية.",
    "retry_after": 45
  }
}
```

**HTTP Status**: 429
**Headers**: `Retry-After: 45`

---

## Error Handling

All errors follow a consistent bilingual format:

```json
{
  "error": {
    "code": "error_code",
    "message": "English error message",
    "message_ar": "Arabic error message",
    "details": { /* optional additional context */ }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `bad_request` | 400 | Invalid request parameters |
| `unauthorized` | 401 | Authentication required or invalid |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `rate_limit_exceeded` | 429 | Too many requests |
| `internal_server_error` | 500 | Server error (fallback mechanism activated) |
| `service_unavailable` | 503 | Service temporarily unavailable |

---

## Endpoints

### GET /search

Performs full-text search across all entity types with support for Boolean operators, entity type filtering, and bilingual matching.

**URL**: `/api/v1/search`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query (max 500 characters) |
| `type` | string | No | all | Comma-separated entity types: `dossiers`, `people`, `engagements`, `positions`, `documents`, `all` |
| `lang` | string | No | auto | Language: `en`, `ar`, `auto` (auto-detect) |
| `limit` | integer | No | 20 | Results per entity type (1-100) |
| `offset` | integer | No | 0 | Pagination offset |
| `include_archived` | boolean | No | false | Include archived entities in results |

#### Request Example

```bash
curl -X GET "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/search?q=climate%20AND%20policy&type=dossiers,positions&limit=10" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

#### Response Schema

```json
{
  "results": [
    {
      "id": "uuid",
      "type": "dossier | person | engagement | position | document",
      "title": "English title",
      "title_ar": "Arabic title",
      "snippet": "Text snippet with <mark>highlighted</mark> terms",
      "snippet_ar": "Arabic snippet with <mark>highlighted</mark> terms",
      "rank_score": 95.5,
      "match_type": "exact | semantic",
      "updated_at": "2025-10-04T12:00:00Z",
      "is_archived": false,
      "metadata": {
        "entity_specific_fields": "..."
      }
    }
  ],
  "counts": {
    "total": 42,
    "dossiers": 15,
    "people": 8,
    "engagements": 5,
    "positions": 10,
    "documents": 4,
    "restricted": 3
  },
  "query": {
    "original": "climate AND policy",
    "normalized": "climate and policy",
    "language_detected": "en",
    "has_boolean_operators": true,
    "filters_applied": {
      "entity_types": ["dossiers", "positions"],
      "include_archived": false
    }
  },
  "took_ms": 287,
  "metadata": {
    "restricted_message": "3 additional results require higher permissions",
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 42,
      "has_more": true
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid query:
```json
{
  "error": {
    "code": "bad_request",
    "message": "Query parameter 'q' is required",
    "message_ar": "معامل الاستعلام 'q' مطلوب"
  }
}
```

**400 Bad Request** - Query too long:
```json
{
  "error": {
    "code": "bad_request",
    "message": "Query exceeds maximum length of 500 characters",
    "message_ar": "يتجاوز الاستعلام الحد الأقصى البالغ 500 حرف"
  }
}
```

#### Performance

- **Target**: <500ms p95
- **Typical**: 200-300ms
- **Cache Hit**: <50ms (when results cached)

---

### GET /search/suggest

Provides typeahead suggestions for search input with ultra-fast performance (<200ms absolute).

**URL**: `/api/v1/search/suggest`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search prefix (min 1, max 100 characters) |
| `type` | string | No | all | Entity type filter (same as /search) |
| `lang` | string | No | auto | Language preference |
| `limit` | integer | No | 10 | Number of suggestions (1-20) |

#### Request Example

```bash
curl -X GET "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/search/suggest?q=clim&limit=5" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

#### Response Schema

```json
{
  "suggestions": [
    {
      "id": "uuid",
      "type": "dossier | person | engagement | position | document",
      "title": "Climate Action Partnership",
      "title_ar": "شراكة العمل المناخي",
      "preview": "Brief description or context",
      "score": 0.95,
      "match_type": "prefix | fuzzy"
    }
  ],
  "query": {
    "original": "clim",
    "normalized": "clim",
    "language_detected": "en"
  },
  "took_ms": 45,
  "cache_hit": true
}
```

#### Response Headers

| Header | Description |
|--------|-------------|
| `X-Cache-Hit` | `true` if served from Redis cache, `false` otherwise |
| `X-Response-Time-Ms` | Server processing time in milliseconds |

#### Error Responses

**400 Bad Request** - Empty prefix:
```json
{
  "error": {
    "code": "bad_request",
    "message": "Query prefix cannot be empty",
    "message_ar": "لا يمكن أن يكون بادئة الاستعلام فارغة"
  }
}
```

**400 Bad Request** - Prefix too long:
```json
{
  "error": {
    "code": "bad_request",
    "message": "Query prefix exceeds maximum length of 100 characters",
    "message_ar": "يتجاوز بادئة الاستعلام الحد الأقصى البالغ 100 حرفًا"
  }
}
```

#### Performance

- **Target**: <200ms absolute (p100)
- **Cache Hit**: <10ms
- **Cache Miss**: <200ms (database query)
- **Fallback Mode** (Redis down): 300-500ms

---

### POST /search/semantic

Performs semantic search using vector embeddings to find conceptually similar content, even without keyword matches.

**URL**: `/api/v1/search/semantic`

#### Request Body

```json
{
  "query": "sustainable development goals",
  "entity_types": ["positions", "documents", "briefs"],
  "similarity_threshold": 0.6,
  "limit": 20,
  "include_keyword_results": true
}
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | Yes | - | Semantic search query (3-500 characters) |
| `entity_types` | array | No | ["positions", "documents", "briefs"] | Entity types supporting semantic search |
| `similarity_threshold` | number | No | 0.6 | Minimum similarity (0.0-1.0) |
| `limit` | integer | No | 20 | Maximum results (1-100) |
| `include_keyword_results` | boolean | No | false | Include exact keyword matches as "exact_matches" |

#### Request Example

```bash
curl -X POST "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/search/semantic" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "climate change mitigation strategies",
    "entity_types": ["positions", "documents"],
    "similarity_threshold": 0.7,
    "limit": 10,
    "include_keyword_results": true
  }'
```

#### Response Schema

```json
{
  "results": [
    {
      "id": "uuid",
      "type": "position | document | brief",
      "title": "Environmental Policy Framework",
      "title_ar": "إطار السياسة البيئية",
      "snippet": "Relevant text excerpt",
      "similarity_score": 0.85,
      "match_type": "semantic",
      "updated_at": "2025-10-04T12:00:00Z",
      "metadata": { }
    }
  ],
  "exact_matches": [
    {
      "id": "uuid",
      "type": "position",
      "title": "Climate Change Mitigation Strategy",
      "rank_score": 98.5,
      "match_type": "exact"
    }
  ],
  "query": {
    "original": "climate change mitigation strategies",
    "normalized": "climate change mitigation strategies",
    "embedding_dimensions": 1536,
    "similarity_threshold": 0.7
  },
  "performance": {
    "embedding_generation_ms": 125,
    "vector_search_ms": 87,
    "keyword_search_ms": 42,
    "merge_dedup_ms": 15,
    "total_ms": 269
  },
  "took_ms": 269
}
```

#### Error Responses

**400 Bad Request** - Invalid entity type:
```json
{
  "error": {
    "code": "bad_request",
    "message": "Entity type 'dossiers' does not support semantic search. Supported types: positions, documents, briefs",
    "message_ar": "نوع الكيان 'dossiers' لا يدعم البحث الدلالي. الأنواع المدعومة: positions، documents، briefs"
  }
}
```

**400 Bad Request** - Invalid similarity threshold:
```json
{
  "error": {
    "code": "bad_request",
    "message": "Similarity threshold must be between 0.0 and 1.0",
    "message_ar": "يجب أن يكون عتبة التشابه بين 0.0 و 1.0"
  }
}
```

#### Performance

- **Target**: <500ms p95
- **Typical**: 250-350ms
- **Embedding Generation**: 100-300ms (via AnythingLLM)
- **Vector Search**: <100ms (pgvector with HNSW index)

---

## Performance Targets

| Metric | Target | Typical | Notes |
|--------|--------|---------|-------|
| Suggestions p100 | <200ms | 50-150ms | Absolute requirement (cache miss) |
| Suggestions (cache hit) | <10ms | 5-10ms | Redis cache |
| Search results p95 | <500ms | 200-300ms | Full-text search |
| Semantic search p95 | <500ms | 250-350ms | Including embedding generation |
| Concurrent users | 50-100 | - | No degradation |
| Dataset size | 10k-50k | - | Entities indexed |

### Performance Headers

All responses include performance headers:

```http
X-Response-Time-Ms: 287
X-Cache-Hit: true
X-Query-Complexity: medium
```

---

## OpenAPI Specifications

Detailed OpenAPI 3.0 specifications are available in:

- `/specs/015-search-retrieval-spec/contracts/search-api.yaml`
- `/specs/015-search-retrieval-spec/contracts/suggest-api.yaml`
- `/specs/015-search-retrieval-spec/contracts/semantic-search-api.yaml`

These specifications include:
- Complete request/response schemas
- Validation rules
- Example requests/responses
- Error codes and descriptions

---

## Usage Examples

### Example 1: Simple Keyword Search

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Search for "climate policy"
const { data, error } = await supabase.functions.invoke('search', {
  body: { q: 'climate policy', limit: 10 }
});

if (error) {
  console.error('Search failed:', error);
} else {
  console.log(`Found ${data.counts.total} results in ${data.took_ms}ms`);
  data.results.forEach(result => {
    console.log(`- ${result.title} (${result.type})`);
  });
}
```

### Example 2: Typeahead Suggestions

```typescript
// Debounced suggestion fetching
import { debounce } from 'lodash';

const fetchSuggestions = debounce(async (prefix: string) => {
  const { data } = await supabase.functions.invoke('search-suggest', {
    body: { q: prefix, limit: 5 }
  });

  console.log(`Suggestions took ${data.took_ms}ms (cache hit: ${data.cache_hit})`);
  return data.suggestions;
}, 200);

// Usage in React
const [suggestions, setSuggestions] = useState([]);

useEffect(() => {
  if (searchInput.length > 0) {
    fetchSuggestions(searchInput).then(setSuggestions);
  }
}, [searchInput]);
```

### Example 3: Semantic Search with Hybrid Results

```typescript
// Find conceptually similar positions
const { data } = await supabase.functions.invoke('search-semantic', {
  body: {
    query: 'sustainable development goals',
    entity_types: ['positions'],
    similarity_threshold: 0.7,
    include_keyword_results: true
  }
});

// Exact matches (keyword) appear first
if (data.exact_matches.length > 0) {
  console.log('Exact Matches:');
  data.exact_matches.forEach(match => {
    console.log(`- ${match.title} (score: ${match.rank_score})`);
  });
}

// Semantic matches appear in "Related" section
console.log('\\nRelated:');
data.results.forEach(result => {
  console.log(`- ${result.title} (similarity: ${result.similarity_score.toFixed(2)})`);
});
```

### Example 4: Boolean Operators

```typescript
// Complex query with AND, OR, NOT
const { data } = await supabase.functions.invoke('search', {
  body: {
    q: 'climate AND (policy OR treaty) NOT agriculture',
    type: 'dossiers,positions'
  }
});

console.log(`Boolean query parsed: ${data.query.has_boolean_operators}`);
console.log(`Found ${data.counts.total} matching entities`);
```

### Example 5: Bilingual Search

```typescript
// Search in Arabic
const { data: arabicResults } = await supabase.functions.invoke('search', {
  body: { q: 'سياسة المناخ', lang: 'ar' }
});

console.log(`Language detected: ${arabicResults.query.language_detected}`);
console.log(`Arabic results with English cross-matches: ${arabicResults.counts.total}`);

// Results include both Arabic-titled and English-titled entities
arabicResults.results.forEach(result => {
  console.log(`- ${result.title_ar || result.title}`);
  console.log(`  ${result.snippet_ar}`);
});
```

---

## Best Practices

### 1. Debounce Typeahead Requests

Always debounce suggestion requests to avoid overwhelming the server:

```typescript
const debouncedFetch = debounce(fetchSuggestions, 200);
```

### 2. Cancel Pending Requests

Use AbortController to cancel previous requests when new input arrives:

```typescript
const controller = new AbortController();
fetch('/api/search', { signal: controller.signal });

// On new input
controller.abort();
```

### 3. Implement Error Boundaries

Wrap search UI in error boundaries to prevent full app crashes:

```typescript
<SearchErrorBoundary>
  <GlobalSearch />
</SearchErrorBoundary>
```

### 4. Cache Aggressively on Client

Use TanStack Query for client-side caching:

```typescript
const { data } = useQuery({
  queryKey: ['search', query],
  queryFn: () => searchAPI(query),
  staleTime: 60000, // 1 minute
  cacheTime: 300000 // 5 minutes
});
```

### 5. Show Progressive Loading States

Display loading indicators for better UX:

```typescript
{isLoading && <Spinner />}
{data && <Results results={data.results} />}
{error && <ErrorMessage error={error} />}
```

---

## Troubleshooting

### Slow Suggestions (>200ms)

**Symptoms**: Suggestions taking longer than 200ms
**Diagnosis**:
- Check `X-Cache-Hit` header (should be `true` for popular queries)
- Verify Redis is running: `redis-cli ping`
- Check cache hit rate: `redis-cli INFO stats | grep keyspace_hits`

**Solutions**:
- Warm cache with common prefixes (background job)
- Increase Redis memory limit
- Review PostgreSQL trigram indexes

### No Semantic Results

**Symptoms**: Semantic search returns empty results
**Diagnosis**:
- Check if embeddings exist: `SELECT COUNT(*) FROM positions WHERE embedding IS NOT NULL;`
- Verify AnythingLLM is running: `curl http://localhost:3001/api/health`
- Check `embedding_update_queue` for errors

**Solutions**:
- Run embedding queue processor
- Lower similarity threshold (try 0.5 instead of 0.6)
- Verify AnythingLLM API key and endpoint

### Restricted Results Not Showing

**Symptoms**: Search returns restricted results user shouldn't see
**Diagnosis**:
- Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'dossiers';`
- Check user permissions in `staff_profiles`
- Inspect JWT claims in auth token

**Solutions**:
- Update RLS policies
- Verify user role assignments
- Check Supabase Auth configuration

---

## Support

For issues or questions:

1. Check quickstart guide: `/specs/015-search-retrieval-spec/quickstart.md`
2. Review integration tests: `/backend/tests/integration/search-*.test.ts`
3. Consult data model: `/specs/015-search-retrieval-spec/data-model.md`

---

**Last Updated**: 2025-10-04
**Maintained By**: GASTAT Development Team
**Version**: 1.0.0
