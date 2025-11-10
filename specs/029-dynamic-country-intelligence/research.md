# Phase 0: Research - Dynamic Country Intelligence System

**Date**: 2025-01-30
**Feature**: 029-dynamic-country-intelligence
**Status**: Complete

## Research Summary

This document consolidates all research findings for implementing the Dynamic Country Intelligence System, covering AnythingLLM integration, caching strategies, external API integration, and performance optimization.

---

## 1. AnythingLLM Integration Architecture

### Decision: Supabase Edge Function Proxy Layer

**Selected Approach**: Implement a Supabase Edge Function-based proxy that communicates with AnythingLLM Docker instance via REST API.

**Rationale**:
- Leverages existing Supabase infrastructure
- Provides authentication layer (JWT validation)
- Enables caching at Edge Function level
- Maintains separation of concerns (UI ← Edge Function ← AnythingLLM)
- Supports both web and mobile clients seamlessly

**Architecture**:
```
Frontend (Web/Mobile)
  ↓ (TanStack Query)
Supabase Edge Function
  ↓ (REST API)
AnythingLLM Docker (localhost:3001)
  ↓ (pgvector)
PostgreSQL (intelligence_reports table)
  ↓ (cache layer)
Redis (6h-48h TTL by intelligence type)
```

**Alternatives Considered**:
1. **Direct AnythingLLM Access from Frontend**
   - Rejected: Exposes API keys to client
   - Rejected: No authentication layer
   - Rejected: Cannot implement server-side caching

2. **LangChain Direct Integration**
   - Rejected: More boilerplate code required
   - Rejected: Steeper learning curve for team
   - Rejected: Lacks built-in workspace management

3. **OpenAI Assistants API**
   - Rejected: Vendor lock-in (cannot use open-source LLMs)
   - Rejected: Higher costs ($0.03/assistant/day + token costs)
   - Rejected: Less control over vector storage

---

## 2. Authentication & API Access

### Decision: Bearer Token Authentication with Multi-User Mode

**Implementation**:
```typescript
// Edge Function authentication
const ANYTHINGLLM_API_KEY = Deno.env.get('ANYTHINGLLM_API_KEY');
const ANYTHINGLLM_BASE_URL = Deno.env.get('ANYTHINGLLM_BASE_URL') || 'http://localhost:3001';

const headers = {
  'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
  'Content-Type': 'application/json'
};
```

**Key Findings**:
- AnythingLLM API keys generated in UI (Settings → API Keys)
- Multi-user mode enables role-based access (Admin, Manager, Default)
- SSO support available via `SIMPLE_SSO_ENABLED` environment variable
- 1-hour temporary tokens for SSO sessions

**Security Considerations**:
- API keys stored in Supabase Edge Function environment variables (never in git)
- Edge Functions validate user JWT before proxying to AnythingLLM
- RLS policies enforce entity-level access control
- Separate service role key for background jobs

---

## 3. RAG (Retrieval-Augmented Generation) Strategy

### Decision: One Workspace Per Country with Metadata Tagging

**Workspace Structure**:
```typescript
// Workspace naming convention
const workspaceSlug = `country-${countryCode.toLowerCase()}`;
// Examples: "country-sa", "country-us", "country-ae"

// Document metadata for categorization
interface DocumentMetadata {
  country_code: string;
  intelligence_type: 'economic' | 'political' | 'security' | 'bilateral';
  source: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  date: string;
  confidence_level: 'low' | 'medium' | 'high' | 'verified';
}
```

**Rationale**:
- **Security**: Isolates intelligence by country (easier access control)
- **Performance**: Parallel document processing per country
- **Scalability**: Independent workspace management (add/remove countries)
- **Context**: Country-specific context improves RAG quality

**Alternatives Considered**:
1. **Single Global Workspace**
   - Rejected: Security concerns (cross-country data leakage)
   - Rejected: Poor context quality (mixed country intelligence)

