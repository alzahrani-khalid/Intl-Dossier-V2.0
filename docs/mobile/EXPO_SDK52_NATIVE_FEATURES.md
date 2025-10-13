# Expo SDK 52+ Native Mobile Features Implementation Guide

**Last Updated**: 2025-01-13
**Target SDK**: Expo SDK 52+, React Native 0.76+
**Architecture**: New Architecture (required for SDK 52+)

## Table of Contents

1. [Biometric Authentication](#1-biometric-authentication)
2. [Push Notifications](#2-push-notifications)
3. [Camera Integration & Document Scanning](#3-camera-integration--document-scanning)
4. [Secure Storage](#4-secure-storage)

---

## 1. Biometric Authentication

### Overview

`expo-local-authentication` enables Face ID, Touch ID, and Android biometric authentication. It uses iOS Keychain Services and Android Keystore system for secure authentication.

### Installation

```bash
npx expo install expo-local-authentication
```

### Configuration

#### app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID for secure authentication."
        }
      ]
    ]
  }
}
```

#### Manual iOS Setup (if not using CNG)

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use FaceID for secure authentication.</string>
```

### TypeScript Types

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

// Authentication result type
interface AuthResult {
  success: boolean;
  error?: string;
  warning?: string;
}

// Security level types
type SecurityLevel = 'none' | 'biometric' | 'device_passcode' | 'both';

// Authentication types enum
enum AuthenticationType {
  FINGERPRINT = LocalAuthentication.AuthenticationType.FINGERPRINT,
  FACIAL_RECOGNITION = LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  IRIS = LocalAuthentication.AuthenticationType.IRIS,
}
```

### Implementation Patterns

#### 1. Hardware Check & Enrollment Status

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  securityLevel: LocalAuthentication.SecurityLevel;
}

/**
 * Check device biometric capabilities
 * @returns {Promise<BiometricCapabilities>} Device biometric support info
 */
export const checkBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
  try {
    // Check if hardware exists
    const hasHardware = await LocalAuthentication.hasHardwareAsync();

    // Check if user has enrolled biometrics
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    // Get supported authentication types
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    // Get security level (SDK 52+)
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      securityLevel,
    };
  } catch (error) {
    console.error('Error checking biometric capabilities:', error);
    throw error;
  }
};

/**
 * Get human-readable biometric type names
 */
export const getBiometricTypeNames = (types: LocalAuthentication.AuthenticationType[]): string[] => {
  const typeNames: Record<LocalAuthentication.AuthenticationType, string> = {
    [LocalAuthentication.AuthenticationType.FINGERPRINT]: 'Fingerprint',
    [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: 'Face ID',
    [LocalAuthentication.AuthenticationType.IRIS]: 'Iris',
  };

  return types.map(type => typeNames[type]).filter(Boolean);
};
```

#### 2. Authentication Flow

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

interface AuthenticationOptions {
  promptMessage?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  requireConfirmation?: boolean;
}

/**
 * Authenticate user with biometrics
 * @param options - Authentication configuration options
 * @returns {Promise<AuthResult>} Authentication result
 */
export const authenticateWithBiometrics = async (
  options: AuthenticationOptions = {}
): Promise<AuthResult> => {
  try {
    // Check capabilities first
    const { hasHardware, isEnrolled } = await checkBiometricCapabilities();

    if (!hasHardware) {
      return {
        success: false,
        error: 'HARDWARE_NOT_AVAILABLE',
      };
    }

    if (!isEnrolled) {
      return {
        success: false,
        error: 'NO_BIOMETRICS_ENROLLED',
      };
    }

    // Perform authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options.promptMessage || 'Authenticate to continue',
      cancelLabel: options.cancelLabel || 'Cancel',
      disableDeviceFallback: options.disableDeviceFallback ?? false,
      requireConfirmation: options.requireConfirmation ?? false,
    });

    if (result.success) {
      return { success: true };
    } else {
      // Handle failure reasons
      return {
        success: false,
        error: result.error || 'AUTHENTICATION_FAILED',
        warning: result.warning,
      };
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
    };
  }
};
```

#### 3. Complete Biometric Hook

```typescript
import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface UseBiometricAuthReturn {
  isAvailable: boolean;
  isEnabled: boolean;
  biometricTypes: string[];
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<boolean>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
}

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

/**
 * React hook for biometric authentication management
 */
