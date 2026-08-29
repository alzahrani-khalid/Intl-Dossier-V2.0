#!/usr/bin/env node
/**
 * Dynamic-key coverage gate — RULING-P99-498.
 *
 * WHY THIS EXISTS. `i18n-audit-strict.mjs` matches a SINGLE-QUOTED first argument, so it cannot see
 * a template-literal key like t(`typeGuide.${type}.whenToUse`). Those are exactly the sites the ''
 * sentinels protect. On run 0065 that produced a perverse incentive: the audit REWARDED deleting the
 * sentinel (one fewer second argument) while review REJECTED it (raw keys rendered for seven dossier
 * types). A worker under gate pressure does what the oracle scores, and it deleted them twice.
 *
 * A clause telling a worker not to delete them, while the oracle rewards deleting them, is decorative.
 * This gate makes the oracle agree with the reviewer:
 *
 *   A dynamic-key site may drop its fallback ONLY IF every reachable key exists in BOTH locales.
 *
 * Reachability comes from the declared TYPE UNION, not from the locale file — the population lesson
 * this phase keeps re-learning. Exit 0 pass · 1 fail · 3 cannot-run.
 *
 *   usage: i18n-dynamic-key-coverage.mjs <repoRoot>
 *          i18n-dynamic-key-coverage.mjs --self-check
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCALES = ['en', 'ar']

// Declared families. Each names a dynamic-key site, the union its variable ranges over, and the leaf
// suffixes it builds. Adding a family is how this gate grows; it never guesses.
const FAMILIES = [
  {
    name: 'dossier type guide',
    site: 'frontend/src/components/dossier/DossierTypeGuide.tsx',
    ns: 'dossier',
    prefix: 'typeGuide',
    suffixes: ['whenToUse', 'notFor'],
    unionFile: 'frontend/src/lib/dossier-type-guards.ts',
    // DOSSIER_CARD_TYPES = [...DOSSIER_TYPES, 'elected_official']
    unionConsts: ['DOSSIER_TYPES'],
    unionExtra: ['elected_official'],
  },
]

const readUnion = (root, f) => {
  const text = readFileSync(resolve(root, f.unionFile), 'utf8')
  const out = []
  for (const c of f.unionConsts) {
    const m = text.match(new RegExp(`${c}\\s*=\\s*\\[([\\s\\S]*?)\\]`))
    if (m === null) return null
    out.push(...[...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]))
  }
  return [...new Set([...out, ...(f.unionExtra ?? [])])].sort()
}

// Does the site still pass a fallback for this leaf? A comma after the template literal means yes.
const hasFallback = (siteText, prefix, suffix) =>
  new RegExp('t\\(\\s*`' + prefix + '\\.\\$\\{[^}]+\\}\\.' + suffix + '`\\s*,').test(siteText)
const hasSite = (siteText, prefix, suffix) =>
  new RegExp('t\\(\\s*`' + prefix + '\\.\\$\\{[^}]+\\}\\.' + suffix + '`').test(siteText)

const run = (root) => {
  let failures = 0, checked = 0
  for (const f of FAMILIES) {
    const sitePath = resolve(root, f.site)
    if (!existsSync(sitePath)) { console.error(`INSTRUMENT-CANNOT-RUN: missing site ${f.site}`); process.exit(3) }
    const siteText = readFileSync(sitePath, 'utf8')
    const union = readUnion(root, f)
    if (union === null || union.length === 0) { console.error(`INSTRUMENT-CANNOT-RUN: union did not parse for ${f.name}`); process.exit(3) }
    let bundles
    try { bundles = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(readFileSync(resolve(root, `frontend/src/i18n/${l}/${f.ns}.json`), 'utf8'))])) }
    catch (e) { console.error(`INSTRUMENT-CANNOT-RUN: locale bundle unreadable: ${e.message}`); process.exit(3) }

    console.log(`${f.name}: union=${union.length} [${union.join(',')}]`)
    for (const suffix of f.suffixes) {
      if (!hasSite(siteText, f.prefix, suffix)) { console.log(`  ${f.prefix}.<t>.${suffix}: site absent — skipped`); continue }
      checked++
      const missing = union.filter((t) =>
        LOCALES.some((l) => typeof bundles[l]?.[f.prefix]?.[t]?.[suffix] !== 'string'))
      const guarded = hasFallback(siteText, f.prefix, suffix)
      console.log(`  ${f.prefix}.<t>.${suffix}: fallback=${guarded ? 'present' : 'ABSENT'} missing=${missing.length}/${union.length}`)
      if (!guarded && missing.length > 0) {
        console.error(`  FAIL ${f.prefix}.<t>.${suffix}: fallback removed while ${missing.length} reachable key(s) are absent from a locale — these render the RAW KEY: ${missing.join(', ')}`)
        failures++
      }
    }
  }
  if (checked === 0) { console.error('INSTRUMENT-CANNOT-RUN: no declared site was found; an empty population proves nothing'); process.exit(3) }
  console.log(failures === 0 ? `dynamic-key coverage: OK (${checked} site(s))` : `dynamic-key coverage: ${failures} FAILURE(S)`)
  return failures
}

if (process.argv[2] === '--self-check') {
  const site = (fb) => fb
    ? "const a = t(`typeGuide.${type}.whenToUse`, '')"
    : 'const a = t(`typeGuide.${type}.whenToUse`)'
  const cases = [
    ['fallback present -> not a failure even with gaps', hasFallback(site(true), 'typeGuide', 'whenToUse'), true],
    ['fallback absent  -> detected as unguarded',        hasFallback(site(false), 'typeGuide', 'whenToUse'), false],
    ['site detected either way',                          hasSite(site(false), 'typeGuide', 'whenToUse'), true],
    ['a different leaf is not matched',                    hasSite(site(false), 'typeGuide', 'notFor'), false],
  ]
  let bad = 0
  for (const [n, got, want] of cases) { if (got !== want) bad++; console.log(`  ${got === want ? 'PASS' : 'FAIL'}  ${n}`) }
  console.log(bad === 0 ? 'SELF-CHECK PASS' : `SELF-CHECK FAIL (${bad})`)
  process.exit(bad === 0 ? 0 : 1)
}

const root = process.argv[2] ?? '.'
process.exit(run(root) === 0 ? 0 : 1)
