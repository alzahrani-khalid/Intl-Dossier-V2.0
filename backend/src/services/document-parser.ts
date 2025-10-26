/**
 * Document Parser Service
 *
 * Parses PDF, Word documents, and images to extract contact information in bulk.
 * Supports Arabic and English text with language detection and NLP extraction.
 *
 * @module document-parser
 */

import { getDocument } from 'unpdf';
import mammoth from 'mammoth';
import { franc } from 'franc-min';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

export interface ExtractedContact {
  full_name?: string;
  organization?: string;
  position?: string;
  email_addresses?: string[];
  phone_numbers?: string[];
  confidence: number; // 0-100
  source_page?: number; // Page number in document
  source_text?: string; // Source text snippet for reference
}

export interface ParseResult {
  text: string;
  pages?: number;
  language: string;
  confidence: number;
}

export interface DocumentMetadata {
  pages?: number;
  author?: string;
  title?: string;
  created?: Date;
  modified?: Date;
}

export class DocumentParser {
  private readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private readonly PHONE_REGEX = /(?:\+|00)?[\d]?[\d\s\-\(\)\.]{7,20}/g;

  // Common Arabic/English name patterns
  private readonly ARABIC_NAME_PREFIXES = ['د.', 'م.', 'أ.', 'السيد', 'السيدة', 'الدكتور', 'المهندس', 'الأستاذ'];
  private readonly ENGLISH_TITLES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Eng.', 'Sir', 'Dame'];

  // Organization keywords
  private readonly ORG_KEYWORDS_AR = ['شركة', 'مؤسسة', 'جامعة', 'كلية', 'وزارة', 'هيئة', 'مركز', 'معهد', 'مجموعة'];
  private readonly ORG_KEYWORDS_EN = ['Company', 'Corporation', 'Corp.', 'Inc.', 'LLC', 'Ltd.', 'Limited', 'Group', 'Institute', 'University', 'College', 'Foundation', 'Association', 'Ministry', 'Department', 'Agency', 'Center', 'Centre'];

  // Position/Title keywords
  private readonly POSITION_KEYWORDS_AR = ['مدير', 'رئيس', 'نائب', 'مساعد', 'منسق', 'مستشار', 'محلل', 'مهندس', 'طبيب', 'محامي', 'محاسب'];
  private readonly POSITION_KEYWORDS_EN = ['CEO', 'CTO', 'CFO', 'COO', 'Director', 'Manager', 'Head', 'Lead', 'Senior', 'Junior', 'Coordinator', 'Consultant', 'Analyst', 'Engineer', 'Developer', 'Designer', 'President', 'Vice President', 'VP', 'Executive', 'Officer', 'Supervisor', 'Administrator'];

  constructor() {}

