/* global console, process */
// Bootstrap ⇆ token-data byte-match parity guard (FOUC-01 / TOKEN-02).
//
// The FOUC-safe first-paint script `frontend/public/bootstrap.js` hard-codes an
// ES5 copy of the design tokens (palette hexes, radius scale, font triplets,
// density spacing) so the very first frame is painted from localStorage BEFORE
// any stylesheet parses. Those literals MUST stay byte-identical to the runtime
// token data modules `frontend/src/design-system/tokens/{directions,densities}.ts`
// — a doc-only discipline that has already drifted in the past.
//
// This guard makes divergence build-breaking. It EXECUTES the real bootstrap.js
// inside a `node:vm` sandbox (hand-stubbed localStorage + document, no jsdom) for
// every direction × mode × density combination the token data exports, collects
// the CSS custom properties bootstrap paints via `style.setProperty`, and asserts
// each painted value is STRING-IDENTICAL to the value exported by the token
// modules. String `===` IS the byte-match — the two files store the same values
// under different key names (`rSm/r/rLg` vs `radius.sm/base/lg`), so we compare
// PAINTED values against EXPORTED values, never file bytes or ASTs.
//
// The truth side is imported natively: Node >=22.18 strips the `import type`-only
// TypeScript of the two data modules, so `await import()` yields the real
// PALETTES / FONTS / DENSITIES objects — immune to formatting. (Do NOT import
// buildTokens.ts — its extensionless `'./densities'` specifier fails native
// resolution.)
//
// Dependency-free: only node: builtins. Read-only: reads two source files, spawns
// no subprocess, exposes no require/process/network into the sandbox.
//
// Usage:
//   node scripts/check-bootstrap-parity.mjs                      (checks frontend/public/bootstrap.js)
//   node scripts/check-bootstrap-parity.mjs <path/to/bootstrap>  (checks an alternate file — used by
//                                                                 the CI positive-failure fixture step)
//
// Exits 0 when every painted value byte-matches the exported token data; exits 1
// (naming direction/mode/density + variable + expected vs actual) otherwise.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Script, createContext } from 'node:vm'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(scriptPath), '..')

const MODES = ['light', 'dark']

// Comparison table — maps each CSS custom property bootstrap paints to the token
// field that must match it. `source` selects which exported object supplies the
// expected value for a given combination:
//   palette → PALETTES[direction][mode]
//   fonts   → FONTS[direction]
//   density → DENSITIES[density]
// Plan 77-04 extends this table (new tier/accent/semantic vars + coercion probes)
// without touching the run/compare machinery below.
const COMPARISONS = [
  { cssVar: '--bg', source: 'palette', expected: (p) => p.bg },
  { cssVar: '--surface', source: 'palette', expected: (p) => p.surface },
  { cssVar: '--surface-raised', source: 'palette', expected: (p) => p.surfaceRaised },
  { cssVar: '--ink', source: 'palette', expected: (p) => p.ink },
  { cssVar: '--ink-mute', source: 'palette', expected: (p) => p.inkMute },
  { cssVar: '--ink-faint', source: 'palette', expected: (p) => p.inkFaint },
  { cssVar: '--line', source: 'palette', expected: (p) => p.line },
  { cssVar: '--line-soft', source: 'palette', expected: (p) => p.lineSoft },
  { cssVar: '--sidebar-bg', source: 'palette', expected: (p) => p.sidebar },
  { cssVar: '--sidebar-ink', source: 'palette', expected: (p) => p.sidebarInk },
  { cssVar: '--radius-sm', source: 'palette', expected: (p) => p.radius.sm },
  { cssVar: '--radius', source: 'palette', expected: (p) => p.radius.base },
  { cssVar: '--radius-lg', source: 'palette', expected: (p) => p.radius.lg },
  { cssVar: '--font-display', source: 'fonts', expected: (f) => f.display },
  { cssVar: '--font-body', source: 'fonts', expected: (f) => f.body },
  { cssVar: '--font-mono', source: 'fonts', expected: (f) => f.mono },
  // bootstrap paints --pad AND --pad-inline from the density inline pad value,
  // --pad-block from padBlock — mirror the live mapping (densities.ts field names).
  { cssVar: '--pad', source: 'density', expected: (dv) => dv.padInline },
  { cssVar: '--pad-inline', source: 'density', expected: (dv) => dv.padInline },
  { cssVar: '--pad-block', source: 'density', expected: (dv) => dv.padBlock },
  { cssVar: '--gap', source: 'density', expected: (dv) => dv.gap },
  { cssVar: '--row-h', source: 'density', expected: (dv) => dv.rowH },
]

