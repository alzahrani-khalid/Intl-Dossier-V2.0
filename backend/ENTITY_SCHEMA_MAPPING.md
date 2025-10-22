# Entity Schema Mapping - Test vs Database

**Date**: 2025-10-17
**Purpose**: Complete mapping of test expectations vs actual database schema

---

## Mapping Table

### 1. Dossiers Table

| Test Field | Database Field | Required | Data Type | Default | Status |
|-----------|---------------|----------|-----------|---------|--------|
| `title` | `name_en` | ✅ YES | text | - | ❌ Wrong field name |
| - | `name_ar` | ✅ YES | text | - | ❌ Missing in test |
| - | `type` | ✅ YES | text | - | ❌ Missing in test |
| `status` | `status` | ✅ YES | text | 'active' | ✅ OK |
| `classification_level` (1-4) | `sensitivity_level` (enum) | ✅ YES | enum | 'low' | ❌ Wrong field + type |
| `organization_id` | - | - | - | - | ❌ Field doesn't exist |

**Sensitivity Level Mapping:**
- `classification_level: 1` → `sensitivity_level: 'public'`
- `classification_level: 2` → `sensitivity_level: 'internal'`
- `classification_level: 3` → `sensitivity_level: 'confidential'`
- `classification_level: 4` → `sensitivity_level: 'secret'`

**Required Fix:**
```typescript
// OLD (Test):
{
  title: 'Test Dossier',
  status: 'active',
  classification_level: 2,
  organization_id: testOrganizationId,
}

// NEW (Database):
{
  name_en: 'Test Dossier',
  name_ar: 'ملف اختبار',
  type: 'bilateral',  // Required! Options: bilateral, multilateral, thematic, etc.
  status: 'active',
  sensitivity_level: 'internal',  // Maps from classification_level: 2
}
```

---

### 2. Positions Table

| Test Field | Database Field | Required | Data Type | Default | Status |
|-----------|---------------|----------|-----------|---------|--------|
| `title_en` | `title_en` | ✅ YES | text | - | ✅ OK |
| `title_ar` | `title_ar` | ✅ YES | text | - | ✅ OK |
| `classification_level` | - | - | - | - | ❌ Field doesn't exist |
| `organization_id` | - | - | - | - | ❌ Field doesn't exist |
| - | `position_type_id` | ✅ YES | uuid | - | ❌ Missing in test |
| - | `author_id` | ✅ YES | uuid | - | ❌ Missing in test |

**Required Fix:**
```typescript
// OLD (Test):
{
  title_en: 'Test Position',
  title_ar: 'موقف اختبار',
  classification_level: 1,
  organization_id: testOrganizationId,
}

// NEW (Database):
{
  position_type_id: '<some-position-type-uuid>',  // Must get from position_types table
  title_en: 'Test Position',
  title_ar: 'موقف اختبار',
  author_id: testUser.id,
}
```

---

### 3. MOUs Table

| Test Field | Database Field | Required | Data Type | Default | Status |
|-----------|---------------|----------|-----------|---------|--------|
| `title_en` | `title` | ✅ YES | varchar | - | ❌ Wrong field name |
| `title_ar` | `title_ar` | ✅ YES | varchar | - | ✅ OK |
| `classification_level` | - | - | - | - | ❌ Field doesn't exist |
| `organization_id` | `organization_id` | ❌ NO | uuid | null | ⚠️ Optional |
| - | `reference_number` | ✅ YES | varchar | - | ❌ Missing in test |
| - | `mou_category` | ✅ YES | enum | - | ❌ Missing in test |
| - | `type` | ✅ YES | enum | - | ❌ Missing in test |
| - | `tenant_id` | ✅ YES | uuid | - | ❌ Missing in test |
| - | `created_by` | ✅ YES | uuid | - | ❌ Missing in test |
| - | `last_modified_by` | ✅ YES | uuid | - | ❌ Missing in test |

**Required Fix:**
```typescript
// OLD (Test):
{
  title_en: 'Test MOU',
  title_ar: 'مذكرة تفاهم اختبارية',
  classification_level: 2,
  organization_id: testOrganizationId,
}

// NEW (Database):
{
  reference_number: 'MOU-TEST-001',
  title: 'Test MOU',  // Note: title, not title_en
  title_ar: 'مذكرة تفاهم اختبارية',
  mou_category: 'technical',  // Required enum
  type: 'bilateral',  // Required enum
  tenant_id: testOrganizationId,
  created_by: testUser.id,
  last_modified_by: testUser.id,
}
```

---

### 4. Countries Table

