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

describe('addInitScript(i18nextLng) ban fixture', () => {
  it('fails lint once eslint.config.mjs bans addInitScript(i18nextLng) inside frontend/tests/e2e/**', (): void => {
    const repoRoot = resolveRepoRoot()
    let lintFailed = false

    try {
      execSync(
        'pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-i18n-init.spec.ts',
        { cwd: repoRoot, stdio: 'pipe' },
      )
    } catch {
      lintFailed = true
    }

    expect(lintFailed).toBe(true)
  }, 60_000)
})
