#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = join(ROOT, '.env.test')
const EXPORT_ROOT =
  '/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer'

const KEEP_EMAILS = [
  'kazahrani@stats.gov.sa',
  'test.user@gmail.com',
  'admin@gastat.gov.sa',
  'test@gastat-intake.local',
  'mfmuhanna@gstats.gov.sa',
  'jfafnan@stats.gov.sa',
  'akhorayef@stats.gov.sa',
  'hmghulaiga@stats.gov.sa',
  'aabalobaid@stats.gov.sa',
  'ashaibani@stats.gov.sa',
  'analyst@e2e.test',
  'intake@e2e.test',
  'admin@e2e.test',
]

const DELETE_PREDICATE =
  "email ilike '%@example.com' or email ilike '%@gastat.test' or email ilike '%@example.test'"

const EXPORTS = [
  ['auth_users_fixtures.csv', 'auth.users', 'id'],
  ['public_users.csv', 'public.users', 'id'],
  ['public_profiles.csv', 'public.profiles', 'user_id'],
  ['public_mou_notification_preferences.csv', 'public.mou_notification_preferences', 'user_id'],
  ['public_user_notification_preferences.csv', 'public.user_notification_preferences', 'user_id'],
  ['public_staff_profiles.csv', 'public.staff_profiles', 'user_id'],
  ['public_user_roles.csv', 'public.user_roles', 'user_id'],
]

const loadEnvFile = (path) => {
  if (!existsSync(path)) throw new Error(`required environment file is absent: ${path}`)
  const values = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!match) continue
    values[match[1]] = match[2].trim().replace(/^["'](.*)["']$/, '$1')
  }
  return values
}

// Deliberately read .env.test on every run and use its values, even if the caller exported a
// different environment. This prevents an accidental run in an unprovisioned or unrelated tree.
const fileEnv = loadEnvFile(ENV_FILE)
const env = (name) => fileEnv[name] ?? ''
const SUPABASE_URL = env('SUPABASE_URL').replace(/\/$/, '')
const SUPABASE_SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY')
const SUPABASE_DB_URL = env('SUPABASE_DB_URL')

