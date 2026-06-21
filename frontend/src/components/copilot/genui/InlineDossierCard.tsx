/**
 * InlineDossierCard — the read-only generative-UI wrapper that renders the app's OWN
 * UniversalDossierCard inline in the copilot surface for a dossier read result
 * (GENUI-01, D-07 fixed allowlist).
 *
 * The genUI tool-UI renderer (genUiToolUIs) hands us a PARTIAL dossier row from
 * get_dossier / list_dossiers (id + type + a few display fields). For fidelity we fetch
 * the FULL DossierWithExtension via the app's clearance-gated useDossier (caller JWT,
 * shares the app QueryClient) and render UniversalDossierCard with NO edit/delete/view
 * callbacks — read-only inline (T-73-04-03: no privileged read; RLS gates the fetch).
 *
 * Deep-link: clicking the card navigates in-app via the TanStack Router to
 * getDossierDetailPath(id, type) (CitationCard precedent, T-73-04-04 — an app-relative
 * path built from the already-accessible id+type, never a raw model URL).
 *
 * INDISTINGUISHABLE-EMPTY (T-73-04-02): when the fetch returns nothing — above-clearance
 * OR not-found OR a generic failure all read the same — we render one neutral inline line.
 * NO clearance / filtered / restricted wording anywhere (carried P71 GRAPH-03).
 *
 * @module components/copilot/genui/InlineDossierCard
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { UniversalDossierCard } from '@/components/dossier/UniversalDossierCard'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'

/** The partial row carried by get_dossier / list_dossiers — only id + type are required. */
export interface InlineDossierRow {
  id?: unknown
  type?: unknown
}

/** Narrow the partial row to a usable { id, type }; returns null if id is unusable. */
function readRow(row: InlineDossierRow): { id: string; type: string | undefined } | null {
  const id = typeof row.id === 'string' && row.id.length > 0 ? row.id : null
  if (id == null) return null
  const type = typeof row.type === 'string' && row.type.length > 0 ? row.type : undefined
  return { id, type }
}

export function InlineDossierCard({ dossierRow }: { dossierRow: InlineDossierRow }): ReactElement {
  const { t } = useTranslation('copilot')
  const navigate = useNavigate()
  const parsed = readRow(dossierRow)

  // Clearance-gated full fetch under the caller JWT (shares the app QueryClient). retry:false
  // so an above-clearance/not-found read settles to the neutral empty line without churn.
  const { data, isPending, isError } = useDossier(parsed?.id ?? '', undefined, {
    enabled: parsed != null,
    retry: false,
    staleTime: 60_000,
  })

  // Bad row (no id) → neutral line.
  if (parsed == null) {
    return <p className="copilot-genui__empty">{t('genui.dossier.unavailable')}</p>
  }

  const handleActivate = (): void => {
    void navigate({ to: getDossierDetailPath(parsed.id, parsed.type) as string & {} })
  }

  // Loading → neutral token-bound placeholder (no clearance wording).
  if (isPending) {
    return (
      <div className="copilot-genui__placeholder" aria-hidden="true">
        <span className="copilot-genui__placeholder-bar" />
        <span className="copilot-genui__placeholder-bar copilot-genui__placeholder-bar--short" />
      </div>
    )
  }

  // Above-clearance / not-found / generic failure → ONE neutral line (indistinguishable-empty).
  if (isError || data == null) {
    return <p className="copilot-genui__empty">{t('genui.dossier.unavailable')}</p>
  }

  // Render the app's own card, read-only (no onView/onEdit/onDelete), wrapped so the whole
  // card deep-links in-app. The inner card also carries a stretched <Link>; the wrapper's
  // click is the keyboard/button affordance for the genUI surface.
  return (
    <div className="copilot-genui">
      <button
        type="button"
        className="copilot-genui__activate"
        onClick={handleActivate}
        aria-label={t('genui.dossier.open')}
      >
        <UniversalDossierCard dossier={data} className="copilot-genui__card" />
      </button>
    </div>
  )
}
