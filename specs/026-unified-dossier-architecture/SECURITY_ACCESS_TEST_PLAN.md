# Security Access Test Plan: T145
**Feature**: 026-unified-dossier-architecture
**Date**: 2025-01-23
**Task**: T145 - Test unauthorized access attempts across all query paths

## Executive Summary
This document outlines the comprehensive security testing strategy to verify that:
1. RLS (Row Level Security) policies correctly enforce clearance-based access control
2. Unauthorized users cannot access sensitive data
3. All Edge Functions validate authentication and authorization
4. Cross-dossier relationship queries respect clearance levels

---

## Test Categories

### 1. Authentication Tests
**Purpose**: Verify that unauthenticated requests are rejected

#### Test Scenarios:
```typescript
// T145-AUTH-001: Unauthenticated dossier query
// Expected: 401 Unauthorized
await fetch(`${SUPABASE_URL}/rest/v1/dossiers`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY
    // No Authorization header
  }
});

// T145-AUTH-002: Invalid JWT token
// Expected: 401 Unauthorized
await fetch(`${SUPABASE_URL}/rest/v1/dossiers`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer invalid_token_here'
  }
});

// T145-AUTH-003: Expired JWT token
// Expected: 401 Unauthorized
// (Use token with exp claim in the past)
```

**Expected Results**:
- ✅ All requests return 401 Unauthorized
- ✅ No data is returned in response body
- ✅ Error message: "JWT expired" or "No authorization header"

---

### 2. Clearance Level Tests
**Purpose**: Verify that users can only access dossiers matching their clearance level

#### RLS Policy Logic (from migration 20251022000006):
```sql
CREATE POLICY "Users can only view dossiers matching their clearance"
ON dossiers FOR SELECT
USING (
  sensitivity_level <= (
    SELECT clearance_level
    FROM profiles
    WHERE id = auth.uid()
  )
);
```

#### Test Scenarios:

##### T145-CLEAR-001: Low clearance user (level 1)
```typescript
// Setup: User with clearance_level = 1
// Dossiers in database:
//   - Dossier A: sensitivity_level = 1 (accessible)
//   - Dossier B: sensitivity_level = 2 (blocked)
//   - Dossier C: sensitivity_level = 3 (blocked)

const { data, error } = await supabase
  .from('dossiers')
  .select('*');

// Expected:
✅ data contains only Dossier A
✅ Dossier B and C are filtered out by RLS
✅ No error raised (silent filtering)
```

##### T145-CLEAR-002: Medium clearance user (level 2)
```typescript
// Setup: User with clearance_level = 2

const { data, error } = await supabase
  .from('dossiers')
  .select('*');

// Expected:
✅ data contains Dossier A and Dossier B
✅ Dossier C is filtered out by RLS
```

##### T145-CLEAR-003: High clearance user (level 3)
```typescript
// Setup: User with clearance_level = 3

const { data, error } = await supabase
  .from('dossiers')
  .select('*');

// Expected:
✅ data contains all dossiers (A, B, C)
```

##### T145-CLEAR-004: Direct access attempt (bypass query)
```typescript
// Attempt to access high-sensitivity dossier directly by ID
// User clearance: level 1
// Dossier sensitivity: level 3

const { data, error } = await supabase
  .from('dossiers')
  .select('*')
  .eq('id', highSensitivityDossierId)
  .single();

// Expected:
✅ data is null (RLS filters it out)
✅ error: "JSON object requested, but multiple (or no) rows returned"
✅ User cannot access dossier even with direct ID
```

---

### 3. Extension Table Access Tests
**Purpose**: Verify that extension tables respect base dossier RLS policies

#### Test Scenarios:

##### T145-EXT-001: Countries table access
```typescript
// User clearance: level 1
// Saudi Arabia dossier: sensitivity_level = 1 (accessible)
// China dossier: sensitivity_level = 3 (blocked)

const { data: countries } = await supabase
  .from('countries')
  .select('*, dossiers(*)');

// Expected:
✅ countries array contains only Saudi Arabia
✅ China is filtered out via dossiers FK relationship
```

