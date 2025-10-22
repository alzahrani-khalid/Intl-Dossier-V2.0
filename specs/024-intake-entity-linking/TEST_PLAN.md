# Test Plan: Feature 024 - Intake Entity Linking

**Status**: Infrastructure Complete | Tests In Progress  
**Created**: 2025-10-17  
**Test Coverage Target**: 80% lines, 80% functions, 75% branches

---

## Executive Summary

This document outlines the comprehensive test plan for the intake entity linking feature. The test infrastructure has been set up and is ready for test implementation.

### Infrastructure Status ✅

**Completed**:
- ✅ Vitest configuration (`backend/vitest.config.ts`)
- ✅ Test directory structure (`tests/{contract,integration,utils}`)
- ✅ Test setup file (`tests/setup.ts`)
- ✅ Test helper utilities (`tests/utils/testHelpers.ts`)

**Test Helper Functions Available**:
- `getTestSupabaseClient()` - Initialize test Supabase client
- `createTestUser(clearanceLevel, organizationId)` - Create test user with profile
- `createTestIntake(organizationId, overrides)` - Create test intake ticket
- `createTestEntity(entityType, organizationId, overrides)` - Create test entity
- `createTestLink(...)` - Create test entity link
- `cleanupTestData(entityIds)` - Clean up test data after tests
- `generateMockJWT(userId, clearanceLevel, organizationId)` - Mock JWT tokens

---

## 1. Backend Contract Tests (12 Endpoints)

**Location**: `backend/tests/contract/`  
**Purpose**: Test API endpoints for correct HTTP behavior, validation, and error handling  
**Framework**: Vitest + Supertest

### 1.1 User Story 1: Manual Entity Linking (5 tests)

#### Test File: `intake-links-api.test.ts`

```typescript
/**
 * Contract Tests: Intake Entity Links API
 * Tests: POST/GET/PUT/DELETE/RESTORE entity links
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestUser, createTestIntake, createTestEntity, cleanupTestData } from '../utils/testHelpers';

describe('POST /api/intake/:intake_id/links', () => {
  let testData: any;

  beforeEach(async () => {
    const user = await createTestUser(3);
    const intake = await createTestIntake(user.organizationId);
    const dossier = await createTestEntity('dossier', user.organizationId);
    
    testData = { user, intake, dossier };
  });

  afterEach(async () => {
    await cleanupTestData({
      userIds: [testData.user.userId],
      intakeIds: [testData.intake.id],
      organizationIds: [testData.user.organizationId],
    });
  });

  it('should create a primary link successfully', async () => {
    const response = await request(app)
      .post(`/api/intake/${testData.intake.id}/links`)
      .set('Authorization', `Bearer ${testData.user.token}`)
      .send({
        entity_id: testData.dossier.id,
        entity_type: 'dossier',
        link_type: 'primary',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.entity_type).toBe('dossier');
    expect(response.body.link_type).toBe('primary');
  });

  it('should reject duplicate primary link', async () => {
    // Create first primary link
    await request(app)
      .post(`/api/intake/${testData.intake.id}/links`)
      .set('Authorization', `Bearer ${testData.user.token}`)
      .send({
        entity_id: testData.dossier.id,
        entity_type: 'dossier',
        link_type: 'primary',
      });

    // Try to create second primary link
    const response = await request(app)
      .post(`/api/intake/${testData.intake.id}/links`)
      .set('Authorization', `Bearer ${testData.user.token}`)
      .send({
        entity_id: testData.dossier.id,
        entity_type: 'dossier',
        link_type: 'primary',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('DUPLICATE_PRIMARY_LINK');
  });

  it('should enforce clearance level validation', async () => {
    // Create high-classification dossier
    const highSecDossier = await createTestEntity('dossier', testData.user.organizationId, {
      classification_level: 5,
    });

    // Low-clearance user tries to link
    const lowClearanceUser = await createTestUser(2, testData.user.organizationId);

    const response = await request(app)
      .post(`/api/intake/${testData.intake.id}/links`)
      .set('Authorization', `Bearer ${lowClearanceUser.token}`)
      .send({
        entity_id: highSecDossier.id,
        entity_type: 'dossier',
        link_type: 'primary',
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('INSUFFICIENT_CLEARANCE');
  });

  it('should enforce organization boundaries', async () => {
    // Create entity in different organization
    const otherUser = await createTestUser(3);
    const otherDossier = await createTestEntity('dossier', otherUser.organizationId);

    const response = await request(app)
      .post(`/api/intake/${testData.intake.id}/links`)
      .set('Authorization', `Bearer ${testData.user.token}`)
      .send({
        entity_id: otherDossier.id,
        entity_type: 'dossier',
        link_type: 'primary',
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('ORGANIZATION_MISMATCH');
  });

  it('should reject invalid link type for entity type', async () => {
    const position = await createTestEntity('position', testData.user.organizationId);

    const response = await request(app)
      .post(`/api/intake/${testData.intake.id}/links`)
      .set('Authorization', `Bearer ${testData.user.token}`)
      .send({
        entity_id: position.id,
        entity_type: 'position',
        link_type: 'primary', // Invalid: position can't be primary
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('INVALID_LINK_TYPE');
  });
});

describe('GET /api/intake/:intake_id/links', () => {
  // Test: Get all links for an intake
  // Test: Include/exclude deleted links
  // Test: Return links in correct order (link_order)
});

describe('PUT /api/intake/:intake_id/links/:link_id', () => {
  // Test: Update link notes successfully
  // Test: Optimistic locking (version conflict)
  // Test: Update link_order
});

describe('DELETE /api/intake/:intake_id/links/:link_id', () => {
  // Test: Soft delete link successfully
  // Test: Cannot delete already deleted link
});

describe('POST /api/intake/:intake_id/links/:link_id/restore', () => {
  // Test: Restore deleted link successfully
  // Test: Cannot restore active link
});
```

