/**
 * StepGuidanceBanner (Plan 31-02, D-10..D-14)
 *
 * Dismissible per-step guidance banner rendered at the top of each wizard step.
 * Reads copy from the existing per-type i18n namespace (D-13), persists
 * dismissal via localStorage keyed on (type, stepId) per D-12, and re-appears
 * next session when localStorage is cleared.
 *
 * HeroUI v3 `Alert` is not installed in this codebase (grep node_modules
 * confirmed — only @heroui/react consumers found are Modal/Button/Dropdown).
 * Per 31-PATTERNS "No Analog Found" fallback, we use the shadcn `Alert`
 * wrapper at `@/components/ui/alert` which is already consumed elsewhere
 * (DossierListPage). Variant kept subtle ("default" is flat-style).
 *
 * RTL-safety: uses logical `ps-*`/`pe-*`, `start-*`/`end-*`, `text-start` —
 * no `ml-*`/`mr-*`/`text-left`/`text-right`.
 */
import { useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, X } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface StepGuidanceBannerProps {
  /** Dossier type (e.g. 'country', 'person'). Used in storage key. */
  type: string
  /** Step id (e.g. 'basic', 'country-details', 'review'). Used in storage key. */
  stepId: string
  /** i18n key WITH namespace, e.g. 'country-wizard:wizard.steps.basic.guidance'. */
  guidanceKey: string
  /** Optional extra classes forwarded to the Alert wrapper. */
  className?: string
}

const buildStorageKey = (type: string, stepId: string): string =>
  // D-12: `dossier-wizard:guidance:${type}:${stepId}`
  `dossier-wizard:guidance:${type}:${stepId}`

const readDismissed = (storageKey: string): boolean => {
  try {
    return localStorage.getItem(storageKey) === '1'
  } catch {
    // Safari private mode or quota-exceeded — treat as "not dismissed"
    return false
  }
}

const writeDismissed = (storageKey: string): void => {
  try {
    localStorage.setItem(storageKey, '1')
  } catch {
    // Swallow — banner still hides locally via React state below
  }
}

export function StepGuidanceBanner({
  type,
  stepId,
  guidanceKey,
  className,
}: StepGuidanceBannerProps): ReactElement | null {
  const { t } = useTranslation()
  const storageKey = buildStorageKey(type, stepId)
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed(storageKey))

  if (dismissed) return null

  const handleDismiss = (): void => {
    writeDismissed(storageKey)
    setDismissed(true)
  }

  return (
    <Alert
      className={cn('mb-4 text-start pe-12', className)}
      data-testid={`guidance-banner-${type}-${stepId}`}
    >
      <Info className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>{t(guidanceKey)}</AlertDescription>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('common:dismiss', 'Dismiss')}
        className="absolute end-2 top-2 inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  )
}
