import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/design/tokens', () => {
  beforeAll(async () => {
    // Setup test database connection if needed
  });

  afterAll(async () => {
    // Cleanup test database if needed
  });

  it('should return 200 with list of design tokens', async () => {
    const response = await request(app)
      .get('/api/design/tokens')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('tokens');
    expect(Array.isArray(response.body.tokens)).toBe(true);
  });

  it('should filter tokens by category when provided', async () => {
    const response = await request(app)
      .get('/api/design/tokens')
      .query({ category: 'color' })
      .expect(200);

    expect(response.body.tokens).toBeDefined();
    if (response.body.tokens.length > 0) {
      response.body.tokens.forEach((token: any) => {
        expect(token.category).toBe('color');
      });
    }
  });

  it('should filter tokens by theme when provided', async () => {
    const response = await request(app)
      .get('/api/design/tokens')
      .query({ theme: 'default' })
      .expect(200);

    expect(response.body.tokens).toBeDefined();
  });

  it('should validate category enum values', async () => {
    const response = await request(app)
      .get('/api/design/tokens')
      .query({ category: 'invalid_category' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return proper schema for design tokens', async () => {
    const response = await request(app)
      .get('/api/design/tokens')
      .expect(200);

    if (response.body.tokens.length > 0) {
      const token = response.body.tokens[0];
      expect(token).toHaveProperty('id');
      expect(token).toHaveProperty('category');
      expect(token).toHaveProperty('name');
      expect(token).toHaveProperty('value');
      expect(token).toHaveProperty('cssVariable');
      expect(['color', 'spacing', 'typography', 'border', 'shadow', 'animation']).toContain(token.category);
    }
  });
});