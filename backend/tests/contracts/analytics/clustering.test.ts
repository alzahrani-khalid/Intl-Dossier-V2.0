/**
 * Contract Test: Clustering Endpoint
 * Tests the /analytics/cluster endpoint contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, createClusteringRequest, validateClusteringResult, validateErrorResponse } from '../test-utils';

describe('Clustering Contract Tests', () => {
  let apiClient: ApiClient;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    apiClient = new ApiClient();
    testUser = createTestUser();
    
    // Register test user and get auth token
    authToken = 'test-auth-token';
    apiClient.setAuthToken(authToken);
  });

  afterAll(async () => {
    // Cleanup test data
  });

  describe('POST /analytics/cluster', () => {
    it('should successfully perform clustering with valid data', async () => {
      const request = createClusteringRequest();
      
      const response = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response.status).toBe(200);
      validateClusteringResult(response.data);
    });

    it('should return 400 for missing dataset_id', async () => {
      const request = {
        data: [[1, 2, 3], [4, 5, 6]]
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_DATASET_ID');
    });

    it('should return 400 for missing data', async () => {
      const request = {
        dataset_id: 'test-dataset'
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_DATA');
    });

    it('should return 400 for empty data array', async () => {
      const request = {
        dataset_id: 'test-dataset',
        data: []
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('EMPTY_DATA');
    });

    it('should return 400 for insufficient data points', async () => {
      const request = {
        dataset_id: 'test-dataset',
        data: [[1, 2], [3, 4]] // Only 2 points, need at least 3 for clustering
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INSUFFICIENT_DATA_POINTS');
    });

    it('should return 400 for invalid cluster_count', async () => {
      const request = {
        ...createClusteringRequest(),
        cluster_count: 2 // Too few clusters
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_CLUSTER_COUNT');
    });

    it('should return 400 for cluster_count exceeding data points', async () => {
      const request = {
        dataset_id: 'test-dataset',
        data: [[1, 2], [3, 4], [5, 6]],
        cluster_count: 5 // More clusters than data points
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_CLUSTER_COUNT');
    });

    it('should return 400 for invalid data format', async () => {
      const request = {
        dataset_id: 'test-dataset',
        data: [[1, 2, 3], [4, 5]] // Inconsistent dimensions
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_DATA_FORMAT');
    });

    it('should return 400 for non-numeric data', async () => {
      const request = {
        dataset_id: 'test-dataset',
        data: [['a', 'b'], ['c', 'd'], ['e', 'f']]
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_DATA_TYPE');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      const request = createClusteringRequest();
      
      const response = await clientWithoutAuth.post('/analytics/cluster', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for insufficient permissions', async () => {
      const request = {
        ...createClusteringRequest(),
        dataset_id: 'restricted-dataset'
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 403);
      
      expect(response.status).toBe(403);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should return 429 for too many clustering requests', async () => {
      const request = createClusteringRequest();
      
      // Make multiple rapid requests
      const promises = Array(10).fill(null).map(() => 
        apiClient.post('/analytics/cluster', request)
      );
      
      const responses = await Promise.allSettled(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(rateLimited).toBe(true);
    });

    it('should perform auto-optimization when enabled', async () => {
      const request = {
        ...createClusteringRequest(),
        auto_optimize: true
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response.status).toBe(200);
      validateClusteringResult(response.data);
      expect(response.data.is_optimal).toBe(true);
    });

    it('should use provided cluster_count when auto_optimize is false', async () => {
      const request = {
        ...createClusteringRequest(),
        cluster_count: 4,
        auto_optimize: false
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response.status).toBe(200);
      validateClusteringResult(response.data);
      expect(response.data.cluster_count).toBe(4);
    });

    it('should return valid silhouette score', async () => {
      const request = createClusteringRequest();
      
      const response = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.silhouette_score).toBeGreaterThanOrEqual(-1);
      expect(response.data.silhouette_score).toBeLessThanOrEqual(1);
    });

    it('should return valid inertia value', async () => {
      const request = createClusteringRequest();
      
      const response = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.inertia).toBeGreaterThanOrEqual(0);
    });

    it('should return centroids array', async () => {
      const request = createClusteringRequest();
      
      const response = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.centroids)).toBe(true);
      expect(response.data.centroids.length).toBe(response.data.cluster_count);
      
      response.data.centroids.forEach((centroid: any) => {
        expect(Array.isArray(centroid)).toBe(true);
        expect(centroid.length).toBe(3); // Should match data dimensions
      });
    });

    it('should return labels array with correct length', async () => {
      const request = createClusteringRequest();
      
      const response = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.labels)).toBe(true);
      expect(response.data.labels.length).toBe(3); // Should match data length
      
      response.data.labels.forEach((label: any) => {
        expect(typeof label).toBe('number');
        expect(label).toBeGreaterThanOrEqual(0);
        expect(label).toBeLessThan(response.data.cluster_count);
      });
    });

    it('should handle large datasets', async () => {
      const largeData = Array(1000).fill(null).map((_, i) => [
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      ]);
      
      const request = {
        dataset_id: 'large-dataset',
        data: largeData,
        cluster_count: 5
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response.status).toBe(200);
      validateClusteringResult(response.data);
      expect(response.data.labels.length).toBe(1000);
    });

    it('should handle high-dimensional data', async () => {
      const highDimData = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 25]
      ];
      
      const request = {
        dataset_id: 'high-dim-dataset',
        data: highDimData,
        cluster_count: 3
      };
      
      const response = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response.status).toBe(200);
      validateClusteringResult(response.data);
      
      // Centroids should have 5 dimensions
      response.data.centroids.forEach((centroid: any) => {
        expect(centroid.length).toBe(5);
      });
    });

    it('should return bilingual error messages', async () => {
      const request = {};
      
      const response = await apiClient.post('/analytics/cluster', request, 400);
      
      expect(response.status).toBe(400);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
    });

    it('should handle concurrent clustering requests', async () => {
      const request = createClusteringRequest();
      
      // Make concurrent requests
      const promises = Array(3).fill(null).map(() => 
        apiClient.post('/analytics/cluster', request)
      );
      
      const responses = await Promise.allSettled(promises);
      
      // All should succeed
      responses.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
          validateClusteringResult(result.value.data);
        }
      });
    });

    it('should return consistent results for same data', async () => {
      const request = createClusteringRequest();
      
      const response1 = await apiClient.post('/analytics/cluster', request, 200);
      const response2 = await apiClient.post('/analytics/cluster', request, 200);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Results should be consistent (same cluster count, similar silhouette score)
      expect(response1.data.cluster_count).toBe(response2.data.cluster_count);
      expect(Math.abs(response1.data.silhouette_score - response2.data.silhouette_score)).toBeLessThan(0.1);
    });
  });
});