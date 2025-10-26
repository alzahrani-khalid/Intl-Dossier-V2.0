/**
 * OCR Processor Module
 *
 * Handles OCR processing using Tesseract.js in Deno environment.
 * This module provides the actual OCR functionality for the Edge Function.
 *
 * @module ocr-processor
 */

import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';

// OCR Result types
export interface OCRResult {
  text: string;
  confidence: number;
  method: 'tesseract' | 'google-vision' | 'edge-function';
}

export interface ExtractedContact {
  full_name?: string;
  organization?: string;
  position?: string;
  email_addresses?: string[];
  phone_numbers?: string[];
  confidence: number;
}

/**
 * Preprocess image for better OCR accuracy
 * Uses Deno-compatible image processing
 */
export async function preprocessImage(imageBuffer: Uint8Array): Promise<Uint8Array> {
  try {
    // Decode image
    const image = await Image.decode(imageBuffer);

    // Resize if too large (max 1200px width)
    if (image.width > 1200) {
      const scale = 1200 / image.width;
      image.resize(Math.round(image.width * scale), Math.round(image.height * scale));
    }

    // Convert to grayscale for better OCR
    // Apply simple grayscale conversion
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const pixel = image.getPixelAt(x, y);
        const gray = Math.round(0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]);
        image.setPixelAt(x, y, [gray, gray, gray, pixel[3]]);
      }
    }

    // Encode back to buffer
    return await image.encode();
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    return imageBuffer; // Return original if preprocessing fails
  }
}

/**
 * Perform OCR using Tesseract via external API
 * Note: In production, you would call your backend service or use Tesseract WASM
 */
export async function performOCR(
  imageBuffer: Uint8Array,
  consentCloudOCR: boolean = false
): Promise<OCRResult> {
  // Preprocess the image
  const processedImage = await preprocessImage(imageBuffer);

  // In a real implementation, you would:
  // 1. Call your backend OCR service API
  // 2. Or use Tesseract.js WASM build for Deno
  // 3. Or call Google Vision API directly

  // For now, return a mock result
  // This should be replaced with actual OCR implementation
  return {
    text: '',
    confidence: 0,
    method: 'edge-function'
  };
}

/**
 * Parse contact fields from raw OCR text
 * Comprehensive extraction with Arabic support
 */
