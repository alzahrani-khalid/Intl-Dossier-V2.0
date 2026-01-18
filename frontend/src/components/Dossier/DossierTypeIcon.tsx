/**
 * DossierTypeIcon Component
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 * Task: T039
 *
 * Icon component for dossier types.
 * Provides consistent iconography across the application.
 */

import { Globe, Building2, Users, Target, FileText, UserCog, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DossierType } from '@/types/relationship.types'

// ============================================================================
// Type to Icon Mapping
// ============================================================================

const dossierTypeIcons: Record<DossierType, React.ElementType> = {
  country: Globe,
  organization: Building2,
  forum: Users,
  engagement: FileText,
  topic: Target,
  working_group: UserCog,
  person: User,
}

// ============================================================================
// Type to Color Mapping
// ============================================================================

const dossierTypeColors: Record<DossierType, string> = {
  country: 'text-blue-500',
  organization: 'text-purple-500',
  forum: 'text-green-500',
  engagement: 'text-orange-500',
  topic: 'text-pink-500',
  working_group: 'text-cyan-500',
  person: 'text-indigo-500',
}

// ============================================================================
// Props
// ============================================================================

export interface DossierTypeIconProps {
  /**
   * The dossier type to show icon for.
   */
  type: DossierType
  /**
   * Icon size variant.
   * @default 'sm'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /**
   * Whether to use the type-specific color.
   * @default true
   */
  colored?: boolean
  /**
   * Additional CSS classes.
   */
  className?: string
}

// ============================================================================
// Size Classes
// ============================================================================

const sizeClasses = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

// ============================================================================
// Component
// ============================================================================

export function DossierTypeIcon({
  type,
  size = 'sm',
  colored = true,
  className,
}: DossierTypeIconProps) {
  const Icon = dossierTypeIcons[type] || FileText
  const colorClass = colored ? dossierTypeColors[type] : ''

  return <Icon className={cn(sizeClasses[size], colorClass, className)} aria-hidden="true" />
}

export default DossierTypeIcon
