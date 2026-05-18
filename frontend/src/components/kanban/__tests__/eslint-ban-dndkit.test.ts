import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function resolveRepoRoot(): string {
  if (existsSync(path.resolve(process.cwd(), 'eslint.config.mjs'))) {
    return process.cwd()
  }

  return path.resolve(process.cwd(), '..')
}

describe('direct @dnd-kit/core import ban fixture', () => {
  it('fails lint once eslint.config.mjs bans direct @dnd-kit/core outside the shared primitive', (): void => {
    const repoRoot = resolveRepoRoot()
    let lintFailed = false

    try {
      execSync(
        'pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-direct-dndkit-import.tsx',
        { cwd: repoRoot, stdio: 'pipe' },
      )
    } catch {
      lintFailed = true
    }

    expect(lintFailed).toBe(true)
  }, 60_000)
})
