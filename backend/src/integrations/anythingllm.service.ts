import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logInfo, logWarn, logError } from '../utils/logger';

// Interface for AnythingLLM API responses
interface AnythingLLMResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Interface for chat completion request
interface ChatCompletionRequest {
  message: string;
  context?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Interface for chat completion response
interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Interface for embedding request
interface EmbeddingRequest {
  input: string | string[];
  model?: string;
  encoding_format?: string;
}

// Interface for embedding response
interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Interface for document upload request
interface DocumentUploadRequest {
  file: Buffer;
  filename: string;
  mimeType: string;
  collectionId?: string;
  metadata?: Record<string, any>;
}

// Interface for document upload response
interface DocumentUploadResponse {
  success: boolean;
  documentId: string;
  filename: string;
  collectionId: string;
  metadata: Record<string, any>;
}

// Interface for search request
interface SearchRequest {
  query: string;
  collectionId?: string;
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
}

// Interface for search response
interface SearchResponse {
  success: boolean;
  results: Array<{
    id: string;
    content: string;
    metadata: Record<string, any>;
    score: number;
  }>;
  total: number;
}

// Fallback service interface
interface FallbackService {
  generateEmbedding(text: string): Promise<number[]>;
  generateText(prompt: string): Promise<string>;
  searchSimilar(query: string, limit?: number): Promise<any[]>;
}

// Simple fallback service using basic algorithms
class BasicFallbackService implements FallbackService {
  private embeddings: Map<string, number[]> = new Map();
  
  async generateEmbedding(text: string): Promise<number[]> {
    // Simple hash-based embedding fallback
    const hash = this.simpleHash(text);
    const embedding = this.hashToVector(hash, 1536);
    
    // Cache the embedding
    this.embeddings.set(text, embedding);
    
    logWarn('Using fallback embedding generation for text:', text.substring(0, 100));
    return embedding;
  }
  
  async generateText(prompt: string): Promise<string> {
    // Simple template-based response fallback
    const responses = [
      "I'm sorry, but I'm currently unable to process your request. Please try again later.",
      "The AI service is temporarily unavailable. Please contact support if this issue persists.",
      "I'm experiencing technical difficulties. Please try again in a few moments.",
      "The system is currently under maintenance. Please try again later."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    logWarn('Using fallback text generation for prompt:', prompt.substring(0, 100));
    return response;
  }
  
  async searchSimilar(query: string, limit: number = 5): Promise<any[]> {
    // Simple text similarity search fallback
    const results: any[] = [];
    
    for (const [text, embedding] of this.embeddings.entries()) {
      const similarity = this.calculateSimilarity(query, text);
      if (similarity > 0.3) { // Basic threshold
        results.push({
          content: text,
          score: similarity,
          metadata: {}
        });
      }
    }
    
    // Sort by similarity and limit results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
  
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  private hashToVector(hash: number, dimensions: number): number[] {
    const vector: number[] = [];
    let currentHash = hash;
    
    for (let i = 0; i < dimensions; i++) {
      currentHash = (currentHash * 1103515245 + 12345) % 2147483647;
      vector.push((currentHash / 2147483647) * 2 - 1); // Normalize to [-1, 1]
    }
    
    return vector;
  }
  
  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

// Main AnythingLLM service class
export class AnythingLLMService {
  private client: AxiosInstance;
  private fallbackService: FallbackService;
  private isHealthy: boolean = true;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 60000; // 1 minute
  
  constructor() {
    const baseURL = process.env.ANYTHINGLLM_URL || 'http://localhost:3001';
    const apiKey = process.env.ANYTHINGLLM_API_KEY;
    
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    });
    
    this.fallbackService = new BasicFallbackService();
    
    // Set up request/response interceptors
    this.setupInterceptors();
    
    // Start health check
    this.startHealthCheck();
  }
  
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logInfo(`AnythingLLM API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logError('AnythingLLM API Request Error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logInfo(`AnythingLLM API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logError('AnythingLLM API Response Error:', error);
        this.isHealthy = false;
        return Promise.reject(error);
      }
    );
  }
  
  private async startHealthCheck(): Promise<void> {
    const checkHealth = async () => {
      try {
        await this.client.get('/health');
        this.isHealthy = true;
        logInfo('AnythingLLM service is healthy');
      } catch (error) {
        this.isHealthy = false;
        logWarn('AnythingLLM service is unhealthy:', error instanceof Error ? error.message : 'Unknown error');
      }
      this.lastHealthCheck = Date.now();
    };
    
    // Initial health check
    await checkHealth();
    
    // Periodic health checks
    setInterval(checkHealth, this.healthCheckInterval);
  }
  
