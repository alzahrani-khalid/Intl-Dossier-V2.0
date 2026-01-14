/**
 * Progressive Form Types
 * Types for progressive disclosure forms with required/optional field distinction
 */

export type FieldImportance = 'required' | 'recommended' | 'optional'

export type FieldStatus = 'empty' | 'partial' | 'complete' | 'error'

export interface ProgressiveFieldConfig {
  /** Unique field identifier */
  name: string
  /** Field label */
  label: string
  /** Field importance level */
  importance: FieldImportance
  /** Field group (for grouping related fields) */
  group?: string
  /** Help text for the field */
  helpText?: string
  /** Whether this field depends on another field */
  dependsOn?: string
  /** Condition to show this field */
  showWhen?: (formValues: Record<string, unknown>) => boolean
  /** Custom validation function */
  validate?: (value: unknown) => FieldStatus
}

export interface FieldGroup {
  /** Unique group identifier */
  id: string
  /** Group title */
  title: string
  /** Group description */
  description?: string
  /** Whether group is collapsible */
  collapsible?: boolean
  /** Default collapsed state */
  defaultCollapsed?: boolean
  /** Group icon name */
  icon?: string
  /** Fields in this group */
  fields: string[]
}

export interface FormCompletionState {
  /** Total number of fields */
  totalFields: number
  /** Number of completed fields */
  completedFields: number
  /** Number of required fields */
  requiredFields: number
  /** Number of completed required fields */
  completedRequiredFields: number
  /** Number of optional fields */
  optionalFields: number
  /** Number of completed optional fields */
  completedOptionalFields: number
  /** Number of recommended fields */
  recommendedFields: number
  /** Number of completed recommended fields */
  completedRecommendedFields: number
  /** Overall completion percentage (0-100) */
  overallPercentage: number
  /** Required fields completion percentage (0-100) */
  requiredPercentage: number
  /** Can form be submitted */
  canSubmit: boolean
  /** Fields with errors */
  fieldsWithErrors: string[]
  /** Empty required fields */
  emptyRequiredFields: string[]
}

export interface ProgressiveFormConfig {
  /** All field configurations */
  fields: ProgressiveFieldConfig[]
  /** Field groups */
  groups?: FieldGroup[]
  /** Whether to show optional fields by default */
  showOptionalByDefault?: boolean
  /** Whether to auto-expand groups with errors */
  autoExpandOnError?: boolean
  /** Minimum completion percentage to submit */
  minCompletionToSubmit?: number
  /** Whether to show completion progress */
  showProgress?: boolean
}

export interface ProgressiveFormHookOptions {
  /** Form configuration */
  config: ProgressiveFormConfig
  /** Form values */
  values: Record<string, unknown>
  /** Touched fields */
  touched?: Record<string, boolean>
  /** Field errors */
  errors?: Record<string, string>
  /** Callback when field status changes */
  onFieldStatusChange?: (fieldName: string, status: FieldStatus) => void
}

export interface ProgressiveFormHookReturn {
  /** Current completion state */
  completionState: FormCompletionState
  /** Whether optional fields are shown */
  showOptional: boolean
  /** Toggle optional fields visibility */
  toggleOptionalFields: () => void
  /** Get field configuration by name */
  getFieldConfig: (name: string) => ProgressiveFieldConfig | undefined
  /** Get field status */
  getFieldStatus: (name: string) => FieldStatus
  /** Check if field should be visible */
  isFieldVisible: (name: string) => boolean
  /** Get fields by group */
  getFieldsByGroup: (groupId: string) => ProgressiveFieldConfig[]
  /** Get ungrouped fields */
  getUngroupedFields: () => ProgressiveFieldConfig[]
  /** Get group completion percentage */
  getGroupCompletion: (groupId: string) => number
  /** Check if group has errors */
  groupHasErrors: (groupId: string) => boolean
  /** Collapsed groups state */
  collapsedGroups: Record<string, boolean>
  /** Toggle group collapsed state */
  toggleGroupCollapse: (groupId: string) => void
}
