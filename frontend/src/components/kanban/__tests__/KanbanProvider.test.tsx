import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { KanbanProvider } from '../KanbanProvider'

type DndEventLike = {
  active: { id: string }
  over?: { id: string } | null
}

type SensorCapture = {
  sensor: { name: string }
  opts?: unknown
}

type AnnouncementsCapture = {
  onDragStart: (event: DndEventLike) => string
  onDragOver: (event: DndEventLike) => string
  onDragEnd: (event: DndEventLike) => string
  onDragCancel: (event: DndEventLike) => string
}

let lastDndSensors: unknown[] = []
let lastDragEndHandler: ((event: DndEventLike) => void) | undefined
let lastAnnouncements: AnnouncementsCapture | undefined

vi.mock('@dnd-kit/core', () => {
  const useSensor = (sensor: unknown, opts?: unknown): SensorCapture => ({
    sensor: sensor as { name: string },
    opts,
  })
  const useSensors = (...sensors: unknown[]): unknown[] => sensors

  return {
    DndContext: ({
      children,
      sensors,
      onDragEnd,
      accessibility,
    }: {
      children: ReactNode
      sensors: unknown[]
      onDragEnd: (event: DndEventLike) => void
      accessibility?: { announcements?: AnnouncementsCapture }
    }): ReactElement => {
      lastDndSensors = sensors
      lastDragEndHandler = onDragEnd
      lastAnnouncements = accessibility?.announcements
      return <div data-testid="dnd-ctx">{children}</div>
    },
    DragOverlay: ({ children }: { children: ReactNode }): ReactElement => (
      <div data-testid="drag-overlay">{children}</div>
    ),
    KeyboardSensor: { name: 'KeyboardSensor' },
    MouseSensor: { name: 'MouseSensor' },
    TouchSensor: { name: 'TouchSensor' },
    closestCenter: vi.fn(),
    useSensor,
    useSensors,
  }
})

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: <T,>(items: T[], from: number, to: number): T[] => {
    const next = [...items]
    const [moved] = next.splice(from, 1)
    if (moved !== undefined) {
      next.splice(to, 0, moved)
    }
    return next
  },
  sortableKeyboardCoordinates: (): { x: number; y: number } => ({ x: 0, y: 0 }),
}))

afterEach((): void => {
  cleanup()
  lastDndSensors = []
  lastDragEndHandler = undefined
  lastAnnouncements = undefined
})

describe('KanbanProvider', () => {
  it('sensors include MouseSensor + TouchSensor + KeyboardSensor with D-04 activation constraints', (): void => {
    render(
      <KanbanProvider columns={[]} data={[]}>
        {() => null}
      </KanbanProvider>,
    )

    expect(lastDndSensors).toHaveLength(3)

    const mouse = lastDndSensors[0] as SensorCapture & {
      opts: { activationConstraint: { distance: number } }
    }
    expect(mouse.sensor.name).toBe('MouseSensor')
    expect(mouse.opts.activationConstraint.distance).toBe(8)

    const touch = lastDndSensors[1] as SensorCapture & {
      opts: { activationConstraint: { delay: number; tolerance: number } }
    }
    expect(touch.sensor.name).toBe('TouchSensor')
    expect(touch.opts.activationConstraint.delay).toBe(200)
    expect(touch.opts.activationConstraint.tolerance).toBe(5)

    const keyboard = lastDndSensors[2] as SensorCapture & {
      opts: { coordinateGetter: () => { x: number; y: number } }
    }
    expect(keyboard.sensor.name).toBe('KeyboardSensor')
    expect(keyboard.opts.coordinateGetter()).toEqual({ x: 0, y: 0 })
  })

  it('handleDragEnd fires user-supplied onDragEnd when active.id differs from over.id', (): void => {
    const onDragEnd = vi.fn()

    render(
      <KanbanProvider
        columns={[{ id: 'todo', name: 'To do' }]}
        data={[
          { id: 'card-1', name: 'Prepare brief', column: 'todo' },
          { id: 'card-2', name: 'Review brief', column: 'todo' },
        ]}
        onDragEnd={onDragEnd}
      >
        {() => null}
      </KanbanProvider>,
    )

    expect(typeof lastDragEndHandler).toBe('function')
    lastDragEndHandler?.({ active: { id: 'card-1' }, over: { id: 'card-2' } })

    expect(onDragEnd).toHaveBeenCalledTimes(1)
  })

  it('announcements API emits drag lifecycle strings', (): void => {
    render(
      <KanbanProvider
        columns={[{ id: 'todo', name: 'To do' }]}
        data={[{ id: 'card-1', name: 'Prepare brief', column: 'todo' }]}
      >
        {() => null}
      </KanbanProvider>,
    )

    expect(lastAnnouncements?.onDragStart({ active: { id: 'card-1' } })).toBe(
      'Picked up the card "Prepare brief" from the "todo" column',
    )
    expect(lastAnnouncements?.onDragOver({ active: { id: 'card-1' }, over: { id: 'todo' } })).toBe(
      'Dragged the card "Prepare brief" over the "To do" column',
    )
    expect(lastAnnouncements?.onDragEnd({ active: { id: 'card-1' }, over: { id: 'todo' } })).toBe(
      'Dropped the card "Prepare brief" into the "To do" column',
    )
    expect(lastAnnouncements?.onDragCancel({ active: { id: 'card-1' } })).toBe(
      'Cancelled dragging the card "Prepare brief"',
    )
  })
})
