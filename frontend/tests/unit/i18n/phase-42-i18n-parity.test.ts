import { describe, it, expect } from 'vitest'
import enBriefs from '@/i18n/en/briefs-page.json'
import arBriefs from '@/i18n/ar/briefs-page.json'
import enAA from '@/i18n/en/after-actions-page.json'
import arAA from '@/i18n/ar/after-actions-page.json'
import enTasks from '@/i18n/en/tasks-page.json'
import arTasks from '@/i18n/ar/tasks-page.json'
import enActivity from '@/i18n/en/activity-feed.json'
import arActivity from '@/i18n/ar/activity-feed.json'
import enSettings from '@/i18n/en/settings.json'
import arSettings from '@/i18n/ar/settings.json'

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenKeys(v as Record<string, unknown>, path))
    } else {
      out.push(path)
    }
  }
  return out
}

function assertParity(
  en: Record<string, unknown>,
  ar: Record<string, unknown>,
  ns: string,
): void {
  const enKeys = new Set(flattenKeys(en))
  const arKeys = new Set(flattenKeys(ar))
  const missingInAr = [...enKeys].filter((k) => !arKeys.has(k))
  const extraInAr = [...arKeys].filter((k) => !enKeys.has(k))
  expect(missingInAr, `${ns}: keys missing in AR`).toEqual([])
  expect(extraInAr, `${ns}: keys missing in EN`).toEqual([])
}

// Full top-level drift-guard helper. Compares ALL keys at the ROOT of the namespace,
// catching new sibling blocks (e.g. `settings.errors.*`, future `tasks-page.toast.*`)
// that the targeted sub-block tests above (Tests 4–5) intentionally skip.
function assertFullParity(
  en: Record<string, unknown>,
  ar: Record<string, unknown>,
  ns: string,
): void {
  const enKeys = flattenKeys(en).sort()
  const arKeys = flattenKeys(ar).sort()
  expect(arKeys, `${ns} AR keys`).toEqual(enKeys)
}

describe('Phase 42 i18n parity', () => {
  it('briefs-page EN ↔ AR parity', () =>
    assertParity(
      enBriefs as Record<string, unknown>,
      arBriefs as Record<string, unknown>,
      'briefs-page',
    ))

  it('after-actions-page EN ↔ AR parity', () =>
    assertParity(
      enAA as Record<string, unknown>,
      arAA as Record<string, unknown>,
      'after-actions-page',
    ))

  it('tasks-page EN ↔ AR parity', () =>
    assertParity(
      enTasks as Record<string, unknown>,
      arTasks as Record<string, unknown>,
      'tasks-page',
    ))

  it('activity-feed events.* EN ↔ AR parity', () => {
    const enEvents = (enActivity as { events?: Record<string, unknown> }).events ?? {}
    const arEvents = (arActivity as { events?: Record<string, unknown> }).events ?? {}
    assertParity(enEvents, arEvents, 'activity-feed.events')
  })

  it('settings nav.* + appearance.* EN ↔ AR parity', () => {
    const enNav = (enSettings as { nav?: Record<string, unknown> }).nav ?? {}
    const arNav = (arSettings as { nav?: Record<string, unknown> }).nav ?? {}
    const enApp = (enSettings as { appearance?: Record<string, unknown> }).appearance ?? {}
    const arApp = (arSettings as { appearance?: Record<string, unknown> }).appearance ?? {}
    assertParity(enNav, arNav, 'settings.nav')
    assertParity(enApp, arApp, 'settings.appearance')
  })

  it('Test 6: Full top-level parity drift-guard for all 5 namespaces', () => {
    // Loads each namespace pair (en + ar) and calls assertFullParity at the ROOT
    // of each — no namespace path filter. Any future top-level block (e.g.
    // settings.errors.*, tasks-page.toast.*, activity-feed.banner.*) that drifts
    // between EN and AR will fail this check.
    assertFullParity(
      enBriefs as Record<string, unknown>,
      arBriefs as Record<string, unknown>,
      'briefs-page',
    )
    assertFullParity(
      enAA as Record<string, unknown>,
      arAA as Record<string, unknown>,
      'after-actions-page',
    )
    assertFullParity(
      enTasks as Record<string, unknown>,
      arTasks as Record<string, unknown>,
      'tasks-page',
    )
    assertFullParity(
      enActivity as Record<string, unknown>,
      arActivity as Record<string, unknown>,
      'activity-feed (activity-page)',
    )
    assertFullParity(
      enSettings as Record<string, unknown>,
      arSettings as Record<string, unknown>,
      'settings (settings-page)',
    )
  })
})
