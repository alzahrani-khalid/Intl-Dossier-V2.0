/**
 * Elected Official Profile Section
 *
 * Displays the elected official's profile including photo, title, office,
 * political affiliation, and contact information.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import {
  User,
  Building2,
  MapPin,
  Flag,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Twitter,
  Linkedin,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { ElectedOfficialDossier } from '@/lib/dossier-type-guards'

interface ElectedOfficialProfileProps {
  dossier: ElectedOfficialDossier
}

export function ElectedOfficialProfile({ dossier }: ElectedOfficialProfileProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const { extension } = dossier

  // Get display values based on language
  const name = isRTL ? dossier.name_ar : dossier.name_en
  const title = isRTL ? extension.title_ar : extension.title_en
  const officeName = isRTL ? extension.office_name_ar : extension.office_name_en
  const district = isRTL ? extension.district_ar : extension.district_en
  const party = isRTL ? extension.party_ar : extension.party_en
  const biography = isRTL ? extension.biography_ar : extension.biography_en
  const officeAddress = isRTL ? extension.address_office_ar : extension.address_office_en

  // Get office type label
  const getOfficeTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      head_of_state: { en: 'Head of State', ar: 'رئيس الدولة' },
      head_of_government: { en: 'Head of Government', ar: 'رئيس الحكومة' },
      cabinet_minister: { en: 'Cabinet Minister', ar: 'وزير' },
      legislature_upper: { en: 'Upper Legislature', ar: 'مجلس أعلى' },
      legislature_lower: { en: 'Lower Legislature', ar: 'مجلس أدنى' },
      regional_executive: { en: 'Regional Executive', ar: 'تنفيذي إقليمي' },
      regional_legislature: { en: 'Regional Legislature', ar: 'تشريعي إقليمي' },
      local_executive: { en: 'Local Executive', ar: 'تنفيذي محلي' },
      local_legislature: { en: 'Local Legislature', ar: 'تشريعي محلي' },
      judiciary: { en: 'Judiciary', ar: 'قضائي' },
      ambassador: { en: 'Ambassador', ar: 'سفير' },
      international_org: { en: 'International Organization', ar: 'منظمة دولية' },
      other: { en: 'Other', ar: 'أخرى' },
    }
    return labels[type]?.[isRTL ? 'ar' : 'en'] || type
  }

  // Get importance badge variant
  const getImportanceBadge = (level?: number) => {
    const variants: Record<number, { label: string; className: string }> = {
      1: { label: t('importance.regular'), className: 'bg-gray-100 text-gray-800' },
      2: { label: t('importance.important'), className: 'bg-blue-100 text-blue-800' },
      3: { label: t('importance.key'), className: 'bg-yellow-100 text-yellow-800' },
      4: { label: t('importance.vip'), className: 'bg-purple-100 text-purple-800' },
      5: { label: t('importance.critical'), className: 'bg-red-100 text-red-800' },
    }
    return variants[level || 2] || variants[2]
  }

  const importanceBadge = getImportanceBadge(extension.importance_level)

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0 space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
            <AvatarImage src={extension.photo_url} alt={name} />
            <AvatarFallback className="text-2xl">{name?.charAt(0) || 'EO'}</AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-start space-y-2">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold">{name}</h2>
              {title && <p className="text-base sm:text-lg text-muted-foreground">{title}</p>}
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {extension.is_current_term && (
                <Badge variant="default" className="bg-green-500">
                  {t('status.currentTerm')}
                </Badge>
              )}
              <Badge className={importanceBadge.className}>{importanceBadge.label}</Badge>
              {party && extension.party_abbreviation && (
                <Badge variant="outline">{extension.party_abbreviation}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Office Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('sections.electedOfficial.officeInfo')}
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {officeName && (
              <div className="flex items-start gap-3">
                <Building2
                  className={`h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 ${isRTL ? 'rotate-180' : ''}`}
                />
                <div>
                  <p className="font-medium">{officeName}</p>
                  <p className="text-sm text-muted-foreground">
                    {getOfficeTypeLabel(extension.office_type)}
                  </p>
                </div>
              </div>
            )}

            {district && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>{district}</span>
              </div>
            )}

            {party && (
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>{party}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('sections.electedOfficial.contactInfo')}
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {extension.email_official && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <a
                  href={`mailto:${extension.email_official}`}
                  className="text-primary hover:underline"
                >
                  {extension.email_official}
                </a>
              </div>
            )}

            {extension.phone_office && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${extension.phone_office}`} className="text-primary hover:underline">
                  {extension.phone_office}
                </a>
              </div>
            )}

            {officeAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-sm">{officeAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Websites */}
        {(extension.website_official || extension.website_campaign) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('sections.electedOfficial.websites')}
            </h3>

            <div className="flex flex-wrap gap-2">
              {extension.website_official && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={extension.website_official}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    {t('sections.electedOfficial.officialWebsite')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              {extension.website_campaign && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={extension.website_campaign}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    {t('sections.electedOfficial.campaignWebsite')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Social Media */}
        {extension.social_media && Object.keys(extension.social_media).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('sections.electedOfficial.socialMedia')}
            </h3>

            <div className="flex flex-wrap gap-2">
              {extension.social_media.twitter && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://twitter.com/${extension.social_media.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    {extension.social_media.twitter}
                  </a>
                </Button>
              )}
              {extension.social_media.linkedin && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={extension.social_media.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Biography */}
        {biography && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('sections.electedOfficial.biography')}
            </h3>
            <p className="text-sm leading-relaxed">{biography}</p>
          </div>
        )}

        {/* Policy Priorities */}
        {extension.policy_priorities && extension.policy_priorities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('sections.electedOfficial.policyPriorities')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {extension.policy_priorities.map((priority, index) => (
                <Badge key={index} variant="secondary">
                  {priority}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
