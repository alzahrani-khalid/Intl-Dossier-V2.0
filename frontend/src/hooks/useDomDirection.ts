/**
 * Reads the current DOM writing direction via the language provider.
 *
 * Renamed in Phase 33 plan 33-02 to free the `useDirection` identifier for
 * the new design-system direction hook (`useDesignDirection`). The legacy
 * `@/hooks/useDirection.ts` file stays in place as a one-line re-export to
 * keep the 20+ downstream callers compiling until plan 33-07 completes the
 * call-site sweep.
 */

import { useLanguage } from '@/components/language-provider/language-provider'

export function useDomDirection(): { direction: 'ltr' | 'rtl'; isRTL: boolean } {
  const { direction } = useLanguage()
  return { direction, isRTL: direction === 'rtl' }
}
