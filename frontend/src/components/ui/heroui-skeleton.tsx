/**
 * HeroUI Skeleton Wrapper
 *
 * Drop-in replacement for shadcn Skeleton.
 * Renders as a div with animate-pulse for full HTML attribute support.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// HeroUISkeleton
// ============================================================================

function HeroUISkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} {...props} />
}

// ============================================================================
// Exports
// ============================================================================

export { HeroUISkeleton }
export default HeroUISkeleton
