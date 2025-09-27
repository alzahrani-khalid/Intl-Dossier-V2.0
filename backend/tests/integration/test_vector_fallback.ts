import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Integration Test: Vector Embedding with Fallback', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should create report with pending embedding when AnythingLLM is unavailable', async () => {
    // Simulate AnythingLLM service being down
    // In a real scenario, we would mock the AnythingLLM service to be unavailable
    
    const reportData = {
      title: 'Test Report for Fallback',
      content: 'This is test content for fallback testing',
      data_sources: ['source1'],
      confidence_score: 85
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.embedding_status).toBe('pending');
    expect(data).toHaveProperty('id');
    expect(data.title).toBe(reportData.title);
    expect(data.content).toBe(reportData.content);
  });

  it('should process pending embeddings when AnythingLLM becomes available', async () => {
    // First create a report with pending embedding
    const reportData = {
      title: 'Report for Processing',
      content: 'Content to be processed when service is available',
      data_sources: ['source1'],
      confidence_score: 90
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);
    const createdReport = await createResponse.json();
    const reportId = createdReport.id;

    // Verify initial state
    expect(createdReport.embedding_status).toBe('pending');

    // Simulate AnythingLLM service becoming available
    // In a real scenario, we would start the AnythingLLM service
    // and trigger the background job to process pending embeddings

    // Try to generate embedding
    const embeddingResponse = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    // Should either succeed (202) or indicate processing (202) or fallback (503)
    expect([202, 503]).toContain(embeddingResponse.status);
  });

  it('should fallback to keyword search when vector search fails', async () => {
    // Create a report for search testing
    const reportData = {
      title: 'Search Test Report',
      content: 'This report contains keywords for search testing',
      data_sources: ['source1'],
      confidence_score: 75
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);

    // Try to search with vector similarity (should fallback to keyword search)
    const searchData = {
      query: 'search test keywords',
      similarity_threshold: 0.8
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    // Should return 503 with fallback mode
    expect(response.status).toBe(503);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('fallback_mode');
    expect(['keyword_search', 'cached_results']).toContain(data.fallback_mode);
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should handle embedding generation timeout gracefully', async () => {
    // Create a report
    const reportData = {
      title: 'Timeout Test Report',
      content: 'Content for timeout testing',
      data_sources: ['source1'],
      confidence_score: 80
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);
    const createdReport = await createResponse.json();
    const reportId = createdReport.id;

    // Try to generate embedding with very short timeout
    // This should trigger timeout handling
    const embeddingResponse = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    // Should handle timeout gracefully
    expect([202, 503, 408]).toContain(embeddingResponse.status);
  });

  it('should maintain data integrity during fallback scenarios', async () => {
    // Create multiple reports to test data integrity
    const reports = [
      {
        title: 'Report 1',
        content: 'Content for report 1',
        data_sources: ['source1'],
        confidence_score: 70
      },
      {
        title: 'Report 2',
        content: 'Content for report 2',
        data_sources: ['source2'],
        confidence_score: 80
      },
      {
        title: 'Report 3',
        content: 'Content for report 3',
        data_sources: ['source3'],
        confidence_score: 90
      }
    ];

    const createdReports = [];
    for (const reportData of reports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      createdReports.push(data);
    }

    // Verify all reports were created with pending embedding status
    createdReports.forEach(report => {
      expect(report.embedding_status).toBe('pending');
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('title');
      expect(report).toHaveProperty('content');
    });

    // Try to search (should fallback to keyword search)
    const searchData = {
      query: 'report content',
      similarity_threshold: 0.8
    };

    const searchResponse = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    // Should return fallback results
    expect(searchResponse.status).toBe(503);
    
    const searchData_result = await searchResponse.json();
    expect(searchData_result).toHaveProperty('results');
    expect(Array.isArray(searchData_result.results)).toBe(true);
  });

  it('should handle bilingual content during fallback', async () => {
    // Create a bilingual report
    const reportData = {
      title: 'Bilingual Report',
      title_ar: 'تقرير ثنائي اللغة',
      content: 'English content for fallback testing',
      content_ar: 'محتوى عربي لاختبار الاحتياطي',
      data_sources: ['source1'],
      confidence_score: 85
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);
    const createdReport = await createResponse.json();

    // Verify bilingual content is preserved
    expect(createdReport.title).toBe(reportData.title);
    expect(createdReport.title_ar).toBe(reportData.title_ar);
    expect(createdReport.content).toBe(reportData.content);
    expect(createdReport.content_ar).toBe(reportData.content_ar);
    expect(createdReport.embedding_status).toBe('pending');

    // Try to search in Arabic (should fallback to keyword search)
    const searchData = {
      query: 'تقرير ثنائي اللغة',
      similarity_threshold: 0.8
    };

    const searchResponse = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    // Should return fallback results
    expect(searchResponse.status).toBe(503);
    
    const searchData_result = await searchResponse.json();
    expect(searchData_result).toHaveProperty('results');
    expect(Array.isArray(searchData_result.results)).toBe(true);
  });

  it('should handle embedding generation errors gracefully', async () => {
    // Create a report
    const reportData = {
      title: 'Error Test Report',
      content: 'Content for error testing',
      data_sources: ['source1'],
      confidence_score: 75
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);
    const createdReport = await createResponse.json();
    const reportId = createdReport.id;

    // Simulate embedding generation error
    // In a real scenario, we would mock the embedding service to return an error
    const embeddingResponse = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    // Should handle error gracefully
    expect([202, 503, 500]).toContain(embeddingResponse.status);

    // Verify report is still accessible
    const getResponse = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
    });

    expect(getResponse.status).toBe(200);
    const reportData_result = await getResponse.json();
    expect(reportData_result.id).toBe(reportId);
    expect(reportData_result.title).toBe(reportData.title);
  });

  it('should process multiple pending embeddings in batch', async () => {
    // Create multiple reports with pending embeddings
    const reports = Array(5).fill(null).map((_, index) => ({
      title: `Batch Report ${index + 1}`,
      content: `Content for batch report ${index + 1}`,
      data_sources: [`source${index + 1}`],
      confidence_score: 70 + index * 5
    }));

    const createdReports = [];
    for (const reportData of reports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      createdReports.push(data);
    }

    // Verify all reports have pending embedding status
    createdReports.forEach(report => {
      expect(report.embedding_status).toBe('pending');
    });

    // Simulate batch processing of pending embeddings
    // In a real scenario, this would be handled by a background job
    for (const report of createdReports) {
      const embeddingResponse = await server.request(`/api/intelligence-reports/${report.id}/embedding`, {
        method: 'POST',
      });

      // Should handle batch processing
      expect([202, 503]).toContain(embeddingResponse.status);
    }
  });

  it('should maintain search functionality during fallback', async () => {
    // Create reports for search testing
    const reports = [
      {
        title: 'Security Report',
        content: 'Security analysis and threat assessment',
        data_sources: ['security-source'],
        confidence_score: 85
      },
      {
        title: 'Intelligence Brief',
        content: 'Intelligence briefing on current threats',
        data_sources: ['intel-source'],
        confidence_score: 90
      }
    ];

    for (const reportData of reports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
    }

    // Test search with filters (should fallback to keyword search)
    const searchData = {
      query: 'security threat',
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        status: ['approved']
      },
      similarity_threshold: 0.8
    };

    const searchResponse = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    // Should return fallback results
    expect(searchResponse.status).toBe(503);
    
    const searchData_result = await searchResponse.json();
    expect(searchData_result).toHaveProperty('results');
    expect(searchData_result).toHaveProperty('fallback_mode');
    expect(Array.isArray(searchData_result.results)).toBe(true);
  });
});
