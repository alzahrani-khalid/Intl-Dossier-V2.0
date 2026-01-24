/**
 * OCR Hooks
 * @module hooks/useOCR
 * @feature 027-contact-directory
 *
 * TanStack Query hooks for OCR operations with automatic field normalization,
 * toast notifications, and document processing status polling.
 *
 * @description
 * This module provides hooks for extracting text and data from images and documents:
 * - Business card scanning with field extraction (name, phone, email, etc.)
 * - Document upload with background processing
 * - Status polling with automatic completion detection
 * - Field normalization (cleaning phone numbers, emails, etc.)
 * - Confidence score tracking
 * - Multi-language support (en, ar)
 * - Cloud OCR consent handling (GDPR compliance)
 *
 * OCR providers:
 * - Tesseract.js (local, always available)
 * - Google Vision API (cloud, requires user consent)
 *
 * Confidence thresholds:
 * - High: ≥85% (reliable, auto-accept)
 * - Medium: 70-84% (review recommended)
 * - Low: <70% (manual verification required)
 *
 * @example
 * // Upload business card
 * const uploadMutation = useUploadBusinessCard();
 * uploadMutation.mutate({
 *   file: cardImageFile,
 *   consentCloudOCR: true
 * });
 *
 * @example
 * // Upload document with status polling
 * const uploadMutation = useUploadDocument();
 * const [documentId, setDocumentId] = useState<string | null>(null);
 *
 * const { data: status } = useDocumentStatus(documentId, {
 *   onCompleted: (data) => console.log('Processing complete!', data),
 *   onFailed: (error) => console.error('Processing failed:', error)
 * });
 */

import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import {
  uploadBusinessCard,
  normalizeOCRFields,
  uploadDocument,
  checkDocumentStatus,
  type OCRResponse,
  type OCRParsedFields,
  type DocumentUploadResponse,
  type DocumentStatusResponse,
  OCRAPIError,
} from '@/services/ocr-api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Upload Business Card Parameters
 */
export interface UploadBusinessCardParams {
  file: File;
  consentCloudOCR?: boolean;
}

/**
 * Normalized OCR Response with cleaned fields
 */
export interface NormalizedOCRResponse extends OCRResponse {
  normalized_fields: OCRParsedFields;
}

/**
 * Hook to upload and extract data from business card
 *
 * @description
 * Uploads a business card image and extracts contact information using OCR.
 * Automatically:
 * - Sends image to OCR service (Tesseract or Google Vision)
 * - Extracts structured fields (name, phone, email, organization, etc.)
 * - Normalizes fields (clean phone formatting, validate emails)
 * - Calculates confidence score
 * - Shows success toast with confidence and field count
 * - Shows error toast on failure
 *
 * Extracted fields:
 * - full_name, first_name, last_name
 * - job_title, organization
 * - email_addresses[] (array)
 * - phone_numbers[] (array with cleaned formatting)
 * - address, website
 *
 * User consent for cloud OCR:
 * - consentCloudOCR=false → Tesseract only (local processing)
 * - consentCloudOCR=true → Google Vision (higher accuracy, cloud processing)
 *
 * @returns TanStack Mutation with normalized OCR response
 *
 * @example
 * const uploadMutation = useUploadBusinessCard();
 *
 * const handleScan = (file: File) => {
 *   uploadMutation.mutate({
 *     file,
 *     consentCloudOCR: userConsented
 *   });
 * };
 *
 * useEffect(() => {
 *   if (uploadMutation.data) {
 *     const { normalized_fields, confidence } = uploadMutation.data;
 *     if (confidence >= 85) {
 *       // High confidence - auto-populate form
 *       setFormValues(normalized_fields);
 *     } else {
 *       // Low confidence - show for review
 *       setReviewFields(normalized_fields);
 *     }
 *   }
 * }, [uploadMutation.data]);
 *
 * @example
 * // With loading and error states
 * const { mutate, isPending, error, data } = useUploadBusinessCard();
 *
 * return (
 *   <div>
 *     <input
 *       type="file"
 *       accept="image/*"
 *       onChange={(e) => mutate({ file: e.target.files[0] })}
 *       disabled={isPending}
 *     />
 *     {isPending && <Spinner />}
 *     {data && (
 *       <ConfidenceBadge
 *         level={getConfidenceLevel(data.confidence)}
 *         score={data.confidence}
 *       />
 *     )}
 *   </div>
 * );
 */
