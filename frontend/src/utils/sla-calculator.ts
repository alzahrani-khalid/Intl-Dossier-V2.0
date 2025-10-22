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
  | 'warning'
  | 'breached'
  | 'completed_on_time'
  | 'completed_late'
  | 'no_deadline';

export interface SLAStatus {
  /**
   * Current SLA status
   */
  status: SLAStatusType;

  /**
   * Percentage of time elapsed (0-100+)
   * undefined for completed tasks or no deadline
   */
  percentElapsed?: number;

  /**
   * Human-readable time remaining
   * e.g., "2 hours remaining", "3 days overdue"
   */
  timeRemaining?: string;

  /**
   * Absolute time difference in milliseconds
   * Positive = time remaining
   * Negative = time overdue
   */
  timeDiffMs?: number;

  /**
   * Is the SLA breached?
   */
  isBreached: boolean;

  /**
   * Is the task completed?
   */
  isCompleted: boolean;
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
  now: Date = new Date()
): SLAStatus {
  // No deadline = no SLA tracking
  if (!deadline) {
    return {
      status: 'no_deadline',
      isBreached: false,
      isCompleted,
    };
  }

  const deadlineDate = new Date(deadline);
  const currentTime = now.getTime();
  const deadlineTime = deadlineDate.getTime();

  // Task is completed
  if (isCompleted && completedAt) {
    const completedDate = new Date(completedAt);
    const completedTime = completedDate.getTime();

    const completedOnTime = completedTime <= deadlineTime;

    return {
      status: completedOnTime ? 'completed_on_time' : 'completed_late',
      isBreached: !completedOnTime,
      isCompleted: true,
      timeDiffMs: deadlineTime - completedTime,
      timeRemaining: completedOnTime
        ? `Completed ${formatTimeDiff(completedTime - deadlineTime)} early`
        : `Completed ${formatTimeDiff(completedTime - deadlineTime)} late`,
    };
  }

  // Calculate time difference
  const timeDiffMs = deadlineTime - currentTime;
  const isOverdue = timeDiffMs < 0;

  // Calculate start time (assume SLA starts 7 days before deadline by default)
  // This is a heuristic - in a real system, you'd have a separate sla_start_time field
  const assumedStartTime = deadlineTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago
  const totalSLATime = deadlineTime - assumedStartTime;
  const elapsedTime = currentTime - assumedStartTime;
  const percentElapsed = Math.max(0, Math.min(200, (elapsedTime / totalSLATime) * 100)); // Cap at 200%

  // Determine status based on time remaining
  let status: SLAStatusType;

  if (isOverdue) {
    status = 'breached';
  } else if (percentElapsed >= 75) {
    status = 'warning';
  } else {
    status = 'safe';
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
  };
}

/**
 * Format time difference in human-readable format
 *
 * @param diffMs - Time difference in milliseconds
 * @returns Human-readable string (e.g., "2 hours", "3 days")
 */
export function formatTimeDiff(diffMs: number): string {
  const absDiff = Math.abs(diffMs);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  if (weeks > 0) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
}

/**
 * Check if a task is breaching SLA (for filtering)
 *
 * @param deadline - SLA deadline
 * @param isCompleted - Whether the task is completed
 * @param completedAt - Task completion timestamp
 * @returns true if SLA is currently breached (not completed and past deadline)
 */
export function isSLABreached(
  deadline: string | null,
  isCompleted: boolean = false,
  completedAt: string | null = null
): boolean {
  if (!deadline || isCompleted) {
    return false;
  }

  const status = calculateSLAStatus(deadline, isCompleted, completedAt);
  return status.isBreached;
}

/**
 * Get SLA warning threshold timestamp (75% of time elapsed)
 *
 * @param deadline - SLA deadline
 * @param startTime - SLA start time (defaults to 7 days before deadline)
 * @returns Timestamp when SLA enters warning zone
 */
export function getSLAWarningThreshold(deadline: string, startTime?: string): Date {
  const deadlineDate = new Date(deadline);
  const startDate = startTime ? new Date(startTime) : new Date(deadlineDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalTime = deadlineDate.getTime() - startDate.getTime();
  const warningThreshold = startDate.getTime() + totalTime * 0.75;

  return new Date(warningThreshold);
}

/**
 * Sort tasks by SLA urgency (most urgent first)
 *
 * Priority order:
 * 1. Breached (overdue) - sorted by most overdue first
 * 2. Warning (75%+ elapsed) - sorted by closest to deadline
 * 3. Safe (0-74% elapsed) - sorted by closest to deadline
 * 4. Completed/No deadline - sorted by completion time or created time
 *
 * @param tasks - Array of tasks to sort
 * @returns Sorted array
 */
export function sortBySLAUrgency<T extends { sla_deadline: string | null; status: string }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const statusA = calculateSLAStatus(a.sla_deadline, a.status === 'completed');
    const statusB = calculateSLAStatus(b.sla_deadline, b.status === 'completed');

    // Breached tasks first
    if (statusA.isBreached && !statusB.isBreached) return -1;
    if (!statusA.isBreached && statusB.isBreached) return 1;

    // If both breached, sort by most overdue
    if (statusA.isBreached && statusB.isBreached) {
      return (statusA.timeDiffMs || 0) - (statusB.timeDiffMs || 0);
    }

    // Warning tasks next
    if (statusA.status === 'warning' && statusB.status !== 'warning') return -1;
    if (statusA.status !== 'warning' && statusB.status === 'warning') return 1;

    // If both warning or both safe, sort by closest deadline
    if (statusA.timeDiffMs !== undefined && statusB.timeDiffMs !== undefined) {
      return statusA.timeDiffMs - statusB.timeDiffMs;
    }

    // Default: no change
    return 0;
  });
}

/**
 * Get SLA status color class for styling
 *
 * @param status - SLA status
 * @returns Tailwind color class
 */
export function getSLAColorClass(status: SLAStatusType): string {
  switch (status) {
    case 'safe':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'breached':
      return 'text-red-600 dark:text-red-400';
    case 'completed_on_time':
      return 'text-blue-600 dark:text-blue-400';
    case 'completed_late':
      return 'text-gray-600 dark:text-gray-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}
