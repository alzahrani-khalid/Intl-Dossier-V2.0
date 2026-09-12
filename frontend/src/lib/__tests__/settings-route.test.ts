/**
 * settings-route — the ONE `/settings` subtree predicate (Phase 97, NAV-02).
 *
 * Two cases carry the weight and neither is decoration:
 *   - `/settingsFoo` → false is what distinguishes this predicate from the
 *     `startsWith('/settings')` it replaces. A table without it would pass
 *     against the old buggy behaviour and prove nothing.
 *   - `/settings/calendar/callback` → true is the deepest child, previously
 *     double-hidden: no global sidebar (prefix suppressed it) and no settings
 *     column (the exact match refused it).
 */
import { describe, it, expect } from 'vitest'
import { isSettingsPathExact, isSettingsPath } from '../settings-route'

describe('isSettingsPath', () => {
  it.each([
    ['/settings', true],
    ['/settings/webhooks', true],
    ['/settings/integrations', true],
    ['/settings/notifications', true],
    ['/settings/email-digest', true],
    ['/settings/calendar-sync', true],
    ['/settings/calendar/callback', true],
    ['/settingsFoo', false],
    ['/settings-archive', false],
    ['/dossiers/countries', false],
    ['/', false],
    ['', false],
  ])('%s → %s', (pathname, expected) => {
    expect(isSettingsPath(pathname)).toBe(expected)
  })
})

describe('isSettingsPathExact', () => {
  it.each([
    ['/settings', true],
    ['/settings/webhooks', false],
    ['/settings/calendar/callback', false],
    ['/settingsFoo', false],
    ['/', false],
  ])('%s → %s', (pathname, expected) => {
    expect(isSettingsPathExact(pathname)).toBe(expected)
  })
})
