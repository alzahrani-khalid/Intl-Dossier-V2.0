# Expo SDK 52+ Quick Reference Guide

**Quick access to common patterns and code snippets**

## Installation Commands

```bash
# Biometric Authentication
npx expo install expo-local-authentication

# Push Notifications
npx expo install expo-notifications expo-device expo-constants

# Camera & Document Scanning
npx expo install expo-camera expo-image-manipulator expo-image-picker expo-document-picker

# Secure Storage
npx expo install expo-secure-store

# Optional: OCR
npx expo install expo-ocr
```

## Quick Patterns

### 1. Check Biometric Availability (One-Liner)

```typescript
const canUseBiometric = (await LocalAuthentication.hasHardwareAsync()) &&
                        (await LocalAuthentication.isEnrolledAsync());
```

### 2. Authenticate with Biometrics

```typescript
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Authenticate to continue',
  cancelLabel: 'Cancel',
  disableDeviceFallback: false,
});

if (result.success) {
  // User authenticated
}
```

### 3. Request Push Notification Permissions

```typescript
const { status } = await Notifications.requestPermissionsAsync();
if (status === 'granted') {
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });
  console.log('Push token:', token.data);
}
```

### 4. Listen for Notifications

```typescript
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Received:', notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Tapped:', response);
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}, []);
```

### 5. Take Photo with Camera

```typescript
const cameraRef = useRef<CameraView>(null);

const takePicture = async () => {
  const photo = await cameraRef.current?.takePictureAsync({
    quality: 0.9,
    base64: false,
  });
  return photo;
};
```

### 6. Compress Image

```typescript
const context = ImageManipulator.useImageManipulator(imageUri);
context.resize({ width: 1024 });
const image = await context.renderAsync();
const result = await image.saveAsync({
  format: ImageManipulator.SaveFormat.JPEG,
  compress: 0.8,
});
```

### 7. Pick Image from Gallery

```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  quality: 0.9,
});

if (!result.canceled) {
  const imageUri = result.assets[0].uri;
}
```

### 8. Store JWT Token Securely

```typescript
// Store
await SecureStore.setItemAsync('access_token', token);

// Retrieve
const token = await SecureStore.getItemAsync('access_token');

// Delete
await SecureStore.deleteItemAsync('access_token');
```

### 9. Store JSON Object Securely

```typescript
// Store
const user = { id: 1, email: 'user@example.com' };
await SecureStore.setItemAsync('user', JSON.stringify(user));

// Retrieve
const userJson = await SecureStore.getItemAsync('user');
const user = JSON.parse(userJson);
```

### 10. Deep Link from Notification

```typescript
// React Navigation linking config
const linking = {
  prefixes: ['myapp://'],
  async getInitialURL() {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification.request.content.data?.deepLink;
  },
  subscribe(listener) {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.deepLink;
      if (url) listener(url);
    });
    return () => sub.remove();
  },
};
```

## Common Error Handlers

### Biometric Errors

```typescript
const handleBiometricError = (error: string) => {
  switch (error) {
    case 'HARDWARE_NOT_AVAILABLE':
      return 'Biometric hardware not available';
    case 'NO_BIOMETRICS_ENROLLED':
      return 'No biometrics enrolled. Please set up in device settings';
    case 'USER_CANCEL':
      return 'Authentication cancelled';
    case 'LOCKOUT':
      return 'Too many attempts. Use your passcode';
    default:
      return 'Authentication failed';
  }
};
```

### Camera Errors

```typescript
const handleCameraError = async () => {
  const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();

  if (status !== 'granted' && !canAskAgain) {
    Alert.alert(
      'Camera Permission',
      'Please enable camera access in Settings',
      [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
    );
  }
};
```

## app.json Configuration

```json
{
  "expo": {
    "plugins": [
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access camera."
        }
      ],
      [
        "expo-secure-store",
        {
          "configureAndroidBackup": true,
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID."
        }
      ]
    ],
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## Testing Checklist

### Biometric Authentication
- [ ] Test on device with Face ID/Touch ID enrolled
- [ ] Test with biometrics not enrolled
- [ ] Test user cancellation
- [ ] Test too many failed attempts (lockout)
- [ ] Test fallback to passcode

### Push Notifications
- [ ] Test permission request flow
- [ ] Test foreground notification reception
- [ ] Test background notification reception
- [ ] Test notification tap (app backgrounded)
- [ ] Test notification tap (app killed)
- [ ] Test deep link navigation
- [ ] Test badge count updates
- [ ] Test notification channels (Android)

### Camera & Document Scanning
- [ ] Test camera permission request
- [ ] Test photo capture
- [ ] Test camera switch (front/back)
- [ ] Test image compression
- [ ] Test gallery fallback
- [ ] Test OCR text extraction
- [ ] Test on low-light conditions
- [ ] Test on various document types

### Secure Storage
- [ ] Test token storage and retrieval
- [ ] Test JSON object storage
- [ ] Test deletion
- [ ] Test after app reinstall (should clear)
- [ ] Test after device backup/restore
- [ ] Test with device locked

## Performance Optimization

### Image Compression

```typescript
// Target 2MB max file size
const MAX_SIZE = 2 * 1024 * 1024;

