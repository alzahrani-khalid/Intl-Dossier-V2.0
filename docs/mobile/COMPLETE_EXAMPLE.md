# Complete Mobile Implementation Example

**End-to-end example integrating all Expo SDK 52+ native features**

This document shows a complete implementation of a document upload feature that combines biometric authentication, camera scanning, push notifications, and secure storage.

## Feature: Secure Document Upload

### User Flow

1. User taps "Upload Document" button
2. App prompts for biometric authentication
3. User captures document with camera (or picks from gallery)
4. Image is processed and compressed
5. OCR extracts text from document
6. Document is uploaded to backend
7. Push notification confirms successful upload
8. Document metadata is cached securely

---

## Project Structure

```
mobile/
├── src/
│   ├── hooks/
│   │   ├── useBiometricAuth.ts
│   │   ├── usePushNotifications.ts
│   │   └── useDocumentScanner.ts
│   ├── services/
│   │   ├── auth-service.ts
│   │   ├── document-service.ts
│   │   ├── ocr-service.ts
│   │   └── storage-service.ts
│   ├── components/
│   │   ├── DocumentUpload/
│   │   │   ├── index.tsx
│   │   │   ├── DocumentCapture.tsx
│   │   │   ├── DocumentPreview.tsx
│   │   │   └── UploadProgress.tsx
│   │   └── BiometricPrompt/
│   │       └── index.tsx
│   ├── screens/
│   │   └── DocumentUploadScreen.tsx
│   └── types/
│       └── document.types.ts
```

---

## 1. Type Definitions

```typescript
// src/types/document.types.ts

export interface Document {
  id: string;
  name: string;
  type: 'passport' | 'visa' | 'contract' | 'memo' | 'other';
  uri: string;
  fileSize: number;
  mimeType: string;
  ocrText?: string;
  ocrConfidence?: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface DocumentUploadRequest {
  document: Document;
  dossierId?: string;
  category: string;
  tags?: string[];
}

export interface DocumentUploadResponse {
  success: boolean;
  documentId: string;
  url: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'processing' | 'uploading' | 'complete' | 'error';
}
```

---

## 2. Authentication Service

```typescript
// src/services/auth-service.ts

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export class AuthService {
  /**
   * Authenticate user before sensitive operation
   */
  static async authenticateForAction(
    action: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if biometric is available and enabled
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const biometricEnabled =
        (await SecureStore.getItemAsync('biometric_enabled')) === 'true';

      if (!hasHardware || !isEnrolled || !biometricEnabled) {
        // Fallback to session validation
        const isValidSession = await this.validateSession();
        return { success: isValidSession };
      }

      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate to ${action}`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });

      if (result.success) {
        // Log authentication event
        await this.logSecurityEvent('biometric_auth_success', action);
        return { success: true };
      }

      return { success: false, error: result.error || 'Authentication failed' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication error' };
    }
  }

  /**
   * Validate current session
   */
  private static async validateSession(): Promise<boolean> {
    const accessToken = await SecureStore.getItemAsync('access_token');
    const expiresAt = await SecureStore.getItemAsync('token_expires_at');

    if (!accessToken || !expiresAt) {
      return false;
    }

    return Date.now() < parseInt(expiresAt, 10);
  }

  /**
   * Log security event for audit
   */
  private static async logSecurityEvent(
    event: string,
    context: string
  ): Promise<void> {
    try {
      const userId = await SecureStore.getItemAsync('user_id');
      const deviceId = await SecureStore.getItemAsync('device_id');

      // Send to backend audit log
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/audit/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          deviceId,
          event,
          context,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}
```

---

## 3. Document Scanner Service

```typescript
// src/services/ocr-service.ts

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
}

export class OCRService {
  private static readonly GOOGLE_VISION_API_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

