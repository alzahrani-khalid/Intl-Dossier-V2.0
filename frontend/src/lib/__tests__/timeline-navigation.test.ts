/**
 * resolveTimelineNavUrl — mounted-route + R-05/WR-01 guard matrix (OVRERR-02).
 *
 * Pins BOTH dimensions of the guard so the allowlist can never loosen the
 * shipped R-05/WR-01 open-redirect protection (threat T-66-03):
 *   1. R-05/WR-01: relative-only, reject `//`, `\`, schemes, empty/non-string.
 *   2. Mountedness: only paths that resolve to a MOUNTED route are accepted;
 *      unmounted detail routes (/calendar/<id>, /mous/<id>, /documents/<id>)
 *      return null even though they pass the R-05 relative-path check.
 *
 * Mirrors ActivityList.test.tsx Test 7 rejection-matrix style.
 */
import { describe, it, expect } from 'vitest'
import { resolveTimelineNavUrl } from '../timeline-navigation'

describe('resolveTimelineNavUrl', () => {
  describe('rejects (→ null)', () => {
    const rejected: Array<{ name: string; input: unknown }> = [
      // Unmounted detail routes — pass R-05 but have no mounted destination.
      { name: 'unmounted /calendar/<uuid>', input: '/calendar/0a1b2c3d-uuid' },
      { name: 'unmounted /mous/<uuid>', input: '/mous/0a1b2c3d-uuid' },
      { name: 'unmounted /documents/<id>', input: '/documents/abc' },
      // R-05/WR-01 open-redirect surface.
      { name: 'protocol-relative //evil', input: '//evil.example' },
      { name: 'backslash variant /\\evil', input: '/\\evil.example' },
      { name: 'absolute https URL', input: 'https://evil.example/x' },
      { name: 'javascript: scheme', input: 'javascript:alert(1)' },
      // Non-string / empty / unknown.
      { name: 'empty string', input: '' },
      { name: 'undefined', input: undefined },
      { name: 'number', input: 42 },
      { name: 'unknown prefix', input: '/unknown-prefix/x' },
    ]

    it.each(rejected)('rejects $name', ({ input }) => {
      expect(resolveTimelineNavUrl(input)).toBeNull()
    })
  })

  describe('accepts (→ input unchanged)', () => {
    const accepted: Array<string> = [
      '/tasks/abc',
      '/intake/tickets/abc',
      '/positions/abc',
      '/engagements/abc',
      '/after-actions/abc',
      '/commitments?id=abc',
      '/mous',
      '/calendar',
      '/activity',
      '/dossiers/countries/abc',
      '/dossiers/working_groups/abc/docs',
      '/dossiers/elected-officials/abc/overview',
      '/dossiers/organizations/abc/mous',
    ]

    it.each(accepted)('accepts %s unchanged', (input) => {
      expect(resolveTimelineNavUrl(input)).toBe(input)
    })
  })

  describe('query strings on allowed prefixes survive', () => {
    it('keeps the query string intact on an allowed dossier path', () => {
      const input = '/dossiers/countries/abc?x=1'
      expect(resolveTimelineNavUrl(input)).toBe(input)
    })
  })
})
