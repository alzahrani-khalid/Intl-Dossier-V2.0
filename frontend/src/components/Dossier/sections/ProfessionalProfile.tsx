/**
 * Professional Profile Section (Feature 028 - User Story 4 - T036)
 * Displays biography, photo, title, contact info, expertise, and languages for person.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { User, Mail, Phone, Globe, ExternalLink, Linkedin, Languages, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { PersonDossier } from '@/lib/dossier-type-guards'

interface ProfessionalProfileProps {
  dossier: PersonDossier
}

export function ProfessionalProfile({ dossier }: ProfessionalProfileProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const { extension } = dossier

  // Get display values based on language
  const name = isRTL ? dossier.name_ar : dossier.name_en
  const title = isRTL ? extension.title_ar : extension.title_en
  const biography = isRTL ? extension.biography_ar : extension.biography_en

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // Get importance badge variant with fallback labels
  const getImportanceBadge = (level?: number) => {
    const variants: Record<number, { label: string; className: string }> = {
      1: { label: t('importance.regular', 'Regular'), className: 'bg-gray-100 text-gray-800' },
      2: { label: t('importance.important', 'Important'), className: 'bg-blue-100 text-blue-800' },
      3: { label: t('importance.key', 'Key Contact'), className: 'bg-yellow-100 text-yellow-800' },
      4: { label: t('importance.vip', 'VIP'), className: 'bg-purple-100 text-purple-800' },
      5: { label: t('importance.critical', 'Critical'), className: 'bg-red-100 text-red-800' },
    }
    return variants[level || 1] || variants[1]
  }

  const importanceBadge = getImportanceBadge(extension.importance_level)

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0 space-y-4 sm:space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
            <AvatarImage src={extension.photo_url} alt={name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {name ? getInitials(name) : <User className="h-10 w-10" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-start space-y-2">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold">{name}</h2>
              {title && <p className="text-base sm:text-lg text-muted-foreground">{title}</p>}
            </div>

            {importanceBadge && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <Badge className={importanceBadge.className}>{importanceBadge.label}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        {(extension.email || extension.phone) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('sections.person.contactInfo', 'Contact Information')}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {extension.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`mailto:${extension.email}`}
                    className="text-primary hover:underline break-all"
                  >
                    {extension.email}
                  </a>
                </div>
              )}

              {extension.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`tel:${extension.phone}`}
                    className="text-primary hover:underline"
                    dir="ltr"
                  >
                    {extension.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(extension.linkedin_url || extension.twitter_url) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('sections.person.websites', 'Websites & Social Media')}
            </h3>

            <div className="flex flex-wrap gap-2">
              {extension.linkedin_url && (
                <Button variant="outline" size="sm" asChild className="min-h-11 sm:min-h-9">
                  <a
                    href={extension.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              {extension.twitter_url && (
                <Button variant="outline" size="sm" asChild className="min-h-11 sm:min-h-9">
                  <a
                    href={extension.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Twitter/X
                    <ExternalLink className="h-3 w-3" />
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
              {t('sections.person.biography', 'Biography')}
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{biography}</p>
          </div>
        )}

        {/* Expertise Areas */}
        {extension.expertise_areas && extension.expertise_areas.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Award className="h-4 w-4" />
              {t('sections.person.expertiseAreas', 'Expertise Areas')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {extension.expertise_areas.map((area, index) => (
                <Badge key={index} variant="secondary">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {extension.languages && extension.languages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Languages className="h-4 w-4" />
              {t('sections.person.languages', 'Languages')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {extension.languages.map((language, index) => (
                <Badge key={index} variant="outline">
                  {language}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
