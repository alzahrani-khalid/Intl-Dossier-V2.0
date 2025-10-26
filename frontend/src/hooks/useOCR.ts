/**
 * OCR Hooks
 * Part of: 027-contact-directory implementation - Phase 4 (Business Card Scanning)
 *
 * TanStack Query hooks for OCR operations with automatic error handling
 * and optimistic updates.
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
 * Automatically normalizes extracted fields and shows success/error toasts
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
 * Hook to prefetch OCR capabilities (for feature detection)
 * Can be used to check if cloud OCR is available
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
 * Utility function to check if OCR confidence is acceptable
 * @param confidence - Confidence score (0-100)
 * @returns boolean indicating if confidence is acceptable
 */
export function isConfidenceAcceptable(confidence: number): boolean {
  return confidence >= 70; // 70% threshold for acceptable confidence
}

/**
 * Get confidence level label for UI
 */
export function getConfidenceLevel(
  confidence: number
): 'high' | 'medium' | 'low' {
  if (confidence >= 85) return 'high';
  if (confidence >= 70) return 'medium';
  return 'low';
}

/**
 * Get confidence color for UI badges
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
 * Returns document_source_id and initiates background processing
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
 * Polls every 2 seconds while processing, stops when completed or failed
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