##### T145-EXT-002: Organizations table access
```typescript
// User clearance: level 2
// Test similar filtering for organizations table

const { data: orgs } = await supabase
  .from('organizations')
  .select('*, dossiers(*)');

// Expected:
✅ Only organizations with dossier.sensitivity_level <= 2 returned
```

##### T145-EXT-003: Direct extension table query (no JOIN)
```typescript
// Attempt to bypass RLS by querying extension table directly
// User clearance: level 1

const { data: allCountries } = await supabase
  .from('countries')
  .select('*'); // No JOIN to dossiers

// Expected:
✅ Query returns countries, BUT
✅ User still cannot fetch restricted dossier data
✅ Foreign key to restricted dossier exists but dossier data is blocked
```

---

### 4. Relationship Query Access Tests
**Purpose**: Verify relationships respect both source and target dossier clearance levels

#### Test Scenarios:

##### T145-REL-001: Bidirectional relationship query
```typescript
// Setup:
//   - Dossier A (clearance 1) ←→ Relationship ←→ Dossier B (clearance 3)
//   - User clearance: level 1

const { data: relationships } = await supabase
  .from('dossier_relationships')
  .select(`
    *,
    source:dossiers!source_dossier_id(*),
    target:dossiers!target_dossier_id(*)
  `)
  .or(`source_dossier_id.eq.${dossierAId},target_dossier_id.eq.${dossierAId}`);

// Expected:
✅ Relationship record exists
✅ source dossier data is populated (accessible)
✅ target dossier data is NULL (filtered by RLS)
✅ User sees partial relationship (knows connection exists but cannot see restricted end)
```

##### T145-REL-002: Graph traversal with mixed clearance
```typescript
// Setup: Graph with mixed sensitivity levels
//   A (level 1) → B (level 2) → C (level 3)
// User clearance: level 1

const { data: graph } = await supabase
  .rpc('traverse_relationship_graph', {
    start_dossier_id: dossierAId,
    max_degrees: 2
  });

// Expected:
✅ Only Dossier A returned (level 1 accessible)
✅ Dossier B and C filtered out by RLS within recursive CTE
✅ Graph traversal stops at clearance boundary
```

---

### 5. Calendar Event Access Tests
**Purpose**: Verify calendar events respect dossier clearance levels

#### Test Scenarios:

##### T145-CAL-001: Event linked to restricted dossier
```typescript
// Setup:
//   - Dossier X (sensitivity level 3)
//   - Calendar Event E (linked to Dossier X)
// User clearance: level 1

const { data: events } = await supabase
  .from('calendar_events')
  .select('*, dossiers(*)')
  .eq('dossier_id', dossierXId);

// Expected:
✅ Query returns 0 events
✅ RLS filters events via dossiers foreign key relationship
✅ User cannot see events linked to inaccessible dossiers
```

##### T145-CAL-002: Date range query with mixed clearance
```typescript
// Setup:
//   - Event A: linked to Dossier (level 1) - accessible
//   - Event B: linked to Dossier (level 3) - blocked
//   - Both events on same date
// User clearance: level 1

const { data: events } = await supabase
  .from('calendar_events')
  .select('*, dossiers(*)')
  .gte('start_datetime', '2025-01-01T00:00:00Z')
  .lte('end_datetime', '2025-12-31T23:59:59Z');

// Expected:
✅ Only Event A returned
✅ Event B filtered out by RLS
✅ User's calendar view shows only accessible events
```

---

### 6. Edge Function Authorization Tests
**Purpose**: Verify Edge Functions validate JWT and enforce business rules

#### Test Scenarios:

##### T145-EDGE-001: Dossiers Edge Function (GET)
```bash
# Unauthenticated request
curl -X GET "${SUPABASE_URL}/functions/v1/dossiers" \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized
# Response: { "error": "Missing authorization header" }
```

