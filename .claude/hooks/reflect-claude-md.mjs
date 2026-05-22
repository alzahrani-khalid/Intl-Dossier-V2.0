#!/usr/bin/env node
/**
 * Reflector — the reasoning half of the self-improving Stop hook.
 * Reads scoped diff + touched-area CLAUDE.mds, asks headless `claude -p` to
 * judge whether the conventions still hold, writes proposal to
 * .claude/claude-md-review.md. Deterministic fallback if `claude` is missing
 * or fails. Recursion guard via INTL_DOSSIER_REFLECT_LOCK.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '__pycache__',
  '.venv',
  '.claude',
])
const LOCK_ENV = 'INTL_DOSSIER_REFLECT_LOCK'
const REVIEW_FILE = '.claude/claude-md-review.md'
const MAX_DIFF_CHARS = 12_000
const CLAUDE_TIMEOUT_MS = 180_000

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

function gitSafe(args, root) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf-8', timeout: 10_000 })
  } catch {
    return ''
  }
}

function claudeMdAreas(root) {
  const areas = new Set()
  function walk(dir) {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    if (entries.some((e) => e.name === 'CLAUDE.md' && e.isFile()) && dir !== root) {
      areas.add(relative(root, dir).split(/[\\/]/).join('/'))
    }
    for (const e of entries) {
      if (e.isDirectory() && !EXCLUDE_DIRS.has(e.name)) walk(join(dir, e.name))
    }
  }
  walk(root)
  return areas
}

function areaOf(changed, areas) {
  const parts = changed.split('/')
  for (let depth = parts.length - 1; depth > 0; depth--) {
    const c = parts.slice(0, depth).join('/')
    if (areas.has(c)) return c
  }
  return null
}

function touchedAreas(root) {
  const governed = claudeMdAreas(root)
  const counts = {}
  for (const line of gitSafe(['status', '--porcelain'], root).split('\n')) {
    if (line.length <= 3) continue
    const path = line.slice(3).trim().replace(/\\/g, '/')
    const a = areaOf(path, governed)
    if (a) counts[a] = (counts[a] || 0) + 1
  }
  return counts
}

function buildPrompt(root, areas, diff) {
  const blocks = []
  for (const area of Object.keys(areas).sort()) {
    const claudeMd = join(root, area, 'CLAUDE.md')
    let content
    try {
      content = readFileSync(claudeMd, 'utf-8')
    } catch {
      content = '(this area has no CLAUDE.md yet)'
    }
    blocks.push(`### ${area}/CLAUDE.md\n\n${content}`)
  }
  return [
    "You are auditing whether a codebase's CLAUDE.md files still match reality",
    'after a coding session. CLAUDE.md is the instruction file an AI coding agent',
    'loads for that part of the repo.',
    '',
    "Below is the git diff of the session's uncommitted changes, then the current",
    'CLAUDE.md for every area that changed.',
    '',
    'For EACH area, output exactly one of:',
    '- `No change needed` — the CLAUDE.md still holds; or',
    '- a concrete proposed edit: the specific line(s) to add, change, or remove,',
    '  plus one sentence on why.',
    '',
    'Only propose an update when the diff introduces a genuine new convention,',
    'gotcha, command, or constraint that the CLAUDE.md does not yet capture. Do',
    'not propose stylistic rewrites. Be terse. Respond in plain text; do not use',
    'tools.',
    '',
    '## Git diff (uncommitted work this session)',
    '',
    '```diff',
    diff,
    '```',
    '',
    '## Current CLAUDE.md file(s)',
    '',
    blocks.join('\n\n'),
  ].join('\n')
}

function runClaude(prompt, root) {
  let claudePath
  try {
    claudePath = execFileSync('which', ['claude'], { encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
  if (!claudePath) return null

  const env = { ...process.env, [LOCK_ENV]: '1' }
  const result = spawnSync(claudePath, ['-p', '--output-format', 'text'], {
    cwd: root,
    input: prompt,
    encoding: 'utf-8',
    env,
    timeout: CLAUDE_TIMEOUT_MS,
  })
  if (result.error || result.status !== 0) return null
  const out = (result.stdout || '').trim()
  return out || null
}

function deterministicNote(root, areas, stamp) {
  const lines = [
    `# CLAUDE.md review — ${stamp}`,
    '',
    '_`claude` CLI unavailable — deterministic fallback. The areas below changed this session; re-check their CLAUDE.md by hand._',
    '',
  ]
  for (const area of Object.keys(areas).sort()) {
    const claudeMd = join(root, area, 'CLAUDE.md')
    let exists = false
    try {
      statSync(claudeMd)
      exists = true
    } catch {}
    if (exists) {
      lines.push(
        `- **${area}** (${areas[area]} file(s)) — re-read \`${area}/CLAUDE.md\`: do its conventions still hold?`,
      )
    } else {
      lines.push(
        `- **${area}** (${areas[area]} file(s)) — no \`${area}/CLAUDE.md\` exists; consider adding one.`,
      )
    }
  }
  return lines.join('\n') + '\n'
}

function reflect() {
  if (process.env[LOCK_ENV]) return 0

  const root = projectRoot()
  const areas = touchedAreas(root)
  if (Object.keys(areas).length === 0) return 0

  let diff = gitSafe(['diff', 'HEAD', '--', ...Object.keys(areas).sort()], root)
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + '\n... (diff truncated for the reflection)'
  }
  if (!diff.trim()) return 0

  const stamp = new Date().toISOString().slice(0, 19)
  const reflection = runClaude(buildPrompt(root, areas, diff), root)

  let body, mode
  if (reflection) {
    body =
      `# CLAUDE.md review — ${stamp}\n\n` +
      `_Reflection by \`claude -p\` over ${Object.keys(areas).length} touched area(s): ` +
      `${Object.keys(areas).sort().join(', ')}._\n\n` +
      `${reflection}\n`
    mode = 'LLM reflection'
  } else {
    body = deterministicNote(root, areas, stamp)
    mode = 'deterministic fallback'
  }

  const reviewPath = join(root, REVIEW_FILE)
  try {
    mkdirSync(join(root, '.claude'), { recursive: true })
    writeFileSync(reviewPath, body, 'utf-8')
  } catch (err) {
    process.stderr.write(`[reflector] could not write ${REVIEW_FILE}: ${err.message}\n`)
    return 1
  }
  process.stderr.write(`[reflector] wrote ${REVIEW_FILE} (${mode})\n`)
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(reflect())
}

export { reflect, touchedAreas, claudeMdAreas, buildPrompt }
