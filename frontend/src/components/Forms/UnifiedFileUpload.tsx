/**
 * UnifiedFileUpload Component
 *
 * A consolidated, feature-rich file upload component that unifies all upload patterns
 * across the application. Replaces multiple fragmented implementations with a single,
 * consistent component.
 *
 * Features:
 * - Drag-and-drop upload with visual feedback
 * - Single and multiple file support
 * - File type and size validation
 * - Progress indication for uploads
 * - Thumbnail previews for images
 * - File list management (add/remove)
 * - Mobile-first, RTL-compatible design
 * - Accessibility (ARIA labels, keyboard support)
 * - Error handling with recovery suggestions
 *
 * @module components/Forms/UnifiedFileUpload
 */

import { useCallback, useState, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import {
  Upload,
  X,
  File,
  FileText,
  Image,
  FileSpreadsheet,
  FileArchive,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// =============================================================================
// TYPES
// =============================================================================

export interface UploadedFile {
  id: string
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export interface FileUploadConfig {
  /** Maximum file size in bytes */
  maxFileSize?: number
  /** Maximum total size for all files in bytes */
  maxTotalSize?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Accepted file types (MIME types or extensions) */
  acceptedTypes?: string[]
  /** Allow multiple file selection */
  multiple?: boolean
}

export interface UnifiedFileUploadProps {
  /** Configuration for file upload constraints */
  config?: FileUploadConfig
  /** Callback when files are added */
  onFilesAdded?: (files: File[]) => void
  /** Callback when a file is removed */
  onFileRemoved?: (file: UploadedFile) => void
  /** Callback when all files should be cleared */
  onClear?: () => void
  /** Upload handler - receives file and returns promise with progress callback */
  onUpload?: (file: File, onProgress: (progress: number) => void) => Promise<void>
  /** Current files (controlled mode) */
  files?: UploadedFile[]
  /** Additional class names */
  className?: string
  /** Disabled state */
  disabled?: boolean
  /** Compact mode (smaller dropzone) */
  compact?: boolean
  /** Show file list below dropzone */
  showFileList?: boolean
  /** Custom label text */
  label?: string
  /** Custom description text */
  description?: string
  /** Help text shown below the component */
  helpText?: string
  /** Required field indicator */
  required?: boolean
  /** Error message to display */
  error?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: FileUploadConfig = {
  maxFileSize: 25 * 1024 * 1024, // 25MB
  maxTotalSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 10,
  acceptedTypes: [
    'image/*',
    'application/pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.txt',
    '.csv',
  ],
  multiple: true,
}

// =============================================================================
// UTILITIES
// =============================================================================

function generateId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function getFileIcon(file: File): React.ElementType {
  if (file.type.startsWith('image/')) return Image
  if (file.type === 'application/pdf') return FileText
  if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.type === 'text/csv')
    return FileSpreadsheet
  if (file.type.includes('zip') || file.type.includes('archive')) return FileArchive
  return File
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

function createPreviewUrl(file: File): string | undefined {
  if (isImageFile(file)) {
    return URL.createObjectURL(file)
  }
  return undefined
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface FileItemProps {
  uploadedFile: UploadedFile
  onRemove: (file: UploadedFile) => void
  isRTL: boolean
  disabled?: boolean
}

function FileItem({ uploadedFile, onRemove, isRTL, disabled }: FileItemProps) {
  const { t } = useTranslation('common')
  const IconComponent = getFileIcon(uploadedFile.file)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative flex items-center gap-3',
        'p-3 sm:p-4',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'rounded-lg',
        'shadow-sm',
        uploadedFile.status === 'error' &&
          'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30',
        uploadedFile.status === 'success' && 'border-green-300 dark:border-green-700',
      )}
    >
      {/* Preview or Icon */}
      <div className="shrink-0">
        {uploadedFile.preview ? (
          <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={uploadedFile.preview}
              alt={uploadedFile.file.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
            <IconComponent className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {uploadedFile.file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(uploadedFile.file.size)}
        </p>

        {/* Progress bar */}
        {uploadedFile.status === 'uploading' && (
          <div className="mt-2">
            <Progress value={uploadedFile.progress} className="h-1" />
          </div>
        )}

        {/* Error message */}
        {uploadedFile.status === 'error' && uploadedFile.error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{uploadedFile.error}</p>
        )}
      </div>

      {/* Status indicator */}
      <div className="shrink-0">
        {uploadedFile.status === 'uploading' && (
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
        )}
        {uploadedFile.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {uploadedFile.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(uploadedFile)}
        disabled={disabled || uploadedFile.status === 'uploading'}
        className={cn(
          'h-8 w-8 shrink-0',
          'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
        )}
        aria-label={t('forms.remove_file')}
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UnifiedFileUpload({
  config = {},
  onFilesAdded,
  onFileRemoved,
  onClear,
  onUpload,
  files: externalFiles,
  className,
  disabled = false,
  compact = false,
  showFileList = true,
  label,
  description,
  helpText,
  required = false,
  error,
}: UnifiedFileUploadProps) {
  const { t, i18n } = useTranslation(['common', 'validation'])
  const isRTL = i18n.language === 'ar'
  const uniqueId = useId()

  // Merge config with defaults
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // Internal state for uncontrolled mode
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>([])
  const files = externalFiles ?? internalFiles

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Calculate current total size
  const currentTotalSize = files.reduce((sum, f) => sum + f.file.size, 0)

  // Handle file validation and addition
  const processFiles = useCallback(
    async (acceptedFiles: File[], rejections: FileRejection[]) => {
      const errors: string[] = []

      // Process rejections
      rejections.forEach((rejection) => {
        rejection.errors.forEach((err) => {
          if (err.code === 'file-too-large') {
            errors.push(
              t('validation:file_too_large', {
                filename: rejection.file.name,
                maxSize: formatFileSize(mergedConfig.maxFileSize || 0),
              }),
            )
          } else if (err.code === 'file-invalid-type') {
            errors.push(t('validation:file_invalid_type', { filename: rejection.file.name }))
          } else if (err.code === 'too-many-files') {
            errors.push(t('validation:too_many_files', { max: mergedConfig.maxFiles }))
          }
        })
      })

      // Check total size constraint
      let totalNewSize = 0
      const validFiles: File[] = []

      for (const file of acceptedFiles) {
        totalNewSize += file.size
        if (currentTotalSize + totalNewSize > (mergedConfig.maxTotalSize || Infinity)) {
          errors.push(
            t('validation:total_size_exceeded', {
              maxSize: formatFileSize(mergedConfig.maxTotalSize || 0),
            }),
          )
          break
        }
        validFiles.push(file)
      }

      setValidationErrors(errors)

      if (validFiles.length === 0) return

      // Create UploadedFile objects
      const newUploadedFiles: UploadedFile[] = validFiles.map((file) => ({
        id: generateId(),
        file,
        preview: createPreviewUrl(file),
        progress: 0,
        status: onUpload ? 'pending' : 'success',
      }))

      // Update state
      if (!externalFiles) {
        setInternalFiles((prev) => [...prev, ...newUploadedFiles])
      }

      // Notify parent
      onFilesAdded?.(validFiles)

      // Start uploads if handler provided
      if (onUpload) {
        for (const uploadedFile of newUploadedFiles) {
          try {
            // Update status to uploading
            const updateProgress = (progress: number) => {
              if (!externalFiles) {
                setInternalFiles((prev) =>
                  prev.map((f) =>
                    f.id === uploadedFile.id ? { ...f, progress, status: 'uploading' } : f,
                  ),
                )
              }
            }

            updateProgress(0)
            await onUpload(uploadedFile.file, updateProgress)

            // Mark as success
            if (!externalFiles) {
              setInternalFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadedFile.id ? { ...f, progress: 100, status: 'success' } : f,
                ),
              )
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('validation:upload_failed')
            if (!externalFiles) {
              setInternalFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadedFile.id ? { ...f, status: 'error', error: errorMessage } : f,
                ),
              )
            }
          }
        }
      }
    },
    [t, mergedConfig, currentTotalSize, externalFiles, onFilesAdded, onUpload],
  )

  // Handle file removal
  const handleRemove = useCallback(
    (uploadedFile: UploadedFile) => {
      // Revoke preview URL to prevent memory leaks
      if (uploadedFile.preview) {
        URL.revokeObjectURL(uploadedFile.preview)
      }

      if (!externalFiles) {
        setInternalFiles((prev) => prev.filter((f) => f.id !== uploadedFile.id))
      }

      onFileRemoved?.(uploadedFile)
    },
    [externalFiles, onFileRemoved],
  )

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open } =
    useDropzone({
      onDrop: processFiles,
      accept: mergedConfig.acceptedTypes?.reduce(
        (acc, type) => {
          if (type.startsWith('.')) {
            // Extension
            acc['application/octet-stream'] = acc['application/octet-stream'] || []
            acc['application/octet-stream'].push(type)
          } else {
            // MIME type
            acc[type] = []
          }
          return acc
        },
        {} as Record<string, string[]>,
      ),
      maxSize: mergedConfig.maxFileSize,
      maxFiles: mergedConfig.maxFiles,
      multiple: mergedConfig.multiple,
      disabled,
      noClick: false,
    })

  // Determine display state
  const hasFiles = files.length > 0
  const displayError = error || (validationErrors.length > 0 ? validationErrors[0] : null)

  return (
    <div className={cn('space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:text-base">
          {label}
          {required && (
            <span className="ms-1 text-red-500" aria-label={t('common:validation.required')}>
              *
            </span>
          )}
        </label>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative overflow-hidden',
          'border-2 border-dashed rounded-lg',
          'transition-all duration-200',
          'cursor-pointer',
          // Default state
          !isDragActive && !displayError && 'border-gray-300 dark:border-gray-600',
          // Drag states
          isDragAccept && 'border-green-400 bg-green-50 dark:bg-green-950/20',
          isDragReject && 'border-red-400 bg-red-50 dark:bg-red-950/20',
          isDragActive &&
            !isDragAccept &&
            !isDragReject &&
            'border-primary-400 bg-primary-50 dark:bg-primary-950/20',
          // Error state
          displayError && 'border-red-300 dark:border-red-700',
          // Hover state
          !disabled && 'hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed',
          // Size variants
          compact ? 'p-4' : 'p-6 sm:p-8',
        )}
      >
        <input {...getInputProps()} id={`file-upload-${uniqueId}`} />

        <div className="flex flex-col items-center justify-center text-center">
          {/* Icon */}
          <motion.div
            animate={{
              y: isDragActive ? -5 : 0,
              scale: isDragActive ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              'mb-3 p-3 rounded-full',
              'bg-gray-100 dark:bg-gray-800',
              isDragAccept && 'bg-green-100 dark:bg-green-900',
              isDragReject && 'bg-red-100 dark:bg-red-900',
            )}
          >
            <Upload
              className={cn(
                'h-6 w-6',
                isDragAccept && 'text-green-600 dark:text-green-400',
                isDragReject && 'text-red-600 dark:text-red-400',
                !isDragActive && 'text-gray-500 dark:text-gray-400',
              )}
            />
          </motion.div>

          {/* Text */}
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:text-base">
            {isDragActive
              ? isDragReject
                ? t('common:forms.drop_rejected')
                : t('common:forms.drop_here')
              : description || t('common:forms.drag_drop_or_click')}
          </p>

          {/* Constraints info */}
          {!compact && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('common:forms.file_constraints', {
                maxSize: formatFileSize(mergedConfig.maxFileSize || 0),
                maxFiles: mergedConfig.maxFiles,
              })}
            </p>
          )}

          {/* Browse button */}
          {!compact && !isDragActive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
                open()
              }}
            >
              {t('common:forms.browse_files')}
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{displayError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      {showFileList && hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('common:forms.files_selected', { count: files.length })}
            </span>
            {files.length > 1 && onClear && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={disabled}
                className="text-xs"
              >
                {t('common:forms.clear_all')}
              </Button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {files.map((uploadedFile) => (
              <FileItem
                key={uploadedFile.id}
                uploadedFile={uploadedFile}
                onRemove={handleRemove}
                isRTL={isRTL}
                disabled={disabled}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Help text */}
      {helpText && <p className="text-sm text-gray-600 dark:text-gray-400">{helpText}</p>}
    </div>
  )
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

/**
 * Pre-configured UnifiedFileUpload for documents
 */
export function DocumentUpload(
  props: Omit<UnifiedFileUploadProps, 'config'> & { maxFiles?: number },
) {
  const { maxFiles = 5, ...rest } = props

  return (
    <UnifiedFileUpload
      {...rest}
      config={{
        maxFileSize: 25 * 1024 * 1024, // 25MB
        maxTotalSize: 100 * 1024 * 1024, // 100MB
        maxFiles,
        acceptedTypes: [
          'application/pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.ppt',
          '.pptx',
          '.txt',
          '.csv',
        ],
        multiple: maxFiles > 1,
      }}
    />
  )
}

/**
 * Pre-configured UnifiedFileUpload for images
 */
export function ImageUpload(props: Omit<UnifiedFileUploadProps, 'config'> & { maxFiles?: number }) {
  const { maxFiles = 10, ...rest } = props

  return (
    <UnifiedFileUpload
      {...rest}
      config={{
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxTotalSize: 50 * 1024 * 1024, // 50MB
        maxFiles,
        acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        multiple: maxFiles > 1,
      }}
    />
  )
}

/**
 * Pre-configured UnifiedFileUpload for evidence attachments
 */
export function EvidenceUpload(props: Omit<UnifiedFileUploadProps, 'config'>) {
  return (
    <UnifiedFileUpload
      {...props}
      config={{
        maxFileSize: 25 * 1024 * 1024, // 25MB
        maxTotalSize: 100 * 1024 * 1024, // 100MB
        maxFiles: 5,
        acceptedTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
        multiple: true,
      }}
    />
  )
}

/**
 * Pre-configured UnifiedFileUpload for single file (e.g., avatar, business card)
 */
export function SingleFileUpload(
  props: Omit<UnifiedFileUploadProps, 'config'> & { acceptedTypes?: string[] },
) {
  const { acceptedTypes = ['image/*'], ...rest } = props

  return (
    <UnifiedFileUpload
      {...rest}
      compact
      config={{
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 1,
        acceptedTypes,
        multiple: false,
      }}
    />
  )
}

export default UnifiedFileUpload
