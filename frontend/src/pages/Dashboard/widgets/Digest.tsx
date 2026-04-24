import { type ReactElement } from 'react'
import { WidgetSkeleton } from './WidgetSkeleton'

export function Digest(): ReactElement {
  return <WidgetSkeleton rows={3} />
}
