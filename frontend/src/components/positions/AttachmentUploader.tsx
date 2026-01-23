import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
 usePositionAttachments,
 useUploadPositionAttachment,
 useDeletePositionAttachment,
 formatFileSize,
 getFileIcon,
 ALLOWED_MIME_TYPES,
 MAX_FILE_SIZE,
 type PositionAttachment,
} from '@/hooks/usePositionAttachments';

interface AttachmentFile {
 id: string;
 file: File;
 progress: number;
 status: 'uploading' | 'success' | 'error';
 error?: string;
 uploadedAttachment?: PositionAttachment;
}

interface AttachmentUploaderProps {
 positionId: string;
 disabled?: boolean;
 onUploadComplete?: (attachment: PositionAttachment) => void;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
 positionId,
 disabled = false,
 onUploadComplete,
}) => {
 const { t } = useTranslation(['positions', 'common']);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const [uploadingFiles, setUploadingFiles] = useState<AttachmentFile[]>([]);
 const [dragActive, setDragActive] = useState(false);
 const [validationError, setValidationError] = useState<string | null>(null);

 // Fetch existing attachments
 const { data: existingAttachments = [], isLoading } = usePositionAttachments(positionId);
 const uploadMutation = useUploadPositionAttachment(positionId);
 const deleteMutation = useDeletePositionAttachment(positionId);

 // Validate file before upload
 const validateFile = (file: File): string | null => {
 // Check file type
 if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
 return t('positions:attachments.errors.unsupportedType');
 }

 // Check file size
 if (file.size > MAX_FILE_SIZE) {
 return t('positions:attachments.errors.fileTooLarge', {
 maxSize: formatFileSize(MAX_FILE_SIZE),
 });
 }

 return null;
 };

 // Upload file with progress simulation
 const uploadFile = async (attachmentFile: AttachmentFile) => {
 try {
 setUploadingFiles((prev) =>
 prev.map((f) =>
 f.id === attachmentFile.id ? { ...f, status: 'uploading', progress: 0 } : f
 )
 );

 // Simulate progress for better UX
 const progressInterval = setInterval(() => {
 setUploadingFiles((prev) =>
 prev.map((f) =>
 f.id === attachmentFile.id && f.progress < 90
 ? { ...f, progress: f.progress + 10 }
 : f
 )
 );
 }, 200);

 const result = await uploadMutation.mutateAsync(attachmentFile.file);

 clearInterval(progressInterval);

 setUploadingFiles((prev) =>
 prev.map((f) =>
 f.id === attachmentFile.id
 ? { ...f, status: 'success', progress: 100, uploadedAttachment: result }
 : f
 )
 );

 // Callback for parent component
 onUploadComplete?.(result);

 // Remove from uploading list after a short delay
 setTimeout(() => {
 setUploadingFiles((prev) => prev.filter((f) => f.id !== attachmentFile.id));
 }, 2000);
 } catch (error: any) {
 setUploadingFiles((prev) =>
 prev.map((f) =>
 f.id === attachmentFile.id
 ? {
 ...f,
 status: 'error',
 error: error.message || t('common:error'),
 }
 : f
 )
 );
 }
 };

 // Handle file selection
 const handleFiles = (newFiles: FileList | null) => {
 if (!newFiles || newFiles.length === 0 || disabled) return;

 setValidationError(null);

 const fileArray = Array.from(newFiles);

 for (const file of fileArray) {
 const error = validateFile(file);

 if (error) {
 setValidationError(error);
 return;
 }

 const attachmentFile: AttachmentFile = {
 id: `${Date.now()}-${Math.random()}`,
 file,
 progress: 0,
 status: 'uploading',
 };

 setUploadingFiles((prev) => [...prev, attachmentFile]);

 // Start upload
 uploadFile(attachmentFile);
 }
 };

 // Handle drag events
 const handleDrag = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();

 if (disabled) return;

 if (e.type === 'dragenter' || e.type === 'dragover') {
 setDragActive(true);
 } else if (e.type === 'dragleave') {
 setDragActive(false);
 }
 };

 // Handle drop
 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setDragActive(false);

 if (disabled) return;

 if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
 handleFiles(e.dataTransfer.files);
 }
 };

 // Handle file input change
 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 e.preventDefault();
 if (e.target.files && e.target.files.length > 0) {
 handleFiles(e.target.files);
 }
 };

 // Handle delete existing attachment
 const handleDeleteExisting = async (attachmentId: string) => {
 if (disabled) return;

 if (window.confirm(t('positions:attachments.confirmDelete'))) {
 try {
 await deleteMutation.mutateAsync(attachmentId);
 } catch (error: any) {
 alert(error.message || t('common:error'));
 }
 }
 };

 // Handle delete uploading file
 const handleDeleteUploading = (attachmentFileId: string) => {
 setUploadingFiles((prev) => prev.filter((f) => f.id !== attachmentFileId));
 };

 // Trigger file input click
 const onButtonClick = () => {
 if (!disabled) {
 fileInputRef.current?.click();
 }
 };

 // Combine existing and uploading attachments for display
 const allAttachments = [...existingAttachments, ...uploadingFiles];

 return (
 <div className="space-y-4">
 <div>
 <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
 {t('positions:attachments.label')}
 </label>
 <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
 {t('positions:attachments.description')}
 </p>
 </div>

 {/* Dropzone */}
 <div
 className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
 dragActive
 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
 : disabled
 ? 'cursor-not-allowed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
 : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
 }`}
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleDrop}
 role="button"
 tabIndex={disabled ? -1 : 0}
 aria-label={t('positions:attachments.dropzoneAriaLabel')}
 onKeyDown={(e) => {
 if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
 e.preventDefault();
 onButtonClick();
 }
 }}
 >
 <input
 ref={fileInputRef}
 type="file"
 multiple
 accept={ALLOWED_MIME_TYPES.join(',')}
 onChange={handleChange}
 className="hidden"
 disabled={disabled}
 aria-hidden="true"
 />

 <div className="space-y-2">
 <svg
 className={`mx-auto size-12 ${
 disabled ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'
 }`}
 stroke="currentColor"
 fill="none"
 viewBox="0 0 48 48"
 aria-hidden="true"
 >
 <path
 d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
 strokeWidth={2}
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>

 <div className="text-sm text-gray-600 dark:text-gray-300">
 <button
 type="button"
 onClick={onButtonClick}
 disabled={disabled}
 className={`font-medium ${
 disabled
 ? 'cursor-not-allowed text-gray-400 dark:text-gray-600'
 : 'text-primary-600 hover:text-primary-500 focus:underline focus:outline-none dark:text-primary-400 dark:hover:text-primary-300'
 }`}
 >
 {t('positions:attachments.dropzone')}
 </button>
 </div>

 <p className="text-xs text-gray-500 dark:text-gray-400">
 {t('positions:attachments.maxSize', { size: formatFileSize(MAX_FILE_SIZE) })}
 </p>
 <p className="text-xs text-gray-500 dark:text-gray-400">
 {t('positions:attachments.supportedFormats')}
 </p>
 </div>
 </div>

 {/* Validation Error */}
 {validationError && (
 <div
 className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
 role="alert"
 >
 <p className="text-sm text-red-800 dark:text-red-200">{validationError}</p>
 </div>
 )}

 {/* Attachments List */}
 {isLoading && (
 <div className="flex items-center justify-center p-8">
 <div className="size-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
 </div>
 )}

 {!isLoading && allAttachments.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
 {t('positions:attachments.listTitle')} ({existingAttachments.length})
 </h3>

 {/* Existing Attachments */}
 {existingAttachments.map((attachment) => (
 <div
 key={attachment.id}
 className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
 >
 <div className="flex min-w-0 flex-1 items-center space-x-3">
 {/* File Icon */}
 <div className="shrink-0 text-2xl" aria-hidden="true">
 {getFileIcon(attachment.file_type)}
 </div>

 {/* File Info */}
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
 {attachment.file_name}
 </p>
 <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
 <span>{formatFileSize(attachment.file_size)}</span>
 <span>•</span>
 <span>
 {new Date(attachment.created_at).toLocaleDateString(undefined, {
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 })}
 </span>
 </div>
 </div>
 </div>

 {/* Delete Button */}
 <button
 type="button"
 onClick={() => handleDeleteExisting(attachment.id)}
 disabled={disabled || deleteMutation.isPending}
 className={`ms-3 shrink-0 rounded p-1 ${
 disabled || deleteMutation.isPending
 ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
 : 'text-gray-400 transition-colors hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
 }`}
 aria-label={t('positions:attachments.deleteButton', {
 fileName: attachment.file_name,
 })}
 >
 <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
 <path
 fillRule="evenodd"
 d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
 clipRule="evenodd"
 />
 </svg>
 </button>
 </div>
 ))}

 {/* Uploading Files */}
 {uploadingFiles.map((attachmentFile) => (
 <div
 key={attachmentFile.id}
 className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
 >
 <div className="min-w-0 flex-1">
 <div className="flex items-center space-x-3">
 {/* Status Icon */}
 <div className="shrink-0">
 {attachmentFile.status === 'success' ? (
 <svg
 className="size-5 text-green-500 dark:text-green-400"
 fill="currentColor"
 viewBox="0 0 20 20"
 aria-label={t('common:success')}
 >
 <path
 fillRule="evenodd"
 d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
 clipRule="evenodd"
 />
 </svg>
 ) : attachmentFile.status === 'error' ? (
 <svg
 className="size-5 text-red-500 dark:text-red-400"
 fill="currentColor"
 viewBox="0 0 20 20"
 aria-label={t('common:error')}
 >
 <path
 fillRule="evenodd"
 d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
 clipRule="evenodd"
 />
 </svg>
 ) : (
 <svg
 className="size-5 animate-spin text-primary-500 dark:text-primary-400"
 viewBox="0 0 24 24"
 aria-label={t('common:loading')}
 >
 <circle
 className="opacity-25"
 cx="12"
 cy="12"
 r="10"
 stroke="currentColor"
 strokeWidth="4"
 fill="none"
 />
 <path
 className="opacity-75"
 fill="currentColor"
 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
 />
 </svg>
 )}
 </div>

 {/* File Info */}
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
 {attachmentFile.file.name}
 </p>
 <p className="text-xs text-gray-500 dark:text-gray-400">
 {formatFileSize(attachmentFile.file.size)}
 {attachmentFile.status === 'uploading' &&
 ` - ${attachmentFile.progress}%`}
 </p>
 {attachmentFile.error && (
 <p className="mt-1 text-xs text-red-600 dark:text-red-400">
 {attachmentFile.error}
 </p>
 )}
 </div>
 </div>

 {/* Progress Bar */}
 {attachmentFile.status === 'uploading' && (
 <div className="mt-2">
 <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
 <div
 className="h-1.5 rounded-full bg-primary-600 transition-all duration-300 dark:bg-primary-500"
 style={{ width: `${attachmentFile.progress}%` }}
 role="progressbar"
 aria-valuenow={attachmentFile.progress}
 aria-valuemin={0}
 aria-valuemax={100}
 />
 </div>
 </div>
 )}
 </div>

 {/* Delete Button */}
 {attachmentFile.status !== 'uploading' && (
 <button
 type="button"
 onClick={() => handleDeleteUploading(attachmentFile.id)}
 className="ms-3 shrink-0 text-gray-400 transition-colors hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
 aria-label={t('positions:attachments.removeButton')}
 >
 <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
 <path
 fillRule="evenodd"
 d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
 clipRule="evenodd"
 />
 </svg>
 </button>
 )}
 </div>
 ))}
 </div>
 )}

 {!isLoading && existingAttachments.length === 0 && uploadingFiles.length === 0 && (
 <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
 {t('positions:attachments.noAttachments')}
 </p>
 )}
 </div>
 );
};
