/**
 * useDossierDrawer — Wave 0 (Phase 41) URL-search-param mounting hook for the dossier
 * quick-look drawer.
 *
 * Source of truth: 41-RESEARCH.md "Pattern 1: URL-driven overlay state".
 * Decision: D-02 (URL search-param mounting on `_protected.tsx`).
 */

import { useNavigate, useSearch } from '@tanstack/react-router'

export type DossierDrawerType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'topic'
  | 'working_group'
  | 'person'
  | 'elected_official'

export interface UseDossierDrawerResult {
  open: boolean
  dossierId: string | null
  dossierType: DossierDrawerType | null
  openDossier: (args: { id: string; type: DossierDrawerType }) => void
  closeDossier: () => void
}

export function useDossierDrawer(): UseDossierDrawerResult {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as {
    dossier?: string
    dossierType?: DossierDrawerType
  }
  const open = typeof search.dossier === 'string' && search.dossier.length > 0

  const openDossier = ({ id, type }: { id: string; type: DossierDrawerType }): void => {
    // TanStack Router's strict NavigateOptions typing rejects loosely-typed
    // `(prev: Record<string, unknown>)` reducers; the codebase precedent
    // (e.g. useContextAwareFAB) is to cast via `as unknown as Parameters<typeof navigate>[0]`.
    void navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        dossier: id,
        dossierType: type,
      }),
      replace: false,
    } as unknown as Parameters<typeof navigate>[0])
  }

  const closeDossier = (): void => {
    void navigate({
      search: (prev: Record<string, unknown>) => {
        const { dossier: _d, dossierType: _t, ...rest } = prev
        return rest
      },
      replace: true,
    } as unknown as Parameters<typeof navigate>[0])
  }

  return {
    open,
    dossierId: open ? (search.dossier as string) : null,
    dossierType: open ? (search.dossierType ?? null) : null,
    openDossier,
    closeDossier,
  }
}
