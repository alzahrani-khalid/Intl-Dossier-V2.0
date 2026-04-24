/**
 * VALIDATION row 37-03-02 — T-37-02 mitigation.
 * `window.__showGlobeLoader` MUST be a function in DEV and undefined in PROD builds.
 * Uses vi.stubEnv + resetModules so each assertion loads FullscreenLoader fresh.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../GlobeLoader', (): { GlobeLoader: () => JSX.Element } => ({
  GlobeLoader: (): JSX.Element => <div data-testid="globe-loader-stub" />,
}))

vi.mock('@/design-system/hooks', (): { useReducedMotion: () => boolean } => ({
  useReducedMotion: (): boolean => true,
}))

type WindowShape = { __showGlobeLoader?: unknown }

describe('FullscreenLoader — DEV gate (T-37-02 / 37-03-02)', (): void => {
  afterEach((): void => {
    delete (window as unknown as WindowShape).__showGlobeLoader
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('exposes window.__showGlobeLoader when import.meta.env.DEV === true', async (): Promise<void> => {
    vi.stubEnv('DEV', true)
    await import('../FullscreenLoader')
    expect(typeof (window as unknown as WindowShape).__showGlobeLoader).toBe('function')
  })

  it('does NOT expose window.__showGlobeLoader when import.meta.env.DEV === false', async (): Promise<void> => {
    vi.stubEnv('DEV', false)
    await import('../FullscreenLoader')
    expect((window as unknown as WindowShape).__showGlobeLoader).toBeUndefined()
  })
})
