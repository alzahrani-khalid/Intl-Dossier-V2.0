/**
 * ClassificationBar.tsx — Phase 36 SHELL-03 implementation.
 *
 * Phase 77 (linear-token-system): the engine is single-direction now, so the
 * former `switch(direction)` (chancery marginalia / situation ribbon /
 * ministerial+bureau chip) collapsed to the single Linear chip variant — the
 * `.cls-chip` inline pill (accent dot + label) that ministerial/bureau used.
 * Plan 36-04 (AppShell) mounts exactly ONE `<ClassificationBar />` between
 * `<Topbar />` and `<main>`.
 *
 * Visibility gate (T-36-05 disposition + UI-SPEC line 219):
 *   - Returns `null` when `useClassification().classif === false` so the
 *     Tweaks-drawer toggle cleanly removes the chrome without re-layout.
 *
 * Classification level string:
 *   - Read from `document.documentElement.dataset.classification` which
 *     `frontend/public/bootstrap.js` writes at pre-paint from the user's
 *     `localStorage.getItem('id.classif')`. Default "restricted" when absent.
 *
 * RTL contract (CLAUDE.md rule 1 + rule 2):
 *   - Chip spacing is owned by `.cls-chip` logical margin styles so the inline
 *     anchor edge flips automatically between LTR and RTL.
 *
 * Hook shapes (Rule 3 — plan hook names were stale): the real hook is
 * `useClassification` returning `{classif, setClassif}` (Phase 33/34 naming).
 * AuthUser has `name` not `full_name` — getInitials adapts.
 */

import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

import { useClassification } from '@/design-system/hooks'
import { useAuthStore } from '@/store/authStore'

/**
 * Derive two-letter initials from a display name or email.
 * "Khalid Alzahrani" → "KA"; "k.alzahrani@gastat.gov.sa" → "KA"; "" → "??"
 */
function getInitials(source: string): string {
  const trimmed = source.trim()
  if (trimmed === '') return '??'
  const atIndex = trimmed.indexOf('@')
  const base = atIndex > 0 ? trimmed.slice(0, atIndex) : trimmed
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return '??'
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  const combined = (first + second).toUpperCase()
  return combined === '' ? '??' : combined
}

/**
 * Read the classification level (e.g. "RESTRICTED", "CONFIDENTIAL") that the
 * pre-paint `bootstrap.js` script wrote to `html[data-classification]`.
 * Falls back to "RESTRICTED" when the attribute is missing (safe default —
 * users see a label that matches the most conservative posture until they
 * change it via Tweaks).
 */
function readLevel(): string {
  if (typeof document === 'undefined') return 'RESTRICTED'
  const raw = document.documentElement.dataset.classification ?? 'restricted'
  if (raw === 'show' || raw === 'hide') return 'RESTRICTED'
  return raw.toUpperCase()
}

export function ClassificationBar(): JSX.Element | null {
  const { classif } = useClassification()
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)

  if (!classif) return null

  const level = readLevel()
  const dateLabel = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA-u-nu-arab' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())
  const nameSource = user?.name ?? user?.email ?? ''
  const initials = getInitials(nameSource)

  const workspace = t('shell.classification.workspace')
  const handleSecurely = t('shell.classification.handleSecurely')
  const sessionLabel = t('shell.classification.session')
  const content = `${workspace} · ${level} · ${handleSecurely} · ${sessionLabel} ${dateLabel} · ${initials}`

  // Phase 77 — the neutral Linear chip is the sole classification variant.
  return (
    <div className="cls-chip">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
      {content}
    </div>
  )
}
