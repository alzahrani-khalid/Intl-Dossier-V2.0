/**
 * CommentItem Component
 *
 * Renders a single comment with:
 * - Markdown content rendering
 * - @mention highlighting
 * - Reactions with emoji picker
 * - Reply functionality
 * - Edit/Delete actions
 * - Threaded replies
 */

import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { CommentForm } from './CommentForm'
import { ReactionPicker } from './ReactionPicker'
import { useCommentThread, useDeleteComment } from '@/hooks/useComments'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type {
  CommentWithDetails,
  CommentReactionEmoji,
  CommentVisibility,
} from '@/types/comment.types'

interface CommentItemProps {
  comment: CommentWithDetails
  showReplies?: boolean
  maxDepth?: number
  currentDepth?: number
  onReply?: (parentId: string) => void
  onEdit?: (commentId: string) => void
  onDelete?: (commentId: string) => void
}

const VISIBILITY_ICONS: Record<CommentVisibility, React.ReactNode> = {
  public: <Eye className="h-3 w-3" />,
  internal: <Users className="h-3 w-3" />,
  team: <Users className="h-3 w-3" />,
  private: <Lock className="h-3 w-3" />,
}

export function CommentItem({
  comment,
  showReplies = true,
  maxDepth = 3,
  currentDepth = 0,
  onReply,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const { t, i18n } = useTranslation('comments')
  const isRTL = i18n.language === 'ar'
  const locale = i18n.language === 'ar' ? ar : enUS

  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showRepliesExpanded, setShowRepliesExpanded] = useState(currentDepth < 2)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get current user
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
    })
  }, [])

  const deleteComment = useDeleteComment()

  // Fetch thread replies if this is a root comment
  const { data: replies = [], isLoading: isLoadingReplies } = useCommentThread(comment.id, {
    enabled:
      showReplies && comment.reply_count > 0 && showRepliesExpanded && comment.parent_id === null,
    maxDepth: maxDepth - currentDepth,
  })

  const isAuthor = currentUserId === comment.author_id
  const canEdit = isAuthor
  const canDelete = isAuthor
  const canReply = currentDepth < maxDepth

  // Parse and render content with @mentions
  const renderedContent = useMemo(() => {
    const content = comment.content_html || comment.content

    // If we have pre-rendered HTML, use it
    if (comment.content_html) {
      return (
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: comment.content_html }}
        />
      )
    }

    // Otherwise, do basic @mention highlighting
    const parts: React.ReactNode[] = []
    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>,
        )
      }

      // Add mention as styled span
      const username = match[1]
      const mentionData = comment.mentions.find(
        (m) => m.username === username || m.name?.toLowerCase().includes(username.toLowerCase()),
      )

      parts.push(
        <TooltipProvider key={`mention-${match.index}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="text-primary font-medium cursor-pointer hover:underline"
                data-testid="mention-link"
              >
                @{username}
              </span>
            </TooltipTrigger>
            <TooltipContent>{mentionData?.name || username}</TooltipContent>
          </Tooltip>
        </TooltipProvider>,
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>)
    }

    return <div className="whitespace-pre-wrap">{parts}</div>
  }, [comment.content, comment.content_html, comment.mentions])

  // Format timestamp
  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(comment.created_at), {
      addSuffix: true,
      locale,
    })
  }, [comment.created_at, locale])

  const handleDelete = async () => {
    if (!window.confirm(t('confirmDelete', 'Are you sure you want to delete this comment?'))) {
      return
    }

    await deleteComment.mutateAsync({
      commentId: comment.id,
      entityType: comment.entity_type,
      entityId: comment.entity_id,
    })

    onDelete?.(comment.id)
  }

  const handleReplySubmit = () => {
    setIsReplying(false)
    onReply?.(comment.id)
  }

  const handleEditSubmit = () => {
    setIsEditing(false)
    onEdit?.(comment.id)
  }

  if (isEditing) {
    return (
      <div className={cn('py-2', currentDepth > 0 && 'ps-4 border-s-2 border-muted')}>
        <CommentForm
          entityType={comment.entity_type}
          entityId={comment.entity_id}
          editingComment={comment}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditing(false)}
          autoFocus
          compact
        />
      </div>
    )
  }

  return (
    <div
      className={cn('py-3', currentDepth > 0 && 'ps-4 border-s-2 border-muted ms-4')}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="comment-item"
    >
      {/* Comment header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author.avatar || undefined} alt={comment.author.name || ''} />
          <AvatarFallback className="text-xs">
            {(comment.author.name || comment.author.email)?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1">
          {/* Author info and actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm" data-testid="comment-author">
                {comment.author.name || comment.author.email}
              </span>
              <span className="text-xs text-muted-foreground" data-testid="comment-timestamp">
                {timeAgo}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-muted-foreground italic">
                  ({t('edited', 'edited')})
                </span>
              )}
              {comment.visibility !== 'public' && (
                <Badge variant="outline" className="h-5 text-xs gap-1">
                  {VISIBILITY_ICONS[comment.visibility]}
                  {t(`visibility.${comment.visibility}`, comment.visibility)}
                </Badge>
              )}
            </div>

            {/* Actions dropdown */}
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">{t('actions', 'Actions')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 me-2" />
                      {t('actions.edit', 'Edit')}
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 me-2" />
                        {t('actions.delete', 'Delete')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment content */}
          <div className="text-sm">{renderedContent}</div>

          {/* Reactions and reply button */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <ReactionPicker
              commentId={comment.id}
              entityType={comment.entity_type}
              entityId={comment.entity_id}
              reactions={comment.reactions}
            />

            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsReplying(!isReplying)}
              >
                <MessageSquare className="h-3 w-3 me-1" />
                {t('actions.reply', 'Reply')}
              </Button>
            )}

            {/* Show replies toggle */}
            {showReplies && comment.reply_count > 0 && comment.parent_id === null && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowRepliesExpanded(!showRepliesExpanded)}
              >
                {showRepliesExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 me-1" />
                    {t('hideReplies', 'Hide replies')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 me-1" />
                    {t('showReplies', 'Show {{count}} replies', { count: comment.reply_count })}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reply form */}
      {isReplying && (
        <div className="mt-3 ps-11">
          <CommentForm
            entityType={comment.entity_type}
            entityId={comment.entity_id}
            parentId={comment.id}
            onSubmit={handleReplySubmit}
            onCancel={() => setIsReplying(false)}
            autoFocus
            compact
          />
        </div>
      )}

      {/* Nested replies */}
      {showReplies && showRepliesExpanded && replies.length > 0 && (
        <div className="mt-2">
          {isLoadingReplies ? (
            <div className="ps-11 py-2 text-sm text-muted-foreground">
              {t('loadingReplies', 'Loading replies...')}
            </div>
          ) : (
            replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                showReplies={showReplies}
                maxDepth={maxDepth}
                currentDepth={currentDepth + 1}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default CommentItem