  private async ensureHealthy(): Promise<boolean> {
    const now = Date.now();
    
    // If we haven't checked health recently, do it now
    if (now - this.lastHealthCheck > this.healthCheckInterval) {
      try {
        await this.client.get('/health');
        this.isHealthy = true;
        this.lastHealthCheck = now;
      } catch (error) {
        this.isHealthy = false;
        this.lastHealthCheck = now;
      }
    }
    
    return this.isHealthy;
  }
  
  // Chat completion with fallback
  async generateText(request: ChatCompletionRequest): Promise<string> {
    try {
      const isHealthy = await this.ensureHealthy();
      
      if (!isHealthy) {
        logWarn('AnythingLLM service is unhealthy, using fallback');
        return await this.fallbackService.generateText(request.message);
      }
      
      const response: AxiosResponse<ChatCompletionResponse> = await this.client.post('/v1/chat/completions', {
        model: request.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: request.message
          }
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
        stream: request.stream || false
      });
      
      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }
      
      throw new Error('No response generated');
    } catch (error) {
      logError('AnythingLLM text generation failed, using fallback:', error instanceof Error ? error : undefined);
      return await this.fallbackService.generateText(request.message);
    }
  }
  
  // Embedding generation with fallback
  async generateEmbedding(request: EmbeddingRequest): Promise<number[]> {
    try {
      const isHealthy = await this.ensureHealthy();
      
      if (!isHealthy) {
        logWarn('AnythingLLM service is unhealthy, using fallback');
        const input = Array.isArray(request.input) ? request.input.join(' ') : request.input;
        return await this.fallbackService.generateEmbedding(input);
      }
      
      const response: AxiosResponse<EmbeddingResponse> = await this.client.post('/v1/embeddings', {
        input: request.input,
        model: request.model || 'text-embedding-ada-002',
        encoding_format: request.encoding_format || 'float'
      });
      
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0].embedding;
      }
      
      throw new Error('No embedding generated');
    } catch (error) {
      logError('AnythingLLM embedding generation failed, using fallback:', error instanceof Error ? error : undefined);
      const input = Array.isArray(request.input) ? request.input.join(' ') : request.input;
      return await this.fallbackService.generateEmbedding(input);
    }
  }
  
  // Document upload with fallback
  async uploadDocument(request: DocumentUploadRequest): Promise<DocumentUploadResponse> {
    try {
      const isHealthy = await this.ensureHealthy();
      
      if (!isHealthy) {
        throw new Error('AnythingLLM service is unhealthy');
      }
      
      const formData = new FormData();
      formData.append('file', new Blob([request.file]), request.filename);
      formData.append('filename', request.filename);
      formData.append('mimeType', request.mimeType);
      
      if (request.collectionId) {
        formData.append('collectionId', request.collectionId);
      }
      
      if (request.metadata) {
        formData.append('metadata', JSON.stringify(request.metadata));
      }
      
      const response: AxiosResponse<DocumentUploadResponse> = await this.client.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      logError('AnythingLLM document upload failed:', error instanceof Error ? error : undefined);
      throw error;
    }
  }
  
  // Search with fallback
  async search(request: SearchRequest): Promise<SearchResponse> {
    try {
      const isHealthy = await this.ensureHealthy();
      
      if (!isHealthy) {
        logWarn('AnythingLLM service is unhealthy, using fallback');
        const results = await this.fallbackService.searchSimilar(request.query, request.limit || 5);
        return {
          success: true,
          results: results.map((result, index) => ({
            id: `fallback-${index}`,
            content: result.content,
            metadata: result.metadata,
            score: result.score
          })),
          total: results.length
        };
      }
      
      const response: AxiosResponse<SearchResponse> = await this.client.post('/api/search', {
        query: request.query,
        collectionId: request.collectionId,
        limit: request.limit || 5,
        threshold: request.threshold || 0.7,
        includeMetadata: request.includeMetadata || true
      });
      
      return response.data;
    } catch (error) {
      logError('AnythingLLM search failed, using fallback:', error instanceof Error ? error : undefined);
      const results = await this.fallbackService.searchSimilar(request.query, request.limit || 5);
      return {
        success: true,
        results: results.map((result, index) => ({
          id: `fallback-${index}`,
          content: result.content,
          metadata: result.metadata,
          score: result.score
        })),
        total: results.length
      };
    }
  }
  
  // Get service health status
  getHealthStatus(): { healthy: boolean; lastCheck: number } {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastHealthCheck
    };
  }
  
  // Force health check
  async forceHealthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      this.isHealthy = true;
      this.lastHealthCheck = Date.now();
      return true;
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }
}

// Export singleton instance
export const anythingLLMService = new AnythingLLMService();

// Export types
export type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  SearchRequest,
  SearchResponse
};
