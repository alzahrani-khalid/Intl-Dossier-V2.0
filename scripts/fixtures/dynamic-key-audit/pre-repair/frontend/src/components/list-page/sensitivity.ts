export const SENSITIVITY_CHIP = { public: { labelKey: 'sensitivity.public' }, internal: { labelKey: 'sensitivity.internal' }, restricted: { labelKey: 'sensitivity.restricted' }, confidential: { labelKey: 'sensitivity.confidential' } } as const
export const sensitivityLabelKey = (level: number) => SENSITIVITY_CHIP[level]?.labelKey ?? 'sensitivity.unknown'
