/**
 * Types for Real-Time Collaborative Editing
 * Google Docs-style track changes, suggestions, and inline comments
 */

// =====================================================
// ENUM TYPES
// =====================================================

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'resolved'

export type TrackChangeType = 'insertion' | 'deletion' | 'replacement' | 'formatting'

export type EditSessionStatus = 'active' | 'idle' | 'disconnected' | 'closed'

export type InlineCommentStatus = 'open' | 'resolved' | 'dismissed'

// =====================================================
// POSITION TYPES
// =====================================================

export interface TextPosition {
  line: number
  column: number
  offset: number
}

export interface TextSelection {
  start: TextPosition
  end: TextPosition
}

export interface CursorPosition {
  line: number
  column: number
  selection?: TextSelection
}

export interface Viewport {
  scrollTop: number
  scrollLeft: number
  visibleRange: {
    start: number
    end: number
  }
}

// =====================================================
// USER TYPES
// =====================================================

export interface CollaboratorUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  color?: string
}

export interface ActiveEditor extends CollaboratorUser {
  sessionId: string
  cursorPosition?: CursorPosition
  status: EditSessionStatus
  lastActivityAt: string
}

// =====================================================
// EDIT SESSION TYPES
// =====================================================

export interface EditSession {
  id: string
  documentId: string
  documentVersionId?: string
  userId: string
  status: EditSessionStatus
  cursorPosition?: CursorPosition
  viewport?: Viewport
  lastActivityAt: string
  connectedAt: string
  disconnectedAt?: string
  sessionMetadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface JoinSessionParams {
  documentId: string
  documentVersionId?: string
}

export interface UpdateCursorParams {
  sessionId: string
  cursorPosition: CursorPosition
  viewport?: Viewport
}

// =====================================================
// SUGGESTION TYPES
// =====================================================

export interface Suggestion {
  id: string
  documentId: string
  documentVersionId?: string
  authorId: string
  startPosition: TextPosition
  endPosition: TextPosition
  originalText: string
  suggestedText: string
  changeType: TrackChangeType
  status: SuggestionStatus
  resolvedBy?: string
  resolvedAt?: string
  resolutionComment?: string
  comment?: string
  threadId?: string
  suggestionMetadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SuggestionWithAuthor extends Suggestion {
  author: CollaboratorUser
  resolvedByUser?: CollaboratorUser
  replyCount: number
}

export interface CreateSuggestionParams {
  documentId: string
  documentVersionId?: string
  startPosition: TextPosition
  endPosition: TextPosition
  originalText: string
  suggestedText: string
  changeType: TrackChangeType
  comment?: string
}

export interface ResolveSuggestionParams {
  suggestionId: string
  accept: boolean
  comment?: string
}

// =====================================================
// TRACK CHANGE TYPES
// =====================================================

export interface TrackChange {
  id: string
  documentId: string
  documentVersionId?: string
  authorId: string
  sessionId?: string
  startPosition: TextPosition
  endPosition: TextPosition
  originalText?: string
  newText?: string
  changeType: TrackChangeType
  isAccepted?: boolean
  acceptedBy?: string
  acceptedAt?: string
  changeGroupId?: string
  sequenceNumber?: number
  changeMetadata?: Record<string, unknown>
  createdAt: string
}

export interface TrackChangeWithAuthor extends TrackChange {
  author: CollaboratorUser
  acceptedByUser?: CollaboratorUser
}

export interface CreateTrackChangeParams {
  documentId: string
  documentVersionId?: string
  sessionId?: string
  startPosition: TextPosition
  endPosition: TextPosition
  originalText?: string
  newText?: string
  changeType: TrackChangeType
  changeGroupId?: string
  sequenceNumber?: number
}

export interface ResolveTrackChangeParams {
  changeId: string
  accept: boolean
}

export interface ResolveChangeGroupParams {
  groupId: string
  accept: boolean
}

// =====================================================
// INLINE COMMENT TYPES
// =====================================================

export interface InlineComment {
  id: string
  documentId: string
  documentVersionId?: string
  authorId: string
  anchorStart: TextPosition
  anchorEnd: TextPosition
  highlightedText: string
  content: string
  contentHtml?: string
  parentId?: string
  threadRootId?: string
  threadDepth: number
  status: InlineCommentStatus
  resolvedBy?: string
  resolvedAt?: string
  mentionedUsers: string[]
  isEdited: boolean
  editedAt?: string
  editCount: number
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
  createdAt: string
  updatedAt: string
}

export interface InlineCommentWithAuthor extends InlineComment {
  author: CollaboratorUser
  resolvedByUser?: CollaboratorUser
  replyCount: number
}

export interface InlineCommentThread extends InlineCommentWithAuthor {
  replies?: InlineCommentThread[]
}

export interface CreateInlineCommentParams {
  documentId: string
  documentVersionId?: string
  anchorStart: TextPosition
  anchorEnd: TextPosition
  highlightedText: string
  content: string
  parentId?: string
  mentionedUsers?: string[]
}

export interface UpdateInlineCommentParams {
  commentId: string
  content: string
  mentionedUsers?: string[]
}

export interface ResolveInlineCommentParams {
  commentId: string
  status: InlineCommentStatus
}

// =====================================================
// COLLABORATOR TYPES
// =====================================================

export interface DocumentCollaborator {
  id: string
  documentId: string
  userId: string
  canEdit: boolean
  canSuggest: boolean
  canComment: boolean
  canResolve: boolean
  canManage: boolean
  invitedBy?: string
  invitedAt: string
  acceptedAt?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CollaboratorWithUser extends DocumentCollaborator {
  user: CollaboratorUser
  invitedByUser?: CollaboratorUser
}

export interface AddCollaboratorParams {
  documentId: string
  userId: string
  canEdit?: boolean
  canSuggest?: boolean
  canComment?: boolean
  canResolve?: boolean
  canManage?: boolean
  expiresAt?: string
}

export interface UpdateCollaboratorParams {
  collaboratorId: string
  canEdit?: boolean
  canSuggest?: boolean
  canComment?: boolean
  canResolve?: boolean
  canManage?: boolean
  expiresAt?: string
  isActive?: boolean
}

// =====================================================
// OPERATION TYPES (for OT)
// =====================================================

export type OperationType =
  | 'insert'
  | 'delete'
  | 'replace'
  | 'format'
  | 'cursor_move'
  | 'selection_change'

export interface Operation {
  id: string
  documentId: string
  sessionId?: string
  authorId: string
  operationType: OperationType
  operationData: Record<string, unknown>
  baseVersion: number
  resultingVersion: number
  clientTimestamp: string
  serverTimestamp: string
  isUndone: boolean
  undoneBy?: string
  createdAt: string
}

export interface InsertOperation {
  type: 'insert'
  position: TextPosition
  text: string
}

export interface DeleteOperation {
  type: 'delete'
  start: TextPosition
  end: TextPosition
  deletedText: string
}

export interface ReplaceOperation {
  type: 'replace'
  start: TextPosition
  end: TextPosition
  oldText: string
  newText: string
}

export interface FormatOperation {
  type: 'format'
  start: TextPosition
  end: TextPosition
  format: Record<string, unknown>
}

export type OperationData = InsertOperation | DeleteOperation | ReplaceOperation | FormatOperation

// =====================================================
// COLLABORATIVE STATE TYPES
// =====================================================

export interface CollaborativeState {
  id: string
  documentId: string
  content: string
  contentHtml?: string
  currentVersion: number
  lastOperationId?: string
  trackChangesEnabled: boolean
  suggestionsEnabled: boolean
  isLocked: boolean
  lockedBy?: string
  lockedAt?: string
  lockReason?: string
  createdAt: string
  updatedAt: string
}

export interface CollaborationSummary {
  activeEditors: number
  pendingSuggestions: number
  pendingChanges: number
  openComments: number
  trackChangesEnabled: boolean
  suggestionsEnabled: boolean
  isLocked: boolean
  lockedByName?: string
}

// =====================================================
// REAL-TIME EVENT TYPES
// =====================================================

export type CollaborativeEventType =
  | 'session_joined'
  | 'session_left'
  | 'cursor_moved'
  | 'selection_changed'
  | 'content_changed'
  | 'suggestion_created'
  | 'suggestion_resolved'
  | 'change_created'
  | 'change_resolved'
  | 'comment_created'
  | 'comment_updated'
  | 'comment_resolved'
  | 'collaborator_added'
  | 'collaborator_removed'
  | 'document_locked'
  | 'document_unlocked'

export interface CollaborativeEvent {
  type: CollaborativeEventType
  documentId: string
  userId: string
  timestamp: string
  payload: Record<string, unknown>
}

export interface CursorMovedEvent {
  type: 'cursor_moved'
  documentId: string
  userId: string
  sessionId: string
  cursorPosition: CursorPosition
  user: CollaboratorUser
}

export interface SelectionChangedEvent {
  type: 'selection_changed'
  documentId: string
  userId: string
  sessionId: string
  selection: TextSelection
  user: CollaboratorUser
}

// =====================================================
// PRESENCE TYPES
// =====================================================

export interface EditorPresence {
  userId: string
  sessionId: string
  user: CollaboratorUser
  cursorPosition?: CursorPosition
  selection?: TextSelection
  status: EditSessionStatus
  lastActivityAt: string
}

export interface PresenceState {
  [sessionId: string]: EditorPresence
}

// =====================================================
// HOOK RETURN TYPES
// =====================================================

export interface UseCollaborativeEditingReturn {
  // State
  session: EditSession | null
  activeEditors: ActiveEditor[]
  suggestions: SuggestionWithAuthor[]
  trackChanges: TrackChangeWithAuthor[]
  inlineComments: InlineCommentWithAuthor[]
  collaborators: CollaboratorWithUser[]
  summary: CollaborationSummary | null
  isConnected: boolean
  isLoading: boolean
  error: Error | null

