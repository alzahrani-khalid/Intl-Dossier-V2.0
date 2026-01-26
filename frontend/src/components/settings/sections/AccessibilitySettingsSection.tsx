import { useTranslation } from 'react-i18next'
import { Accessibility, Contrast, Type, Sparkles, Keyboard, Focus, Monitor } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SettingsSectionCard, SettingsItem, SettingsGroup } from '../SettingsSectionCard'
import { cn } from '@/lib/utils'

interface AccessibilitySettingsSectionProps {
  form: UseFormReturn<any>
}

/**
 * Accessibility settings section component
 * Handles visual, motion, and navigation accessibility preferences
 */
export function AccessibilitySettingsSection({ form }: AccessibilitySettingsSectionProps) {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  const highContrast = form.watch('high_contrast')
  const largeText = form.watch('large_text')
  const reduceMotion = form.watch('reduce_motion')
  const keyboardOnly = form.watch('keyboard_only')
  const focusIndicators = form.watch('focus_indicators')
  const screenReader = form.watch('screen_reader')

  const focusOptions = [
    { value: 'default', label: t('accessibility.focusDefault') },
    { value: 'enhanced', label: t('accessibility.focusEnhanced') },
    { value: 'none', label: t('accessibility.focusNone') },
  ]

  return (
    <SettingsSectionCard
      title={t('accessibility.title')}
      description={t('accessibility.description')}
      icon={Accessibility}
    >
      <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Visual Settings */}
        <SettingsGroup title={t('accessibility.visual')}>
          <SettingsItem
            label={t('accessibility.highContrast')}
            description={t('accessibility.highContrastDesc')}
            icon={Contrast}
          >
            <Switch
              checked={highContrast}
              onCheckedChange={(checked) =>
                form.setValue('high_contrast', checked, { shouldDirty: true })
              }
            />
          </SettingsItem>

          <SettingsItem
            label={t('accessibility.largeText')}
            description={t('accessibility.largeTextDesc')}
            icon={Type}
          >
            <Switch
              checked={largeText}
              onCheckedChange={(checked) =>
                form.setValue('large_text', checked, { shouldDirty: true })
              }
            />
          </SettingsItem>
        </SettingsGroup>

        {/* Motion Settings */}
        <SettingsGroup title={t('accessibility.motion')}>
          <SettingsItem
            label={t('accessibility.reduceMotion')}
            description={t('accessibility.reduceMotionDesc')}
            icon={Sparkles}
          >
            <Switch
              checked={reduceMotion}
              onCheckedChange={(checked) =>
                form.setValue('reduce_motion', checked, { shouldDirty: true })
              }
            />
          </SettingsItem>
        </SettingsGroup>

        {/* Navigation Settings */}
        <SettingsGroup title={t('accessibility.navigation')}>
          <SettingsItem
            label={t('accessibility.keyboardOnly')}
            description={t('accessibility.keyboardOnlyDesc')}
            icon={Keyboard}
          >
            <Switch
              checked={keyboardOnly}
              onCheckedChange={(checked) =>
                form.setValue('keyboard_only', checked, { shouldDirty: true })
              }
            />
          </SettingsItem>

          {/* Focus Indicators */}
          <div className="rounded-lg border p-3 sm:p-4 space-y-3">
            <div className="flex items-start gap-3 text-start">
              <Focus className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('accessibility.focusIndicators')}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('accessibility.focusIndicatorsDesc')}
                </p>
              </div>
            </div>
            <RadioGroup
              value={focusIndicators}
              onValueChange={(value) =>
                form.setValue('focus_indicators', value, { shouldDirty: true })
              }
              className="flex flex-wrap gap-2 ms-8"
            >
              {focusOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border',
                    'cursor-pointer hover:bg-muted/50',
                    focusIndicators === option.value && 'border-primary bg-muted/30',
                  )}
                  onClick={() =>
                    form.setValue('focus_indicators', option.value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <SettingsItem
            label={t('accessibility.screenReader')}
            description={t('accessibility.screenReaderDesc')}
            icon={Monitor}
          >
            <Switch
              checked={screenReader}
              onCheckedChange={(checked) =>
                form.setValue('screen_reader', checked, { shouldDirty: true })
              }
            />
          </SettingsItem>
        </SettingsGroup>
      </div>
    </SettingsSectionCard>
  )
}
