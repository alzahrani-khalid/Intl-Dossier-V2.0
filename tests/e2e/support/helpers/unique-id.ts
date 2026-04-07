import { nanoid } from 'nanoid'

/**
 * Generate a unique identifier for E2E test entities.
 * Prefixed with `e2e-` so cleanup helpers can safely target rows by pattern.
 */
export const e2eId = (prefix: string): string => `e2e-${prefix}-${nanoid(10)}`
