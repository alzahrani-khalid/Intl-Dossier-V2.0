#!/usr/bin/env node
//
// Phase 94 / WRITE-02 — behavioural probe for the DEPLOYED `after-actions-list-all` function.
//
// WHY THIS EXISTS. The repaired join is composed inside the edge function, so no amount of source
// grepping observes it: Supabase serves the bundle it was last given (D-19). This probe calls the
// deployed artifact and reads the answer.
//
// WHAT IT OBSERVES, and why each half is needed:
//   1. HTTP 200 with `{ data: [], total }` — before the fix the function returned 500 for every
//      caller, because both PostgREST embeds died at relationship resolution (PGRST200:
//      `after_action_records` has no FK on engagement_id or dossier_id).
//   2. The COMPOSED shape — every row carries `engagement` and `dossier` KEYS whose values are
//      object-or-null. `undefined` would mean the compose step never ran.
//   3. NOTHING IS HIDDEN — the id set the function returns is compared against the id set the same
//      user reads directly from `after_action_records` under the same RLS. The old inner-join
//      embeds silently deleted every row whose join missed; a strict subset here is that bug.
//      Absence of an error is NOT the assertion — an RLS denial reads as an empty 200, so only the
//      set comparison distinguishes "listed" from "silently dropped".
//   4. The DEGRADED case is represented, not hidden — for every record whose engagement dossier has
//      no `engagement_dossiers` extension row, the returned row must be present with
//      `engagement_date === null`.
//
// POPULATION. Both publication_status values that exist on staging today are probed, derived rather
// than assumed: the function filters by status and defaults to `published`, while the only live
// record is a `draft`. A single default call would have measured an empty list and called it green.
//
// EXIT CODES — a distinct 2 so "could not measure" is never read as a pass (GATE-STANDARD C2):
//   0  every assertion held
//   1  the probe reached its subject and the subject failed
//   2  UNABLE TO MEASURE — missing credentials or sign-in failure. Never a pass, never a red.
//
// AUTH is inline from TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test (D-27 / E2ECRED-01: no
// oracle may depend on the Playwright `setup` project). This script never prints a credential, a
// token, or any env value. It creates no fixtures and writes nothing.
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

/** Every status the function accepts; the probe derives its population instead of guessing one. */
const STATUSES = ['draft', 'published', 'edit_requested', 'edit_approved']

const failures = []
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL — ${message}`)
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

// --- the expectation, read as the same user under the same RLS ----------------
// This is the id set the deployed function MUST return per status. Reading it through PostgREST
// rather than the function is the point: it is the base table without the composed join, so a
// function that drops half-joined rows shows up as a missing id here and nowhere else.
const expectedByStatus = new Map()
for (const status of STATUSES) {
  const { data, error } = await user
    .from('after_action_records')
    .select('id, engagement_id, dossier_id')
    .eq('publication_status', status)
  if (error) {
    console.error(`UNABLE TO MEASURE — direct after_action_records read failed: ${error.message}`)
    process.exit(2)
  }
  expectedByStatus.set(status, data ?? [])
}

const allRecords = [...expectedByStatus.values()].flat()
const engagementIds = [...new Set(allRecords.map((r) => r.engagement_id).filter(Boolean))]

// Which engagement ids have NO extension row — the degraded population (D-13), derived live.
let degradedEngagementIds = new Set()
if (engagementIds.length > 0) {
  const { data: extensions, error: extError } = await user
    .from('engagement_dossiers')
    .select('id')
    .in('id', engagementIds)
  if (extError) {
    console.error(`UNABLE TO MEASURE — engagement_dossiers read failed: ${extError.message}`)
    process.exit(2)
  }
  const present = new Set((extensions ?? []).map((e) => e.id))
  degradedEngagementIds = new Set(engagementIds.filter((id) => !present.has(id)))
}

console.log(`records visible to this user : ${allRecords.length}`)
console.log(`engagement ids               : ${engagementIds.length}`)
console.log(`  of which missing extension : ${degradedEngagementIds.size}`)

// --- the assertions, against the DEPLOYED function ----------------------------
let totalRows = 0
let nullEngagement = 0
let nullDossier = 0
let nullEngagementDate = 0
const seenIds = new Set()

for (const status of STATUSES) {
  const { data: body, error: invokeError } = await user.functions.invoke('after-actions-list-all', {
    body: { status, limit: 100 },
  })
  if (invokeError) {
    fail(`invoke(status=${status}): ${await describeFnError(invokeError)}`)
    continue
  }
  if (!body || !Array.isArray(body.data) || typeof body.total !== 'number') {
    fail(`invoke(status=${status}): expected { data: [], total: number }, got ${JSON.stringify(body)?.slice(0, 200)}`)
    continue
  }

  const rows = body.data
  totalRows += rows.length
  console.log(`status=${String(status).padEnd(14)} -> 200, ${rows.length} row(s), total=${body.total}`)

  // 2. the composed shape — keys PRESENT, values object-or-null.
  for (const row of rows) {
    seenIds.add(row.id)
    for (const key of ['engagement', 'dossier']) {
      if (!(key in row)) {
        fail(`row ${row.id}: '${key}' key absent — the compose step did not run`)
        continue
      }
      const value = row[key]
      if (value !== null && (typeof value !== 'object' || Array.isArray(value))) {
        fail(`row ${row.id}: '${key}' is neither object nor null (${typeof value})`)
      }
    }
    if (row.engagement === null) nullEngagement += 1
    if (row.dossier === null) nullDossier += 1
    if (row.engagement !== null && row.engagement !== undefined && row.engagement.engagement_date === null) {
      nullEngagementDate += 1
    }
  }

  // 3. nothing hidden — the function's id set must cover the base-table id set.
  const expected = expectedByStatus.get(status) ?? []
  const returned = new Set(rows.map((r) => r.id))
  const dropped = expected.filter((r) => !returned.has(r.id))
  if (dropped.length > 0) {
    fail(
      `status=${status}: ${dropped.length} of ${expected.length} record(s) visible to this user ` +
        `were NOT returned by the function — ${dropped.map((r) => r.id).join(', ')}`,
    )
  }

  // 4. the degraded case is represented rather than hidden.
  for (const record of expected) {
    if (!degradedEngagementIds.has(record.engagement_id)) continue
    const row = rows.find((r) => r.id === record.id)
    if (!row) {
      fail(`degraded record ${record.id} (no engagement_dossiers row) is HIDDEN from the list`)
      continue
    }
    if (row.engagement !== null && row.engagement?.engagement_date !== null) {
      fail(
        `degraded record ${record.id}: expected engagement_date null (no extension row), got ` +
          `${JSON.stringify(row.engagement?.engagement_date)}`,
      )
    }
  }
}

console.log('--- composed-row census ---')
console.log(`rows returned across all statuses : ${totalRows}`)
console.log(`rows with engagement === null     : ${nullEngagement}`)
console.log(`rows with dossier === null        : ${nullDossier}`)
console.log(`rows with engagement_date === null: ${nullEngagementDate}`)

if (failures.length > 0) {
  console.error(`FAIL — ${failures.length} assertion(s) failed`)
  process.exit(1)
}
if (seenIds.size === 0 && allRecords.length > 0) {
  fail('the function returned zero rows while the base table shows records for this user')
  process.exit(1)
}
console.log('PASS — deployed function answers 200 with the composed shape and hides nothing')
process.exit(0)
