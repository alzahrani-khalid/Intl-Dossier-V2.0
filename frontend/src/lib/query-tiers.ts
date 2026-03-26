/**
 * TanStack Query StaleTime Tiers
 *
 * Standardized caching tiers to replace ad-hoc staleTime values.
 * Each domain hook picks the appropriate tier based on data freshness needs.
 *
 * @module lib/query-tiers
 */

export const STALE_TIME = {
  /** Static data: dossier types, config, translations, enum lookups -- 30 min */
  STATIC: 30 * 60 * 1000,
  /** Normal data: dossier lists, details, relationships, analytics -- 5 min */
  NORMAL: 5 * 60 * 1000,
  /** Live data: SLA monitoring, workflow automation, approvals, kanban -- 30 sec */
  LIVE: 30 * 1000,
} as const

export type StaleTimeTier = (typeof STALE_TIME)[keyof typeof STALE_TIME]
