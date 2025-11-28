/**
 * EvidenceUpload Component v1.1
 * Feature: 031-commitments-management
 * Tasks: T049, T050, T051, T052
 *
 * Evidence upload interface with:
 * - File type validation (PDF, JPG, PNG, DOCX)
 * - Size validation (10MB max)
 * - Upload progress indicator
 * - Camera capture for mobile
 * - Mobile-first, RTL-compatible, 44x44px touch targets
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  Camera,
  FileText,
  Image,
  File,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';
import {
  ALLOWED_EVIDENCE_TYPES,
  MAX_EVIDENCE_SIZE,
} from '@/types/commitment.types';
import { useUploadEvidence } from '@/hooks/useCommitments';

export interface EvidenceUploadProps {
  commitmentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

// File type icons mapping
const fileTypeIcons: Record<string, React.ReactNode> = {
  'application/pdf': <FileText className="size-6 text-red-500" />,
  'image/jpeg': <Image className="size-6 text-blue-500" />,
  'image/png': <Image className="size-6 text-blue-500" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (
    <File className="size-6 text-blue-700" />
  ),
};

// Friendly file type names
const fileTypeNames: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

export function EvidenceUpload({
  commitmentId,
  onSuccess,
  onCancel,
  disabled = false,
}: EvidenceUploadProps) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Upload mutation
  const uploadMutation = useUploadEvidence();

  // T050: Validate file type and size
  const validateFile = useCallback(
    (file: File): boolean => {
      setValidationError(null);

      // Check file type
      if (!ALLOWED_EVIDENCE_TYPES.includes(file.type as (typeof ALLOWED_EVIDENCE_TYPES)[number])) {
        setValidationError(t('evidence.invalidType'));
        return false;
      }

      // Check file size
      if (file.size > MAX_EVIDENCE_SIZE) {
        setValidationError(t('evidence.fileTooLarge'));
        return false;
      }

      return true;
    },
    [t]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    },
    [validateFile]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow re-selecting same file
    e.target.value = '';
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    // T051: Simulate progress for better UX
    setUploadProgress(10);

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await uploadMutation.mutateAsync({
        commitmentId,
        file: selectedFile,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Small delay to show 100% before closing
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch {
      setUploadProgress(0);
    }
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setValidationError(null);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check if device has camera (mobile detection)
  const hasCamera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EVIDENCE_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />
      {/* T052: Camera capture input for mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* File not selected - show dropzone */}
      {!selectedFile && (
        <>
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer
              transition-colors duration-200
              ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Upload className="size-10 sm:size-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm sm:text-base font-medium mb-1">
              {t('evidence.dropzone')}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('evidence.allowedTypes')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('evidence.maxSize')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Browse Files Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="min-h-11 flex-1"
            >
              <Upload className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('actions.uploadEvidence')}
            </Button>

            {/* T052: Camera Capture Button (mobile only) */}
            {(hasCamera || isMobile) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled}
                className="min-h-11 flex-1"
              >
                <Camera className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('evidence.camera')}
              </Button>
            )}
          </div>
        </>
      )}

      {/* File selected - show preview and upload button */}
      {selectedFile && (
        <div className="border rounded-lg p-4">
          {/* File info */}
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              {fileTypeIcons[selectedFile.type] || <File className="size-6 text-gray-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate text-start">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground text-start">
                {fileTypeNames[selectedFile.type] || selectedFile.type} •{' '}
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {!uploadMutation.isPending && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFile}
                className="min-h-9 min-w-9 p-0"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          {/* T051: Upload progress indicator */}
          {uploadMutation.isPending && (
            <div className="mt-4 space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {t('evidence.uploading')} {uploadProgress}%
              </p>
            </div>
          )}

          {/* Success indicator */}
          {uploadProgress === 100 && !uploadMutation.isPending && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="size-5" />
              <span className="text-sm font-medium">
                {t('evidence.uploadSuccess')}
              </span>
            </div>
          )}

          {/* Action buttons */}
          {uploadProgress !== 100 && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleClearFile();
                  onCancel?.();
                }}
                disabled={uploadMutation.isPending}
                className="min-h-11 flex-1"
              >
                {t('actions.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={disabled || uploadMutation.isPending}
                className="min-h-11 flex-1"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className={`size-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
                    {t('evidence.uploading')}
                  </>
                ) : (
                  <>
                    <Upload className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                    {t('actions.uploadEvidence')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
