import { type ReactElement } from 'react'
import { WidgetSkeleton } from './WidgetSkeleton'

export function SlaHealth(): ReactElement {
  return <WidgetSkeleton rows={3} />
}