export function useUploadBusinessCard(): UseMutationResult<
  NormalizedOCRResponse,
  OCRAPIError,
  UploadBusinessCardParams,
  unknown
> {
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: async ({ file, consentCloudOCR = false }: UploadBusinessCardParams) => {
      const result = await uploadBusinessCard(file, consentCloudOCR);

      // Normalize extracted fields
      const normalized_fields = normalizeOCRFields(result.parsed_fields);

      return {
        ...result,
        normalized_fields,
      };
    },
    onSuccess: (data) => {
      // Show success toast with extracted fields count
      const fieldsCount = Object.keys(data.normalized_fields).filter(
        (key) => {
          const value = data.normalized_fields[key as keyof OCRParsedFields];
          return value && (Array.isArray(value) ? value.length > 0 : true);
        }
      ).length;

      toast.success(
        t('contactDirectory.ocr.extraction_success', {
          confidence: Math.round(data.confidence),
          fieldsCount,
        })
      );
    },
    onError: (error: OCRAPIError) => {
      // Show error toast
      toast.error(
        t('contactDirectory.ocr.extraction_error', { error: error.message })
      );
    },
  });
}

/**
 * Hook to check OCR capabilities
 *
 * @description
 * Returns information about available OCR providers and supported languages.
 * Use this to conditionally show/hide cloud OCR consent checkboxes and
 * display supported language options.
 *
 * @returns OCR capabilities object
 *
 * @example
 * const capabilities = useOCRCapabilities();
 *
 * return (
 *   <div>
 *     {capabilities.googleVisionAvailable && (
 *       <Checkbox>
 *         Use cloud OCR for higher accuracy (requires consent)
 *       </Checkbox>
 *     )}
 *     <LanguageSelect languages={capabilities.languagesSupported} />
 *   </div>
 * );
 */
export function useOCRCapabilities() {
  // This could be expanded to check server capabilities
  // For now, we assume OCR is always available
  return {
    tesseractAvailable: true,
    googleVisionAvailable: true, // Requires user consent
    languagesSupported: ['en', 'ar'],
  };
}

/**
 * Check if OCR confidence score is acceptable
 *
 * @description
 * Returns true if confidence is ≥70% (medium or high).
 * Use this threshold to decide whether to auto-populate fields
 * or require manual review.
 *
 * @param confidence - Confidence score (0-100)
 * @returns boolean indicating if confidence is acceptable
 *
 * @example
 * if (isConfidenceAcceptable(ocrResult.confidence)) {
 *   autoPopulateForm(ocrResult.normalized_fields);
 * } else {
 *   showReviewDialog(ocrResult.normalized_fields);
 * }
 */
export function isConfidenceAcceptable(confidence: number): boolean {
  return confidence >= 70; // 70% threshold for acceptable confidence
}

/**
 * Get confidence level label for UI display
 *
 * @description
 * Maps confidence scores to human-readable levels:
 * - High: ≥85% (reliable, auto-accept recommended)
 * - Medium: 70-84% (review recommended)
 * - Low: <70% (manual verification required)
 *
 * @param confidence - Confidence score (0-100)
 * @returns Confidence level label
 *
 * @example
 * const level = getConfidenceLevel(82);
 * console.log(level); // 'medium'
 *
 * return <Badge>{level} confidence</Badge>;
 */
export function getConfidenceLevel(
  confidence: number
): 'high' | 'medium' | 'low' {
  if (confidence >= 85) return 'high';
  if (confidence >= 70) return 'medium';
  return 'low';
}

/**
 * Get Tailwind CSS classes for confidence badge styling
 *
 * @description
 * Returns color classes based on confidence level for consistent UI styling.
 * Use these classes on badges, pills, or indicators to show confidence visually.
 *
 * @param confidence - Confidence score (0-100)
 * @returns Tailwind CSS class string
 *
 * @example
 * const classes = getConfidenceColor(confidence);
 * return (
 *   <span className={`px-2 py-1 rounded ${classes}`}>
 *     {Math.round(confidence)}%
 *   </span>
 * );
 */
export function getConfidenceColor(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-red-100 text-red-800 border-red-300';
  }
}

/**
 * Upload Document Parameters
 */
export interface UploadDocumentParams {
  file: File;
}

