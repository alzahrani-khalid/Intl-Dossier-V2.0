/**
 * useProgressiveForm Hook
 * Manages progressive disclosure forms with required/optional field distinction
 */

import { useState, useCallback, useMemo } from 'react'
import type {
  ProgressiveFormHookOptions,
  ProgressiveFormHookReturn,
  ProgressiveFieldConfig,
  FormCompletionState,
  FieldStatus,
} from '@/types/progressive-form.types'

/**
 * Determine field status based on value and validation
 */
function getDefaultFieldStatus(
  value: unknown,
  fieldConfig: ProgressiveFieldConfig,
  error?: string,
): FieldStatus {
  // If there's an error, return error status
  if (error) {
    return 'error'
  }

  // Use custom validation if provided
  if (fieldConfig.validate) {
    return fieldConfig.validate(value)
  }

  // Default validation logic
  if (value === undefined || value === null || value === '') {
    return 'empty'
  }

  // Check for partial completion (strings with minimal content)
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    if (trimmedValue.length === 0) {
      return 'empty'
    }
    // Consider very short strings as partial
    if (trimmedValue.length > 0 && trimmedValue.length < 3) {
      return 'partial'
    }
  }

  // Check for arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'empty'
    }
  }

  return 'complete'
}

/**
 * Hook for managing progressive disclosure forms
 */
