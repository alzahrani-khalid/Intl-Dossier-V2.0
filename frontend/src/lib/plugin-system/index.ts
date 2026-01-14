/**
 * Plugin System - Main Entry Point
 *
 * An extensible plugin architecture for adding new entity types
 * without modifying core code. Includes hooks for validation,
 * relationships, permissions, and UI rendering.
 *
 * @example Basic usage
 * ```typescript
 * import { createPlugin, pluginRegistry, useEntityPlugin } from '@/lib/plugin-system'
 *
 * // Define a plugin
 * const projectPlugin = createPlugin({
 *   id: 'project',
 *   name: { en: 'Project', ar: 'مشروع' },
 *   description: { en: 'Track projects', ar: 'تتبع المشاريع' },
 *   entityType: 'project',
 *   icon: 'Folder',
 *   color: 'blue',
 *   fields: [
 *     textField('code', { en: 'Project Code', ar: 'رمز المشروع' }, { required: true }),
 *     dateField('start_date', { en: 'Start Date', ar: 'تاريخ البدء' }),
 *     dateField('end_date', { en: 'End Date', ar: 'تاريخ الانتهاء' }),
 *   ],
 * })
 *
 * // Register the plugin
 * await pluginRegistry.register(projectPlugin)
 *
 * // Use in a component
 * function ProjectList() {
 *   const { ui, permissions } = useEntityPlugin({ entityType: 'project' })
 *   const { data: projects } = usePluginEntities('project')
 *   // ...
 * }
 * ```
 */

// Core types
export type {
  // Base types
  BilingualField,
  EntityStatus,
  SensitivityLevel,
  BaseDossier,
  BaseListItem,

  // Plugin manifest
  PluginManifest,
  ExtensionSchema,
  ExtensionFieldDefinition,
  FieldValidation,
  FieldUIHints,

  // Validation
  ValidationContext,
  ValidationResult,
  ValidationError,
  ValidationHook,
  PluginValidationHooks,

  // Relationships
  RelationshipDefinition,
  PluginRelationshipHooks,

  // Permissions
  PermissionAction,
  PermissionContext,
  PermissionResult,
  PermissionCheck,
  PluginPermissionHooks,

  // UI
  EntityCardProps,
  EntityDetailProps,
  EntityFormProps,
  EntityListProps,
  PluginUIComponents,
  PluginUIHooks,
  ListColumnDefinition,
  DetailSectionDefinition,
  FormSectionDefinition,
  ContextActionDefinition,
  BadgeDefinition,

  // Data
  EntitySearchParams,
  EntityListResponse,
  PluginDataHooks,

  // Lifecycle
  PluginLifecycleHooks,

  // Full plugin
  EntityPlugin,
  RegisteredPlugin,
  PluginRegistryState,
  PluginRegistryEvent,
  PluginEventListener,
} from './types/plugin.types'

// Registry
export { pluginRegistry } from './registry/plugin-registry'
export type { PluginRegistry } from './registry/plugin-registry'

// Hooks
export {
  // Main hook
  useEntityPlugin,
  type UseEntityPluginOptions,
  type UseEntityPluginReturn,

  // CRUD hooks
  usePluginEntities,
  usePluginEntity,
  useCreatePluginEntity,
  useUpdatePluginEntity,
  useDeletePluginEntity,
  entityPluginKeys,

  // Specialized hooks
  usePluginValidation,
  type UsePluginValidationOptions,
  type UsePluginValidationReturn,
  usePluginPermissions,
  type UsePluginPermissionsOptions,
  type UsePluginPermissionsReturn,
  usePluginRelationships,
  type PluginRelationship,
  type RelationshipWithTarget,
  type CreateRelationshipInput,
  type UsePluginRelationshipsOptions,
  type UsePluginRelationshipsReturn,
  usePluginUI,
  useEntityDisplay,
  type UsePluginUIOptions,
  type UsePluginUIReturn,
} from './hooks'

// Plugin creation utilities
export {
  // Builder
  PluginBuilder,
  createPluginBuilder,

  // Factory
  createPlugin,

  // Field helpers
  textField,
  bilingualField,
  numberField,
  booleanField,
  dateField,
  datetimeField,
  enumField,
  arrayField,

  // Relationship helpers
  relationship,
  oneToOneRelationship,
  oneToManyRelationship,
} from './utils/createPlugin'
