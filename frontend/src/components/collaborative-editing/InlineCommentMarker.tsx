/**
 * InlineCommentMarker Component
 *
 * Displays inline comments anchored to specific text positions.
 * Shows comment threads with reply functionality.
 * Mobile-first with RTL support.
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  MessageSquare,
  Check,
  X,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  InlineCommentWithAuthor,
  InlineCommentStatus,
} from '@/types/collaborative-editing.types'

export interface InlineCommentMarkerProps {
  comment: InlineCommentWithAuthor
  replies?: InlineCommentWithAuthor[]
  onReply: (content: string) => void
  onResolve: () => void
  onReopen?: () => void
  onEdit?: (content: string) => void
  onDelete?: () => void
  isAuthor?: boolean
  canResolve?: boolean
  className?: string
}

export function InlineCommentMarker({
  comment,
  replies = [],
  onReply,
  onResolve,
  onReopen,
  onEdit,
  onDelete,
  isAuthor = false,
  canResolve = true,
  className,
}: InlineCommentMarkerProps) {
  const { t, i18n } = useTranslation('collaborative-editing')
  const isRTL = i18n.language === 'ar'
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  const [isOpen, setIsOpen] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [editContent, setEditContent] = useState(comment.content)

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent)
      setReplyContent('')
      setIsReplying(false)
    }
  }

  const handleEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent)
      setIsEditing(false)
    }
  }

  const getStatusColor = (status: InlineCommentStatus) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500'
      case 'resolved':
        return 'bg-green-500'
      case 'dismissed':
        return 'bg-gray-400'
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span
          className={cn(
            'relative inline-block cursor-pointer',
            'bg-yellow-100 dark:bg-yellow-900/30',
            'border-b-2 border-yellow-400',
            'hover:bg-yellow-200 dark:hover:bg-yellow-800/40',
            'transition-colors rounded px-0.5',
            comment.status === 'resolved' &&
              'opacity-60 bg-green-100 dark:bg-green-900/30 border-green-400',
            comment.status === 'dismissed' && 'opacity-40',
            className,
          )}
        >
          {comment.highlightedText}
          <span
            className={cn(
              'absolute -top-1 -end-1 h-3 w-3 rounded-full flex items-center justify-center',
              getStatusColor(comment.status),
            )}
          >
            <MessageSquare className="h-2 w-2 text-white" />
          </span>
        </span>
      </PopoverTrigger>

      <PopoverContent side={isRTL ? 'left' : 'right'} align="start" className="w-80 sm:w-96 p-0">
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium text-sm">{t('comments.thread')}</span>
              {comment.status !== 'open' && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    comment.status === 'resolved' &&
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    comment.status === 'dismissed' &&
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                  )}
                >
                  {t(`comments.status.${comment.status}`)}
                </Badge>
              )}
            </div>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                {comment.status === 'open' && canResolve && (
                  <DropdownMenuItem onClick={onResolve} className="gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {t('comments.resolve')}
                  </DropdownMenuItem>
                )}
                {comment.status === 'resolved' && onReopen && (
                  <DropdownMenuItem onClick={onReopen} className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t('comments.reopen')}
                  </DropdownMenuItem>
                )}
                {isAuthor && onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2">
                      <Edit className="h-4 w-4" />
                      {t('comments.edit')}
                    </DropdownMenuItem>
                  </>
                )}
                {isAuthor && onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-600">
                    <Trash2 className="h-4 w-4" />
                    {t('comments.delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Comments thread */}
          <ScrollArea className="max-h-[300px]">
            <div className="p-3 space-y-3">
              {/* Original comment */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={comment.author?.avatarUrl} alt={comment.author?.name} />
                    <AvatarFallback className="text-xs">
                      {comment.author?.name?.slice(0, 2).toUpperCase() ||
                        comment.author?.email?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {comment.author?.name || comment.author?.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                      {comment.isEdited && (
                        <span className="text-xs text-muted-foreground">
                          ({t('comments.edited')})
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleEdit}>
                            {t('common.save')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsEditing(false)
                              setEditContent(comment.content)
                            }}
                          >
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {replies.length > 0 && (
                <div className={cn('space-y-3', isRTL ? 'pe-4' : 'ps-4')}>
                  {replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={reply.author?.avatarUrl} alt={reply.author?.name} />
                        <AvatarFallback className="text-xs">
                          {reply.author?.name?.slice(0, 2).toUpperCase() ||
                            reply.author?.email?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {reply.author?.name || reply.author?.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.createdAt), {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5 whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Reply input */}
          {comment.status === 'open' && (
            <div className="p-3 border-t bg-muted/30">
              {isReplying ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder={t('comments.replyPlaceholder')}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsReplying(false)
                        setReplyContent('')
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                      {t('comments.reply')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setIsReplying(true)}
                >
                  <Reply className="h-4 w-4" />
                  {t('comments.addReply')}
                </Button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Simplified indicator for sidebar/panel use
export function CommentIndicator({
  count,
  status = 'open',
  className,
}: {
  count: number
  status?: InlineCommentStatus
  className?: string
}) {
  const { t } = useTranslation('collaborative-editing')

  if (count === 0) return null

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1',
        status === 'open' &&
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        status === 'resolved' &&
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        className,
      )}
    >
      <MessageSquare className="h-3 w-3" />
      {count}
    </Badge>
  )
}

export default InlineCommentMarker
