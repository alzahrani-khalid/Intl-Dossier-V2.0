/**
 * Persons List Page
 * Feature: persons-entity-management
 *
 * Main page for viewing and managing person dossiers.
 * Mobile-first design with RTL support.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Users,
  Building2,
  Star,
  Mail,
  Phone,
  ChevronRight,
  Loader2,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { usePersons } from '@/hooks/usePersons'
import type { PersonSearchParams, ImportanceLevel } from '@/types/person.types'
import { IMPORTANCE_LEVEL_LABELS } from '@/types/person.types'

export function PersonsListPage() {
  const { t, i18n } = useTranslation('persons')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [importanceFilter, setImportanceFilter] = useState<ImportanceLevel | 'all'>('all')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Debounced search params
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useMemo(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  // Build search params
  const searchParams: PersonSearchParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      importance_level: importanceFilter !== 'all' ? importanceFilter : undefined,
      limit: 50,
    }),
    [debouncedSearch, importanceFilter],
  )

  // Fetch persons
  const { data, isLoading, isError, error } = usePersons(searchParams)

  // Navigation handlers
  const handleCreatePerson = () => {
    navigate({ to: '/persons/create' })
  }

  const handlePersonClick = (personId: string) => {
    navigate({ to: '/persons/$personId', params: { personId } })
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // Get importance badge color
  const getImportanceColor = (level: ImportanceLevel) => {
    switch (level) {
      case 5:
        return 'bg-red-500/10 text-red-600 border-red-200'
      case 4:
        return 'bg-orange-500/10 text-orange-600 border-orange-200'
      case 3:
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
      case 2:
        return 'bg-blue-500/10 text-blue-600 border-blue-200'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200'
    }
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setImportanceFilter('all')
    setIsFiltersOpen(false)
  }

  const hasActiveFilters = importanceFilter !== 'all'

  // Stats
  const totalPersons = data?.pagination.total || 0

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        <ShieldAlert className="size-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {t('error.title', 'Failed to load persons')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error?.message || t('error.message', 'An error occurred while fetching data')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-start">
                {t('title', 'Key Contacts')}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 text-start">
                {t('subtitle', 'Manage your network of key contacts and stakeholders')}
              </p>
            </div>

            <Button onClick={handleCreatePerson} className="w-full sm:w-auto">
              <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('actions.createPerson', 'Add Person')}
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'end-3' : 'start-3'}`}
              />
              <Input
                placeholder={t('search.placeholder', 'Search by name, title, email...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pe-10' : 'ps-10'} h-11`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'start-3' : 'end-3'}`}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex gap-2">
              <Select
                value={importanceFilter === 'all' ? 'all' : String(importanceFilter)}
                onValueChange={(value) =>
                  setImportanceFilter(value === 'all' ? 'all' : (Number(value) as ImportanceLevel))
                }
              >
                <SelectTrigger className="w-[180px] h-11">
                  <Star className="h-4 w-4 me-2 text-muted-foreground" />
                  <SelectValue placeholder={t('filters.importance', 'Importance')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allImportance', 'All levels')}</SelectItem>
                  {([5, 4, 3, 2, 1] as ImportanceLevel[]).map((level) => (
                    <SelectItem key={level} value={String(level)}>
                      {isRTL
                        ? IMPORTANCE_LEVEL_LABELS[level].ar
                        : IMPORTANCE_LEVEL_LABELS[level].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 me-1" />
                  {t('filters.clear', 'Clear')}
                </Button>
              )}
            </div>

            {/* Mobile Filters Sheet */}
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild className="sm:hidden">
                <Button variant="outline" className="h-11">
                  <SlidersHorizontal className="h-4 w-4 me-2" />
                  {t('filters.title', 'Filters')}
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ms-2">
                      1
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? 'left' : 'right'}>
                <SheetHeader>
                  <SheetTitle>{t('filters.title', 'Filters')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t('filters.importance', 'Importance Level')}
                    </label>
                    <Select
                      value={importanceFilter === 'all' ? 'all' : String(importanceFilter)}
                      onValueChange={(value) =>
                        setImportanceFilter(
                          value === 'all' ? 'all' : (Number(value) as ImportanceLevel),
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t('filters.allImportance', 'All levels')}
                        </SelectItem>
                        {([5, 4, 3, 2, 1] as ImportanceLevel[]).map((level) => (
                          <SelectItem key={level} value={String(level)}>
                            {isRTL
                              ? IMPORTANCE_LEVEL_LABELS[level].ar
                              : IMPORTANCE_LEVEL_LABELS[level].en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>
                      {t('filters.clear', 'Clear')}
                    </Button>
                    <Button className="flex-1" onClick={() => setIsFiltersOpen(false)}>
                      {t('filters.apply', 'Apply')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Stats Summary */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {t('stats.total', '{{count}} persons', { count: totalPersons })}
            </span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>
      </header>

      {/* Persons List */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || hasActiveFilters
                ? t('empty.noResults', 'No persons found')
                : t('empty.title', 'No persons yet')}
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {searchTerm || hasActiveFilters
                ? t('empty.noResultsDescription', 'Try adjusting your search or filters')
                : t(
                    'empty.description',
                    'Start building your contact network by adding key stakeholders',
                  )}
            </p>
            {!searchTerm && !hasActiveFilters && (
              <Button onClick={handleCreatePerson}>
                <Plus className="h-4 w-4 me-2" />
                {t('actions.createFirst', 'Add First Person')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow h-full"
                  onClick={() => handlePersonClick(person.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
                        <AvatarImage src={person.photo_url || ''} alt={person.name_en} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(isRTL ? person.name_ar : person.name_en)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">
                              {isRTL ? person.name_ar : person.name_en}
                            </h3>
                            {(person.title_en || person.title_ar) && (
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {isRTL ? person.title_ar : person.title_en}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs flex-shrink-0 ${getImportanceColor(person.importance_level)}`}
                          >
                            {isRTL
                              ? IMPORTANCE_LEVEL_LABELS[person.importance_level].ar
                              : IMPORTANCE_LEVEL_LABELS[person.importance_level].en}
                          </Badge>
                        </div>

                        {/* Organization */}
                        {person.organization_name && (
                          <div className="flex items-center gap-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{person.organization_name}</span>
                          </div>
                        )}

                        {/* Contact Info */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {person.email && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{person.email}</span>
                            </span>
                          )}
                          {person.phone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span dir="ltr">{person.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        className={`h-5 w-5 text-muted-foreground flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More */}
        {data?.pagination.has_more && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
              {t('actions.loadMore', 'Load More')}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

export default PersonsListPage