| Test Field | Database Field | Required | Data Type | Default | Status |
|-----------|---------------|----------|-----------|---------|--------|
| `name_en` | `name_en` | ✅ YES | varchar | - | ✅ OK |
| `name_ar` | `name_ar` | ✅ YES | varchar | - | ✅ OK |
| `iso_code` | `code` | ✅ YES | varchar | - | ❌ Wrong field name |
| - | `code3` | ✅ YES | varchar | - | ❌ Missing in test |
| - | `region` | ✅ YES | varchar | - | ❌ Missing in test |
| - | `tenant_id` | ✅ YES | uuid | - | ❌ Missing in test |
| - | `created_by` | ✅ YES | uuid | - | ❌ Missing in test |
| - | `last_modified_by` | ✅ YES | uuid | - | ❌ Missing in test |

**Required Fix:**
```typescript
// OLD (Test):
{
  name_en: 'Test Country',
  name_ar: 'دولة اختبارية',
  iso_code: 'TC',
}

// NEW (Database):
{
  code: 'TC',  // 2-letter code
  code3: 'TST',  // 3-letter code
  name_en: 'Test Country',
  name_ar: 'دولة اختبارية',
  region: 'test_region',
  tenant_id: testOrganizationId,
  created_by: testUser.id,
  last_modified_by: testUser.id,
}
```

---

## Test Entity Interface Mapping

The test file defines a `TestEntity` interface that doesn't match the database schema:

```typescript
// CURRENT (Wrong):
interface TestEntity {
  entity_type: EntityType;
  entity_id: string;
  name: string;
  classification_level: number;  // ❌ Doesn't exist in most tables
  organization_id: string;       // ❌ Doesn't exist in most tables
}

// SHOULD BE (Simplified):
interface TestEntity {
  entity_type: EntityType;
  entity_id: string;
  name: string;  // Can be computed from name_en or title fields
  // Remove classification_level and organization_id as they don't universally apply
}
```

---

## Impact Analysis

### Files Affected:
- `backend/tests/contract/intake-links-api.test.ts` (1,817 lines, 52 tests)

### Entity Creation Locations:
1. **beforeAll hook** (lines 207-291): Creates 7 test entities
2. **Individual tests**: ~15 additional entity creations for specific test scenarios

### Test Cases Affected:
- **All 52 tests** depend on entities created in `beforeAll`
- Tests will continue to fail until all entity creation is fixed

---

## Recommended Approach

Given the extensive schema mismatches, I recommend **Option A**:

### Option A: Simplify Test Entities (FASTEST - 1-2 hours)

Instead of matching the full complex schema, create minimal test entities that satisfy required fields:

**Advantages:**
- ✅ Fastest path to working tests
- ✅ Tests focus on intake_entity_links, not entity schemas
- ✅ Lower risk of breaking tests during refactor

**Implementation:**
1. Create helper functions for each entity type with all required fields
2. Use placeholder/dummy data for non-critical fields
3. Update all entity creation calls to use helpers

**Example:**
```typescript
async function createTestDossier(adminClient: SupabaseClient, userId: string) {
  const { data, error } = await adminClient
    .from('dossiers')
    .insert({
      name_en: 'Test Dossier',
      name_ar: 'ملف اختبار',
      type: 'bilateral',
      status: 'active',
      sensitivity_level: 'internal',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create dossier: ${error.message}`);
  return data;
}
```

---

### Option B: Full Schema Alignment (THOROUGH - 4-6 hours)

Update all entity creations to match exact database schema with proper data:

**Advantages:**
- ✅ Tests more realistic
- ✅ Validates full entity schemas
- ✅ Better test coverage

**Disadvantages:**
- ❌ Time-consuming
- ❌ Requires understanding of all enum values
- ❌ Must query/create dependent entities (e.g., position_types)

---

### Option C: Hybrid Approach (RECOMMENDED - 2-3 hours)

Combine both approaches:
1. Create helper functions with required fields (Option A)
2. Add optional parameters for test-specific needs
3. Use sensible defaults for non-critical fields

**Example:**
```typescript
interface CreateDossierOptions {
  nameEn?: string;
  nameAr?: string;
  type?: string;
  sensitivityLevel?: 'public' | 'internal' | 'confidential' | 'secret';
}

async function createTestDossier(
  adminClient: SupabaseClient,
  options: CreateDossierOptions = {}
) {
  const { data, error } = await adminClient
    .from('dossiers')
    .insert({
      name_en: options.nameEn || 'Test Dossier',
      name_ar: options.nameAr || 'ملف اختبار',
      type: options.type || 'bilateral',
      status: 'active',
      sensitivity_level: options.sensitivityLevel || 'internal',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create dossier: ${error.message}`);
  return data;
}
```

---

## Next Steps

**Please choose an approach:**

1. **Option A (Fastest)**: I'll create simple helper functions and update test file (1-2 hours)
2. **Option B (Thorough)**: I'll fully align with database schema (4-6 hours)
3. **Option C (Recommended)**: I'll create flexible helpers with good defaults (2-3 hours)

Once you choose, I'll proceed with the implementation immediately.

---

**Last Updated**: 2025-10-17 21:25 UTC
**Updated By**: Claude Code (Anthropic)
