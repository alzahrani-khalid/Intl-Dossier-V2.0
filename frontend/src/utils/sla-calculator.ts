/**
 * SLA Calculator Utility
 *
 * Calculates SLA status based on current time vs deadline
 * with thresholds:
 * - Safe: 0-74% of time elapsed (green)
 * - Warning: 75-99% of time elapsed (yellow)
 * - Breached: 100%+ of time elapsed (red)
 * - Completed on time: Task completed before deadline (blue)
 * - Completed late: Task completed after deadline (gray)
 */

export type SLAStatusType =
  | 'safe'
  | 'approaching'
  | 'warning'
  | 'breached'
  | 'completed_on_time'
  | 'completed_late'
  | 'no_deadline'

export interface SLAStatus {
  /**
   * Current SLA status
   */
  status: SLAStatusType

  /**
   * Percentage of time elapsed (0-100+)
   * undefined for completed tasks or no deadline
   */
  percentElapsed?: number

  /**
   * Human-readable time remaining
   * e.g., "2 hours remaining", "3 days overdue"
   */
  timeRemaining?: string

  /**
   * Absolute time difference in milliseconds
   * Positive = time remaining
   * Negative = time overdue
   */
  timeDiffMs?: number

  /**
   * Is the SLA breached?
   */
  isBreached: boolean

  /**
   * Is the task completed?
   */
  isCompleted: boolean
}

/**
 * Calculate SLA status based on deadline and current time
 *
 * @param deadline - SLA deadline (ISO 8601 timestamp)
 * @param isCompleted - Whether the task is completed
 * @param completedAt - Task completion timestamp (ISO 8601)
 * @param now - Current time (for testing purposes, defaults to Date.now())
 * @returns SLA status object
 */
export function calculateSLAStatus(
  deadline: string | null,
  isCompleted: boolean = false,
  completedAt: string | null = null,
  now: Date = new Date(),
): SLAStatus {
  // No deadline = no SLA tracking
  if (!deadline) {
    return {
      status: 'no_deadline',
      isBreached: false,
      isCompleted,
    }
  }

  const deadlineDate = new Date(deadline)
  const currentTime = now.getTime()
  const deadlineTime = deadlineDate.getTime()

  // Task is completed
  if (isCompleted && completedAt) {
    const completedDate = new Date(completedAt)
    const completedTime = completedDate.getTime()

    const completedOnTime = completedTime <= deadlineTime

    return {
      status: completedOnTime ? 'completed_on_time' : 'completed_late',
      isBreached: !completedOnTime,
      isCompleted: true,
      timeDiffMs: deadlineTime - completedTime,
      timeRemaining: completedOnTime
        ? `Completed ${formatTimeDiff(completedTime - deadlineTime)} early`
        : `Completed ${formatTimeDiff(completedTime - deadlineTime)} late`,
    }
  }

  // Calculate time difference
  const timeDiffMs = deadlineTime - currentTime
  const isOverdue = timeDiffMs < 0

  // Calculate start time (assume SLA starts 7 days before deadline by default)
  // This is a heuristic - in a real system, you'd have a separate sla_start_time field
  const assumedStartTime = deadlineTime - 7 * 24 * 60 * 60 * 1000 // 7 days ago
  const totalSLATime = deadlineTime - assumedStartTime
  const elapsedTime = currentTime - assumedStartTime
  const percentElapsed = Math.max(0, Math.min(200, (elapsedTime / totalSLATime) * 100)) // Cap at 200%

  // Determine status based on time remaining
  let status: SLAStatusType
  const hoursRemaining = timeDiffMs / (1000 * 60 * 60)

  if (isOverdue) {
    status = 'breached'
  } else if (hoursRemaining <= 24) {
    status = 'approaching'
  } else if (percentElapsed >= 75) {
    status = 'warning'
  } else {
    status = 'safe'
  }

  return {
    status,
    percentElapsed,
    timeDiffMs,
    isBreached: isOverdue,
    isCompleted: false,
    timeRemaining: isOverdue
      ? `${formatTimeDiff(Math.abs(timeDiffMs))} overdue`
      : `${formatTimeDiff(timeDiffMs)} remaining`,
  }
}

/**
 * Format time difference in human-readable format
 *
 * @param diffMs - Time difference in milliseconds
 * @returns Human-readable string (e.g., "2 hours", "3 days")
 */
export function formatTimeDiff(diffMs: number): string {
  const absDiff = Math.abs(diffMs)

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`
  }
  if (weeks > 0) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
  }
  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }
  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  }
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`
}