### 1.2 User Story 2: AI Suggestions (2 tests)

#### Test File: `ai-suggestions-api.test.ts`

```typescript
/**
 * Contract Tests: AI Suggestions API
 * Tests: POST suggestions, POST accept
 */

describe('POST /api/intake/:intake_id/links/suggestions', () => {
  it('should generate AI suggestions successfully', async () => {
    // Mock AnythingLLM API response
    // Verify suggestions returned with confidence scores
    // Verify filtering by clearance and organization
  });

  it('should handle AI service unavailable gracefully', async () => {
    // Mock AnythingLLM API timeout/failure
    // Expect 503 status with fallback instructions
  });

  it('should enforce rate limiting (3 req/min)', async () => {
    // Make 3 requests rapidly
    // 4th request should return 429 Too Many Requests
  });
});

describe('POST /api/intake/:intake_id/links/suggestions/accept', () => {
  it('should accept suggestion and create link', async () => {
    // Accept AI suggestion
    // Verify link created with source='ai'
    // Verify suggestion marked as accepted
  });
});
```

### 1.3 User Story 3: Batch Operations (1 test)

#### Test File: `batch-links-api.test.ts`

```typescript
describe('POST /api/intake/:intake_id/links/batch', () => {
  it('should create 50 links in <500ms (SC-003)', async () => {
    const startTime = Date.now();
    
    const links = Array.from({ length: 50 }, (_, i) => ({
      entity_id: testEntities[i].id,
      entity_type: 'dossier',
      link_type: 'supporting',
    }));

    const response = await request(app)
      .post(`/api/intake/${testData.intake.id}/links/batch`)
      .send({ links });

    const duration = Date.now() - startTime;
    
    expect(response.status).toBe(201);
    expect(response.body.succeeded).toHaveLength(50);
    expect(response.body.failed).toHaveLength(0);
    expect(duration).toBeLessThan(500); // SC-003
  });

  it('should handle partial failures gracefully', async () => {
    // Include mix of valid and invalid links
    // Verify succeeded array has valid links
    // Verify failed array has error details
  });

  it('should enforce max batch size (50 links)', async () => {
    // Try to create 51 links
    // Expect 400 Bad Request
  });
});
```