export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check biometric availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        setIsLoading(true);
        const capabilities = await checkBiometricCapabilities();

        setIsAvailable(capabilities.hasHardware && capabilities.isEnrolled);
        setBiometricTypes(getBiometricTypeNames(capabilities.supportedTypes));

        // Check if user has enabled biometric auth
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        setIsEnabled(enabled === 'true');
      } catch (err) {
        setError('Failed to check biometric availability');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, []);

  /**
   * Authenticate user with biometrics
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isAvailable || !isEnabled) {
      return false;
    }

    setError(null);
    const result = await authenticateWithBiometrics({
      promptMessage: 'Authenticate to access secure content',
      cancelLabel: 'Use Password',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      setError(result.error || 'Authentication failed');
      return false;
    }

    return true;
  }, [isAvailable, isEnabled]);

  /**
   * Enable biometric authentication
   */
  const enableBiometric = useCallback(async () => {
    if (!isAvailable) {
      throw new Error('Biometric authentication not available');
    }

    // Require authentication before enabling
    const result = await authenticateWithBiometrics({
      promptMessage: 'Authenticate to enable biometric login',
    });

    if (result.success) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      setIsEnabled(true);
    } else {
      throw new Error(result.error || 'Authentication failed');
    }
  }, [isAvailable]);

  /**
   * Disable biometric authentication
   */
  const disableBiometric = useCallback(async () => {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    setIsEnabled(false);
  }, []);

  return {
    isAvailable,
    isEnabled,
    biometricTypes,
    isLoading,
    error,
    authenticate,
    enableBiometric,
    disableBiometric,
  };
};
```

#### 4. Usage Example: App Unlock Screen

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface AppLockScreenProps {
  onUnlock: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlock }) => {
  const {
    isAvailable,
    isEnabled,
    biometricTypes,
    isLoading,
    error,
    authenticate,
  } = useBiometricAuth();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Auto-trigger biometric authentication on mount
    if (isAvailable && isEnabled && !isLoading) {
      handleBiometricAuth();
    }
  }, [isAvailable, isEnabled, isLoading]);

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    const success = await authenticate();
    setIsAuthenticating(false);

    if (success) {
      onUnlock();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Locked</Text>

      {isAvailable && isEnabled ? (
        <>
          <Text style={styles.text}>
            Unlock with {biometricTypes.join(' or ')}
          </Text>
          <Button
            title={isAuthenticating ? 'Authenticating...' : 'Unlock'}
            onPress={handleBiometricAuth}
            disabled={isAuthenticating}
          />
        </>
      ) : (
        <Text style={styles.text}>
          Please use your passcode to unlock
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
});
```

### Best Practices

1. **Always check hardware and enrollment** before attempting authentication
2. **Store biometric preference** in SecureStore, not AsyncStorage
3. **Provide fallback options** (passcode) when biometric fails
4. **Don't disable device fallback** unless you have your own fallback UI
5. **Handle errors gracefully** - users may cancel or authentication may fail
6. **Test on physical devices** - biometrics don't work in simulators/emulators

### Error Handling

```typescript
const handleBiometricError = (error: string) => {
  switch (error) {
    case 'HARDWARE_NOT_AVAILABLE':
      return 'This device does not support biometric authentication';
    case 'NO_BIOMETRICS_ENROLLED':
      return 'Please set up biometric authentication in device settings';
    case 'AUTHENTICATION_FAILED':
      return 'Authentication failed. Please try again';
    case 'USER_CANCEL':
      return 'Authentication cancelled';
    case 'SYSTEM_CANCEL':
      return 'Authentication cancelled by system';
    case 'LOCKOUT':
      return 'Too many failed attempts. Please use your passcode';
    default:
      return 'An unexpected error occurred';
  }
};
```

---

## 2. Push Notifications

### Overview

`expo-notifications` provides comprehensive push notification support using Expo Push Service, Firebase Cloud Messaging (Android), and Apple Push Notification Service (iOS).

### Installation

```bash
npx expo install expo-notifications expo-device expo-constants
```

### Configuration

#### app.json

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.yourcompany.intldossier"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.intldossier"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### TypeScript Types

```typescript
import * as Notifications from 'expo-notifications';

// Notification categories for the app
export enum NotificationCategory {
  ASSIGNMENTS = 'assignments',
  DEADLINES = 'deadlines',
  INTAKE_REQUESTS = 'intake_requests',
  DELEGATION_EXPIRING = 'delegation_expiring',
  DOSSIER_COMMENTS = 'dossier_comments',
}

// Notification data payload
export interface NotificationData {
  type: NotificationCategory;
  id: string;
  title: string;
  body: string;
  deepLink?: string;
  metadata?: Record<string, any>;
}

// Device token registration payload
export interface DeviceTokenPayload {
  token: string;
  deviceId: string;
  platform: 'ios' | 'android';
  categories: NotificationCategory[];
}
```

### Implementation Patterns

#### 1. Notification Handler Configuration

```typescript
import * as Notifications from 'expo-notifications';

/**
 * Configure global notification handler
 * This determines how notifications are displayed when app is foregrounded
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Get notification category
    const category = notification.request.content.data?.type as NotificationCategory;

    // Customize behavior based on category
    const shouldShowBanner = true;
    const shouldPlaySound = category === NotificationCategory.DEADLINES;
    const shouldSetBadge = true;

    return {
      shouldShowBanner,
      shouldPlaySound,
      shouldSetBadge,
      shouldShowList: true,
    };
  },
});
```

#### 2. Permission Request & Token Registration

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface PushTokenResult {
  token: string | null;
  error?: string;
}

/**
 * Request notification permissions and register device token
 * @returns {Promise<PushTokenResult>} Expo push token or error
 */
