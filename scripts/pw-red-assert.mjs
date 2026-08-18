#!/usr/bin/env node
/**
 * Crash-proof RED assertion for Playwright rendered oracles (RULING-P99-27 §3).
 *
 * WHY THIS EXISTS. The oracles it replaces asserted RED as `! pnpm exec playwright test …`,
 * which reads ONE BIT — "exited non-zero" — and any harness failure produces that bit too.
 * Measured on the merged tree: the dates oracle exited 1 on
 * `Error: http://localhost:5173 is already used`, with zero tests run and nothing rendered,
 * and the negation reported PASS. A run that never started is not a red.
 *
 * WHAT IT DEMANDS INSTEAD — positive evidence a crash cannot fabricate, all three together:
 *   1. the JSON report EXISTS and PARSES               (a crash usually writes nothing)
 *   2. the tests actually RAN: counted total == expected (a crash reports 0)
 *   3. at least one test FAILED on its assertions, and every REQUIRED title is among the failures
 *
 * The process exit code of the playwright run is deliberately NOT consulted. Content carries the
 * verdict, so the oracle cannot be satisfied by an exit status alone.
 *
 * usage: node scripts/pw-red-assert.mjs <report.json> <expectedTotal> [requiredFailingTitle...]
 *   self-check: node scripts/pw-red-assert.mjs --selftest
 */
import { existsSync, readFileSync } from 'node:fs'

const FAIL = (msg) => {
  console.error(`pw-red-assert: ${msg}`)
  process.exit(1)
}

/** Flatten Playwright's nested suites/specs/tests into [{title, failed}]. */
export const collectSpecs = (report) => {
  const out = []
  const walkSuite = (suite) => {
    for (const spec of suite.specs ?? []) {
      const failed = (spec.tests ?? []).some((t) =>
        (t.results ?? []).some((r) => r.status !== 'passed' && r.status !== 'skipped'),
      )
      out.push({ title: spec.title, failed })
    }
    for (const child of suite.suites ?? []) walkSuite(child)
  }
  for (const suite of report.suites ?? []) walkSuite(suite)
  return out
}

export const assertRed = (report, expectedTotal, requiredTitles) => {
  const specs = collectSpecs(report)
  if (specs.length !== expectedTotal) {
    return `tests did NOT run: report carries ${specs.length} spec(s), expected ${expectedTotal}. A harness crash reports 0 — this is not a red.`
  }
  const failing = specs.filter((s) => s.failed)
  if (failing.length < 1) {
    return `every test PASSED — the tree is not red. Counted ${specs.length}, failures 0.`
  }
  const failedTitles = failing.map((s) => s.title)
  const missing = requiredTitles.filter((t) => !failedTitles.some((f) => f.includes(t)))
  if (missing.length > 0) {
    return `required failing title(s) not among the failures: ${missing.join(' | ')}. Observed failures: ${failedTitles.join(' | ')}`
  }
  return null
}

const selftest = () => {
  const mk = (titles, failedIdx) => ({
    suites: [
      {
        specs: titles.map((t, i) => ({
          title: t,
          tests: [{ results: [{ status: failedIdx.includes(i) ? 'failed' : 'passed' }] }],
        })),
      },
    ],
  })
  const eq = (got, want, label) => {
    const ok = want === null ? got === null : typeof got === 'string' && got.includes(want)
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : ` -> got: ${got}`}`)
    if (!ok) process.exitCode = 1
  }
  eq(assertRed(mk(['a', 'b'], [0]), 2, ['a']), null, 'real red with the required title failing')
  eq(assertRed({ suites: [] }, 2, ['a']), 'tests did NOT run', 'CRASH: empty report is not a red')
  eq(assertRed(mk(['a', 'b'], []), 2, ['a']), 'every test PASSED', 'all green is not a red')
  eq(assertRed(mk(['a', 'b'], [1]), 2, ['a']), 'required failing title', 'wrong test failed')
  eq(assertRed(mk(['a'], [0]), 2, ['a']), 'tests did NOT run', 'partial run is not a red')
  console.log(process.exitCode ? 'SELFTEST FAILED' : 'SELFTEST OK (5/5)')
}

const argv = process.argv.slice(2)
if (argv[0] === '--selftest') {
  selftest()
} else {
  const [path, totalRaw, ...required] = argv
  if (path === undefined || totalRaw === undefined) FAIL('usage: <report.json> <expectedTotal> [title...]')
  const expectedTotal = Number(totalRaw)
  if (!Number.isInteger(expectedTotal) || expectedTotal < 1) FAIL(`bad expectedTotal: ${totalRaw}`)
  if (!existsSync(path)) FAIL(`no JSON report at ${path} — the harness never produced one, so nothing ran`)
  let report
  try {
    report = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    FAIL(`JSON report at ${path} does not parse (${e.message}) — treat as a harness failure, not a red`)
  }
  const problem = assertRed(report, expectedTotal, required)
  if (problem !== null) FAIL(problem)
  console.log(`pw-red-assert: OK — ${expectedTotal} tests ran, ${collectSpecs(report).filter((s) => s.failed).length} failed, required titles present`)
}
