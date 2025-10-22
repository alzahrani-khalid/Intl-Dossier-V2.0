/**
 * PDF Generation - Type Definitions
 * Feature: 022-after-action-structured (User Story 3)
 *
 * TypeScript interfaces for bilingual PDF generation (English + Arabic) with RTL support.
 * Supports professional distribution packages with organization branding and confidentiality markings.
 */

import { z } from 'zod';
import { ConfidentialityLevel } from './after-action.types';

/**
 * PDF generation status
 */
export enum PDFGenerationStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Supported PDF languages
 */
export enum PDFLanguage {
  ENGLISH = 'en',
  ARABIC = 'ar',
}

/**
 * PDF layout direction
 */
export enum LayoutDirection {
  LTR = 'ltr',
  RTL = 'rtl',
}

/**
 * PDF generation request
 */
export interface PDFGenerationRequest {
  after_action_id: string;
  include_confidential_sections?: boolean;
  include_attachments_list?: boolean;
  include_version_history?: boolean;
  watermark_text?: string;
}

/**
 * PDF file metadata
 */
export interface PDFFile {
  language: PDFLanguage;
  file_name: string;
  file_size: number;
  storage_path: string;
  storage_url?: string; // 24h signed URL
  page_count: number;
  generated_at: string;
}

/**
 * Bilingual PDF response
 */
export interface BilingualPDFResponse {
  after_action_id: string;
  english_pdf: PDFFile;
  arabic_pdf: PDFFile;
  generation_metadata: {
    total_generation_time_ms: number;
    english_generation_time_ms: number;
    arabic_generation_time_ms: number;
    total_size_bytes: number;
    generated_by: string;
    generated_at: string;
  };
}

/**
 * PDF generation job (for async generation)
 */
export interface PDFGenerationJob {
  job_id: string;
  after_action_id: string;
  status: PDFGenerationStatus;
  requested_by: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  result?: BilingualPDFResponse;
}

/**
 * PDF document structure
 */
export interface PDFDocumentStructure {
  // Header
  organization_logo?: string; // Base64 or URL
  confidentiality_marking: ConfidentialityLevel;
  document_title: string;
  document_subtitle?: string;
  generation_date: string;

  // Content sections
  sections: PDFSection[];

  // Footer
  page_numbers: boolean;
  footer_text?: string;
  watermark?: string;
}

/**
 * PDF section
 */
export interface PDFSection {
  title: string;
  content: PDFContent[];
  page_break_after?: boolean;
}

/**
 * PDF content types
 */
export type PDFContent =
  | PDFTextContent
  | PDFListContent
  | PDFTableContent
  | PDFImageContent
  | PDFSpacerContent;

export interface PDFTextContent {
  type: 'text';
  text: string;
  style?: 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption' | 'emphasis';
  align?: 'start' | 'center' | 'end';
  color?: string;
}

export interface PDFListContent {
  type: 'list';
  items: string[];
  ordered?: boolean;
  start_number?: number;
}

export interface PDFTableContent {
  type: 'table';
  headers: string[];
  rows: string[][];
  column_widths?: number[];
}

export interface PDFImageContent {
  type: 'image';
  source: string; // Base64 or URL
  width?: number;
  height?: number;
  align?: 'start' | 'center' | 'end';
  caption?: string;
}

export interface PDFSpacerContent {
  type: 'spacer';
  height: number;
}

/**
 * PDF styling configuration
 */
export interface PDFStyleConfig {
  language: PDFLanguage;
  direction: LayoutDirection;
  font_family: string;
  font_size_body: number;
  font_size_heading1: number;
  font_size_heading2: number;
  font_size_heading3: number;
  font_size_caption: number;
  line_height: number;
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  page_size: 'A4' | 'Letter';
  colors: {
    primary: string;
    secondary: string;
    text: string;
    text_light: string;
    border: string;
    background: string;
    confidential: string;
  };
}

/**
 * Font configuration for multilingual support
 */
export interface FontConfig {
  english: {
    regular: string; // Path to Noto Sans Regular
    bold: string; // Path to Noto Sans Bold
    italic: string; // Path to Noto Sans Italic
  };
  arabic: {
    regular: string; // Path to Noto Sans Arabic Regular
    bold: string; // Path to Noto Sans Arabic Bold
  };
}

/**
 * PDF generation error types
 */
