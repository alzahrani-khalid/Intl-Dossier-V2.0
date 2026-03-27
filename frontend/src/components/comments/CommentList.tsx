/**
 * CommentList Component
 *
 * Renders a list of comments with:
 * - Comment form for new comments
 * - Empty state
 * - Loading states
 * - Error handling
 */

import { useCallback } from 'react'
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
  const { t } = useTranslation('comments')

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useComments(entityType, entityId, {
    limit: pageSize,
    enabled: !!entityType && !!entityId,
  })

  // Extract comments from plain query response
  const responseData = data as { comments?: unknown[]; total?: number } | undefined
  const comments = Array.isArray(responseData?.comments) ? responseData.comments : []
  const totalCount = responseData?.total ?? comments.length

  const handleCommentSubmit = useCallback(() => {
    // Comments will be refetched automatically via query invalidation
  }, [])

  if (isLoading) {
    return (
      <div
        className={cn('flex items-center justify-center py-8', className)}
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
          <span>{(error as Error | null)?.message || t('error', 'Failed to load comments')}</span>
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
          {(comments as Array<Parameters<typeof CommentItem>[0]['comment']>).map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              showReplies={showReplies}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}

    </div>
  )
}
