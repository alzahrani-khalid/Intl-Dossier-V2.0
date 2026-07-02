/**
 * Plan 77-04 (TOKEN-04) — bootstrap.js legacy id.dir coercion + dark-default regression.
 *
 * Executes the REAL `frontend/public/bootstrap.js` in a `node:vm` sandbox (the same
 * pattern as migrator.test.ts) with a stubbed localStorage + a hand documentElement
 * stub whose `style.setProperty` collects the painted CSS custom properties. Asserts
 * the load-bearing first-paint migration:
 *   - every retired id.dir (bureau/chancery/situation/ministerial) and an unset id.dir
 *     coerce to 'linear' — the linear palette is painted AND id.dir is written back;
 *   - an unset id.theme defaults to dark (Linear-canonical);
 *   - an explicitly persisted id.theme='light' is preserved (linear-LIGHT painted);
 *   - a read-only localStorage (setItem throws) still paints linear without throwing.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Script, createContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

import { PALETTES } from '@/design-system/tokens/directions'

const BOOTSTRAP_PATH = resolve(__dirname, '../../public/bootstrap.js')
const source = readFileSync(BOOTSTRAP_PATH, 'utf8')
const LINEAR = PALETTES.linear

interface StorageOp {
  op: 'set' | 'remove'
  key: string
  value?: string
}

interface RunResult {
  painted: Map<string, string>
  store: Map<string, string>
  ops: StorageOp[]
}

const runBootstrap = (
  seed: Record<string, string>,
  opts: { readOnly?: boolean } = {},
): RunResult => {
  const painted = new Map<string, string>()
  const store = new Map<string, string>(Object.entries(seed))
  const ops: StorageOp[] = []
  const localStorage = {
    getItem: (key: string): string | null => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string): void => {
      if (opts.readOnly === true) throw new Error('read-only storage')
      ops.push({ op: 'set', key, value })
      store.set(key, value)
    },
    removeItem: (key: string): void => {
      ops.push({ op: 'remove', key })
      store.delete(key)
    },
  }
  const documentElement = {
    style: {
      setProperty: (name: string, value: string): void => {
        painted.set(name, value)
      },
    },
    classList: { toggle: (): void => {}, add: (): void => {}, remove: (): void => {} },
    setAttribute: (): void => {},
    dataset: {} as Record<string, string>,
    lang: '',
    dir: '',
  }
  const ctx = createContext({
    localStorage,
    document: { documentElement },
    parseInt,
    isNaN,
  })
  new Script(source).runInContext(ctx)
  return { painted, store, ops }
}

describe('bootstrap.js legacy id.dir coercion + dark default (TOKEN-04)', () => {
  it.each(['bureau', 'chancery', 'situation', 'ministerial'] as const)(
    'coerces legacy id.dir=%s to linear and paints linear-dark (theme unset → dark)',
    (dir): void => {
      const { painted, store } = runBootstrap({ 'id.dir': dir })
      expect(painted.get('--bg')).toBe(LINEAR.dark.bg)
      expect(painted.get('--ink')).toBe(LINEAR.dark.ink)
      // write-back: the retired value must be rewritten so it never re-appears.
      expect(store.get('id.dir')).toBe('linear')
    },
  )

  it('coerces an unset id.dir to linear (paints linear-dark + writes back)', (): void => {
    const { painted, store } = runBootstrap({})
    expect(painted.get('--bg')).toBe(LINEAR.dark.bg)
    expect(store.get('id.dir')).toBe('linear')
  })

  it('defaults an unset id.theme to dark (Linear-canonical)', (): void => {
    const { painted } = runBootstrap({ 'id.dir': 'linear' })
    expect(painted.get('--bg')).toBe(LINEAR.dark.bg)
    expect(painted.get('--bg')).not.toBe(LINEAR.light.bg)
  })

  it('preserves an explicitly persisted id.theme=light (paints linear-LIGHT)', (): void => {
    const { painted } = runBootstrap({ 'id.dir': 'linear', 'id.theme': 'light' })
    expect(painted.get('--bg')).toBe(LINEAR.light.bg)
    expect(painted.get('--surface')).toBe(LINEAR.light.surface)
  })

  it('paints linear without throwing when localStorage.setItem is read-only', (): void => {
    expect((): void => {
      const { painted } = runBootstrap({ 'id.dir': 'bureau' }, { readOnly: true })
      expect(painted.get('--bg')).toBe(LINEAR.dark.bg)
    }).not.toThrow()
  })
})
