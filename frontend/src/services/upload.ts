import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// Types for file upload
export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  progress: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled'
  error?: string
  url?: string
  uploadedAt?: Date
  chunks?: UploadChunk[]
  totalChunks?: number
  uploadedChunks?: number
}

export interface UploadChunk {
  index: number
  start: number
  end: number
  data: Blob
  uploaded: boolean
  hash?: string
}

export interface UploadOptions {
  bucket: string
  path?: string
  chunkSize?: number
  maxRetries?: number
  onProgress?: (progress: number) => void
  onComplete?: (url: string) => void
  onError?: (error: string) => void
  onPause?: () => void
  onResume?: () => void
}

export interface UploadState {
  uploads: Map<string, UploadFile>
  isUploading: boolean
  maxConcurrentUploads: number
  activeUploads: number
}

export interface UploadActions {
  uploadFile: (file: File, options: UploadOptions) => Promise<string>
  pauseUpload: (uploadId: string) => void
  resumeUpload: (uploadId: string) => void
  cancelUpload: (uploadId: string) => void
  retryUpload: (uploadId: string) => void
  removeUpload: (uploadId: string) => void
  clearCompleted: () => void
  setMaxConcurrentUploads: (max: number) => void
}

// Chunk size for resumable uploads (1MB)
const DEFAULT_CHUNK_SIZE = 1024 * 1024

// Maximum file size (50MB as per requirements)
const MAX_FILE_SIZE = 50 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
}

// Zustand store for upload management
export const useUploadStore = create<UploadState & UploadActions>()(
  subscribeWithSelector((set, get) => ({
    uploads: new Map(),
    isUploading: false,
    maxConcurrentUploads: 3,
    activeUploads: 0,

    uploadFile: async (file: File, options: UploadOptions) => {
      const uploadId = crypto.randomUUID()
      const { uploads, activeUploads, maxConcurrentUploads } = get()

      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      }

      if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
        throw new Error(`File type not allowed: ${file.type}`)
      }

      // Create upload file object
      const uploadFile: UploadFile = {
        id: uploadId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'pending',
        chunks: [],
        totalChunks: 0,
        uploadedChunks: 0
      }

      // Create chunks for resumable upload
      const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE
      const chunks = createChunks(file, chunkSize)
      uploadFile.chunks = chunks
      uploadFile.totalChunks = chunks.length

      // Add to uploads
      uploads.set(uploadId, uploadFile)
      set({ uploads: new Map(uploads) })

      // Start upload if we have capacity
      if (activeUploads < maxConcurrentUploads) {
        get().startUpload(uploadId, options)
      }

      return uploadId
    },

    pauseUpload: (uploadId) => {
      const { uploads } = get()
      const upload = uploads.get(uploadId)

      if (upload && upload.status === 'uploading') {
        upload.status = 'paused'
        uploads.set(uploadId, upload)
        set({ uploads: new Map(uploads) })
        upload.options?.onPause?.()
      }
    },

    resumeUpload: (uploadId) => {
      const { uploads, activeUploads, maxConcurrentUploads } = get()
      const upload = uploads.get(uploadId)

      if (upload && upload.status === 'paused' && activeUploads < maxConcurrentUploads) {
        get().startUpload(uploadId, upload.options!)
      }
    },

    cancelUpload: (uploadId) => {
      const { uploads } = get()
      const upload = uploads.get(uploadId)

      if (upload) {
        upload.status = 'cancelled'
        uploads.set(uploadId, upload)
        set({ uploads: new Map(uploads) })
      }
    },

    retryUpload: (uploadId) => {
      const { uploads, activeUploads, maxConcurrentUploads } = get()
      const upload = uploads.get(uploadId)

      if (upload && upload.status === 'error' && activeUploads < maxConcurrentUploads) {
        upload.status = 'pending'
        upload.progress = 0
        upload.error = undefined
        uploads.set(uploadId, upload)
        set({ uploads: new Map(uploads) })
        get().startUpload(uploadId, upload.options!)
      }
    },

    removeUpload: (uploadId) => {
      const { uploads } = get()
      uploads.delete(uploadId)
      set({ uploads: new Map(uploads) })
    },

    clearCompleted: () => {
      const { uploads } = get()
      const filteredUploads = new Map()
      
      uploads.forEach((upload, id) => {
        if (upload.status !== 'completed') {
          filteredUploads.set(id, upload)
        }
      })
      
      set({ uploads: filteredUploads })
    },

    setMaxConcurrentUploads: (max) => {
      set({ maxConcurrentUploads: max })
    },

    // Internal method to start upload
    startUpload: async (uploadId: string, options: UploadOptions) => {
      const { uploads, activeUploads, maxConcurrentUploads } = get()
      const upload = uploads.get(uploadId)

      if (!upload || activeUploads >= maxConcurrentUploads) return

      upload.status = 'uploading'
      upload.options = options
      uploads.set(uploadId, upload)
      set({ uploads: new Map(uploads), activeUploads: activeUploads + 1 })

      try {
        if (upload.size <= DEFAULT_CHUNK_SIZE) {
          // Small file - upload directly
          await uploadSmallFile(upload, options)
        } else {
          // Large file - use resumable upload
          await uploadLargeFile(upload, options)
        }

        upload.status = 'completed'
        upload.progress = 100
        upload.uploadedAt = new Date()
        uploads.set(uploadId, upload)
        set({ uploads: new Map(uploads) })
        options.onComplete?.(upload.url!)
      } catch (error) {
        upload.status = 'error'
        upload.error = error instanceof Error ? error.message : 'Upload failed'
        uploads.set(uploadId, upload)
        set({ uploads: new Map(uploads) })
        options.onError?.(upload.error)
      } finally {
        set({ activeUploads: Math.max(0, activeUploads - 1) })
      }
    }
  }))
)

