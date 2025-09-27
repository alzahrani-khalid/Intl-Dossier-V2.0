import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from '../../src/services/search.service';
import { VectorService } from '../../src/services/vector.service';
import { supabase } from '../../src/config/supabase';

vi.mock('../../src/services/vector.service');
vi.mock('../../src/config/supabase');

describe('SearchService', () => {
  let searchService: SearchService;
  let mockVectorService: any;

  beforeEach(() => {
    mockVectorService = {
      createEmbedding: vi.fn(),
      similaritySearch: vi.fn()
    };
    vi.mocked(VectorService).mockImplementation(() => mockVectorService);
    searchService = new SearchService();
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should perform text search with partial results', async () => {
      const query = 'test search query';
      const options = {
        limit: 10,
        offset: 0,
        filters: { category: 'reports' },
        timeout: 5000
      };

      const mockEmbedding = new Array(1536).fill(0);
      const mockVectorResults = [
        { id: '1', content: 'Result 1', similarity: 0.95 },
        { id: '2', content: 'Result 2', similarity: 0.85 }
      ];

      mockVectorService.createEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorService.similaritySearch.mockResolvedValue(mockVectorResults);

      const mockTextResults = [
        { id: '3', content: 'Text Result 1', score: 0.8 },
        { id: '4', content: 'Text Result 2', score: 0.7 }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue({
          data: mockTextResults,
          error: null
        })
      } as any);

      const result = await searchService.search(query, options);

      expect(result.results).toBeDefined();
      expect(result.totalResults).toBeGreaterThan(0);
      expect(result.searchTime).toBeDefined();
      expect(mockVectorService.createEmbedding).toHaveBeenCalledWith(query);
    });

    it('should handle search timeout with partial results', async () => {
      const query = 'timeout test';
      const options = { timeout: 100 };

      mockVectorService.createEmbedding.mockResolvedValue(new Array(1536).fill(0));
      
      // Simulate slow vector search
      mockVectorService.similaritySearch.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 200))
      );

      const mockTextResults = [{ id: '1', content: 'Quick result' }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue({
          data: mockTextResults,
          error: null
        })
      } as any);

      const result = await searchService.search(query, options);

      expect(result.partial).toBe(true);
      expect(result.results).toHaveLength(1);
    });

    it('should apply filters to search', async () => {
      const query = 'filtered search';
      const options = {
        filters: {
          category: 'intelligence',
          status: 'active',
          dateRange: { start: '2024-01-01', end: '2024-12-31' }
        }
      };

      mockVectorService.createEmbedding.mockResolvedValue(new Array(1536).fill(0));
      mockVectorService.similaritySearch.mockResolvedValue([]);

      const mockFrom = vi.fn();
      const mockSelect = vi.fn().mockReturnThis();
      const mockTextSearch = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGte = vi.fn().mockReturnThis();
      const mockLte = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOffset = vi.fn().mockResolvedValue({
        data: [],
        error: null
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        textSearch: mockTextSearch,
        eq: mockEq,
        gte: mockGte,
        lte: mockLte,
        limit: mockLimit,
        offset: mockOffset
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await searchService.search(query, options);

      expect(mockEq).toHaveBeenCalledWith('category', 'intelligence');
      expect(mockEq).toHaveBeenCalledWith('status', 'active');
    });
  });

  describe('searchWithFacets', () => {
    it('should return search results with facets', async () => {
      const query = 'faceted search';
      const facets = ['category', 'status', 'type'];

      mockVectorService.createEmbedding.mockResolvedValue(new Array(1536).fill(0));
      mockVectorService.similaritySearch.mockResolvedValue([]);

      const mockResults = [
        { id: '1', category: 'reports', status: 'active' },
        { id: '2', category: 'reports', status: 'draft' },
        { id: '3', category: 'intelligence', status: 'active' }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue({
          data: mockResults,
          error: null
        })
      } as any);

      // Mock facet aggregation
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          category: { reports: 2, intelligence: 1 },
          status: { active: 2, draft: 1 }
        },
        error: null
      } as any);

      const result = await searchService.searchWithFacets(query, facets);

      expect(result.facets).toBeDefined();
      expect(result.facets.category).toBeDefined();
      expect(result.facets.status).toBeDefined();
    });
  });

  describe('suggest', () => {
    it('should provide search suggestions', async () => {
      const prefix = 'intel';

      const mockSuggestions = [
        { term: 'intelligence', score: 0.95 },
        { term: 'intelligence reports', score: 0.90 },
        { term: 'international', score: 0.85 }
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockSuggestions,
        error: null
      } as any);

      const result = await searchService.suggest(prefix);

      expect(result).toEqual(mockSuggestions);
      expect(supabase.rpc).toHaveBeenCalledWith('get_search_suggestions', {
        prefix,
        limit: 10
      });
    });

    it('should limit number of suggestions', async () => {
      const prefix = 'test';
      const limit = 5;

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null
      } as any);

      await searchService.suggest(prefix, limit);

      expect(supabase.rpc).toHaveBeenCalledWith('get_search_suggestions', {
        prefix,
        limit
      });
    });
  });

  describe('reindex', () => {
    it('should trigger reindexing of content', async () => {
      const contentType = 'reports';

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, indexed: 150 },
        error: null
      } as any);

      const result = await searchService.reindex(contentType);

      expect(result.success).toBe(true);
      expect(result.indexed).toBe(150);
      expect(supabase.rpc).toHaveBeenCalledWith('reindex_content', {
        content_type: contentType
      });
    });

    it('should handle reindexing errors', async () => {
      const contentType = 'invalid';

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Invalid content type' }
      } as any);

      await expect(searchService.reindex(contentType)).rejects.toThrow();
    });
  });

  describe('highlightResults', () => {
    it('should highlight search terms in results', () => {
      const results = [
        { id: '1', content: 'This is a test document about intelligence gathering.' },
        { id: '2', content: 'Another document with intelligence information.' }
      ];
      const query = 'intelligence';

      const highlighted = searchService.highlightResults(results, query);

      expect(highlighted[0].content).toContain('<mark>intelligence</mark>');
      expect(highlighted[1].content).toContain('<mark>intelligence</mark>');
    });

    it('should handle multiple search terms', () => {
      const results = [
        { id: '1', content: 'Document about reports and intelligence.' }
      ];
      const query = 'reports intelligence';

      const highlighted = searchService.highlightResults(results, query);

      expect(highlighted[0].content).toContain('<mark>reports</mark>');
      expect(highlighted[0].content).toContain('<mark>intelligence</mark>');
    });
  });
});