#!/usr/bin/env node
// How many `t('key', 'English default')` sites reference a key that does NOT resolve in the EN
// locale? Those render today ONLY because of the default, so dropping defaults naively turns them
// into raw key strings in BOTH locales.
//
// Models what the naive check cannot: the per-file default namespace from useTranslation('ns'),
// and colon-form explicit namespaces. Reports naive and namespace-aware counts separately.
//
// ONE-ARG EXTENSION (Phase 98, D-23). The two-arg matcher above models the SILENT-DEFAULT mask:
// a miss that renders English in both locales. It is structurally blind to the class criterion 2
// is actually about — `t('dotted.key')` with NO default, which renders the RAW KEY on screen.
// Those are counted separately below, resolved against the same effective namespace as the
// two-arg path. Output is NOT truncated: a sample is not a population.
//
// Pass a directory as argv[2] to retarget the scan (used for the both-polarity fixtures).

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defectiveBindingFrom, resolveI18nBinding } from './lib/i18n-binding.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Retarget the scanned tree via a CLI arg (used for the both-polarity control fixtures).
const cliArg = process.argv[2]
const SRC = cliArg ? resolve(repoRoot, cliArg) : join(repoRoot, 'frontend/src')
const EN = join(repoRoot, 'frontend/src/i18n/en')

const bundles = {}
for (const f of readdirSync(EN).filter((f) => f.endsWith('.json'))) {
  bundles[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(EN, f), 'utf8'))
}
const has = (ns, path) => {
  const b = bundles[ns]
  if (!b) return false
  let cur = b
  for (const seg of path.split('.')) {
    if (cur == null || typeof cur !== 'object' || !(seg in cur)) return false
    cur = cur[seg]
  }
  return typeof cur === 'string' || typeof cur === 'object'
}

const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (e !== 'i18n' && e !== 'node_modules') walk(p, out)
    } else if (/\.tsx?$/.test(e)) out.push(p)
  }
  return out
}

const TWO_ARG = /\bt\(\s*'([^']+)'\s*,\s*'([^']*)'/g
// ONE_ARG: `t('key')` with NOTHING after the key — no default, no options object. A miss here
// renders the raw key. `\b` before `t` keeps `.split('…')` and friends out of the population.
const ONE_ARG = /\bt\(\s*'([^']+)'\s*\)/g
// The population is the BEHAVIOUR — "no string fallback, so a miss renders the raw key" — not the
// token that usually implements it. `t('key', { count: n })` has no string default either, so it
// belongs to the same class; a matcher keyed on the bare one-arg SHAPE is blind to 400+ of them.
// `defaultValue` inside the options object puts a site back in the silent-default class.
const OPTS_ARG = /\bt\(\s*'([^']+)'\s*,\s*\{/g
const HAS_DEFAULT_VALUE = /\bdefaultValue\s*:/
/** Text of the balanced `{…}` starting at `open`; '' when unbalanced. */
const braceBody = (src, open) => {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}' && --depth === 0) return src.slice(open, i + 1)
  }
  return ''
}

const isNonKey = (key) => /^\d{4}-\d{2}-\d{2}T/.test(key) || /^https?:/.test(key)

/** Splits a key into [explicit namespace, path] using the colon convention. */
const splitKey = (key) => {
  const colon = key.indexOf(':')
  return colon === -1 ? [undefined, key] : [key.slice(0, colon), key.slice(colon + 1)]
}

let total = 0
let oneArgTotal = 0
const naiveMissing = []
const nsAwareMissing = []
const oneArgMissing = []
const nonKeys = []
const bindingFiles = []

for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8')
  const binding = resolveI18nBinding(src)
  const defective = defectiveBindingFrom(binding)
  if (binding.calls.length > 0) {
    bindingFiles.push({
      file,
      shapes: binding.shapes,
      namespaces: binding.namespaces,
      defectiveNamespaces: defective.namespaces,
      arrayNamespacesDropped: defective.arrayNamespacesDropped,
      bareCallsUnrecognised: defective.bareCallsUnrecognised,
    })
  }
  for (const m of src.matchAll(TWO_ARG)) {
    const key = m[1]
    total++
    if (isNonKey(key)) {
      nonKeys.push({ file, key })
      continue
    }

    const [explicitNs, path] = splitKey(key)

    // naive: defaultNS only (what a check that ignores useTranslation would see)
    const naiveNs = explicitNs ?? 'common'
    if (!has(naiveNs, path)) naiveMissing.push({ file, key })

    // namespace-aware: try explicit ns, then every ns the file declares, then defaultNS
    const candidates = explicitNs ? [explicitNs] : [...new Set([...binding.namespaces, 'common'])]
    if (!candidates.some((c) => has(c, path))) nsAwareMissing.push({ file, key })
  }

  // The raw-key class: same namespace model, no default to hide behind.
  const rawKeySites = [...src.matchAll(ONE_ARG)].map((m) => ({ key: m[1], shape: 'one-arg' }))
  for (const m of src.matchAll(OPTS_ARG)) {
    if (HAS_DEFAULT_VALUE.test(braceBody(src, src.indexOf('{', m.index)))) continue
    rawKeySites.push({ key: m[1], shape: 'options-no-default' })
  }
  for (const { key, shape } of rawKeySites) {
    oneArgTotal++
    if (isNonKey(key)) continue
    const [explicitNs, path] = splitKey(key)
    const candidates = explicitNs ? [explicitNs] : [...new Set([...binding.namespaces, 'common'])]
    if (!candidates.some((c) => has(c, path))) oneArgMissing.push({ file, key, shape })
  }
}

const distinct = (arr) => new Set(arr.map((x) => x.key)).size
const pct = (n, d) => (d === 0 ? '0.0' : ((n / d) * 100).toFixed(1))

console.log(
  JSON.stringify(
    {
      scanned_root: SRC,
      total_two_arg_sites: total,
      total_one_arg_sites: oneArgTotal,
      non_key_literals: nonKeys.length,
      binding_model: {
        resolver: 'scripts/lib/i18n-binding.mjs',
        files_with_bindings: bindingFiles.length,
        array_binding_files: bindingFiles.filter((entry) => entry.shapes.array > 0).length,
        bare_binding_files: bindingFiles.filter((entry) => entry.shapes.bare > 0).length,
        array_namespaces_recovered: bindingFiles.reduce(
          (total, entry) => total + entry.arrayNamespacesDropped,
          0,
        ),
        bare_calls_recovered: bindingFiles.reduce(
          (total, entry) => total + entry.bareCallsUnrecognised,
          0,
        ),
      },
      naive_defaultNS_only: {
        sites: naiveMissing.length,
        distinct_keys: distinct(naiveMissing),
        pct: pct(naiveMissing.length, total),
      },
      namespace_aware: {
        sites: nsAwareMissing.length,
        distinct_keys: distinct(nsAwareMissing),
        pct: pct(nsAwareMissing.length, total),
      },
      one_arg_raw_key: {
        sites: oneArgMissing.length,
        distinct_keys: distinct(oneArgMissing),
        pct: pct(oneArgMissing.length, oneArgTotal),
        by_shape: {
          'one-arg': oneArgMissing.filter((x) => x.shape === 'one-arg').length,
          'options-no-default': oneArgMissing.filter((x) => x.shape === 'options-no-default')
            .length,
        },
      },
      // FULL lists — a truncated sample cannot support a per-class verdict (D-23).
      two_arg_missing: nsAwareMissing,
      one_arg_missing: oneArgMissing,
      non_keys: nonKeys,
    },
    null,
    2,
  ),
)
