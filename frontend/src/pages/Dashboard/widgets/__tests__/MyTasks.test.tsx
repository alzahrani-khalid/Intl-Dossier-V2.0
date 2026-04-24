/**
 * Phase 38 Plan 07 — MyTasks widget unit tests.
 *
 * Verifies:
 *  - rows render from useTasks with assignee_id filter
 *  - clicking checkbox triggers update mutation with status=completed
 *  - completed tasks render with line-through + opacity-60
 *  - due chip uses i18n keys (myTasks.due.today / myTasks.due.overdue)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement } from 'react'

import { MyTasks } from '../MyTasks'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): { user: { id: string } } => ({ user: { id: 'u1' } }),
}))

const mutateAsync = vi.fn().mockResolvedValue({})
vi.mock('@/hooks/useTasks', () => ({
  useTasks: vi.fn(),
  useUpdateTask: (): { mutateAsync: typeof mutateAsync } => ({ mutateAsync }),
  tasksKeys: { myTasks: (): string[] => ['tasks', 'my-tasks'] },
}))

vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: (props: { iso?: string; type: string }): ReactElement => (
    <span data-testid="glyph" data-iso={props.iso ?? ''} data-type={props.type} />
  ),
}))

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
    t: (key: string): string => key,
    i18n: { language: 'en' },
  }),
}))

import { useTasks } from '@/hooks/useTasks'

const today = new Date()
const yesterday = new Date(Date.now() - 86_400_000)

const mockTasks = [
  {
    id: 't1',
    title: 'Task 1',
    assignee_id: 'u1',
    sla_deadline: today.toISOString(),
    priority: 'medium',
    status: 'pending',
    work_item_type: 'dossier',
    work_item_id: 'sa',
  },
  {
    id: 't2',
    title: 'Task 2',
    assignee_id: 'u1',
    sla_deadline: yesterday.toISOString(),
    priority: 'high',
    status: 'pending',
    work_item_type: 'dossier',
    work_item_id: 'qa',
  },
  {
    id: 't3',
    title: 'Task 3',
    assignee_id: 'u1',
    sla_deadline: today.toISOString(),
    priority: 'low',
    status: 'completed',
    work_item_type: 'dossier',
    work_item_id: 'ae',
  },
]

describe('MyTasks', (): void => {
  beforeEach((): void => {
    mutateAsync.mockClear()
  })

  it('renders rows from useTasks', (): void => {
    vi.mocked(useTasks).mockReturnValue({
      data: { tasks: mockTasks, total_count: 3, page: 1, page_size: 25 },
      isLoading: false,
      isError: false,
    } as never)

    const { container } = render(<MyTasks />)
    expect(container.querySelectorAll('.task-row')).toHaveLength(3)
    expect(screen.getByText('Task 1')).toBeTruthy()
    expect(screen.getByText('Task 2')).toBeTruthy()
  })

  it('clicking checkbox triggers update mutation with status=completed', (): void => {
    vi.mocked(useTasks).mockReturnValue({
      data: { tasks: mockTasks, total_count: 3, page: 1, page_size: 25 },
      isLoading: false,
      isError: false,
    } as never)

    render(<MyTasks />)
    const boxes = screen.getAllByRole('checkbox')
    fireEvent.click(boxes[0])

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 't1',
        data: expect.objectContaining({ status: 'completed' }),
      }),
    )
  })

  it('completed task renders with line-through + opacity-60', (): void => {
    vi.mocked(useTasks).mockReturnValue({
      data: { tasks: mockTasks, total_count: 3, page: 1, page_size: 25 },
      isLoading: false,
      isError: false,
    } as never)

    const { container } = render(<MyTasks />)
    const rows = container.querySelectorAll('.task-row')
    expect(rows[2].className).toMatch(/line-through/)
    expect(rows[2].className).toMatch(/opacity-60/)
    expect(rows[0].className).not.toMatch(/line-through/)
  })

  it('due chip uses myTasks.due.* i18n keys', (): void => {
    vi.mocked(useTasks).mockReturnValue({
      data: {
        tasks: [mockTasks[0], mockTasks[1]],
        total_count: 2,
        page: 1,
        page_size: 25,
      },
      isLoading: false,
      isError: false,
    } as never)

    render(<MyTasks />)
    expect(screen.getByText('myTasks.due.today')).toBeTruthy()
    expect(screen.getByText('myTasks.due.overdue')).toBeTruthy()
  })
})
