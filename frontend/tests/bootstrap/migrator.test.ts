import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Script, createContext } from 'node:vm'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const BOOTSTRAP_PATH = resolve(__dirname, '../../public/bootstrap.js')
const source = readFileSync(BOOTSTRAP_PATH, 'utf8')

interface BootstrapResult {
  storage: Map<string, string>
  lang: string
  dir: string
  classification: string | undefined
}

const runBootstrap = (initialStorage: Record<string, string>): BootstrapResult => {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    runScripts: 'outside-only',
  })
  const storage = new Map<string, string>(Object.entries(initialStorage))
  const stubbedLocalStorage = {
    getItem: (k: string): string | null => storage.get(k) ?? null,
    setItem: (k: string, v: string): void => {
      storage.set(k, v)
    },
    removeItem: (k: string): void => {
      storage.delete(k)
    },
  }
  const ctx = createContext({
    localStorage: stubbedLocalStorage,
    document: dom.window.document,
    parseInt,
    isNaN,
  })
  new Script(source).runInContext(ctx)
  return {
    storage,
    lang: dom.window.document.documentElement.lang,
    dir: dom.window.document.documentElement.dir,
    classification: dom.window.document.documentElement.dataset.classification,
  }
}

describe('bootstrap.js i18nextLng → id.locale migrator (THEME-02 / D-12)', () => {
  it('T-34-02: migrator does NOT overwrite existing id.locale', (): void => {
    const out = runBootstrap({ 'id.locale': 'en', i18nextLng: 'ar' })
    expect(out.storage.get('id.locale')).toBe('en')
    expect(out.storage.has('i18nextLng')).toBe(false)
  })

  it('migrator copies legacy i18nextLng="ar" to id.locale when canonical is unset', (): void => {
    const out = runBootstrap({ i18nextLng: 'ar' })
    expect(out.storage.get('id.locale')).toBe('ar')
    expect(out.storage.has('i18nextLng')).toBe(false)
  })

  it('migrator copies legacy i18nextLng="en" to id.locale when canonical is unset', (): void => {
    const out = runBootstrap({ i18nextLng: 'en' })
    expect(out.storage.get('id.locale')).toBe('en')
    expect(out.storage.has('i18nextLng')).toBe(false)
  })

  it('migrator discards junk legacy value (e.g. "fr")', (): void => {
    const out = runBootstrap({ i18nextLng: 'fr' })
    expect(out.storage.has('id.locale')).toBe(false)
    expect(out.storage.has('i18nextLng')).toBe(false)
  })

  it('bootstrap sets documentElement.dir=rtl when id.locale=ar', (): void => {
    const out = runBootstrap({ 'id.locale': 'ar' })
    expect(out.dir).toBe('rtl')
    expect(out.lang).toBe('ar')
  })

  it('bootstrap sets documentElement.dir=ltr when id.locale=en', (): void => {
    const out = runBootstrap({ 'id.locale': 'en' })
    expect(out.dir).toBe('ltr')
    expect(out.lang).toBe('en')
  })

  it('bootstrap sets dataset.classification="show" when id.classif=true', (): void => {
    const out = runBootstrap({ 'id.classif': 'true' })
    expect(out.classification).toBe('show')
  })

  it('bootstrap sets dataset.classification="hide" when id.classif is absent', (): void => {
    const out = runBootstrap({})
    expect(out.classification).toBe('hide')
  })

  it('T-34-03: localStorage SecurityError does not throw outer IIFE', (): void => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
      runScripts: 'outside-only',
    })
    const ctx = createContext({
      localStorage: {
        getItem: (): null => {
          throw new DOMException('denied', 'SecurityError')
        },
        setItem: (): void => {},
        removeItem: (): void => {},
      },
      document: dom.window.document,
      parseInt,
      isNaN,
    })
    expect((): void => {
      new Script(source).runInContext(ctx)
    }).not.toThrow()
  })
})
