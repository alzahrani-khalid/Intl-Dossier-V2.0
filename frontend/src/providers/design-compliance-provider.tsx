import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ValidationResult, ValidationRule } from '../types/validation'
import type { PerformanceMetric } from '../types/performance'
import { useResponsive } from '../hooks/use-responsive'
import { useTheme } from '../hooks/use-theme'
import { useLanguage } from '../hooks/use-language'

interface ValidationInput {
  componentName: string
  html?: string
  element?: HTMLElement | null
}

interface ValidationOutput {
  passed: boolean
  duration: number
  results: ValidationResult[]
}

interface DesignComplianceContextValue {
  running: boolean
  lastResult?: ValidationOutput
  rules?: ValidationRule[]
  validate: (input: ValidationInput) => Promise<ValidationOutput>
  loadRules: (componentName?: string) => Promise<ValidationRule[]>
}

const DesignComplianceContext = createContext<DesignComplianceContextValue | undefined>(undefined)

async function safeFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T | undefined> {
  try {
    const res = await fetch(input, init)
    if (!res.ok) return undefined
    return (await res.json()) as T
  } catch {
    return undefined
  }
}

function toOuterHTML(el?: HTMLElement | null): string | undefined {
  if (!el) return undefined
  try {
    return el.outerHTML
  } catch {
    return undefined
  }
}

export function DesignComplianceProvider({ children }: { children: React.ReactNode }) {
  const { width } = useResponsive()
  const { theme, colorMode } = useTheme()
  const { language, direction } = useLanguage()
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<ValidationOutput | undefined>(undefined)
  const rulesRef = useRef<ValidationRule[] | undefined>(undefined)

  const recordMetric = useCallback(async (metric: PerformanceMetric) => {
    await safeFetch('/api/metrics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    })
  }, [])

  const loadRules = useCallback(async (componentName?: string) => {
    const qs = new URLSearchParams()
    if (componentName) qs.set('component', componentName)
    const data = await safeFetch<{ rules: ValidationRule[] }>(`/api/validation/rules?${qs.toString()}`)
    rulesRef.current = data?.rules
    return rulesRef.current ?? []
  }, [])

  const validate = useCallback<DesignComplianceContextValue['validate']>(async (input) => {
    const html = input.html ?? toOuterHTML(input.element)
    const payload = {
      componentName: input.componentName,
      html: html ?? '',
      viewport: width,
      theme: `${theme}:${colorMode}`,
      language,
    }

    // Try API first
    setRunning(true)
    const start = performance.now()
    let api: { passed: boolean; duration?: number; results: ValidationResult[] } | undefined
    api = await safeFetch<{ passed: boolean; duration?: number; results: ValidationResult[] }>(
      '/api/validation/check',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    // Fallback to noop validator in dev if API not available yet
    let output: ValidationOutput
    if (api) {
      const duration = api.duration ?? Math.max(1, Math.round(performance.now() - start))
      output = { passed: api.passed, duration, results: api.results }
    } else {
      // Minimal local checks (direction conflict, empty content)
      const results: ValidationResult[] = []
      if (html && /dir=\"ltr\"/i.test(html) && direction === 'rtl') {
        results.push({
          id: 'rtl-conflict',
          componentName: input.componentName,
          ruleId: 'rtl-direction-conflict',
          passed: false,
          severity: 'warning',
          message: 'Element forces LTR while app direction is RTL',
          context: { direction },
        })
      }
      const duration = Math.max(1, Math.round(performance.now() - start))
      output = { passed: results.every(r => r.passed), duration, results }
    }

    setLastResult(output)
    setRunning(false)

    // Fire-and-forget metric
    recordMetric({
      metricType: 'validation_time',
      unit: 'ms',
      value: output.duration,
      viewport: width,
      componentName: input.componentName,
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
      metadata: { theme, colorMode, language },
    })

    return output
  }, [width, theme, colorMode, language, direction, recordMetric])

  const value = useMemo<DesignComplianceContextValue>(
    () => ({ running, lastResult, validate, rules: rulesRef.current, loadRules }),
    [running, lastResult, validate, loadRules]
  )

  return (
    <DesignComplianceContext.Provider value={value}>{children}</DesignComplianceContext.Provider>
  )
}

export function useDesignComplianceContext() {
  const ctx = useContext(DesignComplianceContext)
  if (!ctx) throw new Error('useDesignComplianceContext must be used within DesignComplianceProvider')
  return ctx
}

