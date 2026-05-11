import { useTranslation } from 'react-i18next'
import { UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SettingsSectionCard, SettingsGroup } from '../SettingsSectionCard'
import { useDesignDirection } from '@/design-system/hooks/useDesignDirection'
import { useDensity } from '@/design-system/hooks/useDensity'
import { useHue } from '@/design-system/hooks/useHue'
import { useMode } from '@/design-system/hooks/useMode'
import type { Direction, Density, Mode } from '@/design-system/tokens/types'

interface AppearanceSettingsSectionProps {
  /**
   * Optional react-hook-form handle — kept for SettingsPage compatibility
   * (D-10 preserves the per-section form). The 4 design controls in this
   * section persist instantly via DesignProvider hooks (D-11) and do not
   * write through the form, so the prop is unused but accepted to keep
   * the existing parent wiring intact.
   */
  form?: UseFormReturn<any>
}

/**
 * Phase 42-09 — Appearance settings (D-11).
 *
 * Renders the 4 design-system axes — direction, mode, accent hue, density —
 * as direct bindings to DesignProvider hooks (the same hooks the Phase 34
 * TweaksDrawer uses, so state never diverges between the two surfaces).
 *
 * The legacy color_mode + display_density form bindings are dropped
 * here; the DesignProvider mode + density hooks (compact / comfortable
 * / dense, with the legacy-value migration shim from Plan 03) replace
 * them. The DB columns remain (writable via direct API for back-compat),
 * but the user-facing controls in this section are the design-system
 * primitives.
 */
export function AppearanceSettingsSection(_props: AppearanceSettingsSectionProps): React.JSX.Element {
  const { t } = useTranslation('settings')
  const { direction, setDirection } = useDesignDirection()
  const { mode, setMode } = useMode()
  const { hue, setHue } = useHue()
  const { density, setDensity } = useDensity()

  return (
    <SettingsSectionCard
      title={t('appearance.title')}
      description={t('appearance.description')}
    >
      <div className="space-y-8">
        <SettingsGroup title={t('appearance.direction.label')}>
          <p
            className="text-sm text-start -mt-2 mb-3"
            style={{ color: 'var(--ink-mute)' }}
          >
            {t('appearance.direction.help')}
          </p>
          <RadioGroup
            value={direction}
            onValueChange={(v) => setDirection(v as Direction)}
            className="space-y-2"
          >
            {(['bureau', 'chancery', 'situation', 'ministerial'] as const).map((d) => (
              <div
                key={d}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ border: '1px solid var(--line)', minHeight: 44 }}
              >
                <RadioGroupItem id={`dir-${d}`} value={d} />
                <Label htmlFor={`dir-${d}`} className="text-sm cursor-pointer">
                  {t(`appearance.direction.${d}`)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </SettingsGroup>

        <SettingsGroup title={t('appearance.mode.label')}>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            className="space-y-2"
          >
            {(['light', 'dark'] as const).map((m) => (
              <div
                key={m}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ border: '1px solid var(--line)', minHeight: 44 }}
              >
                <RadioGroupItem id={`mode-${m}`} value={m} />
                <Label htmlFor={`mode-${m}`} className="text-sm cursor-pointer">
                  {t(`appearance.mode.${m}`)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </SettingsGroup>

        <SettingsGroup title={t('appearance.hue.label')}>
          <div className="flex items-center justify-between">
            <Label htmlFor="hue-slider" className="text-sm">
              {t('appearance.hue.label')}
            </Label>
            <span className="text-sm" style={{ color: 'var(--ink-mute)' }}>
              {hue}°
            </span>
          </div>
          <input
            id="hue-slider"
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            style={{ width: '100%', minHeight: 44 }}
            aria-label={t('appearance.hue.label')}
          />
          <p className="text-sm" style={{ color: 'var(--ink-mute)' }}>
            {t('appearance.hue.help')}
          </p>
        </SettingsGroup>

        <SettingsGroup title={t('appearance.density.label')}>
          <RadioGroup
            value={density}
            onValueChange={(v) => setDensity(v as Density)}
            className="space-y-2"
          >
            {(['comfortable', 'compact', 'dense'] as const).map((d) => (
              <div
                key={d}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ border: '1px solid var(--line)', minHeight: 44 }}
              >
                <RadioGroupItem id={`density-${d}`} value={d} />
                <Label htmlFor={`density-${d}`} className="text-sm cursor-pointer">
                  {t(`appearance.density.${d}`)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </SettingsGroup>
      </div>
    </SettingsSectionCard>
  )
}
