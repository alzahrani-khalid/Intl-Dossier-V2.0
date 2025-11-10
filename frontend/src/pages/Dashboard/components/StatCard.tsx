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
 <div className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <p className="text-sm font-medium text-muted-foreground">{title}</p>
 <div className="flex items-baseline gap-2 mt-1">
 <p className="text-2xl font-bold text-foreground">
 {value}
 </p>
 <div className="flex items-center gap-1">
 {changeType === 'increase' ? (
 <ArrowUpRight className="h-4 w-4 text-success" />
 ) : changeType === 'decrease' ? (
 <TrendingDown className="h-4 w-4 text-destructive" />
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
 <p className="text-xs text-muted-foreground mt-1">
 {description}
 </p>
 )}
 {trend && (
 <p className="text-xs font-medium text-foreground/80 mt-2">
 {trend}
 </p>
 )}
 </div>
 </div>
 </div>
 )
}