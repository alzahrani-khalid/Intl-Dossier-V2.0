/**
 * useCommitmentDrawer — URL-search-param mounting hook for the commitment
 * detail drawer, mirroring useDossierDrawer (Phase 41, "URL-driven overlay
 * state").
 *
 * Lets a commitment be opened in place (e.g. from the dossier quick-look drawer)
 * without navigating away from the current page, by toggling a `commitment`
 * search param that a globally-mounted CommitmentDrawer reads.
 */

import { useNavigate, useSearch } from '@tanstack/react-router'

export interface UseCommitmentDrawerResult {
  open: boolean
  commitmentId: string | null
  openCommitment: (id: string) => void
  closeCommitment: () => void
}

export function useCommitmentDrawer(): UseCommitmentDrawerResult {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { commitment?: string }
  const open = typeof search.commitment === 'string' && search.commitment.length > 0

  const openCommitment = (id: string): void => {
    // TanStack Router's strict NavigateOptions typing rejects loosely-typed
    // reducers; the codebase precedent (useDossierDrawer) is to cast via
    // `as unknown as Parameters<typeof navigate>[0]`.
    void navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        commitment: id,
      }),
      replace: false,
    } as unknown as Parameters<typeof navigate>[0])
  }

  const closeCommitment = (): void => {
    void navigate({
      search: (prev: Record<string, unknown>) => {
        const { commitment: _c, ...rest } = prev
        return rest
      },
      replace: true,
    } as unknown as Parameters<typeof navigate>[0])
  }

  return {
    open,
    commitmentId: open ? (search.commitment as string) : null,
    openCommitment,
    closeCommitment,
  }
}