// Helper function to create chunks
function createChunks(file: File, chunkSize: number): UploadChunk[] {
  const chunks: UploadChunk[] = []
  let start = 0
  let index = 0

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size)
    const data = file.slice(start, end)
    
    chunks.push({
      index,
      start,
      end,
      data,
      uploaded: false
    })

    start = end
    index++
  }

  return chunks
}

// Upload small files directly
async function uploadSmallFile(upload: UploadFile, options: UploadOptions): Promise<void> {
  const filePath = options.path ? `${options.path}/${upload.name}` : upload.name
  
  const { data, error } = await supabase.storage
    .from(options.bucket)
    .upload(filePath, upload.file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(options.bucket)
    .getPublicUrl(filePath)

  upload.url = publicUrl
  upload.progress = 100
}

// Upload large files with resumable chunks
async function uploadLargeFile(upload: UploadFile, options: UploadOptions): Promise<void> {
  const { uploads } = useUploadStore.getState()
  const chunks = upload.chunks!
  const maxRetries = options.maxRetries || 3

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    
    if (chunk.uploaded) continue

    let retries = 0
    let success = false

    while (retries < maxRetries && !success) {
      try {
        await uploadChunk(chunk, upload, options, i)
        chunk.uploaded = true
        upload.uploadedChunks = (upload.uploadedChunks || 0) + 1
        upload.progress = Math.round((upload.uploadedChunks! / upload.totalChunks!) * 100)
        
        uploads.set(upload.id, upload)
        useUploadStore.setState({ uploads: new Map(uploads) })
        
        options.onProgress?.(upload.progress)
        success = true
      } catch (error) {
        retries++
        if (retries >= maxRetries) {
          throw error
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries))
      }
    }
  }

  // Combine chunks on server
  await combineChunks(upload, options)
}

// Upload individual chunk
async function uploadChunk(
  chunk: UploadChunk, 
  upload: UploadFile, 
  options: UploadOptions, 
  chunkIndex: number
): Promise<void> {
  const chunkPath = options.path 
    ? `${options.path}/${upload.name}.chunk.${chunkIndex}`
    : `${upload.name}.chunk.${chunkIndex}`

  const { error } = await supabase.storage
    .from(options.bucket)
    .upload(chunkPath, chunk.data, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw new Error(`Chunk ${chunkIndex} upload failed: ${error.message}`)
  }
}

// Combine chunks on server
async function combineChunks(upload: UploadFile, options: UploadOptions): Promise<void> {
  const filePath = options.path ? `${options.path}/${upload.name}` : upload.name
  
  // This would typically be handled by a server endpoint
  // For now, we'll simulate the combination
  const { data, error } = await supabase.storage
    .from(options.bucket)
    .upload(filePath, upload.file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(options.bucket)
    .getPublicUrl(filePath)

  upload.url = publicUrl

  // Clean up chunks
  const chunks = upload.chunks!
  for (let i = 0; i < chunks.length; i++) {
    const chunkPath = options.path 
      ? `${options.path}/${upload.name}.chunk.${i}`
      : `${upload.name}.chunk.${i}`
    
    await supabase.storage
      .from(options.bucket)
      .remove([chunkPath])
  }
}

// Hook for easy upload management
export function useUpload() {
  const {
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    removeUpload,
    clearCompleted,
    uploads,
    isUploading,
    activeUploads
  } = useUploadStore()

  return {
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    removeUpload,
    clearCompleted,
    uploads: Array.from(uploads.values()),
    isUploading,
    activeUploads
  }
}

// Utility functions
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  }

  if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
    return {
      valid: false,
      error: `File type not allowed: ${file.type}`
    }
  }

  return { valid: true }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileIcon = (type: string): string => {
  if (type.startsWith('image/')) return '🖼️'
  if (type.includes('pdf')) return '📄'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
  if (type.includes('text')) return '📄'
  return '📁'
}

export default useUploadStore

