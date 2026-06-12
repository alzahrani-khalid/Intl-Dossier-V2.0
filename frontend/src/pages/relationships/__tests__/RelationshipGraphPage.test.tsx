import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mocks (must be declared before importing the component under test) ---

const translationNamespaces: Array<string | undefined> = []

vi.mock('react-i18next', () => ({
  useTranslation: (
    ns?: string,
  ): {
    i18n: { language: string }
    t: (key: string, defaultValue?: string | Record<string, unknown>) => string
  } => {
    translationNamespaces.push(ns)

    return {
      i18n: { language: 'en' },
      t: (key: string, defaultValue?: string | Record<string, unknown>): string => {
        const map: Record<string, string> = {
          'graph:noDossier': 'GRAPH_NAMESPACE_NO_DOSSIER',
          'graph:title': 'Relationship graph',
          'graph:description': 'Explore connections between entities',
          'graph:maxDegrees': 'Degrees of separation',
          'graph:degree': 'degree',
          'graph:degrees': 'degrees',
          'graph:relationshipType': 'Relationship type',
          'graph:allTypes': 'All types',
          'graph:refresh': 'Refresh',
          'graph:complexity.label': 'Complexity',
          'graph:complexity.simple': 'Simple',
          'graph:basicMode': 'Basic',
          'graph:enhancedMode': 'Enhanced',
          'graph:advancedMode': 'Advanced',
          'graph:nodes': 'Entities',
          'graph:edges': 'Relationships',
          'graph:maxDegree': 'Max degree',
          'graph:queryTime': 'Query time',
          'graph:error': 'Failed to load graph data',
          'graph:graphView': 'Graph view',
          'graph:listView': 'List view',
          'graph:browseDossiers': 'Browse dossiers',
          'graph:relationship.member_of': 'Member of',
          'graph:relationship.participates_in': 'Participates in',
          'graph:relationship.cooperates_with': 'Cooperates with',
          'graph:relationship.bilateral_relation': 'Bilateral relation',
          'graph:relationship.partnership': 'Partnership',
          'graph:relationship.parent_of': 'Parent of',
          'graph:relationship.subsidiary_of': 'Subsidiary of',
          'graph:relationship.related_to': 'Related to',
          'graph:relationship.represents': 'Represents',
          'graph:relationship.hosted_by': 'Hosted by',
          'graph:relationship.sponsored_by': 'Sponsored by',
          'graph:relationship.involves': 'Involves',
          'graph:relationship.discusses': 'Discusses',
          'graph:relationship.participant_in': 'Participant in',
          'graph:relationship.observer_of': 'Observer of',
          'graph:relationship.affiliate_of': 'Affiliate of',
          'graph:relationship.successor_of': 'Successor of',
          'graph:relationship.predecessor_of': 'Predecessor of',
        }

        const namespacedKey = ns ? `${ns}:${key}` : key
        if (map[namespacedKey] !== undefined) return map[namespacedKey]

        if (typeof defaultValue === 'string') return defaultValue
        if (
          defaultValue !== undefined &&
          defaultValue !== null &&
          'defaultValue' in defaultValue &&
          typeof defaultValue.defaultValue === 'string'
        ) {
          return defaultValue.defaultValue
        }

        return namespacedKey
      },
    }
  },
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

let searchValue: { dossierId?: string } = {}
const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }): ReactNode => (
    <a href={to}>{children}</a>
  ),
  getRouteApi: (): { useSearch: () => { dossierId?: string } } => ({
    useSearch: (): { dossierId?: string } => searchValue,
  }),
  useNavigate: (): typeof navigateMock => navigateMock,
  useSearch: (): { dossierId?: string } => searchValue,
}))

const useQueryMock = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]): unknown => useQueryMock(...args),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('@/components/relationships/GraphVisualization', () => ({
  GraphVisualization: (): ReactNode => <div data-testid="basic-graph">Basic graph</div>,
}))

vi.mock('@/components/relationships/EnhancedGraphVisualization', () => ({
  EnhancedGraphVisualization: (): ReactNode => (
    <div data-testid="enhanced-graph">Enhanced graph</div>
  ),
}))

vi.mock('@/components/relationships/AdvancedGraphVisualization', () => ({
  AdvancedGraphVisualization: (): ReactNode => (
    <div data-testid="advanced-graph">Advanced graph</div>
  ),
}))

vi.mock('@/components/relationships/RelationshipNavigator', () => ({
  RelationshipNavigator: (): ReactNode => <div data-testid="relationship-list">List</div>,
}))

import { RelationshipGraphPage } from '../RelationshipGraphPage'

const graphData = {
  start_dossier_id: 'a0000000-0000-0000-0000-000000000404',
  start_dossier: {
    id: 'a0000000-0000-0000-0000-000000000404',
    type: 'working_group',
    name_en: 'Working Group A',
    name_ar: 'مجموعة العمل أ',
    status: 'active',
  },
  max_degrees: 2,
  relationship_type_filter: 'all',
  nodes: [
    {
      id: 'b0000001-0000-0000-0000-000000000001',
      type: 'country',
      name_en: 'Partner Country',
      name_ar: 'دولة شريكة',
      status: 'active',
      degree: 1,
      path: ['cooperates_with'],
    },
  ],
  edges: [
    {
      source_id: 'a0000000-0000-0000-0000-000000000404',
      target_id: 'b0000001-0000-0000-0000-000000000001',
      relationship_type: 'cooperates_with',
    },
  ],
  stats: {
    node_count: 2,
    edge_count: 1,
    max_degree: 1,
    query_time_ms: 12,
    performance_warning: null,
  },
}

describe('RelationshipGraphPage', () => {
  beforeEach(() => {
    cleanup()
    searchValue = {}
    navigateMock.mockReset()
    translationNamespaces.length = 0
    useQueryMock.mockReset()
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('renders an actionable no-dossier state with a dossiers link', () => {
    render(<RelationshipGraphPage />)

    expect(screen.getByText('GRAPH_NAMESPACE_NO_DOSSIER')).toBeTruthy()

    const browseLink = screen.getByRole('link', { name: 'Browse dossiers' })
    expect(browseLink.getAttribute('href')).toBe('/dossiers')
  })

  it('renders graph chrome for a selected dossier without redirecting', () => {
    searchValue = { dossierId: 'a0000000-0000-0000-0000-000000000404' }
    useQueryMock.mockReturnValue({
      data: graphData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<RelationshipGraphPage />)

    expect(screen.getByRole('heading', { name: 'Relationship graph' })).toBeTruthy()
    expect(screen.getByText('Degrees of separation')).toBeTruthy()
    expect(screen.getByText('Relationship type')).toBeTruthy()
    expect(screen.getByTestId('advanced-graph')).toBeTruthy()
  })

  it('requests the graph namespace with bare translation keys', () => {
    render(<RelationshipGraphPage />)

    expect(translationNamespaces).toContain('graph')
    expect(screen.getByText('GRAPH_NAMESPACE_NO_DOSSIER')).toBeTruthy()
  })
})
