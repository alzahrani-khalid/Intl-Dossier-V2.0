/* global console, process */
// Bootstrap ⇆ token-data byte-match parity guard, v2 (FOUC-01 / TOKEN-02 / TOKEN-04).
//
// The FOUC-safe first-paint script `frontend/public/bootstrap.js` hard-codes an
// ES5 copy of the Linear design tokens (palette hexes, radius scale, font triplets,
// density spacing, plus the extended tier/accent/semantic/sla/status groups) so the
// very first frame is painted from localStorage BEFORE any stylesheet parses. Those
// literals MUST stay byte-identical to the runtime token data modules
// `frontend/src/design-system/tokens/{directions,densities}.ts` — a doc-only
// discipline that has already drifted in the past (see the `:root` drift closed by
// Plan 77-04).
//
// After Plan 77-04 the bootstrap COERCES every legacy `id.dir`
// (bureau/chancery/situation/ministerial) to `'linear'` and defaults an unset
// `id.theme` to `'dark'`. This guard therefore does three things and makes each
// build-breaking:
//
//   1. BYTE-MATCH — for `id.dir='linear'` × {light,dark} × {comfortable,compact,dense},
//      execute the real bootstrap in a `node:vm` sandbox and assert every painted CSS
//      custom property (core + extended groups + radius + fonts + density) is
//      STRING-IDENTICAL to the value exported by the token modules. String `===` IS
//      the byte-match — the files store the same values under different key names.
//   2. COERCION PROBES (TOKEN-04) — for each retired `id.dir` (and for a fully-unset
//      localStorage), assert the painted `--bg` equals PALETTES.linear.dark.bg AND
//      that the localStorage stub recorded `setItem('id.dir','linear')` (the
//      load-bearing legacy migration). This makes a coercion regression fail the build.
//   3. :root THIRD-COPY CHECK — regex-extract the first `:root { … }` block from
//      `frontend/src/index.css` and assert its core+extended var values byte-match
//      PALETTES.linear.dark / FONTS.linear (defense-in-depth first-frame fallback).
//
// The truth side is imported natively: Node >=22.18 strips the `import type`-only
// TypeScript of the two data modules, so `await import()` yields the real
// PALETTES / FONTS / DENSITIES objects. (Do NOT import buildTokens.ts — its
// extensionless `'./densities'` specifier fails native resolution.)
//
// Dependency-free: only node: builtins. Read-only: reads the bootstrap + index.css,
// spawns no subprocess, exposes no require/process/network into the sandbox.
//
// Usage:
//   node scripts/check-bootstrap-parity.mjs                      (checks frontend/public/bootstrap.js)
//   node scripts/check-bootstrap-parity.mjs <path/to/bootstrap>  (checks an alternate file — used by
//                                                                 the CI positive-failure fixture step)
//
// Exits 0 when every check passes; exits 1 (naming the failing check + variable +
// expected vs actual) otherwise.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Script, createContext } from 'node:vm'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(scriptPath), '..')

const MODES = ['light', 'dark']
// Plan 77-04: bootstrap paints Linear only (all legacy id.dir coerce to 'linear').
const BYTE_MATCH_DIRECTION = 'linear'
const RETIRED_DIRECTIONS = ['bureau', 'chancery', 'situation', 'ministerial']

// ---------------------------------------------------------------------------
// Comparison tables. Each entry is [cssVar, pick]. `pick(palette)` returns the
// expected string, or `undefined` when the palette lacks that group (keeps the
// guard generic — extended groups are only present on the Linear palette).
// ---------------------------------------------------------------------------
const CORE_PALETTE = [
  ['--bg', (p) => p.bg],
  ['--surface', (p) => p.surface],
  ['--surface-raised', (p) => p.surfaceRaised],
  ['--ink', (p) => p.ink],
  ['--ink-mute', (p) => p.inkMute],
  ['--ink-faint', (p) => p.inkFaint],
  ['--line', (p) => p.line],
  ['--line-soft', (p) => p.lineSoft],
  ['--sidebar-bg', (p) => p.sidebar],
  ['--sidebar-ink', (p) => p.sidebarInk],
  ['--radius-sm', (p) => p.radius.sm],
  ['--radius', (p) => p.radius.base],
  ['--radius-lg', (p) => p.radius.lg],
]