export enum PDFErrorCode {
  AFTER_ACTION_NOT_FOUND = 'AFTER_ACTION_NOT_FOUND',
  AFTER_ACTION_NOT_PUBLISHED = 'AFTER_ACTION_NOT_PUBLISHED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FONT_FILE_MISSING = 'FONT_FILE_MISSING',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',
  STORAGE_UPLOAD_FAILED = 'STORAGE_UPLOAD_FAILED',
  INVALID_CONTENT = 'INVALID_CONTENT',
}

export interface PDFGenerationError {
  code: PDFErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Zod Validation Schemas for PDF Generation
 */

// PDF generation request schema
export const pdfGenerationRequestSchema = z.object({
  after_action_id: z.string().uuid('Invalid after-action ID'),
  include_confidential_sections: z.boolean().default(true),
  include_attachments_list: z.boolean().default(true),
  include_version_history: z.boolean().default(false),
  watermark_text: z.string().max(50, 'Watermark text must be at most 50 characters').optional(),
});

// PDF file metadata schema
export const pdfFileSchema = z.object({
  language: z.nativeEnum(PDFLanguage),
  file_name: z.string().min(1),
  file_size: z.number().int().positive(),
  storage_path: z.string().min(1),
  storage_url: z.string().url().optional(),
  page_count: z.number().int().positive(),
  generated_at: z.string().datetime(),
});

// Bilingual PDF response schema
export const bilingualPDFResponseSchema = z.object({
  after_action_id: z.string().uuid(),
  english_pdf: pdfFileSchema,
  arabic_pdf: pdfFileSchema,
  generation_metadata: z.object({
    total_generation_time_ms: z.number().int().positive(),
    english_generation_time_ms: z.number().int().positive(),
    arabic_generation_time_ms: z.number().int().positive(),
    total_size_bytes: z.number().int().positive(),
    generated_by: z.string().uuid(),
    generated_at: z.string().datetime(),
  }),
});

// Export types inferred from schemas
export type PDFGenerationRequestInput = z.infer<typeof pdfGenerationRequestSchema>;
export type PDFFileOutput = z.infer<typeof pdfFileSchema>;
export type BilingualPDFResponseOutput = z.infer<typeof bilingualPDFResponseSchema>;

/**
 * Default PDF styling configurations
 */

export const DEFAULT_ENGLISH_STYLE: PDFStyleConfig = {
  language: PDFLanguage.ENGLISH,
  direction: LayoutDirection.LTR,
  font_family: 'Noto Sans',
  font_size_body: 11,
  font_size_heading1: 20,
  font_size_heading2: 16,
  font_size_heading3: 13,
  font_size_caption: 9,
  line_height: 1.5,
  margin_top: 72, // 1 inch
  margin_bottom: 72,
  margin_left: 72,
  margin_right: 72,
  page_size: 'A4',
  colors: {
    primary: '#1a56db',
    secondary: '#6b7280',
    text: '#111827',
    text_light: '#6b7280',
    border: '#d1d5db',
    background: '#ffffff',
    confidential: '#dc2626',
  },
};

export const DEFAULT_ARABIC_STYLE: PDFStyleConfig = {
  language: PDFLanguage.ARABIC,
  direction: LayoutDirection.RTL,
  font_family: 'Noto Sans Arabic',
  font_size_body: 12, // Slightly larger for Arabic
  font_size_heading1: 22,
  font_size_heading2: 18,
  font_size_heading3: 14,
  font_size_caption: 10,
  line_height: 1.6,
  margin_top: 72,
  margin_bottom: 72,
  margin_left: 72, // Will be mirrored in RTL layout
  margin_right: 72,
  page_size: 'A4',
  colors: {
    primary: '#1a56db',
    secondary: '#6b7280',
    text: '#111827',
    text_light: '#6b7280',
    border: '#d1d5db',
    background: '#ffffff',
    confidential: '#dc2626',
  },
};

/**
 * Helper functions
 */

/**
 * Get style configuration for language
 */
export function getStyleForLanguage(language: PDFLanguage): PDFStyleConfig {
  return language === PDFLanguage.ARABIC ? DEFAULT_ARABIC_STYLE : DEFAULT_ENGLISH_STYLE;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Estimate PDF generation time based on content complexity
 */
export function estimateGenerationTime(
  decisionsCount: number,
  commitmentsCount: number,
  risksCount: number,
  followUpsCount: number,
  attachmentsCount: number
): number {
  const baseTime = 2000; // 2 seconds base
  const entityTime = (decisionsCount + commitmentsCount + risksCount + followUpsCount) * 100; // 100ms per entity
  const attachmentTime = attachmentsCount * 200; // 200ms per attachment metadata
  return baseTime + entityTime + attachmentTime;
}
