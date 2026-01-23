# Edge Functions Best Practices

## Overview

This guide provides best practices for developing, deploying, and maintaining Supabase Edge Functions in the GASTAT International Dossier System. Follow these patterns to ensure security, performance, and maintainability.

## Table of Contents

1. [Security Best Practices](#security-best-practices)
2. [Performance Optimization](#performance-optimization)
3. [Error Handling](#error-handling)
4. [Testing Edge Functions](#testing-edge-functions)
5. [Mobile-First Considerations](#mobile-first-considerations)
6. [RTL & Internationalization](#rtl--internationalization)

---

## Security Best Practices

### Row-Level Security (RLS)

Always enforce RLS policies at the database level. Edge Functions should NEVER bypass RLS checks.

**✅ Good: Use authenticated client**

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Get auth token from request
  const authHeader = req.headers.get('Authorization');

  // Create client with user's token (RLS applies)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader! },
      },
    }
  );

  // Query respects RLS policies
  const { data, error } = await supabase
    .from('dossiers')
    .select('*');

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**❌ Bad: Using service role bypasses RLS**

```typescript
// DON'T DO THIS - bypasses RLS!
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Bypasses RLS
);
```

**When to use service role:**
- Background jobs (notifications, cleanup)
- Admin operations with explicit permission checks
- Cross-tenant operations with manual authorization

### Authentication Patterns

**Validate JWT tokens:**

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2';

async function validateUser(req: Request) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return { error: 'Missing authorization header', user: null };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { headers: { Authorization: authHeader } },
    }
  );

  // Validate token and get user
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: 'Invalid or expired token', user: null };
  }

  return { user, error: null };
}

Deno.serve(async (req) => {
  const { user, error } = await validateUser(req);

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Proceed with authenticated user
  // ...
});
```

### Input Validation & Sanitization

**Always validate and sanitize user input:**

```typescript
import { validateAssignmentId, sanitizeText, validateUUIDArray } from '../_shared/security.ts';

