/**
 * UnifiedSemanticSearch Component
 * Feature: semantic-search-expansion
 * Description: Unified semantic search interface supporting all seven dossier types
 *              with natural language queries in English and Arabic
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Globe,
  Building,
  Users,
  Tag,
  FileText,
  Calendar,
  User,
  Folder,
  Clock,
  TrendingUp,
  Loader2,
  Info,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  useUnifiedSemanticSearch,
  type SemanticEntityType,
  type DossierSubtype,
  type SemanticSearchResult,
  type SemanticSearchResponse,
  getSemanticEntityTypes,
  getDossierEntityTypes,
} from '@/hooks/useSemanticSearch'

// Entity type configuration with icons and labels
const ENTITY_TYPE_CONFIG: Record<
  SemanticEntityType,
  {
    icon: React.ComponentType<{ className?: string }>
    label_en: string
    label_ar: string
    category: 'dossier' | 'content' | 'people'
  }
> = {
  dossiers: {
    icon: Folder,
    label_en: 'All Dossiers',
    label_ar: 'جميع الملفات',
    category: 'dossier',
  },
  country: { icon: Globe, label_en: 'Countries', label_ar: 'الدول', category: 'dossier' },
  organization: {
    icon: Building,
    label_en: 'Organizations',
    label_ar: 'المنظمات',
    category: 'dossier',
  },
  forum: { icon: Users, label_en: 'Forums', label_ar: 'المنتديات', category: 'dossier' },
  theme: { icon: Tag, label_en: 'Themes', label_ar: 'المواضيع', category: 'dossier' },
  positions: { icon: FileText, label_en: 'Positions', label_ar: 'المواقف', category: 'content' },
  documents: { icon: FileText, label_en: 'Documents', label_ar: 'المستندات', category: 'content' },
  briefs: { icon: FileText, label_en: 'Briefs', label_ar: 'الموجزات', category: 'content' },
  engagements: {
    icon: Calendar,
    label_en: 'Engagements',
    label_ar: 'الارتباطات',
    category: 'content',
  },
  persons: { icon: User, label_en: 'People', label_ar: 'الأشخاص', category: 'people' },
  external_contacts: {
    icon: User,
    label_en: 'External Contacts',
    label_ar: 'جهات الاتصال الخارجية',
    category: 'people',
  },
  working_groups: {
    icon: Users,
    label_en: 'Working Groups',
    label_ar: 'مجموعات العمل',
    category: 'people',
  },
}

interface UnifiedSemanticSearchProps {
  /** Callback when search is performed */
  onSearch?: (response: SemanticSearchResponse) => void
  /** Callback when a result is selected */
  onResultSelect?: (result: SemanticSearchResult) => void
  /** Initial query value */
  initialQuery?: string
  /** Initial entity types to search */
  initialEntityTypes?: SemanticEntityType[]
  /** Show results inline or emit via callback */
  showResultsInline?: boolean
  /** Additional CSS classes */
  className?: string
}