export const registerForPushNotificationsAsync = async (): Promise<PushTokenResult> => {
  try {
    // Must use physical device for push notifications
    if (!Device.isDevice) {
      return {
        token: null,
        error: 'Push notifications require a physical device',
      };
    }

    // Set up Android notification channel (required for Android 8.0+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      // Create category-specific channels
      await setupNotificationChannels();
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return {
        token: null,
        error: 'Permission not granted for push notifications',
      };
    }

    // Get Expo push token
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      throw new Error('Project ID not found');
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return { token: tokenData.data };
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return {
      token: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Set up category-specific notification channels for Android
 */
const setupNotificationChannels = async () => {
  const channels = [
    {
      id: NotificationCategory.ASSIGNMENTS,
      name: 'Assignments',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    },
    {
      id: NotificationCategory.DEADLINES,
      name: 'Deadlines',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'urgent',
      vibrationPattern: [0, 500, 250, 500],
    },
    {
      id: NotificationCategory.INTAKE_REQUESTS,
      name: 'Intake Requests',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    },
    {
      id: NotificationCategory.DELEGATION_EXPIRING,
      name: 'Delegation Expiring',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    },
    {
      id: NotificationCategory.DOSSIER_COMMENTS,
      name: 'Comments',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null, // Silent
    },
  ];

  for (const channel of channels) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      importance: channel.importance,
      sound: channel.sound || undefined,
      vibrationPattern: channel.vibrationPattern,
      lightColor: '#FF231F7C',
    });
  }
};
```

#### 3. Notification Listeners

```typescript
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';

interface UseNotificationsParams {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void;
}

/**
 * React hook to set up notification listeners
 */
export const useNotifications = ({
  onNotificationReceived,
  onNotificationTapped,
}: UseNotificationsParams) => {
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        onNotificationReceived?.(notification);

        // Update badge count
        updateBadgeCount(1);
      }
    );

    // Listen for user tapping on notifications (works in all app states)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        onNotificationTapped?.(response);

        // Handle deep link
        handleNotificationDeepLink(response);
      }
    );

    // Handle notifications received while app was killed
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log('Last notification response:', response);
        onNotificationTapped?.(response);
        handleNotificationDeepLink(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [onNotificationReceived, onNotificationTapped]);
};

/**
 * Update app badge count
 */
const updateBadgeCount = async (increment: number) => {
  const currentBadge = await Notifications.getBadgeCountAsync();
  await Notifications.setBadgeCountAsync(currentBadge + increment);
};

/**
 * Clear app badge count
 */
export const clearBadgeCount = async () => {
  await Notifications.setBadgeCountAsync(0);
};
```

#### 4. Deep Linking with React Navigation

```typescript
import { useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

// Deep link configuration for React Navigation
export const linking = {
  prefixes: ['intldossier://', 'https://app.intldossier.com'],
  config: {
    screens: {
      Home: 'home',
      Dossiers: {
        screens: {
          DossierDetail: 'dossier/:id',
          DossierComments: 'dossier/:id/comments',
        },
      },
      Intake: {
        screens: {
          IntakeDetail: 'intake/:id',
        },
      },
      Assignments: {
        screens: {
          AssignmentDetail: 'assignment/:id',
        },
      },
    },
  },

  /**
   * Handle initial URL when app is opened from killed state
   */
  async getInitialURL() {
    // Check if app was opened by a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }

    // Check if app was opened by a notification
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification.request.content.data?.deepLink as string | null;
  },

  /**
   * Subscribe to URL changes (deep links and notifications)
   */
  subscribe(listener: (url: string) => void) {
    // Listen to incoming links from deep links
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    // Listen to expo push notifications
    const notificationSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.deepLink as string;
        if (url) {
          listener(url);
        }
      });

    return () => {
      linkingSubscription.remove();
      notificationSubscription.remove();
    };
  },
};

/**
 * Handle notification deep link navigation
 */
export const handleNotificationDeepLink = (
  response: Notifications.NotificationResponse
) => {
  const data = response.notification.request.content.data as NotificationData;
  const { type, id, deepLink } = data;

  if (deepLink) {
    Linking.openURL(deepLink);
    return;
  }

  // Fallback: construct deep link based on notification type
  let url = '';
  switch (type) {
    case NotificationCategory.ASSIGNMENTS:
      url = `intldossier://assignment/${id}`;
      break;
    case NotificationCategory.INTAKE_REQUESTS:
      url = `intldossier://intake/${id}`;
      break;
    case NotificationCategory.DOSSIER_COMMENTS:
      url = `intldossier://dossier/${id}/comments`;
      break;
    case NotificationCategory.DELEGATION_EXPIRING:
      url = `intldossier://delegations`;
      break;
    default:
      url = 'intldossier://home';
  }

  Linking.openURL(url);
};
```

#### 5. Complete Push Notification Hook

```typescript
import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { api } from '@/services/api';

interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  scheduleLocalNotification: (data: NotificationData) => Promise<string>;
  clearAllNotifications: () => Promise<void>;
}

