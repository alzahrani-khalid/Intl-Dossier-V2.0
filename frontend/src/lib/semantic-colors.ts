/**
 * Semantic Color Mappings
 * Audit fixes: T-03, T-04, T-05, T-06, T-10, T-11, T-12, T-13, T-14, T-20, T-50, T-70
 *
 * Centralizes all color mappings to use theme-aware tokens instead of
 * hardcoded Tailwind color classes (e.g. bg-blue-500).
 *
 * Available semantic Tailwind utilities (from tailwind.config.ts):
 *   primary, secondary, destructive, muted, accent, success, warning
 *
 * For raw CSS values (React Flow graphs): uses CSS variable references.
 */

// ============================================================================
// Types
// ============================================================================

export interface ColorSet {
  bg: string
  text: string
  border: string
}

export interface ColorPair {
  bg: string
  text: string
}

// ============================================================================
// Dossier Type Colors (Tailwind classes)
// ============================================================================

/**
 * Maps dossier types to theme-aware Tailwind classes.
 * Used by DossierTypeIcon, UniversalDossierCard, etc.
 */
export const dossierTypeColors: Record<string, ColorSet> = {
  country: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  organization: {
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
    border: 'border-secondary',
  },
  forum: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
  },
  engagement: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
  },
  topic: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
  },
  working_group: {
    bg: 'bg-accent',
    text: 'text-accent-foreground',
    border: 'border-accent',
  },
  person: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
  },
}

/**
 * Returns a combined badge class string for a dossier type.
 * Includes bg + text for use in Badge / icon containers.
 */
export function getDossierTypeBadgeClass(type: string): string {
  const colors = dossierTypeColors[type] ?? dossierTypeColors.country
  return `${colors.bg} ${colors.text}`
}

/**
 * Returns only the text class for a dossier type icon.
 */
export function getDossierTypeTextClass(type: string): string {
  return dossierTypeColors[type]?.text ?? 'text-primary'
}

// ============================================================================
// Status Colors (Tailwind classes)
// ============================================================================

/**
 * Maps work-item / dossier statuses to theme-aware Tailwind classes.
 * Used by ActivityTimelineItem, UniversalDossierCard, etc.
 */
export const statusColors: Record<string, ColorSet> = {
  pending: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
  },
  in_progress: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  todo: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
  },
  review: {
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
    border: 'border-secondary',
  },
  completed: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
  },
  done: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
  },
  cancelled: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
  },
  open: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  closed: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
  },
  active: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
  },
  inactive: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
  },
  archived: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
  },
  deleted: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
  },
}

/**
 * Returns a combined badge class string for a status value.
 */
export function getStatusBadgeClass(status: string): string {
  const colors = statusColors[status] ?? statusColors.todo
  return `${colors.bg} ${colors.text}`
}

// ============================================================================
// Priority Colors (Tailwind classes)
// ============================================================================

/**
 * Maps work-item priorities to theme-aware bg + text (aligned with {@link statusColors}).
 */
export const priorityColors: Record<string, ColorSet> = {
  low: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
  },
  medium: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  high: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
  },
  urgent: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
  },
  critical: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
  },
}

/**
 * Returns a combined badge class string for a priority value (bg + text).
 */
export function getPriorityBadgeClass(priority: string): string {
  const colors = priorityColors[priority] ?? priorityColors.medium
  return `${colors.bg} ${colors.text}`
}

// ============================================================================
// Activity Type Colors (Tailwind classes)
// ============================================================================

/**
 * Maps unified activity types to theme-aware Tailwind classes.
 * Used by ActivityTimelineSection and related components.
 */
export const activityTypeColors: Record<string, ColorPair> = {
  task: {
    bg: 'bg-primary/10',
    text: 'text-primary',
  },
  commitment: {
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
  },
  intake: {
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
  position: {
    bg: 'bg-success/10',
    text: 'text-success',
  },
  event: {
    bg: 'bg-accent',
    text: 'text-accent-foreground',
  },
  relationship: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
  },
  document: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
  },
  comment: {
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
}

/**
 * Returns a combined badge class string for an activity type.
 */
export function getActivityTypeBadgeClass(type: string): string {
  const colors = activityTypeColors[type] ?? activityTypeColors.task
  return `${colors.bg} ${colors.text}`
}

// ============================================================================
// Activity Action Colors (Tailwind classes)
// ============================================================================

