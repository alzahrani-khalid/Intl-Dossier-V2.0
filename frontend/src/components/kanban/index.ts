export { KanbanProvider, KanbanContext } from './KanbanProvider'
export type {
  KanbanColumnProps,
  KanbanContextProps,
  KanbanItemProps,
  KanbanProviderProps,
} from './KanbanProvider'
export { KanbanBoard } from './KanbanBoard'
export type { KanbanBoardProps } from './KanbanBoard'
export { KanbanCards } from './KanbanCards'
export type { KanbanCardsProps } from './KanbanCards'
export { KanbanCard } from './KanbanCard'
export type { KanbanCardProps } from './KanbanCard'
export { KanbanHeader } from './KanbanHeader'
export type { KanbanHeaderProps } from './KanbanHeader'
export { useDroppable } from '@dnd-kit/core'
// Phase 94 Plan 08 (D-04/D-33): consumers need the live drag state to decide
// whether their droppable is a legal target for the card currently in flight.
// Direct @dnd-kit/core imports are ESLint-banned outside components/kanban/*,
// so the barrel is the only way out.
export { useDndContext } from '@dnd-kit/core'
export type { DragEndEvent, SensorDescriptor } from '@dnd-kit/core'