  // Session actions
  joinSession: () => Promise<EditSession>
  leaveSession: () => Promise<void>
  updateCursor: (position: CursorPosition, viewport?: Viewport) => void

  // Suggestion actions
  createSuggestion: (params: Omit<CreateSuggestionParams, 'documentId'>) => Promise<Suggestion>
  resolveSuggestion: (suggestionId: string, accept: boolean, comment?: string) => Promise<void>

  // Track change actions
  acceptChange: (changeId: string) => Promise<void>
  rejectChange: (changeId: string) => Promise<void>
  acceptAllChanges: () => Promise<void>
  rejectAllChanges: () => Promise<void>
  acceptChangeGroup: (groupId: string) => Promise<void>
  rejectChangeGroup: (groupId: string) => Promise<void>

  // Inline comment actions
  createInlineComment: (
    params: Omit<CreateInlineCommentParams, 'documentId'>,
  ) => Promise<InlineComment>
  updateInlineComment: (commentId: string, content: string) => Promise<void>
  resolveInlineComment: (commentId: string, status: InlineCommentStatus) => Promise<void>
  deleteInlineComment: (commentId: string) => Promise<void>

  // Collaborator actions
  addCollaborator: (params: Omit<AddCollaboratorParams, 'documentId'>) => Promise<void>
  updateCollaborator: (params: UpdateCollaboratorParams) => Promise<void>
  removeCollaborator: (collaboratorId: string) => Promise<void>

