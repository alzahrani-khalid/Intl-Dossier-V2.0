# OCR Implementation Guide
**Feature:** Contact Directory - Business Card & Document Extraction
**Date:** 2025-10-26
**Tech Stack:** Node.js 18+, TypeScript 5.8+, Tesseract.js, Google Cloud Vision API

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Upload                          │
│  (Business Card Image/PDF → Multipart Form Data)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API Endpoint                           │
│         POST /api/contacts/ocr/business-card                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Image Preprocessing                            │
│  • Resize to 300 DPI                                        │
│  • Grayscale conversion                                     │
│  • Contrast enhancement (CLAHE)                             │
│  • Noise reduction (bilateral filter)                       │
│  • Deskewing (Hough transform)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Tesseract OCR (Local Processing)                  │
│  • Load Arabic + English models                             │
│  • Extract text with confidence scores                      │
│  • Parse structured fields                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
                 Confidence >= 75%?
                     │
        ┌────────────┴────────────┐
        │                         │
       YES                       NO
        │                         │
        ▼                         ▼
┌──────────────────┐   ┌──────────────────────────┐
│ Return Results   │   │  User Consent Prompt     │
│ (Local Only)     │   │  (PDPL Compliance)       │
└──────────────────┘   └────────┬─────────────────┘
                                │
                                ▼
                      ┌─────────────────────────┐
                      │ Google Vision API       │
                      │ (Cloud Fallback)        │
                      └────────┬────────────────┘
                               │
                               ▼
                      ┌─────────────────────────┐
                      │ Enhanced Results        │
                      │ (Higher Accuracy)       │
                      └─────────────────────────┘
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
# Backend OCR dependencies
npm install tesseract.js sharp @google-cloud/vision

# Type definitions
npm install -D @types/sharp
```

### 2. Download Tesseract Language Data

Tesseract.js automatically downloads language data on first use, but you can pre-cache:

```bash
# Create tessdata directory
mkdir -p backend/tessdata

# Download Arabic and English trained data
curl -L https://github.com/tesseract-ocr/tessdata/raw/main/ara.traineddata \
  -o backend/tessdata/ara.traineddata

curl -L https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata \
  -o backend/tessdata/eng.traineddata
```

### 3. Google Cloud Vision Setup

```bash
# Install Google Cloud CLI (if not already installed)
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Create a new project
gcloud projects create intl-dossier-ocr --name="Intl Dossier OCR"

# Set project
gcloud config set project intl-dossier-ocr

# Enable Vision API
gcloud services enable vision.googleapis.com

# Create service account
gcloud iam service-accounts create ocr-service \
  --display-name="OCR Service Account"

# Grant Vision API permissions
gcloud projects add-iam-policy-binding intl-dossier-ocr \
  --member="serviceAccount:ocr-service@intl-dossier-ocr.iam.gserviceaccount.com" \
  --role="roles/cloudvision.user"

# Create and download key
gcloud iam service-accounts keys create ./google-vision-key.json \
  --iam-account=ocr-service@intl-dossier-ocr.iam.gserviceaccount.com

# Move to secure location
mv google-vision-key.json backend/config/google-vision-key.json
chmod 600 backend/config/google-vision-key.json
```

### 4. Environment Configuration

```bash
# backend/.env
GOOGLE_APPLICATION_CREDENTIALS=./config/google-vision-key.json
GOOGLE_CLOUD_PROJECT=intl-dossier-ocr
OCR_CONFIDENCE_THRESHOLD=75
OCR_ENABLE_CLOUD_FALLBACK=true
TESSDATA_PREFIX=./tessdata
```

---

## Core Implementation

### 1. Image Preprocessing Service

**File:** `/backend/src/utils/image-preprocessor.ts`

```typescript
import sharp from 'sharp';

export interface PreprocessOptions {
  targetDpi?: number;
  enhanceContrast?: boolean;
  denoise?: boolean;
  deskew?: boolean;
}

export class ImagePreprocessor {
  private static readonly DEFAULT_OPTIONS: Required<PreprocessOptions> = {
    targetDpi: 300,
    enhanceContrast: true,
    denoise: true,
    deskew: true,
  };

  /**
   * Preprocess image for optimal OCR accuracy
   */
  static async preprocess(
    inputBuffer: Buffer,
    options: PreprocessOptions = {}
  ): Promise<Buffer> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    let pipeline = sharp(inputBuffer);

