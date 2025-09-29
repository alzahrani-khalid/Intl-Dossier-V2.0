import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('POST /api/validation/check', () => {
  beforeAll(async () => {
    // Setup test database connection if needed
  });

  afterAll(async () => {
    // Cleanup test database if needed
  });

  const validRequest = {
    componentName: 'Button',
    html: '<button class="btn btn-primary">Click me</button>',
    viewport: 768,
    theme: 'default',
    language: 'en'
  };

  it('should return 200 with validation results', async () => {
    const response = await request(app)
      .post('/api/validation/check')
      .send(validRequest)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('passed');
    expect(response.body).toHaveProperty('duration');
    expect(response.body).toHaveProperty('results');
    expect(typeof response.body.passed).toBe('boolean');
    expect(typeof response.body.duration).toBe('number');
    expect(Array.isArray(response.body.results)).toBe(true);
  });

  it('should validate within 500ms performance target', async () => {
    const response = await request(app)
      .post('/api/validation/check')
      .send(validRequest)
      .expect(200);

    expect(response.body.duration).toBeLessThan(500);
  });

  it('should validate required fields', async () => {
    const invalidRequest = {
      componentName: 'Button'
      // Missing html, viewport, theme, language
    };

    const response = await request(app)
      .post('/api/validation/check')
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('required');
  });

  it('should validate language enum values', async () => {
    const invalidRequest = {
      ...validRequest,
      language: 'invalid_lang'
    };

    const response = await request(app)
      .post('/api/validation/check')
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('language');
  });

  it('should validate viewport as number', async () => {
    const invalidRequest = {
      ...validRequest,
      viewport: 'not_a_number'
    };

    const response = await request(app)
      .post('/api/validation/check')
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('viewport');
  });

  it('should support Arabic language validation', async () => {
    const arabicRequest = {
      ...validRequest,
      language: 'ar',
      html: '<button class="btn btn-primary" dir="rtl">انقر هنا</button>'
    };

    const response = await request(app)
      .post('/api/validation/check')
      .send(arabicRequest)
      .expect(200);

    expect(response.body).toHaveProperty('passed');
    expect(response.body).toHaveProperty('results');
  });

  it('should return validation results with proper schema', async () => {
    const response = await request(app)
      .post('/api/validation/check')
      .send(validRequest)
      .expect(200);

    if (response.body.results.length > 0) {
      const result = response.body.results[0];
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('ruleId');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('message');
      expect(['error', 'warning', 'info']).toContain(result.severity);
    }
  });

  it('should validate different viewport sizes', async () => {
    const viewports = [320, 768, 1024, 1440];
    
    for (const viewport of viewports) {
      const request_data = {
        ...validRequest,
        viewport
      };

      const response = await request(app)
        .post('/api/validation/check')
        .send(request_data)
        .expect(200);

      expect(response.body).toHaveProperty('passed');
      expect(response.body.duration).toBeLessThan(500);
    }
  });
});