/**
 * React hook for push notification management
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Register for push notifications on mount
  useEffect(() => {
    registerDevice();
  }, []);

  // Set up notification listeners
  useNotifications({
    onNotificationReceived: (notification) => {
      setNotification(notification);
    },
    onNotificationTapped: (response) => {
      console.log('User tapped notification:', response);
    },
  });

  /**
   * Register device for push notifications
   */
  const registerDevice = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await registerForPushNotificationsAsync();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.token) {
        setExpoPushToken(result.token);

        // Send token to backend
        await api.post('/notifications/register-device', {
          token: result.token,
          deviceId: Constants.installationId,
          platform: Platform.OS,
          categories: Object.values(NotificationCategory),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register device');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh push token (call when user logs in/out)
   */
  const refreshToken = useCallback(async () => {
    await registerDevice();
  }, []);

  /**
   * Schedule a local notification
   */
  const scheduleLocalNotification = useCallback(
    async (data: NotificationData): Promise<string> => {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data,
          sound: 'default',
          badge: 1,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId: data.type, // Use category as channel ID
        },
      });

      return notificationId;
    },
    []
  );

  /**
   * Clear all delivered notifications
   */
  const clearAllNotifications = useCallback(async () => {
    await Notifications.dismissAllNotificationsAsync();
    await clearBadgeCount();
  }, []);

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
    refreshToken,
    scheduleLocalNotification,
    clearAllNotifications,
  };
};
```

#### 6. Backend Integration: Send Push Notification

```typescript
// Backend Edge Function: supabase/functions/push-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface PushNotificationRequest {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  category?: string;
}

serve(async (req) => {
  try {
    const { userIds, title, body, data, category } = await req.json() as PushNotificationRequest;

    // Fetch device tokens from database
    const { data: devices, error } = await supabase
      .from('user_device_tokens')
      .select('token, platform')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (error) throw error;

    // Send notifications via Expo Push Service
    const messages = devices.map((device) => ({
      to: device.token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        type: category,
      },
      channelId: category, // Android notification channel
      priority: 'high',
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const receipts = await response.json();

    return new Response(JSON.stringify({ success: true, receipts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### Best Practices

1. **Always request permissions explicitly** and explain why
2. **Set up notification channels** for Android before getting token
3. **Register device token with backend** after successful permission grant
4. **Handle all app states**: foreground, background, killed
5. **Implement deep linking** for notification taps
6. **Categorize notifications** for user preference management
7. **Test on physical devices** - push notifications don't work in simulators
8. **Implement badge count management** to keep UI in sync
9. **Handle token refresh** when user logs in/out
10. **Validate receipts** on backend to detect invalid/expired tokens

---

## 3. Camera Integration & Document Scanning

### Overview

Camera integration for document scanning combines `expo-camera` for capturing images, `expo-image-manipulator` for processing, and optional OCR libraries for text extraction.

### Installation

```bash
# Core camera and image processing
npx expo install expo-camera expo-image-manipulator expo-image-picker

# Optional: Document picker (fallback)
npx expo install expo-document-picker

# Optional: OCR (choose one)
npx expo install expo-ocr  # Community package for on-device OCR
# OR use cloud service (Google Cloud Vision API, AWS Textract)
```

### Configuration

#### app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan documents.",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone for video recording.",
          "recordAudioAndroid": false
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos to upload documents."
        }
      ]
    ]
  }
}
```

### TypeScript Types

```typescript
import { CameraType } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

export interface CapturedDocument {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  fileSize?: number;
  mimeType: string;
}

export interface DocumentScanResult extends CapturedDocument {
  processedUri: string;
  ocrText?: string;
  confidence?: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks?: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}
```

### Implementation Patterns

#### 1. Camera Permission Management

```typescript
import { Camera, CameraType, PermissionStatus } from 'expo-camera';
import { Alert } from 'react-native';

interface CameraPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: PermissionStatus;
}

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async (): Promise<CameraPermissions> => {
  try {
    const { status, canAskAgain, granted } = await Camera.requestCameraPermissionsAsync();

    if (!granted) {
      if (!canAskAgain) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to scan documents.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    }

    return { granted, canAskAgain, status };
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return { granted: false, canAskAgain: false, status: PermissionStatus.UNDETERMINED };
  }
};

/**
 * Check camera permissions
 */
export const checkCameraPermissions = async (): Promise<boolean> => {
  const { status } = await Camera.getCameraPermissionsAsync();
  return status === PermissionStatus.GRANTED;
};
```

#### 2. Document Capture Component

```typescript
import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';

interface DocumentCaptureProps {
  onCapture: (result: CapturedDocument) => void;
  onCancel: () => void;
}

export const DocumentCapture: React.FC<DocumentCaptureProps> = ({
  onCapture,
  onCancel,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Camera access is required to scan documents
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: true,
      });

      if (photo) {
        const document: CapturedDocument = {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          mimeType: 'image/jpeg',
        };

        onCapture(document);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Overlay guide for document alignment */}
        <View style={styles.overlay}>
          <View style={styles.documentGuide} />
          <Text style={styles.guideText}>
            Align document within the frame
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={onCancel}>
            <MaterialIcons name="close" size={32} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.capturingButton]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color="white" />
            ) : (
              <MaterialIcons name="camera" size={48} color="white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <MaterialIcons name="flip-camera-ios" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  message: {
    color: 'white',
    textAlign: 'center',
    paddingBottom: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentGuide: {
    width: '85%',
    aspectRatio: 1.4, // A4 ratio
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  guideText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  capturingButton: {
    opacity: 0.7,
  },
});
```

#### 3. Image Processing & Compression

```typescript
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 2048;

/**
 * Process captured document image
 * - Auto-crop (perspective correction)
 * - Resize to max dimensions
 * - Compress to target file size
 */
