import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/components/registry', () => {
  beforeAll(async () => {
    // Setup test database connection if needed
  });

  afterAll(async () => {
    // Cleanup test database if needed
  });

  it('should return 200 with list of registered components', async () => {
    const response = await request(app)
      .get('/api/components/registry')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('components');
    expect(Array.isArray(response.body.components)).toBe(true);
  });

  it('should filter components by category when provided', async () => {
    const response = await request(app)
      .get('/api/components/registry')
      .query({ category: 'form' })
      .expect(200);

    expect(response.body.components).toBeDefined();
    if (response.body.components.length > 0) {
      response.body.components.forEach((component: any) => {
        expect(component.category).toBe('form');
      });
    }
  });

  it('should filter components by source when provided', async () => {
    const response = await request(app)
      .get('/api/components/registry')
      .query({ source: 'shadcn' })
      .expect(200);

    expect(response.body.components).toBeDefined();
    if (response.body.components.length > 0) {
      response.body.components.forEach((component: any) => {
        expect(component.source).toBe('shadcn');
      });
    }
  });

  it('should validate category enum values', async () => {
    const response = await request(app)
      .get('/api/components/registry')
      .query({ category: 'invalid_category' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('category');
  });

  it('should validate source enum values', async () => {
    const response = await request(app)
      .get('/api/components/registry')
      .query({ source: 'invalid_source' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('source');
  });

  it('should return proper schema for component registry', async () => {
    const response = await request(app)
      .get('/api/components/registry')
      .expect(200);

    if (response.body.components.length > 0) {
      const component = response.body.components[0];
      expect(component).toHaveProperty('name');
      expect(component).toHaveProperty('version');
      expect(component).toHaveProperty('source');
      expect(component).toHaveProperty('category');
      expect(component).toHaveProperty('path');
      expect(['shadcn', 'custom']).toContain(component.source);
      expect(['layout', 'form', 'display', 'feedback', 'navigation', 'overlay']).toContain(component.category);
    }
  });

  it('should support combined filters', async () => {
    const response = await request(app)
      .get('/api/components/registry')
      .query({ 
        category: 'form',
        source: 'shadcn' 
      })
      .expect(200);

    expect(response.body.components).toBeDefined();
    if (response.body.components.length > 0) {
      response.body.components.forEach((component: any) => {
        expect(component.category).toBe('form');
        expect(component.source).toBe('shadcn');
      });
    }
  });
});