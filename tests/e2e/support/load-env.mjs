import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import dotenv from 'dotenv'

/**
 * Resolve `.env.test` for a run that may be executing inside a git WORKTREE.
 *
 * THE DEFECT THIS FIXES. Both call sites used `dotenv.config({ path: '.env.test' })`, a RELATIVE
 * path resolved against cwd. Gates run with cwd = the worktree, and `.env.*` is gitignored, so a
 * worktree — cut from a commit — never contains one. Every playwright gate therefore depended on
 * the variables being inherited from a parent process. That happened to hold for us, because our
 * launcher exports them, but the launcher is untracked operator apparatus: CI, another laptop, or
 * a bare `tickmarkr run` gets `undefined` and the failure surfaces inside a hook, where it looks
 * like a test failure. Measured 2026-08-19 (RULING-P99-42, order 17).
 *
 * WHY `--git-common-dir`: in a worktree it points at the PRIMARY repository's `.git`, whose parent
 * is the main checkout — so the main `.env.test` is locatable with no machine-specific path baked
 * into a tracked file. In a normal checkout it equals `.git` and this resolves to cwd, a no-op.
 *
 * Precedence is deliberate: a local `.env.test` always wins, so nothing about existing setups
 * changes; the worktree fallback only applies when there is no local file to read.
 */
export const resolveEnvFile = (cwd = process.cwd()) => {
  const local = resolve(cwd, '.env.test')
  if (existsSync(local)) return local
  try {
    const commonDir = execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim()
    const candidate = join(dirname(commonDir), '.env.test')
    if (existsSync(candidate)) return candidate
  } catch {
    /* not a git dir, or git unavailable — fall through to the local path */
  }
  return local
}

/** Load it. `dotenv` never overrides an already-set variable, so an inheriting parent still wins. */
export const loadTestEnv = (cwd = process.cwd()) => dotenv.config({ path: resolveEnvFile(cwd) })
