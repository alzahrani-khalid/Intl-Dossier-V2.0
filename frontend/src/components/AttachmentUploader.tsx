import React, { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useUploadAttachment, useDeleteAttachment } from '../hooks/useIntakeApi'

interface AttachmentFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  uploadedId?: string
}

interface AttachmentUploaderProps {
  attachmentIds: string[]
  onChange: (attachmentIds: string[]) => void
  maxFileSize?: number // in bytes, default 25MB
  maxTotalSize?: number // in bytes, default 100MB
  maxFiles?: number // default 10
  acceptedTypes?: string[] // default: pdf, docx, xlsx, png, jpg
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  attachmentIds,
  onChange,
  maxFileSize = 25 * 1024 * 1024, // 25MB
  maxTotalSize = 100 * 1024 * 1024, // 100MB
  maxFiles = 10,
  acceptedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ],
}) => {
  const { t } = useTranslation('intake')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<AttachmentFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const uploadMutation = useUploadAttachment()
  const deleteMutation = useDeleteAttachment()

  // Calculate total size
  const getTotalSize = useCallback(() => {
    return files.reduce((total, file) => total + file.file.size, 0)
  }, [files])

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return t('validation.unsupportedFileType')
    }

    // Check file size
    if (file.size > maxFileSize) {
      return t('validation.fileTooLarge')
    }

    // Check total size
    const newTotalSize = getTotalSize() + file.size
    if (newTotalSize > maxTotalSize) {
      return t('validation.totalSizeExceeded')
    }

    // Check max files
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`
    }

    return null
  }

  // Upload file
  const uploadFile = async (attachmentFile: AttachmentFile) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === attachmentFile.id ? { ...f, status: 'uploading', progress: 0 } : f,
        ),
      )

      const formData = new FormData()
      formData.append('file', attachmentFile.file)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === attachmentFile.id && f.progress < 90 ? { ...f, progress: f.progress + 10 } : f,
          ),
        )
      }, 200)

      const result = await uploadMutation.mutateAsync(formData)

      clearInterval(progressInterval)

      setFiles((prev) =>
        prev.map((f) =>
          f.id === attachmentFile.id
            ? { ...f, status: 'success', progress: 100, uploadedId: result.id }
            : f,
        ),
      )

      // Update parent component with new attachment ID
      onChange([...attachmentIds, result.id])
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === attachmentFile.id
            ? {
                ...f,
                status: 'error',
                error: error.message || t('error.message'),
              }
            : f,
        ),
      )
    }
  }

  // Handle file selection
  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return

    setValidationError(null)

    const fileArray = Array.from(newFiles)

    for (const file of fileArray) {
      const error = validateFile(file)

      if (error) {
        setValidationError(error)
        return
      }

      const attachmentFile: AttachmentFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: 'uploading',
      }

      setFiles((prev) => [...prev, attachmentFile])

      // Start upload
      uploadFile(attachmentFile)
    }
  }

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  // Handle delete
  const handleDelete = async (attachmentFile: AttachmentFile) => {
    if (attachmentFile.uploadedId) {
      try {
        await deleteMutation.mutateAsync(attachmentFile.uploadedId)
        onChange(attachmentIds.filter((id) => id !== attachmentFile.uploadedId))
      } catch (error) {
        console.error('Failed to delete attachment:', error)
      }
    }

    setFiles((prev) => prev.filter((f) => f.id !== attachmentFile.id))
  }

  // Trigger file input click
  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('form.attachments.label')}
        </label>
        <p className="mb-3 text-xs text-gray-500">{t('form.attachments.description')}</p>
      </div>

      {/* Dropzone */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="hidden"
        />

        <div className="space-y-2">
          <svg
            className="mx-auto size-12 text-gray-400"
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

          <div className="text-sm text-gray-600">
            <button
              type="button"
              onClick={onButtonClick}
              className="font-medium text-blue-600 hover:text-blue-500 focus:underline focus:outline-none"
            >
              {t('form.attachments.dropzone')}
            </button>
          </div>

          <p className="text-xs text-gray-500">{t('form.attachments.maxSize')}</p>
          <p className="text-xs text-gray-500">{t('form.attachments.maxTotal')}</p>
          <p className="text-xs text-gray-500">{t('form.attachments.supportedFormats')}</p>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{validationError}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((attachmentFile) => (
            <div
              key={attachmentFile.id}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-3">
                  {/* File Icon */}
                  <div className="shrink-0">
                    {attachmentFile.status === 'success' ? (
                      <svg
                        className="size-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : attachmentFile.status === 'error' ? (
                      <svg className="size-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="size-5 animate-spin text-blue-500" viewBox="0 0 24 24">
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
                    <p className="truncate text-sm font-medium text-gray-900">
                      {attachmentFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachmentFile.file.size)}
                      {attachmentFile.status === 'uploading' && ` - ${attachmentFile.progress}%`}
                    </p>
                    {attachmentFile.error && (
                      <p className="mt-1 text-xs text-red-600">{attachmentFile.error}</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {attachmentFile.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-gray-200">
                      <div
                        className="h-1.5 rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${attachmentFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDelete(attachmentFile)}
                className="ms-3 shrink-0 text-gray-400 transition-colors hover:text-red-500"
                disabled={attachmentFile.status === 'uploading'}
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

          {/* Total Size */}
          <div className="flex justify-between pt-2 text-xs text-gray-500">
            <span>
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
            <span>
              Total: {formatFileSize(getTotalSize())} / {formatFileSize(maxTotalSize)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
