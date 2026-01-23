/**
 * MyDossiersSection Component
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * Displays dossiers the user owns or contributes to with activity badges.
 * Shows quick stats (new items, pending tasks, active commitments).
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { ChevronRight, Folder, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMyDossiers } from '@/hooks/useDossierDashboard'
import { DossierQuickStatsCard } from './DossierQuickStatsCard'
import type { MyDossiersSectionProps, DossierRelationType } from '@/types/dossier-dashboard.types'

// =============================================================================
// Component
// =============================================================================

export function MyDossiersSection({
  maxItems = 6,
  showViewAll = true,
  onViewAll,
  filter,
  className,
}: MyDossiersSectionProps) {
  const { t, i18n } = useTranslation('dossier-dashboard')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Fetch dossiers
  const { data, isLoading, isError, error } = useMyDossiers({
    ...filter,
    limit: maxItems,
    sort_by: filter?.sort_by || 'last_activity',
    sort_order: filter?.sort_order || 'desc',
  })

  // Handle view all click
  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll()
    } else {
      navigate({ to: '/dossiers' })
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div className="flex items-center gap-2">
          <Folder className="size-5 text-primary" />
          <CardTitle className="text-lg">{t('myDossiers.title', 'My Dossiers')}</CardTitle>
          {!isLoading && data && (
            <Badge variant="secondary" className="text-xs">
              {data.total_count}
            </Badge>
          )}
        </div>
        {showViewAll && (
          <Button variant="ghost" size="sm" onClick={handleViewAll} className="min-h-11 sm:min-h-0">
            {t('myDossiers.viewAll', 'View All')}
            <ChevronRight className={cn('size-4 ms-1', isRTL && 'rotate-180')} />
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(maxItems)].map((_, i) => (
              <DossierCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-destructive mb-2">
              {error?.message || t('myDossiers.error', 'Failed to load dossiers')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="min-h-11"
            >
              {t('common.retry', 'Try Again')}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && data?.dossiers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Folder className="size-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {t('myDossiers.empty', "You don't have any assigned dossiers yet")}
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/dossiers' })}>
              {t('myDossiers.browse', 'Browse All Dossiers')}
            </Button>
          </div>
        )}

        {/* Dossiers Grid */}
        {!isLoading && !isError && data && data.dossiers.length > 0 && (
          <>
            {/* Quick Filter Tabs by Relation Type */}
            {Object.values(data.counts_by_relation).some((count) => count > 0) && (
              <div className="mb-4">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="all" className="text-xs min-h-9">
                      {t('myDossiers.filter.all', 'All')} ({data.total_count})
                    </TabsTrigger>
                    {data.counts_by_relation.owner > 0 && (
                      <TabsTrigger value="owner" className="text-xs min-h-9">
                        {t('myDossiers.filter.owner', 'Owned')} ({data.counts_by_relation.owner})
                      </TabsTrigger>
                    )}
                    {data.counts_by_relation.contributor > 0 && (
                      <TabsTrigger value="contributor" className="text-xs min-h-9">
                        {t('myDossiers.filter.contributor', 'Contributing')} (
                        {data.counts_by_relation.contributor})
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="all" className="mt-4">
                    <DossiersGrid dossiers={data.dossiers} />
                  </TabsContent>
                  <TabsContent value="owner" className="mt-4">
                    <DossiersGrid
                      dossiers={data.dossiers.filter((d) => d.relation_type === 'owner')}
                    />
                  </TabsContent>
                  <TabsContent value="contributor" className="mt-4">
                    <DossiersGrid
                      dossiers={data.dossiers.filter((d) => d.relation_type === 'contributor')}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Grid without tabs if no relation type filtering needed */}
            {!Object.values(data.counts_by_relation).some((count) => count > 0) && (
              <DossiersGrid dossiers={data.dossiers} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// DossiersGrid Sub-component
// =============================================================================

function DossiersGrid({ dossiers }: { dossiers: MyDossier[] }) {
  const { t } = useTranslation('dossier-dashboard')

  if (dossiers.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        {t('myDossiers.noItemsInFilter', 'No dossiers in this category')}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {dossiers.map((dossier) => (
        <DossierQuickStatsCard key={dossier.id} dossier={dossier} variant="full" />
      ))}
    </div>
  )
}

// =============================================================================
// Import MyDossier type
// =============================================================================

import type { MyDossier } from '@/types/dossier-dashboard.types'

// =============================================================================
// Loading Skeleton
// =============================================================================

function DossierCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default MyDossiersSection
