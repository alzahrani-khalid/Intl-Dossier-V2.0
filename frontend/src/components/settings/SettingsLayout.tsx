import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsNavigation } from './SettingsNavigation'
import type { SettingsSectionId } from '@/types/settings.types'

interface SettingsLayoutProps {
  /** Currently active section */
  activeSection: SettingsSectionId
  /** Callback when section changes */
  onSectionChange: (section: SettingsSectionId) => void
  /** Whether settings data is still loading */
  isLoading?: boolean
  /** Whether there are unsaved changes */
  hasChanges?: boolean
  /** Whether saving is in progress */
  isSaving?: boolean
  /** Save handler */
  onSave?: () => void
  /** Children sections to render */
  children: ReactNode
}

/**
 * Phase 42-09 — Settings page layout (handoff 240+1fr two-column chrome).
 *
 * Desktop (≥768px): CSS Grid — 240px nav card + 1fr content card.
 * Mobile  (≤768px): the `@media (max-width: 768px)` block in index.css
 * collapses the grid into a single column with a horizontal pill nav
 * (Plan 03 ported the rule).
 *
 * Each section root carries `data-loading` so Playwright fixtures can
 * await page-readiness without `networkidle`.
 *
 * The `dir` attribute is wired off `i18n.language === 'ar'` (RTL) per
 * the project-wide pattern; the inner card uses logical-property CSS
 * (`text-start`, `inset-inline-start`, `border-block-end`) so the
 * accent bar / pill underline flip correctly.
 */
export function SettingsLayout({
  activeSection,
  onSectionChange,
  isLoading = false,
  hasChanges = false,
  isSaving = false,
  onSave,
  children,
}: SettingsLayoutProps): React.JSX.Element {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  return (
    <section
      role="region"
      aria-label={t('pageTitle')}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-loading={isLoading ? 'true' : 'false'}
      className="page settings-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: 'var(--gap)',
      }}
    >
      <SettingsNavigation activeSection={activeSection} onChange={onSectionChange} />

      <div className="card">
        <div
          className="card-head"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div className="card-title">
              {t(`${activeSection}.title`, { defaultValue: t(`nav.${navLabelKey(activeSection)}`) })}
            </div>
            <div className="card-sub">
              {t(`${activeSection}.description`, { defaultValue: '' })}
            </div>
          </div>
          {hasChanges && onSave && (
            <Button onClick={onSave} disabled={isSaving} className="min-h-11 min-w-32 shrink-0">
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
        {children}
      </div>
    </section>
  )
}

/**
 * Maps the legacy `SettingsSectionId` values onto the camelCase i18n nav-label
 * keys used in `settings.json` (post-D-09 rename). Used by both the layout
 * card-title fallback and the navigation component.
 */
function navLabelKey(id: SettingsSectionId): string {
  if (id === 'security') return 'accessAndSecurity'
  if (id === 'data-privacy') return 'dataPrivacy'
  if (id === 'email-digest') return 'emailDigest'
  return id
}

/* ----------------------------------------------------------------------------
 * Wrapper + skeleton + empty-state — preserved from the pre-reskin layout for
 * SettingsPage compatibility.  Visual chrome is reduced to the bare minimum so
 * the inner card does the styling.
 * -------------------------------------------------------------------------- */

interface SettingsSectionWrapperProps {
  sectionId: SettingsSectionId
  activeSection: SettingsSectionId
  children: ReactNode
}

export function SettingsSectionWrapper({
  sectionId,
  activeSection,
  children,
}: SettingsSectionWrapperProps): React.JSX.Element | null {
  if (sectionId !== activeSection) {
    return null
  }
  return <>{children}</>
}

export function SettingsSectionSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4 animate-pulse" data-testid="settings-skeleton">
      <div className="h-6 rounded" style={{ background: 'var(--line-soft)', width: '33%' }} />
      <div className="h-4 rounded" style={{ background: 'var(--line-soft)', width: '66%' }} />
      <div className="space-y-3 pt-4">
        {[0, 1, 2, 3].map((n) => (
          <div
            key={n}
            className="flex items-center justify-between p-4 rounded-lg"
            style={{ border: '1px solid var(--line)' }}
          >
            <div className="space-y-2 flex-1">
              <div className="h-4 rounded" style={{ background: 'var(--line-soft)', width: '25%' }} />
              <div className="h-3 rounded" style={{ background: 'var(--line-soft)', width: '50%' }} />
            </div>
            <div className="h-6 w-10 rounded-full" style={{ background: 'var(--line-soft)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

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
}: SettingsEmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="h-12 w-12 mb-4" style={{ color: 'var(--ink-faint)' }} />}
      <h3 className="text-lg font-medium" style={{ color: 'var(--ink)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--ink-mute)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
