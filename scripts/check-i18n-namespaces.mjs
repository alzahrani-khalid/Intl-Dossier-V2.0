/* global console, process */
// i18n namespace-registry guard (REMED-06).
//
// Walks every frontend/src/**/*.{ts,tsx} for `useTranslation('ns')` (string form)
// and `useTranslation(['ns1', 'ns2'])` (array form) and asserts each referenced
// namespace is registered in frontend/src/i18n/index.ts (the `resources.en` keys).
//
// Background: i18n is statically bundled in src/i18n/index.ts (no http-backend).
// An unregistered namespace silently falls back to English in BOTH languages —
// it looks fine in EN and silently breaks in AR. This guard catches that at lint
// time instead of at runtime. Dependency-free — only node: builtins.
//
// Usage:
//   node scripts/check-i18n-namespaces.mjs            (scans frontend/src)
//   node scripts/check-i18n-namespaces.mjs <dir>      (scans <dir> instead — used to
//                                                       prove a positive failure on a fixture)
//
// Exits 0 when every static namespace literal resolves to a registered namespace;
// exits 1 (naming each offender with file + line) otherwise. Dynamic references
// (template literals / variables) cannot be statically checked — they are counted
// and reported, never failed.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(scriptPath), '..')

const I18N_INDEX_PATH = path.join(repoRoot, 'frontend', 'src', 'i18n', 'index.ts')
const DEFAULT_SRC_ROOT = path.join(repoRoot, 'frontend', 'src')

// Allow retargeting the scanned tree via a CLI arg (used for the positive-failure fixture).
const cliArg = process.argv[2]
const srcRoot = cliArg ? path.resolve(repoRoot, cliArg) : DEFAULT_SRC_ROOT

// i18next default namespace — always registered (resources.en.translation), so a
// bare useTranslation() or useTranslation('translation') is never an offender.
const DEFAULT_NS = 'translation'

/**
 * Recursively collect every *.ts / *.tsx file under root (absolute paths).
 */
function walkSourceFiles(root, dir = root) {
  if (!fs.existsSync(root)) {
    return []
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // Skip build output and dependency trees.
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
        return []
      }
      return walkSourceFiles(root, absolute)
    }
    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      return [absolute]
    }
    return []
  })
}

/**
 * Parse the registered namespaces out of `frontend/src/i18n/index.ts`.
 *
 * The `resources` object holds an `en: { ... }` block whose first-level keys ARE
 * the registered namespaces (e.g. `translation`, `intake`, `'list-pages'`). We
 * brace-walk from `en: {` to its matching close, then collect 4-space-indented
 * keys (bare identifier or quoted string).
 */
function collectRegisteredNamespaces(source) {
  const marker = '  en: {'
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error(`Could not locate "en: {" resources block in ${I18N_INDEX_PATH}`)
  }

  let depth = 0
  let bodyStart = -1
  let bodyEnd = -1
  for (let i = markerIndex + marker.length - 1; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === '{') {
      if (depth === 0) {
        bodyStart = i + 1
      }
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        bodyEnd = i
        break
      }
    }
  }

  if (bodyStart === -1 || bodyEnd === -1) {
    throw new Error(`Could not balance braces for the "en" resources block in ${I18N_INDEX_PATH}`)
  }

  const body = source.slice(bodyStart, bodyEnd)
  const namespaces = new Set()
  // First-level keys only: exactly 4 leading spaces then a key (quoted or bare) + colon.
  const keyRegex = /^ {4}(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w-]*))\s*:/gm
  let match
  while ((match = keyRegex.exec(body)) !== null) {
    namespaces.add(match[1] ?? match[2] ?? match[3])
  }
  return namespaces
}

/**
 * Compute 1-based line number for a character offset within a source string.
 */
function lineAt(source, index) {
  let line = 1
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') {
      line += 1
    }
  }
  return line
}

function main() {
  const registered = collectRegisteredNamespaces(fs.readFileSync(I18N_INDEX_PATH, 'utf8'))

  const files = walkSourceFiles(srcRoot)
  const failures = []
  let literalsChecked = 0
  let dynamicSkipped = 0

  // String form: useTranslation('ns') or useTranslation('ns', { ... }).
  const stringRegex = /useTranslation\(\s*['"]([^'"]+)['"]/g
  // Array form: useTranslation(['ns1', 'ns2']).
  const arrayRegex = /useTranslation\(\s*\[([^\]]+)\]/g
  // Dynamic form: useTranslation(varName) or useTranslation(`tpl`) — cannot verify.
  const dynamicRegex = /useTranslation\(\s*[`A-Za-z_$]/g

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    const relFile = path.relative(repoRoot, file)

    stringRegex.lastIndex = 0
    let match
    while ((match = stringRegex.exec(content)) !== null) {
      const ns = match[1]
      literalsChecked += 1
      if (ns === DEFAULT_NS || registered.has(ns)) {
        continue
      }
      failures.push({ file: relFile, line: lineAt(content, match.index), ns })
    }

    arrayRegex.lastIndex = 0
    while ((match = arrayRegex.exec(content)) !== null) {
      const inner = match[1]
      const line = lineAt(content, match.index)
      for (const rawEntry of inner.split(',')) {
        const entry = rawEntry.trim()
        // Only string-literal entries can be statically checked; skip variables.
        const literal = entry.match(/^['"]([^'"]+)['"]$/)
        if (!literal) {
          if (entry.length > 0) {
            dynamicSkipped += 1
          }
          continue
        }
        const ns = literal[1]
        literalsChecked += 1
        if (ns === DEFAULT_NS || registered.has(ns)) {
          continue
        }
        failures.push({ file: relFile, line, ns })
      }
    }

    dynamicRegex.lastIndex = 0
    while ((match = dynamicRegex.exec(content)) !== null) {
      dynamicSkipped += 1
    }
  }

  if (failures.length > 0) {
    console.error(
      `i18n namespace check FAILED: ${failures.length} useTranslation reference(s) target a namespace not registered in ${path.relative(
        repoRoot,
        I18N_INDEX_PATH,
      )}:`,
    )
    for (const failure of failures) {
      console.error(`  ${failure.file}:${failure.line}: useTranslation('${failure.ns}') — unregistered namespace`)
    }
    console.error('')
    console.error(
      'Fix: register the namespace in frontend/src/i18n/index.ts (import the en/ar JSON and add it to resources.en + resources.ar). Unregistered namespaces silently fall back to English in BOTH languages.',
    )
    process.exit(1)
  }

  console.log(
    `i18n namespace check OK: ${files.length} file(s) scanned, ${literalsChecked} static namespace literal(s) checked against ${registered.size} registered namespaces, ${dynamicSkipped} dynamic reference(s) skipped.`,
  )
  process.exit(0)
}

main()
