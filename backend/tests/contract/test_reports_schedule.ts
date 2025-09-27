import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: POST /api/reports/schedule', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should schedule daily report', async () => {
    // First create a template
    const templateData = {
      name: 'Daily Report Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '{{content}}',
      schedule_enabled: true,
      schedule_frequency: 'daily'
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

    // Schedule daily report
    const scheduleData = {
      template_id: templateId,
      frequency: 'daily',
      format: 'pdf'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('schedule_id');
    expect(data).toHaveProperty('next_run');
    expect(typeof data.schedule_id).toBe('string');
    expect(typeof data.next_run).toBe('string');
    
    // Verify next_run is a valid future date
    const nextRun = new Date(data.next_run);
    expect(nextRun).toBeInstanceOf(Date);
    expect(nextRun.getTime()).toBeGreaterThan(Date.now());
  });

  it('should schedule weekly report', async () => {
    // First create a template
    const templateData = {
      name: 'Weekly Report Template',
      report_type: 'analytical',
      supported_formats: ['excel'],
      template_content: '{{content}}',
      schedule_enabled: true,
      schedule_frequency: 'weekly'
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

    // Schedule weekly report
    const scheduleData = {
      template_id: templateId,
      frequency: 'weekly',
      format: 'excel'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('schedule_id');
    expect(data).toHaveProperty('next_run');
  });

  it('should schedule monthly report', async () => {
    // First create a template
    const templateData = {
      name: 'Monthly Report Template',
      report_type: 'compliance',
      supported_formats: ['csv'],
      template_content: '{{content}}',
      schedule_enabled: true,
      schedule_frequency: 'monthly'
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

    // Schedule monthly report
    const scheduleData = {
      template_id: templateId,
      frequency: 'monthly',
      format: 'csv'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('schedule_id');
    expect(data).toHaveProperty('next_run');
  });

  it('should schedule report with custom schedule_time', async () => {
    // First create a template
    const templateData = {
      name: 'Custom Schedule Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '{{content}}',
      schedule_enabled: true,
      schedule_frequency: 'daily'
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

    // Schedule with custom time (every day at 9:00 AM)
    const scheduleData = {
      template_id: templateId,
      frequency: 'daily',
      format: 'pdf',
      schedule_time: '0 9 * * *' // Cron expression
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('schedule_id');
    expect(data).toHaveProperty('next_run');
  });

  it('should schedule report with email recipients', async () => {
    // First create a template
    const templateData = {
      name: 'Email Report Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '{{content}}',
      schedule_enabled: true,
      schedule_frequency: 'weekly'
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

    // Schedule with email recipients
    const scheduleData = {
      template_id: templateId,
      frequency: 'weekly',
      format: 'pdf',
      email_recipients: [
        'admin@example.com',
        'manager@example.com'
      ]
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('schedule_id');
    expect(data).toHaveProperty('next_run');
  });

  it('should validate required fields', async () => {
    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });

  it('should validate template_id format', async () => {
    const scheduleData = {
      template_id: 'invalid-uuid',
      frequency: 'daily',
      format: 'pdf'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate frequency enum values', async () => {
    const scheduleData = {
      template_id: '00000000-0000-0000-0000-000000000000',
      frequency: 'invalid',
      format: 'pdf'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate format enum values', async () => {
    const scheduleData = {
      template_id: '00000000-0000-0000-0000-000000000000',
      frequency: 'daily',
      format: 'invalid'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate email format in recipients', async () => {
    const scheduleData = {
      template_id: '00000000-0000-0000-0000-000000000000',
      frequency: 'daily',
      format: 'pdf',
      email_recipients: [
        'valid@example.com',
        'invalid-email'
      ]
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent template', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const scheduleData = {
      template_id: nonExistentId,
      frequency: 'daily',
      format: 'pdf'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 for template that does not support scheduling', async () => {
    // First create a template without scheduling enabled
    const templateData = {
      name: 'Non-Schedulable Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '{{content}}',
      schedule_enabled: false
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

    // Try to schedule the template
    const scheduleData = {
      template_id: templateId,
      frequency: 'daily',
      format: 'pdf'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(400);
  });

  it('should return 400 for unsupported format', async () => {
    // First create a template that only supports PDF
    const templateData = {
      name: 'PDF Only Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '{{content}}',
      schedule_enabled: true,
      schedule_frequency: 'daily'
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

    // Try to schedule Excel report
    const scheduleData = {
      template_id: templateId,
      frequency: 'daily',
      format: 'excel'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate cron expression format', async () => {
    // First create a template
    const templateData = {
      name: 'Cron Test Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '{{content}}',
      schedule_enabled: true,
      schedule_frequency: 'daily'
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

    // Try to schedule with invalid cron expression
    const scheduleData = {
      template_id: templateId,
      frequency: 'daily',
      format: 'pdf',
      schedule_time: 'invalid-cron'
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(400);
  });

  it('should handle multiple email recipients', async () => {
    // First create a template
    const templateData = {
      name: 'Multi-Email Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '{{content}}',
      schedule_enabled: true,
      schedule_frequency: 'daily'
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

    // Schedule with multiple email recipients
    const scheduleData = {
      template_id: templateId,
      frequency: 'daily',
      format: 'pdf',
      email_recipients: [
        'admin@example.com',
        'manager@example.com',
        'analyst@example.com',
        'director@example.com'
      ]
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('schedule_id');
    expect(data).toHaveProperty('next_run');
  });

  it('should handle empty email recipients array', async () => {
    // First create a template
    const templateData = {
      name: 'No Email Template',
      report_type: 'executive',
      supported_formats: ['pdf'],
      template_content: '{{content}}',
      schedule_enabled: true,
      schedule_frequency: 'daily'
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

    // Schedule without email recipients
    const scheduleData = {
      template_id: templateId,
      frequency: 'daily',
      format: 'pdf',
      email_recipients: []
    };

    const response = await server.request('/api/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('schedule_id');
    expect(data).toHaveProperty('next_run');
  });
});
