/**
 * ClassificationBar.tsx — Phase 36 SHELL-03 implementation.
 *
 * Single component with an internal `switch(direction)` that produces three
 * distinct DOM shapes per UI-SPEC §"Classification Chrome — Component Shape
 * Decision" (lines 190-222). Plan 36-04 (AppShell) mounts exactly ONE
 * `<ClassificationBar />` between `<Topbar />` and `<main>`; this file owns
 * the shape-by-direction branching.
 *
 *   - chancery   → `.cls-marginalia` italic serif line (em-dash wrapped)
 *   - situation  → `.cls-ribbon` full-width accent banner (uppercase mono)
 *   - ministerial→ `.cls-chip` absolute-positioned pill (accent dot + label)
 *   - bureau     → same chip variant as ministerial (both use `.cls-chip`)
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
 *   - Chip uses logical `ms-5` (margin-inline-start) and `insetInlineStart: 0`
 *     so the anchor edge flips automatically between LTR and RTL.
 *   - Ribbon is center-aligned — no inline start/end concerns.
 *   - Marginalia is center-aligned; no directional positioning needed.
 *
 * Deviation from 36-03 PLAN interfaces (Rule 3 — plan hook names are stale):
 *   - Plan referenced `useDirection`/`useClassification` returning
 *     `{direction, setDirection}` / `{classification, setClassification}`.
 *     Real hooks are `useDesignDirection` and `useClassification` returning
 *     `{classif, setClassif}` (Phase 33/34 naming). This file uses the real
 *     shapes. AuthUser has `name` not `full_name` — getInitials adapts.
 */

import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

import { useClassification, useDesignDirection } from '@/design-system/hooks'
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
  return raw.toUpperCase()
}

export function ClassificationBar(): JSX.Element | null {
  const { classif } = useClassification()
  const { direction } = useDesignDirection()
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

  switch (direction) {
    case 'chancery':
      return (
        <div
          className={
            'cls-marginalia text-center pt-1.5 px-5 pb-0 ' +
            'font-display italic text-[11px] leading-[1.4] tracking-[0.02em] text-[var(--ink-mute)]'
          }
        >
          — {content} —
        </div>
      )

    case 'situation':
      return (
        <div
          className={
            'cls-ribbon py-1 px-5 bg-[var(--accent)] text-[var(--accent-fg)] ' +
            'font-mono text-[10.5px] font-semibold uppercase tracking-[0.15em] leading-[1.3] text-center ' +
            'max-md:py-1 max-md:px-3 max-sm:px-3 max-sm:text-[9.5px]'
          }
        >
          {content.toUpperCase()}
        </div>
      )

    case 'ministerial':
    case 'bureau':
      return (
        <div
          className={
            'cls-chip absolute ms-5 mt-2 inline-flex items-center gap-1 px-2.5 py-1 ' +
            'rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] ' +
            'font-mono text-[10.5px] tracking-[0.04em] text-[var(--ink-mute)] leading-[1.3]'
          }
          style={{ insetInlineStart: 0, top: 0 }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          {content}
        </div>
      )
  }
}
