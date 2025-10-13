import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SLACountdownResult {
  timeRemaining: string;
  slaColor: string;
  slaPercent: number;
  isBreached: boolean;
  isCritical: boolean;
  isWarning: boolean;
  hoursRemaining: number;
  minutesRemaining: number;
  daysRemaining: number;
}

/**
 * T092: Implement offline SLA countdown with local timers
 *
 * This hook calculates SLA countdown timers that work offline by using local device time.
 * It updates every minute and provides color-coded status based on SLA elapsed percentage.
 */
export function useSLACountdown(
  deadline: Date,
  status: 'pending' | 'in_progress' | 'completed' | 'escalated' = 'pending'
): SLACountdownResult {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);

  // Load server time offset from storage (for clock synchronization)
  useEffect(() => {
    const loadServerTimeOffset = async () => {
      const storedOffset = await AsyncStorage.getItem('server_time_offset');
      if (storedOffset) {
        setServerTimeOffset(parseInt(storedOffset, 10));
      }
    };
    loadServerTimeOffset();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate SLA metrics
  const slaMetrics = useMemo(() => {
    // Adjust for server time offset (if available)
    const adjustedNow = currentTime + serverTimeOffset;
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - adjustedNow;

    // Calculate elapsed percentage (assuming SLA starts when assignment is created)
    // For offline calculation, we estimate based on remaining time
    const totalSLATime = 48 * 60 * 60 * 1000; // Assume 48-hour default SLA
    const elapsed = totalSLATime - diff;
    const slaPercent = (elapsed / totalSLATime) * 100;

    // Time remaining calculations
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    // Determine status flags
    const isBreached = diff <= 0;
    const isCritical = slaPercent >= 75 && !isBreached;
    const isWarning = slaPercent >= 50 && slaPercent < 75;

    // Determine color based on status and SLA percentage
    let slaColor = theme.colors.primary; // Default: green/blue

    if (status === 'completed') {
      slaColor = theme.colors.primary;
    } else if (isBreached) {
      slaColor = theme.colors.error; // Breached: red
    } else if (isCritical) {
      slaColor = '#D32F2F'; // Critical (75%+): dark red
    } else if (isWarning) {
      slaColor = '#FFA726'; // Warning (50-75%): orange
    }

    // Format time remaining string
    let timeRemaining = '';
    if (status === 'completed') {
      timeRemaining = 'Completed';
    } else if (isBreached) {
      if (days > 0) {
        timeRemaining = `Overdue by ${days}d`;
      } else if (hours > 0) {
        timeRemaining = `Overdue by ${hours}h`;
      } else {
        timeRemaining = `Overdue by ${minutes}m`;
      }
    } else {
      if (days > 0) {
        timeRemaining = `${days}d ${hours}h`;
      } else if (hours > 0) {
        timeRemaining = `${hours}h ${minutes}m`;
      } else {
        timeRemaining = `${minutes}m`;
      }
    }

    return {
      timeRemaining,
      slaColor,
      slaPercent: Math.max(0, Math.min(100, slaPercent)),
      isBreached,
      isCritical,
      isWarning,
      hoursRemaining: hours,
      minutesRemaining: minutes,
      daysRemaining: days,
    };
  }, [currentTime, deadline, status, serverTimeOffset, theme]);

  return slaMetrics;
}

/**
 * Sync server time offset for accurate offline SLA calculations
 *
 * Call this during sync operations to adjust local clock with server time
 */
export async function syncServerTimeOffset(serverTimestamp: number): Promise<void> {
  const localTime = Date.now();
  const offset = serverTimestamp - localTime;
  await AsyncStorage.setItem('server_time_offset', offset.toString());
}

/**
 * Calculate SLA deadline from creation time and SLA duration
 */
export function calculateSLADeadline(
  createdAt: Date,
  slaDurationHours: number
): Date {
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + slaDurationHours);
  return deadline;
}

/**
 * Get SLA status icon name based on metrics
 */
export function getSLAStatusIcon(metrics: SLACountdownResult): string {
  if (metrics.isBreached) return 'alert-circle';
  if (metrics.isCritical) return 'clock-alert';
  if (metrics.isWarning) return 'clock-time-eight';
  return 'clock-outline';
}

/**
 * Get SLA status label based on metrics
 */
export function getSLAStatusLabel(metrics: SLACountdownResult): string {
  if (metrics.isBreached) return 'Breached';
  if (metrics.isCritical) return 'Critical';
  if (metrics.isWarning) return 'Warning';
  return 'On Track';
}
