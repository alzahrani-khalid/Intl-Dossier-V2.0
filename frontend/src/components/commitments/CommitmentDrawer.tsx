/**
 * CommitmentDrawer — globally-mounted wrapper that opens CommitmentDetailDrawer
 * in place from a `commitment` URL search param (see useCommitmentDrawer).
 *
 * Mounted once on the protected layout beside DossierDrawer so a commitment can
 * be opened from the dossier quick-look drawer without leaving the current page.
 */

import { type ReactElement } from 'react'
import { useCommitmentDrawer } from '@/hooks/useCommitmentDrawer'
import { CommitmentDetailDrawer } from './CommitmentDetailDrawer'

export function CommitmentDrawer(): ReactElement {
  const { open, commitmentId, closeCommitment } = useCommitmentDrawer()

  return (
    <CommitmentDetailDrawer
      commitmentId={commitmentId}
      open={open}
      onOpenChange={(next): void => {
        if (!next) {
          closeCommitment()
        }
      }}
    />
  )
}