### 1.4 User Story 4: Reverse Lookup (1 test)

#### Test File: `reverse-lookup-api.test.ts`

```typescript
describe('GET /api/entities/:entity_type/:entity_id/intakes', () => {
  it('should return linked intakes in <2s for 1000+ intakes (SC-004)', async () => {
    // Create 1000 intake tickets
    // Link all to test dossier
    
    const startTime = Date.now();

    const response = await request(app)
      .get(`/api/entities/dossier/${testDossier.id}/intakes`)
      .query({ page: 1, limit: 50 });

    const duration = Date.now() - startTime;

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(50);
    expect(response.body.pagination.total_items).toBe(1000);
    expect(duration).toBeLessThan(2000); // SC-004
  });

  it('should filter by link type', async () => {
    // Create links with different link types
    // Filter by link_type query parameter
    // Verify only matching links returned
  });

  it('should enforce clearance level filtering', async () => {
    // Create intakes with various classification levels
    // User with clearance_level=2 requests
    // Verify only intakes with classification_level <= 2 returned
  });
});
```

### 1.5 User Story 5: Reordering (1 test)

#### Test File: `reorder-links-api.test.ts`

```typescript
describe('PUT /api/intake/:intake_id/links/reorder', () => {
  it('should reorder links successfully', async () => {
    // Create 5 links with link_order 1-5
    // Reorder to [3, 1, 5, 2, 4]
    // Verify new order persisted
  });

  it('should reject reordering links from different intake', async () => {
    // Try to reorder link from different intake
    // Expect 400 Bad Request
  });
});
```

### 1.6 Supporting Endpoints (2 tests)

#### Test File: `entity-search-api.test.ts`

```typescript
describe('GET /api/entities/search', () => {
  it('should search entities with fuzzy matching', async () => {
    // Create entities with similar names
    // Search with partial query
    // Verify fuzzy matches returned
  });

  it('should filter by entity_types', async () => {
    // Search with entity_types=['dossier', 'position']
    // Verify only matching entity types returned
  });
});
```

#### Test File: `audit-log-api.test.ts`

```typescript
describe('GET /api/intake/:intake_id/links/:link_id/audit-log', () => {
  it('should return audit trail for link', async () => {
    // Create link
    // Update link
    // Delete link
    // Restore link
    // Verify 4 audit log entries with correct actions
  });
});
```

---

## 2. Backend Integration Tests (7 Workflows)

**Location**: `backend/tests/integration/`  
**Purpose**: Test complex workflows and service interactions  
**Framework**: Vitest

### 2.1 Test Files

#### `ai-extraction-workflow.test.ts`
```typescript
describe('AI Extraction Workflow', () => {
  it('should extract entities from intake content and generate suggestions', async () => {
    // Create intake with rich content
    // Trigger AI extraction
    // Verify embeddings created
    // Verify suggestions generated
    // Verify confidence scores calculated
  });

  it('should handle embedding generation failures gracefully', async () => {
    // Mock embedding API failure
    // Verify fallback behavior
  });
});
```

#### `link-migration.test.ts`
```typescript
describe('Link Migration Safety', () => {
  it('should migrate links with data integrity', async () => {
    // Create legacy link structure
    // Run migration service
    // Verify all links migrated
    // Verify audit trail preserved
    // Verify rollback capability
  });
});
```

#### `bulk-operations-performance.test.ts`
```typescript
describe('Bulk Operations Performance', () => {
  it('should handle 50 concurrent link creations', async () => {
    // Create 50 links concurrently
    // Verify no race conditions
    // Verify link_order correctly assigned
  });
});
```

