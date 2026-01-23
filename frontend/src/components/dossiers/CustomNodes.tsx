// Enhanced Card-Style React Flow Nodes for Relationship Graph
import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import {
  Building2,
  Globe2,
  Users2,
  Sparkles,
  ChevronRight,
  FileText,
  Users,
  TrendingUp,
} from 'lucide-react'

interface CustomNodeData {
  label: string
  isCenter?: boolean
  referenceType?: 'country' | 'organization' | 'forum'
  description?: string
  stats?: {
    mous?: number
    positions?: number
    engagements?: number
    health_score?: number
  }
}

// Center Node Component (Current Dossier) - Large Card Style
export const CenterNode = memo(({ data }: NodeProps<CustomNodeData>) => {
  return (
    <div className="group relative">
      {/* Animated glow ring */}
      <div className="absolute -inset-3 animate-pulse rounded-3xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-80"></div>

      {/* Main card content */}
      <div className="relative w-80 overflow-hidden rounded-2xl border-2 border-blue-400/50 bg-white shadow-2xl backdrop-blur-sm dark:bg-gray-800">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 px-6 py-4">
          {/* Sparkle badge */}
          <div className="absolute -end-2 -top-2 rounded-full bg-yellow-400 p-2 shadow-lg">
            <Sparkles
              className="size-5 animate-spin text-yellow-900"
              style={{ animationDuration: '3s' }}
            />
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="size-3 animate-pulse rounded-full bg-white"></div>
            <div>
              <h3 className="text-lg font-bold tracking-wide text-white drop-shadow-lg">
                {data.label}
              </h3>
              <p className="mt-0.5 text-xs text-blue-100">Current Dossier</p>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="space-y-4 p-5">
          {/* Description */}
          {data.description && (
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {data.description}
            </p>
          )}

          {/* Metrics */}
          {data.stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <div className="mb-1 flex items-center gap-2">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">MoUs</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.stats.mous || 0}
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                <div className="mb-1 flex items-center gap-2">
                  <Users className="size-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Positions</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {data.stats.positions || 0}
                </p>
              </div>
            </div>
          )}

          {/* Action footer */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                <span className="text-xs font-bold text-white">K</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">View Details</span>
            </div>
            <ChevronRight className="size-4 text-gray-400" />
          </div>
        </div>

        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="size-3 border-2 border-white bg-blue-400"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="size-3 border-2 border-white bg-blue-400"
        />
        <Handle
          type="target"
          position={Position.Top}
          className="size-3 border-2 border-white bg-blue-400"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="size-3 border-2 border-white bg-blue-400"
        />
      </div>
    </div>
  )
})

CenterNode.displayName = 'CenterNode'