const EXTENDED_PALETTE = [
  ['--surface-3', (p) => p.surface3],
  ['--surface-4', (p) => p.surface4],
  ['--ink-tertiary', (p) => p.inkTertiary],
  ['--line-strong', (p) => p.lineStrong],
  ['--accent', (p) => p.accent && p.accent.base],
  ['--accent-hover', (p) => p.accent && p.accent.hover],
  ['--accent-fg', (p) => p.accent && p.accent.fg],
  ['--accent-ink', (p) => p.accent && p.accent.ink],
  ['--accent-soft', (p) => p.accent && p.accent.soft],
  ['--danger', (p) => p.semantic && p.semantic.danger],
  ['--danger-soft', (p) => p.semantic && p.semantic.dangerSoft],
  ['--warn', (p) => p.semantic && p.semantic.warn],
  ['--warn-soft', (p) => p.semantic && p.semantic.warnSoft],
  ['--ok', (p) => p.semantic && p.semantic.ok],
  ['--ok-soft', (p) => p.semantic && p.semantic.okSoft],
  ['--info', (p) => p.semantic && p.semantic.info],
  ['--info-soft', (p) => p.semantic && p.semantic.infoSoft],
  ['--sla-ok', (p) => p.sla && p.sla.ok],
  ['--sla-ok-soft', (p) => p.sla && p.sla.okSoft],
  ['--sla-risk', (p) => p.sla && p.sla.risk],
  ['--sla-risk-soft', (p) => p.sla && p.sla.riskSoft],
  ['--sla-bad', (p) => p.sla && p.sla.bad],
  ['--sla-bad-soft', (p) => p.sla && p.sla.badSoft],
]
for (let i = 0; i < 6; i += 1) {
  EXTENDED_PALETTE.push([`--status-${i + 1}`, (p) => p.status && p.status[i] && p.status[i].fg])
  EXTENDED_PALETTE.push([
    `--status-${i + 1}-soft`,
    (p) => p.status && p.status[i] && p.status[i].soft,
  ])
}

const FONT_COMPARE = [
  ['--font-display', (f) => f.display],
  ['--font-body', (f) => f.body],
  ['--font-mono', (f) => f.mono],
]

const DENSITY_COMPARE = [
  ['--pad', (dv) => dv.padInline],
  ['--pad-inline', (dv) => dv.padInline],
  ['--pad-block', (dv) => dv.padBlock],
  ['--gap', (dv) => dv.gap],
  ['--row-h', (dv) => dv.rowH],
]

/**
 * Execute the compiled bootstrap script in a FRESH vm sandbox seeded from `seed`
 * (a plain object of localStorage entries). Returns { painted, ops }: painted is a
 * Map of CSS custom property → value, ops is the ordered list of localStorage
 * writes/removes the script performed (used to assert the coercion write-back).
 * The sandbox stubs the exact surface bootstrap.js touches so a missing stub cannot
 * be silently swallowed by the script's outer try/catch.
 */
function paintBootstrap(compiledScript, seed) {
  const painted = new Map()
  const store = new Map(Object.entries(seed))
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
  return { painted, ops }
}

