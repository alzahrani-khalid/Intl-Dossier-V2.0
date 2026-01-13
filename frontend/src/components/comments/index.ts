/**
 * Comments Components
 *
 * Rich commenting system with @mentions, threaded replies,
 * markdown support, and role-based visibility.
 */

export { CommentForm } from './CommentForm'
export { CommentItem } from './CommentItem'
export { CommentList } from './CommentList'
export { MentionInput } from './MentionInput'
export { ReactionPicker } from './ReactionPicker'

// Re-export types
export type {
  CommentableEntityType,
  CommentVisibility,
  CommentReactionEmoji,
  CommentWithDetails,
  CommentMention,
  CommentReactions,
  CommentFormProps,
  CommentListProps,
  CommentItemProps,
  MentionInputProps,
  ReactionPickerProps,
} from '@/types/comment.types'
