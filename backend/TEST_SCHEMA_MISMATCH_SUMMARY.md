# Test Schema Mismatch Summary - Backend Contract Tests

**Date**: 2025-10-17
**Feature**: 024-intake-entity-linking
**Status**: ⚠️ CRITICAL - Test file schema does not match database schema

---

## Executive Summary

The backend contract test file (`backend/tests/contract/intake-links-api.test.ts`) was written with assumptions about the database schema that do not match the actual Supabase database. Multiple critical schema mismatches have been discovered that prevent tests from running.

**Resolution Required**: The test file needs to be completely rewritten to match the actual database schema, OR the database schema needs to be updated to match the test expectations.

---

## Schema Mismatches Found

### 1. ✅ FIXED: intake_tickets Table

| Field (Test Expected) | Field (Database Actual) | Status |
|----------------------|------------------------|--------|
| `title_en` | `title` | ✅ Fixed |
| `description_en` | `description` | ✅ Fixed |
| `classification_level` (integer) | `sensitivity` (enum: 'internal', 'confidential', etc.) | ✅ Fixed |
| `request_type: 'information_request'` | `request_type: 'engagement'` (valid enum values: engagement, position, mou_action, foresight) | ✅ Fixed |
| `status: 'pending_review'` | `status: 'submitted'` (valid enum values: draft, submitted, triaged, assigned, in_progress, converted, closed, merged) | ✅ Fixed |

### 2. ❌ CRITICAL: dossiers Table

**Test Expects:**
```typescript
{
  title: 'Test Dossier',                 // WRONG: Field doesn't exist
  status: 'active',                       // OK: Field exists
  classification_level: 2,                // WRONG: Field doesn't exist
  organization_id: testOrganizationId,   // WRONG: Field doesn't exist
}
```

**Database Actually Has:**
```typescript
{
  name_en: string,           // REQUIRED (NOT NULL)
  name_ar: string,           // REQUIRED (NOT NULL)
  type: string,              // REQUIRED (NOT NULL) - but test doesn't provide this
  status: string,            // OK (default: 'active')
  sensitivity_level: enum,   // REQUIRED (default: 'low')
                            // Valid values: 'public', 'internal', 'confidential', 'secret'
  // No organization_id field exists!
  // No classification_level field exists!
}
```

**Impact**: ALL dossier creation calls in the test file are failing silently, returning `null`, which causes the test to crash with "Cannot read properties of null".

### 3. ❌ UNKNOWN: Other Entity Tables

The test file also creates entities for:
- `positions` table
- `mous` table
- `organizations` table (already used for test org)
- `countries` table

**Status**: Schema for these tables has NOT been verified yet. They likely have similar mismatches.

---

## Test File Usage Patterns

The test file uses these entity types throughout:

1. **Dossiers** - Used in ~40+ test cases
   - Primary link creation
   - Related link creation
   - Clearance enforcement tests
   - Archive status tests
   - Search ranking tests
   - Bilingual tests

2. **Positions** - Used in ~15+ test cases
   - Related link creation
   - Link type validation
   - Search tests

3. **MOUs** - Used in ~10+ test cases
   - Related link creation
   - Link retrieval tests

4. **Organizations** - Used in ~5+ test cases
   - Multi-tenancy tests
   - Organization boundary tests

5. **Countries** - Used in ~3+ test cases
   - Global entity tests

---

## Recommended Solutions

### Option 1: Update Test File to Match Database (RECOMMENDED)

**Pros:**
- Database schema is the source of truth
- Database is already deployed and in use
- No migration risks

**Cons:**
- Large refactor of test file (1,800+ lines)
- Need to verify schema for ALL entity tables
- May discover more mismatches

**Steps:**
1. Query database schema for all entity tables used in tests
2. Update all entity creation calls to use correct field names
3. Map classification_level (1-4) to sensitivity_level ('public', 'internal', 'confidential', 'secret')
4. Handle missing organization_id field (may need to add via migration or remove from tests)
5. Rerun tests incrementally

### Option 2: Update Database to Match Test Expectations

**Pros:**
- Test file remains intact
- Matches original feature specification intent

**Cons:**
- Requires database migrations on live system
- May break existing code/features
- High risk
- Requires careful planning

**Not Recommended**: Database is already deployed and in use.

---

## Next Steps

### Immediate Actions Required:

1. **✅ COMPLETED**: Fixed enum value mismatches for `intake_tickets` table
   - `request_type`: Changed 'information_request' → 'engagement'
   - `status`: Changed 'pending_review' → 'submitted'
   - `sensitivity`: Changed integer → enum string

2. **⏳ IN PROGRESS**: Document all entity table schemas
   - Need to query: positions, mous, organizations, countries
   - Identify ALL field mismatches
   - Create mapping table (test fields → database fields)

3. **PENDING**: Update test file entity creation calls
   - Replace all dossier creation calls
   - Replace all other entity creation calls
   - Add error handling to ALL entity creation calls
   - Add validation that entities were created successfully

4. **PENDING**: Handle missing fields
   - `organization_id`: Determine if this should exist in dossiers table
   - `classification_level`: Map to `sensitivity_level` enum
   - Any other missing/mismatched fields

---

## Current Test Execution Status

```bash
cd backend
pnpm test tests/contract/intake-links-api.test.ts --run --no-watch
```

**Result**: Tests fail in `beforeAll` hook at line 296 with:
```
TypeError: Cannot read properties of null (reading 'id')
 ❯ tests/contract/intake-links-api.test.ts:296:33
```

**Root Cause**: Dossier creation at line 207-216 returns `null` because required fields (`name_en`, `name_ar`, `type`) are missing.

---

## Files Involved

1. **Test File**: `backend/tests/contract/intake-links-api.test.ts` (1,817 lines)
   - 52 test cases
   - 7 test suites
   - Multiple entity types used

2. **Database Schema**: Supabase Project `zkrcjzdemdmwhearhfgg`
   - Tables: dossiers, positions, mous, organizations, countries, intake_tickets, intake_entity_links
   - Region: eu-west-2
   - PostgreSQL 17.6.1.008

3. **Type Definitions**: `backend/src/types/database.types.ts`
   - Generated from database: 8,113 lines
   - Last regenerated: 2025-10-17

---

## Risk Assessment

**Risk Level**: 🔴 HIGH

**Impact**:
- Test infrastructure completely blocked
- Cannot verify Edge Function contracts
- Cannot implement TDD workflow
- Feature 024 implementation blocked

**Mitigation**:
- Comprehensive schema audit required
- Test file refactor required (est. 4-6 hours)
- OR database migration required (high risk)

---

## Conclusion

The backend contract tests were written with an assumed database schema that does not match production. This was likely due to:
1. Spec was written before database implementation
2. Database evolved differently than spec
3. No schema validation between spec and implementation

**Recommendation**: Proceed with Option 1 (Update Test File) as the fastest, lowest-risk path to unblock feature implementation.

---

**Last Updated**: 2025-10-17 21:20 UTC
**Updated By**: Claude Code (Anthropic)
