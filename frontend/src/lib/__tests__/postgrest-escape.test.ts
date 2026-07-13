import { describe, expect, it } from 'vitest'
import { quotePostgrestValue } from '../postgrest-escape'

describe('quotePostgrestValue', () => {
  it('quotes the complete wildcard pattern', () => {
    expect(quotePostgrestValue('%abc%')).toBe('"%abc%"')
  })

  it('escapes backslashes before double quotes', () => {
    expect(quotePostgrestValue(String.raw`a\b"c`)).toBe(String.raw`"a\\b\"c"`)
  })

  it('preserves PostgREST-reserved punctuation inside the quotes', () => {
    expect(quotePostgrestValue('%john.doe,a(b):c%')).toBe('"%john.doe,a(b):c%"')
  })
})
