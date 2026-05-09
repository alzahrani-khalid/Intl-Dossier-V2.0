import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the current document direction ('ltr' | 'rtl').
 * Safe to call at render time — re-renders are driven by useTranslation / language change.
 * Use this to pass `dir` to Radix UI primitives that default to "ltr".
 */
export function getDocDir(): 'ltr' | 'rtl' {
  if (typeof document === 'undefined') return 'ltr'
  return (document.documentElement.dir as 'ltr' | 'rtl') || 'ltr'
}
