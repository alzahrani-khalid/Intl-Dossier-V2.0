import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: POST /api/reports/generate', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should generate PDF report', async () => {
    // First create a template
    const templateData = {
      name: 'Test PDF Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '<h1>{{title}}</h1><p>{{content}}</p>'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate PDF report
    const generateData = {
      template_id: templateId,
      format: 'pdf'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
  });

  it('should generate Excel report', async () => {
    // First create a template
    const templateData = {
      name: 'Test Excel Template',
      report_type: 'analytical',
      supported_formats: ['excel'],
      template_content: '{{data}}'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate Excel report
    const generateData = {
      template_id: templateId,
      format: 'excel'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('should generate CSV report', async () => {
    // First create a template
    const templateData = {
      name: 'Test CSV Template',
      report_type: 'compliance',
      supported_formats: ['csv'],
      template_content: '{{data}}'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate CSV report
    const generateData = {
      template_id: templateId,
      format: 'csv'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
  });

  it('should generate JSON report', async () => {
    // First create a template
    const templateData = {
      name: 'Test JSON Template',
      report_type: 'executive',
      supported_formats: ['json'],
      template_content: '{{data}}'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate JSON report
    const generateData = {
      template_id: templateId,
      format: 'json'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    
    const data = await response.json();
    expect(typeof data).toBe('object');
  });

  it('should generate report with filters', async () => {
    // First create a template
    const templateData = {
      name: 'Test Filtered Template',
      report_type: 'analytical',
      supported_formats: ['json'],
      template_content: '{{data}}'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate report with filters
    const generateData = {
      template_id: templateId,
      format: 'json',
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        entities: ['dossier', 'organization'],
        status: ['approved'],
        priority: ['high']
      }
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
  });

  it('should generate report in Arabic language', async () => {
    // First create a bilingual template
    const templateData = {
      name: 'Bilingual Template',
      name_ar: 'قالب ثنائي اللغة',
      report_type: 'executive',
      supported_formats: ['json'],
      template_content: '{{content}}',
      template_content_ar: '{{content_ar}}'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate report in Arabic
    const generateData = {
      template_id: templateId,
      format: 'json',
      language: 'ar'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
  });

  it('should use default language when not specified', async () => {
    // First create a template
    const templateData = {
      name: 'Default Language Template',
      report_type: 'executive',
      supported_formats: ['json'],
      template_content: '{{content}}'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate report without language specified
    const generateData = {
      template_id: templateId,
      format: 'json'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
  });

  it('should validate required fields', async () => {
    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });

  it('should validate template_id format', async () => {
    const generateData = {
      template_id: 'invalid-uuid',
      format: 'pdf'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate format enum values', async () => {
    const generateData = {
      template_id: '00000000-0000-0000-0000-000000000000',
      format: 'invalid'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate language enum values', async () => {
    const generateData = {
      template_id: '00000000-0000-0000-0000-000000000000',
      format: 'json',
      language: 'invalid'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent template', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const generateData = {
      template_id: nonExistentId,
      format: 'pdf'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 for unsupported format', async () => {
    // First create a template that only supports PDF
    const templateData = {
      name: 'PDF Only Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '{{content}}'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Try to generate Excel report
    const generateData = {
      template_id: templateId,
      format: 'excel'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(400);
  });

  it('should return 429 when rate limit exceeded', async () => {
    // This test will fail initially as rate limiting is not implemented
    const generateData = {
      template_id: '00000000-0000-0000-0000-000000000000',
      format: 'pdf'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    // Initially this will be 404, but should be 429 when rate limiting is implemented
    expect(response.status).toBe(429);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('retry_after');
  });

  it('should handle large report generation', async () => {
    // First create a template
    const templateData = {
      name: 'Large Report Template',
      report_type: 'analytical',
      supported_formats: ['json'],
      template_content: '{{large_data}}'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate large report
    const generateData = {
      template_id: templateId,
      format: 'json',
      filters: {
        date_range: {
          from: '2020-01-01',
          to: '2025-12-31'
        },
        entities: ['dossier', 'organization', 'country', 'project']
      }
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    // Should either succeed or fail gracefully
    expect([200, 400, 500]).toContain(response.status);
  });
});
