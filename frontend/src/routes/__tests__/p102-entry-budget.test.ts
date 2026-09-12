import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(import.meta.dirname, '../../..')
const repositoryRoot = resolve(frontendRoot, '..')
const sizeLimitConfigPath = resolve(frontendRoot, '.size-limit.json')
// ponytail: size-limit needs a built dist; gate worktrees carry none, CI builds before test
const hasBuild = existsSync(resolve(frontendRoot, 'dist/assets'))

type SizeLimitCheck = {
  name: string
  path: string
  limit: string
  gzip?: boolean
}

function readEntryCheck(): SizeLimitCheck {
  const checks = JSON.parse(readFileSync(sizeLimitConfigPath, 'utf8')) as SizeLimitCheck[]
  const entry = checks.find((check) => check.name === 'Initial JS (entry point)')
  expect(entry).toBeDefined()
  return entry!
}

function runSizeLimit(): string {
  return execFileSync('pnpm', ['size-limit'], {
    cwd: frontendRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

describe('P102-17 entry chunk budget', () => {
  it.skipIf(!hasBuild)(
    'size-limit exits 0 on a fresh build with the entry-point limit configured below 500 KB at the measured value.',
    () => {
      const entry = readEntryCheck()
      expect(Number.parseFloat(entry.limit)).toBeLessThan(500)
      expect(runSizeLimit()).toContain('Initial JS (entry point)')
    },
  )

  it.skipIf(!hasBuild)(
    'after a build exists in the worktree: the entry-point check still has path === dist/assets/app-*.js and gzip === true (re-pointing the budget at a smaller chunk or switching to brotli fails), `node frontend/scripts/assert-size-limit-matches.mjs` exits 0 (every budget pattern matches exactly one built chunk), the configured entry-point limit parses below 500 KB AND `pnpm -C frontend size-limit` exits 0 (all literals rendered). RED at HEAD on the on-disk dist (re-drilled rev-1 2026-09-10): shape ok (path/gzip/assert 0), limit 500 KB, size-limit exit 1, entry 516.25 kB. Exit 3 without a dist (the build gate provides it; a worker that never built cannot pass).',
    () => {
      const entry = readEntryCheck()
      expect(entry.path).toBe('dist/assets/app-*.js')
      expect(entry.gzip).toBe(true)
      expect(Number.parseFloat(entry.limit)).toBeLessThan(500)

      const matchOutput = execFileSync(
        process.execPath,
        ['scripts/assert-size-limit-matches.mjs'],
        {
          cwd: frontendRoot,
          encoding: 'utf8',
        },
      )
      expect(matchOutput).toContain('Initial JS (entry point): 1 file(s)')
      expect(runSizeLimit()).toContain('Initial JS (entry point)')
    },
  )

  it("The DIFF cites the vite.config.ts change (route-level lazy imports or a manualChunks entry naming APP modules moved out of the entry - not a vendor regroup, not a raise of chunkSizeWarningLimit) and the .size-limit.json entry-point limit equal to the SUMMARY's measured post-build number rounded up to the next 4 kB; the SUMMARY records the HEAD build's size-limit table verbatim, the post-change table verbatim, the delta per named chunk, and `node frontend/scripts/assert-size-limit-matches.mjs` output. If the entry could not get under 500 KB the SUMMARY says so in its first line and the limit is left at 500 KB.", () => {
    const viteConfig = readFileSync(resolve(frontendRoot, 'vite.config.ts'), 'utf8')
    const summary = readFileSync(
      resolve(repositoryRoot, '.planning/phases/102-staging-data-debt-tail/102-17-SUMMARY.md'),
      'utf8',
    )
    const entry = readEntryCheck()
    const measuredMatch = summary.match(/Post-change measured entry: ([0-9.]+) kB/)

    expect(viteConfig).toContain("return 'translations'")
    expect(viteConfig).toContain('src[\\\\/]i18n')
    expect(viteConfig).toContain('chunkSizeWarningLimit: 500')
    expect(measuredMatch).not.toBeNull()
    expect(Number.parseFloat(entry.limit)).toBe(
      Math.ceil(Number.parseFloat(measuredMatch![1]) / 4) * 4,
    )
    expect(summary).toContain('HEAD build size-limit table (verbatim)')
    expect(summary).toContain('Post-change size-limit table (verbatim)')
    expect(summary).toContain('Delta per named chunk')
    expect(summary).toContain('assert-size-limit-matches output (verbatim)')
  })
})
