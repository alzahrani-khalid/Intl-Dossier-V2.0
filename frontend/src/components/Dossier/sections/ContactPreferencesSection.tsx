/**
 * Contact Preferences Section
 *
 * Displays the elected official's preferred contact methods and protocol notes.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Mail, Phone, Users, FileText, Clock, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ElectedOfficialDossier } from '@/lib/dossier-type-guards'

interface ContactPreferencesSectionProps {
  dossier: ElectedOfficialDossier
}

export function ContactPreferencesSection({ dossier }: ContactPreferencesSectionProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const { extension } = dossier
  const preferences = extension.contact_preferences

  // Get channel icon
  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="size-5 text-blue-500" />
      case 'phone':
        return <Phone className="size-5 text-green-500" />
      case 'in_person':
        return <Users className="size-5 text-purple-500" />
      case 'formal_letter':
        return <FileText className="size-5 text-orange-500" />
      default:
        return <Mail className="size-5 text-gray-500" />
    }
  }

  // Get channel label
  const getChannelLabel = (channel?: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      email: { en: 'Email', ar: 'البريد الإلكتروني' },
      phone: { en: 'Phone', ar: 'الهاتف' },
      in_person: { en: 'In Person', ar: 'شخصياً' },
      formal_letter: { en: 'Formal Letter', ar: 'خطاب رسمي' },
    }
    return labels[channel || 'email']?.[isRTL ? 'ar' : 'en'] || channel
  }

  // Get time label
  const getTimeLabel = (time?: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      morning: { en: 'Morning', ar: 'صباحاً' },
      afternoon: { en: 'Afternoon', ar: 'بعد الظهر' },
      evening: { en: 'Evening', ar: 'مساءً' },
    }
    return labels[time || 'morning']?.[isRTL ? 'ar' : 'en'] || time
  }

  const schedulingNotes = isRTL
    ? preferences?.scheduling_notes_ar || preferences?.scheduling_notes_en
    : preferences?.scheduling_notes_en

  const protocolNotes = isRTL
    ? preferences?.protocol_notes_ar || preferences?.protocol_notes_en
    : preferences?.protocol_notes_en

  if (!preferences && !schedulingNotes && !protocolNotes) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Info className="mb-3 size-12 opacity-50" />
            <p>{t('sections.electedOfficial.noContactPreferences')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-4 p-0" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Preferred Channel & Time */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Preferred Channel */}
          {preferences?.preferred_channel && (
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="mb-2 flex items-center gap-3">
                {getChannelIcon(preferences.preferred_channel)}
                <span className="text-sm font-medium text-muted-foreground">
                  {t('sections.electedOfficial.preferredChannel')}
                </span>
              </div>
              <Badge variant="secondary" className="text-sm">
                {getChannelLabel(preferences.preferred_channel)}
              </Badge>
            </div>
          )}

          {/* Best Time */}
          {preferences?.best_time && (
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="mb-2 flex items-center gap-3">
                <Clock className="size-5 text-indigo-500" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t('sections.electedOfficial.bestTime')}
                </span>
              </div>
              <Badge variant="secondary" className="text-sm">
                {getTimeLabel(preferences.best_time)}
              </Badge>
            </div>
          )}
        </div>

        {/* Scheduling Notes */}
        {schedulingNotes && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('sections.electedOfficial.schedulingNotes')}
            </h3>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="text-sm leading-relaxed">{schedulingNotes}</p>
            </div>
          </div>
        )}

        {/* Protocol Notes */}
        {protocolNotes && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('sections.electedOfficial.protocolNotes')}
            </h3>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-sm leading-relaxed">{protocolNotes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
