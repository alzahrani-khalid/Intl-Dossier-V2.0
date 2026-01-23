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
        <Card className="h-full transition-shadow hover:shadow-md">
          <CardContent className="flex h-full flex-col p-4 sm:p-5">
            {/* Avatar and Name */}
            <div className="mb-3 flex items-start gap-3">
              <Avatar className="size-12 shrink-0 sm:size-14">
                <AvatarImage src={contact.photo_url} alt={displayName} />
                <AvatarFallback className="bg-teal-100 text-sm font-semibold text-teal-800 dark:bg-teal-900 dark:text-teal-300">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
                  {displayName}
                </h4>
                {displayTitle && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
                    {displayTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex-1 space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="size-3 shrink-0" />
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="mt-4 border-t pt-3">
              <Button variant="outline" size="sm" className="min-h-10 w-full">
                <ExternalLink className="me-2 size-4" />
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
        className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 rounded-full bg-muted p-4 sm:p-6">
          <Users className="size-8 text-muted-foreground sm:size-10" />
        </div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground sm:text-base">
          {t('sections.organization.keyContactsEmpty', 'No Key Contacts')}
        </h3>
        <p className="mb-6 max-w-md text-xs text-muted-foreground sm:text-sm">
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
