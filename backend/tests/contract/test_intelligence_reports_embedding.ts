import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: POST /api/intelligence-reports/{id}/embedding', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should generate embedding for valid report ID', async () => {
    // First create a report
    const reportData = {
      title: 'Test Report for Embedding',
      content: 'Test content for embedding generation',
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

    // Generate embedding
    const response = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    expect(response.status).toBe(202);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('message');
    expect(data.status).toBe('processing');
    expect(typeof data.message).toBe('string');
  });

  it('should return 404 for non-existent report ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    
    const response = await server.request(`/api/intelligence-reports/${nonExistentId}/embedding`, {
      method: 'POST',
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid UUID format', async () => {
    const invalidId = 'invalid-uuid';
    
    const response = await server.request(`/api/intelligence-reports/${invalidId}/embedding`, {
      method: 'POST',
    });

    expect(response.status).toBe(400);
  });

  it('should return 503 when vector service is unavailable', async () => {
    // This test simulates the fallback behavior when AnythingLLM is down
    // In a real scenario, we would mock the vector service to be unavailable
    
    const reportData = {
      title: 'Test Report for Fallback',
      content: 'Test content for fallback testing',
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

    // Simulate vector service unavailable
    // This test will initially fail as the fallback mechanism is not implemented
    const response = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    // Initially this will be 202, but should be 503 when fallback is implemented
    expect(response.status).toBe(503);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('message');
    expect(data.status).toBe('pending_embedding');
    expect(typeof data.message).toBe('string');
  });

  it('should handle embedding generation for bilingual content', async () => {
    const reportData = {
      title: 'Bilingual Test Report',
      title_ar: 'تقرير اختبار ثنائي اللغة',
      content: 'English content for embedding',
      content_ar: 'محتوى عربي للتضمين',
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

    const response = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    expect(response.status).toBe(202);
    
    const data = await response.json();
    expect(data.status).toBe('processing');
  });

  it('should handle embedding generation for report with threat indicators', async () => {
    const reportData = {
      title: 'Threat Report for Embedding',
      content: 'Threat analysis content',
      data_sources: ['source1'],
      threat_indicators: [
        {
          indicator_type: 'malware',
          severity: 'high',
          description: 'Malware detected in system',
          confidence: 90
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

    const response = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    expect(response.status).toBe(202);
    
    const data = await response.json();
    expect(data.status).toBe('processing');
  });

  it('should handle embedding generation for report with geospatial tags', async () => {
    const reportData = {
      title: 'Geographic Report for Embedding',
      content: 'Geographic analysis content',
      data_sources: ['source1'],
      geospatial_tags: [
        {
          latitude: 24.7136,
          longitude: 46.6753,
          location_name: 'Riyadh',
          location_type: 'city'
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

    const response = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    expect(response.status).toBe(202);
    
    const data = await response.json();
    expect(data.status).toBe('processing');
  });

  it('should not allow duplicate embedding generation for same report', async () => {
    const reportData = {
      title: 'Duplicate Embedding Test',
      content: 'Content for duplicate test',
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

    // First embedding generation
    const response1 = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    expect(response1.status).toBe(202);

    // Second embedding generation should be handled appropriately
    const response2 = await server.request(`/api/intelligence-reports/${reportId}/embedding`, {
      method: 'POST',
    });

    // This behavior depends on implementation - could be 202 (queued) or 409 (conflict)
    expect([202, 409]).toContain(response2.status);
  });
});