export const processDocumentImage = async (
  uri: string
): Promise<CapturedDocument> => {
  try {
    // Get image info
    const imageInfo = await FileSystem.getInfoAsync(uri);
    const initialSize = (imageInfo as any).size || 0;

    // Initialize manipulator
    const context = ImageManipulator.useImageManipulator(uri);

    // Get image dimensions
    const asset = await context.renderAsync();
    let { width, height } = asset;

    // Resize if too large
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);

      context.resize({ width, height });
    }

    // Auto-enhance (optional)
    // context.rotate(0); // Correct rotation if needed
    // context.flip(FlipType.Vertical); // Mirror if needed

    // Render and save
    const processed = await context.renderAsync();

    // Determine compression quality based on file size
    let quality = 0.9;
    let result = await processed.saveAsync({
      format: ImageManipulator.SaveFormat.JPEG,
      compress: quality,
    });

    // Iteratively compress until under size limit
    while (result.fileSize && result.fileSize > MAX_FILE_SIZE && quality > 0.3) {
      quality -= 0.1;
      result = await processed.saveAsync({
        format: ImageManipulator.SaveFormat.JPEG,
        compress: quality,
      });
    }

    console.log(
      `Processed image: ${initialSize} -> ${result.fileSize} bytes (quality: ${quality})`
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      fileSize: result.fileSize,
      mimeType: 'image/jpeg',
    };
  } catch (error) {
    console.error('Error processing document image:', error);
    throw error;
  }
};

/**
 * Apply perspective correction to document image
 * (Simplified version - for production, use a library like opencv-js)
 */
export const applyPerspectiveCorrection = async (
  uri: string,
  corners: { x: number; y: number }[]
): Promise<string> => {
  // This is a placeholder - implement actual perspective transform
  // using a library like opencv-js or react-native-perspective-image-cropper

  // For now, return original URI
  console.warn('Perspective correction not implemented');
  return uri;
};
```

#### 4. Gallery Fallback (Document Picker)

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

/**
 * Pick image from gallery as fallback to camera
 */
export const pickImageFromGallery = async (): Promise<CapturedDocument | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable photo library access to upload documents.'
      );
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
      exif: true,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

/**
 * Pick document (PDF, images) from device
 */
export const pickDocument = async (): Promise<CapturedDocument | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      width: 0, // Unknown for PDF
      height: 0,
      fileSize: asset.size,
      mimeType: asset.mimeType || 'application/pdf',
    };
  } catch (error) {
    console.error('Error picking document:', error);
    return null;
  }
};
```

#### 5. OCR Integration

```typescript
/**
 * Option 1: On-Device OCR (expo-ocr - community package)
 */
import * as OCR from 'expo-ocr';

export const performOnDeviceOCR = async (uri: string): Promise<OCRResult> => {
  try {
    const result = await OCR.recognizeAsync(uri, {
      language: 'en', // or 'ar' for Arabic
    });

    return {
      text: result.text,
      confidence: result.confidence || 0,
      blocks: result.blocks?.map((block: any) => ({
        text: block.text,
        boundingBox: block.boundingBox,
        confidence: block.confidence,
      })),
    };
  } catch (error) {
    console.error('On-device OCR error:', error);
    throw error;
  }
};

/**
 * Option 2: Google Cloud Vision API (cloud-based)
 */
const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

export const performCloudOCR = async (uri: string): Promise<OCRResult> => {
  try {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Call Google Cloud Vision API
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const textAnnotations = data.responses[0].textAnnotations || [];

    if (textAnnotations.length === 0) {
      return { text: '', confidence: 0 };
    }

    // First annotation contains full text
    const fullText = textAnnotations[0].description;

    // Remaining annotations are individual blocks
    const blocks = textAnnotations.slice(1).map((annotation: any) => ({
      text: annotation.description,
      boundingBox: {
        x: annotation.boundingPoly.vertices[0].x,
        y: annotation.boundingPoly.vertices[0].y,
        width: annotation.boundingPoly.vertices[2].x - annotation.boundingPoly.vertices[0].x,
        height: annotation.boundingPoly.vertices[2].y - annotation.boundingPoly.vertices[0].y,
      },
      confidence: annotation.confidence || 0,
    }));

    return {
      text: fullText,
      confidence: textAnnotations[0].confidence || 0,
      blocks,
    };
  } catch (error) {
    console.error('Cloud OCR error:', error);
    throw error;
  }
};

/**
 * Perform OCR with fallback
 */
export const performOCR = async (uri: string): Promise<OCRResult> => {
  // Try on-device OCR first (faster, free)
  try {
    return await performOnDeviceOCR(uri);
  } catch (error) {
    console.warn('On-device OCR failed, falling back to cloud:', error);

    // Fallback to cloud OCR
    return await performCloudOCR(uri);
  }
};
```

#### 6. Complete Document Scanning Hook

