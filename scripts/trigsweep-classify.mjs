#!/usr/bin/env node
// Phase 96 / TRIGSWEEP-01 — the BEHAVIOUR-derived BEFORE-trigger classifier.
//
// Lineage, because it is the point: P94's sweep matched only `NEW.x :=` and saw 15% of its class
// (29 of ~193). Phase 96 research then found a THIRD form (`SELECT … INTO NEW.x`) invisible to both
// known regexes, and a FOURTH blindness — `BEGIN NEW.updated_at = NOW();` on ONE line — that defeated
// the sharper regex built in the same session. That is the tenth instance of a syntactic instrument
// under-counting a behaviour class, produced by the instrument built to fix the ninth.
//
// So this instrument does NOT trust one regex:
//   (a) the POPULATION is enumerated mechanically from pg_trigger (closed, not guessed);
//   (b) each row is classified by the UNION of all four known forms, plus non-plpgsql as
//       writer-SUSPECT by language (a future C-language/extension trigger is never invisible);
//   (c) every unmatched row is PRINTED as `RESIDUAL — hand-classify`. The residual is part of the
//       deliverable, never silently assumed non-writing. A residual that turns out to be a writer
//       is a classifier bug: add its form here and re-run.
//
// It classifies a FILE, never the database: the capture step is the Supabase MCP's, so this script
// touches no credentials and can print no key. Re-capture with exactly this SQL (staging
// zkrcjzdemdmwhearhfgg), as a JSON array of rows {tgname, relname, proname, lanname, prosrc}:
//
//   WITH before_row AS (
//     SELECT t.tgname, c.relname, p.proname, l.lanname, p.prosrc
//     FROM pg_trigger t
//     JOIN pg_class c     ON c.oid = t.tgrelid
//     JOIN pg_namespace n ON n.oid = c.relnamespace
//     JOIN pg_proc p      ON p.oid = t.tgfoid
//     JOIN pg_language l  ON l.oid = p.prolang
//     WHERE NOT t.tgisinternal AND n.nspname = 'public'
//       AND (t.tgtype & 2) = 2 AND (t.tgtype & 1) = 1)
//   SELECT json_agg(row_to_json(b) ORDER BY b.relname, b.tgname) FROM before_row b;
//
// POPULATION DEFINITION — public-schema, non-internal, BEFORE, FOR EACH ROW triggers.
// OUTSIDE IT — AFTER / INSTEAD OF triggers, statement-level triggers, non-public schemas, and
// triggers whose functions write OTHER rows (side-effecting, but not NEW-writers: they are
// classified apart by hand and must not be confused with writers).
//
// Every count this prints is a FLOOR pinned to its capture date, never a total.
//
// Exit codes:  0 classified; the residual was listed
//              1 a classification invariant broke (a known writer went missing → regression)
//              2 UNABLE TO MEASURE — input file absent or unparseable (fail closed, never a
//                silent zero; GATE-STANDARD C2: a labelled state, not a red)
//
// Usage: node scripts/trigsweep-classify.mjs <capture.json> [--label "<text>"]

import { existsSync, readFileSync } from 'node:fs'

// The capture file is argv[2] — the FIRST positional, always. (gate-drill.mjs's own header records
// what the clever form costs: `args[tIdx + 1]` is `args[0]` when the flag is absent, so the file
// argument filters itself out and the documented invocation never works.)
const args = process.argv.slice(2)
const file = args[0] !== undefined && !args[0].startsWith('--') ? args[0] : undefined
const labelIdx = args.indexOf('--label')
const label = labelIdx !== -1 ? (args[labelIdx + 1] ?? '') : ''

const unableToMeasure = (reason) => {
  console.log(`UNABLE TO MEASURE — ${reason}`)
  process.exit(2)
}

if (!file) unableToMeasure('no capture file given (usage: trigsweep-classify.mjs <capture.json>)')
if (!existsSync(file)) unableToMeasure(`capture file absent: ${file}`)

let rows
try {
  rows = JSON.parse(readFileSync(file, 'utf8'))
} catch (err) {
  unableToMeasure(`capture file unparseable (${file}): ${err.message}`)
}
if (!Array.isArray(rows)) unableToMeasure(`capture file is not a JSON array of rows: ${file}`)
if (rows.length === 0) unableToMeasure(`capture file holds zero rows: ${file}`)

