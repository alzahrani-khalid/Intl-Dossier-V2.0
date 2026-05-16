import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

import { KanbanBoard } from '../KanbanBoard'

let isOverState = false

vi.mock('@dnd-kit/core', () => ({
  useDroppable: (): { isOver: boolean; setNodeRef: (node: HTMLElement | null) => void } => ({
    isOver: isOverState,
    setNodeRef: vi.fn(),
  }),
}))

afterEach((): void => {
  cleanup()
  isOverState = false
})

describe('KanbanBoard', () => {
  it('applies ring-accent when isOver=true', (): void => {
    isOverState = true
    const { container } = render(<KanbanBoard id="todo">Column</KanbanBoard>)

    expect(container.firstElementChild).toHaveClass('ring-accent')
  })

  it('applies border-danger/30 when isCancelled=true', (): void => {
    const { container } = render(
      <KanbanBoard id="cancelled" isCancelled>
        Cancelled
      </KanbanBoard>,
    )

    expect(container.firstElementChild).toHaveClass('border-danger/30')
  })

  it('default surface is bg-muted/30 border-muted', (): void => {
    const { container } = render(<KanbanBoard id="todo">Column</KanbanBoard>)

    expect(container.firstElementChild).toHaveClass('bg-muted/30')
    expect(container.firstElementChild).toHaveClass('border-muted')
  })

  it('does not apply any shadow utility', (): void => {
    const { container } = render(<KanbanBoard id="todo">Column</KanbanBoard>)
    const className = (container.firstElementChild as HTMLElement).className

    expect(className).not.toMatch(/shadow-/)
  })
})
