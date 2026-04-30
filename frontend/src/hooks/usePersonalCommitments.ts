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
 * Wave-1 dossier-name resolution: `dossierName` and `dossierFlag` are read
 * from the embedded `dossier` join on `Commitment` (added to
 * COMMITMENTS_COLUMNS.LIST). When the join is absent (e.g. SUMMARY column
 * set), the hook falls back to `dossier_id` so the widget degrades
 * gracefully. `ownerInitials` is still derived from `owner_user_id` until a
 * `users.full_name` join is added.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCommitments } from '@/hooks/useCommitments'

interface DossierLookupRow {
  id: string
  name_en: string
  name_ar: string | null
  metadata: { flag?: string } | null
}

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
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const query = useCommitments({
    ownerId: user?.id,
    // CRITICAL — Pitfall 8 / T-38-09. External-contact commitments must never
    // surface on the personal dashboard. Unit test asserts this filter.
    ownerType: 'internal',
    status: ['pending', 'in_progress', 'overdue'],
    enabled: user?.id != null,
  })

  const dossierIds = useMemo<string[]>((): string[] => {
    if (query.data == null) return []
    const set = new Set<string>()
    for (const c of query.data.commitments) {
      if (typeof c.dossier_id === 'string' && c.dossier_id.length > 0) {
        set.add(c.dossier_id)
      }
    }
    return Array.from(set)
  }, [query.data])

  // Batched dossier lookup. Pattern from tasks-api.ts:315 — `aa_commitments`
  // has no FK to `dossiers` so PostgREST embeds don't work; one extra round
  // trip is acceptable for a dashboard widget.
  const dossiersQuery = useQuery<DossierLookupRow[], Error>({
    queryKey: ['dossiers-for-commitments', dossierIds],
    queryFn: async (): Promise<DossierLookupRow[]> => {
      if (dossierIds.length === 0) return []
      const { data, error } = await supabase
        .from('dossiers')
        .select('id, name_en, name_ar, metadata')
        .in('id', dossierIds)
      if (error !== null) throw new Error(error.message)
      return (data ?? []) as DossierLookupRow[]
    },
    enabled: dossierIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const dossierMap = useMemo<Map<string, DossierLookupRow>>(() => {
    const m = new Map<string, DossierLookupRow>()
    for (const d of dossiersQuery.data ?? []) m.set(d.id, d)
    return m
  }, [dossiersQuery.data])

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

      const dossierRow = dossierMap.get(c.dossier_id)
      const joinedName =
        isArabic && dossierRow?.name_ar != null && dossierRow.name_ar.trim().length > 0
          ? dossierRow.name_ar
          : (dossierRow?.name_en ?? null)
      const joinedFlag =
        typeof dossierRow?.metadata?.flag === 'string' ? dossierRow.metadata.flag : undefined

      const existing = byDossier.get(c.dossier_id) ?? {
        dossierId: c.dossier_id,
        dossierName: joinedName ?? c.dossier_id,
        dossierFlag: joinedFlag,
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
  }, [query.data, dossierMap, isArabic])

  return {
    data: grouped,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
