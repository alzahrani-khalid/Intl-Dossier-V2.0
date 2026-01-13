/**
 * AdvancedSearchPage
 * Feature: advanced-search-filters
 * Description: Main page for complex multi-criteria search
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Search,
  Loader2,
  FileText,
  Folder,
  Calendar,
  User,
  Building,
  Users,
  Globe,
  Tag,
  ExternalLink,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { AdvancedSearchFilters } from '@/components/advanced-search'
import { SearchEmptyState } from '@/components/empty-states'
import {
  useAdvancedSearchMutation,
  buildSearchRequest,
  type SearchState,
} from '@/hooks/useAdvancedSearch'
import { useCreateTemplate } from '@/hooks/useSavedSearchTemplates'
import type { SearchResult, SearchableEntityType } from '@/types/advanced-search.types'
import { ENTITY_TYPE_LABELS } from '@/types/advanced-search.types'

// Icon mapping for entity types
const entityIcons: Record<SearchableEntityType, React.ComponentType<{ className?: string }>> = {
  dossier: Folder,
  engagement: Calendar,
  position: FileText,
  document: FileText,
  person: User,
  organization: Building,
  forum: Users,
  country: Globe,
  theme: Tag,
}

// Status badge colors
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  draft: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  published: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

export function AdvancedSearchPage() {
  const { t, i18n } = useTranslation('advanced-search')
  const isRTL = i18n.language === 'ar'

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [templateState, setTemplateState] = useState<SearchState | null>(null)
  const [templateName, setTemplateName] = useState({ en: '', ar: '' })
  const [templateDescription, setTemplateDescription] = useState({ en: '', ar: '' })
  const [templateIsPublic, setTemplateIsPublic] = useState(false)

  const searchMutation = useAdvancedSearchMutation()
  const createTemplate = useCreateTemplate()

  const handleSearch = useCallback(
    (state: SearchState) => {
      const request = buildSearchRequest(state)
      searchMutation.mutate(request)
    },
    [searchMutation],
  )

  const handleSaveTemplate = useCallback((state: SearchState) => {
    setTemplateState(state)
    setTemplateName({ en: '', ar: '' })
    setTemplateDescription({ en: '', ar: '' })
    setTemplateIsPublic(false)
    setSaveDialogOpen(true)
  }, [])

  const handleCreateTemplate = useCallback(async () => {
    if (!templateState || !templateName.en || !templateName.ar) return

    try {
      await createTemplate.mutateAsync({
        name_en: templateName.en,
        name_ar: templateName.ar,
        description_en: templateDescription.en || undefined,
        description_ar: templateDescription.ar || undefined,
        template_definition: {
          entity_types: templateState.entityTypes,
          query: templateState.query || undefined,
          conditions: templateState.conditions.length > 0 ? templateState.conditions : undefined,
          condition_groups:
            templateState.conditionGroups.length > 0 ? templateState.conditionGroups : undefined,
          relationships:
            templateState.relationships.length > 0 ? templateState.relationships : undefined,
          date_range: templateState.dateRange || undefined,
          status: templateState.status.length > 0 ? templateState.status : undefined,
          tags: templateState.tags.length > 0 ? templateState.tags : undefined,
          filter_logic: templateState.filterLogic,
          include_archived: templateState.includeArchived,
          sort_by: templateState.sortBy,
          sort_order: templateState.sortOrder,
        },
        is_public: templateIsPublic,
        category: 'custom',
      })
      setSaveDialogOpen(false)
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }, [templateState, templateName, templateDescription, templateIsPublic, createTemplate])

  const renderResultCard = (result: SearchResult) => {
    const IconComponent = entityIcons[result.entity_type as SearchableEntityType] || FileText
    const entityLabel = ENTITY_TYPE_LABELS[result.entity_type as SearchableEntityType]

    return (
      <Card key={result.entity_id} className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base line-clamp-1">
                  {isRTL ? result.title_ar : result.title_en}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span>{isRTL ? entityLabel?.label_ar : entityLabel?.label_en}</span>
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', statusColors[result.status] || statusColors.active)}
                  >
                    {t(`status.${result.status}`)}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to={`/${result.entity_type}s/${result.entity_id}`}>
                <ExternalLink className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              </Link>
            </Button>
          </div>
        </CardHeader>

        {(result.snippet_en || result.snippet_ar) && (
          <CardContent className="pt-0">
            <p
              className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: isRTL ? result.snippet_ar : result.snippet_en,
              }}
            />
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(result.updated_at).toLocaleDateString()}
              </span>
              {result.rank_score && (
                <span className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  {Math.round(result.rank_score)}% {t('sorting.relevance').toLowerCase()}
                </span>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  const renderSkeletons = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </>
  )

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="pt-6">
              <AdvancedSearchFilters onSearch={handleSearch} onSaveTemplate={handleSaveTemplate} />
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {t('results.title')}
                </CardTitle>
                {searchMutation.data && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{t('results.found', { count: searchMutation.data.count })}</span>
                    <span className="text-xs">
                      ({t('results.took', { ms: searchMutation.data.took_ms })})
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Loading State */}
              {searchMutation.isPending && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ms-3 text-gray-600 dark:text-gray-400">
                      {t('results.loading')}
                    </span>
                  </div>
                  {renderSkeletons()}
                </div>
              )}

              {/* Error State */}
              {searchMutation.isError && (
                <SearchEmptyState type="error" onRetry={() => searchMutation.reset()} />
              )}

              {/* Empty State */}
              {searchMutation.isSuccess && searchMutation.data.data.length === 0 && (
                <SearchEmptyState type="no-results" />
              )}

              {/* Results */}
              {searchMutation.isSuccess && searchMutation.data.data.length > 0 && (
                <ScrollArea className="h-[calc(100vh-400px)] pe-4">
                  <div className="space-y-4">
                    {searchMutation.data.data.map(renderResultCard)}

                    {searchMutation.data.metadata.has_more && (
                      <div className="flex justify-center pt-4">
                        <Button variant="outline">{t('results.loadMore')}</Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Initial State */}
              {!searchMutation.isPending && !searchMutation.isError && !searchMutation.data && (
                <SearchEmptyState type="no-query" />
              )}

              {/* Warnings */}
              {searchMutation.data?.warnings && searchMutation.data.warnings.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      {searchMutation.data.warnings.map((warning, i) => (
                        <p key={i}>{warning}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('templates.createTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name-en">{t('templates.nameEn')}</Label>
              <Input
                id="template-name-en"
                value={templateName.en}
                onChange={(e) => setTemplateName({ ...templateName, en: e.target.value })}
                placeholder="My Search Template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-name-ar">{t('templates.nameAr')}</Label>
              <Input
                id="template-name-ar"
                value={templateName.ar}
                onChange={(e) => setTemplateName({ ...templateName, ar: e.target.value })}
                placeholder="قالب البحث الخاص بي"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-desc-en">{t('templates.descriptionEn')}</Label>
              <Input
                id="template-desc-en"
                value={templateDescription.en}
                onChange={(e) =>
                  setTemplateDescription({ ...templateDescription, en: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-desc-ar">{t('templates.descriptionAr')}</Label>
              <Input
                id="template-desc-ar"
                value={templateDescription.ar}
                onChange={(e) =>
                  setTemplateDescription({ ...templateDescription, ar: e.target.value })
                }
                placeholder="وصف اختياري"
                dir="rtl"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>{t('templates.makePublic')}</Label>
                <p className="text-xs text-gray-500">{t('templates.publicDescription')}</p>
              </div>
              <Switch checked={templateIsPublic} onCheckedChange={setTemplateIsPublic} />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!templateName.en || !templateName.ar || createTemplate.isPending}
            >
              {createTemplate.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvancedSearchPage
