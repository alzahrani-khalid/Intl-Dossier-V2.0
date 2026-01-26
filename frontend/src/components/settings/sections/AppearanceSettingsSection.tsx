import { useTranslation } from 'react-i18next'
import { Palette, Sun, Moon, Monitor, Check, LayoutGrid } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SettingsSectionCard, SettingsGroup } from '../SettingsSectionCard'
import { cn } from '@/lib/utils'

interface AppearanceSettingsSectionProps {
  form: UseFormReturn<any>
}

/**
 * Appearance settings section component
 * Handles color mode, theme, and display density
 */
export function AppearanceSettingsSection({ form }: AppearanceSettingsSectionProps) {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  const colorMode = form.watch('color_mode')
  const theme = form.watch('theme')
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

  const themes = [
    {
      value: 'canvas',
      label: t('appearance.canvas'),
      description: t('appearance.canvasDesc'),
      colors: ['hsl(155 50.6% 37.3%)', 'hsl(0 0% 89.8%)', 'hsl(155 55.8% 58.4%)'],
    },
    {
      value: 'ocean',
      label: t('appearance.ocean'),
      description: t('appearance.oceanDesc'),
      colors: ['hsl(210 70% 40%)', 'hsl(210 20% 90%)', 'hsl(210 60% 55%)'],
    },
    {
      value: 'sunset',
      label: t('appearance.sunset'),
      description: t('appearance.sunsetDesc'),
      colors: ['hsl(25 85% 45%)', 'hsl(30 30% 90%)', 'hsl(25 75% 60%)'],
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
      <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
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
                  onClick={() => form.setValue('color_mode', mode.value, { shouldDirty: true })}
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

        {/* Theme Section */}
        <SettingsGroup title={t('appearance.theme')}>
          <p className="text-sm text-muted-foreground text-start -mt-2 mb-3">
            {t('appearance.themeHint')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themes.map((themeOption) => {
              const isSelected = theme === themeOption.value

              return (
                <Card
                  key={themeOption.value}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md relative',
                    isSelected && 'ring-2 ring-primary',
                  )}
                  onClick={() => form.setValue('theme', themeOption.value, { shouldDirty: true })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1">
                        {themeOption.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary ms-auto" />}
                    </div>
                    <div className="text-start">
                      <span className="text-sm font-medium block">{themeOption.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {themeOption.description}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </SettingsGroup>

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
