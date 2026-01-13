/**
 * Collaborative Editing Components
 *
 * Real-time collaborative editing with Google Docs-style features:
 * - Track changes with authorship
 * - Suggestions with accept/reject workflow
 * - Inline comments with threading
 * - Active editor presence display
 */

export { CollaborativeEditor } from './CollaborativeEditor'
export { ActiveEditorAvatars, ActiveEditorBadge } from './ActiveEditorAvatars'
export { SuggestionPanel } from './SuggestionPanel'
export { TrackChangesOverlay, ChangeMarker } from './TrackChangesOverlay'
export { InlineCommentMarker, CommentIndicator } from './InlineCommentMarker'
export {
  CollaborativeDocumentModal,
  useCollaborativeDocumentModal,
} from './CollaborativeDocumentModal'

// Re-export types
export type {
  CollaborativeEditorProps,
  SuggestionPanelProps,
  TrackChangesOverlayProps,
  InlineCommentMarkerProps,
  ActiveEditorAvatarsProps,
} from '@/types/collaborative-editing.types'
