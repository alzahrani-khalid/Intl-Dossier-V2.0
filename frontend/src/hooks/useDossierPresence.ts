/**
 * useDossierPresence Hook
 * @module hooks/useDossierPresence
 * @feature realtime-collaboration-indicators
 *
 * Real-time presence tracking for collaborative dossier editing with active
 * viewer tracking, editing status, section-level locks, and automatic idle detection.
 *
 * @description
 * This hook provides comprehensive presence tracking for dossier pages using
 * Supabase Realtime channels. It enables:
 *
 * - Active viewer tracking with real-time updates
 * - User status indicators (viewing, editing, idle)
 * - Section-level editing locks to prevent conflicts
 * - Automatic idle detection after inactivity
 * - Deterministic user color assignment
 * - Activity tracking through mouse, keyboard, and scroll events
 *
 * Features:
 * - Automatic idle timeout (default: 30 seconds)
 * - Section-specific editing indicators
 * - Viewer count excluding current user
 * - Editor filtering for collaborative workflows
 * - Optional debug logging
 * - Automatic cleanup on unmount
 *
 * @example
 * // Basic usage
 * const {
 *   viewers,
 *   editors,
 *   viewerCount,
 *   isConnected,
 *   setStatus,
 * } = useDossierPresence(dossierId);
 *
 * @example
 * // With section editing
 * const {
 *   sectionLocks,
 *   setEditingSection,
 * } = useDossierPresence(dossierId, {
 *   editingSection: 'overview',
 *   idleTimeout: 60000, // 1 minute
 * });
 *
 * @example
 * // Display active viewers
 * const { viewers } = useDossierPresence(dossierId);
 * return (
 *   <div>
 *     {viewers.map(viewer => (
 *       <Avatar
 *         key={viewer.user_id}
 *         name={viewer.name}
 *         color={viewer.color}
 *         status={viewer.status}
 *       />
 *     ))}
 *   </div>
 * );
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth.context'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * User presence status
 * - viewing: Actively viewing the dossier
 * - editing: Currently editing content
 * - idle: Inactive for idleTimeout duration
 */
export type PresenceStatus = 'viewing' | 'editing' | 'idle'

/**
 * Presence information for a user viewing/editing a dossier
 */
export interface DossierPresenceUser {
  /** UUID of the user */
  user_id: string
  /** Display name of the user */
  name: string
  /** Email address of the user */
  email: string
  /** Avatar URL (optional) */
  avatar?: string
  /** Current presence status */
  status: PresenceStatus
  /** Section ID being edited (if editing) */
  editing_section?: string
  /** ISO timestamp of last activity */
  last_activity: string
  /** Deterministic color assigned to user */
  color: string
}

/**
 * Complete presence state for a dossier
 */
export interface DossierPresenceState {
  /** All users currently viewing/editing this dossier */
  viewers: DossierPresenceUser[]
  /** Users actively editing (subset of viewers) */
  editors: DossierPresenceUser[]
  /** Current user's presence info */
  currentUser: DossierPresenceUser | null
  /** Whether the current user is connected */
  isConnected: boolean
  /** Map of section IDs to users editing them */
  sectionLocks: Map<string, DossierPresenceUser>
  /** Number of active viewers (excluding current user) */
  viewerCount: number
}

/**
 * Options for configuring presence tracking behavior
 */
export interface UseDossierPresenceOptions {
  /** Auto-set status to idle after inactivity (ms). Default: 30000 (30s) */
  idleTimeout?: number
  /** Section being edited (for lock indicators) */
  editingSection?: string
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Predefined colors for user avatars (high contrast, WCAG AA accessible)
 * @internal
 */
const USER_COLORS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#ea580c', // Orange
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#be185d', // Pink
  '#4f46e5', // Indigo
]

/**
 * Get a deterministic color for a user based on their ID
 *
 * @description
 * Uses a simple hash function to assign consistent colors to users.
 * The same user will always get the same color across sessions.
 *
 * @param userId - UUID of the user
 * @returns Hex color code
 * @internal
 */
function getUserColor(userId: string): string {
  // Deterministic color based on user ID
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const color = USER_COLORS[hash % USER_COLORS.length]
  // Ensure we always return a valid color string
  return color !== undefined ? color : '#2563eb'
}

