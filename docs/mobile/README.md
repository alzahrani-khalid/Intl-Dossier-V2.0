# Mobile Native Features Documentation

**Comprehensive guide for implementing Expo SDK 52+ native mobile features in the Intl-Dossier application**

## Overview

This documentation suite provides complete implementation patterns, best practices, and working examples for integrating native mobile features using Expo SDK 52+. All examples use TypeScript with strict type safety and follow React Native/Expo best practices.

## Documentation Structure

### 📚 Core Documentation

#### 1. [EXPO_SDK52_NATIVE_FEATURES.md](./EXPO_SDK52_NATIVE_FEATURES.md)
**Comprehensive implementation guide for all native features**

Complete documentation covering:
- **Biometric Authentication** (Face ID/Touch ID)
  - Hardware capability checking
  - Authentication flows
  - App unlock patterns
  - Error handling strategies

- **Push Notifications**
  - Permission management
  - Token registration
  - Foreground/background handling
  - Deep linking integration
  - Category-based preferences
  - Badge management

- **Camera & Document Scanning**
  - Camera permissions
  - Photo capture
  - Image processing & compression
  - OCR integration (on-device & cloud)
  - Gallery fallback

- **Secure Storage**
  - JWT token management
  - Session storage
  - Biometric key storage
  - Migration from AsyncStorage

**Best for**: Understanding individual features in depth

---

#### 2. [EXPO_QUICK_REFERENCE.md](./EXPO_QUICK_REFERENCE.md)
**Quick access to common patterns and code snippets**

Contains:
- Installation commands
- One-liner implementations
- Common patterns
- Error handlers
- Configuration templates
- Testing checklist
- Debugging tips
- Performance optimizations

**Best for**: Copy-paste solutions and quick lookups

---

#### 3. [OCR_COMPARISON.md](./OCR_COMPARISON.md)
**Detailed evaluation of OCR solutions**

Compares:
- Google Cloud Vision API
- AWS Textract
- Azure Computer Vision
- expo-ocr
- Google ML Kit
- Apple Vision Framework
- Tesseract.js

With analysis of:
- Accuracy benchmarks
- Cost comparisons
- Language support (including Arabic)
- Performance metrics
- Implementation complexity
- Use case recommendations

**Best for**: Choosing the right OCR solution for your needs

---

#### 4. [COMPLETE_EXAMPLE.md](./COMPLETE_EXAMPLE.md)
**End-to-end implementation example**

Full working example of:
- Secure document upload flow
- Combining all native features
- Service architecture
- Component structure
- Error recovery
- Performance optimization
- Testing strategies

**Best for**: Understanding how features work together

---

## Quick Start

### 1. Install Dependencies

```bash
# Biometric Authentication
npx expo install expo-local-authentication

# Push Notifications
npx expo install expo-notifications expo-device expo-constants

# Camera & Document Scanning
npx expo install expo-camera expo-image-manipulator expo-image-picker

# Secure Storage
npx expo install expo-secure-store
```

### 2. Configure app.json

```json
{
  "expo": {
    "plugins": [
      ["expo-local-authentication", {
        "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID."
      }],
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png"
      }],
      ["expo-camera", {
        "cameraPermission": "Allow $(PRODUCT_NAME) to access camera."
      }],
      ["expo-secure-store", {
        "configureAndroidBackup": true
      }]
    ]
  }
}
```

### 3. Use the Features

```typescript
// Authenticate with biometrics
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Authenticate to continue',
});

// Request push notification permissions
const { status } = await Notifications.requestPermissionsAsync();

// Take a photo
const photo = await cameraRef.current?.takePictureAsync();

// Store token securely
await SecureStore.setItemAsync('access_token', token);
```

---

## Feature Roadmap

### Phase 1: Core Features (MVP)
- [x] Research and documentation
- [ ] Biometric authentication
- [ ] Secure token storage
- [ ] Push notification infrastructure
- [ ] Basic camera integration

### Phase 2: Document Scanning
- [ ] Camera document capture
- [ ] Image processing pipeline
- [ ] On-device OCR (expo-ocr)
- [ ] Gallery fallback
- [ ] Document upload

### Phase 3: Advanced Features
- [ ] Cloud OCR (Google Vision API)
- [ ] Hybrid OCR strategy
- [ ] Deep linking from notifications
- [ ] Notification categories
- [ ] Offline queue

### Phase 4: Polish & Optimization
- [ ] Performance optimization
- [ ] Error recovery
- [ ] Analytics integration
- [ ] Accessibility improvements
- [ ] E2E testing

---

## Platform Support

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Biometric Authentication | ✅ Face ID/Touch ID | ✅ Fingerprint/Face | ❌ |
| Push Notifications | ✅ APNs | ✅ FCM | ❌ |
| Camera | ✅ | ✅ | ⚠️ Limited |
| Secure Storage | ✅ Keychain | ✅ Keystore | ❌ |
| OCR (on-device) | ✅ | ✅ | ⚠️ Limited |
| OCR (cloud) | ✅ | ✅ | ✅ |

---

## Testing Requirements

### Device Testing (Required)
**⚠️ Native features do NOT work in simulators/emulators**

Test on:
- [ ] Physical iPhone (iOS 13+)
- [ ] Physical Android device (Android 8+)
- [ ] Various screen sizes
- [ ] Different OS versions
- [ ] Low-end devices (performance)

### Test Scenarios

#### Biometric Authentication
- [ ] First-time setup flow
- [ ] Successful authentication
- [ ] Failed authentication
- [ ] User cancellation
- [ ] Lockout after multiple failures
- [ ] Device without biometric hardware
- [ ] Device without enrolled biometrics

