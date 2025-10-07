/**
 * Embedding Queue Background Worker
 * Feature: 015-search-retrieval-spec
 * Task: T036
 *
 * Processes embedding_update_queue table:
 * - Runs every 30 seconds
 * - Generates vector embeddings for updated entities
 * - Updates entity tables with new embeddings
 * - Handles errors with retry logic
 * - Removes processed items from queue
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VectorService } from '../services/vector.service';

interface QueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  priority: number;
  created_at: string;
  retry_count: number;
  error_message?: string;
}

export class EmbeddingQueueProcessor {
  private supabase: SupabaseClient;
  private vectorService: VectorService;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    supabaseUrl: string = process.env.SUPABASE_URL!,
    supabaseKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.vectorService = new VectorService(supabaseUrl, supabaseKey);
  }

  /**
   * Start the background worker
   * Runs every 30 seconds
   */
  start(): void {
    if (this.processingInterval) {
      console.log('Embedding queue processor already running');
      return;
    }

    console.log('Starting embedding queue processor (every 30 seconds)');

    // Process immediately on start
    this.processQueue().catch(err => {
      console.error('Initial queue processing failed:', err);
    });

    // Then process every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue().catch(err => {
        console.error('Queue processing failed:', err);
      });
    }, 30000); // 30 seconds
  }

  /**
   * Stop the background worker
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Embedding queue processor stopped');
    }
  }

  /**
   * Process embedding update queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('Queue processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Fetch unprocessed items from queue (max 100 at a time)
      const { data: queueItems, error: fetchError } = await this.supabase
        .from('embedding_update_queue')
        .select('*')
        .is('processed_at', null)
        .order('priority', { ascending: true })  // High priority first (1 = highest)
        .order('created_at', { ascending: true }) // Oldest first
        .limit(100);

      if (fetchError) {
        console.error('Failed to fetch queue items:', fetchError);
        return;
      }

      if (!queueItems || queueItems.length === 0) {
        console.log('Embedding queue is empty');
        return;
      }

      console.log(`Processing ${queueItems.length} embedding queue items...`);

      // Process each item
      let successCount = 0;
      let failureCount = 0;

      for (const item of queueItems) {
        try {
          await this.processQueueItem(item as QueueItem);
          successCount++;
        } catch (error) {
          console.error(`Failed to process queue item ${item.id}:`, error);
          failureCount++;
        }
      }

      const tookMs = Date.now() - startTime;
      console.log(`Queue processing complete: ${successCount} succeeded, ${failureCount} failed (${tookMs}ms)`);

    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: QueueItem): Promise<void> {
    try {
      // Step 1: Fetch entity data
      const entityData = await this.fetchEntityData(item.entity_type, item.entity_id);

      if (!entityData) {
        throw new Error(`Entity not found: ${item.entity_type}/${item.entity_id}`);
      }

      // Step 2: Generate embedding text
      const embeddingText = this.generateEmbeddingText(entityData, item.entity_type);

      if (!embeddingText || embeddingText.trim().length === 0) {
        throw new Error('No text available for embedding generation');
      }

      // Step 3: Generate embedding via vector service
      const embedding = await this.vectorService.generateEmbeddingFromText(embeddingText);

      if (!embedding) {
        throw new Error('Failed to generate embedding (AnythingLLM unavailable)');
      }

      // Step 4: Update entity table with embedding
      await this.updateEntityEmbedding(item.entity_type, item.entity_id, embedding);

      // Step 5: Mark queue item as processed (delete from queue)
      await this.supabase
        .from('embedding_update_queue')
        .delete()
        .eq('id', item.id);

      console.log(`✓ Processed embedding for ${item.entity_type}/${item.entity_id}`);

    } catch (error) {
      // Handle error: increment retry count, update error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      const retryCount = item.retry_count + 1;

      console.error(`✗ Error processing ${item.entity_type}/${item.entity_id}: ${errorMessage}`);

      // If retry count exceeds threshold, mark as failed and remove from queue
      const MAX_RETRIES = 5;
      if (retryCount >= MAX_RETRIES) {
        console.error(`Max retries (${MAX_RETRIES}) exceeded for ${item.id}, removing from queue`);

        await this.supabase
          .from('embedding_update_queue')
          .delete()
          .eq('id', item.id);

      } else {
        // Update retry count and error message
        await this.supabase
          .from('embedding_update_queue')
          .update({
            retry_count: retryCount,
            error_message: errorMessage
          })
          .eq('id', item.id);
      }

      throw error; // Re-throw to count as failure
    }
  }

  /**
   * Fetch entity data from database
   */
  private async fetchEntityData(entityType: string, entityId: string): Promise<any | null> {
    const tableName = this.getTableName(entityType);

    if (!tableName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const { data, error } = await this.supabase
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single();

    if (error) {
      console.error(`Failed to fetch entity ${entityType}/${entityId}:`, error);
      return null;
    }

    return data;
  }

  /**
   * Generate embedding text from entity data
   */
  private generateEmbeddingText(entityData: any, entityType: string): string {
    const parts: string[] = [];

    // Entity-specific text extraction
    switch (entityType) {
      case 'positions':
        if (entityData.topic_en) parts.push(entityData.topic_en);
        if (entityData.topic_ar) parts.push(entityData.topic_ar);
        if (entityData.rationale_en) parts.push(entityData.rationale_en);
        if (entityData.rationale_ar) parts.push(entityData.rationale_ar);
        if (entityData.key_messages_en) parts.push(entityData.key_messages_en);
        if (entityData.key_messages_ar) parts.push(entityData.key_messages_ar);
        break;

      case 'attachments':
        if (entityData.file_name) parts.push(entityData.file_name);
        if (entityData.description_en) parts.push(entityData.description_en);
        if (entityData.description_ar) parts.push(entityData.description_ar);
        if (entityData.extracted_text_en) parts.push(entityData.extracted_text_en);
        if (entityData.extracted_text_ar) parts.push(entityData.extracted_text_ar);
        break;

      case 'briefs':
        if (entityData.title_en) parts.push(entityData.title_en);
        if (entityData.title_ar) parts.push(entityData.title_ar);
        if (entityData.summary_en) parts.push(entityData.summary_en);
        if (entityData.summary_ar) parts.push(entityData.summary_ar);
        if (entityData.content_en) parts.push(entityData.content_en);
        if (entityData.content_ar) parts.push(entityData.content_ar);
        break;

      default:
        throw new Error(`Unsupported entity type for embeddings: ${entityType}`);
    }

    // Join all parts, limit to 8000 characters (API limit)
    const fullText = parts.join(' ');
    return fullText.substring(0, 8000);
  }

  /**
   * Update entity table with generated embedding
   */
  private async updateEntityEmbedding(
    entityType: string,
    entityId: string,
    embedding: number[]
  ): Promise<void> {
    const tableName = this.getTableName(entityType);

    if (!tableName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const { error } = await this.supabase
      .from(tableName)
      .update({ embedding })
      .eq('id', entityId);

    if (error) {
      throw new Error(`Failed to update embedding: ${error.message}`);
    }
  }

  /**
   * Map entity type to database table name
   */
  private getTableName(entityType: string): string | null {
    const mapping: Record<string, string> = {
      'positions': 'positions',
      'attachments': 'attachments',
      'briefs': 'briefs'
    };

    return mapping[entityType] || null;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    failed: number;
    avgRetryCount: number;
  }> {
    const { data: pendingItems, error: pendingError } = await this.supabase
      .from('embedding_update_queue')
      .select('retry_count')
      .is('processed_at', null);

    if (pendingError) {
      console.error('Failed to get queue stats:', pendingError);
      return { pending: 0, failed: 0, avgRetryCount: 0 };
    }

    const pending = pendingItems?.length || 0;
    const failed = pendingItems?.filter(item => item.retry_count >= 3).length || 0;
    const avgRetryCount = pending > 0
      ? pendingItems.reduce((sum, item) => sum + item.retry_count, 0) / pending
      : 0;

    return {
      pending,
      failed,
      avgRetryCount
    };
  }
}

// Singleton instance
let processorInstance: EmbeddingQueueProcessor | null = null;

/**
 * Get singleton embedding queue processor instance
 */
export function getEmbeddingQueueProcessor(): EmbeddingQueueProcessor {
  if (!processorInstance) {
    processorInstance = new EmbeddingQueueProcessor();
  }
  return processorInstance;
}

/**
 * Start the embedding queue processor (call this on server startup)
 */
export function startEmbeddingQueueProcessor(): void {
  const processor = getEmbeddingQueueProcessor();
  processor.start();
}

/**
 * Stop the embedding queue processor (call this on server shutdown)
 */
export function stopEmbeddingQueueProcessor(): void {
  if (processorInstance) {
    processorInstance.stop();
  }
}
