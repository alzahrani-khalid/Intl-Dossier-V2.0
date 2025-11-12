/**
 * Skeleton Component
 *
 * Task: T096 [Polish]
 * Reusable loading skeleton components for async operations
 * Provides visual feedback during data loading
 */

import { cn } from "@/lib/utils"

function Skeleton({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) {
 return (
 <div
 className={cn("animate-pulse rounded-md bg-muted", className)}
 {...props}
 />
 )
}

/**
 * SkeletonCard
 * Preset skeleton for card layouts
 */
function SkeletonCard() {
 return (
 <div className="space-y-3 p-4 sm:p-6 rounded-lg border border-border bg-card">
 <div className="flex items-start gap-3">
 <Skeleton className="h-5 w-5" />
 <div className="flex-1 space-y-2">
 <Skeleton className="h-5 w-3/4" />
 <Skeleton className="h-4 w-full" />
 <Skeleton className="h-4 w-2/3" />
 </div>
 </div>
 </div>
 )
}

/**
 * SkeletonText
 * Preset skeleton for text lines
 */
function SkeletonText({ lines = 3 }: { lines?: number }) {
 return (
 <div className="space-y-2">
 {Array.from({ length: lines }).map((_, i) => (
 <Skeleton
 key={i}
 className={cn(
 "h-4",
 i === lines - 1 ? "w-2/3" : "w-full"
 )}
 />
 ))}
 </div>
 )
}

/**
 * SkeletonTable
 * Preset skeleton for table rows
 */
function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
 return (
 <div className="space-y-3">
 {/* Header */}
 <div className="flex gap-4 pb-3 border-b">
 {Array.from({ length: columns }).map((_, i) => (
 <Skeleton key={i} className="h-5 flex-1" />
 ))}
 </div>
 {/* Rows */}
 {Array.from({ length: rows }).map((_, rowIdx) => (
 <div key={rowIdx} className="flex gap-4">
 {Array.from({ length: columns }).map((_, colIdx) => (
 <Skeleton key={colIdx} className="h-9 flex-1" />
 ))}
 </div>
 ))}
 </div>
 )
}

/**
 * SkeletonAvatar
 * Preset skeleton for avatar/profile images
 */
function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
 const sizeClasses = {
 sm: "h-8 w-8",
 md: "h-10 w-10",
 lg: "h-12 w-12"
 }

 return <Skeleton className={cn("rounded-full", sizeClasses[size])} />
}

/**
 * SkeletonButton
 * Preset skeleton for button loading state
 */
function SkeletonButton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
 const sizeClasses = {
 sm: "h-9 w-20",
 md: "h-10 w-24",
 lg: "h-11 w-28"
 }

 return <Skeleton className={cn("rounded-md", sizeClasses[size])} />
}

export {
 Skeleton,
 SkeletonCard,
 SkeletonText,
 SkeletonTable,
 SkeletonAvatar,
 SkeletonButton
}
