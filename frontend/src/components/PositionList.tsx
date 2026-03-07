import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { AlertCircle, FileText, Loader2 } from 'lucide-react'
import { PositionCard } from './PositionCard'
import { usePositions } from '../hooks/usePositions'
import { useInView } from '../hooks/useInView'
import type { PositionFilters } from '../types/position'

interface PositionListProps {
  filters?: PositionFilters
  onFilterChange?: (filters: PositionFilters) => void
}

const EMPTY_FILTERS: PositionFilters = {}

export function PositionList({ filters = EMPTY_FILTERS }: PositionListProps) {
  const { t } = useTranslation('positions')

  // Infinite scroll observer target
  const observerTarget = useRef<HTMLDivElement>(null)
  const isInView = useInView(observerTarget as React.RefObject<HTMLElement>, { threshold: 0.1 })

  // Fetch positions with infinite scroll
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    usePositions(filters)

  // Trigger next page fetch when observer target comes into view
  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten paginated results
  const positions = data?.pages.flatMap((page) => page.data) || []
  const totalCount = data?.pages[0]?.total || 0

  return (
    <div className="space-y-4">
      {/* Results Count */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('list.resultsCount', { count: totalCount, ns: 'common' }) ||
              `${totalCount} result${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <Card key={n}>
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 size-16 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">{t('list.error')}</h3>
            <p className="mb-4 max-w-md text-center text-sm text-muted-foreground">
              {t('list.errorDescription')}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              {t('actions.retry', { ns: 'common' }) || 'Retry'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && positions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 size-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">{t('list.empty')}</h3>
            <p className="max-w-md text-center text-sm text-muted-foreground">
              {t('list.emptyDescription')}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && positions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      )}

      {/* Infinite Scroll Observer Target */}
      {hasNextPage && (
        <div ref={observerTarget} className="flex items-center justify-center py-8">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">{t('list.loadingMore')}</span>
            </div>
          )}
        </div>
      )}

      {/* No More Results */}
      {!hasNextPage && positions.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{t('list.noMoreResults')}</p>
        </div>
      )}
    </div>
  )
}
