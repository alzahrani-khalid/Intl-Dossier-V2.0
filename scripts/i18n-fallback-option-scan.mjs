#!/usr/bin/env node
/**
 * Multi-line scan for fallback-text OPTIONS on t() call sites — RULING-P99-477 §4.
 *
 * The acceptance grep this replaces was `grep -rnE "t\([^)]*defaultValue"`, which is LINE-BOUND:
 * a t() call whose options object spans lines is invisible to it, and it also could not see the
 * plural forms `defaultValue_one:` / `defaultValue_other:`. Both blindnesses were live at once on
 * P99-58, where acceptance passed twice while review failed twice on the very same four lines.
 *
 * REPORTER, not gatekeeper: it exits 0 whether or not it finds hits, so a caller chains it safely
 * and asserts on the OUTPUT. Exit 3 means it could not run, which is never an "all clear".
 *
 *   usage: i18n-fallback-option-scan.mjs <file>...
 *          i18n-fallback-option-scan.mjs --self-check
 */
import { readFileSync } from 'node:fs'

// Same semantics as i18n-audit-strict.mjs HAS_DEFAULT_VALUE: the suffix group is optional so the
// plain form still matches, and `\s*:` keeps the unrelated `defaultValues:` (form defaults) out.
const FALLBACK_OPTION = /\bdefaultValue(_[A-Za-z0-9]+)?\s*:/
const T_WITH_OPTIONS = /\bt\(\s*(['"`])[^'"`]+\1\s*,\s*\{[\s\S]*?\}\s*\)/g
const IS_TEST = /\.test\.|\.spec\.|__tests__/

const scan = (text, file) => {
  const hits = []
  for (const m of text.matchAll(T_WITH_OPTIONS)) {
    if (!FALLBACK_OPTION.test(m[0])) continue
    const line = text.slice(0, m.index).split('\n').length
    hits.push(`${file}:${line}: ${m[0].replace(/\s+/g, ' ').slice(0, 120)}`)
  }
  return hits
}

if (process.argv[2] === '--self-check') {
  const cases = [
    ['plain single-line', "t('k', { defaultValue: 'D' })", 1],
    ['plain multi-line', "t('k', {\n  defaultValue: 'D',\n})", 1],
    ['plural multi-line', "t('k', {\n  count: 2,\n  defaultValue_one: '{{count}} file',\n  defaultValue_other: '{{count}} files',\n})", 1],
    ['interpolation only', "t('k', {\n  count: 2,\n})", 0],
    ['defaultValues is NOT a mask', "t('k', {\n  defaultValues: { a: 1 },\n})", 0],
    ['no options', "t('k')", 0],
  ]
  let bad = 0
  for (const [name, src, want] of cases) {
    const got = scan(src, 'fixture').length
    const ok = got === want
    if (!ok) bad++
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}: found ${got}, want ${want}`)
  }
  // A scanner that finds nothing anywhere would pass every zero-expecting case above.
  if (scan("t('k', { defaultValue: 'D' })", 'x').length === 0) { console.error('  POSITIVE CONTROL FAILED'); bad++ }
  console.log(bad === 0 ? 'SELF-CHECK PASS' : `SELF-CHECK FAIL (${bad})`)
  process.exit(bad === 0 ? 0 : 1)
}

const files = process.argv.slice(2)
if (files.length === 0) { console.error('INSTRUMENT-CANNOT-RUN: no files given'); process.exit(3) }
const out = []
for (const f of files) {
  if (IS_TEST.test(f)) continue
  let text
  try { text = readFileSync(f, 'utf8') } catch (e) {
    console.error(`INSTRUMENT-CANNOT-RUN: cannot read ${f}: ${e.message}`)
    process.exit(3)
  }
  out.push(...scan(text, f))
}
if (out.length > 0) console.log(out.join('\n'))
process.exit(0)
