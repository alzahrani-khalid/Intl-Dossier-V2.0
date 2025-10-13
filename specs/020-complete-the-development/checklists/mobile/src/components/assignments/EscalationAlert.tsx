import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme, Avatar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EscalationAlertProps {
  assignmentId: string;
  assignmentTitle: string;
  escalationLevel: number;
  escalatedTo?: string;
  escalatedToName?: string;
  escalationReason: string;
  escalatedAt: Date;
  onAcknowledge?: () => void;
  onReassign?: () => void;
  onViewDetails?: () => void;
}

export const EscalationAlert: React.FC<EscalationAlertProps> = ({
  assignmentId,
  assignmentTitle,
  escalationLevel,
  escalatedTo,
  escalatedToName,
  escalationReason,
  escalatedAt,
  onAcknowledge,
  onReassign,
  onViewDetails,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isRTL = i18n.language === 'ar';

  const getEscalationColor = (): string => {
    switch (escalationLevel) {
      case 1:
        return '#FFA726'; // First escalation - orange
      case 2:
        return '#FF6B00'; // Second escalation - dark orange
      case 3:
        return theme.colors.error; // Final escalation - red
      default:
        return theme.colors.primary;
    }
  };

  const getEscalationIcon = (): string => {
    switch (escalationLevel) {
      case 1:
        return 'alert';
      case 2:
        return 'alert-circle';
      case 3:
        return 'alert-octagon';
      default:
        return 'information';
    }
  };

  const getEscalationTitle = (): string => {
    switch (escalationLevel) {
      case 1:
        return t('assignments.escalation.level_1_title');
      case 2:
        return t('assignments.escalation.level_2_title');
      case 3:
        return t('assignments.escalation.level_3_title');
      default:
        return t('assignments.escalation.default_title');
    }
  };

  const escalationColor = getEscalationColor();

  return (
    <Card
      style={[
        styles.card,
        {
          borderStartWidth: 4,
          borderStartColor: escalationColor,
          backgroundColor: `${escalationColor}08`,
        },
      ]}
      mode="outlined"
    >
      <Card.Content>
        {/* Alert Header */}
        <View style={styles.header} dir={isRTL ? 'rtl' : 'ltr'}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons
              name={getEscalationIcon()}
              size={24}
              color={escalationColor}
            />
            <Text variant="titleMedium" style={[styles.title, { color: escalationColor }]}>
              {getEscalationTitle()}
            </Text>
          </View>
          <View
            style={[styles.levelBadge, { backgroundColor: escalationColor }]}
          >
            <Text variant="labelSmall" style={styles.levelText}>
              L{escalationLevel}
            </Text>
          </View>
        </View>

        {/* Assignment Title */}
        <Text variant="titleSmall" style={styles.assignmentTitle} numberOfLines={2}>
          {assignmentTitle}
        </Text>

        {/* Escalation Reason */}
        <View style={[styles.reasonContainer, { marginTop: 12 }]}>
          <Text variant="bodySmall" style={styles.reasonLabel}>
            {t('assignments.escalation.reason')}:
          </Text>
          <Text variant="bodyMedium" style={styles.reasonText}>
            {escalationReason}
          </Text>
        </View>

        {/* Escalated To */}
        {escalatedTo && (
          <View style={[styles.escalatedToContainer, { marginTop: 12 }]} dir={isRTL ? 'rtl' : 'ltr'}>
            <Avatar.Text
              size={32}
              label={escalatedToName?.substring(0, 2).toUpperCase() || '??'}
              style={[styles.avatar, { backgroundColor: escalationColor }]}
            />
            <View style={styles.escalatedToInfo}>
              <Text variant="bodySmall" style={styles.escalatedToLabel}>
                {t('assignments.escalation.escalated_to')}
              </Text>
              <Text variant="bodyMedium" style={styles.escalatedToName}>
                {escalatedToName || t('assignments.escalation.supervisor')}
              </Text>
            </View>
          </View>
        )}

        {/* Escalation Time */}
        <View style={[styles.timeContainer, { marginTop: 12 }]} dir={isRTL ? 'rtl' : 'ltr'}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodySmall" style={styles.timeText}>
            {t('assignments.escalation.escalated_at', {
              time: new Date(escalatedAt).toLocaleString(
                isRTL ? 'ar-SA' : 'en-US',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                }
              ),
            })}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actions, { marginTop: 16 }]} dir={isRTL ? 'rtl' : 'ltr'}>
          {onAcknowledge && (
            <Button
              mode="contained"
              onPress={onAcknowledge}
              style={[styles.actionButton, { backgroundColor: escalationColor }]}
              contentStyle={styles.buttonContent}
            >
              {t('assignments.escalation.acknowledge')}
            </Button>
          )}
          {onReassign && (
            <Button
              mode="outlined"
              onPress={onReassign}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
              textColor={escalationColor}
            >
              {t('assignments.escalation.reassign')}
            </Button>
          )}
          {onViewDetails && (
            <Button
              mode="text"
              onPress={onViewDetails}
              contentStyle={styles.buttonContent}
              textColor={escalationColor}
            >
              {t('assignments.escalation.view_details')}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
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
    gap: 8,
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    color: '#fff',
    fontWeight: '700',
  },
  assignmentTitle: {
    fontWeight: '600',
    lineHeight: 20,
  },
  reasonContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  reasonLabel: {
    color: '#666',
    marginBottom: 4,
  },
  reasonText: {
    fontWeight: '500',
  },
  escalatedToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  avatar: {
    backgroundColor: '#666',
  },
  escalatedToInfo: {
    flex: 1,
  },
  escalatedToLabel: {
    color: '#666',
    marginBottom: 2,
  },
  escalatedToName: {
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  buttonContent: {
    height: 40,
  },
});
