/**
 * AI Extraction Service
 *
 * Integrates with AnythingLLM to extract structured data from meeting minutes
 * Provides confidence scoring, validation, and historical pattern analysis
 */

import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger';

const logger = createLogger('ai-extraction-service');

const ANYTHINGLLLM_API_URL = process.env.ANYTHINGLLLM_API_URL || 'http://localhost:3001/api';
const ANYTHINGLLLM_API_KEY = process.env.ANYTHINGLLLM_API_KEY || '';

export interface ExtractionRequest {
  document_content: string;
  document_type: 'text/plain' | 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  language: 'en' | 'ar';
  dossier_id?: string; // Optional for historical pattern analysis
}

export interface ExtractedDecision {
  description: string;
  rationale: string | null;
  decision_maker: string;
  decided_at?: string;
  confidence_score: number;
}

export interface ExtractedCommitment {
  description: string;
  owner_name: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
}

export interface ExtractedRisk {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
  mitigation_strategy?: string;
  confidence_score: number;
}

export interface ExtractionResponse {
  extraction_id: string;
  decisions: ExtractedDecision[];
  commitments: ExtractedCommitment[];
  risks: ExtractedRisk[];
  follow_up_actions: Array<{
    description: string;
    confidence_score: number;
  }>;
  processing_time_ms: number;
  from_cache?: boolean;
}

