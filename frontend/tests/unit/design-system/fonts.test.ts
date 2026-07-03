import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const FRONTEND_ROOT = resolve(__dirname, '../../..')
const PACKAGE_JSON = resolve(FRONTEND_ROOT, 'package.json')
const FONTS_TS = resolve(FRONTEND_ROOT, 'src/fonts.ts')

// Phase 77 (linear-token-system) — the engine is single-direction (Linear).
// The four retired directions' per-direction fonts (Fraunces, Public Sans,
// Space Grotesk, IBM Plex Sans/Mono) were dropped from fonts.ts in 77-07. Only
// Inter Variable (display + body) + JetBrains Mono Variable (mono) + the Tajawal
// Arabic RTL cascade remain. The retired @fontsource packages may still linger
// in package.json (unused, tree-shaken) — this guard only pins what we import.
const REQUIRED_DEPS = [
  '@fontsource-variable/inter',
  '@fontsource-variable/jetbrains-mono',
  '@fontsource/tajawal',
] as const

const REQUIRED_IMPORTS = [
  '@fontsource-variable/inter/wght.css',
  '@fontsource-variable/jetbrains-mono/wght.css',
  '@fontsource/tajawal/400.css',
  '@fontsource/tajawal/500.css',
  '@fontsource/tajawal/700.css',
] as const

describe('Phase 77 — Linear font drift guard (TYPO-02)', () => {
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
