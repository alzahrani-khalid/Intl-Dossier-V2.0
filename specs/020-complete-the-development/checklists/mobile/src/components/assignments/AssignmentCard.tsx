import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Card, Text, Chip, Badge, Avatar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MobileAssignment } from '../../database/models/MobileAssignment';
import { SLACountdown } from './SLACountdown';
import { useSLACountdown } from '../../hooks/use-sla-countdown';

interface AssignmentCardProps {
  assignment: MobileAssignment;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const isRTL = i18n.language === 'ar';

  const { timeRemaining, slaColor, slaPercent } = useSLACountdown(
    assignment.slaDeadline,
    assignment.status
  );

  // Priority color mapping
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return theme.colors.error;
      case 'high':
        return '#FF6B00';
      case 'medium':
        return '#FFA726';
      case 'low':
        return theme.colors.primary;
      default:
        return theme.colors.outline;
    }
  };

  // Status icon mapping
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'clock-outline';
      case 'in_progress':
        return 'progress-clock';
      case 'completed':
        return 'check-circle';
      case 'escalated':
        return 'alert-octagon';
      default:
        return 'help-circle';
    }
  };

  // Escalation badge
  const renderEscalationBadge = () => {
    if (assignment.escalationLevel === 0) return null;

    const escalationColors = {
      1: '#FFA726', // First escalation - orange
      2: '#FF6B00', // Second escalation - dark orange
      3: theme.colors.error, // Final escalation - red
    };

    return (
      <Badge
        size={20}
        style={[
          styles.escalationBadge,
          {
            backgroundColor:
              escalationColors[assignment.escalationLevel as keyof typeof escalationColors],
          },
        ]}
      >
        {assignment.escalationLevel}
      </Badge>
    );
  };

  const handleCardPress = () => {
    navigation.navigate('AssignmentDetail', { assignmentId: assignment.id });
  };

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${t('assignments.card.accessibility_label')}: ${
        isRTL ? assignment.titleAr : assignment.titleEn
      }`}
      accessibilityHint={t('assignments.card.accessibility_hint')}
    >
      <Card
        style={[
          styles.card,
          {
            borderStartWidth: 4,
            borderStartColor: slaColor,
          },
        ]}
        mode="elevated"
        elevation={2}
      >
        <Card.Content>
          {/* Header: Title and Status */}
          <View style={styles.header} dir={isRTL ? 'rtl' : 'ltr'}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
                {isRTL ? assignment.titleAr : assignment.titleEn}
              </Text>
              {renderEscalationBadge()}
            </View>
            <MaterialCommunityIcons
              name={getStatusIcon(assignment.status)}
              size={24}
              color={theme.colors.primary}
            />
          </View>

          {/* Assignment Type and Priority */}
          <View
            style={[styles.metaRow, { marginTop: 8 }]}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <Chip
              mode="outlined"
              compact
              textStyle={styles.chipText}
              style={styles.typeChip}
            >
              {t(`assignments.types.${assignment.assignmentType}`)}
            </Chip>
            <Chip
              mode="flat"
              compact
              textStyle={[
                styles.chipText,
                { color: getPriorityColor(assignment.priority) },
              ]}
              style={[
                styles.priorityChip,
                { backgroundColor: `${getPriorityColor(assignment.priority)}15` },
              ]}
            >
              {t(`assignments.priority.${assignment.priority}`)}
            </Chip>
          </View>

          {/* SLA Countdown */}
          <View style={[styles.slaRow, { marginTop: 12 }]} dir={isRTL ? 'rtl' : 'ltr'}>
            <SLACountdown
              deadline={assignment.slaDeadline}
              slaPercent={slaPercent}
              status={assignment.status}
              compact
            />
            {assignment.wipPosition > 0 && (
              <Chip
                mode="outlined"
                compact
                icon="format-list-numbered"
                textStyle={styles.wipText}
                style={styles.wipChip}
              >
                {t('assignments.wip_position', { position: assignment.wipPosition })}
              </Chip>
            )}
          </View>

          {/* Assignment metadata */}
          <View
            style={[styles.metadataRow, { marginTop: 12 }]}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <View style={styles.metadataItem}>
              <MaterialCommunityIcons
                name="account-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
                style={{ marginEnd: 4 }}
              />
              <Text variant="bodySmall" style={styles.metadataText}>
                {assignment.assignedByName || t('assignments.system_assigned')}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={16}
                color={theme.colors.onSurfaceVariant}
                style={{ marginEnd: 4 }}
              />
              <Text variant="bodySmall" style={styles.metadataText}>
                {new Date(assignment.assignedAt).toLocaleDateString(
                  isRTL ? 'ar-SA' : 'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                  }
                )}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  escalationBadge: {
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  typeChip: {
    height: 28,
    borderRadius: 14,
  },
  priorityChip: {
    height: 28,
    borderRadius: 14,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  slaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  wipChip: {
    height: 28,
    borderRadius: 14,
  },
  wipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    color: '#666',
  },
});
