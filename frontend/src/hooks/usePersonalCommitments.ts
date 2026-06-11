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
 * gracefully.
 *
 * `ownerInitials` resolve through a batched `users` lookup (same pattern as
 * tasks-api.ts assignee names) — passing the raw `owner_user_id` UUID into
 * `deriveInitials` produced garbage like "8F" (inspection 2026-06-09
 * Finding 5; verified live: users.full_name is populated for all 393 rows).
 * When the name is unknown the initials are '' and the widget hides the chip.
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

interface UserLookupRow {
  id: string
  full_name: string | null
  username: string | null
  email: string | null
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

  const ownerIds = useMemo<string[]>((): string[] => {
    if (query.data == null) return []
    const set = new Set<string>()
    for (const c of query.data.commitments) {
      if (typeof c.owner_user_id === 'string' && c.owner_user_id.length > 0) {
        set.add(c.owner_user_id)
      }
    }
    return Array.from(set)
  }, [query.data])

  // Batched owner-name lookup — mirrors tasks-api.ts (users: full_name →
  // username → email). Required so ownerInitials come from a display name,
  // never from the UUID (Finding 5).
  const usersQuery = useQuery<UserLookupRow[], Error>({
    queryKey: ['users-for-commitments', ownerIds],
    queryFn: async (): Promise<UserLookupRow[]> => {
      if (ownerIds.length === 0) return []
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, username, email')
        .in('id', ownerIds)
      if (error !== null) throw new Error(error.message)
      return (data ?? []) as UserLookupRow[]
    },
    enabled: ownerIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const ownerNameById = useMemo<Map<string, string>>(() => {
    const m = new Map<string, string>()
    for (const u of usersQuery.data ?? []) {
      const name = u.full_name ?? u.username ?? u.email ?? ''
      if (name.trim().length > 0) m.set(u.id, name)
    }
    return m
  }, [usersQuery.data])

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

      const titleText =
        isArabic && c.title_ar != null && c.title_ar.trim().length > 0 ? c.title_ar : c.title

      existing.commitments.push({
        id: c.id,
        title: titleText,
        daysOverdue,
        severity: deriveSeverity(daysOverdue),
        // Display-name initials only — '' (hidden chip) beats UUID garbage.
        ownerInitials: deriveInitials(ownerNameById.get(c.owner_user_id ?? '') ?? ''),
      })

      byDossier.set(c.dossier_id, existing)
    }

    return Array.from(byDossier.values())
  }, [query.data, dossierMap, ownerNameById, isArabic])

  return {
    data: grouped,
    // Lookups participate in loading so the widget doesn't flash raw
    // dossier_id / blank-owner rows before names resolve (Finding 18).
    isLoading: query.isLoading || dossiersQuery.isLoading || usersQuery.isLoading,
    isError: query.isError,
  }
}
