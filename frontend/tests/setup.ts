import '@testing-library/jest-dom/vitest'
import { beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'
import i18n from '../src/i18n'

vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

// Node 22+ ships an experimental built-in `localStorage` global that is
// `undefined` unless `--localstorage-file` is provided, and it shadows jsdom's
// Web Storage implementation. When that happens every test that touches
// localStorage (directly or via LanguageProvider) throws
// "Cannot read properties of undefined (reading 'getItem')". Install a minimal
// in-memory Storage shim only when the global is missing; environments that
// already expose a working localStorage (e.g. CI) are left untouched.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()

  // Prefer jsdom's real `Storage` prototype so existing tests that spy on
  // `Storage.prototype.setItem` (e.g. the density-migration shim) still
  // intercept calls. Fall back to a plain object when no `Storage` class
  // exists in the environment.
  const StorageCtor = (globalThis as { Storage?: typeof Storage }).Storage
  const hasStorageClass = typeof StorageCtor === 'function'
  const proto = hasStorageClass ? StorageCtor!.prototype : Object.prototype

  const memoryStorage = Object.create(proto) as Storage

  // Define the storage methods on the *prototype* (when a real `Storage` class
  // exists) rather than the instance, so `vi.spyOn(Storage.prototype, 'setItem')`
  // intercepts calls exactly as it does against jsdom's native Storage in CI.
  // When no Storage class is present, fall back to own-property methods.
  const methodTarget = hasStorageClass ? proto : memoryStorage
  Object.defineProperties(methodTarget, {
    clear: {
      configurable: true,
      writable: true,
      value(): void {
        store.clear()
      },
    },
    getItem: {
      configurable: true,
      writable: true,
      value(key: string): string | null {
        return store.has(key) ? store.get(key)! : null
      },
    },
    key: {
      configurable: true,
      writable: true,
      value(index: number): string | null {
        return Array.from(store.keys())[index] ?? null
      },
    },
    removeItem: {
      configurable: true,
      writable: true,
      value(key: string): void {
        store.delete(key)
      },
    },
    setItem: {
      configurable: true,
      writable: true,
      value(key: string, value: string): void {
        store.set(key, String(value))
      },
    },
  })

  Object.defineProperty(memoryStorage, 'length', {
    configurable: true,
    get(): number {
      return store.size
    },
  })

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: memoryStorage,
  })

  if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: memoryStorage,
    })
  }
}

// jsdom polyfill: ResizeObserver (used by @radix-ui/react-use-size + signature-visuals)
if (typeof ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
}

// jsdom polyfill: matchMedia (used by useResponsive + Tailwind breakpoint hooks)
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

// jsdom defines scrollTo as a not-implemented stub, so replace it with a no-op.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    configurable: true,
    value: vi.fn(),
  })
}

// The real i18n instance. src/i18n/index.ts is the app's only resource loader, so
// importing it gives tests the production namespaces, resources, the
// translation→common alias and the same fallback config (fallbackLng: 'en', no
// fallbackNS, no defaultNS). No key-echo map, no exact-key exemptions: an
// unresolved key renders as its own raw key here exactly as it does to a user.
//
// The instance is a module singleton and LanguageProvider calls changeLanguage
// whenever it finds `id.locale`, so without a per-test reset one test's
// localStorage.setItem('id.locale','ar') decides the locale of every test after
// it in the same file. A browser re-runs detection on every page load; this makes
// each test start where the app starts.
const BOOT_LANGUAGE = i18n.language

beforeEach(() => {
  if (i18n.language !== BOOT_LANGUAGE) {
    void i18n.changeLanguage(BOOT_LANGUAGE)
  }
})

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset any runtime request handlers we may add during the tests
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Clean up after the tests are finished
afterAll(() => server.close())
