/**
 * Plugin System - Core Type Definitions
 *
 * Defines the contract for entity plugins in the system.
 * Plugins can register new entity types with custom validation,
 * relationships, permissions, and UI rendering capabilities.
 */

import type { ComponentType, ReactNode } from 'react'
import type { Result } from '@/domains/shared/types/result'

// ============================================================================
// Base Entity Types
// ============================================================================

/**
 * Base bilingual field interface (EN/AR)
 */
export interface BilingualField {
  en: string
  ar: string
}

/**
 * Base status for all entities
 */
export type EntityStatus = 'active' | 'inactive' | 'archived'

/**
 * Sensitivity levels for access control
 */
export type SensitivityLevel = 'low' | 'medium' | 'high' | 'top_secret'

/**
 * Base dossier fields common to all entity types
 */
export interface BaseDossier {
  id: string
  type: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status: EntityStatus
  sensitivity_level: SensitivityLevel
  tags: string[]
  metadata?: Record<string, unknown>
  version: number
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

/**
 * Base list item for entity lists
 */
export interface BaseListItem {
  id: string
  name_en: string
  name_ar: string
  status: EntityStatus
  type: string
}

// ============================================================================
// Plugin Manifest Types
// ============================================================================

/**
 * Plugin metadata and configuration
 */
export interface PluginManifest {
  /** Unique identifier for the plugin (kebab-case) */
  id: string
  /** Human-readable name */
  name: BilingualField
  /** Plugin description */
  description: BilingualField
  /** Semantic version */
  version: string
  /** Plugin author */
  author?: string
  /** Icon name from Lucide icons */
  icon: string
  /** Color theme for UI (Tailwind color) */
  color: string
  /** Dependencies on other plugins */
  dependencies?: string[]
  /** Entity type identifier for database */
  entityType: string
  /** Extension schema for type-safe extensions */
  extensionSchema: ExtensionSchema
}

/**
 * JSON Schema-like definition for extension fields
 */
export interface ExtensionSchema {
  fields: ExtensionFieldDefinition[]
  /** TypeScript type reference (for code generation) */
  typeRef?: string
}

/**
 * Field definition for extension schema
 */
export interface ExtensionFieldDefinition {
  name: string
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'array'
    | 'object'
    | 'enum'
    | 'bilingual'
  label: BilingualField
  required?: boolean
  default?: unknown
  /** For enum types */
  enumValues?: Array<{ value: string; label: BilingualField }>
  /** For array types */
  arrayItemType?: Omit<ExtensionFieldDefinition, 'name' | 'label'>
  /** For object types */
  objectFields?: ExtensionFieldDefinition[]
  /** Validation constraints */
  validation?: FieldValidation
  /** UI hints */
  uiHints?: FieldUIHints
}

/**
 * Validation constraints for fields
 */
export interface FieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  patternMessage?: BilingualField
  custom?: (value: unknown, entity: BaseDossier) => Result<void, string>
}

/**
 * UI rendering hints for fields
 */
export interface FieldUIHints {
  /** Input component type */
  component?:
    | 'input'
    | 'textarea'
    | 'select'
    | 'multiselect'
    | 'datepicker'
    | 'switch'
    | 'slider'
    | 'rich-text'
  /** Placeholder text */
  placeholder?: BilingualField
  /** Help text */
  helpText?: BilingualField
  /** Grid column span (1-12) */
  colSpan?: number
  /** Display in list view */
  showInList?: boolean
  /** Display in card view */
  showInCard?: boolean
  /** Sortable in list */
  sortable?: boolean
  /** Filterable */
  filterable?: boolean
}

// ============================================================================
// Validation Hook Types
// ============================================================================

/**
 * Validation context provided to validators
 */
