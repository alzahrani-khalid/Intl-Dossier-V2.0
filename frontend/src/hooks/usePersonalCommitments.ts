/**
 * usePersonalCommitments — Phase 38 dashboard adapter hook.
 *
 * Wraps `useCommitments` and forces `ownerType: 'internal'` so the
 * `OverdueCommitments` widget never renders external-contact commitments.
 * Groups overdue items by dossier and derives a severity tier per item.
 *
 * Mitigates: T-38-09 (information disclosure via external commitments). The
 * `ownerType: 'internal'` constraint is asserted in the unit tests.
 *
 * Note: the underlying `Commitment` type does not currently include joined
 * dossier metadata (`dossier_name`, `dossier_flag`) or an owner display name.
 * Wave 1 widget plans (38-02 OverdueCommitments) will extend the service
 * query to join `dossiers.name` / `dossiers.country_flag` / `users.full_name`.
 * For now `dossierName` falls back to `dossier_id` and `ownerInitials` to a
 * short slice of `owner_user_id`. Widget tests must not assert on those
 * placeholder strings.
 */

import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCommitments } from '@/hooks/useCommitments'

export type CommitmentSeverity = 'red' | 'amber' | 'yellow'

export interface GroupedCommitmentItem {
  id: string
  title: string
  daysOverdue: number
  severity: CommitmentSeverity
  ownerInitials: string
}

export interface GroupedCommitment {
  dossierId: string
  dossierName: string
  dossierFlag?: string
  commitments: GroupedCommitmentItem[]
}

export interface UsePersonalCommitmentsResult {
  data: GroupedCommitment[] | undefined
  isLoading: boolean
  isError: boolean
}

export function deriveSeverity(daysOverdue: number): CommitmentSeverity {
  if (daysOverdue >= 7) {
    return 'red'
  }
  if (daysOverdue >= 3) {
    return 'amber'
  }
  return 'yellow'
}

export function deriveInitials(displayName: string): string {
  const trimmed = displayName.trim()
  if (trimmed.length === 0) {
    return ''
  }
  return trimmed
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const DAY_MS = 86_400_000

export function usePersonalCommitments(): UsePersonalCommitmentsResult {
  const { user } = useAuth()

  const query = useCommitments({
    ownerId: user?.id,
    // CRITICAL — Pitfall 8 / T-38-09. External-contact commitments must never
    // surface on the personal dashboard. Unit test asserts this filter.
    ownerType: 'internal',
    status: ['pending', 'in_progress', 'overdue'],
    enabled: user?.id != null,
  })

  const grouped = useMemo((): GroupedCommitment[] | undefined => {
    if (query.data == null) {
      return undefined
    }

    const byDossier = new Map<string, GroupedCommitment>()

    for (const c of query.data.commitments) {
      const due = new Date(c.due_date).getTime()
      const daysOverdue = Math.max(0, Math.floor((Date.now() - due) / DAY_MS))
      if (daysOverdue === 0) {
        continue
      }

      const existing = byDossier.get(c.dossier_id) ?? {
        dossierId: c.dossier_id,
        dossierName: c.dossier_id,
        dossierFlag: undefined,
        commitments: [],
      }

      existing.commitments.push({
        id: c.id,
        title: c.title,
        daysOverdue,
        severity: deriveSeverity(daysOverdue),
        ownerInitials: deriveInitials(c.owner_user_id ?? ''),
      })

      byDossier.set(c.dossier_id, existing)
    }

    return Array.from(byDossier.values())
  }, [query.data])

  return {
    data: grouped,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
