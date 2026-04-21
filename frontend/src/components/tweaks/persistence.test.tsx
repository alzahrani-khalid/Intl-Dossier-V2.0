import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'

import { DesignProvider } from '@/design-system/DesignProvider'
import { useClassification } from '@/design-system/hooks/useClassification'
import { useLocale } from '@/design-system/hooks/useLocale'

const storage = new Map<string, string>()

beforeEach((): void => {
  storage.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string): string | null => storage.get(k) ?? null,
    setItem: (k: string, v: string): void => {
      storage.set(k, v)
    },
    removeItem: (k: string): void => {
      storage.delete(k)
    },
    clear: (): void => {
      storage.clear()
    },
    key: (): string | null => null,
    length: 0,
  })
  // Reset document root state between tests.
  document.documentElement.lang = ''
  document.documentElement.dir = ''
})

afterEach((): void => {
  vi.unstubAllGlobals()
})

function HookProbe({ hook }: { hook: () => unknown }): null {
  ;(globalThis as Record<string, unknown>).__probe = hook()
  return null
}

describe('Tweaks persistence (THEME-02)', () => {
  it('round-trip: id.classif true', () => {
    render(
      <DesignProvider>
        <HookProbe hook={useClassification} />
      </DesignProvider>,
    )
    const probe = (globalThis as { __probe: { setClassif: (v: boolean) => void } }).__probe
    act(() => probe.setClassif(true))
    expect(storage.get('id.classif')).toBe('true')
  })

  it('round-trip: id.classif false', () => {
    render(
      <DesignProvider>
        <HookProbe hook={useClassification} />
      </DesignProvider>,
    )
    const probe = (globalThis as { __probe: { setClassif: (v: boolean) => void } }).__probe
    act(() => probe.setClassif(false))
    expect(storage.get('id.classif')).toBe('false')
  })

  it('round-trip: id.locale en/ar', () => {
    render(
      <DesignProvider>
        <HookProbe hook={useLocale} />
      </DesignProvider>,
    )
    const probe = (globalThis as { __probe: { setLocale: (l: 'en' | 'ar') => void } }).__probe
    act(() => probe.setLocale('ar'))
    expect(storage.get('id.locale')).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(document.documentElement.lang).toBe('ar')
  })

  it('T-34-01 sanitize: junk id.locale falls back to en', () => {
    storage.set('id.locale', 'fr')
    render(
      <DesignProvider>
        <HookProbe hook={useLocale} />
      </DesignProvider>,
    )
    const probe = (globalThis as { __probe: { locale: string } }).__probe
    expect(probe.locale).toBe('en')
  })

  it('T-34-01 sanitize: unknown id.classif (not "true") is false', () => {
    storage.set('id.classif', 'yes')
    render(
      <DesignProvider>
        <HookProbe hook={useClassification} />
      </DesignProvider>,
    )
    const probe = (globalThis as { __probe: { classif: boolean } }).__probe
    expect(probe.classif).toBe(false)
  })

  it('T-34-03: localStorage.setItem SecurityError is swallowed', () => {
    vi.stubGlobal('localStorage', {
      getItem: (): string | null => null,
      setItem: (): void => {
        throw new DOMException('QuotaExceeded', 'SecurityError')
      },
      removeItem: (): void => {},
      clear: (): void => {},
      key: (): string | null => null,
      length: 0,
    })
    render(
      <DesignProvider>
        <HookProbe hook={useClassification} />
      </DesignProvider>,
    )
    const probe = (globalThis as { __probe: { setClassif: (v: boolean) => void } }).__probe
    expect(() => act(() => probe.setClassif(true))).not.toThrow()
  })
})
