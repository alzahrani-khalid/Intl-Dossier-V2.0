/**
 * DrawerMetaStrip — Wave 0 stub (interface widened in plan 41-02 Task 1 to
 * accept the props DrawerHead now passes; body filled by 41-02 Task 2).
 */
import type * as React from 'react'

export interface DrawerMetaStripProps {
  dossierId: string
  metadata?: Record<string, unknown> | undefined
  updatedAt?: string | undefined
  engagementCount?: number
}

export function DrawerMetaStrip(_props: DrawerMetaStripProps): React.JSX.Element {
  return <div className="drawer-meta" data-loading="true" />
}
