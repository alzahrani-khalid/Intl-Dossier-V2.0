/**
 * Tags Management Page
 *
 * Admin interface for managing the hierarchical tag taxonomy system.
 * Provides CRUD operations, analytics, and tag organization tools.
 *
 * @mobile-first - Designed for 320px+ with responsive breakpoints
 * @rtl-ready - Uses logical properties for Arabic support
 */

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Tag, BarChart3, Settings2, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TagHierarchyManager, TagAnalytics } from '@/components/tags'
import { useTagMergeHistory, useTagRenameHistory } from '@/hooks/useTagHierarchy'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

export const Route = createFileRoute('/_protected/tags')({
  component: TagsPage,
})

function TagsPage() {
  const { t, i18n } = useTranslation('tags')
  const isRTL = i18n.language === 'ar'
  const [activeTab, setActiveTab] = useState('hierarchy')

  return (
    <div
      className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('management.title')}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">{t('management.description')}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger value="hierarchy" className="gap-2">
            <Tag className="hidden size-4 sm:block" />
            {t('hierarchy.title')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="hidden size-4 sm:block" />
            {t('analytics.title')}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="hidden size-4 sm:block" />
            {t('history.title')}
          </TabsTrigger>
        </TabsList>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-5" />
                {t('hierarchy.title')}
              </CardTitle>
              <CardDescription>{t('management.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <TagHierarchyManager showActions={true} className="min-h-[400px]" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <TagAnalytics />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MergeHistoryCard isRTL={isRTL} />
            <RenameHistoryCard isRTL={isRTL} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Merge History Card Component
function MergeHistoryCard({ isRTL }: { isRTL: boolean }) {
  const { t } = useTranslation('tags')
  const { data: mergeHistory, isLoading } = useTagMergeHistory()
  const locale = isRTL ? ar : enUS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('history.mergeHistory')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : !mergeHistory || mergeHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('history.noHistory')}
            </p>
          ) : (
            <div className="space-y-3">
              {mergeHistory.map((entry) => (
                <div key={entry.id} className="space-y-1 rounded-md border bg-muted/30 p-3">
                  <p className="text-sm">
                    {t('history.mergedInto', {
                      source: isRTL ? entry.source_tag_name_ar : entry.source_tag_name_en,
                      target: 'Target Tag', // Would need to fetch target name
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(entry.merged_at), {
                        addSuffix: true,
                        locale,
                      })}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {t('merge.assignmentsTransferred', {
                        count: entry.assignments_transferred,
                      })}
                    </Badge>
                  </div>
                  {entry.merge_reason && (
                    <p className="text-xs italic text-muted-foreground">"{entry.merge_reason}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Rename History Card Component
function RenameHistoryCard({ isRTL }: { isRTL: boolean }) {
  const { t } = useTranslation('tags')
  const { data: renameHistory, isLoading } = useTagRenameHistory()
  const locale = isRTL ? ar : enUS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('history.renameHistory')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : !renameHistory || renameHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('history.noHistory')}
            </p>
          ) : (
            <div className="space-y-3">
              {renameHistory.map((entry) => (
                <div key={entry.id} className="space-y-1 rounded-md border bg-muted/30 p-3">
                  <p className="text-sm">
                    {t('history.renamedFrom', {
                      old: isRTL ? entry.old_name_ar : entry.old_name_en,
                      new: isRTL ? entry.new_name_ar : entry.new_name_en,
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(entry.renamed_at), {
                        addSuffix: true,
                        locale,
                      })}
                    </span>
                  </div>
                  {entry.rename_reason && (
                    <p className="text-xs italic text-muted-foreground">"{entry.rename_reason}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default TagsPage
