/**
 * Tourable Empty State Component
 *
 * Enhanced empty state that integrates with the guided tour system.
 * Shows tour trigger when user first encounters an empty section.
 * Mobile-first, RTL-compatible design.
 */

import { useTranslation } from 'react-i18next'
import {
  FileText,
  Users,
  Building2,
  Globe,
  Calendar,
  MessageSquare,
  Briefcase,
  FolderOpen,
  Plus,
  Upload,
  LucideIcon,
  GitBranch,
  FileCheck,
  FileSignature,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { EmptyState, EmptyStateVariant, EmptyStateSize, QuickAction } from './EmptyState'
import { TourTrigger, type TourId } from '@/components/guided-tours'
import { cn } from '@/lib/utils'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import type { DossierType } from '@/services/dossier-api'

export type TourableEntityType =
  | 'document'
  | 'dossier'
  | 'engagement'
  | 'commitment'
  | 'organization'
  | 'country'
  | 'forum'
  | 'event'
  | 'task'
  | 'person'
  | 'position'
  | 'mou'
  | 'relationship'
  | 'brief'
  | 'generic'

interface TourableEmptyStateProps {
  /** Type of entity the list is for */
  entityType: TourableEntityType
  /** Callback to create new item. When set, takes precedence over `targetType`. */
  onCreate?: () => void
  /**
   * D-07: Optional per-type wizard target. When set AND `onCreate` is not
   * provided, the primary action navigates directly to the type's per-type
   * wizard (e.g. `targetType="country"` → `/dossiers/countries/create`).
   * When both are unset, the primary action falls back to the hub at
   * `/dossiers/create` (D-08).
   */
  targetType?: DossierType
  /** Callback to import items */
  onImport?: () => void
  /** Whether this is the first item (affects messaging and tour trigger) */
  isFirstItem?: boolean
  /** Custom title override */
  title?: string
  /** Custom description override */
  description?: string
  /** Visual variant */
  variant?: EmptyStateVariant
  /** Size variant */
  size?: EmptyStateSize
  /** Additional CSS classes */
  className?: string
  /** Whether to show tour trigger (default: true when isFirstItem) */
  showTourTrigger?: boolean
  /** Tour trigger variant */
  tourVariant?: 'banner' | 'inline' | 'card'
}

// Map entity types to their tour IDs
const entityToTourMap: Partial<Record<TourableEntityType, TourId>> = {
  dossier: 'dossier-first',
  relationship: 'relationship-first',
  document: 'document-first',
  engagement: 'engagement-first',
  brief: 'brief-first',
  position: 'position-first',
  mou: 'mou-first',
  commitment: 'commitment-first',
}

const entityConfig: Record<TourableEntityType, { icon: LucideIcon; translationKey: string }> = {
  document: { icon: FileText, translationKey: 'document' },
  dossier: { icon: FolderOpen, translationKey: 'dossier' },
  engagement: { icon: Calendar, translationKey: 'engagement' },
  commitment: { icon: Briefcase, translationKey: 'commitment' },
  organization: { icon: Building2, translationKey: 'organization' },
  country: { icon: Globe, translationKey: 'country' },
  forum: { icon: MessageSquare, translationKey: 'forum' },
  event: { icon: Calendar, translationKey: 'event' },
  task: { icon: Briefcase, translationKey: 'task' },
  person: { icon: Users, translationKey: 'person' },
  position: { icon: Users, translationKey: 'position' },
  mou: { icon: FileSignature, translationKey: 'mou' },
  relationship: { icon: GitBranch, translationKey: 'relationship' },
  brief: { icon: FileCheck, translationKey: 'brief' },
  generic: { icon: FolderOpen, translationKey: 'generic' },
}

/**
 * Enhanced empty state that integrates with guided tours.
 * Shows a tour trigger banner for first-time users in empty sections.
 *
 * @example
 * // Typed list — routes straight to the per-type wizard (D-07)
 * <TourableEmptyState
 *   entityType="country"
 *   isFirstItem={true}
 *   targetType="country"   // → /dossiers/countries/create
 * />
 *
 * @example
 * // Generic dossier context — hub fallback (D-08)
 * <TourableEmptyState entityType="dossier" isFirstItem={true} />
 *
 * @example
 * // Relationship section with inline tour trigger
 * <TourableEmptyState
 *   entityType="relationship"
 *   isFirstItem={true}
 *   onCreate={() => openAddDialog()}
 *   tourVariant="inline"
 * />
 */
export function TourableEmptyState({
  entityType,
  onCreate,
  targetType,
  onImport,
  isFirstItem = false,
  title: customTitle,
  description: customDescription,
  variant = 'default',
  size = 'md',
  className,
  showTourTrigger,
  tourVariant = 'banner',
}: TourableEmptyStateProps) {
  const { t } = useTranslation('empty-states')
  const navigate = useNavigate()
  const config = entityConfig[entityType]
  const translationKey = config.translationKey
  const tourId = entityToTourMap[entityType]

  // D-07: resolve the primary-action handler. Precedence:
  //   1. caller-supplied `onCreate`
  //   2. `targetType` → per-type wizard
  //   3. hub fallback (`/dossiers/create`) per D-08
  // When neither `onCreate` nor `targetType` is set but the component is
  // rendered with a truthy primary action (caller intent = "offer creation"),
  // we fall back to the hub. If BOTH are unset and the caller hasn't asked
  // for a primary action either, the button stays hidden — preserving the
  // pre-existing behavior for purely informational empty states.
  const resolvedOnCreate = onCreate
    ? onCreate
    : targetType
      ? () => {
          void navigate({ to: `/dossiers/${getDossierRouteSegment(targetType)}/create` })
        }
      : undefined

  // Determine if we should show the tour trigger
  const shouldShowTour = showTourTrigger ?? isFirstItem
  const isEmpty = true // This is always an empty state component

  const title =
    customTitle ||
    (isFirstItem
      ? t(`list.${translationKey}.firstTitle`, { defaultValue: t('list.generic.firstTitle') })
      : t(`list.${translationKey}.title`, { defaultValue: t('list.generic.title') }))

  const description =
    customDescription ||
    (isFirstItem
      ? t(`list.${translationKey}.firstDescription`, {
          defaultValue: t('list.generic.firstDescription'),
        })
      : t(`list.${translationKey}.description`, {
          defaultValue: t('list.generic.description'),
        }))

  const hint = t(`list.${translationKey}.hint`, {
    defaultValue: t('list.generic.hint'),
  })

  const primaryAction: QuickAction | undefined = resolvedOnCreate
    ? {
        label: isFirstItem
          ? t(`list.${translationKey}.createFirst`, {
              defaultValue: t('list.generic.createFirst'),
            })
          : t(`list.${translationKey}.create`, { defaultValue: t('list.generic.create') }),
        icon: Plus,
        onClick: resolvedOnCreate,
      }
    : undefined

  const secondaryActions: QuickAction[] = []
  if (onImport) {
    secondaryActions.push({
      label: t(`list.${translationKey}.import`, { defaultValue: t('list.generic.import') }),
      icon: Upload,
      onClick: onImport,
      variant: 'outline',
    })
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Tour trigger banner (shown above empty state when applicable) */}
      {tourId && shouldShowTour && (
        <TourTrigger tourId={tourId} isEmpty={isEmpty} variant={tourVariant} className="mb-4" />
      )}

      {/* Empty state content */}
      <EmptyState
        icon={config.icon}
        title={title}
        description={description}
        hint={hint}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        variant={variant}
        size={size}
        testId={`tourable-empty-state-${entityType}`}
      />
    </div>
  )
}

/**
 * Helper to get the tour ID for an entity type
 */
export function getTourIdForEntity(entityType: TourableEntityType): TourId | undefined {
  return entityToTourMap[entityType]
}
