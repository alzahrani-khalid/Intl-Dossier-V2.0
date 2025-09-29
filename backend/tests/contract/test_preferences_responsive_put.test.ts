import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('PUT /api/preferences/responsive', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test authentication token
    authToken = 'Bearer test-jwt-token';
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });

  const validPreferences = {
    viewportPreference: {
      preferredView: 'desktop',
      forceViewport: false,
      zoomLevel: 1.0
    },
    themeId: 'default-theme',
    textSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    language: 'en',
    direction: 'ltr',
    componentDensity: 'normal'
  };

  it('should update preferences and return 200 when authenticated', async () => {
    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(validPreferences)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('updated');
  });

  it('should return 401 when no authentication token provided', async () => {
    const response = await request(app)
      .put('/api/preferences/responsive')
      .send(validPreferences)
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Unauthorized');
  });

  it('should validate viewport preference enum values', async () => {
    const invalidPreferences = {
      viewportPreference: {
        preferredView: 'invalid_view'
      }
    };

    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(invalidPreferences)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('preferredView');
  });

  it('should validate text size enum values', async () => {
    const invalidPreferences = {
      textSize: 'invalid_size'
    };

    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(invalidPreferences)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('textSize');
  });

  it('should validate language enum values', async () => {
    const invalidPreferences = {
      language: 'invalid_lang'
    };

    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(invalidPreferences)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('language');
  });

  it('should validate direction enum values', async () => {
    const invalidPreferences = {
      direction: 'invalid_dir'
    };

    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(invalidPreferences)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('direction');
  });

  it('should validate component density enum values', async () => {
    const invalidPreferences = {
      componentDensity: 'invalid_density'
    };

    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(invalidPreferences)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('componentDensity');
  });

  it('should accept partial updates', async () => {
    const partialUpdate = {
      textSize: 'large',
      reducedMotion: true
    };

    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(partialUpdate)
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('updated');
  });

  it('should validate boolean fields', async () => {
    const invalidBoolean = {
      reducedMotion: 'not_a_boolean'
    };

    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(invalidBoolean)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should validate zoom level as number', async () => {
    const invalidZoom = {
      viewportPreference: {
        preferredView: 'desktop',
        zoomLevel: 'not_a_number'
      }
    };

    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(invalidZoom)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('zoomLevel');
  });

  it('should support Arabic preferences', async () => {
    const arabicPreferences = {
      language: 'ar',
      direction: 'rtl',
      textSize: 'medium'
    };

    const response = await request(app)
      .put('/api/preferences/responsive')
      .set('Authorization', authToken)
      .send(arabicPreferences)
      .expect(200);

    expect(response.body).toHaveProperty('message');
  });
});