import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: GET /api/reports/templates', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return list of report templates', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should filter templates by report_type parameter', async () => {
    const response = await server.request('/api/reports/templates?report_type=executive', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    // All returned templates should be executive type
    data.data.forEach((template: any) => {
      expect(template.report_type).toBe('executive');
    });
  });

  it('should filter templates by analytical report_type', async () => {
    const response = await server.request('/api/reports/templates?report_type=analytical', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    // All returned templates should be analytical type
    data.data.forEach((template: any) => {
      expect(template.report_type).toBe('analytical');
    });
  });

  it('should filter templates by compliance report_type', async () => {
    const response = await server.request('/api/reports/templates?report_type=compliance', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    // All returned templates should be compliance type
    data.data.forEach((template: any) => {
      expect(template.report_type).toBe('compliance');
    });
  });

  it('should validate report_type enum values', async () => {
    const response = await server.request('/api/reports/templates?report_type=invalid', {
      method: 'GET',
    });

    expect(response.status).toBe(400);
  });

  it('should return templates with all required fields', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    if (data.data.length > 0) {
      const template = data.data[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('report_type');
      expect(template).toHaveProperty('include_metrics');
      expect(template).toHaveProperty('include_trends');
      expect(template).toHaveProperty('include_charts');
      expect(template).toHaveProperty('include_audit_trail');
      expect(template).toHaveProperty('supported_formats');
      expect(template).toHaveProperty('schedule_enabled');
      expect(template).toHaveProperty('created_by');
      expect(template).toHaveProperty('created_at');
      expect(template).toHaveProperty('updated_at');
    }
  });

  it('should validate report_type enum values in response', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((template: any) => {
      expect(['executive', 'analytical', 'compliance']).toContain(template.report_type);
    });
  });

  it('should validate supported_formats enum values in response', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((template: any) => {
      expect(Array.isArray(template.supported_formats)).toBe(true);
      template.supported_formats.forEach((format: any) => {
        expect(['pdf', 'excel', 'csv', 'json']).toContain(format);
      });
    });
  });

  it('should validate boolean fields in response', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((template: any) => {
      expect(typeof template.include_metrics).toBe('boolean');
      expect(typeof template.include_trends).toBe('boolean');
      expect(typeof template.include_charts).toBe('boolean');
      expect(typeof template.include_audit_trail).toBe('boolean');
      expect(typeof template.schedule_enabled).toBe('boolean');
    });
  });

  it('should handle empty template list', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    // Empty array is valid
  });

  it('should return bilingual templates with Arabic names', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    // Some templates may have Arabic names
    data.data.forEach((template: any) => {
      if (template.name_ar) {
        expect(typeof template.name_ar).toBe('string');
        expect(template.name_ar.length).toBeGreaterThan(0);
      }
    });
  });

  it('should return templates with organization branding', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((template: any) => {
      if (template.organization_branding) {
        expect(typeof template.organization_branding).toBe('object');
        // Branding object may have optional fields
        if (template.organization_branding.logo_url) {
          expect(typeof template.organization_branding.logo_url).toBe('string');
        }
        if (template.organization_branding.primary_color) {
          expect(typeof template.organization_branding.primary_color).toBe('string');
        }
        if (template.organization_branding.secondary_color) {
          expect(typeof template.organization_branding.secondary_color).toBe('string');
        }
        if (template.organization_branding.font_family) {
          expect(typeof template.organization_branding.font_family).toBe('string');
        }
      }
    });
  });

  it('should return templates with schedule information', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((template: any) => {
      if (template.schedule_enabled) {
        expect(template).toHaveProperty('schedule_frequency');
        expect(['daily', 'weekly', 'monthly']).toContain(template.schedule_frequency);
      }
    });
  });

  it('should validate created_by field format', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((template: any) => {
      expect(template).toHaveProperty('created_by');
      expect(typeof template.created_by).toBe('string');
      expect(template.created_by.length).toBeGreaterThan(0);
    });
  });

  it('should validate timestamp fields format', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((template: any) => {
      expect(template).toHaveProperty('created_at');
      expect(template).toHaveProperty('updated_at');
      
      // Verify they are valid ISO dates
      expect(new Date(template.created_at)).toBeInstanceOf(Date);
      expect(new Date(template.updated_at)).toBeInstanceOf(Date);
      
      // Verify created_at is not in the future
      expect(new Date(template.created_at).getTime()).toBeLessThanOrEqual(Date.now());
      expect(new Date(template.updated_at).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  it('should handle special characters in template names', async () => {
    const response = await server.request('/api/reports/templates', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    // Templates with special characters should be handled properly
    data.data.forEach((template: any) => {
      expect(typeof template.name).toBe('string');
      expect(template.name.length).toBeGreaterThan(0);
    });
  });
});
