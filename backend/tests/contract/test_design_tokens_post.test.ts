import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('POST /api/design/tokens', () => {
  beforeAll(async () => {
    // Setup test database connection if needed
  });

  afterAll(async () => {
    // Cleanup test database if needed
  });

  const validToken = {
    id: 'color-primary-500',
    category: 'color',
    name: 'Primary 500',
    value: '#3B82F6',
    cssVariable: '--color-primary-500',
    fallback: '#0000FF',
    description: 'Primary brand color'
  };

  it('should create a new design token and return 201', async () => {
    const response = await request(app)
      .post('/api/design/tokens')
      .send(validToken)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('created');
  });

  it('should update an existing design token and return 200', async () => {
    // First create
    await request(app)
      .post('/api/design/tokens')
      .send(validToken)
      .expect(201);

    // Then update
    const updatedToken = { ...validToken, value: '#2563EB' };
    const response = await request(app)
      .post('/api/design/tokens')
      .send(updatedToken)
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('updated');
  });

  it('should validate required fields', async () => {
    const invalidToken = {
      category: 'color',
      name: 'Test'
      // Missing required fields: id, value, cssVariable
    };

    const response = await request(app)
      .post('/api/design/tokens')
      .send(invalidToken)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('required');
  });

  it('should validate category enum values', async () => {
    const invalidToken = {
      ...validToken,
      category: 'invalid_category'
    };

    const response = await request(app)
      .post('/api/design/tokens')
      .send(invalidToken)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('category');
  });

  it('should accept optional deprecated field', async () => {
    const tokenWithDeprecated = {
      ...validToken,
      deprecated: true
    };

    const response = await request(app)
      .post('/api/design/tokens')
      .send(tokenWithDeprecated)
      .expect(201);

    expect(response.body).toHaveProperty('message');
  });

  it('should validate CSS variable format', async () => {
    const invalidCssVar = {
      ...validToken,
      cssVariable: 'invalid-css-var' // Should start with --
    };

    const response = await request(app)
      .post('/api/design/tokens')
      .send(invalidCssVar)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('CSS variable');
  });
});