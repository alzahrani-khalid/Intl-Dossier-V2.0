/**
 * Document Annotation Types
 * Types for handwritten annotations, highlights, and other markup on documents
 */

// Annotation types
export type AnnotationType =
  | 'handwritten' // Freehand drawing/writing
  | 'highlight' // Text highlight
  | 'text_note' // Text annotation
  | 'shape' // Geometric shapes
  | 'stamp' // Predefined stamps
  | 'signature' // Digital signature

// Tools for handwritten annotations
export type AnnotationTool =
  | 'pen' // Standard pen
  | 'highlighter' // Highlighter tool
  | 'eraser' // Eraser
  | 'marker' // Thick marker
  | 'pencil' // Pencil (lighter strokes)

// Stamp types
export type StampType =
  | 'approved'
  | 'rejected'
  | 'confidential'
  | 'draft'
  | 'final'
  | 'review'
  | 'urgent'
  | 'custom'

// Point in a stroke (for handwritten annotations)
export interface StrokePoint {
  x: number
  y: number
  pressure?: number // 0-1, for pressure-sensitive input
  timestamp?: number // For replay/animation
  tiltX?: number // Pen tilt
  tiltY?: number
}

// Text range for highlights
export interface TextRange {
  startOffset: number
  endOffset: number
  startContainer?: string
  endContainer?: string
}

// Base annotation interface
export interface BaseAnnotation {
  id: string
  organizationId: string
  documentId: string
  pageNumber?: number
  annotationType: AnnotationType
  tool?: AnnotationTool

  // Visual properties
  color: string
  strokeWidth: number
  opacity: number

  // Position and bounds (percentage of page)
  x?: number
  y?: number
  width?: number
  height?: number
  rotation: number

  // Layer and grouping
  layerIndex: number
  groupId?: string

  // Creator info
  createdBy: string
  createdByName?: string
  createdOnDevice?: string

  // Sync state
  isSynced: boolean
  localId?: string

  // Tags and metadata
  tags: string[]
  metadata: Record<string, unknown>

  // Audit fields
  createdAt: string
  updatedAt: string
  syncedAt?: string
  deletedAt?: string
}

// Handwritten annotation
export interface HandwrittenAnnotation extends BaseAnnotation {
  annotationType: 'handwritten'
  pathData?: string // SVG path string
  strokePoints?: StrokePoint[] // Raw stroke data
}

// Highlight annotation
export interface HighlightAnnotation extends BaseAnnotation {
  annotationType: 'highlight'
  highlightedText: string
  textRange: TextRange
}

// Text note annotation
export interface TextNoteAnnotation extends BaseAnnotation {
  annotationType: 'text_note'
  textContent: string
  fontSize: number
  fontFamily: string
}

// Shape annotation
export interface ShapeAnnotation extends BaseAnnotation {
  annotationType: 'shape'
  shapeType: 'rectangle' | 'circle' | 'ellipse' | 'line' | 'arrow' | 'polygon'
  points?: { x: number; y: number }[] // For polygons and lines
  fillColor?: string
  isFilled?: boolean
}

// Stamp annotation
export interface StampAnnotation extends BaseAnnotation {
  annotationType: 'stamp'
  stampType: StampType
  stampImageUrl?: string // Custom stamp image
  stampText?: string // Text on stamp
}

// Signature annotation
export interface SignatureAnnotation extends BaseAnnotation {
  annotationType: 'signature'
  signatureData: string // Base64 encoded signature image
  signerName: string
  signedAt: string
}

// Union type for all annotations
export type DocumentAnnotation =
  | HandwrittenAnnotation
  | HighlightAnnotation
  | TextNoteAnnotation
  | ShapeAnnotation
  | StampAnnotation
  | SignatureAnnotation

// Annotation group
export interface AnnotationGroup {
  id: string
  organizationId: string
  documentId: string
  name?: string
  description?: string
  color?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  annotations?: DocumentAnnotation[]
}

// Create annotation input
export interface CreateAnnotationInput {
  organizationId: string
  documentId: string
  pageNumber?: number
  annotationType: AnnotationType
  tool?: AnnotationTool
  color?: string
  strokeWidth?: number
  opacity?: number
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  layerIndex?: number
  groupId?: string
  createdOnDevice?: string
  localId?: string
  tags?: string[]
  metadata?: Record<string, unknown>

  // Type-specific fields
  pathData?: string
  strokePoints?: StrokePoint[]
  textContent?: string
  fontSize?: number
  fontFamily?: string
  highlightedText?: string
  textRange?: TextRange
  shapeType?: string
  points?: { x: number; y: number }[]
  fillColor?: string
  isFilled?: boolean
  stampType?: StampType
  stampImageUrl?: string
  stampText?: string
  signatureData?: string
  signerName?: string
}

// Update annotation input
export interface UpdateAnnotationInput {
  color?: string
  strokeWidth?: number
  opacity?: number
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  layerIndex?: number
  groupId?: string
  textContent?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

// Annotation filters
export interface AnnotationFilters {
  documentId?: string
  pageNumber?: number
  annotationType?: AnnotationType | AnnotationType[]
  createdBy?: string
  groupId?: string
  fromDate?: string
  toDate?: string
}

// Annotation list response
export interface AnnotationListResponse {
  annotations: DocumentAnnotation[]
  total: number
  groups?: AnnotationGroup[]
}

// Batch annotation operations
export interface BatchAnnotationInput {
  create?: CreateAnnotationInput[]
  update?: { id: string; data: UpdateAnnotationInput }[]
  delete?: string[]
}

export interface BatchAnnotationResponse {
  created: DocumentAnnotation[]
  updated: DocumentAnnotation[]
  deleted: string[]
  errors?: { operation: string; id?: string; error: string }[]
}

// Annotation canvas state (for UI)
export interface AnnotationCanvasState {
  selectedTool: AnnotationTool | 'select' | 'pan'
  selectedColor: string
  strokeWidth: number
  opacity: number
  selectedAnnotationId?: string
  isDrawing: boolean
  currentStroke?: StrokePoint[]
  undoStack: DocumentAnnotation[][]
  redoStack: DocumentAnnotation[][]
}

// Annotation toolbar config
export interface AnnotationToolbarConfig {
  availableTools: AnnotationTool[]
  colors: string[]
  strokeWidths: number[]
  stamps: { type: StampType; label: string; icon?: string }[]
  allowSignature: boolean
  allowCustomStamps: boolean
}

// Export for use in other modules
export type {
  DocumentAnnotation as DocumentAnnotationType,
  StrokePoint as StrokePointType,
  AnnotationGroup as AnnotationGroupType,
}
