import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ConfirmRemoveButtonProps {
  /** Invoked only after the user confirms in the dialog. */
  onConfirm: () => void
  /** Dialog title (also used as the trigger button's accessible label). */
  title: string
  /** Dialog body copy explaining the consequence of removal. */
  description: string
  /** Confirm-action button label. */
  confirmLabel: string
  /** Cancel button label. */
  cancelLabel: string
  disabled?: boolean
}

/**
 * Trash/remove button that requires explicit confirmation via an
 * `@/components/ui/alert-dialog` before firing `onConfirm`. Shared across the
 * after-action list editors (decisions, commitments, risks, follow-ups) so the
 * destructive-action pattern stays consistent and DRY.
 */
export function ConfirmRemoveButton({
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  disabled = false,
}: ConfirmRemoveButtonProps): ReactElement {
  const { t } = useTranslation()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} aria-label={title}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel || t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
