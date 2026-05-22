#!/usr/bin/env node
/**
 * SessionStart hook — dynamic per-workspace orientation.
 * Walks the repo to find every CLAUDE.md-governed directory, maps
 * `git status --porcelain` files to their nearest governed area, prints
 * a short orientation block to stdout. Claude Code injects stdout into
 * the session context.
 */
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync } from 'node:child_process'

const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.pytest_cache',
  '__pycache__',
  '.venv',
  '.claude',
])

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
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

function workingTreeChanges(root) {
  try {
    const out = execFileSync('git', ['status', '--porcelain'], {
      cwd: root,
      encoding: 'utf-8',
      timeout: 5000,
    })
    return out
      .split('\n')
      .filter((line) => line.length > 3)
      .map((line) => line.slice(3).trim().replace(/\\/g, '/'))
  } catch {
    return []
  }
}

function recentCommits(root, limit = 5) {
  try {
    const out = execFileSync('git', ['log', `-${limit}`, '--pretty=format:%h %s'], {
      cwd: root,
      encoding: 'utf-8',
      timeout: 5000,
    })
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function activeAreas(root, paths) {
  const governed = claudeMdAreas(root)
  const found = new Set()
  for (const p of paths) {
    const a = areaOf(p, governed)
    if (a) found.add(a)
  }
  return [...found].sort()
}

export function buildOrientation(root = projectRoot()) {
  const lines = ['## Intl-Dossier — session orientation', '']
  const changes = workingTreeChanges(root)
  const areas = activeAreas(root, changes)

  if (areas.length > 0) {
    lines.push(`Active area(s) this session: **${areas.join(', ')}**.`)
    lines.push('Load the matching `CLAUDE.md` in each before editing.')
  } else {
    lines.push('Working tree is clean — no area has pending work.')
  }

  const commits = recentCommits(root)
  if (commits.length > 0) {
    lines.push('')
    lines.push('Recent commits (newest first):')
    for (const c of commits) lines.push(`- ${c}`)
  }

  lines.push('')
  lines.push('Use `CODEBASE_MAP.md` to find where a feature lives before exploring.')
  return lines.join('\n')
}

function main() {
  try {
    process.stdin.resume()
    process.stdin.on('data', () => {})
  } catch {}
  console.log(buildOrientation())
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
