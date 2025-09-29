/**
 * Validation rule definition for design compliance checks.
 * Mirrors ValidationRule schema from the spec.
 */
export type RuleType =
  | 'responsive'
  | 'accessibility'
  | 'rtl'
  | 'performance'
  | 'registry'
  | 'typography';

export type Severity = 'error' | 'warning' | 'info';

export interface ValidationRule {
  id: string;
  componentName?: string;
  ruleType: RuleType;
  severity: Severity;
  message: string;
  messageAr?: string;
  autoFix?: boolean;
}

/**
 * Result of running a validation rule.
 * Mirrors ValidationResult schema from the spec.
 */
export interface ValidationResult {
  id: string;
  componentName?: string;
  ruleId: string;
  passed: boolean;
  severity: Severity;
  message: string;
  /** Arbitrary context to help debugging (e.g., DOM path, props) */
  context?: Record<string, unknown>;
  suggestion?: string;
  autoFixed?: boolean;
}

