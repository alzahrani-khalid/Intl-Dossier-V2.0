#!/usr/bin/env node
//
// Phase 94 / WRITE-01 — behavioural probe for success criterion 1's "published" clause
// (RULING-P94-06 B6).
//
// WHY THIS EXISTS. Before it, the only verification that an after-action could be PUBLISHED was
// four greps plus `type-check` — nothing that could fail if create->publish did not work. The e2e
// both 94-01 and `94-VALIDATION.md:88` originally nominated navigates to `/after-action/create`,
// a route that does not exist in the tree, so it yields an uninformative red rather than evidence.
//
// WHAT IT OBSERVES. The WRITE, read back: create -> publish -> re-read the row and assert
// `publication_status === 'published'`. The absence of an error is NOT the assertion; RLS denials
// read as empty 200s, so only the read-back can distinguish "published" from "silently refused".
//
// EXIT CODES — a distinct 2 so "could not measure" is never read as a pass (GATE-STANDARD C2):
//   0  create + publish + read-back all held, fixture removed
//   1  the probe reached its subject and the subject failed
//   2  UNABLE TO MEASURE — the probe could not reach its subject (missing credentials, sign-in
//      failure, or no engagement dossier free of an existing after-action). Never a pass.
//
// EVERY fixture this probe creates is namespaced `p94-probe-…` and removed on exit, including the
// temporary dossier_owners grant it needs to satisfy after-actions-create's ownership check.
//
// AUTH is inline from TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test (D-27 / E2ECRED-01: no
// oracle may depend on the Playwright `setup` project). This script never prints a credential,
// a token, or any env value.
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: resolve(repoRoot, '.env.test') })

const { SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD } = process.env

const missing = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
].filter((name) => !process.env[name])
if (missing.length > 0) {
  console.error(`UNABLE TO MEASURE — missing from .env.test: ${missing.join(', ')}`)
  process.exit(2)
}

/** Namespaced so a leaked fixture is identifiable and greppable. */
const RUN_ID = `p94-probe-${new Date().toISOString().replace(/[:.]/g, '-')}`
/** Every id this run touched, printed at the end so a failure names its subjects. */
const subjects = {
  engagementDossierId: null,
  afterActionId: null,
  grantedOwnership: false,
  cleanedUp: false,
  ownershipRevoked: false,
}

/**
 * `functions.invoke` collapses every non-2xx to "Edge Function returned a non-2xx status code".
 * A probe whose failure does not name the status is not evidence — dig the Response out.
 */
const describeFnError = async (error) => {
  const status = error?.context?.status
  let body = ''
  try {
    body = await error.context.text()
  } catch {
    body = '(body unreadable)'
  }
  return `${error?.message ?? 'unknown'} [status=${status ?? '?'}] ${body}`
}

const report = (code) => {
  console.log('--- probe subjects ---')
  console.log(`run_id                  = ${RUN_ID}`)
  console.log(`engagement_dossier_id   = ${subjects.engagementDossierId ?? '(none)'}`)
  console.log(`after_action_id         = ${subjects.afterActionId ?? '(none)'}`)
  console.log(`granted_ownership       = ${subjects.grantedOwnership}`)
  console.log(`fixture_cleaned_up      = ${subjects.cleanedUp}`)
  console.log(`ownership_revoked       = ${subjects.ownershipRevoked}`)
  process.exit(code)
}

const user = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: session, error: signInError } = await user.auth.signInWithPassword({
  email: TEST_USER_EMAIL,
  password: TEST_USER_PASSWORD,
})
if (signInError || !session?.user) {
  console.error(`UNABLE TO MEASURE — sign-in failed: ${signInError?.message ?? 'no session'}`)
  process.exit(2)
}
const uid = session.user.id

// FIXTURE SELECTION. Two live constraints shape it, both measured rather than assumed:
//   * `after_action_records_engagement_id_key` is UNIQUE on engagement_id — one after-action per
//     engagement — so an engagement that already has one returns 500 on create. (Measured: the
//     first run collided.)
//   * `after-actions-create/index.ts:103-118` requires a `dossier_owners` row for the engagement's
//     own dossier, and on staging the test user owns exactly one engagement — the one that is
//     already taken.
// So the probe secures its own subject: it picks an engagement with no after-action and, if the
// user does not already own it, grants a dossier_owners row that cleanup revokes. Selection reads
// use the service-role key because a row hidden by RLS would still collide; the ASSERTION path
// (create / publish / read-back) runs entirely as the user.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceKey) {
  console.error('UNABLE TO MEASURE — SUPABASE_SERVICE_ROLE_KEY absent; cannot select a fixture')
  process.exit(2)
}
const admin = createClient(SUPABASE_URL, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: engagements, error: engagementError } = await admin
  .from('dossiers')
  .select('id')
  .eq('type', 'engagement')
  .limit(500)