export function parseContactFields(rawText: string): ExtractedContact {
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

  // Email extraction with validation
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = rawText.match(emailRegex) || [];
  contact.email_addresses = [...new Set(emails.map(e => e.toLowerCase()))];

  // Phone number extraction (international formats)
  const phoneRegex = /(?:\+|00)?[\d]?[\d\s\-\(\)]{7,20}/g;
  const phoneMatches = rawText.match(phoneRegex) || [];

  contact.phone_numbers = phoneMatches
    .map(p => p.replace(/[\s\-\(\)]/g, ''))
    .filter(p => p.length >= 7 && p.length <= 20)
    .filter(p => /^\+?[\d]+$/.test(p))
    .map(p => {
      // Normalize to E.164 format
      if (!p.startsWith('+')) {
        // Saudi mobile number format
        if (p.length === 10 && p.startsWith('05')) {
          return '+966' + p.substring(1);
        }
        // Add + if missing
        return '+' + p;
      }
      return p;
    })
    .filter((p, i, arr) => arr.indexOf(p) === i); // Remove duplicates

  // Enhanced name extraction with Arabic support
  let potentialName = '';

  // Job title patterns (English and common Arabic titles)
  const titleKeywords = /\b(CEO|CTO|CFO|COO|CMO|CIO|Director|Manager|Engineer|Developer|Designer|Consultant|Analyst|President|Vice President|VP|EVP|SVP|Head|Lead|Senior|Junior|Jr\.|Sr\.|Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|مدير|رئيس|نائب|مهندس|محلل|مستشار|أستاذ|دكتور)\b/i;

  // Organization patterns
  const organizationKeywords = /\b(Company|Corporation|Corp\.|Inc\.|LLC|Ltd\.|Limited|GmbH|AG|SA|Group|Institute|University|College|Foundation|Association|Ministry|Department|Agency|Authority|Commission|Council|Committee|شركة|مؤسسة|جامعة|كلية|وزارة|هيئة|مجلس|لجنة)\b/i;

  // Process lines to extract fields
  for (let i = 0; i < Math.min(lines.length, 7); i++) {
    const line = lines[i];

    // Skip lines that are clearly not names
    if (emailRegex.test(line) || phoneRegex.test(line)) continue;
    if (line.length < 2 || line.length > 100) continue;

    // Check if line contains mostly letters (including Arabic)
    const letterRatio = (line.match(/[a-zA-Z\u0600-\u06FF\u0750-\u077F\s\-'\.]/g) || []).length / line.length;
    if (letterRatio < 0.6) continue;

    // Extract name (usually first suitable line)
    if (!potentialName && !titleKeywords.test(line) && !organizationKeywords.test(line)) {
      // Check if it looks like a name
      const wordCount = line.split(/\s+/).length;
      if (wordCount >= 2 && wordCount <= 5) {
        potentialName = line;
      }
    }

    // Extract position/title
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
    // Remove common prefixes
    potentialName = potentialName.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|د\.|أ\.)\s+/i, '');
    contact.full_name = potentialName.trim();
  }

  // Try to infer organization from context
  if (!contact.organization && contact.position) {
    const posIndex = lines.findIndex(l => l === contact.position);
    if (posIndex >= 0 && posIndex < lines.length - 1) {
      const nextLine = lines[posIndex + 1];
      if (!emailRegex.test(nextLine) && !phoneRegex.test(nextLine) && nextLine.length > 2) {
        contact.organization = nextLine;
      }
    }
  }

  // Advanced: Extract organization from email domain
  if (!contact.organization && contact.email_addresses && contact.email_addresses.length > 0) {
    const email = contact.email_addresses[0];
    const domain = email.split('@')[1];

    // Skip generic email providers
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (!genericDomains.includes(domain.toLowerCase())) {
      // Extract organization name from domain
      const orgName = domain.split('.')[0];
      if (orgName.length > 2) {
        contact.organization = orgName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()); // Title case
      }
    }
  }

  // Calculate confidence score
  let fieldCount = 0;
  const totalFields = 5;

  if (contact.full_name) fieldCount++;
  if (contact.organization) fieldCount++;
  if (contact.position) fieldCount++;
  if (contact.email_addresses && contact.email_addresses.length > 0) fieldCount++;
  if (contact.phone_numbers && contact.phone_numbers.length > 0) fieldCount++;

  // Base confidence
  contact.confidence = Math.round((fieldCount / totalFields) * 100);

  // Quality adjustments
  if (contact.full_name) {
    const nameWords = contact.full_name.split(' ').length;
    if (nameWords >= 2 && nameWords <= 4) {
      contact.confidence = Math.min(100, contact.confidence + 10);
    }
  }

  if (contact.email_addresses && contact.email_addresses.length === 1) {
    // Single email is more reliable than multiple
    contact.confidence = Math.min(100, contact.confidence + 5);
  }

  if (contact.phone_numbers && contact.phone_numbers.length === 1) {
    // Single phone is more reliable
    contact.confidence = Math.min(100, contact.confidence + 5);
  }

  // Penalty for missing critical fields
  if (!contact.full_name) {
    contact.confidence = Math.max(0, contact.confidence - 20);
  }

  return contact;
}

/**
 * Validate and normalize extracted contact data
 */
export function validateContact(contact: ExtractedContact): ExtractedContact {
  // Validate and clean email addresses
  if (contact.email_addresses) {
    contact.email_addresses = contact.email_addresses
      .filter(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      })
      .map(email => email.toLowerCase());
  }

  // Validate and clean phone numbers
  if (contact.phone_numbers) {
    contact.phone_numbers = contact.phone_numbers
      .filter(phone => {
        // E.164 format validation
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        return e164Regex.test(phone);
      });
  }

  // Trim text fields
  if (contact.full_name) {
    contact.full_name = contact.full_name.trim();
    if (contact.full_name.length > 200) {
      contact.full_name = contact.full_name.substring(0, 200);
    }
  }

  if (contact.organization) {
    contact.organization = contact.organization.trim();
    if (contact.organization.length > 200) {
      contact.organization = contact.organization.substring(0, 200);
    }
  }

  if (contact.position) {
    contact.position = contact.position.trim();
    if (contact.position.length > 200) {
      contact.position = contact.position.substring(0, 200);
    }
  }

  return contact;
}