#### `clearance-enforcement.test.ts`
```typescript
describe('Clearance Level Enforcement', () => {
  it('should prevent access to high-classification entities', async () => {
    // Create entities with various classification levels
    // User with low clearance attempts access
    // Verify access denied
  });
});
```

#### `organization-boundaries.test.ts`
```typescript
describe('Organization Boundary Enforcement', () => {
  it('should prevent cross-organization linking', async () => {
    // Create entities in Org A and Org B
    // User from Org A attempts to link to Org B entity
    // Verify access denied
  });
});
```

#### `optimistic-locking.test.ts`
```typescript
describe('Optimistic Locking Conflicts', () => {
  it('should detect concurrent updates and return version conflict', async () => {
    // User A fetches link (version 1)
    // User B updates link (version 2)
    // User A attempts update with version 1
    // Verify 409 Conflict error
  });
});
```

#### `vector-similarity-search.test.ts`
```typescript
describe('Vector Similarity Search', () => {
  it('should find semantically similar entities', async () => {
    // Create entities with embeddings
    // Generate query embedding
    // Perform vector search
    // Verify relevant results returned in order
  });
});
```

---

## 3. Frontend Component Tests (8 Components/Hooks)

**Location**: `frontend/tests/component/`  
**Purpose**: Test React components and hooks in isolation  
**Framework**: Vitest + React Testing Library

### 3.1 Test Files

#### `EntityLinkManager.test.tsx`
```typescript
describe('EntityLinkManager', () => {
  it('should render link list', async () => {
    // Mock API response with links
    // Render component
    // Verify links displayed
  });

  it('should create new link via dialog', async () => {
    // Click "Add Link" button
    // Fill in entity search
    // Select entity
    // Choose link type
    // Click "Create"
    // Verify link created
  });

  it('should update link notes', async () => {
    // Click edit icon on link
    // Update notes field
    // Click save
    // Verify optimistic update
    // Verify API call made
  });

  it('should delete link with confirmation', async () => {
    // Click delete icon
    // Verify confirmation dialog shown
    // Click confirm
    // Verify link removed from UI
    // Verify API call made
  });
});
```

#### `AISuggestionPanel.test.tsx`
```typescript
describe('AISuggestionPanel', () => {
  it('should show loading state while generating suggestions', async () => {
    // Click "Get AI Suggestions"
    // Verify loading spinner shown
    // Verify loading text displayed
  });

  it('should display suggestions with confidence scores', async () => {
    // Mock AI API response
    // Render panel
    // Verify suggestions displayed
    // Verify confidence badges shown
  });

  it('should handle AI service unavailable gracefully', async () => {
    // Mock 503 response
    // Click "Get AI Suggestions"
    // Verify fallback message shown
    // Verify manual search button displayed
  });

  it('should accept suggestion and create link', async () => {
    // Click "Accept" on suggestion
    // Verify link created
    // Verify suggestion removed from list
  });
});
```

#### `EntitySearchDialog.test.tsx`
```typescript
describe('EntitySearchDialog', () => {
  it('should search entities by query', async () => {
    // Type "Saudi Arabia" in search
    // Verify debounced API call
    // Verify results displayed
  });

  it('should filter by entity types', async () => {
    // Select "Dossiers" filter
    // Verify only dossiers shown
  });

  it('should handle no results', async () => {
    // Search for non-existent entity
    // Verify "No results" message shown
  });
});
```

#### `LinkCard.test.tsx`
```typescript
describe('LinkCard', () => {
  it('should display link information', async () => {
    // Render link card
    // Verify entity name shown
    // Verify link type badge shown
    // Verify created date shown
  });

  it('should show actions on hover', async () => {
    // Hover over card
    // Verify edit/delete buttons appear
  });
});
```

