#!/usr/bin/env node
// Phase 96 / SANDBOX-500-01 — the TWO-SIDED scenario-RLS oracle.
//
// A one-sided oracle is forbidden here (96-RESEARCH §Security Domain, V4). Proving
// `42P17 infinite recursion detected in policy` is gone would ALSO pass a policy that returns
// every scenario to every reader — the recursion and the wide-open gate are indistinguishable to
// a probe that only checks for the absence of an error. So this asserts BOTH halves against the
// REAL PostgREST surface, with three real authenticated identities:
//
//   positive — no 42P17 anywhere; A creates two scenarios and collaborates one of them to B;
//   negative — the visible row set did NOT widen: A sees both of her own, B sees EXACTLY the one
//              collaborated to them (never A's other scenario), C (a signed-in stranger) sees NONE.
//
// The B-sees-exactly-one half is why A creates TWO scenarios. With a single fixture, "B sees 1 row"
// is satisfied by a policy that returns everything, and the probe would certify the defect it
// exists to catch.
//
// POPULATION DEFINITION (D-15). This proof covers SELECT visibility on `scenarios` and
// `scenario_collaborators` for three identity classes (owner / collaborator / stranger) through
// PostgREST on staging. FALLS OUTSIDE: INSERT/UPDATE/DELETE row behaviour — those policies had the
// same EXISTS-over-scenarios clause substituted clause-for-clause, so their row sets are preserved
// by construction, not by measurement here (the INSERT path is exercised incidentally, since A
// must pass `scenario_collaborators_insert` WITH CHECK to create the fixture); and service-role
// access, which bypasses RLS entirely and is used ONLY for minting identities and cleanup.
//
// Identities are minted with the service-role key (only TEST_USER_* is provisioned, so a second
// and third seat have to be minted — the P94 precedent). Fixtures are namespaced `P96-RLSPROOF-`,
// every id acted on is PRINTED, and cleanup runs in a `finally` so a failed run leaves nothing
// behind. Both tables were live-empty on staging when this was written; the baseline is captured
// at start and re-asserted after cleanup rather than hardcoded, so a concurrently-seeded row does
// not read as a leaked fixture.
//
// HOUSE RULE (scripts/probe-edge-auth.sh): never print a key, a password or a JWT.
//
// Exit codes:  0 every assertion held and cleanup verified
//              1 an assertion failed (pre-migration this is the 42P17 RED)
//              2 UNABLE TO MEASURE — credentials absent (GATE-STANDARD C2: not a red)
//
// Usage: node scripts/probe-scenario-rls.mjs

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---- credentials ---------------------------------------------------------------
// process.env wins; .env.test is the fallback (it is gitignored and holds the staging keys).
const loadEnvFile = (path) => {
  const out = {}
  if (!existsSync(path)) return out
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    out[m[1]] = m[2].trim().replace(/^["'](.*)["']$/, '$1')
  }
  return out
}

const fileEnv = loadEnvFile(join(ROOT, '.env.test'))
const env = (k) => process.env[k] ?? fileEnv[k] ?? ''

const SUPABASE_URL = env('SUPABASE_URL').replace(/\/$/, '')
const ANON = env('SUPABASE_ANON_KEY')
const SERVICE = env('SUPABASE_SERVICE_ROLE_KEY')

const missing = [
  ['SUPABASE_URL', SUPABASE_URL],
  ['SUPABASE_ANON_KEY', ANON],
  ['SUPABASE_SERVICE_ROLE_KEY', SERVICE],
]
  .filter(([, v]) => v === '')
  .map(([k]) => k)

if (missing.length > 0) {
  console.log(`UNABLE TO MEASURE — missing credential(s): ${missing.join(', ')}`)
  console.log('Set them in .env.test or the environment. This is a labelled state, not a failure.')
  process.exit(2)
}

// ---- tiny HTTP helpers ---------------------------------------------------------
const RECURSION = /42P17|infinite recursion/i

/** Never echoes a key or a token — only method, path, status and body. */
const call = async (method, path, { key, jwt, body, prefer } = {}) => {
  const headers = { apikey: key, Authorization: `Bearer ${jwt ?? key}` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (prefer) headers.Prefer = prefer
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text === '' ? null : JSON.parse(text)
  } catch {
    json = null
  }
  return { status: res.status, ok: res.ok, text, json }
}

const rest = (method, path, opts) => call(method, `/rest/v1${path}`, opts)

/** Hard-fails the run the moment a recursion error appears anywhere. */
const assertNoRecursion = (label, res) => {
  if (RECURSION.test(res.text)) {
    throw new Error(`42P17 RECURSION at ${label} (HTTP ${res.status}): ${res.text}`)
  }
}

// ---- assertions ----------------------------------------------------------------
const failures = []
const check = (label, ok, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail === undefined ? '' : ` — ${detail}`}`)
  if (!ok) failures.push(label)
}

// ---- identities ----------------------------------------------------------------
const NS = 'P96-RLSPROOF-'
const SEATS = ['a', 'b', 'c']
const emailFor = (seat) => `p96-rlsproof-${seat}@probe.invalid`
const PASSWORD = `p96-rlsproof-${process.pid}-${Date.now().toString(36)}`

const adminFindByEmail = async (email) => {
  for (let page = 1; page <= 5; page += 1) {
    const res = await call('GET', `/auth/v1/admin/users?page=${page}&per_page=200`, { key: SERVICE })
    const users = res.json?.users ?? []
    const hit = users.find((u) => u.email === email)
    if (hit) return hit.id
    if (users.length < 200) return null
  }
  return null
}

const adminDeleteUser = async (id) =>
  call('DELETE', `/auth/v1/admin/users/${id}`, { key: SERVICE, body: { should_soft_delete: false } })

const mintUser = async (seat) => {
  const email = emailFor(seat)
  let res = await call('POST', '/auth/v1/admin/users', {
    key: SERVICE,
    body: { email, password: PASSWORD, email_confirm: true },
  })
  if (!res.ok) {
    // A prior crashed run may have left the namespaced seat behind — reclaim it, then retry once.
    const stale = await adminFindByEmail(email)
    if (stale) {
      console.log(`  reclaiming stale probe user ${email} -> ${stale}`)
      await adminDeleteUser(stale)
      res = await call('POST', '/auth/v1/admin/users', {
        key: SERVICE,
        body: { email, password: PASSWORD, email_confirm: true },
      })
    }
  }
  if (!res.ok || !res.json?.id) {
    throw new Error(`could not mint ${email} (HTTP ${res.status}): ${res.text}`)
  }
  const token = await call('POST', '/auth/v1/token?grant_type=password', {
    key: ANON,
    body: { email, password: PASSWORD },
  })
  const jwt = token.json?.access_token
  if (!jwt) throw new Error(`could not sign in ${email} (HTTP ${token.status})`)
  return { seat, email, id: res.json.id, jwt }
}

/** Every scenario id this identity can SELECT, through its own RLS. */
const visibleScenarioIds = async (user) => {
  const res = await rest('GET', '/scenarios?select=id&order=created_at.asc', {
    key: ANON,
    jwt: user.jwt,
  })
  assertNoRecursion(`scenarios SELECT as ${user.seat}`, res)
  if (!res.ok) throw new Error(`scenarios SELECT as ${user.seat} HTTP ${res.status}: ${res.text}`)
  return (res.json ?? []).map((r) => r.id)
}

const visibleCollaboratorIds = async (user) => {
  const res = await rest('GET', '/scenario_collaborators?select=id&order=added_at.asc', {
    key: ANON,
    jwt: user.jwt,
  })
  assertNoRecursion(`scenario_collaborators SELECT as ${user.seat}`, res)
  if (!res.ok) {
    throw new Error(`scenario_collaborators SELECT as ${user.seat} HTTP ${res.status}: ${res.text}`)
  }
  return (res.json ?? []).map((r) => r.id)
}

const serviceCount = async (table) => {
  const res = await rest('GET', `/${table}?select=id`, { key: SERVICE })
  return (res.json ?? []).length
}

/** A scenario row satisfying every NOT NULL column; `type` is the live scenario_type enum. */
const scenarioBody = (ownerId, label) => ({
  title_en: `${NS}${label}`,
  title_ar: `${NS}${label}`,
  type: 'policy_change',
  created_by: ownerId,
})

// ---- the probe -----------------------------------------------------------------
const users = []
let sharedScenarioId = null
let privateScenarioId = null
let collabId = null
let baseline = null

try {
  console.log(`probe-scenario-rls — ${SUPABASE_URL}`)
  console.log(
    '\nPOPULATION: SELECT visibility on scenarios + scenario_collaborators for owner /' +
      ' collaborator / stranger. OUTSIDE: INSERT/UPDATE/DELETE row behaviour, service-role access.',
  )

  baseline = {
    scenarios: await serviceCount('scenarios'),
    scenario_collaborators: await serviceCount('scenario_collaborators'),
  }
  console.log(`\n[0] pre-run service-role baseline: ${JSON.stringify(baseline)}`)

  console.log('\n[1] mint three identities (service-role)')
  for (const seat of SEATS) {
    const u = await mintUser(seat)
    users.push(u)
    console.log(`  ${seat.toUpperCase()} ${u.email} -> ${u.id}`)
  }
  const [A, B, C] = users

  console.log('\n[2] as A: create TWO scenarios, collaborate ONE of them to B')
  for (const label of ['shared', 'private']) {
    const created = await rest('POST', '/scenarios', {
      key: ANON,
      jwt: A.jwt,
      prefer: 'return=representation',
      body: scenarioBody(A.id, label),
    })
    assertNoRecursion(`scenarios INSERT (${label}) as A`, created)
    if (!created.ok || !created.json?.[0]?.id) {
      throw new Error(`scenarios INSERT (${label}) as A HTTP ${created.status}: ${created.text}`)
    }
    const id = created.json[0].id
    if (label === 'shared') sharedScenarioId = id
    else privateScenarioId = id
    console.log(`  scenario ${NS}${label} -> ${id} (status=${created.json[0].status})`)
  }

  const collab = await rest('POST', '/scenario_collaborators', {
    key: ANON,
    jwt: A.jwt,
    prefer: 'return=representation',
    body: { scenario_id: sharedScenarioId, user_id: B.id, role: 'viewer' },
  })
  assertNoRecursion('scenario_collaborators INSERT as A', collab)
  if (!collab.ok || !collab.json?.[0]?.id) {
    throw new Error(`scenario_collaborators INSERT as A HTTP ${collab.status}: ${collab.text}`)
  }
  collabId = collab.json[0].id
  console.log(`  collaborator  scenario ${sharedScenarioId} -> B ${B.id} = ${collabId}`)

  console.log('\n[3] two-sided visibility (the negative half is the point)')
  const seenA = await visibleScenarioIds(A)
  const seenB = await visibleScenarioIds(B)
  const seenC = await visibleScenarioIds(C)
  console.log(`  A sees scenarios: [${seenA.join(', ')}]`)
  console.log(`  B sees scenarios: [${seenB.join(', ')}]`)
  console.log(`  C sees scenarios: [${seenC.join(', ')}]`)
  check(
    'A (owner) sees exactly her own two scenarios',
    seenA.length === 2 &&
      seenA.includes(sharedScenarioId) &&
      seenA.includes(privateScenarioId),
    `${seenA.length} row(s)`,
  )
  check(
    'B (collaborator) sees EXACTLY the collaborated scenario — not A’s other one',
    seenB.length === 1 && seenB[0] === sharedScenarioId,
    `${seenB.length} row(s)`,
  )
  check(
    'C (stranger) sees NO scenario — the row set did not widen',
    seenC.length === 0,
    `${seenC.length} row(s)`,
  )

  const collabsA = await visibleCollaboratorIds(A)
  const collabsB = await visibleCollaboratorIds(B)
  const collabsC = await visibleCollaboratorIds(C)
  console.log(`  A sees scenario_collaborators: [${collabsA.join(', ')}]`)
  console.log(`  B sees scenario_collaborators: [${collabsB.join(', ')}]`)
  console.log(`  C sees scenario_collaborators: [${collabsC.join(', ')}]`)
  check(
    'A sees the collaborator row (is_scenario_owner path — the substituted clause)',
    collabsA.length === 1 && collabsA[0] === collabId,
    `${collabsA.length} row(s)`,
  )
  check(
    'B sees the collaborator row (user_id path — the preserved clause)',
    collabsB.length === 1 && collabsB[0] === collabId,
    `${collabsB.length} row(s)`,
  )
  check('C sees NO collaborator row', collabsC.length === 0, `${collabsC.length} row(s)`)
} catch (err) {
  console.log(`\nHARD FAIL — ${err.message}`)
  failures.push(err.message)
} finally {
  console.log('\n[4] cleanup (reverse order) — leave both tables at the pre-run baseline')
  if (collabId) {
    const r = await rest('DELETE', `/scenario_collaborators?id=eq.${collabId}`, { key: SERVICE })
    console.log(`  collaborator ${collabId} deleted -> HTTP ${r.status}`)
  }
  for (const id of [privateScenarioId, sharedScenarioId]) {
    if (!id) continue
    const r = await rest('DELETE', `/scenarios?id=eq.${id}`, { key: SERVICE })
    console.log(`  scenario ${id} deleted -> HTTP ${r.status}`)
  }
  for (const u of users) {
    const r = await adminDeleteUser(u.id)
    console.log(`  user ${u.email} (${u.id}) deleted -> HTTP ${r.status}`)
  }

  const left = {
    scenarios: await serviceCount('scenarios'),
    scenario_collaborators: await serviceCount('scenario_collaborators'),
  }
  console.log(`  service-role row counts after cleanup: ${JSON.stringify(left)}`)
  check(
    'fixtures cleaned — both tables back to the pre-run baseline',
    baseline !== null &&
      left.scenarios === baseline.scenarios &&
      left.scenario_collaborators === baseline.scenario_collaborators,
    `${JSON.stringify(left)} vs baseline ${JSON.stringify(baseline)}`,
  )
}

console.log('')
if (failures.length > 0) {
  console.log(`PROBE FAILED — ${failures.length} assertion(s): ${failures.join(' | ')}`)
  process.exit(1)
}
console.log('PROBE PASSED — no 42P17; A=2 / B=1 (the collaborated one) / C=0; fixtures cleaned')
process.exit(0)
