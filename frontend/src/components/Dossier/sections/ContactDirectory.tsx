/**
 * ContactDirectory Component
 *
 * Displays organization contacts with filtering by type and search.
 * Mobile-first responsive, RTL support.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  Mail,
  Phone,
  Building,
  Star,
  Globe,
  Lock,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Pencil,
  Trash2,
  X,
  Languages,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useOrganizationContacts,
  useDeleteOrganizationContact,
  useSetPrimaryContact,
} from '@/hooks/useOrganizationContacts'
import type { ContactWithOrganization, ContactType, ContactFilters } from '@/types/contacts.types'

interface ContactDirectoryProps {
  organizationId: string
  onAddContact?: () => void
  onEditContact?: (contact: ContactWithOrganization) => void
}

export function ContactDirectory({
  organizationId,
  onAddContact,
  onEditContact,
}: ContactDirectoryProps) {
  const { t, i18n } = useTranslation('contacts-extended')
  const isRTL = i18n.language === 'ar'

  const [filters, setFilters] = useState<Partial<ContactFilters>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch contacts
  const {
    data: contacts,
    isLoading,
    error,
    refetch,
  } = useOrganizationContacts(organizationId, filters)
  const deleteContact = useDeleteOrganizationContact()
  const setPrimary = useSetPrimaryContact()

  // Contact types
  const contactTypes: ContactType[] = [
    'focal_point',
    'general',
    'protocol',
    'technical',
    'administrative',
    'media',
    'legal',
    'financial',
    'emergency',
  ]

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!contacts || !searchQuery.trim()) return contacts || []

    const query = searchQuery.toLowerCase()
    return contacts.filter(
      (contact) =>
        contact.name_en?.toLowerCase().includes(query) ||
        contact.name_ar?.toLowerCase().includes(query) ||
        contact.title_en?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.department_en?.toLowerCase().includes(query) ||
        contact.expertise_areas?.some((e) => e.toLowerCase().includes(query)),
    )
  }, [contacts, searchQuery])

  // Group contacts by type
  const contactsByType = useMemo(() => {
    return filteredContacts.reduce<Record<string, ContactWithOrganization[]>>((acc, contact) => {
      const type = contact.contact_type
      if (!acc[type]) acc[type] = []
      acc[type].push(contact)
      return acc
    }, {})
  }, [filteredContacts])

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Handle delete
  const handleDelete = async (contact: ContactWithOrganization) => {
    if (window.confirm(t('organizationContacts.confirmDelete', 'Remove this contact?'))) {
      await deleteContact.mutateAsync({ id: contact.id, organizationId })
    }
  }

  // Handle set primary
  const handleSetPrimary = async (contact: ContactWithOrganization) => {
    await setPrimary.mutateAsync({
      id: contact.id,
      organizationId,
      contactType: contact.contact_type,
    })
  }

  // Clear filters
  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-start">
              {t('organizationContacts.title', 'Organization Contacts')}
            </h3>
            <p className="text-sm text-muted-foreground text-start">
              {t('organizationContacts.description', 'Manage organization contact directory')}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-h-10 shrink-0"
            onClick={onAddContact}
          >
            <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            {t('organizationContacts.create', 'Add Contact')}
          </Button>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('staffDirectory.search', 'Search contacts...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full h-10 ps-9 pe-9 rounded-md border bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            className="gap-2 min-h-10 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {t('common.filters', 'Filters')}
            {activeFilterCount > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')}
            />
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Contact Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('contactForm.contactType', 'Contact Type')}
                </label>
                <select
                  value={filters.contact_type || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      contact_type: (e.target.value as ContactType) || undefined,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  {contactTypes.map((type) => (
                    <option key={type} value={type}>
                      {t(`contactTypes.${type}`, type.replace(/_/g, ' '))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('filters.isActive', 'Status')}
                </label>
                <select
                  value={filters.is_active === undefined ? '' : String(filters.is_active)}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      is_active: e.target.value === '' ? undefined : e.target.value === 'true',
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  <option value="true">{t('contactForm.isActive', 'Active')}</option>
                  <option value="false">{t('common.inactive', 'Inactive')}</option>
                </select>
              </div>

              {/* Public Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('filters.isPublic', 'Visibility')}
                </label>
                <select
                  value={filters.is_public === undefined ? '' : String(filters.is_public)}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      is_public: e.target.value === '' ? undefined : e.target.value === 'true',
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  <option value="true">{t('common.public', 'Public')}</option>
                  <option value="false">{t('common.private', 'Private')}</option>
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t('common.clearFilters', 'Clear Filters')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('organizationContacts.loadError', 'Failed to load contacts')}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry', 'Try Again')}
          </Button>
        </div>
      )}

      {/* Contacts by Type */}
      {!isLoading && !error && filteredContacts.length > 0 && (
        <div className="space-y-6">
          {Object.entries(contactsByType).map(([type, typeContacts]) => (
            <div key={type}>
              {/* Type Header */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  {t(`contactTypes.${type}`, type.replace(/_/g, ' '))}
                </Badge>
                <span className="text-xs text-muted-foreground">({typeContacts.length})</span>
              </div>

              {/* Contacts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {typeContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isRTL={isRTL}
                    onEdit={onEditContact}
                    onDelete={handleDelete}
                    onSetPrimary={handleSetPrimary}
                    t={t}
                    i18n={i18n}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredContacts.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">
            {searchQuery || activeFilterCount > 0
              ? t('common.noResults', 'No Results Found')
              : t('organizationContacts.empty', 'No Contacts Found')}
          </h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {searchQuery || activeFilterCount > 0
              ? t('common.adjustFilters', 'Try adjusting your search or filters')
              : t('organizationContacts.emptyDescription', 'Add contacts for this organization')}
          </p>

          {searchQuery || activeFilterCount > 0 ? (
            <Button variant="outline" onClick={clearFilters}>
              {t('common.clearFilters', 'Clear Filters')}
            </Button>
          ) : (
            <Button variant="default" onClick={onAddContact} className="gap-2 min-h-11">
              <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              {t('organizationContacts.create', 'Add Contact')}
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      {!isLoading && !error && contacts && contacts.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm text-muted-foreground">
          <span>
            {t('common.total', 'Total')}: {contacts.length} {t('common.contacts', 'contacts')}
          </span>
          {searchQuery && (
            <span>
              {t('common.showing', 'Showing')}: {filteredContacts.length}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Contact Card Component
interface ContactCardProps {
  contact: ContactWithOrganization
  isRTL: boolean
  onEdit?: (contact: ContactWithOrganization) => void
  onDelete?: (contact: ContactWithOrganization) => void
  onSetPrimary?: (contact: ContactWithOrganization) => void
  t: ReturnType<typeof useTranslation>['t']
  i18n: { language: string }
}

function ContactCard({ contact, isRTL, onEdit, onDelete, onSetPrimary, t }: ContactCardProps) {
  const [showActions, setShowActions] = useState(false)

  const name = isRTL ? contact.name_ar || contact.name_en : contact.name_en || contact.name_ar
  const title = isRTL ? contact.title_ar || contact.title_en : contact.title_en || contact.title_ar
  const department = isRTL
    ? contact.department_ar || contact.department_en
    : contact.department_en || contact.department_ar

  return (
    <div
      className={cn(
        'group rounded-lg border bg-card p-4 transition-all duration-200',
        contact.is_primary && 'border-primary/30 bg-primary/5',
        'hover:border-primary/30 hover:shadow-sm',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            contact.is_primary ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <User className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name & Primary Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-card-foreground truncate">{name}</h4>
                {contact.is_primary && (
                  <Star className="h-3.5 w-3.5 text-primary shrink-0" fill="currentColor" />
                )}
              </div>
              {title && <p className="text-xs text-muted-foreground truncate">{title}</p>}
            </div>

            {/* Visibility */}
            <div className="shrink-0">
              {contact.is_public ? (
                <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </div>
          </div>

          {/* Department */}
          {department && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              <span className="truncate">{department}</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-2 space-y-1">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-3 w-3" />
                <span className="truncate">{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-3 w-3" />
                <span>{contact.phone}</span>
              </a>
            )}
          </div>

          {/* Expertise Areas */}
          {contact.expertise_areas && contact.expertise_areas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {contact.expertise_areas.slice(0, 2).map((area) => (
                <Badge key={area} variant="secondary" className="text-xs px-1.5 py-0">
                  {area}
                </Badge>
              ))}
              {contact.expertise_areas.length > 2 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  +{contact.expertise_areas.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Languages */}
          {contact.languages && contact.languages.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Languages className="h-3 w-3" />
              <span>{contact.languages.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="relative shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            onClick={() => setShowActions(!showActions)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                role="presentation"
                onClick={() => setShowActions(false)}
              />
              <div
                className={cn(
                  'absolute z-20 mt-1 w-40 rounded-md border bg-popover p-1 shadow-md',
                  isRTL ? 'start-0' : 'end-0',
                )}
              >
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                  onClick={() => {
                    onEdit?.(contact)
                    setShowActions(false)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t('organizationContacts.edit', 'Edit')}
                </button>
                {!contact.is_primary && (
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted text-primary"
                    onClick={() => {
                      onSetPrimary?.(contact)
                      setShowActions(false)
                    }}
                  >
                    <Star className="h-3.5 w-3.5" />
                    {t('actions.setAsPrimary', 'Set as Primary')}
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    onDelete?.(contact)
                    setShowActions(false)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('organizationContacts.delete', 'Remove')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContactDirectory
