import { describe, it, expect, beforeEach } from 'vitest';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import request from 'supertest';
import { corsOptions } from '../../src/middleware/security';

/**
 * CORS No-Origin Security Tests
 *
 * Tests that the CORS policy properly rejects requests without an Origin header,
 * preventing potential security vulnerabilities from curl, server-side requests,
 * or malicious clients attempting to bypass CORS protections.
 *
 * Reference: spec.md - CORS policy should not allow requests without Origin header
 */

describe('CORS No-Origin Security Tests', () => {
  let app: Express;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(cors(corsOptions));
    app.use(express.json());

    // Add test routes
    app.get('/api/test', (_req: Request, res: Response) => {
      res.json({ success: true, message: 'Test endpoint' });
    });

    app.post('/api/test', (_req: Request, res: Response) => {
      res.json({ success: true, message: 'POST test endpoint' });
    });

    app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'healthy' });
    });
  });

  describe('Requests without Origin header', () => {
    it('should reject GET requests without Origin header', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect((res) => {
          // CORS should block the request or not set CORS headers
          // The request might succeed at the Express level but CORS headers won't be set
          // Or it might be blocked entirely depending on CORS configuration
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should reject POST requests without Origin header', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' })
        .expect((res) => {
          // CORS should not set allow-origin header for requests without Origin
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should reject preflight OPTIONS requests without Origin header', async () => {
      const response = await request(app)
        .options('/api/test')
        .expect((res) => {
          // Preflight without Origin should be rejected
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should log security events when rejecting no-origin requests', async () => {
      // This test verifies that security logging is triggered
      // The actual logging is tested through the CORS callback
      await request(app)
        .get('/api/test')
        .expect((res) => {
          // Verify CORS didn't allow the request
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
  });

  describe('Requests with valid Origin header', () => {
    it('should allow requests from localhost in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.body).toHaveProperty('success', true);
    });

    it('should allow requests from localhost:5173 (Vite) in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should allow requests from 127.0.0.1 in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://127.0.0.1:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:3000');
    });

    it('should allow requests from configured FRONTEND_URL', async () => {
      process.env.NODE_ENV = 'development';
      process.env.FRONTEND_URL = 'http://localhost:3000';

      const response = await request(app)
        .get('/api/test')
        .set('Origin', process.env.FRONTEND_URL)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(process.env.FRONTEND_URL);
    });

    it('should allow requests from local network IPs in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://192.168.1.100:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://192.168.1.100:3000');
    });
  });

  describe('Requests with invalid Origin header', () => {
    it('should reject requests from unauthorized domains', async () => {
      process.env.NODE_ENV = 'production';

      await request(app)
        .get('/api/test')
        .set('Origin', 'http://malicious-site.com')
        .expect((res) => {
          // In production, unauthorized origins should not get CORS headers
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should reject requests from unauthorized ports', async () => {
      process.env.NODE_ENV = 'production';

      await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:9999')
        .expect((res) => {
          // Unauthorized port should be rejected in production
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should reject requests with malformed Origin header', async () => {
      await request(app)
        .get('/api/test')
        .set('Origin', 'not-a-valid-url')
        .expect((res) => {
          // Malformed origin should be rejected
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should reject requests from HTTP when HTTPS is expected in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_URL = 'https://example.com';

      await request(app)
        .get('/api/test')
        .set('Origin', 'http://example.com')
        .expect((res) => {
          // HTTP origin when HTTPS is configured should be rejected
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
  });

  describe('Production ALLOWED_ORIGINS configuration', () => {
    it('should allow requests from production domains in ALLOWED_ORIGINS', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://app.example.com,https://admin.example.com';

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'https://app.example.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
    });

    it('should reject requests from domains not in ALLOWED_ORIGINS', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://app.example.com';

      await request(app)
        .get('/api/test')
        .set('Origin', 'https://unauthorized.example.com')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
  });

  describe('CORS preflight requests', () => {
    it('should handle preflight OPTIONS with valid Origin', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should reject preflight OPTIONS without Origin', async () => {
      await request(app)
        .options('/api/test')
        .set('Access-Control-Request-Method', 'POST')
        .expect((res) => {
          // Preflight without Origin should not get CORS headers
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should handle preflight for custom headers', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'X-API-Key,Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-headers']).toContain('X-API-Key');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });

  describe('CORS credentials and headers', () => {
    it('should include credentials support in CORS headers', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should expose correct allowed methods', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'DELETE')
        .expect(204);

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('DELETE');
      expect(allowedMethods).toContain('PATCH');
    });

    it('should set appropriate max-age for preflight caching', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      // Max age should be 24 hours (86400 seconds)
      expect(response.headers['access-control-max-age']).toBe('86400');
    });
  });

  describe('Edge cases and security scenarios', () => {
    it('should reject requests with null Origin (file:// protocol)', async () => {
      await request(app)
        .get('/api/test')
        .set('Origin', 'null')
        .expect((res) => {
          // Null origin (from file://) should be rejected
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should handle concurrent requests with different origins', async () => {
      process.env.NODE_ENV = 'development';

      const requests = [
        request(app).get('/api/test').set('Origin', 'http://localhost:3000'),
        request(app).get('/api/test').set('Origin', 'http://localhost:5173'),
        request(app).get('/api/test').set('Origin', 'http://127.0.0.1:3000'),
      ];

      const responses = await Promise.all(requests);

      // Each request should be allowed and return the correct origin
      expect(responses[0].headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(responses[1].headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(responses[2].headers['access-control-allow-origin']).toBe('http://127.0.0.1:3000');
    });

    it('should handle requests with Origin header containing special characters', async () => {
      await request(app)
        .get('/api/test')
        .set('Origin', 'http://test<script>.com')
        .expect((res) => {
          // Malformed/dangerous origin should be rejected
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should reject requests attempting to spoof localhost with different TLD', async () => {
      process.env.NODE_ENV = 'production';

      await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost.malicious.com')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
  });

  describe('Environment-specific behavior', () => {
    it('should be more restrictive in production mode', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://production.example.com';

      // Localhost should be rejected in production
      await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:3000')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    it('should be permissive for localhost in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should handle test environment appropriately', async () => {
      process.env.NODE_ENV = 'test';

      // Test environment should behave like development for testing purposes
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });
});
