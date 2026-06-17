/**
 * RF-7 high-sensitivity seed/restore fixture for Phase 71 (analytic graph).
 *
 * Staging is overwhelmingly sensitivity-1 (P68: dossier sensitivity is almost
 * entirely level 1), so a clearance-reduction test on live data produces
 * identical counts not because clearance works but because there is nothing
 * above clearance to hide (71-RESEARCH.md Pitfall 2). This fixture seeds a
 * deterministic set of ABOVE-clearance participation data hung off a single
 * low-sensitivity anchor so that a clearance-1 vs clearance-3 vs clearance-4
 * caller observes STRICTLY increasing node/edge counts for the identical query:
 *
 *   - anchor              : country dossier, sensitivity_level 1 (visible to all)
 *   - forum               : forum dossier,   sensitivity_level 3 + member_of edge
 *   - engagement          : engagement dossier, sensitivity_level 4 + participant
 *   - working group + 2 org members : sensitivity_level 3 (shared_committees case)
 *
 * Shared by query-graph.clearance.integration.test.ts +
 * query-graph.invoker.integration.test.ts AND the live UAT in plan 71-05
 * (71-VALIDATION.md "Wave 0"). Seed→observe→restore: every inserted id is
 * captured and deleted in FK-safe order in `restoreAnalyticGraphFixture`.
 *
 * Credentials are sourced from the environment (root `.env` then
 * `backend/.env.test`, loaded by `tests/setup.ts`) — never hardcoded
 * (threat T-71-01-SECRET). Seed rows use obvious `TEST` names so any row left
 * behind by a failed restore is trivially identifiable for manual cleanup
 * (threat T-71-01-LEAK).
 *
 * NOTE: this module instantiates a REAL service-role Supabase client via
 * `createClient` from `@supabase/supabase-js` (which `tests/setup.ts` does NOT
 * mock — it only mocks `@/config/supabase`). The service-role key bypasses RLS
 * so the fixture can seed/observe/restore high-sensitivity rows regardless of
 * the (deliberately untrusted) live `dossiers` SELECT policy set.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Every id seeded by the fixture, captured for FK-safe deletion on restore. */
export interface AnalyticGraphFixtureIds {
  /** Low-sensitivity (level 1) country anchor — visible to every clearance. */
  anchorDossierId: string
  /** sensitivity-3 forum dossier the anchor is `member_of`. */
  forumDossierId: string
  /** the dossier_relationships edge (anchor → forum, member_of, active). */
  forumMembershipEdgeId: string
  /** sensitivity-4 engagement dossier (start_date now()-5d). */
  engagementDossierId: string
  /** engagement_participants row (anchor participates as a country). */
  engagementParticipantId: string
  /** sensitivity-3 working group dossier (shared_committees case). */
  workingGroupDossierId: string
  /** two sensitivity-3 organization dossiers, both members of the WG. */
  orgDossierIdA: string
  orgDossierIdB: string
  /** the two working_group_members rows (org A + org B in the WG). */
  workingGroupMemberIdA: string
  workingGroupMemberIdB: string
}

/**
 * Build a service-role Supabase client from the environment.
 *
 * Service-role is required so the fixture can INSERT/DELETE above-clearance
 * rows irrespective of RLS. The actual clearance assertions in the tests use
 * SEPARATE per-clearance JWT clients — this client is fixture plumbing only.
 */
