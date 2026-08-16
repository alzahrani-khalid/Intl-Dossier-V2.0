#!/usr/bin/env node
// Phase 94 / WRITE-06 — the D-22 TWO-SIDED report-RLS oracle.
//
// D-22 forbids a one-sided oracle. Proving `42P17 infinite recursion detected in policy` is gone
// would pass a policy that returns every report to every reader. So this probe asserts BOTH halves
// against the REAL PostgREST surface, with three real authenticated identities:
//
//   positive — no 42P17 anywhere, A can create a report, share it, and schedule it;
//   negative — the visible row set did NOT widen: A sees own+shared, B sees exactly the row shared
//              with them, C (a signed-in stranger) sees NONE.
//
// Identities are minted with the service-role key (PARK-94-07 ruled (a) — only TEST_USER_* is
// provisioned, so a second and third seat have to be minted). Fixtures are namespaced `p94-probe-`,
// every id acted on is PRINTED, and cleanup runs in a `finally` so a failed run leaves nothing
// behind: `custom_reports`, `report_shares` and `report_schedules` are live-empty on staging and
// must be left so.
//
// D-34/F4: `trigger_update_schedule_next_run` derives `next_run_at`, and an INACTIVE schedule
// legitimately has it NULL. This probe PRINTS next_run_at and asserts NOTHING about it.
//
// HOUSE RULE (scripts/probe-edge-auth.sh): never print a key, a password or a JWT.
//
// Exit codes:  0 every assertion held and cleanup verified
//              1 an assertion failed (pre-migration this is the 42P17 RED)
//              2 UNABLE TO MEASURE — credentials absent (GATE-STANDARD C2: not a red)
//
// Usage: node scripts/probe-report-rls.mjs

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
const SEATS = ['a', 'b', 'c']
const emailFor = (seat) => `p94-probe-${seat}@probe.invalid`
const PASSWORD = `p94-probe-${process.pid}-${Date.now().toString(36)}`

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

/** Every report id this identity can SELECT, through its own RLS. */
const visibleReportIds = async (user) => {
  const res = await rest('GET', '/custom_reports?select=id&order=created_at.asc', {
    key: ANON,
    jwt: user.jwt,
  })
  assertNoRecursion(`custom_reports SELECT as ${user.seat}`, res)
  if (!res.ok) throw new Error(`custom_reports SELECT as ${user.seat} HTTP ${res.status}: ${res.text}`)
  return (res.json ?? []).map((r) => r.id)
}

const visibleShareIds = async (user) => {
  const res = await rest('GET', '/report_shares?select=id&order=created_at.asc', {
    key: ANON,
    jwt: user.jwt,
  })
  assertNoRecursion(`report_shares SELECT as ${user.seat}`, res)
  if (!res.ok) throw new Error(`report_shares SELECT as ${user.seat} HTTP ${res.status}: ${res.text}`)
  return (res.json ?? []).map((r) => r.id)
}

const serviceCount = async (table) => {
  const res = await rest('GET', `/${table}?select=id`, { key: SERVICE })
  return (res.json ?? []).length
}

// ---- the probe -----------------------------------------------------------------
const users = []
let reportId = null
let shareId = null
let scheduleId = null

