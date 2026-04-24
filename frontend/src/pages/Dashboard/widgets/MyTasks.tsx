import { type ReactElement } from 'react'
import { WidgetSkeleton } from './WidgetSkeleton'

export function MyTasks(): ReactElement {
  return <WidgetSkeleton rows={3} />
}