/**
 * Hook to upload document for contact extraction
 *
 * @description
 * Uploads a document (PDF, DOCX, images) for background OCR processing.
 * Returns a document_source_id immediately and starts asynchronous processing.
 * Use with useDocumentStatus hook to poll for completion.
 *
 * Background processing:
 * - Document uploaded to storage
 * - OCR processing queued
 * - Text extraction and parsing
 * - Contact information extraction
 * - Results stored in database
 *
 * Automatically shows success/error toasts.
 *
 * @returns TanStack Mutation with document upload response
 *
 * @example
 * const uploadMutation = useUploadDocument();
 * const [documentId, setDocumentId] = useState<string | null>(null);
 *
 * const handleUpload = (file: File) => {
 *   uploadMutation.mutate({ file }, {
 *     onSuccess: (data) => {
 *       setDocumentId(data.document_source_id);
 *     }
 *   });
 * };
 *
 * @example
 * // With loading state
 * const { mutate, isPending } = useUploadDocument();
 *
 * return (
 *   <button onClick={() => mutate({ file })} disabled={isPending}>
 *     {isPending ? 'Uploading...' : 'Upload Document'}
 *   </button>
 * );
 */
export function useUploadDocument(): UseMutationResult<
  DocumentUploadResponse,
  OCRAPIError,
  UploadDocumentParams,
  unknown
> {
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: async ({ file }: UploadDocumentParams) => {
      return await uploadDocument(file);
    },
    onSuccess: () => {
      toast.success(t('contactDirectory.documentExtraction.upload_success'));
    },
    onError: (error: OCRAPIError) => {
      toast.error(
        t('contactDirectory.documentExtraction.upload_error', { error: error.message })
      );
    },
  });
}

/**
 * Hook to check document processing status with automatic polling
 *
 * @description
 * Polls the OCR processing status of a document every 2 seconds until completion
 * or failure. Automatically:
 * - Starts polling when document ID is provided
 * - Stops polling when status becomes 'completed' or 'failed'
 * - Calls onCompleted callback with extracted contacts
 * - Calls onFailed callback with error message
 * - Continues polling even when browser tab is not focused
 *
 * Status values:
 * - pending: Queued for processing
 * - processing: OCR in progress
 * - completed: Extraction finished successfully
 * - failed: Processing encountered an error
 *
 * @param documentSourceId - Document ID from useUploadDocument
 * @param options - Polling configuration options
 * @param options.enabled - Whether to enable polling (default: true if documentSourceId exists)
 * @param options.onCompleted - Callback when processing completes successfully
 * @param options.onFailed - Callback when processing fails
 * @returns TanStack Query result with document status
 *
 * @example
 * const { data: status, isLoading } = useDocumentStatus(documentId, {
 *   onCompleted: (data) => {
 *     console.log('Extraction complete!');
 *     console.log('Contacts found:', data.extracted_contacts?.length);
 *   },
 *   onFailed: (error) => {
 *     console.error('Processing failed:', error);
 *   }
 * });
 *
 * return (
 *   <div>
 *     {status?.processing_status === 'processing' && (
 *       <ProgressBar
 *         value={status.progress_percent}
 *         label={`Processing: ${status.current_step}`}
 *       />
 *     )}
 *     {status?.processing_status === 'completed' && (
 *       <ContactList contacts={status.extracted_contacts} />
 *     )}
 *   </div>
 * );
 *
 * @example
 * // Conditional polling
 * const { data } = useDocumentStatus(documentId, {
 *   enabled: userWantsToTrackProgress
 * });
 */
export function useDocumentStatus(
  documentSourceId: string | null,
  options?: {
    enabled?: boolean;
    onCompleted?: (data: DocumentStatusResponse) => void;
    onFailed?: (error: string) => void;
  }
): UseQueryResult<DocumentStatusResponse, OCRAPIError> {
  return useQuery({
    queryKey: ['document-status', documentSourceId],
    queryFn: async () => {
      if (!documentSourceId) throw new OCRAPIError('Document source ID is required', 400);
      return await checkDocumentStatus(documentSourceId);
    },
    enabled: options?.enabled !== false && !!documentSourceId,
    refetchInterval: (query) => {
      // Stop polling if processing is complete or failed
      const data = query.state.data;
      if (!data) return false;
      if (data.processing_status === 'completed') {
        options?.onCompleted?.(data);
        return false;
      }
      if (data.processing_status === 'failed') {
        options?.onFailed?.(data.processing_error || 'Processing failed');
        return false;
      }
      // Continue polling every 2 seconds while pending or processing
      return 2000;
    },
    refetchIntervalInBackground: true, // Continue polling even when tab is not focused
  });
}
