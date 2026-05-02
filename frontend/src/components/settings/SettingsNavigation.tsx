import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Icon, type IconName } from '@/components/signature-visuals'
import type { SettingsSectionId } from '@/types/settings.types'

interface SectionDef {
  id: SettingsSectionId
  labelKey: string
  icon: IconName
}

/**
 * Phase 42-09 — 9 settings sections per R-02 (preserves all shipped sections;
 * does NOT drop email-digest or integrations).
 *
 * Order is the canonical R-02 sequence. The Security section keeps its
 * original `id: 'security'` (component file rename deferred to Phase 43)
 * but its label key is `nav.accessAndSecurity` per D-09.
 */
const SECTIONS: SectionDef[] = [
  { id: 'profile', labelKey: 'profile', icon: 'people' },
  { id: 'general', labelKey: 'general', icon: 'cog' },
  { id: 'appearance', labelKey: 'appearance', icon: 'sparkle' },
  { id: 'notifications', labelKey: 'notifications', icon: 'bell' },
  { id: 'security', labelKey: 'accessAndSecurity', icon: 'shield' },
  { id: 'accessibility', labelKey: 'accessibility', icon: 'check' },
  { id: 'data-privacy', labelKey: 'dataPrivacy', icon: 'lock' },
  { id: 'email-digest', labelKey: 'emailDigest', icon: 'file' },
  { id: 'integrations', labelKey: 'integrations', icon: 'link' },
]

interface SettingsNavigationProps {
  /** Currently active section */
  activeSection: SettingsSectionId
  /** Callback when section changes */
  onChange: (id: SettingsSectionId) => void
}

/**
 * Settings navigation — handoff `.settings-nav` chrome (R-02, D-09, D-12).
 *
 * Desktop (≥768px): vertical nav rows with active accent bar via
 * `.settings-nav.active::before` (defined in index.css).
 * Mobile  (≤768px): the `@media (max-width: 768px)` block in index.css
 * flips `.settings-nav-card` into a horizontal scrollable pill row;
 * active marker becomes a `border-block-end` underline.
 */
export function SettingsNavigation({
  activeSection,
  onChange,
}: SettingsNavigationProps): React.JSX.Element {
  const { t } = useTranslation('settings')

  return (
    <nav className="card settings-nav-card" aria-label={t('pageTitle')}>
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          data-testid={`settings-nav-${s.id}`}
          className={cn('settings-nav', activeSection === s.id && 'active')}
          style={{ minHeight: 44 }}
          aria-current={activeSection === s.id ? 'page' : undefined}
          onClick={() => onChange(s.id)}
        >
          <Icon name={s.icon} size={16} aria-hidden />
          <span className="text-start">{t(`nav.${s.labelKey}`)}</span>
        </button>
      ))}
    </nav>
  )
}

/**
 * Backward-compatible export — the legacy `SettingsTabs` and `NAV_ITEMS`
 * named exports were consumed by `SettingsLayout` (mobile drawer) and the
 * settings barrel. The mobile pill row is now CSS-driven (Plan 03 added
 * `@media (max-width: 768px)` to index.css), so neither symbol has any
 * runtime consumers after the reskin. We preserve a stub `NAV_ITEMS` for
 * the barrel re-export to avoid breaking `import { NAV_ITEMS } from
 * '@/components/settings'` callsites that may still exist.
 */
export const NAV_ITEMS = SECTIONS
