import { createClient } from '@supabase/supabase-js'
import {
  VectorEmbedding,
  VectorEmbeddingInput,
  VectorEmbeddingModel,
} from '../models/vector-embedding.model'
import { IntelligenceReport } from '../models/intelligence-report.model'
import { embeddingsService } from '../ai/embeddings-service.js'
import { aiConfig } from '../ai/config.js'

interface VectorSearchOptions {
  query_embedding: number[]
  similarity_threshold?: number
  limit?: number
  filter?: Record<string, any>
}

interface VectorSearchResult {
  report_id: string
  similarity: number
  report: IntelligenceReport
}

export class VectorService {
  private supabase: any
  private anythingLLMAvailable: boolean = true
  private fallbackMode: 'keyword' | 'cached' | null = null
  private useBGEM3: boolean = true

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.useBGEM3 = !process.env.AI_USE_ANYTHINGLLM || process.env.AI_USE_ANYTHINGLLM === 'false'
  }

  async createEmbedding(input: VectorEmbeddingInput): Promise<VectorEmbedding> {
    const validationErrors = VectorEmbeddingModel.validate(input)
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`)
    }

    const normalized = VectorEmbeddingModel.normalizeVector(input.embedding)
    const config = VectorEmbeddingModel.getIndexConfig()

    const { data, error } = await this.supabase
      .from('vector_embeddings')
      .insert({
        report_id: input.report_id,
        embedding: normalized,
        index_method: 'hnsw',
        ef_construction: config.ef_construction,
        m_parameter: config.m_parameter,
        similarity_threshold:
          input.similarity_threshold || VectorEmbeddingModel.DEFAULT_SIMILARITY_THRESHOLD,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create embedding: ${error.message}`)
    }

    return data
  }

  async generateEmbeddingFromText(text: string): Promise<number[] | null> {
    // Use BGE-M3 embeddings service (default)
    if (this.useBGEM3) {
      try {
        const result = await embeddingsService.embed(text)
        return result.embedding
      } catch (error) {
        console.error('BGE-M3 embedding failed:', error)
        // Fall through to AnythingLLM fallback if configured
        if (!process.env.ANYTHINGLLM_API_URL) {
          return null
        }
      }
    }

    // Fallback to AnythingLLM if configured
    if (!this.anythingLLMAvailable) {
      return null
    }

    try {
      const response = await fetch(process.env.ANYTHINGLLM_API_URL + '/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ANYTHINGLLM_API_KEY}`,
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-ada-002',
        }),
      })

      if (!response.ok) {
        throw new Error(`AnythingLLM API error: ${response.statusText}`)
      }

      const data = (await response.json()) as any
      return data.data[0].embedding
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      this.anythingLLMAvailable = false
      this.fallbackMode = 'keyword'
      return null
    }
  }

  async searchByVector(options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const {
      query_embedding,
      similarity_threshold = VectorEmbeddingModel.DEFAULT_SIMILARITY_THRESHOLD,
      limit = 10,
      filter = {},
    } = options

    if (!this.anythingLLMAvailable || this.fallbackMode) {
      return this.fallbackSearch(filter, limit)
    }

    const normalized = VectorEmbeddingModel.normalizeVector(query_embedding)

    const { data, error } = await this.supabase.rpc('vector_search', {
      query_embedding: normalized,
      similarity_threshold,
      match_count: limit,
      filter,
    })

    if (error) {
      console.error('Vector search failed:', error)
      return this.fallbackSearch(filter, limit)
    }

    return data.map((item: any) => ({
      report_id: item.report_id,
      similarity: item.similarity,
      report: item.report,
    }))
  }

  private async fallbackSearch(
    filter: Record<string, any>,
    limit: number,
  ): Promise<VectorSearchResult[]> {
    let query = this.supabase.from('intelligence_reports').select('*')

    Object.entries(filter).forEach(([key, value]) => {
      if (key === 'text_query' && typeof value === 'string') {
        query = query.or(`title.ilike.%${value}%,content.ilike.%${value}%`)
      } else {
        query = query.eq(key, value)
      }
    })

    const { data, error } = await query.limit(limit)

    if (error) {
      throw new Error(`Fallback search failed: ${error.message}`)
    }

    return data.map((report: IntelligenceReport) => ({
      report_id: report.id,
      similarity: 0,
      report,
    }))
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<VectorEmbedding> {
    const normalized = VectorEmbeddingModel.normalizeVector(embedding)

    const { data, error } = await this.supabase
      .from('vector_embeddings')
      .update({
        embedding: normalized,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update embedding: ${error.message}`)
    }

    return data
  }

  async deleteEmbedding(reportId: string): Promise<void> {
    const { error } = await this.supabase
      .from('vector_embeddings')
      .delete()
      .eq('report_id', reportId)

    if (error) {
      throw new Error(`Failed to delete embedding: ${error.message}`)
    }
  }

  async findSimilarReports(reportId: string, limit: number = 5): Promise<VectorSearchResult[]> {
    const { data: embedding, error: embedError } = await this.supabase
      .from('vector_embeddings')
      .select('embedding')
      .eq('report_id', reportId)
      .single()

    if (embedError) {
      throw new Error(`Failed to get embedding: ${embedError.message}`)
    }

    return this.searchByVector({
      query_embedding: embedding.embedding,
      limit,
      filter: { 'id.neq': reportId },
    })
  }

  async processKMeansClustering(
    embeddings: number[][],
    k: number = 5,
  ): Promise<{ cluster_id: number; report_ids: string[] }[]> {
    const { data, error } = await this.supabase.rpc('kmeans_clustering', {
      embeddings,
      k,
      max_iterations: 100,
    })

    if (error) {
      throw new Error(`K-means clustering failed: ${error.message}`)
    }

    return data
  }

  async detectAnomalies(
    embeddings: number[][],
    contamination: number = 0.1,
  ): Promise<{ report_id: string; anomaly_score: number; is_anomaly: boolean }[]> {
    const { data, error } = await this.supabase.rpc('detect_anomalies', {
      embeddings,
      contamination,
      method: 'isolation_forest',
    })

    if (error) {
      throw new Error(`Anomaly detection failed: ${error.message}`)
    }

    return data
  }

  async rebuildIndex(): Promise<void> {
    const { error } = await this.supabase.rpc('rebuild_vector_index', {
      index_method: 'hnsw',
      ef_construction: VectorEmbeddingModel.DEFAULT_EF_CONSTRUCTION,
      m: VectorEmbeddingModel.DEFAULT_M_PARAMETER,
    })

    if (error) {
      throw new Error(`Index rebuild failed: ${error.message}`)
    }
  }

  isInFallbackMode(): boolean {
    return this.fallbackMode !== null
  }

  getFallbackMode(): string | null {
    return this.fallbackMode
  }

  async checkAnythingLLMStatus(): Promise<boolean> {
    try {
      const response = await fetch(process.env.ANYTHINGLLM_API_URL + '/health', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.ANYTHINGLLM_API_KEY}`,
        },
      })

      this.anythingLLMAvailable = response.ok
      if (response.ok) {
        this.fallbackMode = null
      }

      return this.anythingLLMAvailable
    } catch {
      this.anythingLLMAvailable = false
      this.fallbackMode = 'keyword'
      return false
    }
  }
}