Deno.serve(async (req) => {
  const body = await req.json();

  // Validate UUID
  const { valid, id, error } = validateAssignmentId(body.assignment_id);
  if (!valid) {
    return new Response(JSON.stringify({ error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sanitize text input
  const notes = sanitizeText(body.notes, 1000);

  // Validate array of UUIDs
  const { valid: validIds, ids, error: idsError } = validateUUIDArray(
    body.dossier_ids,
    'dossier_ids',
    50
  );

  if (!validIds) {
    return new Response(JSON.stringify({ error: idsError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Proceed with validated and sanitized data
  // ...
});
```

### CORS Configuration

**Configure CORS properly for production:**

```typescript
function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [];
  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  // Process request
  const response = await processRequest(req);

  // Add CORS headers to response
  return new Response(response.body, {
    status: response.status,
    headers: {
      ...response.headers,
      ...corsHeaders(origin),
    },
  });
});
```

### Prevent Information Disclosure

**Never expose internal errors to clients:**

```typescript
import { createSafeErrorResponse } from '../_shared/security.ts';

Deno.serve(async (req) => {
  try {
    // Process request
    const result = await dangerousOperation();

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log full error for debugging
    console.error('Operation failed:', error);

    // Return safe error to client
    const safeError = createSafeErrorResponse(
      error,
      'Failed to process request'
    );

    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Performance Optimization

### Rate Limiting

**Implement rate limiting for all public endpoints:**

```typescript
import { RateLimiter } from '../_shared/rate-limit.ts';

const rateLimiter = new RateLimiter(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  // Extract user ID or IP
  const userId = await getUserId(req); // null for anonymous
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

  // Check rate limit
  const rateLimit = await rateLimiter.checkLimit(userId, ipAddress);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        retry_after: rateLimit.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'Retry-After': String(rateLimit.retryAfter),
        },
      }
    );
  }

  // Add rate limit headers to successful response
  const response = await processRequest(req);

  return new Response(response.body, {
    status: response.status,
    headers: {
      ...response.headers,
      'X-RateLimit-Limit': String(rateLimit.limit),
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    },
  });
});
```

### Caching Strategies

**Implement caching for expensive operations:**

```typescript
// In-memory cache with TTL
const cache = new Map<string, { data: any; expiresAt: number }>();

function getCached(key: string): any | null {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key: string, data: any, ttlMs: number) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const cacheKey = `${url.pathname}:${url.search}`;

  // Try cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
      },
    });
  }

  // Compute result
  const result = await expensiveOperation();

  // Cache for 5 minutes
  setCache(cacheKey, result, 5 * 60 * 1000);

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
    },
  });
});
```

**Redis caching for shared state:**

```typescript
import { Redis } from 'npm:ioredis@5';

const redis = new Redis(Deno.env.get('REDIS_URL')!);

async function getCachedData(key: string): Promise<any | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedData(key: string, data: any, ttlSeconds: number) {
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
}

Deno.serve(async (req) => {
  const cacheKey = 'user-stats:' + userId;

  // Try Redis cache
  let stats = await getCachedData(cacheKey);

  if (!stats) {
    // Compute from database
    stats = await computeUserStats(userId);

    // Cache for 10 minutes
    await setCachedData(cacheKey, stats, 600);
  }

  return new Response(JSON.stringify(stats), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Database Query Optimization

**Use efficient queries with proper indexing:**

```typescript
// ✅ Good: Select only needed columns
const { data } = await supabase
  .from('work_items')
  .select('id, title, status, deadline')
  .eq('assignee_id', userId)
  .order('deadline', { ascending: true })
  .limit(50);

// ❌ Bad: Select all columns
const { data } = await supabase
  .from('work_items')
  .select('*')
  .eq('assignee_id', userId);
```

**Batch operations instead of N+1 queries:**

```typescript
// ✅ Good: Single query with join
const { data } = await supabase
  .from('work_items')
  .select(`
    *,
    assignee:users!assignee_id(id, name, email),
    dossiers:work_item_dossiers(
      dossier:dossiers(id, name, type)
    )
  `)
  .in('id', workItemIds);

// ❌ Bad: N+1 queries
for (const item of workItems) {
  const { data: assignee } = await supabase
    .from('users')
    .select('*')
    .eq('id', item.assignee_id)
    .single();
}
```

### Response Size Optimization

**Use pagination for large datasets:**

```typescript
async function paginatedQuery(
  req: Request,
  tableName: string,
  userId: string
) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || '50'),
    100 // Max 100 per page
  );

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .range(from, to);

  if (error) throw error;

  return {
    data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}
```

---

## Error Handling

### Consistent Error Format

**Use a consistent error response structure:**

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  message_ar?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

function createErrorResponse(
  code: string,
  message: string,
  messageAr?: string,
  details?: Record<string, any>
): ErrorResponse {
  return {
    code,
    message,
    message_ar: messageAr,
    details,
    timestamp: new Date().toISOString(),
  };
}

// Usage
const error = createErrorResponse(
  'INVALID_INPUT',
  'Invalid assignment ID format',
  'تنسيق معرف التعيين غير صالح',
  { field: 'assignment_id', provided: 'abc123' }
);
```

### HTTP Status Codes

**Use appropriate HTTP status codes:**

```typescript
function sendResponse(
  data: any,
  status: number = 200,
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// Client errors (4xx)
sendResponse(error, 400); // Bad Request - invalid input
sendResponse(error, 401); // Unauthorized - missing/invalid auth
sendResponse(error, 403); // Forbidden - insufficient permissions
sendResponse(error, 404); // Not Found - resource doesn't exist
sendResponse(error, 409); // Conflict - duplicate resource
sendResponse(error, 422); // Unprocessable Entity - validation failed
sendResponse(error, 429); // Too Many Requests - rate limit

// Server errors (5xx)
sendResponse(error, 500); // Internal Server Error
sendResponse(error, 503); // Service Unavailable
```

### Error Recovery & Retry Logic

**Implement retry logic for transient failures:**

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry client errors
      if (error instanceof Response && error.status < 500) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Usage
const result = await retryWithBackoff(async () => {
  return await supabase.from('work_items').select('*');
});
```

### Logging Best Practices

**Log errors with context:**

```typescript
function logError(
  error: Error | unknown,
  context: {
    userId?: string;
    operation: string;
    metadata?: Record<string, any>;
  }
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    operation: context.operation,
    userId: context.userId,
    error: {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    metadata: context.metadata,
  };

  console.error(JSON.stringify(logEntry));

  // In production, send to error tracking service
  // await sendToSentry(logEntry);
}

// Usage
try {
  await processWorkItem(itemId);
} catch (error) {
  logError(error, {
    userId: user.id,
    operation: 'process_work_item',
    metadata: { itemId, itemType: 'commitment' },
  });

  throw error;
}
```

---

## Testing Edge Functions

### Unit Testing

**Test individual functions:**

```typescript
// tests/assignment-detail.test.ts
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { validateAssignmentId } from '../supabase/functions/_shared/security.ts';

Deno.test('validateAssignmentId - valid UUID', () => {
  const result = validateAssignmentId('550e8400-e29b-41d4-a716-446655440000');

  assertEquals(result.valid, true);
  assertEquals(result.id, '550e8400-e29b-41d4-a716-446655440000');
  assertEquals(result.error, undefined);
});

Deno.test('validateAssignmentId - invalid UUID', () => {
  const result = validateAssignmentId('invalid-uuid');

  assertEquals(result.valid, false);
  assertEquals(result.error, 'assignment_id must be a valid UUID');
});

Deno.test('validateAssignmentId - non-string input', () => {
  const result = validateAssignmentId(12345);

  assertEquals(result.valid, false);
  assertEquals(result.error, 'assignment_id must be a string');
});
```

### Integration Testing

**Test Edge Function endpoints:**

```typescript
// tests/assignment-detail-integration.test.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

const FUNCTION_URL = 'http://localhost:54321/functions/v1';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.test('assignment-detail - get assignment', async () => {
  const response = await fetch(
    `${FUNCTION_URL}/assignment-detail?id=550e8400-e29b-41d4-a716-446655440000`,
    {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  assertEquals(response.status, 200);

  const data = await response.json();
  assertEquals(data.id, '550e8400-e29b-41d4-a716-446655440000');
  assertEquals(typeof data.title, 'string');
});

Deno.test('assignment-detail - missing authorization', async () => {
  const response = await fetch(
    `${FUNCTION_URL}/assignment-detail?id=550e8400-e29b-41d4-a716-446655440000`
  );

  assertEquals(response.status, 401);
});
```

### Local Testing

**Run functions locally:**

```bash
# Start local Supabase
supabase start

# Serve specific function
supabase functions serve assignment-detail --env-file .env.local

# Make test request
curl -i http://localhost:54321/functions/v1/assignment-detail?id=550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $ANON_KEY"
```

### Load Testing

**Test performance under load:**

```typescript
// tests/load-test.ts
async function loadTest(
  url: string,
  concurrency: number,
  duration: number
) {
  const results: number[] = [];
  const startTime = Date.now();

  while (Date.now() - startTime < duration) {
    const promises = Array.from({ length: concurrency }, async () => {
      const requestStart = Date.now();

      try {
        await fetch(url, {
          headers: {
            'Authorization': `Bearer ${ANON_KEY}`,
          },
        });

        return Date.now() - requestStart;
      } catch (error) {
        console.error('Request failed:', error);
        return -1;
      }
    });

    const responseTimes = await Promise.all(promises);
    results.push(...responseTimes.filter(t => t > 0));
  }

  // Calculate metrics
  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  const sorted = results.sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  console.log({
    totalRequests: results.length,
    avgResponseTime: avg,
    p50,
    p95,
    p99,
  });
}

// Run: 50 concurrent requests for 30 seconds
await loadTest(
  'http://localhost:54321/functions/v1/unified-work-list',
  50,
  30000
);
```

---

## Mobile-First Considerations

### Response Size Optimization

**Minimize payload for mobile clients:**

```typescript
async function getMobileWorkItems(userId: string) {
  // Mobile-optimized query: fewer columns, smaller joins
  const { data } = await supabase
    .from('work_items')
    .select(`
      id,
      title,
      status,
      priority,
      deadline,
      source,
      assignee:users!assignee_id(id, name)
    `)
    .eq('assignee_id', userId)
    .order('deadline', { ascending: true })
    .limit(20); // Smaller page size for mobile

  return data;
}

Deno.serve(async (req) => {
  const userAgent = req.headers.get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

  if (isMobile) {
    const data = await getMobileWorkItems(userId);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Desktop: full payload
  const data = await getFullWorkItems(userId);
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Offline-First Support

**Include sync metadata for offline clients:**

```typescript
interface SyncableResponse<T> {
  data: T[];
  sync_metadata: {
    last_modified: string;
    sync_token: string;
    has_more: boolean;
  };
}

async function getSyncableWorkItems(
  userId: string,
  lastSyncToken?: string
): Promise<SyncableResponse<WorkItem>> {
  let query = supabase
    .from('work_items')
    .select('*')
    .eq('assignee_id', userId)
    .order('updated_at', { ascending: false })
    .limit(100);

  // Incremental sync
  if (lastSyncToken) {
    query = query.gt('updated_at', lastSyncToken);
  }

  const { data, error } = await query;

  if (error) throw error;

  const lastModified = data[0]?.updated_at || new Date().toISOString();

  return {
    data,
    sync_metadata: {
      last_modified: lastModified,
      sync_token: lastModified, // Use timestamp as sync token
      has_more: data.length === 100,
    },
  };
}
```

### Push Notifications

**Support mobile push notifications:**

```typescript
import { Expo } from 'npm:expo-server-sdk@3';

const expo = new Expo();

async function sendMobilePushNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }
) {
  // Get user's push tokens
  const { data: tokens } = await supabase
    .from('user_push_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('platform', 'expo');

  if (!tokens || tokens.length === 0) {
    return; // User has no push tokens
  }

  const messages = tokens.map(({ token }) => ({
    to: token,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data,
  }));

  // Send in chunks
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push notification tickets:', tickets);
    } catch (error) {
      console.error('Failed to send push notifications:', error);
    }
  }
}
```

---

## RTL & Internationalization

### Language Detection

**Detect user language preference:**

```typescript
function getUserLanguage(req: Request): 'en' | 'ar' {
  // 1. Check query parameter
  const url = new URL(req.url);
  const langParam = url.searchParams.get('lang');
  if (langParam === 'ar' || langParam === 'en') {
    return langParam;
  }

  // 2. Check custom header
  const langHeader = req.headers.get('x-language');
  if (langHeader === 'ar' || langHeader === 'en') {
    return langHeader;
  }

  // 3. Check Accept-Language header
  const acceptLanguage = req.headers.get('accept-language');
  if (acceptLanguage?.includes('ar')) {
    return 'ar';
  }

  // 4. Default to English
  return 'en';
}

Deno.serve(async (req) => {
  const language = getUserLanguage(req);

  // Use language for error messages, notifications, etc.
  const errorMessage = language === 'ar'
    ? 'حدث خطأ أثناء معالجة الطلب'
    : 'An error occurred processing your request';

  // ...
});
```

### Bilingual Error Messages

**Provide errors in both languages:**

```typescript
const ERROR_MESSAGES = {
  INVALID_INPUT: {
    en: 'Invalid input provided',
    ar: 'تم تقديم إدخال غير صالح',
  },
  UNAUTHORIZED: {
    en: 'Authentication required',
    ar: 'المصادقة مطلوبة',
  },
  RATE_LIMIT: {
    en: 'Too many requests. Please try again later.',
    ar: 'طلبات كثيرة جداً. يرجى المحاولة مرة أخرى لاحقاً.',
  },
  NOT_FOUND: {
    en: 'Resource not found',
    ar: 'المورد غير موجود',
  },
};

function createBilingualError(
  code: keyof typeof ERROR_MESSAGES,
  details?: Record<string, any>
) {
  return {
    code,
    message: ERROR_MESSAGES[code].en,
    message_ar: ERROR_MESSAGES[code].ar,
    details,
  };
}

// Usage
return new Response(
  JSON.stringify(createBilingualError('UNAUTHORIZED')),
  {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  }
);
```

### RTL-Aware Sorting

**Handle Arabic text sorting:**

```typescript
function sortBilingual(
  items: Array<{ name_en: string; name_ar: string }>,
  language: 'en' | 'ar'
) {
  return items.sort((a, b) => {
    const nameA = language === 'ar' ? a.name_ar : a.name_en;
    const nameB = language === 'ar' ? b.name_ar : b.name_en;

    return nameA.localeCompare(nameB, language, {
      sensitivity: 'base',
      numeric: true,
    });
  });
}

Deno.serve(async (req) => {
  const language = getUserLanguage(req);

  const { data } = await supabase
    .from('dossiers')
    .select('id, name_en, name_ar, type');

  // Sort in user's language
  const sorted = sortBilingual(data, language);

  return new Response(JSON.stringify(sorted), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Date/Time Formatting

**Format dates according to locale:**

```typescript
function formatDate(
  date: Date | string,
  language: 'en' | 'ar',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Use appropriate calendar and numbering system
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return dateObj.toLocaleDateString(locale, defaultOptions);
}

// Example responses
const deadline = new Date('2024-12-31');

console.log(formatDate(deadline, 'en'));
// Output: December 31, 2024

console.log(formatDate(deadline, 'ar'));
// Output: ٣١ ديسمبر ٢٠٢٤

// Include formatted dates in API response
const response = {
  deadline: deadline.toISOString(),
  deadline_formatted: formatDate(deadline, language),
};
```

### Number Formatting

**Format numbers for Arabic (Eastern Arabic numerals):**

```typescript
function formatNumber(
  num: number,
  language: 'en' | 'ar'
): string {
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  return num.toLocaleString(locale);
}

// Example
console.log(formatNumber(12345, 'en')); // 12,345
console.log(formatNumber(12345, 'ar')); // ١٢٬٣٤٥

// Usage in statistics endpoint
Deno.serve(async (req) => {
  const language = getUserLanguage(req);

  const stats = {
    total_items: 1234,
    total_items_formatted: formatNumber(1234, language),
    completion_rate: 87.5,
    completion_rate_formatted: formatNumber(87.5, language) + '%',
  };

  return new Response(JSON.stringify(stats), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## General Best Practices

### Environment Variables

**Never hardcode secrets:**

```typescript
// ✅ Good: Use environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const redisUrl = Deno.env.get('REDIS_URL')!;

// ❌ Bad: Hardcoded secrets
const apiKey = 'sk-1234567890abcdef';
```

### Request Validation

**Validate HTTP method:**

```typescript
Deno.serve(async (req) => {
  // Only allow specific methods
  if (!['GET', 'POST'].includes(req.method)) {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'GET, POST',
        },
      }
    );
  }

  // Process request
  // ...
});
```

### Resource Cleanup

**Always clean up resources:**

```typescript
import { Redis } from 'npm:ioredis@5';

Deno.serve(async (req) => {
  const redis = new Redis(Deno.env.get('REDIS_URL')!);

  try {
    const result = await redis.get('key');

    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    // Always disconnect
    await redis.quit();
  }
});
```

### Monitoring & Observability

**Add structured logging:**

```typescript
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  operation: string;
  duration_ms?: number;
  user_id?: string;
  metadata?: Record<string, any>;
}

function log(entry: Omit<LogEntry, 'timestamp'>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  }));
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    log({
      level: 'INFO',
      operation: 'work_items_list',
      user_id: userId,
    });

    const result = await getWorkItems(userId);

    log({
      level: 'INFO',
      operation: 'work_items_list',
      duration_ms: Date.now() - startTime,
      user_id: userId,
      metadata: { count: result.length },
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log({
      level: 'ERROR',
      operation: 'work_items_list',
      duration_ms: Date.now() - startTime,
      user_id: userId,
      metadata: { error: String(error) },
    });

    throw error;
  }
});
```

---

## Deployment Checklist

Before deploying Edge Functions to production:

- [ ] All inputs validated and sanitized
- [ ] RLS policies enforced (no service role bypass without justification)
- [ ] Rate limiting implemented
- [ ] Error handling with safe error responses
- [ ] CORS configured for production origins
- [ ] Logging added for debugging and monitoring
- [ ] Tests written and passing
- [ ] Environment variables configured
- [ ] Bilingual error messages (EN/AR)
- [ ] Mobile-optimized responses
- [ ] Performance tested under load
- [ ] Documentation updated

---

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Runtime Documentation](https://deno.land/manual)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Security Best Practices](./security.md)
- [Edge Functions Reference](./edge-functions-reference.md)

---

*For questions or support, contact: api-support@gastat.gov.sa*