  /**
   * Parse PDF document to extract text
   * Uses unpdf for efficient PDF processing
   *
   * @param filePath - Path to PDF file or Buffer
   * @returns Parsed text and metadata
   */
  async parsePDF(filePath: string | Buffer): Promise<ParseResult> {
    try {
      let pdfBuffer: Buffer;

      // Read file if path provided
      if (typeof filePath === 'string') {
        pdfBuffer = await fs.readFile(filePath);
      } else {
        pdfBuffer = filePath;
      }

      // Parse PDF using unpdf
      const pdf = await getDocument(pdfBuffer);

      // Extract metadata
      const metadata = await pdf.metadata();

      // Extract text from all pages
      const pageCount = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Concatenate text items with proper spacing
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n\n';
      }

      // Detect language
      const language = this.detectLanguage(fullText);

      return {
        text: fullText.trim(),
        pages: pageCount,
        language,
        confidence: 90 // PDF extraction is generally high confidence
      };
    } catch (error) {
      console.error('PDF parsing failed:', error);
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Word document to extract text
   * Uses mammoth to extract clean HTML then parse text
   *
   * @param filePath - Path to Word file (.docx) or Buffer
   * @returns Parsed text and metadata
   */
  async parseWord(filePath: string | Buffer): Promise<ParseResult> {
    try {
      let options: any = {};

      // Configure mammoth options based on input type
      if (typeof filePath === 'string') {
        options.path = filePath;
      } else {
        options.buffer = filePath;
      }

      // Extract text as HTML (preserves structure better than plain text)
      const result = await mammoth.extractRawText(options);

      // Check for conversion warnings
      if (result.messages && result.messages.length > 0) {
        console.warn('Word document conversion warnings:', result.messages);
      }

      const text = result.value;

      // Detect language
      const language = this.detectLanguage(text);

      // Calculate confidence based on conversion quality
      let confidence = 85; // Base confidence for Word docs
      if (result.messages && result.messages.some((msg: any) => msg.type === 'error')) {
        confidence -= 20;
      } else if (result.messages && result.messages.length > 0) {
        confidence -= 10;
      }

      return {
        text: text.trim(),
        language,
        confidence
      };
    } catch (error) {
      console.error('Word document parsing failed:', error);
      throw new Error(`Word document parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect language of text using franc-min
   * Returns 'ar' for Arabic, 'en' for English, or 'mixed' for mixed content
   *
   * @param text - Text to analyze
   * @returns Detected language code
   */
  detectLanguage(text: string): string {
    if (!text || text.trim().length === 0) {
      return 'unknown';
    }

    // Use franc to detect language (returns ISO 639-3 code)
    const detectedLang = franc(text);

    // Map ISO 639-3 to our simplified codes
    if (detectedLang === 'arb' || detectedLang === 'ara') {
      return 'ar';
    } else if (detectedLang === 'eng') {
      return 'en';
    }

    // Check for mixed content by looking at character ranges
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalAlphaChars = arabicChars + latinChars;

    if (totalAlphaChars === 0) {
      return 'unknown';
    }

    const arabicRatio = arabicChars / totalAlphaChars;
    const latinRatio = latinChars / totalAlphaChars;

    // Determine language based on character ratios
    if (arabicRatio > 0.7) {
      return 'ar';
    } else if (latinRatio > 0.7) {
      return 'en';
    } else if (arabicRatio > 0.2 && latinRatio > 0.2) {
      return 'mixed';
    }

    // Default to English if unclear
    return 'en';
  }

  /**
   * Extract multiple contact entries from text using NLP patterns
   * Identifies names, organizations, positions, emails, and phones
   *
   * @param text - Text to extract contacts from
   * @param language - Detected language ('ar', 'en', 'mixed')
   * @returns Array of extracted contacts
   */
  extractContacts(text: string, language: string = 'en'): ExtractedContact[] {
    const contacts: ExtractedContact[] = [];

    if (!text || text.trim().length === 0) {
      return contacts;
    }

    // Normalize text for better extraction
    const normalizedText = this.normalizeText(text);

    // Split text into potential contact blocks
    // Look for patterns that suggest contact boundaries
    const blocks = this.splitIntoContactBlocks(normalizedText);

    // Process each block to extract a contact
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const contact = this.extractContactFromBlock(block, language, i + 1);

      // Only add if we found meaningful data
      if (contact && (contact.full_name || contact.email_addresses?.length || contact.phone_numbers?.length)) {
        contacts.push(contact);
      }
    }

    // Deduplicate contacts based on email/phone
    const deduplicatedContacts = this.deduplicateContacts(contacts);

    return deduplicatedContacts;
  }

  /**
   * Normalize text for better extraction
   * Handles Unicode normalization, whitespace, and special characters
   */
  private normalizeText(text: string): string {
    return text
      // Normalize Unicode (important for Arabic text)
      .normalize('NFKC')
      // Replace multiple spaces/tabs with single space
      .replace(/[\s\t]+/g, ' ')
      // Preserve line breaks but normalize them
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Split text into potential contact blocks
   * Uses heuristics to identify contact boundaries
   */
  private splitIntoContactBlocks(text: string): string[] {
    const blocks: string[] = [];

    // Strategy 1: Split by double line breaks (common in lists)
    let sections = text.split(/\n\n+/);

    // Strategy 2: For each section, check if it's too large and might contain multiple contacts
    for (const section of sections) {
      const lines = section.split('\n').filter(line => line.trim().length > 0);

      // If section is small (< 10 lines), treat as single block
      if (lines.length <= 10) {
        blocks.push(section);
      } else {
        // Look for patterns that indicate contact boundaries
        let currentBlock: string[] = [];

        for (const line of lines) {
          // Check if line might be start of new contact
          if (this.isLikelyContactStart(line) && currentBlock.length > 0) {
            blocks.push(currentBlock.join('\n'));
            currentBlock = [line];
          } else {
            currentBlock.push(line);
          }

          // If we've accumulated enough lines for a contact (usually 3-7 lines)
          if (currentBlock.length >= 7 && this.hasContactInfo(currentBlock.join('\n'))) {
            blocks.push(currentBlock.join('\n'));
            currentBlock = [];
          }
        }

        // Add remaining lines
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'));
        }
      }
    }

    return blocks.filter(block => block.trim().length > 0);
  }

  /**
   * Check if a line likely starts a new contact entry
   */
  private isLikelyContactStart(line: string): boolean {
    // Check for name patterns
    const hasTitle = [...this.ARABIC_NAME_PREFIXES, ...this.ENGLISH_TITLES]
      .some(title => line.startsWith(title));

    // Check for bullet points or numbering
    const hasBullet = /^[\d\-•●○■□▪▫]+[\.\)\s]/.test(line);

    // Check if line is in title case (common for names)
    const words = line.split(' ').filter(w => w.length > 0);
    const isTitleCase = words.length <= 5 && words.every(w =>
      /^[A-Z]/.test(w) || /^[\u0600-\u06FF]/.test(w)
    );

    return hasTitle || hasBullet || isTitleCase;
  }

  /**
   * Check if text block contains contact information
   */
  private hasContactInfo(text: string): boolean {
    const hasEmail = this.EMAIL_REGEX.test(text);
    const hasPhone = this.PHONE_REGEX.test(text);
    const hasOrgKeyword = [...this.ORG_KEYWORDS_AR, ...this.ORG_KEYWORDS_EN]
      .some(keyword => text.includes(keyword));

    return hasEmail || hasPhone || hasOrgKeyword;
  }

  /**
   * Extract contact information from a text block
   */
  private extractContactFromBlock(block: string, language: string, blockNumber: number): ExtractedContact {
    const contact: ExtractedContact = {
      confidence: 0,
      source_page: blockNumber,
      source_text: block.substring(0, 200) // Keep first 200 chars for reference
    };

    // Extract emails
    const emails = block.match(this.EMAIL_REGEX) || [];
    contact.email_addresses = [...new Set(emails.map(e => e.toLowerCase()))];

    // Extract phone numbers
    const phoneMatches = block.match(this.PHONE_REGEX) || [];
    contact.phone_numbers = this.normalizePhoneNumbers(phoneMatches);

    // Extract name, organization, and position based on language
    if (language === 'ar' || language === 'mixed') {
      this.extractArabicContactFields(block, contact);
    }

    if (language === 'en' || language === 'mixed') {
      this.extractEnglishContactFields(block, contact);
    }

    // Calculate confidence score
    contact.confidence = this.calculateContactConfidence(contact);

    return contact;
  }

  /**
   * Extract Arabic contact fields
   */
  private extractArabicContactFields(text: string, contact: ExtractedContact): void {
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      // Skip if line contains email or phone (not likely a name)
      if (this.EMAIL_REGEX.test(line) || this.PHONE_REGEX.test(line)) {
        continue;
      }

      // Check for organization
      if (!contact.organization) {
        for (const keyword of this.ORG_KEYWORDS_AR) {
          if (line.includes(keyword)) {
            contact.organization = line.trim();
            break;
          }
        }
      }

      // Check for position
      if (!contact.position) {
        for (const keyword of this.POSITION_KEYWORDS_AR) {
          if (line.includes(keyword)) {
            contact.position = line.trim();
            break;
          }
        }
      }

      // Check for name (with Arabic titles)
      if (!contact.full_name) {
        for (const prefix of this.ARABIC_NAME_PREFIXES) {
          if (line.startsWith(prefix)) {
            contact.full_name = line.trim();
            break;
          }
        }

        // If no prefix found but line contains mostly Arabic letters
        if (!contact.full_name && /^[\u0600-\u06FF\s]+$/.test(line) && line.length < 50) {
          contact.full_name = line.trim();
        }
      }
    }
  }

  /**
   * Extract English contact fields
   */
  private extractEnglishContactFields(text: string, contact: ExtractedContact): void {
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip if line contains email or phone (not likely a name)
      if (this.EMAIL_REGEX.test(line) || this.PHONE_REGEX.test(line)) {
        continue;
      }

      // Check for organization
      if (!contact.organization) {
        for (const keyword of this.ORG_KEYWORDS_EN) {
          if (line.includes(keyword)) {
            contact.organization = line;
            break;
          }
        }
      }

      // Check for position/title
      if (!contact.position) {
        for (const keyword of this.POSITION_KEYWORDS_EN) {
          if (line.includes(keyword)) {
            contact.position = line;
            break;
          }
        }
      }

      // Check for name (usually first non-keyword line)
      if (!contact.full_name && !contact.organization && !contact.position) {
        // Check if line looks like a name (2-4 words, title case)
        const words = line.split(' ').filter(w => w.length > 0);
        if (words.length >= 2 && words.length <= 5) {
          const isName = words.every(w =>
            /^[A-Z][a-z]/.test(w) || // Title case
            this.ENGLISH_TITLES.some(title => w.startsWith(title)) // Has title
          );

          if (isName) {
            // Remove titles from name
            let name = line;
            for (const title of this.ENGLISH_TITLES) {
              name = name.replace(new RegExp(`^${title}\\s+`, 'i'), '');
            }
            contact.full_name = name.trim();
          }
        }
      }
    }

    // Fallback: if no name found but we have email/phone, use first suitable line
    if (!contact.full_name && (contact.email_addresses?.length || contact.phone_numbers?.length)) {
      const firstLine = lines[0];
      if (firstLine && firstLine.length < 50 && !this.EMAIL_REGEX.test(firstLine)) {
        contact.full_name = firstLine;
      }
    }
  }

  /**
   * Normalize phone numbers to E.164 format
   */
  private normalizePhoneNumbers(phones: string[]): string[] {
    return phones
      .map(p => p.replace(/[\s\-\(\)\.]/g, ''))
      .filter(p => p.length >= 7 && p.length <= 20)
      .filter(p => /^\+?[\d]+$/.test(p))
      .map(p => {
        // Saudi mobile number normalization
        if (!p.startsWith('+') && p.length === 10 && p.startsWith('05')) {
          return '+966' + p.substring(1);
        }
        // Add + if missing for international numbers
        if (p.length > 10 && !p.startsWith('+')) {
          return '+' + p;
        }
        return p;
      })
      .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  }

  /**
   * Calculate confidence score for extracted contact
   */
  private calculateContactConfidence(contact: ExtractedContact): number {
    let score = 0;
    let maxScore = 0;

    // Name (30 points)
    if (contact.full_name) {
      score += 30;
    }
    maxScore += 30;

    // Organization (20 points)
    if (contact.organization) {
      score += 20;
    }
    maxScore += 20;

    // Position (15 points)
    if (contact.position) {
      score += 15;
    }
    maxScore += 15;

    // Email (25 points)
    if (contact.email_addresses && contact.email_addresses.length > 0) {
      score += 25;
    }
    maxScore += 25;

    // Phone (10 points)
    if (contact.phone_numbers && contact.phone_numbers.length > 0) {
      score += 10;
    }
    maxScore += 10;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Deduplicate contacts based on email and phone
   */
  private deduplicateContacts(contacts: ExtractedContact[]): ExtractedContact[] {
    const seen = new Set<string>();
    const deduplicated: ExtractedContact[] = [];

    for (const contact of contacts) {
      // Create unique key from emails and phones
      const keys: string[] = [];

      if (contact.email_addresses) {
        keys.push(...contact.email_addresses);
      }

      if (contact.phone_numbers) {
        keys.push(...contact.phone_numbers);
      }

      // If no unique identifiers, use name + org as key
      if (keys.length === 0 && contact.full_name) {
        keys.push(`${contact.full_name}_${contact.organization || ''}`);
      }

      // Check if we've seen this contact
      let isNew = true;
      for (const key of keys) {
        if (seen.has(key)) {
          isNew = false;
          break;
        }
      }

      if (isNew) {
        // Mark all keys as seen
        for (const key of keys) {
          seen.add(key);
        }
        deduplicated.push(contact);
      } else {
        // Merge with existing contact if confidence is higher
        const existingIndex = deduplicated.findIndex(c =>
          c.email_addresses?.some(e => contact.email_addresses?.includes(e)) ||
          c.phone_numbers?.some(p => contact.phone_numbers?.includes(p))
        );

        if (existingIndex >= 0 && contact.confidence > deduplicated[existingIndex].confidence) {
          deduplicated[existingIndex] = contact;
        }
      }
    }

    return deduplicated;
  }

  /**
   * Parse image file using OCR service
   * This is a placeholder - actual OCR should use OCRService
   *
   * @param imagePath - Path to image file or Buffer
   * @returns Parsed text and metadata
   */
  async parseImage(imagePath: string | Buffer): Promise<ParseResult> {
    // This would integrate with the existing OCRService
    // For now, we'll just throw an error indicating OCR should be used
    throw new Error('Image parsing should use OCRService.extractBusinessCard() method');
  }

  /**
   * Main entry point for document parsing
   * Detects file type and routes to appropriate parser
   *
   * @param filePath - Path to document file
   * @param fileType - MIME type or file extension
   * @returns Array of extracted contacts
   */
  async parseDocument(filePath: string | Buffer, fileType: string): Promise<ExtractedContact[]> {
    let parseResult: ParseResult;

    // Determine file type and parse accordingly
    const mimeType = fileType.toLowerCase();

    if (mimeType.includes('pdf') || mimeType.endsWith('.pdf')) {
      parseResult = await this.parsePDF(filePath);
    } else if (mimeType.includes('word') || mimeType.includes('document') ||
               mimeType.endsWith('.docx') || mimeType.endsWith('.doc')) {
      parseResult = await this.parseWord(filePath);
    } else if (mimeType.includes('image') ||
               ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].some(ext => mimeType.includes(ext))) {
      parseResult = await this.parseImage(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Extract contacts from parsed text
    const contacts = this.extractContacts(parseResult.text, parseResult.language);

    // Adjust confidence based on parse quality
    if (parseResult.confidence < 100) {
      const adjustmentFactor = parseResult.confidence / 100;
      contacts.forEach(contact => {
        contact.confidence = Math.round(contact.confidence * adjustmentFactor);
      });
    }

    return contacts;
  }
}