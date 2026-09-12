#!/usr/bin/env node
//
// Phase 94 / AUDIT-ZERO-01 — the ROW-LANDING oracle (plan 94-10, Wave 0 instrument).
//
// `public.audit_logs` has held 0 rows for the life of the project against 36 writers.
// This probe is the only artifact that proves the repaired fleet actually WRITES: it
// exercises one repaired, DEPLOYED edge function end to end and asserts the table goes
// 0 -> >=1 with a row whose columns are real ones.
//
// Representative: `commitments-update-status` (plan 94-10's `<interfaces>` block). It is
// BENIGN — it moves one fixture commitment's status. assign-role / create-user /
// deactivate-user are never exercised against staging for probe purposes.
//
// What is cleaned up and what is NOT:
//   - the fixture commitment is DELETED at the end (service-role).
//   - the audit row is KEPT. It is a genuine record of a genuine staging action, and it
//     is the AUDIT-ZERO-01 closure evidence. Deleting it would delete the finding.
//
// Exit codes:
//   0  the row landed and has a real shape
//   1  it did not (the actual failure is printed)
//   2  credentials absent — a LABELLED STATE, not a pass and not a red (GATE-STANDARD C2)
//
// HOUSE RULE: never echoes a credential value.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TAG = 'p94-10-audit-row-probe'

function loadEnvTest() {
  const out = {}
  let raw
  try {
    raw = readFileSync(resolve(REPO, '.env.test'), 'utf8')
  } catch {
    return out
  }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const env = { ...loadEnvTest(), ...process.env }
const REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
]
const missing = REQUIRED.filter((k) => !env[k])
if (missing.length) {
  // Names only — never the values.
  console.error(`SKIPPED (exit 2): credentials absent from .env.test / environ: ${missing.join(', ')}`)
  process.exit(2)
}

const URL_BASE = env.SUPABASE_URL.replace(/\/$/, '')
const SVC = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

async function rest(path, init = {}) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: { ...SVC, ...(init.headers || {}) },
  })
  const text = await res.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: res.status, body, headers: res.headers }
}

async function auditCount() {
  const res = await fetch(`${URL_BASE}/rest/v1/audit_logs?select=id`, {
    method: 'HEAD',
    headers: { ...SVC, Prefer: 'count=exact' },
  })
  const range = res.headers.get('content-range') || ''
  const n = Number(range.split('/')[1])
  if (!Number.isFinite(n)) throw new Error(`could not parse count from content-range: "${range}"`)
  return n
}

async function mintUserJwt() {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.TEST_USER_EMAIL, password: env.TEST_USER_PASSWORD }),
  })
  const body = await res.json().catch(() => ({}))
  if (!body.access_token) throw new Error(`token mint failed (HTTP ${res.status})`) // body withheld
  return { jwt: body.access_token, userId: body.user?.id }
}

let fixtureId = null

async function cleanup() {
  if (!fixtureId) return
  const del = await rest(`aa_commitments?id=eq.${fixtureId}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
  console.log(`cleanup: fixture commitment ${fixtureId} delete -> HTTP ${del.status}`)
}

async function main() {
  const { jwt, userId } = await mintUserJwt()
  if (!userId) throw new Error('token response carried no user id')
  console.log(`acting user: ${userId}`)

  const before = await auditCount()
  console.log(`audit_logs count BEFORE: ${before}`)

  // --- fixture: an INTERNAL commitment owned by the test user, so the function's own
  // owner check passes and the aa_commitments UPDATE policy (owner_user_id = auth.uid())
  // admits the JWT-scoped write. due_date is in the FUTURE so the commitment_overdue_check
  // BEFORE UPDATE trigger (94-CONTEXT D-32) does not rewrite the status underneath us.
  //
  // tracking_mode is NOT free: CHECK `valid_tracking` binds it to owner_type —
  //   (tracking_mode='automatic' AND owner_type='internal')
  //   OR (tracking_mode='manual'  AND owner_type='external')
  // derived live 2026-08-16. internal+manual is rejected 23514.
  const dossier = await rest('dossiers?select=id&limit=1')
  const dossierId = dossier.body?.[0]?.id
  if (!dossierId) throw new Error(`could not read a dossier id (HTTP ${dossier.status})`)

  const future = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  const created = await rest('aa_commitments', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      dossier_id: dossierId,
      title: `${TAG} fixture`,
      description: `${TAG} fixture — created and deleted by scripts/probe-audit-row.mjs`,
      owner_type: 'internal',
      owner_user_id: userId,
      tracking_mode: 'automatic',
      due_date: future,
      status: 'pending',
    }),
  })
  if (created.status !== 201) {
    throw new Error(`fixture insert failed HTTP ${created.status}: ${JSON.stringify(created.body)}`)
  }
  fixtureId = created.body[0].id
  console.log(`fixture commitment: ${fixtureId} (status=pending, due ${future})`)

  // --- exercise the DEPLOYED function.
  // Its handler reads the id from a path segment (`pathSegments[indexOf('commitments')+1]`),
  // which an SDK `functions.invoke()` never supplies — so the sub-path is spelled out here.
  const fnUrl = `${URL_BASE}/functions/v1/commitments-update-status/commitments/${fixtureId}/status`
  const fnRes = await fetch(fnUrl, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'in_progress', notes: `${TAG} status move` }),
  })
  const fnBody = await fnRes.text()
  console.log(`commitments-update-status -> HTTP ${fnRes.status}`)
  if (fnRes.status !== 200) {
    throw new Error(`function did not succeed: HTTP ${fnRes.status} ${fnBody.slice(0, 300)}`)
  }

  const after = await auditCount()
  console.log(`audit_logs count AFTER: ${after}  (delta ${after - before})`)
  if (after - before < 1) {
    throw new Error(`NO ROW LANDED — audit_logs delta is ${after - before}, expected >= 1`)
  }

  // --- assert the landed row's shape is REAL columns, not just that a row exists.
  const rows = await rest(
    `audit_logs?entity_id=eq.${fixtureId}&select=id,entity_type,entity_id,action,user_id,user_role,old_values,new_values,created_at`,
  )
  if (rows.status !== 200 || !Array.isArray(rows.body) || rows.body.length === 0) {
    throw new Error(`could not read back the audit row (HTTP ${rows.status})`)
  }
  const row = rows.body[0]
  console.log('landed row:', JSON.stringify(row))

  const REQUIRED_COLS = ['entity_type', 'entity_id', 'action', 'user_id', 'user_role']
  const nulls = REQUIRED_COLS.filter((c) => row[c] === null || row[c] === undefined)
  if (nulls.length) throw new Error(`row is missing NOT NULL values: ${nulls.join(', ')}`)
  if (row.entity_type !== 'commitment') throw new Error(`entity_type = ${row.entity_type}`)
  if (row.action !== 'status_update') throw new Error(`action = ${row.action}`)
  if (row.user_id !== userId) throw new Error(`user_id ${row.user_id} != acting user ${userId}`)
  if (row.new_values?.status !== 'in_progress') {
    throw new Error(`new_values.status = ${JSON.stringify(row.new_values)}`)
  }

  console.log(`AUDIT ROW LANDED: id=${row.id} entity=${row.entity_type}/${row.entity_id} ` +
    `action=${row.action} user_role=${row.user_role}`)
  console.log('PASS — audit_logs went 0 -> >=1 through a deployed repaired function.')
}

main()
  .then(async () => {
    await cleanup()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error(`FAIL: ${err.message}`)
    await cleanup()
    process.exit(1)
  })
