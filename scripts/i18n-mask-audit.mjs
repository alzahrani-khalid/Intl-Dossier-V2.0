#!/usr/bin/env node
// How many `t('key', 'English default')` sites reference a key that does NOT resolve in the EN
// locale? Those render today ONLY because of the default, so dropping defaults naively turns them
// into raw key strings in BOTH locales.
//
// Models what the naive check cannot: the per-file default namespace from useTranslation('ns'),
// and colon-form explicit namespaces. Reports naive and namespace-aware counts separately.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'frontend/src'
const EN = 'frontend/src/i18n/en'

const bundles = {}
for (const f of readdirSync(EN).filter((f) => f.endsWith('.json'))) {
  bundles[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(EN, f), 'utf8'))
}
const DEFAULT_NS = 'common' // per src/i18n/index.ts

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
    if (st.isDirectory()) { if (e !== 'i18n' && e !== 'node_modules') walk(p, out) }
    else if (/\.tsx?$/.test(e)) out.push(p)
  }
  return out
}

const TWO_ARG = /\bt\(\s*'([^']+)'\s*,\s*'([^']*)'/g
const USE_NS = /useTranslation\(\s*(?:\[\s*)?'([^']+)'/g

let total = 0
const naiveMissing = []
const nsAwareMissing = []
const nonKeys = []

for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8')
  const fileNs = [...src.matchAll(USE_NS)].map((m) => m[1])
  for (const m of src.matchAll(TWO_ARG)) {
    const key = m[1]
    total++
    if (/^\d{4}-\d{2}-\d{2}T/.test(key) || /^https?:/.test(key)) { nonKeys.push({ file, key }); continue }

    let ns, path
    if (key.includes(':')) { [ns, path] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)] }
    else { ns = DEFAULT_NS; path = key }

    // naive: defaultNS only (what a check that ignores useTranslation would see)
    if (!has(ns, path)) naiveMissing.push({ file, key })

    // namespace-aware: try explicit ns, then every ns the file declares, then defaultNS
    const candidates = key.includes(':') ? [ns] : [...fileNs, DEFAULT_NS]
    if (!candidates.some((c) => has(c, path))) nsAwareMissing.push({ file, key })
  }
}

const distinct = (arr) => new Set(arr.map((x) => x.key)).size
const pct = (n) => ((n / total) * 100).toFixed(1)

console.log(JSON.stringify({
  total_two_arg_sites: total,
  non_key_literals: nonKeys.length,
  naive_defaultNS_only: { sites: naiveMissing.length, distinct_keys: distinct(naiveMissing), pct: pct(naiveMissing.length) },
  namespace_aware: { sites: nsAwareMissing.length, distinct_keys: distinct(nsAwareMissing), pct: pct(nsAwareMissing.length) },
  sample_missing: nsAwareMissing.slice(0, 8),
  sample_non_keys: nonKeys.slice(0, 3),
}, null, 2))
