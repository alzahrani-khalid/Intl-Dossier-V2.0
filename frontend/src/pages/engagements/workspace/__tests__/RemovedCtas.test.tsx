import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode, ReactElement } from 'react'

// =============================================================================
// ENGPOS-03 — removal assertions for the four unwireable workspace CTAs.
//
// The `t` mock returns the raw key, so an absence assertion is `queryByText` on
// the i18n key string (project test convention). Surviving real actions assert
// the same way (their key IS present).
//
// Mutable mock state lets each describe block shape useEngagement /
// useEngagementBriefs / useEngagementRecommendations per case.
// =============================================================================

let mockProfile: unknown = undefined
let mockBriefs: { data: unknown[] } | undefined = { data: [] }
let mockRecommendations: { data: unknown[] } | undefined = { data: [] }

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
    t: (k: string): string => k,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => ({
    direction: 'ltr',
    isRTL: false,
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  useParams: (): { engagementId: string } => ({ engagementId: 'eng-1' }),
  useMatchRoute: (): (() => boolean) => (): boolean => false,
  Link: ({ children }: { children: ReactNode }): ReactElement => <a href="#">{children}</a>,
  Outlet: (): null => null,
}))

vi.mock('@/domains/engagements/hooks/useEngagements', () => ({
  useEngagement: (): { data: unknown; isLoading: boolean } => ({
    data: mockProfile,
    isLoading: false,
  }),
}))

vi.mock('@/domains/engagements/hooks/useEngagementBriefs', () => ({
  useEngagementBriefs: (): { data: { data: unknown[] } | undefined; isLoading: boolean } => ({
    data: mockBriefs,
    isLoading: false,
  }),
  useGenerateEngagementBrief: (): { mutate: () => void; isPending: boolean } => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/domains/engagements/hooks/useEngagementRecommendations', () => ({
  useEngagementRecommendations: (): {
    data: { data: unknown[] } | undefined
    isLoading: boolean
  } => ({
    data: mockRecommendations,
    isLoading: false,
  }),
}))

// Stub heavy children so the shell renders without their internals.
vi.mock('@/components/engagements/LifecycleStepperBar', () => ({
  LifecycleStepperBar: (): ReactElement => <div data-testid="lifecycle-stepper-bar" />,
}))

vi.mock('@/components/workspace/WorkspaceTabNav', () => ({
  WorkspaceTabNav: (): ReactElement => <nav data-testid="workspace-tab-nav" />,
}))

vi.mock('@/components/ui/ltr-isolate', () => ({
  LtrIsolate: ({ children }: { children: ReactNode }): ReactElement => <div>{children}</div>,
}))

// Stub the dossier badge so populated ContextTab renders without its internals.
vi.mock('@/components/dossier', () => ({
  DossierContextBadge: (): ReactElement => <span data-testid="dossier-context-badge" />,
}))

import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import ContextTab from '../ContextTab'
import DocsTab from '../DocsTab'

beforeEach(() => {
  mockProfile = undefined
  mockBriefs = { data: [] }
  mockRecommendations = { data: [] }
})

describe('WorkspaceShell removed CTAs (ENGPOS-03)', () => {
  it('renders no Transition/Advance Stage button (ENGPOS-03 disposition #1)', () => {
    mockProfile = {
      engagement: { name_en: 'Visit', engagement_type: null, lifecycle_stage: 'intake' },
    }
    render(
      <WorkspaceShell engagementId="eng-1">
        <div>child</div>
      </WorkspaceShell>,
    )
    expect(screen.queryByText('actions.transitionStage')).toBeNull()
  })

  it('keeps the Log After-Action button and the LifecycleStepperBar (ENGPOS-03)', () => {
    mockProfile = {
      engagement: { name_en: 'Visit', engagement_type: null, lifecycle_stage: 'intake' },
    }
    render(
      <WorkspaceShell engagementId="eng-1">
        <div>child</div>
      </WorkspaceShell>,
    )
    expect(screen.getByText('actions.logAfterAction')).toBeInTheDocument()
    expect(screen.getByTestId('lifecycle-stepper-bar')).toBeInTheDocument()
  })
})

describe('ContextTab removed CTAs (ENGPOS-03)', () => {
  it('renders no Link Dossier button in the empty state (ENGPOS-03 disposition #8)', () => {
    mockProfile = { engagement: {} } // no host/participants → zero linked dossiers
    render(<ContextTab />)
    expect(screen.queryByText('empty.context.action')).toBeNull()
    // The empty heading still renders.
    expect(screen.getByText('empty.context.heading')).toBeInTheDocument()
  })

  it('renders no Link Dossier button in the populated state (ENGPOS-03 disposition #8)', () => {
    mockProfile = {
      engagement: {},
      host_country: { id: 'c-1', name_en: 'Saudi Arabia', name_ar: 'السعودية' },
    }
    render(<ContextTab />)
    expect(screen.queryByText('actions.linkDossier')).toBeNull()
    // The badge content still renders in the populated branch.
    expect(screen.getByTestId('dossier-context-badge')).toBeInTheDocument()
  })
})

describe('DocsTab removed CTAs (ENGPOS-03)', () => {
  it('renders no Upload button while the Generate Briefing button survives (ENGPOS-03 disposition #9)', () => {
    mockBriefs = {
      data: [
        {
          id: 'b-1',
          title: 'Brief',
          status: 'completed',
          brief_type: 'ai',
          has_citations: false,
          summary: '',
          created_at: '2026-06-12T00:00:00Z',
        },
      ],
    }
    render(<DocsTab />)
    expect(screen.queryByText('docs.upload')).toBeNull()
    expect(screen.getByText('actions.generateBriefing')).toBeInTheDocument()
  })

  it('renders no Upload button in the empty state while Generate Briefing survives (ENGPOS-03)', () => {
    mockBriefs = { data: [] }
    render(<DocsTab />)
    expect(screen.queryByText('docs.upload')).toBeNull()
    // Empty-state CTA label.
    expect(screen.getByText('empty.docs.action')).toBeInTheDocument()
  })
})
