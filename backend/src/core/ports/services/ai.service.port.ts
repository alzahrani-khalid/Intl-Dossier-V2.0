/**
 * AI Service Port
 *
 * Defines the contract for AI/ML operations.
 * Adapters can implement using OpenAI, Claude, local models, etc.
 */

/**
 * Text generation request
 */
export interface TextGenerationRequest {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  stopSequences?: string[]
}

/**
 * Text generation response
 */
export interface TextGenerationResponse {
  text: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'content_filter' | 'error'
  model: string
}

/**
 * Embedding request
 */
export interface EmbeddingRequest {
  text: string | string[]
  model?: string
}

/**
 * Embedding response
 */
export interface EmbeddingResponse {
  embeddings: number[][]
  model: string
  dimensions: number
}

/**
 * Document extraction request
 */
export interface DocumentExtractionRequest {
  content: string
  contentType: 'text' | 'html' | 'pdf'
  extractionSchema?: Record<string, unknown>
  language?: 'ar' | 'en'
}

/**
 * Document extraction response
 */
export interface DocumentExtractionResponse {
  entities: ExtractedEntity[]
  summary?: string
  keywords?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Extracted entity from document
 */
export interface ExtractedEntity {
  type: string
  value: string
  confidence: number
  position?: {
    start: number
    end: number
  }
}

/**
 * Chat message for conversational AI
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Chat completion request
 */
export interface ChatCompletionRequest {
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  tools?: AITool[]
}

/**
 * AI tool definition for function calling
 */
export interface AITool {
  name: string
  description: string
  parameters: Record<string, unknown>
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
  message: ChatMessage
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  toolCalls?: Array<{
    name: string
    arguments: Record<string, unknown>
  }>
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter'
}

/**
 * Similarity search request
 */
export interface SimilaritySearchRequest {
  query: string
  collection: string
  limit?: number
  threshold?: number
  filter?: Record<string, unknown>
}

/**
 * Similarity search result
 */
export interface SimilaritySearchResult {
  id: string
  content: string
  score: number
  metadata?: Record<string, unknown>
}

/**
 * AI Service Port
 *
 * Contract for AI/ML operations. Implementations can use
 * OpenAI, Anthropic Claude, local models, or AnythingLLM.
 */
export interface IAIService {
  /**
   * Generate text completion
   */
  generateText(request: TextGenerationRequest): Promise<TextGenerationResponse>

  /**
   * Generate embeddings for text
   */
  generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>

  /**
   * Extract entities and information from documents
   */
  extractFromDocument(request: DocumentExtractionRequest): Promise<DocumentExtractionResponse>

  /**
   * Chat completion with message history
   */
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>

  /**
   * Perform similarity search in vector store
   */
  similaritySearch(request: SimilaritySearchRequest): Promise<SimilaritySearchResult[]>

  /**
   * Summarize text content
   */
  summarize(text: string, maxLength?: number, language?: 'ar' | 'en'): Promise<string>

  /**
   * Translate text between Arabic and English
   */
  translate(text: string, targetLanguage: 'ar' | 'en'): Promise<string>

  /**
   * Check if AI service is available
   */
  isAvailable(): Promise<boolean>

  /**
   * Get current model information
   */
  getModelInfo(): Promise<{
    name: string
    version: string
    maxContextLength: number
    capabilities: string[]
  }>
}
