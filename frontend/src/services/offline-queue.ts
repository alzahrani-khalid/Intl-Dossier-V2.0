import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Types for offline queue
export interface QueuedAction {
  id: string
  type: 'api' | 'upload' | 'sync'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  data?: any
  headers?: Record<string, string>
  timestamp: number
  retryCount: number
  maxRetries: number
  priority: 'low' | 'normal' | 'high'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface OfflineQueueState {
  actions: QueuedAction[]
  isOnline: boolean
  isProcessing: boolean
  lastSyncTime: number | null
}

export interface OfflineQueueActions {
  addAction: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount' | 'status'>) => void
  removeAction: (id: string) => void
  updateActionStatus: (id: string, status: QueuedAction['status'], error?: string) => void
  setOnlineStatus: (isOnline: boolean) => void
  processQueue: () => Promise<void>
  clearCompleted: () => void
  retryFailed: () => void
  getPendingActions: () => QueuedAction[]
  getFailedActions: () => QueuedAction[]
}

// IndexedDB setup
const DB_NAME = 'OfflineQueueDB'
const DB_VERSION = 1
const STORE_NAME = 'queuedActions'

class IndexedDBManager {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('priority', 'priority', { unique: false })
        }
      }
    })
  }

  async saveAction(action: QueuedAction): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(action)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getActions(): Promise<QueuedAction[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async deleteAction(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clearCompleted(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('status')
      const request = index.openCursor()

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (cursor.value.status === 'completed') {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  }
}

const dbManager = new IndexedDBManager()

// Zustand store for offline queue
export const useOfflineQueue = create<OfflineQueueState & OfflineQueueActions>()(
  subscribeWithSelector((set, get) => ({
    actions: [],
    isOnline: navigator.onLine,
    isProcessing: false,
    lastSyncTime: null,

    addAction: async (actionData) => {
      const action: QueuedAction = {
        ...actionData,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending'
      }

      try {
        await dbManager.saveAction(action)
        set((state) => ({
          actions: [...state.actions, action]
        }))
      } catch (error) {
        console.error('Failed to save action to IndexedDB:', error)
      }
    },

    removeAction: async (id) => {
      try {
        await dbManager.deleteAction(id)
        set((state) => ({
          actions: state.actions.filter(action => action.id !== id)
        }))
      } catch (error) {
        console.error('Failed to delete action from IndexedDB:', error)
      }
    },

    updateActionStatus: async (id, status, error) => {
      const action = get().actions.find(a => a.id === id)
      if (!action) return

      const updatedAction = { ...action, status, error }
      
      try {
        await dbManager.saveAction(updatedAction)
        set((state) => ({
          actions: state.actions.map(a => a.id === id ? updatedAction : a)
        }))
      } catch (error) {
        console.error('Failed to update action in IndexedDB:', error)
      }
    },

    setOnlineStatus: (isOnline) => {
      set({ isOnline })
      if (isOnline) {
        get().processQueue()
      }
    },

    processQueue: async () => {
      const { actions, isOnline, isProcessing } = get()
      
      if (!isOnline || isProcessing) return

      const pendingActions = actions
        .filter(action => action.status === 'pending')
        .sort((a, b) => {
          // Sort by priority first, then by timestamp
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          const aPriority = priorityOrder[a.priority]
          const bPriority = priorityOrder[b.priority]
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority
          }
          
          return a.timestamp - b.timestamp
        })

      if (pendingActions.length === 0) return

      set({ isProcessing: true })

      for (const action of pendingActions) {
        try {
          await get().executeAction(action)
        } catch (error) {
          console.error(`Failed to execute action ${action.id}:`, error)
          await get().updateActionStatus(
            action.id, 
            'failed', 
            error instanceof Error ? error.message : 'Unknown error'
          )
        }
      }

      set({ isProcessing: false, lastSyncTime: Date.now() })
    },

    clearCompleted: async () => {
      try {
        await dbManager.clearCompleted()
        set((state) => ({
          actions: state.actions.filter(action => action.status !== 'completed')
        }))
      } catch (error) {
        console.error('Failed to clear completed actions:', error)
      }
    },

    retryFailed: async () => {
      const failedActions = get().getFailedActions()
      
      for (const action of failedActions) {
        if (action.retryCount < action.maxRetries) {
          const updatedAction = {
            ...action,
            status: 'pending' as const,
            retryCount: action.retryCount + 1,
            error: undefined
          }
          
          try {
            await dbManager.saveAction(updatedAction)
            set((state) => ({
              actions: state.actions.map(a => a.id === action.id ? updatedAction : a)
            }))
          } catch (error) {
            console.error('Failed to retry action:', error)
          }
        }
      }
    },

    getPendingActions: () => {
      return get().actions.filter(action => action.status === 'pending')
    },

    getFailedActions: () => {
      return get().actions.filter(action => action.status === 'failed')
    }
  }))
)

// Action executor
const executeAction = async (action: QueuedAction): Promise<void> => {
  const { updateActionStatus } = useOfflineQueue.getState()
  
  try {
    await updateActionStatus(action.id, 'processing')

    const response = await fetch(action.url, {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
        ...action.headers
      },
      body: action.data ? JSON.stringify(action.data) : undefined
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    await updateActionStatus(action.id, 'completed')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await updateActionStatus(action.id, 'failed', errorMessage)
    throw error
  }
}

// Initialize the store with data from IndexedDB
const initializeStore = async () => {
  try {
    const actions = await dbManager.getActions()
    useOfflineQueue.setState({ actions })
  } catch (error) {
    console.error('Failed to initialize offline queue from IndexedDB:', error)
  }
}

// Set up online/offline listeners
const setupNetworkListeners = () => {
  const { setOnlineStatus } = useOfflineQueue.getState()

  window.addEventListener('online', () => {
    setOnlineStatus(true)
  })

  window.addEventListener('offline', () => {
    setOnlineStatus(false)
  })
}

// Initialize when module loads
initializeStore()
setupNetworkListeners()

// Export utility functions
export const addToQueue = (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount' | 'status'>) => {
  useOfflineQueue.getState().addAction(action)
}

export const processQueue = () => {
  useOfflineQueue.getState().processQueue()
}

export const clearCompleted = () => {
  useOfflineQueue.getState().clearCompleted()
}

export const retryFailed = () => {
  useOfflineQueue.getState().retryFailed()
}

// Export the store
export default useOfflineQueue

