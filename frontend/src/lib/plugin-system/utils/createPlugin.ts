/**
 * Plugin Factory Utilities
 *
 * Helper functions for creating entity plugins with type safety.
 */

import type {
  EntityPlugin,
  PluginManifest,
  ExtensionFieldDefinition,
  PluginValidationHooks,
  PluginRelationshipHooks,
  PluginPermissionHooks,
  PluginUIComponents,
  PluginUIHooks,
  PluginDataHooks,
  PluginLifecycleHooks,
  BilingualField,
  RelationshipDefinition,
} from '../types/plugin.types'

// ============================================================================
// Plugin Builder
// ============================================================================

/**
 * Builder class for creating plugins with a fluent API
 */
export class PluginBuilder<T = Record<string, unknown>> {
  private plugin: Partial<EntityPlugin<T>> = {}

  /**
   * Set plugin manifest
   */
  manifest(manifest: PluginManifest): this {
    this.plugin.manifest = manifest
    return this
  }

  /**
   * Set validation hooks
   */
  validation(hooks: PluginValidationHooks<T>): this {
    this.plugin.validation = hooks
    return this
  }

  /**
   * Set relationship hooks
   */
  relationships(hooks: PluginRelationshipHooks<T>): this {
    this.plugin.relationships = hooks
    return this
  }

  /**
   * Set permission hooks
   */
  permissions(hooks: PluginPermissionHooks<T>): this {
    this.plugin.permissions = hooks
    return this
  }

  /**
   * Set UI components
   */
  components(components: PluginUIComponents<T>): this {
    this.plugin.components = components
    return this
  }

  /**
   * Set UI hooks
   */
  ui(hooks: PluginUIHooks<T>): this {
    this.plugin.ui = hooks
    return this
  }

  /**
   * Set data hooks
   */
  data(hooks: PluginDataHooks<T>): this {
    this.plugin.data = hooks
    return this
  }

  /**
   * Set lifecycle hooks
   */
  lifecycle(hooks: PluginLifecycleHooks): this {
    this.plugin.lifecycle = hooks
    return this
  }

  /**
   * Set i18n namespace
   */
  i18n(namespace: string): this {
    this.plugin.i18nNamespace = namespace
    return this
  }

  /**
   * Build the plugin
   */
  build(): EntityPlugin<T> {
    if (!this.plugin.manifest) {
      throw new Error('Plugin manifest is required')
    }
    return this.plugin as EntityPlugin<T>
  }
}

/**
 * Create a new plugin builder
 */
export function createPluginBuilder<T = Record<string, unknown>>(): PluginBuilder<T> {
  return new PluginBuilder<T>()
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a simple entity plugin with minimal configuration
 */
export function createPlugin<T = Record<string, unknown>>(config: {
  id: string
  name: BilingualField
  description: BilingualField
  entityType: string
  icon?: string
  color?: string
  version?: string
  fields: ExtensionFieldDefinition[]
  relationships?: RelationshipDefinition[]
  validation?: PluginValidationHooks<T>
  permissions?: PluginPermissionHooks<T>
  components?: PluginUIComponents<T>
  ui?: PluginUIHooks<T>
  data?: PluginDataHooks<T>
  lifecycle?: PluginLifecycleHooks
  i18nNamespace?: string
}): EntityPlugin<T> {
  const manifest: PluginManifest = {
    id: config.id,
    name: config.name,
    description: config.description,
    version: config.version || '1.0.0',
    icon: config.icon || 'FileText',
    color: config.color || 'gray',
    entityType: config.entityType,
    extensionSchema: {
      fields: config.fields,
    },
  }

  return {
    manifest,
    validation: config.validation,
    relationships: config.relationships ? { definitions: config.relationships } : undefined,
    permissions: config.permissions,
    components: config.components,
    ui: config.ui,
    data: config.data,
    lifecycle: config.lifecycle,
    i18nNamespace: config.i18nNamespace,
  }
}

// ============================================================================
// Field Definition Helpers
// ============================================================================

/**
 * Create a text field definition
 */
export function textField(
  name: string,
  label: BilingualField,
  options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>,
): ExtensionFieldDefinition {
  return {
    name,
    label,
    type: 'string',
    ...options,
  }
}

/**
 * Create a bilingual text field definition
 */
export function bilingualField(
  name: string,
  label: BilingualField,
  options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>,
): ExtensionFieldDefinition {
  return {
    name,
    label,
    type: 'bilingual',
    ...options,
  }
}

/**
 * Create a number field definition
 */
export function numberField(
  name: string,
  label: BilingualField,
  options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>,
): ExtensionFieldDefinition {
  return {
    name,
    label,
    type: 'number',
    ...options,
  }
}

/**
 * Create a boolean field definition
 */
export function booleanField(
  name: string,
  label: BilingualField,
  options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>,
): ExtensionFieldDefinition {
  return {
    name,
    label,
    type: 'boolean',
    ...options,
  }
}

/**
 * Create a date field definition
 */
export function dateField(
  name: string,
  label: BilingualField,
  options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>,
): ExtensionFieldDefinition {
  return {
    name,
    label,
    type: 'date',
    ...options,
  }
}

/**
 * Create a datetime field definition
 */
export function datetimeField(
  name: string,
  label: BilingualField,
  options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type'>>,
): ExtensionFieldDefinition {
  return {
    name,
    label,
    type: 'datetime',
    ...options,
  }
}

/**
 * Create an enum field definition
 */
export function enumField(
  name: string,
  label: BilingualField,
  values: Array<{ value: string; label: BilingualField }>,
  options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type' | 'enumValues'>>,
): ExtensionFieldDefinition {
  return {
    name,
    label,
    type: 'enum',
    enumValues: values,
    ...options,
  }
}

/**
 * Create an array field definition
 */
export function arrayField(
  name: string,
  label: BilingualField,
  itemType: Omit<ExtensionFieldDefinition, 'name' | 'label'>,
  options?: Partial<Omit<ExtensionFieldDefinition, 'name' | 'label' | 'type' | 'arrayItemType'>>,
): ExtensionFieldDefinition {
  return {
    name,
    label,
    type: 'array',
    arrayItemType: itemType,
    ...options,
  }
}

// ============================================================================
// Relationship Definition Helpers
// ============================================================================

/**
 * Create a relationship definition
 */
export function relationship(
  type: string,
  label: BilingualField,
  targetTypes: string[],
  options?: Partial<Omit<RelationshipDefinition, 'type' | 'label' | 'targetEntityTypes'>>,
): RelationshipDefinition {
  return {
    type,
    label,
    targetEntityTypes: targetTypes,
    cardinality: options?.cardinality || 'many-to-many',
    ...options,
  }
}

/**
 * Create a one-to-one relationship
 */
export function oneToOneRelationship(
  type: string,
  label: BilingualField,
  targetTypes: string[],
  options?: Partial<
    Omit<RelationshipDefinition, 'type' | 'label' | 'targetEntityTypes' | 'cardinality'>
  >,
): RelationshipDefinition {
  return relationship(type, label, targetTypes, {
    ...options,
    cardinality: 'one-to-one',
  })
}

/**
 * Create a one-to-many relationship
 */
export function oneToManyRelationship(
  type: string,
  label: BilingualField,
  targetTypes: string[],
  options?: Partial<
    Omit<RelationshipDefinition, 'type' | 'label' | 'targetEntityTypes' | 'cardinality'>
  >,
): RelationshipDefinition {
  return relationship(type, label, targetTypes, {
    ...options,
    cardinality: 'one-to-many',
  })
}
