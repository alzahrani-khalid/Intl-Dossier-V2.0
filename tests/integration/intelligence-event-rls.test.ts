// Phase 54 plan 02: integration coverage for intelligence_event + intelligence_digest
// RLS, severity CHECK, signal_source_type enum, and period CHECK behavior.
//
// Pattern: two Supabase clients.
//   - `anon` (anon key + signed-in test user) exercises real RLS reads/writes.
//   - `admin` (service-role key) seeds rows for SELECT cases and probes the
//     DB-level CHECK / enum constraints in isolation from RLS gating.
//
// The seeded test user has role='viewer' in public.users, which the
// intelligence_event/intelligence_digest INSERT policy gates out
// (requires admin|editor). That is intentional production behavior — RLS
// works. To exercise the table-level CHECK and enum constraints we go around
// RLS via the service-role client.
//
// Requirements verified: INTEL-01 (RLS + severity CHECK), INTEL-02 (RLS +
// period CHECK), INTEL-04 (enum CHECK on source_type).
//
// Run via root vitest:
//   pnpm exec vitest run tests/integration/intelligence-event-rls.test.ts
//
// Required env: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_ANON_KEY (or
// VITE_SUPABASE_ANON_KEY), SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL,
// TEST_USER_PASSWORD.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const testUserEmail = process.env.TEST_USER_EMAIL ?? ''
const testUserPassword = process.env.TEST_USER_PASSWORD ?? ''

