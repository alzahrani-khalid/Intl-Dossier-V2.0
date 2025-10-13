import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SLACountdownProps {
  deadline: Date;
  slaPercent: number;
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  compact?: boolean;
  showProgress?: boolean;
}

export const SLACountdown: React.FC<SLACountdownProps> = ({
  deadline,
  slaPercent,
  status,
  compact = false,
  showProgress = true,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isRTL = i18n.language === 'ar';

  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [slaColor, setSlaColor] = useState<string>(theme.colors.primary);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate.getTime() - now.getTime();

      if (status === 'completed') {
        setTimeRemaining(t('assignments.sla.completed'));
        setSlaColor(theme.colors.primary);
        return;
      }

      if (diff <= 0) {
        // SLA breached
        const overdueDiff = Math.abs(diff);
        const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
          setTimeRemaining(
            t('assignments.sla.overdue_days', { count: days })
          );
        } else {
          setTimeRemaining(
            t('assignments.sla.overdue_hours', { count: hours })
          );
        }
        setSlaColor(theme.colors.error);
        return;
      }

      // Calculate remaining time
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(
          compact
            ? t('assignments.sla.days_short', { count: days })
            : t('assignments.sla.days_remaining', { count: days, hours })
        );
      } else if (hours > 0) {
        setTimeRemaining(
          compact
            ? t('assignments.sla.hours_short', { count: hours })
            : t('assignments.sla.hours_remaining', { count: hours, minutes })
        );
      } else {
        setTimeRemaining(
          compact
            ? t('assignments.sla.minutes_short', { count: minutes })
            : t('assignments.sla.minutes_remaining', { count: minutes })
        );
      }

      // Set color based on SLA percentage
      if (slaPercent > 100) {
        setSlaColor(theme.colors.error); // Breached - red
      } else if (slaPercent >= 75) {
        setSlaColor('#D32F2F'); // Critical - dark red
      } else if (slaPercent >= 50) {
        setSlaColor('#FFA726'); // Warning - orange
      } else {
        setSlaColor(theme.colors.primary); // Normal - green/blue
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline, slaPercent, status, compact, t, theme, i18n]);

  const getSLAIcon = (): string => {
    if (status === 'completed') return 'check-circle';
    if (slaPercent > 100) return 'alert-circle';
    if (slaPercent >= 75) return 'clock-alert';
    if (slaPercent >= 50) return 'clock-time-eight';
    return 'clock-outline';
  };

  const getSLALabel = (): string => {
    if (status === 'completed') return t('assignments.sla.completed');
    if (slaPercent > 100) return t('assignments.sla.breached');
    if (slaPercent >= 75) return t('assignments.sla.critical');
    if (slaPercent >= 50) return t('assignments.sla.warning');
    return t('assignments.sla.on_track');
  };

  if (compact) {
    return (
      <View style={styles.compactContainer} dir={isRTL ? 'rtl' : 'ltr'}>
        <MaterialCommunityIcons
          name={getSLAIcon()}
          size={16}
          color={slaColor}
          style={{ marginEnd: 4 }}
        />
        <Text
          variant="bodySmall"
          style={[styles.compactText, { color: slaColor }]}
        >
          {timeRemaining}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* SLA Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name={getSLAIcon()}
            size={20}
            color={slaColor}
          />
          <Text variant="titleSmall" style={[styles.label, { color: slaColor }]}>
            {getSLALabel()}
          </Text>
        </View>
        <Text variant="bodyMedium" style={[styles.timeText, { color: slaColor }]}>
          {timeRemaining}
        </Text>
      </View>

      {/* Progress Bar */}
      {showProgress && status !== 'completed' && (
        <ProgressBar
          progress={Math.min(slaPercent / 100, 1)}
          color={slaColor}
          style={[styles.progressBar, { backgroundColor: `${slaColor}20` }]}
        />
      )}

      {/* Percentage indicator */}
      {showProgress && status !== 'completed' && (
        <Text
          variant="bodySmall"
          style={[styles.percentText, { color: slaColor, textAlign: isRTL ? 'start' : 'end' }]}
        >
          {Math.round(slaPercent)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  timeText: {
    fontWeight: '600',
  },
  compactText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  percentText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
  },
});
