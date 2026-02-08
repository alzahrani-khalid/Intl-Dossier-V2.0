/**
 * ContactSearch Component
 * Part of: 027-contact-directory implementation
 *
 * Mobile-first search and filter UI for contacts.
 * Includes full-text search, organization filter, tag multi-select, and sort options.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { ContactSearchParams } from '@/services/contact-api'
import type { Database } from '@/types/contact-directory.types'

type Organization = Database['public']['Tables']['organizations']['Row']

interface ContactSearchProps {
  onSearch: (params: ContactSearchParams) => void
  organizations?: Organization[]
  tags?: Array<{ id: string; name: string; color?: string; category?: string }>
  defaultParams?: ContactSearchParams
  isLoading?: boolean
}

export function ContactSearch({
  onSearch,
  organizations = [],
  tags = [],
  defaultParams,
  isLoading = false,
}: ContactSearchProps) {
  const { t, i18n } = useTranslation('contacts')
  const isRTL = i18n.language === 'ar'

  const [searchTerm, setSearchTerm] = useState(defaultParams?.query || '')
  const [organizationId, setOrganizationId] = useState(defaultParams?.organization_id || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultParams?.tags || [])
  const [sortBy, setSortBy] = useState<'name' | 'organization' | 'created_at' | 'updated_at'>(
    defaultParams?.sort_by || 'name',
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultParams?.sort_order || 'asc')

  const handleSearch = () => {
    const params: ContactSearchParams = {
      query: searchTerm || undefined,
      organization_id: organizationId || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    }
    onSearch(params)
  }

  const handleReset = () => {
    setSearchTerm('')
    setOrganizationId('')
    setSelectedTags([])
    setSortBy('name')
    setSortOrder('asc')
    onSearch({})
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const hasActiveFilters =
    searchTerm ||
    organizationId ||
    selectedTags.length > 0 ||
    sortBy !== 'name' ||
    sortOrder !== 'asc'

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Input - Always Visible */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${
              isRTL ? 'end-3' : 'start-3'
            }`}
          />
          <Input
            type="search"
            placeholder={t('contactDirectory.placeholders.searchContacts')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={`h-11 ${isRTL ? 'pe-10 ps-4' : 'ps-10 pe-4'} text-base sm:h-10`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        <Button onClick={handleSearch} disabled={isLoading} className="h-11 px-6 sm:h-10">
          {t('contactDirectory.search.search')}
        </Button>

        {/* Mobile Filter Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 sm:h-10 sm:w-10 md:hidden">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side={isRTL ? 'left' : 'right'} className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{t('contactDirectory.search.filters')}</SheetTitle>
              <SheetDescription>{t('contactDirectory.search.refine_search')}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <FilterContent
                organizations={organizations}
                tags={tags}
                organizationId={organizationId}
                setOrganizationId={setOrganizationId}
                selectedTags={selectedTags}
                toggleTag={toggleTag}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                isRTL={isRTL}
                t={t}
              />
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSearch} className="flex-1">
                  {t('contactDirectory.search.apply_filters')}
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  {t('contactDirectory.search.reset')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters - Hidden on Mobile */}
      <div className="hidden md:block space-y-4">
        <FilterContent
          organizations={organizations}
          tags={tags}
          organizationId={organizationId}
          setOrganizationId={setOrganizationId}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          isRTL={isRTL}
          t={t}
        />
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {selectedTags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId)
            return tag ? (
              <Badge key={tagId} variant="secondary" className="gap-1">
                {tag.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTag(tagId)} />
              </Badge>
            ) : null
          })}
          {organizationId && (
            <Badge variant="secondary" className="gap-1">
              {organizations.find((o) => o.id === organizationId)?.org_code}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setOrganizationId('')} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs">
            {t('contactDirectory.search.clear_all')}
          </Button>
        </div>
      )}
    </div>
  )
}

// Filter content component (shared between desktop and mobile)
function FilterContent({
  organizations,
  tags,
  organizationId,
  setOrganizationId,
  selectedTags,
  toggleTag,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  _isRTL,
  t,
}: any) {
  return (
    <>
      {/* Organization Filter */}
      {organizations.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('contactDirectory.search.filter_by_organization')}
          </label>
          <Select
            value={organizationId || 'all'}
            onValueChange={(value: string) => setOrganizationId(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t('contactDirectory.search.all_organizations')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('contactDirectory.search.all_organizations')}</SelectItem>
              {organizations.map((org: Organization) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.org_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('contactDirectory.search.filter_by_tags')}
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: { id: string; name: string; color?: string }) => {
              const isSelected = selectedTags.includes(tag.id)
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 text-sm"
                  onClick={() => toggleTag(tag.id)}
                  style={
                    isSelected && tag.color
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : undefined
                  }
                >
                  {tag.name}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('contactDirectory.search.sort_by')}</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t('contactDirectory.search.sort_name')}</SelectItem>
              <SelectItem value="created_at">
                {t('contactDirectory.search.sort_created')}
              </SelectItem>
              <SelectItem value="updated_at">
                {t('contactDirectory.search.sort_updated')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('contactDirectory.search.order')}</label>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">{t('contactDirectory.search.ascending')}</SelectItem>
              <SelectItem value="desc">{t('contactDirectory.search.descending')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}
