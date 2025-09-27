import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpload, validateFile, formatFileSize, getFileIcon } from '../services/upload'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { 
  Upload, 
  X, 
  Pause, 
  Play, 
  RotateCcw, 
  Check, 
  AlertCircle,
  File,
  Trash2
} from 'lucide-react'

interface FileUploadProps {
  bucket: string
  path?: string
  onUploadComplete?: (url: string) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  acceptedTypes?: string[]
  className?: string
}

export function FileUpload({
  bucket,
  path,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  acceptedTypes,
  className = ''
}: FileUploadProps) {
  const { t } = useTranslation()
  const {
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    removeUpload,
    clearCompleted,
    uploads,
    isUploading
  } = useUpload()

  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: FileList) => {
    setError(null)
    
    if (uploads.length >= maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    for (const file of Array.from(files)) {
      const validation = validateFile(file)
      if (!validation.valid) {
        setError(validation.error!)
        continue
      }

      try {
        const uploadId = await uploadFile(file, {
          bucket,
          path,
          onProgress: (progress) => {
            console.log(`Upload progress for ${file.name}: ${progress}%`)
          },
          onComplete: (url) => {
            console.log(`Upload completed for ${file.name}: ${url}`)
            onUploadComplete?.(url)
          },
          onError: (error) => {
            console.error(`Upload failed for ${file.name}:`, error)
            onUploadError?.(error)
          }
        })
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Upload failed')
      }
    }
  }, [uploads.length, maxFiles, uploadFile, bucket, path, onUploadComplete, onUploadError])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'uploading':
        return 'bg-blue-100 text-blue-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={acceptedTypes?.join(',')}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('dataLibrary.dragAndDrop')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          or click to browse files
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Max file size: 50MB • Supported: PDF, DOCX, Images, CSV, Excel
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Uploads ({uploads.length})
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={clearCompleted}
                disabled={!uploads.some(u => u.status === 'completed')}
              >
                Clear Completed
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(upload.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {upload.name}
                    </p>
                    <Badge className={`text-xs ${getStatusColor(upload.status)}`}>
                      {upload.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(upload.size)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {upload.progress}%
                    </p>
                  </div>

                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="mt-2 h-1" />
                  )}

                  {upload.error && (
                    <p className="text-xs text-red-500 mt-1 truncate">
                      {upload.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {upload.status === 'uploading' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => pauseUpload(upload.id)}
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {upload.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resumeUpload(upload.id)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {upload.status === 'error' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => retryUpload(upload.id)}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {(upload.status === 'pending' || upload.status === 'uploading' || upload.status === 'paused') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelUpload(upload.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {(upload.status === 'completed' || upload.status === 'error' || upload.status === 'cancelled') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUpload(upload.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Upload className="h-4 w-4 animate-pulse" />
          <span>Uploading files...</span>
        </div>
      )}
    </div>
  )
}

export default FileUpload