export interface ValidationContext<T = Record<string, unknown>> {
  entity: BaseDossier & T
  isCreate: boolean
  previousVersion?: BaseDossier & T
  user?: {
    id: string
    role: string
    clearanceLevel: number
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string
  code: string
  message: BilingualField
}

/**
 * Validation hook function type
 */
export type ValidationHook<T = Record<string, unknown>> = (
  context: ValidationContext<T>,
) => Promise<ValidationResult> | ValidationResult

/**
 * Plugin validation hooks
 */
export interface PluginValidationHooks<T = Record<string, unknown>> {
  /** Validate before create */
  beforeCreate?: ValidationHook<T>
  /** Validate before update */
  beforeUpdate?: ValidationHook<T>
  /** Validate before delete/archive */
  beforeDelete?: ValidationHook<T>
  /** Custom field validators */
  fieldValidators?: Record<
    string,
    (value: unknown, context: ValidationContext<T>) => ValidationResult
  >
}

// ============================================================================
// Relationship Types
// ============================================================================

/**
 * Defines allowed relationships for an entity type
 */
export interface RelationshipDefinition {
  /** Relationship type identifier */
  type: string
  /** Display name */
  label: BilingualField
  /** Target entity types that can be related */
  targetEntityTypes: string[]
  /** Cardinality */
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many'
  /** Inverse relationship type (for bidirectional) */
  inverseType?: string
  /** Whether this relationship is required */
  required?: boolean
  /** Maximum number of relationships (for many) */
  maxCount?: number
  /** Metadata schema for the relationship */
  metadataSchema?: ExtensionFieldDefinition[]
}

/**
 * Plugin relationship hooks
 */
export interface PluginRelationshipHooks<T = Record<string, unknown>> {
  /** Define allowed relationship types */
  definitions: RelationshipDefinition[]
  /** Hook before creating a relationship */
  beforeCreateRelationship?: (
    source: BaseDossier & T,
    target: BaseDossier,
    relationshipType: string,
  ) => Promise<ValidationResult> | ValidationResult
  /** Hook after relationship is created */
  afterCreateRelationship?: (
    source: BaseDossier & T,
    target: BaseDossier,
    relationshipType: string,
    relationshipId: string,
  ) => Promise<void> | void
  /** Hook before removing a relationship */
  beforeRemoveRelationship?: (
    source: BaseDossier & T,
    target: BaseDossier,
    relationshipType: string,
  ) => Promise<ValidationResult> | ValidationResult
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Permission action types
 */
export type PermissionAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'archive'
  | 'export'
  | 'share'

/**
 * Permission check context
 */
export interface PermissionContext<T = Record<string, unknown>> {
  action: PermissionAction
  entity?: BaseDossier & T
  user: {
    id: string
    role: string
    clearanceLevel: number
    departmentId?: string
    permissions?: string[]
  }
}

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean
  reason?: BilingualField
}

/**
 * Permission check function type
 */
export type PermissionCheck<T = Record<string, unknown>> = (
  context: PermissionContext<T>,
) => Promise<PermissionResult> | PermissionResult

/**
 * Plugin permission hooks
 */
export interface PluginPermissionHooks<T = Record<string, unknown>> {
  /** Custom permission checker */
  checkPermission?: PermissionCheck<T>
  /** Additional permission actions for this entity type */
  additionalActions?: Array<{
    action: string
    label: BilingualField
    description: BilingualField
  }>
  /** Minimum clearance level to view */
  minViewClearance?: number
  /** Minimum clearance level to edit */
  minEditClearance?: number
  /** Role-based access overrides */
  roleOverrides?: Record<string, PermissionAction[]>
}

// ============================================================================
// UI Rendering Types
// ============================================================================

/**
 * Props passed to entity card components
 */
export interface EntityCardProps<T = Record<string, unknown>> {
  entity: BaseDossier & T
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  isSelected?: boolean
  onSelect?: (id: string) => void
  className?: string
}

/**
 * Props passed to entity detail view components
 */
export interface EntityDetailProps<T = Record<string, unknown>> {
  entity: BaseDossier & T
  onEdit?: () => void
  onDelete?: () => void
  isLoading?: boolean
  className?: string
}

/**
 * Props passed to entity form components
 */
export interface EntityFormProps<T = Record<string, unknown>> {
  mode: 'create' | 'edit'
  initialData?: Partial<BaseDossier & T>
  onSubmit: (data: Partial<BaseDossier & T>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  className?: string
}

/**
 * Props passed to entity list components
 */
export interface EntityListProps<T = Record<string, unknown>> {
  entities: Array<BaseDossier & T>
  isLoading?: boolean
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  className?: string
}

/**
 * Plugin UI component definitions
 */
export interface PluginUIComponents<T = Record<string, unknown>> {
  /** Custom card component for list views */
  Card?: ComponentType<EntityCardProps<T>>
  /** Custom detail view component */
  DetailView?: ComponentType<EntityDetailProps<T>>
  /** Custom form component */
  Form?: ComponentType<EntityFormProps<T>>
  /** Custom list component */
  List?: ComponentType<EntityListProps<T>>
  /** Additional custom components */
  custom?: Record<string, ComponentType<unknown>>
}

/**
 * UI rendering hooks for customizing default components
 */
export interface PluginUIHooks<T = Record<string, unknown>> {
  /** Custom columns for list/table views */
  listColumns?: ListColumnDefinition<T>[]
  /** Custom sections for detail view */
  detailSections?: DetailSectionDefinition<T>[]
  /** Custom form sections */
  formSections?: FormSectionDefinition[]
  /** Custom actions for entity context menu */
  contextActions?: ContextActionDefinition<T>[]
  /** Custom badges/chips to display on cards */
  badges?: BadgeDefinition<T>[]
}

/**
 * List column definition
 */
export interface ListColumnDefinition<T = Record<string, unknown>> {
  id: string
  label: BilingualField
  accessor: keyof (BaseDossier & T) | ((entity: BaseDossier & T) => ReactNode)
  sortable?: boolean
  width?: string | number
  align?: 'start' | 'center' | 'end'
}

/**
 * Detail section definition
 */
export interface DetailSectionDefinition<T = Record<string, unknown>> {
  id: string
  title: BilingualField
  icon?: string
  order: number
  collapsible?: boolean
  defaultExpanded?: boolean
  render: (entity: BaseDossier & T) => ReactNode
}

/**
 * Form section definition
 */
export interface FormSectionDefinition {
  id: string
  title: BilingualField
  description?: BilingualField
  order: number
  fields: string[]
  collapsible?: boolean
}

/**
 * Context action definition
 */
export interface ContextActionDefinition<T = Record<string, unknown>> {
  id: string
  label: BilingualField
  icon?: string
  action: (entity: BaseDossier & T) => Promise<void> | void
  isVisible?: (entity: BaseDossier & T) => boolean
  isDisabled?: (entity: BaseDossier & T) => boolean
  variant?: 'default' | 'destructive'
}

/**
 * Badge definition for cards
 */
export interface BadgeDefinition<T = Record<string, unknown>> {
  id: string
  render: (entity: BaseDossier & T) => ReactNode | null
  position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
}

// ============================================================================
// API & Data Hook Types
// ============================================================================

/**
 * Search parameters for listing entities
 */
export interface EntitySearchParams {
  search?: string
  status?: EntityStatus
  sensitivity_level?: SensitivityLevel
  tags?: string[]
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  [key: string]: unknown
}

/**
 * List response type
 */
export interface EntityListResponse<T = Record<string, unknown>> {
  data: Array<BaseDossier & T>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    has_more: boolean
  }
}

/**
 * Plugin data hooks for custom API integration
 */
export interface PluginDataHooks<T = Record<string, unknown>> {
  /** Custom endpoint for this entity type (defaults to pluralized entityType) */
  endpoint?: string
  /** Transform data before sending to API */
  transformForApi?: (data: Partial<BaseDossier & T>) => Record<string, unknown>
  /** Transform data received from API */
  transformFromApi?: (data: Record<string, unknown>) => BaseDossier & T
  /** Custom search parameters */
  searchParams?: ExtensionFieldDefinition[]
  /** Hook after entity is loaded */
  afterLoad?: (entity: BaseDossier & T) => Promise<BaseDossier & T> | (BaseDossier & T)
  /** Hook before saving */
  beforeSave?: (
    entity: Partial<BaseDossier & T>,
  ) => Promise<Partial<BaseDossier & T>> | Partial<BaseDossier & T>
}

// ============================================================================
// Full Plugin Definition
// ============================================================================

/**
 * Complete plugin definition
 */
export interface EntityPlugin<TExtension = Record<string, unknown>> {
  /** Plugin metadata */
  manifest: PluginManifest
  /** Validation hooks */
  validation?: PluginValidationHooks<TExtension>
  /** Relationship hooks */
  relationships?: PluginRelationshipHooks<TExtension>
  /** Permission hooks */
  permissions?: PluginPermissionHooks<TExtension>
  /** UI components */
  components?: PluginUIComponents<TExtension>
  /** UI hooks */
  ui?: PluginUIHooks<TExtension>
  /** Data hooks */
  data?: PluginDataHooks<TExtension>
  /** Lifecycle hooks */
  lifecycle?: PluginLifecycleHooks
  /** i18n namespace for this plugin */
  i18nNamespace?: string
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycleHooks {
  /** Called when plugin is registered */
  onRegister?: () => Promise<void> | void
  /** Called when plugin is unregistered */
  onUnregister?: () => Promise<void> | void
  /** Called when plugin is enabled */
  onEnable?: () => Promise<void> | void
  /** Called when plugin is disabled */
  onDisable?: () => Promise<void> | void
}

// ============================================================================
// Plugin Registry Types
// ============================================================================

/**
 * Registered plugin with runtime state
 */
export interface RegisteredPlugin<T = Record<string, unknown>> {
  plugin: EntityPlugin<T>
  enabled: boolean
  registeredAt: string
  loadOrder: number
}

/**
 * Plugin registry state
 */
export interface PluginRegistryState {
  plugins: Map<string, RegisteredPlugin>
  entityTypeMap: Map<string, string>
  initialized: boolean
}

/**
 * Plugin registry events
 */
export type PluginRegistryEvent =
  | { type: 'PLUGIN_REGISTERED'; pluginId: string }
  | { type: 'PLUGIN_UNREGISTERED'; pluginId: string }
  | { type: 'PLUGIN_ENABLED'; pluginId: string }
  | { type: 'PLUGIN_DISABLED'; pluginId: string }
  | { type: 'REGISTRY_INITIALIZED' }

/**
 * Plugin registry event listener
 */
export type PluginEventListener = (event: PluginRegistryEvent) => void
