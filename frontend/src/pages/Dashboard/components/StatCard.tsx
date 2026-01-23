import React from 'react'
import { TrendingDown, ArrowUpRight } from 'lucide-react'

interface StatCardProps {
 title: string
 value: string
 change: string
 changeType: 'increase' | 'decrease' | 'neutral'
 icon?: React.ElementType
 color?: string
 description?: string
 trend?: string
}

export function StatCard({
 title,
 value,
 change,
 changeType,
 description,
 trend,
}: StatCardProps) {
 return (
 <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
 <div className="mb-4 flex items-start justify-between">
 <div className="flex-1">
 <p className="text-sm font-medium text-muted-foreground">{title}</p>
 <div className="mt-1 flex items-baseline gap-2">
 <p className="text-2xl font-bold text-foreground">
 {value}
 </p>
 <div className="flex items-center gap-1">
 {changeType === 'increase' ? (
 <ArrowUpRight className="text-success size-4" />
 ) : changeType === 'decrease' ? (
 <TrendingDown className="size-4 text-destructive" />
 ) : null}
 <span
 className={`text-sm font-medium ${
 changeType === 'increase'
 ? 'text-success'
 : changeType === 'decrease'
 ? 'text-destructive'
 : 'text-muted-foreground'
 }`}
 >
 {change}
 </span>
 </div>
 </div>
 {description && (
 <p className="mt-1 text-xs text-muted-foreground">
 {description}
 </p>
 )}
 {trend && (
 <p className="mt-2 text-xs font-medium text-foreground/80">
 {trend}
 </p>
 )}
 </div>
 </div>
 </div>
 )
}