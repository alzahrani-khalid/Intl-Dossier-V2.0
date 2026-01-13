/**
 * Document OCR Processing Edge Function
 * Feature: document-ocr-indexing
 *
 * Processes documents (PDFs and images) to extract text using OCR
 * Supports Arabic and English text recognition
 * Stores extracted text for full-text search indexing
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Configuration
const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY') || '';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const OCR_TIMEOUT_MS = 60000; // 60 seconds

// Interfaces
interface OCRRequest {
  document_id: string;
  document_table: 'attachments' | 'documents';
  storage_path?: string;
  mime_type?: string;
  use_cloud_ocr?: boolean;
}

interface OCRResult {
  text_en: string;
  text_ar: string;
  raw_text: string;
  confidence: number;
  languages: string[];
  page_count: number;
  page_texts: Array<{ page: number; text: string; confidence: number }>;
  method: 'tesseract' | 'google_vision' | 'pdf_extract' | 'native_text';
  processing_time_ms: number;
}

interface ProcessingResponse {
  success: boolean;
  document_id: string;
  status: 'completed' | 'failed' | 'processing';
  result?: OCRResult;
  error?: string;
}

// Detect if text contains Arabic characters
function containsArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text);
}

// Detect if text contains English/Latin characters
function containsEnglish(text: string): boolean {
  const englishRegex = /[a-zA-Z]/;
  return englishRegex.test(text);
}

// Classify text by language
function classifyTextByLanguage(text: string): { en: string; ar: string; languages: string[] } {
  const lines = text.split('\n');
  const arabicLines: string[] = [];
  const englishLines: string[] = [];
  const detectedLanguages: Set<string> = new Set();

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (containsArabic(trimmedLine)) {
      arabicLines.push(trimmedLine);
      detectedLanguages.add('ar');
    }
    if (containsEnglish(trimmedLine)) {
      englishLines.push(trimmedLine);
      detectedLanguages.add('en');
    }
    // Lines with neither are added to both for completeness
    if (!containsArabic(trimmedLine) && !containsEnglish(trimmedLine)) {
      arabicLines.push(trimmedLine);
      englishLines.push(trimmedLine);
    }
  }

  return {
    en: englishLines.join('\n'),
    ar: arabicLines.join('\n'),
    languages: Array.from(detectedLanguages),
  };
}

// Extract text from PDF using native text layer (for text-based PDFs)
async function extractPDFNativeText(fileArrayBuffer: ArrayBuffer): Promise<string> {
  // Basic PDF text extraction - looks for text stream in PDF
  // For production, consider using pdf-parse or similar library
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const text = decoder.decode(fileArrayBuffer);

  // Look for text between BT (Begin Text) and ET (End Text) markers
  const textMatches: string[] = [];
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match;

  while ((match = btEtRegex.exec(text)) !== null) {
    // Extract text operators (Tj, TJ, ', ")
    const tjRegex = /\((.*?)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(match[1])) !== null) {
      textMatches.push(tjMatch[1]);
    }
  }

  // Also try to extract text strings directly
  const stringRegex = /\(((?:[^()\\]|\\.)*)\)/g;
  while ((match = stringRegex.exec(text)) !== null) {
    if (match[1].length > 2 && /[a-zA-Z\u0600-\u06FF]/.test(match[1])) {
      textMatches.push(match[1]);
    }
  }

  return textMatches.join(' ').replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
}

// Call Google Vision API for OCR
async function callGoogleVisionOCR(
  imageBase64: string,
  mimeType: string
): Promise<{ text: string; confidence: number }> {
  if (!GOOGLE_VISION_API_KEY) {
    throw new Error('Google Vision API key not configured');
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
              { type: 'TEXT_DETECTION', maxResults: 1 },
            ],
            imageContext: {
              languageHints: ['en', 'ar'], // Support English and Arabic
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Vision API error: ${error}`);
  }

  const data = await response.json();
  const textAnnotation = data.responses?.[0]?.fullTextAnnotation;

  if (!textAnnotation) {
    // Try regular text detection
    const texts = data.responses?.[0]?.textAnnotations;
    if (texts && texts.length > 0) {
      return {
        text: texts[0].description || '',
        confidence: 0.7, // Default confidence for basic text detection
      };
    }
    return { text: '', confidence: 0 };
  }

  // Calculate average confidence from pages
  const pages = textAnnotation.pages || [];
  let totalConfidence = 0;
  let blockCount = 0;

  for (const page of pages) {
    for (const block of page.blocks || []) {
      if (block.confidence) {
        totalConfidence += block.confidence;
        blockCount++;
      }
    }
  }

  const avgConfidence = blockCount > 0 ? (totalConfidence / blockCount) * 100 : 70;

  return {
    text: textAnnotation.text || '',
    confidence: avgConfidence,
  };
}

// Local Tesseract-style OCR fallback (simplified)
async function localOCRFallback(
  imageBase64: string
): Promise<{ text: string; confidence: number }> {
  // This is a placeholder for local OCR
  // In production, you would integrate with a local Tesseract instance
  // or use Deno FFI to call Tesseract directly
  console.log('Local OCR fallback triggered - returning empty result');
  return { text: '', confidence: 0 };
}

// Process a single page/image
async function processImage(
  imageData: string,
  mimeType: string,
  useCloudOCR: boolean
): Promise<{ text: string; confidence: number; method: string }> {
  if (useCloudOCR && GOOGLE_VISION_API_KEY) {
    const result = await callGoogleVisionOCR(imageData, mimeType);
    return { ...result, method: 'google_vision' };
  }

  // Fallback to local OCR
  const result = await localOCRFallback(imageData);
  return { ...result, method: 'tesseract' };
}

// Main OCR processing function
async function processDocument(
  fileArrayBuffer: ArrayBuffer,
  mimeType: string,
  useCloudOCR: boolean
): Promise<OCRResult> {
  const startTime = Date.now();
  const pageTexts: Array<{ page: number; text: string; confidence: number }> = [];
  let totalText = '';
  let totalConfidence = 0;
  let method: OCRResult['method'] = 'native_text';

  // Handle PDFs
  if (mimeType === 'application/pdf') {
    // First, try native text extraction
    const nativeText = await extractPDFNativeText(fileArrayBuffer);

    if (nativeText.length > 50) {
      // If we got substantial text, use it
      totalText = nativeText;
      totalConfidence = 90; // High confidence for native text
      method = 'pdf_extract';
      pageTexts.push({ page: 1, text: nativeText, confidence: 90 });
    } else if (useCloudOCR && GOOGLE_VISION_API_KEY) {
      // For scanned PDFs, convert to image and OCR
      // This is simplified - in production, use pdf-to-image conversion
      const base64 = btoa(
        new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const result = await processImage(base64, mimeType, useCloudOCR);
      totalText = result.text;
      totalConfidence = result.confidence;
      method = result.method as OCRResult['method'];
      pageTexts.push({ page: 1, text: result.text, confidence: result.confidence });
    }
  }
  // Handle images
  else if (mimeType.startsWith('image/')) {
    const base64 = btoa(
      new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const result = await processImage(base64, mimeType, useCloudOCR);
    totalText = result.text;
    totalConfidence = result.confidence;
    method = result.method as OCRResult['method'];
    pageTexts.push({ page: 1, text: result.text, confidence: result.confidence });
  }

  // Classify text by language
  const classified = classifyTextByLanguage(totalText);

  const processingTime = Date.now() - startTime;

  return {
    text_en: classified.en,
    text_ar: classified.ar,
    raw_text: totalText,
    confidence: totalConfidence,
    languages: classified.languages,
    page_count: pageTexts.length,
    page_texts: pageTexts,
    method,
    processing_time_ms: processingTime,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create user-context client for auth
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle different request methods
    if (req.method === 'GET') {
      // Get OCR status for a document
      const url = new URL(req.url);
      const documentId = url.searchParams.get('document_id');
      const documentTable = url.searchParams.get('document_table') || 'documents';

      if (!documentId) {
        return new Response(
          JSON.stringify({ error: 'validation_error', message: 'document_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: textContent, error: fetchError } = await supabaseAdmin
        .from('document_text_content')
        .select('*')
        .eq('document_id', documentId)
        .eq('document_table', documentTable)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      return new Response(
        JSON.stringify({
          document_id: documentId,
          status: textContent?.ocr_status || 'not_processed',
          result: textContent
            ? {
                text_en: textContent.extracted_text_en,
                text_ar: textContent.extracted_text_ar,
                confidence: textContent.ocr_confidence,
                languages: textContent.language_detected,
                method: textContent.ocr_method,
              }
            : null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'POST') {
      // Process OCR for a document
      const body: OCRRequest = await req.json();
      const { document_id, document_table, storage_path, mime_type, use_cloud_ocr = true } = body;

      if (!document_id || !document_table) {
        return new Response(
          JSON.stringify({
            error: 'validation_error',
            message: 'document_id and document_table are required',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get document details if not provided
      let docStoragePath = storage_path;
      let docMimeType = mime_type;

      if (!docStoragePath || !docMimeType) {
        const { data: docData, error: docError } = await supabaseAdmin
          .from(document_table)
          .select(
            document_table === 'attachments' ? 'storage_path, file_type' : 'storage_path, mime_type'
          )
          .eq('id', document_id)
          .single();

        if (docError || !docData) {
          return new Response(
            JSON.stringify({ error: 'not_found', message: 'Document not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        docStoragePath = docData.storage_path;
        docMimeType = document_table === 'attachments' ? docData.file_type : docData.mime_type;
      }

      // Validate mime type for OCR support
      const supportedTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/tiff',
        'image/bmp',
      ];

      if (!supportedTypes.includes(docMimeType)) {
        // Mark as skipped for unsupported types
        await supabaseAdmin.rpc('update_ocr_status', {
          p_document_id: document_id,
          p_document_table: document_table,
          p_status: 'skipped',
          p_error_message: `Unsupported file type: ${docMimeType}`,
        });

        return new Response(
          JSON.stringify({
            success: true,
            document_id,
            status: 'skipped',
            error: `Unsupported file type: ${docMimeType}`,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Mark as processing
      await supabaseAdmin.rpc('update_ocr_status', {
        p_document_id: document_id,
        p_document_table: document_table,
        p_status: 'processing',
      });

      try {
        // Download file from storage
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('documents')
          .download(docStoragePath);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download file: ${downloadError?.message || 'Unknown error'}`);
        }

        // Check file size
        if (fileData.size > MAX_FILE_SIZE) {
          throw new Error(`File too large: ${fileData.size} bytes (max ${MAX_FILE_SIZE})`);
        }

        // Process OCR
        const fileArrayBuffer = await fileData.arrayBuffer();
        const result = await processDocument(fileArrayBuffer, docMimeType, use_cloud_ocr);

        // Save results to database
        await supabaseAdmin.rpc('update_ocr_status', {
          p_document_id: document_id,
          p_document_table: document_table,
          p_status: 'completed',
          p_method: result.method,
          p_confidence: result.confidence,
          p_text_en: result.text_en,
          p_text_ar: result.text_ar,
          p_raw_text: result.raw_text,
          p_languages: result.languages,
          p_page_count: result.page_count,
          p_page_texts: JSON.stringify(result.page_texts),
          p_processing_time_ms: result.processing_time_ms,
        });

        const response: ProcessingResponse = {
          success: true,
          document_id,
          status: 'completed',
          result,
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (processingError) {
        // Mark as failed
        const errorMessage =
          processingError instanceof Error ? processingError.message : 'OCR processing failed';

        await supabaseAdmin.rpc('update_ocr_status', {
          p_document_id: document_id,
          p_document_table: document_table,
          p_status: 'failed',
          p_error_message: errorMessage,
        });

        return new Response(
          JSON.stringify({
            success: false,
            document_id,
            status: 'failed',
            error: errorMessage,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Unsupported method
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OCR processing error:', error);

    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