export function UnifiedSemanticSearch({
  onSearch,
  onResultSelect,
  initialQuery = '',
  initialEntityTypes = ['dossiers', 'positions', 'documents', 'engagements', 'persons'],
  showResultsInline = true,
  className,
}: UnifiedSemanticSearchProps) {
  const { t, i18n } = useTranslation('semantic-search')
  const isRTL = i18n.language === 'ar'

  // State
  const [query, setQuery] = useState(initialQuery)
  const [entityTypes, setEntityTypes] = useState<SemanticEntityType[]>(initialEntityTypes)
  const [dossierTypes, setDossierTypes] = useState<DossierSubtype[]>([])
  const [similarityThreshold, setSimilarityThreshold] = useState(0.6)
  const [includeFulltext, setIncludeFulltext] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(false)
  const [limit, setLimit] = useState(50)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  // Search mutation
  const searchMutation = useUnifiedSemanticSearch()

  // Handle search
  const handleSearch = useCallback(() => {
    if (!query.trim()) return

    searchMutation.mutate(
      {
        query: query.trim(),
        entityTypes,
        similarityThreshold,
        limit,
        includeFulltext,
        dossierTypes: dossierTypes.length > 0 ? dossierTypes : undefined,
        includeMetadata,
      },
      {
        onSuccess: (data) => {
          onSearch?.(data)
        },
      },
    )
  }, [
    query,
    entityTypes,
    similarityThreshold,
    limit,
    includeFulltext,
    dossierTypes,
    includeMetadata,
    searchMutation,
    onSearch,
  ])

  // Toggle entity type
  const toggleEntityType = useCallback((type: SemanticEntityType) => {
    setEntityTypes((prev) => {
      if (prev.includes(type)) {
        // Don't allow empty selection
        if (prev.length === 1) return prev
        return prev.filter((t) => t !== type)
      }
      return [...prev, type]
    })
  }, [])

  // Toggle dossier subtype
  const toggleDossierType = useCallback((type: DossierSubtype) => {
    setDossierTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type)
      }
      return [...prev, type]
    })
  }, [])

  // Select all/none entity types
  const selectAllEntityTypes = useCallback(() => {
    setEntityTypes(getSemanticEntityTypes())
  }, [])

  const selectNoneEntityTypes = useCallback(() => {
    setEntityTypes(['dossiers'])
  }, [])

  // Grouped entity types by category
  const groupedEntityTypes = useMemo(() => {
    const groups: Record<string, SemanticEntityType[]> = {
      dossier: [],
      content: [],
      people: [],
    }
    for (const [type, config] of Object.entries(ENTITY_TYPE_CONFIG)) {
      groups[config.category].push(type as SemanticEntityType)
    }
    return groups
  }, [])

  // Get label for entity type
  const getEntityLabel = useCallback(
    (type: SemanticEntityType) => {
      const config = ENTITY_TYPE_CONFIG[type]
      return isRTL ? config.label_ar : config.label_en
    },
    [isRTL],
  )

  // Render entity type button
  const renderEntityTypeButton = useCallback(
    (type: SemanticEntityType) => {
      const config = ENTITY_TYPE_CONFIG[type]
      const IconComponent = config.icon
      const isSelected = entityTypes.includes(type)

      return (
        <button
          key={type}
          type="button"
          onClick={() => toggleEntityType(type)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all min-h-10',
            isSelected
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary',
          )}
        >
          <IconComponent className="h-4 w-4" />
          {getEntityLabel(type)}
        </button>
      )
    },
    [entityTypes, toggleEntityType, getEntityLabel],
  )

  // Render search result
  const renderSearchResult = useCallback(
    (result: SemanticSearchResult, index: number) => {
      const config = ENTITY_TYPE_CONFIG[result.entity_type as SemanticEntityType] || {
        icon: FileText,
        label_en: result.entity_type,
        label_ar: result.entity_type,
      }
      const IconComponent = config.icon

      return (
        <Card
          key={result.entity_id}
          className={cn(
            'cursor-pointer hover:border-primary transition-all',
            result.match_type === 'hybrid' && 'border-s-4 border-s-primary',
          )}
          onClick={() => onResultSelect?.(result)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  result.match_type === 'semantic'
                    ? 'bg-purple-100 dark:bg-purple-900'
                    : result.match_type === 'hybrid'
                      ? 'bg-primary/10'
                      : 'bg-gray-100 dark:bg-gray-800',
                )}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-base truncate">
                    {isRTL ? result.entity_title_ar : result.entity_title}
                  </h4>
                  <Badge variant="outline" className="shrink-0">
                    {Math.round(result.similarity_score * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {isRTL ? result.description_ar : result.description_en}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {getEntityLabel(result.entity_type as SemanticEntityType)}
                    {result.entity_subtype && ` • ${result.entity_subtype}`}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {result.match_type === 'semantic' && (
                      <>
                        <Sparkles className="h-3 w-3" />
                        {t('matchType.semantic')}
                      </>
                    )}
                    {result.match_type === 'fulltext' && (
                      <>
                        <Search className="h-3 w-3" />
                        {t('matchType.fulltext')}
                      </>
                    )}
                    {result.match_type === 'hybrid' && (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        {t('matchType.hybrid')}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    [isRTL, getEntityLabel, onResultSelect, t],
  )

  return (
    <div className={cn('flex flex-col gap-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute start-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={isRTL ? 'بحث دلالي بلغة طبيعية...' : 'Natural language semantic search...'}
          className="ps-14 pe-12 min-h-12 text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={t('search.clear')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Entity Type Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{t('entityTypes.label')}</h3>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAllEntityTypes}
              className="text-primary hover:underline"
            >
              {t('entityTypes.selectAll')}
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={selectNoneEntityTypes}
              className="text-primary hover:underline"
            >
              {t('entityTypes.deselectAll')}
            </button>
          </div>
        </div>

        {/* Dossier Types */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">{t('entityTypes.dossierCategory')}</span>
          <div className="flex flex-wrap gap-2">
            {groupedEntityTypes.dossier.map(renderEntityTypeButton)}
          </div>
        </div>

        {/* Content Types */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">{t('entityTypes.contentCategory')}</span>
          <div className="flex flex-wrap gap-2">
            {groupedEntityTypes.content.map(renderEntityTypeButton)}
          </div>
        </div>

        {/* People Types */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">{t('entityTypes.peopleCategory')}</span>
          <div className="flex flex-wrap gap-2">
            {groupedEntityTypes.people.map(renderEntityTypeButton)}
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-3 min-h-10">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('advanced.title')}
            </span>
            {isAdvancedOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-6">
          {/* Dossier Type Filter */}
          {entityTypes.includes('dossiers') && (
            <div className="space-y-3">
              <Label>{t('advanced.dossierTypes')}</Label>
              <div className="flex flex-wrap gap-2">
                {getDossierEntityTypes().map((type) => {
                  const config = ENTITY_TYPE_CONFIG[type]
                  const IconComponent = config.icon
                  const isSelected = dossierTypes.includes(type)

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleDossierType(type)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-all min-h-8',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary',
                      )}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                      {isRTL ? config.label_ar : config.label_en}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">{t('advanced.dossierTypesHint')}</p>
            </div>
          )}

          {/* Similarity Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('advanced.similarity')}</Label>
              <span className="text-sm font-medium">{Math.round(similarityThreshold * 100)}%</span>
            </div>
            <Slider
              value={[similarityThreshold]}
              onValueChange={(v) => setSimilarityThreshold(v[0])}
              min={0.3}
              max={0.95}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">{t('advanced.similarityHint')}</p>
          </div>

          {/* Result Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('advanced.limit')}</Label>
              <span className="text-sm font-medium">{limit}</span>
            </div>
            <Slider
              value={[limit]}
              onValueChange={(v) => setLimit(v[0])}
              min={10}
              max={100}
              step={10}
              className="w-full"
            />
          </div>

          {/* Toggle Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="include-fulltext">{t('advanced.includeFulltext')}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{t('advanced.includeFulltextHint')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="include-fulltext"
                checked={includeFulltext}
                onCheckedChange={setIncludeFulltext}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="include-metadata">{t('advanced.includeMetadata')}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{t('advanced.includeMetadataHint')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="include-metadata"
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Search Button */}
      <Button
        onClick={handleSearch}
        disabled={!query.trim() || searchMutation.isPending}
        className="min-h-11"
      >
        {searchMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
            {t('search.searching')}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 me-2" />
            {t('search.button')}
          </>
        )}
      </Button>

      {/* Error Display */}
      {searchMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchMutation.error instanceof Error
              ? searchMutation.error.message
              : t('errors.searchFailed')}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {showResultsInline && searchMutation.data && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                {t('results.title', { count: searchMutation.data.count })}
              </h3>
              {searchMutation.data.warnings.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <ul className="text-sm">
                        {searchMutation.data.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {searchMutation.data.performance.total_ms}ms
            </span>
          </div>

          {/* Performance Info */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              {t('performance.embedding')}: {searchMutation.data.performance.embedding_ms}ms
            </Badge>
            <Badge variant="outline">
              {t('performance.vector')}: {searchMutation.data.performance.vector_search_ms}ms
            </Badge>
            {searchMutation.data.performance.fulltext_search_ms && (
              <Badge variant="outline">
                {t('performance.fulltext')}: {searchMutation.data.performance.fulltext_search_ms}ms
              </Badge>
            )}
            <Badge variant="outline">
              {t('performance.language')}:{' '}
              {searchMutation.data.query.detected_language.toUpperCase()}
            </Badge>
          </div>

          {/* Results List */}
          {searchMutation.data.data.length > 0 ? (
            <ScrollArea className="h-[400px] sm:h-[500px]">
              <div className="space-y-3 pe-4">
                {searchMutation.data.data.map(renderSearchResult)}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('results.noResults')}</p>
              <p className="text-sm mt-1">{t('results.noResultsHint')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UnifiedSemanticSearch
