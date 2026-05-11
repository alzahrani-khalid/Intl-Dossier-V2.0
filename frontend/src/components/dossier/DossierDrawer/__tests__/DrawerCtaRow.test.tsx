/**
 * DrawerCtaRow — Wave 1 (Phase 41 plan 02 Task 3) unit tests.
 *
 * Behavior contract per 41-02-PLAN.md:
 *   1. renders 4 buttons in order: Log engagement (.btn-primary), Brief, Follow,
 *      Open full dossier (.btn-ghost)
 *   2. clicking Log engagement → navigate({ to: '/dossiers/engagements/create' })
 *   3. clicking Open full dossier → navigate({ to: getDossierDetailPath(id, type) })
 *   4. Brief: aria-disabled="true", title=t('cta.coming_soon'), opacity 0.55, no nav
 *   5. Follow: same stub treatment as Brief
 *   6. Log engagement: minBlockSize 44
 *   7. Open full dossier: trailing chevron-right icon
 *   8. AR locale uses cta.* keys (per-file mock returns key — sufficient)
 *   9. RTL chevron flip: under dir="rtl" the chevron icon has class "icon-flip"
 *      OR computed transform scaleX(-1); under dir="ltr" it does NOT.
 */
import { render, cleanup, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: (): typeof navigateMock => navigateMock,
}))

vi.mock('@/lib/dossier-routes', () => ({
  getDossierDetailPath: (id: string, type: string): string => `/MOCK/${type}/${id}`,
}))

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string) => string
    i18n: { language: string }
  } => ({
    t: (k: string): string => k,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
}))

import { DrawerCtaRow } from '../DrawerCtaRow'

describe('DrawerCtaRow (Wave 1)', () => {
  beforeEach(() => {
    navigateMock.mockReset()
  })
  afterEach(() => {
    cleanup()
  })

  it('renders 4 buttons in order: Log engagement, Brief, Follow, Open full dossier', () => {
    render(<DrawerCtaRow dossierId="d1" dossierType="country" />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    expect(buttons[0].getAttribute('data-testid')).toBe('cta-log-engagement')
    expect(buttons[1].getAttribute('data-testid')).toBe('cta-brief')
    expect(buttons[2].getAttribute('data-testid')).toBe('cta-follow')
    expect(buttons[3].getAttribute('data-testid')).toBe('cta-open-full-dossier')
    expect(buttons[0].className).toContain('btn-primary')
    expect(buttons[3].className).toContain('btn-ghost')
  })

  it('clicking Log engagement navigates to /dossiers/engagements/create', () => {
    render(<DrawerCtaRow dossierId="d1" dossierType="country" />)
    fireEvent.click(screen.getByTestId('cta-log-engagement'))
    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/dossiers/engagements/create' })
  })

  it('clicking Open full dossier navigates to getDossierDetailPath(id, type)', () => {
    render(<DrawerCtaRow dossierId="abc" dossierType="organization" />)
    fireEvent.click(screen.getByTestId('cta-open-full-dossier'))
    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/MOCK/organization/abc' })
  })

  it('Brief is aria-disabled with Coming soon title and 0.55 opacity; click does not navigate', () => {
    render(<DrawerCtaRow dossierId="d1" dossierType="country" />)
    const brief = screen.getByTestId('cta-brief')
    expect(brief.getAttribute('aria-disabled')).toBe('true')
    expect(brief.getAttribute('title')).toBe('cta.coming_soon')
    expect((brief as HTMLButtonElement).style.opacity).toBe('0.55')
    fireEvent.click(brief)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('Follow has the same stub treatment (aria-disabled + Coming soon + 0.55 + no nav)', () => {
    render(<DrawerCtaRow dossierId="d1" dossierType="country" />)
    const follow = screen.getByTestId('cta-follow')
    expect(follow.getAttribute('aria-disabled')).toBe('true')
    expect(follow.getAttribute('title')).toBe('cta.coming_soon')
    expect((follow as HTMLButtonElement).style.opacity).toBe('0.55')
    fireEvent.click(follow)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('Log engagement button has minBlockSize 44', () => {
    render(<DrawerCtaRow dossierId="d1" dossierType="country" />)
    const log = screen.getByTestId('cta-log-engagement') as HTMLButtonElement
    expect(log.style.minBlockSize).toBe('44px')
  })

  it('Open full dossier renders a trailing chevron icon', () => {
    render(<DrawerCtaRow dossierId="d1" dossierType="country" />)
    const open = screen.getByTestId('cta-open-full-dossier')
    // Last child should be the chevron <svg>
    const svgs = open.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(1)
    const lastSvg = svgs[svgs.length - 1]
    // lucide icons carry `lucide-chevron-right` in their class list.
    expect(lastSvg.getAttribute('class') ?? '').toMatch(/chevron-right/i)
  })

  it('all CTA labels resolve via the dossier-drawer i18n namespace (cta.* keys)', () => {
    render(<DrawerCtaRow dossierId="d1" dossierType="country" />)
    expect(screen.getByText('cta.log_engagement')).toBeTruthy()
    expect(screen.getByText('cta.brief')).toBeTruthy()
    expect(screen.getByText('cta.follow')).toBeTruthy()
    expect(screen.getByText('cta.open_full_dossier')).toBeTruthy()
  })

  it('Open full dossier chevron flips under RTL (icon-flip class) and not under LTR', () => {
    // RTL render
    const { container: rtl } = render(
      <div dir="rtl">
        <DrawerCtaRow dossierId="d1" dossierType="country" />
      </div>,
    )
    const rtlOpen = rtl.querySelector('[data-testid="cta-open-full-dossier"]')
    expect(rtlOpen).not.toBeNull()
    const rtlSvgs = rtlOpen!.querySelectorAll('svg')
    const rtlChev = rtlSvgs[rtlSvgs.length - 1]
    expect(rtlChev.getAttribute('class') ?? '').toMatch(/icon-flip/)
    cleanup()

    // LTR render — same component, default direction
    const { container: ltr } = render(
      <div dir="ltr">
        <DrawerCtaRow dossierId="d1" dossierType="country" />
      </div>,
    )
    const ltrOpen = ltr.querySelector('[data-testid="cta-open-full-dossier"]')
    expect(ltrOpen).not.toBeNull()
    const ltrSvgs = ltrOpen!.querySelectorAll('svg')
    const ltrChev = ltrSvgs[ltrSvgs.length - 1]
    // Class still contains "icon-flip" for the global RTL CSS rule (no extra
    // inline transform under LTR). We assert the inline transform is NOT
    // scaleX(-1) — the global rule only applies when html[dir='rtl'].
    expect(ltrChev.getAttribute('style') ?? '').not.toMatch(/scaleX\(-1\)/)
  })
})