2. **One Workspace Per Intelligence Type**
   - Rejected: Duplicates country context across workspaces
   - Rejected: Complex multi-workspace queries

---

## 4. Document Chunking Configuration

### Decision: 800 Characters with 10% Overlap

**Configuration**:
```typescript
const chunkingConfig = {
  chunkSize: 800,        // 800 characters
  overlap: 80,           // 10% overlap
  preserveStructure: true // Respect paragraphs/sections
};
```

**Rationale**:
- **800 characters**: Optimized for dense intelligence reports
  - Shorter than default 1,000 (better precision for technical content)
  - Longer than 400 (maintains sufficient context)
- **10% overlap**: Prevents context loss at chunk boundaries
  - Critical for cross-referenced intelligence
- **Structure preservation**: Maintains paragraph/section integrity
  - Avoids splitting tables or lists mid-chunk

**Performance Impact**:
- More chunks = slower retrieval but higher precision
- Acceptable trade-off for intelligence use case (quality > speed)

---

## 5. Embedding Model Selection

### Decision: OpenAI text-embedding-ada-002 (1536 dimensions)

**Selected Model**: `text-embedding-ada-002`

**Rationale**:
- **Compatibility**: Matches existing pgvector setup (1536 dimensions)
- **Performance**: Excellent semantic search quality
- **Cost**: $0.0001 per 1K tokens (acceptable for use case)
- **Stability**: Battle-tested, widely used
- **Future-proof**: Industry standard dimension (1024-1536)

**Alternatives Considered**:
| Model | Dimensions | Cost | Quality | Verdict |
|-------|-----------|------|---------|---------|
| OpenAI ada-002 | 1536 | $0.0001/1K | Excellent | ✅ **Selected** |
| HuggingFace all-MiniLM-L6-v2 | 384 | Free (self-hosted) | Good | ❌ Different dimensions |
| Cohere embed-english-v3.0 | 1024 | $0.0001/1K | Excellent | ❌ Dimension mismatch |

---

## 6. Vector Database Strategy

### Decision: Use pgvector (Existing Infrastructure)

**Selected Approach**: Continue using pgvector (1536-dimension) with optimization tuning.

**Rationale**:
- **Already Deployed**: Existing `intelligence_reports` table has pgvector support
- **Supabase Native**: Seamless integration with existing auth/RLS
- **Data Sovereignty**: All embeddings stay in PostgreSQL (no external vector DB)
- **Sufficient Performance**: <100ms for most queries with proper indexing

**Optimization Strategy**:
```sql
-- Composite index for common query patterns
CREATE INDEX idx_intelligence_entity_type_fresh
ON intelligence_reports(entity_id, intelligence_type, refresh_status)
WHERE cache_expires_at > NOW();

-- Vector similarity index (HNSW algorithm)
CREATE INDEX ON intelligence_reports
USING hnsw (vector_embedding vector_cosine_ops);
```

**When to Consider Alternatives**:
- If vector count exceeds 10M per workspace (unlikely)
- If query time exceeds 1s p95 (would require migration to Lance DB)
- If multi-modal embeddings needed (images + text)

---

## 7. Caching Strategy

### Decision: Multi-Tier Caching (Redis → PostgreSQL → AnythingLLM)

**Architecture**:
```
Tier 1: Redis (hot cache, 1-6 hours TTL)
  ↓ (cache miss)
Tier 2: PostgreSQL (warm cache, intelligence_reports table)
  ↓ (no historical data)
Tier 3: AnythingLLM (cold, fresh generation)
```

**TTL Configuration**:
```typescript
const TTL_BY_INTELLIGENCE_TYPE = {
  economic: 6 * 3600,      // 6 hours (quarterly data updates)
  political: 3600,         // 1 hour (volatile, time-sensitive)
  security: 1800,          // 30 minutes (dynamic threat landscape)
  bilateral: 12 * 3600     // 12 hours (stable agreements)
};
```

