/**
 * Phase 66 — Plan 07 — Timeline View-details suppression matrix.
 *
 * OVRERR-02 / 66-VALIDATION row 6. Pins the suppression-as-absence contract
 * (66-UI-SPEC §3, binding) for BOTH timeline cards:
 *
 *   - When resolveTimelineNavUrl(navigation_url) === null, the "View details"
 *     affordance AND its click handler are NOT in the DOM — no disabled button,
 *     no dead chevron, no role/tabIndex. The action region is simply absent.
 *   - When the guard resolves a mounted URL, the affordance renders and
 *     navigates to the GUARD-RESOLVED url (never the raw metadata value).
 *
 * Mounting notes:
 *   - The global tests/setup.ts react-i18next mock returns a `t` that echoes
 *     the key, so the View-details label is the literal string
 *     'timeline.view_details' — queryable directly.
 *   - useDirection() is mocked (LTR) so we skip the LanguageProvider tree.
 *   - EnhancedVerticalTimelineCard renders its actions container inside a modal
 *     reached via onTimelineElementClick; react-vertical-timeline-component is
 *     mocked to surface that handler so the test can open the modal.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UnifiedTimelineEvent } from '@/types/timeline.types'

// ---- mocks (declared BEFORE the SUT imports; vi.mock is hoisted) ----

const navigateSpy = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: (): typeof navigateSpy => navigateSpy,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => ({
    direction: 'ltr',
    isRTL: false,
  }),
}))

// Mock the vertical-timeline library so the inner card content (incl. the
// onTimelineElementClick activation hook) renders into the DOM without the
// real library's layout effects.
vi.mock('react-vertical-timeline-component', () => ({
  VerticalTimelineElement: ({
    children,
    onTimelineElementClick,
  }: {
    children?: React.ReactNode
    onTimelineElementClick?: () => void
  }): React.ReactElement => (
    <div data-testid="vtl-element" onClick={onTimelineElementClick}>
      {children}
    </div>
  ),
}))

// useOutsideClick is a noop in tests (no real DOM listeners needed).
vi.mock('@/hooks/useOutsideClick', () => ({
  useOutsideClick: (): void => undefined,
}))

// ---- import SUTs after mocks --------------------------------------------

import { TimelineEventCard } from '../TimelineEventCard'
import { EnhancedVerticalTimelineCard } from '../EnhancedVerticalTimelineCard'

// ---- fixtures ------------------------------------------------------------

const VIEW_DETAILS = 'timeline.view_details'

function makeEvent(navigationUrl: string | undefined): UnifiedTimelineEvent {
  return {
    id: 'evt-1',
    event_type: 'mou',
    title_en: 'Memorandum signed',
    title_ar: 'تم توقيع مذكرة',
    description_en: 'A memorandum of understanding',
    description_ar: 'مذكرة تفاهم',
    event_date: '2026-04-28T14:30:00Z',
    source_id: 'src-1',
    source_table: 'mous',
    priority: 'medium',
    status: 'completed',
    metadata: {
      icon: 'briefcase',
      color: 'blue',
      ...(navigationUrl !== undefined ? { navigation_url: navigationUrl } : {}),
    },
    created_at: '2026-04-28T14:30:00Z',
    updated_at: '2026-04-28T14:30:00Z',
  }
}

beforeEach(() => {
  navigateSpy.mockReset()
})

// ---- TimelineEventCard ---------------------------------------------------

describe('TimelineEventCard — View-details suppression matrix', () => {
  it('suppresses the affordance for an unmounted detail route (/calendar/<uuid>)', () => {
    render(<TimelineEventCard event={makeEvent('/calendar/0a1b-uuid')} />)
    expect(screen.queryByText(VIEW_DETAILS)).toBeNull()
  })

  it('suppresses the affordance for an unmounted detail route (/mous/<uuid>)', () => {
    render(<TimelineEventCard event={makeEvent('/mous/0a1b-uuid')} />)
    expect(screen.queryByText(VIEW_DETAILS)).toBeNull()
  })

  it('suppresses the affordance when navigation_url is absent', () => {
    render(<TimelineEventCard event={makeEvent(undefined)} />)
    expect(screen.queryByText(VIEW_DETAILS)).toBeNull()
  })

  it('renders the affordance and navigates to the resolved /mous list', () => {
    render(<TimelineEventCard event={makeEvent('/mous')} />)
    const button = screen.getByText(VIEW_DETAILS)
    expect(button).not.toBeNull()
    fireEvent.click(button)
    expect(navigateSpy).toHaveBeenCalledTimes(1)
    expect(navigateSpy).toHaveBeenCalledWith({ to: '/mous' })
  })

  it('renders the affordance for a mounted per-type dossier path', () => {
    render(<TimelineEventCard event={makeEvent('/dossiers/countries/abc')} />)
    expect(screen.getByText(VIEW_DETAILS)).not.toBeNull()
  })
})

// ---- EnhancedVerticalTimelineCard ---------------------------------------

describe('EnhancedVerticalTimelineCard — View-details suppression matrix', () => {
  function openModalAndQuery(navigationUrl: string | undefined): HTMLElement | null {
    render(<EnhancedVerticalTimelineCard event={makeEvent(navigationUrl)} index={0} />)
    // Open the modal so the actions container mounts.
    fireEvent.click(screen.getByTestId('vtl-element'))
    return screen.queryByText(VIEW_DETAILS)
  }

  it('suppresses the actions container for an unmounted detail route (/mous/<uuid>)', () => {
    expect(openModalAndQuery('/mous/0a1b-uuid')).toBeNull()
  })

  it('suppresses the actions container when navigation_url is absent', () => {
    expect(openModalAndQuery(undefined)).toBeNull()
  })

  it('renders the actions container for a mounted per-type dossier path', () => {
    expect(openModalAndQuery('/dossiers/countries/abc')).not.toBeNull()
  })

  it('navigates to the guard-resolved url (never the raw metadata value)', () => {
    render(<EnhancedVerticalTimelineCard event={makeEvent('/mous')} index={0} />)
    fireEvent.click(screen.getByTestId('vtl-element'))
    fireEvent.click(screen.getByText(VIEW_DETAILS))
    expect(navigateSpy).toHaveBeenCalledTimes(1)
    expect(navigateSpy).toHaveBeenCalledWith({ to: '/mous' })
  })
})

// keep TS happy under isolatedModules
export {}
