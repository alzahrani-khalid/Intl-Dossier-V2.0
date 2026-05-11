/**
 * Sensitivity level → chip styling/label key map for list-page primitives.
 * Levels follow the diplomatic sensitivity classification (1=Public, 4=Confidential).
 */

export const SENSITIVITY_CHIP = {
  1: { class: 'chip-info', labelKey: 'sensitivity.public' },
  2: { class: 'chip-default', labelKey: 'sensitivity.internal' },
  3: { class: 'chip-warn', labelKey: 'sensitivity.restricted' },
  4: { class: 'chip-danger', labelKey: 'sensitivity.confidential' },
} as const

export type SensitivityLevel = keyof typeof SENSITIVITY_CHIP

export const sensitivityChipClass = (level: number): string =>
  SENSITIVITY_CHIP[level as SensitivityLevel]?.class ?? 'chip-default'

export const sensitivityLabelKey = (level: number): string =>
  SENSITIVITY_CHIP[level as SensitivityLevel]?.labelKey ?? 'sensitivity.unknown'
