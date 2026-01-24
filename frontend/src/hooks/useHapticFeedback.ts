/**
 * Haptic Feedback Hook
 * @module hooks/useHapticFeedback
 * @feature 034-dossier-ui-polish
 *
 * React hook for providing haptic/vibration feedback for touch interactions.
 *
 * @description
 * This module provides haptic feedback utilities for mobile-first applications:
 * - Multiple intensity levels (light, medium, heavy)
 * - Pattern-based vibration for complex feedback (success, error, warning, selection, impact)
 * - Browser Vibration API integration with graceful fallback
 * - Support detection for feature availability
 * - Configurable enable/disable flag
 *
 * Falls back gracefully on devices without haptic support.
 * Uses the Vibration API (navigator.vibrate) which is supported on most modern mobile browsers.
 *
 * Mobile-first implementation with RTL support.
 *
 * @example
 * // Basic haptic feedback
 * const { trigger, isSupported } = useHapticFeedback();
 * if (isSupported) {
 *   trigger('medium');
 * }
 *
 * @example
 * // Success/error patterns
 * const { success, error } = useHapticFeedback();
 * onSave().then(() => success()).catch(() => error());
 *
 * @example
 * // Selection feedback for swipe threshold
 * const { selection } = useHapticFeedback();
 * if (swipeDistance > threshold) selection();
 *
 * @example
 * // Disabled feedback
 * const { trigger } = useHapticFeedback({ enabled: false });
 * trigger('heavy'); // Does nothing
 */

import { useCallback, useMemo } from 'react'

export type HapticIntensity = 'light' | 'medium' | 'heavy'
export type HapticPattern = 'success' | 'error' | 'warning' | 'selection' | 'impact'

export interface HapticFeedbackOptions {
  /** Enable/disable haptic feedback globally. Default: true */
  enabled?: boolean
}

export interface HapticFeedbackResult {
  /** Trigger a single haptic feedback */
  trigger: (intensity?: HapticIntensity) => void
  /** Trigger a success pattern */
  success: () => void
  /** Trigger an error pattern */
  error: () => void
  /** Trigger a warning pattern */
  warning: () => void
  /** Trigger a selection pattern (for swipe threshold) */
  selection: () => void
  /** Trigger an impact pattern (for completing a gesture) */
  impact: () => void
  /** Pattern-based haptic feedback */
  pattern: (type: HapticPattern) => void
  /** Whether haptic feedback is supported */
  isSupported: boolean
}

// Vibration durations by intensity (in ms)
const INTENSITY_DURATIONS: Record<HapticIntensity, number> = {
  light: 10,
  medium: 25,
  heavy: 50,
}

// Vibration patterns (arrays of [duration, pause, duration, ...])
const PATTERNS: Record<HapticPattern, number[]> = {
  success: [20, 50, 40], // Short-pause-long (ascending)
  error: [50, 100, 50, 100, 50], // Three pulses (error rhythm)
  warning: [30, 80, 30], // Two equal pulses
  selection: [15], // Very short tap
  impact: [40], // Medium impact
}

export function useHapticFeedback(options: HapticFeedbackOptions = {}): HapticFeedbackResult {
  const { enabled = true } = options

  // Check if Vibration API is supported
  const isSupported = useMemo(() => {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator
  }, [])

  // Core vibration function
  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!enabled || !isSupported) return

      try {
        navigator.vibrate(pattern)
      } catch (e) {
        // Silently fail if vibration is not available
        console.debug('Haptic feedback not available:', e)
      }
    },
    [enabled, isSupported],
  )

  // Trigger single haptic with intensity
  const trigger = useCallback(
    (intensity: HapticIntensity = 'medium') => {
      vibrate(INTENSITY_DURATIONS[intensity])
    },
    [vibrate],
  )

  // Pattern-based feedback
  const pattern = useCallback(
    (type: HapticPattern) => {
      vibrate(PATTERNS[type])
    },
    [vibrate],
  )

  // Convenience methods
  const success = useCallback(() => pattern('success'), [pattern])
  const error = useCallback(() => pattern('error'), [pattern])
  const warning = useCallback(() => pattern('warning'), [pattern])
  const selection = useCallback(() => pattern('selection'), [pattern])
  const impact = useCallback(() => pattern('impact'), [pattern])

  return {
    trigger,
    success,
    error,
    warning,
    selection,
    impact,
    pattern,
    isSupported,
  }
}

export default useHapticFeedback
