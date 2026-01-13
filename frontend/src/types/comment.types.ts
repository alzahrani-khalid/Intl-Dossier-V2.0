/**
 * Entity Comments System Types
 *
 * Rich commenting system with threading, @mentions, markdown support,
 * and role-based visibility.
 */

// Entity types that support comments
export type CommentableEntityType =
  | 'dossier'
  | 'country'
  | 'organization'
  | 'forum'
  | 'mou'
  | 'event'
  | 'position'
  | 'intake_ticket'
  | 'engagement'
  | 'working_group'
  | 'document'
  | 'brief'

// Visibility levels for comments
export type CommentVisibility =
  | 'public' // Visible to all users with entity access
  | 'internal' // Visible to internal staff only
  | 'team' // Visible to team members assigned to entity
  | 'private' // Visible only to author and mentioned users

// Allowed reaction emojis
export type CommentReactionEmoji =
  | '👍'
  | '👎'
  | '❤️'
  | '🎉'
  | '😄'
  | '😕'
  | '🚀'
  | '👀'
  | '✅'
  | '❓'
  | '💡'
  | '🔥'

export const COMMENT_REACTION_EMOJIS: CommentReactionEmoji[] = [
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

// Author info embedded in comments
export interface CommentAuthor {
  id: string
  email: string
  name: string | null
  avatar: string | null
}

// Mention info
export interface CommentMention {
  user_id: string
  username: string | null
  name: string | null
  start_position: number
  end_position: number
}

// Reaction summary (emoji -> count)
export type CommentReactions = Record<CommentReactionEmoji, number>

// Base comment structure
export interface Comment {
  id: string
  entity_type: CommentableEntityType
  entity_id: string
  parent_id: string | null
  thread_root_id: string | null
  thread_depth: number
  content: string
  content_html: string | null
  visibility: CommentVisibility
  is_edited: boolean
  edited_at: string | null
  edit_count: number
  created_at: string
  updated_at: string
  author_id: string
}

// Comment with all related data (from API)
export interface CommentWithDetails extends Comment {
  author: CommentAuthor
  mentions: CommentMention[]
  reactions: CommentReactions
  reply_count: number
}

// Thread structure (for nested display)
export interface CommentThread extends CommentWithDetails {
  replies?: CommentThread[]
}

// Pagination info
export interface CommentPagination {
  offset: number
  limit: number
  total: number
  has_more: boolean
}

// API Responses
export interface GetCommentsResponse {
  comments: CommentWithDetails[]
  pagination: CommentPagination
}

export interface GetCommentResponse {
  comment: CommentWithDetails
}

export interface GetThreadResponse {
  thread: CommentWithDetails[]
}

export interface CreateCommentResponse {
  comment: CommentWithDetails
}

export interface UpdateCommentResponse {
  comment: Comment
}

export interface DeleteCommentResponse {
  success: boolean
}

export interface ToggleReactionResponse {
  action: 'added' | 'removed'
  emoji: CommentReactionEmoji
  reaction?: {
    id: string
    comment_id: string
    user_id: string
    emoji: CommentReactionEmoji
    created_at: string
  }
}

// User search for @mentions
export interface MentionUser {
  id: string
  username: string | null
  full_name: string | null
  email: string
  avatar_url: string | null
}

export interface SearchUsersResponse {
  users: MentionUser[]
}

// API Request types
export interface CreateCommentRequest {
  entity_type: CommentableEntityType
  entity_id: string
  content: string
  parent_id?: string
  visibility?: CommentVisibility
}

export interface UpdateCommentRequest {
  content: string
  visibility?: CommentVisibility
}

export interface ToggleReactionRequest {
  emoji: CommentReactionEmoji
}

// Query parameters
export interface GetCommentsParams {
  entity_type: CommentableEntityType
  entity_id: string
  limit?: number
  offset?: number
  include_replies?: boolean
}

export interface SearchUsersParams {
  query: string
  limit?: number
}

// Notification types
export type CommentNotificationType =
  | 'mention' // User was @mentioned
  | 'reply' // Reply to user's comment
  | 'reaction' // Reaction to user's comment
  | 'thread_update' // Update in a thread user participated in

export interface CommentNotification {
  id: string
  user_id: string
  comment_id: string
  notification_type: CommentNotificationType
  actor_id: string
  entity_type: CommentableEntityType
  entity_id: string
  is_read: boolean
  read_at: string | null
  email_sent: boolean
  email_sent_at: string | null
  created_at: string
}

// Comment attachment
export interface CommentAttachment {
  id: string
  comment_id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  thumbnail_path: string | null
  created_at: string
}

// Error response
export interface CommentError {
  code: string
  message_en: string
  message_ar?: string
}

export interface CommentErrorResponse {
  error: CommentError
}

// Utility types for component props
export interface CommentFormProps {
  entityType: CommentableEntityType
  entityId: string
  parentId?: string
  visibility?: CommentVisibility
  placeholder?: string
  onSubmit?: (comment: CommentWithDetails) => void
  onCancel?: () => void
  autoFocus?: boolean
  maxLength?: number
}

export interface CommentListProps {
  entityType: CommentableEntityType
  entityId: string
  showReplies?: boolean
  maxDepth?: number
  pageSize?: number
  emptyMessage?: string
}

export interface CommentItemProps {
  comment: CommentWithDetails
  showReplies?: boolean
  maxDepth?: number
  currentDepth?: number
  onReply?: (parentId: string) => void
  onEdit?: (commentId: string) => void
  onDelete?: (commentId: string) => void
}

export interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

export interface ReactionPickerProps {
  commentId: string
  currentReactions: CommentReactions
  userReactions?: CommentReactionEmoji[]
  onReactionToggle: (emoji: CommentReactionEmoji) => void
}

// Query key factory
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (params: GetCommentsParams) => [...commentKeys.lists(), params] as const,
  details: () => [...commentKeys.all, 'detail'] as const,
  detail: (id: string) => [...commentKeys.details(), id] as const,
  threads: () => [...commentKeys.all, 'thread'] as const,
  thread: (rootId: string) => [...commentKeys.threads(), rootId] as const,
  userSearch: (query: string) => [...commentKeys.all, 'users', query] as const,
}