/**
 * Hook for real-time presence tracking on dossier pages
 *
 * @description
 * Establishes a Supabase Realtime channel for the dossier and tracks presence
 * of all connected users. Automatically broadcasts presence updates and listens
 * for changes from other users. Implements idle detection through activity monitoring.
 *
 * Presence lifecycle:
 * 1. Channel subscription on mount
 * 2. Broadcast initial presence
 * 3. Listen for presence sync, join, leave events
 * 4. Track user activity (mouse, keyboard, scroll)
 * 5. Automatic idle timeout
 * 6. Cleanup and unsubscribe on unmount
 *
 * @param dossierId - UUID of the dossier to track presence for
 * @param options - Configuration options for presence tracking
 * @param options.idleTimeout - Milliseconds before marking user as idle (default: 30000)
 * @param options.editingSection - Current section being edited
 * @param options.debug - Enable debug console logging
 * @returns Presence state and control functions
 *
 * @example
 * // Basic presence tracking
 * const { viewers, viewerCount, isConnected } = useDossierPresence(dossierId);
 *
 * @example
 * // With section editing
 * const { sectionLocks, setEditingSection } = useDossierPresence(dossierId, {
 *   editingSection: currentSection,
 * });
 *
 * // Check if section is locked
 * const isLocked = sectionLocks.has('overview');
 *
 * @example
 * // Manual status control
 * const { setStatus, touch } = useDossierPresence(dossierId);
 *
 * // Set editing status
 * setStatus('editing');
 *
 * // Manually refresh activity
 * touch();
 */
export function useDossierPresence(
  dossierId: string | undefined,
  options: UseDossierPresenceOptions = {},
): DossierPresenceState & {
  /** Update current user's status */
  setStatus: (status: PresenceStatus) => void
  /** Update the section being edited */
  setEditingSection: (section: string | undefined) => void
  /** Manually refresh activity timestamp */
  touch: () => void
} {
  const { idleTimeout = 30000, editingSection, debug = false } = options
  const { user } = useAuth()

  const [state, setState] = useState<DossierPresenceState>({
    viewers: [],
    editors: [],
    currentUser: null,
    isConnected: false,
    sectionLocks: new Map(),
    viewerCount: 0,
  })

  const channelRef = useRef<RealtimeChannel | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentStatusRef = useRef<PresenceStatus>('viewing')
  const currentSectionRef = useRef<string | undefined>(editingSection)

  // Log helper
  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) {
        console.log('[DossierPresence]', ...args)
      }
    },
    [debug],
  )

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    if (currentStatusRef.current === 'idle') {
      // User is back, update status
      currentStatusRef.current = 'viewing'
      channelRef.current?.track({
        user_id: user?.id,
        name: user?.name || user?.email?.split('@')[0] || 'Unknown',
        email: user?.email || '',
        avatar: user?.avatar,
        status: 'viewing',
        editing_section: currentSectionRef.current,
        last_activity: new Date().toISOString(),
        color: user?.id ? getUserColor(user.id) : USER_COLORS[0],
      })
    }

    idleTimerRef.current = setTimeout(() => {
      currentStatusRef.current = 'idle'
      channelRef.current?.track({
        user_id: user?.id,
        name: user?.name || user?.email?.split('@')[0] || 'Unknown',
        email: user?.email || '',
        avatar: user?.avatar,
        status: 'idle',
        editing_section: undefined,
        last_activity: new Date().toISOString(),
        color: user?.id ? getUserColor(user.id) : USER_COLORS[0],
      })
      log('User went idle')
    }, idleTimeout)
  }, [user, idleTimeout, log])

  // Set up presence channel
  useEffect(() => {
    if (!dossierId || !user?.id) {
      setState((prev) => ({ ...prev, isConnected: false }))
      return
    }

    const channelName = `dossier-presence:${dossierId}`
    log('Setting up channel:', channelName)

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        log('Presence sync:', presenceState)

        const viewers: DossierPresenceUser[] = []
        const sectionLocks = new Map<string, DossierPresenceUser>()
        let currentUser: DossierPresenceUser | null = null

        Object.entries(presenceState).forEach(([_key, presences]) => {
          // Each key can have multiple presences (multiple tabs)
          // We take the most recent one
          const typedPresences = presences as unknown as DossierPresenceUser[]
          const latestPresence = typedPresences.reduce(
            (latest, current) => {
              if (!latest) return current
              return new Date(current.last_activity) > new Date(latest.last_activity)
                ? current
                : latest
            },
            null as DossierPresenceUser | null,
          )

          if (latestPresence) {
            viewers.push(latestPresence)

            // Track section locks for editors
            if (latestPresence.status === 'editing' && latestPresence.editing_section) {
              sectionLocks.set(latestPresence.editing_section, latestPresence)
            }

            // Identify current user
            if (latestPresence.user_id === user.id) {
              currentUser = latestPresence
            }
          }
        })

        const editors = viewers.filter((v) => v.status === 'editing')
        const viewerCount = viewers.filter((v) => v.user_id !== user.id).length

        setState({
          viewers,
          editors,
          currentUser,
          isConnected: true,
          sectionLocks,
          viewerCount,
        })
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        log('Subscription status:', status)

        if (status === 'SUBSCRIBED') {
          // Track our presence
          await channel.track({
            user_id: user.id,
            name: user.name || user.email?.split('@')[0] || 'Unknown',
            email: user.email || '',
            avatar: user.avatar,
            status: currentStatusRef.current,
            editing_section: currentSectionRef.current,
            last_activity: new Date().toISOString(),
            color: getUserColor(user.id),
          })

          setState((prev) => ({ ...prev, isConnected: true }))
          resetIdleTimer()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setState((prev) => ({ ...prev, isConnected: false }))
        }
      })

    // Clean up on unmount
    return () => {
      log('Cleaning up channel')
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [dossierId, user, log, resetIdleTimer])

  // Update presence when editing section changes
  useEffect(() => {
    currentSectionRef.current = editingSection

    if (channelRef.current && user?.id) {
      channelRef.current.track({
        user_id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        avatar: user.avatar,
        status: editingSection ? 'editing' : 'viewing',
        editing_section: editingSection,
        last_activity: new Date().toISOString(),
        color: getUserColor(user.id),
      })

      if (editingSection) {
        currentStatusRef.current = 'editing'
      }
    }
  }, [editingSection, user])

  // Set status manually
  const setStatus = useCallback(
    (status: PresenceStatus) => {
      if (!channelRef.current || !user?.id) return

      currentStatusRef.current = status
      channelRef.current.track({
        user_id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        avatar: user.avatar,
        status,
        editing_section: status === 'editing' ? currentSectionRef.current : undefined,
        last_activity: new Date().toISOString(),
        color: getUserColor(user.id),
      })

      resetIdleTimer()
      log('Status set to:', status)
    },
    [user, resetIdleTimer, log],
  )

  // Set editing section manually
  const setEditingSection = useCallback(
    (section: string | undefined) => {
      currentSectionRef.current = section

      if (!channelRef.current || !user?.id) return

      const status: PresenceStatus = section ? 'editing' : 'viewing'
      currentStatusRef.current = status

      channelRef.current.track({
        user_id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        avatar: user.avatar,
        status,
        editing_section: section,
        last_activity: new Date().toISOString(),
        color: getUserColor(user.id),
      })

      resetIdleTimer()
      log('Editing section set to:', section)
    },
    [user, resetIdleTimer, log],
  )

  // Touch to refresh activity
  const touch = useCallback(() => {
    if (!channelRef.current || !user?.id) return

    channelRef.current.track({
      user_id: user.id,
      name: user.name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || '',
      avatar: user.avatar,
      status: currentStatusRef.current,
      editing_section: currentSectionRef.current,
      last_activity: new Date().toISOString(),
      color: getUserColor(user.id),
    })

    resetIdleTimer()
    log('Activity touched')
  }, [user, resetIdleTimer, log])

  // Listen for user activity events
  useEffect(() => {
    if (!dossierId || !user?.id) return

    const handleActivity = () => {
      resetIdleTimer()
    }

    // Track mouse movements and key presses
    window.addEventListener('mousemove', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity, { passive: true })
    window.addEventListener('scroll', handleActivity, { passive: true })
    window.addEventListener('click', handleActivity, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('click', handleActivity)
    }
  }, [dossierId, user?.id, resetIdleTimer])

  return {
    ...state,
    setStatus,
    setEditingSection,
    touch,
  }
}

