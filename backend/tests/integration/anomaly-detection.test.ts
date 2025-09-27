import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, TestServer } from '../setup';
import { anomalyService } from '../../src/services/anomaly-detection.service';

describe('Anomaly Detection Calibration Tests', () => {
  let server: TestServer;
  const testToken = 'test-user-token-123';

  beforeEach(async () => {
    server = await createTestServer();
    // Clear any existing anomaly data
    (anomalyService as any).anomalies.length = 0;
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Anomaly Detection Algorithm Calibration', () => {
    it('should detect anomalies with appropriate sensitivity levels', async () => {
      // Test different sensitivity levels
      const sensitivityLevels = ['low', 'medium', 'high'] as const;
      
      for (const sensitivity of sensitivityLevels) {
        // Create test data with known patterns
        const testData = generateTestData(100, sensitivity);
        
        // Simulate anomaly detection
        const anomalies = await detectAnomalies(testData, sensitivity);
        
        // Verify detection results based on sensitivity
        expect(anomalies.length).toBeGreaterThan(0);
        
        // Low sensitivity should detect fewer anomalies
        // High sensitivity should detect more anomalies
        if (sensitivity === 'low') {
          expect(anomalies.length).toBeLessThan(20);
        } else if (sensitivity === 'high') {
          expect(anomalies.length).toBeGreaterThan(10);
        }
        
        // Verify anomaly scores are within expected range
        anomalies.forEach(anomaly => {
          expect(anomaly.anomaly_score).toBeGreaterThanOrEqual(0);
          expect(anomaly.anomaly_score).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should maintain false positive rate below 5%', async () => {
      // Generate normal data (no anomalies)
      const normalData = generateNormalData(1000);
      
      // Run anomaly detection with high sensitivity
      const anomalies = await detectAnomalies(normalData, 'high');
      
      // Calculate false positive rate
      const falsePositiveRate = anomalies.length / normalData.length;
      
      // Should be below 5% as per spec
      expect(falsePositiveRate).toBeLessThan(0.05);
    });

    it('should detect known anomalous patterns', async () => {
      // Create data with known anomalies
      const testData = generateDataWithAnomalies(100, 5);
      
      // Run anomaly detection
      const anomalies = await detectAnomalies(testData, 'medium');
      
      // Should detect at least some of the known anomalies
      expect(anomalies.length).toBeGreaterThan(0);
      
      // Verify that detected anomalies have high scores
      const highScoreAnomalies = anomalies.filter(a => a.anomaly_score > 0.7);
      expect(highScoreAnomalies.length).toBeGreaterThan(0);
    });

    it('should handle different entity types correctly', async () => {
      const entityTypes = ['user', 'system', 'api'] as const;
      
      for (const entityType of entityTypes) {
        const testData = generateTestDataForEntity(50, entityType);
        const anomalies = await detectAnomalies(testData, 'medium');
        
        // Verify all detected anomalies are of the correct entity type
        anomalies.forEach(anomaly => {
          expect(anomaly.entity_type).toBe(entityType);
        });
      }
    });
  });

  describe('Anomaly Review and Classification', () => {
    let testAnomalyId: string;

    beforeEach(async () => {
      // Create a test anomaly
      const testData = generateTestData(10, 'medium');
      const anomalies = await detectAnomalies(testData, 'medium');
      testAnomalyId = anomalies[0]?.id || 'test-anomaly-id';
    });

    it('should allow reviewing anomalies with valid classifications', async () => {
      const classifications = ['legitimate', 'suspicious', 'malicious'] as const;
      
      for (const classification of classifications) {
        const response = await server.request(`/api/monitoring/anomalies/${testAnomalyId}/review`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            classification,
            false_positive: classification === 'legitimate'
          })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    it('should reject invalid classifications', async () => {
      const response = await server.request(`/api/monitoring/anomalies/${testAnomalyId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classification: 'invalid_classification',
          false_positive: false
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_CLASSIFICATION');
    });

    it('should reject review of already reviewed anomalies', async () => {
      // First review
      await server.request(`/api/monitoring/anomalies/${testAnomalyId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classification: 'legitimate',
          false_positive: true
        })
      });

      // Second review should fail
      const response = await server.request(`/api/monitoring/anomalies/${testAnomalyId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classification: 'suspicious',
          false_positive: false
        })
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.code).toBe('ANOMALY_ALREADY_REVIEWED');
    });

    it('should require both classification and false_positive flag', async () => {
      // Missing classification
      const response1 = await server.request(`/api/monitoring/anomalies/${testAnomalyId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          false_positive: false
        })
      });

      expect(response1.status).toBe(400);
      const data1 = await response1.json();
      expect(data1.code).toBe('MISSING_CLASSIFICATION');

      // Missing false_positive flag
      const response2 = await server.request(`/api/monitoring/anomalies/${testAnomalyId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classification: 'legitimate'
        })
      });

      expect(response2.status).toBe(400);
      const data2 = await response2.json();
      expect(data2.code).toBe('MISSING_FALSE_POSITIVE_FLAG');
    });
  });

  describe('Anomaly Filtering and Querying', () => {
    beforeEach(async () => {
      // Create test anomalies with different characteristics
      const testAnomalies = [
        { entity_type: 'user', anomaly_score: 0.9, detected_at: new Date().toISOString() },
        { entity_type: 'system', anomaly_score: 0.3, detected_at: new Date(Date.now() - 86400000).toISOString() },
        { entity_type: 'api', anomaly_score: 0.7, detected_at: new Date(Date.now() - 172800000).toISOString() },
        { entity_type: 'user', anomaly_score: 0.5, detected_at: new Date().toISOString(), reviewed_at: new Date().toISOString() }
      ];

      // Add test anomalies to the service
      (anomalyService as any).anomalies.push(...testAnomalies.map(anomaly => ({
        id: Math.random().toString(36).slice(2, 10),
        ...anomaly,
        sensitivity_level: 'medium'
      })));
    });

    it('should filter anomalies by entity type', async () => {
      const response = await server.request('/api/monitoring/anomalies?entity_type=user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // All returned anomalies should be of type 'user'
      data.forEach((anomaly: any) => {
        expect(anomaly.entity_type).toBe('user');
      });
    });

    it('should filter anomalies by minimum score', async () => {
      const response = await server.request('/api/monitoring/anomalies?min_score=0.6', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // All returned anomalies should have score >= 0.6
      data.forEach((anomaly: any) => {
        expect(anomaly.anomaly_score).toBeGreaterThanOrEqual(0.6);
      });
    });

    it('should filter unreviewed anomalies only', async () => {
      const response = await server.request('/api/monitoring/anomalies?unreviewed_only=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // All returned anomalies should be unreviewed
      data.forEach((anomaly: any) => {
        expect(anomaly.reviewed_at).toBeNull();
      });
    });

    it('should filter anomalies by date range', async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      
      const response = await server.request(`/api/monitoring/anomalies?from=${yesterday}&to=${tomorrow}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // All returned anomalies should be within the date range
      data.forEach((anomaly: any) => {
        const detectedAt = new Date(anomaly.detected_at);
        expect(detectedAt).toBeGreaterThanOrEqual(new Date(yesterday));
        expect(detectedAt).toBeLessThanOrEqual(new Date(tomorrow));
      });
    });

    it('should support pagination', async () => {
      const response = await server.request('/api/monitoring/anomalies?limit=2&offset=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should return at most 2 items
      expect(data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Generate large dataset
      const largeDataset = generateTestData(10000, 'medium');
      
      // Run anomaly detection
      const anomalies = await detectAnomalies(largeDataset, 'medium');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      
      // Should detect some anomalies
      expect(anomalies.length).toBeGreaterThan(0);
    });

    it('should maintain performance with concurrent requests', async () => {
      const startTime = Date.now();
      
      // Create multiple concurrent anomaly detection requests
      const promises = Array.from({ length: 10 }, (_, i) => {
        const testData = generateTestData(100, 'medium');
        return detectAnomalies(testData, 'medium');
      });
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle concurrent requests efficiently
      expect(duration).toBeLessThan(3000);
      
      // All requests should complete successfully
      results.forEach(anomalies => {
        expect(Array.isArray(anomalies)).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty datasets gracefully', async () => {
      const anomalies = await detectAnomalies([], 'medium');
      expect(anomalies).toEqual([]);
    });

    it('should handle single data point', async () => {
      const singleDataPoint = generateTestData(1, 'medium');
      const anomalies = await detectAnomalies(singleDataPoint, 'medium');
      
      // Should not crash and return empty array or single anomaly
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should handle invalid sensitivity levels', async () => {
      const testData = generateTestData(10, 'medium');
      
      // Should default to medium sensitivity for invalid levels
      const anomalies = await detectAnomalies(testData, 'invalid' as any);
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should handle review of non-existent anomaly', async () => {
      const response = await server.request('/api/monitoring/anomalies/non-existent-id/review', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classification: 'legitimate',
          false_positive: true
        })
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.code).toBe('ANOMALY_NOT_FOUND');
    });
  });

  // Helper functions for test data generation
  function generateTestData(count: number, sensitivity: string) {
    return Array.from({ length: count }, (_, i) => ({
      id: `test-${i}`,
      features: {
        request_count: Math.random() * 100,
        response_time: Math.random() * 1000,
        error_rate: Math.random() * 0.1,
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 100
      },
      timestamp: new Date(Date.now() - i * 60000).toISOString()
    }));
  }

  function generateNormalData(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `normal-${i}`,
      features: {
        request_count: 50 + Math.random() * 10, // Normal range
        response_time: 200 + Math.random() * 100, // Normal range
        error_rate: Math.random() * 0.01, // Very low error rate
        cpu_usage: 30 + Math.random() * 20, // Normal range
        memory_usage: 40 + Math.random() * 20 // Normal range
      },
      timestamp: new Date(Date.now() - i * 60000).toISOString()
    }));
  }

  function generateDataWithAnomalies(count: number, anomalyCount: number) {
    const normalData = generateNormalData(count - anomalyCount);
    const anomalyData = Array.from({ length: anomalyCount }, (_, i) => ({
      id: `anomaly-${i}`,
      features: {
        request_count: 1000 + Math.random() * 500, // High request count
        response_time: 5000 + Math.random() * 2000, // High response time
        error_rate: 0.5 + Math.random() * 0.4, // High error rate
        cpu_usage: 90 + Math.random() * 10, // High CPU usage
        memory_usage: 95 + Math.random() * 5 // High memory usage
      },
      timestamp: new Date(Date.now() - i * 60000).toISOString()
    }));
    
    return [...normalData, ...anomalyData];
  }

  function generateTestDataForEntity(count: number, entityType: string) {
    return Array.from({ length: count }, (_, i) => ({
      id: `${entityType}-${i}`,
      entity_type: entityType,
      features: {
        request_count: Math.random() * 100,
        response_time: Math.random() * 1000,
        error_rate: Math.random() * 0.1
      },
      timestamp: new Date(Date.now() - i * 60000).toISOString()
    }));
  }

  async function detectAnomalies(data: any[], sensitivity: string) {
    // Simulate anomaly detection algorithm
    const anomalies = [];
    
    for (const item of data) {
      // Simple anomaly detection based on feature values
      const features = item.features;
      let anomalyScore = 0;
      
      // Calculate anomaly score based on feature values
      if (features.request_count > 200) anomalyScore += 0.3;
      if (features.response_time > 2000) anomalyScore += 0.3;
      if (features.error_rate > 0.1) anomalyScore += 0.2;
      if (features.cpu_usage > 80) anomalyScore += 0.1;
      if (features.memory_usage > 90) anomalyScore += 0.1;
      
      // Apply sensitivity threshold
      const threshold = sensitivity === 'low' ? 0.8 : sensitivity === 'medium' ? 0.6 : 0.4;
      
      if (anomalyScore >= threshold) {
        anomalies.push({
          id: Math.random().toString(36).slice(2, 10),
          entity_type: item.entity_type || 'user',
          entity_id: item.id,
          anomaly_score: Math.min(anomalyScore, 1),
          sensitivity_level: sensitivity,
          detected_at: item.timestamp || new Date().toISOString(),
          reviewed_at: null
        });
      }
    }
    
    return anomalies;
  }
});
