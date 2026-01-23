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
        return <Mail className="h-5 w-5 text-blue-500" />
      case 'phone':
        return <Phone className="h-5 w-5 text-green-500" />
      case 'in_person':
        return <Users className="h-5 w-5 text-purple-500" />
      case 'formal_letter':
        return <FileText className="h-5 w-5 text-orange-500" />
      default:
        return <Mail className="h-5 w-5 text-gray-500" />
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
            <Info className="h-12 w-12 mb-3 opacity-50" />
            <p>{t('sections.electedOfficial.noContactPreferences')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Preferred Channel & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Preferred Channel */}
          {preferences?.preferred_channel && (
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 mb-2">
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
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-indigo-500" />
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
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('sections.electedOfficial.schedulingNotes')}
            </h3>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
              <p className="text-sm leading-relaxed">{schedulingNotes}</p>
            </div>
          </div>
        )}

        {/* Protocol Notes */}
        {protocolNotes && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('sections.electedOfficial.protocolNotes')}
            </h3>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
              <p className="text-sm leading-relaxed">{protocolNotes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
