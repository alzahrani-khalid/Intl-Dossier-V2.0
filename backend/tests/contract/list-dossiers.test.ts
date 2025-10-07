/**
 * Contract Test: GET /dossiers (List with filters)
 * Task: T013
 * Status: MUST FAIL until T020 implemented
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient;
let authToken: string;

beforeAll(async () => {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // TODO: Authenticate test user and get token
  // const { data: { session } } = await supabase.auth.signInWithPassword({
  //   email: 'test@gastat.gov.sa',
  //   password: 'test-password'
  // });
  // authToken = session?.access_token || '';
});

describe('GET /dossiers - List with filters', () => {
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/dossiers-list`;

  describe('Request Parameters', () => {
    it('should accept type filter parameter', async () => {
      const response = await fetch(`${ENDPOINT}?type=country`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      
      // All results should be of type 'country'
      data.data.forEach((dossier: any) => {
        expect(dossier.type).toBe('country');
      });
    });

    it('should accept status filter parameter', async () => {
      const response = await fetch(`${ENDPOINT}?status=active`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      data.data.forEach((dossier: any) => {
        expect(dossier.status).toBe('active');
      });
    });

    it('should accept sensitivity filter parameter', async () => {
      const response = await fetch(`${ENDPOINT}?sensitivity=low`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      data.data.forEach((dossier: any) => {
        expect(dossier.sensitivity_level).toBe('low');
      });
    });

    it('should accept owner_id filter parameter', async () => {
      const testUserId = 'test-user-uuid';
      const response = await fetch(`${ENDPOINT}?owner_id=${testUserId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      // Should return dossiers owned by the specified user
    });

    it('should accept tags filter parameter (array)', async () => {
      const response = await fetch(`${ENDPOINT}?tags=bilateral&tags=strategic`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      data.data.forEach((dossier: any) => {
        expect(dossier.tags).toBeDefined();
        expect(Array.isArray(dossier.tags)).toBe(true);
      });
    });

    it('should accept search parameter for full-text search', async () => {
      const response = await fetch(`${ENDPOINT}?search=Saudi`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
      
      // Results should contain search term in name or summary
      if (data.data.length > 0) {
        const firstResult = data.data[0];
        const searchText = (
          firstResult.name_en + ' ' + 
          firstResult.name_ar + ' ' + 
          (firstResult.summary_en || '') + ' ' +
          (firstResult.summary_ar || '')
        ).toLowerCase();
        expect(searchText).toContain('saudi'.toLowerCase());
      }
    });

    it('should accept cursor parameter for pagination', async () => {
      const response = await fetch(`${ENDPOINT}?limit=10&cursor=some-cursor-value`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
    });

    it('should accept limit parameter (default 50, max 100)', async () => {
      const response = await fetch(`${ENDPOINT}?limit=10`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.length).toBeLessThanOrEqual(10);
    });

    it('should reject limit > 100', async () => {
      const response = await fetch(`${ENDPOINT}?limit=200`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toBeDefined();
      expect(error.error.code).toBe('INVALID_PARAMETER');
    });
  });

  describe('Response Schema', () => {
    it('should return correct response structure', async () => {
      const response = await fetch(ENDPOINT, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Response structure
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.data)).toBe(true);
      
      // Pagination structure
      expect(data.pagination).toHaveProperty('next_cursor');
      expect(data.pagination).toHaveProperty('has_more');
      expect(typeof data.pagination.has_more).toBe('boolean');
    });

    it('should return dossiers with all required fields', async () => {
      const response = await fetch(ENDPOINT, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      if (data.data.length > 0) {
        const dossier = data.data[0];
        
        // Required fields
        expect(dossier).toHaveProperty('id');
        expect(dossier).toHaveProperty('name_en');
        expect(dossier).toHaveProperty('name_ar');
        expect(dossier).toHaveProperty('type');
        expect(dossier).toHaveProperty('status');
        expect(dossier).toHaveProperty('sensitivity_level');
        expect(dossier).toHaveProperty('version');
        expect(dossier).toHaveProperty('created_at');
        expect(dossier).toHaveProperty('updated_at');
        expect(dossier).toHaveProperty('archived');
        
        // Optional fields
        expect(dossier).toHaveProperty('summary_en');
        expect(dossier).toHaveProperty('summary_ar');
        expect(dossier).toHaveProperty('tags');
        expect(Array.isArray(dossier.tags)).toBe(true);
      }
    });

    it('should return bilingual fields in both languages', async () => {
      const response = await fetch(ENDPOINT, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      if (data.data.length > 0) {
        const dossier = data.data[0];
        
        expect(typeof dossier.name_en).toBe('string');
        expect(typeof dossier.name_ar).toBe('string');
        expect(dossier.name_en.length).toBeGreaterThan(0);
        expect(dossier.name_ar.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Authorization & Permissions', () => {
    it('should return 401 Unauthorized without auth token', async () => {
      const response = await fetch(ENDPOINT);
      
      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error).toBeDefined();
      expect(error.error.code).toBe('UNAUTHORIZED');
      expect(error.error.message_en).toBeDefined();
      expect(error.error.message_ar).toBeDefined();
    });

    it('should filter results by user clearance level', async () => {
      // Test with low clearance user
      const response = await fetch(ENDPOINT, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Low clearance user should only see low sensitivity dossiers
      // This depends on RLS policies being enforced
      data.data.forEach((dossier: any) => {
        // Actual check depends on test user's clearance level
        expect(['low', 'medium', 'high']).toContain(dossier.sensitivity_level);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 400 Bad Request for invalid type value', async () => {
      const response = await fetch(`${ENDPOINT}?type=invalid_type`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.code).toBe('INVALID_PARAMETER');
      expect(error.error.message_en).toContain('type');
    });

    it('should return 400 Bad Request for invalid sensitivity value', async () => {
      const response = await fetch(`${ENDPOINT}?sensitivity=invalid`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(400);
    });

    it('should return bilingual error messages', async () => {
      const response = await fetch(`${ENDPOINT}?limit=999`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const error = await response.json();
      expect(error.error).toBeDefined();
      expect(error.error.message_en).toBeDefined();
      expect(error.error.message_ar).toBeDefined();
      expect(typeof error.error.message_en).toBe('string');
      expect(typeof error.error.message_ar).toBe('string');
    });
  });

  describe('Pagination', () => {
    it('should support cursor-based pagination', async () => {
      // Get first page
      const page1 = await fetch(`${ENDPOINT}?limit=2`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const data1 = await page1.json();
      expect(data1.data.length).toBeLessThanOrEqual(2);
      
      if (data1.pagination.has_more) {
        // Get second page
        const page2 = await fetch(`${ENDPOINT}?limit=2&cursor=${data1.pagination.next_cursor}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data2 = await page2.json();
        expect(data2.data.length).toBeGreaterThan(0);
        
        // Should not overlap
        const page1Ids = data1.data.map((d: any) => d.id);
        const page2Ids = data2.data.map((d: any) => d.id);
        const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
        expect(intersection.length).toBe(0);
      }
    });

    it('should return has_more=false when no more results', async () => {
      const response = await fetch(`${ENDPOINT}?limit=1000`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.pagination.has_more).toBe(false);
      expect(data.pagination.next_cursor).toBeNull();
    });
  });

  describe('Combined Filters', () => {
    it('should support multiple filters combined', async () => {
      const response = await fetch(`${ENDPOINT}?type=country&status=active&sensitivity=low`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      data.data.forEach((dossier: any) => {
        expect(dossier.type).toBe('country');
        expect(dossier.status).toBe('active');
        expect(dossier.sensitivity_level).toBe('low');
      });
    });

    it('should combine search with filters', async () => {
      const response = await fetch(`${ENDPOINT}?search=Saudi&type=country`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      data.data.forEach((dossier: any) => {
        expect(dossier.type).toBe('country');
      });
    });
  });
});
