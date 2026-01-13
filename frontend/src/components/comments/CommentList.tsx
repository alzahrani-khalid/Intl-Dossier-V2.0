/**
 * CommentList Component
 *
 * Renders a list of comments with:
 * - Infinite scroll pagination
 * - Comment form for new comments
 * - Empty state
 * - Loading states
 * - Error handling
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { useComments } from '@/hooks/useComments'
import { cn } from '@/lib/utils'
import type { CommentableEntityType, CommentVisibility } from '@/types/comment.types'

interface CommentListProps {
  entityType: CommentableEntityType
  entityId: string
  showReplies?: boolean
  maxDepth?: number
  pageSize?: number
  emptyMessage?: string
  defaultVisibility?: CommentVisibility
  showForm?: boolean
  title?: string
  className?: string
}

export function CommentList({
  entityType,
  entityId,
  showReplies = true,
  maxDepth = 3,
  pageSize = 20,
  emptyMessage,
  defaultVisibility = 'public',
  showForm = true,
  title,
  className,
}: CommentListProps) {
  const { t, i18n } = useTranslation('comments')
  const isRTL = i18n.language === 'ar'

  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useComments(entityType, entityId, {
    pageSize,
    includeReplies: false, // We load replies per-comment
    enabled: !!entityType && !!entityId,
  })

  // Flatten pages into single array of comments
  const comments = data?.pages.flatMap((page) => page.comments) ?? []
  const totalCount = data?.pages[0]?.pagination.total ?? 0

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleCommentSubmit = useCallback(() => {
    // Comments will be refetched automatically via query invalidation
  }, [])

  if (isLoading) {
    return (
      <div
        className={cn('flex items-center justify-center py-8', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ms-2 text-muted-foreground">{t('loading', 'Loading comments...')}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error?.message || t('error', 'Failed to load comments')}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('retry', 'Retry')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div
      className={cn('space-y-4', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="comment-list"
    >
      {/* Header */}
      {title !== null && (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {title || t('title', 'Comments')}
            {totalCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground ms-2">({totalCount})</span>
            )}
          </h3>
        </div>
      )}

      {/* New comment form */}
      {showForm && (
        <>
          <CommentForm
            entityType={entityType}
            entityId={entityId}
            visibility={defaultVisibility}
            onSubmit={handleCommentSubmit}
          />
          {comments.length > 0 && <Separator />}
        </>
      )}

      {/* Empty state */}
      {comments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            {emptyMessage || t('empty', 'No comments yet. Be the first to comment!')}
          </p>
        </div>
      )}

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              showReplies={showReplies}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}

      {/* Load more indicator / trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-4">
          {isFetchingNextPage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ms-2 text-sm text-muted-foreground">
                {t('loadingMore', 'Loading more comments...')}
              </span>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              data-testid="load-more-comments"
            >
              {t('loadMore', 'Load more comments')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default CommentList
