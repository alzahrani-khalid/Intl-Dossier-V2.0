#!/usr/bin/env node
/**
 * RULING-P99-468 closure verifier.
 *
 * A mask-deletion part is CLOSED when every test file that (a) is collected by a vitest
 * project, (b) imports one of the part's sources, and (c) asserts on a literal the part
 * deletes, is itself in that part's files[] — together with its whole import closure.
 *
 * Imports are RESOLVED, never matched by basename: `ErrorBoundary` names two different
 * files here, and a basename match reported a trap that does not exist.
 *
 * usage: verify-lane-closure.mjs <partsJson>
 */
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, dirname, join, relative } from 'node:path'

const ROOT = process.cwd()
const parts = JSON.parse(readFileSync(process.argv[2], 'utf8'))

const maskLiterals = (file) => {
  const text = readFileSync(resolve(ROOT, file), 'utf8')
  const out = new Set()
  for (const m of text.matchAll(/\bt\(\s*'[^']+'\s*,\s*'([^']*)'/g)) if (m[1].trim()) out.add(m[1])
  for (const m of text.matchAll(/defaultValue:\s*'([^']*)'/g)) if (m[1].trim()) out.add(m[1])
  return [...out]
}

const resolveImport = (fromFile, spec) => {
  let base
  if (spec.startsWith('@/')) base = join(ROOT, 'frontend/src', spec.slice(2))
  else if (spec.startsWith('.')) base = resolve(dirname(resolve(ROOT, fromFile)), spec)
  else return null
  for (const ext of ['.tsx', '.ts']) if (existsSync(base + ext)) return relative(ROOT, base + ext)
  return null
}

const testFiles = execSync(
  "git ls-files '*.test.tsx' '*.test.ts' '*.spec.tsx' '*.spec.ts'", { encoding: 'utf8' },
).trim().split('\n').filter(Boolean)

let problems = 0
for (const [partId, part] of Object.entries(parts)) {
  const owned = new Set(part.files)
  const sources = part.files.filter((f) => !/\.test\.|\.spec\.|__tests__/.test(f))
  // A zero over an empty population is what a healthy run and a broken extractor both print.
  if (sources.length === 0) {
    console.error(`INSTRUMENT-CANNOT-RUN: ${partId} has 0 source files — an empty part makes every`
      + ' closure check vacuously true. Fix the extraction before reading this result.')
    process.exit(3)
  }
  const literals = new Map()
  for (const s of sources) for (const l of maskLiterals(s)) {
    if (!literals.has(l)) literals.set(l, [])
    literals.get(l).push(s)
  }
  for (const t of testFiles) {
    const text = readFileSync(resolve(ROOT, t), 'utf8')
    const imports = [...text.matchAll(/from\s+'([^']+)'/g)]
      .map((m) => resolveImport(t, m[1])).filter(Boolean)
    const touched = imports.filter((i) => sources.includes(i))
    if (touched.length === 0) continue
    // The trap condition is that the test's EXPECTATION depends on the deleted literal — by any
    // route: getByText, getByRole({name}), getByLabelText, a placeholder, a regex, a snapshot.
    // Keying on getByText alone under-detected: it missed literals asserted via getByRole name.
    // Under-detection here hands a worker a red test it may not touch, so this fails toward
    // INCLUDING a candidate. Over-inclusion costs a little scope; under-inclusion costs a park.
    const asserted = [...literals.keys()].filter(
      (l) => literals.get(l).some((s) => touched.includes(s)) &&
             new RegExp(`['"\`/]${l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`/]`).test(text),
    )
    if (asserted.length === 0) continue
    if (!owned.has(t)) { console.log(`  ${partId}: TRAP — ${t} asserts ${asserted.length} deleted literal(s) from ${touched.join(', ')} but is NOT in files[]`); problems++; continue }
    const outside = imports.filter((i) => /frontend\/src\//.test(i) && !owned.has(i) &&
      Object.entries(parts).some(([p, q]) => p !== partId && q.files.includes(i)))
    if (outside.length > 0) { console.log(`  ${partId}: STRADDLE — ${t} is owned here but imports ${outside.join(', ')} owned by another part`); problems++; continue }
    console.log(`  ${partId}: OK — ${t} owned, closure inside the part (${asserted.length} literal(s))`)
  }
}
console.log(problems === 0 ? 'CLOSURE VERIFIED: 0 problems' : `CLOSURE FAILED: ${problems} problem(s)`)
process.exit(problems === 0 ? 0 : 1)
