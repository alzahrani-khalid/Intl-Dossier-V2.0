/**
 * QueryErrorState — the one shared query-error state (D-03/D-04, 93-UI-SPEC §1).
 *
 * The tree had 13 empty-state components and ZERO error-state components; that absence is the
 * defect class this phase closes. Every surface whose query rejects renders THIS component —
 * never bespoke per-page error markup.
 *
 * Variant A (page) is an EXTRACTION of the markup shipped inline at
 * `pages/delegations/DelegationManagementPage.tsx:215-237` (Phase 92-03), with the two deltas
 * 93-UI-SPEC mandates: the icon is AlertCircle (AlertTriangle is reserved for the degraded state,
 * which is warn/status, not danger/alert) and the retry button carries no icon.
 *
 * That page is a NAMED NON-CONSUMER for Phase 93: `tests/e2e/92-delegations-error.spec.ts`
 * asserts its current DOM shape, so swapping it would red a shipped prior-phase spec for a
 * correct change (GATE-STANDARD C9b). Whichever phase retrofits it updates that spec in the
 * SAME task.
 *
 * Copy rule (D-08, criterion 5): this component renders i18n keys ONLY. The single structured
 * exception is the project's bilingual server envelope (message_en / message_ar), selected by
 * current language. `error.message`, `details`, `code` and every other internal field never
 * reach JSX — diagnostics belong in console.error, not the DOM. Every t() call is
 * single-argument on purpose: an English default as a second argument renders English in Arabic
 * and is invisible at runtime.
 *
 * Discriminators (D-05): this state is danger + AlertCircle + retry. A well-formed ID that
 * resolves to no row is NOT this — it is page-level not-found (neutral, navigational).
 * An incomplete record is NOT this either — it is the degraded callout (warn, role="status").
 */
import type { JSX } from 'react'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export type QueryErrorVariant = 'page' | 'inline'

/**
 * The project's bilingual server envelope — the ONE structured error shape allowed to reach JSX.
 * A server body carrying these two fields is author-written user-facing copy in both languages.
 */
export interface BilingualErrorMessage {
  message_en: string
  message_ar: string
}

export interface QueryErrorStateProps {
  /** 'page' replaces a route's body; 'inline' replaces one region inside a page */
  variant?: QueryErrorVariant
  /** Wired to the failed query's TanStack Query `refetch` */
  onRetry: () => void
  /** True while a refetch is in flight — disables retry; the label never changes */
  isRetrying?: boolean
  /** Optional bilingual server envelope; overrides the generic i18n copy when present */
  message?: BilingualErrorMessage
  /** Additional CSS classes */
  className?: string
  /** Test ID override; defaults to the cross-plan contract value for the variant */
  testId?: string
}

export function QueryErrorState({
  variant = 'page',
  onRetry,
  isRetrying = false,
  message,
  className,
  testId,
}: QueryErrorStateProps): JSX.Element {
  const { t, i18n } = useTranslation('common')
  const envelope =
    message === undefined ? null : i18n.language === 'ar' ? message.message_ar : message.message_en

  if (variant === 'inline') {
    return (
      <Alert
        variant="destructive"
        className={className}
        data-testid={testId ?? 'query-error-inline'}
      >
        <AlertCircle className="size-4" />
        <div className="flex items-center justify-between gap-4">
          <span className="[font-size:var(--t-body)]">
            {envelope ?? t('errors.queryFailedInline')}
          </span>
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            aria-disabled={isRetrying}
            className="btn-ghost inline-flex shrink-0 items-center justify-center h-8 px-3"
          >
            {t('errors.retry')}
          </button>
        </div>
      </Alert>
    )
  }

  return (
    <div
      role="alert"
      data-testid={testId ?? 'query-error-state'}
      className={cn(
        'mx-auto flex max-w-md flex-col items-center justify-center text-center py-12 px-4',
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-danger/10 mb-4">
        <AlertCircle className="size-8 text-danger" />
      </div>
      <h3 className="[font-size:var(--t-card-title)] font-semibold text-ink mb-2">
        {t('errors.queryFailed.title')}
      </h3>
      <p className="[font-size:var(--t-body)] leading-[var(--line-h-body)] text-ink-mute mb-6">
        {envelope ?? t('errors.queryFailed.description')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        aria-disabled={isRetrying}
        className="btn-primary inline-flex items-center justify-center h-10 px-4 sm:px-6"
      >
        {t('errors.retry')}
      </button>
    </div>
  )
}