/**
 * Check if a section is locked by another user
 *
 * @description
 * Utility function to determine if a section is currently being edited by
 * another user. Returns lock status and the user holding the lock.
 *
 * Note: If the current user holds the lock, it returns locked: false since
 * the user can edit their own locked sections.
 *
 * @param sectionId - ID of the section to check
 * @param sectionLocks - Map of section IDs to editing users
 * @param currentUserId - UUID of the current user
 * @returns Lock status and optional lock holder information
 *
 * @example
 * // Check if section is locked
 * const { locked, lockedBy } = isSectionLocked(
 *   'overview',
 *   sectionLocks,
 *   currentUserId
 * );
 *
 * if (locked) {
 *   console.log(`Locked by ${lockedBy?.name}`);
 * }
 *
 * @example
 * // Disable editing for locked sections
 * const { locked } = isSectionLocked(section.id, sectionLocks, userId);
 * return <Editor disabled={locked} />;
 */
export function isSectionLocked(
  sectionId: string,
  sectionLocks: Map<string, DossierPresenceUser>,
  currentUserId?: string,
): { locked: boolean; lockedBy?: DossierPresenceUser } {
  const lockHolder = sectionLocks.get(sectionId)

  if (!lockHolder) {
    return { locked: false }
  }

  if (lockHolder.user_id === currentUserId) {
    return { locked: false } // Current user holds the lock
  }

  return { locked: true, lockedBy: lockHolder }
}