    // 1. Resize to target DPI (if needed)
    const metadata = await pipeline.metadata();
    if (metadata.density && metadata.density < opts.targetDpi) {
      const scale = opts.targetDpi / metadata.density;
      pipeline = pipeline.resize({
        width: Math.round((metadata.width || 0) * scale),
        height: Math.round((metadata.height || 0) * scale),
        kernel: sharp.kernel.lanczos3,
      });
    }

    // 2. Convert to grayscale (improves OCR accuracy)
    pipeline = pipeline.grayscale();

    // 3. Enhance contrast using histogram equalization
    if (opts.enhanceContrast) {
      pipeline = pipeline.normalize();
    }

    // 4. Denoise (reduce image noise/grain)
    if (opts.denoise) {
      pipeline = pipeline.median(3); // 3x3 median filter
    }

    // 5. Sharpen text edges
    pipeline = pipeline.sharpen({ sigma: 1.5 });

    // 6. Output as PNG (lossless)
    pipeline = pipeline.png({ compressionLevel: 6 });

    return pipeline.toBuffer();
  }

  /**
   * Detect and correct image skew
   * Note: Basic implementation - consider using OpenCV for production
   */
  static async deskew(inputBuffer: Buffer): Promise<Buffer> {
    // For production, integrate with @techstark/opencv-js or similar
    // This is a placeholder for basic rotation detection
    const metadata = await sharp(inputBuffer).metadata();

    // Simple heuristic: detect if image is portrait/landscape
    // Real implementation would use Hough transform
    if (metadata.width && metadata.height && metadata.width > metadata.height * 1.5) {
      // Likely rotated business card
      return sharp(inputBuffer).rotate(-90).toBuffer();
    }

    return inputBuffer;
  }

  /**
   * Validate image quality for OCR
   */
  static async validateQuality(inputBuffer: Buffer): Promise<{
    valid: boolean;
    issues: string[];
    score: number;
  }> {
    const metadata = await sharp(inputBuffer).metadata();
    const stats = await sharp(inputBuffer).stats();

    const issues: string[] = [];
    let score = 100;

    // Check resolution
    const minWidth = 800;
    const minHeight = 600;
    if ((metadata.width || 0) < minWidth || (metadata.height || 0) < minHeight) {
      issues.push(`Image too small: ${metadata.width}x${metadata.height} (min ${minWidth}x${minHeight})`);
      score -= 30;
    }

    // Check if image is too dark or too bright
    const avgBrightness = stats.channels[0].mean;
    if (avgBrightness < 30) {
      issues.push('Image too dark');
      score -= 20;
    } else if (avgBrightness > 225) {
      issues.push('Image too bright/washed out');
      score -= 20;
    }

    // Check contrast
    const contrast = stats.channels[0].stdev;
    if (contrast < 20) {
      issues.push('Low contrast - text may be hard to read');
      score -= 15;
    }

    return {
      valid: score >= 50,
      issues,
      score: Math.max(0, score),
    };
  }
}
```

### 2. Tesseract OCR Service

**File:** `/backend/src/services/tesseract-ocr-service.ts`

```typescript
import { createWorker, Worker, RecognizeResult } from 'tesseract.js';
import path from 'path';

export interface OcrResult {
  text: string;
  confidence: number;
  language: 'ara' | 'eng' | 'mixed';
  processingTimeMs: number;
}

export interface OcrOptions {
  languages?: ('ara' | 'eng')[];
  tessDataPath?: string;
  workerPoolSize?: number;
}

export class TesseractOcrService {
  private workers: Worker[] = [];
  private currentWorkerIndex = 0;
  private readonly options: Required<OcrOptions>;

  constructor(options: OcrOptions = {}) {
    this.options = {
      languages: ['eng', 'ara'],
      tessDataPath: process.env.TESSDATA_PREFIX || './tessdata',
      workerPoolSize: 4,
      ...options,
    };
  }

