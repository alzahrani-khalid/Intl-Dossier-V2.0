import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Integration Test: Search with Partial Results', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return partial results when timeout occurs', async () => {
    // Create test data
    const testReports = [
      {
        title: 'Quick Search Report 1',
        content: 'Content that matches quickly',
        data_sources: ['quick-source'],
        confidence_score: 90
      },
      {
        title: 'Slow Search Report 1',
        content: 'Content that takes longer to process',
        data_sources: ['slow-source'],
        confidence_score: 85
      }
    ];

    for (const reportData of testReports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer partial-search-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
    }

    // Search with very short timeout to trigger partial results
    const searchData = {
      query: 'search report',
      filters: {
        date_range: {
          from: '2020-01-01',
          to: '2025-12-31'
        },
        status: ['approved', 'pending'],
        priority: ['high', 'medium', 'low'],
        custom_tags: ['urgent', 'verified', 'reviewed']
      },
      similarity_threshold: 0.6,
      timeout_ms: 50 // Very short timeout
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer partial-search-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('partial_results');
    expect(data).toHaveProperty('failed_filters');
    expect(Array.isArray(data.results)).toBe(true);
    expect(typeof data.partial_results).toBe('boolean');
    expect(Array.isArray(data.failed_filters)).toBe(true);
    
    // If partial results occurred, some filters should be in failed_filters
    if (data.partial_results) {
      expect(data.failed_filters.length).toBeGreaterThan(0);
    }
  });

  it('should handle complex filter combinations with timeout', async () => {
    // Search with complex filters that may timeout
    const searchData = {
      query: 'complex search query',
      filters: {
        date_range: {
          from: '2020-01-01',
          to: '2025-12-31'
        },
        entities: ['dossier', 'organization', 'country', 'project'],
        status: ['approved', 'pending', 'draft'],
        priority: ['high', 'medium', 'low', 'critical'],
        custom_tags: ['urgent', 'verified', 'reviewed', 'archived'],
        filter_logic: 'AND'
      },
      similarity_threshold: 0.5,
      timeout_ms: 100
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer complex-filter-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('partial_results');
    expect(data).toHaveProperty('failed_filters');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should return available results immediately when timeout occurs', async () => {
    // Create multiple test reports
    const testReports = Array(10).fill(null).map((_, index) => ({
      title: `Immediate Result Report ${index + 1}`,
      content: `Content for immediate result ${index + 1}`,
      data_sources: [`immediate-source-${index + 1}`],
      confidence_score: 80 + index
    }));

    for (const reportData of testReports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer immediate-results-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
    }

    // Search with timeout that should return some results
    const searchData = {
      query: 'immediate result',
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        status: ['approved']
      },
      similarity_threshold: 0.7,
      timeout_ms: 200
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer immediate-results-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
    
    // Should return some results even if partial
    expect(data.results.length).toBeGreaterThan(0);
  });

  it('should handle timeout behavior configuration', async () => {
    // Test different timeout behaviors
    const timeoutBehaviors = ['partial', 'fail', 'cached'];
    
    for (const behavior of timeoutBehaviors) {
      const searchData = {
        query: `timeout behavior test ${behavior}`,
        filters: {
          date_range: {
            from: '2020-01-01',
            to: '2025-12-31'
          },
          status: ['approved']
        },
        similarity_threshold: 0.6,
        timeout_ms: 50, // Short timeout
        timeout_behavior: behavior
      };

      const response = await server.request('/api/intelligence-reports/search', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer timeout-behavior-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData),
      });

      // Should handle different timeout behaviors
      expect([200, 408, 503]).toContain(response.status);
    }
  });

  it('should handle search with large dataset timeout', async () => {
    // Create many test reports to simulate large dataset
    const testReports = Array(100).fill(null).map((_, index) => ({
      title: `Large Dataset Report ${index + 1}`,
      content: `Content for large dataset report ${index + 1}`,
      data_sources: [`large-source-${index + 1}`],
      confidence_score: 70 + (index % 30)
    }));

    for (const reportData of testReports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer large-dataset-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
    }

    // Search with timeout on large dataset
    const searchData = {
      query: 'large dataset',
      filters: {
        date_range: {
          from: '2020-01-01',
          to: '2025-12-31'
        },
        status: ['approved', 'pending'],
        priority: ['high', 'medium', 'low']
      },
      similarity_threshold: 0.5,
      timeout_ms: 100
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer large-dataset-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('partial_results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should handle concurrent search requests with timeout', async () => {
    // Test concurrent searches that may timeout
    const searchRequests = Array(10).fill(null).map((_, index) => 
      server.request('/api/intelligence-reports/search', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer concurrent-search-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `concurrent search ${index + 1}`,
          filters: {
            date_range: {
              from: '2020-01-01',
              to: '2025-12-31'
            },
            status: ['approved']
          },
          similarity_threshold: 0.6,
          timeout_ms: 100
        })
      })
    );

    const responses = await Promise.all(searchRequests);
    
    // All requests should be handled
    responses.forEach(response => {
      expect([200, 408, 503]).toContain(response.status);
    });
  });

  it('should handle search timeout with different similarity thresholds', async () => {
    // Test different similarity thresholds with timeout
    const thresholds = [0.3, 0.5, 0.7, 0.9];
    
    for (const threshold of thresholds) {
      const searchData = {
        query: 'similarity threshold test',
        filters: {
          date_range: {
            from: '2024-01-01',
            to: '2024-12-31'
          }
        },
        similarity_threshold: threshold,
        timeout_ms: 100
      };

      const response = await server.request('/api/intelligence-reports/search', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer similarity-threshold-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    }
  });

  it('should handle search timeout with bilingual content', async () => {
    // Create bilingual test reports
    const testReports = [
      {
        title: 'English Search Report',
        title_ar: 'تقرير البحث الإنجليزي',
        content: 'English content for search testing',
        content_ar: 'محتوى إنجليزي لاختبار البحث',
        data_sources: ['bilingual-source'],
        confidence_score: 85
      },
      {
        title: 'Arabic Search Report',
        title_ar: 'تقرير البحث العربي',
        content: 'Arabic content for search testing',
        content_ar: 'محتوى عربي لاختبار البحث',
        data_sources: ['bilingual-source'],
        confidence_score: 90
      }
    ];

    for (const reportData of testReports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer bilingual-search-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
    }

    // Search in Arabic with timeout
    const searchData = {
      query: 'تقرير البحث',
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        }
      },
      similarity_threshold: 0.7,
      timeout_ms: 100
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-search-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should handle search timeout with geospatial filters', async () => {
    // Create reports with geospatial tags
    const testReports = [
      {
        title: 'Riyadh Report',
        content: 'Report about Riyadh',
        data_sources: ['riyadh-source'],
        confidence_score: 85,
        geospatial_tags: [
          {
            latitude: 24.7136,
            longitude: 46.6753,
            location_name: 'Riyadh',
            location_name_ar: 'الرياض',
            location_type: 'city'
          }
        ]
      },
      {
        title: 'Jeddah Report',
        content: 'Report about Jeddah',
        data_sources: ['jeddah-source'],
        confidence_score: 80,
        geospatial_tags: [
          {
            latitude: 21.4858,
            longitude: 39.1925,
            location_name: 'Jeddah',
            location_name_ar: 'جدة',
            location_type: 'city'
          }
        ]
      }
    ];

    for (const reportData of testReports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer geospatial-search-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
    }

    // Search with geospatial filters and timeout
    const searchData = {
      query: 'city report',
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        custom_tags: ['geospatial']
      },
      similarity_threshold: 0.6,
      timeout_ms: 100
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer geospatial-search-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should handle search timeout with threat indicators', async () => {
    // Create reports with threat indicators
    const testReports = [
      {
        title: 'High Threat Report',
        content: 'Report about high threat',
        data_sources: ['threat-source'],
        confidence_score: 95,
        threat_indicators: [
          {
            indicator_type: 'malware',
            severity: 'high',
            description: 'High severity malware detected',
            confidence: 90
          }
        ]
      },
      {
        title: 'Medium Threat Report',
        content: 'Report about medium threat',
        data_sources: ['threat-source'],
        confidence_score: 75,
        threat_indicators: [
          {
            indicator_type: 'phishing',
            severity: 'medium',
            description: 'Medium severity phishing attempt',
            confidence: 70
          }
        ]
      }
    ];

    for (const reportData of testReports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer threat-search-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
    }

    // Search with threat filters and timeout
    const searchData = {
      query: 'threat report',
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        priority: ['high', 'medium']
      },
      similarity_threshold: 0.6,
      timeout_ms: 100
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer threat-search-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });
});