export class AIExtractionService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Extract structured data from meeting minutes using AnythingLLM
   */
  async extractFromDocument(request: ExtractionRequest): Promise<ExtractionResponse> {
    const startTime = Date.now();

    try {
      logger.info('Starting AI extraction', {
        document_type: request.document_type,
        language: request.language,
        content_length: request.document_content.length
      });

      // Build extraction prompt
      const prompt = this.buildExtractionPrompt(request);

      // Call AnythingLLM API
      const llmResponse = await fetch(`${ANYTHINGLLLM_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANYTHINGLLLM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: prompt,
          mode: 'chat',
          workspace: 'after-action-extraction'
        })
      });

      if (!llmResponse.ok) {
        throw new Error(`AnythingLLM API error: ${llmResponse.statusText}`);
      }

      const llmData = await llmResponse.json();
      const extractedText = llmData.textResponse || llmData.response || '';

      // Parse LLM response into structured data
      const structuredData = this.parseLLMResponse(extractedText, request.language);

      // Validate extracted data
      const validatedData = await this.validateExtractions(structuredData);

      // Enhance with historical pattern analysis
      if (request.dossier_id) {
        await this.enhanceWithHistoricalPatterns(validatedData, request.dossier_id);
      }

      const processingTime = Date.now() - startTime;

      logger.info('AI extraction completed', {
        decisions_count: validatedData.decisions.length,
        commitments_count: validatedData.commitments.length,
        risks_count: validatedData.risks.length,
        processing_time_ms: processingTime
      });

      return {
        extraction_id: crypto.randomUUID(),
        ...validatedData,
        processing_time_ms: processingTime
      };
    } catch (error) {
      logger.error('AI extraction failed', { error });
      throw error;
    }
  }

  /**
   * Build extraction prompt based on language and document content
   */
  private buildExtractionPrompt(request: ExtractionRequest): string {
    const basePrompt = request.language === 'ar'
      ? this.buildArabicPrompt(request.document_content)
      : this.buildEnglishPrompt(request.document_content);

    return basePrompt;
  }

  private buildEnglishPrompt(content: string): string {
    return `You are an AI assistant that extracts structured data from meeting minutes and diplomatic engagement records.

Extract the following information from the document below and return it in JSON format:

1. DECISIONS: Any decisions made during the meeting
   - description: The decision that was made
   - rationale: Why this decision was made (if mentioned)
   - decision_maker: Who made the decision (person or group)
   - confidence: Your confidence in this extraction (0.0 to 1.0)

2. COMMITMENTS: Action items assigned to specific people
   - description: What needs to be done
   - owner_name: Who is responsible (full name)
   - due_date: When it's due (YYYY-MM-DD format)
   - priority: low, medium, high, or critical
   - confidence: Your confidence in this extraction (0.0 to 1.0)

3. RISKS: Potential risks or concerns identified
   - description: The risk description
   - severity: low, medium, high, or critical
   - likelihood: rare, unlikely, possible, likely, or certain
   - mitigation_strategy: How to mitigate the risk (if mentioned)
   - confidence: Your confidence in this extraction (0.0 to 1.0)

4. FOLLOW_UP_ACTIONS: General next steps (without specific owners or dates yet)
   - description: The action to be taken
   - confidence: Your confidence in this extraction (0.0 to 1.0)

IMPORTANT RULES:
- Only extract information explicitly mentioned in the document
- Set confidence to 1.0 for clear, explicit statements
- Set confidence to 0.7-0.9 for implied or inferred information
- Set confidence to 0.5-0.7 for ambiguous or unclear information
- Set confidence to <0.5 for highly uncertain extractions
- For dates: Extract in YYYY-MM-DD format. If only "next month" is mentioned, infer the approximate date
- For owners: Use full names when available. Mark as "TBD" if unclear
- Return ONLY valid JSON, no explanatory text

Document to analyze:
${content}

Return JSON in this exact format:
{
  "decisions": [{"description": "", "rationale": "", "decision_maker": "", "confidence": 0.0}],
  "commitments": [{"description": "", "owner_name": "", "due_date": "", "priority": "", "confidence": 0.0}],
  "risks": [{"description": "", "severity": "", "likelihood": "", "mitigation_strategy": "", "confidence": 0.0}],
  "follow_up_actions": [{"description": "", "confidence": 0.0}]
}`;
  }

  private buildArabicPrompt(content: string): string {
    return `أنت مساعد ذكاء اصطناعي يستخرج البيانات المنظمة من محاضر الاجتماعات والسجلات الدبلوماسية.

استخرج المعلومات التالية من المستند أدناه وأرجعها بتنسيق JSON:

1. القرارات: أي قرارات تم اتخاذها خلال الاجتماع
   - description: القرار الذي تم اتخاذه
   - rationale: لماذا تم اتخاذ هذا القرار (إن ذُكر)
   - decision_maker: من اتخذ القرار (شخص أو مجموعة)
   - confidence: ثقتك في هذا الاستخراج (0.0 إلى 1.0)

2. الالتزامات: عناصر العمل المعينة لأشخاص محددين
   - description: ما يجب القيام به
   - owner_name: من المسؤول (الاسم الكامل)
   - due_date: متى يستحق (بتنسيق YYYY-MM-DD)
   - priority: منخفض، متوسط، عالي، أو حرج
   - confidence: ثقتك في هذا الاستخراج (0.0 إلى 1.0)

3. المخاطر: المخاطر أو المخاوف المحتملة المحددة
   - description: وصف المخاطر
   - severity: منخفض، متوسط، عالي، أو حرج
   - likelihood: نادر، غير محتمل، ممكن، محتمل، أو مؤكد
   - mitigation_strategy: كيفية التخفيف من المخاطر (إن ذُكر)
   - confidence: ثقتك في هذا الاستخراج (0.0 إلى 1.0)

4. إجراءات المتابعة: الخطوات التالية العامة (بدون مالكين أو تواريخ محددة بعد)
   - description: الإجراء الذي يجب اتخاذه
   - confidence: ثقتك في هذا الاستخراج (0.0 إلى 1.0)

قواعد مهمة:
- استخرج فقط المعلومات المذكورة صراحة في المستند
- اضبط الثقة على 1.0 للبيانات الواضحة والصريحة
- اضبط الثقة على 0.7-0.9 للمعلومات الضمنية أو المستنتجة
- اضبط الثقة على 0.5-0.7 للمعلومات الغامضة أو غير الواضحة
- اضبط الثقة على <0.5 للاستخراجات غير المؤكدة للغاية
- أرجع JSON صالحًا فقط، بدون نص توضيحي

المستند للتحليل:
${content}

أرجع JSON بهذا التنسيق بالضبط:
{
  "decisions": [{"description": "", "rationale": "", "decision_maker": "", "confidence": 0.0}],
  "commitments": [{"description": "", "owner_name": "", "due_date": "", "priority": "", "confidence": 0.0}],
  "risks": [{"description": "", "severity": "", "likelihood": "", "mitigation_strategy": "", "confidence": 0.0}],
  "follow_up_actions": [{"description": "", "confidence": 0.0}]
}`;
  }

  /**
   * Parse LLM response text into structured data
   */
  private parseLLMResponse(responseText: string, language: 'en' | 'ar'): Omit<ExtractionResponse, 'extraction_id' | 'processing_time_ms'> {
    try {
      // Extract JSON from response (may have explanatory text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        decisions: (parsed.decisions || []).map((d: any) => ({
          description: d.description || '',
          rationale: d.rationale || null,
          decision_maker: d.decision_maker || 'Unknown',
          confidence_score: this.normalizeConfidence(d.confidence)
        })),
        commitments: (parsed.commitments || []).map((c: any) => ({
          description: c.description || '',
          owner_name: c.owner_name || 'TBD',
          due_date: this.normalizeDateFormat(c.due_date),
          priority: this.normalizePriority(c.priority),
          confidence_score: this.normalizeConfidence(c.confidence)
        })),
        risks: (parsed.risks || []).map((r: any) => ({
          description: r.description || '',
          severity: this.normalizeSeverity(r.severity),
          likelihood: this.normalizeLikelihood(r.likelihood),
          mitigation_strategy: r.mitigation_strategy || undefined,
          confidence_score: this.normalizeConfidence(r.confidence)
        })),
        follow_up_actions: (parsed.follow_up_actions || []).map((a: any) => ({
          description: a.description || '',
          confidence_score: this.normalizeConfidence(a.confidence)
        }))
      };
    } catch (error) {
      logger.error('Failed to parse LLM response', { error, responseText });
      throw new Error('Failed to parse AI extraction response');
    }
  }

  /**
   * Validate extracted data against business rules
   */
  private async validateExtractions(data: Omit<ExtractionResponse, 'extraction_id' | 'processing_time_ms'>): Promise<Omit<ExtractionResponse, 'extraction_id' | 'processing_time_ms'>> {
    // Validate commitment due dates are in the future
    data.commitments = data.commitments.map(c => {
      const dueDate = new Date(c.due_date);
      const today = new Date();

      if (dueDate < today) {
        // Reduce confidence for past dates
        c.confidence_score = Math.min(c.confidence_score, 0.6);
        logger.warn('Commitment has past due date', { commitment: c.description, due_date: c.due_date });
      }

      return c;
    });

    // Filter out very low confidence items (<0.3)
    const minConfidence = 0.3;

    data.decisions = data.decisions.filter(d => d.confidence_score >= minConfidence);
    data.commitments = data.commitments.filter(c => c.confidence_score >= minConfidence);
    data.risks = data.risks.filter(r => r.confidence_score >= minConfidence);
    data.follow_up_actions = data.follow_up_actions.filter(a => a.confidence_score >= minConfidence);

    return data;
  }

  /**
   * Enhance extractions with historical pattern analysis
   * Suggests commitment owners based on past assignments
   */
  private async enhanceWithHistoricalPatterns(
    data: Omit<ExtractionResponse, 'extraction_id' | 'processing_time_ms'>,
    dossier_id: string
  ): Promise<void> {
    try {
      // Query historical commitments for this dossier
      const { data: historicalCommitments } = await this.supabase
        .from('commitments')
        .select('description, owner_internal_id, users!inner(name)')
        .eq('dossier_id', dossier_id)
        .limit(50);

      if (!historicalCommitments || historicalCommitments.length === 0) {
        return;
      }

      // Match extracted commitments to historical owners using keyword similarity
      data.commitments = data.commitments.map(commitment => {
        if (commitment.owner_name === 'TBD') {
          // Find best match based on description keywords
          const bestMatch = this.findBestOwnerMatch(commitment.description, historicalCommitments);

          if (bestMatch && bestMatch.similarity > 0.6) {
            commitment.owner_name = bestMatch.owner_name;
            // Reduce confidence slightly for inferred owner
            commitment.confidence_score = Math.min(commitment.confidence_score, 0.85);
            logger.info('Inferred commitment owner from history', {
              commitment: commitment.description,
              owner: bestMatch.owner_name,
              similarity: bestMatch.similarity
            });
          }
        }

        return commitment;
      });
    } catch (error) {
      logger.error('Failed to enhance with historical patterns', { error });
      // Don't fail the whole extraction if pattern analysis fails
    }
  }

  /**
   * Find best matching owner from historical data
   */
  private findBestOwnerMatch(description: string, historicalData: any[]): { owner_name: string; similarity: number } | null {
    const descriptionKeywords = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    let bestMatch: { owner_name: string; similarity: number } | null = null;

    for (const historical of historicalData) {
      const historicalKeywords = historical.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

      // Calculate Jaccard similarity
      const intersection = descriptionKeywords.filter(k => historicalKeywords.includes(k)).length;
      const union = new Set([...descriptionKeywords, ...historicalKeywords]).size;
      const similarity = union > 0 ? intersection / union : 0;

      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = {
          owner_name: historical.users?.name || 'Unknown',
          similarity
        };
      }
    }

    return bestMatch;
  }

  // Helper functions

  private normalizeConfidence(value: any): number {
    const num = parseFloat(value);
    if (isNaN(num)) return 0.5; // Default medium confidence
    return Math.max(0, Math.min(1, num)); // Clamp to 0-1
  }

  private normalizeDateFormat(dateStr: string): string {
    try {
      // Try to parse and format as YYYY-MM-DD
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // If invalid, return 30 days from now as default
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        return futureDate.toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch {
      // Fallback: 30 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      return futureDate.toISOString().split('T')[0];
    }
  }

  private normalizePriority(value: string): 'low' | 'medium' | 'high' | 'critical' {
    const normalized = value?.toLowerCase();
    if (['low', 'medium', 'high', 'critical'].includes(normalized)) {
      return normalized as 'low' | 'medium' | 'high' | 'critical';
    }
    return 'medium'; // Default
  }

  private normalizeSeverity(value: string): 'low' | 'medium' | 'high' | 'critical' {
    const normalized = value?.toLowerCase();
    if (['low', 'medium', 'high', 'critical'].includes(normalized)) {
      return normalized as 'low' | 'medium' | 'high' | 'critical';
    }
    return 'medium'; // Default
  }

  private normalizeLikelihood(value: string): 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain' {
    const normalized = value?.toLowerCase();
    if (['rare', 'unlikely', 'possible', 'likely', 'certain'].includes(normalized)) {
      return normalized as 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
    }
    return 'possible'; // Default
  }
}
