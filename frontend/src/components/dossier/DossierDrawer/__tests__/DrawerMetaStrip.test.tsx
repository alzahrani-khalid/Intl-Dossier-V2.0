/**
 * DrawerMetaStrip — Wave 1 (Phase 41 plan 02 Task 2) unit tests.
 *
 * Behavior contract per 41-02-PLAN.md:
 *   1. renders 4 segments separated by U+00B7 (·)
 *   2. location: metadata.region or t('meta.location_fallback')
 *   3. lead: metadata.lead_name prefixed with t('meta.lead_prefix') + ': '; em-dash when missing
 *   4. engagement count uses toArDigits + t('meta.engagements_suffix')
 *   5. last touched: same-day → today key; 1 day → yesterday key; N>=2 → relative key
 *   6. container has class "drawer-meta"
 */
import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let currentLang = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: Record<string, unknown>) => string
    i18n: { language: string }
  } => ({
    t: (k: string, opts?: Record<string, unknown>): string => {
      if (
        opts !== undefined &&
        typeof opts === 'object' &&
        opts !== null &&
        'n' in opts &&
        opts.n !== undefined
      ) {
        return `${k}|n=${String(opts.n)}`
      }
      return k
    },
    i18n: { language: currentLang },
  }),
  Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
}))

import { DrawerMetaStrip } from '../DrawerMetaStrip'

describe('DrawerMetaStrip (Wave 1)', () => {
  beforeEach(() => {
    currentLang = 'en'
  })
  afterEach(() => {
    cleanup()
  })

  it('renders 4 segments separated by middle-dot (·)', () => {
    const { container } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{ region: 'Riyadh', lead_name: 'Jane Doe' }}
        updatedAt={new Date().toISOString()}
        engagementCount={3}
      />,
    )
    const dots = container.querySelectorAll('span[aria-hidden="true"]')
    const dotTexts = Array.from(dots)
      .map((n) => n.textContent)
      .filter((t) => t === '·')
    expect(dotTexts).toHaveLength(3)
  })

  it('falls back to t("meta.location_fallback") when metadata.region is absent', () => {
    const { container } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{}}
        updatedAt={new Date().toISOString()}
        engagementCount={0}
      />,
    )
    expect(container.textContent).toContain('meta.location_fallback')
  })

  it('renders metadata.region when present', () => {
    const { container } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{ region: 'Riyadh' }}
        updatedAt={new Date().toISOString()}
        engagementCount={0}
      />,
    )
    expect(container.textContent).toContain('Riyadh')
  })

  it('renders lead segment with t("meta.lead_prefix") + ": " + name; em-dash when missing', () => {
    const { container, rerender } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{ lead_name: 'Jane Doe' }}
        updatedAt={new Date().toISOString()}
        engagementCount={0}
      />,
    )
    expect(container.textContent).toContain('meta.lead_prefix: Jane Doe')

    rerender(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{}}
        updatedAt={new Date().toISOString()}
        engagementCount={0}
      />,
    )
    expect(container.textContent).toContain('—')
  })

  it('engagement count uses Western digits in EN', () => {
    const { container } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{}}
        updatedAt={new Date().toISOString()}
        engagementCount={22}
      />,
    )
    expect(container.textContent).toContain('22 meta.engagements_suffix')
  })

  it('engagement count uses Arabic-Indic digits in AR', () => {
    currentLang = 'ar'
    const { container } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{}}
        updatedAt={new Date().toISOString()}
        engagementCount={22}
      />,
    )
    expect(container.textContent).toContain('٢٢')
  })

  it('last touched today renders t("meta.last_touched_today") for same-day updatedAt', () => {
    const sameDay = new Date()
    sameDay.setHours(8, 30, 0, 0)
    const { container } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{}}
        updatedAt={sameDay.toISOString()}
        engagementCount={0}
      />,
    )
    expect(container.textContent).toContain('meta.last_touched_today')
  })

  it('last touched yesterday renders t("meta.last_touched_yesterday") for 1 day ago', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const { container } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{}}
        updatedAt={yesterday.toISOString()}
        engagementCount={0}
      />,
    )
    expect(container.textContent).toContain('meta.last_touched_yesterday')
  })

  it('last touched N>=2 days renders relative key with toArDigits-formatted N', () => {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    const { container } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{}}
        updatedAt={fiveDaysAgo.toISOString()}
        engagementCount={0}
      />,
    )
    expect(container.textContent).toContain('meta.last_touched_relative|n=5')
  })

  it('emits container class "drawer-meta"', () => {
    const { container } = render(
      <DrawerMetaStrip
        dossierId="d1"
        metadata={{}}
        updatedAt={new Date().toISOString()}
        engagementCount={0}
      />,
    )
    expect(container.querySelector('.drawer-meta')).not.toBeNull()
  })
})
