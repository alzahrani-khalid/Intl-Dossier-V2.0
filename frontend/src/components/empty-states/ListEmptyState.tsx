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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState, EmptyStateVariant, EmptyStateSize, QuickAction } from './EmptyState'
import { ContextualSuggestions } from './ContextualSuggestions'
import { CollaborativeEmptyState } from './CollaborativeEmptyState'
import type { SuggestionContext } from '@/types/contextual-suggestion.types'

export type EntityType =
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
  | 'generic'

interface ListEmptyStateProps {
  /** Type of entity the list is for */
  entityType: EntityType
  /** Callback to create new item */
  onCreate?: () => void
  /** Callback to import items */
  onImport?: () => void
  /** Whether this is the first item (affects messaging) */
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
  /** Show contextual suggestions based on upcoming events and organizational calendar */
  showContextualSuggestions?: boolean
  /**
   * Show team collaboration section with stats and invite flow
   * When true, displays team activity stats ("Others have created X dossiers")
   * and provides easy team invitation flow with customizable message templates
   * @default false
   */
  showCollaboration?: boolean
  /**
   * Current user's name for invitation templates
   * Used when showCollaboration is true
   */
  currentUserName?: string
}

const entityConfig: Record<
  EntityType,
  { icon: LucideIcon; translationKey: string; suggestionContext: SuggestionContext }
> = {
  document: { icon: FileText, translationKey: 'document', suggestionContext: 'document' },
  dossier: { icon: FolderOpen, translationKey: 'dossier', suggestionContext: 'dossier' },
  engagement: { icon: Calendar, translationKey: 'engagement', suggestionContext: 'engagement' },
  commitment: { icon: Briefcase, translationKey: 'commitment', suggestionContext: 'commitment' },
  organization: { icon: Building2, translationKey: 'organization', suggestionContext: 'dossier' },
  country: { icon: Globe, translationKey: 'country', suggestionContext: 'dossier' },
  forum: { icon: MessageSquare, translationKey: 'forum', suggestionContext: 'dossier' },
  event: { icon: Calendar, translationKey: 'event', suggestionContext: 'calendar' },
  task: { icon: Briefcase, translationKey: 'task', suggestionContext: 'task' },
  person: { icon: Users, translationKey: 'person', suggestionContext: 'global' },
  position: { icon: Users, translationKey: 'position', suggestionContext: 'global' },
  mou: { icon: FileText, translationKey: 'mou', suggestionContext: 'dossier' },
  generic: { icon: FolderOpen, translationKey: 'generic', suggestionContext: 'global' },
}

/**
 * Specialized empty state for list views.
 * Provides context-aware messaging and actions based on entity type.
 * Now includes intelligent contextual suggestions based on upcoming events,
 * organizational calendar, and user's pending work.
 *
 * @example
 * // Document list empty state
 * <ListEmptyState
 *   entityType="document"
 *   onCreate={() => openUploadDialog()}
 *   onImport={() => openImportDialog()}
 * />
 *
 * @example
 * // First item encouragement with contextual suggestions
 * <ListEmptyState
 *   entityType="engagement"
 *   isFirstItem={true}
 *   onCreate={() => createEngagement()}
 *   showContextualSuggestions
 * />
 *
 * @example
 * // With team collaboration (shows "Others have created X dossiers" + invite flow)
 * <ListEmptyState
 *   entityType="dossier"
 *   onCreate={() => createDossier()}
 *   showCollaboration={true}
 *   currentUserName="John Doe"
 * />
 */
export function ListEmptyState({
  entityType,
  onCreate,
  onImport,
  isFirstItem = false,
  title: customTitle,
  description: customDescription,
  variant = 'default',
  size = 'md',
  className,
  showContextualSuggestions = false,
  showCollaboration = false,
  currentUserName,
}: ListEmptyStateProps) {
  const { t, i18n } = useTranslation('empty-states')
  const isRTL = i18n.language === 'ar'

  const config = entityConfig[entityType]
  const translationKey = config.translationKey

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

  const primaryActionLabel = isFirstItem
    ? t(`list.${translationKey}.createFirst`, {
        defaultValue: t('list.generic.createFirst'),
      })
    : t(`list.${translationKey}.create`, { defaultValue: t('list.generic.create') })

  const primaryAction: QuickAction | undefined = onCreate
    ? {
        label: primaryActionLabel,
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

  // Use CollaborativeEmptyState when showCollaboration is enabled
  // This shows team activity stats ("Others have created X dossiers") and invite flow
  if (showCollaboration) {
    return (
      <CollaborativeEmptyState
        entityType={entityType}
        icon={config.icon}
        title={title}
        description={description}
        onPrimaryAction={onCreate}
        primaryActionLabel={onCreate ? primaryActionLabel : undefined}
        secondaryActions={secondaryActions.map((action) => ({
          label: action.label,
          onClick: action.onClick,
          icon: action.icon,
        }))}
        currentUserName={currentUserName}
        showCollaboration={true}
        className={className}
        testId={`list-empty-state-${entityType}`}
      />
    )
  }

  // Standard empty state without collaboration features
  return (
    <div className={cn('flex flex-col', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <EmptyState
        icon={config.icon}
        title={title}
        description={description}
        hint={hint}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        variant={variant}
        size={size}
        testId={`list-empty-state-${entityType}`}
      />

      {/* Contextual Suggestions */}
      {showContextualSuggestions && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
          <ContextualSuggestions
            context={config.suggestionContext}
            limit={3}
            variant="compact"
            size={size === 'lg' ? 'md' : 'sm'}
            showTitle
            testId={`list-suggestions-${entityType}`}
          />
        </div>
      )}
    </div>
  )
}
