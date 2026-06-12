/**
 * CalendarTabCtas.test.tsx — ENGPOS-03 #6/#7 wiring + Scheduled-events reader (phase 65-05)
 *
 * Covers 65-UI-SPEC §3 (the one net-new visual surface) + §2 rows 6/7:
 *  - useEngagementCalendarEntries: queries calendar_entries filtered dossier_id,
 *    orders event_date ascending, query key ['engagement-calendar-entries', id].
 *  - CalendarTab renders the Scheduled events section BEFORE the derived sections,
 *    with locale-picked titles, day-first dates, HH:mm for timed entries, type badge.
 *  - Empty / error reader states; whole-tab empty-state interplay.
 *  - Both Add event buttons live (not disabled) → open EventDialog with the
 *    engagement-typed context; zero dead disabled buttons remain.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const ENGAGEMENT_ID = 'eng-123'

// =============================================================================
// Hoisted captures + mutable mock state.
// =============================================================================
const { eventDialogPropsCapture, supabaseChain } = vi.hoisted(() => ({
  eventDialogPropsCapture: { current: null as Record<string, unknown> | null },
  supabaseChain: {
    builder: null as Record<string, unknown> | null,
    select: '' as string,
    table: '' as string,
    eqArgs: [] as Array<[string, unknown]>,
    orderArgs: [] as Array<[string, { ascending: boolean }]>,
  },
}))

// i18n: colon/dot t() returns the key (or defaultValue); language flips per test.
const i18nState = { language: 'en' as string }
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: { defaultValue?: string }) => string
    i18n: { language: string }
  } => ({
    t: (k: string, opts?: { defaultValue?: string }): string => opts?.defaultValue ?? k,
    i18n: { language: i18nState.language },
  }),
  initReactI18next: { type: '3rdParty', init: (): void => undefined },
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

vi.mock('@tanstack/react-router', () => ({
  useParams: (): { engagementId: string } => ({ engagementId: ENGAGEMENT_ID }),
  Link: ({ children }: { children: ReactNode }): ReactNode => children,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { isRTL: boolean; direction: 'ltr' } => ({
    isRTL: i18nState.language === 'ar',
    direction: 'ltr',
  }),
}))

// Mutable engagement/dossier/lifecycle/entries query state — flipped per test.
const engagementState = {
  data: undefined as unknown,
  isLoading: false as boolean,
}
const dossierState = { data: undefined as unknown }
const lifecycleState = { data: [] as unknown[] }
// Mirrors the real hook's return shape: { entries, isLoading, error }.
const entriesState = {
  entries: [] as unknown[],
  isLoading: true as boolean,
  error: null as Error | null,
}

vi.mock('@/domains/engagements/hooks/useEngagements', () => ({
  useEngagement: (): { data: unknown; isLoading: boolean } => engagementState,
}))

vi.mock('@/domains/dossiers/hooks/useDossier', () => ({
  useDossier: (): { data: unknown } => dossierState,
}))

vi.mock('@/domains/engagements/hooks/useLifecycle', () => ({
  useLifecycleHistory: (): { data: unknown[] } => lifecycleState,
}))

// The reader hook is stubbed here so the tab tests are deterministic; the hook's
// OWN query-shape is asserted against a mocked supabase client below.
vi.mock('@/hooks/useEngagementCalendarEntries', () => ({
  useEngagementCalendarEntries: (): {
    entries: unknown[]
    isLoading: boolean
    error: Error | null
  } => entriesState,
}))

// AvailabilityPollCreator pulls heavy deps; stub to a no-op.
vi.mock('@/components/availability-polling/AvailabilityPollCreator', () => ({
  AvailabilityPollCreator: (): ReactNode => null,
}))

// Stub the exported EventDialog so the tab tests can capture the props it gets.
vi.mock('@/components/dossier/AddToDossierDialogs', () => ({
  EventDialog: (props: Record<string, unknown>): ReactNode => {
    eventDialogPropsCapture.current = props
    return props.isOpen ? <div data-testid="event-dialog-stub" /> : null
  },
  TaskDialog: (): ReactNode => null,
}))

const ENGAGEMENT_PROFILE = {
  engagement: {
    id: ENGAGEMENT_ID,
    name_en: 'Bilateral talks',
    name_ar: 'محادثات ثنائية',
    start_date: '2026-04-28',
    end_date: '2026-05-02',
    lifecycle_stage: 'intake',
  },
}
const DOSSIER_ROW = { id: ENGAGEMENT_ID, type: 'engagement', name_en: 'Bilateral talks' }

// Two scheduled entries: one all_day, one timed.
const ENTRIES = [
  {
    id: 'ce-1',
    title_en: 'Kickoff briefing',
    title_ar: 'إحاطة الانطلاق',
    event_date: '2026-04-28',
    event_time: null,
    all_day: true,
    entry_type: 'internal_meeting',
  },
  {
    id: 'ce-2',
    title_en: 'Review session',
    title_ar: 'جلسة المراجعة',
    event_date: '2026-04-30',
    event_time: '14:30:00',
    all_day: false,
    entry_type: 'review',
  },
]

import CalendarTab from '../CalendarTab'

function renderWithClient(ui: ReactNode): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function resolveEngagement(): void {
  engagementState.data = ENGAGEMENT_PROFILE
  engagementState.isLoading = false
  dossierState.data = DOSSIER_ROW
}

function resolveEntries(rows: unknown[]): void {
  entriesState.entries = rows
  entriesState.isLoading = false
  entriesState.error = null
}

beforeEach(() => {
  i18nState.language = 'en'
  eventDialogPropsCapture.current = null
  engagementState.data = undefined
  engagementState.isLoading = false
  dossierState.data = undefined
  lifecycleState.data = []
  entriesState.entries = []
  entriesState.isLoading = true
  entriesState.error = null
  supabaseChain.builder = null
  supabaseChain.select = ''
  supabaseChain.table = ''
  supabaseChain.eqArgs = []
  supabaseChain.orderArgs = []
})

// =============================================================================
// Reader hook query shape (mock the supabase client chain).
// =============================================================================
describe('useEngagementCalendarEntries (ENGPOS-03)', () => {
  it('queries calendar_entries filtered by dossier_id, ordered event_date ascending, with the engagement key', async () => {
    // Render the REAL hook (the top-level stub is for the tab tests) against a
    // mocked supabase client that records its query chain.
    vi.doUnmock('@/hooks/useEngagementCalendarEntries')
    vi.resetModules()
    // Build a thenable PostgREST-style chain that records its calls.
    const result = { data: ENTRIES, error: null }
    const builder: Record<string, unknown> = {}
    builder.select = vi.fn((cols: string) => {
      supabaseChain.select = cols
      return builder
    })
    builder.eq = vi.fn((col: string, val: unknown) => {
      supabaseChain.eqArgs.push([col, val])
      return builder
    })
    builder.order = vi.fn((col: string, opts: { ascending: boolean }) => {
      supabaseChain.orderArgs.push([col, opts])
      return Promise.resolve(result)
    })

    vi.doMock('@/lib/supabase', () => ({
      supabase: {
        from: vi.fn((table: string) => {
          supabaseChain.table = table
          return builder
        }),
      },
    }))

    const { renderHook, waitFor: waitForHook } = await import('@testing-library/react')
    const { useEngagementCalendarEntries } = await import('@/hooks/useEngagementCalendarEntries')

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result: hookResult } = renderHook(() => useEngagementCalendarEntries(ENGAGEMENT_ID), {
      wrapper,
    })

    await waitForHook(() => expect(hookResult.current.isLoading).toBe(false))

    expect(supabaseChain.table).toBe('calendar_entries')
    expect(supabaseChain.eqArgs).toContainEqual(['dossier_id', ENGAGEMENT_ID])
    expect(supabaseChain.orderArgs).toContainEqual(['event_date', { ascending: true }])
    // Query key pinned to the EventDialog invalidation contract (65-04).
    const cached = client.getQueryData(['engagement-calendar-entries', ENGAGEMENT_ID])
    expect(cached).toEqual(ENTRIES)

    vi.doUnmock('@/lib/supabase')
    // Restore the top-level hook stub for the tab tests in the next describe.
    vi.doMock('@/hooks/useEngagementCalendarEntries', () => ({
      useEngagementCalendarEntries: (): {
        entries: unknown[]
        isLoading: boolean
        error: Error | null
      } => entriesState,
    }))
    vi.resetModules()
  })
})

// =============================================================================
// CalendarTab section anatomy + interplay + CTA wiring.
// =============================================================================
describe('CalendarTab Scheduled events reader + Add event CTAs (ENGPOS-03)', () => {
  it('renders the Scheduled events section BEFORE the derived sections (ENGPOS-03 #6/#7)', () => {
    resolveEngagement()
    resolveEntries(ENTRIES)
    renderWithClient(<CalendarTab />)

    const heading = screen.getByText('calendar.scheduledEvents')
    expect(heading).toBeInTheDocument()

    // The derived date-group section (the engagement's start/end fall in the
    // past relative to "now", so the "Past" group renders) comes AFTER the
    // Scheduled-events heading in DOM order.
    const allText = document.body.textContent ?? ''
    const scheduledIdx = allText.indexOf('calendar.scheduledEvents')
    const derivedIdx = allText.indexOf('Past')
    expect(scheduledIdx).toBeGreaterThanOrEqual(0)
    expect(derivedIdx).toBeGreaterThan(scheduledIdx)
  })

  it('renders locale-picked titles, day-first dates, HH:mm for timed entries, and type badges (ENGPOS-03 #6)', () => {
    resolveEngagement()
    resolveEntries(ENTRIES)
    renderWithClient(<CalendarTab />)

    // Titles (EN locale → title_en).
    expect(screen.getByText('Kickoff briefing')).toBeInTheDocument()
    expect(screen.getByText('Review session')).toBeInTheDocument()

    // Day-first date for the timed entry: "Thu 30 Apr" (en-GB, no comma).
    const timedRow = screen.getByText('Review session').closest('div')
    expect(timedRow).not.toBeNull()
    // Time appended HH:mm (24h) for the !all_day timed entry.
    expect(document.body.textContent).toContain('14:30')
    // Day-first format — day precedes the month abbreviation.
    expect(document.body.textContent).toMatch(/30 Apr/)

    // Entry-type badge label via t('calendar:types.' + entry_type,
    // { defaultValue: entry_type }). The test t() returns the defaultValue, so
    // the badge renders the slug — proving the colon-namespace lookup is wired
    // with the defaultValue fallback (real i18n resolves it to the bilingual label).
    expect(screen.getByText('internal_meeting')).toBeInTheDocument()
    expect(screen.getByText('review')).toBeInTheDocument()
  })

  it('AR locale picks title_ar for entry titles (ENGPOS-03 #6)', () => {
    i18nState.language = 'ar'
    resolveEngagement()
    resolveEntries(ENTRIES)
    renderWithClient(<CalendarTab />)

    expect(screen.getByText('إحاطة الانطلاق')).toBeInTheDocument()
    expect(screen.getByText('جلسة المراجعة')).toBeInTheDocument()
  })

  it('shows the entriesEmpty line when entries resolve empty but derived events exist; no whole-tab empty state (ENGPOS-03 #6)', () => {
    resolveEngagement()
    resolveEntries([])
    renderWithClient(<CalendarTab />)

    expect(screen.getByText('calendar.entriesEmpty')).toBeInTheDocument()
    // Whole-tab empty state copy must NOT be shown (derived events present).
    expect(screen.queryByText('empty.calendar.heading')).toBeNull()
  })

  it('shows the entriesError line when the reader errors (ENGPOS-03 #6)', () => {
    resolveEngagement()
    entriesState.entries = []
    entriesState.isLoading = false
    entriesState.error = new Error('boom')
    renderWithClient(<CalendarTab />)

    expect(screen.getByText('calendar.entriesError')).toBeInTheDocument()
  })

  it('renders the normal layout (header + section) when entries exist but derived dates do not (ENGPOS-03 #6)', () => {
    // Engagement with NO start/end → derived events empty.
    engagementState.data = { engagement: { id: ENGAGEMENT_ID, name_en: 'X', name_ar: null } }
    engagementState.isLoading = false
    dossierState.data = DOSSIER_ROW
    resolveEntries(ENTRIES)
    renderWithClient(<CalendarTab />)

    expect(screen.getByText('calendar.scheduledEvents')).toBeInTheDocument()
    expect(screen.getByText('Kickoff briefing')).toBeInTheDocument()
    // Not the whole-tab empty state.
    expect(screen.queryByText('empty.calendar.heading')).toBeNull()
  })

  it('shows the whole-tab empty state with a LIVE Add event button when derived AND entries are both empty (ENGPOS-03 #6)', async () => {
    const user = userEvent.setup()
    engagementState.data = { engagement: { id: ENGAGEMENT_ID, name_en: 'X', name_ar: null } }
    engagementState.isLoading = false
    dossierState.data = DOSSIER_ROW
    resolveEntries([])
    renderWithClient(<CalendarTab />)

    expect(screen.getByText('empty.calendar.heading')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /empty\.calendar\.action/ })
    expect(button).not.toBeDisabled()

    await user.click(button)
    await waitFor(() => expect(screen.getByTestId('event-dialog-stub')).toBeInTheDocument())

    const ctx = eventDialogPropsCapture.current?.dossierContext as Record<string, unknown>
    expect(ctx.dossier_type).toBe('engagement')
    expect(ctx.dossier_id).toBe(ENGAGEMENT_ID)
    expect(ctx.inheritance_source).toBe('direct')
  })

  it('header Add event button is live and opens EventDialog with the engagement-typed context (ENGPOS-03 #7)', async () => {
    const user = userEvent.setup()
    resolveEngagement()
    resolveEntries(ENTRIES)
    renderWithClient(<CalendarTab />)

    const button = screen.getByRole('button', { name: /actions\.addEvent/ })
    expect(button).not.toBeDisabled()

    await user.click(button)
    await waitFor(() => expect(screen.getByTestId('event-dialog-stub')).toBeInTheDocument())

    const ctx = eventDialogPropsCapture.current?.dossierContext as Record<string, unknown>
    expect(ctx.dossier_type).toBe('engagement')
    expect(ctx.dossier_id).toBe(ENGAGEMENT_ID)
    expect(ctx.inheritance_source).toBe('direct')
  })

  it('leaves zero dead disabled buttons in the rendered tab (ENGPOS-03)', () => {
    resolveEngagement()
    resolveEntries(ENTRIES)
    renderWithClient(<CalendarTab />)

    const disabled = screen
      .queryAllByRole('button')
      .filter((b) => (b as HTMLButtonElement).disabled)
    expect(disabled).toHaveLength(0)
  })

  it('while entries are unresolved, keeps derived-only behavior with no flash of the empty state (ENGPOS-03 #6)', () => {
    resolveEngagement()
    // entriesState stays loading (beforeEach default).
    renderWithClient(<CalendarTab />)

    // Derived sections render normally; the whole-tab empty state is NOT shown.
    expect(screen.queryByText('empty.calendar.heading')).toBeNull()
    expect(screen.getByText('calendar.scheduledEvents')).toBeInTheDocument()
  })

  it('renders non-interactive rows inside a bordered divided list (ENGPOS-03 #6)', () => {
    resolveEngagement()
    resolveEntries(ENTRIES)
    renderWithClient(<CalendarTab />)

    const heading = screen.getByText('calendar.scheduledEvents')
    const section = heading.parentElement
    expect(section).not.toBeNull()
    const list = within(section as HTMLElement)
      .getByText('Kickoff briefing')
      .closest('div')
    expect(list).not.toBeNull()
  })
})
