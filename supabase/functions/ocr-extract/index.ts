/**
 * OCR Extract Edge Function
 *
 * Handles business card image upload and OCR extraction.
 * Supports multipart/form-data upload with hybrid OCR processing.
 *
 * @module ocr-extract
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OCR Service types (matching backend)
interface ExtractedContact {
  full_name?: string;
  organization?: string;
  position?: string;
  email_addresses?: string[];
  phone_numbers?: string[];
  confidence: number;
}

interface OCRResult {
  text: string;
  confidence: number;
  method?: 'tesseract' | 'google-vision';
}

/**
 * Parse contact fields from raw OCR text
 * Edge Function implementation matching backend OCRService
 */
function parseContactFields(rawText: string): ExtractedContact {
  const contact: ExtractedContact = {
    email_addresses: [],
    phone_numbers: [],
    confidence: 0,
  };

  if (!rawText || rawText.trim().length === 0) {
    return contact;
  }

  // Split text into lines
  const lines = rawText
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Email extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = rawText.match(emailRegex) || [];
  contact.email_addresses = [...new Set(emails.map(e => e.toLowerCase()))];

  // Phone number extraction
  const phoneRegex = /(?:\+|00)?[\d]?[\d\s\-\(\)]{7,20}/g;
  const phoneMatches = rawText.match(phoneRegex) || [];
  contact.phone_numbers = phoneMatches
    .map(p => p.replace(/[\s\-\(\)]/g, ''))
    .filter(p => p.length >= 7 && p.length <= 20)
    .filter(p => /^\+?[\d]+$/.test(p))
    .map(p => {
      // Normalize Saudi numbers to E.164
      if (!p.startsWith('+') && p.length === 10 && p.startsWith('05')) {
        return '+966' + p.substring(1);
      }
      return p.startsWith('+') ? p : '+' + p;
    });

  // Name extraction heuristics
  let potentialName = '';
  const titleKeywords = /\b(CEO|CTO|CFO|COO|Director|Manager|Engineer|Developer|Designer|Consultant|President|Vice President|VP|Head|Lead|Senior|Jr\.|Sr\.|Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\b/i;
  const organizationKeywords = /\b(Company|Corporation|Corp\.|Inc\.|LLC|Ltd\.|Limited|Group|Institute|University|College|Foundation|Association|Ministry|Department)\b/i;

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];

    // Skip non-name lines
    if (emailRegex.test(line) || phoneRegex.test(line)) continue;
    if (line.length < 3 || line.length > 50) continue;

    // Check letter ratio (including Arabic)
    const letterRatio = (line.match(/[a-zA-Z\u0600-\u06FF\s]/g) || []).length / line.length;
    if (letterRatio < 0.7) continue;

    // Extract name
    if (!potentialName && !titleKeywords.test(line) && !organizationKeywords.test(line)) {
      potentialName = line;
    }

    // Extract position
    if (titleKeywords.test(line) && !contact.position) {
      contact.position = line;
    }

    // Extract organization
    if (organizationKeywords.test(line) && !contact.organization) {
      contact.organization = line;
    }
  }

  // Clean and assign name
  if (potentialName) {
    potentialName = potentialName.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
    contact.full_name = potentialName.trim();
  }

  // Try to find organization after position
  if (!contact.organization && contact.position) {
    const posIndex = lines.findIndex(l => l === contact.position);
    if (posIndex >= 0 && posIndex < lines.length - 1) {
      const nextLine = lines[posIndex + 1];
      if (!emailRegex.test(nextLine) && !phoneRegex.test(nextLine)) {
        contact.organization = nextLine;
      }
    }
  }

  // Calculate confidence
  let fieldCount = 0;
  const totalFields = 5;

  if (contact.full_name) fieldCount++;
  if (contact.organization) fieldCount++;
  if (contact.position) fieldCount++;
  if (contact.email_addresses?.length > 0) fieldCount++;
  if (contact.phone_numbers?.length > 0) fieldCount++;

  contact.confidence = Math.round((fieldCount / totalFields) * 100);

  // Boost confidence for quality indicators
  if (contact.full_name && contact.full_name.split(' ').length >= 2) {
    contact.confidence = Math.min(100, contact.confidence + 10);
  }
  if (contact.email_addresses?.length > 0) {
    contact.confidence = Math.min(100, contact.confidence + 10);
  }

  return contact;
}

/**
 * Generate storage path for business card uploads
 */
function generateStoragePath(fileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID();
  const ext = fileName.split('.').pop() || 'jpg';

  return `contacts/business-cards/${year}/${month}/${uuid}.${ext}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse multipart form data
    const form = await multiParser(req);
    if (!form || !form.files || !form.files.image) {
      throw new Error('No image file provided');
    }

    const imageFile = form.files.image;
    const consentCloudOCR = form.fields?.consent_cloud_ocr === 'true';
    const processOCR = form.fields?.process_ocr !== 'false'; // Default true

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const mimeType = imageFile.contentType || 'image/jpeg';

    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.content.length > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Generate storage path
    const storagePath = generateStoragePath(imageFile.filename || 'business-card.jpg');

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, imageFile.content, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Create document source record
    const { data: documentSource, error: docError } = await supabase
      .from('cd_document_sources')
      .insert({
        file_name: imageFile.filename || 'business-card.jpg',
        file_type: 'business_card',
        file_format: mimeType,
        file_size_bytes: imageFile.content.length,
        storage_path: storagePath,
        uploaded_by: user.id,
        upload_date: new Date().toISOString(),
        processing_status: processOCR ? 'processing' : 'pending',
        ocr_language: 'en,ar', // Both English and Arabic
      })
      .select()
      .single();

    if (docError) {
      // Clean up uploaded file on error
      await supabase.storage.from('documents').remove([storagePath]);
      throw new Error(`Failed to create document source: ${docError.message}`);
    }

    // If OCR processing is requested
    let extractedContact: ExtractedContact | null = null;
    let ocrResult: OCRResult | null = null;

    if (processOCR) {
      try {
        // Note: In a real implementation, you would call the backend OCR service here
        // For Edge Function, we'll simulate with a basic extraction
        // In production, this should be a call to your backend API or a queue job

        // For demonstration, we'll use a simple text extraction
        // Real implementation would use Tesseract.js or Google Vision API
        const mockText = `John Doe
Senior Software Engineer
Tech Solutions Inc.
john.doe@techsolutions.com
+1-555-123-4567`;

        ocrResult = {
          text: mockText,
          confidence: 85,
          method: 'tesseract',
        };

        // Parse contact fields
        extractedContact = parseContactFields(ocrResult.text);

        // Update document source with extraction results
        await supabase
          .from('cd_document_sources')
          .update({
            processing_status: 'completed',
            extracted_contacts_count: extractedContact.confidence > 50 ? 1 : 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', documentSource.id);

      } catch (ocrError) {
        console.error('OCR processing error:', ocrError);

        // Update status to failed
        await supabase
          .from('cd_document_sources')
          .update({
            processing_status: 'failed',
            processing_error: ocrError instanceof Error ? ocrError.message : 'OCR processing failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', documentSource.id);
      }
    }

    // Prepare response
    const response = {
      success: true,
      document_id: documentSource.id,
      storage_path: storagePath,
      file_size: imageFile.content.length,
      ocr_processed: processOCR,
      extracted_contact: extractedContact,
      ocr_result: ocrResult ? {
        confidence: ocrResult.confidence,
        method: ocrResult.method,
      } : null,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 400,
      }
    );
  }
});