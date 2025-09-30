import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AfterActionRecord } from './useAfterAction';

export interface GeneratePDFRequest {
  mfa_token?: string;
  language?: 'en' | 'ar' | 'both';
}

export interface GeneratePDFResponse {
  pdf_url: string; // Signed URL with 24-hour expiry
  generated_at: string;
}

export interface GeneratePDFError {
  error: string;
  message: string;
  requires_mfa?: boolean;
}

// Generate bilingual PDF for after-action record
export function useGeneratePDF(id: string, afterAction?: AfterActionRecord) {
  return useMutation<GeneratePDFResponse, GeneratePDFError, GeneratePDFRequest>({
    mutationFn: async (request) => {
      const { data, error } = await supabase.functions.invoke('pdf-generate', {
        body: { id, language: 'both', ...request },
      });

      if (error) {
        // Check if step-up MFA is required for confidential records
        if (error.message?.includes('step_up_required') || error.message?.includes('MFA')) {
          throw {
            error: 'step_up_required',
            message: 'This record is confidential. MFA verification required to generate PDF.',
            requires_mfa: true,
          } as GeneratePDFError;
        }
        throw {
          error: error.message || 'unknown_error',
          message: error.message || 'Failed to generate PDF',
        } as GeneratePDFError;
      }

      return data as GeneratePDFResponse;
    },
  });
}

// Helper hook to check if MFA is required for PDF generation
export function useCheckPDFMFARequired(afterAction: AfterActionRecord | undefined) {
  return {
    mfaRequired: afterAction?.is_confidential ?? false,
    canGeneratePDF: afterAction?.publication_status === 'published',
  };
}

// Helper to download PDF from signed URL
export async function downloadPDF(pdfUrl: string, fileName: string) {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF download error:', error);
    throw new Error('Failed to download PDF file');
  }
}

// Helper to format PDF filename
export function formatPDFFileName(afterAction: AfterActionRecord | undefined, language: 'en' | 'ar' | 'both') {
  if (!afterAction) return 'after-action.pdf';

  const date = new Date(afterAction.created_at).toISOString().split('T')[0];
  const langSuffix = language === 'both' ? 'bilingual' : language;
  const confidentialSuffix = afterAction.is_confidential ? '_CONFIDENTIAL' : '';

  return `after-action_${afterAction.id.substring(0, 8)}_${date}_${langSuffix}${confidentialSuffix}.pdf`;
}

// Helper to check if PDF URL is still valid (within 24 hours)
export function isPDFURLValid(generatedAt: string): boolean {
  const generated = new Date(generatedAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - generated) / (1000 * 60 * 60);

  return hoursElapsed < 24;
}
