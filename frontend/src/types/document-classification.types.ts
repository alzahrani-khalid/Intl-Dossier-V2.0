/**
 * Document Classification Types
 *
 * Types for document classification levels, field-level access control,
 * need-to-know principles, and automatic redaction.
 */

/**
 * Document classification levels
 * Maps to government security standards:
 * - public: Level 0 - No restrictions
 * - internal: Level 1 - Basic clearance required
 * - confidential: Level 2 - Analyst clearance or higher
 * - secret: Level 3 - Admin/manager clearance only
 */
export type DocumentClassification = 'public' | 'internal' | 'confidential' | 'secret'

/**
 * Classification level numeric values for comparison
 */
export const CLASSIFICATION_LEVELS: Record<DocumentClassification, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  secret: 3,
}

/**
 * Classification display labels (English)
 */
export const CLASSIFICATION_LABELS: Record<DocumentClassification, string> = {
  public: 'Public',
  internal: 'Internal',
  confidential: 'Confidential',
  secret: 'Secret',
}

/**
 * Classification badge colors (Tailwind classes)
 */
export const CLASSIFICATION_COLORS: Record<
  DocumentClassification,
  { bg: string; text: string; border: string }
> = {
  public: {
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  internal: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  confidential: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  secret: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
}

/**
 * Classification icons (Lucide icon names)
 */
export const CLASSIFICATION_ICONS: Record<DocumentClassification, string> = {
  public: 'Globe',
  internal: 'Building',
  confidential: 'Lock',
  secret: 'ShieldAlert',
}

/**
 * Document with classification information
 */
export interface ClassifiedDocument {
  id: string
  entity_type: string
  entity_id: string
  file_name: string
  file_path?: string // May be redacted
  mime_type: string
  size_bytes: number
  uploaded_at: string
  uploaded_by?: string
  classification: DocumentClassification
  classification_label?: string
  classification_reason?: string
  classified_by?: string
  classified_at?: string
  handling_instructions?: string
  declassification_date?: string
  need_to_know_groups?: string[]
  can_download: boolean
  _redacted_fields?: string[]
  _user_clearance?: number
}

/**
 * Document access group for need-to-know management
 */
export interface DocumentAccessGroup {
  id: string
  name_en: string
  name_ar?: string
  description?: string
  members: string[]
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
}

/**
 * Field-level redaction rule
 */
export interface FieldRedaction {
  id: string
  document_id: string
  field_path: string
  redaction_level: DocumentClassification
  redaction_text: string
  redaction_reason?: string
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Document access log entry
 */
export interface DocumentAccessLog {
  id: string
  document_id: string
  user_id: string
  access_type: 'view' | 'download' | 'preview' | 'metadata' | 'denied'
  user_clearance: number
  document_classification: DocumentClassification
  access_granted: boolean
  denial_reason?: string
  ip_address?: string
  user_agent?: string
  accessed_at: string
  session_id?: string
  redacted_fields?: string[]
}

/**
 * Classification change request
 */
export interface ClassificationChangeRequest {
  id: string
  document_id: string
  old_classification?: DocumentClassification
  new_classification: DocumentClassification
  change_reason: string
  changed_by: string
  changed_at: string
  approved_by?: string
  approval_date?: string
  is_approved: boolean
  document?: {
    file_name: string
    entity_type: string
    entity_id: string
  }
}

/**
 * Classification change form data
 */
export interface ClassificationChangeFormData {
  documentId: string
  newClassification: DocumentClassification
  reason: string
}

/**
 * API request types for document-classification edge function
 */
export type ClassificationAction =
  | 'list'
  | 'get'
  | 'change'
  | 'approve'
  | 'access-log'
  | 'pending-approvals'

export interface ClassificationApiRequest {
  action: ClassificationAction
  documentId?: string
  entityType?: string
  entityId?: string
  newClassification?: DocumentClassification
  reason?: string
  changeId?: string
  limit?: number
  offset?: number
}

export interface ClassificationListResponse {
  documents: ClassifiedDocument[]
  total: number
}

export interface ClassificationGetResponse {
  document: ClassifiedDocument
}

export interface ClassificationChangeResponse {
  changeId: string
  approved: boolean
  message: string
}

export interface ClassificationApproveResponse {
  approved: boolean
  message: string
}

export interface ClassificationAccessLogResponse {
  logs: DocumentAccessLog[]
  total: number
}

export interface ClassificationPendingResponse {
  pendingChanges: ClassificationChangeRequest[]
  total: number
}

/**
 * User clearance level mapping
 */
export const USER_CLEARANCE_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Basic',
  2: 'Standard',
  3: 'High',
  4: 'Top Secret',
}

/**
 * Helper to check if user can access a classification level
 */
export function canAccessClassification(
  userClearance: number,
  classification: DocumentClassification,
): boolean {
  return userClearance >= CLASSIFICATION_LEVELS[classification]
}

/**
 * Helper to get the highest classification a user can access
 */
export function getMaxClassificationForClearance(clearance: number): DocumentClassification {
  if (clearance >= 3) return 'secret'
  if (clearance >= 2) return 'confidential'
  if (clearance >= 1) return 'internal'
  return 'public'
}

/**
 * Helper to check if classification change requires approval
 */
export function requiresApproval(
  oldClassification: DocumentClassification | undefined,
  newClassification: DocumentClassification,
): boolean {
  if (!oldClassification) return false
  return CLASSIFICATION_LEVELS[newClassification] > CLASSIFICATION_LEVELS[oldClassification]
}

/**
 * Get classification badge class names
 */
export function getClassificationBadgeClasses(classification: DocumentClassification): string {
  const colors = CLASSIFICATION_COLORS[classification]
  return `${colors.bg} ${colors.text} ${colors.border} border`
}

/**
 * Get classification description for tooltip/help text
 */
export function getClassificationDescription(classification: DocumentClassification): string {
  const descriptions: Record<DocumentClassification, string> = {
    public: 'No access restrictions. Can be viewed by anyone.',
    internal: 'For internal use only. Requires basic clearance (Level 1).',
    confidential: 'Sensitive information. Requires analyst clearance or higher (Level 2).',
    secret: 'Highly sensitive. Restricted to administrators and managers (Level 3).',
  }
  return descriptions[classification]
}
