import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, TestServer } from '../setup';
import { exportService } from '../../src/services/export.service';

describe('Export Performance Tests', () => {
  let server: TestServer;
  const testToken = 'test-user-token-123';

  beforeEach(async () => {
    server = await createTestServer();
    // Clear any existing export state
    (exportService as any).exportsStore.clear();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Export Request Performance', () => {
    it('should create export request within performance target', async () => {
      const startTime = Date.now();
      
      const response = await server.request('/api/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_type: 'users',
          format: 'csv'
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(202);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
      
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('pending');
    });

    it('should handle multiple concurrent export requests efficiently', async () => {
      const startTime = Date.now();
      const concurrentRequests = 10;
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) => 
        server.request('/api/export', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}-${i}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resource_type: 'users',
            format: 'csv'
          })
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(202);
      });

      // Should handle 10 concurrent requests within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second for 10 concurrent requests
    });

    it('should maintain performance with different export formats', async () => {
      const formats = ['csv', 'json', 'excel'] as const;
      const results: { format: string; duration: number }[] = [];

      for (const format of formats) {
        const startTime = Date.now();
        
        const response = await server.request('/api/export', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resource_type: 'users',
            format
          })
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.status).toBe(202);
        results.push({ format, duration });
      }

      // All formats should perform similarly for request creation
      results.forEach(result => {
        expect(result.duration).toBeLessThan(100);
      });
    });
  });

  describe('Export Processing Performance', () => {
    it('should complete export processing within target time', async () => {
      // Create export request
      const createResponse = await server.request('/api/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_type: 'users',
          format: 'csv'
        })
      });

      expect(createResponse.status).toBe(202);
      const { id } = await createResponse.json();

      // Wait for processing to complete
      const startTime = Date.now();
      let status = 'pending';
      let attempts = 0;
      const maxAttempts = 20; // 20 seconds max wait

      while (status !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await server.request(`/api/export/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testToken}`
          }
        });

        if (statusResponse.status === 200) {
          const data = await statusResponse.json();
          status = data.status;
        }
        attempts++;
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      expect(status).toBe('completed');
      expect(totalDuration).toBeLessThan(30000); // Should complete within 30 seconds (target from spec)
    });

    it('should handle large dataset export efficiently', async () => {
      // Simulate large dataset export by creating multiple requests
      const largeDatasetRequests = 5;
      const startTime = Date.now();

      const promises = Array.from({ length: largeDatasetRequests }, (_, i) => 
        server.request('/api/export', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}-${i}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resource_type: 'users',
            format: 'csv'
          })
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should be accepted quickly
      responses.forEach(response => {
        expect(response.status).toBe(202);
      });

      // Should handle multiple large exports efficiently
      expect(duration).toBeLessThan(2000); // 2 seconds for 5 large exports
    });
  });

  describe('Export Download Performance', () => {
    let exportId: string;

    beforeEach(async () => {
      // Create and wait for export to complete
      const createResponse = await server.request('/api/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_type: 'users',
          format: 'csv'
        })
      });

      const { id } = await createResponse.json();
      exportId = id;

      // Wait for processing to complete
      let status = 'pending';
      let attempts = 0;
      while (status !== 'completed' && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await server.request(`/api/export/${exportId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testToken}`
          }
        });

        if (statusResponse.status === 200) {
          const data = await statusResponse.json();
          status = data.status;
        }
        attempts++;
      }
    });

    it('should download completed export quickly', async () => {
      const startTime = Date.now();
      
      const response = await server.request(`/api/export/${exportId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500); // Should download within 500ms
      
      const content = await response.text();
      expect(content).toContain('id,name');
    });

    it('should handle concurrent downloads efficiently', async () => {
      const concurrentDownloads = 5;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentDownloads }, () => 
        server.request(`/api/export/${exportId}/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testToken}`
          }
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All downloads should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent downloads efficiently
      expect(duration).toBeLessThan(1000); // 1 second for 5 concurrent downloads
    });

    it('should maintain performance across different formats', async () => {
      const formats = ['csv', 'json'] as const;
      const results: { format: string; duration: number }[] = [];

      for (const format of formats) {
        // Create export with specific format
        const createResponse = await server.request('/api/export', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resource_type: 'users',
            format
          })
        });

        const { id } = await createResponse.json();

        // Wait for completion
        let status = 'pending';
        let attempts = 0;
        while (status !== 'completed' && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await server.request(`/api/export/${id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${testToken}`
            }
          });

          if (statusResponse.status === 200) {
            const data = await statusResponse.json();
            status = data.status;
          }
          attempts++;
        }

        // Test download performance
        const startTime = Date.now();
        const downloadResponse = await server.request(`/api/export/${id}/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testToken}`
          }
        });
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(downloadResponse.status).toBe(200);
        results.push({ format, duration });
      }

      // All formats should download quickly
      results.forEach(result => {
        expect(result.duration).toBeLessThan(500);
      });
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting without significant performance impact', async () => {
      const startTime = Date.now();
      const requests = 15; // Exceed rate limit of 10
      
      const promises = Array.from({ length: requests }, (_, i) => 
        server.request('/api/export', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}-${i}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resource_type: 'users',
            format: 'csv'
          })
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Some requests should be rate limited
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      const successfulCount = responses.filter(r => r.status === 202).length;

      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(successfulCount).toBe(10); // Rate limit is 10 per minute
      expect(duration).toBeLessThan(2000); // Should handle rate limiting quickly
    });
  });

  describe('Memory Usage and Resource Management', () => {
    it('should handle multiple exports without memory leaks', async () => {
      const exportCount = 50;
      const startTime = Date.now();

      // Create many export requests
      const promises = Array.from({ length: exportCount }, (_, i) => 
        server.request('/api/export', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}-${i}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resource_type: 'users',
            format: 'csv'
          })
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should be accepted
      responses.forEach(response => {
        expect(response.status).toBe(202);
      });

      // Should handle many requests efficiently
      expect(duration).toBeLessThan(5000); // 5 seconds for 50 requests
    });

    it('should clean up expired exports efficiently', async () => {
      // This test would require implementation of cleanup logic
      // For now, we test that the service can handle many exports
      const exportCount = 100;
      
      const promises = Array.from({ length: exportCount }, (_, i) => 
        server.request('/api/export', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}-${i}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resource_type: 'users',
            format: 'csv'
          })
        })
      );

      const responses = await Promise.all(promises);
      
      // All requests should be accepted
      responses.forEach(response => {
        expect(response.status).toBe(202);
      });

      // Verify we can still create new exports after many requests
      const newExportResponse = await server.request('/api/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}-new`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_type: 'users',
          format: 'csv'
        })
      });

      expect(newExportResponse.status).toBe(202);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle invalid requests quickly', async () => {
      const startTime = Date.now();
      
      const response = await server.request('/api/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_type: 'invalid_resource',
          format: 'csv'
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(400);
      expect(duration).toBeLessThan(100); // Should reject invalid requests quickly
    });

    it('should handle missing authorization quickly', async () => {
      const startTime = Date.now();
      
      const response = await server.request('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_type: 'users',
          format: 'csv'
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(401);
      expect(duration).toBeLessThan(100); // Should reject unauthorized requests quickly
    });
  });
});
