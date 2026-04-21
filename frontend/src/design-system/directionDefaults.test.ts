import { describe, expect, it } from 'vitest'
import { DIRECTION_DEFAULTS, getDirectionDefaults } from './directionDefaults'

describe('DIRECTION_DEFAULTS (THEME-03 / D-16)', () => {
  it('Chancery defaults = { mode: "light", hue: 22 }', () => {
    expect(DIRECTION_DEFAULTS.chancery).toEqual({ mode: 'light', hue: 22 })
  })
  it('Situation defaults = { mode: "dark", hue: 190 }', () => {
    expect(DIRECTION_DEFAULTS.situation).toEqual({ mode: 'dark', hue: 190 })
  })
  it('Ministerial defaults = { mode: "light", hue: 158 }', () => {
    expect(DIRECTION_DEFAULTS.ministerial).toEqual({ mode: 'light', hue: 158 })
  })
  it('Bureau defaults = { mode: "light", hue: 32 }', () => {
    expect(DIRECTION_DEFAULTS.bureau).toEqual({ mode: 'light', hue: 32 })
  })
  it('getDirectionDefaults returns correct record for every Direction', () => {
    const dirs = ['chancery', 'situation', 'ministerial', 'bureau'] as const
    for (const d of dirs) {
      expect(getDirectionDefaults(d)).toEqual(DIRECTION_DEFAULTS[d])
    }
  })
})
