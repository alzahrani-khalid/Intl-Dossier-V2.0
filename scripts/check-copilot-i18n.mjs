/* global console, process */
// Copilot i18n guard (Plan 72-01) — three checks over en/copilot.json + ar/copilot.json:
//
//   1. INDISTINGUISHABLE-EMPTY (carried P68/P71 lock): the substrings
//      `clearance` / `filtered` / `restricted` MUST NOT appear ANYWHERE — not in any
//      JSON key and not in any value (EN or AR). A lower-clearance caller must never
//      learn above-clearance content exists. (P71 GRAPH-03 tripped on a JSON key.)
//   2. EN/AR KEY PARITY: every leaf key path in EN exists in AR and vice-versa, so the
//      Arabic drawer never silently falls back to an English string.
//   3. NON-EMPTY VALUES: no empty-string leaves (an empty AR value renders blank).
//
// Dependency-free — only node: builtins. Exits 0 on pass, 1 (naming each offender) otherwise.
//
// Usage: node scripts/check-copilot-i18n.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EN_PATH = path.join(repoRoot, 'frontend', 'src', 'i18n', 'en', 'copilot.json')
const AR_PATH = path.join(repoRoot, 'frontend', 'src', 'i18n', 'ar', 'copilot.json')

// Carried lock: forbidden anywhere in a copilot-rendered payload (keys + values).
const FORBIDDEN = /clearance|filtered|restricted/i

function loadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (err) {
    console.error(`FAILED to parse ${path.relative(repoRoot, p)}: ${err.message}`)
    process.exit(1)
  }
}

/** Flatten to { 'a.b.c': value } leaf paths. */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const keyPath = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, keyPath, out)
    } else {
      out[keyPath] = v
    }
  }
  return out
}

function main() {
  const en = loadJson(EN_PATH)
  const ar = loadJson(AR_PATH)
  const enFlat = flatten(en)
  const arFlat = flatten(ar)
  const failures = []

  // --- 1. forbidden substring anywhere (keys + values, both files) ---
  for (const [label, flat] of [
    ['en', enFlat],
    ['ar', arFlat],
  ]) {
    for (const [keyPath, value] of Object.entries(flat)) {
      if (FORBIDDEN.test(keyPath)) {
        failures.push(`[${label}] forbidden substring in KEY: "${keyPath}"`)
      }
      if (typeof value === 'string' && FORBIDDEN.test(value)) {
        failures.push(`[${label}] forbidden substring in VALUE at "${keyPath}": "${value}"`)
      }
      // --- 3. non-empty values ---
      if (typeof value === 'string' && value.trim().length === 0) {
        failures.push(`[${label}] empty value at "${keyPath}" (would render blank)`)
      }
    }
  }

  // --- 2. EN/AR key parity ---
  const enKeys = new Set(Object.keys(enFlat))
  const arKeys = new Set(Object.keys(arFlat))
  for (const k of enKeys) {
    if (!arKeys.has(k)) failures.push(`key in EN but MISSING in AR: "${k}"`)
  }
  for (const k of arKeys) {
    if (!enKeys.has(k)) failures.push(`key in AR but MISSING in EN: "${k}"`)
  }

  if (failures.length > 0) {
    console.error(`copilot i18n check FAILED (${failures.length} issue(s)):`)
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
  }

  console.log(
    `copilot i18n check OK: ${enKeys.size} keys, EN/AR parity holds, no forbidden substring (clearance/filtered/restricted), no empty values.`,
  )
  process.exit(0)
}

main()
