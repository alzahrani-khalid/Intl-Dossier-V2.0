# Intake Entity Linking Contract Tests - Quickstart Guide

## File Location
```
/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/backend/tests/contract/intake-links-api.test.ts
```

## Test Statistics
- **Total Lines:** 1,574
- **Test Cases:** 41
- **Test Suites:** 8

## Quick Run Commands

### 1. Run All Intake Links Tests
```bash
cd /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0
npm test backend/tests/contract/intake-links-api.test.ts
```

### 2. Run Specific Test Suite
```bash
# Run only T028 (Create Link tests)
npm test -- -t "T028: POST /api/intake/:intake_id/links"

# Run only T029 (Get Links tests)
npm test -- -t "T029: GET /api/intake/:intake_id/links"

# Run only T030 (Search Entities tests)
npm test -- -t "T030: GET /api/entities/search"

# Run only T031 (Clearance Enforcement tests)
npm test -- -t "T031: Integration - Clearance Enforcement"

# Run only T032 (Search Ranking tests)
npm test -- -t "T032: Integration - Entity Search Ranking"

# Run only T034 (Bilingual tests)
npm test -- -t "T034: Bilingual Support Tests"
```

### 3. Run with Coverage
```bash
npm test -- --coverage backend/tests/contract/intake-links-api.test.ts
```

### 4. Run in Watch Mode (for development)
```bash
npm test -- --watch backend/tests/contract/intake-links-api.test.ts
```

### 5. Run with Verbose Output
```bash
npm test -- --verbose backend/tests/contract/intake-links-api.test.ts
```

## Expected Behavior (TDD Red Phase)

### Before Implementation
All tests should **FAIL** with errors like:
```
✗ should create a valid primary link to dossier entity
  → Error: fetch failed
  → Response: 404 Not Found
  → Expected status: 201
  → Received status: 404
```

This is **CORRECT** and expected for Test-First Development!

### After Implementation
All tests should **PASS** with output like:
```
✓ should create a valid primary link to dossier entity (125ms)
✓ should create a related link to any entity type (98ms)
✓ should reject link with invalid link_type for entity_type (45ms)
...

Test Suites: 1 passed, 1 total
Tests:       41 passed, 41 total
Time:        12.456s
```

## Test Coverage by Endpoint

### POST /api/intake/:intake_id/links (12 tests)
1. Valid primary link creation
2. Valid related link creation
3. Invalid link_type rejection
4. Non-existent entity rejection
5. Archived entity rejection
6. Duplicate primary link rejection
7. Clearance enforcement
8. Organization boundary enforcement
9. Notes field validation
10. Auto-increment link_order
11. Response structure validation
12. Version field validation

### GET /api/intake/:intake_id/links (7 tests)
1. Return all active links
2. Exclude soft-deleted links
3. Include soft-deleted links with flag
4. Ordered by link_order ASC
5. RLS enforcement
6. Empty array for no links
7. Response structure validation

### GET /api/entities/search (9 tests)
1. Search by query string
2. Filter by entity_types
3. Ranking algorithm
4. Exclude archived entities
5. Clearance filtering
6. Organization filtering
7. Result limit (default 10, max 50)
8. Match type indication
9. Response structure validation

### Integration Tests (13 tests)
1. Clearance enforcement on creation (4 tests)
2. Search ranking algorithm (5 tests)
3. TDD verification (1 test)
4. Bilingual support (3 tests)

## Troubleshooting

### Issue: "Cannot find module '@supabase/supabase-js'"
**Solution:**
```bash
cd backend
npm install @supabase/supabase-js
```

### Issue: "SUPABASE_URL is not defined"
**Solution:**
```bash
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="your-anon-key-here"
```

### Issue: "Test timeout exceeded"
**Solution:**
```bash
# Increase timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
  },
});
```

### Issue: "Database connection failed"
**Solution:**
```bash
# Ensure Supabase is running
supabase start

# Check status
supabase status
```

### Issue: "Tests fail with 404 errors"
**Solution:**
This is expected! The Edge Functions haven't been implemented yet. This is the TDD red phase.

## Development Workflow

### TDD Red-Green-Refactor Cycle

#### 1. RED Phase (Current)
```bash
# Run tests - they should FAIL
npm test backend/tests/contract/intake-links-api.test.ts

# Expected: All tests fail with 404 errors
# ✗ 41 tests failed
```

#### 2. GREEN Phase (Next)
```bash
# Implement Edge Functions:
# - supabase/functions/intake-links-create/index.ts
# - supabase/functions/intake-links-get/index.ts
# - supabase/functions/entities-search/index.ts

# Run tests again
npm test backend/tests/contract/intake-links-api.test.ts

# Expected: All tests pass
# ✓ 41 tests passed
```

#### 3. REFACTOR Phase
```bash
# Improve code quality without breaking tests
# - Extract duplicate code
# - Optimize database queries
# - Improve error handling

# Run tests to ensure no regressions
npm test backend/tests/contract/intake-links-api.test.ts

# Expected: All tests still pass
# ✓ 41 tests passed
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Contract Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx supabase start
      - run: npm test backend/tests/contract/intake-links-api.test.ts
```

### Pre-commit Hook
```bash
# Add to .husky/pre-commit
#!/bin/sh
npm test backend/tests/contract/intake-links-api.test.ts
```

## Performance Benchmarks

| Test | Expected Duration |
|------|-------------------|
| Single test case | < 200ms |
| Full test suite | < 15s |
| With coverage | < 25s |

## Next Steps

1. ✅ **Contract tests created** (you are here)
2. ⏳ **Run tests to verify they fail** (TDD red phase)
3. ⏳ **Implement Edge Functions** (TDD green phase)
4. ⏳ **Run tests to verify they pass**
5. ⏳ **Refactor for quality** (TDD refactor phase)
6. ⏳ **Create integration tests**
7. ⏳ **Create E2E tests**

## Quick Reference

### Import Types
```typescript
import type {
  EntityLink,
  CreateLinkRequest,
  EntitySearchResult,
  LinkType,
  EntityType,
} from '../../src/types/intake-entity-links.types';
```

### Test User Credentials
```typescript
// High clearance user (clearance: 3)
email: 'test-intake-links@example.com'
password: 'test-password-123'

// Low clearance user (clearance: 1)
email: 'low-clearance@example.com'
password: 'test-password-123'
```

### API Endpoints
```
POST   /functions/v1/intake/:intake_id/links
GET    /functions/v1/intake/:intake_id/links
GET    /functions/v1/entities/search
```

---

**Created:** 2025-10-17
**Status:** ✅ Ready for TDD Red Phase
**Test File:** 1,574 lines, 41 test cases, 8 test suites
