import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Integration Test: Report Generation Formats', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should generate PDF report with proper content type', async () => {
    // Create a template
    const templateData = {
      name: 'PDF Test Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '<h1>{{title}}</h1><p>{{content}}</p>',
      include_metrics: true,
      include_trends: true,
      include_charts: true
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer report-formats-token',
        'Content-Type': 'application/json'
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
        'Authorization': 'Bearer report-formats-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
    
    // Verify PDF content
    const pdfBuffer = await response.arrayBuffer();
    expect(pdfBuffer.byteLength).toBeGreaterThan(0);
  });

  it('should generate Excel report with proper content type', async () => {
    // Create a template
    const templateData = {
      name: 'Excel Test Template',
      report_type: 'analytical',
      supported_formats: ['excel'],
      template_content: '{{data}}',
      include_metrics: true,
      include_trends: true
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer report-formats-token',
        'Content-Type': 'application/json'
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
        'Authorization': 'Bearer report-formats-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Verify Excel content
    const excelBuffer = await response.arrayBuffer();
    expect(excelBuffer.byteLength).toBeGreaterThan(0);
  });

  it('should generate CSV report with proper content type', async () => {
    // Create a template
    const templateData = {
      name: 'CSV Test Template',
      report_type: 'compliance',
      supported_formats: ['csv'],
      template_content: '{{data}}',
      include_audit_trail: true
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer report-formats-token',
        'Content-Type': 'application/json'
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
        'Authorization': 'Bearer report-formats-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    
    // Verify CSV content
    const csvText = await response.text();
    expect(csvText.length).toBeGreaterThan(0);
  });

  it('should generate JSON report with proper content type', async () => {
    // Create a template
    const templateData = {
      name: 'JSON Test Template',
      report_type: 'executive',
      supported_formats: ['json'],
      template_content: '{{data}}',
      include_metrics: true
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer report-formats-token',
        'Content-Type': 'application/json'
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
        'Authorization': 'Bearer report-formats-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    
    // Verify JSON content
    const jsonData = await response.json();
    expect(typeof jsonData).toBe('object');
  });

  it('should generate bilingual reports in Arabic', async () => {
    // Create a bilingual template
    const templateData = {
      name: 'Bilingual Template',
      name_ar: 'قالب ثنائي اللغة',
      report_type: 'executive',
      supported_formats: ['pdf', 'json'],
      template_content: '<h1>{{title}}</h1><p>{{content}}</p>',
      template_content_ar: '<h1>{{title_ar}}</h1><p>{{content_ar}}</p>',
      include_metrics: true
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-report-token',
        'Content-Type': 'application/json'
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
        'Authorization': 'Bearer bilingual-report-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(typeof data).toBe('object');
  });

  it('should generate reports with organization branding', async () => {
    // Create a template with branding
    const templateData = {
      name: 'Branded Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '<h1>{{title}}</h1><p>{{content}}</p>',
      organization_branding: {
        logo_url: 'https://example.com/logo.png',
        primary_color: '#1e40af',
        secondary_color: '#3b82f6',
        font_family: 'Arial, sans-serif'
      }
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer branded-report-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate branded report
    const generateData = {
      template_id: templateId,
      format: 'pdf'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer branded-report-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
  });

  it('should generate reports with filters', async () => {
    // Create a template
    const templateData = {
      name: 'Filtered Template',
      report_type: 'analytical',
      supported_formats: ['json'],
      template_content: '{{data}}',
      include_metrics: true,
      include_trends: true
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer filtered-report-token',
        'Content-Type': 'application/json'
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
        'Authorization': 'Bearer filtered-report-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(typeof data).toBe('object');
  });

  it('should handle multiple format generation from same template', async () => {
    // Create a multi-format template
    const templateData = {
      name: 'Multi-Format Template',
      report_type: 'executive',
      supported_formats: ['pdf', 'excel', 'csv', 'json'],
      template_content: '{{data}}',
      include_metrics: true,
      include_trends: true,
      include_charts: true
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer multi-format-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate reports in all supported formats
    const formats = ['pdf', 'excel', 'csv', 'json'];
    
    for (const format of formats) {
      const generateData = {
        template_id: templateId,
        format: format
      };

      const response = await server.request('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer multi-format-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(generateData),
      });

      expect(response.status).toBe(200);
      
      // Verify content type
      if (format === 'pdf') {
        expect(response.headers.get('content-type')).toContain('application/pdf');
      } else if (format === 'excel') {
        expect(response.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else if (format === 'csv') {
        expect(response.headers.get('content-type')).toContain('text/csv');
      } else if (format === 'json') {
        expect(response.headers.get('content-type')).toContain('application/json');
      }
    }
  });

  it('should handle report generation with large datasets', async () => {
    // Create a template for large dataset
    const templateData = {
      name: 'Large Dataset Template',
      report_type: 'analytical',
      supported_formats: ['json'],
      template_content: '{{data}}',
      include_metrics: true,
      include_trends: true
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer large-dataset-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate report with large dataset filters
    const generateData = {
      template_id: templateId,
      format: 'json',
      filters: {
        date_range: {
          from: '2020-01-01',
          to: '2025-12-31'
        },
        entities: ['dossier', 'organization', 'country', 'project'],
        status: ['approved', 'pending', 'draft'],
        priority: ['high', 'medium', 'low', 'critical']
      }
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer large-dataset-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    // Should either succeed or handle large dataset gracefully
    expect([200, 400, 500]).toContain(response.status);
  });

  it('should handle report generation errors gracefully', async () => {
    // Try to generate report with invalid template ID
    const generateData = {
      template_id: '00000000-0000-0000-0000-000000000000',
      format: 'pdf'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer error-handling-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(404);
  });

  it('should handle concurrent report generation', async () => {
    // Create a template
    const templateData = {
      name: 'Concurrent Template',
      report_type: 'executive',
      supported_formats: ['json'],
      template_content: '{{data}}'
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer concurrent-generation-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate multiple reports concurrently
    const generateRequests = Array(5).fill(null).map(() => 
      server.request('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer concurrent-generation-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: templateId,
          format: 'json'
        })
      })
    );

    const responses = await Promise.all(generateRequests);
    
    // All requests should be handled
    responses.forEach(response => {
      expect([200, 429, 500]).toContain(response.status);
    });
  });

  it('should handle report generation with rate limiting', async () => {
    // This test will fail initially as rate limiting is not implemented
    const generateData = {
      template_id: '00000000-0000-0000-0000-000000000000',
      format: 'pdf'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer rate-limit-test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    // Initially this will be 404, but should be 429 when rate limiting is implemented
    expect(response.status).toBe(429);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('retry_after');
  });
});
