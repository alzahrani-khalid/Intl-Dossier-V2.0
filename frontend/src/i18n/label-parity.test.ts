import { describe, expect, it } from 'vitest'

import enCommon from './en/common.json'
import arCommon from './ar/common.json'

/**
 * Flatten the `tweaks.*` subtree of a locale bundle into a sorted list of dot
 * paths (e.g. `tweaks.direction.chancery.tagline`). Leaves are anything that
 * isn't a plain object — strings, numbers, booleans — so label + tagline
 * strings all show up individually.
 */
function flattenTweaks(obj: Record<string, unknown>): string[] {
  const tweaks = (obj as { tweaks?: Record<string, unknown> }).tweaks
  if (!tweaks) return []
  const out: string[] = []
  const walk = (node: unknown, path: string): void => {
    if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        walk(v, `${path}.${k}`)
      }
    } else {
      out.push(path)
    }
  }
  walk(tweaks, 'tweaks')
  return out.sort()
}

describe('tweaks.* label parity', () => {
  it('every tweaks.* key in en/common.json exists in ar/common.json', () => {
    const enKeys = flattenTweaks(enCommon as Record<string, unknown>)
    const arKeys = flattenTweaks(arCommon as Record<string, unknown>)
    expect(arKeys).toEqual(enKeys)
  })

  it('no orphan ar-only tweaks.* key without en counterpart', () => {
    const enKeys = new Set(flattenTweaks(enCommon as Record<string, unknown>))
    const arKeys = flattenTweaks(arCommon as Record<string, unknown>)
    const orphans = arKeys.filter((k) => !enKeys.has(k))
    expect(orphans).toEqual([])
  })
})