```typescript
import { useState, useCallback } from 'react';

interface UseDocumentScannerReturn {
  isScanning: boolean;
  isProcessing: boolean;
  error: string | null;
  capturedDocument: DocumentScanResult | null;
  startScan: () => void;
  cancelScan: () => void;
  pickFromGallery: () => Promise<void>;
  retakeScan: () => void;
  confirmScan: () => void;
}

export const useDocumentScanner = (
  onComplete: (result: DocumentScanResult) => void
): UseDocumentScannerReturn => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedDocument, setCapturedDocument] = useState<DocumentScanResult | null>(null);

  const startScan = useCallback(() => {
    setIsScanning(true);
    setError(null);
  }, []);

  const cancelScan = useCallback(() => {
    setIsScanning(false);
    setCapturedDocument(null);
  }, []);

  const handleCapture = useCallback(async (document: CapturedDocument) => {
    try {
      setIsScanning(false);
      setIsProcessing(true);
      setError(null);

      // Process image
      const processed = await processDocumentImage(document.uri);

      // Perform OCR (optional)
      let ocrResult: OCRResult | null = null;
      try {
        ocrResult = await performOCR(processed.uri);
      } catch (ocrError) {
        console.warn('OCR failed, continuing without text extraction:', ocrError);
      }

      const result: DocumentScanResult = {
        ...processed,
        processedUri: processed.uri,
        ocrText: ocrResult?.text,
        confidence: ocrResult?.confidence,
      };

      setCapturedDocument(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    const document = await pickImageFromGallery();
    if (document) {
      await handleCapture(document);
    }
  }, [handleCapture]);

  const retakeScan = useCallback(() => {
    setCapturedDocument(null);
    setIsScanning(true);
  }, []);

  const confirmScan = useCallback(() => {
    if (capturedDocument) {
      onComplete(capturedDocument);
      setCapturedDocument(null);
    }
  }, [capturedDocument, onComplete]);

  return {
    isScanning,
    isProcessing,
    error,
    capturedDocument,
    startScan,
    cancelScan,
    pickFromGallery,
    retakeScan,
    confirmScan,
  };
};
```

### Best Practices

1. **Always request permissions** before accessing camera
2. **Provide gallery fallback** for users who can't/won't use camera
3. **Compress images** to reduce upload size and bandwidth
4. **Guide users** with overlay frame for document alignment
5. **Handle errors gracefully** - camera can fail in various ways
6. **Test on physical devices** - camera doesn't work in simulators
7. **Consider OCR costs** - cloud APIs charge per request
8. **Cache processed images** to avoid re-processing
9. **Support multiple document types** (images, PDFs)
10. **Implement retry logic** for network-dependent operations

---

## 4. Secure Storage

### Overview

`expo-secure-store` provides encrypted key-value storage using iOS Keychain Services and Android Keystore system. Essential for storing sensitive data like JWT tokens, refresh tokens, and biometric keys.

### Installation

```bash
npx expo install expo-secure-store
```

### Configuration

#### app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-secure-store",
        {
          "configureAndroidBackup": true,
          "faceIDPermission": "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
        }
      ]
    ],
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

#### Android Backup Configuration

For Android 11 and lower, exclude SecureStore from backups:

```xml
<!-- android/app/src/main/res/xml/backup_rules.xml -->
<full-backup-content>
  <include domain="sharedpref" path="."/>
  <exclude domain="sharedpref" path="SecureStore"/>
</full-backup-content>
```

### TypeScript Types

```typescript
import * as SecureStore from 'expo-secure-store';

// Storage keys enum
export enum SecureStorageKey {
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_ID = 'user_id',
  BIOMETRIC_KEY = 'biometric_key',
  DEVICE_ID = 'device_id',
  SESSION_ID = 'session_id',
}

// Storage options
export interface SecureStorageOptions {
  keychainService?: string;
  keychainAccessible?: SecureStore.KeychainAccessibilityConstant;
}
```

### Implementation Patterns

#### 1. Basic Storage Operations

```typescript
import * as SecureStore from 'expo-secure-store';

/**
 * Store a value securely
 */
export const securelyStore = async (
  key: string,
  value: string,
  options?: SecureStorageOptions
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainService: options?.keychainService,
      keychainAccessible: options?.keychainAccessible ||
        SecureStore.AFTER_FIRST_UNLOCK,
    });
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
    throw error;
  }
};

/**
 * Retrieve a value securely
 */
export const securelyRetrieve = async (
  key: string,
  options?: SecureStorageOptions
): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(key, {
      keychainService: options?.keychainService,
    });
    return value;
  } catch (error) {
    console.error(`Error retrieving ${key}:`, error);
    return null;
  }
};

/**
 * Delete a value securely
 */
export const securelyDelete = async (
  key: string,
  options?: SecureStorageOptions
): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key, {
      keychainService: options?.keychainService,
    });
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
    throw error;
  }
};
```

#### 2. Token Management Service

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Token storage service for JWT authentication
 */
export class TokenStorageService {
  private static readonly ACCESS_TOKEN_KEY = SecureStorageKey.ACCESS_TOKEN;
  private static readonly REFRESH_TOKEN_KEY = SecureStorageKey.REFRESH_TOKEN;
  private static readonly EXPIRES_AT_KEY = 'token_expires_at';

