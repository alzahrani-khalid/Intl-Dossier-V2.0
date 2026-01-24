# Migration Guide: From Source Code to API Reference

## Overview

This guide helps developers transition from reading Edge Function source code directly to using the new comprehensive API reference documentation. If you've been navigating the `supabase/functions` directory to understand endpoints, parameters, and response formats, this guide will show you how to efficiently use the new documentation structure.

## Table of Contents

1. [Why Migrate to Documentation?](#why-migrate-to-documentation)
2. [Finding Your Functions](#finding-your-functions)
3. [Before & After Examples](#before--after-examples)
4. [Understanding the Documentation Structure](#understanding-the-documentation-structure)
5. [Quick Reference Mapping](#quick-reference-mapping)
6. [Deprecation Notices](#deprecation-notices)
7. [Migration Checklist](#migration-checklist)

---

## Why Migrate to Documentation?

### Previous Workflow (Reading Source Code)

```bash
# Old way: Search through 285 function files
cd supabase/functions
grep -r "positions-create" .
cat positions-create/index.ts  # Read implementation
cat _shared/validation-schemas.ts  # Check schemas
cat _shared/auth.ts  # Understand auth requirements
```

**Pain points:**
- ❌ No overview of available functions
- ❌ Must understand TypeScript implementation
- ❌ No clear request/response examples
- ❌ Authentication patterns buried in code
- ❌ Rate limits and caching not documented
- ❌ No bilingual error message reference

### New Workflow (Using API Reference)

```bash
# New way: Navigate organized documentation
docs/api/edge-functions-reference.md  # Overview of all 285 functions
docs/api/categories/positions.md       # Category-specific endpoints
docs/api/examples/typescript-examples.md  # Implementation examples
docs/api/best-practices.md             # Security, performance, testing
```

**Benefits:**
- ✅ Comprehensive overview of all 285 functions
- ✅ Clear request/response schemas with examples
- ✅ TypeScript implementation patterns
- ✅ Authentication requirements documented
- ✅ Rate limits, caching, and performance guidance
- ✅ Bilingual error messages (EN/AR)
- ✅ Mobile-first and RTL considerations

---

## Finding Your Functions

### Step 1: Identify Your Use Case

**I need to...**

| Use Case | Documentation File | Category |
|----------|-------------------|----------|
| Manage position papers | [positions.md](./categories/positions.md) | Positions Management |
| Handle service requests | [intake.md](./categories/intake.md) | Service Intake & Tickets |
| Create/assign tasks | [assignments.md](./categories/assignments.md) | Assignments & Tasks |
| Manage country/org data | [dossiers.md](./categories/dossiers.md) | Dossiers |
| Track commitments | [after-actions.md](./categories/after-actions.md) | After Action Records |
| Schedule meetings | [engagements.md](./categories/engagements.md) | Engagements & Meetings |
| Upload/manage files | [documents.md](./categories/documents.md) | Documents |
| Search across entities | [search.md](./categories/search.md) | Search & Discovery |
| Manage calendar events | [calendar.md](./categories/calendar.md) | Calendar & Scheduling |
| Send notifications | [notifications.md](./categories/notifications.md) | Notifications & Messaging |
| Use AI/ML features | [ai-services.md](./categories/ai-services.md) | AI & Machine Learning |
| Automate workflows | [workflow.md](./categories/workflow.md) | Workflow Automation |
| Gather intelligence | [intelligence.md](./categories/intelligence.md) | Intelligence & Signals |
| Handle attachments | [attachments.md](./categories/attachments.md) | Attachments |

### Step 2: Search the Main Reference

The [edge-functions-reference.md](./edge-functions-reference.md) provides:
- Overview of all 285 functions across 27 categories
- Quick reference table of top 50 most-used functions
- Direct links to category documentation
- Common patterns and authentication guide

**Quick search:**
```bash
# Find any function by name
grep -i "function-name" docs/api/edge-functions-reference.md

# Find all functions in a category
grep -A 5 "positions.md" docs/api/edge-functions-reference.md
```

### Step 3: Browse Category Documentation

Each category file provides:
- **Overview**: Purpose and scope of the category
- **Endpoints**: All available functions with methods (GET/POST/PUT/DELETE)
- **Request Schemas**: Required and optional parameters
- **Response Schemas**: Success and error responses
- **Implementation Examples**: TypeScript code snippets
- **Authentication**: Requirements and patterns
- **Related APIs**: Cross-references to other categories

---

## Before & After Examples

### Example 1: Creating a Position

**❌ Before (Reading Source Code)**

```bash
# Step 1: Find the function file
cd supabase/functions/positions-create
cat index.ts

# Step 2: Understand the request schema
# Read through TypeScript types and validation
interface CreatePositionRequest {
  position_type_id: string;
  title_en: string;
  title_ar: string;
  // ... many more fields
}

# Step 3: Figure out authentication
# Search for auth patterns in _shared/
cat ../\_shared/auth.ts

# Step 4: Test and debug
# Trial and error with different payloads
```

**✅ After (Using Documentation)**

1. Open [positions.md](./categories/positions.md)
2. Find "Create Position" section
3. Copy request schema and example:

```typescript
const createPosition = async (positionData: CreatePositionRequest) => {
  const { data, error } = await supabase.functions.invoke('positions-create', {
    body: {
      position_type_id: positionData.typeId,
      title_en: positionData.titleEn,
      title_ar: positionData.titleAr,
      content_en: positionData.contentEn,
      content_ar: positionData.contentAr,
      audience_groups: positionData.audienceGroups
    }
  });

  if (error) {
    // Handle bilingual error messages
    throw new Error(error.error_ar || error.error);
  }

  return data;
};
```

**Time saved:** 30-45 minutes → 2-3 minutes

---

### Example 2: Implementing Pagination

**❌ Before (Reading Source Code)**

```bash
# Search multiple files to understand pagination
grep -r "pagination" supabase/functions/
grep -r "cursor" supabase/functions/
grep -r "limit" supabase/functions/

# Read different implementations
cat supabase/functions/positions-list/index.ts
cat supabase/functions/intake-list/index.ts
# Find inconsistent pagination patterns...
```

**✅ After (Using Documentation)**

1. Open [typescript-examples.md](./examples/typescript-examples.md)
2. Find "Pagination" section
3. Choose between cursor-based or offset-based:

**Cursor-based (recommended for large datasets):**
```typescript
const fetchAllPositions = async () => {
  let cursor: string | null = null;
  const allData = [];

  do {
    const { data, error } = await supabase.functions.invoke('positions-list', {
      body: {
        limit: 100,
        cursor
      }
    });

    if (error) throw error;

    allData.push(...data.items);
    cursor = data.next_cursor;
  } while (cursor);

  return allData;
};
```

**Time saved:** 1-2 hours → 5 minutes

---

### Example 3: Understanding Authentication

**❌ Before (Reading Source Code)**

```bash
# Search for auth patterns across functions
grep -r "Authorization" supabase/functions/
grep -r "getUser" supabase/functions/
grep -r "JWT" supabase/functions/

# Read _shared/auth.ts to understand validation
cat supabase/functions/_shared/auth.ts

# Test different token formats...
```

**✅ After (Using Documentation)**

1. Open [edge-functions-reference.md](./edge-functions-reference.md#authentication)
2. Copy frontend authentication setup:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zkrcjzdemdmwhearhfgg.supabase.co',
  'your-anon-key'
);

// After user signs in
const { data: { session } } = await supabase.auth.getSession();

// Call any Edge Function (authentication handled automatically)
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* your payload */ }
});
```

**Time saved:** 1 hour → 2 minutes

---

## Understanding the Documentation Structure

### Documentation Hierarchy

```
docs/api/
├── edge-functions-reference.md    # Main index (start here!)
├── README.md                       # API overview + navigation
├── best-practices.md              # Security, performance, testing
├── migration-guide.md             # This file
├── openapi.yaml                   # OpenAPI 3.0 specification
│
├── categories/                    # 14 category files
│   ├── positions.md               # Positions Management (23 functions)
│   ├── intake.md                  # Service Intake (19 functions)
│   ├── assignments.md             # Assignments (18 functions)
│   ├── dossiers.md                # Dossiers (29 functions)
│   ├── after-actions.md           # After Actions (9 functions)
│   ├── engagements.md             # Engagements (15 functions)
│   ├── documents.md               # Documents (12 functions)
│   ├── search.md                  # Search (10 functions)
│   ├── calendar.md                # Calendar (8 functions)
│   ├── attachments.md             # Attachments (5 functions)
│   ├── ai-services.md             # AI/ML (13 functions)
│   ├── workflow.md                # Workflow (7 functions)
│   ├── notifications.md           # Notifications (10 functions)
│   └── intelligence.md            # Intelligence (5 functions)
│
└── examples/                      # Usage examples
    ├── typescript-examples.md     # Auth, errors, pagination, files
    └── frontend-integration.md    # TanStack Query, React patterns
```

### Category File Structure

Each category file follows this template:

```markdown
# Category Name

## Overview
- Purpose and scope
- Key features
- Related categories

## Endpoints

### Function Name
- Endpoint: POST/GET/PUT/DELETE /function-name
- Request Body: JSON schema with examples
- Response: Success and error schemas
- Implementation Example: TypeScript code
- Authentication: Requirements
- Related APIs: Cross-references

[Repeat for each function in category]
```

### Finding What You Need

| Information | Location |
|-------------|----------|
| **All available functions** | [edge-functions-reference.md](./edge-functions-reference.md) → Function Categories |
| **Function by name** | Use search in edge-functions-reference.md or category files |
| **Request/response schemas** | Category files → Specific endpoint section |
| **TypeScript examples** | Category files + [typescript-examples.md](./examples/typescript-examples.md) |
| **Authentication setup** | [edge-functions-reference.md](./edge-functions-reference.md#authentication) |
| **Error handling** | [best-practices.md](./best-practices.md#error-handling) |
| **Pagination patterns** | [typescript-examples.md](./examples/typescript-examples.md#pagination) |
| **File uploads** | [typescript-examples.md](./examples/typescript-examples.md#file-uploads) |
| **Real-time subscriptions** | [typescript-examples.md](./examples/typescript-examples.md#real-time-subscriptions) |
| **TanStack Query integration** | [frontend-integration.md](./examples/frontend-integration.md) |
| **Security best practices** | [best-practices.md](./best-practices.md#security-best-practices) |
| **Performance optimization** | [best-practices.md](./best-practices.md#performance-optimization) |
| **Testing Edge Functions** | [best-practices.md](./best-practices.md#testing-edge-functions) |
| **Mobile-first patterns** | [best-practices.md](./best-practices.md#mobile-first-considerations) |
| **RTL/i18n support** | [best-practices.md](./best-practices.md#rtl--internationalization) |
| **OpenAPI spec** | [openapi.yaml](./openapi.yaml) |

---

## Quick Reference Mapping

### Common Source Code Locations → Documentation

| Source Code Path | New Documentation |
|------------------|-------------------|
| `supabase/functions/positions-*` | [categories/positions.md](./categories/positions.md) |
| `supabase/functions/intake-*` | [categories/intake.md](./categories/intake.md) |
| `supabase/functions/assignments-*` | [categories/assignments.md](./categories/assignments.md) |
| `supabase/functions/dossier-*` | [categories/dossiers.md](./categories/dossiers.md) |
| `supabase/functions/after-action-*` | [categories/after-actions.md](./categories/after-actions.md) |
| `supabase/functions/engagement-*` | [categories/engagements.md](./categories/engagements.md) |
| `supabase/functions/document-*` | [categories/documents.md](./categories/documents.md) |
| `supabase/functions/search-*` | [categories/search.md](./categories/search.md) |
| `supabase/functions/calendar-*` | [categories/calendar.md](./categories/calendar.md) |
| `supabase/functions/attachment-*` | [categories/attachments.md](./categories/attachments.md) |
| `supabase/functions/ai-*` | [categories/ai-services.md](./categories/ai-services.md) |
| `supabase/functions/workflow-*` | [categories/workflow.md](./categories/workflow.md) |
| `supabase/functions/notification-*` | [categories/notifications.md](./categories/notifications.md) |
| `supabase/functions/_shared/auth.ts` | [edge-functions-reference.md#authentication](./edge-functions-reference.md#authentication) |
| `supabase/functions/_shared/validation-schemas.ts` | Category files → Request/Response schemas |
| `supabase/functions/_shared/rate-limit.ts` | [best-practices.md#performance-optimization](./best-practices.md#performance-optimization) |
| `supabase/functions/_shared/security.ts` | [best-practices.md#security-best-practices](./best-practices.md#security-best-practices) |

---

## Deprecation Notices

### Legacy Patterns to Avoid

#### 1. Direct RPC Calls (Use Edge Functions Instead)

**❌ Deprecated:**
```typescript
// Old pattern: Direct RPC calls
const { data } = await supabase.rpc('get_user_positions', {
  user_id: userId
});
```

**✅ New Pattern:**
```typescript
// Use documented Edge Function
const { data } = await supabase.functions.invoke('positions-list', {
  body: { user_id: userId }
});
```

**Reason:** Edge Functions provide:
- Better error handling with bilingual messages
- Rate limiting and caching
- Comprehensive validation
- Consistent response formats

---

#### 2. Service Role Key in Frontend

**❌ Deprecated:**
```typescript
// NEVER do this in frontend code!
const supabase = createClient(
  supabaseUrl,
  serviceRoleKey  // Bypasses RLS, major security risk!
);
```

**✅ New Pattern:**
```typescript
// Use anon key in frontend (RLS enforced)
const supabase = createClient(
  supabaseUrl,
  anonKey
);
```

See [best-practices.md#security-best-practices](./best-practices.md#security-best-practices) for details.

---

#### 3. Custom Pagination Logic

**❌ Deprecated:**
```typescript
// Old pattern: Manual pagination with offset/limit
const { data } = await supabase
  .from('positions')
  .select('*')
  .range(offset, offset + limit - 1);
```

**✅ New Pattern:**
```typescript
// Use Edge Function cursor-based pagination
const { data } = await supabase.functions.invoke('positions-list', {
  body: {
    limit: 100,
    cursor: nextCursor
  }
});
```

See [typescript-examples.md#pagination](./examples/typescript-examples.md#pagination) for implementation.

---

#### 4. Inconsistent Error Handling

**❌ Deprecated:**
```typescript
// Old pattern: Inconsistent error messages
if (error) {
  throw new Error('Something went wrong');
}
```

**✅ New Pattern:**
```typescript
// Use bilingual error messages from Edge Functions
if (error) {
  // Edge Functions return both EN and AR messages
  const message = i18n.language === 'ar' ? error.error_ar : error.error;
  throw new Error(message);
}
```

See [best-practices.md#error-handling](./best-practices.md#error-handling) for patterns.

---

#### 5. Missing Rate Limit Handling

**❌ Deprecated:**
```typescript
// Old pattern: No rate limit awareness
const response = await fetch('/api/endpoint');
```

**✅ New Pattern:**
```typescript
// Handle rate limits with exponential backoff
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
};
```

See [typescript-examples.md#error-handling](./examples/typescript-examples.md#error-handling) for implementation.

---

## Migration Checklist

Use this checklist to migrate your codebase from source-code-based understanding to documentation-based development:

### Phase 1: Discovery (Week 1)

- [ ] Read [edge-functions-reference.md](./edge-functions-reference.md) for overview
- [ ] Identify all Edge Functions your team currently uses
- [ ] Map each function to its category documentation
- [ ] Bookmark relevant category files for quick access
- [ ] Review [best-practices.md](./best-practices.md) for security and performance patterns

### Phase 2: Update Development Workflow (Week 2)

- [ ] Update team onboarding docs to reference API documentation
- [ ] Create internal wiki/knowledge base linking to category files
- [ ] Set up IDE bookmarks for frequently used category docs
- [ ] Update code review checklist to verify against documentation patterns
- [ ] Train team on using documentation for new feature development

### Phase 3: Code Modernization (Weeks 3-4)

- [ ] Audit codebase for deprecated patterns (see Deprecation Notices above)
- [ ] Replace direct RPC calls with documented Edge Functions
- [ ] Implement cursor-based pagination where needed
- [ ] Add bilingual error handling to all Edge Function calls
- [ ] Implement rate limit handling with exponential backoff
- [ ] Update TypeScript types to match documented schemas

### Phase 4: Testing & Validation (Week 5)

- [ ] Test all Edge Function integrations against documented examples
- [ ] Verify authentication patterns match [edge-functions-reference.md#authentication](./edge-functions-reference.md#authentication)
- [ ] Validate error handling produces bilingual messages
- [ ] Test pagination with large datasets
- [ ] Verify mobile-first responsive behavior
- [ ] Test RTL layout for Arabic language support

### Phase 5: Documentation & Maintenance (Ongoing)

- [ ] Update internal API documentation to link to official docs
- [ ] Create team-specific examples for common use cases
- [ ] Set up alerts for new Edge Function documentation updates
- [ ] Contribute feedback on documentation gaps or errors
- [ ] Share migration success stories with team

---

## Getting Help

### Documentation Issues

Found an error or gap in documentation?

1. **Check for updates:** Documentation is versioned with the codebase
2. **Search existing issues:** GitHub Issues → Filter by `documentation` label
3. **File a new issue:** Provide specific function name and expected vs. actual documentation

### Implementation Questions

Need help implementing an Edge Function?

1. **Check examples first:** [typescript-examples.md](./examples/typescript-examples.md) and [frontend-integration.md](./examples/frontend-integration.md)
2. **Review best practices:** [best-practices.md](./best-practices.md)
3. **Search category docs:** Use Cmd+F to search within category files
4. **Ask the team:** Internal Slack #api-development channel

### Performance or Security Concerns

Experiencing issues with rate limiting, caching, or security?

1. **Review patterns:** [best-practices.md](./best-practices.md)
2. **Check RLS policies:** Verify database policies match documented access patterns
3. **Enable verbose logging:** Use `?verbose=true` query parameter during development
4. **Contact security team:** For potential vulnerabilities

---

## Success Metrics

Track these metrics to measure successful migration:

| Metric | Before (Source Code) | Target (Documentation) |
|--------|----------------------|------------------------|
| **Time to find endpoint** | 15-30 minutes | 2-3 minutes |
| **Time to understand request schema** | 30-45 minutes | 5 minutes |
| **Time to implement pagination** | 1-2 hours | 15 minutes |
| **Time to debug auth issues** | 1-3 hours | 10 minutes |
| **Onboarding new developer** | 2-3 weeks | 3-5 days |
| **Code review time** | 45-60 minutes | 15-20 minutes |

---

## Conclusion

Migrating from reading source code to using comprehensive API documentation will significantly improve your development velocity, reduce bugs, and improve code quality. The documentation provides not just endpoint references, but also:

✅ **Security best practices** to prevent vulnerabilities
✅ **Performance patterns** for rate limiting and caching
✅ **Bilingual support** for English/Arabic
✅ **Mobile-first patterns** for responsive design
✅ **RTL considerations** for Arabic layout
✅ **Testing strategies** for Edge Functions

**Next Steps:**

1. Start with [edge-functions-reference.md](./edge-functions-reference.md)
2. Bookmark your most-used category files
3. Follow the [Migration Checklist](#migration-checklist)
4. Share feedback to improve documentation

Happy coding! 🚀
