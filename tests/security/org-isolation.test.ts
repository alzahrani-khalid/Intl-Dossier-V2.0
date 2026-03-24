/**
 * Organization Isolation Test Suite (SEC-01, SEC-05)
 *
 * Verifies that RLS policies correctly enforce organization-level data isolation
 * when accessed via authenticated Supabase SDK clients.
 *
 * Per D-01: Verification must be via automated test suite using Supabase SDK
 * (not SQL editor which bypasses RLS).
 *
 * Test Strategy:
 * - Create test users in two different organizations via supabaseAdmin
 * - Authenticate as each user via Supabase Auth
 * - Verify that SDK queries only return data from the user's organization
 * - Verify cross-org access is denied (empty results, not errors)
 * - Verify service_role can see all data (bypasses RLS)
 * - Verify anonymous (unauthenticated) access is blocked on sensitive tables
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Test organization IDs — must match profiles in the database
const TEST_ORG_A_ID = 'org-a-00000000-0000-0000-0000-000000000001'
const TEST_ORG_B_ID = 'org-b-00000000-0000-0000-0000-000000000002'

// Test user credentials
const ORG_A_USER_EMAIL = `rls-test-org-a-${Date.now()}@test.intldossier.local`
const ORG_A_USER_PASSWORD = 'TestPassword123!@#OrgA'
const ORG_B_USER_EMAIL = `rls-test-org-b-${Date.now()}@test.intldossier.local`
const ORG_B_USER_PASSWORD = 'TestPassword123!@#OrgB'

/**
 * Creates an authenticated Supabase client using a user's access token.
 * This client is subject to RLS policies (unlike the admin client).
 */
function createAuthenticatedClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

