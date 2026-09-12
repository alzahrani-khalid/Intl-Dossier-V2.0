#!/usr/bin/env node
//
// Phase 95 / DEAD-09 — behavioural probe for "report generation does REAL work".
//
// WHY THIS EXISTS. The `reports` POST was a mock: it minted a job_id, logged from a
// setTimeout and answered 202 {status:'pending'} with no url and no artifact. Every static
// check available (greps for createSignedUrl, a type-check, the generate-entry pin) can pass
// against source that was never deployed, or against a deploy whose upload silently fails.
// Only a real POST whose returned url is FETCHED can tell "generated" from "claimed".
//
// WHAT IT OBSERVES.
//   1. A real POST (format json) answers with `url` and status 'completed'.
//   2. That url is FETCHED and returns HTTP 200 with a non-empty body — the artifact, read
//      back. The absence of an error is NOT the assertion: a signed url for an object that
//      does not exist mints fine and 400s only when someone actually fetches it.
//   3. A POST for an unsupported format (pdf) is REFUSED — it must NOT come back as a
//      completed-with-url entry. Fabricating a format the server cannot build is the
//      forbidden shape this phase exists to prevent, so the refusal is observed too.
//
// EXIT CODES — a distinct 2 so "could not measure" is never read as a pass (GATE-STANDARD C2):
//   0  both assertions held: a fetchable artifact AND an honest refusal
//   1  the probe reached its subject and the subject failed
//   2  UNABLE TO MEASURE — missing credentials or sign-in failure. Never a pass.
//
// AUTH is inline from TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test (D-15 / E2ECRED-01:
// no oracle may depend on the Playwright `setup` project).
//
// This script never prints a credential, a token, or the signed url itself — the url IS the
// access grant to a private artifact (T-95-13). Its LENGTH is printed instead.
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

/**
 * EVERY report id the page offers — not one representative. Measured 2026-08-16: five of the
 * six data branches referenced columns that do not exist on the live schema and answered 500,
 * while `executive-dashboard` (head counts only) answered fine. A probe that sampled one type
 * would have certified the feature green with five sixths of it broken.
 */
const REPORT_TYPES = [
  'country-overview',
  'organization-profile',
  'mou-status',
  'event-summary',
  'intelligence-digest',
  'executive-dashboard',
]
/** The refusal branch is format-scoped, so one type is enough to observe it. */
const REFUSAL_TYPE = 'country-overview'

const user = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: auth, error: signInError } = await user.auth.signInWithPassword({
  email: TEST_USER_EMAIL,
  password: TEST_USER_PASSWORD,
})
const accessToken = auth?.session?.access_token
if (signInError || !accessToken) {
  console.error(`UNABLE TO MEASURE — sign-in failed: ${signInError?.message ?? 'no session'}`)
  process.exit(2)
}

/** Raw fetch rather than functions.invoke: invoke collapses every non-2xx to one message, and
 *  the refusal branch's whole point is its status code. */
const postReport = async (type, format) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, format, parameters: {} }),
  })

  let body = null
  try {
    body = await response.json()
  } catch {
    body = null
  }
  return { status: response.status, body }
}

const generatedTypes = []
let refusalHeld = false

// --- 1+2. REAL GENERATION, PER TYPE, ARTIFACT FETCHED BACK --------------------
for (const type of REPORT_TYPES) {
  const generated = await postReport(type, 'json')
  console.log(`POST reports (type=${type}, format=json) -> ${generated.status}`)
  console.log(`  response status field = ${generated.body?.status ?? '(none)'}`)
  console.log(
    `  response url length   = ${generated.body?.url ? String(generated.body.url).length : 0}`,
  )

  if (typeof generated.body?.url !== 'string' || generated.body.url.length === 0) {
    console.error(`FAIL — ${type}: the POST returned no url; nothing was generated`)
    continue
  }
  if (generated.body.status !== 'completed') {
    console.error(`FAIL — ${type}: expected status 'completed', got '${generated.body.status}'`)
    continue
  }

  // The assertion of record: a signed url mints fine for an object that does not exist and
  // only 400s when someone actually fetches it, so the artifact is READ BACK.
  const artifact = await fetch(generated.body.url)
  const bytes = artifact.ok ? (await artifact.arrayBuffer()).byteLength : 0
  console.log(`  GET artifact -> ${artifact.status}, ${bytes} bytes`)

  if (!artifact.ok) {
    console.error(`FAIL — ${type}: the signed url is not fetchable (HTTP ${artifact.status})`)
  } else if (bytes === 0) {
    console.error(`FAIL — ${type}: the artifact is empty`)
  } else {
    generatedTypes.push(type)
  }
}
const generationHeld = generatedTypes.length === REPORT_TYPES.length

// --- 2b. THE OTHER OFFERED FORMAT ---------------------------------------------
// The page offers csv and json. Observing only json would leave the same gap that let five
// broken data branches look green: an offered format nobody measured.
let csvHeld = false
const csv = await postReport(REFUSAL_TYPE, 'csv')
console.log(`POST reports (type=${REFUSAL_TYPE}, format=csv) -> ${csv.status}`)
if (typeof csv.body?.url === 'string' && csv.body.url.length > 0) {
  const csvArtifact = await fetch(csv.body.url)
  const csvBytes = csvArtifact.ok ? (await csvArtifact.arrayBuffer()).byteLength : 0
  console.log(`  GET artifact -> ${csvArtifact.status}, ${csvBytes} bytes`)
  csvHeld = csvArtifact.ok && csvBytes > 0
}
if (!csvHeld) {
  console.error('FAIL — csv is offered by the page but did not produce a fetchable artifact')
}

// --- 3. HONEST REFUSAL --------------------------------------------------------
const refused = await postReport(REFUSAL_TYPE, 'pdf')
console.log(`POST reports (type=${REFUSAL_TYPE}, format=pdf) -> ${refused.status}`)
console.log(`  response url length   = ${refused.body?.url ? String(refused.body.url).length : 0}`)

if (typeof refused.body?.url === 'string' && refused.body.url.length > 0) {
  console.error('FAIL — an unsupported format came back with a url (fabricated artifact)')
} else if (refused.body?.status === 'completed') {
  console.error('FAIL — an unsupported format came back completed')
} else {
  refusalHeld = true
  console.log(`  refusal code          = ${refused.body?.error?.code ?? '(none)'}`)
}

console.log('--- probe subjects ---')
console.log(`report_types_requested  = ${REPORT_TYPES.length} (${REPORT_TYPES.join(', ')})`)
console.log(`report_types_generated  = ${generatedTypes.length} (${generatedTypes.join(', ') || 'none'})`)
console.log(`generation_held         = ${generationHeld}`)
console.log(`csv_format_held         = ${csvHeld}`)
console.log(`honest_refusal_held     = ${refusalHeld}`)

if (generationHeld && csvHeld && refusalHeld) {
  console.log(
    `PASS — all ${REPORT_TYPES.length} report types produced a fetchable artifact in both offered formats, and pdf was refused`,
  )
  process.exit(0)
}
console.error('FAIL')
process.exit(1)
