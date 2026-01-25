/**
 * local-storage.ts
 *
 * Utility for persisting unsaved task edits in IndexedDB with automatic cleanup.
 * Provides resilient offline editing capabilities with automatic recovery.
 *
 * Features:
 * - Persists task edits to IndexedDB
 * - Automatic cleanup after successful save
 * - TTL-based stale edit cleanup
 * - Conflict detection support
 * - TypeScript type safety
 *
 * Usage:
 * ```tsx
 * // Save draft edit
 * await saveTaskDraft(taskId, { title: 'New title' });
 *
 * // Retrieve draft edit
 * const draft = await getTaskDraft(taskId);
 *
 * // Clear draft after successful save
 * await clearTaskDraft(taskId);
 *
 * // Get all pending drafts
 * const drafts = await getAllTaskDrafts();
 * ```
 */

import type { TablesUpdate } from '@/types/database.types'

type TaskUpdate = TablesUpdate<'tasks'>

// IndexedDB configuration
const DB_NAME = 'intl-dossier-offline'
const DB_VERSION = 1
const STORE_NAME = 'task-drafts'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface TaskDraft {
  taskId: string
  updates: Partial<TaskUpdate>
  timestamp: number
  originalUpdatedAt?: string // For optimistic locking
}

/**
 * Opens a connection to IndexedDB
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: 'taskId',
        })

        // Create index for timestamp-based queries
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Saves a task draft to IndexedDB
 *
 * @param {string} taskId - Task ID
 * @param {Partial<TaskUpdate>} updates - Task updates to persist
 * @param {string} originalUpdatedAt - Original updated_at timestamp for optimistic locking
 * @returns {Promise<void>}
 */
export async function saveTaskDraft(
  taskId: string,
  updates: Partial<TaskUpdate>,
  originalUpdatedAt?: string,
): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  const draft: TaskDraft = {
    taskId,
    updates,
    timestamp: Date.now(),
    originalUpdatedAt,
  }

  await new Promise<void>((resolve, reject) => {
    const request = store.put(draft)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to save draft'))
  })

  db.close()
}

/**
 * Retrieves a task draft from IndexedDB
 *
 * @param {string} taskId - Task ID
 * @returns {Promise<TaskDraft | null>} Task draft or null if not found
 */
export async function getTaskDraft(taskId: string): Promise<TaskDraft | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const draft = await new Promise<TaskDraft | null>((resolve, reject) => {
      const request = store.get(taskId)
      request.onsuccess = () => {
        const result = request.result as TaskDraft | undefined

        // Check if draft is stale (older than TTL)
        if (result && Date.now() - result.timestamp > TTL_MS) {
          resolve(null)
        } else {
          resolve(result || null)
        }
      }
      request.onerror = () => reject(new Error('Failed to get draft'))
    })

    db.close()
    return draft
  } catch (_error) {
    return null
  }
}

/**
 * Clears a task draft from IndexedDB
 *
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export async function clearTaskDraft(taskId: string): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  await new Promise<void>((resolve, reject) => {
    const request = store.delete(taskId)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to clear draft'))
  })

  db.close()
}

/**
 * Retrieves all task drafts from IndexedDB
 *
 * @returns {Promise<TaskDraft[]>} Array of all task drafts
 */
export async function getAllTaskDrafts(): Promise<TaskDraft[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const drafts = await new Promise<TaskDraft[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const results = request.result as TaskDraft[]

        // Filter out stale drafts
        const validDrafts = results.filter((draft) => {
          return Date.now() - draft.timestamp <= TTL_MS
        })

        resolve(validDrafts)
      }
      request.onerror = () => reject(new Error('Failed to get all drafts'))
    })

    db.close()
    return drafts
  } catch (_error) {
    return []
  }
}

/**
 * Clears all stale drafts from IndexedDB (older than TTL)
 *
 * @returns {Promise<number>} Number of drafts cleared
 */
export async function clearStaleDrafts(): Promise<number> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')

    const now = Date.now()
    const staleThreshold = now - TTL_MS

    const staleDrafts: string[] = []

    // Find stale drafts
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor()
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          const draft = cursor.value as TaskDraft
          if (draft.timestamp < staleThreshold) {
            staleDrafts.push(draft.taskId)
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(new Error('Failed to find stale drafts'))
    })

    // Delete stale drafts
    for (const taskId of staleDrafts) {
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(taskId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to delete stale draft'))
      })
    }

    db.close()
    return staleDrafts.length
  } catch (_error) {
    return 0
  }
}

/**
 * Clears all task drafts from IndexedDB
 *
 * @returns {Promise<void>}
 */
export async function clearAllTaskDrafts(): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  await new Promise<void>((resolve, reject) => {
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to clear all drafts'))
  })

  db.close()
}

/**
 * Checks if IndexedDB is supported
 *
 * @returns {boolean} True if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}
