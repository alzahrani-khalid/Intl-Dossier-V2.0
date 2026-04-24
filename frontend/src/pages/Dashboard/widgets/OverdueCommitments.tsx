import { type ReactElement } from 'react'
import { WidgetSkeleton } from './WidgetSkeleton'

export function OverdueCommitments(): ReactElement {
  return <WidgetSkeleton rows={3} />
}
