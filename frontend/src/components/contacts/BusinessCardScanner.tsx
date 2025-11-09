/**
 * BusinessCardScanner Component
 * Part of: 027-contact-directory implementation - Phase 4 (Business Card Scanning)
 *
 * Mobile-first, RTL-ready business card scanner with camera and file upload support.
 * Features OCR processing indicator, consent checkbox, and extracted data preview.
 */

import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useUploadBusinessCard, getConfidenceColor, getConfidenceLevel } from '@/hooks/useOCR';
import type { OCRParsedFields } from '@/services/ocr-api';

interface BusinessCardScannerProps {
 onExtracted: (fields: OCRParsedFields, confidence: number, rawText: string) => void;
 onCancel?: () => void;
}

export function BusinessCardScanner({ onExtracted, onCancel }: BusinessCardScannerProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';

 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [previewUrl, setPreviewUrl] = useState<string | null>(null);
 const [consentCloudOCR, setConsentCloudOCR] = useState(false);
 const [showCamera, setShowCamera] = useState(false);
 const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

 const fileInputRef = useRef<HTMLInputElement>(null);
 const videoRef = useRef<HTMLVideoElement>(null);
 const canvasRef = useRef<HTMLCanvasElement>(null);

 const uploadMutation = useUploadBusinessCard();

 // Handle file selection from input
 const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0];
 if (!file) return;

 // Validate file type
 const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
 if (!validTypes.includes(file.type.toLowerCase())) {
 alert(t('contactDirectory.ocr.invalid_file_type'));
 return;
 }

 // Validate file size (max 10MB)
 const maxSize = 10 * 1024 * 1024;
 if (file.size > maxSize) {
 alert(t('contactDirectory.ocr.file_too_large'));
 return;
 }

 setSelectedFile(file);

 // Create preview URL
 const url = URL.createObjectURL(file);
 setPreviewUrl(url);
 }, [t]);

 // Start camera
 const startCamera = useCallback(async () => {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({
 video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
 audio: false,
 });

 setCameraStream(stream);
 setShowCamera(true);

 // Set video stream
 if (videoRef.current) {
 videoRef.current.srcObject = stream;
 }
 } catch (error) {
 console.error('Camera error:', error);
 alert(t('contactDirectory.ocr.camera_error'));
 }
 }, [t]);

 // Stop camera
 const stopCamera = useCallback(() => {
 if (cameraStream) {
 cameraStream.getTracks().forEach((track) => track.stop());
 setCameraStream(null);
 }
 setShowCamera(false);
 }, [cameraStream]);

 // Capture photo from camera
 const capturePhoto = useCallback(() => {
 if (!videoRef.current || !canvasRef.current) return;

 const video = videoRef.current;
 const canvas = canvasRef.current;
 const context = canvas.getContext('2d');

 if (!context) return;

 // Set canvas dimensions to match video
 canvas.width = video.videoWidth;
 canvas.height = video.videoHeight;

 // Draw video frame to canvas
 context.drawImage(video, 0, 0, canvas.width, canvas.height);

 // Convert canvas to blob
 canvas.toBlob((blob) => {
 if (!blob) return;

 // Create file from blob
 const file = new File([blob], `business-card-${Date.now()}.jpg`, { type: 'image/jpeg' });
 setSelectedFile(file);

 // Create preview URL
 const url = URL.createObjectURL(blob);
 setPreviewUrl(url);

 // Stop camera
 stopCamera();
 }, 'image/jpeg', 0.95);
 }, [stopCamera]);

 // Clear selected file
 const clearFile = useCallback(() => {
 setSelectedFile(null);
 if (previewUrl) {
 URL.revokeObjectURL(previewUrl);
 setPreviewUrl(null);
 }
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 }, [previewUrl]);

 // Process OCR
 const handleProcess = useCallback(async () => {
 if (!selectedFile) return;

 const result = await uploadMutation.mutateAsync({
 file: selectedFile,
 consentCloudOCR,
 });

 // Pass extracted data to parent
 onExtracted(result.normalized_fields, result.confidence, result.text);
 }, [selectedFile, consentCloudOCR, uploadMutation, onExtracted]);

 // Cleanup on unmount
 React.useEffect(() => {
 return () => {
 if (previewUrl) {
 URL.revokeObjectURL(previewUrl);
 }
 if (cameraStream) {
 cameraStream.getTracks().forEach((track) => track.stop());
 }
 };
 }, [previewUrl, cameraStream]);

 return (
 <div className="space-y-4 sm:space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Camera View */}
 {showCamera && (
 <Card>
 <CardContent className="p-4 sm:p-6">
 <div className="relative">
 <video
 ref={videoRef}
 autoPlay
 playsInline
 className="w-full rounded-lg"
 />
 <div className="flex gap-3 mt-4 justify-center">
 <Button
 type="button"
 onClick={capturePhoto}
 className="h-11 px-6 sm:h-10"
 >
 <Camera className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
 {t('contactDirectory.ocr.capture_photo')}
 </Button>
 <Button
 type="button"
 variant="outline"
 onClick={stopCamera}
 className="h-11 px-6 sm:h-10"
 >
 {t('contactDirectory.ocr.cancel')}
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {/* File Selection / Preview */}
 {!showCamera && (
 <Card>
 <CardHeader>
 <CardTitle className="text-start">{t('contactDirectory.ocr.scan_business_card')}</CardTitle>
 <CardDescription className="text-start">
 {t('contactDirectory.ocr.scan_description')}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {/* Preview */}
 {previewUrl && (
 <div className="relative">
 <img
 src={previewUrl}
 alt="Business card preview"
 className="w-full rounded-lg border"
 />
 <Button
 type="button"
 variant="destructive"
 size="icon"
 onClick={clearFile}
 className="absolute top-2 end-2 min-h-8 min-w-8"
 >
 <X className="h-4 w-4" />
 </Button>
 </div>
 )}

 {/* Upload Buttons */}
 {!previewUrl && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <Button
 type="button"
 variant="outline"
 onClick={startCamera}
 className="h-11 px-4 sm:h-10 sm:px-6"
 >
 <Camera className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
 {t('contactDirectory.ocr.take_photo')}
 </Button>
 <Button
 type="button"
 variant="outline"
 onClick={() => fileInputRef.current?.click()}
 className="h-11 px-4 sm:h-10 sm:px-6"
 >
 <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
 {t('contactDirectory.ocr.upload_image')}
 </Button>
 </div>
 )}

 {/* Hidden file input */}
 <input
 ref={fileInputRef}
 type="file"
 accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
 onChange={handleFileSelect}
 className="hidden"
 />

 {/* Cloud OCR Consent */}
 {selectedFile && (
 <div className="space-y-4 pt-4 border-t">
 <div className="flex items-start gap-3">
 <Checkbox
 id="consent-cloud-ocr"
 checked={consentCloudOCR}
 onCheckedChange={(checked) => setConsentCloudOCR(checked === true)}
 className="mt-1"
 />
 <div className="flex-1">
 <Label
 htmlFor="consent-cloud-ocr"
 className="text-sm font-medium cursor-pointer text-start block"
 >
 {t('contactDirectory.ocr.consent_cloud_ocr_title')}
 </Label>
 <p className="text-xs text-muted-foreground mt-1 text-start">
 {t('contactDirectory.ocr.consent_cloud_ocr_description')}
 </p>
 </div>
 </div>

 {/* Processing Button */}
 <Button
 type="button"
 onClick={handleProcess}
 disabled={uploadMutation.isPending}
 className="w-full h-11 sm:h-10"
 >
 {uploadMutation.isPending && (
 <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
 )}
 {t('contactDirectory.ocr.process_card')}
 </Button>

 {/* Processing Indicator */}
 {uploadMutation.isPending && (
 <div className="space-y-2">
 <Progress value={undefined} className="h-2" />
 <p className="text-xs text-center text-muted-foreground">
 {t('contactDirectory.ocr.processing')}
 </p>
 </div>
 )}
 </div>
 )}
 </CardContent>
 </Card>
 )}

 {/* Canvas for photo capture (hidden) */}
 <canvas ref={canvasRef} className="hidden" />

 {/* Info Alert */}
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription className="text-start text-sm">
 {t('contactDirectory.ocr.info_alert')}
 </AlertDescription>
 </Alert>

 {/* Cancel Button */}
 {onCancel && (
 <div className="flex justify-end">
 <Button
 type="button"
 variant="ghost"
 onClick={onCancel}
 disabled={uploadMutation.isPending}
 className="h-11 px-6 sm:h-10"
 >
 {t('contactDirectory.ocr.back_to_manual')}
 </Button>
 </div>
 )}
 </div>
 );
}