#### `use-ai-suggestions.test.ts`
```typescript
describe('useAISuggestions', () => {
  it('should fetch suggestions on mount', async () => {
    // Render hook
    // Verify API called
    // Verify suggestions returned
  });

  it('should use cached suggestions (1 minute)', async () => {
    // First call
    // Second call within 1 minute
    // Verify API called only once
  });

  it('should not retry on 503 error', async () => {
    // Mock 503 response
    // Render hook
    // Verify no retry attempted
  });
});
```

#### `use-entity-links.test.ts`
```typescript
describe('useEntityLinks', () => {
  it('should create link with optimistic update', async () => {
    // Call createLink mutation
    // Verify UI updated immediately
    // Verify API call in progress
    // Verify final state after API response
  });

  it('should rollback on error', async () => {
    // Mock API error
    // Call createLink mutation
    // Verify optimistic update
    // Verify rollback after error
  });
});
```

#### `use-link-reorder.test.ts`
```typescript
describe('useLinkReorder', () => {
  it('should reorder links via drag and drop', async () => {
    // Mock DnD event
    // Call reorder mutation
    // Verify link_order updated
  });
});
```

#### `use-bulk-selection.test.ts`
```typescript
describe('useBulkSelection', () => {
  it('should select multiple items', async () => {
    // Select items
    // Verify selection state
  });

  it('should bulk create links', async () => {
    // Select multiple entities
    // Call bulkCreate
    // Verify all links created
  });
});
```

---

## 4. E2E Tests with Playwright (5 User Stories)

**Location**: `frontend/tests/e2e/`  
**Purpose**: Test complete user workflows in browser  
**Framework**: Playwright

### 4.1 Test Files

#### `manual-linking.spec.ts`
```typescript
test('US1: User creates primary dossier link manually', async ({ page }) => {
  // 1. Navigate to intake detail page
  // 2. Click "Add Link" button
  // 3. Search for "Saudi Arabia Relations"
  // 4. Select dossier from results
  // 5. Choose "Primary" link type
  // 6. Click "Create Link"
  // 7. Verify link appears in list
  // 8. Verify primary badge shown
  // 9. Verify toast notification displayed
});

test('US1: User updates link notes', async ({ page }) => {
  // Update link notes workflow
});

test('US1: User deletes link with confirmation', async ({ page }) => {
  // Delete link workflow
});
```

#### `ai-suggestions.spec.ts`
```typescript
test('US2: User generates AI suggestions and accepts one', async ({ page }) => {
  // 1. Click "Get AI Suggestions" button
  // 2. Wait for loading (max 3 seconds)
  // 3. Verify 3-5 suggestions displayed
  // 4. Verify confidence scores shown
  // 5. Click "Accept" on first suggestion
  // 6. Verify link created
  // 7. Verify suggestion removed from panel
});

test('US2: User handles AI service unavailable', async ({ page }) => {
  // AI fallback workflow
});
```

#### `bulk-actions.spec.ts`
```typescript
test('US3: User creates multiple links in batch', async ({ page }) => {
  // Batch creation workflow
});
```

#### `reverse-lookup.spec.ts`
```typescript
test('US4: User views all intakes linked to dossier', async ({ page }) => {
  // Reverse lookup workflow
});
```

#### `drag-and-drop-reorder.spec.ts`
```typescript
test('US5: User reorders links via drag and drop', async ({ page }) => {
  // Drag and drop reordering workflow
});
```

---

## 5. Performance Tests with k6 (2 Load Tests)

**Location**: `backend/tests/performance/`  
**Purpose**: Validate performance under load  
**Framework**: k6

### 5.1 Test Files

#### `batch-operations.k6.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // SC-003: 95% < 500ms
  },
};

