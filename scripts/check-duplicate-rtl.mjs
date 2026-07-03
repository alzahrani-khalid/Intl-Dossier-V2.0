/* global console, process */
// Duplicate-rtl utility guard (SRTL-03).
//
// Walks a source tree and fails the build when any single className string
// literal contains the SAME `rtl:*` utility token twice — the signature of
// shadcn's non-idempotent `migrate rtl` transform (upstream #9891). A second
// `migrate rtl` run appends duplicate `rtl:*` variants, making the cascade
// order-dependent; this check makes that recurrence build-breaking.
//
// Detection is per string LITERAL, not per line: two DIFFERENT `rtl:` tokens in
// one string are legal and already ship (frontend/src/components/ui/sheet.tsx
// carries paired `rtl:` slide variants per side). Only an EXACT duplicate token
// within one literal is a violation, so the legitimate paired-variant pattern
// passes.
//
// The script is read-only: it only reads files under the given root. It spawns
// no subprocess and performs no dynamic code execution. Dependency-free — only
// node: builtins.
//
// Usage:
//   node scripts/check-duplicate-rtl.mjs              (scans frontend/src)
//   node scripts/check-duplicate-rtl.mjs <dir>        (scans <dir> instead — used
//                                                      by the positive-failure CI
//                                                      step against the bad fixture)
//
// Exits 0 when no literal contains a duplicated `rtl:` token; exits 1 (naming
// each offender with file + line + token) otherwise.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(scriptPath), '..')

const DEFAULT_SRC_ROOT = path.join(repoRoot, 'frontend', 'src')

// Allow retargeting the scanned tree via a CLI arg (used for the positive-failure fixture).
const cliArg = process.argv[2]
const srcRoot = cliArg ? path.resolve(repoRoot, cliArg) : DEFAULT_SRC_ROOT

// Extensions worth scanning for className string literals.
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
// Directories that never hold hand-authored source.
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage'])

// Matches a single-, double-, or backtick-quoted string literal, honoring escapes
// and never crossing the closing quote (RESEARCH Pattern 6 tokenizer).
const STRING_RE = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g

/**
 * Recursively collect every scannable file under root (absolute paths).
 */
function walkSourceFiles(root, dir = root) {
  if (!fs.existsSync(root)) {
    return []
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        return []
      }
      return walkSourceFiles(root, absolute)
    }
    if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      return [absolute]
    }
    return []
  })
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

/**
 * Find every `rtl:` token that appears 2+ times within a single string literal.
 * Returns { token, line } records — one per duplicate occurrence.
 */
function duplicatedRtlTokens(source) {
  const hits = []
  STRING_RE.lastIndex = 0
  let match
  while ((match = STRING_RE.exec(source)) !== null) {
    const literal = match[2]
    const tokens = literal.split(/\s+/).filter((token) => token.startsWith('rtl:'))
    const seen = new Set()
    for (const token of tokens) {
      if (seen.has(token)) {
        hits.push({ token, line: lineAt(source, match.index) })
      }
      seen.add(token)
    }
  }
  return hits
}

function main() {
  const files = walkSourceFiles(srcRoot)
  const failures = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    const relFile = path.relative(repoRoot, file)
    for (const hit of duplicatedRtlTokens(content)) {
      failures.push({ file: relFile, line: hit.line, token: hit.token })
    }
  }

  if (failures.length > 0) {
    console.error(
      `duplicate-rtl check FAILED: ${failures.length} className literal(s) contain a duplicated rtl: utility (shadcn migrate rtl #9891 signature):`,
    )
    for (const failure of failures) {
      console.error(`  ${failure.file}:${failure.line}: duplicated rtl token "${failure.token}"`)
    }
    console.error('')
    console.error(
      'Fix: remove the duplicated rtl: utility. This is usually a second `shadcn migrate rtl` run — never re-run it; set "rtl": true in components.json for future installs instead.',
    )
    process.exit(1)
  }

  console.log(
    `duplicate-rtl check OK: ${files.length} file(s) scanned under ${path.relative(repoRoot, srcRoot) || '.'}, no duplicated rtl: utility tokens.`,
  )
  process.exit(0)
}

main()
