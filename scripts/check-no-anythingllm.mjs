/* global console, process */
// Static "no-AnythingLLM on the critical surfaces" guard (EVAL-04 / D6).
//
// Phase 74 fully decommissions AnythingLLM (D3). This CI-native check stands
// guard against a source-level reintroduction on the THREE critical AI surfaces:
//   1. semantic search  — the edge fns re-pointed to TEI bge-m3 in 74-03
//   2. dashboard digest  — frontend/src/hooks/useDashboardDigest.ts
//   3. assistant/copilot — frontend/src/components/copilot/{useCopilotRuntime,CopilotSurface}
//
// It greps each surface for the case-insensitive token `anythingllm` (in
// imports, URLs, env names, or identifiers) and FAILS (exit 1, naming the
// offending file:line) if any appears. Dependency-free — only node: builtins.
//
// This is the CI side of EVAL-04: it runs as a required check now (no GPU/LLM),
// and a planted bad fixture proves it fails on a regression (the positive-failure
// precedent from ci.yml — `! node scripts/check-edge-fn-schema-refs.mjs <fixture>`).
//
// Usage:
//   node scripts/check-no-anythingllm.mjs            (scans the real critical surfaces)
//   node scripts/check-no-anythingllm.mjs <path>     (scans <path> instead — a dir or a
//                                                      file; used by the positive-failure
//                                                      CI step against the bad fixture)
//
// Exits 0 when no surface contains the token; exits 1 (naming each offender)
// otherwise.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(scriptPath), '..')

// The forbidden token. Case-insensitive so `ANYTHINGLLM_API_URL`, `anythingllm:3001`,
// `AnythingLLM`, etc. are all caught. `\banythingllm\b` would miss `anythingllm:3001`
// (the `:` is a word boundary so that is fine) but URLs like `anythingllm/` end on a
// non-word char too — a plain substring match is the safest net for a forbidden token.
const FORBIDDEN = /anythingllm/i

// The exact critical-surface file list (relative to repo root). Per the success
// criterion these are the three surfaces (semantic search edge fns + digest hook +
// copilot runtime/surface). After 74-02 (FE ChatDock removal) and 74-03 (edge-fn
// re-point to TEI) every one of these is AnythingLLM-free.
const CRITICAL_SURFACES = [
  'frontend/src/hooks/useDashboardDigest.ts',
  'frontend/src/components/copilot/useCopilotRuntime.ts',
  'frontend/src/components/copilot/CopilotSurface.tsx',
  'supabase/functions/search-semantic/index.ts',
  'supabase/functions/semantic-search-unified/index.ts',
  'supabase/functions/position-suggestions-get/index.ts',
]

/**
 * Recursively collect every *.ts / *.tsx file under a directory (absolute paths).
 * Skips node_modules so a fixture dir with deps can't blow up the scan.
 */
function walkSourceFiles(root, dir = root) {
  if (!fs.existsSync(dir)) {
    return []
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') {
      return []
    }
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return walkSourceFiles(root, absolute)
    }
    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      return [absolute]
    }
    return []
  })
}

/**
 * Resolve the set of files to scan. With no CLI arg, scan the real critical
 * surfaces. With an arg, scan that path (a single file is scanned directly; a
 * directory is walked for *.ts / *.tsx) — this is how CI points the check at the
 * positive-failure fixture.
 */
function resolveTargetFiles() {
  const cliArg = process.argv[2]
  if (!cliArg) {
    return CRITICAL_SURFACES.map((rel) => path.join(repoRoot, rel))
  }

  const target = path.resolve(repoRoot, cliArg)
  if (!fs.existsSync(target)) {
    console.error(`check-no-anythingllm: path not found: ${cliArg}`)
    process.exit(1)
  }
  const stat = fs.statSync(target)
  return stat.isDirectory() ? walkSourceFiles(target) : [target]
}

/**
 * Scan one file; return an array of { file, line, text } for every line that
 * contains the forbidden token.
 */
function findOffenses(absoluteFile) {
  // A missing critical-surface file is itself a failure — the guard must scan a
  // known surface, not silently pass because a file was renamed/moved away.
  if (!fs.existsSync(absoluteFile)) {
    return [
      {
        file: path.relative(repoRoot, absoluteFile),
        line: 0,
        text: '(expected critical-surface file is missing — guard cannot verify it)',
      },
    ]
  }

  const content = fs.readFileSync(absoluteFile, 'utf8')
  const offenses = []
  content.split('\n').forEach((lineText, index) => {
    if (FORBIDDEN.test(lineText)) {
      offenses.push({
        file: path.relative(repoRoot, absoluteFile),
        line: index + 1,
        text: lineText.trim(),
      })
    }
  })
  return offenses
}

function main() {
  const files = resolveTargetFiles()
  const offenses = files.flatMap(findOffenses)

  if (offenses.length > 0) {
    console.error(
      `no-AnythingLLM check FAILED: ${offenses.length} forbidden \`anythingllm\` reference(s) on the critical surfaces:`,
    )
    for (const offense of offenses) {
      console.error(`  ${offense.file}:${offense.line}: ${offense.text}`)
    }
    console.error('')
    console.error(
      'AnythingLLM was decommissioned in Phase 74 (D3). Re-point this surface at the on-prem ' +
        'stack (TEI bge-m3 / agent-runtime via getCopilotModel) instead of AnythingLLM.',
    )
    process.exit(1)
  }

  console.log(
    `no-AnythingLLM check OK: ${files.length} critical-surface file(s) scanned, zero \`anythingllm\` references.`,
  )
  process.exit(0)
}

main()
