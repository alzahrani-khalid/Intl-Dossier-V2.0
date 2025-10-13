import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar, useTheme, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface WIPStatusProps {
  currentWIP: number;
  maxWIP: number;
  queuedCount: number;
  onViewQueue?: () => void;
}

export const WIPStatus: React.FC<WIPStatusProps> = ({
  currentWIP,
  maxWIP,
  queuedCount,
  onViewQueue,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isRTL = i18n.language === 'ar';

  const wipPercent = (currentWIP / maxWIP) * 100;
  const isAtLimit = currentWIP >= maxWIP;
  const isNearLimit = wipPercent >= 80 && wipPercent < 100;

  const getStatusColor = () => {
    if (isAtLimit) return theme.colors.error;
    if (isNearLimit) return '#FFA726';
    return theme.colors.primary;
  };

  const getStatusIcon = () => {
    if (isAtLimit) return 'alert-circle';
    if (isNearLimit) return 'alert';
    return 'checkbox-marked-circle';
  };

  const getStatusText = () => {
    if (isAtLimit) return t('assignments.wip.at_limit');
    if (isNearLimit) return t('assignments.wip.near_limit');
    return t('assignments.wip.available');
  };

  return (
    <View style={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
          <Text variant="titleSmall" style={[styles.title, { color: getStatusColor() }]}>
            {t('assignments.wip.title')}
          </Text>
        </View>
        <Text variant="bodyMedium" style={[styles.wipCount, { color: getStatusColor() }]}>
          {currentWIP} / {maxWIP}
        </Text>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        progress={Math.min(wipPercent / 100, 1)}
        color={getStatusColor()}
        style={[
          styles.progressBar,
          { backgroundColor: `${getStatusColor()}20` },
        ]}
      />

      {/* Status Text */}
      <View style={styles.statusRow}>
        <Text variant="bodySmall" style={styles.statusText}>
          {getStatusText()}
        </Text>
        <Text variant="bodySmall" style={styles.percentText}>
          {Math.round(wipPercent)}%
        </Text>
      </View>

      {/* Queued Items Indicator */}
      {queuedCount > 0 && (
        <View style={styles.queuedContainer}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodySmall" style={styles.queuedText}>
            {t('assignments.wip.queued', { count: queuedCount })}
          </Text>
          {onViewQueue && (
            <Chip
              mode="outlined"
              compact
              onPress={onViewQueue}
              textStyle={styles.viewQueueText}
              style={styles.viewQueueChip}
            >
              {t('assignments.wip.view_queue')}
            </Chip>
          )}
        </View>
      )}

      {/* Warning Message */}
      {isAtLimit && (
        <View style={[styles.warningBanner, { backgroundColor: `${theme.colors.error}15` }]}>
          <MaterialCommunityIcons
            name="information"
            size={18}
            color={theme.colors.error}
          />
          <Text
            variant="bodySmall"
            style={[styles.warningText, { color: theme.colors.error }]}
          >
            {t('assignments.wip.limit_reached_message')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '600',
  },
  wipCount: {
    fontWeight: '700',
    fontSize: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    color: '#666',
  },
  percentText: {
    color: '#666',
    fontWeight: '500',
  },
  queuedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  queuedText: {
    flex: 1,
    color: '#666',
  },
  viewQueueChip: {
    height: 28,
  },
  viewQueueText: {
    fontSize: 11,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
  },
});
