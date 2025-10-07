import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DuplicateCandidate {
  ticket_id: string;
  ticket_number: string;
  title: string;
  overall_score: number;
  title_similarity: number;
  content_similarity: number;
  metadata_similarity: number;
  is_high_confidence: boolean;
}

interface DuplicateDetectionOptions {
  ticketId: string;
  threshold?: number;
  includeResolved?: boolean;
}

interface DuplicateDetectionResult {
  candidates: DuplicateCandidate[];
  model_info: {
    embedding_model: string;
    threshold_used: number;
    detection_method: 'vector' | 'fallback';
  };
}

/**
 * Duplicate Detection Service
 * Uses pgvector for semantic similarity matching to find potential duplicates
 */
export class DuplicateService {
  private readonly PRIMARY_THRESHOLD = parseFloat(
    process.env.SIMILARITY_PRIMARY || '0.82'
  );
  private readonly CANDIDATE_THRESHOLD = parseFloat(
    process.env.SIMILARITY_CANDIDATE || '0.65'
  );
  private readonly EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'bge-m3';

  /**
   * Detect duplicate candidates for a given ticket
   */
  async detectDuplicates(
    options: DuplicateDetectionOptions
  ): Promise<DuplicateDetectionResult> {
    const threshold = options.threshold || this.CANDIDATE_THRESHOLD;

    logger.info('Starting duplicate detection', {
      ticketId: options.ticketId,
      threshold,
    });

    try {
      // Get source ticket
      const sourceTicket = await this.getTicket(options.ticketId);

      // Get or generate embedding for source ticket
      const sourceEmbedding = await this.getOrCreateEmbedding(sourceTicket);

      // Search for similar tickets using vector similarity
      const candidates = await this.searchSimilarTickets(
        sourceEmbedding,
        options.ticketId,
        threshold,
        options.includeResolved
      );

      // Store detected candidates in database
      await this.storeDuplicateCandidates(options.ticketId, candidates);

      logger.info('Duplicate detection completed', {
        ticketId: options.ticketId,
        candidatesFound: candidates.length,
      });

      return {
        candidates,
        model_info: {
          embedding_model: this.EMBEDDING_MODEL,
          threshold_used: threshold,
          detection_method: 'vector',
        },
      };
    } catch (error) {
      logger.error('Duplicate detection failed', {
        ticketId: options.ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to keyword-based search
      return this.fallbackKeywordSearch(options);
    }
  }

  /**
   * Get ticket details
   */
  private async getTicket(ticketId: string) {
    const { data, error } = await supabase
      .from('intake_tickets')
      .select('id, title, title_ar, description, description_ar, request_type, created_at')
      .eq('id', ticketId)
      .single();

    if (error || !data) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    return data;
  }

  /**
   * Get existing embedding or generate new one
   */
  private async getOrCreateEmbedding(ticket: any): Promise<number[]> {
    // Check for existing embedding
    const { data: existing } = await supabase
      .from('ai_embeddings')
      .select('embedding')
      .eq('owner_type', 'ticket')
      .eq('owner_id', ticket.id)
      .eq('model', this.EMBEDDING_MODEL)
      .single();

    if (existing && existing.embedding) {
      return existing.embedding;
    }

    // Generate new embedding
    const textToEmbed = this.prepareTextForEmbedding(ticket);
    const embedding = await this.generateEmbedding(textToEmbed);

    // Store embedding
    await this.storeEmbedding(ticket.id, embedding, textToEmbed);

    return embedding;
  }

  /**
   * Prepare text for embedding generation
   */
  private prepareTextForEmbedding(ticket: any): string {
    const parts = [
      ticket.title,
      ticket.title_ar,
      ticket.description,
      ticket.description_ar,
      ticket.request_type,
    ].filter(Boolean);

    return parts.join(' | ');
  }

  /**
   * Generate embedding using AnythingLLM
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const anythingLLMUrl = process.env.ANYTHINGLLM_API_URL;
    const anythingLLMKey = process.env.ANYTHINGLLM_API_KEY;

    if (!anythingLLMUrl || !anythingLLMKey) {
      throw new Error('AnythingLLM configuration missing');
    }

    const response = await fetch(`${anythingLLMUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anythingLLMKey}`,
      },
      body: JSON.stringify({
        text,
        model: this.EMBEDDING_MODEL,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.embedding || [];
  }

  /**
   * Store embedding in database
   */
  private async storeEmbedding(
    ticketId: string,
    embedding: number[],
    originalText: string
  ) {
    // Create content hash
    const encoder = new TextEncoder();
    const data = encoder.encode(originalText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    await supabase.from('ai_embeddings').insert({
      owner_type: 'ticket',
      owner_id: ticketId,
      embedding,
      content_hash: hashArray,
      model: this.EMBEDDING_MODEL,
      model_version: '1.0',
      embedding_dim: embedding.length,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
  }

  /**
   * Search for similar tickets using vector similarity
   */
  private async searchSimilarTickets(
    embedding: number[],
    excludeTicketId: string,
    threshold: number,
    includeResolved: boolean = false
  ): Promise<DuplicateCandidate[]> {
    // Use pgvector cosine similarity search via RPC
    const { data, error } = await supabase.rpc('search_duplicate_tickets', {
      p_embedding: embedding,
      p_exclude_ticket_id: excludeTicketId,
      p_threshold: threshold,
      p_include_resolved: includeResolved,
      p_limit: 10,
    });

    if (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      ticket_id: row.ticket_id,
      ticket_number: row.ticket_number,
      title: row.title,
      overall_score: row.similarity_score,
      title_similarity: row.title_similarity || row.similarity_score,
      content_similarity: row.similarity_score,
      metadata_similarity: row.metadata_similarity || 0,
      is_high_confidence: row.similarity_score >= this.PRIMARY_THRESHOLD,
    }));
  }

  /**
   * Store duplicate candidates in database
   */
  private async storeDuplicateCandidates(
    sourceTicketId: string,
    candidates: DuplicateCandidate[]
  ) {
    const records = candidates.map((candidate) => ({
      source_ticket_id: sourceTicketId,
      target_ticket_id: candidate.ticket_id,
      overall_score: candidate.overall_score,
      title_similarity: candidate.title_similarity,
      content_similarity: candidate.content_similarity,
      metadata_similarity: candidate.metadata_similarity,
      status: 'pending',
      detected_at: new Date().toISOString(),
      detected_by: 'ai',
    }));

    if (records.length > 0) {
      // Insert or update candidates
      await supabase.from('duplicate_candidates').upsert(records, {
        onConflict: 'source_ticket_id,target_ticket_id',
      });
    }
  }

  /**
   * Fallback to keyword-based search when vector search fails
   * Implements graceful degradation per FR-010:
   * 1. Try pgvector semantic search (primary)
   * 2. Fall back to trigram similarity (pg_trgm)
   * 3. Fall back to basic keyword match (full-text search)
   */
  private async fallbackKeywordSearch(
    options: DuplicateDetectionOptions
  ): Promise<DuplicateDetectionResult> {
    logger.warn('Using fallback keyword search', {
      ticketId: options.ticketId,
    });

    const sourceTicket = await this.getTicket(options.ticketId);

    // Try lexical duplicate search with multiple fallback strategies
    const result = await this.searchDuplicatesLexical(
      sourceTicket,
      options.ticketId
    );

    return result;
  }

  /**
   * Search for duplicates using lexical methods
   * Implements FR-010 graceful AI degradation with multiple fallback strategies
   */
  async searchDuplicatesLexical(
    sourceTicket: any,
    excludeTicketId: string
  ): Promise<DuplicateDetectionResult> {
    // Try method 1: Trigram similarity (pg_trgm)
    try {
      logger.info('Attempting trigram similarity search', {
        ticketId: excludeTicketId,
      });

      const { data: trigramResults, error: trigramError } = await supabase.rpc(
        'search_tickets_by_trigram',
        {
          p_title: sourceTicket.title,
          p_description: sourceTicket.description || '',
          p_exclude_ticket_id: excludeTicketId,
          p_threshold: 0.3,
          p_limit: 10,
        }
      );

      if (!trigramError && trigramResults && trigramResults.length > 0) {
        logger.info('Trigram similarity search successful', {
          ticketId: excludeTicketId,
          candidatesFound: trigramResults.length,
        });

        const candidates = trigramResults.map((row: any) => ({
          ticket_id: row.ticket_id,
          ticket_number: row.ticket_number,
          title: row.title,
          overall_score: row.similarity_score,
          title_similarity: row.similarity_score,
          content_similarity: row.content_similarity || 0,
          metadata_similarity: row.metadata_similarity || 0,
          is_high_confidence: false, // Lexical methods never high confidence
        }));

        return {
          candidates,
          model_info: {
            embedding_model: 'trigram',
            threshold_used: 0.3,
            detection_method: 'fallback',
          },
        };
      }
    } catch (error) {
      logger.warn('Trigram similarity search failed, trying full-text search', {
        ticketId: excludeTicketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Try method 2: Full-text search (ts_vector)
    try {
      logger.info('Attempting full-text search', {
        ticketId: excludeTicketId,
      });

      const { data: keywordResults, error: keywordError } = await supabase.rpc(
        'search_tickets_by_keywords',
        {
          p_keywords: sourceTicket.title,
          p_exclude_ticket_id: excludeTicketId,
          p_limit: 10,
        }
      );

      if (!keywordError && keywordResults && keywordResults.length > 0) {
        logger.info('Full-text search successful', {
          ticketId: excludeTicketId,
          candidatesFound: keywordResults.length,
        });

        const candidates = keywordResults.map((row: any) => ({
          ticket_id: row.ticket_id,
          ticket_number: row.ticket_number,
          title: row.title,
          overall_score: 0.4, // Lower confidence for keyword match
          title_similarity: 0.4,
          content_similarity: 0.4,
          metadata_similarity: 0,
          is_high_confidence: false,
        }));

        return {
          candidates,
          model_info: {
            embedding_model: 'keyword',
            threshold_used: 0.4,
            detection_method: 'fallback',
          },
        };
      }
    } catch (error) {
      logger.warn('Full-text search failed', {
        ticketId: excludeTicketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Method 3: Return empty results if all fallbacks fail
    logger.error('All fallback search methods failed', {
      ticketId: excludeTicketId,
    });

    return {
      candidates: [],
      model_info: {
        embedding_model: 'none',
        threshold_used: 0,
        detection_method: 'fallback',
      },
    };
  }

  /**
   * Mark duplicate candidate as confirmed or dismissed
   */
  async updateDuplicateStatus(
    sourceTicketId: string,
    targetTicketId: string,
    status: 'confirmed_duplicate' | 'not_duplicate',
    reason?: string,
    userId?: string
  ): Promise<boolean> {
    try {
      await supabase
        .from('duplicate_candidates')
        .update({
          status,
          decision_reason: reason,
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
        })
        .eq('source_ticket_id', sourceTicketId)
        .eq('target_ticket_id', targetTicketId);

      return true;
    } catch (error) {
      logger.error('Failed to update duplicate status', {
        sourceTicketId,
        targetTicketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export const duplicateService = new DuplicateService();