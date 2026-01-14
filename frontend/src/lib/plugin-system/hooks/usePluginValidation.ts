/**
 * Plugin Validation Hook
 *
 * Provides validation capabilities for entity plugins.
 * Runs plugin-defined validators and returns validation results.
 */

import { useCallback } from 'react'
import { pluginRegistry } from '../registry/plugin-registry'
import type {
  BaseDossier,
  ValidationContext,
  ValidationResult,
  ValidationError,
  BilingualField,
  ExtensionFieldDefinition,
} from '../types/plugin.types'

// ============================================================================
// Hook Types
// ============================================================================

export interface UsePluginValidationOptions {
  /** Entity type to validate */
  entityType: string
  /** Skip plugin validators (only run schema validation) */
  schemaOnly?: boolean
}

export interface UsePluginValidationReturn<T = Record<string, unknown>> {
  /** Validate entity for creation */
  validateCreate: (entity: Partial<BaseDossier & T>) => Promise<ValidationResult>
  /** Validate entity for update */
  validateUpdate: (
    entity: Partial<BaseDossier & T>,
    previous?: BaseDossier & T,
  ) => Promise<ValidationResult>
  /** Validate entity for deletion */
  validateDelete: (entity: BaseDossier & T) => Promise<ValidationResult>
  /** Validate a single field */
  validateField: (
    fieldName: string,
    value: unknown,
    entity?: Partial<BaseDossier & T>,
  ) => ValidationResult
  /** Get field schema definition */
  getFieldSchema: (fieldName: string) => ExtensionFieldDefinition | undefined
  /** Check if entity type has plugin validators */
  hasValidators: boolean
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Create a validation error
 */
function createError(field: string, code: string, message: BilingualField): ValidationError {
  return { field, code, message }
}

/**
 * Merge validation results
 */
function mergeResults(...results: ValidationResult[]): ValidationResult {
  const errors: ValidationError[] = []
  for (const result of results) {
    if (!result.valid) {
      errors.push(...result.errors)
    }
  }
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate a field against its schema
 */
function validateFieldSchema(
  fieldDef: ExtensionFieldDefinition,
  value: unknown,
  entity: Record<string, unknown>,
): ValidationResult {
  const errors: ValidationError[] = []

  // Required check
  if (fieldDef.required && (value === undefined || value === null || value === '')) {
    errors.push(
      createError(fieldDef.name, 'REQUIRED', {
        en: `${fieldDef.label.en} is required`,
        ar: `${fieldDef.label.ar} مطلوب`,
      }),
    )
    return { valid: false, errors }
  }

  // Skip further validation if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return { valid: true, errors: [] }
  }

  const validation = fieldDef.validation

  if (validation) {
    // String length validation
    if (typeof value === 'string') {
      if (validation.minLength !== undefined && value.length < validation.minLength) {
        errors.push(
          createError(fieldDef.name, 'MIN_LENGTH', {
            en: `${fieldDef.label.en} must be at least ${validation.minLength} characters`,
            ar: `${fieldDef.label.ar} يجب أن يكون على الأقل ${validation.minLength} حرفًا`,
          }),
        )
      }
      if (validation.maxLength !== undefined && value.length > validation.maxLength) {
        errors.push(
          createError(fieldDef.name, 'MAX_LENGTH', {
            en: `${fieldDef.label.en} must be at most ${validation.maxLength} characters`,
            ar: `${fieldDef.label.ar} يجب أن يكون على الأكثر ${validation.maxLength} حرفًا`,
          }),
        )
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        const message = validation.patternMessage || {
          en: `${fieldDef.label.en} has an invalid format`,
          ar: `${fieldDef.label.ar} بتنسيق غير صالح`,
        }
        errors.push(createError(fieldDef.name, 'PATTERN', message))
      }
    }

    // Number range validation
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors.push(
          createError(fieldDef.name, 'MIN', {
            en: `${fieldDef.label.en} must be at least ${validation.min}`,
            ar: `${fieldDef.label.ar} يجب أن يكون على الأقل ${validation.min}`,
          }),
        )
      }
      if (validation.max !== undefined && value > validation.max) {
        errors.push(
          createError(fieldDef.name, 'MAX', {
            en: `${fieldDef.label.en} must be at most ${validation.max}`,
            ar: `${fieldDef.label.ar} يجب أن يكون على الأكثر ${validation.max}`,
          }),
        )
      }
    }

