/**
 * Phase 32 D-02, D-04: curated honorific list + EN→AR static map.
 *
 * Used by PersonBasicInfoStep to render the honorific dropdown and by
 * person.config's filterExtensionData to resolve the user's curated
 * selection into a bilingual (honorific_en, honorific_ar) pair before
 * submitting to dossiers-create.
 */

export const HONORIFIC_OTHER = 'Other' as const

/**
 * Display order for the curated honorific dropdown (D-02).
 * "Other" is always the final option and is special-cased at the component
 * layer (it reveals two free-text inputs instead of resolving via the map).
 */
export const CURATED_HONORIFICS = [
  'H.E.',
  'Dr.',
  'Prof.',
  'Sen.',
  'Hon.',
  'Rep.',
  'Sheikh',
  'Amb.',
  'Mr.',
  'Ms.',
  'Mrs.',
  'Eng.',
  HONORIFIC_OTHER,
] as const

export type HonorificLabel = (typeof CURATED_HONORIFICS)[number]

/**
 * D-04 static EN→AR map for curated honorifics.
 * "Other" is NOT in this map — the component captures Arabic free-text separately.
 */
const CURATED_HONORIFIC_AR: Record<Exclude<HonorificLabel, 'Other'>, string> = {
  'H.E.': 'سعادة',
  'Dr.': 'د.',
  'Prof.': 'أ.د.',
  'Sen.': 'سيناتور',
  'Hon.': 'معالي',
  'Rep.': 'ممثل',
  Sheikh: 'الشيخ',
  'Amb.': 'سفير',
  'Mr.': 'السيد',
  'Ms.': 'السيدة',
  'Mrs.': 'السيدة',
  'Eng.': 'م.',
}

/**
 * Resolve a curated honorific label to its bilingual pair.
 *
 * Returns { honorific_en: null, honorific_ar: null } when the label is empty
 * or unknown. Returns null for the 'Other' sentinel — callers must use the
 * free-text honorific_en / honorific_ar inputs instead.
 */
export const resolveCuratedHonorific = (
  label: string | undefined | null,
): { honorific_en: string | null; honorific_ar: string | null } | null => {
  if (label === undefined || label === null || label === '') {
    return { honorific_en: null, honorific_ar: null }
  }
  if (label === HONORIFIC_OTHER) return null
  const ar = CURATED_HONORIFIC_AR[label as Exclude<HonorificLabel, 'Other'>]
  if (ar === undefined) return { honorific_en: null, honorific_ar: null }
  return { honorific_en: label, honorific_ar: ar }
}
