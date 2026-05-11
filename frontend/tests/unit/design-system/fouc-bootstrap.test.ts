/**
 * FOUC bootstrap drift guard — Plan 33-03.
 *
 * The external bootstrap script (`frontend/public/bootstrap.js`) duplicates the
 * first-paint palette subset (bg / surface / surfaceRaised / ink / line) from
 * `frontend/src/design-system/tokens/directions.ts` PALETTES. That duplication is
 * intentional (D-03 in 33-CONTEXT): the bootstrap must run BEFORE any module
 * loads, so it cannot `import` the source of truth.
 *
 * This test prevents silent drift: if `directions.ts` changes an OKLCH/hex value
 * without the bootstrap being updated, first paint will flash before DesignProvider
 * re-paints on mount. Regex-scrape the bootstrap literals and compare against
 * the TS source.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { PALETTES } from '@/design-system/tokens/directions'
import type { Direction, Mode } from '@/design-system/tokens/types'

type BootstrapPalette = {
  bg: string
  surface: string
  surfaceRaised: string
  ink: string
  line: string
}

const DIRECTIONS: readonly Direction[] = ['chancery', 'situation', 'ministerial', 'bureau'] as const
const MODES: readonly Mode[] = ['light', 'dark'] as const

const BOOTSTRAP_PATH = resolve(__dirname, '../../../public/bootstrap.js')

/** Extract one palette object block from the bootstrap source. */
const extractPalette = (source: string, dir: Direction, mode: Mode): BootstrapPalette => {
  // Match: <dir>: { ... <mode>: { bg: '#...', surface: '#...', surfaceRaised: '#...', ink: '#...', line: '#...' }
  const pattern = new RegExp(
    `${dir}\\s*:\\s*\\{[\\s\\S]*?${mode}\\s*:\\s*\\{\\s*` +
      `bg\\s*:\\s*'([^']+)'\\s*,\\s*` +
      `surface\\s*:\\s*'([^']+)'\\s*,\\s*` +
      `surfaceRaised\\s*:\\s*'([^']+)'\\s*,\\s*` +
      `ink\\s*:\\s*'([^']+)'\\s*,\\s*` +
      `line\\s*:\\s*'([^']+)'`,
  )
  const match = source.match(pattern)
  if (!match) {
    throw new Error(`Failed to scrape ${dir}.${mode} palette from bootstrap.js`)
  }
  return {
    bg: match[1]!,
    surface: match[2]!,
    surfaceRaised: match[3]!,
    ink: match[4]!,
    line: match[5]!,
  }
}

describe('FOUC bootstrap palette drift guard', () => {
  const source = readFileSync(BOOTSTRAP_PATH, 'utf8')

  it('bootstrap.js exists and is non-empty', () => {
    expect(source.length).toBeGreaterThan(0)
  })

  it.each(DIRECTIONS.flatMap((dir) => MODES.map((mode) => [dir, mode] as const)))(
    'palette %s.%s matches directions.ts',
    (dir, mode) => {
      const scraped = extractPalette(source, dir, mode)
      const canonical = PALETTES[dir][mode]
      expect(scraped.bg).toBe(canonical.bg)
      expect(scraped.surface).toBe(canonical.surface)
      expect(scraped.surfaceRaised).toBe(canonical.surfaceRaised)
      expect(scraped.ink).toBe(canonical.ink)
      expect(scraped.line).toBe(canonical.line)
    },
  )

  it('writes --accent + --accent-fg from hue', () => {
    expect(source).toMatch(/--accent['"]\s*,\s*'oklch\(58% 0\.14 ' \+ hue/)
    expect(source).toMatch(/--accent-fg['"]\s*,\s*'oklch\(99% 0\.01 ' \+ hue/)
  })
})
