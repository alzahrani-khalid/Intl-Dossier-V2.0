/**
 * Voice Memo Types
 * Types for voice recordings attached to documents with automatic transcription
 */

// Voice memo status
export type VoiceMemoStatus =
  | 'recording' // Currently being recorded
  | 'processing' // Uploaded, awaiting transcription
  | 'transcribing' // Transcription in progress
  | 'completed' // Transcription complete
  | 'failed' // Transcription failed

// Transcription segment (for synced playback)
export interface TranscriptionSegment {
  id: string
  start: number // Start time in seconds
  end: number // End time in seconds
  text: string // Transcribed text for this segment
  confidence: number // Confidence score (0-1)
  speaker?: string // Speaker identification (if available)
  words?: TranscriptionWord[] // Word-level timestamps
}

// Word-level transcription
export interface TranscriptionWord {
  word: string
  start: number
  end: number
  confidence: number
}

// Transcription metadata from AI service
export interface TranscriptionMetadata {
  model: string // Model used for transcription
  language: string // Detected language
  languageConfidence: number
  duration: number // Audio duration processed
  processingTime: number // Time taken to transcribe
  wordCount: number
  speakerCount?: number // Number of detected speakers
  segments: TranscriptionSegment[]
}

// Location data for voice memo
export interface RecordingLocation {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  address?: string
  city?: string
  country?: string
}

// Voice memo entity
export interface VoiceMemo {
  id: string
  organizationId: string

  // Document association
  documentId?: string
  entityType: string // 'document', 'dossier', 'brief', 'position'
  entityId: string

  // Recording metadata
  title?: string
  description?: string
  durationSeconds: number
  fileSizeBytes: number
  mimeType: string
  sampleRate: number
  channels: number

  // Storage
  storagePath: string
  storageBucket: string
  localUri?: string
  isCachedOffline: boolean

  // Transcription
  status: VoiceMemoStatus
  transcription?: string
  transcriptionConfidence?: number
  transcriptionLanguage: string
  transcriptionSegments?: TranscriptionSegment[]
  transcriptionMetadata?: TranscriptionMetadata
  transcriptionStartedAt?: string
  transcriptionCompletedAt?: string
  transcriptionError?: string

  // Recording context
  recordedAt: string
  recordedBy: string
  recordedByName?: string
  recordedOnDevice?: string
  recordedLocation?: RecordingLocation

  // Tags and metadata
  tags: string[]
  metadata: Record<string, unknown>

  // Audit fields
  createdAt: string
  updatedAt: string
  syncedAt?: string
  deletedAt?: string
}

// Create voice memo input
export interface CreateVoiceMemoInput {
  organizationId: string
  documentId?: string
  entityType: string
  entityId: string
  title?: string
  description?: string
  durationSeconds: number
  fileSizeBytes: number
  mimeType?: string
  sampleRate?: number
  channels?: number
  recordedOnDevice?: string
  recordedLocation?: RecordingLocation
  tags?: string[]
  metadata?: Record<string, unknown>
}

// Update voice memo input
export interface UpdateVoiceMemoInput {
  title?: string
  description?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

// Voice memo upload response
export interface VoiceMemoUploadResponse {
  voiceMemo: VoiceMemo
  uploadUrl: string
  transcriptionQueued: boolean
}

// Voice memo list filters
export interface VoiceMemoFilters {
  entityType?: string
  entityId?: string
  documentId?: string
  status?: VoiceMemoStatus | VoiceMemoStatus[]
  recordedBy?: string
  fromDate?: string
  toDate?: string
  searchQuery?: string
  tags?: string[]
}

// Voice memo list response
export interface VoiceMemoListResponse {
  voiceMemos: VoiceMemo[]
  total: number
  hasMore: boolean
  cursor?: string
}

// Voice memo with signed URL for playback
export interface VoiceMemoWithUrl extends VoiceMemo {
  playbackUrl: string
  playbackUrlExpiry: string
}

// Transcription request
export interface TranscriptionRequest {
  voiceMemoId: string
  priority?: number
  language?: string // Force specific language
}

// Transcription result
export interface TranscriptionResult {
  voiceMemoId: string
  transcription: string
  confidence: number
  language: string
  segments: TranscriptionSegment[]
  metadata: TranscriptionMetadata
  processedAt: string
}

// Voice memo attachment (for linking to multiple entities)
export interface VoiceMemoAttachment {
  id: string
  voiceMemoId: string
  entityType: string
  entityId: string
  attachedBy: string
  attachedAt: string
}

// Recording state for UI
export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioLevel: number
  error?: string
}

// Playback state for UI
export interface PlaybackState {
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
  duration: number
  isBuffering: boolean
  error?: string
}

// Export for use in other modules
export type { VoiceMemo as VoiceMemoType, TranscriptionSegment as TranscriptionSegmentType }
