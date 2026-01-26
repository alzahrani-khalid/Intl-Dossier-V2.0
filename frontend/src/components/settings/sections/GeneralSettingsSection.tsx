import { useTranslation } from 'react-i18next'
import { Settings2, Globe, Clock, Calendar } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingsSectionCard, SettingsGroup } from '../SettingsSectionCard'
import { TIMEZONE_OPTIONS } from '@/types/settings.types'

interface GeneralSettingsSectionProps {
  form: UseFormReturn<any>
}

/**
 * General settings section component
 * Handles language, timezone, date format, and start of week
 */
export function GeneralSettingsSection({ form }: GeneralSettingsSectionProps) {
  const { t, i18n } = useTranslation('settings')
  const isRTL = i18n.language === 'ar'

  const languagePreference = form.watch('language_preference')
  const timezone = form.watch('timezone')
  const dateFormat = form.watch('date_format')
  const startOfWeek = form.watch('start_of_week')

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: t('dateFormats.DD/MM/YYYY') },
    { value: 'MM/DD/YYYY', label: t('dateFormats.MM/DD/YYYY') },
    { value: 'YYYY-MM-DD', label: t('dateFormats.YYYY-MM-DD') },
  ]

  const weekStartOptions = [
    { value: 'sunday', label: t('general.sunday') },
    { value: 'monday', label: t('general.monday') },
    { value: 'saturday', label: t('general.saturday') },
  ]

  return (
    <SettingsSectionCard
      title={t('general.title')}
      description={t('general.description')}
      icon={Settings2}
    >
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Language Selection */}
        <SettingsGroup>
          <div className="space-y-3">
            <div>
              <Label className="text-start block">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('general.language')}
                </span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1 text-start">
                {t('general.languageHint')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={languagePreference === 'en' ? 'default' : 'outline'}
                onClick={() => form.setValue('language_preference', 'en', { shouldDirty: true })}
                className="min-h-11"
              >
                <Globe className="h-4 w-4 me-2" />
                English
              </Button>
              <Button
                type="button"
                variant={languagePreference === 'ar' ? 'default' : 'outline'}
                onClick={() => form.setValue('language_preference', 'ar', { shouldDirty: true })}
                className="min-h-11"
              >
                <Globe className="h-4 w-4 me-2" />
                العربية
              </Button>
            </div>
          </div>
        </SettingsGroup>

        {/* Timezone Selection */}
        <SettingsGroup>
          <div className="space-y-3">
            <div>
              <Label className="text-start block">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('general.timezone')}
                </span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1 text-start">
                {t('general.timezoneHint')}
              </p>
            </div>
            <Select
              value={timezone}
              onValueChange={(value) => form.setValue('timezone', value, { shouldDirty: true })}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {t(`timezones.${tz.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SettingsGroup>

        {/* Date Format */}
        <SettingsGroup>
          <div className="space-y-3">
            <div>
              <Label className="text-start block">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('general.dateFormat')}
                </span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1 text-start">
                {t('general.dateFormatHint')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {dateFormats.map((format) => (
                <Button
                  key={format.value}
                  type="button"
                  variant={dateFormat === format.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => form.setValue('date_format', format.value, { shouldDirty: true })}
                  className="min-h-10"
                >
                  {format.value}
                </Button>
              ))}
            </div>
          </div>
        </SettingsGroup>

        {/* Start of Week */}
        <SettingsGroup>
          <div className="space-y-3">
            <div>
              <Label className="text-start block">{t('general.startOfWeek')}</Label>
              <p className="text-xs text-muted-foreground mt-1 text-start">
                {t('general.startOfWeekHint')}
              </p>
            </div>
            <Select
              value={startOfWeek}
              onValueChange={(value) =>
                form.setValue('start_of_week', value, { shouldDirty: true })
              }
            >
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekStartOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SettingsGroup>
      </div>
    </SettingsSectionCard>
  )
}
