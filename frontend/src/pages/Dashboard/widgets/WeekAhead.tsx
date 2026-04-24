import { type ReactElement } from 'react'
import { WidgetSkeleton } from './WidgetSkeleton'

export function WeekAhead(): ReactElement {
  return <WidgetSkeleton rows={3} />
}