#### Push Notifications
- [ ] Permission request flow
- [ ] Token registration
- [ ] Foreground notification receipt
- [ ] Background notification receipt
- [ ] Notification tap (app backgrounded)
- [ ] Notification tap (app killed)
- [ ] Deep link navigation
- [ ] Badge count updates

#### Camera & Document Scanning
- [ ] Camera permission flow
- [ ] Photo capture (back camera)
- [ ] Photo capture (front camera)
- [ ] Gallery image selection
- [ ] Image compression
- [ ] OCR text extraction (English)
- [ ] OCR text extraction (Arabic)
- [ ] Low light conditions

#### Secure Storage
- [ ] Token storage
- [ ] Token retrieval
- [ ] Token deletion
- [ ] App reinstall (data cleared)
- [ ] Device backup/restore
- [ ] Device locked state

---

## Common Issues & Solutions

### Issue: "Push notifications not working in Expo Go"
**Solution**: Create a development build. Push notifications require native code.
```bash
eas build --profile development --platform ios
```

### Issue: "Biometric authentication always fails"
**Solution**: Ensure device has enrolled biometrics in Settings.
```typescript
const isEnrolled = await LocalAuthentication.isEnrolledAsync();
```

### Issue: "Camera permission denied"
**Solution**: Implement proper permission handling with explanations.
```typescript
if (!canAskAgain) {
  // Guide user to Settings
  Linking.openSettings();
}
```

### Issue: "SecureStore data lost after app update"
**Solution**: Configure Android backup properly in app.json.
```json
{
  "plugins": [["expo-secure-store", {
    "configureAndroidBackup": true
  }]]
}
```

### Issue: "OCR accuracy is low"
**Solution**: Preprocess images (resize, enhance contrast, grayscale).
```typescript
const context = ImageManipulator.useImageManipulator(uri);
context.resize({ width: 1024 });
```

---

## Performance Benchmarks

| Operation | Expected Time | Acceptable Range |
|-----------|--------------|------------------|
| Biometric Auth | 0.5-1s | < 2s |
| Push Token Registration | 1-2s | < 5s |
| Photo Capture | < 0.5s | < 1s |
| Image Compression | 1-2s | < 5s |
| On-Device OCR | 1-3s | < 5s |
| Cloud OCR | 2-4s | < 10s |
| Secure Storage Write | < 0.1s | < 0.5s |
| Secure Storage Read | < 0.1s | < 0.5s |

---

## Security Considerations

### Best Practices

1. **Authentication**
   - Always validate session before sensitive operations
   - Log security events for audit trail
   - Implement lockout after repeated failures
   - Never store biometric data directly

2. **Token Storage**
   - Use SecureStore for JWT tokens
   - Never use AsyncStorage for sensitive data
   - Set appropriate keychain accessibility
   - Implement token refresh logic

3. **Camera & Documents**
   - Request permissions with clear explanations
   - Compress images before upload
   - Validate file types and sizes
   - Implement virus scanning for uploads

4. **Push Notifications**
   - Validate notification payloads
   - Sanitize deep link URLs
   - Implement notification signing
   - Handle malformed notifications gracefully

### Security Checklist

- [ ] Biometric keys stored in SecureStore
- [ ] JWT tokens stored in SecureStore
- [ ] Sensitive operations require authentication
- [ ] Security events logged to backend
- [ ] Token refresh implemented
- [ ] Deep links validated before navigation
- [ ] File uploads sanitized and validated
- [ ] API calls use HTTPS only
- [ ] Certificate pinning implemented
- [ ] Jailbreak/root detection enabled

---

## Resources

### Official Documentation
- [Expo SDK 52 Docs](https://docs.expo.dev/versions/latest/)
- [Expo SDK 52 Changelog](https://expo.dev/changelog/2024-11-12-sdk-52)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)

### API Documentation
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [AWS Textract](https://docs.aws.amazon.com/textract/)
- [Apple Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Android Keystore](https://developer.android.com/training/articles/keystore)

### Tools
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Status](https://status.expo.dev/)

### Community
- [Expo Forums](https://forums.expo.dev/)
- [Expo Discord](https://chat.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

---

## Contributing

When adding new mobile features:

1. Update relevant documentation files
2. Add code examples with TypeScript types
3. Include error handling patterns
4. Document testing requirements
5. Update this README with new features
6. Add performance benchmarks
7. Document security considerations

---

## Support

For questions or issues:

1. Check the documentation files in this directory
2. Review [EXPO_QUICK_REFERENCE.md](./EXPO_QUICK_REFERENCE.md) for common solutions
3. Search [Expo Forums](https://forums.expo.dev/)
4. Check [GitHub Issues](https://github.com/expo/expo/issues)
5. Contact the mobile development team

---

## License

This documentation is part of the Intl-Dossier project.

---

**Last Updated**: 2025-01-13
**Expo SDK Version**: 52+
**React Native Version**: 0.76+
**Maintained By**: Mobile Development Team

---

## Quick Navigation

- **Need implementation details?** → [EXPO_SDK52_NATIVE_FEATURES.md](./EXPO_SDK52_NATIVE_FEATURES.md)
- **Need quick code snippets?** → [EXPO_QUICK_REFERENCE.md](./EXPO_QUICK_REFERENCE.md)
- **Choosing OCR solution?** → [OCR_COMPARISON.md](./OCR_COMPARISON.md)
- **Want complete example?** → [COMPLETE_EXAMPLE.md](./COMPLETE_EXAMPLE.md)

---

**Happy coding!** 🚀
