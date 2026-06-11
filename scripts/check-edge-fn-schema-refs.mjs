/* global console, process */
// Edge-fn schema-reference smoke test.
//
// Parses every supabase/functions/**/*.ts for `.from('X')` / `.rpc('Y')` string
// literals and asserts each X is a Tables/Views key and each Y is a Functions key
// in frontend/src/types/database.types.ts (the generated, source-of-truth types).
//
// This stands guard against the schema/type drift closed by phase 60: an edge
// function reading a table/view/function that no longer exists in the generated
// types. Dependency-free — only node: builtins.
//
// Usage:
//   node scripts/check-edge-fn-schema-refs.mjs            (scans the real tree)
//   node scripts/check-edge-fn-schema-refs.mjs <dir>      (scans <dir> instead — used by the positive-failure CI step against the bad fixture)
//
// Exits 0 when every static literal resolves to a known type; exits 1 (naming
// each offender) otherwise. Dynamic references (template literals / variables)
// cannot be statically checked — they are counted and reported, never failed.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(scriptPath), '..')

const TYPES_PATH = path.join(repoRoot, 'frontend', 'src', 'types', 'database.types.ts')
const ALLOWLIST_PATH = path.join(repoRoot, 'scripts', 'edge-fn-schema-refs-allowlist.json')
const DEFAULT_FUNCTIONS_ROOT = path.join(repoRoot, 'supabase', 'functions')

// Allow retargeting the scanned tree via a CLI arg (used for the positive-failure fixture).
const cliArg = process.argv[2]
const functionsRoot = cliArg ? path.resolve(repoRoot, cliArg) : DEFAULT_FUNCTIONS_ROOT

// /\.(from|rpc)\(\s*['"]([a-zA-Z_]\w*)['"]/g — group 1 = from|rpc, group 2 = the name.
const REF_REGEX = /\.(from|rpc)\(\s*['"]([a-zA-Z_]\w*)['"]/g

/**
 * Recursively collect every *.ts file under root (absolute paths).
 */
function walkTsFiles(root, dir = root) {
  if (!fs.existsSync(root)) {
    return []
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return walkTsFiles(root, absolute)
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      return [absolute]
    }
    return []
  })
}

/**
 * Slice the body of a top-level public-schema block (Tables/Views/Functions) and
 * return the set of its first-level keys. The generated file indents the block
 * header at 4 spaces (`    Tables: {`) and its direct keys at 6 spaces
 * (`      <name>: {`). We slice from the header's open brace to its matching
 * close brace (brace-depth walk), then collect the 6-space-indented keys.
 */
function collectBlockKeys(source, blockName) {
  const marker = `    ${blockName}: {`
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error(`Could not locate "${blockName}: {" block in ${TYPES_PATH}`)
  }

  // Walk braces from the block's opening `{` to its matching close.
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
    throw new Error(`Could not balance braces for "${blockName}" block in ${TYPES_PATH}`)
  }

  const body = source.slice(bodyStart, bodyEnd)
  const keys = new Set()
  // First-level keys only: exactly 6 leading spaces then `<identifier>: {`.
  const keyRegex = /^ {6}([A-Za-z_]\w*):\s*\{/gm
  let match
  while ((match = keyRegex.exec(body)) !== null) {
    keys.add(match[1])
  }
  return keys
}

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH)) {
    return { tables: new Set(), functions: new Set() }
  }
  const raw = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'))
  const toNameSet = (entries) =>
    new Set((entries ?? []).map((entry) => (typeof entry === 'string' ? entry : entry.name)))
  return {
    tables: toNameSet(raw.tables),
    functions: toNameSet(raw.functions),
  }
}

function main() {
  const typesSource = fs.readFileSync(TYPES_PATH, 'utf8')
  const tableKeys = collectBlockKeys(typesSource, 'Tables')
  const viewKeys = collectBlockKeys(typesSource, 'Views')
  const functionKeys = collectBlockKeys(typesSource, 'Functions')
  const tableOrViewKeys = new Set([...tableKeys, ...viewKeys])

  const allowlist = loadAllowlist()

  const files = walkTsFiles(functionsRoot)
  const failures = []
  let literalsChecked = 0

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    REF_REGEX.lastIndex = 0
    let match
    while ((match = REF_REGEX.exec(content)) !== null) {
      const kind = match[1] // from | rpc
      const name = match[2]

      // Skip Storage bucket references — `supabase.storage.from('bucket')` is a
      // bucket handle, not a table query, so it must not be schema-checked. The
      // `.storage` accessor may sit on the previous line, so normalize whitespace
      // out of the preceding window before testing.
      if (kind === 'from') {
        const preceding = content
          .slice(Math.max(0, match.index - 40), match.index)
          .replace(/\s+/g, '')
        if (preceding.endsWith('.storage')) {
          continue
        }
      }

      literalsChecked += 1

      const relFile = path.relative(repoRoot, file)
      if (kind === 'from') {
        if (tableOrViewKeys.has(name) || allowlist.tables.has(name)) {
          continue
        }
        failures.push({ file: relFile, kind: 'table/view', name })
      } else {
        if (functionKeys.has(name) || allowlist.functions.has(name)) {
          continue
        }
        failures.push({ file: relFile, kind: 'function', name })
      }
    }
  }

  // Dynamic references — `.from(`...`)` or `.from(varName)` — can't be statically
  // verified. Count them for transparency; never fail on them.
  let dynamicSkipped = 0
  const dynamicRegex = /\.(from|rpc)\(\s*[`a-zA-Z_$]/g
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    dynamicRegex.lastIndex = 0
    let m
    while ((m = dynamicRegex.exec(content)) !== null) {
      // A trailing quote means it was a static literal already counted above.
      const nextChar = content[dynamicRegex.lastIndex - 1]
      if (nextChar === '`' || /[a-zA-Z_$]/.test(nextChar)) {
        dynamicSkipped += 1
      }
    }
  }

  if (failures.length > 0) {
    console.error(
      `edge-fn schema-ref check FAILED: ${failures.length} unknown reference(s) not present in ${path.relative(
        repoRoot,
        TYPES_PATH,
      )} (and not allowlisted):`,
    )
    for (const failure of failures) {
      console.error(`  ${failure.file}: .${failure.kind === 'function' ? 'rpc' : 'from'}('${failure.name}') — unknown ${failure.kind}`)
    }
    console.error('')
    console.error(
      'Fix: regenerate database.types.ts (the object truly exists) OR add the name to scripts/edge-fn-schema-refs-allowlist.json with a documented reason + backlog ref.',
    )
    process.exit(1)
  }

  console.log(
    `edge-fn schema-ref check OK: ${files.length} file(s) scanned, ${literalsChecked} from/rpc literal(s) checked, ${dynamicSkipped} dynamic reference(s) skipped.`,
  )
  process.exit(0)
}

main()
