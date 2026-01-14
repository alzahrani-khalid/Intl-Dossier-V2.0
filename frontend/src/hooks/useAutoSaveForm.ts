/**
 * useAutoSaveForm Hook
 *
 * A comprehensive hook for automatic form progress saving with:
 * - IndexedDB persistence for resilience
 * - Debounced auto-save to minimize writes
 * - Progress tracking with time estimation
 * - Draft restoration after navigation/timeout
 * - Multi-step form support
 * - TTL-based cleanup of stale drafts
 *
 * @module hooks/useAutoSaveForm
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import type {
  AutoSaveConfig,
  FormDraft,
  AutoSaveStatus,
  FormProgress,
  FieldStatus,
  UseAutoSaveFormReturn,
} from '@/types/form-auto-save.types'

// IndexedDB configuration
const DB_NAME = 'intl-dossier-form-drafts'
const DB_VERSION = 1
const STORE_NAME = 'form-drafts'
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const DEFAULT_DEBOUNCE_MS = 1000 // 1 second
const CURRENT_SCHEMA_VERSION = 1
const AVG_SECONDS_PER_FIELD = 30 // Estimated 30 seconds per field

/**
 * Opens a connection to IndexedDB for form drafts
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open form drafts database'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'formKey' })
        store.createIndex('savedAt', 'savedAt', { unique: false })
        store.createIndex('userId', 'userId', { unique: false })
      }
    }
  })
}

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

/**
 * Calculate form progress based on field values
 */
function calculateProgress<T extends Record<string, unknown>>(
  data: T,
  requiredFields?: string[],
): { percentage: number; completedFields: number; totalFields: number } {
  const fieldsToCheck = requiredFields || Object.keys(data)
  const totalFields = fieldsToCheck.length

  if (totalFields === 0) {
    return { percentage: 0, completedFields: 0, totalFields: 0 }
  }

  const completedFields = fieldsToCheck.filter((field) => {
    const value = data[field]
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && value.trim() === '') return false
    if (Array.isArray(value) && value.length === 0) return false
    return true
  }).length

  const percentage = Math.round((completedFields / totalFields) * 100)

  return { percentage, completedFields, totalFields }
}

/**
 * Calculate estimated time remaining in minutes
 */
function calculateTimeRemaining(
  completedFields: number,
  totalFields: number,
  avgSecondsPerField: number = AVG_SECONDS_PER_FIELD,
): number {
  const remainingFields = totalFields - completedFields
  const totalSeconds = remainingFields * avgSecondsPerField
  return Math.ceil(totalSeconds / 60)
}

/**
 * Hook for automatic form progress saving
 *
 * @example
 * ```tsx
 * const { draft, updateDraft, status, progress } = useAutoSaveForm({
 *   formKey: 'engagement-form-123',
 *   requiredFields: ['title', 'date', 'participants'],
 *   onDraftRestored: (draft) => {
 *     // Handle restored draft
 *     form.reset(draft.data);
 *   },
 * });
 *
 * // In form field onChange:
 * const handleChange = (field, value) => {
 *   updateDraft({ [field]: value });
 * };
 * ```
 */
