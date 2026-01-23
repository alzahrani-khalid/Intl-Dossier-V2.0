/**
 * useDossierPresence Hook
 * Feature: realtime-collaboration-indicators
 *
 * Enhanced presence tracking for dossier pages with:
 * - Active viewers tracking
 * - Editing status (viewing vs editing)
 * - Typing indicators
 * - Section-level editing locks
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth.context'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type PresenceStatus = 'viewing' | 'editing' | 'idle'

export interface DossierPresenceUser {
  user_id: string
  name: string
  email: string
  avatar?: string
  status: PresenceStatus
  editing_section?: string
  last_activity: string
  color: string
}

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

export interface UseDossierPresenceOptions {
  /** Auto-set status to idle after inactivity (ms). Default: 30000 (30s) */
  idleTimeout?: number
  /** Section being edited (for lock indicators) */
  editingSection?: string
  /** Enable debug logging */
  debug?: boolean
}

// Predefined colors for user avatars (high contrast, accessible)
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

function getUserColor(userId: string): string {
  // Deterministic color based on user ID
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const color = USER_COLORS[hash % USER_COLORS.length]
  // Ensure we always return a valid color string
  return color !== undefined ? color : '#2563eb'
}

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