/**
 * Execute the compiled bootstrap script in a FRESH vm sandbox seeded for one
 * direction × mode × density combination. Returns a Map of painted CSS custom
 * property name → value. The sandbox stubs the exact surface bootstrap.js touches
 * (localStorage, document.documentElement style/classList/dataset/setAttribute/
 * lang/dir, plus parseInt/isNaN) so a missing stub cannot be silently swallowed
 * by the script's outer try/catch.
 */
function paintBootstrap(compiledScript, { direction, mode, density }) {
  const painted = new Map()
  const store = new Map([
    ['id.dir', direction],
    ['id.theme', mode],
    ['id.density', density],
  ])
  const ops = []
  const localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      ops.push({ op: 'set', key, value })
      store.set(key, value)
    },
    removeItem: (key) => {
      ops.push({ op: 'remove', key })
      store.delete(key)
    },
  }
  const documentElement = {
    style: {
      setProperty: (name, value) => {
        painted.set(name, value)
      },
    },
    classList: { toggle: () => {}, add: () => {}, remove: () => {} },
    setAttribute: () => {},
    dataset: {},
    lang: '',
    dir: '',
  }
  const context = createContext({
    localStorage,
    document: { documentElement },
    parseInt,
    isNaN,
  })
  compiledScript.runInContext(context)
  return painted
}

/**
 * Resolve the expected value for a comparison against the truth objects for the
 * current combination.
 */
function expectedFor(comparison, truth) {
  if (comparison.source === 'palette') {
    return comparison.expected(truth.palette)
  }
  if (comparison.source === 'fonts') {
    return comparison.expected(truth.fonts)
  }
  return comparison.expected(truth.density)
}

async function main() {
  const directionsUrl = pathToFileURL(
    resolve(repoRoot, 'frontend/src/design-system/tokens/directions.ts'),
  ).href
  const densitiesUrl = pathToFileURL(
    resolve(repoRoot, 'frontend/src/design-system/tokens/densities.ts'),
  ).href
  const { PALETTES, FONTS } = await import(directionsUrl)
  const { DENSITIES } = await import(densitiesUrl)

  const cliArg = process.argv[2]
  const bootstrapPath = cliArg
    ? resolve(repoRoot, cliArg)
    : resolve(repoRoot, 'frontend/public/bootstrap.js')
  const source = readFileSync(bootstrapPath, 'utf8')
  const compiledScript = new Script(source)

  const directions = Object.keys(PALETTES)
  const densities = Object.keys(DENSITIES)
  const failures = []
  let combinations = 0

  for (const direction of directions) {
    for (const mode of MODES) {
      for (const density of densities) {
        combinations += 1
        const painted = paintBootstrap(compiledScript, { direction, mode, density })
        if (painted.size === 0) {
          failures.push({
            direction,
            mode,
            density,
            cssVar: '(all)',
            expected: '<any painted value>',
            actual: 'nothing — bootstrap painted 0 vars (a vm stub is missing or bootstrap threw)',
          })
          continue
        }
        const truth = {
          palette: PALETTES[direction][mode],
          fonts: FONTS[direction],
          density: DENSITIES[density],
        }
        for (const comparison of COMPARISONS) {
          const expected = expectedFor(comparison, truth)
          const actual = painted.get(comparison.cssVar)
          if (actual !== expected) {
            failures.push({
              direction,
              mode,
              density,
              cssVar: comparison.cssVar,
              expected,
              actual: actual === undefined ? '<not painted>' : actual,
            })
          }
        }
      }
    }
  }

  const relBootstrap = bootstrapPath.startsWith(`${repoRoot}/`)
    ? bootstrapPath.slice(repoRoot.length + 1)
    : bootstrapPath

  if (failures.length > 0) {
    console.error(
      `bootstrap parity check FAILED: ${failures.length} painted value(s) in ${relBootstrap} diverge from tokens/directions.ts + densities.ts:`,
    )
    for (const failure of failures) {
      console.error(
        `  ${failure.direction}/${failure.mode}/${failure.density}: ${failure.cssVar} expected ${JSON.stringify(
          failure.expected,
        )} but bootstrap painted ${JSON.stringify(failure.actual)}`,
      )
    }
    console.error('')
    console.error(
      'Fix: make the bootstrap.js literal byte-match the token data module (or vice-versa). bootstrap.js is the ES5 FOUC copy of frontend/src/design-system/tokens/{directions,densities}.ts — they must stay string-identical.',
    )
    process.exit(1)
  }

  console.log(
    `bootstrap parity check OK: ${combinations} combinations (${directions.length} directions × ${MODES.length} modes × ${densities.length} densities), ${COMPARISONS.length} variables each — ${relBootstrap} byte-matches tokens/directions.ts + densities.ts.`,
  )
  process.exit(0)
}

main().catch((error) => {
  console.error('bootstrap parity check ERRORED:', error)
  process.exit(1)
})
