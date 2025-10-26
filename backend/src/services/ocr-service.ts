/**
 * OCR Service
 *
 * Hybrid OCR service using Tesseract (local) with Google Vision fallback.
 * Provides business card and document text extraction with Arabic/English support.
 *
 * @module ocr-service
 */

import sharp from 'sharp';
import { createWorker, Worker } from 'tesseract.js';
import vision from '@google-cloud/vision';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ExtractedContact {
  full_name?: string;
  organization?: string;
  position?: string;
  email_addresses?: string[];
  phone_numbers?: string[];
  confidence: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  method?: 'tesseract' | 'google-vision';
}

export class OCRService {
  private visionClient: vision.ImageAnnotatorClient | null = null;
  private tesseractWorker: Worker | null = null;
  private readonly CONFIDENCE_THRESHOLD = 75;

  constructor() {
    // Google Vision client will be initialized lazily if credentials are available
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.visionClient = new vision.ImageAnnotatorClient();
      }
    } catch (error) {
      console.warn('Google Vision API not configured, will use Tesseract only');
    }
  }

  /**
   * Initialize Tesseract worker with Arabic and English language packs
   */
  private async initTesseractWorker(): Promise<Worker> {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await createWorker(['eng', 'ara'], 1, {
        logger: (m) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Tesseract]', m);
          }
        }
      });
    }
    return this.tesseractWorker;
  }

  /**
   * Cleanup Tesseract worker
   */
  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   * - Resize to max 1200px width while maintaining aspect ratio
   * - Enhance contrast
   * - Apply denoising
   * - Convert to grayscale for better text recognition
   *
   * @param buffer - Image buffer
   * @returns Preprocessed image buffer
   */
  async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Calculate resize dimensions (max 1200px width)
      let resizeOptions: { width?: number; height?: number } = {};
      if (metadata.width && metadata.width > 1200) {
        resizeOptions.width = 1200;
      }

      // Preprocessing pipeline
      const processedBuffer = await image
        // Resize if needed
        .resize(resizeOptions)
        // Convert to grayscale for better OCR
        .grayscale()
        // Normalize to enhance contrast
        .normalize()
        // Apply median filter for denoising (3x3 kernel)
        .median(3)
        // Sharpen to improve text clarity
        .sharpen({
          sigma: 1.4,
          m1: 0.5,
          m2: 0.5
        })
        // Increase contrast slightly
        .linear(1.2, 0)
        // Ensure high quality output
        .png({ quality: 100, compressionLevel: 0 })
        .toBuffer();

      console.log(`Preprocessed image: ${metadata.width}x${metadata.height} -> ${resizeOptions.width || metadata.width}px`);
      return processedBuffer;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      // Return original buffer if preprocessing fails
      return buffer;
    }
  }

  /**
   * Extract text using Tesseract OCR (local processing)
   * Supports Arabic and English text extraction
   *
   * @param imagePath - Path to image file or Buffer
   * @returns Extracted text and confidence score
   */
  async extractTextTesseract(imagePath: string | Buffer): Promise<OCRResult> {
    try {
      const worker = await this.initTesseractWorker();

      // Read image if path provided
      const imageData = typeof imagePath === 'string'
        ? await fs.readFile(imagePath)
        : imagePath;

      // Preprocess the image
      const processedImage = await this.preprocessImage(imageData);

      // Perform OCR with both Arabic and English
      const result = await worker.recognize(processedImage);

      // Calculate overall confidence (Tesseract provides per-word confidence)
      const words = result.data.words || [];
      const averageConfidence = words.length > 0
        ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length
        : 0;

      return {
        text: result.data.text.trim(),
        confidence: Math.round(averageConfidence),
        method: 'tesseract'
      };
    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      throw new Error(`Tesseract OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text using Google Vision API (cloud fallback)
   * Requires user consent and Google Cloud credentials
   *
   * @param imagePath - Path to image file or Buffer
   * @returns Extracted text and confidence score
   */
  async extractTextGoogleVision(imagePath: string | Buffer): Promise<OCRResult> {
    if (!this.visionClient) {
      throw new Error('Google Vision API client not configured. Please set GOOGLE_APPLICATION_CREDENTIALS environment variable.');
    }

    try {
      // Read image if path provided
      const imageData = typeof imagePath === 'string'
        ? await fs.readFile(imagePath)
        : imagePath;

      // Preprocess the image
      const processedImage = await this.preprocessImage(imageData);

      // Perform text detection with language hints
      const [result] = await this.visionClient.textDetection({
        image: {
          content: processedImage.toString('base64')
        },
        imageContext: {
          languageHints: ['en', 'ar'] // English and Arabic
        }
      });

      const detections = result.textAnnotations || [];

      if (detections.length === 0) {
        return {
          text: '',
          confidence: 0,
          method: 'google-vision'
        };
      }

      // First annotation contains the full text
      const fullText = detections[0]?.description || '';

      // Calculate confidence based on detection vertices and bounds
      // Google Vision doesn't provide direct confidence scores for text detection
      // We estimate based on the quality of bounding boxes
      let confidence = 90; // Base confidence for Google Vision

      // Reduce confidence if text is too short or seems incomplete
      if (fullText.length < 10) confidence -= 20;
      if (!fullText.includes('@') && !fullText.match(/\+?\d{10,}/)) confidence -= 10;

      return {
        text: fullText.trim(),
        confidence: Math.max(0, Math.min(100, confidence)),
        method: 'google-vision'
      };
    } catch (error) {
      console.error('Google Vision API failed:', error);
      throw new Error(`Google Vision extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from business card with hybrid approach
   * Tries Tesseract first (local), falls back to Google Vision if needed
   *
   * @param imagePath - Path to image file or Buffer
   * @param consentCloudOCR - User consent for cloud processing
   * @returns Extracted text and confidence score
   */
  async extractBusinessCard(
    imagePath: string | Buffer,
    consentCloudOCR: boolean = false
  ): Promise<OCRResult> {
    let result: OCRResult;

    try {
      // Always try Tesseract first (local processing)
      console.log('Attempting OCR with Tesseract (local)...');
      result = await this.extractTextTesseract(imagePath);

      console.log(`Tesseract confidence: ${result.confidence}%`);

      // Check if we should fallback to Google Vision
      if (result.confidence < this.CONFIDENCE_THRESHOLD) {
        if (consentCloudOCR && this.visionClient) {
          console.log('Low confidence, attempting Google Vision (cloud)...');
          try {
            const visionResult = await this.extractTextGoogleVision(imagePath);

            // Use Vision result if it has higher confidence
            if (visionResult.confidence > result.confidence) {
              console.log(`Google Vision confidence: ${visionResult.confidence}% (using this)`);
              result = visionResult;
            } else {
              console.log(`Google Vision confidence: ${visionResult.confidence}% (keeping Tesseract)`);
            }
          } catch (visionError) {
            console.warn('Google Vision fallback failed, using Tesseract result:', visionError);
          }
        } else if (!consentCloudOCR) {
          console.log('Cloud OCR not consented, using Tesseract result despite low confidence');
        } else {
          console.log('Google Vision not available, using Tesseract result');
        }
      }

      return result;
    } catch (error) {
      console.error('Business card extraction failed:', error);
      throw new Error(`Business card extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse contact fields from raw OCR text
   * Uses regex patterns and heuristics to extract structured data
   *
   * @param rawText - Extracted text from OCR
   * @returns Parsed contact fields with confidence score
   */
  parseContactFields(rawText: string): ExtractedContact {
    const contact: ExtractedContact = {
      email_addresses: [],
      phone_numbers: [],
      confidence: 0
    };

    if (!rawText || rawText.trim().length === 0) {
      return contact;
    }

    // Split text into lines for better parsing
    const lines = rawText.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);

    // Email extraction with validation
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = rawText.match(emailRegex) || [];
    contact.email_addresses = [...new Set(emails.map(e => e.toLowerCase()))];

    // Phone number extraction (international formats)
    // Supports: +966501234567, 00966501234567, 0501234567, +1-555-123-4567
    const phoneRegex = /(?:\+|00)?[\d]?[\d\s\-\(\)]{7,20}/g;
    const phoneMatches = rawText.match(phoneRegex) || [];
    contact.phone_numbers = phoneMatches
      .map(p => p.replace(/[\s\-\(\)]/g, ''))
      .filter(p => p.length >= 7 && p.length <= 20)
      .filter(p => /^\+?[\d]+$/.test(p))
      .map(p => {
        // Normalize to E.164 format if possible
        if (!p.startsWith('+') && p.length === 10 && p.startsWith('05')) {
          // Saudi mobile number
          return '+966' + p.substring(1);
        }
        return p.startsWith('+') ? p : '+' + p;
      });

    // Name extraction (heuristics based on common patterns)
    // Usually the first 1-2 lines or lines with title case
    let potentialName = '';

    // Common job titles to identify and separate from names
    const titleKeywords = /\b(CEO|CTO|CFO|COO|Director|Manager|Engineer|Developer|Designer|Consultant|President|Vice President|VP|Head|Lead|Senior|Jr\.|Sr\.|Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\b/i;
    const organizationKeywords = /\b(Company|Corporation|Corp\.|Inc\.|LLC|Ltd\.|Limited|Group|Institute|University|College|Foundation|Association|Ministry|Department)\b/i;

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];

      // Skip lines that are clearly not names
      if (emailRegex.test(line) || phoneRegex.test(line)) continue;
      if (line.length < 3 || line.length > 50) continue;

      // Check if this might be a name (contains mostly letters)
      const letterRatio = (line.match(/[a-zA-Z\u0600-\u06FF\s]/g) || []).length / line.length;
      if (letterRatio < 0.7) continue;

      // First line with substantial text that's not a title/organization is likely the name
      if (!potentialName && !titleKeywords.test(line) && !organizationKeywords.test(line)) {
        potentialName = line;
      }

      // Look for position/title
      if (titleKeywords.test(line) && !contact.position) {
        contact.position = line;
      }

      // Look for organization
      if (organizationKeywords.test(line) && !contact.organization) {
        contact.organization = line;
      }
    }

    // Clean and assign name
    if (potentialName) {
      // Remove common prefixes if they're part of the name
      potentialName = potentialName.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
      contact.full_name = potentialName.trim();
    }

    // If we couldn't find organization from keywords, look for lines after position
    if (!contact.organization && contact.position) {
      const posIndex = lines.findIndex(l => l === contact.position);
      if (posIndex >= 0 && posIndex < lines.length - 1) {
        const nextLine = lines[posIndex + 1];
        if (!emailRegex.test(nextLine) && !phoneRegex.test(nextLine)) {
          contact.organization = nextLine;
        }
      }
    }

    // Calculate confidence based on extracted fields
    let fieldCount = 0;
    let totalFields = 5; // name, organization, position, email, phone

    if (contact.full_name) fieldCount++;
    if (contact.organization) fieldCount++;
    if (contact.position) fieldCount++;
    if (contact.email_addresses && contact.email_addresses.length > 0) fieldCount++;
    if (contact.phone_numbers && contact.phone_numbers.length > 0) fieldCount++;

    contact.confidence = Math.round((fieldCount / totalFields) * 100);

    // Additional confidence adjustments
    if (contact.full_name && contact.full_name.split(' ').length >= 2) {
      contact.confidence = Math.min(100, contact.confidence + 10);
    }
    if (contact.email_addresses && contact.email_addresses.length > 0) {
      contact.confidence = Math.min(100, contact.confidence + 10);
    }

    return contact;
  }
}
