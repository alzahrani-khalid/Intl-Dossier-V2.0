/**
 * useSignalKeyboardTriage — email-style keyboard inbox for the signals queue (Phase 69, D-02).
 *
 * NET-NEW pattern (no codebase analog — IntakeQueue.tsx is click-only). Attaches a
 * `keydown` handler to the queue container element (NOT window) so triage keys never
 * leak to other pages or surfaces. Keys are logical, not physical — `j`/`k` are
 * down/up in both LTR and RTL, so no direction-aware mapping is needed.
 *
 *   j → focus next signal (clamped to last)
 *   k → focus previous signal (clamped to first)
 *   a → acknowledge the focused signal
 *   d → dismiss the focused signal
 *   e → escalate the focused signal (opens the escalate dialog)
 *
 * The handler is guarded against INPUT/TEXTAREA/SELECT and contentEditable targets so
 * typing in the capture form or any embedded field never triggers triage.
 *
 * @module hooks/useSignalKeyboardTriage
 */

import { useEffect, useState, type Dispatch, type RefObject, type SetStateAction } from 'react'
import type { Signal } from '@/domains/signals'

export interface UseSignalKeyboardTriageOptions {
  signals: Signal[]
  onAcknowledge: (id: string) => void
  onDismiss: (id: string) => void
  onEscalate: (signal: Signal | null) => void
  containerRef: RefObject<HTMLUListElement | null>
  /**
   * When false, the keydown handler short-circuits — used to suppress triage keys
   * (a/d/e and j/k navigation) while a modal such as the escalate dialog is open,
   * preventing a re-fire of `e` over the already-open dialog. Defaults to true.
   */
  enabled?: boolean
}

export interface UseSignalKeyboardTriageResult {
  focusedIndex: number
  setFocusedIndex: Dispatch<SetStateAction<number>>
}

export function useSignalKeyboardTriage({
  signals,
  onAcknowledge,
  onDismiss,
  onEscalate,
  containerRef,
  enabled = true,
}: UseSignalKeyboardTriageOptions): UseSignalKeyboardTriageResult {
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Reset focus to the top whenever the list size changes (e.g. a filter narrows
  // the queue) — prevents focusedIndex pointing past the end of a shorter list.
  useEffect(() => {
    setFocusedIndex(0)
  }, [signals.length])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handler = (e: KeyboardEvent): void => {
      // Guard: short-circuit entirely while disabled (e.g. the escalate dialog is open),
      // so `e`/`a`/`d` cannot re-fire over an already-open modal.
      if (!enabled) return

      // Guard: never intercept triage keys while the user is typing in a field.
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
        return
      }

      if (e.key === 'j') {
        e.preventDefault()
        setFocusedIndex((i) => Math.min(i + 1, signals.length - 1))
      } else if (e.key === 'k') {
        e.preventDefault()
        setFocusedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'a') {
        e.preventDefault()
        onAcknowledge(signals[focusedIndex]?.id ?? '')
      } else if (e.key === 'd') {
        e.preventDefault()
        onDismiss(signals[focusedIndex]?.id ?? '')
      } else if (e.key === 'e') {
        e.preventDefault()
        onEscalate(signals[focusedIndex] ?? null)
      }
    }

    el.addEventListener('keydown', handler)
    return () => {
      el.removeEventListener('keydown', handler)
    }
  }, [focusedIndex, signals, onAcknowledge, onDismiss, onEscalate, containerRef, enabled])

  return { focusedIndex, setFocusedIndex }
}
