import { type ReactElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cva } from 'class-variance-authority'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { DossierGlyph } from '@/components/signature-visuals'
import {
  usePersonalCommitments,
  type CommitmentSeverity,
  type GroupedCommitment,
} from '@/hooks/usePersonalCommitments'
import { useDossierDrawer, type DossierDrawerType } from '@/hooks/useDossierDrawer'
import { WidgetSkeleton } from './WidgetSkeleton'

/**
 * Severity dot variants — uses Phase 33 SLA tokens via CSS var classnames so the
 * tests can grep for the exact token name (`var(--sla-bad)` etc.).
 *
 * Per RTL Landmines table the dot is locale-neutral (no rotation in RTL).
 */
const severityDot = cva('inline-block size-2 rounded-full', {
  variants: {
    severity: {
      red: 'bg-[color:var(--sla-bad)]',
      amber: 'bg-[color:var(--sla-risk)]',
      yellow: 'bg-[color:var(--sla-ok)]',
    },
  },
  defaultVariants: { severity: 'yellow' },
})

const SEVERITY_ORDER: Record<CommitmentSeverity, number> = {
  red: 0,
  amber: 1,
  yellow: 2,
}

const DEFAULT_VISIBLE = 3

function groupMaxSeverity(group: GroupedCommitment): CommitmentSeverity {
  return group.commitments.reduce<CommitmentSeverity>(
    (acc, c) => (SEVERITY_ORDER[c.severity] < SEVERITY_ORDER[acc] ? c.severity : acc),
    'yellow',
  )
}

/**
 * GroupedCommitment may carry an optional `dossierType` discriminator if/when the
 * data hook starts surfacing it. Until then we fall back to 'country' and warn so
 * the drift surfaces during dev. See deferred-items.md
 * "OverdueCommitments dossierType propagation".
 */
type GroupWithMaybeType = GroupedCommitment & { dossierType?: DossierDrawerType }

export function OverdueCommitments(): ReactElement {
  const { t } = useTranslation('dashboard-widgets')
  const { data, isLoading, isError } = usePersonalCommitments()
  const { openDossier } = useDossierDrawer()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  if (isLoading) {
    return <WidgetSkeleton rows={4} />
  }

  if (isError) {
    return (
      <section role="region" aria-labelledby="overdue-heading" className="overdue card">
        <h3 id="overdue-heading" className="card-title mb-2 text-start">
          {t('overdue.title')}
        </h3>
        <p className="text-sm text-destructive text-start">{t('error.load_failed')}</p>
      </section>
    )
  }

  if (data == null || data.length === 0) {
    return (
      <section role="region" aria-labelledby="overdue-heading" className="overdue card">
        <h3 id="overdue-heading" className="card-title mb-2 text-start">
          {t('overdue.title')}
        </h3>
        <p className="text-sm text-ink-soft text-start">{t('overdue.empty')}</p>
      </section>
    )
  }

  const sortedGroups = [...data].sort(
    (a, b) => SEVERITY_ORDER[groupMaxSeverity(a)] - SEVERITY_ORDER[groupMaxSeverity(b)],
  )

  const handleHeadClick = (group: GroupWithMaybeType): void => {
    const resolvedType: DossierDrawerType = group.dossierType ?? 'country'
    if (group.dossierType === undefined) {
      // Surface drift — widget data hook does not yet expose dossierType on group objects
      console.warn(
        '[OverdueCommitments] group.dossierType is undefined; falling back to "country". ' +
          'See deferred-items.md → "OverdueCommitments dossierType propagation".',
      )
    }
    openDossier({ id: group.dossierId, type: resolvedType })
  }

  return (
    <section role="region" aria-labelledby="overdue-heading" className="overdue card">
      <h3 id="overdue-heading" className="card-title mb-3 text-start">
        {t('overdue.title')}
      </h3>
      <ul className="space-y-3">
        {sortedGroups.map((group): ReactElement => {
          const maybeTyped = group as GroupWithMaybeType
          const isOpen = expanded[group.dossierId] === true
          const visible = isOpen ? group.commitments : group.commitments.slice(0, DEFAULT_VISIBLE)
          const hasMore = group.commitments.length > DEFAULT_VISIBLE

          return (
            <li key={group.dossierId} className="overdue-group">
              <div className="overdue-head">
                <button
                  type="button"
                  className="overdue-head-left flex items-center gap-2 w-full text-start min-h-11"
                  style={{ minBlockSize: 44 }}
                  onClick={(): void => handleHeadClick(maybeTyped)}
                  aria-label={group.dossierName}
                  data-testid="overdue-commitments-dossier-head"
                >
                  <DossierGlyph
                    type="country"
                    iso={group.dossierFlag}
                    name={group.dossierName}
                    size={20}
                  />
                  <span className="card-title text-start truncate flex-1">{group.dossierName}</span>
                </button>
              </div>
              <ul className="space-y-1">
                {visible.map(
                  (c): ReactElement => (
                    <li
                      key={c.id}
                      className="overdue-row overdue-item flex items-center gap-3 min-h-11 rounded-md p-2"
                    >
                      <span
                        className={severityDot({ severity: c.severity })}
                        data-severity={c.severity}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-ink text-start truncate flex-1">{c.title}</span>
                      <LtrIsolate className="overdue-days font-mono text-xs">
                        {`${c.daysOverdue}d`}
                      </LtrIsolate>
                      <span
                        className="overdue-owner text-xs font-mono"
                        aria-label={String(t('overdue.owner') ?? c.ownerInitials)}
                      >
                        {c.ownerInitials}
                      </span>
                      <ArrowUpRight className="size-4 text-ink-soft icon-flip" aria-hidden="true" />
                    </li>
                  ),
                )}
              </ul>
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={(e): void => {
                    e.stopPropagation()
                    setExpanded((prev) => ({
                      ...prev,
                      [group.dossierId]: !(prev[group.dossierId] ?? false),
                    }))
                  }}
                >
                  {isOpen ? t('overdue.collapse') : t('overdue.expand')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
