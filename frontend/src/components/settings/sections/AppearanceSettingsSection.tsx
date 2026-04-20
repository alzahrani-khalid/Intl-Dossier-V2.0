import { useTranslation } from 'react-i18next'
import { Palette, Sun, Moon, Monitor, Check, LayoutGrid } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SettingsSectionCard, SettingsGroup } from '../SettingsSectionCard'
import { cn } from '@/lib/utils'
import { useMode } from '@/design-system/hooks/useMode'

interface AppearanceSettingsSectionProps {
  form: UseFormReturn<any>
}

/**
 * Appearance settings section component.
 *
 * Handles color mode + display density. The legacy 4-option theme picker
 * (canvas/azure/lavender/bluesky) was removed in Phase 33-07: it wrote OKLCH
 * palettes that no longer exist. Phase 34's tweaks-drawer replaces the theme
 * picker with a full direction × mode × hue × density surface mounted from
 * the topbar.
 */
export function AppearanceSettingsSection({ form }: AppearanceSettingsSectionProps) {
  const { t } = useTranslation('settings')
  const { setMode } = useMode()
  const colorMode = form.watch('color_mode')
  const displayDensity = form.watch('display_density')

  const colorModes = [
    {
      value: 'light',
      label: t('appearance.lightMode'),
      icon: Sun,
      color: 'text-yellow-500',
    },
    {
      value: 'dark',
      label: t('appearance.darkMode'),
      icon: Moon,
      color: 'text-blue-500',
    },
    {
      value: 'system',
      label: t('appearance.systemMode'),
      icon: Monitor,
      color: 'text-muted-foreground',
    },
  ]

  const densities = [
    {
      value: 'compact',
      label: t('appearance.compact'),
      description: t('appearance.compactDesc'),
    },
    {
      value: 'comfortable',
      label: t('appearance.comfortable'),
      description: t('appearance.comfortableDesc'),
    },
    {
      value: 'spacious',
      label: t('appearance.spacious'),
      description: t('appearance.spaciousDesc'),
    },
  ]

  return (
    <SettingsSectionCard
      title={t('appearance.title')}
      description={t('appearance.description')}
      icon={Palette}
    >
      <div className="space-y-8">
        {/* Color Mode Section */}
        <SettingsGroup title={t('appearance.colorMode')}>
          <p className="text-sm text-muted-foreground text-start -mt-2 mb-3">
            {t('appearance.colorModeHint')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {colorModes.map((mode) => {
              const Icon = mode.icon
              const isSelected = colorMode === mode.value

              return (
                <Card
                  key={mode.value}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    'min-h-[88px]',
                    isSelected && 'ring-2 ring-primary',
                  )}
                  onClick={() => {
                    form.setValue('color_mode', mode.value, { shouldDirty: true })
                    // useMode accepts only 'light' | 'dark' at the engine level;
                    // 'system' is resolved one level up (by DesignProvider / FOUC
                    // bootstrap reading matchMedia). Skip the direct call here.
                    if (mode.value !== 'system') {
                      setMode(mode.value as 'light' | 'dark')
                    }
                  }}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                    <Icon className={cn('h-8 w-8 mb-2', mode.color)} />
                    <span className="text-sm font-medium">{mode.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary absolute top-2 end-2" />}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </SettingsGroup>

        {/* Theme picker moved to Phase 34 tweaks-drawer (topbar).
            Legacy 4-option picker removed in 33-07: direction/mode/hue/density
            are the new axes, exposed via DesignProvider + useDesignDirection etc. */}

        {/* Display Density Section */}
        <SettingsGroup title={t('appearance.displayDensity')}>
          <p className="text-sm text-muted-foreground text-start -mt-2 mb-3">
            {t('appearance.displayDensityHint')}
          </p>
          <RadioGroup
            value={displayDensity}
            onValueChange={(value) =>
              form.setValue('display_density', value, { shouldDirty: true })
            }
            className="space-y-2"
          >
            {densities.map((density) => (
              <div
                key={density.value}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  'cursor-pointer hover:bg-muted/50',
                  displayDensity === density.value && 'border-primary bg-muted/30',
                )}
                onClick={() =>
                  form.setValue('display_density', density.value, { shouldDirty: true })
                }
              >
                <RadioGroupItem value={density.value} id={density.value} />
                <div className="flex-1 text-start">
                  <Label htmlFor={density.value} className="text-sm font-medium cursor-pointer">
                    {density.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{density.description}</p>
                </div>
                <LayoutGrid
                  className={cn(
                    'h-5 w-5 text-muted-foreground',
                    density.value === 'compact' && 'scale-75',
                    density.value === 'spacious' && 'scale-125',
                  )}
                />
              </div>
            ))}
          </RadioGroup>
        </SettingsGroup>
      </div>
    </SettingsSectionCard>
  )
}