const missing = [
  ['SUPABASE_URL', SUPABASE_URL],
  ['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY],
  ['SUPABASE_DB_URL', SUPABASE_DB_URL],
]
  .filter(([, value]) => value === '')
  .map(([name]) => name)

if (missing.length > 0) {
  throw new Error(`refusing to run: .env.test does not provide ${missing.join(', ')}`)
}

const psql = (sql, { raw = false } = {}) => {
  const result = spawnSync(
    'psql',
    [SUPABASE_DB_URL, '-X', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1', '-c', sql],
    {
      cwd: ROOT,
      encoding: raw ? null : 'utf8',
      env: { ...process.env, PGCONNECT_TIMEOUT: '15' },
      maxBuffer: 64 * 1024 * 1024,
    },
  )
  if (result.error) throw result.error
  if (result.status !== 0) {
    const stderr = raw ? result.stderr.toString('utf8') : result.stderr
    throw new Error(`psql exited ${result.status}: ${stderr.trim()}`)
  }
  return raw ? result.stdout : result.stdout.trim()
}

const sqlLiteral = (value) => `'${value.replaceAll("'", "''")}'`

const queryFixtureUsers = () => {
  const rows = psql(
    `select id::text || E'\\t' || email from auth.users where ${DELETE_PREDICATE} order by id`,
  )
  if (rows === '') return []
  return rows.split('\n').map((row) => {
    const tab = row.indexOf('\t')
    if (tab < 1) throw new Error(`could not parse fixture user row: ${row}`)
    return { id: row.slice(0, tab), email: row.slice(tab + 1) }
  })
}

const count = (sql) => {
  const value = psql(sql)
  if (!/^\d+$/.test(value)) throw new Error(`expected an integer from psql, received: ${value}`)
  return Number(value)
}

const utcStamp = () =>
  new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

const writeAndSync = (path, contents) => {
  const fd = openSync(path, 'wx', 0o600)
  try {
    writeSync(fd, contents)
    if (contents.length === 0 || contents[contents.length - 1] !== 0x0a) {
      writeSync(fd, Buffer.from('\n'))
    }
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
}

const exportCsv = (directory, file, table, userColumn) => {
  const sql =
    table === 'auth.users'
      ? `copy (select * from ${table} where ${DELETE_PREDICATE} order by id) to stdout with (format csv, header true)`
      : `copy (select * from ${table} where ${userColumn} in (select id from auth.users where ${DELETE_PREDICATE}) order by ${userColumn}) to stdout with (format csv, header true)`
  const csv = psql(sql, { raw: true })
  const path = join(directory, file)
  writeAndSync(path, csv)
  const rows = count(
    table === 'auth.users'
      ? `select count(*) from ${table} where ${DELETE_PREDICATE}`
      : `select count(*) from ${table} where ${userColumn} in (select id from auth.users where ${DELETE_PREDICATE})`,
  )
  console.log(`exported ${file} rows=${rows}`)
  return rows
}

// Reproduce research §1.6 from the catalog. No blocking FK names are maintained by hand.
const generatedCensus = (userPredicate) => {
  const union = psql(`
    select string_agg(
      format(
        'select %L::text as fk, count(*)::bigint as n from %I.%I where %I in (select id from auth.users where ${userPredicate})',
        n.nspname || '.' || c.relname || '.' || a.attname,
        n.nspname,
        c.relname,
        a.attname
      ),
      ' union all '
    )
    from pg_constraint f
    join pg_class c on c.oid = f.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_class rc on rc.oid = f.confrelid
    join pg_namespace rn on rn.oid = rc.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum = any(f.conkey)
    where f.contype = 'f'
      and rn.nspname = 'auth'
      and rc.relname = 'users'
      and f.confdeltype in ('a', 'r')
  `)
  if (union === '') throw new Error('generated blocking-FK census was empty')
  const total = count(`select count(*) from (${union}) census`)
  const offendersText = psql(
    `select fk || E'\\t' || n from (${union}) census where n > 0 order by n desc, fk`,
  )
  const offenders = offendersText === '' ? [] : offendersText.split('\n')
  return { total, offenders }
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const fixtureUsers = queryFixtureUsers()
if (fixtureUsers.length === 0) {
  throw new Error('refusing to create a newer empty export: the fixture delete set is empty')
}

const keepSql = KEEP_EMAILS.map(sqlLiteral).join(', ')
const keepOutsideDelete = count(
  `select count(*) from auth.users where lower(email) in (${keepSql}) and not (${DELETE_PREDICATE})`,
)
const outsideDelete = count(`select count(*) from auth.users where not (${DELETE_PREDICATE})`)
if (keepOutsideDelete !== KEEP_EMAILS.length || outsideDelete !== KEEP_EMAILS.length) {
  throw new Error(
    `keep-list precondition failed: outside_delete=${outsideDelete} keep_list_outside_delete=${keepOutsideDelete} expected=${KEEP_EMAILS.length}`,
  )
}
console.log(
  `keep-list pre-delete outside_delete=${outsideDelete} keep_list_outside_delete=${keepOutsideDelete}`,
)

mkdirSync(EXPORT_ROOT, { recursive: true })
const exportDirectory = join(EXPORT_ROOT, `p102-prepurge-${utcStamp()}`)
mkdirSync(exportDirectory)
console.log(`export_path=${exportDirectory}`)

const exportCounts = new Map()
for (const [file, table, userColumn] of EXPORTS) {
  exportCounts.set(table, exportCsv(exportDirectory, file, table, userColumn))
}
const exportCompletedEpoch = Math.floor(Date.now() / 1000)
if (exportCounts.get('auth.users') !== fixtureUsers.length) {
  throw new Error(
    `fixture population changed during export: selected=${fixtureUsers.length} exported=${exportCounts.get('auth.users')}`,
  )
}

const fixtureCensus = generatedCensus(DELETE_PREDICATE)
console.log(`BLOCKING_FK_TOTAL_CONSTRAINTS=${fixtureCensus.total}`)
console.log(`BLOCKING_FK_WITH_ROWS=${fixtureCensus.offenders.length}`)
for (const offender of fixtureCensus.offenders) console.log(`BLOCKING_FK ${offender}`)

const controlCensus = generatedCensus(`email = ${sqlLiteral(KEEP_EMAILS[0])}`)
console.log(`BLOCKING_FK_CONTROL_WITH_ROWS=${controlCensus.offenders.length}`)
for (const offender of controlCensus.offenders) console.log(`BLOCKING_FK_CONTROL ${offender}`)

if (controlCensus.offenders.length === 0) {
  throw new Error('blocking-FK census control saw no rows; refusing to trust the fixture zero')
}
if (fixtureCensus.offenders.length > 0) {
  throw new Error(
    `fixture users are referenced by blocking FKs: ${fixtureCensus.offenders.join(', ')}`,
  )
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let deleted = 0
let failed = 0
let firstDeleteEpoch = 0
for (const [index, user] of fixtureUsers.entries()) {
  if (firstDeleteEpoch === 0) firstDeleteEpoch = Math.floor(Date.now() / 1000)
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { error } = await admin.auth.admin.deleteUser(user.id, false)
    if (!error) {
      lastError = null
      break
    }
    lastError = error
    if (attempt < 3) await delay(250 * attempt)
  }
  if (lastError) {
    failed += 1
    console.log(
      `[${index + 1}/${fixtureUsers.length}] failed id=${user.id} email=${user.email} running_deleted=${deleted} running_failed=${failed} error=${lastError.message}`,
    )
  } else {
    deleted += 1
    console.log(
      `[${index + 1}/${fixtureUsers.length}] deleted id=${user.id} email=${user.email} running_deleted=${deleted} running_failed=${failed}`,
    )
  }
}

const kept = count('select count(*) from auth.users')
const keepPresent = count(`select count(*) from auth.users where lower(email) in (${keepSql})`)
const fixturesLeft = count(`select count(*) from auth.users where ${DELETE_PREDICATE}`)
const publicUsers = count('select count(*) from public.users')
const profiles = count('select count(*) from public.profiles')
const cascade = EXPORTS.slice(1).reduce(
  (sum, [, table]) => sum + (exportCounts.get(table) ?? 0),
  0,
)
const magnitudes = `kept=${kept} deleted=${deleted} cascade=${cascade} failed=${failed}`
console.log(magnitudes)

writeFileSync(
  join(exportDirectory, 'magnitudes.txt'),
  [
    `kept=${kept}`,
    `deleted=${deleted}`,
    `cascade=${cascade}`,
    `failed=${failed}`,
    `first_delete_epoch=${firstDeleteEpoch}`,
    `export_completed_epoch=${exportCompletedEpoch}`,
    '',
  ].join('\n'),
  { mode: 0o600, flag: 'wx' },
)

if (
  failed !== 0 ||
  fixturesLeft !== 0 ||
  kept !== KEEP_EMAILS.length ||
  keepPresent !== KEEP_EMAILS.length ||
  publicUsers !== KEEP_EMAILS.length ||
  profiles !== KEEP_EMAILS.length
) {
  throw new Error(
    `post-delete assertion failed: fixtures_left=${fixturesLeft} auth_users=${kept} keep_list_present=${keepPresent} public_users=${publicUsers} profiles=${profiles} failed=${failed}`,
  )
}
