/**
 * KeyContacts Section Component
 *
 * Displays person dossiers related to organization via dossier_relationships table.
 * Horizontal carousel layout with person details, mobile-first responsive, RTL support.
 * Includes smart import suggestions for empty state.
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Users, UserCircle, Mail, Phone, ExternalLink } from 'lucide-react'
import { SmartImportSuggestion } from '@/components/smart-import'
import { RelatedEntityCarousel, type CarouselItem } from '@/components/ui/related-entity-carousel'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { OrganizationDossier } from '@/lib/dossier-type-guards'

interface KeyContactsProps {
  dossier: OrganizationDossier
}

/**
 * Contact carousel item type
 */
interface ContactCarouselItem extends CarouselItem {
  name: string
  name_ar?: string
  title?: string
  title_ar?: string
  email?: string
  phone?: string
  photo_url?: string
}

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

export function KeyContacts({ dossier }: KeyContactsProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()

  // Placeholder - will fetch from dossier_relationships table in future
  const contacts: ContactCarouselItem[] = []

  // Handle smart import complete
  const handleSmartImportComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contacts', dossier.id] })
    queryClient.invalidateQueries({ queryKey: ['relationships', dossier.id] })
  }, [queryClient, dossier.id])

  // Render contact card for carousel
  const renderContactCard = useCallback(
    (contact: ContactCarouselItem) => {
      const displayName = isRTL && contact.name_ar ? contact.name_ar : contact.name
      const displayTitle = isRTL && contact.title_ar ? contact.title_ar : contact.title

      return (
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 h-full flex flex-col">
            {/* Avatar and Name */}
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0">
                <AvatarImage src={contact.photo_url} alt={displayName} />
                <AvatarFallback className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 text-sm font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2">
                  {displayName}
                </h4>
                {displayTitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {displayTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex-1 space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="mt-4 pt-3 border-t">
              <Button variant="outline" size="sm" className="w-full min-h-10">
                <ExternalLink className="h-4 w-4 me-2" />
                {t('action.viewDetails')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    },
    [isRTL, t],
  )

  if (contacts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
          <Users className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
          {t('sections.organization.keyContactsEmpty', 'No Key Contacts')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-6">
          {t(
            'sections.organization.keyContactsEmptyDescription',
            'Add contacts from email signatures or create person dossiers to populate this section.',
          )}
        </p>

        {/* Smart Import Suggestion */}
        <SmartImportSuggestion
          section="contacts"
          entityId={dossier.id}
          entityType="organization"
          onImportComplete={handleSmartImportComplete}
          className="w-full max-w-lg"
        />
      </div>
    )
  }

  return (
    <RelatedEntityCarousel
      items={contacts}
      renderItem={renderContactCard}
      title={t('carousel.linkedPersons')}
      emptyMessage={t('sections.organization.keyContactsEmpty', 'No Key Contacts')}
      emptyDescription={t('sections.organization.keyContactsEmptyDescription')}
      showNavigation={true}
      showIndicators={true}
      testId="key-contacts-carousel"
    />
  )
}
