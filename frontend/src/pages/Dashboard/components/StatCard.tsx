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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            <div className="flex items-center gap-1">
              {changeType === 'increase' ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : changeType === 'decrease' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
              <span
                className={`text-sm font-medium ${
                  changeType === 'increase'
                    ? 'text-green-600 dark:text-green-400'
                    : changeType === 'decrease'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {change}
              </span>
            </div>
          </div>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
          {trend && (
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}