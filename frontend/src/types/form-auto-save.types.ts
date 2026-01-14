/**
 * Form Auto-Save Types
 *
 * Type definitions for the form auto-save feature that provides:
 * - Automatic saving of partial form progress
 * - Draft restoration after navigation/timeout
 * - Progress indicators and time estimation
 *
 * @module types/form-auto-save
 */

/**
 * Configuration options for auto-save behavior
 */
export interface AutoSaveConfig {
  /**
   * Unique key to identify the form draft in storage
   */
  formKey: string

  /**
   * Debounce delay in milliseconds for auto-save
   * @default 1000
   */
  debounceMs?: number

  /**
   * Time-to-live in milliseconds for stored drafts
   * @default 604800000 (7 days)
   */
  ttlMs?: number

  /**
   * Enable server sync in addition to local storage
   * @default false
   */
  enableServerSync?: boolean

  /**
   * List of field names to track for progress calculation
   * If not provided, all fields are tracked
   */
  requiredFields?: string[]

  /**
   * Callback when auto-save succeeds
   */
  onSaveSuccess?: (draft: FormDraft<unknown>) => void

  /**
   * Callback when auto-save fails
   */
  onSaveError?: (error: Error) => void

  /**
   * Callback when a draft is restored
   */
  onDraftRestored?: (draft: FormDraft<unknown>) => void
}

/**
 * Stored form draft with metadata
 */
export interface FormDraft<T = Record<string, unknown>> {
  /**
   * Unique form identifier
   */
  formKey: string

  /**
   * Form data snapshot
   */
  data: T

  /**
   * Current step index for multi-step forms
   */
  currentStep?: number

  /**
   * Total steps for multi-step forms
   */
  totalSteps?: number

  /**
   * Timestamp when draft was last saved
   */
  savedAt: string

  /**
   * Timestamp when form was first started
   */
  startedAt: string

  /**
   * Progress percentage (0-100)
   */
  progress: number

  /**
   * Number of fields completed
   */
  fieldsCompleted: number

  /**
   * Total number of tracked fields
   */
  totalFields: number

  /**
   * Schema version for migration support
   */
  version: number

  /**
   * User ID who created the draft (for multi-user support)
   */
  userId?: string
}

/**
 * Auto-save status information
 */
export interface AutoSaveStatus {
  /**
   * Whether a save operation is in progress
   */
  isSaving: boolean

  /**
   * Whether a draft has been restored
   */
  hasRestored: boolean

  /**
   * Whether there are unsaved changes
   */
  hasUnsavedChanges: boolean

  /**
   * Last saved timestamp
   */
  lastSavedAt: string | null

  /**
   * Error from last save attempt
   */
  error: Error | null

  /**
   * Whether storage is available
   */
  isStorageAvailable: boolean
}

/**
 * Progress information for forms
 */
export interface FormProgress {
  /**
   * Progress percentage (0-100)
   */
  percentage: number

  /**
   * Number of completed fields
   */
  completedFields: number

  /**
   * Total number of fields
   */
  totalFields: number

  /**
   * Current step for multi-step forms
   */
  currentStep?: number

  /**
   * Total steps for multi-step forms
   */
  totalSteps?: number

  /**
   * Estimated time to complete in minutes
   */
  estimatedMinutesRemaining: number

  /**
   * Average time per field in seconds (for estimation)
   */
  avgSecondsPerField: number
}

/**
 * Field completion status
 */
export interface FieldStatus {
  /**
   * Field name
   */
  name: string

  /**
   * Whether the field has a value
   */
  isCompleted: boolean

  /**
   * Whether the field is required
   */
  isRequired: boolean

  /**
   * Field validation status
   */
  isValid: boolean
}

/**
 * Return type for useAutoSaveForm hook
 */
export interface UseAutoSaveFormReturn<T extends Record<string, unknown>> {
  /**
   * Current draft data
   */
  draft: FormDraft<T> | null

  /**
   * Update draft data
   */
  updateDraft: (data: Partial<T>, step?: number) => void

  /**
   * Clear the draft
   */
  clearDraft: () => Promise<void>

  /**
   * Manually trigger a save
   */
  saveDraft: () => Promise<void>

  /**
   * Restore a draft from storage
   */
  restoreDraft: () => Promise<FormDraft<T> | null>

  /**
   * Auto-save status
   */
  status: AutoSaveStatus

  /**
   * Form progress information
   */
  progress: FormProgress

  /**
   * Check if a specific field is completed
   */
  isFieldCompleted: (fieldName: string) => boolean

  /**
   * Get all field statuses
   */
  getFieldStatuses: () => FieldStatus[]
}

/**
 * Props for FormProgressIndicator component
 */
export interface FormProgressIndicatorProps {
  /**
   * Progress information
   */
  progress: FormProgress

  /**
   * Show estimated time remaining
   * @default true
   */
  showTimeEstimate?: boolean

  /**
   * Show step indicator for multi-step forms
   * @default true
   */
  showSteps?: boolean

  /**
   * Custom class name
   */
  className?: string

  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg'
}

/**
 * Props for FormDraftBanner component
 */
export interface FormDraftBannerProps {
  /**
   * Draft to display
   */
  draft: FormDraft<unknown>

  /**
   * Callback when user chooses to restore
   */
  onRestore: () => void

  /**
   * Callback when user dismisses the banner
   */
  onDismiss: () => void

  /**
   * Callback when user chooses to discard the draft
   */
  onDiscard: () => void

  /**
   * Whether restoration is in progress
   */
  isRestoring?: boolean

  /**
   * Custom class name
   */
  className?: string
}

/**
 * Props for AutoSaveIndicator component
 */
export interface AutoSaveIndicatorProps {
  /**
   * Auto-save status
   */
  status: AutoSaveStatus

  /**
   * Custom class name
   */
  className?: string

  /**
   * Show in compact mode
   * @default false
   */
  compact?: boolean
}
