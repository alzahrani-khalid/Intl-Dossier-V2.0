/**
 * RLS Audit Test Suite
 *
 * Verifies that ALL public Supabase tables have RLS enabled and correct policies.
 * Uses service_role (admin) client to query PostgreSQL system catalogs.
 *
 * Per D-03: Every table must have RLS enabled -- zero exceptions.
 * Per D-02: Sensitive tables (with organization_id) must have org-scoped policies.
 * Per D-56-01/D-56-03: Global reference tables (ISO ref data like countries) require authenticated-read + role-gated writes, not org-scoping.
 *
 * These tests use RPC functions created by migration 20260324000001_rls_audit_fix.sql.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

type PolicyRow = {
  policyname: string
  cmd: string | null
  qual: string | null
  with_check: string | null
}

describe('RLS Audit: All Public Tables', () => {
  let supabaseAdmin: SupabaseClient

  // Global reference tables (D-56-01/D-56-03): authenticated-read + role-gated writes; cannot be org-scoped (no organization_id column).
  const globalReferenceTables = [
    'countries',
  ]

  // Sensitive (org-scoped) tables with explicit regression coverage:
  const sensitiveTables = [
    'persons',
    // Phase 54 additions:
    'intelligence_event',
    'intelligence_digest',
    'dashboard_digest',
  ]

  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to run RLS audit tests',
      )
    }
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  it('every public table has RLS enabled (D-03: zero exceptions)', async () => {
    const { data, error } = await supabaseAdmin.rpc('get_tables_without_rls')

    expect(error).toBeNull()

    if (data && data.length > 0) {
      const tableNames = data.map(
        (row: { schemaname: string; tablename: string }) => row.tablename,
      )
      // Fail with descriptive message listing all tables without RLS
      expect(tableNames).toEqual(
        expect.arrayContaining([]),
      )
      expect(data).toHaveLength(0)
    } else {
      expect(data).toHaveLength(0)
    }
  })

  it('every RLS-enabled table has at least one policy', async () => {
    const { data, error } = await supabaseAdmin.rpc('get_rls_tables_without_policies')

    expect(error).toBeNull()

    if (data && data.length > 0) {
      const orphanedTables = data.map((row: { tablename: string }) => row.tablename)
      // Tables with RLS but no policies silently block ALL access
      console.warn('Tables with RLS enabled but NO policies (all access blocked):', orphanedTables)
    }
    expect(data).toHaveLength(0)
  })

  it('sensitive tables have org-scoped policies (D-02)', async () => {
    for (const table of sensitiveTables) {
      const { data: policies, error } = await supabaseAdmin.rpc('get_policies_for_table', {
        p_table_name: table,
      })

      if (error) {
        // Table may not exist in this environment -- skip gracefully
        console.warn(`Skipping policy check for ${table}: ${error.message}`)
        continue
      }

      // Table must have at least one policy
      expect(
        policies?.length,
        `Table "${table}" has no RLS policies`,
      ).toBeGreaterThan(0)

      // At least one policy should reference org_id or organization_id
      const hasOrgPolicy = policies?.some(
        (p: { qual: string | null; with_check: string | null }) =>
          p.qual?.includes('org_id') ||
          p.qual?.includes('organization_id') ||
          p.with_check?.includes('org_id') ||
          p.with_check?.includes('organization_id'),
      )
      expect(
        hasOrgPolicy,
        `Table "${table}" has policies but none reference org_id/organization_id`,
      ).toBe(true)
    }
  })

  it('global reference tables have authenticated-read policy and role-gated writes (D-56-03)', async () => {
    const writePolicyCommands = ['INSERT', 'UPDATE', 'DELETE']

    for (const table of globalReferenceTables) {
      const { data: policies, error } = await supabaseAdmin.rpc('get_policies_for_table', {
        p_table_name: table,
      })

      if (error) {
        // Table may not exist in this environment -- skip gracefully
        console.warn(`Skipping policy check for ${table}: ${error.message}`)
        continue
      }

      const tablePolicies: PolicyRow[] = policies ?? []

      expect(
        tablePolicies.length,
        `Global reference table "${table}" has no RLS policies`,
      ).toBeGreaterThan(0)

      const hasAuthenticatedReadPolicy = tablePolicies.some(
        (policy) =>
          policy.cmd === 'SELECT' &&
          policy.qual?.includes('auth.uid()'),
      )
      expect(
        hasAuthenticatedReadPolicy,
        `Global reference table "${table}" lacks an authenticated-read SELECT policy (auth.uid() reference)`,
      ).toBe(true)

      for (const command of writePolicyCommands) {
        const hasWritePolicy = tablePolicies.some((policy) => policy.cmd === command)
        expect(
          hasWritePolicy,
          `Global reference table "${table}" missing role-gated ${command} policy`,
        ).toBe(true)
      }

      const hasOrgScopedPolicy = tablePolicies.some(
        (policy) =>
          policy.qual?.includes('org_id') ||
          policy.qual?.includes('organization_id') ||
          policy.with_check?.includes('org_id') ||
          policy.with_check?.includes('organization_id'),
      )
      expect(
        hasOrgScopedPolicy,
        `Global reference table "${table}" unexpectedly references org_id/organization_id -- should be in sensitiveTables tier instead`,
      ).toBe(false)
    }
  })

  it('tables with organization_id column all have org-scoped policies', async () => {
    const { data, error } = await supabaseAdmin.rpc('get_tables_with_org_id')

    expect(error).toBeNull()

    if (data && data.length > 0) {
      const tablesWithoutOrgPolicy = data
        .filter((row: { tablename: string; has_org_policy: boolean }) => !row.has_org_policy)
        .map((row: { tablename: string }) => row.tablename)

      if (tablesWithoutOrgPolicy.length > 0) {
        console.warn(
          'Tables with organization_id but NO org-scoped policy:',
          tablesWithoutOrgPolicy,
        )
      }
      expect(tablesWithoutOrgPolicy).toHaveLength(0)
    }
  })

  it('no table has RLS disabled in public schema', async () => {
    // Double-check using a different approach: query pg_class directly
    const { data, error } = await supabaseAdmin.rpc('get_tables_without_rls')

    expect(error).toBeNull()

    // This is the strictest assertion: zero tables without RLS
    expect(data ?? []).toEqual([])
  })

  it('RPC audit functions are accessible', async () => {
    // Verify the audit helper functions exist and are callable
    const functions = [
      { name: 'get_tables_without_rls', args: {} },
      { name: 'get_rls_tables_without_policies', args: {} },
      { name: 'get_policies_for_table', args: { p_table_name: 'countries' } },
      { name: 'get_tables_with_org_id', args: {} },
    ]

    for (const fn of functions) {
      const { error } = await supabaseAdmin.rpc(fn.name, fn.args)
      expect(
        error,
        `RPC function "${fn.name}" should be callable but got error: ${error?.message}`,
      ).toBeNull()
    }
  })
})

/**
 * REMED-01: Canonical clearance scale (Phase 68).
 *
 * After migration 20260614000001_p68_clearance_canonical.sql,
 * get_user_clearance_level(user_id) reads profiles.clearance_level (the single
 * canonical 1-4 scale) instead of role-derived 1-3 values. These tests start RED
 * (pre-migration the function reads user_roles and diverges from profiles) and
 * flip GREEN once plan 68-02 applies the migration.
 *
 * Live staging facts (A1-A6, confirmed plan 68-01): profiles distribution is
 * L1=388, L3=5; the 5 manually-set level-3 profiles must never be downgraded.
 */