export const activityActionColors: Record<string, string> = {
  created: 'text-success',
  updated: 'text-primary',
  completed: 'text-success',
  linked: 'text-secondary-foreground',
  commented: 'text-warning',
  status_change: 'text-warning',
  assigned: 'text-accent-foreground',
}

/**
 * Returns the text class for an activity action.
 */
export function getActivityActionTextClass(action: string): string {
  return activityActionColors[action] ?? 'text-muted-foreground'
}

// ============================================================================
// Interaction / Engagement Type Colors (Tailwind classes)
// ============================================================================

/**
 * Maps engagement/interaction types to theme-aware Tailwind classes.
 * Used by InteractionHistory section.
 */
export const interactionTypeColors: Record<string, ColorPair> = {
  meeting: {
    bg: 'bg-primary/10',
    text: 'text-primary',
  },
  conference: {
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
  },
  visit: {
    bg: 'bg-success/10',
    text: 'text-success',
  },
  negotiation: {
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
}

/**
 * Returns a combined badge class string for an interaction type.
 */
export function getInteractionTypeBadgeClass(type: string): string {
  const colors = interactionTypeColors[type] ?? { bg: 'bg-muted', text: 'text-muted-foreground' }
  return `${colors.bg} ${colors.text}`
}

// ============================================================================
// Stat Card Variant Colors (Tailwind classes)
// ============================================================================

export const statVariantStyles: Record<string, { card: string; icon: string }> = {
  default: {
    card: 'bg-card',
    icon: 'text-primary',
  },
  warning: {
    card: 'bg-warning/5 border-warning/20',
    icon: 'text-warning',
  },
  success: {
    card: 'bg-success/5 border-success/20',
    icon: 'text-success',
  },
}

// ============================================================================
// Graph Visualization Colors (Raw CSS variable references)
// ============================================================================

/**
 * Raw CSS color values for React Flow graph nodes.
 * Uses CSS variable references so they adapt to theme changes.
 *
 * NOTE: React Flow requires raw color strings, not Tailwind classes.
 * These use var() references to CSS custom properties.
 */
export const graphNodeColors: Record<string, string> = {
  country: 'var(--heroui-accent)',
  organization: 'var(--color-secondary)',
  individual: 'var(--heroui-success)',
  forum: 'var(--heroui-warning)',
  engagement: 'var(--heroui-danger)',
  mou: 'var(--heroui-success)',
  position: 'var(--color-secondary)',
  person: 'var(--heroui-warning)',
  topic: 'var(--heroui-success)',
  working_group: 'var(--heroui-accent)',
}

/**
 * Raw CSS color values for React Flow graph edges.
 */
export const graphEdgeColors: Record<string, string> = {
  member_of: 'var(--heroui-accent)',
  partner: 'var(--heroui-success)',
  parent_org: 'var(--color-secondary)',
  hosted_by: 'var(--heroui-warning)',
  participant: 'var(--heroui-danger)',
  signatory: 'var(--heroui-success)',
  cooperates_with: 'var(--color-secondary)',
  bilateral_relation: 'var(--heroui-warning)',
  participates_in: 'var(--heroui-success)',
  related_to: 'var(--color-muted-foreground)',
}

/**
 * Default fallback color for unknown graph node/edge types.
 */
export const graphDefaultColor = 'var(--color-muted-foreground)'

/**
 * Returns the CSS variable color for a graph node type.
 */
export function getGraphNodeColor(type: string): string {
  return graphNodeColors[type] ?? graphDefaultColor
}

/**
 * Returns the CSS variable color for a graph edge type.
 */
export function getGraphEdgeColor(type: string): string {
  return graphEdgeColors[type] ?? graphDefaultColor
}

// ============================================================================
// Verified / Pending Badge Colors (Tailwind classes)
// ============================================================================

export const verifiedBadgeClass = 'text-success border-success'
export const pendingBadgeClass = 'text-warning border-warning'

// ============================================================================
// Brief Generation Colors (Tailwind classes)
// ============================================================================

export const briefSuccessColors = {
  alert: 'bg-success/5 border-success/20',
  icon: 'text-success',
  title: 'text-success',
  description: 'text-success/80',
}

export const briefManualColors = {
  alert: 'bg-warning/5 border-warning/20',
  icon: 'text-warning',
  title: 'text-warning',
  description: 'text-warning/80',
}
