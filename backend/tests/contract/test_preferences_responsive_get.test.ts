import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/preferences/responsive', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test authentication token
    // In a real scenario, this would be obtained from a test auth endpoint
    authToken = 'Bearer test-jwt-token';
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });

  it('should return 200 with user responsive preferences when authenticated', async () => {
    const response = await request(app)
      .get('/api/preferences/responsive')
      .set('Authorization', authToken)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toBeDefined();
    // Check for optional fields as preferences might be empty initially
    if (response.body.viewportPreference) {
      expect(response.body.viewportPreference).toHaveProperty('preferredView');
    }
  });

  it('should return 401 when no authentication token provided', async () => {
    const response = await request(app)
      .get('/api/preferences/responsive')
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Unauthorized');
  });

  it('should return 401 with invalid authentication token', async () => {
    const response = await request(app)
      .get('/api/preferences/responsive')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Unauthorized');
  });

  it('should return proper schema for user preferences', async () => {
    const response = await request(app)
      .get('/api/preferences/responsive')
      .set('Authorization', authToken)
      .expect(200);

    const preferences = response.body;
    
    // Check optional fields structure if they exist
    if (preferences.viewportPreference) {
      expect(['mobile', 'tablet', 'desktop', 'auto']).toContain(
        preferences.viewportPreference.preferredView || 'auto'
      );
      if (preferences.viewportPreference.zoomLevel !== undefined) {
        expect(typeof preferences.viewportPreference.zoomLevel).toBe('number');
      }
    }

    if (preferences.textSize) {
      expect(['small', 'medium', 'large', 'extra-large']).toContain(preferences.textSize);
    }

    if (preferences.language) {
      expect(['ar', 'en']).toContain(preferences.language);
    }

    if (preferences.direction) {
      expect(['rtl', 'ltr', 'auto']).toContain(preferences.direction);
    }

    if (preferences.componentDensity) {
      expect(['compact', 'normal', 'comfortable']).toContain(preferences.componentDensity);
    }

    if (preferences.reducedMotion !== undefined) {
      expect(typeof preferences.reducedMotion).toBe('boolean');
    }

    if (preferences.highContrast !== undefined) {
      expect(typeof preferences.highContrast).toBe('boolean');
    }
  });

  it('should return default preferences for new users', async () => {
    // Assuming a new user token
    const newUserToken = 'Bearer new-user-token';
    
    const response = await request(app)
      .get('/api/preferences/responsive')
      .set('Authorization', newUserToken)
      .expect(200);

    // New users should get an empty object or defaults
    expect(response.body).toBeDefined();
  });
});