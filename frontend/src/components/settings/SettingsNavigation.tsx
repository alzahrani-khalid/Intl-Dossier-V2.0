import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/signature-visuals'
import type { SettingsSectionId } from '@/types/settings.types'

interface SectionDef {
  id: SettingsSectionId
  labelKey: string
  icon: IconName
}

interface NavGroup {
  /** i18n key under the `settings` namespace, e.g. `navGroups.account` */
  labelKey: string
  sections: SectionDef[]
}

/**
 * Phase 85-02 — F20 groups the 9 settings sections under three muted section
 * headers (D-85-05). The section list itself is unchanged: the canonical R-02
 * order (profile → integrations) is preserved by concatenating the groups in
 * order, so downstream `data-testid` ordering and the `NAV_ITEMS` export stay
 * byte-identical. Default buckets (user-confirmable at the render checkpoint):
 *   Account         → profile, general, appearance, notifications
 *   Privacy & access → security, accessibility, data-privacy
 *   Connected       → email-digest, integrations
 *
 * The Security section keeps `id: 'security'` (component rename deferred) but its
 * label key is `nav.accessAndSecurity` per D-09.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'navGroups.account',
    sections: [
      { id: 'profile', labelKey: 'profile', icon: 'people' },
      { id: 'general', labelKey: 'general', icon: 'cog' },
      { id: 'appearance', labelKey: 'appearance', icon: 'sparkle' },
      { id: 'notifications', labelKey: 'notifications', icon: 'bell' },
    ],
  },
  {
    labelKey: 'navGroups.privacyAccess',
    sections: [
      { id: 'security', labelKey: 'accessAndSecurity', icon: 'shield' },
      { id: 'accessibility', labelKey: 'accessibility', icon: 'check' },
      { id: 'data-privacy', labelKey: 'dataPrivacy', icon: 'lock' },
    ],
  },
  {
    labelKey: 'navGroups.connected',
    sections: [
      { id: 'email-digest', labelKey: 'emailDigest', icon: 'file' },
      { id: 'integrations', labelKey: 'integrations', icon: 'link' },
    ],
  },
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
 * F18 (Phase 85-02): a "Back to app" affordance sits above the section list —
 * the global Sidebar is suppressed on /settings, so this is the return path.
 * The chevron points inline-start ("back") and flips in RTL per D-85-07.
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
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  return (
    <nav className="card settings-nav-card" aria-label={t('pageTitle')}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: '/' })}
        className="mb-2 justify-start"
        data-testid="settings-back-to-app"
      >
        <ChevronRight className={cn('size-4', isRTL ? 'ms-2' : 'me-2', !isRTL && 'rotate-180')} />
        <span className="text-start">{t('backToApp')}</span>
      </Button>

      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey} className="settings-nav-group">
          <div className="settings-nav-group-header px-2.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-faint)]">
            {t(group.labelKey)}
          </div>
          {group.sections.map((s) => (
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
        </div>
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
 * '@/components/settings'` callsites that may still exist. It flattens the
 * grouped structure back to the canonical R-02 order (W-1).
 */
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.sections)
