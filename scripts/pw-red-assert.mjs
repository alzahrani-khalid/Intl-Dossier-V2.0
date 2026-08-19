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
import { pathToFileURL } from 'node:url'

const FAIL = (msg) => {
  console.error(`pw-red-assert: ${msg}`)
  process.exit(1)
}

/**
 * ORIGIN of a failure (RULING-P99-42). A red is only the application's red if the failure happened
 * in the SPEC BODY. Measured 2026-08-19 on two MERGED tasks, both greened by failures that never
 * touched the app:
 *   P99-03: 5/5 failures at `location.file` = tests/e2e/fixtures/99-positions-seed.mjs:48,
 *           "Cannot verify pg_constraint before seeding: set SUPABASE_DB_URL" — a fixture throw.
 *   P99-02: 8/8 failures with message 'Test timeout of 300000ms exceeded while running
 *           "beforeEach" hook' — location is the SPEC FILE (line 120, the hook itself), so a
 *           path test alone does NOT catch it. The MESSAGE is what names the hook.
 * Both signals are therefore required: the hook message AND the out-of-body path.
 */
const HOOK_MSG = /while running "(beforeAll|beforeEach|afterAll|afterEach)" hook/
const OUT_OF_BODY_PATH = /\/(fixtures|helpers|support)\//

export const originOf = (err) => {
  const msg = String(err?.message ?? '')
  if (HOOK_MSG.test(msg)) return 'hook'
  const file = String(err?.location?.file ?? '')
  if (OUT_OF_BODY_PATH.test(file)) return 'fixture'
  const stack = String(err?.stack ?? '')
  if (OUT_OF_BODY_PATH.test(stack.split('\n')[1] ?? '')) return 'fixture'
  return 'body'
}

/** First line of an error message, ANSI stripped — the unit we count causes in. */
export const causeOf = (err) =>
  String(err?.message ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/\u001b\[[0-9;]*m/g, '')
    .trim()
    .split('\n')[0]
    .slice(0, 120)

/** Flatten Playwright's nested suites/specs/tests into [{title, failed}]. */
export const collectSpecs = (report) => {
  const out = []
  const walkSuite = (suite) => {
    for (const spec of suite.specs ?? []) {
      const failed = (spec.tests ?? []).some((t) =>
        (t.results ?? []).some((r) => r.status !== 'passed' && r.status !== 'skipped'),
      )
      const errs = []
      for (const t of spec.tests ?? [])
        for (const r of t.results ?? []) {
          if (r.error) errs.push(r.error)
          for (const e of r.errors ?? []) if (e !== r.error) errs.push(e)
        }
      out.push({ title: spec.title, failed, errors: errs })
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
  // RULING-P99-42: a report whose failures ALL originate outside the spec body is not the
  // application's red. It is the environment's, or the harness's, wearing a test failure's costume.
  const withErrors = failing.filter((s) => (s.errors ?? []).length > 0)
  if (withErrors.length > 0) {
    const origins = withErrors.map((s) => ({
      title: s.title,
      origins: s.errors.map(originOf),
    }))
    const anyBody = origins.some((o) => o.origins.includes('body'))
    const causes = new Set(withErrors.flatMap((s) => s.errors.map(causeOf)))
    if (!anyBody) {
      const kinds = new Set(origins.flatMap((o) => o.origins))
      return (
        `failures did NOT originate in the spec body: every one of ${withErrors.length} failing ` +
        `spec(s) failed in [${[...kinds].join(', ')}] — this is the environment or the harness, ` +
        `not the application. Distinct cause(s): ${causes.size}` +
        (causes.size === 1 ? ` (a MONOCULTURE: "${[...causes][0]}")` : '') +
        `. A red must be earned in the spec body.`
      )
    }
    if (causes.size === 1 && withErrors.length > 1) {
      // Not a refusal on its own — a single genuine assertion can legitimately fail many specs —
      // but it is stated so a reader never has to infer it.
      console.error(
        `pw-red-assert: NOTE — ${withErrors.length} failing specs share ONE cause ` +
          `("${[...causes][0]}"), with at least one in-body origin. Accepted, but a monoculture is ` +
          `worth a human's eye.`,
      )
    }
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
// Only act when RUN as a program. Imported (for assertRed/originOf, or by a drill), this file must
// do nothing -- it previously executed its CLI on import and exited 1 with a usage error, which is
// the same import-safety defect pw-run-reaped.mjs records fixing in itself.
const isEntry = import.meta.url === pathToFileURL(process.argv[1] ?? '').href
if (!isEntry) {
  // imported: expose the exports and stop
} else if (argv[0] === '--selftest') {
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
