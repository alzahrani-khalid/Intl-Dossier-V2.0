/**
 * KeyContactsSection Component
 * Feature: Everything about [Dossier] comprehensive view
 *
 * Displays key contacts associated with the dossier.
 * Mobile-first, RTL-supported.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Users,
  Mail,
  Phone,
  Building2,
  Calendar,
  ExternalLink,
  UserCircle,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import type { KeyContactsSectionProps, DossierKeyContact } from '@/types/dossier-overview.types'

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

/**
 * Format last interaction date
 */
function formatLastInteraction(date: string | null, locale: string): string | null {
  if (!date) return null
  const interactionDate = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - interactionDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return locale === 'ar-SA' ? 'اليوم' : 'Today'
  if (diffDays === 1) return locale === 'ar-SA' ? 'أمس' : 'Yesterday'
  if (diffDays < 7) return locale === 'ar-SA' ? `${diffDays} أيام` : `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return locale === 'ar-SA' ? `${weeks} أسابيع` : `${weeks} weeks ago`
  }

  return interactionDate.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Contact card component
 */
function ContactCard({ contact, isRTL }: { contact: DossierKeyContact; isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')
  const locale = isRTL ? 'ar-SA' : 'en-US'
  const displayName = isRTL && contact.name_ar ? contact.name_ar : contact.name
  const displayTitle = isRTL && contact.title_ar ? contact.title_ar : contact.title_en
  const displayOrg =
    isRTL && contact.organization_ar ? contact.organization_ar : contact.organization_en

  const lastInteraction = formatLastInteraction(contact.last_interaction_date, locale)

  const cardContent = (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardContent className="p-4 sm:p-5 h-full flex flex-col">
        {/* Avatar and Name */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0">
            <AvatarImage src={contact.photo_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base font-semibold line-clamp-2">{displayName}</h4>
            {displayTitle && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {displayTitle}
              </p>
            )}
          </div>
          {contact.linked_person_dossier_id && (
            <Badge variant="outline" className="text-xs shrink-0">
              <UserCircle className="h-3 w-3 me-1" />
              {t('keyContacts.linkedDossier')}
            </Badge>
          )}
        </div>

        {/* Organization */}
        {displayOrg && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{displayOrg}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="flex-1 space-y-1.5">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3 shrink-0" />
              <span dir="ltr">{contact.phone}</span>
            </a>
          )}
        </div>

        {/* Last Interaction */}
        {lastInteraction && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {t('keyContacts.lastInteraction')}: {lastInteraction}
            </span>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
            "{contact.notes}"
          </p>
        )}

        {/* View linked dossier */}
        {contact.linked_person_dossier_id && (
          <div className="mt-3 pt-3 border-t">
            <Button variant="outline" size="sm" className="w-full min-h-10" asChild>
              <Link to={getDossierDetailPath(contact.linked_person_dossier_id, 'person')}>
                <ExternalLink className="h-4 w-4 me-2" />
                {t('keyContacts.viewDossier')}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (contact.linked_person_dossier_id) {
    return (
      <Link to={getDossierDetailPath(contact.linked_person_dossier_id, 'person')}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

/**
 * Empty state component
 */
function EmptyState({ isRTL }: { isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')

  return (
    <div className="text-center py-8 sm:py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-4 rounded-full bg-muted inline-block mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium mb-2">{t('keyContacts.empty.title')}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {t('keyContacts.empty.description')}
      </p>
    </div>
  )
}

/**
 * Main KeyContactsSection component
 */
export function KeyContactsSection({
  data,
  isLoading,
  isRTL = false,
  className = '',
}: KeyContactsSectionProps) {
  const { t } = useTranslation('dossier-overview')

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.total_count === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('keyContacts.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <EmptyState isRTL={isRTL} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('keyContacts.title')}
          <Badge variant="secondary">{data.total_count}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {data.contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} isRTL={isRTL} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default KeyContactsSection