/** Extract `--name: value;` pairs from the first `:root { … }` block of a CSS file. */
function extractRootVars(css) {
  const match = /:root\s*\{([\s\S]*?)\}/.exec(css)
  if (!match) return null
  const body = match[1].replace(/\/\*[\s\S]*?\*\//g, '') // strip comments
  const vars = new Map()
  const re = /--([\w-]+)\s*:\s*([^;]+);/g
  let m
  while ((m = re.exec(body)) !== null) {
    vars.set(`--${m[1]}`, m[2].trim())
  }
  return vars
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

  const linearDark = PALETTES[BYTE_MATCH_DIRECTION].dark
  const densities = Object.keys(DENSITIES)
  const failures = []

  // 1. BYTE-MATCH — linear × modes × densities.
  let byteMatchCombos = 0
  const paletteCompare = [...CORE_PALETTE, ...EXTENDED_PALETTE]
  for (const mode of MODES) {
    for (const density of densities) {
      byteMatchCombos += 1
      const { painted } = paintBootstrap(compiledScript, {
        'id.dir': BYTE_MATCH_DIRECTION,
        'id.theme': mode,
        'id.density': density,
      })
      if (painted.size === 0) {
        failures.push({
          check: 'byte-match',
          combo: `${BYTE_MATCH_DIRECTION}/${mode}/${density}`,
          cssVar: '(all)',
          expected: '<any painted value>',
          actual: 'nothing — bootstrap painted 0 vars (a vm stub is missing or bootstrap threw)',
        })
        continue
      }
      const palette = PALETTES[BYTE_MATCH_DIRECTION][mode]
      const checks = [
        ...paletteCompare.map(([v, pick]) => [v, pick(palette)]),
        ...FONT_COMPARE.map(([v, pick]) => [v, pick(FONTS[BYTE_MATCH_DIRECTION])]),
        ...DENSITY_COMPARE.map(([v, pick]) => [v, pick(DENSITIES[density])]),
      ]
      for (const [cssVar, expected] of checks) {
        if (expected === undefined) continue // group absent — skip (generic)
        const actual = painted.get(cssVar)
        if (actual !== expected) {
          failures.push({
            check: 'byte-match',
            combo: `${BYTE_MATCH_DIRECTION}/${mode}/${density}`,
            cssVar,
            expected,
            actual: actual === undefined ? '<not painted>' : actual,
          })
        }
      }
    }
  }

  // 2. COERCION PROBES — each retired id.dir (+ fully-unset) → linear-dark + write-back.
  const coercionSeeds = [
    ...RETIRED_DIRECTIONS.map((dir) => ({ label: `id.dir=${dir}`, seed: { 'id.dir': dir } })),
    { label: 'unset (no localStorage)', seed: {} },
  ]
  for (const { label, seed } of coercionSeeds) {
    const { painted, ops } = paintBootstrap(compiledScript, seed)
    const bg = painted.get('--bg')
    if (bg !== linearDark.bg) {
      failures.push({
        check: 'coercion',
        combo: label,
        cssVar: '--bg',
        expected: linearDark.bg,
        actual: bg === undefined ? '<not painted>' : bg,
      })
    }
    const wroteLinear = ops.some(
      (o) => o.op === 'set' && o.key === 'id.dir' && o.value === 'linear',
    )
    if (!wroteLinear) {
      failures.push({
        check: 'coercion',
        combo: label,
        cssVar: "localStorage.setItem('id.dir','linear')",
        expected: 'recorded',
        actual: 'not recorded (write-back missing — id.dir would never converge)',
      })
    }
  }

  // 3. :root THIRD-COPY CHECK — index.css :root vs PALETTES.linear.dark / FONTS.linear.
  const indexCss = readFileSync(resolve(repoRoot, 'frontend/src/index.css'), 'utf8')
  const rootVars = extractRootVars(indexCss)
  let rootChecks = 0
  if (rootVars === null) {
    failures.push({
      check: ':root',
      combo: 'index.css',
      cssVar: '(block)',
      expected: 'a :root { … } block',
      actual: 'none found',
    })
  } else {
    const rootExpected = []
    for (const [cssVar, pick] of [...CORE_PALETTE, ...EXTENDED_PALETTE]) {
      const v = pick(linearDark)
      if (v !== undefined) rootExpected.push([cssVar, v])
    }
    for (const [cssVar, pick] of FONT_COMPARE) {
      rootExpected.push([cssVar, pick(FONTS[BYTE_MATCH_DIRECTION])])
    }
    for (const [cssVar, expected] of rootExpected) {
      rootChecks += 1
      const actual = rootVars.get(cssVar)
      if (actual !== expected) {
        failures.push({
          check: ':root',
          combo: 'index.css',
          cssVar,
          expected,
          actual: actual === undefined ? '<absent from :root>' : actual,
        })
      }
    }
  }

  const relBootstrap = bootstrapPath.startsWith(`${repoRoot}/`)
    ? bootstrapPath.slice(repoRoot.length + 1)
    : bootstrapPath

  if (failures.length > 0) {
    console.error(
      `bootstrap parity check FAILED: ${failures.length} divergence(s) in ${relBootstrap} / index.css :root vs tokens/directions.ts + densities.ts:`,
    )
    for (const f of failures) {
      console.error(
        `  [${f.check}] ${f.combo}: ${f.cssVar} expected ${JSON.stringify(
          f.expected,
        )} but got ${JSON.stringify(f.actual)}`,
      )
    }
    console.error('')
    console.error(
      'Fix: make the bootstrap.js literal + the index.css :root block byte-match tokens/directions.ts (PALETTES.linear + FONTS.linear) / densities.ts — the three copies must stay string-identical, and every legacy id.dir must coerce to linear.',
    )
    process.exit(1)
  }

  console.log(
    `bootstrap parity check OK: byte-match ${byteMatchCombos} linear combos (${MODES.length} modes × ${densities.length} densities, ${paletteCompare.length + FONT_COMPARE.length + DENSITY_COMPARE.length} vars each) + ${coercionSeeds.length} coercion probes (${RETIRED_DIRECTIONS.join('/')}/unset → linear-dark + write-back) + ${rootChecks} :root literal checks — ${relBootstrap} & index.css :root byte-match tokens/directions.ts + densities.ts.`,
  )
  process.exit(0)
}

main().catch((error) => {
  console.error('bootstrap parity check ERRORED:', error)
  process.exit(1)
})
