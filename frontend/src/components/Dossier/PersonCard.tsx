/**
 * PersonCard Component
 * Part of: 026-unified-dossier-architecture implementation (User Story 7 - T126)
 *
 * Mobile-first, RTL-compatible card component specifically for person dossier types
 * with photo display, biography section, and contact information.
 *
 * Features:
 * - Responsive layout (320px mobile → desktop)
 * - RTL support via logical properties
 * - Photo avatar with fallback initials
 * - Biography display with expand/collapse
 * - Contact info section (organization, title, nationality)
 * - Touch-friendly action buttons (44x44px min)
 * - Accessibility compliant (WCAG AA)
 */

import { useState, memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User,
  Building2,
  Globe,
  Briefcase,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { DossierWithExtension, DossierStatus } from '@/services/dossier-api'

interface PersonCardProps {
  dossier: DossierWithExtension & {
    type: 'person'
    extension?: {
      title?: string
      organization_id?: string
      organization_name?: string
      nationality?: string
      contact_email?: string
      contact_phone?: string
      biography_en?: string
      biography_ar?: string
      photo_url?: string
    }
  }
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

/**
 * Get status color classes
 */
function getStatusColor(status: DossierStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    case 'deleted':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

/**
 * Extract initials from name (handles both English and Arabic)
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

/**
 * PersonCard component (memoized for performance - T055)
 * Prevents unnecessary re-renders when parent updates
 */
export const PersonCard = memo(function PersonCard({
  dossier,
  onView,
  onEdit,
  onDelete,
  className,
}: PersonCardProps) {
  const { t, i18n } = useTranslation(['dossier', 'person'])
  const isRTL = i18n.language === 'ar'
  const [isBioExpanded, setIsBioExpanded] = useState(false)

  const displayName = isRTL ? dossier.name_ar : dossier.name_en
  const displayBiography = isRTL ? dossier.extension?.biography_ar : dossier.extension?.biography_en
  const initials = displayName ? getInitials(displayName) : 'VIP'

  // Truncate biography for collapsed state
  const truncatedBio =
    displayBiography && displayBiography.length > 150
      ? displayBiography.slice(0, 150) + '...'
      : displayBiography

  return (
    <Card
      className={cn('flex flex-col gap-2 sm:gap-4', 'transition-shadow hover:shadow-lg', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6">
        {/* Header: Photo + Name + Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
            <AvatarImage src={dossier.extension?.photo_url} alt={displayName || ''} />
            <AvatarFallback className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 text-lg sm:text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name and ID */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg sm:text-xl md:text-2xl line-clamp-2 text-start">
                {displayName || t('dossier:untitled')}
              </CardTitle>
              <Badge
                variant="outline"
                className={cn('text-xs sm:text-sm w-fit', getStatusColor(dossier.status))}
              >
                {t(`dossier:status.${dossier.status}`)}
              </Badge>
            </div>

            <CardDescription className="text-xs sm:text-sm text-start font-mono">
              {t('dossier:id')}: {dossier.id.slice(0, 8)}...
            </CardDescription>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="flex flex-col gap-2 pt-2 border-t">
          {/* Title */}
          {dossier.extension?.title && (
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-start">{dossier.extension.title}</span>
            </div>
          )}

          {/* Organization */}
          {dossier.extension?.organization_name && (
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-start">{dossier.extension.organization_name}</span>
            </div>
          )}

          {/* Nationality */}
          {dossier.extension?.nationality && (
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-start">{dossier.extension.nationality}</span>
            </div>
          )}

          {/* Email */}
          {dossier.extension?.contact_email && (
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={`mailto:${dossier.extension.contact_email}`}
                className="text-start text-primary hover:underline truncate"
              >
                {dossier.extension.contact_email}
              </a>
            </div>
          )}

          {/* Phone */}
          {dossier.extension?.contact_phone && (
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={`tel:${dossier.extension.contact_phone}`}
                className="text-start text-primary hover:underline"
              >
                {dossier.extension.contact_phone}
              </a>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Biography Section */}
      {displayBiography && (
        <CardContent className="px-4 sm:px-6 py-0 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-semibold text-start">
              {t('person:biography')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBioExpanded(!isBioExpanded)}
              className="min-h-9 min-w-9 p-1"
            >
              {isBioExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground text-start whitespace-pre-wrap">
            {isBioExpanded ? displayBiography : truncatedBio}
          </p>
        </CardContent>
      )}

      {/* Tags */}
      {dossier.tags && dossier.tags.length > 0 && (
        <CardContent className="px-4 sm:px-6 py-0">
          <div className="flex flex-wrap gap-2">
            {dossier.tags.slice(0, 5).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {dossier.tags.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{dossier.tags.length - 5}
              </Badge>
            )}
          </div>
        </CardContent>
      )}

      {/* Actions */}
      <CardFooter className="flex items-center justify-between gap-2 p-4 sm:p-6 pt-2 sm:pt-4">
        {/* Primary actions - touch-friendly */}
        <div className="flex gap-2">
          {onView && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onView(dossier.id)}
              className=" px-3 sm:px-4"
            >
              <Eye className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              <span className="hidden sm:inline ms-2">{t('dossier:action.view')}</span>
            </Button>
          )}

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(dossier.id)}
              className=" px-3 sm:px-4"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline ms-2">{t('dossier:action.edit')}</span>
            </Button>
          )}
        </div>

        {/* More actions dropdown */}
        {onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className=" " aria-label={t('dossier:action.more')}>
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
              <DropdownMenuItem
                onClick={() => onDelete(dossier.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 me-2" />
                {t('dossier:action.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  )
})

/**
 * Compact variant for list views (memoized for performance - T055)
 */
export const PersonCardCompact = memo(function PersonCardCompact({
  dossier,
  onClick,
  className,
}: Omit<PersonCardProps, 'onEdit' | 'onDelete' | 'onView'> & { onClick?: (id: string) => void }) {
  const { t, i18n } = useTranslation(['dossier', 'person'])
  const isRTL = i18n.language === 'ar'
  const displayName = isRTL ? dossier.name_ar : dossier.name_en
  const initials = displayName ? getInitials(displayName) : 'VIP'

  return (
    <button
      onClick={() => onClick?.(dossier.id)}
      className={cn(
        'flex items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent transition-colors',
        'min-h-16 sm:min-h-20 w-full text-start',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
        <AvatarImage src={dossier.extension?.photo_url} alt={displayName || ''} />
        <AvatarFallback className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-medium truncate text-start">
            {displayName || t('dossier:untitled')}
          </span>
          <Badge
            variant="outline"
            className={cn('text-xs shrink-0', getStatusColor(dossier.status))}
          >
            {t(`dossier:status.${dossier.status}`)}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          {dossier.extension?.title && (
            <>
              <span className="truncate">{dossier.extension.title}</span>
              {dossier.extension?.organization_name && <span>•</span>}
            </>
          )}
          {dossier.extension?.organization_name && (
            <span className="truncate">{dossier.extension.organization_name}</span>
          )}
        </div>
      </div>

      {/* Action indicator */}
      <Eye className={cn('h-5 w-5 shrink-0 text-muted-foreground', isRTL && 'rotate-180')} />
    </button>
  )
})
