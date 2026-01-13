/**
 * CommentForm Component
 *
 * Form for creating and editing comments with:
 * - Markdown editing
 * - @mention support
 * - Visibility selector
 * - Submit with Ctrl+Enter
 */

import React, { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, X, Eye, EyeOff, Users, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MentionInput } from './MentionInput'
import { useCreateComment, useUpdateComment } from '@/hooks/useComments'
import { cn } from '@/lib/utils'
import type {
  CommentableEntityType,
  CommentVisibility,
  CommentWithDetails,
} from '@/types/comment.types'

interface CommentFormProps {
  entityType: CommentableEntityType
  entityId: string
  parentId?: string
  editingComment?: CommentWithDetails
  visibility?: CommentVisibility
  placeholder?: string
  onSubmit?: (comment: CommentWithDetails) => void
  onCancel?: () => void
  autoFocus?: boolean
  maxLength?: number
  compact?: boolean
}

const VISIBILITY_OPTIONS: { value: CommentVisibility; icon: React.ReactNode; labelKey: string }[] =
  [
    { value: 'public', icon: <Eye className="h-4 w-4" />, labelKey: 'visibility.public' },
    { value: 'internal', icon: <Users className="h-4 w-4" />, labelKey: 'visibility.internal' },
    { value: 'team', icon: <Users className="h-4 w-4" />, labelKey: 'visibility.team' },
    { value: 'private', icon: <Lock className="h-4 w-4" />, labelKey: 'visibility.private' },
  ]

export function CommentForm({
  entityType,
  entityId,
  parentId,
  editingComment,
  visibility: defaultVisibility = 'public',
  placeholder,
  onSubmit,
  onCancel,
  autoFocus = false,
  maxLength = 10000,
  compact = false,
}: CommentFormProps) {
  const { t, i18n } = useTranslation('comments')
  const isRTL = i18n.language === 'ar'

  const [content, setContent] = useState(editingComment?.content || '')
  const [visibility, setVisibility] = useState<CommentVisibility>(
    editingComment?.visibility || defaultVisibility,
  )

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const createComment = useCreateComment()
  const updateComment = useUpdateComment()

  const isEditing = !!editingComment
  const isSubmitting = createComment.isPending || updateComment.isPending
  const canSubmit = content.trim().length > 0 && content.length <= maxLength && !isSubmitting

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    try {
      if (isEditing) {
        const result = await updateComment.mutateAsync({
          commentId: editingComment.id,
          content: content.trim(),
          visibility,
        })
        // Create a CommentWithDetails from the result
        const updatedComment: CommentWithDetails = {
          ...editingComment,
          ...result,
          mentions: editingComment.mentions,
          reactions: editingComment.reactions,
          reply_count: editingComment.reply_count,
        }
        onSubmit?.(updatedComment)
      } else {
        const comment = await createComment.mutateAsync({
          entityType,
          entityId,
          content: content.trim(),
          parentId,
          visibility,
        })
        onSubmit?.(comment)
        setContent('')
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  }, [
    canSubmit,
    isEditing,
    editingComment,
    content,
    visibility,
    entityType,
    entityId,
    parentId,
    createComment,
    updateComment,
    onSubmit,
  ])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const handleCancel = useCallback(() => {
    setContent('')
    setVisibility(defaultVisibility)
    onCancel?.()
  }, [defaultVisibility, onCancel])

  return (
    <div
      className={cn('space-y-3', compact && 'space-y-2')}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="comment-form"
    >
      {/* Textarea with @mention support */}
      <MentionInput
        ref={textareaRef}
        value={content}
        onChange={setContent}
        placeholder={
          placeholder || t('form.placeholder', 'Write a comment... Use @ to mention someone')
        }
        maxLength={maxLength}
        disabled={isSubmitting}
        autoFocus={autoFocus}
        rows={compact ? 2 : 3}
        onKeyDown={handleKeyDown}
        className={cn(compact && 'text-sm')}
      />

      {/* Actions row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Visibility selector */}
        <div className="flex items-center gap-2">
          <Select value={visibility} onValueChange={(v) => setVisibility(v as CommentVisibility)}>
            <SelectTrigger
              className={cn('w-auto min-w-[120px]', compact && 'h-8 text-xs')}
              data-testid="visibility-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{t(option.labelKey, option.value)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Keyboard hint */}
          {!compact && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {t('form.keyboardHint', 'Ctrl+Enter to submit')}
            </span>
          )}
        </div>

        {/* Submit/Cancel buttons */}
        <div className="flex items-center gap-2">
          {(isEditing || parentId || onCancel) && (
            <Button
              type="button"
              variant="ghost"
              size={compact ? 'sm' : 'default'}
              onClick={handleCancel}
              disabled={isSubmitting}
              data-testid="cancel-comment-button"
            >
              <X className={cn('h-4 w-4', !compact && 'me-1')} />
              {!compact && t('form.cancel', 'Cancel')}
            </Button>
          )}

          <Button
            type="button"
            size={compact ? 'sm' : 'default'}
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="submit-comment-button"
          >
            <Send className={cn('h-4 w-4', !compact && 'me-1')} />
            {isSubmitting
              ? t('form.submitting', 'Posting...')
              : isEditing
                ? t('form.update', 'Update')
                : t('form.submit', 'Post')}
          </Button>
        </div>
      </div>

      {/* Markdown hint */}
      {!compact && (
        <p className="text-xs text-muted-foreground">
          {t('form.markdownHint', 'Supports **bold**, *italic*, `code`, and [links](url)')}
        </p>
      )}
    </div>
  )
}

export default CommentForm
