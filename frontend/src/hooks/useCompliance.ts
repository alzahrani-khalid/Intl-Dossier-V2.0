import { useCallback } from 'react'
import { useDesignComplianceContext } from '../providers/design-compliance-provider'

/**
 * Primary hook for running responsive design compliance checks.
 */
export function useCompliance() {
  const { running, lastResult, validate, loadRules, rules } = useDesignComplianceContext()

  const validateElement = useCallback(
    async (componentName: string, element?: HTMLElement | null) =>
      validate({ componentName, element }),
    [validate]
  )

  const validateHtml = useCallback(
    async (componentName: string, html: string) => validate({ componentName, html }),
    [validate]
  )

  return {
    running,
    lastResult,
    rules,
    loadRules,
    validateElement,
    validateHtml,
  }
}

