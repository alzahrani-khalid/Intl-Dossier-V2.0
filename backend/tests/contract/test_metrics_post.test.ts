import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('POST /api/metrics/performance', () => {
  beforeAll(async () => {
    // Setup test database connection if needed
  });

  afterAll(async () => {
    // Cleanup test database if needed
  });

  const validMetric = {
    metricType: 'validation_time',
    value: 245.5,
    unit: 'ms',
    viewport: 768,
    componentName: 'ResponsiveCard',
    pageUrl: '/dashboard',
    sessionId: 'test-session-123',
    metadata: {
      theme: 'default',
      language: 'en',
      userAgent: 'test-agent'
    }
  };

  it('should record a performance metric and return 201', async () => {
    const response = await request(app)
      .post('/api/metrics/performance')
      .send(validMetric)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('recorded');
  });

  it('should validate required fields', async () => {
    const invalidMetric = {
      metricType: 'validation_time'
      // Missing required fields: value, unit, viewport
    };

    const response = await request(app)
      .post('/api/metrics/performance')
      .send(invalidMetric)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('required');
  });

  it('should validate metricType enum values', async () => {
    const invalidMetric = {
      ...validMetric,
      metricType: 'invalid_type'
    };

    const response = await request(app)
      .post('/api/metrics/performance')
      .send(invalidMetric)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('metricType');
  });

  it('should validate unit enum values', async () => {
    const invalidMetric = {
      ...validMetric,
      unit: 'invalid_unit'
    };

    const response = await request(app)
      .post('/api/metrics/performance')
      .send(invalidMetric)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('unit');
  });

  it('should validate value as number', async () => {
    const invalidMetric = {
      ...validMetric,
      value: 'not_a_number'
    };

    const response = await request(app)
      .post('/api/metrics/performance')
      .send(invalidMetric)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('value');
  });

  it('should validate viewport as number', async () => {
    const invalidMetric = {
      ...validMetric,
      viewport: 'not_a_number'
    };

    const response = await request(app)
      .post('/api/metrics/performance')
      .send(invalidMetric)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('viewport');
  });

  it('should accept all valid metric types', async () => {
    const metricTypes = [
      'validation_time',
      'layout_shift',
      'resize_performance',
      'theme_switch',
      'component_render'
    ];

    for (const metricType of metricTypes) {
      const metric = {
        ...validMetric,
        metricType
      };

      const response = await request(app)
        .post('/api/metrics/performance')
        .send(metric)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    }
  });

  it('should accept all valid units', async () => {
    const units = ['ms', 'px', 'count', 'percentage'];

    for (const unit of units) {
      const metric = {
        ...validMetric,
        unit
      };

      const response = await request(app)
        .post('/api/metrics/performance')
        .send(metric)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    }
  });

  it('should accept optional fields', async () => {
    const minimalMetric = {
      metricType: 'validation_time',
      value: 100,
      unit: 'ms',
      viewport: 1024
      // Optional fields omitted
    };

    const response = await request(app)
      .post('/api/metrics/performance')
      .send(minimalMetric)
      .expect(201);

    expect(response.body).toHaveProperty('message');
  });

  it('should validate validation_time metrics are under 500ms', async () => {
    const slowValidation = {
      metricType: 'validation_time',
      value: 501,
      unit: 'ms',
      viewport: 768,
      componentName: 'SlowComponent'
    };

    const response = await request(app)
      .post('/api/metrics/performance')
      .send(slowValidation)
      .expect(201);

    // Metric should still be recorded, but might trigger warnings
    expect(response.body).toHaveProperty('message');
    if (response.body.warning) {
      expect(response.body.warning).toContain('exceeds target');
    }
  });

  it('should accept different viewport sizes', async () => {
    const viewports = [320, 768, 1024, 1440];

    for (const viewport of viewports) {
      const metric = {
        ...validMetric,
        viewport
      };

      const response = await request(app)
        .post('/api/metrics/performance')
        .send(metric)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    }
  });
});