**Rationale**:
- **Redis**: Sub-millisecond response for hot queries (80%+ hit rate)
- **PostgreSQL**: Historical intelligence serves as fallback
- **AnythingLLM**: Fresh generation only when necessary

**Cache Invalidation**:
- Automatic: TTL expiration triggers background refresh
- Manual: User-triggered refresh button
- Event-driven: External API updates invalidate relevant cache

---

## 8. Error Handling & Retry Strategy

### Decision: Exponential Backoff with Circuit Breaker

**Retry Configuration**:
```typescript
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffFactor: 2         // Double delay each retry
};
```

**Circuit Breaker**:
- Opens after 5 consecutive failures
- Blocks requests for 60 seconds
- Enters "half-open" state for test request
- Closes on first success

**Fallback Mechanisms**:
1. **Primary**: AnythingLLM RAG query
2. **Fallback 1**: PostgreSQL full-text search
3. **Fallback 2**: Cached intelligence (show warning: "Data may be stale")
4. **Fallback 3**: Empty state with helpful message

**User Experience**:
- Display cached data immediately (stale-while-revalidate)
- Show non-intrusive loading indicator during refresh
- Toast notification on error with retry option

---

## 9. External API Integration

### Decision: Custom Agent Skills + Scheduled Sync

**Integration Points**:
1. **World Bank API** (Economic Intelligence)
   - Custom AnythingLLM agent skill
   - Fetches GDP, trade balance, inflation data
   - Updates every 24 hours (daily batch sync)

2. **Travel Advisories** (Security Intelligence)
   - Web scraping + API (US State Dept, UK FCO)
   - Updates every 6 hours
   - High-priority data (conflict zones, travel bans)

