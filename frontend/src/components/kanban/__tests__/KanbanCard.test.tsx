import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { KanbanCard } from '../KanbanCard'
import { KanbanContext } from '../KanbanProvider'

type SortableState = {
  isDragging: boolean
}

let sortableState: SortableState = { isDragging: false }

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: (): {
    attributes: Record<string, never>
    listeners: Record<string, never>
    setNodeRef: (node: HTMLElement | null) => void
    transition: string
    transform: null
    isDragging: boolean
  } => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transition: '',
    transform: null,
    isDragging: sortableState.isDragging,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (): string => '',
    },
  },
}))

function renderCard(children?: ReactNode): ReturnType<typeof render> {
  return render(
    <KanbanContext.Provider
      value={{
        activeCardId: 'card-1',
        columns: [{ id: 'todo', name: 'To do' }],
        data: [{ id: 'card-1', name: 'Prepare brief', column: 'todo' }],
      }}
    >
      <KanbanCard id="card-1" name="Prepare brief" column="todo">
        {children}
      </KanbanCard>
    </KanbanContext.Provider>,
  )
}

afterEach((): void => {
  cleanup()
  sortableState = { isDragging: false }
})

describe('KanbanCard', () => {
  it('applies hover:bg-surface-raised hover:border-line-soft', (): void => {
    const { container } = renderCard()
    const card = container.querySelector('[class*="cursor-grab"]') as HTMLElement

    expect(card).toHaveClass('hover:bg-surface-raised')
    expect(card).toHaveClass('hover:border-line-soft')
  })

  it('does not apply any hover shadow utility', (): void => {
    const { container } = renderCard()

    expect(container.innerHTML).not.toMatch(/hover:shadow-/)
    expect(container.innerHTML).not.toMatch(/shadow-sm/)
  })

  it('applies opacity-30 and cursor-grabbing while the source card is dragging', (): void => {
    sortableState = { isDragging: true }
    const { container } = renderCard(<span>Prepare brief</span>)
    const card = container.querySelector('[class*="cursor-grab"]') as HTMLElement

    expect(card).toHaveClass('opacity-30')
    expect(card).toHaveClass('cursor-grabbing')
  })
})

void ({} as ReactElement)