export default function () {
  const links = Array.from({ length: 50 }, (_, i) => ({
    entity_id: `entity-${i}`,
    entity_type: 'dossier',
    link_type: 'supporting',
  }));

  const res = http.post(
    `${__ENV.API_URL}/api/intake/test-intake/links/batch`,
    JSON.stringify({ links }),
    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${__ENV.TEST_TOKEN}` } }
  );

  check(res, {
    'batch create succeeds': (r) => r.status === 201,
    'batch create < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

#### `reverse-lookup.k6.js`
```javascript
export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // SC-004: 95% < 2s
  },
};

export default function () {
  const res = http.get(
    `${__ENV.API_URL}/api/entities/dossier/${__ENV.TEST_DOSSIER_ID}/intakes?page=1&limit=50`,
    { headers: { 'Authorization': `Bearer ${__ENV.TEST_TOKEN}` } }
  );

  check(res, {
    'reverse lookup succeeds': (r) => r.status === 200,
    'reverse lookup < 2s': (r) => r.timings.duration < 2000,
    'returns 50 items': (r) => JSON.parse(r.body).items.length === 50,
  });

  sleep(1);
}
```

---

## 6. Running Tests

### 6.1 Backend Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test tests/contract/intake-links-api.test.ts

# Run in watch mode
npm test -- --watch
```

### 6.2 Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### 6.3 Performance Tests

```bash
cd backend/tests/performance

# Run batch operations test
k6 run batch-operations.k6.js

# Run reverse lookup test
k6 run reverse-lookup.k6.js
```

---

## 7. Test Coverage Requirements

**Minimum Coverage Targets**:
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

**Excluded from Coverage**:
- `node_modules/`
- `tests/`
- `dist/`
- Type definitions (`.d.ts`)
- Configuration files

---

## 8. Next Steps

### 8.1 Immediate (Complete Test Implementation)

1. **Implement Backend Contract Tests** (1-2 days)
   - Create all 12 API endpoint tests
   - Ensure proper test isolation
   - Add test data factories

2. **Implement Backend Integration Tests** (1 day)
   - Create 7 workflow tests
   - Test complex service interactions
   - Validate performance targets

3. **Implement Frontend Component Tests** (1 day)
   - Create 8 component/hook tests
   - Test user interactions
   - Test error states

4. **Implement E2E Tests** (1 day)
   - Create 5 user story tests
   - Test complete workflows
   - Test accessibility

5. **Implement Performance Tests** (0.5 day)
   - Create 2 k6 load tests
   - Validate SC-003 and SC-004
   - Generate performance reports

### 8.2 Continuous Integration

**GitHub Actions Workflow**:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm install
      - run: cd frontend && npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npx playwright install
      - run: cd frontend && npm run test:e2e
```

---

## 9. Test Data Management

### 9.1 Test Database

**Requirements**:
- Separate test database (not production)
- Reset between test runs
- Seed with minimal test data

**Setup**:
```bash
# Create .env.test file
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<test-key>
REDIS_HOST=localhost
REDIS_PORT=6379

# Run test database migrations
npm run migrate:test
```

### 9.2 Test Data Cleanup

**Strategy**:
- Use `beforeEach` to create test data
- Use `afterEach` to clean up test data
- Use transactions where possible
- Delete in reverse order of foreign keys

---

## 10. Summary

**Test Infrastructure**: ✅ Complete  
**Test Implementation**: ⏳ In Progress  
**Estimated Completion**: 4-5 days

**Files Created**:
- ✅ `backend/vitest.config.ts`
- ✅ `backend/tests/setup.ts`
- ✅ `backend/tests/utils/testHelpers.ts`
- ⏳ `backend/tests/contract/*.test.ts` (12 files)
- ⏳ `backend/tests/integration/*.test.ts` (7 files)
- ⏳ `frontend/tests/component/*.test.tsx` (8 files)
- ⏳ `frontend/tests/e2e/*.spec.ts` (5 files)
- ⏳ `backend/tests/performance/*.k6.js` (2 files)

**Total Test Files to Create**: 34 files  
**Total Test Cases**: ~150+ tests

---

**Document Status**: DRAFT  
**Last Updated**: 2025-10-17
