/**
 * MoUStatusCard
 *
 * Organization-specific card showing MoU/agreement status summary.
 * Count by status (active/expired/pending) with semantic color badges.
 * Summary-level card per D-11 (not full CRUD).
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@tanstack/react-router'
import { FileSignature, ExternalLink } from 'lucide-react'

interface MoUStatusCardProps {
  dossierId: string
}

interface MoUStatusSummary {
  active: number
  expired: number
  pending: number
  draft: number
  total: number
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: 'bg-success/10 text-success',
  expired: 'bg-destructive/10 text-destructive',
  pending: 'bg-warning/10 text-warning',
  draft: 'bg-muted text-muted-foreground',
}

export function MoUStatusCard({ dossierId }: MoUStatusCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data: summary, isLoading } = useQuery<MoUStatusSummary>({
    queryKey: ['dossier-mou-summary', dossierId],
    queryFn: async (): Promise<MoUStatusSummary> => {
      const { data, error } = await supabase
        .from('mous')
        .select('lifecycle_state')
        .or(`signatory_1_dossier_id.eq.${dossierId},signatory_2_dossier_id.eq.${dossierId}`)

      if (error) throw error

      const counts: MoUStatusSummary = {
        active: 0,
        expired: 0,
        pending: 0,
        draft: 0,
        total: 0,
      }

      for (const mou of data ?? []) {
        counts.total++
        const state = mou.lifecycle_state as string
        if (state === 'active' || state === 'renewed') {
          counts.active++
        } else if (state === 'expired' || state === 'cancelled') {
          counts.expired++
        } else if (state === 'pending') {
          counts.pending++
        } else {
          counts.draft++
        }
      }

      return counts
    },
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-7 w-20" />
          ))}
        </div>
      </div>
    )
  }

  const statusItems = [
    {
      label: t('overview.mou.active', { defaultValue: 'Active' }),
      count: summary?.active ?? 0,
      className: STATUS_BADGE_CLASSES.active,
    },
    {
      label: t('overview.mou.pending', { defaultValue: 'Pending' }),
      count: summary?.pending ?? 0,
      className: STATUS_BADGE_CLASSES.pending,
    },
    {
      label: t('overview.mou.expired', { defaultValue: 'Expired' }),
      count: summary?.expired ?? 0,
      className: STATUS_BADGE_CLASSES.expired,
    },
    {
      label: t('overview.mou.draft', { defaultValue: 'Draft' }),
      count: summary?.draft ?? 0,
      className: STATUS_BADGE_CLASSES.draft,
    },
  ].filter((item) => item.count > 0)

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('overview.mou.title', { defaultValue: 'MoU Status' })}
        </h3>
        <FileSignature className="h-4 w-4 text-muted-foreground" />
      </div>

      {(summary?.total ?? 0) === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.mou.empty', { defaultValue: 'No MoUs recorded' })}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {statusItems.map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${item.className}`}
              >
                {item.label}
                <span className="font-semibold">{item.count}</span>
              </span>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {t('overview.mou.total', {
              count: summary?.total ?? 0,
              defaultValue: '{{count}} total agreements',
            })}
          </p>

          <Link
            to="/dossiers/organizations/$id"
            params={{ id: dossierId }}
            search={{ tab: 'mous' }}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors min-h-11"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('overview.mou.viewAll', { defaultValue: 'View MoUs' })}
          </Link>
        </div>
      )}
    </div>
  )
}