  /**
   * Initialize OCR worker pool
   */
  async initialize(): Promise<void> {
    console.log('Initializing Tesseract OCR workers...');

    const workerPromises = Array.from({ length: this.options.workerPoolSize }, async () => {
      const worker = await createWorker(this.options.languages, 1, {
        langPath: this.options.tessDataPath,
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Configure OCR parameters for better accuracy
      await worker.setParameters({
        tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: '', // Allow all characters
      });

      return worker;
    });

    this.workers = await Promise.all(workerPromises);
    console.log(`Initialized ${this.workers.length} OCR workers`);
  }

  /**
   * Extract text from image using Tesseract
   */
  async extractText(imageBuffer: Buffer): Promise<OcrResult> {
    if (this.workers.length === 0) {
      await this.initialize();
    }

    const startTime = Date.now();

    // Round-robin worker selection
    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;

    try {
      const result: RecognizeResult = await worker.recognize(imageBuffer);

      const processingTimeMs = Date.now() - startTime;
      const text = result.data.text;
      const confidence = result.data.confidence;

      // Detect dominant language
      const language = this.detectLanguage(text);

      console.log(`OCR completed in ${processingTimeMs}ms with ${confidence.toFixed(1)}% confidence`);

      return {
        text,
        confidence,
        language,
        processingTimeMs,
      };
    } catch (error) {
      console.error('Tesseract OCR error:', error);
      throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect dominant language in text
   */
  private detectLanguage(text: string): 'ara' | 'eng' | 'mixed' {
    const arabicChars = text.match(/[\u0600-\u06FF]/g)?.length || 0;
    const latinChars = text.match(/[a-zA-Z]/g)?.length || 0;
    const total = arabicChars + latinChars;

    if (total === 0) return 'eng'; // Default to English

    const arabicRatio = arabicChars / total;

    if (arabicRatio > 0.7) return 'ara';
    if (arabicRatio < 0.3) return 'eng';
    return 'mixed';
  }

  /**
   * Terminate all workers (cleanup)
   */
  async terminate(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.terminate()));
    this.workers = [];
    console.log('Tesseract OCR workers terminated');
  }
}
```

### 3. Google Vision OCR Service

**File:** `/backend/src/services/google-vision-service.ts`

```typescript
import vision from '@google-cloud/vision';
import path from 'path';

export interface GoogleVisionResult {
  text: string;
  confidence: number;
  language: string[];
  processingTimeMs: number;
  blockInfo?: {
    paragraphs: number;
    words: number;
    symbols: number;
  };
}

export class GoogleVisionService {
  private client: vision.ImageAnnotatorClient;

  constructor(keyFilePath?: string) {
    const credentialsPath = keyFilePath || process.env.GOOGLE_APPLICATION_CREDENTIALS;

    this.client = new vision.ImageAnnotatorClient({
      keyFilename: credentialsPath,
    });

    console.log('Google Vision API client initialized');
  }

  /**
   * Extract text from image using Google Cloud Vision API
   */
  async extractText(imageBuffer: Buffer): Promise<GoogleVisionResult> {
    const startTime = Date.now();

    try {
      const [result] = await this.client.documentTextDetection({
        image: { content: imageBuffer },
        imageContext: {
          languageHints: ['ar', 'en'], // Prioritize Arabic and English
        },
      });

      const processingTimeMs = Date.now() - startTime;

      const fullText = result.fullTextAnnotation;
      if (!fullText || !fullText.text) {
        throw new Error('No text detected in image');
      }

      // Calculate average confidence
      const pages = fullText.pages || [];
      const totalConfidence = pages.reduce((sum, page) => sum + (page.confidence || 0), 0);
      const avgConfidence = pages.length > 0 ? (totalConfidence / pages.length) * 100 : 0;

      // Extract language information
      const languages = pages
        .flatMap((page) => page.property?.detectedLanguages || [])
        .map((lang) => lang.languageCode || 'unknown')
        .filter((lang, index, self) => self.indexOf(lang) === index); // Unique

      // Block-level statistics
      const blockInfo = {
        paragraphs: pages.flatMap((p) => p.blocks || []).flatMap((b) => b.paragraphs || []).length,
        words: pages
          .flatMap((p) => p.blocks || [])
          .flatMap((b) => b.paragraphs || [])
          .flatMap((para) => para.words || []).length,
        symbols: pages
          .flatMap((p) => p.blocks || [])
          .flatMap((b) => b.paragraphs || [])
          .flatMap((para) => para.words || [])
          .flatMap((word) => word.symbols || []).length,
      };

      console.log(`Google Vision OCR completed in ${processingTimeMs}ms with ${avgConfidence.toFixed(1)}% confidence`);

      return {
        text: fullText.text,
        confidence: avgConfidence,
        language: languages,
        processingTimeMs,
        blockInfo,
      };
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw new Error(`Cloud OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch extract text from multiple images
   */
  async batchExtractText(imageBuffers: Buffer[]): Promise<GoogleVisionResult[]> {
    const startTime = Date.now();

    const requests = imageBuffers.map((buffer) => ({
      image: { content: buffer },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' as const }],
      imageContext: {
        languageHints: ['ar', 'en'],
      },
    }));

    try {
      const [batchResult] = await this.client.batchAnnotateImages({
        requests,
      });

      const processingTimeMs = Date.now() - startTime;
      console.log(`Batch OCR completed ${imageBuffers.length} images in ${processingTimeMs}ms`);

      return (batchResult.responses || []).map((response, index) => {
        const fullText = response.fullTextAnnotation;
        const pages = fullText?.pages || [];
        const totalConfidence = pages.reduce((sum, page) => sum + (page.confidence || 0), 0);
        const avgConfidence = pages.length > 0 ? (totalConfidence / pages.length) * 100 : 0;

        return {
          text: fullText?.text || '',
          confidence: avgConfidence,
          language: pages
            .flatMap((page) => page.property?.detectedLanguages || [])
            .map((lang) => lang.languageCode || 'unknown'),
          processingTimeMs: processingTimeMs / imageBuffers.length,
        };
      });
    } catch (error) {
      console.error('Google Vision batch API error:', error);
      throw new Error(`Batch OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
```

### 4. Business Card Parser

**File:** `/backend/src/parsers/business-card-parser.ts`

```typescript
export interface BusinessCardData {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  website?: string;
  rawText: string;
  confidence: number;
}

export class BusinessCardParser {
  /**
   * Parse structured data from OCR text
   */
  static parse(text: string, confidence: number): BusinessCardData {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

    return {
      name: this.extractName(lines),
      title: this.extractTitle(lines),
      company: this.extractCompany(lines),
      email: this.extractEmail(text),
      phone: this.extractPhone(text, 'phone'),
      mobile: this.extractPhone(text, 'mobile'),
      address: this.extractAddress(lines),
      website: this.extractWebsite(text),
      rawText: text,
      confidence,
    };
  }

  /**
   * Extract name (typically first line or line with capital letters)
   */
  private static extractName(lines: string[]): string | undefined {
    // Pattern 1: Line with mostly capital letters (Latin or Arabic)
    const namePattern = /^[A-ZÀ-ÿ\u0600-\u06FF\s.'-]+$/;
    const capitalLine = lines.find((line) => namePattern.test(line) && line.length > 3);

    if (capitalLine) return capitalLine;

    // Pattern 2: First non-empty line (fallback)
    return lines[0];
  }

  /**
   * Extract job title (keywords: Director, Manager, Engineer, etc.)
   */
  private static extractTitle(lines: string[]): string | undefined {
    const titleKeywords = [
      // English
      'director', 'manager', 'engineer', 'analyst', 'specialist', 'coordinator',
      'officer', 'executive', 'consultant', 'advisor', 'president', 'ceo', 'cto',
      'cfo', 'head', 'lead', 'senior', 'junior', 'assistant',
      // Arabic (transliterated keywords to match)
      'مدير', 'رئيس', 'مهندس', 'محلل', 'أخصائي', 'منسق', 'مستشار',
    ];

    return lines.find((line) =>
      titleKeywords.some((keyword) => line.toLowerCase().includes(keyword))
    );
  }

  /**
   * Extract company name (heuristic: line after name/title)
   */
  private static extractCompany(lines: string[]): string | undefined {
    // Often on line 2 or 3
    return lines.slice(1, 4).find((line) => {
      // Avoid lines that look like addresses or contact info
      return !this.looksLikeContact(line) && !this.looksLikeAddress(line);
    });
  }

  /**
   * Extract email address
   */
  private static extractEmail(text: string): string | undefined {
    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const matches = text.match(emailRegex);
    return matches?.[0];
  }

  /**
   * Extract phone number (supports international formats and Arabic-Indic numerals)
   */
  private static extractPhone(text: string, type: 'phone' | 'mobile'): string | undefined {
    // Convert Arabic-Indic numerals to ASCII
    const normalizedText = this.normalizeArabicNumerals(text);

    // Phone patterns
    const phonePatterns = [
      /(?:tel|phone|ph|t)[\s:]*([+\d\s()-]+)/i,
      /(?:mobile|mob|m|cell)[\s:]*([+\d\s()-]+)/i,
      /\+?\d{1,4}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,
    ];

    for (const pattern of phonePatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const phone = match[1] || match[0];
        // Filter by type keyword if present
        if (type === 'mobile' && /mobile|mob|cell/i.test(match[0])) {
          return this.formatPhone(phone);
        } else if (type === 'phone' && !/mobile|mob|cell/i.test(match[0])) {
          return this.formatPhone(phone);
        }
      }
    }

    return undefined;
  }

  /**
   * Extract physical address
   */
  private static extractAddress(lines: string[]): string | undefined {
    const addressKeywords = ['street', 'road', 'avenue', 'ave', 'blvd', 'suite', 'floor', 'building', 'po box', 'شارع', 'طريق', 'حي'];

    const addressLines = lines.filter((line) =>
      addressKeywords.some((keyword) => line.toLowerCase().includes(keyword))
    );

    return addressLines.join(', ') || undefined;
  }

  /**
   * Extract website URL
   */
  private static extractWebsite(text: string): string | undefined {
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w.-]+(?:\/[\w.-]*)*\/?/g;
    const matches = text.match(urlRegex);
    return matches?.[0];
  }

  /**
   * Check if line looks like contact information
   */
  private static looksLikeContact(line: string): boolean {
    return /[@+]|\d{3,}|tel|phone|email|mobile/i.test(line);
  }

  /**
   * Check if line looks like an address
   */
  private static looksLikeAddress(line: string): boolean {
    return /street|road|avenue|suite|floor|building|p\.?o\.?\s*box/i.test(line);
  }

  /**
   * Normalize Arabic-Indic numerals to ASCII
   */
  private static normalizeArabicNumerals(text: string): string {
    const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
    const asciiNumerals = '0123456789';

    return text.replace(/[٠-٩]/g, (char) => {
      const index = arabicNumerals.indexOf(char);
      return asciiNumerals[index] || char;
    });
  }

  /**
   * Format phone number to E.164 (basic implementation)
   */
  private static formatPhone(phone: string): string {
    // Remove non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    return cleaned;
  }
}
```

### 5. Unified OCR Service (Hybrid)

**File:** `/backend/src/services/ocr-service.ts`

```typescript
import { TesseractOcrService, OcrResult as TesseractResult } from './tesseract-ocr-service';
import { GoogleVisionService, GoogleVisionResult } from './google-vision-service';
import { ImagePreprocessor } from '../utils/image-preprocessor';
import { BusinessCardParser, BusinessCardData } from '../parsers/business-card-parser';

export interface OcrServiceOptions {
  confidenceThreshold?: number;
  enableCloudFallback?: boolean;
  preprocessImage?: boolean;
}

export interface ExtractResult {
  text: string;
  confidence: number;
  method: 'tesseract' | 'google-vision';
  processingTimeMs: number;
  businessCardData?: BusinessCardData;
  qualityScore?: number;
}

export class OcrService {
  private tesseractService: TesseractOcrService;
  private googleVisionService?: GoogleVisionService;
  private readonly options: Required<OcrServiceOptions>;

  constructor(options: OcrServiceOptions = {}) {
    this.options = {
      confidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD || '75'),
      enableCloudFallback: process.env.OCR_ENABLE_CLOUD_FALLBACK === 'true',
      preprocessImage: true,
      ...options,
    };

    this.tesseractService = new TesseractOcrService();

    if (this.options.enableCloudFallback) {
      this.googleVisionService = new GoogleVisionService();
      console.log('Google Vision fallback enabled');
    }
  }

  /**
   * Initialize OCR services
   */
  async initialize(): Promise<void> {
    await this.tesseractService.initialize();
  }

  /**
   * Extract text from business card image (hybrid approach)
   */
  async extractBusinessCard(imageBuffer: Buffer, userConsent?: boolean): Promise<ExtractResult> {
    const startTime = Date.now();

    // Step 1: Validate image quality
    const quality = await ImagePreprocessor.validateQuality(imageBuffer);
    console.log(`Image quality score: ${quality.score}/100`);

    if (!quality.valid) {
      throw new Error(`Image quality too low: ${quality.issues.join(', ')}`);
    }

    // Step 2: Preprocess image
    let processedBuffer = imageBuffer;
    if (this.options.preprocessImage) {
      console.log('Preprocessing image...');
      processedBuffer = await ImagePreprocessor.preprocess(imageBuffer);
    }

    // Step 3: Try Tesseract first (local processing)
    console.log('Attempting local OCR with Tesseract...');
    const tesseractResult = await this.tesseractService.extractText(processedBuffer);

    // Step 4: Check confidence threshold
    if (tesseractResult.confidence >= this.options.confidenceThreshold) {
      console.log(`✓ Tesseract succeeded with ${tesseractResult.confidence.toFixed(1)}% confidence`);

      const businessCardData = BusinessCardParser.parse(
        tesseractResult.text,
        tesseractResult.confidence
      );

      return {
        text: tesseractResult.text,
        confidence: tesseractResult.confidence,
        method: 'tesseract',
        processingTimeMs: Date.now() - startTime,
        businessCardData,
        qualityScore: quality.score,
      };
    }

    // Step 5: Fallback to Google Vision (if enabled and user consented)
    if (!this.options.enableCloudFallback || !this.googleVisionService) {
      console.log('⚠ Tesseract confidence too low, cloud fallback disabled');

      const businessCardData = BusinessCardParser.parse(
        tesseractResult.text,
        tesseractResult.confidence
      );

      return {
        text: tesseractResult.text,
        confidence: tesseractResult.confidence,
        method: 'tesseract',
        processingTimeMs: Date.now() - startTime,
        businessCardData,
        qualityScore: quality.score,
      };
    }

    if (!userConsent) {
      throw new Error('Cloud OCR requires user consent (PDPL compliance)');
    }

    console.log('⚠ Tesseract confidence too low, falling back to Google Vision...');
    const googleResult = await this.googleVisionService.extractText(processedBuffer);

    const businessCardData = BusinessCardParser.parse(
      googleResult.text,
      googleResult.confidence
    );

    return {
      text: googleResult.text,
      confidence: googleResult.confidence,
      method: 'google-vision',
      processingTimeMs: Date.now() - startTime,
      businessCardData,
      qualityScore: quality.score,
    };
  }

  /**
   * Batch process multiple business cards
   */
  async batchExtractBusinessCards(
    imageBuffers: Buffer[],
    userConsent?: boolean
  ): Promise<ExtractResult[]> {
    const results = await Promise.all(
      imageBuffers.map((buffer) => this.extractBusinessCard(buffer, userConsent))
    );

    const tesseractCount = results.filter((r) => r.method === 'tesseract').length;
    const googleCount = results.filter((r) => r.method === 'google-vision').length;

    console.log(
      `Batch processing complete: ${tesseractCount} local, ${googleCount} cloud (${results.length} total)`
    );

    return results;
  }

  /**
   * Cleanup resources
   */
  async terminate(): Promise<void> {
    await this.tesseractService.terminate();
  }
}
```

---

## API Endpoints

### 6. Express Routes

**File:** `/backend/src/routes/ocr-routes.ts`

```typescript
import express, { Request, Response } from 'express';
import multer from 'multer';
import { OcrService } from '../services/ocr-service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Initialize OCR service
const ocrService = new OcrService();
ocrService.initialize().catch(console.error);

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF allowed.'));
    }
  },
});