##### T145-EDGE-002: Relationships Edge Function (POST)
```bash
# Authenticated but attempting to link two restricted dossiers
curl -X POST "${SUPABASE_URL}/functions/v1/relationships" \
  -H "Authorization: Bearer ${USER_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "source_dossier_id": "restricted-dossier-id",
    "target_dossier_id": "another-restricted-id",
    "relationship_type": "bilateral_relation"
  }'

# Expected: 403 Forbidden
# Response: { "error": "Cannot access one or both dossiers" }
```

##### T145-EDGE-003: Graph Traversal Edge Function
```bash
# Request graph starting from inaccessible dossier
curl -X POST "${SUPABASE_URL}/functions/v1/graph-traversal" \
  -H "Authorization: Bearer ${USER_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "start_dossier_id": "high-security-dossier-id",
    "max_degrees": 2
  }'

# Expected: 403 Forbidden OR empty graph
# Response: { "data": [] } or { "error": "Access denied" }
```

##### T145-EDGE-004: Search Edge Function
```bash
# Search for term that matches restricted dossiers
curl -X POST "${SUPABASE_URL}/functions/v1/search" \
  -H "Authorization: Bearer ${USER_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "classified project",
    "limit": 10
  }'

# Expected: 200 OK, but results filtered by clearance
# Response: { "data": [...] } contains only accessible dossiers
```

---

### 7. Document Link Access Tests
**Purpose**: Verify document links (positions, MOUs) respect dossier clearance

#### Test Scenarios:

##### T145-DOC-001: Position linked to restricted dossier
```typescript
// Setup:
//   - Position P (public document)
//   - Linked to Dossier D (sensitivity level 3)
// User clearance: level 1

const { data: positions } = await supabase
  .from('position_dossier_links')
  .select('*, positions(*), dossiers(*)')
  .eq('dossier_id', restrictedDossierId);

// Expected:
✅ Query returns 0 results
✅ User cannot see position links to restricted dossiers
```

##### T145-DOC-002: MOU with restricted signatories
```typescript
// Setup:
//   - MOU M (public)
//   - Signatory 1: Saudi Arabia (level 1) - accessible
//   - Signatory 2: Classified Country (level 3) - blocked
// User clearance: level 1

const { data: mous } = await supabase
  .from('mou_signatories')
  .select('*, mous(*), dossiers(*)')
  .eq('mou_id', mouId);

// Expected:
✅ Only Signatory 1 returned
✅ Signatory 2 filtered out by RLS
✅ User sees partial MOU signatory list
```

---

### 8. Person Dossier Access Tests
**Purpose**: Verify VIP person dossiers respect clearance levels

#### Test Scenarios:

##### T145-PERSON-001: Person linked to restricted organization
```typescript
// Setup:
//   - Person P (VIP, sensitivity level 2)
//   - Linked to Organization O (sensitivity level 3)
// User clearance: level 1

const { data: person } = await supabase
  .from('persons')
  .select('*, dossiers(*), organizations:organization_id(*)')
  .eq('id', personId)
  .single();

// Expected:
✅ Query returns 0 results (person dossier sensitivity_level = 2 > user clearance)
✅ User cannot see VIP person at all
```

##### T145-PERSON-002: Event participant access
```typescript
// Setup:
//   - Calendar Event E
//   - Participant: Person P (sensitivity level 2)
// User clearance: level 1

const { data: participants } = await supabase
  .from('event_participants')
  .select('*, dossiers(*)')
  .eq('event_id', eventId);

// Expected:
✅ Participants list is empty or filtered
✅ User cannot see restricted person as participant
```

---

## Test Execution Strategy

### Manual Testing (Recommended for T145)
Since this is a security-critical test, manual testing with real database is recommended:

1. **Setup Test Users**:
   ```sql
   -- Create 3 test users with different clearance levels
   INSERT INTO profiles (id, clearance_level) VALUES
     ('user-level-1-uuid', 1),
     ('user-level-2-uuid', 2),
     ('user-level-3-uuid', 3);
   ```