export function createServiceRoleClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (url == null || url === '' || serviceRoleKey == null || serviceRoleKey === '') {
    throw new Error(
      'analytic-graph-seed: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set ' +
        '(populate backend/.env.test for real-service tests).',
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Insert a single row and return its id, throwing with context on failure so
 * a partial seed surfaces loudly (and the test's restore still runs against
 * whatever ids were captured before the throw).
 */
async function insertReturningId(
  client: SupabaseClient,
  table: string,
  values: Record<string, unknown>,
): Promise<string> {
  const { data, error } = await client.from(table).insert(values).select('id').single()

  if (error != null) {
    throw new Error(`analytic-graph-seed: insert into ${table} failed: ${error.message}`)
  }
  const id = (data as { id?: string } | null)?.id
  if (id == null || id === '') {
    throw new Error(`analytic-graph-seed: insert into ${table} returned no id`)
  }
  return id
}

/** Insert a dossier of a given type/sensitivity and its CTI extension row. */
async function seedDossierWithExtension(
  client: SupabaseClient,
  params: {
    type: string
    nameEn: string
    nameAr: string
    sensitivityLevel: number
    extensionTable: string
    extensionValues?: Record<string, unknown>
  },
): Promise<string> {
  const dossierId = await insertReturningId(client, 'dossiers', {
    type: params.type,
    name_en: params.nameEn,
    name_ar: params.nameAr,
    status: 'active',
    sensitivity_level: params.sensitivityLevel,
  })

  const { error } = await client
    .from(params.extensionTable)
    .insert({ id: dossierId, ...(params.extensionValues ?? {}) })

  if (error != null) {
    throw new Error(
      `analytic-graph-seed: insert into ${params.extensionTable} failed: ${error.message}`,
    )
  }

  return dossierId
}

/**
 * Seed the RF-7 high-sensitivity fixture. Idempotent only in the sense that
 * each call creates a fresh, uniquely-id'd set; callers MUST pass the returned
 * ids to `restoreAnalyticGraphFixture` (typically in `afterAll`).
 */
export async function seedAnalyticGraphFixture(
  client: SupabaseClient,
): Promise<AnalyticGraphFixtureIds> {
  // (a) Low-sensitivity (level 1) country anchor — visible to every clearance.
  //     ISO codes are namespaced to avoid colliding with real seed rows.
  const anchorDossierId = await seedDossierWithExtension(client, {
    type: 'country',
    nameEn: 'TEST Analytic Anchor Country',
    nameAr: 'دولة مرجع التحليل للاختبار',
    sensitivityLevel: 1,
    extensionTable: 'countries',
    extensionValues: { iso_code_2: 'ZZ', iso_code_3: 'ZZZ' },
  })

  // (b) sensitivity-3 forum + member_of edge from the anchor.
  const forumDossierId = await seedDossierWithExtension(client, {
    type: 'forum',
    nameEn: 'TEST Secret Forum',
    nameAr: 'منتدى سري للاختبار',
    sensitivityLevel: 3,
    extensionTable: 'forums',
  })
  const forumMembershipEdgeId = await insertReturningId(client, 'dossier_relationships', {
    source_dossier_id: anchorDossierId,
    target_dossier_id: forumDossierId,
    relationship_type: 'member_of',
    status: 'active',
  })

  // (c) sensitivity-4 engagement (start_date 5 days ago) + anchor as participant.
  const engagementDossierId = await seedDossierWithExtension(client, {
    type: 'engagement',
    nameEn: 'TEST Top-Secret Engagement',
    nameAr: 'ارتباط سري للغاية للاختبار',
    sensitivityLevel: 4,
    extensionTable: 'engagement_dossiers',
    extensionValues: {
      engagement_type: 'bilateral_meeting',
      engagement_category: 'diplomatic',
      start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    },
  })
  const engagementParticipantId = await insertReturningId(client, 'engagement_participants', {
    engagement_id: engagementDossierId,
    participant_type: 'country',
    participant_dossier_id: anchorDossierId,
    role: 'guest',
  })

  // (d) sensitivity-3 working group + two organization members (shared_committees).
  const workingGroupDossierId = await seedDossierWithExtension(client, {
    type: 'working_group',
    nameEn: 'TEST Restricted Working Group',
    nameAr: 'مجموعة عمل مقيدة للاختبار',
    sensitivityLevel: 3,
    extensionTable: 'working_groups',
  })
  const orgDossierIdA = await seedDossierWithExtension(client, {
    type: 'organization',
    nameEn: 'TEST WG Member Org A',
    nameAr: 'منظمة عضو مجموعة العمل أ للاختبار',
    sensitivityLevel: 3,
    extensionTable: 'organizations',
    extensionValues: { org_type: 'international' },
  })
  const orgDossierIdB = await seedDossierWithExtension(client, {
    type: 'organization',
    nameEn: 'TEST WG Member Org B',
    nameAr: 'منظمة عضو مجموعة العمل ب للاختبار',
    sensitivityLevel: 3,
    extensionTable: 'organizations',
    extensionValues: { org_type: 'international' },
  })
  const workingGroupMemberIdA = await insertReturningId(client, 'working_group_members', {
    working_group_id: workingGroupDossierId,
    member_type: 'organization',
    organization_id: orgDossierIdA,
    role: 'member',
    status: 'active',
  })
  const workingGroupMemberIdB = await insertReturningId(client, 'working_group_members', {
    working_group_id: workingGroupDossierId,
    member_type: 'organization',
    organization_id: orgDossierIdB,
    role: 'member',
    status: 'active',
  })

  return {
    anchorDossierId,
    forumDossierId,
    forumMembershipEdgeId,
    engagementDossierId,
    engagementParticipantId,
    workingGroupDossierId,
    orgDossierIdA,
    orgDossierIdB,
    workingGroupMemberIdA,
    workingGroupMemberIdB,
  }
}

/** Delete one row by id, tolerating already-gone rows (cascade may have removed them). */
async function deleteById(client: SupabaseClient, table: string, id: string): Promise<void> {
  const { error } = await client.from(table).delete().eq('id', id)
  if (error != null) {
    throw new Error(`analytic-graph-seed: delete from ${table} (${id}) failed: ${error.message}`)
  }
}

/**
 * Restore staging by deleting every captured id in FK-safe order
 * (children → junction → extension/dossier). Dossier deletes cascade to their
 * CTI extension rows + relationships + participants, but each row is removed
 * explicitly so a restore failure points at the exact table.
 */
export async function restoreAnalyticGraphFixture(
  client: SupabaseClient,
  ids: AnalyticGraphFixtureIds,
): Promise<void> {
  // 1. junction / participation rows first (they reference the dossiers below)
  await deleteById(client, 'working_group_members', ids.workingGroupMemberIdA)
  await deleteById(client, 'working_group_members', ids.workingGroupMemberIdB)
  await deleteById(client, 'engagement_participants', ids.engagementParticipantId)
  await deleteById(client, 'dossier_relationships', ids.forumMembershipEdgeId)

  // 2. the dossiers (ON DELETE CASCADE removes their CTI extension rows)
  await deleteById(client, 'dossiers', ids.engagementDossierId)
  await deleteById(client, 'dossiers', ids.forumDossierId)
  await deleteById(client, 'dossiers', ids.workingGroupDossierId)
  await deleteById(client, 'dossiers', ids.orgDossierIdA)
  await deleteById(client, 'dossiers', ids.orgDossierIdB)
  await deleteById(client, 'dossiers', ids.anchorDossierId)
}
