/**
 * SummarySection — verbatim port of handoff app.css#L516.
 *
 * Renders the dossier's description as an italic-serif paragraph beneath an
 * UPPERCASE label heading. Locale-aware fallback chain:
 *   AR locale + description_ar present  → description_ar
 *   description_en present               → description_en
 *   description_ar present (EN missing)  → description_ar
 *   both empty                           → t('empty.summary') bilingual fallback
 *
 * Section label uppercase per CLAUDE.md voice rule (UPPERCASE only for labels).
 * No raw hex; colors come from --ink-mute token. No textAlign — paragraph
 * inherits direction from the parent drawer.
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'

export interface DossierForSummary {
  description_en?: string | null
  description_ar?: string | null
}

export interface SummarySectionProps {
  dossier?: DossierForSummary | undefined
}

export function SummarySection({ dossier }: SummarySectionProps): React.JSX.Element {
  const { t, i18n } = useTranslation('dossier-drawer')
  const lang = i18n.language

  const enText = dossier?.description_en ?? ''
  const arText = dossier?.description_ar ?? ''
  let body: string
  if (lang === 'ar' && arText.length > 0) body = arText
  else if (enText.length > 0) body = enText
  else if (arText.length > 0) body = arText
  else body = t('empty.summary')

  return (
    <section className="flex flex-col gap-2" data-testid="dossier-drawer-summary">
      <h3
        className="t-label"
        style={{
          fontSize: 'var(--t-label, 10.5px)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-label, 0.1em)',
          color: 'var(--ink-mute)',
          textTransform: 'uppercase',
        }}
      >
        {t('section.summary')}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          color: 'var(--ink-mute)',
          fontSize: '14px',
          lineHeight: 1.6,
        }}
      >
        {body}
      </p>
    </section>
  )
}