    // Custom validation
    if (validation.custom) {
      const result = validation.custom(value, entity as unknown as BaseDossier)
      if (!result.success) {
        errors.push(
          createError(fieldDef.name, 'CUSTOM', {
            en: result.error as string,
            ar: result.error as string,
          }),
        )
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate base dossier fields
 */
function validateBaseDossier(entity: Partial<BaseDossier>): ValidationResult {
  const errors: ValidationError[] = []

  if (!entity.name_en?.trim()) {
    errors.push(
      createError('name_en', 'REQUIRED', {
        en: 'English name is required',
        ar: 'الاسم بالإنجليزية مطلوب',
      }),
    )
  }

  if (!entity.name_ar?.trim()) {
    errors.push(
      createError('name_ar', 'REQUIRED', {
        en: 'Arabic name is required',
        ar: 'الاسم بالعربية مطلوب',
      }),
    )
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for entity plugin validation
 */
export function usePluginValidation<T = Record<string, unknown>>(
  options: UsePluginValidationOptions,
): UsePluginValidationReturn<T> {
  const { entityType, schemaOnly = false } = options

  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const hasValidators = Boolean(plugin?.validation)

  /**
   * Get field schema definition
   */
  const getFieldSchema = useCallback(
    (fieldName: string): ExtensionFieldDefinition | undefined => {
      if (!plugin) return undefined
      return plugin.manifest.extensionSchema.fields.find(
        (f: ExtensionFieldDefinition) => f.name === fieldName,
      )
    },
    [plugin],
  )

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (fieldName: string, value: unknown, entity?: Partial<BaseDossier & T>): ValidationResult => {
      const fieldDef = getFieldSchema(fieldName)
      if (!fieldDef) {
        // Unknown field - skip validation
        return { valid: true, errors: [] }
      }

      // Schema validation
      const schemaResult = validateFieldSchema(
        fieldDef,
        value,
        (entity || {}) as Record<string, unknown>,
      )

      // Plugin field validator
      if (!schemaOnly && plugin?.validation?.fieldValidators?.[fieldName]) {
        const context: ValidationContext<T> = {
          entity: { ...entity, [fieldName]: value } as unknown as BaseDossier & T,
          isCreate: !entity?.id,
        }
        const pluginResult = plugin.validation.fieldValidators[fieldName](value, context)
        return mergeResults(schemaResult, pluginResult)
      }

      return schemaResult
    },
    [getFieldSchema, plugin, schemaOnly],
  )

  /**
   * Validate all extension fields
   */
  const validateExtensionFields = useCallback(
    (entity: Partial<BaseDossier & T>): ValidationResult => {
      if (!plugin) return { valid: true, errors: [] }

      const results: ValidationResult[] = []
      for (const fieldDef of plugin.manifest.extensionSchema.fields) {
        const value = (entity as Record<string, unknown>)[fieldDef.name]
        results.push(validateFieldSchema(fieldDef, value, entity as Record<string, unknown>))
      }

      return mergeResults(...results)
    },
    [plugin],
  )

  /**
   * Validate entity for creation
   */
  const validateCreate = useCallback(
    async (entity: Partial<BaseDossier & T>): Promise<ValidationResult> => {
      // Base dossier validation
      const baseResult = validateBaseDossier(entity)

      // Extension fields validation
      const extensionResult = validateExtensionFields(entity)

      // Plugin validation hook
      let pluginResult: ValidationResult = { valid: true, errors: [] }
      if (!schemaOnly && plugin?.validation?.beforeCreate) {
        const context: ValidationContext<T> = {
          entity: entity as BaseDossier & T,
          isCreate: true,
        }
        pluginResult = await plugin.validation.beforeCreate(context)
      }

      return mergeResults(baseResult, extensionResult, pluginResult)
    },
    [plugin, schemaOnly, validateExtensionFields],
  )

  /**
   * Validate entity for update
   */
  const validateUpdate = useCallback(
    async (
      entity: Partial<BaseDossier & T>,
      previous?: BaseDossier & T,
    ): Promise<ValidationResult> => {
      // Only validate fields that are being updated
      const results: ValidationResult[] = []

      // If name fields are being updated, validate them
      if (entity.name_en !== undefined || entity.name_ar !== undefined) {
        results.push(validateBaseDossier(entity))
      }

      // Validate updated extension fields
      if (plugin) {
        for (const fieldDef of plugin.manifest.extensionSchema.fields) {
          const value = (entity as Record<string, unknown>)[fieldDef.name]
          if (value !== undefined) {
            results.push(validateFieldSchema(fieldDef, value, entity as Record<string, unknown>))
          }
        }
      }

      // Plugin validation hook
      if (!schemaOnly && plugin?.validation?.beforeUpdate) {
        const context: ValidationContext<T> = {
          entity: entity as BaseDossier & T,
          isCreate: false,
          previousVersion: previous,
        }
        const pluginResult = await plugin.validation.beforeUpdate(context)
        results.push(pluginResult)
      }

      return mergeResults(...results)
    },
    [plugin, schemaOnly],
  )

  /**
   * Validate entity for deletion
   */
  const validateDelete = useCallback(
    async (entity: BaseDossier & T): Promise<ValidationResult> => {
      if (schemaOnly || !plugin?.validation?.beforeDelete) {
        return { valid: true, errors: [] }
      }

      const context: ValidationContext<T> = {
        entity,
        isCreate: false,
      }
      return plugin.validation.beforeDelete(context)
    },
    [plugin, schemaOnly],
  )

  return {
    validateCreate,
    validateUpdate,
    validateDelete,
    validateField,
    getFieldSchema,
    hasValidators,
  }
}
