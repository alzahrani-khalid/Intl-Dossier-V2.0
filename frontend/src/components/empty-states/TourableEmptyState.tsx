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
import { EmptyState, EmptyStateVariant, EmptyStateSize, QuickAction } from './EmptyState'
import { TourTrigger, type TourId } from '@/components/guided-tours'
import { cn } from '@/lib/utils'

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
  /** Callback to create new item */
  onCreate?: () => void
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
 * // Dossier list empty state with tour
 * <TourableEmptyState
 *   entityType="dossier"
 *   isFirstItem={true}
 *   onCreate={() => navigate('/dossiers/create')}
 * />
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
  const { t, i18n } = useTranslation('empty-states')
  const isRTL = i18n.language === 'ar'

  const config = entityConfig[entityType]
  const translationKey = config.translationKey
  const tourId = entityToTourMap[entityType]

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

  const primaryAction: QuickAction | undefined = onCreate
    ? {
        label: isFirstItem
          ? t(`list.${translationKey}.createFirst`, {
              defaultValue: t('list.generic.createFirst'),
            })
          : t(`list.${translationKey}.create`, { defaultValue: t('list.generic.create') }),
        icon: Plus,
        onClick: onCreate,
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
    <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
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
