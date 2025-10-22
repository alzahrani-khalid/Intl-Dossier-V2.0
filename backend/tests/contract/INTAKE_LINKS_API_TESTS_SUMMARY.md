# Intake Entity Linking API Contract Tests Summary

**Created:** 2025-10-17
**Feature:** 024-intake-entity-linking
**File:** `/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/backend/tests/contract/intake-links-api.test.ts`

## Overview

Comprehensive contract tests for User Story 1 (Manual Entity Linking) following Test-First Development (TDD). These tests are designed to **FAIL initially** before the Edge Functions are implemented, following the red-green-refactor cycle.

## Test Coverage

### T028: POST /api/intake/:intake_id/links (Create Link)
**12 Test Cases:**
1. ✅ Should create a valid primary link to dossier entity
2. ✅ Should create a related link to any entity type
3. ✅ Should reject link with invalid link_type for entity_type (primary only for anchor entities)
4. ✅ Should reject link to non-existent entity
5. ✅ Should reject link to archived entity
6. ✅ Should reject duplicate primary link (only 1 primary per intake)
7. ✅ Should enforce RLS: reject if user lacks clearance for entity
8. ✅ Should enforce organization boundary (multi-tenancy)
9. ✅ Should validate notes field (max 1000 chars)
10. ✅ Should auto-increment link_order
11. ✅ Should return 201 with created EntityLink object
12. ✅ Should include _version = 1 in response

### T029: GET /api/intake/:intake_id/links (Get Links)
**7 Test Cases:**
1. ✅ Should return all active links for intake
2. ✅ Should exclude soft-deleted links by default
3. ✅ Should include soft-deleted links when include_deleted=true
4. ✅ Should return links ordered by link_order ASC
5. ✅ Should enforce RLS: reject if user not assigned to intake
6. ✅ Should return empty array for intake with no links
7. ✅ Should return 200 with EntityLinksResponse

### T030: GET /api/entities/search (Search Entities)
**9 Test Cases:**
1. ✅ Should search entities by query string
2. ✅ Should filter by entity_types parameter
3. ✅ Should return results ranked by AI confidence (50%) + recency (30%) + alphabetical (20%)
4. ✅ Should exclude archived entities
5. ✅ Should filter by user's clearance level
6. ✅ Should filter by organization_id (multi-tenancy)
7. ✅ Should limit results (default 10, max 50)
8. ✅ Should include match_type (exact/partial/ai_suggested)
9. ✅ Should return 200 with EntitySearchResult[]

### T031: Integration - Clearance Enforcement
**4 Test Cases:**
1. ✅ Should reject link creation if entity clearance > user clearance
2. ✅ Should reject entity search results above user clearance
3. ✅ Should allow link to entity with clearance <= user clearance
4. ✅ Should test with clearance levels: 1 (Public), 2 (Internal), 3 (Confidential), 4 (Secret)

### T032: Integration - Entity Search Ranking
**5 Test Cases:**
1. ✅ Should rank exact matches higher than partial matches
2. ✅ Should rank AI-suggested matches by confidence score
3. ✅ Should rank recent entities higher (recency factor)
4. ✅ Should apply alphabetical sorting as tiebreaker
5. ✅ Should verify formula: AI (50%) + Recency (30%) + Alphabetical (20%)

### T033: TDD Verification
**1 Test Case:**
1. ✅ Should have failing tests indicating no Edge Functions exist yet

### T034: Bilingual Support Tests (Arabic/English)
**3 Test Cases:**
1. ✅ Should create link with Arabic notes
2. ✅ Should search entities with Arabic query
3. ✅ Should handle mixed Arabic/English entity names

## Total Test Cases: 41

## Test Framework & Dependencies

- **Framework:** Vitest
- **Client:** @supabase/supabase-js
- **TypeScript:** 5.8+ (strict mode)
- **Types:** backend/src/types/intake-entity-links.types.ts

## Test Data Setup

### Test Users
- **Primary User:** test-intake-links@example.com (Clearance: 3 - Confidential)
- **Low Clearance User:** low-clearance@example.com (Clearance: 1 - Public)

### Test Entities (7)
1. **Test Dossier** (Dossier, Clearance: 2)
2. **Secret Dossier** (Dossier, Clearance: 4)
3. **Test Position** (Position, Clearance: 1)
4. **Test MOU** (MOU, Clearance: 2)
5. **Related Organization** (Organization, Clearance: 1)
6. **Test Country** (Country, Clearance: 1)
7. **Archived Dossier** (Dossier, Clearance: 1, Status: archived)

### Test Intake
- **Title (EN):** Test Intake Ticket for Entity Linking
- **Title (AR):** تذكرة استقبال اختبارية لربط الكيانات
- **Classification:** Internal (2)
- **Assigned To:** Primary test user

## API Endpoints Tested

### 1. Create Link
```http
POST /functions/v1/intake/:intake_id/links
Authorization: Bearer {token}
Content-Type: application/json

{
  "intake_id": "uuid",
  "entity_type": "dossier",
  "entity_id": "uuid",
  "link_type": "primary",
  "source": "human",
  "notes": "Optional notes",
  "confidence": 0.95
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "intake_id": "uuid",
    "entity_type": "dossier",
    "entity_id": "uuid",
    "link_type": "primary",
    "source": "human",
    "confidence": 0.95,
    "notes": "Optional notes",
    "link_order": 1,
    "linked_by": "uuid",
    "_version": 1,
    "created_at": "2025-10-17T...",
    "updated_at": "2025-10-17T...",
    "deleted_at": null
  }
}
```

