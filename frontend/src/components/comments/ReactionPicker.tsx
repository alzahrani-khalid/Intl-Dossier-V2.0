/**
 * ReactionPicker Component
 *
 * Emoji reaction picker for comments with:
 * - Display of current reactions with counts
 * - Add/remove reaction toggle
 * - Optimistic updates
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SmilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToggleReaction } from '@/hooks/useComments'
import { cn } from '@/lib/utils'
import type {
  CommentableEntityType,
  CommentReactionEmoji,
  CommentReactions,
  COMMENT_REACTION_EMOJIS,
} from '@/types/comment.types'

interface ReactionPickerProps {
  commentId: string
  entityType: CommentableEntityType
  entityId: string
  reactions: CommentReactions
  userReactions?: CommentReactionEmoji[]
  compact?: boolean
}

const EMOJI_LIST: CommentReactionEmoji[] = [
  '👍',
  '👎',
  '❤️',
  '🎉',
  '😄',
  '😕',
  '🚀',
  '👀',
  '✅',
  '❓',
  '💡',
  '🔥',
]

const EMOJI_LABELS: Record<CommentReactionEmoji, string> = {
  '👍': 'thumbsUp',
  '👎': 'thumbsDown',
  '❤️': 'heart',
  '🎉': 'celebration',
  '😄': 'smile',
  '😕': 'confused',
  '🚀': 'rocket',
  '👀': 'eyes',
  '✅': 'checkmark',
  '❓': 'question',
  '💡': 'idea',
  '🔥': 'fire',
}

export function ReactionPicker({
  commentId,
  entityType,
  entityId,
  reactions,
  userReactions = [],
  compact = false,
}: ReactionPickerProps) {
  const { t, i18n } = useTranslation('comments')
  const isRTL = i18n.language === 'ar'

  const [isOpen, setIsOpen] = useState(false)
  const toggleReaction = useToggleReaction()

  const handleReactionClick = async (emoji: CommentReactionEmoji) => {
    await toggleReaction.mutateAsync({
      commentId,
      emoji,
      entityType,
      entityId,
    })
    setIsOpen(false)
  }

  // Get reactions with counts > 0
  const activeReactions = Object.entries(reactions).filter(([_, count]) => count > 0) as [
    CommentReactionEmoji,
    number,
  ][]

  const hasReactions = activeReactions.length > 0

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {activeReactions.map(([emoji, count]) => {
        const isUserReaction = userReactions.includes(emoji)
        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isUserReaction ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-7 px-2 text-xs gap-1',
                    isUserReaction && 'bg-primary/10 border border-primary/20',
                  )}
                  onClick={() => handleReactionClick(emoji)}
                  disabled={toggleReaction.isPending}
                  data-testid={`reaction-badge-${emoji}`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t(`reactions.${EMOJI_LABELS[emoji]}`, EMOJI_LABELS[emoji])}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7', compact ? 'w-7 p-0' : 'px-2 text-xs gap-1')}
            data-testid="add-reaction-button"
          >
            <SmilePlus className="h-4 w-4" />
            {!compact && !hasReactions && <span>{t('reactions.add', 'React')}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          align={isRTL ? 'end' : 'start'}
          data-testid="reaction-picker"
        >
          <div className="grid grid-cols-6 gap-1">
            {EMOJI_LIST.map((emoji) => {
              const isActive = userReactions.includes(emoji)
              return (
                <TooltipProvider key={emoji}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn(
                          'h-8 w-8 p-0 text-lg',
                          isActive && 'bg-primary/10 ring-1 ring-primary/20',
                        )}
                        onClick={() => handleReactionClick(emoji)}
                        disabled={toggleReaction.isPending}
                        data-testid={`reaction-emoji-${emoji}`}
                      >
                        {emoji}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t(`reactions.${EMOJI_LABELS[emoji]}`, EMOJI_LABELS[emoji])}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ReactionPicker
