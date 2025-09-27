import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { performance } from 'perf_hooks';
import { supabase } from '../../src/config/supabase';
import { VectorService } from '../../src/services/vector.service';
import { SearchService } from '../../src/services/search.service';

/**
 * Performance tests for search functionality
 * Requirement: Search response must be <2s for 100k records
 */
describe('Search Performance Tests', () => {
  let searchService: SearchService;
  let vectorService: VectorService;
  const TEST_DATASET_SIZE = 100000;
  const MAX_RESPONSE_TIME_MS = 2000; // 2 seconds

  beforeAll(async () => {
    searchService = new SearchService();
    vectorService = new VectorService();
    
    // Verify test dataset exists
    const { count } = await supabase
      .from('intelligence_reports')
      .select('*', { count: 'exact', head: true });
    
    if ((count || 0) < TEST_DATASET_SIZE) {
      console.warn(`Warning: Test dataset has only ${count} records. Expected ${TEST_DATASET_SIZE}.`);
      console.warn('Run npm run seed:performance to generate test data.');
    }
  });

  describe('Vector Search Performance', () => {
    it('should perform vector similarity search in under 2 seconds', async () => {
      const testQuery = 'international cooperation security threats terrorism';
      
      const startTime = performance.now();
      
      // Generate embedding for search query
      const embedding = await vectorService.createEmbedding(testQuery);
      
      // Perform similarity search
      const results = await vectorService.similaritySearch(embedding, 50, 0.5);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`Vector search completed in ${responseTime.toFixed(2)}ms`);
      
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle concurrent vector searches efficiently', async () => {
      const queries = [
        'economic development trade agreements',
        'climate change environmental policies',
        'cybersecurity data protection',
        'healthcare systems pandemic response',
        'education technology innovation'
      ];
      
      const startTime = performance.now();
      
      // Perform concurrent searches
      const searchPromises = queries.map(async (query) => {
        const embedding = await vectorService.createEmbedding(query);
        return vectorService.similaritySearch(embedding, 20, 0.6);
      });
      
      const results = await Promise.all(searchPromises);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`${queries.length} concurrent vector searches completed in ${responseTime.toFixed(2)}ms`);
      console.log(`Average time per search: ${(responseTime / queries.length).toFixed(2)}ms`);
      
      // All searches combined should complete in reasonable time
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME_MS * 2);
      expect(results).toHaveLength(queries.length);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Full-Text Search Performance', () => {
    it('should perform full-text search in under 2 seconds', async () => {
      const searchQuery = 'bilateral cooperation agreements';
      
      const startTime = performance.now();
      
      const result = await searchService.search(searchQuery, {
        limit: 50,
        offset: 0
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`Full-text search completed in ${responseTime.toFixed(2)}ms`);
      console.log(`Results found: ${result.totalResults}`);
      
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(result.results).toBeDefined();
      expect(result.searchTime).toBeDefined();
    });

    it('should handle filtered searches efficiently', async () => {
      const searchQuery = 'security cooperation';
      const filters = {
        category: 'intelligence',
        status: 'active',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      };
      
      const startTime = performance.now();
      
      const result = await searchService.search(searchQuery, {
        limit: 50,
        filters
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`Filtered search completed in ${responseTime.toFixed(2)}ms`);
      
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(result.results).toBeDefined();
    });

    it('should handle paginated searches efficiently', async () => {
      const searchQuery = 'international relations';
      const pageSize = 20;
      const pages = 5;
      
      const pageTimes: number[] = [];
      
      for (let page = 0; page < pages; page++) {
        const startTime = performance.now();
        
        const result = await searchService.search(searchQuery, {
          limit: pageSize,
          offset: page * pageSize
        });
        
        const endTime = performance.now();
        const pageTime = endTime - startTime;
        pageTimes.push(pageTime);
        
        expect(result.results).toBeDefined();
      }
      
      const avgPageTime = pageTimes.reduce((a, b) => a + b, 0) / pages;
      console.log(`Average pagination time: ${avgPageTime.toFixed(2)}ms`);
      
      // Each page should load quickly
      pageTimes.forEach((time, index) => {
        console.log(`Page ${index + 1} loaded in ${time.toFixed(2)}ms`);
        expect(time).toBeLessThan(MAX_RESPONSE_TIME_MS);
      });
    });
  });

  describe('Hybrid Search Performance', () => {
    it('should perform combined vector + text search efficiently', async () => {
      const searchQuery = 'strategic partnerships multilateral organizations';
      
      const startTime = performance.now();
      
      // Perform hybrid search (vector + text)
      const result = await searchService.search(searchQuery, {
        limit: 50,
        useVector: true,
        useText: true,
        timeout: 5000
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`Hybrid search completed in ${responseTime.toFixed(2)}ms`);
      
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(result.results).toBeDefined();
      expect(result.partial).toBe(false); // Should complete without timeout
    });

    it('should handle partial results on timeout', async () => {
      const searchQuery = 'comprehensive analysis all documents';
      const timeout = 500; // 500ms timeout to force partial results
      
      const startTime = performance.now();
      
      const result = await searchService.search(searchQuery, {
        limit: 100,
        timeout
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`Partial search completed in ${responseTime.toFixed(2)}ms`);
      console.log(`Partial results returned: ${result.results.length}`);
      
      // Should respect timeout
      expect(responseTime).toBeLessThan(timeout + 100); // Allow 100ms buffer
      expect(result.partial).toBeDefined();
      expect(result.results).toBeDefined();
    });
  });

  describe('Search Scalability', () => {
    it('should maintain performance with increasing load', async () => {
      const loadLevels = [1, 5, 10, 20];
      const results: { load: number; avgTime: number }[] = [];
      
      for (const load of loadLevels) {
        const queries = Array(load).fill('international cooperation');
        const startTime = performance.now();
        
        await Promise.all(
          queries.map(q => searchService.search(q, { limit: 10 }))
        );
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / load;
        
        results.push({ load, avgTime });
        console.log(`Load ${load}: Avg ${avgTime.toFixed(2)}ms per search`);
      }
      
      // Performance should not degrade significantly with load
      const firstAvg = results[0].avgTime;
      const lastAvg = results[results.length - 1].avgTime;
      const degradation = ((lastAvg - firstAvg) / firstAvg) * 100;
      
      console.log(`Performance degradation: ${degradation.toFixed(2)}%`);
      
      // Allow up to 50% degradation under load
      expect(degradation).toBeLessThan(50);
    });

    it('should handle search with facets efficiently', async () => {
      const searchQuery = 'diplomatic relations';
      const facets = ['category', 'status', 'country', 'organization'];
      
      const startTime = performance.now();
      
      const result = await searchService.searchWithFacets(searchQuery, facets);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`Faceted search completed in ${responseTime.toFixed(2)}ms`);
      console.log(`Facets generated: ${Object.keys(result.facets || {}).length}`);
      
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(result.facets).toBeDefined();
      expect(Object.keys(result.facets)).toHaveLength(facets.length);
    });
  });

  describe('Index Performance', () => {
    it('should verify HNSW index is being used for vector search', async () => {
      // Check index exists and is being used
      const { data: indexInfo } = await supabase.rpc('get_index_info', {
        table_name: 'vector_embeddings',
        column_name: 'embedding'
      });
      
      expect(indexInfo).toBeDefined();
      expect(indexInfo?.index_type).toContain('hnsw');
      
      console.log('HNSW Index Info:', indexInfo);
    });

    it('should verify text search indexes are optimized', async () => {
      // Check GIN/GiST indexes for text search
      const { data: indexes } = await supabase.rpc('get_table_indexes', {
        table_name: 'intelligence_reports'
      });
      
      const textIndexes = indexes?.filter((idx: any) => 
        idx.index_type === 'gin' || idx.index_type === 'gist'
      );
      
      expect(textIndexes).toBeDefined();
      expect(textIndexes.length).toBeGreaterThan(0);
      
      console.log(`Text search indexes found: ${textIndexes.length}`);
    });
  });
});

/**
 * Seed script for performance testing
 * Run this to generate 100k test records if needed
 */
export async function seedPerformanceData() {
  console.log('Seeding performance test data...');
  const batchSize = 1000;
  const totalRecords = 100000;
  
  for (let i = 0; i < totalRecords; i += batchSize) {
    const batch = Array(batchSize).fill(0).map((_, j) => ({
      title_en: `Test Report ${i + j}`,
      title_ar: `تقرير اختبار ${i + j}`,
      content_en: generateTestContent(),
      content_ar: generateTestContent(),
      category: ['intelligence', 'analysis', 'briefing'][Math.floor(Math.random() * 3)],
      status: ['active', 'draft', 'archived'][Math.floor(Math.random() * 3)],
      metadata: {
        tags: generateRandomTags(),
        priority: Math.floor(Math.random() * 5) + 1
      }
    }));
    
    await supabase.from('intelligence_reports').insert(batch);
    
    console.log(`Inserted ${i + batchSize} / ${totalRecords} records`);
  }
  
  console.log('Performance test data seeded successfully');
}

function generateTestContent(): string {
  const topics = [
    'international cooperation',
    'security threats',
    'economic development',
    'diplomatic relations',
    'trade agreements',
    'climate change',
    'technology innovation',
    'healthcare systems'
  ];
  
  const sentences = Array(10).fill(0).map(() => {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    return `This document discusses ${topic} and its implications for regional stability.`;
  });
  
  return sentences.join(' ');
}

function generateRandomTags(): string[] {
  const allTags = [
    'urgent', 'confidential', 'public', 'analysis',
    'briefing', 'report', 'summary', 'detailed'
  ];
  
  const numTags = Math.floor(Math.random() * 4) + 1;
  return allTags.sort(() => 0.5 - Math.random()).slice(0, numTags);
}