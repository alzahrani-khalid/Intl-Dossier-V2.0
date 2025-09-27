import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: GET /api/intelligence-reports/{id}', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return intelligence report by valid ID', async () => {
    // First create a report to get a valid ID
    const reportData = {
      title: 'Test Report for Get',
      content: 'Test content for retrieval',
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

    // Now get the report by ID
    const response = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.id).toBe(reportId);
    expect(data.title).toBe(reportData.title);
    expect(data.content).toBe(reportData.content);
    expect(data.data_sources).toEqual(reportData.data_sources);
    expect(data.confidence_score).toBe(reportData.confidence_score);
  });

  it('should return 404 for non-existent report ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    
    const response = await server.request(`/api/intelligence-reports/${nonExistentId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Resource not found');
  });

  it('should return 400 for invalid UUID format', async () => {
    const invalidId = 'invalid-uuid';
    
    const response = await server.request(`/api/intelligence-reports/${invalidId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(400);
  });

  it('should return complete report with all fields', async () => {
    const reportData = {
      title: 'Complete Test Report',
      title_ar: 'تقرير اختبار كامل',
      content: 'Complete test content',
      content_ar: 'محتوى اختبار كامل',
      data_sources: ['source1', 'source2'],
      confidence_score: 95,
      threat_indicators: [
        {
          indicator_type: 'phishing',
          severity: 'medium',
          description: 'Phishing attempt detected',
          description_ar: 'محاولة تصيد احتيالي مكتشفة',
          confidence: 80,
          source_reference: 'ref123'
        }
      ],
      geospatial_tags: [
        {
          latitude: 24.7136,
          longitude: 46.6753,
          location_name: 'Riyadh',
          location_name_ar: 'الرياض',
          location_type: 'city',
          radius_km: 50
        }
      ]
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

    const response = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.id).toBe(reportId);
    expect(data.title).toBe(reportData.title);
    expect(data.title_ar).toBe(reportData.title_ar);
    expect(data.content).toBe(reportData.content);
    expect(data.content_ar).toBe(reportData.content_ar);
    expect(data.data_sources).toEqual(reportData.data_sources);
    expect(data.confidence_score).toBe(reportData.confidence_score);
    expect(data.threat_indicators).toHaveLength(1);
    expect(data.geospatial_tags).toHaveLength(1);
    expect(data.review_status).toBe('draft');
    expect(data.embedding_status).toBe('pending');
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('retention_until');
  });

  it('should handle special characters in report content', async () => {
    const reportData = {
      title: 'Report with Special Characters',
      content: 'Content with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
      data_sources: ['source1']
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

    const response = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.content).toBe(reportData.content);
  });

  it('should return proper timestamps', async () => {
    const reportData = {
      title: 'Timestamp Test Report',
      content: 'Testing timestamp fields',
      data_sources: ['source1']
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

    const response = await server.request(`/api/intelligence-reports/${reportId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('retention_until');
    
    // Verify created_at is a valid ISO date
    expect(new Date(data.created_at)).toBeInstanceOf(Date);
    expect(new Date(data.retention_until)).toBeInstanceOf(Date);
    
    // Verify retention_until is 7 years from created_at
    const createdAt = new Date(data.created_at);
    const retentionUntil = new Date(data.retention_until);
    const sevenYearsInMs = 7 * 365 * 24 * 60 * 60 * 1000;
    const timeDiff = retentionUntil.getTime() - createdAt.getTime();
    expect(timeDiff).toBeCloseTo(sevenYearsInMs, -2); // Allow 100ms tolerance
  });
});
