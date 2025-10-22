# Test File Schema Update Summary

**Date**: 2025-10-17
**Status**: ✅ IN PROGRESS - Main fixtures completed, additional entity creations remain

---

## ✅ Completed Updates

### 1. Created Helper Functions (`backend/tests/utils/entity-helpers.ts`)

Implemented flexible helper functions with sensible defaults:
- `createTestDossier()` - Maps to name_en/name_ar, type, sensitivity_level
- `createTestPosition()` - Handles position_type_id and author_id requirements
- `createTestMOU()` - Maps to title (not title_en!), reference_number, category, type
- `createTestCountry()` - Handles code/code3 requirements
- `createTestOrganization()` - Full schema compliance
- `mapSensitivityToClassification()` and `mapClassificationToSensitivity()` - Enum converters

### 2. Updated Main `beforeAll` Hook (Lines 213-313)

Fixed all 7 entity creations in the main test setup:
- ✅ Test Dossier (internal sensitivity)
- ✅ Secret Dossier (secret sensitivity)
- ✅ Test Position (with position_type_id lookup)
- ✅ Test MOU (with proper reference_number, category, type)
- ✅ Related Organization (with all required fields)
- ✅ Test Country (with code/code3/region)
- ✅ Archived Dossier (with archived status)

### 3. Updated `testEntities` Array (Lines 263-313)

Mapped all entity references to use actual database field names:
- Uses `name_en`, `title_en`, `title` appropriately per entity type
- Converts `sensitivity_level` back to `classification_level` for test compatibility
- Handles entities without sensitivity levels appropriately

---

## ⏳ Remaining Updates

### Dossier Creations Needing Update

**Location: T032 Search Ranking Test `beforeAll` (Lines 1381-1405)**
- 3 dossier creations for ranking tests
- These use: `title`, `classification_level`, `organization_id`
- Need to update to: `name_en`, `name_ar`, `sensitivity_level`

**Locations Throughout Individual Tests:**
- Line 607-616: Organization boundary test dossier
- Line 1290-1299: Clearance enforcement test dossiers (7 iterations)
- Line 1381-1405: Search ranking test dossiers (3 entities)
- Line 1564-1568: Bilingual test dossier (T034)
- Line 1599-1608: Reverse lookup test dossier (T090)
- Line 1859-1868: Empty entity test dossier (T090)
- Line 1907-1916: Multi-tenancy test dossier (T090)

### Intake_tickets Creations Needing Update

Multiple intake_tickets creations still using old schema:
- `title_en` → `title`
- `description_en` → `description`
- `classification_level` → `sensitivity`
- `request_type` must be valid enum
- `status` must be valid enum

**Locations:**
- Lines 930-942: Unassigned intake test
- Lines 963-976: Empty intake test
- Lines 1320-1334: Clearance test intakes (7 iterations)
- Lines 1610-1624: Reverse lookup test intakes (5 iterations)
- Lines 1770-1784: Clearance filter test intake

---

## Schema Reference

### Dossiers

| Old (Test) | New (Database) |
|-----------|----------------|
| `title` | `name_en` + `name_ar` (both required) |
| `classification_level` (1-4) | `sensitivity_level` (enum: 'public', 'internal', 'confidential', 'secret') |
| `organization_id` | ❌ Doesn't exist |
| - | `type` (required: 'bilateral', 'multilateral', etc.) |

### Intake_tickets

| Old (Test) | New (Database) |
|-----------|----------------|
| `title_en` + `description_en` | `title` + `description` (no _en suffix!) |
| `title_ar` + `description_ar` | Keep as is |
| `classification_level` | `sensitivity` (enum: 'internal', 'confidential', 'secret') |
| `organization_id` | ❌ Not directly used |
| `request_type` | Must use valid enum: 'engagement', 'position', 'mou_action', 'foresight' |
| `status` | Must use valid enum: 'draft', 'submitted', 'triaged', 'assigned', 'in_progress', 'converted', 'closed', 'merged' |

---

## Next Steps

### Option 1: Bulk Script Update (Recommended)
Create a script to find/replace all remaining patterns:
```bash
# Find all remaining dossier creations
grep -n "\.from('dossiers')\.insert" tests/contract/intake-links-api.test.ts

# Find all remaining intake_tickets creations
grep -n "\.from('intake_tickets')\.insert" tests/contract/intake-links-api.test.ts
```

### Option 2: Manual Updates
Update each entity creation individually using the Edit tool, following the patterns established in the helper functions.

### Option 3: Test-Driven Fixes
Run tests and fix errors as they appear, updating entity creations one at a time.

---

## Test Execution Command

```bash
cd backend
pnpm test tests/contract/intake-links-api.test.ts --run --no-watch
```

---

**Last Updated**: 2025-10-17 (Current session)
**Updated By**: Claude Code (Anthropic)
