import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: POST /api/intelligence-reports', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should create intelligence report with required fields', async () => {
    const reportData = {
      title: 'Test Intelligence Report',
      content: 'This is test intelligence content',
      data_sources: ['source1', 'source2'],
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
    expect(data).toHaveProperty('id');
    expect(data.title).toBe(reportData.title);
    expect(data.content).toBe(reportData.content);
    expect(data.data_sources).toEqual(reportData.data_sources);
    expect(data.confidence_score).toBe(reportData.confidence_score);
    expect(data.review_status).toBe('draft');
    expect(data.embedding_status).toBe('pending');
  });

  it('should create bilingual intelligence report', async () => {
    const reportData = {
      title: 'Security Report',
      title_ar: 'تقرير الأمن',
      content: 'Security analysis content',
      content_ar: 'محتوى تحليل الأمن',
      data_sources: ['source1'],
      confidence_score: 90
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
    expect(data.title).toBe(reportData.title);
    expect(data.title_ar).toBe(reportData.title_ar);
    expect(data.content).toBe(reportData.content);
    expect(data.content_ar).toBe(reportData.content_ar);
  });

  it('should create report with threat indicators', async () => {
    const reportData = {
      title: 'Threat Assessment Report',
      content: 'Threat analysis content',
      data_sources: ['source1'],
      threat_indicators: [
        {
          indicator_type: 'malware',
          severity: 'high',
          description: 'Suspicious malware detected',
          confidence: 85
        }
      ]
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
    expect(data.threat_indicators).toHaveLength(1);
    expect(data.threat_indicators[0].indicator_type).toBe('malware');
    expect(data.threat_indicators[0].severity).toBe('high');
  });

  it('should create report with geospatial tags', async () => {
    const reportData = {
      title: 'Geographic Intelligence Report',
      content: 'Location-based analysis',
      data_sources: ['source1'],
      geospatial_tags: [
        {
          latitude: 24.7136,
          longitude: 46.6753,
          location_name: 'Riyadh',
          location_name_ar: 'الرياض',
          location_type: 'city'
        }
      ]
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
    expect(data.geospatial_tags).toHaveLength(1);
    expect(data.geospatial_tags[0].latitude).toBe(24.7136);
    expect(data.geospatial_tags[0].location_name).toBe('Riyadh');
  });

  it('should validate required fields', async () => {
    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('details');
  });

  it('should validate confidence_score range', async () => {
    const reportData = {
      title: 'Test Report',
      content: 'Test content',
      data_sources: ['source1'],
      confidence_score: 150 // Invalid: should be 0-100
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate data_sources minimum length', async () => {
    const reportData = {
      title: 'Test Report',
      content: 'Test content',
      data_sources: [] // Invalid: should have at least 1 source
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(400);
  });

  it('should return 429 when rate limit exceeded', async () => {
    // This test will fail initially as rate limiting is not implemented
    const reportData = {
      title: 'Test Report',
      content: 'Test content',
      data_sources: ['source1']
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    // Initially this will be 201, but should be 429 when rate limiting is implemented
    expect(response.status).toBe(429);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('retry_after');
  });
});