  // Settings
  toggleTrackChanges: (enabled: boolean) => Promise<void>
  toggleSuggestions: (enabled: boolean) => Promise<void>
  lockDocument: (reason?: string) => Promise<void>
  unlockDocument: () => Promise<void>
}

// =====================================================
// COMPONENT PROP TYPES
// =====================================================

export interface CollaborativeEditorProps {
  documentId: string
  documentVersionId?: string
  initialContent?: string
  readOnly?: boolean
  className?: string
  onContentChange?: (content: string) => void
  onSave?: (content: string) => Promise<void>
}

export interface SuggestionPanelProps {
  suggestions: SuggestionWithAuthor[]
  onAccept: (suggestionId: string) => void
  onReject: (suggestionId: string) => void
  onComment: (suggestionId: string, comment: string) => void
  isLoading?: boolean
  className?: string
}

export interface TrackChangesOverlayProps {
  changes: TrackChangeWithAuthor[]
  onAccept: (changeId: string) => void
  onReject: (changeId: string) => void
  showAuthorship?: boolean
  className?: string
}

export interface InlineCommentMarkerProps {
  comment: InlineCommentWithAuthor
  position: { top: number; left: number }
  onReply: (content: string) => void
  onResolve: () => void
  onEdit?: (content: string) => void
  onDelete?: () => void
  className?: string
}

export interface ActiveEditorAvatarsProps {
  editors: ActiveEditor[]
  maxVisible?: number
  className?: string
}

export interface CollaboratorListProps {
  collaborators: CollaboratorWithUser[]
  onUpdate: (params: UpdateCollaboratorParams) => void
  onRemove: (collaboratorId: string) => void
  canManage?: boolean
  className?: string
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface CollaborativeEditingQueryParams {
  documentId: string
  status?: SuggestionStatus | InlineCommentStatus
  showPendingOnly?: boolean
  limit?: number
  offset?: number
}

export type CollaborativePermission = 'edit' | 'suggest' | 'comment' | 'resolve' | 'manage'

export function hasPermission(
  collaborator: DocumentCollaborator | null,
  permission: CollaborativePermission,
): boolean {
  if (!collaborator || !collaborator.isActive) return false

  switch (permission) {
    case 'edit':
      return collaborator.canEdit
    case 'suggest':
      return collaborator.canSuggest
    case 'comment':
      return collaborator.canComment
    case 'resolve':
      return collaborator.canResolve
    case 'manage':
      return collaborator.canManage
    default:
      return false
  }
}

export function getChangeTypeLabel(type: TrackChangeType): string {
  const labels: Record<TrackChangeType, string> = {
    insertion: 'Added',
    deletion: 'Deleted',
    replacement: 'Replaced',
    formatting: 'Formatted',
  }
  return labels[type]
}

export function getSuggestionStatusLabel(status: SuggestionStatus): string {
  const labels: Record<SuggestionStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    resolved: 'Resolved',
  }
  return labels[status]
}

export function getCommentStatusLabel(status: InlineCommentStatus): string {
  const labels: Record<InlineCommentStatus, string> = {
    open: 'Open',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
  }
  return labels[status]
}