// Related Node Component (Other Dossiers) - Card Style
export const RelatedNode = memo(({ data, isConnectable }: NodeProps<CustomNodeData>) => {
  const { referenceType, label, description, stats } = data

  // Get colors and icon based on entity type
  const getNodeStyle = () => {
    switch (referenceType) {
      case 'country':
        return {
          bgGradient: 'from-emerald-50 to-teal-50',
          darkBgGradient: 'dark:from-emerald-900/10 dark:to-teal-900/10',
          headerGradient: 'from-emerald-500 to-teal-600',
          border: 'border-emerald-200 dark:border-emerald-700',
          icon: Globe2,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          accentColor: 'text-emerald-600 dark:text-emerald-400',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
          badgeText: 'text-emerald-700 dark:text-emerald-300',
          label: 'Country',
        }
      case 'organization':
        return {
          bgGradient: 'from-purple-50 to-violet-50',
          darkBgGradient: 'dark:from-purple-900/10 dark:to-violet-900/10',
          headerGradient: 'from-purple-500 to-violet-600',
          border: 'border-purple-200 dark:border-purple-700',
          icon: Building2,
          iconColor: 'text-purple-600 dark:text-purple-400',
          accentColor: 'text-purple-600 dark:text-purple-400',
          badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
          badgeText: 'text-purple-700 dark:text-purple-300',
          label: 'Organization',
        }
      case 'forum':
        return {
          bgGradient: 'from-amber-50 to-orange-50',
          darkBgGradient: 'dark:from-amber-900/10 dark:to-orange-900/10',
          headerGradient: 'from-amber-500 to-orange-600',
          border: 'border-amber-200 dark:border-amber-700',
          icon: Users2,
          iconColor: 'text-amber-600 dark:text-amber-400',
          accentColor: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
          badgeText: 'text-amber-700 dark:text-amber-300',
          label: 'Forum',
        }
      default:
        return {
          bgGradient: 'from-gray-50 to-slate-50',
          darkBgGradient: 'dark:from-gray-900/10 dark:to-slate-900/10',
          headerGradient: 'from-gray-500 to-slate-600',
          border: 'border-gray-200 dark:border-gray-700',
          icon: Building2,
          iconColor: 'text-gray-600 dark:text-gray-400',
          accentColor: 'text-gray-600 dark:text-gray-400',
          badgeBg: 'bg-gray-100 dark:bg-gray-900/30',
          badgeText: 'text-gray-700 dark:text-gray-300',
          label: 'Entity',
        }
    }
  }

  const style = getNodeStyle()
  const IconComponent = style.icon

  return (
    <div className="group relative">
      {/* Hover glow effect */}
      <div
        className={`bg-gradient- absolute -inset-2${style.headerGradient} rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30`}
      ></div>

      {/* Main card */}
      <div
        className={`relative w-72 bg-gradient-to-br ${style.bgGradient} ${style.darkBgGradient} rounded-xl border-2 shadow-lg ${style.border} cursor-pointer overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl`}
      >
        {/* Header with icon */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className={`rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800`}>
            <IconComponent className={`size-5 ${style.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {label}
            </h4>
            <span
              className={`text-xs ${style.badgeBg} ${style.badgeText} rounded-full px-2 py-0.5`}
            >
              {style.label}
            </span>
          </div>
        </div>

        {/* Content section */}
        <div className="space-y-3 p-4">
          {/* Description */}
          {description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}

          {/* Metrics - Simplified */}
          {stats && (
            <div className="flex gap-2">
              {stats.mous !== undefined && (
                <div className="flex-1 rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">MoUs</p>
                  <p className={`text-lg font-bold ${style.accentColor}`}>{stats.mous}</p>
                </div>
              )}
              {stats.engagements !== undefined && (
                <div className="flex-1 rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Engage</p>
                  <p className={`text-lg font-bold ${style.accentColor}`}>{stats.engagements}</p>
                </div>
              )}
            </div>
          )}

          {/* Health indicator */}
          {stats?.health_score !== undefined && (
            <div className="flex items-center gap-2">
              <TrendingUp className={`size-4 ${style.iconColor}`} />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full bg-gradient-to-r ${style.headerGradient} rounded-full transition-all duration-500`}
                  style={{ width: `${stats.health_score}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stats.health_score}%
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white/50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-center gap-1">
            <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
              <span className="text-[10px] font-bold text-white">A</span>
            </div>
            <div className="-ms-1 flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
              <span className="text-[10px] font-bold text-white">B</span>
            </div>
          </div>
          <button className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90">
            View
          </button>
        </div>

        {/* Shine effect overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

        {/* Connection Handles - Hidden by default */}
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="size-2.5 border-2 border-current bg-white opacity-0 transition-opacity group-hover:opacity-100"
        />
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="size-2.5 border-2 border-current bg-white opacity-0 transition-opacity group-hover:opacity-100"
        />
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="size-2.5 border-2 border-current bg-white opacity-0 transition-opacity group-hover:opacity-100"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="size-2.5 border-2 border-current bg-white opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    </div>
  )
})

RelatedNode.displayName = 'RelatedNode'

// Dark mode variants (kept for backwards compatibility)
export const CenterNodeDark = CenterNode