let quality = 0.9;
let result = await image.saveAsync({ compress: quality });

while (result.fileSize > MAX_SIZE && quality > 0.3) {
  quality -= 0.1;
  result = await image.saveAsync({ compress: quality });
}
```

### Batch SecureStore Operations

```typescript
// ✅ Good: Parallel operations
await Promise.all([
  SecureStore.setItemAsync('key1', 'value1'),
  SecureStore.setItemAsync('key2', 'value2'),
  SecureStore.setItemAsync('key3', 'value3'),
]);

// ❌ Bad: Sequential operations
await SecureStore.setItemAsync('key1', 'value1');
await SecureStore.setItemAsync('key2', 'value2');
await SecureStore.setItemAsync('key3', 'value3');
```

### Cache Biometric Capability Check

```typescript
let biometricCapabilityCache: BiometricCapabilities | null = null;

const getCachedBiometricCapabilities = async () => {
  if (!biometricCapabilityCache) {
    biometricCapabilityCache = await checkBiometricCapabilities();
  }
  return biometricCapabilityCache;
};
```

## Debugging Tips

### Enable Verbose Logging

```typescript
// Add to App.tsx for development
if (__DEV__) {
  // Log all notification events
  Notifications.addNotificationReceivedListener(n =>
    console.log('[DEBUG] Notification received:', JSON.stringify(n, null, 2))
  );

  // Log secure storage operations
  const originalSetItem = SecureStore.setItemAsync;
  SecureStore.setItemAsync = async (key, value, options) => {
    console.log(`[DEBUG] SecureStore.setItem: ${key}`);
    return originalSetItem(key, value, options);
  };
}
```

### Test Push Notifications with Expo Tool

```bash
# Send test notification
curl -H "Content-Type: application/json" -X POST https://exp.host/--/api/v2/push/send -d '{
  "to": "ExponentPushToken[YOUR_TOKEN]",
  "title": "Test",
  "body": "Hello world"
}'
```

### Inspect SecureStore (iOS Simulator Only)

```bash
# List keychain items
xcrun simctl spawn booted log stream --predicate 'process == "securityd"'
```

## Common Pitfalls

### ❌ Don't: Store large data in SecureStore
```typescript
// iOS Keychain has ~2KB limit
await SecureStore.setItemAsync('key', largeJsonString); // May fail
```

### ✅ Do: Store references, keep data in database
```typescript
await SecureStore.setItemAsync('user_id', userId);
// Fetch full user data from API/database using userId
```

### ❌ Don't: Request permissions without context
```typescript
// Immediately on app launch
await Notifications.requestPermissionsAsync();
```

### ✅ Do: Request permissions with explanation
```typescript
// Show explanation modal first
showPermissionExplanation(() => {
  await Notifications.requestPermissionsAsync();
});
```

### ❌ Don't: Forget to clean up listeners
```typescript
useEffect(() => {
  Notifications.addNotificationReceivedListener(handler);
  // Missing cleanup!
}, []);
```

### ✅ Do: Always clean up
```typescript
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return () => subscription.remove();
}, []);
```

## Environment Variables

Create `.env` file:

```env
# Expo Project ID (for push notifications)
EXPO_PUBLIC_PROJECT_ID=your-project-id

# Google Cloud Vision API Key (for OCR)
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your-api-key

# Backend API URL
EXPO_PUBLIC_API_URL=https://api.yourapp.com
```

Access in code:

```typescript
import Constants from 'expo-constants';

const projectId = Constants.expoConfig?.extra?.eas?.projectId;
const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
```

## Build Commands

```bash
# Development build (for testing native features)
eas build --profile development --platform ios
eas build --profile development --platform android

# Install on device
eas build:run -p ios
eas build:run -p android

# Production build
eas build --profile production --platform all
```

## Useful Links

- [Expo SDK 52 Changelog](https://expo.dev/changelog/2024-11-12-sdk-52)
- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Push Notification Tester](https://expo.dev/notifications)
- [Expo Status Page](https://status.expo.dev/)

---

**For complete implementation details, see**: [EXPO_SDK52_NATIVE_FEATURES.md](./EXPO_SDK52_NATIVE_FEATURES.md)
