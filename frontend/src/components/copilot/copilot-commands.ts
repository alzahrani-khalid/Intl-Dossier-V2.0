/**
 * Cmd+K copilot command derivation (AGENT-01, D-05).
 *
 * Pure helper consumed by CommandPalette (mirrors analyze-commands.ts): given the
 * current `location.pathname`, derive the single "Ask the copilot" command. On a
 * dossier route it reads the dossier id from the path (reusing
 * extractDossierIdFromPathname verbatim) so the drawer opens with that dossier
 * pre-filled as readable context (D-05); off a dossier route the command opens the
 * drawer with no context.
 *
 * Labels here are the canonical English contract strings; CommandPalette overrides
 * them with the localized `copilot:cta.*` labels when it builds the rendered command.
 * Keeping this helper i18n-free makes the context contract unit-testable without
 * mounting the palette.
 *
 * Only the (already-accessible) dossier id travels — never result content.
 */
import { DOSSIER_TYPE_TO_ROUTE } from '@/lib/dossier-routes'
import type { DossierType } from '@/lib/dossier-type-guards'
import { extractDossierIdFromPathname } from '@/components/keyboard-shortcuts/analyze-commands'

/** A pure, i18n-free description of the Cmd+K copilot command. */
export interface CopilotCommandAction {
  /** Stable command id. */
  id: string
  /** Canonical English label (CommandPalette swaps in the localized label). */
  label: string
  /** The dossier to pre-fill as readable context, or null off a dossier route. */
  dossierId: string | null
  /** The dossier type derived from the route segment, when on a dossier route. */
  dossierType: DossierType | null
  /** True when launched from a dossier (selects the "about this dossier" label). */
  hasDossierContext: boolean
}

/** Reverse the type->segment map to recover the dossier type from a pathname. */
function dossierTypeFromPathname(pathname: string): DossierType | null {
  const match = /^\/dossiers\/([^/?#]+)\//.exec(pathname)
  const segment = match?.[1]
  if (segment == null) return null
  for (const [type, seg] of Object.entries(DOSSIER_TYPE_TO_ROUTE)) {
    if (seg === segment) return type as DossierType
  }
  return null
}

/**
 * Derive the Cmd+K copilot command for the current route. Always returns exactly one
 * command (the copilot is reachable everywhere); the dossier context is pre-filled only
 * on a dossier detail route.
 */
export function getCopilotCommandAction(pathname: string): CopilotCommandAction {
  const dossierId = extractDossierIdFromPathname(pathname)
  const hasDossierContext = dossierId != null

  return {
    id: 'cmd-ask-copilot',
    label: hasDossierContext ? 'Ask the copilot about this dossier' : 'Ask the copilot',
    dossierId,
    dossierType: hasDossierContext ? dossierTypeFromPathname(pathname) : null,
    hasDossierContext,
  }
}