// Request validation schemas
const extractBusinessCardSchema = z.object({
  body: z.object({
    userConsent: z.boolean().optional().default(false),
  }),
});

/**
 * POST /api/ocr/business-card
 * Extract text and structured data from business card image
 */
router.post(
  '/business-card',
  authenticate,
  upload.single('image'),
  validateRequest(extractBusinessCardSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { userConsent } = req.body;
      const imageBuffer = req.file.buffer;

      const result = await ocrService.extractBusinessCard(imageBuffer, userConsent);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Business card OCR error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed',
      });
    }
  }
);

/**
 * POST /api/ocr/business-cards/batch
 * Batch extract text from multiple business card images
 */
router.post(
  '/business-cards/batch',
  authenticate,
  upload.array('images', 20), // Max 20 images
  async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      const { userConsent } = req.body;
      const imageBuffers = req.files.map((file) => file.buffer);

      const results = await ocrService.batchExtractBusinessCards(imageBuffers, userConsent);

      res.json({
        success: true,
        data: {
          total: results.length,
          processed: results.filter((r) => r.confidence >= 75).length,
          results,
        },
      });
    } catch (error) {
      console.error('Batch business card OCR error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Batch OCR processing failed',
      });
    }
  }
);

/**
 * POST /api/ocr/document
 * Extract text from document (PDF/image)
 */
