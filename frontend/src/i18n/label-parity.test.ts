import { describe, it } from 'vitest'

describe.skip('tweaks.* label parity', () => {
  it.todo('every tweaks.* key in en/common.json exists in ar/common.json')
  it.todo('no orphan ar-only tweaks.* key without en counterpart')
})
