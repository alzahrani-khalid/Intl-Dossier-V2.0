/**
 * Attachment Upload Component
 *
 * File picker with drag-and-drop support for uploading meeting minutes
 * Accepts PDF, DOCX, TXT files
 * Shows virus scan status and validation
 * Max 100MB per file, 10 files total
 *
 * Mobile-first, RTL-safe
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AttachmentFile {
 id: string;
 file: File;
 status: 'pending' | 'uploading' | 'scanning' | 'scanned' | 'error';
 progress: number;
 errorMessage?: string;
 virusScanResult?: 'clean' | 'infected' | 'pending';
}

interface AttachmentUploadProps {
 onFilesUploaded: (files: File[]) => void;
 onFilesChanged?: (files: File[]) => void;
 maxFiles?: number;
 maxSizeMB?: number;
}

const ACCEPTED_TYPES = {
 'application/pdf': ['.pdf'],
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
 'text/plain': ['.txt']
};

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt';

export function AttachmentUpload({
 onFilesUploaded,
 onFilesChanged,
 maxFiles = 10,
 maxSizeMB = 100
}: AttachmentUploadProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
 const [dragOver, setDragOver] = useState(false);
 const [globalError, setGlobalError] = useState<string | null>(null);

 const maxSizeBytes = maxSizeMB * 1024 * 1024;

 /**
 * Validate file
 */
 const validateFile = useCallback((file: File): string | null => {
 // Check file type
 const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
 const acceptedExtensions = Object.values(ACCEPTED_TYPES).flat();

 if (!acceptedExtensions.includes(fileExtension)) {
 return t('errors.invalid_file_type', { types: ACCEPTED_EXTENSIONS });
 }

 // Check file size
 if (file.size > maxSizeBytes) {
 return t('errors.file_too_large', { maxSize: maxSizeMB });
 }

 // Check total files
 if (attachments.length >= maxFiles) {
 return t('errors.too_many_files', { maxFiles });
 }

 return null;
 }, [attachments.length, maxFiles, maxSizeBytes, maxSizeMB, t]);

 /**
 * Handle file selection
 */
 const handleFiles = useCallback((files: FileList | File[]) => {
 setGlobalError(null);
 const filesArray = Array.from(files);

 const newAttachments: AttachmentFile[] = [];
 const errors: string[] = [];

 for (const file of filesArray) {
 const error = validateFile(file);

 if (error) {
 errors.push(`${file.name}: ${error}`);
 continue;
 }

 newAttachments.push({
 id: crypto.randomUUID(),
 file,
 status: 'pending',
 progress: 0,
 virusScanResult: 'pending'
 });
 }

 if (errors.length > 0) {
 setGlobalError(errors.join('; '));
 }

 if (newAttachments.length > 0) {
 const updatedAttachments = [...attachments, ...newAttachments];
 setAttachments(updatedAttachments);

 const allFiles = updatedAttachments.map(a => a.file);
 onFilesChanged?.(allFiles);
 onFilesUploaded(allFiles);
 }
 }, [attachments, validateFile, onFilesChanged, onFilesUploaded]);

 /**
 * Handle drag and drop
 */
 const handleDrop = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setDragOver(false);

 if (e.dataTransfer.files.length > 0) {
 handleFiles(e.dataTransfer.files);
 }
 }, [handleFiles]);

 const handleDragOver = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setDragOver(true);
 }, []);

 const handleDragLeave = useCallback(() => {
 setDragOver(false);
 }, []);

 /**
 * Handle file input change
 */
 const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files.length > 0) {
 handleFiles(e.target.files);
 }
 }, [handleFiles]);

 /**
 * Remove attachment
 */
 const removeAttachment = useCallback((id: string) => {
 const updatedAttachments = attachments.filter(a => a.id !== id);
 setAttachments(updatedAttachments);

 const allFiles = updatedAttachments.map(a => a.file);
 onFilesChanged?.(allFiles);
 }, [attachments, onFilesChanged]);

 /**
 * Get status icon
 */
 const getStatusIcon = (attachment: AttachmentFile) => {
 switch (attachment.status) {
 case 'pending':
 return <FileText className="h-5 w-5 text-muted-foreground" />;
 case 'uploading':
 return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
 case 'scanning':
 return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />;
 case 'scanned':
 if (attachment.virusScanResult === 'clean') {
 return <CheckCircle className="h-5 w-5 text-green-500" />;
 }
 return <AlertCircle className="h-5 w-5 text-destructive" />;
 case 'error':
 return <AlertCircle className="h-5 w-5 text-destructive" />;
 default:
 return <FileText className="h-5 w-5 text-muted-foreground" />;
 }
 };

 return (
 <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Dropzone */}
 <Card
 className={`
 border-2 border-dashed transition-colors
 ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
 `}
 onDrop={handleDrop}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 >
 <div className="p-6 sm:p-8 md:p-12 text-center">
 <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />

 <h3 className="text-base sm:text-lg font-medium mb-2">
 {t('upload.drag_drop_title')}
 </h3>

 <p className="text-xs sm:text-sm text-muted-foreground mb-4">
 {t('upload.accepted_formats', { formats: 'PDF, DOCX, TXT' })}
 </p>

 <p className="text-xs text-muted-foreground mb-6">
 {t('upload.limits', { maxSize: maxSizeMB, maxFiles })}
 </p>

 <input
 type="file"
 id="file-upload"
 className="hidden"
 accept={ACCEPTED_EXTENSIONS}
 multiple
 onChange={handleFileInput}
 />

 <Button
 type="button"
 variant="outline"
 className="h-11 px-4 sm:px-6"
 onClick={() => document.getElementById('file-upload')?.click()}
 >
 {t('upload.select_files')}
 </Button>
 </div>
 </Card>

 {/* Global error */}
 {globalError && (
 <Alert variant="destructive">
 <AlertCircle className={`h-4 w-4 ${isRTL ? 'ms-0 me-2' : 'me-0 ms-2'}`} />
 <AlertDescription className="text-sm">{globalError}</AlertDescription>
 </Alert>
 )}

 {/* Attachments list */}
 {attachments.length > 0 && (
 <div className="space-y-2">
 <h4 className="text-sm sm:text-base font-medium">
 {t('upload.selected_files')} ({attachments.length}/{maxFiles})
 </h4>

 {attachments.map((attachment) => (
 <Card key={attachment.id} className="p-3 sm:p-4">
 <div className="flex items-start gap-3">
 {/* Status icon */}
 <div className="flex-shrink-0 mt-0.5">
 {getStatusIcon(attachment)}
 </div>

 {/* File info */}
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate">
 {attachment.file.name}
 </p>

 <p className="text-xs text-muted-foreground">
 {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
 </p>

 {/* Progress bar */}
 {(attachment.status === 'uploading' || attachment.status === 'scanning') && (
 <Progress value={attachment.progress} className="mt-2 h-1" />
 )}

 {/* Virus scan status */}
 {attachment.status === 'scanned' && (
 <p className="text-xs mt-1">
 {attachment.virusScanResult === 'clean' && (
 <span className="text-green-600">{t('upload.virus_scan_clean')}</span>
 )}
 {attachment.virusScanResult === 'infected' && (
 <span className="text-destructive">{t('upload.virus_detected')}</span>
 )}
 </p>
 )}

 {/* Error message */}
 {attachment.status === 'error' && attachment.errorMessage && (
 <p className="text-xs text-destructive mt-1">
 {attachment.errorMessage}
 </p>
 )}
 </div>

 {/* Remove button */}
 <Button
 type="button"
 variant="ghost"
 size="sm"
 className="flex-shrink-0 h-8 w-8 p-0"
 onClick={() => removeAttachment(attachment.id)}
 >
 <X className="h-4 w-4" />
 <span className="sr-only">{t('common.remove')}</span>
 </Button>
 </div>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}
