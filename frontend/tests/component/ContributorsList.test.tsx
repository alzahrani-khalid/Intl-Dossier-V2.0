import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import { ContributorsList } from '@/components/tasks/ContributorsList'
import type { Database } from '../../../../backend/src/types/database.types'

type TaskContributor = Database['public']['Tables']['task_contributors']['Row']

describe('ContributorsList', () => {
  const contributors: TaskContributor[] = [
    {
      id: 'contrib-1',
      task_id: 'task-123',
      user_id: 'user-1',
      role: 'helper',
      notes: 'Assisted with data analysis',
      added_at: '2025-01-19T10:00:00Z',
      removed_at: null,
    },
    {
      id: 'contrib-2',
      task_id: 'task-123',
      user_id: 'user-2',
      role: 'reviewer',
      notes: 'Reviewed findings',
      added_at: '2025-01-19T11:00:00Z',
      removed_at: null,
    },
    {
      id: 'contrib-3',
      task_id: 'task-123',
      user_id: 'user-3',
      role: 'advisor',
      notes: 'Provided technical guidance',
      added_at: '2025-01-19T12:00:00Z',
      removed_at: null,
    },
  ]

  beforeEach(() => {
    localStorage.removeItem('id.locale')
    vi.clearAllMocks()
  })

  it('renders active contributors with fallback avatars, roles, and notes', () => {
    render(<ContributorsList contributors={contributors} />)

    const list = screen.getByTestId('contributors-list')
    expect(list).toHaveClass('flex', 'flex-wrap', 'gap-2')
    expect(screen.getAllByText('US')).toHaveLength(3)
    expect(screen.getByText('helper')).toBeInTheDocument()
    expect(screen.getByText('reviewer')).toBeInTheDocument()
    expect(screen.getByText('advisor')).toBeInTheDocument()
    expect(screen.getByText('Assisted with data analysis')).toBeInTheDocument()
  })

  it('filters removed contributors before display', () => {
    render(
      <ContributorsList
        contributors={[
          ...contributors,
          { ...contributors[0], id: 'removed', user_id: 'removed-user', removed_at: '2025-01-20' },
        ]}
      />,
    )

    expect(screen.getAllByText('US')).toHaveLength(3)
    expect(screen.queryByText('removed-user')).not.toBeInTheDocument()
  })

  it('limits visible contributors and shows overflow count', () => {
    const manyContributors: TaskContributor[] = [
      ...contributors,
      {
        id: 'contrib-4',
        task_id: 'task-123',
        user_id: 'user-4',
        role: 'observer',
        notes: null,
        added_at: '2025-01-19T13:00:00Z',
        removed_at: null,
      },
      {
        id: 'contrib-5',
        task_id: 'task-123',
        user_id: 'user-5',
        role: 'supervisor',
        notes: null,
        added_at: '2025-01-19T14:00:00Z',
        removed_at: null,
      },
    ]

    render(<ContributorsList contributors={manyContributors} maxDisplay={3} />)

    expect(screen.getAllByText('US')).toHaveLength(3)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('shows the empty state when there are no active contributors', () => {
    render(<ContributorsList contributors={[]} />)

    expect(screen.getByTestId('contributors-list')).toHaveTextContent('No contributors yet')
  })

  it('renders and handles remove controls when enabled', () => {
    const onRemove = vi.fn()
    render(<ContributorsList contributors={contributors} showRemoveButton onRemove={onRemove} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove contributor/i })
    expect(removeButtons).toHaveLength(3)

    fireEvent.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalledWith('contrib-1')
  })

  it('hides remove controls when disabled', () => {
    render(<ContributorsList contributors={contributors} showRemoveButton={false} />)

    expect(screen.queryByRole('button', { name: /remove contributor/i })).not.toBeInTheDocument()
  })

  it('uses Arabic direction when the locale is Arabic', async () => {
    localStorage.setItem('id.locale', 'ar')

    render(<ContributorsList contributors={contributors} />)

    await waitFor(() => {
      expect(screen.getByTestId('contributors-list')).toHaveAttribute('dir', 'rtl')
    })
  })
})
