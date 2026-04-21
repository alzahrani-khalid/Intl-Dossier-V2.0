import { describe, it } from 'vitest'

describe.skip('Tweaks persistence (THEME-02)', () => {
  it.todo('round-trip: id.dir (chancery|situation|ministerial|bureau)')
  it.todo('round-trip: id.theme (light|dark)')
  it.todo('round-trip: id.hue (0-360 stringified)')
  it.todo('round-trip: id.density (comfortable|compact)')
  it.todo('round-trip: id.classif (true|false)')
  it.todo('round-trip: id.locale (en|ar)')
  it.todo('T-34-01 sanitize: garbage id.dir falls back to chancery default')
  it.todo('T-34-01 sanitize: garbage id.hue (NaN / out-of-range) falls back to direction default')
  it.todo('T-34-03 SecurityError on setItem is swallowed silently')
})