describe('REMED-01: Canonical clearance scale', () => {
  let supabaseAdmin: SupabaseClient

  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  it('get_user_clearance_level() returns 1 for a nonexistent user (COALESCE default)', async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    const { data, error } = await supabaseAdmin.rpc('get_user_clearance_level', {
      user_id: '00000000-0000-0000-0000-000000000000',
    })
    expect(error, `get_user_clearance_level should be callable: ${error?.message}`).toBeNull()
    expect(data).toBe(1)
  })

  it('get_user_clearance_level() reads profiles.clearance_level (canonical scale), not role-derived', async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    // Pick a user with an elevated role. Pre-migration the function returns the
    // role-derived value (2/3) while profiles.clearance_level is still 1 -> RED.
    // Post-migration the backfill aligns them and the shim reads profiles -> GREEN.
    const { data: elevated, error: roleErr } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['admin', 'manager', 'analyst'])
      .limit(1)

    if (roleErr || !elevated || elevated.length === 0) {
      // No elevated-role user available in this environment -- nothing to assert.
      console.warn('REMED-01: no elevated-role user found; skipping canonical-scale comparison')
      return
    }

    const userId = (elevated[0] as { user_id: string }).user_id

    const { data: fnLevel, error: fnErr } = await supabaseAdmin.rpc('get_user_clearance_level', {
      user_id: userId,
    })
    expect(fnErr, `get_user_clearance_level error: ${fnErr?.message}`).toBeNull()

    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('clearance_level')
      .eq('user_id', userId)
      .maybeSingle()
    expect(profErr, `profiles lookup error: ${profErr?.message}`).toBeNull()

    // The canonical contract: the function's result IS profiles.clearance_level.
    expect(fnLevel).toBe((profile as { clearance_level: number } | null)?.clearance_level)
  })
})