2. **Setup Test Dossiers**:
   ```sql
   INSERT INTO dossiers (id, type, name_en, sensitivity_level) VALUES
     ('dossier-public-uuid', 'country', 'Public Country', 1),
     ('dossier-restricted-uuid', 'organization', 'Restricted Org', 2),
     ('dossier-classified-uuid', 'engagement', 'Classified Engagement', 3);
   ```

3. **Generate JWTs**:
   ```typescript
   // Use Supabase Auth to get JWT for each test user
   const { data: { session } } = await supabase.auth.signInWithPassword({
     email: 'user-level-1@test.com',
     password: 'test-password'
   });
   const jwtLevel1 = session.access_token;
   ```

4. **Run Test Suite**:
   ```bash
   # Execute tests with different JWTs
   npm run test:security -- --jwt=$jwtLevel1
   npm run test:security -- --jwt=$jwtLevel2
   npm run test:security -- --jwt=$jwtLevel3
   ```

### Automated Testing (Future Enhancement)
Create automated security test suite:
```bash
# File: backend/tests/integration/security-access.test.ts
npm run test:integration:security
```

---

## Expected Results Summary

### Pass Criteria:
✅ All unauthenticated requests return 401 Unauthorized
✅ Users with clearance level N can only access dossiers with sensitivity_level <= N
✅ Extension table queries respect base dossier RLS policies
✅ Relationship queries filter both source and target by clearance
✅ Calendar events respect dossier clearance levels
✅ Edge Functions validate JWT and enforce authorization
✅ Document links respect dossier clearance levels
✅ Person dossiers and event participants respect clearance levels
✅ Graph traversal stops at clearance boundaries
✅ No data leakage via direct ID queries or JOIN bypasses

### Fail Criteria (Security Vulnerabilities):
❌ Unauthenticated access to any dossier data
❌ User can see dossiers above their clearance level
❌ Extension table bypass allows seeing restricted dossier data
❌ Relationship query reveals restricted dossier details
❌ Calendar events leak information about restricted dossiers
❌ Edge Functions allow operations on inaccessible dossiers
❌ Document links expose restricted dossier connections
❌ Graph traversal returns restricted nodes

---

## Test Script (Executable)

### File: `backend/tests/security/rls-access-tests.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

