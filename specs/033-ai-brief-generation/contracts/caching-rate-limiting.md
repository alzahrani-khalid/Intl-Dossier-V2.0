# Caching & Rate Limiting Strategy

**Feature Branch**: `033-ai-brief-generation`

## Overview

This document defines caching strategies and rate limiting rules for the AI Brief Generation feature to ensure performance, cost control, and fair resource distribution.

---

## Rate Limiting

### Limits by Feature

| Feature               | User Limit | Org Limit   | Window  |
| --------------------- | ---------- | ----------- | ------- |
| Brief Generation      | 10/hour    | 100/hour    | Sliding |
| Chat Messages         | 60/minute  | 500/minute  | Sliding |
| Entity Link Proposals | 20/hour    | 200/hour    | Sliding |
| Embedding Requests    | 100/minute | 1000/minute | Fixed   |

### Rate Limit Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1701792060
X-RateLimit-Window: 60
```

### Rate Limit Response

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 15

{
  "success": false,
  "error": {
    "code": "AI_PROVIDER_RATE_LIMITED",
    "message": "Rate limit exceeded. Please wait 15 seconds.",
    "retry_after": 15
  }
}
```

### Redis Key Structure

```
# User-level rate limits
rate_limit:ai:brief:user:{user_id}
rate_limit:ai:chat:user:{user_id}
rate_limit:ai:link:user:{user_id}

# Org-level rate limits
rate_limit:ai:brief:org:{org_id}
rate_limit:ai:chat:org:{org_id}
rate_limit:ai:link:org:{org_id}
```

### Implementation Pattern

```typescript
// Using sliding window log algorithm
interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

async function checkRateLimit(config: RateLimitConfig): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  // Remove old entries
  await redis.zremrangebyscore(config.key, 0, windowStart);

  // Count current entries
  const count = await redis.zcard(config.key);

  if (count >= config.limit) {
    const oldestEntry = await redis.zrange(config.key, 0, 0, 'WITHSCORES');
    const resetAt = parseInt(oldestEntry[1]) + config.windowSeconds * 1000;
    return { allowed: false, remaining: 0, resetAt };
  }

  // Add new entry
  await redis.zadd(config.key, now, `${now}:${crypto.randomUUID()}`);
  await redis.expire(config.key, config.windowSeconds);

  return {
    allowed: true,
    remaining: config.limit - count - 1,
    resetAt: now + config.windowSeconds * 1000,
  };
}
```

---

## Caching Strategy

### Cache Layers

```
┌─────────────────────┐
│   Application       │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Redis (L1)        │  ← Hot data, short TTL
│   - Embeddings      │
│   - Semantic search │
│   - Session state   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   PostgreSQL        │  ← Source of truth
│   - Briefs          │
│   - AI runs         │
│   - Policies        │
└─────────────────────┘
```

### What We Cache

#### 1. Embedding Cache (Most Important)

| What              | Key Pattern                   | TTL      | Invalidation      |
| ----------------- | ----------------------------- | -------- | ----------------- |
| Text embeddings   | `embed:bge-m3:{content_hash}` | 7 days   | On content update |
| Entity embeddings | `embed:entity:{type}:{id}`    | 24 hours | On entity update  |

```typescript
interface CachedEmbedding {
  vector: number[]; // 1024 dimensions
  model: string; // "bge-m3"
  created_at: number; // Unix timestamp
  content_hash: string; // SHA-256 of input
}

// Cache key generation
function getEmbeddingCacheKey(text: string): string {
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  return `embed:bge-m3:${hash.slice(0, 16)}`;
}
```

#### 2. Semantic Search Cache

| What            | Key Pattern                           | TTL       | Invalidation    |
| --------------- | ------------------------------------- | --------- | --------------- |
| Search results  | `search:{table}:{query_hash}:{limit}` | 5 minutes | On table update |
| Popular queries | `search:popular:{table}`              | 1 hour    | Manual          |

```typescript
// Cache popular/recent search results
interface CachedSearchResult {
  results: Array<{ id: string; score: number }>;
  query_embedding: number[];
  cached_at: number;
  source_table: string;
}
```

#### 3. Session Cache (Chat)

| What            | Key Pattern                 | TTL     | Invalidation  |
| --------------- | --------------------------- | ------- | ------------- |
| Chat session    | `chat:session:{session_id}` | 2 hours | On completion |
| Message history | `chat:history:{session_id}` | 2 hours | With session  |