**Implementation**:
```typescript
// Custom agent skill: world-bank-data.js
module.exports = {
  name: 'world_bank_data',
  parameters: { country_code, indicator, year },
  async handler({ country_code, indicator, year }) {
    const url = `https://api.worldbank.org/v2/country/${country_code}/indicator/${indicator}`;
    const response = await axios.get(url);
    return JSON.stringify(response.data);
  }
};
```

**Scheduled Sync** (Supabase Edge Function cron job):
```typescript
// Runs every 6 hours
// Fetches new reports → uploads to AnythingLLM → embeds in workspace
```

---

## 10. Performance Targets & Success Metrics

### Defined Targets (from research and spec)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Page Load Time** | <2 seconds | Lighthouse, Real User Monitoring |
| **Manual Refresh** | <5 seconds (cached), <10 seconds (fresh) | Edge Function duration logs |
| **Cache Hit Ratio** | >80% | Redis metrics, query logs |
| **Background Refresh** | Transparent (no page reload) | User surveys, session recordings |
| **AnythingLLM Response** | <3 seconds (RAG query) | AnythingLLM API logs |
| **Uptime** | 99% (even with AnythingLLM degraded) | Health checks, alerting |
| **Vector Search** | <100ms p95 | PostgreSQL query logs |
| **Cost per Query** | <$0.01 | Embedding + LLM inference costs |

**Monitoring Strategy**:
- Prometheus metrics for Edge Function duration
- Redis cache hit/miss counters
- PostgreSQL slow query log (>100ms)
- AnythingLLM health check endpoint
- Grafana dashboards for visualization

---

## 11. Alternatives Rejected & Trade-offs

### Why Not LangChain?
- **Pro**: More flexible, larger ecosystem
- **Con**: Requires more boilerplate code
- **Con**: Steeper learning curve for team
- **Con**: No built-in workspace management
- **Decision**: AnythingLLM provides better developer experience for our use case

### Why Not Standalone Vector DB (Qdrant/Weaviate)?
- **Pro**: Potentially faster vector search
- **Con**: Additional infrastructure to manage
- **Con**: Data split across databases (PostgreSQL + vector DB)
- **Con**: More complex sync logic
- **Decision**: pgvector is sufficient for current scale (<1M vectors per country)

### Why Not OpenAI Assistants API?
- **Pro**: Managed service (less ops overhead)
- **Con**: Vendor lock-in (cannot switch to open-source LLMs)
- **Con**: Higher costs ($0.03/assistant/day + token costs)
- **Con**: Less control over vector storage and retrieval
- **Decision**: Self-hosted AnythingLLM provides more flexibility and lower costs

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. ✅ Deploy AnythingLLM Docker container
2. ✅ Create Supabase Edge Function proxy layer
3. ✅ Set up API key authentication
4. ✅ Create first workspace (`country-sa`) for testing

### Phase 2: RAG Setup (Week 3-4)
5. Configure pgvector as vector database
6. Upload 5-10 sample intelligence reports
7. Implement document chunking (800/80 settings)
8. Test basic RAG queries

### Phase 3: Caching & Performance (Week 5-6)
9. Implement Redis caching layer
10. Add rate limiting and circuit breaker
11. Set up TTL strategy by intelligence type
12. Test streaming responses

### Phase 4: Automation (Week 7-8)
13. Build custom agent skill for World Bank API
14. Create scheduled sync job for external data sources
15. Implement auto-refresh for watched documents
16. Deploy monitoring and alerting

---

## 13. Technical Gotchas & Lessons Learned

1. **Dimension Mismatch**: Embedding model dimensions MUST exactly match pgvector column definition (1536)
2. **SSE Not WebSockets**: AnythingLLM uses Server-Sent Events for streaming
3. **Workspace Slugs**: Must be lowercase, no spaces (e.g., `country-us`, not `Country_US`)
4. **Docker Networking**: AnythingLLM container must be on same network as Edge Functions
5. **Two-Step Upload**: Document upload requires two API calls (upload → embed)
6. **OpenAI Rate Limits**: 3,000 requests/minute - implement queuing for bulk uploads
7. **Context Window**: GPT-4 has 8K token limit - use hierarchical retrieval

---

## 14. Open Source & Libraries Used

| Library | Version | Purpose | License |
|---------|---------|---------|---------|
| AnythingLLM | Latest | RAG workspace management | MIT |
| OpenAI SDK | 4.x | Embedding generation | MIT |
| Supabase | Latest | Database, Auth, Edge Functions | Apache 2.0 |
| pgvector | 0.5+ | Vector similarity search | PostgreSQL |
| TanStack Query | 5.x | Data fetching, caching | MIT |
| Zod | 3.x | Runtime validation | MIT |

---

## 15. Security & Compliance

### Data Protection
- All intelligence data encrypted at rest (PostgreSQL native encryption)
- API keys stored in Supabase Edge Function secrets (never in git)
- RLS policies enforce entity-level access control
- Audit logs track all refresh operations (who, when, what)

### GDPR/Privacy Considerations
- Intelligence reports linked to entities, not individuals
- User identifiers hashed in audit logs
- Data retention policy: 7 years for government records
- Right to erasure: Soft delete with cascade to intelligence reports

### Threat Model
- **External API Compromise**: Fallback to cached data
- **AnythingLLM Unavailability**: Circuit breaker + PostgreSQL fallback
- **Injection Attacks**: Zod validation on all inputs
- **Unauthorized Access**: JWT validation + RLS enforcement

---

## Conclusion

All technical unknowns have been researched and resolved. The implementation plan leverages:
- **AnythingLLM** for RAG workspace management (best developer experience)
- **pgvector** for vector storage (existing infrastructure)
- **Multi-tier caching** for performance (Redis → PostgreSQL → AnythingLLM)
- **Supabase Edge Functions** for proxy layer (authentication + caching)
- **Custom agent skills** for external API integration (World Bank, travel advisories)

The architecture is production-ready, cost-efficient, and scalable to hundreds of country workspaces with millions of documents.

**Next Phase**: Generate data model, API contracts, and quickstart guide (Phase 1).
