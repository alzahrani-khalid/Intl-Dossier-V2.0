/**
 * ConfirmActionCard — the bilingual token-bound human-in-the-loop confirmation card
 * (P73 GENUI-02). Rendered inline in the copilot surface from a propose_* tool call's
 * args BEFORE anything commits. The user Approves or Rejects-with-reason; a rejected
 * proposal commits nothing (D-05). For high-stakes publish-digest-to-subscribers (D-04)
 * a stronger confirm is enforced: Approve stays disabled until the user types the exact
 * dossier name.
 *
 * Presentational only — all commit + cache-invalidation logic lives in useApproveWrite
 * (the four caller-JWT INVOKER paths), wired by proposeToolUIs.
 *
 * DoD (CLAUDE.md): flat var(--surface), 1px solid var(--line), var(--radius-sm), NO card
 * shadow; logical spacing/alignment utilities only (start/end, never physical sides);
 * Arabic uses writingDirection rtl + Tajawal (alignment via writing direction, never a
 * physical text-align override that forceRTL would flip); sentence case; no marketing
 * voice; no emoji. The error/rejected post-states are neutral (indistinguishable-empty):
 * a denied commit and a generic failure read the same.
 */
import { useId, useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'

/** The four write ops a card can confirm — keyed to the propose_* tool ids. */
export type ConfirmActionKind = 'publish_digest' | 'signal_status' | 'work_item' | 'brief'

/** Lifecycle of the confirmation: before commit, during, and the three terminal states. */
export type ConfirmActionState = 'pending' | 'committing' | 'committed' | 'rejected' | 'error'

/** One labelled read-only summary row rendered from the proposal args. */
export interface ConfirmSummaryField {
  /** Key under the copilot `confirm.field.*` namespace. */
  labelKey: string
  /** Already-resolved display value (localized by the renderer). */
  value: string
}

export interface ConfirmActionCardProps {
  actionKind: ConfirmActionKind
  summaryFields: ConfirmSummaryField[]
  /** D-04 strong-confirm: Approve stays disabled until the typed value === expected. */
  requireTypedConfirm?: { expected: string }
  state: ConfirmActionState
  onApprove: () => void
  onReject: (reason: string) => void
}

export function ConfirmActionCard({
  actionKind,
  summaryFields,
  requireTypedConfirm,
  state,
  onApprove,
  onReject,
}: ConfirmActionCardProps): ReactElement {
  const { t } = useTranslation('copilot')
  const { isRTL } = useDirection()
  const reasonInputId = useId()
  const typedInputId = useId()

  const [typed, setTyped] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const isTerminal = state === 'committed' || state === 'rejected' || state === 'error'
  const isCommitting = state === 'committing'

  // D-04: when a typed confirm is required, Approve is gated on an exact name match.
  const typedConfirmSatisfied =
    requireTypedConfirm == null || typed.trim() === requireTypedConfirm.expected.trim()
  const approveDisabled = isCommitting || isTerminal || !typedConfirmSatisfied

  // Arabic: writing direction drives alignment (no physical align override — forceRTL flips those).
  const dirProps = isRTL ? { dir: 'rtl' as const, style: { writingDirection: 'rtl' as const } } : {}

  return (
    <div className="copilot-confirm" {...dirProps}>
      <div className="copilot-confirm__title">{t(`confirm.title.${actionKind}`)}</div>
      <p className="copilot-confirm__intro">{t(`confirm.intro.${actionKind}`)}</p>

      <dl className="copilot-confirm__fields">
        {summaryFields.map((field) => (
          <div className="copilot-confirm__field" key={field.labelKey}>
            <dt className="copilot-confirm__label">{t(field.labelKey)}</dt>
            <dd className="copilot-confirm__value">{field.value}</dd>
          </div>
        ))}
      </dl>

      {requireTypedConfirm != null && !isTerminal && (
        <div className="copilot-confirm__typed">
          <label className="copilot-confirm__label" htmlFor={typedInputId}>
            {t('confirm.typedConfirm.prompt')}
          </label>
          <input
            id={typedInputId}
            className="copilot-confirm__input"
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={t('confirm.typedConfirm.placeholder')}
            disabled={isCommitting}
            autoComplete="off"
          />
          {typed.length > 0 && !typedConfirmSatisfied && (
            <span className="copilot-confirm__hint">{t('confirm.typedConfirm.mismatch')}</span>
          )}
        </div>
      )}

      {rejecting && !isTerminal && (
        <div className="copilot-confirm__reject">
          <label className="copilot-confirm__label" htmlFor={reasonInputId}>
            {t('confirm.rejectReason.label')}
          </label>
          <input
            id={reasonInputId}
            className="copilot-confirm__input"
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('confirm.rejectReason.placeholder')}
            maxLength={500}
            autoComplete="off"
          />
        </div>
      )}

      {!isTerminal && (
        <div className="copilot-confirm__actions">
          <button
            type="button"
            className="btn-primary inline-flex items-center"
            onClick={onApprove}
            disabled={approveDisabled}
          >
            {t('confirm.approve')}
          </button>
          {rejecting ? (
            <button
              type="button"
              className="btn-ghost inline-flex items-center"
              onClick={() => onReject(reason.trim())}
              disabled={isCommitting}
            >
              {t('confirm.rejectReason.submit')}
            </button>
          ) : (
            <button
              type="button"
              className="btn-ghost inline-flex items-center"
              onClick={() => setRejecting(true)}
              disabled={isCommitting}
            >
              {t('confirm.reject')}
            </button>
          )}
        </div>
      )}

      {state === 'committed' && (
        <p className="copilot-confirm__state" data-tone="success" role="status">
          {t('confirm.state.committed')}
        </p>
      )}
      {state === 'rejected' && (
        <p className="copilot-confirm__state" role="status">
          {t('confirm.state.rejected')}
        </p>
      )}
      {state === 'error' && (
        <p className="copilot-confirm__state" role="status">
          {t('confirm.state.error')}
        </p>
      )}
    </div>
  )
}
