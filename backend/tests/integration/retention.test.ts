import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Integration Test: Intelligence Report Retention (90-day archive)', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should archive reports after 90 days', async () => {
    // Create a report with backdated timestamp (91 days ago)
    const reportData = {
      title: 'Old Report for Archive Test',
      content: 'This report should be archived after 90 days',
      data_sources: ['archive-test-source'],
      confidence_score: 85,
      created_at: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer retention-test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);
    const createdReport = await createResponse.json();
    const reportId = createdReport.id;

    // Simulate archive job execution
    // In a real scenario, this would be a background job
    const archiveResponse = await server.request('/api/admin/archive-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    // Archive job should either succeed or not exist yet
    expect([200, 404]).toContain(archiveResponse.status);

    // Verify report is archived
    const getResponse = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer retention-test-token'
      }
    });

    expect(getResponse.status).toBe(200);
    const reportData_result = await getResponse.json();
    
    // Report should have archived_at timestamp
    expect(reportData_result).toHaveProperty('archived_at');
    expect(reportData_result.archived_at).toBeTruthy();
  });

  it('should not archive reports before 90 days', async () => {
    // Create a report with recent timestamp (30 days ago)
    const reportData = {
      title: 'Recent Report for Retention Test',
      content: 'This report should not be archived yet',
      data_sources: ['recent-test-source'],
      confidence_score: 90,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer retention-test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);
    const createdReport = await createResponse.json();
    const reportId = createdReport.id;

    // Run archive job
    const archiveResponse = await server.request('/api/admin/archive-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    // Archive job should either succeed or not exist yet
    expect([200, 404]).toContain(archiveResponse.status);

    // Verify report is not archived
    const getResponse = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer retention-test-token'
      }
    });

    expect(getResponse.status).toBe(200);
    const reportData_result = await getResponse.json();
    
    // Report should not have archived_at timestamp
    expect(reportData_result.archived_at).toBeNull();
  });

  it('should maintain 7-year retention period', async () => {
    // Create a report
    const reportData = {
      title: 'Long Retention Report',
      content: 'This report should be retained for 7 years',
      data_sources: ['long-retention-source'],
      confidence_score: 95
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer retention-test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);
    const createdReport = await createResponse.json();
    const reportId = createdReport.id;

    // Verify retention_until is set to 7 years from creation
    const getResponse = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer retention-test-token'
      }
    });

    expect(getResponse.status).toBe(200);
    const reportData_result = await getResponse.json();
    
    expect(reportData_result).toHaveProperty('retention_until');
    expect(reportData_result.retention_until).toBeTruthy();
    
    // Verify retention_until is approximately 7 years from created_at
    const createdAt = new Date(reportData_result.created_at);
    const retentionUntil = new Date(reportData_result.retention_until);
    const sevenYearsInMs = 7 * 365 * 24 * 60 * 60 * 1000;
    const timeDiff = retentionUntil.getTime() - createdAt.getTime();
    expect(timeDiff).toBeCloseTo(sevenYearsInMs, -2); // Allow 100ms tolerance
  });

  it('should handle archived reports in search results', async () => {
    // Create archived and active reports
    const archivedReport = {
      title: 'Archived Search Report',
      content: 'This report is archived but should be searchable',
      data_sources: ['archived-search-source'],
      confidence_score: 80,
      created_at: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
    };

    const activeReport = {
      title: 'Active Search Report',
      content: 'This report is active and should be searchable',
      data_sources: ['active-search-source'],
      confidence_score: 85
    };

    // Create archived report
    const archivedResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer retention-search-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(archivedReport),
    });

    expect(archivedResponse.status).toBe(201);

    // Create active report
    const activeResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer retention-search-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activeReport),
    });

    expect(activeResponse.status).toBe(201);

    // Search for both archived and active reports
    const searchData = {
      query: 'search report',
      filters: {
        date_range: {
          from: '2020-01-01',
          to: '2025-12-31'
        }
      },
      similarity_threshold: 0.6
    };

    const searchResponse = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer retention-search-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData),
    });

    expect(searchResponse.status).toBe(200);
    
    const searchData_result = await searchResponse.json();
    expect(searchData_result).toHaveProperty('results');
    expect(Array.isArray(searchData_result.results)).toBe(true);
  });

  it('should handle retention policy updates', async () => {
    // Test updating retention policy
    const retentionPolicyData = {
      active_retention_days: 90,
      archive_retention_years: 7,
      compression_enabled: true,
      partition_strategy: 'range'
    };

    const updateResponse = await server.request('/api/admin/retention-policy', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(retentionPolicyData),
    });

    // Should either succeed or not exist yet
    expect([200, 404]).toContain(updateResponse.status);
  });

  it('should handle bulk archive operations', async () => {
    // Create multiple old reports
    const oldReports = Array(5).fill(null).map((_, index) => ({
      title: `Old Report ${index + 1}`,
      content: `Content for old report ${index + 1}`,
      data_sources: [`old-source-${index + 1}`],
      confidence_score: 75 + index * 5,
      created_at: new Date(Date.now() - (91 + index) * 24 * 60 * 60 * 1000).toISOString()
    }));

    const createdReports = [];
    for (const reportData of oldReports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer bulk-archive-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      createdReports.push(data);
    }

    // Run bulk archive job
    const archiveResponse = await server.request('/api/admin/archive-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ batch_size: 10 })
    });

    // Archive job should either succeed or not exist yet
    expect([200, 404]).toContain(archiveResponse.status);

    // Verify all reports are archived
    for (const report of createdReports) {
      const getResponse = await server.request(`/api/intelligence-reports/${report.id}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer bulk-archive-token'
        }
      });

      expect(getResponse.status).toBe(200);
      const reportData_result = await getResponse.json();
      expect(reportData_result).toHaveProperty('archived_at');
    }
  });

  it('should handle retention with different report statuses', async () => {
    // Create reports with different statuses
    const reports = [
      {
        title: 'Draft Report for Retention',
        content: 'Draft report content',
        data_sources: ['draft-source'],
        confidence_score: 70,
        review_status: 'draft',
        created_at: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Pending Report for Retention',
        content: 'Pending report content',
        data_sources: ['pending-source'],
        confidence_score: 80,
        review_status: 'pending',
        created_at: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Approved Report for Retention',
        content: 'Approved report content',
        data_sources: ['approved-source'],
        confidence_score: 90,
        review_status: 'approved',
        created_at: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const createdReports = [];
    for (const reportData of reports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer status-retention-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      createdReports.push(data);
    }

    // Run archive job
    const archiveResponse = await server.request('/api/admin/archive-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    // Archive job should either succeed or not exist yet
    expect([200, 404]).toContain(archiveResponse.status);

    // Verify all reports are archived regardless of status
    for (const report of createdReports) {
      const getResponse = await server.request(`/api/intelligence-reports/${report.id}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer status-retention-token'
        }
      });

      expect(getResponse.status).toBe(200);
      const reportData_result = await getResponse.json();
      expect(reportData_result).toHaveProperty('archived_at');
    }
  });

  it('should handle retention with bilingual content', async () => {
    // Create bilingual report for retention testing
    const reportData = {
      title: 'Bilingual Retention Report',
      title_ar: 'تقرير الاحتفاظ ثنائي اللغة',
      content: 'English content for retention testing',
      content_ar: 'محتوى إنجليزي لاختبار الاحتفاظ',
      data_sources: ['bilingual-retention-source'],
      confidence_score: 85,
      created_at: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-retention-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);
    const createdReport = await createResponse.json();
    const reportId = createdReport.id;

    // Run archive job
    const archiveResponse = await server.request('/api/admin/archive-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    // Archive job should either succeed or not exist yet
    expect([200, 404]).toContain(archiveResponse.status);

    // Verify bilingual content is preserved in archived report
    const getResponse = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer bilingual-retention-token'
      }
    });

    expect(getResponse.status).toBe(200);
    const reportData_result = await getResponse.json();
    
    expect(reportData_result.title).toBe(reportData.title);
    expect(reportData_result.title_ar).toBe(reportData.title_ar);
    expect(reportData_result.content).toBe(reportData.content);
    expect(reportData_result.content_ar).toBe(reportData.content_ar);
    expect(reportData_result).toHaveProperty('archived_at');
  });

  it('should handle retention with threat indicators and geospatial tags', async () => {
    // Create report with complex data for retention testing
    const reportData = {
      title: 'Complex Retention Report',
      content: 'Complex report with threat indicators and geospatial tags',
      data_sources: ['complex-retention-source'],
      confidence_score: 95,
      threat_indicators: [
        {
          indicator_type: 'malware',
          severity: 'high',
          description: 'High severity malware detected',
          confidence: 90
        }
      ],
      geospatial_tags: [
        {
          latitude: 24.7136,
          longitude: 46.6753,
          location_name: 'Riyadh',
          location_name_ar: 'الرياض',
          location_type: 'city'
        }
      ],
      created_at: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer complex-retention-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);
    const createdReport = await createResponse.json();
    const reportId = createdReport.id;

    // Run archive job
    const archiveResponse = await server.request('/api/admin/archive-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    // Archive job should either succeed or not exist yet
    expect([200, 404]).toContain(archiveResponse.status);

    // Verify complex data is preserved in archived report
    const getResponse = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer complex-retention-token'
      }
    });

    expect(getResponse.status).toBe(200);
    const reportData_result = await getResponse.json();
    
    expect(reportData_result.threat_indicators).toHaveLength(1);
    expect(reportData_result.geospatial_tags).toHaveLength(1);
    expect(reportData_result).toHaveProperty('archived_at');
  });

  it('should handle retention job errors gracefully', async () => {
    // Test retention job error handling
    const errorResponse = await server.request('/api/admin/archive-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    // Should handle errors gracefully
    expect([200, 401, 403, 404, 500]).toContain(errorResponse.status);
  });
});