describe('intelligence_event + intelligence_digest RLS + CHECK enforcement', () => {
  let anon: SupabaseClient
  let admin: SupabaseClient
  let userId: string
  let orgIdA: string
  let orgIdB: string | null = null
  let dossierIdA: string
  let dossierTypeA: string
  const eventIds: string[] = []
  const digestIds: string[] = []
  const PROBE_ID_PREFIX = 'phase54-rls-probe-'

  beforeAll(async () => {
    expect(supabaseAnonKey).not.toBe('')
    expect(supabaseServiceRoleKey).not.toBe('')

    anon = createClient(supabaseUrl, supabaseAnonKey)
    admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: authData, error: signInError } = await anon.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    })
    expect(signInError).toBeNull()
    userId = authData?.user?.id ?? ''
    expect(userId).not.toBe('')

    const { data: membership, error: memberError } = await admin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .is('left_at', null)
      .limit(1)
      .single()
    expect(memberError).toBeNull()
    orgIdA = (membership?.organization_id as string) ?? ''
    expect(orgIdA).not.toBe('')

    const { data: otherOrg } = await admin
      .from('organizations')
      .select('id')
      .neq('id', orgIdA)
      .limit(1)
      .maybeSingle()
    orgIdB = (otherOrg?.id as string | undefined) ?? null

    // dossiers has no organization_id column — pick any visible dossier
    // whose type is one of the 7 canonical values for intelligence_digest.
    const allowedTypes = [
      'country',
      'organization',
      'forum',
      'engagement',
      'topic',
      'working_group',
      'person',
    ]
    const { data: dossier, error: dossierError } = await admin
      .from('dossiers')
      .select('id, type')
      .in('type', allowedTypes)
      .limit(1)
      .single()
    expect(dossierError).toBeNull()
    dossierIdA = (dossier?.id as string) ?? ''
    dossierTypeA = (dossier?.type as string) ?? 'organization'
    expect(dossierIdA).not.toBe('')

    // Seed one event row and one digest row via service-role client so the
    // anon-key SELECT assertions have something to find.
    const nowIso = new Date().toISOString()
    const { data: insertedEvent, error: eventError } = await admin
      .from('intelligence_event')
      .insert({
        organization_id: orgIdA,
        source_type: 'publication',
        source_ref: `${PROBE_ID_PREFIX}seed`,
        content: 'Phase 54 plan 02 RLS test row — seeded for SELECT coverage.',
        occurred_at: nowIso,
        severity: 'medium',
      })
      .select('id')
      .single()
    expect(eventError).toBeNull()
    if (insertedEvent?.id !== undefined) {
      eventIds.push(insertedEvent.id as string)
    }

    const periodStart = new Date(Date.now() - 60 * 60_000).toISOString()
    const periodEnd = new Date().toISOString()
    const { data: insertedDigest, error: digestError } = await admin
      .from('intelligence_digest')
      .insert({
        organization_id: orgIdA,
        dossier_type: dossierTypeA,
        dossier_id: dossierIdA,
        period_start: periodStart,
        period_end: periodEnd,
        summary: 'Phase 54 plan 02 RLS test digest — seeded for SELECT coverage.',
      })
      .select('id')
      .single()
    expect(digestError).toBeNull()
    if (insertedDigest?.id !== undefined) {
      digestIds.push(insertedDigest.id as string)
    }
  })

  afterAll(async () => {
    if (eventIds.length > 0) {
      await admin.from('intelligence_event').delete().in('id', eventIds)
    }
    if (digestIds.length > 0) {
      await admin.from('intelligence_digest').delete().in('id', digestIds)
    }
    await anon.auth.signOut()
  })

  it('INTEL-01: SELECT returns own-org rows, filters cross-tenant rows', async () => {
    const { data: ownRows, error: ownError } = await anon
      .from('intelligence_event')
      .select('id, organization_id')
      .eq('organization_id', orgIdA)
    expect(ownError).toBeNull()
    expect(ownRows?.length ?? 0).toBeGreaterThanOrEqual(1)

    if (orgIdB !== null) {
      const { data: crossRows, error: crossError } = await anon
        .from('intelligence_event')
        .select('id')
        .eq('organization_id', orgIdB)
      expect(crossError).toBeNull()
      expect(crossRows?.length ?? 0).toBe(0)
    } else {
      console.warn(
        '⚠ Staging has no second organization — cross-tenant SELECT assertion skipped (Test 1).',
      )
    }
  })

  it('INTEL-01: INSERT via anon viewer is rejected by RLS (insert_editor + tenant)', async () => {
    // The seeded test user is role=viewer, so the 4-policy template rejects
    // INSERT at the auth_has_any_role(ARRAY['admin','editor']) clause. This
    // proves the policy is wired and gating.
    const targetOrg = orgIdB ?? orgIdA
    const { error } = await anon.from('intelligence_event').insert({
      organization_id: targetOrg,
      source_type: 'publication',
      content: 'anon viewer insert attempt',
      occurred_at: new Date().toISOString(),
      severity: 'medium',
    })
    expect(error).not.toBeNull()
    const msg = (error?.message ?? '').toLowerCase()
    expect(msg.includes('row-level security') || msg.includes('row level security')).toBe(true)
  })

  it("INTEL-01: severity CHECK rejects 'critical' (probed via service-role)", async () => {
    const { error } = await admin.from('intelligence_event').insert({
      organization_id: orgIdA,
      source_type: 'publication',
      content: 'severity check probe',
      occurred_at: new Date().toISOString(),
      // 'critical' is outside the work-item Priority vocab
      // (low/medium/high/urgent) so the CHECK constraint must reject it.
      severity: 'critical' as unknown as 'low' | 'medium' | 'high' | 'urgent',
    })
    expect(error).not.toBeNull()
    const msg = (error?.message ?? '').toLowerCase()
    expect(msg.includes('severity') || msg.includes('check')).toBe(true)
  })

  it('INTEL-04: signal_source_type enum rejects invalid value (probed via service-role)', async () => {
    const { error } = await admin.from('intelligence_event').insert({
      organization_id: orgIdA,
      // 'invalid_value' is not a member of signal_source_type — PG enum
      // input parser must reject before the row reaches RLS or table CHECK.
      source_type: 'invalid_value' as unknown as
        | 'publication'
        | 'feed'
        | 'human_entered'
        | 'ai_generated',
      content: 'enum check probe',
      occurred_at: new Date().toISOString(),
      severity: 'medium',
    })
    expect(error).not.toBeNull()
    const msg = (error?.message ?? '').toLowerCase()
    expect(msg.includes('invalid') || msg.includes('enum') || msg.includes('signal_source_type'))
      .toBe(true)
  })

  it('INTEL-02: period CHECK rejects period_end <= period_start (probed via service-role)', async () => {
    const start = new Date()
    const earlierEnd = new Date(start.getTime() - 60_000)
    const { error } = await admin.from('intelligence_digest').insert({
      organization_id: orgIdA,
      dossier_type: dossierTypeA,
      dossier_id: dossierIdA,
      period_start: start.toISOString(),
      period_end: earlierEnd.toISOString(),
      summary: 'period check probe',
    })
    expect(error).not.toBeNull()
    const msg = (error?.message ?? '').toLowerCase()
    expect(
      msg.includes('period_end') || msg.includes('period_start') || msg.includes('check'),
    ).toBe(true)
  })

  it('INTEL-02: SELECT returns own-org digest, filters cross-tenant', async () => {
    const { data: ownRows, error: ownError } = await anon
      .from('intelligence_digest')
      .select('id, organization_id')
      .eq('organization_id', orgIdA)
    expect(ownError).toBeNull()
    expect(ownRows?.length ?? 0).toBeGreaterThanOrEqual(1)

    if (orgIdB !== null) {
      const { data: crossRows, error: crossError } = await anon
        .from('intelligence_digest')
        .select('id')
        .eq('organization_id', orgIdB)
      expect(crossError).toBeNull()
      expect(crossRows?.length ?? 0).toBe(0)
    } else {
      console.warn(
        '⚠ Staging has no second organization — cross-tenant digest SELECT skipped (Test 6).',
      )
    }
  })
})
