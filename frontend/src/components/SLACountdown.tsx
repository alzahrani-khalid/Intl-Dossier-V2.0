import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@supabase/supabase-js'
import { usePauseSLA, useResumeSLA } from '../hooks/useIntakeApi'
import { InputDialog } from './InputDialog'

interface SLAEvent {
  id: string
  ticket_id: string
  policy_id: string
  event_type: 'started' | 'paused' | 'resumed' | 'met' | 'breached' | 'cancelled'
  event_timestamp: string
  elapsed_minutes: number
  remaining_minutes: number
  is_breached: boolean
}

interface SLACountdownProps {
  ticketId: string
  targetMinutes: number
  eventType: 'acknowledgment' | 'resolution'
  startedAt: string
  className?: string
  /** Current paused state from ticket data (for initial state) */
  initialPaused?: boolean
  /** Total accumulated pause minutes from ticket data */
  accumulatedPauseMinutes?: number
  /** Whether the user can pause/resume the SLA */
  canPauseResume?: boolean
}

export function SLACountdown({
  ticketId,
  targetMinutes,
  eventType,
  startedAt,
  className = '',
  initialPaused = false,
  accumulatedPauseMinutes = 0,
  canPauseResume = false,
}: SLACountdownProps) {
  const { t } = useTranslation('intake')
  const [remainingMinutes, setRemainingMinutes] = useState<number>(targetMinutes)
  const [isBreached, setIsBreached] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(initialPaused)
  const [pauseDialogOpen, setPauseDialogOpen] = useState<boolean>(false)

  // SLA mutations
  const pauseMutation = usePauseSLA(ticketId)
  const resumeMutation = useResumeSLA(ticketId)

  // Map eventType to slaType expected by the API
  const slaType = eventType === 'acknowledgment' ? 'acknowledgment' : 'resolution'

  // Calculate initial remaining time
  useEffect(() => {
    const calculateRemaining = () => {
      const started = new Date(startedAt).getTime()
      const now = Date.now()
      const elapsedMinutes = Math.floor((now - started) / (1000 * 60))
      const remaining = targetMinutes - elapsedMinutes

      setRemainingMinutes(remaining)
      setIsBreached(remaining < 0)
    }

    calculateRemaining()
    const interval = setInterval(calculateRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [targetMinutes, startedAt])

  // Subscribe to SLA events via Supabase Realtime
  useEffect(() => {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )

    const channel = supabase
      .channel(`sla_events:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sla_events',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const event = payload.new as SLAEvent

          if (event.event_type === 'paused') {
            setIsPaused(true)
          } else if (event.event_type === 'resumed') {
            setIsPaused(false)
          } else if (event.event_type === 'breached') {
            setIsBreached(true)
          } else if (event.event_type === 'met') {
            setRemainingMinutes(0)
          }

          // Update remaining minutes from server
          setRemainingMinutes(event.remaining_minutes)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId])

  // Format time remaining
  const formatTimeRemaining = (minutes: number): string => {
    if (minutes < 0) {
      const absMinutes = Math.abs(minutes)
      const hours = Math.floor(absMinutes / 60)
      const mins = absMinutes % 60
      return hours > 0
        ? t('sla.breached_by_hours', { hours, minutes: mins })
        : t('sla.breached_by_minutes', { minutes: mins })
    }

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return t('sla.time_remaining_hours', { hours, minutes: mins })
    }
    return t('sla.time_remaining_minutes', { minutes: mins })
  }

  // Get status color based on remaining time percentage
  const getStatusColor = (): string => {
    if (isBreached) return 'bg-red-500 text-white'
    if (isPaused) return 'bg-gray-400 text-white'

    const percentRemaining = (remainingMinutes / targetMinutes) * 100

    if (percentRemaining > 25) return 'bg-green-500 text-white'
    if (percentRemaining > 10) return 'bg-yellow-500 text-gray-900'
    return 'bg-orange-500 text-white'
  }

  // Get status icon
  const getStatusIcon = (): string => {
    if (isBreached) return '⚠️'
    if (isPaused) return '⏸️'

    const percentRemaining = (remainingMinutes / targetMinutes) * 100
    if (percentRemaining > 25) return '✓'
    if (percentRemaining > 10) return '⚡'
    return '🔴'
  }

  // Get progress bar width
  const getProgressWidth = (): number => {
    if (isBreached) return 100
    const percentElapsed = ((targetMinutes - remainingMinutes) / targetMinutes) * 100
    return Math.min(Math.max(percentElapsed, 0), 100)
  }

  // Handle pause - opens dialog to collect reason
  const handlePauseClick = useCallback(() => {
    setPauseDialogOpen(true)
  }, [])

  // Handle pause confirmation with reason
  const handlePauseConfirm = useCallback(
    (reason: string) => {
      pauseMutation.mutate(
        { slaType, reason },
        {
          onSuccess: () => {
            setIsPaused(true)
            setPauseDialogOpen(false)
          },
        },
      )
    },
    [pauseMutation, slaType],
  )

  // Handle resume
  const handleResume = useCallback(() => {
    resumeMutation.mutate(
      { slaType },
      {
        onSuccess: () => {
          setIsPaused(false)
        },
      },
    )
  }, [resumeMutation, slaType])

  // Format accumulated pause time
  const formatPauseTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className={`sla-countdown ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {eventType === 'acknowledgment' ? t('sla.acknowledgment') : t('sla.resolution')}
          </span>
          {isPaused && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('sla.paused')}</span>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor()}`}
          role="status"
          aria-live="polite"
        >
          {getStatusIcon()} {formatTimeRemaining(remainingMinutes)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-all duration-1000 ${
            isBreached
              ? 'bg-red-500'
              : isPaused
                ? 'bg-gray-400'
                : 'bg-gradient-to-r from-green-500 to-green-600'
          }`}
          style={{ width: `${getProgressWidth()}%` }}
          role="progressbar"
          aria-valuenow={getProgressWidth()}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Target info and pause controls */}
      <div className="mt-1 flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {t('sla.target')}: {Math.floor(targetMinutes / 60)}h {targetMinutes % 60}m
          {accumulatedPauseMinutes > 0 && (
            <span className="ms-2">
              ({t('sla.totalPaused')}: {formatPauseTime(accumulatedPauseMinutes)})
            </span>
          )}
        </div>

        {/* Pause/Resume button - only show if user has permission and SLA is active */}
        {canPauseResume && !isBreached && (
          <button
            onClick={isPaused ? handleResume : handlePauseClick}
            disabled={pauseMutation.isPending || resumeMutation.isPending}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              isPaused
                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50'
            }`}
            aria-label={isPaused ? t('sla.resume') : t('sla.pause')}
          >
            {pauseMutation.isPending || resumeMutation.isPending ? (
              <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isPaused ? (
              <>▶ {t('sla.resume')}</>
            ) : (
              <>⏸ {t('sla.pause')}</>
            )}
          </button>
        )}
      </div>

      {/* Pause reason dialog */}
      <InputDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        title={t('sla.pause')}
        description={t('sla.pauseReason')}
        placeholder={t('sla.pauseReasonPlaceholder')}
        inputType="textarea"
        required
        confirmLabel={t('sla.pause')}
        isLoading={pauseMutation.isPending}
        onConfirm={handlePauseConfirm}
      />
    </div>
  )
}