if (engagementError) {
  console.error(`UNABLE TO MEASURE — dossiers read failed: ${engagementError.message}`)
  report(2)
}
if (!engagements || engagements.length === 0) {
  console.error('UNABLE TO MEASURE — no engagement dossiers exist')
  report(2)
}

const candidateIds = engagements.map((row) => row.id)
const { data: taken, error: takenError } = await admin
  .from('after_action_records')
  .select('engagement_id')
  .in('engagement_id', candidateIds)
if (takenError) {
  console.error(`UNABLE TO MEASURE — after_action_records read failed: ${takenError.message}`)
  report(2)
}
const takenIds = new Set((taken ?? []).map((row) => row.engagement_id))
const free = candidateIds.filter((id) => !takenIds.has(id))
if (free.length === 0) {
  console.error(
    `UNABLE TO MEASURE — all ${candidateIds.length} engagement dossiers already have an ` +
      'after-action (unique constraint after_action_records_engagement_id_key)',
  )
  report(2)
}

const { data: owned, error: ownedError } = await admin
  .from('dossier_owners')
  .select('dossier_id')
  .eq('user_id', uid)
  .in('dossier_id', free)
if (ownedError) {
  console.error(`UNABLE TO MEASURE — dossier_owners read failed: ${ownedError.message}`)
  report(2)
}
const alreadyOwned = (owned ?? []).map((row) => row.dossier_id)
subjects.engagementDossierId = alreadyOwned[0] ?? free[0]

if (alreadyOwned.length === 0) {
  const { error: grantError } = await admin
    .from('dossier_owners')
    .insert({ dossier_id: subjects.engagementDossierId, user_id: uid, role_type: 'owner' })
  if (grantError) {
    console.error(`UNABLE TO MEASURE — could not grant fixture ownership: ${grantError.message}`)
    report(2)
  }
  subjects.grantedOwnership = true
  console.log(`granted temporary ownership of ${subjects.engagementDossierId} (revoked on exit)`)
}

// --- 1. CREATE ---------------------------------------------------------------
const { data: created, error: createError } = await user.functions.invoke('after-actions-create', {
  body: {
    engagement_id: subjects.engagementDossierId,
    is_confidential: false,
    attendees: [`${RUN_ID} attendee`],
    notes: RUN_ID,
  },
})
if (createError || !created?.id) {
  console.error(
    `FAIL — after-actions-create: ${createError ? await describeFnError(createError) : 'no id returned'}`,
  )
  await cleanup()
  report(1)
}
subjects.afterActionId = created.id
console.log(`created ${subjects.afterActionId} (publication_status=${created.publication_status})`)

// --- 2. PUBLISH --------------------------------------------------------------
const { error: publishError } = await user.functions.invoke('after-actions-publish', {
  body: { after_action_id: subjects.afterActionId, is_confidential: false },
})
if (publishError) {
  console.error(`FAIL — after-actions-publish: ${await describeFnError(publishError)}`)
  await cleanup()
  report(1)
}

// --- 3. READ BACK — the assertion of record -----------------------------------
const { data: readBack, error: readError } = await user
  .from('after_action_records')
  .select('id, publication_status')
  .eq('id', subjects.afterActionId)
  .maybeSingle()
if (readError) {
  console.error(`FAIL — read-back rejected: ${readError.message}`)
  await cleanup()
  report(1)
}
if (!readBack) {
  // An RLS denial reads as an empty 200. Absence is a FAILURE here, never a pass.
  console.error('FAIL — read-back returned no row (RLS denial or missing record)')
  await cleanup()
  report(1)
}
console.log(`read back publication_status = ${readBack.publication_status}`)
const held = readBack.publication_status === 'published'
if (!held) {
  console.error(
    `FAIL — expected publication_status 'published', got '${readBack.publication_status}'`,
  )
}

await cleanup()
console.log(held ? 'PASS — created, published and read back as published' : 'FAIL')
report(held ? 0 : 1)

/**
 * Remove everything this run created: the after-action row, then the temporary ownership grant.
 * Runs as service role — after_action_records RLS does not grant the author a DELETE on a
 * PUBLISHED record, so a user-client delete would silently leave the fixture behind.
 */
async function cleanup() {
  if (subjects.afterActionId) {
    const { error } = await admin
      .from('after_action_records')
      .delete()
      .eq('id', subjects.afterActionId)
    if (error) {
      console.error(`WARNING — fixture ${subjects.afterActionId} NOT removed: ${error.message}`)
    } else {
      subjects.cleanedUp = true
    }
  }
  if (subjects.grantedOwnership) {
    const { error } = await admin
      .from('dossier_owners')
      .delete()
      .eq('dossier_id', subjects.engagementDossierId)
      .eq('user_id', uid)
    if (error) {
      console.error(`WARNING — ownership grant NOT revoked: ${error.message}`)
    } else {
      subjects.ownershipRevoked = true
    }
  }
}