  /**
   * Perform OCR with hybrid approach
   */
  static async extractText(
    imageUri: string,
    options: { highAccuracy?: boolean; offline?: boolean } = {}
  ): Promise<OCRResult> {
    // Preprocess image for better OCR results
    const processedUri = await this.preprocessImage(imageUri);

    try {
      if (options.offline) {
        return await this.performOnDeviceOCR(processedUri);
      }

      if (options.highAccuracy) {
        return await this.performCloudOCR(processedUri);
      }

      // Default: try on-device first, fallback to cloud if needed
      const result = await this.performOnDeviceOCR(processedUri);

      if (result.confidence > 0.8) {
        return result;
      }

      console.log('Low confidence, using cloud OCR');
      return await this.performCloudOCR(processedUri);
    } catch (error) {
      console.error('OCR error:', error);
      throw error;
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  private static async preprocessImage(uri: string): Promise<string> {
    const context = ImageManipulator.useImageManipulator(uri);

    // Resize to optimal dimensions (reduces processing time)
    context.resize({ width: 1024 });

    // Future enhancements:
    // - Increase contrast
    // - Convert to grayscale
    // - Apply sharpening filter

    const image = await context.renderAsync();
    const result = await image.saveAsync({
      format: ImageManipulator.SaveFormat.JPEG,
      compress: 0.9,
    });

    return result.uri;
  }

  /**
   * On-device OCR (expo-ocr)
   */
  private static async performOnDeviceOCR(uri: string): Promise<OCRResult> {
    // Implementation using expo-ocr
    // This is a placeholder - actual implementation depends on library
    return {
      text: 'Extracted text from on-device OCR',
      confidence: 0.85,
    };
  }

  /**
   * Cloud-based OCR (Google Cloud Vision)
   */
  private static async performCloudOCR(uri: string): Promise<OCRResult> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
              imageContext: {
                languageHints: ['en', 'ar'], // English and Arabic
              },
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const annotations = data.responses[0]?.textAnnotations || [];

    if (annotations.length === 0) {
      return { text: '', confidence: 0 };
    }

    return {
      text: annotations[0].description,
      confidence: annotations[0].confidence || 0.95,
      language: data.responses[0].fullTextAnnotation?.pages[0]?.property?.detectedLanguages[0]?.languageCode,
    };
  }
}
```

---

## 4. Document Upload Service

```typescript
// src/services/document-service.ts

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Document, DocumentUploadRequest, DocumentUploadResponse, UploadProgress } from '@/types/document.types';

export class DocumentService {
  private static readonly API_URL = process.env.EXPO_PUBLIC_API_URL;

  /**
   * Upload document to backend
   */
  static async uploadDocument(
    request: DocumentUploadRequest,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DocumentUploadResponse> {
    try {
      // Get auth token
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Stage 1: Process image
      onProgress?.({
        loaded: 0,
        total: 100,
        percentage: 10,
        stage: 'processing',
      });

      // Stage 2: Create multipart form data
      const formData = new FormData();
      formData.append('file', {
        uri: request.document.uri,
        type: request.document.mimeType,
        name: request.document.name,
      } as any);

      formData.append('category', request.category);
      formData.append('dossierId', request.dossierId || '');
      formData.append('ocrText', request.document.ocrText || '');
      formData.append('tags', JSON.stringify(request.tags || []));

      onProgress?.({
        loaded: 10,
        total: 100,
        percentage: 20,
        stage: 'uploading',
      });

      // Stage 3: Upload with progress tracking
      const uploadResult = await FileSystem.uploadAsync(
        `${this.API_URL}/documents/upload`,
        request.document.uri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          parameters: {
            category: request.category,
            dossierId: request.dossierId || '',
            ocrText: request.document.ocrText || '',
            tags: JSON.stringify(request.tags || []),
          },
        }
      );

      if (uploadResult.status !== 200) {
        throw new Error('Upload failed');
      }

      const response = JSON.parse(uploadResult.body) as DocumentUploadResponse;

      onProgress?.({
        loaded: 100,
        total: 100,
        percentage: 100,
        stage: 'complete',
      });

      // Cache document metadata
      await this.cacheDocumentMetadata(response.documentId, request.document);

      return response;
    } catch (error) {
      onProgress?.({
        loaded: 0,
        total: 100,
        percentage: 0,
        stage: 'error',
      });

      console.error('Document upload error:', error);
      throw error;
    }
  }

  /**
   * Cache document metadata securely
   */
  private static async cacheDocumentMetadata(
    documentId: string,
    document: Document
  ): Promise<void> {
    const cacheKey = `doc_cache_${documentId}`;
    const metadata = {
      id: documentId,
      name: document.name,
      type: document.type,
      uploadedAt: new Date().toISOString(),
    };

    await SecureStore.setItemAsync(cacheKey, JSON.stringify(metadata));
  }
}
```

---

## 5. Push Notification Service

```typescript
// src/services/notification-service.ts

import * as Notifications from 'expo-notifications';
import { NotificationCategory } from '@/types/notification.types';

