#!/usr/bin/env node
// Phase 94 Plan 08 / WRITE-04 — the D-32 WRITE-THEN-READ-BACK oracle for commitment persistence.
//
// D-32 forbids proving persistence by the absence of an error: the kanban's write SUCCEEDS and is
// then silently overwritten by a BEFORE UPDATE trigger. So this probe never asks "was there an
// error"; it asks "what does the stored row say", and it asserts BOTH directions:
//
//   PERSISTENCE   a NOT-past-due commitment written to `in_progress` reads back `in_progress`
//   COERCION      a PAST-DUE commitment written to `in_progress` reads back `overdue`
//
// The coercion side is a live CONTROL, not decoration. It is the standing drift alarm on the
// condition `frontend/src/pages/WorkBoard/commitment-stage-guard.ts` mirrors. If it ever reads
// `in_progress`, the trigger changed and the client guard has silently drifted — exit 1 DRIFT.
//
// W5 / RULING-P94-06: the UPDATE and the read-back run through a REAL USER JWT, never the
// service-role key. A service-role read bypasses RLS and therefore cannot see the `WITH CHECK`
// silent-zero-row class — an UPDATE that matches no row returns HTTP 200 with an empty body, which
// is indistinguishable from success to any oracle that only checks the status code. The
// service-role key is used for fixture setup and cleanup ONLY.
//
// F3 (P94-TRIGGER-SWEEP): `commitment_status_history` records the COERCED status, not user intent.
// This probe CLEANS UP the history rows it causes and asserts NOTHING about their contents.
//
// T-94-14: fixtures are namespaced `p94-probe-readback`, every id acted on is PRINTED, and cleanup
// runs in a `finally`. The 10 live commitments on staging are never touched — the census is
// captured before and re-asserted after.
//
// HOUSE RULE (scripts/probe-edge-auth.sh): never print a key, a password or a JWT.
//
// Exit codes:  0 both sides held and cleanup verified
//              1 an assertion failed (or DRIFT: the mirrored trigger condition no longer fires)
//              2 UNABLE TO MEASURE — credentials absent (GATE-STANDARD C2: a labelled state, not a red)
//
// Usage: node scripts/probe-commitment-readback.mjs

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---- credentials ---------------------------------------------------------------
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

