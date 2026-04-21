import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const FRONTEND_ROOT = resolve(__dirname, '../../..')
const PACKAGE_JSON = resolve(FRONTEND_ROOT, 'package.json')
const FONTS_TS = resolve(FRONTEND_ROOT, 'src/fonts.ts')

const REQUIRED_DEPS = [
  '@fontsource-variable/inter',
  '@fontsource-variable/public-sans',
  '@fontsource-variable/space-grotesk',
  '@fontsource-variable/fraunces',
  '@fontsource-variable/jetbrains-mono',
  '@fontsource/ibm-plex-sans',
  '@fontsource/ibm-plex-mono',
  '@fontsource/tajawal',
] as const

const REQUIRED_IMPORTS = [
  '@fontsource-variable/inter/wght.css',
  '@fontsource-variable/public-sans/wght.css',
  '@fontsource-variable/space-grotesk/wght.css',
  '@fontsource-variable/fraunces/wght.css',
  '@fontsource-variable/jetbrains-mono/wght.css',
  '@fontsource/ibm-plex-sans/400.css',
  '@fontsource/ibm-plex-sans/500.css',
  '@fontsource/ibm-plex-sans/600.css',
  '@fontsource/ibm-plex-sans/700.css',
  '@fontsource/ibm-plex-mono/400.css',
  '@fontsource/ibm-plex-mono/500.css',
  '@fontsource/tajawal/400.css',
  '@fontsource/tajawal/500.css',
  '@fontsource/tajawal/700.css',
] as const

describe('Phase 35 — fontsource dependency drift guard (TYPO-02)', () => {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as {
    dependencies: Record<string, string>
  }

  it.each(REQUIRED_DEPS)('package.json declares %s with ^5.x pin', (name) => {
    const version = pkg.dependencies[name]
    expect(version, `missing dependency: ${name}`).toBeDefined()
    expect(version).toMatch(/^\^5\./)
  })

  it('fonts.ts exists and is non-empty', () => {
    const src = readFileSync(FONTS_TS, 'utf8')
    expect(src.length).toBeGreaterThan(100)
  })

  it.each(REQUIRED_IMPORTS)('fonts.ts imports %s', (path) => {
    const src = readFileSync(FONTS_TS, 'utf8')
    expect(src).toContain(`'${path}'`)
  })
})