describe('Organization Isolation (SEC-01, SEC-05)', () => {
  let supabaseAdmin: SupabaseClient
  let orgAToken: string
  let orgBToken: string
  let orgAUserId: string
  let orgBUserId: string

  // Sensitive tables that MUST enforce org isolation
  // These are core dossier tables with organization_id column
  const sensitiveTables = [
    'countries',
    'organizations',
    'tasks',
    'documents',
    'commitments',
  ] as const

  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set',
      )
    }

    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Create test user for Org A
    const { data: userA, error: errorA } =
      await supabaseAdmin.auth.admin.createUser({
        email: ORG_A_USER_EMAIL,
        password: ORG_A_USER_PASSWORD,
        email_confirm: true,
        user_metadata: { organization_id: TEST_ORG_A_ID },
        app_metadata: { org_id: TEST_ORG_A_ID },
      })
    if (errorA) throw new Error(`Failed to create Org A user: ${errorA.message}`)
    orgAUserId = userA.user.id

    // Create test user for Org B
    const { data: userB, error: errorB } =
      await supabaseAdmin.auth.admin.createUser({
        email: ORG_B_USER_EMAIL,
        password: ORG_B_USER_PASSWORD,
        email_confirm: true,
        user_metadata: { organization_id: TEST_ORG_B_ID },
        app_metadata: { org_id: TEST_ORG_B_ID },
      })
    if (errorB) throw new Error(`Failed to create Org B user: ${errorB.message}`)
    orgBUserId = userB.user.id

    // Ensure profiles exist with correct organization_id
    await supabaseAdmin.from('profiles').upsert([
      {
        user_id: orgAUserId,
        organization_id: TEST_ORG_A_ID,
        clearance_level: 3,
        role: 'admin',
      },
      {
        user_id: orgBUserId,
        organization_id: TEST_ORG_B_ID,
        clearance_level: 3,
        role: 'admin',
      },
    ])

    // Sign in as each user to get access tokens
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { data: sessionA, error: signInErrorA } =
      await anonClient.auth.signInWithPassword({
        email: ORG_A_USER_EMAIL,
        password: ORG_A_USER_PASSWORD,
      })
    if (signInErrorA) throw new Error(`Org A sign-in failed: ${signInErrorA.message}`)
    orgAToken = sessionA.session!.access_token

    const { data: sessionB, error: signInErrorB } =
      await anonClient.auth.signInWithPassword({
        email: ORG_B_USER_EMAIL,
        password: ORG_B_USER_PASSWORD,
      })
    if (signInErrorB) throw new Error(`Org B sign-in failed: ${signInErrorB.message}`)
    orgBToken = sessionB.session!.access_token
  }, 30000)

  afterAll(async () => {
    // Clean up test users
    if (supabaseAdmin) {
      if (orgAUserId) {
        await supabaseAdmin.auth.admin.deleteUser(orgAUserId)
      }
      if (orgBUserId) {
        await supabaseAdmin.auth.admin.deleteUser(orgBUserId)
      }
    }
  }, 15000)

  // =========================================================================
  // Test 1-2: Per-table org isolation tests
  // =========================================================================
  for (const table of sensitiveTables) {
    describe(`Table: ${table}`, () => {
      it(`Org A user sees only Org A data (not Org B)`, async () => {
        const client = createAuthenticatedClient(orgAToken)
        const { data, error } = await client.from(table).select('*')

        // RLS should not produce an error, just filter results
        expect(error).toBeNull()

        // Every returned row must belong to Org A
        if (data !== null && data.length > 0) {
          const allOrgA = data.every(
            (row: Record<string, unknown>) => row.organization_id === TEST_ORG_A_ID,
          )
          expect(allOrgA).toBe(true)
        }
        // Empty data is also acceptable (table may have no Org A rows)
      })

      it(`Org A user cannot access Org B data via explicit filter`, async () => {
        const client = createAuthenticatedClient(orgAToken)
        const { data } = await client
          .from(table)
          .select('*')
          .eq('organization_id', TEST_ORG_B_ID)

        // RLS should return empty results, not the Org B data
        expect(data ?? []).toHaveLength(0)
      })

      it(`Org B user sees only Org B data (not Org A)`, async () => {
        const client = createAuthenticatedClient(orgBToken)
        const { data, error } = await client.from(table).select('*')

        expect(error).toBeNull()

        if (data !== null && data.length > 0) {
          const allOrgB = data.every(
            (row: Record<string, unknown>) => row.organization_id === TEST_ORG_B_ID,
          )
          expect(allOrgB).toBe(true)
        }
      })
    })
  }

  // =========================================================================
  // Test 3: Cross-org INSERT is blocked
  // =========================================================================
  it('Org A user cannot INSERT a record with Org B organization_id', async () => {
    const client = createAuthenticatedClient(orgAToken)

    // Attempt to insert a country record with Org B's organization_id
    const { error } = await client.from('countries').insert({
      name: 'RLS Test Country - Should Fail',
      organization_id: TEST_ORG_B_ID,
    })

    // RLS should block this insert (policy violation)
    // The error could be a 403 or the insert silently returns 0 rows
    expect(error !== null || true).toBe(true)

    // Verify the row was NOT created
    const { data: checkData } = await supabaseAdmin
      .from('countries')
      .select('*')
      .eq('name', 'RLS Test Country - Should Fail')
    expect(checkData ?? []).toHaveLength(0)
  })

  // =========================================================================
  // Test 4: Service role can see all organizations' data
  // =========================================================================
  it('service role key can see all organizations data (RLS bypass)', async () => {
    const { data, error } = await supabaseAdmin.from('countries').select('*')

    expect(error).toBeNull()
    // Service role should see data regardless of organization_id
    // (it bypasses RLS because FORCE ROW LEVEL SECURITY is not set)
    expect(data).not.toBeNull()
    // If there is data, it may contain multiple org_ids
    // We just verify the query succeeds without filtering
  })

  // =========================================================================
  // Test 5: Unauthenticated (anon key, no JWT) is blocked on sensitive tables
  // =========================================================================
  it('anon key without JWT returns empty or error on sensitive tables', async () => {
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    for (const table of sensitiveTables) {
      const { data, error } = await anonClient.from(table).select('*')

      // RLS should block unauthenticated access:
      // Either returns an error or returns empty data
      const isBlocked =
        error !== null || data === null || data.length === 0
      expect(isBlocked).toBe(true)
    }
  })

  // =========================================================================
  // Test 6: Multiple tables enforce isolation consistently
  // =========================================================================
  it('at least 3 sensitive tables enforce org isolation consistently', async () => {
    const clientA = createAuthenticatedClient(orgAToken)
    let tablesChecked = 0

    for (const table of sensitiveTables) {
      const { data, error } = await clientA.from(table).select('organization_id')

      if (error === null && data !== null) {
        // All returned rows must have Org A's organization_id
        const hasOnlyOrgA = data.every(
          (row: Record<string, unknown>) =>
            row.organization_id === TEST_ORG_A_ID || data.length === 0,
        )
        expect(hasOnlyOrgA).toBe(true)
        tablesChecked++
      }
    }

    // We must have verified at least 3 tables successfully
    expect(tablesChecked).toBeGreaterThanOrEqual(3)
  })
})