const failures = []
const check = (label, ok, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail === undefined ? '' : ` — ${detail}`}`)
  if (!ok) failures.push(label)
}

// ---- fixture shape -------------------------------------------------------------
// Derived live against staging zkrcjzdemdmwhearhfgg on 2026-08-16, never quoted from a document:
//   valid_owner    internal => owner_user_id NOT NULL, owner_contact_id NULL
//   valid_tracking automatic <=> internal
//   status CHECK   pending | in_progress | completed | cancelled | overdue   (five, no `review`)
const NAMESPACE = 'p94-probe-readback'
const DOSSIER_ID = 'a0000000-0000-0000-0000-000000000501' // a real staging dossier (FK-free column, but
// the AFTER INSERT `sync_commitment_dossier_link` trigger writes work_item_dossiers, which does bind).

// `due_date` is a DATE and staging runs TimeZone = UTC, so CURRENT_DATE is the UTC day.
const utcDayOffset = (days) => {
  const d = new Date(Date.now() + days * 86400000)
  return d.toISOString().slice(0, 10)
}
const FUTURE_DUE = utcDayOffset(30)
const PAST_DUE = utcDayOffset(-30)

const PROBE_EMAIL = `${NAMESPACE}@probe.invalid`
const PASSWORD = `${NAMESPACE}-${process.pid}-${Date.now().toString(36)}`

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

const mintUser = async () => {
  let res = await call('POST', '/auth/v1/admin/users', {
    key: SERVICE,
    body: { email: PROBE_EMAIL, password: PASSWORD, email_confirm: true },
  })
  if (!res.ok) {
    const stale = await adminFindByEmail(PROBE_EMAIL)
    if (stale) {
      console.log(`  reclaiming stale probe user ${PROBE_EMAIL} -> ${stale}`)
      await adminDeleteUser(stale)
      res = await call('POST', '/auth/v1/admin/users', {
        key: SERVICE,
        body: { email: PROBE_EMAIL, password: PASSWORD, email_confirm: true },
      })
    }
  }
  if (!res.ok || !res.json?.id) {
    throw new Error(`could not mint ${PROBE_EMAIL} (HTTP ${res.status}): ${res.text}`)
  }
  const token = await call('POST', '/auth/v1/token?grant_type=password', {
    key: ANON,
    body: { email: PROBE_EMAIL, password: PASSWORD },
  })
  const jwt = token.json?.access_token
  if (!jwt) throw new Error(`could not sign in ${PROBE_EMAIL} (HTTP ${token.status})`)
  return { id: res.json.id, jwt }
}

/** Service-role INSERT — the fixture-setup half. A fresh user cannot satisfy the INSERT policy. */
const insertFixture = async (owner, label, dueDate) => {
  const res = await rest('POST', '/aa_commitments', {
    key: SERVICE,
    prefer: 'return=representation',
    body: {
      dossier_id: DOSSIER_ID,
      title: `${NAMESPACE} ${label}`,
      description: `${NAMESPACE} ${label} — deleted at the end of this run`,
      status: 'pending',
      priority: 'medium',
      owner_type: 'internal',
      owner_user_id: owner.id,
      tracking_mode: 'automatic',
      due_date: dueDate,
      created_by: owner.id,
    },
  })
  if (!res.ok || !res.json?.[0]?.id) {
    throw new Error(`fixture INSERT (${label}) HTTP ${res.status}: ${res.text}`)
  }
  return res.json[0]
}

/**
 * The write half, through the USER's own RLS. `return=representation` makes the affected-row count
 * observable: a WITH CHECK / USING mismatch produces HTTP 200 with an EMPTY array, which is the
 * silent-zero-row class a service-role write can never expose.
 */
const userUpdateStatus = async (owner, id, status) =>
  rest('PATCH', `/aa_commitments?id=eq.${id}`, {
    key: ANON,
    jwt: owner.jwt,
    prefer: 'return=representation',
    body: { status },
  })

/** The read-back half — a SEPARATE round trip against the stored row, through the user JWT. */
const userReadBackStatus = async (owner, id) => {
  const res = await rest('GET', `/aa_commitments?select=id,status,due_date&id=eq.${id}`, {
    key: ANON,
    jwt: owner.jwt,
  })
  if (!res.ok) throw new Error(`read-back GET ${id} HTTP ${res.status}: ${res.text}`)
  return res.json?.[0] ?? null
}

const serviceCensus = async () => {
  const res = await rest('GET', '/aa_commitments?select=id,status', { key: SERVICE })
  const rows = res.json ?? []
  const byStatus = {}
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
  return { total: rows.length, byStatus }
}

const namespacedCount = async () => {
  const res = await rest('GET', `/aa_commitments?select=id&title=like.${NAMESPACE}*`, {
    key: SERVICE,
  })
  return (res.json ?? []).length
}

// ---- the probe -----------------------------------------------------------------
let owner = null
const fixtureIds = []
let censusBefore = null

try {
  console.log(`probe-commitment-readback — ${SUPABASE_URL}`)
  console.log(`  today (UTC) = ${utcDayOffset(0)} · future fixture ${FUTURE_DUE} · past fixture ${PAST_DUE}`)

  console.log('\n[0] live census BEFORE (service-role) — these rows must be untouched at the end')
  censusBefore = await serviceCensus()
  console.log(`  aa_commitments: ${censusBefore.total} rows ${JSON.stringify(censusBefore.byStatus)}`)
  check('no leftover namespaced fixtures from a prior run', (await namespacedCount()) === 0)

  console.log('\n[1] mint the probe identity (service-role) — it OWNS both fixtures, so the')
  console.log('    SELECT/UPDATE policies resolve through the owner_user_id path')
  owner = await mintUser()
  console.log(`  ${PROBE_EMAIL} -> ${owner.id}`)

  // ── PERSISTENCE ───────────────────────────────────────────────────────────────
  console.log('\n[2] PERSISTENCE — a NOT-past-due commitment must store what the client wrote')
  const a = await insertFixture(owner, 'persistence', FUTURE_DUE)
  fixtureIds.push(a.id)
  console.log(`  fixture A -> ${a.id} (due_date=${a.due_date}, status after INSERT=${a.status})`)
  check('the trigger does not fire on INSERT — fixture A is still `pending`', a.status === 'pending', a.status)

  const aUpdate = await userUpdateStatus(owner, a.id, 'in_progress')
  console.log(`  user PATCH status=in_progress -> HTTP ${aUpdate.status}, rows affected ${aUpdate.json?.length ?? 0}`)
  check(
    'the user JWT updated exactly ONE row (not a silent zero-row RLS no-op)',
    aUpdate.ok && aUpdate.json?.length === 1,
    `HTTP ${aUpdate.status}, ${aUpdate.json?.length ?? 0} row(s)`,
  )

  const aBack = await userReadBackStatus(owner, a.id)
  console.log(`  read-back A -> ${JSON.stringify(aBack)}`)
  check(
    'STORED VALUE equals what was written — `in_progress` persisted verbatim',
    aBack?.status === 'in_progress',
    `stored ${aBack?.status}`,
  )

  // ── COERCION CONTROL ──────────────────────────────────────────────────────────
  console.log('\n[3] COERCION CONTROL — the drift alarm on the condition the client guard mirrors')
  const b = await insertFixture(owner, 'coercion', PAST_DUE)
  fixtureIds.push(b.id)
  console.log(`  fixture B -> ${b.id} (due_date=${b.due_date}, status after INSERT=${b.status})`)
  check(
    'the trigger is UPDATE-only — a PAST-DUE row can sit at `pending` after INSERT',
    b.status === 'pending',
    b.status,
  )

  const bUpdate = await userUpdateStatus(owner, b.id, 'in_progress')
  console.log(`  user PATCH status=in_progress -> HTTP ${bUpdate.status}, rows affected ${bUpdate.json?.length ?? 0}`)
  check(
    'the user JWT updated exactly ONE row (not a silent zero-row RLS no-op)',
    bUpdate.ok && bUpdate.json?.length === 1,
    `HTTP ${bUpdate.status}, ${bUpdate.json?.length ?? 0} row(s)`,
  )

  const bBack = await userReadBackStatus(owner, b.id)
  console.log(`  read-back B -> ${JSON.stringify(bBack)}`)
  if (bBack?.status === 'in_progress') {
    console.log('')
    console.log('  DRIFT — the past-due write PERSISTED. `check_commitment_overdue` no longer')
    console.log('  coerces pending/in_progress on a past-due row, so the client-side mirror in')
    console.log('  frontend/src/pages/WorkBoard/commitment-stage-guard.ts now refuses drags the')
    console.log('  database would accept. Re-derive the trigger and update the guard in one edit.')
    failures.push('DRIFT: the mirrored trigger condition no longer fires')
  } else {
    check(
      'the trigger COERCED the past-due write to `overdue` — the mirrored condition is live',
      bBack?.status === 'overdue',
      `stored ${bBack?.status}`,
    )
  }

  // F3: commitment_status_history records the COERCED value, so it is not evidence of user intent.
  // This probe reads nothing from it — it only cleans up the rows it caused (see [4]).
} catch (err) {
  console.log(`\nHARD FAIL — ${err.message}`)
  failures.push(err.message)
} finally {
  console.log('\n[4] cleanup — the 10 live commitments must be exactly as they were')
  for (const id of fixtureIds) {
    const h = await rest('DELETE', `/commitment_status_history?commitment_id=eq.${id}`, {
      key: SERVICE,
    })
    console.log(`  commitment_status_history for ${id} deleted -> HTTP ${h.status}`)
    const w = await rest(
      'DELETE',
      `/work_item_dossiers?work_item_type=eq.commitment&work_item_id=eq.${id}`,
      { key: SERVICE },
    )
    console.log(`  work_item_dossiers for ${id} deleted -> HTTP ${w.status}`)
    const c = await rest('DELETE', `/aa_commitments?id=eq.${id}`, { key: SERVICE })
    console.log(`  aa_commitments ${id} deleted -> HTTP ${c.status}`)
  }
  if (owner !== null) {
    const r = await adminDeleteUser(owner.id)
    console.log(`  user ${PROBE_EMAIL} (${owner.id}) deleted -> HTTP ${r.status}`)
  }

  const censusAfter = await serviceCensus()
  console.log(`  census AFTER: ${censusAfter.total} rows ${JSON.stringify(censusAfter.byStatus)}`)
  check('no namespaced fixture rows remain', (await namespacedCount()) === 0)
  if (censusBefore !== null) {
    check(
      'the live census is unchanged — no live commitment was touched',
      censusAfter.total === censusBefore.total &&
        JSON.stringify(censusAfter.byStatus) === JSON.stringify(censusBefore.byStatus),
      `${JSON.stringify(censusBefore.byStatus)} -> ${JSON.stringify(censusAfter.byStatus)}`,
    )
  }
}

console.log('')
if (failures.length > 0) {
  console.log(`PROBE FAILED — ${failures.length} assertion(s): ${failures.join(' | ')}`)
  process.exit(1)
}
console.log(
  'PROBE PASSED — future-due write persisted verbatim (read-back), past-due write observed coerced to `overdue`, fixtures cleaned, live rows untouched',
)
process.exit(0)