export function useProgressiveForm({
  config,
  values,
  touched = {},
  errors = {},
  onFieldStatusChange,
}: ProgressiveFormHookOptions): ProgressiveFormHookReturn {
  // State for optional fields visibility
  const [showOptional, setShowOptional] = useState(config.showOptionalByDefault ?? false)

  // State for collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    config.groups?.forEach((group) => {
      if (group.collapsible) {
        initial[group.id] = group.defaultCollapsed ?? false
      }
    })
    return initial
  })

  // Get field configuration by name
  const getFieldConfig = useCallback(
    (name: string): ProgressiveFieldConfig | undefined => {
      return config.fields.find((f) => f.name === name)
    },
    [config.fields],
  )

  // Get field status
  const getFieldStatus = useCallback(
    (name: string): FieldStatus => {
      const fieldConfig = getFieldConfig(name)
      if (!fieldConfig) return 'empty'

      const value = values[name]
      const error = errors[name]

      const status = getDefaultFieldStatus(value, fieldConfig, error)

      // Notify on status change if callback provided
      if (onFieldStatusChange && touched[name]) {
        onFieldStatusChange(name, status)
      }

      return status
    },
    [values, errors, touched, getFieldConfig, onFieldStatusChange],
  )

  // Check if field should be visible
  const isFieldVisible = useCallback(
    (name: string): boolean => {
      const fieldConfig = getFieldConfig(name)
      if (!fieldConfig) return false

      // Required fields are always visible
      if (fieldConfig.importance === 'required') {
        return true
      }

      // Recommended fields are visible if showOptional is true
      if (fieldConfig.importance === 'recommended') {
        return showOptional
      }

      // Optional fields are visible only if showOptional is true
      if (fieldConfig.importance === 'optional') {
        return showOptional
      }

      // Check conditional visibility
      if (fieldConfig.showWhen) {
        return fieldConfig.showWhen(values)
      }

      // Check dependency
      if (fieldConfig.dependsOn) {
        const dependencyStatus = getFieldStatus(fieldConfig.dependsOn)
        return dependencyStatus === 'complete'
      }

      return true
    },
    [getFieldConfig, showOptional, values, getFieldStatus],
  )

  // Get fields by group
  const getFieldsByGroup = useCallback(
    (groupId: string): ProgressiveFieldConfig[] => {
      const group = config.groups?.find((g) => g.id === groupId)
      if (!group) return []

      return group.fields
        .map((fieldName) => getFieldConfig(fieldName))
        .filter((f): f is ProgressiveFieldConfig => f !== undefined)
    },
    [config.groups, getFieldConfig],
  )

  // Get ungrouped fields
  const getUngroupedFields = useCallback((): ProgressiveFieldConfig[] => {
    const groupedFieldNames = new Set(config.groups?.flatMap((g) => g.fields) ?? [])
    return config.fields.filter((f) => !groupedFieldNames.has(f.name))
  }, [config.fields, config.groups])

  // Calculate completion state
  const completionState = useMemo((): FormCompletionState => {
    const visibleFields = config.fields.filter((f) => isFieldVisible(f.name))

    const requiredFields = visibleFields.filter((f) => f.importance === 'required')
    const recommendedFields = visibleFields.filter((f) => f.importance === 'recommended')
    const optionalFields = visibleFields.filter((f) => f.importance === 'optional')

    const completedRequired = requiredFields.filter((f) => getFieldStatus(f.name) === 'complete')
    const completedRecommended = recommendedFields.filter(
      (f) => getFieldStatus(f.name) === 'complete',
    )
    const completedOptional = optionalFields.filter((f) => getFieldStatus(f.name) === 'complete')

    const totalCompleted =
      completedRequired.length + completedRecommended.length + completedOptional.length

    const fieldsWithErrors = visibleFields
      .filter((f) => getFieldStatus(f.name) === 'error')
      .map((f) => f.name)

    const emptyRequiredFields = requiredFields
      .filter((f) => getFieldStatus(f.name) === 'empty')
      .map((f) => f.name)

    const requiredPercentage =
      requiredFields.length > 0
        ? Math.round((completedRequired.length / requiredFields.length) * 100)
        : 100

    const overallPercentage =
      visibleFields.length > 0 ? Math.round((totalCompleted / visibleFields.length) * 100) : 100

    const canSubmit =
      completedRequired.length === requiredFields.length &&
      fieldsWithErrors.length === 0 &&
      (config.minCompletionToSubmit === undefined ||
        overallPercentage >= config.minCompletionToSubmit)

    return {
      totalFields: visibleFields.length,
      completedFields: totalCompleted,
      requiredFields: requiredFields.length,
      completedRequiredFields: completedRequired.length,
      optionalFields: optionalFields.length,
      completedOptionalFields: completedOptional.length,
      recommendedFields: recommendedFields.length,
      completedRecommendedFields: completedRecommended.length,
      overallPercentage,
      requiredPercentage,
      canSubmit,
      fieldsWithErrors,
      emptyRequiredFields,
    }
  }, [config.fields, config.minCompletionToSubmit, isFieldVisible, getFieldStatus])

  // Toggle optional fields visibility
  const toggleOptionalFields = useCallback(() => {
    setShowOptional((prev) => !prev)
  }, [])

  // Get group completion percentage
  const getGroupCompletion = useCallback(
    (groupId: string): number => {
      const fields = getFieldsByGroup(groupId)
      if (fields.length === 0) return 100

      const visibleFields = fields.filter((f) => isFieldVisible(f.name))
      if (visibleFields.length === 0) return 100

      const completedFields = visibleFields.filter((f) => getFieldStatus(f.name) === 'complete')
      return Math.round((completedFields.length / visibleFields.length) * 100)
    },
    [getFieldsByGroup, isFieldVisible, getFieldStatus],
  )

  // Check if group has errors
  const groupHasErrors = useCallback(
    (groupId: string): boolean => {
      const fields = getFieldsByGroup(groupId)
      return fields.some((f) => getFieldStatus(f.name) === 'error')
    },
    [getFieldsByGroup, getFieldStatus],
  )

  // Toggle group collapsed state
  const toggleGroupCollapse = useCallback(
    (groupId: string) => {
      // Auto-expand if group has errors
      if (config.autoExpandOnError && groupHasErrors(groupId)) {
        setCollapsedGroups((prev) => ({ ...prev, [groupId]: false }))
        return
      }

      setCollapsedGroups((prev) => ({
        ...prev,
        [groupId]: !prev[groupId],
      }))
    },
    [config.autoExpandOnError, groupHasErrors],
  )

  return {
    completionState,
    showOptional,
    toggleOptionalFields,
    getFieldConfig,
    getFieldStatus,
    isFieldVisible,
    getFieldsByGroup,
    getUngroupedFields,
    getGroupCompletion,
    groupHasErrors,
    collapsedGroups,
    toggleGroupCollapse,
  }
}

export default useProgressiveForm
