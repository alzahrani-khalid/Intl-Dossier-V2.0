import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Chip, useTheme, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MobileAssignment } from '../../database/models/MobileAssignment';

interface QueuedItemsProps {
  queuedAssignments: MobileAssignment[];
  onStartAssignment?: (assignment: MobileAssignment) => void;
}

export const QueuedItems: React.FC<QueuedItemsProps> = ({
  queuedAssignments,
  onStartAssignment,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isRTL = i18n.language === 'ar';

  const renderQueuedItem = ({ item, index }: { item: MobileAssignment; index: number }) => {
    const position = index + 1;
    const estimatedWaitTime = position * 30; // Assume 30 min per assignment

    return (
      <Card style={styles.queueCard} mode="outlined">
        <Card.Content>
          <View style={styles.queueHeader} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Queue Position Badge */}
            <View
              style={[
                styles.positionBadge,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text
                variant="labelLarge"
                style={[
                  styles.positionText,
                  { color: theme.colors.onPrimaryContainer },
                ]}
              >
                #{position}
              </Text>
            </View>

            {/* Title */}
            <Text variant="titleSmall" style={styles.queueTitle} numberOfLines={2}>
              {isRTL ? item.titleAr : item.titleEn}
            </Text>
          </View>

          {/* Assignment Type and Priority */}
          <View style={[styles.metaRow, { marginTop: 8 }]} dir={isRTL ? 'rtl' : 'ltr'}>
            <Chip mode="outlined" compact textStyle={styles.chipText}>
              {t(`assignments.types.${item.assignmentType}`)}
            </Chip>
            <Chip
              mode="flat"
              compact
              textStyle={styles.chipText}
              style={[
                styles.priorityChip,
                {
                  backgroundColor:
                    item.priority === 'urgent'
                      ? `${theme.colors.error}15`
                      : `${theme.colors.primary}15`,
                },
              ]}
            >
              {t(`assignments.priority.${item.priority}`)}
            </Chip>
          </View>

          {/* Estimated Wait Time */}
          <View style={[styles.waitTimeRow, { marginTop: 12 }]} dir={isRTL ? 'rtl' : 'ltr'}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodySmall" style={styles.waitTimeText}>
              {t('assignments.queue.estimated_wait', {
                hours: Math.floor(estimatedWaitTime / 60),
                minutes: estimatedWaitTime % 60,
              })}
            </Text>
          </View>

          {/* Start Button */}
          {position === 1 && onStartAssignment && (
            <Button
              mode="contained"
              onPress={() => onStartAssignment(item)}
              style={styles.startButton}
              contentStyle={styles.startButtonContent}
            >
              {t('assignments.queue.start_now')}
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (queuedAssignments.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name="checkbox-marked-circle-outline"
          size={64}
          color={theme.colors.primary}
        />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          {t('assignments.queue.empty_title')}
        </Text>
        <Text variant="bodyMedium" style={styles.emptyDescription}>
          {t('assignments.queue.empty_description')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.headerTitle}>
          {t('assignments.queue.title')}
        </Text>
        <Chip mode="outlined" compact>
          {t('assignments.queue.count', { count: queuedAssignments.length })}
        </Chip>
      </View>

      {/* Queue Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: `${theme.colors.primary}10` }]}>
        <MaterialCommunityIcons
          name="information"
          size={18}
          color={theme.colors.primary}
        />
        <Text
          variant="bodySmall"
          style={[styles.infoText, { color: theme.colors.primary }]}
        >
          {t('assignments.queue.info_message')}
        </Text>
      </View>

      {/* Queued Items List */}
      <FlatList
        data={queuedAssignments}
        renderItem={renderQueuedItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  queueCard: {
    borderRadius: 12,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    fontWeight: '700',
  },
  queueTitle: {
    flex: 1,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
  },
  priorityChip: {
    height: 28,
  },
  waitTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waitTimeText: {
    color: '#666',
  },
  startButton: {
    marginTop: 12,
  },
  startButtonContent: {
    height: 44,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
});
