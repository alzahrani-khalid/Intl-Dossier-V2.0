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
    <div className="relative group">
      {/* Animated glow ring */}
      <div className="absolute -inset-3 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-3xl opacity-60 blur-xl group-hover:opacity-80 transition-opacity duration-500 animate-pulse"></div>

      {/* Main card content */}
      <div className="relative w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-blue-400/50 backdrop-blur-sm overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 px-6 py-4 relative">
          {/* Sparkle badge */}
          <div className="absolute -top-2 -end-2 bg-yellow-400 rounded-full p-2 shadow-lg">
            <Sparkles
              className="w-5 h-5 text-yellow-900 animate-spin"
              style={{ animationDuration: '3s' }}
            />
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-white font-bold text-lg tracking-wide drop-shadow-lg">
                {data.label}
              </h3>
              <p className="text-blue-100 text-xs mt-0.5">Current Dossier</p>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="p-5 space-y-4">
          {/* Description */}
          {data.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {data.description}
            </p>
          )}

          {/* Metrics */}
          {data.stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">MoUs</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.stats.mous || 0}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Positions</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {data.stats.positions || 0}
                </p>
              </div>
            </div>
          )}

          {/* Action footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">K</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">View Details</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-blue-400 border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-blue-400 border-2 border-white"
        />
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-blue-400 border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-400 border-2 border-white"
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
    <div className="relative group">
      {/* Hover glow effect */}
      <div
        className={`absolute -inset-2 bg-gradient-${style.headerGradient} rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300`}
      ></div>

      {/* Main card */}
      <div
        className={`relative w-72 bg-gradient-to-br ${style.bgGradient} ${style.darkBgGradient} rounded-xl shadow-lg border-2 ${style.border} transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl cursor-pointer overflow-hidden`}
      >
        {/* Header with icon */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
            <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {label}
            </h4>
            <span
              className={`text-xs ${style.badgeBg} ${style.badgeText} px-2 py-0.5 rounded-full`}
            >
              {style.label}
            </span>
          </div>
        </div>

        {/* Content section */}
        <div className="p-4 space-y-3">
          {/* Description */}
          {description && (
            <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Metrics - Simplified */}
          {stats && (
            <div className="flex gap-2">
              {stats.mous !== undefined && (
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400">MoUs</p>
                  <p className={`text-lg font-bold ${style.accentColor}`}>{stats.mous}</p>
                </div>
              )}
              {stats.engagements !== undefined && (
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Engage</p>
                  <p className={`text-lg font-bold ${style.accentColor}`}>{stats.engagements}</p>
                </div>
              )}
            </div>
          )}

          {/* Health indicator */}
          {stats?.health_score !== undefined && (
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${style.iconColor}`} />
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
        <div className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">A</span>
            </div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center -ms-1">
              <span className="text-white text-[10px] font-bold">B</span>
            </div>
          </div>
          <button className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-md transition-colors duration-200">
            View
          </button>
        </div>

        {/* Shine effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        {/* Connection Handles - Hidden by default */}
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="w-2.5 h-2.5 bg-white border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="w-2.5 h-2.5 bg-white border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-2.5 h-2.5 bg-white border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="w-2.5 h-2.5 bg-white border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  )
})

RelatedNode.displayName = 'RelatedNode'

// Dark mode variants (kept for backwards compatibility)
export const CenterNodeDark = CenterNode
