import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorService } from '../../src/services/vector.service';
import { supabase } from '../../src/config/supabase';

vi.mock('../../src/config/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}));

describe('VectorService', () => {
  let vectorService: VectorService;

  beforeEach(() => {
    vectorService = new VectorService();
    vi.clearAllMocks();
  });

  describe('createEmbedding', () => {
    it('should create embedding for text', async () => {
      const text = 'Test document content';
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { embedding: mockEmbedding },
        error: null
      } as any);

      const result = await vectorService.createEmbedding(text);
      
      expect(result).toEqual(mockEmbedding);
      expect(supabase.rpc).toHaveBeenCalledWith('generate_embedding', {
        input_text: text
      });
    });

    it('should handle embedding creation errors', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Embedding generation failed' }
      } as any);

      await expect(vectorService.createEmbedding('test')).rejects.toThrow(
        'Failed to create embedding'
      );
    });
  });

  describe('similaritySearch', () => {
    it('should perform similarity search with embedding', async () => {
      const queryEmbedding = new Array(1536).fill(0).map(() => Math.random());
      const mockResults = [
        { id: '1', content: 'Result 1', similarity: 0.95 },
        { id: '2', content: 'Result 2', similarity: 0.85 }
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockResults,
        error: null
      } as any);

      const results = await vectorService.similaritySearch(queryEmbedding, 10, 0.7);
      
      expect(results).toEqual(mockResults);
      expect(supabase.rpc).toHaveBeenCalledWith('similarity_search', {
        query_embedding: queryEmbedding,
        match_count: 10,
        match_threshold: 0.7
      });
    });

    it('should handle search with default parameters', async () => {
      const queryEmbedding = new Array(1536).fill(0);
      
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null
      } as any);

      await vectorService.similaritySearch(queryEmbedding);
      
      expect(supabase.rpc).toHaveBeenCalledWith('similarity_search', {
        query_embedding: queryEmbedding,
        match_count: 20,
        match_threshold: 0.5
      });
    });
  });

  describe('upsertEmbedding', () => {
    it('should upsert embedding for document', async () => {
      const documentId = 'doc123';
      const embedding = new Array(1536).fill(0).map(() => Math.random());
      const metadata = { title: 'Test Document' };

      const mockFrom = vi.mocked(supabase.from);
      const mockUpsert = vi.fn().mockResolvedValueOnce({
        data: { id: documentId, embedding, metadata },
        error: null
      });

      mockFrom.mockReturnValueOnce({
        upsert: mockUpsert
      } as any);

      await vectorService.upsertEmbedding(documentId, embedding, metadata);
      
      expect(mockFrom).toHaveBeenCalledWith('vector_embeddings');
      expect(mockUpsert).toHaveBeenCalledWith({
        document_id: documentId,
        embedding,
        metadata
      });
    });
  });

  describe('getEmbedding', () => {
    it('should retrieve embedding by document ID', async () => {
      const documentId = 'doc123';
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { embedding: mockEmbedding },
          error: null
        })
      } as any);

      const result = await vectorService.getEmbedding(documentId);
      
      expect(result).toEqual(mockEmbedding);
      expect(mockFrom).toHaveBeenCalledWith('vector_embeddings');
    });

    it('should return null when embedding not found', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })
      } as any);

      const result = await vectorService.getEmbedding('nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('deleteEmbedding', () => {
    it('should delete embedding by document ID', async () => {
      const documentId = 'doc123';

      const mockFrom = vi.mocked(supabase.from);
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValueOnce({
        data: null,
        error: null
      });

      mockFrom.mockReturnValueOnce({
        delete: mockDelete,
        eq: mockEq
      } as any);

      mockDelete.mockReturnValueOnce({
        eq: mockEq
      });

      await vectorService.deleteEmbedding(documentId);
      
      expect(mockFrom).toHaveBeenCalledWith('vector_embeddings');
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('createIndex', () => {
    it('should create HNSW index for vector column', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { success: true },
        error: null
      } as any);

      await vectorService.createIndex('vector_embeddings', 'embedding');
      
      expect(supabase.rpc).toHaveBeenCalledWith('create_hnsw_index', {
        table_name: 'vector_embeddings',
        column_name: 'embedding'
      });
    });

    it('should handle index creation errors', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Index creation failed' }
      } as any);

      await expect(
        vectorService.createIndex('table', 'column')
      ).rejects.toThrow('Failed to create index');
    });
  });
});