export class NotificationService {
  /**
   * Schedule local notification for upload complete
   */
  static async notifyUploadComplete(
    documentName: string,
    documentId: string
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upload Complete',
          body: `${documentName} has been uploaded successfully`,
          data: {
            type: NotificationCategory.DOSSIER_COMMENTS,
            documentId,
            deepLink: `intldossier://documents/${documentId}`,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  /**
   * Clear notification badge
   */
  static async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}
```

---

## 6. Main Screen Component

```typescript
// src/screens/DocumentUploadScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AuthService } from '@/services/auth-service';
import { OCRService } from '@/services/ocr-service';
import { DocumentService } from '@/services/document-service';
import { NotificationService } from '@/services/notification-service';
import { useDocumentScanner } from '@/hooks/useDocumentScanner';
import { DocumentCapture } from '@/components/DocumentUpload/DocumentCapture';
import { DocumentPreview } from '@/components/DocumentUpload/DocumentPreview';
import { UploadProgress } from '@/components/DocumentUpload/UploadProgress';

import { Document, UploadProgress as UploadProgressType } from '@/types/document.types';

export const DocumentUploadScreen: React.FC = () => {
  const navigation = useNavigation();
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const {
    isScanning,
    isProcessing,
    error,
    capturedDocument,
    startScan,
    cancelScan,
    pickFromGallery,
    retakeScan,
    confirmScan,
  } = useDocumentScanner(handleDocumentCaptured);

  /**
   * Handle document captured from camera/gallery
   */
  async function handleDocumentCaptured(document: Document) {
    try {
      // Perform OCR
      const ocrResult = await OCRService.extractText(document.uri, {
        highAccuracy: true,
      });

      // Update document with OCR text
      const enrichedDocument: Document = {
        ...document,
        ocrText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
      };

      // Upload document
      await uploadDocument(enrichedDocument);
    } catch (err) {
      Alert.alert('Error', 'Failed to process document');
      console.error(err);
    }
  }

  /**
   * Start document upload flow
   */
  const handleUploadPress = async () => {
    try {
      setIsAuthenticating(true);

      // Step 1: Authenticate user
      const authResult = await AuthService.authenticateForAction('upload document');

      if (!authResult.success) {
        Alert.alert(
          'Authentication Failed',
          authResult.error || 'Please authenticate to continue'
        );
        return;
      }

      // Step 2: Start camera scan
      startScan();
    } catch (error) {
      Alert.alert('Error', 'Failed to start document upload');
      console.error(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Upload document to backend
   */
  const uploadDocument = async (document: Document) => {
    try {
      setUploadProgress({
        loaded: 0,
        total: 100,
        percentage: 0,
        stage: 'processing',
      });

      const result = await DocumentService.uploadDocument(
        {
          document,
          dossierId: 'current-dossier-id', // Get from context/params
          category: 'supporting_documents',
          tags: ['scanned', 'mobile'],
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (result.success) {
        // Show success notification
        await NotificationService.notifyUploadComplete(
          document.name,
          result.documentId
        );

        Alert.alert(
          'Success',
          'Document uploaded successfully',
          [
            {
              text: 'View Document',
              onPress: () =>
                navigation.navigate('DocumentDetail', { id: result.documentId }),
            },
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
      console.error(error);
    } finally {
      setUploadProgress(null);
    }
  };

  // Show camera capture screen
  if (isScanning) {
    return <DocumentCapture onCapture={confirmScan} onCancel={cancelScan} />;
  }

  // Show document preview with OCR results
  if (capturedDocument) {
    return (
      <DocumentPreview
        document={capturedDocument}
        onRetake={retakeScan}
        onConfirm={confirmScan}
      />
    );
  }

  // Show upload progress
  if (uploadProgress) {
    return <UploadProgress progress={uploadProgress} />;
  }

  // Main screen
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Document</Text>
        <Text style={styles.subtitle}>
          Capture or select a document to upload
        </Text>
      </View>

      {isAuthenticating && (
        <View style={styles.authenticating}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.authenticatingText}>Authenticating...</Text>
        </View>
      )}

      {isProcessing && (
        <View style={styles.processing}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.processingText}>Processing document...</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleUploadPress}
          disabled={isAuthenticating || isProcessing}
        >
          <MaterialIcons name="camera-alt" size={24} color="white" />
          <Text style={styles.primaryButtonText}>Scan Document</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={pickFromGallery}
          disabled={isAuthenticating || isProcessing}
        >
          <MaterialIcons name="photo-library" size={24} color="#2196F3" />
          <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.error}>
          <MaterialIcons name="error" size={20} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.info}>
        <MaterialIcons name="info" size={20} color="#757575" />
        <Text style={styles.infoText}>
          Supported formats: JPG, PNG, PDF (max 10MB)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
  authenticating: {
    alignItems: 'center',
    marginBottom: 40,
  },
  authenticatingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  processing: {
    alignItems: 'center',
    marginBottom: 40,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 18,
    fontWeight: '600',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#f44336',
    fontSize: 14,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: '#757575',
    fontSize: 14,
  },
});
```

---

## 7. Testing the Complete Flow

### Test Checklist

#### Authentication
- [ ] Biometric prompt appears when upload button is tapped
- [ ] Authentication succeeds with valid biometric
- [ ] Authentication fails gracefully with invalid biometric
- [ ] Fallback to session validation works when biometric unavailable
- [ ] Security event is logged on successful authentication

#### Document Capture
- [ ] Camera permission prompt appears first time
- [ ] Camera preview displays correctly
- [ ] Photo capture works
- [ ] Gallery fallback works
- [ ] Document preview shows captured image

#### Processing
- [ ] Image is compressed to <2MB
- [ ] OCR extracts text correctly
- [ ] High confidence text uses on-device OCR
- [ ] Low confidence text falls back to cloud OCR
- [ ] Arabic text is recognized correctly

#### Upload
- [ ] Progress indicator shows stages: processing → uploading → complete
- [ ] Upload completes successfully
- [ ] Document metadata is cached
- [ ] Error handling works for failed uploads

#### Notifications
- [ ] Local notification appears on upload complete
- [ ] Notification contains document name
- [ ] Tapping notification navigates to document
- [ ] Badge count updates correctly

---

## 8. Environment Configuration

```bash
# .env
EXPO_PUBLIC_API_URL=https://api.intldossier.com
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your-google-vision-api-key
```

---

## 9. Performance Optimizations

### Image Compression Strategy

```typescript
// Optimize compression based on network speed
const getOptimalQuality = async (): Promise<number> => {
  const networkState = await NetInfo.fetch();

  if (networkState.type === 'wifi') {
    return 0.9; // High quality on WiFi
  } else if (networkState.type === 'cellular') {
    return 0.7; // Medium quality on cellular
  } else {
    return 0.5; // Low quality on slow connection
  }
};
```

### Caching Strategy

```typescript
// Cache OCR results to avoid re-processing
const ocrCache = new Map<string, OCRResult>();

const getCachedOCR = async (imageUri: string): Promise<OCRResult | null> => {
  const hash = await FileSystem.getInfoAsync(imageUri).then(
    info => (info as any).md5
  );

  return ocrCache.get(hash) || null;
};
```

---

## 10. Error Recovery

### Retry Logic

```typescript
const uploadWithRetry = async (
  document: Document,
  maxRetries = 3
): Promise<DocumentUploadResponse> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await DocumentService.uploadDocument({ document });
    } catch (error) {
      lastError = error as Error;
      console.log(`Upload attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};
```

---

## Summary

This complete example demonstrates:

1. ✅ **Biometric Authentication**: Secure access control before sensitive operations
2. ✅ **Camera Integration**: Document capture with gallery fallback
3. ✅ **Image Processing**: Compression and optimization
4. ✅ **OCR**: Hybrid on-device/cloud text extraction
5. ✅ **Secure Storage**: Token management and metadata caching
6. ✅ **Push Notifications**: Upload completion notifications
7. ✅ **Progress Tracking**: Multi-stage upload progress
8. ✅ **Error Handling**: Comprehensive error recovery
9. ✅ **Performance**: Optimized compression and caching
10. ✅ **User Experience**: Clear flow with visual feedback

### Key Takeaways

- **Security First**: Always authenticate before sensitive operations
- **Fallback Options**: Provide alternatives when features unavailable
- **Progress Feedback**: Keep users informed during long operations
- **Error Recovery**: Implement retry logic and graceful degradation
- **Performance**: Optimize images and cache results
- **User Experience**: Clear messaging and visual indicators

---

**Next Steps**:
1. Adapt this example to your specific requirements
2. Add additional document types and categories
3. Implement document versioning
4. Add offline queue for failed uploads
5. Implement document sharing functionality

**Related Documentation**:
- [EXPO_SDK52_NATIVE_FEATURES.md](./EXPO_SDK52_NATIVE_FEATURES.md)
- [EXPO_QUICK_REFERENCE.md](./EXPO_QUICK_REFERENCE.md)
- [OCR_COMPARISON.md](./OCR_COMPARISON.md)
