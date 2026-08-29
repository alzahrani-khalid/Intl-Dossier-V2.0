#!/usr/bin/env node
// Enforces the clause 99-58-PLAN already states three times (L76/L92/L115): a SUMMARY must record
// its oracles' VERBATIM output. Wording was never the gap — nothing MEASURED it (RULING-P99-507).
//
// The rule, and it is the whole rule: a measurement number asserted in PROSE must also appear
// inside a fenced verbatim block in the SAME document. A number with no block behind it is a claim
// about a measurement, not a measurement. On the run-0065 P99-58 attempt-3 SUMMARY this is exactly
// the pair the reviewer caught by hand -- prose "265 -> 264" against a block reading 185, and prose
// "41,030 bytes" against a committed diff of 41,079.
//
// It does NOT recompute anything against the tree. It cannot tell you a supported number is RIGHT,
// only that an unsupported one has nothing behind it. Say so wherever its zero is quoted.
import fs from 'node:fs'

const NUM = /\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?/g

const canon = (s) => s.replace(/,/g, '')

// A 4-digit 19xx/20xx is a year, and `P99-58` / `99-41` / `#3` are identifiers. Neither is a
// measurement, and flagging them would trap the author in a criterion they cannot satisfy.
const isYear = (c) => /^(19|20)\d{2}$/.test(c)

const splitBlocks = (text) => {
  const lines = text.split('\n')
  const prose = []
  const verbatim = []
  let fenced = false
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return }
    ;(fenced ? verbatim : prose).push({ n: i + 1, line })
  })
  if (fenced) return { unterminated: true, prose, verbatim }
  return { unterminated: false, prose, verbatim }
}

// Identifier context is decided from the RAW characters either side, never from the number alone:
// `264` in `rawKeyTotal:264` is a measurement, the same `58` in `P99-58` is a name.
//
// The three exclusions below were not guessed — they are the measured noise from running an earlier
// build over all 58 phase-99 SUMMARYs, where 99-46 scored 7 hits of which 7 were digit runs inside
// one sha. Without them the instrument flags every document and therefore says nothing.
const WORD_AT = (line, start, end) => {
  let a = start; while (a > 0 && /[\w.-]/.test(line[a - 1])) a--
  let b = end; while (b < line.length && /[\w.-]/.test(line[b])) b++
  return line.slice(a, b)
}

const isIdentifierBound = (line, start, end) => {
  const word = WORD_AT(line, start, end)
  // 1. Digits inside a sha/hex token. `71b272519d8960116f...` is one name, not five measurements.
  if (/[a-f]/i.test(word) && /^[0-9a-f.]+$/i.test(word.replace(/[^\w]/g, ''))) return true
  if (/^[0-9a-f]{7,}$/i.test(word)) return true
  // 2. `Component.tsx:315` and `AgingIndicator:66` — a source location, not a count.
  if (/[A-Za-z][\w.]*:$/.test(line.slice(Math.max(0, start - 40), start))) return true
  // 3b. A dotted-quad is an address, not four numbers. `127.0.0.1:5173` scored a hit on 127.0.
  if (/\d+\.\d+\.\d+\.\d+/.test(word)) return true
  // 3. `line 303` / `Phase 102` — a named thing that happens to be numbered.
  if (/\b(line|lines|phase|step|row|col|column|port|pid|attempt|wave|run)\s+$/i.test(line.slice(Math.max(0, start - 12), start))) return true
  const before = line.slice(Math.max(0, start - 8), start)
  const after = line.slice(end, end + 2)
  if (/[-/_.#][^\s]*$/.test(before) && !/[\s(]$/.test(before)) return true
  if (/^[-/_]\d/.test(after)) return true
  return false
}

export const findUnsupported = (text) => {
  const { unterminated, prose, verbatim } = splitBlocks(text)
  const supported = new Set()
  for (const { line } of verbatim) {
    for (const m of line.matchAll(NUM)) supported.add(canon(m[0]))
  }
  const out = []
  for (const { n, line } of prose) {
    for (const m of line.matchAll(NUM)) {
      const c = canon(m[0])
      if (isYear(c)) continue
      if (isIdentifierBound(line, m.index, m.index + m[0].length)) continue
      // Only numbers big enough to be a count or a size. Small integers in prose are overwhelmingly
      // ordinals ("the 3 parts", "step 2"), and flagging them buries the real finding.
      if (Number(c) < 100) continue
      if (supported.has(c)) continue
      out.push({ line: n, value: m[0], context: line.trim().slice(0, 110) })
    }
  }
  return { unterminated, unsupported: out, verbatimLines: verbatim.length }
}

const selfCheck = () => {
  const backed = 'prose says 41079 bytes\n\n```\nsize=41079\n```\n'
  const unbacked = 'prose says 41,030 bytes\n\n```\nsize=41079\n```\n'
  const idOnly = 'task P99-580 in phase 99-41 on 2026-08-29\n\n```\nx=1\n```\n'
  const cases = [
    ['a number present in a block is SUPPORTED', findUnsupported(backed).unsupported.length, 0],
    ['a prose-only number is UNSUPPORTED', findUnsupported(unbacked).unsupported.length, 1],
    ['identifiers and years are not measurements', findUnsupported(idOnly).unsupported.length, 0],
    ['a sha is ONE name, not five numbers',
      findUnsupported('base `71b272519d8960116f146a70936a244863eabd8f`\n\n```\nx=1\n```\n').unsupported.length, 0],
    ['a source location is not a count',
      findUnsupported('see AgingIndicator:315 and line 303\n\n```\nx=1\n```\n').unsupported.length, 0],
    ['a dotted-quad address is not a measurement',
      findUnsupported('served on 127.0.0.1:5173 here\n\n```\nx=1\n```\n').unsupported.length, 0],
    ['a real prose measurement STILL fires beside them',
      findUnsupported('sha `71b272519d8960116f146a70936a` and 336 leaves\n\n```\nx=1\n```\n').unsupported.length, 1],
  ]
  let bad = 0
  for (const [name, got, want] of cases) {
    const ok = got === want
    if (!ok) bad++
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: got ${got}, want ${want}`)
  }
  // Each arm asserts an EXACT count. An arm that only asserted "nonzero" would pass for a detector
  // that flags every number in the file, which is the failure mode this instrument is most likely to have.
  return bad === 0 ? 0 : 1
}

const args = process.argv.slice(2)
if (args[0] === '--self-check') process.exit(selfCheck())

const file = args[0]
if (!file) { console.error('usage: summary-number-provenance.mjs <SUMMARY.md> | --self-check'); process.exit(3) }
let text
try { text = fs.readFileSync(file, 'utf8') } catch (e) {
  console.error(`INSTRUMENT-CANNOT-RUN: ${file} unreadable (${e.code}) — an empty result here would be about a missing file, not a clean document`)
  process.exit(3)
}
const r = findUnsupported(text)
if (r.unterminated) { console.error('INSTRUMENT-CANNOT-RUN: unterminated fence — block boundaries are unknown, so neither a hit nor a zero can be read'); process.exit(3) }
if (r.verbatimLines === 0) { console.log(`FAIL ${file}: zero verbatim block lines — the SUMMARY records no command output at all`); process.exit(1) }
for (const u of r.unsupported) console.log(`${file}:${u.line}  UNSUPPORTED ${u.value}  | ${u.context}`)
console.log(`${file}: verbatim-lines=${r.verbatimLines} unsupported=${r.unsupported.length}`)
process.exit(r.unsupported.length === 0 ? 0 : 1)
