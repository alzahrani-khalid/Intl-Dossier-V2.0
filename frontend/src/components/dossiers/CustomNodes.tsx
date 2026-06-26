// Enhanced Card-Style React Flow Nodes for Relationship Graph
//
// D-58-04-25 (Wave-4 highest-density file: 68 disables, React-Flow renderer):
// All Tier-C Tailwind palette literals swapped to canonical semantic tokens
// per the dossierTypeColors map in `frontend/src/lib/semantic-colors.ts`:
//   country      (emerald) → success (D-09 ladder: text-* drops dark variant)
//   organization (purple)  → secondary (D-07 blue+purple collision rule)
//   forum        (amber)   → warning
//   default      (gray)    → muted
// Visual-token flatten: all gradients, glow rings, blur and scale/pulse motion
// removed — node surfaces are flat bg-surface with 1px borders. The center node
// uses a solid accent header (the sanctioned primary-button fill); related nodes
// carry type identity via soft-token icon color + badge + a 1px colored border.
// Everything resolves to design tokens in both light/dark modes without
// per-class dark: variants.
import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
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

interface CustomNodeData extends Record<string, unknown> {
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

type CustomNode = Node<CustomNodeData>

// Center Node Component (Current Dossier) - Large Card Style
export const CenterNode = memo(({ data }: NodeProps<CustomNode>) => {
  return (
    <div className="relative group">
      {/* Main card content */}
      <div className="relative w-80 bg-surface rounded-[var(--radius-lg)] border border-accent overflow-hidden">
        {/* Header — solid accent (primary-button fill), flat */}
        <div className="bg-primary px-6 py-4 relative">
          {/* Sparkle badge */}
          <div className="absolute -top-2 -end-2 bg-warning rounded-full p-2">
            <Sparkles className="w-5 h-5 text-warning-foreground" />
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-primary-foreground rounded-full"></div>
            <div>
              <h3 className="text-primary-foreground font-bold text-lg tracking-wide">
                {data.label}
              </h3>
              <p className="text-primary-foreground/80 text-xs mt-0.5">Current Dossier</p>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="p-5 space-y-4">
          {/* Description */}
          {data.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">{data.description}</p>
          )}

          {/* Metrics */}
          {data.stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">MoUs</span>
                </div>
                <p className="text-2xl font-bold text-primary">{data.stats.mous || 0}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-secondary-foreground" />
                  <span className="text-xs text-muted-foreground">Positions</span>
                </div>
                <p className="text-2xl font-bold text-secondary-foreground">
                  {data.stats.positions || 0}
                </p>
              </div>
            </div>
          )}

          {/* Action footer */}
          <div className="flex items-center justify-between pt-3 border-t border-line">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">K</span>
              </div>
              <span className="text-xs text-muted-foreground">View Details</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-primary border-2 border-card"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-primary border-2 border-card"
        />
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-primary border-2 border-card"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-primary border-2 border-card"
        />
      </div>
    </div>
  )
})

CenterNode.displayName = 'CenterNode'

// Related Node Component (Other Dossiers) - Card Style
export const RelatedNode = memo(({ data, isConnectable }: NodeProps<CustomNode>) => {
  const { referenceType, label, description, stats } = data

  // Get colors and icon based on entity type.
  //
  // D-58-04-25 type-palette mapping aligned to canonical dossierTypeColors:
  //   country      → success  (emerald → success)
  //   organization → secondary (purple → accent-soft per D-07 collision)
  //   forum        → warning  (amber → warning)
  //   default      → muted    (gray → muted)
  const getNodeStyle = () => {
    switch (referenceType) {
      case 'country':
        return {
          border: 'border-success/30',
          icon: Globe2,
          iconColor: 'text-success',
          accentColor: 'text-success',
          badgeBg: 'bg-success/10',
          badgeText: 'text-success',
          barColor: 'bg-success',
          label: 'Country',
        }
      case 'organization':
        return {
          border: 'border-secondary',
          icon: Building2,
          iconColor: 'text-secondary-foreground',
          accentColor: 'text-secondary-foreground',
          badgeBg: 'bg-secondary',
          badgeText: 'text-secondary-foreground',
          barColor: 'bg-accent',
          label: 'Organization',
        }
      case 'forum':
        return {
          border: 'border-warning/30',
          icon: Users2,
          iconColor: 'text-warning',
          accentColor: 'text-warning',
          badgeBg: 'bg-warning/10',
          badgeText: 'text-warning',
          barColor: 'bg-warning',
          label: 'Forum',
        }
      default:
        return {
          border: 'border-line',
          icon: Building2,
          iconColor: 'text-muted-foreground',
          accentColor: 'text-muted-foreground',
          badgeBg: 'bg-line-soft',
          badgeText: 'text-muted-foreground',
          barColor: 'bg-ink-faint',
          label: 'Entity',
        }
    }
  }

  const style = getNodeStyle()
  const IconComponent = style.icon

  return (
    <div className="relative group">
      {/* Main card */}
      <div
        className={`relative w-72 bg-surface rounded-[var(--radius)] border ${style.border} transition-colors duration-150 cursor-pointer overflow-hidden hover:bg-line-soft`}
      >
        {/* Header with icon */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <div className="p-2 rounded-[var(--radius-sm)] bg-line-soft">
            <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm truncate">{label}</h4>
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
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Metrics - Simplified */}
          {stats && (
            <div className="flex gap-2">
              {stats.mous !== undefined && (
                <div className="flex-1 bg-line-soft rounded-[var(--radius-sm)] p-2">
                  <p className="text-xs text-muted-foreground">MoUs</p>
                  <p className={`text-lg font-bold ${style.accentColor}`}>{stats.mous}</p>
                </div>
              )}
              {stats.engagements !== undefined && (
                <div className="flex-1 bg-line-soft rounded-[var(--radius-sm)] p-2">
                  <p className="text-xs text-muted-foreground">Engage</p>
                  <p className={`text-lg font-bold ${style.accentColor}`}>{stats.engagements}</p>
                </div>
              )}
            </div>
          )}

          {/* Health indicator */}
          {stats?.health_score !== undefined && (
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${style.iconColor}`} />
              <div className="flex-1 h-1.5 bg-line-soft rounded-full overflow-hidden">
                <div
                  className={`h-full ${style.barColor} rounded-full transition-all duration-300`}
                  style={{ width: `${stats.health_score}%` }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground">{stats.health_score}%</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-line-soft border-t border-line flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[10px] font-bold">A</span>
            </div>
            <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center -ms-1">
              <span className="text-success-foreground text-[10px] font-bold">B</span>
            </div>
          </div>
          <button className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-md transition-colors duration-200">
            View
          </button>
        </div>

        {/* Connection Handles - Hidden by default */}
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="w-2.5 h-2.5 bg-card border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="w-2.5 h-2.5 bg-card border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-2.5 h-2.5 bg-card border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="w-2.5 h-2.5 bg-card border-2 border-current opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  )
})

RelatedNode.displayName = 'RelatedNode'

// Dark mode variants (kept for backwards compatibility)
