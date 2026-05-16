import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function resolveRepoRoot(): string {
  if (existsSync(path.resolve(process.cwd(), 'frontend/package.json'))) {
    return process.cwd()
  }

  return path.resolve(process.cwd(), '..')
}

describe('kibo-ui local import ban fixture', () => {
  it('fails lint once eslint.config.mjs bans @/components/kibo-ui/*', (): void => {
    const repoRoot = resolveRepoRoot()
    let lintFailed = false

    try {
      execSync(
        'pnpm --filter frontend lint --no-cache tools/eslint-fixtures/bad-kibo-ui-import.tsx',
        { cwd: repoRoot, stdio: 'pipe' },
      )
    } catch {
      lintFailed = true
    }

    expect(lintFailed).toBe(true)
  })
})