```typescript
interface ChatSession {
  user_id: string;
  org_id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  context: Record<string, unknown>;
  created_at: number;
  last_activity: number;
}
```

#### 4. Organization Policy Cache

| What         | Key Pattern              | TTL       | Invalidation       |
| ------------ | ------------------------ | --------- | ------------------ |
| LLM policy   | `policy:llm:{org_id}`    | 5 minutes | On policy update   |
| Spend status | `spend:{org_id}:{month}` | 1 minute  | On AI run complete |

### What We DON'T Cache

- Generated briefs (stored in DB, fetched on demand)
- AI run logs (write-through to DB)
- Link proposals (real-time data)
- Sensitive/classified content

### Cache Invalidation

#### Event-Based Invalidation

```typescript
// Publish invalidation events
await redis.publish(
  'cache:invalidate',
  JSON.stringify({
    type: 'entity_update',
    entity_type: 'dossier',
    entity_id: 'uuid',
    timestamp: Date.now(),
  })
);

// Subscriber handles invalidation
redis.subscribe('cache:invalidate', (message) => {
  const event = JSON.parse(message);
  switch (event.type) {
    case 'entity_update':
      // Invalidate entity embeddings
      await redis.del(`embed:entity:${event.entity_type}:${event.entity_id}`);
      // Invalidate related search caches
      await invalidateSearchCaches(event.entity_type);
      break;
    case 'policy_update':
      await redis.del(`policy:llm:${event.org_id}`);
      break;
  }
});
```

#### Time-Based Expiration

All caches use Redis TTL for automatic expiration. No manual cleanup required.

### Cache Warming

```typescript
// Warm embedding cache for frequently accessed entities
async function warmEmbeddingCache(entityType: string, topN: number = 100) {
  const topEntities = await getFrequentlyAccessedEntities(entityType, topN);

  for (const entity of topEntities) {
    const cacheKey = `embed:entity:${entityType}:${entity.id}`;
    const cached = await redis.get(cacheKey);

    if (!cached) {
      const embedding = await embeddingsService.embed(entity.content);
      await redis.setex(
        cacheKey,
        86400,
        JSON.stringify({
          vector: embedding,
          model: 'bge-m3',
          created_at: Date.now(),
        })
      );
    }
  }
}

// Run on startup and daily
```

---

## Request Deduplication

Prevent duplicate concurrent requests for the same resource.

```typescript
// Deduplication for expensive operations
const inFlightRequests = new Map<string, Promise<unknown>>();

async function deduplicatedRequest<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = operation().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

// Usage
const embedding = await deduplicatedRequest(`embed:${contentHash}`, () =>
  embeddingsService.embed(text)
);
```

---

## Monitoring & Alerts

### Cache Metrics (Collected via Redis INFO)

| Metric            | Alert Threshold            |
| ----------------- | -------------------------- |
| Cache hit rate    | < 70% warn, < 50% critical |
| Memory usage      | > 80% warn, > 90% critical |
| Evictions/min     | > 100 warn                 |
| Connection errors | > 5/min critical           |

### Rate Limit Metrics

| Metric              | Alert Threshold               |
| ------------------- | ----------------------------- |
| Rate limit hits/min | > 50 warn (investigate abuse) |
| Org cap reached     | Any occurrence (notify admin) |

---

## Configuration

### Environment Variables

```bash
# Redis
REDIS_URL=redis://localhost:6379
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY_MS=100

# Cache TTLs (seconds)
CACHE_TTL_EMBEDDING=604800      # 7 days
CACHE_TTL_SEARCH=300            # 5 minutes
CACHE_TTL_SESSION=7200          # 2 hours
CACHE_TTL_POLICY=300            # 5 minutes

# Rate Limits
RATE_LIMIT_BRIEF_USER_HOURLY=10
RATE_LIMIT_BRIEF_ORG_HOURLY=100
RATE_LIMIT_CHAT_USER_MINUTE=60
RATE_LIMIT_CHAT_ORG_MINUTE=500
```

### Feature Flags

```typescript
const cacheConfig = {
  embeddings: {
    enabled: true,
    warmOnStartup: true,
    warmTopN: 100,
  },
  searchResults: {
    enabled: true,
    minQueryLength: 3,
  },
  sessions: {
    enabled: true,
    maxMessagesPerSession: 100,
  },
};
```
