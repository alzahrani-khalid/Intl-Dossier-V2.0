/**
 * useProgressTracker Hook
 *
 * A custom hook for tracking long-running operations with:
 * - Progress percentage tracking
 * - ETA calculation
 * - Current step descriptions
 * - Pause/resume support
 * - Cancel support
 *
 * Usage:
 * const { progress, start, update, complete, error, cancel, reset } = useProgressTracker();
 */

import { useState, useCallback, useRef, useMemo } from 'react'
import type { ProgressStatus } from '@/components/ui/enhanced-progress'

export interface ProgressState {
  /** Current status */
  status: ProgressStatus
  /** Progress percentage (0-100) */
  progress: number
  /** Title of the operation */
  title: string
  /** Current processing step */
  currentStep: string
  /** Total items to process */
  totalItems: number
  /** Items processed so far */
  processedItems: number
  /** Start time */
  startTime: Date | null
  /** End time */
  endTime: Date | null
  /** Error message if failed */
  errorMessage: string | null
}

export interface ProgressTrackerOptions {
  /** Title of the operation */
  title?: string
  /** Total items to process */
  totalItems?: number
  /** Initial step description */
  initialStep?: string
  /** Callback when cancelled */
  onCancel?: () => void
  /** Callback when completed */
  onComplete?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
}

export interface ProgressTrackerActions {
  /** Start tracking */
  start: (options?: ProgressTrackerOptions) => void
  /** Update progress */
  update: (
    progress: number,
    options?: {
      currentStep?: string
      processedItems?: number
    },
  ) => void
  /** Increment processed items by 1 */
  increment: (options?: { currentStep?: string }) => void
  /** Mark as complete */
  complete: (message?: string) => void
  /** Mark as error */
  error: (message: string) => void
  /** Pause the operation */
  pause: () => void
  /** Resume the operation */
  resume: () => void
  /** Cancel the operation */
  cancel: () => void
  /** Reset to initial state */
  reset: () => void
  /** Check if can cancel */
  canCancel: boolean
  /** Check if can pause */
  canPause: boolean
}

export type UseProgressTrackerReturn = ProgressState & ProgressTrackerActions

const initialState: ProgressState = {
  status: 'idle',
  progress: 0,
  title: '',
  currentStep: '',
  totalItems: 0,
  processedItems: 0,
  startTime: null,
  endTime: null,
  errorMessage: null,
}

/**
 * Hook for tracking progress of long-running operations
 */
export function useProgressTracker(): UseProgressTrackerReturn {
  const [state, setState] = useState<ProgressState>(initialState)
  const optionsRef = useRef<ProgressTrackerOptions>({})

  const start = useCallback((options: ProgressTrackerOptions = {}) => {
    optionsRef.current = options
    setState({
      status: 'processing',
      progress: 0,
      title: options.title || '',
      currentStep: options.initialStep || '',
      totalItems: options.totalItems || 0,
      processedItems: 0,
      startTime: new Date(),
      endTime: null,
      errorMessage: null,
    })
  }, [])

  const update = useCallback(
    (progress: number, options?: { currentStep?: string; processedItems?: number }) => {
      setState((prev) => ({
        ...prev,
        progress: Math.min(100, Math.max(0, progress)),
        currentStep: options?.currentStep ?? prev.currentStep,
        processedItems: options?.processedItems ?? prev.processedItems,
      }))
    },
    [],
  )

  const increment = useCallback((options?: { currentStep?: string }) => {
    setState((prev) => {
      const newProcessedItems = prev.processedItems + 1
      const newProgress =
        prev.totalItems > 0
          ? Math.round((newProcessedItems / prev.totalItems) * 100)
          : prev.progress

      return {
        ...prev,
        processedItems: newProcessedItems,
        progress: Math.min(100, newProgress),
        currentStep: options?.currentStep ?? prev.currentStep,
      }
    })
  }, [])

  const complete = useCallback((message?: string) => {
    setState((prev) => ({
      ...prev,
      status: 'completed',
      progress: 100,
      processedItems: prev.totalItems || prev.processedItems,
      currentStep: message || prev.currentStep,
      endTime: new Date(),
    }))
    optionsRef.current.onComplete?.()
  }, [])

  const error = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      status: 'error',
      errorMessage: message,
      endTime: new Date(),
    }))
    optionsRef.current.onError?.(new Error(message))
  }, [])

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'paused',
    }))
  }, [])

  const resume = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'processing',
    }))
  }, [])

  const cancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'cancelled',
      endTime: new Date(),
    }))
    optionsRef.current.onCancel?.()
  }, [])

  const reset = useCallback(() => {
    optionsRef.current = {}
    setState(initialState)
  }, [])

  const canCancel =
    state.status === 'processing' || state.status === 'paused' || state.status === 'pending'
  const canPause = state.status === 'processing'

  return useMemo(
    () => ({
      ...state,
      start,
      update,
      increment,
      complete,
      error,
      pause,
      resume,
      cancel,
      reset,
      canCancel,
      canPause,
    }),
    [
      state,
      start,
      update,
      increment,
      complete,
      error,
      pause,
      resume,
      cancel,
      reset,
      canCancel,
      canPause,
    ],
  )
}

/**
 * Hook for batch processing with progress tracking
 */
export function useBatchProgress<T>() {
  const tracker = useProgressTracker()
  const abortRef = useRef(false)

  const processBatch = useCallback(
    async (
      items: T[],
      processor: (item: T, index: number) => Promise<void>,
      options?: ProgressTrackerOptions,
    ) => {
      abortRef.current = false

      tracker.start({
        ...options,
        totalItems: items.length,
      })

      for (let i = 0; i < items.length; i++) {
        if (abortRef.current) {
          tracker.cancel()
          return
        }

        try {
          await processor(items[i], i)
          tracker.increment({
            currentStep: options?.initialStep
              ? `${options.initialStep} (${i + 1}/${items.length})`
              : undefined,
          })
        } catch (err) {
          tracker.error(err instanceof Error ? err.message : 'Unknown error')
          return
        }
      }

      tracker.complete()
    },
    [tracker],
  )

  const abort = useCallback(() => {
    abortRef.current = true
  }, [])

  return {
    ...tracker,
    processBatch,
    abort,
  }
}

/**
 * Create a progress tracker context for sharing across components
 */
import { createContext, useContext, type ReactNode } from 'react'

const ProgressTrackerContext = createContext<UseProgressTrackerReturn | null>(null)

export function ProgressTrackerProvider({ children }: { children: ReactNode }) {
  const tracker = useProgressTracker()
  return (
    <ProgressTrackerContext.Provider value={tracker}>{children}</ProgressTrackerContext.Provider>
  )
}

export function useProgressTrackerContext() {
  const context = useContext(ProgressTrackerContext)
  if (!context) {
    throw new Error('useProgressTrackerContext must be used within a ProgressTrackerProvider')
  }
  return context
}

export default useProgressTracker
