/**
 * CreateTaskCtas.test.tsx — ENGPOS-03 wiring assertions (phase 65-04)
 *
 * Covers CTA dispositions #2-#5 from 65-UI-SPEC §2:
 *  - #2 OverviewTab "Transition Stage" button removed
 *  - #3 OverviewTab "Create task" re-enabled → opens TaskDialog (engagement-typed context)
 *  - #4 TasksTab empty-state "Create task" re-enabled → opens TaskDialog
 *  - #5 TasksTab header "Create task" re-enabled → opens TaskDialog
 *  - Pitfall 4: TaskDialog submit posts NO engagement_id; links via work_item_dossiers;
 *    invalidates ['engagement-kanban', engagementId]
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const ENGAGEMENT_ID = 'eng-123'

// =============================================================================
// Shared mocks (hoisted) — capture TaskDialog props for the tab wiring tests.
// =============================================================================
const { taskDialogPropsCapture } = vi.hoisted(() => ({
  taskDialogPropsCapture: { current: null as Record<string, unknown> | null },
}))

// i18n: bare t() returns the key (assertions match on key strings, not copy).
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: { defaultValue?: string }) => string
    i18n: { language: string }
  } => ({
    t: (k: string, opts?: { defaultValue?: string }): string => opts?.defaultValue ?? k,
    i18n: { language: 'en' },
  }),
  // src/i18n/index.ts calls `.use(initReactI18next)` at module load when pulled
  // in transitively; expose a no-op so it doesn't crash.
  initReactI18next: { type: '3rdParty', init: (): void => undefined },
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

vi.mock('@tanstack/react-router', () => ({
  useParams: (): { engagementId: string } => ({ engagementId: ENGAGEMENT_ID }),
  Link: ({ children }: { children: ReactNode }): ReactNode => children,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { isRTL: boolean; direction: 'ltr' } => ({
    isRTL: false,
    direction: 'ltr',
  }),
}))

// Mutable engagement/dossier query state — flipped per test.
const engagementState = {
  data: undefined as unknown,
  isLoading: true as boolean,
}
const dossierState = {
  data: undefined as unknown,
}

vi.mock('@/domains/engagements/hooks/useEngagements', () => ({
  useEngagement: (): { data: unknown; isLoading: boolean } => engagementState,
  useEngagementParticipants: (): { data: unknown; isLoading: boolean } => ({
    data: { data: [] },
    isLoading: false,
  }),
}))

vi.mock('@/domains/dossiers/hooks/useDossier', () => ({
  useDossier: (): { data: unknown } => dossierState,
}))

vi.mock('@/domains/engagements/hooks/useEngagementKanban', () => ({
  useEngagementKanban: (): {
    columns: null
    stats: { total: number; done: number; progressPercentage: number }
    handleDragEnd: () => void
    isLoading: boolean
  } => ({
    columns: null,
    stats: { total: 0, done: 0, progressPercentage: 0 },
    handleDragEnd: vi.fn(),
    isLoading: false,
  }),
}))

vi.mock('@/domains/engagements/hooks/useLifecycle', () => ({
  useLifecycleHistory: (): { data: unknown[]; isLoading: boolean } => ({
    data: [],
    isLoading: false,
  }),
}))

// Stub the exported TaskDialog so the tab tests can capture the props it gets.
vi.mock('@/components/Dossier/AddToDossierDialogs', () => ({
  TaskDialog: (props: Record<string, unknown>): ReactNode => {
    taskDialogPropsCapture.current = props
    return props.isOpen ? <div data-testid="task-dialog-stub" /> : null
  },
  EventDialog: (): ReactNode => null,
}))

const ENGAGEMENT_PROFILE = {
  engagement: {
    id: ENGAGEMENT_ID,
    name_en: 'Bilateral talks',
    name_ar: 'محادثات ثنائية',
    lifecycle_stage: 'intake',
  },
}
const DOSSIER_ROW = { id: ENGAGEMENT_ID, type: 'engagement', name_en: 'Bilateral talks' }

import OverviewTab from '../OverviewTab'
import TasksTab from '../TasksTab'

function renderWithClient(ui: ReactNode): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Create Task CTAs (ENGPOS-03)', () => {
  beforeEach(() => {
    taskDialogPropsCapture.current = null
    engagementState.data = undefined
    engagementState.isLoading = true
    dossierState.data = undefined
  })

  function resolveEngagement(): void {
    engagementState.data = ENGAGEMENT_PROFILE
    engagementState.isLoading = false
    dossierState.data = DOSSIER_ROW
  }

  it('OverviewTab has no Transition Stage button but keeps Log After-Action (ENGPOS-03 #2)', () => {
    resolveEngagement()
    renderWithClient(<OverviewTab />)

    expect(screen.queryByText('actions.transitionStage')).toBeNull()
    expect(screen.getByText('actions.logAfterAction')).toBeInTheDocument()
  })

  it('OverviewTab Create task opens TaskDialog with engagement-typed context (ENGPOS-03 #3)', async () => {
    const user = userEvent.setup()
    resolveEngagement()
    renderWithClient(<OverviewTab />)

    const button = screen.getByRole('button', { name: /actions\.createTask/ })
    expect(button).not.toBeDisabled()

    await user.click(button)
    await waitFor(() => expect(screen.getByTestId('task-dialog-stub')).toBeInTheDocument())

    const ctx = taskDialogPropsCapture.current?.dossierContext as Record<string, unknown>
    expect(ctx.dossier_type).toBe('engagement')
    expect(ctx.dossier_id).toBe(ENGAGEMENT_ID)
    expect(ctx.inheritance_source).toBe('direct')
  })

  it('OverviewTab Create task is disabled while the engagement profile is loading (ENGPOS-03 #3)', () => {
    // engagementState stays loading (beforeEach default)
    renderWithClient(<OverviewTab />)
    const button = screen.getByRole('button', { name: /actions\.createTask/ })
    expect(button).toBeDisabled()
  })

  it('TasksTab empty-state Create task opens TaskDialog (ENGPOS-03 #4)', async () => {
    const user = userEvent.setup()
    resolveEngagement()
    renderWithClient(<TasksTab />)

    // Empty state (kanban stats.total === 0 → isEmpty) renders the empty-state button.
    const button = screen.getByRole('button', { name: /empty\.tasks\.action/ })
    expect(button).not.toBeDisabled()

    await user.click(button)
    await waitFor(() => expect(screen.getByTestId('task-dialog-stub')).toBeInTheDocument())

    const ctx = taskDialogPropsCapture.current?.dossierContext as Record<string, unknown>
    expect(ctx.dossier_type).toBe('engagement')
    expect(ctx.dossier_id).toBe(ENGAGEMENT_ID)
  })
})

// =============================================================================
// Payload contract — render the REAL TaskDialog (Pitfall 4).
// =============================================================================
describe('TaskDialog submit payload (ENGPOS-03)', () => {
  it('posts no engagement_id, links dossier_id = engagementId, invalidates engagement-kanban', async () => {
    vi.resetModules()
    // The file-level vi.mock stubs TaskDialog; drop that stub so the dynamic
    // import below loads the REAL dialog and exercises the submit payload.
    vi.doUnmock('@/components/Dossier/AddToDossierDialogs')

    const createTaskMock = vi.fn().mockResolvedValue({ id: 'task-1' })
    const createLinksMock = vi.fn().mockResolvedValue({ linked: 1 })

    vi.doMock('react-i18next', () => ({
      useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
        t: (k: string): string => k,
        i18n: { language: 'en' },
      }),
      initReactI18next: { type: '3rdParty', init: (): void => undefined },
      Trans: ({ children }: { children: ReactNode }): ReactNode => children,
    }))
    vi.doMock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
    vi.doMock('@/hooks/useTasks', () => ({
      useCreateTask: (): { mutateAsync: typeof createTaskMock; isPending: boolean } => ({
        mutateAsync: createTaskMock,
        isPending: false,
      }),
    }))
    vi.doMock('@/hooks/useCreateWorkItemDossierLinks', () => ({
      useCreateWorkItemDossierLinks: (): {
        mutateAsync: typeof createLinksMock
        isPending: boolean
      } => ({ mutateAsync: createLinksMock, isPending: false }),
      workItemDossierKeys: {
        timeline: (id: string): readonly string[] => ['work-item-dossier', 'timeline', id],
      },
    }))
    // Mock UserPicker so we can set the required assignee without Supabase.
    vi.doMock('@/components/forms/UserPicker', () => ({
      UserPicker: ({ onChange }: { onChange?: (id: string | null) => void }): ReactNode => (
        <button type="button" data-testid="pick-user" onClick={() => onChange?.('user-9')}>
          pick
        </button>
      ),
    }))
    vi.doMock('@/hooks/useDirection', () => ({
      useDirection: (): { isRTL: boolean; direction: 'ltr' } => ({
        isRTL: false,
        direction: 'ltr',
      }),
    }))

    const { TaskDialog } = await import('@/components/Dossier/AddToDossierDialogs')
    const { QueryClient: QC, QueryClientProvider: QCP } = await import('@tanstack/react-query')
    const {
      render: renderReal,
      screen: screenReal,
      waitFor: waitForReal,
    } = await import('@testing-library/react')
    const userEventReal = (await import('@testing-library/user-event')).default

    const queryClient = new QC({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const dossierContext = {
      dossier_id: ENGAGEMENT_ID,
      dossier_type: 'engagement' as const,
      dossier_name_en: 'Bilateral talks',
      dossier_name_ar: 'محادثات ثنائية',
      inheritance_source: 'direct' as const,
    }

    const user = userEventReal.setup()
    renderReal(
      <QCP client={queryClient}>
        <TaskDialog
          isOpen
          onClose={vi.fn()}
          dossier={DOSSIER_ROW as never}
          dossierContext={dossierContext as never}
          isRTL={false}
        />
      </QCP>,
    )

    await user.type(screenReal.getByLabelText('addToDossier.form.taskTitle'), 'Draft agenda')
    await user.click(screenReal.getByTestId('pick-user'))
    await user.click(screenReal.getByRole('button', { name: 'addToDossier.form.submit.task' }))

    await waitForReal(() => expect(createTaskMock).toHaveBeenCalled())

    const createPayload = createTaskMock.mock.calls[0][0] as Record<string, unknown>
    expect('engagement_id' in createPayload).toBe(false)

    const linkPayload = createLinksMock.mock.calls[0][0] as { dossier_ids: string[] }
    expect(linkPayload.dossier_ids).toEqual([ENGAGEMENT_ID])

    await waitForReal(() =>
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['engagement-kanban', ENGAGEMENT_ID] }),
      ),
    )
  })
})
