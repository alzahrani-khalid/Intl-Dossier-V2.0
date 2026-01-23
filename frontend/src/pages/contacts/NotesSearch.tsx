/**
 * Notes Search Page
 * Part of: 027-contact-directory Phase 7 implementation
 *
 * Global search page for interaction notes across all contacts.
 * Mobile-first, RTL-aware with filters for date range and type.
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  Search,
  Calendar as CalendarIcon,
  Filter,
  X,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Phone,
  Users as UsersIcon,
  Calendar,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { useSearchNotes } from '@/hooks/useInteractions'
import type { InteractionNoteResponse } from '@/services/interaction-api'
import { cn } from '@/lib/utils'

/**
 * Get icon component for interaction type
 */
function getTypeIcon(type: string) {
  switch (type) {
    case 'meeting':
      return Calendar
    case 'email':
      return Mail
    case 'call':
      return Phone
    case 'conference':
      return UsersIcon
    default:
      return FileText
  }
}

/**
 * Get color for interaction type badge
 */
function getTypeColor(type: string): string {
  switch (type) {
    case 'meeting':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'email':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'call':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'conference':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

/**
 * Search Result Item
 */
interface SearchResultItemProps {
  note: InteractionNoteResponse
  isRTL: boolean
  locale: typeof ar | typeof enUS
  onNavigate: (contactId: string) => void
}

function SearchResultItem({ note, isRTL, locale, onNavigate }: SearchResultItemProps) {
  const { t } = useTranslation('contacts')
  const TypeIcon = getTypeIcon(note.type)
  const formattedDate = format(new Date(note.date), 'PPP', { locale })
  const detailsPreview =
    note.details.length > 200 ? `${note.details.substring(0, 200)}...` : note.details

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header: Type, Date, Contact */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  'bg-primary/10 text-primary',
                )}
              >
                <TypeIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <Badge variant="secondary" className={cn('w-fit text-xs', getTypeColor(note.type))}>
                  {t(`contactDirectory.interactions.types.${note.type}`)}
                </Badge>
                <span className="text-xs text-muted-foreground">{formattedDate}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate(note.contact_id)}
              className="h-8 text-xs"
            >
              <ExternalLink className={cn('w-3 h-3', isRTL ? 'ms-1' : 'me-1')} />
              {t('contactDirectory.interactions.view_contact')}
            </Button>
          </div>

          {/* Contact Info */}
          {note.contact && (
            <div className="flex flex-col gap-1">
              <p className="font-medium text-sm text-start">{note.contact.full_name}</p>
              {note.contact.organization && (
                <p className="text-xs text-muted-foreground text-start">
                  {note.contact.organization.name}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Details Preview */}
          <p className="text-sm text-muted-foreground text-start whitespace-pre-wrap">
            {detailsPreview}
          </p>

          {/* Attachments indicator */}
          {note.attachments && note.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="w-3 h-3" />
              <span>
                {t('contactDirectory.interactions.attachments_count', {
                  count: note.attachments.length,
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Notes Search Page
 */
export function NotesSearch() {
  const { t, i18n } = useTranslation('contacts')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  // Build search params
  const searchParams = {
    query: searchQuery || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
    date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
    limit: 50,
  }

  const { data, isLoading, error } = useSearchNotes(searchParams, {
    enabled: !!searchQuery || typeFilter !== 'all' || !!dateFrom || !!dateTo,
  })

  const handleClearFilters = () => {
    setTypeFilter('all')
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const hasActiveFilters = typeFilter !== 'all' || dateFrom || dateTo

  const handleNavigateToContact = (contactId: string) => {
    navigate({ to: '/contacts/$contactId', params: { contactId } })
  }

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-start">
            {t('contactDirectory.interactions.search.title')}
          </h1>
          <p className="text-sm text-muted-foreground text-start">
            {t('contactDirectory.interactions.search.description')}
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground',
                      isRTL ? 'end-3' : 'start-3',
                    )}
                  />
                  <Input
                    type="text"
                    placeholder={t('contactDirectory.interactions.search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn('h-11', isRTL ? 'pe-10' : 'ps-10')}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn('h-11 w-11', hasActiveFilters && 'border-primary')}
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      {t('contactDirectory.interactions.search.filters')}
                    </h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-8 text-xs"
                      >
                        <X className={cn('w-3 h-3', isRTL ? 'ms-1' : 'me-1')} />
                        {t('contactDirectory.interactions.search.clear_filters')}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Type Filter */}
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-start">
                        {t('contactDirectory.interactions.search.type_filter')}
                      </label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('contactDirectory.interactions.search.all_types')}
                          </SelectItem>
                          <SelectItem value="meeting">
                            {t('contactDirectory.interactions.types.meeting')}
                          </SelectItem>
                          <SelectItem value="email">
                            {t('contactDirectory.interactions.types.email')}
                          </SelectItem>
                          <SelectItem value="call">
                            {t('contactDirectory.interactions.types.call')}
                          </SelectItem>
                          <SelectItem value="conference">
                            {t('contactDirectory.interactions.types.conference')}
                          </SelectItem>
                          <SelectItem value="other">
                            {t('contactDirectory.interactions.types.other')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date From */}
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-start">
                        {t('contactDirectory.interactions.search.date_from')}
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full h-10 justify-start text-start font-normal',
                              !dateFrom && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            {dateFrom ? (
                              format(dateFrom, 'PP', { locale })
                            ) : (
                              <span>{t('contactDirectory.interactions.search.select_date')}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
                          <CalendarComponent
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Date To */}
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-start">
                        {t('contactDirectory.interactions.search.date_to')}
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full h-10 justify-start text-start font-normal',
                              !dateTo && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            {dateTo ? (
                              format(dateTo, 'PP', { locale })
                            ) : (
                              <span>{t('contactDirectory.interactions.search.select_date')}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
                          <CalendarComponent
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            disabled={(date) => (dateFrom ? date < dateFrom : false)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('contactDirectory.interactions.search.searching')}
              </p>
            </div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-destructive">
                {t('contactDirectory.interactions.search.error')}: {error.message}
              </p>
            </CardContent>
          </Card>
        ) : data && data.notes.length > 0 ? (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {t('contactDirectory.interactions.search.results_count', {
                  count: data.total,
                })}
              </p>
            </div>

            {/* Results List */}
            <div className="space-y-4">
              {data.notes.map((note) => (
                <SearchResultItem
                  key={note.id}
                  note={note}
                  isRTL={isRTL}
                  locale={locale}
                  onNavigate={handleNavigateToContact}
                />
              ))}
            </div>
          </>
        ) : searchQuery || hasActiveFilters ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-base font-medium mb-2">
                {t('contactDirectory.interactions.search.no_results_title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('contactDirectory.interactions.search.no_results_description')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-base font-medium mb-2">
                {t('contactDirectory.interactions.search.start_searching_title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('contactDirectory.interactions.search.start_searching_description')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
