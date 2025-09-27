import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

export interface AIRequest {
  prompt: string;
  context?: string;
  documentType?: 'brief' | 'letter' | 'report' | 'summary' | 'translation';
  language?: 'en' | 'ar';
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  fallbackUsed: boolean;
  provider: 'anythingllm' | 'fallback' | 'cached';
  processingTime: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface FallbackTemplate {
  type: string;
  language: string;
  template: string;
  placeholders: string[];
}

export class AIFallbackService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private anythingLLMUrl: string;
  private anythingLLMKey: string;
  private responseCache: Map<string, { response: string; timestamp: number }> = new Map();
  private cacheExpiry: number = 3600000; // 1 hour
  private maxRetries: number = 3;
  private fallbackTemplates: Map<string, FallbackTemplate> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy: boolean = true;
  private lastHealthCheck: Date = new Date();

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    anythingLLMUrl: string,
    anythingLLMKey: string
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    this.anythingLLMUrl = anythingLLMUrl;
    this.anythingLLMKey = anythingLLMKey;
    this.initializeFallbackTemplates();
    this.startHealthMonitoring();
  }

  private initializeFallbackTemplates(): void {
    // Brief templates
    this.fallbackTemplates.set('brief-en', {
      type: 'brief',
      language: 'en',
      template: `
# Brief: {title}

## Executive Summary
This document provides a comprehensive overview of {topic}.

## Key Points
- {point1}
- {point2}
- {point3}

## Background
{context}

## Analysis
Based on available information, the following observations can be made:
- Current status: {status}
- Key challenges: {challenges}
- Opportunities: {opportunities}

## Recommendations
1. {recommendation1}
2. {recommendation2}
3. {recommendation3}

## Conclusion
{conclusion}

---
*Note: This is a template-based response due to AI service unavailability.*
      `,
      placeholders: ['title', 'topic', 'point1', 'point2', 'point3', 'context', 'status', 'challenges', 'opportunities', 'recommendation1', 'recommendation2', 'recommendation3', 'conclusion']
    });

    this.fallbackTemplates.set('brief-ar', {
      type: 'brief',
      language: 'ar',
      template: `
# موجز: {title}

## الملخص التنفيذي
تقدم هذه الوثيقة نظرة شاملة عن {topic}.

## النقاط الرئيسية
- {point1}
- {point2}
- {point3}

## الخلفية
{context}

## التحليل
بناءً على المعلومات المتاحة، يمكن إجراء الملاحظات التالية:
- الوضع الحالي: {status}
- التحديات الرئيسية: {challenges}
- الفرص: {opportunities}

## التوصيات
1. {recommendation1}
2. {recommendation2}
3. {recommendation3}

## الخاتمة
{conclusion}

---
*ملاحظة: هذه استجابة قائمة على النموذج بسبب عدم توفر خدمة الذكاء الاصطناعي.*
      `,
      placeholders: ['title', 'topic', 'point1', 'point2', 'point3', 'context', 'status', 'challenges', 'opportunities', 'recommendation1', 'recommendation2', 'recommendation3', 'conclusion']
    });

    // Letter templates
    this.fallbackTemplates.set('letter-en', {
      type: 'letter',
      language: 'en',
      template: `
{date}

{recipient_name}
{recipient_title}
{recipient_organization}
{recipient_address}

Dear {salutation},

{opening_paragraph}

{main_body}

{closing_paragraph}

We look forward to {next_steps}.

Sincerely,

{sender_name}
{sender_title}
{sender_organization}

---
*Note: This is a template-based response due to AI service unavailability.*
      `,
      placeholders: ['date', 'recipient_name', 'recipient_title', 'recipient_organization', 'recipient_address', 'salutation', 'opening_paragraph', 'main_body', 'closing_paragraph', 'next_steps', 'sender_name', 'sender_title', 'sender_organization']
    });

    // Report template
    this.fallbackTemplates.set('report-en', {
      type: 'report',
      language: 'en',
      template: `
# {title}

**Report Date:** {date}
**Prepared by:** {author}
**Classification:** {classification}

## Executive Summary
{executive_summary}

## 1. Introduction
{introduction}

## 2. Methodology
{methodology}

## 3. Findings
{findings}

## 4. Analysis
{analysis}

## 5. Recommendations
{recommendations}

## 6. Conclusion
{conclusion}

## Appendices
{appendices}

---
*Note: This is a template-based response due to AI service unavailability.*
      `,
      placeholders: ['title', 'date', 'author', 'classification', 'executive_summary', 'introduction', 'methodology', 'findings', 'analysis', 'recommendations', 'conclusion', 'appendices']
    });

    // Summary template
    this.fallbackTemplates.set('summary-en', {
      type: 'summary',
      language: 'en',
      template: `
## Summary

**Subject:** {subject}
**Date:** {date}

### Key Points:
- {key_point_1}
- {key_point_2}
- {key_point_3}

### Main Content:
{main_content}

### Action Items:
1. {action_1}
2. {action_2}

### Next Steps:
{next_steps}

---
*Note: This is a template-based response due to AI service unavailability.*
      `,
      placeholders: ['subject', 'date', 'key_point_1', 'key_point_2', 'key_point_3', 'main_content', 'action_1', 'action_2', 'next_steps']
    });
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return {
        success: true,
        content: cachedResponse,
        fallbackUsed: false,
        provider: 'cached',
        processingTime: Date.now() - startTime
      };
    }

    // Try AnythingLLM with retries
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (!this.isHealthy && Date.now() - this.lastHealthCheck.getTime() < 30000) {
          // Skip if known to be unhealthy and checked recently
          break;
        }

        const response = await this.callAnythingLLM(request);
        
        // Cache successful response
        this.cacheResponse(cacheKey, response.content);
        
        return {
          success: true,
          content: response.content,
          fallbackUsed: false,
          provider: 'anythingllm',
          processingTime: Date.now() - startTime,
          tokens: response.tokens
        };

      } catch (error) {
        console.error(`AnythingLLM attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // Mark as unhealthy after all retries fail
    this.isHealthy = false;
    this.lastHealthCheck = new Date();

    // Use fallback
    const fallbackResponse = await this.generateFallbackResponse(request);
    
    return {
      success: true,
      content: fallbackResponse,
      fallbackUsed: true,
      provider: 'fallback',
      processingTime: Date.now() - startTime
    };
  }

  private async callAnythingLLM(request: AIRequest): Promise<{
    content: string;
    tokens?: { prompt: number; completion: number; total: number };
  }> {
    const systemMessage = request.systemMessage || this.getDefaultSystemMessage(request);

    const response = await fetch(`${this.anythingLLMUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.anythingLLMKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: request.prompt }
        ],
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`AnythingLLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      tokens: data.usage ? {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens
      } : undefined
    };
  }

  private async generateFallbackResponse(request: AIRequest): Promise<string> {
    const documentType = request.documentType || 'summary';
    const language = request.language || 'en';
    const templateKey = `${documentType}-${language}`;

    const template = this.fallbackTemplates.get(templateKey);
    
    if (!template) {
      return this.generateGenericFallback(request);
    }

    // Parse prompt to extract placeholder values
    const placeholderValues = this.extractPlaceholderValues(request.prompt, template.placeholders);
    
    // Fill template with extracted values
    let content = template.template;
    for (const [placeholder, value] of Object.entries(placeholderValues)) {
      content = content.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
    }

    return content;
  }

  private generateGenericFallback(request: AIRequest): string {
    const language = request.language || 'en';
    
    if (language === 'ar') {
      return `
# الاستجابة المؤقتة

نعتذر، خدمة الذكاء الاصطناعي غير متاحة حالياً.

## الطلب المستلم:
${request.prompt}

## السياق:
${request.context || 'لا يوجد سياق إضافي'}

## الاقتراحات:
- حاول مرة أخرى بعد بضع دقائق
- استخدم النماذج المتاحة كمرجع
- اتصل بالدعم الفني إذا استمرت المشكلة

---
*هذه استجابة مؤقتة بسبب عدم توفر خدمة الذكاء الاصطناعي.*
      `;
    }

    return `
# Temporary Response

We apologize, the AI service is currently unavailable.

## Request Received:
${request.prompt}

## Context:
${request.context || 'No additional context provided'}

## Suggestions:
- Try again in a few minutes
- Use available templates as reference
- Contact support if the issue persists

---
*This is a temporary response due to AI service unavailability.*
    `;
  }

  private extractPlaceholderValues(prompt: string, placeholders: string[]): Record<string, string> {
    const values: Record<string, string> = {};
    
    // Simple extraction based on keywords
    // In production, use NLP for better extraction
    for (const placeholder of placeholders) {
      // Default values
      switch (placeholder) {
        case 'date':
          values[placeholder] = new Date().toLocaleDateString();
          break;
        case 'title':
          values[placeholder] = this.extractTitle(prompt) || 'Document Title';
          break;
        case 'topic':
          values[placeholder] = this.extractTopic(prompt) || 'the subject matter';
          break;
        case 'context':
          values[placeholder] = this.extractContext(prompt) || 'Based on the current situation';
          break;
        default:
          values[placeholder] = `[${placeholder}]`;
      }
    }

    return values;
  }

  private extractTitle(prompt: string): string | null {
    const titleMatch = prompt.match(/title:?\s*([^\n]+)/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  private extractTopic(prompt: string): string | null {
    const topicMatch = prompt.match(/(?:about|regarding|concerning|topic:?)\s*([^\n]+)/i);
    return topicMatch ? topicMatch[1].trim() : null;
  }

  private extractContext(prompt: string): string | null {
    const contextMatch = prompt.match(/context:?\s*([^\n]+)/i);
    return contextMatch ? contextMatch[1].trim() : null;
  }

  private getDefaultSystemMessage(request: AIRequest): string {
    const language = request.language || 'en';
    const documentType = request.documentType || 'general';

    if (language === 'ar') {
      return `أنت مساعد ذكاء اصطناعي محترف للهيئة العامة للإحصاء. مهمتك هي إنشاء محتوى ${documentType} باللغة العربية بشكل احترافي ودقيق.`;
    }

    return `You are a professional AI assistant for the General Authority for Statistics. Your task is to generate ${documentType} content in English that is professional and accurate.`;
  }

  private generateCacheKey(request: AIRequest): string {
    const key = `${request.documentType}-${request.language}-${request.prompt.substring(0, 100)}`;
    return Buffer.from(key).toString('base64');
  }

  private getCachedResponse(key: string): string | null {
    const cached = this.responseCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.responseCache.delete(key);
      return null;
    }

    return cached.response;
  }

  private cacheResponse(key: string, response: string): void {
    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.responseCache.size > 100) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, 60000); // Check every minute
  }

  private async checkHealth(): Promise<void> {
    try {
      const response = await fetch(`${this.anythingLLMUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      this.isHealthy = response.ok;
      this.lastHealthCheck = new Date();

      if (this.isHealthy) {
        console.log('AnythingLLM service is healthy');
      } else {
        console.warn('AnythingLLM service is unhealthy');
      }
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      console.error('AnythingLLM health check failed:', error);
    }
  }

  async testFallback(): Promise<{
    anythingLLMStatus: string;
    fallbackStatus: string;
    cacheStatus: string;
  }> {
    const testRequest: AIRequest = {
      prompt: 'Test prompt for system health check',
      documentType: 'summary',
      language: 'en'
    };

    // Test AnythingLLM
    let anythingLLMStatus = 'unknown';
    try {
      await this.callAnythingLLM(testRequest);
      anythingLLMStatus = 'healthy';
    } catch {
      anythingLLMStatus = 'unhealthy';
    }

    // Test fallback
    let fallbackStatus = 'unknown';
    try {
      const fallback = await this.generateFallbackResponse(testRequest);
      fallbackStatus = fallback ? 'ready' : 'error';
    } catch {
      fallbackStatus = 'error';
    }

    // Test cache
    const cacheStatus = this.responseCache.size > 0 ? 'active' : 'empty';

    return {
      anythingLLMStatus,
      fallbackStatus,
      cacheStatus
    };
  }

  async getServiceMetrics(): Promise<{
    totalRequests: number;
    successfulRequests: number;
    fallbackRequests: number;
    cachedResponses: number;
    averageResponseTime: number;
    healthStatus: boolean;
  }> {
    // In production, these would be tracked in a database
    return {
      totalRequests: 0,
      successfulRequests: 0,
      fallbackRequests: 0,
      cachedResponses: this.responseCache.size,
      averageResponseTime: 0,
      healthStatus: this.isHealthy
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup method
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Export factory function
export function createAIFallbackService(
  supabaseUrl: string,
  supabaseKey: string,
  anythingLLMUrl: string,
  anythingLLMKey: string
): AIFallbackService {
  return new AIFallbackService(supabaseUrl, supabaseKey, anythingLLMUrl, anythingLLMKey);
}