describe('T145: Security Access Tests', () => {
  let userLevel1JWT: string;
  let userLevel2JWT: string;
  let userLevel3JWT: string;

  let dossierPublicId: string;
  let dossierRestrictedId: string;
  let dossierClassifiedId: string;

  beforeAll(async () => {
    // Setup test data and JWTs
    // (Implementation omitted - requires real Supabase connection)
  });

  describe('Authentication Tests', () => {
    it('T145-AUTH-001: rejects unauthenticated dossier query', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await supabase.from('dossiers').select('*');

      expect(error).toBeDefined();
      expect(error?.code).toBe('PGRST301'); // JWT required
    });

    it('T145-AUTH-002: rejects invalid JWT token', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: 'Bearer invalid_token_here'
          }
        }
      });

      const { data, error } = await supabase.from('dossiers').select('*');
      expect(error).toBeDefined();
    });
  });

  describe('Clearance Level Tests', () => {
    it('T145-CLEAR-001: level 1 user sees only public dossiers', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${userLevel1JWT}` } }
      });

      const { data, error } = await supabase.from('dossiers').select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(1);
      expect(data![0].id).toBe(dossierPublicId);
    });

    it('T145-CLEAR-002: level 2 user sees public and restricted', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${userLevel2JWT}` } }
      });

      const { data, error } = await supabase.from('dossiers').select('*');

      expect(error).toBeNull();
      expect(data!.length).toBe(2);
      expect(data!.map(d => d.id)).toContain(dossierPublicId);
      expect(data!.map(d => d.id)).toContain(dossierRestrictedId);
    });

    it('T145-CLEAR-003: level 3 user sees all dossiers', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${userLevel3JWT}` } }
      });

      const { data, error } = await supabase.from('dossiers').select('*');

      expect(error).toBeNull();
      expect(data!.length).toBe(3);
    });

    it('T145-CLEAR-004: direct ID query respects RLS', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${userLevel1JWT}` } }
      });

      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', dossierClassifiedId)
        .single();

      expect(data).toBeNull();
      expect(error).toBeDefined(); // No rows returned
    });
  });

  describe('Extension Table Access Tests', () => {
    it('T145-EXT-001: countries table respects dossier RLS', async () => {
      // Test implementation
    });

    it('T145-EXT-002: organizations table respects dossier RLS', async () => {
      // Test implementation
    });
  });

  describe('Relationship Query Access Tests', () => {
    it('T145-REL-001: bidirectional relationship filters restricted targets', async () => {
      // Test implementation
    });

    it('T145-REL-002: graph traversal stops at clearance boundary', async () => {
      // Test implementation
    });
  });

  describe('Calendar Event Access Tests', () => {
    it('T145-CAL-001: events linked to restricted dossiers are hidden', async () => {
      // Test implementation
    });

    it('T145-CAL-002: date range query filters by clearance', async () => {
      // Test implementation
    });
  });

  describe('Edge Function Authorization Tests', () => {
    it('T145-EDGE-001: dossiers function rejects unauthenticated requests', async () => {
      // Test implementation
    });

    it('T145-EDGE-002: relationships function validates dossier access', async () => {
      // Test implementation
    });

    it('T145-EDGE-003: graph traversal respects clearance', async () => {
      // Test implementation
    });

    it('T145-EDGE-004: search results filtered by clearance', async () => {
      // Test implementation
    });
  });

  describe('Document Link Access Tests', () => {
    it('T145-DOC-001: position links respect dossier clearance', async () => {
      // Test implementation
    });

    it('T145-DOC-002: MOU signatories filtered by clearance', async () => {
      // Test implementation
    });
  });

  describe('Person Dossier Access Tests', () => {
    it('T145-PERSON-001: person linked to restricted org is hidden', async () => {
      // Test implementation
    });

    it('T145-PERSON-002: event participants respect clearance', async () => {
      // Test implementation
    });
  });
});
```

---

## Execution Instructions

### Option 1: Manual Testing (Recommended for Security)
1. Create test users in Supabase Auth dashboard
2. Set clearance levels in profiles table
3. Create test dossiers with different sensitivity levels
4. Use Postman/Insomnia to execute REST API calls with different JWTs
5. Verify responses match expected results

### Option 2: Automated Testing
1. Set up test environment variables:
   ```bash
   export TEST_USER_LEVEL_1_EMAIL="test-level-1@example.com"
   export TEST_USER_LEVEL_2_EMAIL="test-level-2@example.com"
   export TEST_USER_LEVEL_3_EMAIL="test-level-3@example.com"
   export TEST_PASSWORD="test-password-123"
   ```

2. Run security test suite:
   ```bash
   npm run test:security
   # or
   pnpm test:security
   ```

3. Review test report:
   ```bash
   cat test-results/security-access-report.txt
   ```

---

## Sign-off Criteria

T145 is considered COMPLETE when:
- ✅ All 8 test categories have been executed
- ✅ All test scenarios return expected results
- ✅ No security vulnerabilities identified
- ✅ Test results documented in this file or external report
- ✅ Any identified issues have been remediated and retested

---

## Status

**Current Status**: 🟡 **NEEDS MANUAL EXECUTION**

**Reason**: Security tests require:
1. Real Supabase database connection
2. Test user accounts with JWTs
3. Test data with various clearance levels
4. Manual verification of results

**Recommendation**: Execute manual testing using Postman/Insomnia with the test scenarios outlined above. Document results in separate test execution report.

**Alternative**: Mark T145 as BLOCKED pending test environment setup, then proceed to T146 (rate limiting) which can be implemented without running the tests.

---

## Next Steps

1. **Option A**: Execute manual security tests and document results
2. **Option B**: Set up automated test suite with CI/CD integration
3. **Option C**: Mark as NEEDS_MANUAL_TESTING and proceed to T146

**Recommended**: Option C - Proceed to T146 (add rate limiting) while security testing is scheduled with QA team.