### 2. Get Links
```http
GET /functions/v1/intake/:intake_id/links?include_deleted=false
Authorization: Bearer {token}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "intake_id": "uuid",
      "entity_type": "dossier",
      "entity_id": "uuid",
      "link_type": "primary",
      "link_order": 1,
      "_version": 1,
      ...
    }
  ]
}
```

### 3. Search Entities
```http
GET /functions/v1/entities/search?q=Test&entity_types=dossier,position&limit=10
Authorization: Bearer {token}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "entity_type": "dossier",
      "entity_id": "uuid",
      "name": "Test Dossier",
      "description": "...",
      "classification_level": 2,
      "last_linked_at": "2025-10-17T...",
      "similarity_score": 0.85,
      "combined_score": 0.92
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 10,
    "offset": 0
  }
}
```

## Error Codes Tested

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_LINK_TYPE` | 400 | Link type not valid for entity type |
| `ENTITY_NOT_FOUND` | 404 | Entity does not exist |
| `ENTITY_ARCHIVED` | 400 | Cannot link to archived entity |
| `DUPLICATE_PRIMARY_LINK` | 400 | Only 1 primary link allowed per intake |
| `INSUFFICIENT_CLEARANCE` | 403 | User clearance < entity clearance |
| `ORGANIZATION_MISMATCH` | 403 | Entity not in user's organization |
| `VALIDATION_ERROR` | 400 | Field validation failed |
| `NO_INTAKE_ACCESS` | 403 | User not assigned to intake |

## Validation Rules

### Link Creation
- **intake_id:** Must be valid UUID, intake must exist
- **entity_type:** Must be valid EntityType
- **entity_id:** Must exist in corresponding table
- **link_type:** Must be valid for entity_type (primary only for dossier/engagement/assignment)
- **notes:** Max 1000 characters
- **confidence:** 0-1 range (for AI suggestions)

### Link Type Rules
- **primary:** Only 1 per intake, only to anchor entities (dossier/engagement/assignment)
- **related:** Unlimited, any entity type
- **requested:** Unlimited, only to position/mou/engagement
- **mentioned:** Unlimited, any entity type
- **assigned_to:** Only 1 per intake, only to assignment

### Clearance Enforcement
- User clearance must be >= entity classification_level
- Search results filtered by user clearance
- Links rejected if entity clearance > user clearance

### Multi-Tenancy
- Entity must belong to user's organization
- Cross-organization links rejected
- Global entities (countries, forums) exempt from organization check

## Bilingual Support

### Arabic Text Handling
- ✅ Arabic notes in link creation
- ✅ Arabic entity names in search
- ✅ Mixed Arabic/English entity names
- ✅ RTL text rendering (frontend concern)
- ✅ Arabic diacritics and special characters

### Translation Keys
All error messages and responses should support both Arabic and English:
- `title_en` / `title_ar`
- `description_en` / `description_ar`
- `name_en` / `name_ar`

## Running the Tests

### Prerequisites
```bash
# Ensure Supabase is running
supabase start

# Set environment variables
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="your-anon-key"
```

### Execute Tests
```bash
# Run contract tests only
npm test backend/tests/contract/intake-links-api.test.ts

# Run with coverage
npm test -- --coverage backend/tests/contract/intake-links-api.test.ts

# Run in watch mode
npm test -- --watch backend/tests/contract/intake-links-api.test.ts
```

### Expected Outcome (Initial Run)
**All tests should FAIL** because the Edge Functions have not been implemented yet. This is the expected behavior for Test-First Development (TDD).

Example failure output:
```
FAIL  backend/tests/contract/intake-links-api.test.ts
  Intake Entity Linking API Contract Tests
    T028: POST /api/intake/:intake_id/links - Create Link
      ✗ should create a valid primary link to dossier entity
        → Error: fetch failed: 404 Not Found
        → Expected: 201, Received: 404
```

## Next Steps

### 1. Implement Edge Functions
After these tests are written, implement the following Edge Functions:
- `supabase/functions/intake-links-create/index.ts`
- `supabase/functions/intake-links-get/index.ts`
- `supabase/functions/entities-search/index.ts`

### 2. Run Tests Again
Once implemented, run tests to verify they pass:
```bash
npm test backend/tests/contract/intake-links-api.test.ts
```

### 3. Integration Tests
After contract tests pass, create integration tests for:
- End-to-end linking workflows
- Performance testing (search with 1000+ entities)
- Concurrent link creation
- Cache invalidation

### 4. E2E Tests
Create Playwright tests for:
- Manual linking UI flow
- Entity search autocomplete
- Link management (create, update, delete)
- Permission errors displayed to user

## Test Metrics

| Metric | Value |
|--------|-------|
| Total Test Cases | 41 |
| API Endpoints | 3 |
| Error Codes | 8+ |
| Entity Types | 12 |
| Link Types | 5 |
| Clearance Levels | 4 |
| Bilingual Tests | 3 |

## Success Criteria

✅ **Definition of Done:**
1. All 41 test cases initially fail (TDD red phase)
2. Edge Functions implemented
3. All 41 test cases pass (TDD green phase)
4. Code refactored for quality (TDD refactor phase)
5. Test coverage > 90% for Edge Functions
6. No security vulnerabilities (RLS enforced)
7. Bilingual support verified
8. Performance benchmarks met (search < 500ms)

## References

- **Spec:** `/specs/024-intake-entity-linking/spec.md`
- **API Contract:** `/specs/024-intake-entity-linking/contracts/intake-links-api.md`
- **Types:** `/backend/src/types/intake-entity-links.types.ts`
- **Pattern Reference:** `/backend/tests/contract/after-action-api.test.ts`

---

**Status:** ✅ Contract tests created - Ready for TDD red phase
**Next Action:** Run tests to verify they fail, then implement Edge Functions