// ---- the classifier: union of ALL FOUR known forms, mirroring 96-RESEARCH §Code Examples --------
// Postgres `~*` is case-insensitive; `\m…\M` word boundaries are `\b` here. The `=` form carries
// the FOURTH-blindness fix: an assignment directly after BEGIN|THEN|ELSE|LOOP on the SAME line has
// no preceding `;` or newline, so those keywords are statement positions too.
const FORMS = [
  { class: 'writer (:=)', re: /NEW\.[a-zA-Z_]+\s*:=/i },
  {
    class: 'writer (=)',
    re: /(^|;|\n|\bBEGIN\b|\bTHEN\b|\bELSE\b|\bLOOP\b)\s*NEW\.[a-zA-Z_]+\s*=[^=]/i,
  },
  { class: 'writer (INTO)', re: /INTO\s+(STRICT\s+)?NEW\./i },
  { class: 'writer (record)', re: /(^|;|\n)\s*NEW\s*:?=\s/i },
]
const RESIDUAL = 'RESIDUAL — hand-classify'

const classify = (row) => {
  if (row.lanname !== 'plpgsql') return 'writer-suspect (non-plpgsql)'
  const src = row.prosrc ?? ''
  for (const form of FORMS) if (form.re.test(src)) return form.class
  return RESIDUAL
}

const classified = rows.map((row) => ({ ...row, class: classify(row) }))
const isWriter = (c) => c !== RESIDUAL

// ---- the six ORCH-BRIEF meaningful rewrites: known plain-`=` writers, pinned ---------------------
// If one of these ever falls out of a writer class the classifier has regressed — that is exit 1,
// not a smaller number quietly reported.
const PINS = [
  { table: 'staff_profiles', column: 'version' },
  { table: 'assignments', column: '_version' },
  { table: 'entity_comments', column: null },
  { table: 'organization_leadership', column: 'is_current' },
  { table: 'legislations', column: 'version' },
  { table: 'intelligence_sources', column: 'next_scan_at' },
]

const pinResults = PINS.map((pin) => {
  const hits = classified.filter(
    (r) =>
      r.relname === pin.table &&
      isWriter(r.class) &&
      (pin.column === null || new RegExp(`NEW\\.${pin.column}\\b`, 'i').test(r.prosrc ?? '')),
  )
  return { ...pin, hits }
})

// ---- output --------------------------------------------------------------------------------------
const counts = new Map()
for (const r of classified) counts.set(r.class, (counts.get(r.class) ?? 0) + 1)

const writers = classified.filter((r) => isWriter(r.class))
const residual = classified.filter((r) => r.class === RESIDUAL)
const tables = new Set(classified.map((r) => r.relname)).size

console.log(`TRIGSWEEP CLASSIFICATION${label ? ` — ${label}` : ''}`)
console.log(`capture: ${file}`)
console.log(`population: ${classified.length} BEFORE ROW triggers across ${tables} tables`)
console.log('')
console.log('class                          count')
console.log('------------------------------ -----')
for (const [cls, n] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${cls.padEnd(30)} ${String(n).padStart(5)}`)
}
console.log('')
console.log(`RESIDUAL (${residual.length}) — every one listed; hand-classify each, none assumed:`)
if (residual.length === 0) {
  console.log('  (none)')
} else {
  for (const r of residual.sort((a, b) => a.relname.localeCompare(b.relname))) {
    console.log(`  ${r.relname} / ${r.tgname} / ${r.proname}()`)
  }
}
console.log('')
console.log('the six ORCH-BRIEF meaningful rewrites (must each be in a writer class):')
for (const p of pinResults) {
  const target = `${p.table}${p.column ? `.${p.column}` : '.*'}`
  if (p.hits.length === 0) {
    console.log(`  MISSING  ${target}`)
  } else {
    for (const h of p.hits) console.log(`  ok       ${target.padEnd(38)} ${h.tgname} → ${h.class}`)
  }
}

const missing = pinResults.filter((p) => p.hits.length === 0)

console.log('')
console.log(
  'POPULATION DEFINITION: public-schema, non-internal, BEFORE, FOR EACH ROW triggers. ' +
    'OUTSIDE IT: AFTER/INSTEAD OF triggers, statement-level triggers, non-public schemas, and ' +
    'triggers whose functions write OTHER rows (side-effecting, not NEW-writers).',
)
console.log(
  `FLOOR: ${writers.length} writers of ${classified.length} BEFORE ROW triggers — never a total ` +
    `(the ${residual.length} residual rows are hand-classified in the drill artifact; any residual ` +
    'later found to write NEW raises this floor).',
)

if (missing.length > 0) {
  console.log('')
  console.log(
    `INVARIANT BROKE — ${missing.length} known writer(s) absent from every writer class: ` +
      missing.map((m) => `${m.table}${m.column ? `.${m.column}` : ''}`).join(', '),
  )
  process.exit(1)
}
process.exit(0)
