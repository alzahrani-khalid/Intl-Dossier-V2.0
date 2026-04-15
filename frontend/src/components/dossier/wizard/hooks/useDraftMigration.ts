/**
 * useDraftMigration -- Silent legacy draft migration (INFRA-07, D-03)
 *
 * Migrates old monolithic `dossier-create-draft` localStorage key
 * to per-type keys (`dossier-create-{type}`) on first load.
 * Silent: no toast, no console.log, no user notification.
 */

import { useEffect, useRef } from 'react'

const OLD_DRAFT_KEY = 'dossier-create-draft'
const DRAFT_KEY_PREFIX = 'dossier-create-'

const VALID_TYPES: readonly string[] = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
]

/**
 * Pure function that handles the actual migration logic.
 * Reads the old draft key, determines the dossier type, and
 * writes data to the appropriate per-type key.
 */
export function migrateLegacyDraft(): void {
  try {
    const raw = localStorage.getItem(OLD_DRAFT_KEY)
    if (raw === null) return

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      localStorage.removeItem(OLD_DRAFT_KEY)
      return
    }

    const record = parsed as Record<string, unknown>
    const type = record.type as string | undefined

    // Can't migrate without a type -- leave old key intact (Pitfall 2)
    if (type === undefined || !VALID_TYPES.includes(type)) return

    const newKey = `${DRAFT_KEY_PREFIX}${type}`

    // Don't overwrite existing per-type draft
    if (localStorage.getItem(newKey) !== null) {
      localStorage.removeItem(OLD_DRAFT_KEY)
      return
    }

    // Remove type field from migrated data (now implicit in key)
    const { type: _removedType, ...draftData } = record
    localStorage.setItem(newKey, JSON.stringify(draftData))
    localStorage.removeItem(OLD_DRAFT_KEY)
  } catch {
    // Silent failure per D-03 -- don't block wizard initialization
  }
}

/**
 * Hook that calls migrateLegacyDraft() once on mount.
 * Uses useRef to prevent double-execution in React StrictMode.
 */
export function useDraftMigration(): void {
  const hasRun = useRef(false)

  useEffect((): void => {
    if (hasRun.current) return
    hasRun.current = true
    migrateLegacyDraft()
  }, [])
}
