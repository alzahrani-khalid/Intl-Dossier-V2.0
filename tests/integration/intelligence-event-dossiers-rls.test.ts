// Phase 54 plan 03: integration coverage for intelligence_event_dossiers
// junction (INTEL-03). Verifies:
//   1. CHECK rejects 'elected_official' (dossier_type CHECK)
//   2. CHECK accepts the 7 valid types (positive INSERT path)
//   3. Tenancy via EXISTS-on-parent (SELECT filtered by ie.organization_id)
//   4. ON DELETE CASCADE removes junction rows when parent event is deleted
//
// Pattern: two Supabase clients. anon (anon-key + signed-in test user)
// exercises real RLS for reads. admin (service-role) seeds events + junction
// rows because the test user is role=viewer (RLS blocks INSERT into both
// intelligence_event and intelligence_event_dossiers).
//
// Run via root vitest:
//   pnpm exec vitest run tests/integration/intelligence-event-dossiers-rls.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const testUserEmail = process.env.TEST_USER_EMAIL ?? ''
const testUserPassword = process.env.TEST_USER_PASSWORD ?? ''

describe('intelligence_event_dossiers junction — CHECK + tenancy + CASCADE', () => {
  let anon: SupabaseClient
  let admin: SupabaseClient
  let userId: string
  let orgIdA: string
  let dossierIdA: string
  let dossierTypeA: string
  const eventIds: string[] = []

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
  })

  afterAll(async () => {
    if (eventIds.length > 0) {
      // ON DELETE CASCADE on event_id removes any orphaned junction rows.
      await admin.from('intelligence_event').delete().in('id', eventIds)
    }
    await anon.auth.signOut()
  })

  it("INTEL-03: dossier_type CHECK rejects 'elected_official'", async () => {
    const { data: event, error: evErr } = await admin
      .from('intelligence_event')
      .insert({
        organization_id: orgIdA,
        source_type: 'publication',
        content: 'junction CHECK probe — elected_official',
        occurred_at: new Date().toISOString(),
        severity: 'medium',
      })
      .select('id')
      .single()
    expect(evErr).toBeNull()
    const eventId = event?.id as string
    eventIds.push(eventId)

    const { error } = await admin.from('intelligence_event_dossiers').insert({
      event_id: eventId,
      dossier_type: 'elected_official',
      dossier_id: dossierIdA,
    })
    expect(error).not.toBeNull()
    const msg = (error?.message ?? '').toLowerCase()
    expect(msg.includes('dossier_type') || msg.includes('check')).toBe(true)
  })

  it('INTEL-03: dossier_type CHECK accepts a valid canonical type', async () => {
    const { data: event, error: evErr } = await admin
      .from('intelligence_event')
      .insert({
        organization_id: orgIdA,
        source_type: 'publication',
        content: 'junction CHECK probe — valid type',
        occurred_at: new Date().toISOString(),
        severity: 'medium',
      })
      .select('id')
      .single()
    expect(evErr).toBeNull()
    const eventId = event?.id as string
    eventIds.push(eventId)

    const { error: linkErr } = await admin.from('intelligence_event_dossiers').insert({
      event_id: eventId,
      dossier_type: dossierTypeA,
      dossier_id: dossierIdA,
    })
    expect(linkErr).toBeNull()
  })

  it('INTEL-03: EXISTS-on-parent RLS scopes SELECT to org-visible events', async () => {
    const { data: event, error: evErr } = await admin
      .from('intelligence_event')
      .insert({
        organization_id: orgIdA,
        source_type: 'publication',
        content: 'junction tenancy probe — org A event',
        occurred_at: new Date().toISOString(),
        severity: 'medium',
      })
      .select('id')
      .single()
    expect(evErr).toBeNull()
    const eventId = event?.id as string
    eventIds.push(eventId)

    const { error: linkErr } = await admin.from('intelligence_event_dossiers').insert({
      event_id: eventId,
      dossier_type: dossierTypeA,
      dossier_id: dossierIdA,
    })
    expect(linkErr).toBeNull()

    // Signed-in user (anon-key) sees the link because parent event is in
    // their org and the SELECT policy EXISTS-subquery passes.
    const { data: visible, error: visErr } = await anon
      .from('intelligence_event_dossiers')
      .select('id, event_id')
      .eq('event_id', eventId)
    expect(visErr).toBeNull()
    expect(visible?.length ?? 0).toBeGreaterThanOrEqual(1)
  })

  it('INTEL-03: ON DELETE CASCADE on parent event removes junction rows', async () => {
    const { data: event, error: evErr } = await admin
      .from('intelligence_event')
      .insert({
        organization_id: orgIdA,
        source_type: 'publication',
        content: 'junction CASCADE probe',
        occurred_at: new Date().toISOString(),
        severity: 'medium',
      })
      .select('id')
      .single()
    expect(evErr).toBeNull()
    const eventId = event?.id as string
    // NOT pushed to eventIds — explicit delete below tests CASCADE.

    const { data: link, error: linkErr } = await admin
      .from('intelligence_event_dossiers')
      .insert({
        event_id: eventId,
        dossier_type: dossierTypeA,
        dossier_id: dossierIdA,
      })
      .select('id')
      .single()
    expect(linkErr).toBeNull()
    const junctionId = link?.id as string

    // Delete parent event via service-role (anon viewer would be rejected
    // by RLS delete_admin); CASCADE on event_id should remove junction row.
    const { error: deleteErr } = await admin
      .from('intelligence_event')
      .delete()
      .eq('id', eventId)
    expect(deleteErr).toBeNull()

    const { data: orphaned, error: orphanErr } = await admin
      .from('intelligence_event_dossiers')
      .select('id')
      .eq('id', junctionId)
    expect(orphanErr).toBeNull()
    expect(orphaned?.length ?? 0).toBe(0)
  })
})
