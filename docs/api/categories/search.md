# Search & Discovery API

## Overview

The Search & Discovery API provides global, bilingual search capabilities across the GASTAT International Dossier System. It supports full-text search, semantic search, typeahead suggestions, and saved search patterns across all entity types.

**Key Features:**
- **Full-text search** across 6+ entity types (dossiers, people, engagements, positions, documents, commitments)
- **Semantic search** using vector embeddings (BGE-M3 model)
- **Typeahead suggestions** with <200ms performance target
- **Advanced search** with Boolean operators (AND, OR, NOT) and complex filters
- **Quick switcher** for rapid entity navigation
- **Saved searches** for frequently used queries
- **Bilingual support** (Arabic and English with RTL/LTR)

## Endpoints

### Global Search

Performs full-text search across all entity types with support for filtering, sorting, and pagination.

**Endpoint:** `GET /search?q={query}&type={type}&limit={limit}&offset={offset}`

**Query Parameters:**
- `q` (required): Search query (max 500 characters)
- `type` (optional): Comma-separated entity types: `dossiers`, `people`, `engagements`, `positions`, `documents`, `commitments`, `all` (default: all)
- `lang` (optional): Language preference: `en`, `ar`, `auto` (default: auto)
- `limit` (optional): Results per entity type (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `include_archived` (optional): Include archived entities (default: false)

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "dossier-123",
      "type": "dossier",
      "title": "Kingdom of Saudi Arabia",
      "title_ar": "المملكة العربية السعودية",
      "snippet": "Leading member of G20 with strong <mark>climate</mark> initiatives...",
      "snippet_ar": "عضو قيادي في مجموعة العشرين مع مبادرات قوية في <mark>المناخ</mark>...",
      "rank_score": 95.5,
      "match_type": "exact",
      "updated_at": "2024-01-20T10:30:00Z",
      "is_archived": false,
      "metadata": {
        "dossier_type": "country",
        "region": "Middle East"
      }
    },
    {
      "id": "pos-456",
      "type": "position",
      "title": "Climate Change Framework Position",
      "title_ar": "موقف إطار تغير المناخ",
      "snippet": "Comprehensive approach to <mark>climate</mark> policy...",
      "rank_score": 87.3,
      "match_type": "semantic",
      "updated_at": "2024-01-18T14:00:00Z",
      "metadata": {
        "status": "published",
        "thematic_category": "environment"
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
    "commitments": 0,
    "restricted": 3
  },
  "query": {
    "original": "climate",
    "normalized": "climate",
    "language": "en",
    "took_ms": 45
  },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid query parameter (empty, too long)
- `401 Unauthorized` - Missing or invalid authorization header
- `429 Too Many Requests` - Rate limit exceeded (60 requests/minute)
- `500 Internal Server Error` - Search service unavailable

**Implementation Example:**
```typescript
const globalSearch = async (query: string, types?: string[], limit = 20) => {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString()
  });

  if (types && types.length > 0) {
    params.append('type', types.join(','));
  }

  const response = await fetch(`/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- Search results respect Row Level Security (RLS) policies
- Restricted items are counted but not shown in results
- Query is normalized (lowercase, trimmed) before processing
- Results are ranked by relevance score (0-100)

---

### Search Suggestions

Real-time typeahead suggestions for search queries.

**Endpoint:** `GET /search-suggest?q={query}&limit={limit}`

**Query Parameters:**
- `q` (required): Partial search query (min 2 characters)
- `limit` (optional): Maximum suggestions (1-10, default: 5)
- `lang` (optional): Language preference: `en`, `ar`, `auto` (default: auto)

**Response (200 OK):**
```json
{
  "suggestions": [
    {
      "text": "Climate Change Framework",
      "text_ar": "إطار تغير المناخ",
      "type": "position",
      "entity_id": "pos-123",
      "rank": 1,
      "match_type": "prefix"
    },
    {
      "text": "Climate Policy Brief",
      "text_ar": "موجز سياسة المناخ",
      "type": "document",
      "entity_id": "doc-456",
      "rank": 2,
      "match_type": "fuzzy"
    }
  ],
  "query": {
    "original": "cli",
    "normalized": "cli",
    "took_ms": 15
  }
}
```

**Error Responses:**
- `400 Bad Request` - Query too short (<2 characters)
- `401 Unauthorized` - Missing authorization header
- `429 Too Many Requests` - Rate limit exceeded (120 requests/minute)

**Implementation Example:**
```typescript
const searchSuggestions = async (query: string, limit = 5) => {
  if (query.length < 2) return { suggestions: [] };

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString()
  });

  const response = await fetch(`/search-suggest?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// Debounced usage in React
const useDebouncedSearch = (query: string, delay = 300) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchSuggestions(query).then(setSuggestions);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query]);

  return suggestions;
};
```

**Performance:**
- Target response time: <200ms
- Redis caching for popular queries
- Graceful degradation if cache unavailable

---

### Semantic Search

Vector-based semantic search using embeddings for concept matching.

**Endpoint:** `POST /search-semantic`

**Request Body:**
```json
{
  "query": "international cooperation on environmental sustainability",
  "entity_types": ["positions", "documents", "briefs"],
  "similarity_threshold": 0.75,
  "limit": 10,
  "include_embeddings": false
}
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "pos-123",
      "type": "position",
      "title": "Climate Change Cooperation Framework",
      "title_ar": "إطار التعاون في مجال تغير المناخ",
      "content_preview": "Framework for multilateral cooperation...",
      "similarity_score": 0.89,
      "rank": 1,
      "metadata": {
        "status": "published",
        "thematic_category": "environment"
      }
    },
    {
      "id": "doc-456",
      "type": "document",
      "title": "Sustainable Development Goals Report",
      "similarity_score": 0.82,
      "rank": 2
    }
  ],
  "query": {
    "original": "international cooperation on environmental sustainability",
    "embedding_model": "bge-m3",
    "embedding_dimensions": 1536,
    "took_ms": 250
  },
  "total": 2
}
```

**Error Responses:**
- `400 Bad Request` - Missing query or invalid parameters
- `401 Unauthorized` - Missing authorization header
- `429 Too Many Requests` - Rate limit exceeded (30 requests/minute)
- `500 Internal Server Error` - Embedding service unavailable
- `503 Service Unavailable` - Vector database temporarily unavailable

**Implementation Example:**
```typescript
const semanticSearch = async (
  query: string,
  entityTypes: string[] = ['positions', 'documents'],
  threshold = 0.75
) => {
  const response = await fetch('/search-semantic', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      entity_types: entityTypes,
      similarity_threshold: threshold,
      limit: 10
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- Uses BGE-M3 multilingual embeddings (1536 dimensions)
- Supports bilingual semantic matching (English/Arabic)
- Fallback to full-text search if embedding service unavailable
- Results ranked by cosine similarity score (0-1)

---

### Unified Semantic Search

Unified endpoint combining full-text and semantic search with intelligent ranking.

**Endpoint:** `POST /semantic-search-unified`

**Request Body:**
```json
{
  "query": "climate cooperation agreements",
  "search_mode": "hybrid",
  "entity_types": ["positions", "documents", "mous"],
  "filters": {
    "status": ["published", "active"],
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    }
  },
  "limit": 20,
  "offset": 0
}
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "pos-123",
      "type": "position",
      "title": "Climate Cooperation Framework",
      "title_ar": "إطار التعاون المناخي",
      "unified_score": 92.5,
      "text_match_score": 85.0,
      "semantic_score": 0.88,
      "rank": 1,
      "match_type": "hybrid",
      "snippet": "Framework for bilateral <mark>climate cooperation</mark>..."
    }
  ],
  "search_strategy": "hybrid",
  "total": 15,
  "query_time_ms": 180
}
```

**Search Modes:**
- `text_only` - Traditional full-text search only
- `semantic_only` - Vector-based semantic search only
- `hybrid` - Combines both with intelligent ranking (default)

**Implementation Example:**
```typescript
const unifiedSearch = async (query: string, mode = 'hybrid') => {
  const response = await fetch('/semantic-search-unified', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      search_mode: mode,
      entity_types: ['positions', 'documents', 'mous'],
      limit: 20
    })
  });

  return await response.json();
};
```

---

### Advanced Search

Complex multi-criteria search with Boolean logic, field-level filters, and relationship queries.

**Endpoint:** `POST /advanced-search`

**Request Body:**
```json
{
  "query": "climate AND (policy OR framework)",
  "entity_types": ["positions", "documents"],
  "conditions": [
    {
      "field_name": "status",
      "operator": "equals",
      "value": "published",
      "is_negated": false
    },
    {
      "field_name": "thematic_category",
      "operator": "in",
      "value": ["environment", "energy"]
    }
  ],
  "relationships": [
    {
      "source_entity_type": "position",
      "target_entity_type": "dossier",
      "relationship_type": "linked_to",
      "target_conditions": [
        {
          "field_name": "dossier_type",
          "operator": "equals",
          "value": "country"
        }
      ]
    }
  ],
  "date_range": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  },
  "filter_logic": "AND",
  "sort_by": "relevance",
  "sort_order": "desc",
  "limit": 50,
  "offset": 0
}
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "pos-123",
      "type": "position",
      "title": "Climate Policy Framework",
      "rank_score": 95.0,
      "matched_conditions": ["status=published", "category=environment"],
      "matched_relationships": ["linked_to:dossier:country"]
    }
  ],
  "filters_applied": {
    "conditions": 2,
    "relationships": 1,
    "date_range": true
  },
  "total": 8,
  "query_time_ms": 120
}
```

**Supported Operators:**
- `equals`, `not_equals`
- `contains`, `not_contains`
- `starts_with`, `ends_with`
- `in`, `not_in`
- `greater_than`, `less_than`
- `between`

**Implementation Example:**
```typescript
const advancedSearch = async (criteria: AdvancedSearchCriteria) => {
  const response = await fetch('/advanced-search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(criteria)
  });

  return await response.json();
};

// Example: Search for published positions on climate
const searchPublishedClimate = () => {
  return advancedSearch({
    query: 'climate',
    entity_types: ['positions'],
    conditions: [
      {
        field_name: 'status',
        operator: 'equals',
        value: 'published'
      }
    ],
    sort_by: 'updated_at',
    sort_order: 'desc',
    limit: 20
  });
};
```

---

### Entity Search

Search within specific entity types with entity-specific filters.

**Endpoint:** `GET /entities-search?entity_type={type}&q={query}`

**Query Parameters:**
- `entity_type` (required): Entity type (dossiers, positions, engagements, documents, people)
- `q` (optional): Search query
- `filters` (optional): JSON-encoded entity-specific filters
- `limit` (optional): Results limit (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "entity_type": "positions",
  "results": [
    {
      "id": "pos-123",
      "title": "Climate Framework",
      "title_ar": "إطار المناخ",
      "status": "published",
      "thematic_category": "environment",
      "version": 3,
      "updated_at": "2024-01-20T10:00:00Z"
    }
  ],
  "total": 15,
  "facets": {
    "status": {
      "draft": 5,
      "published": 10
    },
    "thematic_category": {
      "environment": 8,
      "energy": 7
    }
  }
}
```

**Implementation Example:**
```typescript
const searchEntities = async (
  entityType: string,
  query?: string,
  filters?: Record<string, any>
) => {
  const params = new URLSearchParams({ entity_type: entityType });
  if (query) params.append('q', query);
  if (filters) params.append('filters', JSON.stringify(filters));

  const response = await fetch(`/entities-search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

---

### Quick Switcher Search

Fast entity navigation with keyboard shortcuts support.

**Endpoint:** `GET /quickswitcher-search?q={query}&limit={limit}`

**Query Parameters:**
- `q` (required): Search query (min 1 character)
- `limit` (optional): Maximum results (1-20, default: 10)
- `recent` (optional): Include recent items (default: true)

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "dossier-123",
      "type": "dossier",
      "title": "Saudi Arabia",
      "title_ar": "المملكة العربية السعودية",
      "subtitle": "Country Dossier",
      "icon": "🇸🇦",
      "url": "/dossiers/countries/dossier-123",
      "rank": 1,
      "is_recent": true,
      "last_accessed": "2024-01-20T09:00:00Z"
    },
    {
      "id": "pos-456",
      "type": "position",
      "title": "Climate Framework",
      "subtitle": "Published Position",
      "icon": "📄",
      "url": "/positions/pos-456",
      "rank": 2,
      "is_recent": false
    }
  ],
  "query_time_ms": 25,
  "total": 2
}
```

**Implementation Example:**
```typescript
const quickSwitcherSearch = async (query: string) => {
  if (!query) return { results: [] };

  const params = new URLSearchParams({
    q: query,
    limit: '10',
    recent: 'true'
  });

  const response = await fetch(`/quickswitcher-search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// React hook for quick switcher
const useQuickSwitcher = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      quickSwitcherSearch(query).then(data => setResults(data.results));
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results };
};
```

**Notes:**
- Optimized for <50ms response time
- Prioritizes recently accessed items
- Supports keyboard navigation (↑↓ arrows, Enter)

---

### Saved Searches

Manage saved search queries for frequently used searches.

**Endpoint (GET):** `GET /saved-searches`
**Endpoint (POST):** `POST /saved-searches`
**Endpoint (DELETE):** `DELETE /saved-searches`

**List Saved Searches - GET Request:**

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "search-123",
      "name": "Published Climate Positions",
      "name_ar": "مواقف المناخ المنشورة",
      "query": {
        "q": "climate",
        "type": "positions",
        "filters": {
          "status": "published"
        }
      },
      "is_default": false,
      "usage_count": 42,
      "created_at": "2024-01-10T08:00:00Z",
      "last_used": "2024-01-20T10:00:00Z"
    }
  ],
  "total": 5
}
```

**Create Saved Search - POST Request:**

**Request Body:**
```json
{
  "name": "Active Commitments",
  "name_ar": "الالتزامات النشطة",
  "query": {
    "entity_types": ["commitments"],
    "filters": {
      "status": "active"
    }
  },
  "is_default": false
}
```

**Response (201 Created):**
```json
{
  "id": "search-456",
  "name": "Active Commitments",
  "created_at": "2024-01-20T10:30:00Z"
}
```

**Delete Saved Search - DELETE Request:**

**Request Body:**
```json
{
  "search_id": "search-123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Saved search deleted",
  "message_ar": "تم حذف البحث المحفوظ"
}
```

**Implementation Example:**
```typescript
const getSavedSearches = async () => {
  const response = await fetch('/saved-searches', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

const createSavedSearch = async (name: string, query: any) => {
  const response = await fetch('/saved-searches', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, query })
  });

  return await response.json();
};
```

---

### Search Templates

Pre-configured search templates for common use cases.

**Endpoint:** `GET /search-templates`

**Response (200 OK):**
```json
{
  "templates": [
    {
      "id": "template-recent-positions",
      "name": "Recent Published Positions",
      "name_ar": "المواقف المنشورة مؤخراً",
      "category": "positions",
      "query": {
        "entity_types": ["positions"],
        "filters": {
          "status": "published"
        },
        "sort_by": "updated_at",
        "sort_order": "desc"
      },
      "description": "All recently published policy positions",
      "icon": "📄"
    },
    {
      "id": "template-overdue-commitments",
      "name": "Overdue Commitments",
      "name_ar": "الالتزامات المتأخرة",
      "category": "commitments",
      "query": {
        "entity_types": ["commitments"],
        "filters": {
          "status": "overdue"
        }
      },
      "description": "Commitments past their deadline"
    }
  ],
  "total": 12
}
```

**Implementation Example:**
```typescript
const getSearchTemplates = async () => {
  const response = await fetch('/search-templates', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

const applyTemplate = async (templateId: string) => {
  const templates = await getSearchTemplates();
  const template = templates.templates.find(t => t.id === templateId);

  if (template) {
    return await advancedSearch(template.query);
  }
};
```

---

## Rate Limiting

To ensure fair usage and system stability:

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /search | 60 requests | per minute per user |
| GET /search-suggest | 120 requests | per minute per user |
| POST /search-semantic | 30 requests | per minute per user |
| POST /advanced-search | 30 requests | per minute per user |
| GET /quickswitcher-search | 120 requests | per minute per user |

**Rate Limit Response (429):**
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

## Performance Targets

- **Full-text search**: <100ms (90th percentile)
- **Typeahead suggestions**: <200ms (95th percentile)
- **Semantic search**: <500ms (90th percentile)
- **Quick switcher**: <50ms (95th percentile)

## Caching Strategy

- Popular queries cached in Redis for 15 minutes
- Suggestions cached for 5 minutes
- Entity metadata cached for 1 hour
- Cache invalidation on entity updates

## Related APIs

- **Documents API** - Document content search and OCR
- **Dossiers API** - Dossier-specific search
- **Positions API** - Position full-text search
- **Unified Work API** - Search across commitments and tasks

## Security & Access Control

All search operations enforce Row-Level Security (RLS):
- Results filtered based on user permissions
- Restricted items counted but not displayed
- Bilingual error messages for security events
- Audit logging for all search queries
