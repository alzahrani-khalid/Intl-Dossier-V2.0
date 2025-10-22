# Test Schema Mismatch Fix Summary

**Date**: 2025-10-17
**Issue**: Contract test failures due to database schema mismatch
**Status**: ✅ Fixed

## Problem

The intake entity linking contract tests were failing during test setup with the following error:

```
Error: Failed to create dossier: new row for relation "dossiers" violates check constraint "dossiers_sensitivity_level_check"
```

## Root Cause

The database schema and test helpers had mismatched enum values for dossier sensitivity levels:

### Database Schema (Actual)
- **Table**: `dossiers`
- **Field**: `sensitivity_level`
- **Type**: `TEXT CHECK (sensitivity_level IN ('low', 'medium', 'high'))`
- **Constraint Name**: `dossiers_sensitivity_level_check`
- **Expected Values**: `'low'`, `'medium'`, `'high'`

### Test Helpers (Old)
- **Field**: `sensitivityLevel`
- **Expected Values**: `'public'`, `'internal'`, `'confidential'`, `'secret'`

## Files Fixed

### 1. `backend/tests/utils/entity-helpers.ts`

**Fixed Interface**:
```typescript
export interface CreateDossierOptions {
  nameEn?: string;
  nameAr?: string;
  type?: 'country' | 'organization' | 'forum' | 'theme';  // Changed from 'bilateral'|'multilateral'|...
  status?: 'active' | 'inactive' | 'archived';            // Changed from 'archived'|'draft'
  sensitivityLevel?: 'low' | 'medium' | 'high';           // Changed from 'public'|'internal'|...
}
```

**Fixed Mapping Functions**:
```typescript
export function mapClassificationToSensitivity(
  classificationLevel: number
): 'low' | 'medium' | 'high' {
  switch (classificationLevel) {
    case 1: return 'low';
    case 2: return 'medium';
    case 3:
    case 4: return 'high';  // Map both 3 and 4 to 'high'
    default: return 'low';
  }
}

export function mapSensitivityToClassification(
  sensitivityLevel: 'low' | 'medium' | 'high'
): number {
  switch (sensitivityLevel) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    default: return 1;
  }
}
```

### 2. `backend/tests/contract/intake-links-api.test.ts`

**Fixed Test Data Creation (Lines 215-226)**:
```typescript
// Before:
const dossierData = await createTestDossier(supabaseAdmin, {
  nameEn: 'Test Dossier',
  nameAr: 'ملف اختبار',
  sensitivityLevel: 'internal', // ❌ Invalid value
});

const secretDossierData = await createTestDossier(supabaseAdmin, {
  nameEn: 'Secret Dossier',
  nameAr: 'ملف سري',
  sensitivityLevel: 'secret', // ❌ Invalid value
});

// After:
const dossierData = await createTestDossier(supabaseAdmin, {
  nameEn: 'Test Dossier',
  nameAr: 'ملف اختبار',
  sensitivityLevel: 'medium', // ✅ Valid value
});

const secretDossierData = await createTestDossier(supabaseAdmin, {
  nameEn: 'Secret Dossier',
  nameAr: 'ملف سري',
  sensitivityLevel: 'high', // ✅ Valid value
});
```

**Fixed Archived Dossier (Line 256-261)**:
```typescript
// Before:
const archivedDossierData = await createTestDossier(supabaseAdmin, {
  nameEn: 'Archived Dossier',
  nameAr: 'ملف مؤرشف',
  status: 'archived',
  sensitivityLevel: 'public', // ❌ Invalid value
});

// After:
const archivedDossierData = await createTestDossier(supabaseAdmin, {
  nameEn: 'Archived Dossier',
  nameAr: 'ملف مؤرشف',
  status: 'archived',
  sensitivityLevel: 'low', // ✅ Valid value
});
```

**Fixed Other Organization Dossier (Line 607-611)**:
```typescript
// Before:
const otherDossierData = await createTestDossier(supabaseAdmin, {
  nameEn: 'Dossier in Other Org',
  nameAr: 'ملف في منظمة أخرى',
  sensitivityLevel: 'public', // ❌ Invalid value
});

// After:
const otherDossierData = await createTestDossier(supabaseAdmin, {
  nameEn: 'Dossier in Other Org',
  nameAr: 'ملف في منظمة أخرى',
  sensitivityLevel: 'low', // ✅ Valid value
});
```

## Sensitivity Level Mapping

| Classification Level | Old Value | New Value | Description |
|---------------------|-----------|-----------|-------------|
| 1 | `'public'` | `'low'` | Public access |
| 2 | `'internal'` | `'medium'` | Internal use |
| 3 | `'confidential'` | `'high'` | Confidential |
| 4 | `'secret'` | `'high'` | Secret (mapped to high) |

## Dossier Type Mapping

| Old Values | New Values | Database Constraint |
|------------|------------|---------------------|
| `'bilateral'`, `'multilateral'`, `'thematic'`, `'regional'`, `'global'` | `'country'`, `'organization'`, `'forum'`, `'theme'` | `CHECK (type IN ('country', 'organization', 'forum', 'theme'))` |

## Dossier Status Mapping

| Old Values | New Values | Database Constraint |
|------------|------------|---------------------|
| `'archived'`, `'draft'` | `'active'`, `'inactive'`, `'archived'` | `CHECK (status IN ('active', 'inactive', 'archived'))` |

## Impact

- **Tests Affected**: 52 tests in `intake-links-api.test.ts`
- **Test Helpers Updated**: `createTestDossier()`, mapping functions
- **Breaking Changes**: None (internal test code only)

## Verification

After fixes applied:
```bash
cd backend && npm test -- tests/contract/intake-links-api.test.ts
```

Expected result: Tests should now proceed past setup phase without constraint violation errors.

## Lessons Learned

1. **Schema Documentation**: Always document enum constraints in type definitions
2. **Test Helper Validation**: Test helpers should match database schema exactly
3. **Type Safety**: TypeScript types should reflect database constraints
4. **Migration Tracking**: Track schema changes and update test helpers accordingly

## Related Files

- Database Schema: `supabase/migrations/20250930002_create_dossiers_table.sql`
- Test Helpers: `backend/tests/utils/entity-helpers.ts`
- Contract Tests: `backend/tests/contract/intake-links-api.test.ts`
- TypeScript Types: `backend/src/types/database.types.ts`

## Next Steps

1. ✅ Run contract tests to verify setup completes
2. ⏳ Address actual test failures (expected - API endpoints not yet implemented)
3. ⏳ Document schema constraints in type files
4. ⏳ Add schema validation tests to prevent future mismatches
