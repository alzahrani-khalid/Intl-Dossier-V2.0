#!/usr/bin/env node
/**
 * Stop hook trigger — cheap, deterministic half of the self-improving AI Layer.
 * Detects which CLAUDE.md-governed areas changed, dedupes via SHA-256 fingerprint
 * of the scoped diff, spawns the reflector in the background, returns immediately.
 * Guards: recursion (INTL_DOSSIER_REFLECT_LOCK=1), dedup (.claude/.claude-md-review-state),
 * spawn failure (logs + exit 0).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'

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
const STATE_FILE = '.claude/.claude-md-review-state'
const REFLECTOR = 'reflect-claude-md.mjs'

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

function gitSafe(args, root) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf-8', timeout: 5000 })
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
  const touched = new Set()
  for (const line of gitSafe(['status', '--porcelain'], root).split('\n')) {
    if (line.length <= 3) continue
    const path = line.slice(3).trim().replace(/\\/g, '/')
    const a = areaOf(path, governed)
    if (a) touched.add(a)
  }
  return touched
}

function diffFingerprint(root, areas) {
  const raw = gitSafe(['diff', 'HEAD', '--', ...[...areas].sort()], root)
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

function spawnReflector(reflectorPath, root) {
  try {
    const child = spawn(process.execPath, [reflectorPath], {
      cwd: root,
      detached: true,
      stdio: 'ignore',
      env: process.env,
    })
    child.unref()
    return true
  } catch (err) {
    process.stderr.write(`[self-improving hook] could not start reflector: ${err.message}\n`)
    return false
  }
}

function main() {
  try {
    process.stdin.resume()
    process.stdin.on('data', () => {})
  } catch {}

  if (process.env[LOCK_ENV]) return 0

  const root = projectRoot()
  const areas = touchedAreas(root)
  if (areas.size === 0) return 0

  const fp = diffFingerprint(root, areas)
  const statePath = join(root, STATE_FILE)
  try {
    const prev = readFileSync(statePath, 'utf-8').trim()
    if (prev === fp) return 0
  } catch {
    /* no prior state */
  }

  const reflectorPath = join(root, '.claude/hooks', REFLECTOR)
  try {
    statSync(reflectorPath)
  } catch {
    process.stderr.write(`[self-improving hook] ${REFLECTOR} missing — skipped\n`)
    return 0
  }

  if (!spawnReflector(reflectorPath, root)) return 0

  try {
    mkdirSync(join(root, '.claude'), { recursive: true })
    writeFileSync(statePath, fp, 'utf-8')
  } catch {
    /* best-effort */
  }

  process.stderr.write(
    `[self-improving hook] ${areas.size} area(s) changed ` +
      `(${[...areas].sort().join(', ')}) — reflecting in background → .claude/claude-md-review.md\n`,
  )
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main())
}

export { touchedAreas, diffFingerprint, claudeMdAreas }
