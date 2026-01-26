import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SettingsNavigation, SettingsTabs } from './SettingsNavigation'
import { SettingsSectionId } from '@/types/settings.types'

interface SettingsLayoutProps {
  /** Children sections to render */
  children: ReactNode
  /** Currently active section */
  activeSection: SettingsSectionId
  /** Callback when section changes */
  onSectionChange: (section: SettingsSectionId) => void
  /** Whether there are unsaved changes */
  hasChanges?: boolean
  /** Whether saving is in progress */
  isSaving?: boolean
  /** Save handler */
  onSave?: () => void
}

/**
 * Main layout component for Settings page
 * Provides responsive sidebar/tabs navigation
 * Mobile-first, RTL-safe implementation
 */
export function SettingsLayout({
  children,
  activeSection,
  onSectionChange,
  hasChanges = false,
  isSaving = false,
  onSave,
}: SettingsLayoutProps) {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-start">{t('pageTitle')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 text-start">
            {t('pageDescription')}
          </p>
        </div>

        {/* Save button - always visible when changes exist */}
        {hasChanges && onSave && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="min-h-11 min-w-32 self-end sm:self-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 me-2" />
                {t('save')}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Mobile: Horizontal scrollable tabs */}
      <div className="lg:hidden mb-6">
        <SettingsTabs activeSection={activeSection} onSectionChange={onSectionChange} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Desktop: Sidebar navigation */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <Card className="sticky top-24">
            <CardContent className="p-3">
              <SettingsNavigation
                activeSection={activeSection}
                onSectionChange={onSectionChange}
                variant="sidebar"
              />
            </CardContent>
          </Card>
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0 space-y-6">{children}</main>
      </div>

      {/* Mobile: Bottom safe area padding for dock */}
      <div className="lg:hidden h-20" aria-hidden="true" />
    </div>
  )
}

/**
 * Wrapper for conditionally rendering sections based on active state
 */
interface SettingsSectionWrapperProps {
  /** Section ID to check */
  sectionId: SettingsSectionId
  /** Currently active section */
  activeSection: SettingsSectionId
  /** Children to render when active */
  children: ReactNode
}

export function SettingsSectionWrapper({
  sectionId,
  activeSection,
  children,
}: SettingsSectionWrapperProps) {
  if (sectionId !== activeSection) {
    return null
  }

  return <>{children}</>
}

/**
 * Loading skeleton for settings section
 */
export function SettingsSectionSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="space-y-3 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-6 w-10 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state component for settings sections
 */
interface SettingsEmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: ReactNode
}

export function SettingsEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: SettingsEmptyStateProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {Icon && <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
