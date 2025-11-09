/**
 * ContactSearch Component
 * Part of: 027-contact-directory implementation
 *
 * Mobile-first search and filter UI for contacts.
 * Includes full-text search, organization filter, tag multi-select, and sort options.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import {
 Sheet,
 SheetContent,
 SheetDescription,
 SheetHeader,
 SheetTitle,
 SheetTrigger,
} from '@/components/ui/sheet';
import type { ContactSearchParams } from '@/services/contact-api';
import type { Database } from '@/types/contact-directory.types';

type Organization = Database['public']['Tables']['cd_organizations']['Row'];

interface ContactSearchProps {
 onSearch: (params: ContactSearchParams) => void;
 organizations?: Organization[];
 tags?: Array<{ id: string; name: string; color?: string; category?: string }>;
 defaultParams?: ContactSearchParams;
 isLoading?: boolean;
}

export function ContactSearch({
 onSearch,
 organizations = [],
 tags = [],
 defaultParams,
 isLoading = false,
}: ContactSearchProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';

 const [searchTerm, setSearchTerm] = useState(defaultParams?.search || '');
 const [organizationId, setOrganizationId] = useState(defaultParams?.organization_id || '');
 const [selectedTags, setSelectedTags] = useState<string[]>(defaultParams?.tags || []);
 const [sourceType, setSourceType] = useState<'manual' | 'business_card' | 'document' | ''>(
 (defaultParams?.source_type as 'manual' | 'business_card' | 'document') || ''
 );
 const [sortBy, setSortBy] = useState<'full_name' | 'created_at' | 'updated_at'>(
 defaultParams?.sort_by || 'full_name'
 );
 const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultParams?.sort_order || 'asc');
 const [includeArchived, setIncludeArchived] = useState(defaultParams?.include_archived || false);

 const handleSearch = () => {
 const params: ContactSearchParams = {
 search: searchTerm || undefined,
 organization_id: organizationId || undefined,
 tags: selectedTags.length > 0 ? selectedTags : undefined,
 source_type: sourceType || undefined,
 sort_by: sortBy,
 sort_order: sortOrder,
 include_archived: includeArchived,
 };
 onSearch(params);
 };

 const handleReset = () => {
 setSearchTerm('');
 setOrganizationId('');
 setSelectedTags([]);
 setSourceType('');
 setSortBy('full_name');
 setSortOrder('asc');
 setIncludeArchived(false);
 onSearch({});
 };

 const toggleTag = (tagId: string) => {
 setSelectedTags((prev) =>
 prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
 );
 };

 const hasActiveFilters =
 searchTerm ||
 organizationId ||
 selectedTags.length > 0 ||
 sourceType ||
 sortBy !== 'full_name' ||
 sortOrder !== 'asc' ||
 includeArchived;

 return (
 <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Search Input - Always Visible */}
 <div className="flex gap-2">
 <div className="relative flex-1">
 <Search
 className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${
 isRTL ? 'right-3' : 'left-3'
 }`}
 />
 <Input
 type="search"
 placeholder={t('contactDirectory.placeholders.searchContacts')}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
 className={`h-11 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-base sm:h-10`}
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 </div>

 <Button
 onClick={handleSearch}
 disabled={isLoading}
 className="h-11 px-6 sm:h-10"
 >
 {t('contactDirectory.search.search')}
 </Button>

 {/* Mobile Filter Sheet */}
 <Sheet>
 <SheetTrigger asChild>
 <Button
 variant="outline"
 size="icon"
 className="h-11 w-11 sm:h-10 sm:w-10 md:hidden"
 >
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
 sourceType={sourceType}
 setSourceType={setSourceType}
 sortBy={sortBy}
 setSortBy={setSortBy}
 sortOrder={sortOrder}
 setSortOrder={setSortOrder}
 includeArchived={includeArchived}
 setIncludeArchived={setIncludeArchived}
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
 sourceType={sourceType}
 setSourceType={setSourceType}
 sortBy={sortBy}
 setSortBy={setSortBy}
 sortOrder={sortOrder}
 setSortOrder={setSortOrder}
 includeArchived={includeArchived}
 setIncludeArchived={setIncludeArchived}
 isRTL={isRTL}
 t={t}
 />
 </div>

 {/* Active Filters Summary */}
 {hasActiveFilters && (
 <div className="flex flex-wrap items-center gap-2 text-sm">
 <Filter className="h-4 w-4 text-muted-foreground" />
 {selectedTags.map((tagId) => {
 const tag = tags.find((t) => t.id === tagId);
 return tag ? (
 <Badge key={tagId} variant="secondary" className="gap-1">
 {tag.name}
 <X
 className="h-3 w-3 cursor-pointer"
 onClick={() => toggleTag(tagId)}
 />
 </Badge>
 ) : null;
 })}
 {organizationId && (
 <Badge variant="secondary" className="gap-1">
 {organizations.find((o) => o.id === organizationId)?.name}
 <X
 className="h-3 w-3 cursor-pointer"
 onClick={() => setOrganizationId('')}
 />
 </Badge>
 )}
 {sourceType && (
 <Badge variant="secondary" className="gap-1">
 {t(`contactDirectory.sourceTypes.${sourceType}`)}
 <X
 className="h-3 w-3 cursor-pointer"
 onClick={() => setSourceType('')}
 />
 </Badge>
 )}
 <Button
 variant="ghost"
 size="sm"
 onClick={handleReset}
 className="h-7 text-xs"
 >
 {t('contactDirectory.search.clear_all')}
 </Button>
 </div>
 )}
 </div>
 );
}

// Filter content component (shared between desktop and mobile)
function FilterContent({
 organizations,
 tags,
 organizationId,
 setOrganizationId,
 selectedTags,
 toggleTag,
 sourceType,
 setSourceType,
 sortBy,
 setSortBy,
 sortOrder,
 setSortOrder,
 includeArchived,
 setIncludeArchived,
 isRTL,
 t,
}: any) {
 return (
 <>
 {/* Organization Filter */}
 {organizations.length > 0 && (
 <div className="space-y-2">
 <label className="text-sm font-medium">{t('contactDirectory.search.filter_by_organization')}</label>
 <Select value={organizationId || 'all'} onValueChange={(value) => setOrganizationId(value === 'all' ? '' : value)}>
 <SelectTrigger className="h-10">
 <SelectValue placeholder={t('contactDirectory.search.all_organizations')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('contactDirectory.search.all_organizations')}</SelectItem>
 {organizations.map((org: any) => (
 <SelectItem key={org.id} value={org.id}>
 {org.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 )}

 {/* Tag Filter */}
 {tags.length > 0 && (
 <div className="space-y-2">
 <label className="text-sm font-medium">{t('contactDirectory.search.filter_by_tags')}</label>
 <div className="flex flex-wrap gap-2">
 {tags.map((tag: any) => {
 const isSelected = selectedTags.includes(tag.id);
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
 );
 })}
 </div>
 </div>
 )}

 {/* Source Type Filter */}
 <div className="space-y-2">
 <label className="text-sm font-medium">{t('contactDirectory.search.filter_by_source')}</label>
 <Select value={sourceType || 'all'} onValueChange={(value) => setSourceType(value === 'all' ? '' : value as any)}>
 <SelectTrigger className="h-10">
 <SelectValue placeholder={t('contactDirectory.search.all_sources')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('contactDirectory.search.all_sources')}</SelectItem>
 <SelectItem value="manual">{t('contactDirectory.sourceTypes.manual')}</SelectItem>
 <SelectItem value="business_card">{t('contactDirectory.sourceTypes.businessCard')}</SelectItem>
 <SelectItem value="document">{t('contactDirectory.sourceTypes.document')}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Sort Options */}
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-2">
 <label className="text-sm font-medium">{t('contactDirectory.search.sort_by')}</label>
 <Select value={sortBy} onValueChange={setSortBy}>
 <SelectTrigger className="h-10">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="full_name">{t('contactDirectory.search.sort_name')}</SelectItem>
 <SelectItem value="created_at">{t('contactDirectory.search.sort_created')}</SelectItem>
 <SelectItem value="updated_at">{t('contactDirectory.search.sort_updated')}</SelectItem>
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

 {/* Include Archived Toggle */}
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="include-archived"
 checked={includeArchived}
 onChange={(e) => setIncludeArchived(e.target.checked)}
 className="h-4 w-4 rounded border-gray-300"
 />
 <label htmlFor="include-archived" className="text-sm">
 {t('contactDirectory.search.include_archived')}
 </label>
 </div>
 </>
 );
}
