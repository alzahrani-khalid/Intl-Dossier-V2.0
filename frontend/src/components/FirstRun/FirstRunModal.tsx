import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useDirection } from '@/hooks/useDirection'

/**
 * Phase 17 — First-run experience modal.
 *
 * Calls `populate_diplomatic_seed()` (installed by migration 20260407000002)
 * and invalidates broad query prefixes so the dashboard reflects seeded data
 * immediately. Admin and non-admin variants diverge: non-admin callers see
 * informational copy only; the populate button is never rendered for them.
 *
 * RTL: relies on the app-global `dir` set by the language provider. Uses
 * logical Tailwind properties (`ms-*`, `me-*`, `text-start`) throughout so
 * Arabic and English layouts mirror correctly without manual overrides.
 */

interface PopulateSeedCounts {
  countries?: number
  organizations?: number
  forums?: number
  engagements?: number
  topics?: number
  working_groups?: number
  persons?: number
  dossiers?: number
  tasks?: number
  work_item_dossiers?: number
}

type PopulateSeedResponse =
  | { status: 'seeded'; counts: PopulateSeedCounts }
  | { status: 'already_seeded' }
  | { status: 'forbidden'; reason: 'unauthenticated' | 'not_admin' }

export interface FirstRunModalProps {
  /** Controlled open state */
  open: boolean
  /** Called when the dialog wants to close (either via action or dismissal) */
  onOpenChange: (open: boolean) => void
  /** Admin variant when true; non-admin (view-only) when false */
  canSeed: boolean
}

// Broad invalidation — populate_diplomatic_seed touches every dossier-backed
// table plus tasks/work_item_dossiers. Use canonical `tasks` key (NOT
// `work-items`) per 17-SCHEMA-RECONCILIATION.md §2.
const INVALIDATION_PREFIXES: ReadonlyArray<ReadonlyArray<string>> = [
  ['tasks'],
  ['dossiers'],
  ['dossiers-for-brief'],
  ['dashboard-success-metrics'],
  ['dashboard-trends'],
  ['countries'],
  ['organizations'],
  ['forums'],
  ['engagements'],
  ['persons'],
]

export function FirstRunModal({
  open,
  onOpenChange,
  canSeed,
}: FirstRunModalProps): React.JSX.Element {
  const { t } = useTranslation('sample-data')
  const { isRTL } = useDirection()
  const queryClient = useQueryClient()

  const mutation = useMutation<PopulateSeedResponse, Error, void>({
    mutationFn: async (): Promise<PopulateSeedResponse> => {
      const { data, error } = await supabase.rpc('populate_diplomatic_seed')
      if (error) {
        throw new Error(error.message)
      }
      return data as unknown as PopulateSeedResponse
    },
    onSuccess: (result): void => {
      if (result.status === 'seeded') {
        for (const prefix of INVALIDATION_PREFIXES) {
          void queryClient.invalidateQueries({ queryKey: [...prefix] })
        }
        toast.success(t('firstRun.successTitle'), {
          description: t('firstRun.successBody', {
            dossiers: result.counts.dossiers ?? 0,
            tasks: result.counts.tasks ?? 0,
            persons: result.counts.persons ?? 0,
          }),
        })
        onOpenChange(false)
        return
      }

      if (result.status === 'already_seeded') {
        toast.info(t('firstRun.alreadySeededTitle'), {
          description: t('firstRun.alreadySeededBody'),
        })
        onOpenChange(false)
        return
      }

      // status === 'forbidden'
      toast.error(t('firstRun.forbiddenTitle'), {
        description: t('firstRun.forbiddenBody'),
      })
    },
    onError: (): void => {
      toast.error(t('firstRun.errorTitle'), {
        description: t('firstRun.errorBody'),
      })
    },
  })

  const isPending = mutation.isPending

  const handlePopulate = (): void => {
    mutation.mutate()
  }

  const handleSkip = (): void => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isRTL ? 'rtl' : 'ltr'}
        className="w-full max-w-md sm:max-w-lg md:max-w-xl p-4 sm:p-6 gap-4"
      >
        <DialogHeader className="space-y-2 text-start">
          <DialogTitle className="text-xl sm:text-2xl font-semibold">
            {t('firstRun.title')}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            {t('firstRun.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-start">
          <p className="text-sm sm:text-base leading-relaxed">
            {canSeed ? t('firstRun.adminBody') : t('firstRun.nonAdminBody')}
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          {canSeed ? (
            <>
              {/* In JSX: primary action first → rendered rightmost in RTL, leftmost in LTR */}
              <Button
                type="button"
                variant="default"
                disabled={isPending}
                onClick={handlePopulate}
                className="min-h-11 min-w-11 w-full sm:w-auto"
                data-testid="first-run-populate"
              >
                {isPending ? t('firstRun.loading') : t('firstRun.populate')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={handleSkip}
                className="min-h-11 min-w-11 w-full sm:w-auto"
                data-testid="first-run-skip"
              >
                {t('firstRun.skip')}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="default"
              onClick={handleSkip}
              className="min-h-11 min-w-11 w-full sm:w-auto"
              data-testid="first-run-close"
            >
              {t('firstRun.close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FirstRunModal
