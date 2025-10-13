import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../database';
import { MobilePushNotification } from '../database/models/MobilePushNotification';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationGroup {
  groupingKey: string;
  notifications: Notifications.Notification[];
  lastNotificationTime: number;
}

export class NotificationService {
  private static notificationGroups: Map<string, NotificationGroup> = new Map();
  private static readonly GROUPING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_GROUP_SIZE = 5;

  /**
   * T088: Add push notification handlers for assignment events
   */
  static async handleAssignmentNotification(
    notification: Notifications.Notification
  ): Promise<void> {
    const { data } = notification.request.content;
    const { category, assignment_id, assignment_type, priority, sla_deadline } = data;

    // Store notification in local database
    await database.write(async () => {
      await database.get<MobilePushNotification>('mobile_push_notifications').create(notif => {
        notif.notificationId = notification.request.identifier;
        notif.category = category || 'assignment';
        notif.priority = priority || 'normal';
        notif.titleAr = notification.request.content.title || '';
        notif.titleEn = notification.request.content.title || '';
        notif.bodyAr = notification.request.content.body || '';
        notif.bodyEn = notification.request.content.body || '';
        notif.groupingKey = `assignment-${category}`;
        notif.deepLinkUrl = `intldossier://assignment/${assignment_id}`;
        notif.deliveryStatus = 'delivered';
        notif.isActionable = category === 'assignment-new' || category === 'assignment-escalated';
        notif.deliveredAt = Date.now();
        notif._status = 'synced';
        notif._version = 1;
      });
    });

    // Handle grouping logic (T089)
    await this.groupNotifications(notification, `assignment-${category}`);
  }

  /**
   * T089: Implement notification grouping logic (>5 similar in 5min)
   */
  static async groupNotifications(
    notification: Notifications.Notification,
    groupingKey: string
  ): Promise<void> {
    const now = Date.now();
    const existingGroup = this.notificationGroups.get(groupingKey);

    if (!existingGroup) {
      // Create new group
      this.notificationGroups.set(groupingKey, {
        groupingKey,
        notifications: [notification],
        lastNotificationTime: now,
      });
      return;
    }

    // Check if within grouping window
    if (now - existingGroup.lastNotificationTime > this.GROUPING_WINDOW_MS) {
      // Window expired, create new group
      this.notificationGroups.set(groupingKey, {
        groupingKey,
        notifications: [notification],
        lastNotificationTime: now,
      });
      return;
    }

    // Add to existing group
    existingGroup.notifications.push(notification);
    existingGroup.lastNotificationTime = now;

    // If group size exceeds threshold, show summary notification
    if (existingGroup.notifications.length >= this.MAX_GROUP_SIZE) {
      await this.showSummaryNotification(existingGroup);
      // Reset group
      this.notificationGroups.delete(groupingKey);
    }
  }

  /**
   * Show summary notification for grouped notifications
   */
  private static async showSummaryNotification(group: NotificationGroup): Promise<void> {
    const count = group.notifications.length;
    const category = group.groupingKey.replace('assignment-', '');

    let title = '';
    let body = '';

    switch (category) {
      case 'new':
        title = `${count} New Assignments`;
        body = this.getSummaryBody(group.notifications);
        break;
      case 'sla-warning':
        title = `${count} SLA Warnings`;
        body = 'Multiple assignments approaching their deadlines';
        break;
      case 'escalated':
        title = `${count} Escalated Assignments`;
        body = 'Multiple assignments have been escalated';
        break;
      default:
        title = `${count} New Notifications`;
        body = 'Tap to view details';
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'summary',
          groupingKey: group.groupingKey,
          notificationIds: group.notifications.map(n => n.request.identifier),
        },
        sound: true,
        badge: count,
        categoryIdentifier: 'summary',
      },
      trigger: null, // Immediately
    });

    // Cancel individual notifications
    for (const notification of group.notifications) {
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
  }

  /**
   * Generate summary body text from grouped notifications
   */
  private static getSummaryBody(notifications: Notifications.Notification[]): string {
    const urgentCount = notifications.filter(n => n.request.content.data?.priority === 'urgent').length;
    const highCount = notifications.filter(n => n.request.content.data?.priority === 'high').length;

    if (urgentCount > 0) {
      return `${urgentCount} urgent, ${notifications.length - urgentCount} other assignments`;
    } else if (highCount > 0) {
      return `${highCount} high priority, ${notifications.length - highCount} other assignments`;
    }

    return `${notifications.length} assignments require your attention`;
  }

  /**
   * Register device for push notifications
   */
  static async registerForPushNotifications(): Promise<string> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission for push notifications not granted');
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Store device token
    await AsyncStorage.setItem('push_notification_token', token);

    return token;
  }

  /**
   * Setup notification listeners
   */
  static setupNotificationListeners(navigation: any): void {
    // Handle notification tap (app opened from notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;

      if (data.type === 'summary') {
        // Navigate to notifications list
        navigation.navigate('Notifications', { groupingKey: data.groupingKey });
      } else if (data.deep_link_url) {
        this.handleDeepLink(data.deep_link_url, navigation);
      }
    });

    // Handle foreground notifications
    Notifications.addNotificationReceivedListener(async notification => {
      const { category } = notification.request.content.data;

      if (category?.startsWith('assignment')) {
        await this.handleAssignmentNotification(notification);
      }
    });
  }

  /**
   * Handle deep link navigation
   */
  static handleDeepLink(url: string, navigation: any): void {
    // Parse deep link: intldossier://assignment/123
    const match = url.match(/intldossier:\/\/(\w+)\/(.+)/);
    if (match) {
      const [, screen, params] = match;
      navigation.navigate(screen, { id: params });
    }
  }

  /**
   * Get device ID for notification registration
   */
  static async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem('device_id');

    if (!deviceId) {
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }

    return deviceId;
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    this.notificationGroups.clear();
  }

  /**
   * Get notification count by category
   */
  static async getNotificationCount(category?: string): Promise<number> {
    const notifications = await database
      .get<MobilePushNotification>('mobile_push_notifications')
      .query(
        ...(category ? [Q.where('category', category)] : []),
        Q.where('delivery_status', Q.oneOf(['delivered', 'read']))
      )
      .fetchCount();

    return notifications;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    await database.write(async () => {
      const notification = await database
        .get<MobilePushNotification>('mobile_push_notifications')
        .find(notificationId);

      await notification.update(notif => {
        notif.deliveryStatus = 'read';
        notif.readAt = Date.now();
      });
    });
  }
}
