import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/pages/events/EventsPage.tsx', 'utf8')

describe('EventsPage search filter', () => {
  it('quotes the complete user-entered wildcard pattern', () => {
    expect(source).toContain('quotePostgrestValue(`%${searchTerm}%`)')
    expect(source).toContain('title_en.ilike.${pattern},title_ar.ilike.${pattern}')
    expect(source).not.toContain('ilike.%${')
  })
})