export function useAutoSaveForm<T extends Record<string, unknown>>(
  config: AutoSaveConfig,
): UseAutoSaveFormReturn<T> {
  const {
    formKey,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    ttlMs = DEFAULT_TTL_MS,
    requiredFields,
    onSaveSuccess,
    onSaveError,
    onDraftRestored,
  } = config

  // State
  const [draft, setDraft] = useState<FormDraft<T> | null>(null)
  const [status, setStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    hasRestored: false,
    hasUnsavedChanges: false,
    lastSavedAt: null,
    error: null,
    isStorageAvailable: isIndexedDBAvailable(),
  })

  // Refs for tracking
  const startedAtRef = useRef<string>(new Date().toISOString())
  const lastSavedDataRef = useRef<string>('')
  const isInitializedRef = useRef(false)

  /**
   * Save draft to IndexedDB
   */
  const saveDraftToStorage = useCallback(async (draftData: FormDraft<T>): Promise<void> => {
    if (!isIndexedDBAvailable()) return

    try {
      const db = await openDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      await new Promise<void>((resolve, reject) => {
        const request = store.put(draftData)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to save draft'))
      })

      db.close()
    } catch (error) {
      throw error
    }
  }, [])

  /**
   * Load draft from IndexedDB
   */
  const loadDraftFromStorage = useCallback(async (): Promise<FormDraft<T> | null> => {
    if (!isIndexedDBAvailable()) return null

    try {
      const db = await openDB()
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      const result = await new Promise<FormDraft<T> | null>((resolve, reject) => {
        const request = store.get(formKey)
        request.onsuccess = () => {
          const draft = request.result as FormDraft<T> | undefined

          // Check if draft is expired
          if (draft) {
            const savedTime = new Date(draft.savedAt).getTime()
            const now = Date.now()
            if (now - savedTime > ttlMs) {
              resolve(null)
              return
            }
          }

          resolve(draft || null)
        }
        request.onerror = () => reject(new Error('Failed to load draft'))
      })

      db.close()
      return result
    } catch {
      return null
    }
  }, [formKey, ttlMs])

  /**
   * Clear draft from IndexedDB
   */
  const clearDraftFromStorage = useCallback(async (): Promise<void> => {
    if (!isIndexedDBAvailable()) return

    try {
      const db = await openDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(formKey)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to clear draft'))
      })

      db.close()
    } catch {
      // Ignore errors when clearing
    }
  }, [formKey])

  /**
   * Debounced save function
   */
  const debouncedSave = useDebouncedCallback(async (draftData: FormDraft<T>) => {
    setStatus((prev) => ({ ...prev, isSaving: true, error: null }))

    try {
      await saveDraftToStorage(draftData)

      const now = new Date().toISOString()
      setStatus((prev) => ({
        ...prev,
        isSaving: false,
        lastSavedAt: now,
        hasUnsavedChanges: false,
      }))

      lastSavedDataRef.current = JSON.stringify(draftData.data)
      onSaveSuccess?.(draftData)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setStatus((prev) => ({ ...prev, isSaving: false, error: err }))
      onSaveError?.(err)
    }
  }, debounceMs)

  /**
   * Update draft data
   */
  const updateDraft = useCallback(
    (data: Partial<T>, step?: number) => {
      setDraft((prev) => {
        const currentData = prev?.data || ({} as T)
        const newData = { ...currentData, ...data } as T
        const progressInfo = calculateProgress(newData, requiredFields)

        const newDraft: FormDraft<T> = {
          formKey,
          data: newData,
          currentStep: step ?? prev?.currentStep,
          totalSteps: prev?.totalSteps,
          savedAt: new Date().toISOString(),
          startedAt: prev?.startedAt || startedAtRef.current,
          progress: progressInfo.percentage,
          fieldsCompleted: progressInfo.completedFields,
          totalFields: progressInfo.totalFields,
          version: CURRENT_SCHEMA_VERSION,
        }

        // Check if data actually changed
        const currentDataStr = JSON.stringify(newData)
        if (currentDataStr !== lastSavedDataRef.current) {
          setStatus((s) => ({ ...s, hasUnsavedChanges: true }))
          debouncedSave(newDraft)
        }

        return newDraft
      })
    },
    [formKey, requiredFields, debouncedSave],
  )

  /**
   * Manually trigger a save
   */
  const saveDraft = useCallback(async () => {
    if (draft) {
      debouncedSave.flush()
      await saveDraftToStorage(draft)
      setStatus((prev) => ({
        ...prev,
        lastSavedAt: new Date().toISOString(),
        hasUnsavedChanges: false,
      }))
    }
  }, [draft, saveDraftToStorage, debouncedSave])

  /**
   * Clear the draft
   */
  const clearDraft = useCallback(async () => {
    debouncedSave.cancel()
    await clearDraftFromStorage()
    setDraft(null)
    setStatus((prev) => ({
      ...prev,
      hasUnsavedChanges: false,
      lastSavedAt: null,
      hasRestored: false,
    }))
    lastSavedDataRef.current = ''
  }, [clearDraftFromStorage, debouncedSave])

  /**
   * Restore a draft from storage
   */
  const restoreDraft = useCallback(async (): Promise<FormDraft<T> | null> => {
    const storedDraft = await loadDraftFromStorage()

    if (storedDraft) {
      setDraft(storedDraft)
      setStatus((prev) => ({
        ...prev,
        hasRestored: true,
        lastSavedAt: storedDraft.savedAt,
      }))
      lastSavedDataRef.current = JSON.stringify(storedDraft.data)
      startedAtRef.current = storedDraft.startedAt
      onDraftRestored?.(storedDraft)
    }

    return storedDraft
  }, [loadDraftFromStorage, onDraftRestored])

  /**
   * Check if a specific field is completed
   */
  const isFieldCompleted = useCallback(
    (fieldName: string): boolean => {
      if (!draft?.data) return false
      const value = draft.data[fieldName]
      if (value === null || value === undefined) return false
      if (typeof value === 'string' && value.trim() === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    },
    [draft],
  )

  /**
   * Get all field statuses
   */
  const getFieldStatuses = useCallback((): FieldStatus[] => {
    if (!draft?.data) return []

    const fieldsToCheck = requiredFields || Object.keys(draft.data)

    return fieldsToCheck.map((name) => ({
      name,
      isCompleted: isFieldCompleted(name),
      isRequired: requiredFields?.includes(name) ?? true,
      isValid: true, // Would need form validation context for real validation
    }))
  }, [draft, requiredFields, isFieldCompleted])

  /**
   * Calculate form progress
   */
  const progress = useMemo((): FormProgress => {
    const data = draft?.data || ({} as T)
    const progressInfo = calculateProgress(data, requiredFields)
    const estimatedMinutesRemaining = calculateTimeRemaining(
      progressInfo.completedFields,
      progressInfo.totalFields,
    )

    return {
      percentage: progressInfo.percentage,
      completedFields: progressInfo.completedFields,
      totalFields: progressInfo.totalFields,
      currentStep: draft?.currentStep,
      totalSteps: draft?.totalSteps,
      estimatedMinutesRemaining,
      avgSecondsPerField: AVG_SECONDS_PER_FIELD,
    }
  }, [draft, requiredFields])

  // Initialize: check for existing draft on mount
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const initialize = async () => {
      const existingDraft = await loadDraftFromStorage()
      if (existingDraft) {
        setDraft(existingDraft)
        setStatus((prev) => ({
          ...prev,
          hasRestored: false, // User hasn't chosen to restore yet
          lastSavedAt: existingDraft.savedAt,
        }))
        lastSavedDataRef.current = JSON.stringify(existingDraft.data)
        startedAtRef.current = existingDraft.startedAt
      }
    }

    initialize()
  }, [loadDraftFromStorage])

  // Cleanup: save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (status.hasUnsavedChanges && draft) {
        debouncedSave.flush()
      }
    }
  }, [status.hasUnsavedChanges, draft, debouncedSave])

  // Handle beforeunload to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status.hasUnsavedChanges) {
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [status.hasUnsavedChanges])

  return {
    draft,
    updateDraft,
    clearDraft,
    saveDraft,
    restoreDraft,
    status,
    progress,
    isFieldCompleted,
    getFieldStatuses,
  }
}

/**
 * Utility to clear all stale form drafts
 */
export async function clearStaleFormDrafts(ttlMs: number = DEFAULT_TTL_MS): Promise<number> {
  if (!isIndexedDBAvailable()) return 0

  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('savedAt')

    const staleKeys: string[] = []
    const now = Date.now()

    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor()
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          const draft = cursor.value as FormDraft<unknown>
          const savedTime = new Date(draft.savedAt).getTime()
          if (now - savedTime > ttlMs) {
            staleKeys.push(draft.formKey)
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(new Error('Failed to find stale drafts'))
    })

    for (const key of staleKeys) {
      await new Promise<void>((resolve) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => resolve() // Ignore errors
      })
    }

    db.close()
    return staleKeys.length
  } catch {
    return 0
  }
}

/**
 * Utility to get all form drafts for the current user
 */
export async function getAllFormDrafts(): Promise<FormDraft<unknown>[]> {
  if (!isIndexedDBAvailable()) return []

  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const drafts = await new Promise<FormDraft<unknown>[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => reject(new Error('Failed to get drafts'))
    })

    db.close()
    return drafts
  } catch {
    return []
  }
}

export default useAutoSaveForm
