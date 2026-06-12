/**
 * NewPositionDialog — quick-create dialog for a new position from a dossier.
 *
 * Extracted from the broken `PositionDialog` in AddToDossierDialogs.tsx (which
 * posted position_type_id = dossier_id, a blank title_ar, and empty
 * audience_groups). This dialog offers a real position-type picker, required
 * bilingual titles, an optional bilingual content pair, an audience multi-select,
 * localized inline validation, and fail-safe translate assists.
 *
 * Phase 64 — POSNEW-01 (form layer, this plan) / POSNEW-02 (submit flow, plan 64-04).
 *
 * @module components/positions/NewPositionDialog
 */

import { useTranslation } from 'react-i18next'
import { Info, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DossierContextForAction } from '@/hooks/useAddToDossierActions'

// =============================================================================
// Props contract — consumed by plan 64-04 (AddToDossierDialogs) and 64-05
// (DossierPositionsTab). Keep this stable.
// =============================================================================

export interface NewPositionDialogProps {
  isOpen: boolean
  onClose: () => void
  dossierContext: DossierContextForAction
  isRTL: boolean
}

// =============================================================================
// Local DossierContextBadge — copied from AddToDossierDialogs.tsx L117-144
// (that file is owned by plan 64-04; this dialog must NOT import from it).
// Reads t('addToDossier.context.linkedTo') from the `dossier` namespace.
// =============================================================================

function DossierContextBadge({
  dossierContext,
  isRTL,
}: {
  dossierContext: DossierContextForAction
  isRTL: boolean
}): React.JSX.Element {
  const { t } = useTranslation('dossier')

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{t('addToDossier.context.linkedTo')}</p>
        <p className="text-sm font-medium truncate">
          {isRTL
            ? dossierContext.dossier_name_ar || dossierContext.dossier_name_en
            : dossierContext.dossier_name_en}
        </p>
      </div>
      <Badge variant="secondary" className="shrink-0 text-xs">
        {t(`addToDossier.context.${dossierContext.inheritance_source}`, {
          defaultValue: dossierContext.inheritance_source,
        })}
      </Badge>
    </div>
  )
}

// =============================================================================
// NewPositionDialog — skeleton (form layer lands in Task 2)
// =============================================================================

export function NewPositionDialog({
  isOpen,
  onClose,
  dossierContext,
  isRTL,
}: NewPositionDialogProps): React.JSX.Element {
  const { t } = useTranslation(['positions', 'dossier'])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('dossier:addToDossier.dialogs.position.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dossier:addToDossier.dialogs.position.description')}
          </DialogDescription>
        </DialogHeader>

        <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
            {t('dossier:action.cancel')}
          </Button>
          <Button type="submit" disabled className="min-h-11">
            {t('dossier:addToDossier.form.submit.position')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
