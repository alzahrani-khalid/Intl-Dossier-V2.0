// Enhanced Card-Style React Flow Nodes for Relationship Graph
//
// D-58-04-25 (Wave-4 highest-density file: 68 disables, React-Flow renderer):
// All Tier-C Tailwind palette literals swapped to canonical semantic tokens
// per the dossierTypeColors map in `frontend/src/lib/semantic-colors.ts`:
//   country      (emerald) → success (D-09 ladder: text-* drops dark variant)
//   organization (purple)  → secondary (D-07 blue+purple collision rule)
//   forum        (amber)   → warning
//   default      (gray)    → muted
// Center-node hero gradient collapses to accent/primary single-tone.
// White-card surfaces remap to bg-card / border-line / text-foreground so the
// React-Flow nodes inherit the OKLCH token engine in both light/dark modes
// without per-class dark: variants. Chromatic-watch documented in PR body per
// manifest override_notes.
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
      {/* Animated glow ring */}
      <div className="absolute -inset-3 bg-gradient-to-r from-primary via-accent to-destructive rounded-3xl opacity-60 blur-xl group-hover:opacity-80 transition-opacity duration-500 animate-pulse"></div>

      {/* Main card content */}
      <div className="relative w-80 bg-card rounded-2xl shadow-2xl border-2 border-primary/50 backdrop-blur-sm overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-primary via-primary to-accent px-6 py-4 relative">
          {/* Sparkle badge */}
          <div className="absolute -top-2 -end-2 bg-warning rounded-full p-2 shadow-lg">
            <Sparkles
              className="w-5 h-5 text-warning-foreground animate-spin"
              style={{ animationDuration: '3s' }}
            />
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-primary-foreground rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-primary-foreground font-bold text-lg tracking-wide drop-shadow-lg">
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
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
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
          bgGradient: 'from-success/10 to-success/5',
          headerGradient: 'from-success to-success',
          border: 'border-success/30',
          icon: Globe2,
          iconColor: 'text-success',
          accentColor: 'text-success',
          badgeBg: 'bg-success/10',
          badgeText: 'text-success',
          label: 'Country',
        }
      case 'organization':
        return {
          bgGradient: 'from-secondary to-secondary/50',
          headerGradient: 'from-accent to-accent',
          border: 'border-secondary',
          icon: Building2,
          iconColor: 'text-secondary-foreground',
          accentColor: 'text-secondary-foreground',
          badgeBg: 'bg-secondary',
          badgeText: 'text-secondary-foreground',
          label: 'Organization',
        }
      case 'forum':
        return {
          bgGradient: 'from-warning/10 to-warning/5',
          headerGradient: 'from-warning to-warning',
          border: 'border-warning/30',
          icon: Users2,
          iconColor: 'text-warning',
          accentColor: 'text-warning',
          badgeBg: 'bg-warning/10',
          badgeText: 'text-warning',
          label: 'Forum',
        }
      default:
        return {
          bgGradient: 'from-muted to-muted/50',
          headerGradient: 'from-muted-foreground to-muted-foreground',
          border: 'border-line',
          icon: Building2,
          iconColor: 'text-muted-foreground',
          accentColor: 'text-muted-foreground',
          badgeBg: 'bg-muted',
          badgeText: 'text-muted-foreground',
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
        className={`relative w-72 bg-gradient-to-br ${style.bgGradient} rounded-xl shadow-lg border-2 ${style.border} transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl cursor-pointer overflow-hidden`}
      >
        {/* Header with icon */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <div className={`p-2 rounded-lg bg-card shadow-sm`}>
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
                <div className="flex-1 bg-card rounded-lg p-2 shadow-sm">
                  <p className="text-xs text-muted-foreground">MoUs</p>
                  <p className={`text-lg font-bold ${style.accentColor}`}>{stats.mous}</p>
                </div>
              )}
              {stats.engagements !== undefined && (
                <div className="flex-1 bg-card rounded-lg p-2 shadow-sm">
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
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${style.headerGradient} rounded-full transition-all duration-500`}
                  style={{ width: `${stats.health_score}%` }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground">{stats.health_score}%</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-card/50 border-t border-line flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground text-[10px] font-bold">A</span>
            </div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-success to-success flex items-center justify-center -ms-1">
              <span className="text-success-foreground text-[10px] font-bold">B</span>
            </div>
          </div>
          <button className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-md transition-colors duration-200">
            View
          </button>
        </div>

        {/* Shine effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-card/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

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