try {
  console.log(`probe-report-rls — ${SUPABASE_URL}`)
  console.log('\n[1] mint three identities (service-role)')
  for (const seat of SEATS) {
    const u = await mintUser(seat)
    users.push(u)
    console.log(`  ${seat.toUpperCase()} ${u.email} -> ${u.id}`)
  }
  const [A, B, C] = users

  console.log('\n[2] as A: create a report, then share it to B')
  const created = await rest('POST', '/custom_reports', {
    key: ANON,
    jwt: A.jwt,
    prefer: 'return=representation',
    body: {
      name: 'p94-probe-report',
      configuration: { probe: 'p94-05', sections: [] },
      created_by: A.id,
    },
  })
  assertNoRecursion('custom_reports INSERT as A', created)
  if (!created.ok || !created.json?.[0]?.id) {
    throw new Error(`custom_reports INSERT as A HTTP ${created.status}: ${created.text}`)
  }
  reportId = created.json[0].id
  console.log(`  report  p94-probe-report -> ${reportId} (access_level=${created.json[0].access_level})`)

  const shared = await rest('POST', '/report_shares', {
    key: ANON,
    jwt: A.jwt,
    prefer: 'return=representation',
    body: { report_id: reportId, shared_with: B.id, shared_by: A.id, permission: 'view' },
  })
  assertNoRecursion('report_shares INSERT as A', shared)
  if (!shared.ok || !shared.json?.[0]?.id) {
    throw new Error(`report_shares INSERT as A HTTP ${shared.status}: ${shared.text}`)
  }
  shareId = shared.json[0].id
  console.log(`  share   report ${reportId} -> B ${B.id} = ${shareId}`)

  console.log('\n[3] D-22 two-sided visibility (the negative half is the point)')
  const seenA = await visibleReportIds(A)
  const seenB = await visibleReportIds(B)
  const seenC = await visibleReportIds(C)
  console.log(`  A sees custom_reports: [${seenA.join(', ')}]`)
  console.log(`  B sees custom_reports: [${seenB.join(', ')}]`)
  console.log(`  C sees custom_reports: [${seenC.join(', ')}]`)
  check('A sees exactly her own report', seenA.length === 1 && seenA[0] === reportId, `${seenA.length} row(s)`)
  check('B sees exactly the row shared with them', seenB.length === 1 && seenB[0] === reportId, `${seenB.length} row(s)`)
  check('C (stranger) sees NO report — the row set did not widen', seenC.length === 0, `${seenC.length} row(s)`)

  const sharesA = await visibleShareIds(A)
  const sharesB = await visibleShareIds(B)
  const sharesC = await visibleShareIds(C)
  console.log(`  A sees report_shares: [${sharesA.join(', ')}]`)
  console.log(`  B sees report_shares: [${sharesB.join(', ')}]`)
  console.log(`  C sees report_shares: [${sharesC.join(', ')}]`)
  check('A sees the share row (is_report_owner / shared_by path)', sharesA.length === 1 && sharesA[0] === shareId)
  check('B sees the share row (shared_with path)', sharesB.length === 1 && sharesB[0] === shareId)
  check('C sees NO share row', sharesC.length === 0, `${sharesC.length} row(s)`)

  console.log('\n[4] criterion 5 — a scheduled report against a real custom_reports row')
  const schedule = await rest('POST', '/report_schedules', {
    key: ANON,
    jwt: A.jwt,
    prefer: 'return=representation',
    body: {
      report_id: reportId,
      name: 'p94-probe-schedule',
      frequency: 'weekly',
      day_of_week: 1,
      time: '09:00:00',
      timezone: 'UTC',
      export_format: 'pdf',
      recipients: ['p94-probe-a@probe.invalid'],
      is_active: false,
      created_by: A.id,
    },
  })
  assertNoRecursion('report_schedules INSERT as A', schedule)
  if (!schedule.ok || !schedule.json?.[0]?.id) {
    throw new Error(`report_schedules INSERT as A HTTP ${schedule.status}: ${schedule.text}`)
  }
  scheduleId = schedule.json[0].id
  // D-34/F4: next_run_at is trigger-derived and NULL is legitimate while is_active=false. PRINTED,
  // never asserted.
  console.log(
    `  schedule p94-probe-schedule -> ${scheduleId} (is_active=${schedule.json[0].is_active}, next_run_at=${schedule.json[0].next_run_at})`,
  )
  const readback = await rest(`GET`, `/report_schedules?select=id,report_id&id=eq.${scheduleId}`, {
    key: ANON,
    jwt: A.jwt,
  })
  assertNoRecursion('report_schedules SELECT as A', readback)
  check(
    'A reads her schedule back, bound to the real report',
    readback.ok && readback.json?.length === 1 && readback.json[0].report_id === reportId,
    `HTTP ${readback.status}`,
  )
} catch (err) {
  console.log(`\nHARD FAIL — ${err.message}`)
  failures.push(err.message)
} finally {
  console.log('\n[5] cleanup (reverse order) — both report tables were live-empty; leave them so')
  if (scheduleId) {
    const r = await rest('DELETE', `/report_schedules?id=eq.${scheduleId}`, { key: SERVICE })
    console.log(`  schedule ${scheduleId} deleted -> HTTP ${r.status}`)
  }
  if (shareId) {
    const r = await rest('DELETE', `/report_shares?id=eq.${shareId}`, { key: SERVICE })
    console.log(`  share ${shareId} deleted -> HTTP ${r.status}`)
  }
  if (reportId) {
    const r = await rest('DELETE', `/custom_reports?id=eq.${reportId}`, { key: SERVICE })
    console.log(`  report ${reportId} deleted -> HTTP ${r.status}`)
  }
  for (const u of users) {
    const r = await adminDeleteUser(u.id)
    console.log(`  user ${u.email} (${u.id}) deleted -> HTTP ${r.status}`)
  }

  const left = {
    custom_reports: await serviceCount('custom_reports'),
    report_shares: await serviceCount('report_shares'),
    report_schedules: await serviceCount('report_schedules'),
  }
  console.log(`  service-role row counts after cleanup: ${JSON.stringify(left)}`)
  check(
    'fixtures cleaned — custom_reports / report_shares / report_schedules all back to 0',
    left.custom_reports === 0 && left.report_shares === 0 && left.report_schedules === 0,
    JSON.stringify(left),
  )
}

console.log('')
if (failures.length > 0) {
  console.log(`PROBE FAILED — ${failures.length} assertion(s): ${failures.join(' | ')}`)
  process.exit(1)
}
console.log('PROBE PASSED — no 42P17; A=1 / B=1 / C=0; schedule created; fixtures cleaned')
process.exit(0)
