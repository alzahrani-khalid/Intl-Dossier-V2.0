import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: '.env.test' })

const { Client } = pg

/**
 * REFUSE AT MODULE LOAD when the database URL is absent (RULING-P99-42 order 14).
 *
 * WHO HITS THIS DEFECT: anyone who runs this suite without SUPABASE_DB_URL — CI, a laptop, a
 * contributor — not just one orchestrated run. Measured 2026-08-19: the absent variable made
 * `catalogDatabaseUrl()` throw inside `beforeAll`, which failed 5 specs, which SATISFIED a
 * red-asserting acceptance oracle. A missing credential was silently converted into a merged green.
 *
 * WHY MODULE LOAD RATHER THAN A HOOK: this throw fires while Playwright is LOADING the spec —
 * during collection, before any hook or test runs — so it cannot wear a test failure's costume.
 * It also fails `--list`, which means an oracle's own collection clause catches it at the earliest
 * possible point instead of reading a hook's casualties as a red.
 *
 * WHY HERE RATHER THAN globalSetup: only specs that import this fixture need a database. A
 * globalSetup check would fail unrelated specs for every developer who does not have the variable.
 */
const DB_URL_VARS = ['SUPABASE_DB_URL', 'DATABASE_URL']
if (!DB_URL_VARS.some((v) => (process.env[v] ?? '') !== '')) {
  throw new Error(
    'Cannot verify pg_constraint before seeding: set SUPABASE_DB_URL (or DATABASE_URL) in the E2E ' +
      'environment. Refused at module load, before any test ran, so this cannot be mistaken for a ' +
      'test failure or satisfy a red-asserting oracle (RULING-P99-42).',
  )
}

export const POSITION_TITLE_PREFIX = 'P99-C7-READ-ONLY'
export const RULED_POSITION_STATUSES = ['under_review', 'approved', 'published']

const STATUS_CONSTRAINT_SQL = `
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.positions'::regclass
  AND contype = 'c'
ORDER BY conname
`

const requiredEnv = (name) => {
  const value = process.env[name]
  if (value === undefined || value === '') {
    throw new Error(`${name} missing from .env.test`)
  }
  return value
}

const serviceClient = () =>
  createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  })

/**
 * pg_catalog is not a PostgREST relation. Use a direct catalog connection when supplied and the
 * standard local-Supabase database port when .env.test points at a local stack. No seed INSERT is
 * attempted when the catalog transport is unavailable: failing closed preserves the precondition.
 */
const catalogDatabaseUrl = () => {
  const explicit = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL
  if (explicit !== undefined && explicit !== '') return explicit

  const supabaseUrl = new URL(requiredEnv('SUPABASE_URL'))
  if (supabaseUrl.hostname === 'localhost' || supabaseUrl.hostname === '127.0.0.1') {
    return `postgresql://postgres:postgres@${supabaseUrl.hostname}:54322/postgres`
  }

  throw new Error(
    'Cannot verify pg_constraint before seeding: set SUPABASE_DB_URL (or DATABASE_URL) in the E2E environment',
  )
}

const verifyStatusConstraint = async () => {
  const client = new Client({ connectionString: catalogDatabaseUrl() })
  try {
    await client.connect()
    const result = await client.query(STATUS_CONSTRAINT_SQL)
    const definitions = result.rows.map((row) => `${row.conname}: ${row.definition}`).join('\n')

    if (definitions === '') {
      throw new Error('positions has no CHECK constraints in pg_constraint')
    }
    const missing = RULED_POSITION_STATUSES.filter((status) => !definitions.includes(status))
    if (missing.length > 0) {
      throw new Error(
        `positions status CHECK is missing ${missing.join(', ')}; verified constraint text:\n${definitions}`,
      )
    }

    // The fixture output is the execution record required by the rendered-oracle red register.
    console.warn(`[P99-C7] verified positions CHECK constraints before INSERT:\n${definitions}`)
    return definitions
  } finally {
    await client.end().catch(() => undefined)
  }
}

/**
 * Seed exactly one reachable position for each ruled read-only status. A precondition failure
 * throws; callers never receive a partial map and therefore have no skip-shaped fallback.
 */
export const seedPositions = async () => {
  await verifyStatusConstraint()

  const supabase = serviceClient()
  const { data: positionType, error: typeError } = await supabase
    .from('position_types')
    .select('id')
    .limit(1)
    .single()
  if (typeError !== null || positionType === null) {
    throw new Error(`P99-C7 position_type fixture lookup failed: ${typeError?.message ?? 'no row'}`)
  }

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1_000,
  })
  if (usersError !== null) {
    throw new Error(`P99-C7 author fixture lookup failed: ${usersError.message}`)
  }
  const preferredEmail = process.env.TEST_USER_EMAIL
  const author =
    usersPage.users.find((user) => user.email === preferredEmail) ?? usersPage.users.at(0)
  if (author === undefined) {
    throw new Error('P99-C7 author fixture lookup returned no auth users')
  }

  const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`
  const rows = RULED_POSITION_STATUSES.map((status) => ({
    position_type_id: positionType.id,
    title_en: `${POSITION_TITLE_PREFIX}-${status}-${runId}`,
    title_ar: `${POSITION_TITLE_PREFIX}-${status}-${runId}`,
    content_en: `Deterministic rendered-oracle fixture for ${status}`,
    content_ar: `بيانات اختبار حتمية لحالة ${status}`,
    status,
    current_stage: status === 'under_review' ? 1 : 0,
    author_id: author.id,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('positions')
    .insert(rows)
    .select('id,status')
  if (insertError !== null) {
    throw new Error(`P99-C7 positions seed failed: ${insertError.message}`)
  }

  const ids = Object.fromEntries((inserted ?? []).map((row) => [row.status, row.id]))
  const missing = RULED_POSITION_STATUSES.filter((status) => typeof ids[status] !== 'string')
  if (missing.length > 0) {
    throw new Error(`P99-C7 positions seed returned no id for: ${missing.join(', ')}`)
  }

  const seeded = {
    under_review: ids.under_review,
    approved: ids.approved,
    published: ids.published,
  }
  console.warn(`[P99-C7] seeded position ids: ${JSON.stringify(seeded)}`)
  return seeded
}

export const teardownPositions = async (seeded) => {
  const ids = RULED_POSITION_STATUSES.map((status) => seeded?.[status]).filter(
    (id) => typeof id === 'string' && id !== '',
  )
  if (ids.length === 0) return

  const { error } = await serviceClient().from('positions').delete().in('id', ids)
  if (error !== null) {
    throw new Error(`P99-C7 positions teardown failed: ${error.message}`)
  }
}