  /**
   * Store authentication tokens
   */
  static async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await Promise.all([
        securelyStore(this.ACCESS_TOKEN_KEY, tokens.accessToken),
        securelyStore(this.REFRESH_TOKEN_KEY, tokens.refreshToken),
        securelyStore(this.EXPIRES_AT_KEY, tokens.expiresAt.toString()),
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Retrieve authentication tokens
   */
  static async getTokens(): Promise<AuthTokens | null> {
    try {
      const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
        securelyRetrieve(this.ACCESS_TOKEN_KEY),
        securelyRetrieve(this.REFRESH_TOKEN_KEY),
        securelyRetrieve(this.EXPIRES_AT_KEY),
      ]);

      if (!accessToken || !refreshToken || !expiresAtStr) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiresAtStr, 10),
      };
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return null;
    }
  }

  /**
   * Get access token (most common operation)
   */
  static async getAccessToken(): Promise<string | null> {
    return await securelyRetrieve(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    return await securelyRetrieve(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if access token is expired
   */
  static async isTokenExpired(): Promise<boolean> {
    const expiresAtStr = await securelyRetrieve(this.EXPIRES_AT_KEY);
    if (!expiresAtStr) return true;

    const expiresAt = parseInt(expiresAtStr, 10);
    return Date.now() >= expiresAt;
  }

  /**
   * Update access token (after refresh)
   */
  static async updateAccessToken(
    accessToken: string,
    expiresAt: number
  ): Promise<void> {
    await Promise.all([
      securelyStore(this.ACCESS_TOKEN_KEY, accessToken),
      securelyStore(this.EXPIRES_AT_KEY, expiresAt.toString()),
    ]);
  }

  /**
   * Clear all tokens (logout)
   */
  static async clearTokens(): Promise<void> {
    await Promise.all([
      securelyDelete(this.ACCESS_TOKEN_KEY),
      securelyDelete(this.REFRESH_TOKEN_KEY),
      securelyDelete(this.EXPIRES_AT_KEY),
    ]);
  }

  /**
   * Check if user has valid tokens
   */
  static async hasValidTokens(): Promise<boolean> {
    const tokens = await this.getTokens();
    if (!tokens) return false;

    return Date.now() < tokens.expiresAt;
  }
}
```

#### 3. Secure User Data Storage

```typescript
interface UserSession {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  lastLoginAt: number;
}

/**
 * User session storage service
 */
export class UserSessionService {
  private static readonly SESSION_KEY = 'user_session';

  /**
   * Store user session data
   */
  static async storeSession(session: UserSession): Promise<void> {
    try {
      const sessionJson = JSON.stringify(session);
      await securelyStore(this.SESSION_KEY, sessionJson, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  }

  /**
   * Retrieve user session data
   */
  static async getSession(): Promise<UserSession | null> {
    try {
      const sessionJson = await securelyRetrieve(this.SESSION_KEY);
      if (!sessionJson) return null;

      return JSON.parse(sessionJson) as UserSession;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  }

  /**
   * Update session field
   */
  static async updateSession(
    updates: Partial<UserSession>
  ): Promise<void> {
    const currentSession = await this.getSession();
    if (!currentSession) {
      throw new Error('No active session to update');
    }

    const updatedSession = { ...currentSession, ...updates };
    await this.storeSession(updatedSession);
  }

  /**
   * Clear user session (logout)
   */
  static async clearSession(): Promise<void> {
    await securelyDelete(this.SESSION_KEY);
  }

  /**
   * Check if user session exists
   */
  static async hasActiveSession(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }
}
```

#### 4. Biometric Key Storage

```typescript
/**
 * Biometric authentication key storage
 * Used to validate biometric authentication attempts
 */
export class BiometricKeyService {
  private static readonly BIOMETRIC_KEY = SecureStorageKey.BIOMETRIC_KEY;
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

  /**
   * Generate and store biometric key
   */
  static async enableBiometric(userId: string): Promise<string> {
    try {
      // Generate a unique key for this user + device
      const key = `${userId}_${Date.now()}_${Math.random().toString(36)}`;

      await securelyStore(this.BIOMETRIC_KEY, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });

      await securelyStore(this.BIOMETRIC_ENABLED_KEY, 'true');

      return key;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  }

  /**
   * Validate biometric key
   */
  static async validateBiometricKey(): Promise<boolean> {
    try {
      const key = await securelyRetrieve(this.BIOMETRIC_KEY);
      return key !== null;
    } catch (error) {
      console.error('Error validating biometric key:', error);
      return false;
    }
  }

  /**
   * Get biometric key
   */
  static async getBiometricKey(): Promise<string | null> {
    return await securelyRetrieve(this.BIOMETRIC_KEY);
  }

  /**
   * Check if biometric is enabled
   */
  static async isBiometricEnabled(): Promise<boolean> {
    const enabled = await securelyRetrieve(this.BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  }

  /**
   * Disable biometric authentication
   */
  static async disableBiometric(): Promise<void> {
    await Promise.all([
      securelyDelete(this.BIOMETRIC_KEY),
      securelyDelete(this.BIOMETRIC_ENABLED_KEY),
    ]);
  }
}
```

#### 5. Complete Secure Storage Hook

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseSecureStorageReturn<T> {
  value: T | null;
  isLoading: boolean;
  error: string | null;
  setValue: (newValue: T) => Promise<void>;
  deleteValue: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * React hook for secure storage management
 */
export const useSecureStorage = <T = string>(
  key: string,
  options?: {
    parseJSON?: boolean;
    keychainService?: string;
  }
): UseSecureStorageReturn<T> => {
  const [value, setValueState] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load value on mount
  useEffect(() => {
    loadValue();
  }, [key]);

  /**
   * Load value from secure storage
   */
  const loadValue = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedValue = await securelyRetrieve(key, {
        keychainService: options?.keychainService,
      });

      if (storedValue === null) {
        setValueState(null);
        return;
      }

      if (options?.parseJSON) {
        setValueState(JSON.parse(storedValue) as T);
      } else {
        setValueState(storedValue as T);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load value');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Store value in secure storage
   */
  const setValue = useCallback(
    async (newValue: T) => {
      try {
        setError(null);

        const valueToStore = options?.parseJSON
          ? JSON.stringify(newValue)
          : (newValue as unknown as string);

        await securelyStore(key, valueToStore, {
          keychainService: options?.keychainService,
        });

        setValueState(newValue);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to store value');
        console.error(err);
        throw err;
      }
    },
    [key, options]
  );

  /**
   * Delete value from secure storage
   */
  const deleteValue = useCallback(async () => {
    try {
      setError(null);
      await securelyDelete(key, {
        keychainService: options?.keychainService,
      });
      setValueState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete value');
      console.error(err);
      throw err;
    }
  }, [key, options]);

  /**
   * Refresh value from storage
   */
  const refresh = useCallback(async () => {
    await loadValue();
  }, []);

  return {
    value,
    isLoading,
    error,
    setValue,
    deleteValue,
    refresh,
  };
};
```

#### 6. Migration from AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Migrate sensitive data from AsyncStorage to SecureStore
 * Call this once after updating to secure storage
 */
export const migrateSensitiveDataToSecureStore = async () => {
  const keysToMigrate = [
    'access_token',
    'refresh_token',
    'user_id',
    'session_id',
  ];

  try {
    for (const key of keysToMigrate) {
      // Get value from AsyncStorage
      const value = await AsyncStorage.getItem(key);

      if (value !== null) {
        // Store in SecureStore
        await SecureStore.setItemAsync(key, value);

        // Remove from AsyncStorage
        await AsyncStorage.removeItem(key);

        console.log(`Migrated ${key} to SecureStore`);
      }
    }

    console.log('Migration to SecureStore complete');
  } catch (error) {
    console.error('Error migrating to SecureStore:', error);
    throw error;
  }
};
```

### Best Practices

1. **Use SecureStore for sensitive data** - tokens, passwords, keys
2. **Use AsyncStorage for non-sensitive data** - preferences, cache
3. **Store JSON as strings** - SecureStore only supports string values
4. **Set appropriate accessibility** - `WHEN_UNLOCKED_THIS_DEVICE_ONLY` for sensitive data
5. **Handle errors gracefully** - storage can fail (device locked, storage full)
6. **Don't store large data** - SecureStore has size limits (~2KB on iOS)
7. **Clear tokens on logout** - always clean up sensitive data
8. **Migrate from AsyncStorage** - if you previously used AsyncStorage for tokens
9. **Test on physical devices** - storage behavior differs from simulators
10. **Configure export compliance** - set `usesNonExemptEncryption: false` in app.json

### Security Considerations

1. **iOS Keychain Accessibility**:
   - `WHEN_UNLOCKED`: Default, accessible when device unlocked
   - `AFTER_FIRST_UNLOCK`: Accessible after first unlock (survives restarts)
   - `ALWAYS`: ❌ Not recommended - accessible even when locked
   - `WHEN_UNLOCKED_THIS_DEVICE_ONLY`: Best for sensitive data (not backed up)

2. **Android Keystore**:
   - Encrypted with Android Keystore system
   - Backed up by default - configure `configureAndroidBackup: true` in plugin
   - Exclude from backups using backup rules XML

3. **Key Rotation**:
   ```typescript
   // Rotate biometric key periodically
   const rotateKey = async () => {
     await BiometricKeyService.disableBiometric();
     await BiometricKeyService.enableBiometric(userId);
   };
   ```

4. **Token Refresh Pattern**:
   ```typescript
   // Always check token expiry before API calls
   const getValidAccessToken = async (): Promise<string | null> => {
     const isExpired = await TokenStorageService.isTokenExpired();

     if (isExpired) {
       // Refresh token
       await refreshAccessToken();
     }

     return await TokenStorageService.getAccessToken();
   };
   ```

---

## Summary

This guide covers implementation patterns for Expo SDK 52+ native mobile features:

1. **Biometric Authentication**: Face ID/Touch ID for app unlock and secure content access
2. **Push Notifications**: Full notification lifecycle with deep linking and category management
3. **Camera & Document Scanning**: Document capture with OCR and image processing
4. **Secure Storage**: Encrypted storage for JWT tokens and sensitive data

### Key Takeaways

- **Always test on physical devices** - native features don't work in simulators
- **Handle permissions gracefully** - explain why permissions are needed
- **Implement fallbacks** - provide alternatives when features aren't available
- **Use TypeScript** - type safety prevents runtime errors
- **Follow security best practices** - use SecureStore for sensitive data
- **Configure plugins properly** - many features require app.json configuration
- **Handle errors comprehensively** - native APIs can fail in various ways
- **Optimize for performance** - compress images, batch operations, cache results

### Next Steps

1. Review project requirements and select needed features
2. Install dependencies and configure app.json
3. Implement hooks and services from this guide
4. Test thoroughly on iOS and Android devices
5. Implement error handling and fallbacks
6. Add analytics to track feature usage
7. Document any custom modifications

### Resources

- [Expo Documentation](https://docs.expo.dev)
- [Expo SDK 52 Changelog](https://expo.dev/changelog/2024-11-12-sdk-52)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [Apple Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Android Keystore System](https://developer.android.com/training/articles/keystore)
