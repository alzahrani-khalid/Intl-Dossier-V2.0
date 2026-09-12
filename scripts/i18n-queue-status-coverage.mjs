#!/usr/bin/env node
/**
 * Coverage probe for the intake queue-status locale keys.
 *
 * `queue.status.${ticket.status}` is built by template interpolation at
 * IntakeQueue.tsx and TicketDetail.tsx, so the REACHABLE key set is the
 * TicketStatus union — not whatever the locale happens to contain, and not
 * whatever a deleted defaultValue fallback happened to name (RULING-P99-465).
 *
 * Emits magnitudes, then a verdict. Exit 0 pass, 1 fail, 3 instrument-cannot-run.
 *
 * Modes:
 *   <root>                      coverage: union vs both locales
 *   <root> --changed-keys <ref> scope: which intake.json leaf keys differ <ref>..worktree
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const ARABIC = /[؀-ۿ]/
const LOCALES = ['en', 'ar']
const cannotRun = (why) => {
  console.error(`INSTRUMENT-CANNOT-RUN: ${why}`)
  process.exit(3)
}

const root = resolve(process.argv[2] ?? '.')
const bundle = (locale) => `frontend/src/i18n/${locale}/intake.json`

const readJson = (relative, from) => {
  try {
    const raw =
      from === undefined
        ? readFileSync(resolve(root, relative), 'utf8')
        : execFileSync('git', ['-C', root, 'show', `${from}:${relative}`], { encoding: 'utf8' })
    return JSON.parse(raw)
  } catch (error) {
    cannotRun(`cannot read ${relative}${from === undefined ? '' : ` at ${from}`}: ${error.message}`)
  }
}

const readSource = (relative) => {
  try {
    return readFileSync(resolve(root, relative), 'utf8')
  } catch (error) {
    cannotRun(`cannot read ${relative}: ${error.message}`)
  }
}

const leaves = (object, prefix = '') => {
  const out = {}
  for (const [key, value] of Object.entries(object ?? {})) {
    const path = prefix === '' ? key : `${prefix}.${key}`
    if (value !== null && typeof value === 'object') Object.assign(out, leaves(value, path))
    else out[path] = value
  }
  return out
}

// The union has two independent declarations; a disagreement means the source
// of truth moved and neither can be trusted as THE reachable set.
const readUnion = () => {
  const fromConst = (() => {
    // These reads used to be UNGUARDED: a missing source threw, and node exited 1 — which this
    // grader's own contract reserves for "the work FAILED", not "the instrument could not run".
    // RULING-P99-524. A cannot-run must never be reported as a verdict about the work.
    const text = readSource('frontend/src/components/unified-kanban/utils/status-transitions.ts')
    const block = text.match(/VALID_TICKET_STATUSES\s*=\s*\[([\s\S]*?)\]/)
    if (block === null) return null
    return [...block[1].matchAll(/'([a-z_]+)'/g)].map((match) => match[1])
  })()
  const fromType = (() => {
    const text = readSource('frontend/src/types/intake.ts')
    const block = text.match(/export type TicketStatus =([\s\S]*?)\n\n/)
    if (block === null) return null
    return [...block[1].matchAll(/'([a-z_]+)'/g)].map((match) => match[1])
  })()
  if (fromConst === null || fromConst.length === 0) cannotRun('VALID_TICKET_STATUSES did not parse')
  if (fromType === null || fromType.length === 0) cannotRun('type TicketStatus did not parse')
  const a = [...fromConst].sort().join(',')
  const b = [...fromType].sort().join(',')
  if (a !== b) cannotRun(`the two TicketStatus declarations disagree: const=[${a}] type=[${b}]`)
  return [...fromConst].sort()
}

if (process.argv[3] === '--changed-keys') {
  const ref = process.argv[4]
  if (ref === undefined || ref === '') cannotRun('--changed-keys needs a git ref')
  const changed = []
  for (const locale of LOCALES) {
    const before = leaves(readJson(bundle(locale), ref))
    const after = leaves(readJson(bundle(locale)))
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)]))
      if (before[key] !== after[key]) changed.push(`${locale}:${key}`)
  }
  console.log(`changed-leaf-keys=${changed.length} ${changed.sort().join(' ')}`)
  process.exit(0)
}

const union = readUnion()
console.log(`union=${union.length} ${union.join(',')}`)

let failures = 0
for (const locale of LOCALES) {
  const status = leaves(readJson(bundle(locale)).queue?.status ?? {})
  const keys = Object.keys(status).sort()
  const missing = union.filter((key) => !keys.includes(key))
  const extra = keys.filter((key) => !union.includes(key))
  console.log(`${locale}=${keys.length} ${keys.join(',')} missing=${missing.length} extra=${extra.length}`)
  if (missing.length > 0) {
    console.error(`FAIL ${locale}: unreachable-key coverage gap, missing=[${missing.join(',')}]`)
    failures++
  }
  if (extra.length > 0) {
    console.error(`FAIL ${locale}: key(s) no code path can request, extra=[${extra.join(',')}]`)
    failures++
  }
  // Every union key is checked, not just `draft`. The first version checked draft alone because
  // draft was the key P99-61 added — so a fixture set written for that task could not contain the
  // shape it never had to think about. RULING-P99-524: `ar closed="Closed"` with `ar merged=""`
  // scored a clean exit 0 across seven untested keys.
  for (const key of union) {
    const value = status[key]
    if (typeof value !== 'string' || value.trim() === '') {
      console.error(`FAIL ${locale}: queue.status.${key} absent or empty`)
      failures++
    } else if (locale === 'ar' && !ARABIC.test(value)) {
      console.error(`FAIL ar: queue.status.${key} is not Arabic script: ${JSON.stringify(value)}`)
      failures++
    }
  }
}
process.exit(failures === 0 ? 0 : 1)
