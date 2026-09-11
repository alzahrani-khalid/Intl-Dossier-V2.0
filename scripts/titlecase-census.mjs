#!/usr/bin/env node
// Title-case census over frontend/src/i18n/{en,ar}. Usage: node titlecase-census.mjs [--controls] [--carveouts <file>] [ns ...]
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const controls = args.includes('--controls')
const ci = args.indexOf('--carveouts')
const carveFile = ci >= 0 ? args[ci + 1] : null
const nsArgs = args.filter((a, i) => !a.startsWith('--') && i !== ci + 1)
const root = 'frontend/src/i18n'

// candidate = >=2 judged words after stripping {{...}}; ALL-CAPS tokens <=4 chars are not judged; every judged word ^[A-Z][a-z]
export const isCandidate = (s) => {
  if (typeof s !== 'string') return false
  const words = s.replace(/\{\{[^}]*\}\}/g, ' ').split(/\s+/).filter(Boolean)
  if (words.length < 2) return false
  const judged = words.filter((w) => !(/^[A-Z0-9]{1,4}$/.test(w)))
  if (judged.length < 2) return false
  return judged.every((w) => /^[A-Z][a-z]/.test(w))
}

const leaves = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'object' && v !== null
    ? leaves(v, p ? `${p}.${k}` : k)
    : [[p ? `${p}.${k}` : k, v]],
)

if (controls) {
  const C = {
    'Add Elected Official': true,
    'Add elected official': false,
    'SLA Breach': false,
    'Sign in': false,
  }
  let ok = true
  for (const [s, e] of Object.entries(C)) {
    const g = isCandidate(s)
    if (g !== e) ok = false
    console.log(`CONTROL '${s}'=${g} expected ${e}`)
  }
  if (!ok) {
    console.log('CONTROLS FAILED')
    process.exit(1)
  }
}

const carve = new Map()
if (carveFile) {
  for (const line of readFileSync(carveFile, 'utf8').split('\n')) {
    const m = line.match(/^\|\s*([a-z0-9-]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/)
    if (m && m[1] !== 'namespace') carve.set(`${m[1]}:${m[2]}`, m[3])
  }
}

const files = readdirSync(join(root, 'en')).filter((f) => f.endsWith('.json'))
let total = 0
let cand = 0
const perNs = []
for (const f of files) {
  const ns = f.replace(/\.json$/, '')
  if (nsArgs.length && !nsArgs.includes(ns)) continue
  const en = leaves(JSON.parse(readFileSync(join(root, 'en', f), 'utf8')))
  let ar = []
  try {
    ar = leaves(JSON.parse(readFileSync(join(root, 'ar', f), 'utf8')))
  } catch {}
  const arKeys = new Set(ar.map(([k]) => k))
  const c = en.filter(([, v]) => isCandidate(v))
  const mirrored = c.filter(([k]) => arKeys.has(k)).length
  const enKeys = new Set(en.map(([k]) => k))
  const arMissing = [...enKeys].filter((k) => !arKeys.has(k)).length
  const arExtra = [...arKeys].filter((k) => !enKeys.has(k)).length
  const carved = c.filter(([k]) => carve.has(`${ns}:${k}`)).length
  const carveRows = [...carve.keys()].filter((k) => k.startsWith(`${ns}:`)).length
  const candKeys = new Set(c.map(([k]) => `${ns}:${k}`))
  const nonCandidate = [...carve.keys()].filter((k) => k.startsWith(`${ns}:`) && !candKeys.has(k))
  total += en.length
  cand += c.length
  perNs.push({ ns, strings: en.length, candidates: c.length, mirrored, carved, arMissing, arExtra, carveRows, nonCandidate })
}

perNs.sort((a, b) => b.candidates - a.candidates)
for (const r of perNs) {
  console.log(`NS ${r.ns} strings=${r.strings} candidates=${r.candidates} ar_mirror=${r.mirrored} carved=${r.carved} ar_missing_keys=${r.arMissing} ar_extra_keys=${r.arExtra} carve_rows=${r.carveRows}`)
}
if (carveFile) {
  for (const r of perNs) {
    for (const k of r.nonCandidate) console.log(`CARVE-NONCANDIDATE ${k}`)
  }
}
console.log(`EN_FILES=${files.length} EN_STRINGS=${total} TITLECASE_CANDIDATES=${cand} PCT=${total ? (100 * cand / total).toFixed(1) : 0}`)
