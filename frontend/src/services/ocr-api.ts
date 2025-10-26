/**
 * OCR API Client
 * Part of: 027-contact-directory implementation - Phase 4 (Business Card Scanning)
 *
 * Typed API client for OCR operations using Supabase Edge Functions.
 * Handles business card image upload, OCR processing, and field extraction.
 */

import { supabase } from '@/lib/supabase';

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

/**
 * Parsed field from OCR extraction
 */
export interface OCRParsedFields {
  full_name?: string;
  organization?: string;
  position?: string;
  email_addresses?: string[];
  phone_numbers?: string[];
  website?: string;
  address?: string;
}

/**
 * OCR Extraction Response
 */
export interface OCRResponse {
  text: string; // Raw OCR text
  confidence: number; // 0-100 overall confidence score
  parsed_fields: OCRParsedFields; // Structured extracted fields
  ocr_method: 'tesseract' | 'google_vision' | 'local'; // OCR engine used
  language_detected?: string; // Detected language (e.g., 'en', 'ar')
  processing_time_ms?: number; // Processing time in milliseconds
}

/**
 * API Error
 */
export class OCRAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OCRAPIError';
  }
}

/**
 * Get authorization headers with current user's JWT token
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new OCRAPIError('Not authenticated', 401);
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

/**
 * Handle Edge Function responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }
    throw new OCRAPIError(errorMessage, response.status);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new OCRAPIError('Failed to parse response', response.status, error);
  }
}

/**
 * Upload and extract text from business card image
 *
 * @param file - Image file (JPEG, PNG, HEIC/HEIF)
 * @param consentCloudOCR - Whether user consented to cloud OCR (Google Vision API)
 * @returns OCR extraction result with parsed fields
 */
export async function uploadBusinessCard(
  file: File,
  consentCloudOCR: boolean = false
): Promise<OCRResponse> {
  // Validate file type
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
  ];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new OCRAPIError(
      'Invalid file type. Please upload JPEG, PNG, or HEIC image.',
      400
    );
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new OCRAPIError(
      'File too large. Maximum size is 10MB.',
      400
    );
  }

  const headers = await getAuthHeaders();

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append('image', file);
  formData.append('consent_cloud_ocr', String(consentCloudOCR));

  const response = await fetch(`${supabaseUrl}/functions/v1/ocr-extract`, {
    method: 'POST',
    headers, // Note: Don't set Content-Type for FormData, browser will set it with boundary
    body: formData,
  });

  return handleResponse<OCRResponse>(response);
}

/**
 * Validate extracted email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate extracted phone number format (basic check)
 */
export function isValidPhone(phone: string): boolean {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Check if it contains at least 7 digits
  return /\d{7,}/.test(cleaned);
}

/**
 * Clean and normalize OCR extracted fields
 * Removes duplicates, validates formats, and normalizes data
 */
export function normalizeOCRFields(fields: OCRParsedFields): OCRParsedFields {
  const normalized: OCRParsedFields = { ...fields };

  // Normalize full name (trim, title case)
  if (normalized.full_name) {
    normalized.full_name = normalized.full_name.trim();
  }

  // Normalize organization and position
  if (normalized.organization) {
    normalized.organization = normalized.organization.trim();
  }
  if (normalized.position) {
    normalized.position = normalized.position.trim();
  }

  // Validate and deduplicate emails
  if (normalized.email_addresses && normalized.email_addresses.length > 0) {
    normalized.email_addresses = Array.from(
      new Set(
        normalized.email_addresses
          .map((e) => e.toLowerCase().trim())
          .filter(isValidEmail)
      )
    );
  }

  // Deduplicate and clean phone numbers
  if (normalized.phone_numbers && normalized.phone_numbers.length > 0) {
    normalized.phone_numbers = Array.from(
      new Set(
        normalized.phone_numbers
          .map((p) => p.trim())
          .filter(isValidPhone)
      )
    );
  }

  return normalized;
}

/**
 * Document Upload Response
 */
export interface DocumentUploadResponse {
  document_source_id: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Extracted Contact from Document
 */
export interface ExtractedContact {
  full_name: string;
  organization?: string;
  position?: string;
  email_addresses?: string[];
  phone_numbers?: string[];
  confidence: number; // 0-100 confidence score for this contact
  source_page?: number; // Page number where contact was found
}

/**
 * Document Status Response
 */
export interface DocumentStatusResponse {
  document_source_id: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_contacts?: ExtractedContact[];
  extracted_contacts_count: number;
  processing_error?: string;
  file_name: string;
  file_type: string;
  file_format: string;
  processing_time_ms?: number;
}

/**
 * Upload and extract contacts from document
 *
 * @param file - Document file (PDF, DOCX, TXT, CSV)
 * @returns Document upload response with processing status
 */
export async function uploadDocument(file: File): Promise<DocumentUploadResponse> {
  // Validate file type
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const fileExtension = file.name.toLowerCase().split('.').pop();
  const validExtensions = ['pdf', 'docx', 'doc', 'txt', 'csv', 'xls', 'xlsx'];

  if (!validTypes.includes(file.type.toLowerCase()) && !validExtensions.includes(fileExtension || '')) {
    throw new OCRAPIError(
      'Invalid file type. Please upload PDF, DOCX, DOC, TXT, CSV, or Excel file.',
      400
    );
  }

  // Validate file size (max 50MB for documents)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new OCRAPIError(
      'File too large. Maximum size is 50MB.',
      400
    );
  }

  const headers = await getAuthHeaders();

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${supabaseUrl}/functions/v1/contacts-extract-document`, {
    method: 'POST',
    headers: {
      Authorization: headers.Authorization, // Only send auth header, let browser set Content-Type with boundary
    },
    body: formData,
  });

  return handleResponse<DocumentUploadResponse>(response);
}

/**
 * Check document processing status and get extracted contacts
 *
 * @param documentSourceId - Document source UUID
 * @returns Document status with extracted contacts if processing is complete
 */
export async function checkDocumentStatus(
  documentSourceId: string
): Promise<DocumentStatusResponse> {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${supabaseUrl}/functions/v1/contacts-extract-document/${documentSourceId}`,
    {
      method: 'GET',
      headers,
    }
  );

  return handleResponse<DocumentStatusResponse>(response);
}
