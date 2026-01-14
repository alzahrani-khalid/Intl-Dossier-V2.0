/**
 * Storage Service Port
 *
 * Defines the contract for file storage operations.
 * Adapters can implement using Supabase Storage, S3, local filesystem, etc.
 */

/**
 * File upload options
 */
export interface FileUploadOptions {
  bucket: string
  path: string
  contentType?: string
  cacheControl?: string
  upsert?: boolean
  metadata?: Record<string, string>
}

/**
 * File metadata
 */
export interface FileMetadata {
  id: string
  name: string
  bucket: string
  path: string
  size: number
  contentType: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, string>
}

/**
 * Signed URL options
 */
export interface SignedUrlOptions {
  expiresIn: number // seconds
  download?: boolean
  transform?: {
    width?: number
    height?: number
    quality?: number
    format?: 'origin' | 'webp' | 'avif'
  }
}

/**
 * File list options
 */
export interface FileListOptions {
  bucket: string
  path?: string
  limit?: number
  offset?: number
  sortBy?: {
    column: 'name' | 'created_at' | 'updated_at'
    order: 'asc' | 'desc'
  }
}

/**
 * Storage Service Port
 *
 * Contract for file storage operations. Implementations can use
 * Supabase Storage, AWS S3, Google Cloud Storage, etc.
 */
export interface IStorageService {
  /**
   * Upload a file
   */
  upload(file: Buffer | Blob | File, options: FileUploadOptions): Promise<FileMetadata>

  /**
   * Download a file
   */
  download(bucket: string, path: string): Promise<Buffer>

  /**
   * Delete a file
   */
  delete(bucket: string, path: string): Promise<boolean>

  /**
   * Delete multiple files
   */
  deleteMany(bucket: string, paths: string[]): Promise<number>

  /**
   * Get file metadata
   */
  getMetadata(bucket: string, path: string): Promise<FileMetadata | null>

  /**
   * List files in a bucket/path
   */
  list(options: FileListOptions): Promise<FileMetadata[]>

  /**
   * Generate a signed URL for file access
   */
  getSignedUrl(bucket: string, path: string, options: SignedUrlOptions): Promise<string>

  /**
   * Generate a signed URL for file upload
   */
  getUploadSignedUrl(bucket: string, path: string, expiresIn: number): Promise<string>

  /**
   * Copy a file to a new location
   */
  copy(
    sourceBucket: string,
    sourcePath: string,
    destBucket: string,
    destPath: string,
  ): Promise<FileMetadata>

  /**
   * Move a file to a new location
   */
  move(
    sourceBucket: string,
    sourcePath: string,
    destBucket: string,
    destPath: string,
  ): Promise<FileMetadata>

  /**
   * Check if a file exists
   */
  exists(bucket: string, path: string): Promise<boolean>

  /**
   * Create a bucket
   */
  createBucket(name: string, isPublic?: boolean): Promise<boolean>

  /**
   * Delete a bucket
   */
  deleteBucket(name: string): Promise<boolean>

  /**
   * Get public URL for a file (if bucket is public)
   */
  getPublicUrl(bucket: string, path: string): string
}