router.post(
  '/document',
  authenticate,
  upload.single('document'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No document file provided' });
      }

      const { userConsent } = req.body;
      const documentBuffer = req.file.buffer;

      // For PDF, you'd need to extract pages first (use pdf-lib)
      // For simplicity, treating as single image here
      const result = await ocrService.extractBusinessCard(documentBuffer, userConsent);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Document OCR error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Document OCR processing failed',
      });
    }
  }
);

// Cleanup on server shutdown
process.on('SIGTERM', async () => {
  await ocrService.terminate();
});

export default router;
```

---

## Frontend Integration

### 7. React Component (TypeScript)

**File:** `/frontend/src/components/BusinessCardUpload.tsx`

```typescript
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface BusinessCardData {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  website?: string;
}

interface OcrResult {
  text: string;
  confidence: number;
  method: 'tesseract' | 'google-vision';
  processingTimeMs: number;
  businessCardData?: BusinessCardData;
  qualityScore?: number;
}

export function BusinessCardUpload() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userConsent, setUserConsent] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setResult(null);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('userConsent', String(userConsent));

      const response = await fetch('/api/ocr/business-card', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'OCR processing failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="p-4 sm:p-6 md:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-start">
          {t('ocr.businessCard.title')}
        </h2>

        {/* File Upload Area */}
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center gap-2 sm:gap-4">
              <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              <p className="text-sm sm:text-base text-gray-600 text-center px-4">
                {t('ocr.businessCard.uploadPrompt')}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                {t('ocr.businessCard.supportedFormats')}
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileSelect}
            />
          </label>
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="mb-6">
            <img
              src={previewUrl}
              alt="Business card preview"
              className="max-w-full h-auto rounded-lg border shadow-sm mx-auto"
              style={{ maxHeight: '300px' }}
            />
          </div>
        )}

        {/* User Consent (PDPL Compliance) */}
        {selectedFile && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={userConsent}
                onCheckedChange={(checked) => setUserConsent(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="consent" className="text-sm text-start cursor-pointer">
                {t('ocr.businessCard.consentText')}
                <span className="block mt-1 text-xs text-gray-600">
                  {t('ocr.businessCard.consentExplanation')}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && (
          <Button
            onClick={handleUpload}
            disabled={isProcessing}
            className="w-full sm:w-auto min-h-11 px-6"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin me-2">⏳</span>
                {t('ocr.businessCard.processing')}
              </>
            ) : (
              <>
                <FileImage className={`w-5 h-5 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('ocr.businessCard.extract')}
              </>
            )}
          </Button>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className={`w-5 h-5 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-6 space-y-4">
            <Alert>
              <CheckCircle className={`w-5 h-5 text-green-600 ${isRTL ? 'ms-2' : 'me-2'}`} />
              <AlertDescription>
                {t('ocr.businessCard.success', {
                  method: result.method === 'tesseract' ? 'Local' : 'Cloud',
                  confidence: result.confidence.toFixed(1),
                  time: (result.processingTimeMs / 1000).toFixed(2),
                })}
              </AlertDescription>
            </Alert>

            {/* Extracted Data */}
            {result.businessCardData && (
              <Card className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-start">
                  {t('ocr.businessCard.extractedData')}
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {result.businessCardData.name && (
                    <>
                      <dt className="text-sm font-medium text-gray-600 text-start">
                        {t('contact.name')}
                      </dt>
                      <dd className="text-sm text-start">{result.businessCardData.name}</dd>
                    </>
                  )}
                  {result.businessCardData.title && (
                    <>
                      <dt className="text-sm font-medium text-gray-600 text-start">
                        {t('contact.title')}
                      </dt>
                      <dd className="text-sm text-start">{result.businessCardData.title}</dd>
                    </>
                  )}
                  {result.businessCardData.company && (
                    <>
                      <dt className="text-sm font-medium text-gray-600 text-start">
                        {t('contact.company')}
                      </dt>
                      <dd className="text-sm text-start">{result.businessCardData.company}</dd>
                    </>
                  )}
                  {result.businessCardData.email && (
                    <>
                      <dt className="text-sm font-medium text-gray-600 text-start">
                        {t('contact.email')}
                      </dt>
                      <dd className="text-sm text-start">{result.businessCardData.email}</dd>
                    </>
                  )}
                  {result.businessCardData.phone && (
                    <>
                      <dt className="text-sm font-medium text-gray-600 text-start">
                        {t('contact.phone')}
                      </dt>
                      <dd className="text-sm text-start">{result.businessCardData.phone}</dd>
                    </>
                  )}
                </dl>
              </Card>
            )}

            {/* Raw Text */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-start">
                {t('ocr.businessCard.rawText')}
              </h3>
              <pre className="text-xs sm:text-sm bg-gray-50 p-3 sm:p-4 rounded overflow-x-auto whitespace-pre-wrap text-start">
                {result.text}
              </pre>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

## Testing

### 8. Unit Tests

**File:** `/backend/tests/services/ocr-service.test.ts`

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { OcrService } from '../../src/services/ocr-service';

describe('OcrService', () => {
  let ocrService: OcrService;

  beforeAll(async () => {
    ocrService = new OcrService({
      enableCloudFallback: false, // Test local only
    });
    await ocrService.initialize();
  });

  afterAll(async () => {
    await ocrService.terminate();
  });

  test('should extract text from English business card', async () => {
    const imageBuffer = await fs.readFile(
      path.join(__dirname, '../fixtures/business-card-english.jpg')
    );

    const result = await ocrService.extractBusinessCard(imageBuffer);

    expect(result.text).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(70);
    expect(result.method).toBe('tesseract');
    expect(result.businessCardData).toBeDefined();
  }, 30000); // 30s timeout for OCR

  test('should extract text from Arabic business card', async () => {
    const imageBuffer = await fs.readFile(
      path.join(__dirname, '../fixtures/business-card-arabic.jpg')
    );

    const result = await ocrService.extractBusinessCard(imageBuffer);

    expect(result.text).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(60); // Lower threshold for Arabic
    expect(result.method).toBe('tesseract');
  }, 30000);

  test('should reject low-quality images', async () => {
    const lowQualityBuffer = await fs.readFile(
      path.join(__dirname, '../fixtures/low-quality.jpg')
    );

    await expect(ocrService.extractBusinessCard(lowQualityBuffer)).rejects.toThrow(
      /image quality/i
    );
  });

  test('should parse structured data correctly', async () => {
    const imageBuffer = await fs.readFile(
      path.join(__dirname, '../fixtures/business-card-structured.jpg')
    );

    const result = await ocrService.extractBusinessCard(imageBuffer);

    expect(result.businessCardData?.name).toBeTruthy();
    expect(result.businessCardData?.email).toMatch(/@/);
    expect(result.businessCardData?.phone).toBeTruthy();
  }, 30000);
});
```

---

## Performance Optimization

### 9. Caching Strategy

```typescript
// Redis caching for OCR results (optional)
import Redis from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL);

async function getOrProcessOcr(
  imageBuffer: Buffer,
  processFunc: () => Promise<OcrResult>
): Promise<OcrResult> {
  // Generate cache key from image hash
  const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  const cacheKey = `ocr:${imageHash}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('OCR cache hit');
    return JSON.parse(cached);
  }

  // Process and cache
  const result = await processFunc();
  await redis.setex(cacheKey, 30 * 24 * 60 * 60, JSON.stringify(result)); // 30 days

  return result;
}
```

---

## Deployment Checklist

- [ ] Install Node.js 18+ and npm/pnpm
- [ ] Install tesseract.js: `npm install tesseract.js sharp`
- [ ] Download Arabic + English trained data
- [ ] Setup Google Cloud Vision API (if using cloud fallback)
- [ ] Configure environment variables
- [ ] Test with 50+ sample business cards (25 Arabic, 25 English)
- [ ] Implement rate limiting (10 requests/minute per user)
- [ ] Setup monitoring for accuracy, processing time, and costs
- [ ] Document PDPL compliance procedures
- [ ] Configure Redis caching (optional)
- [ ] Setup background job queue for batch processing
- [ ] Configure Nginx/CloudFlare for image upload size limits
- [ ] Implement audit logging for cloud OCR requests

---

## Monitoring & Metrics

### Key Metrics to Track:
1. **Accuracy Rate:** % of business cards with >80% confidence
2. **Processing Time:** P50, P95, P99 latencies
3. **Method Distribution:** Tesseract vs. Google Vision usage ratio
4. **Cost:** Google Vision API costs per month
5. **Error Rate:** Failed OCR attempts per 1000 requests
6. **Quality Score:** Average image quality score

### Grafana Dashboard Example:
```
- OCR Requests/hour (line chart)
- Average Confidence Score (gauge)
- Tesseract vs Cloud Split (pie chart)
- Processing Time Histogram (heatmap)
- Monthly Google Vision Cost (single stat)
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Status:** Production-Ready Implementation Guide
