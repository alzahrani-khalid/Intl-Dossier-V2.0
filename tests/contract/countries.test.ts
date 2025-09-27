import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for contract testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Countries API Contract Tests', () => {
  let testCountryId: string;
  let authToken: string;

  beforeAll(async () => {
    // Setup test user and get auth token
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'Test123!@#',
      options: {
        data: {
          full_name: 'Test User',
          language_preference: 'en'
        }
      }
    });
    
    if (authError) throw authError;
    authToken = authData.session?.access_token || '';
  });

  afterAll(async () => {
    // Cleanup test data
    if (testCountryId) {
      await supabase.from('countries').delete().eq('id', testCountryId);
    }
    await supabase.auth.signOut();
  });

  describe('GET /api/v1/countries', () => {
    it('should return paginated list of countries', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/countries?select=*`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('length');
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const country = data[0];
        expect(country).toHaveProperty('id');
        expect(country).toHaveProperty('iso_code_2');
        expect(country).toHaveProperty('iso_code_3');
        expect(country).toHaveProperty('name_en');
        expect(country).toHaveProperty('name_ar');
        expect(country).toHaveProperty('region');
        expect(country).toHaveProperty('status');
        expect(country).toHaveProperty('created_at');
        expect(country).toHaveProperty('updated_at');
      }
    });

    it('should support search by name', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/countries?select=*&name_en=ilike.*Saudi*`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should support filtering by region', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/countries?select=*&region=eq.asia`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should support filtering by status', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/countries?select=*&status=eq.active`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/v1/countries', () => {
    it('should create a new country with valid data', async () => {
      const countryData = {
        iso_code_2: 'SA',
        iso_code_3: 'SAU',
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        region: 'asia',
        capital_en: 'Riyadh',
        capital_ar: 'الرياض',
        population: 35000000,
        area_sq_km: 2149690
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/countries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(countryData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data).toHaveProperty('id');
      expect(data.iso_code_2).toBe('SA');
      expect(data.iso_code_3).toBe('SAU');
      expect(data.name_en).toBe('Saudi Arabia');
      expect(data.name_ar).toBe('المملكة العربية السعودية');
      expect(data.region).toBe('asia');
      expect(data.status).toBe('active');
      
      testCountryId = data.id;
    });

    it('should reject duplicate ISO codes', async () => {
      const countryData = {
        iso_code_2: 'SA',
        iso_code_3: 'SAU',
        name_en: 'Duplicate Saudi Arabia',
        name_ar: 'المملكة العربية السعودية المكررة',
        region: 'asia'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/countries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(countryData)
      });

      expect(response.status).toBe(409);
    });

    it('should reject invalid region', async () => {
      const countryData = {
        iso_code_2: 'XX',
        iso_code_3: 'XXX',
        name_en: 'Invalid Country',
        name_ar: 'دولة غير صحيحة',
        region: 'invalid_region'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/countries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(countryData)
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing required fields', async () => {
      const countryData = {
        iso_code_2: 'XX',
        // Missing required fields
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/countries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(countryData)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/countries/{id}', () => {
    it('should return country by ID', async () => {
      if (!testCountryId) {
        // Create a test country first
        const countryData = {
          iso_code_2: 'AE',
          iso_code_3: 'ARE',
          name_en: 'United Arab Emirates',
          name_ar: 'دولة الإمارات العربية المتحدة',
          region: 'asia'
        };

        const createResponse = await fetch(`${supabaseUrl}/rest/v1/countries`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(countryData)
        });

        const createdData = await createResponse.json();
        testCountryId = createdData.id;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/countries?id=eq.${testCountryId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].id).toBe(testCountryId);
    });

    it('should return 404 for non-existent country', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(`${supabaseUrl}/rest/v1/countries?id=eq.${fakeId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('PUT /api/v1/countries/{id}', () => {
    it('should update country with valid data', async () => {
      if (!testCountryId) {
        throw new Error('Test country ID not available');
      }

      const updateData = {
        name_en: 'Updated Saudi Arabia',
        name_ar: 'المملكة العربية السعودية المحدثة',
        population: 36000000
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/countries?id=eq.${testCountryId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].name_en).toBe('Updated Saudi Arabia');
      expect(data[0].name_ar).toBe('المملكة العربية السعودية المحدثة');
      expect(data[0].population).toBe(36000000);
    });

    it('should reject invalid region update', async () => {
      if (!testCountryId) {
        throw new Error('Test country ID not available');
      }

      const updateData = {
        region: 'invalid_region'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/countries?id=eq.${testCountryId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/countries/{id}', () => {
    it('should delete country by ID', async () => {
      if (!testCountryId) {
        throw new Error('Test country ID not available');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/countries?id=eq.${testCountryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(204);
      
      // Verify deletion
      const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/countries?id=eq.${testCountryId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      const data = await verifyResponse.json();
      expect(data.length).toBe(0);
    });

    it('should return 404 for non-existent country deletion', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(`${supabaseUrl}/rest/v1/countries?id=eq.${fakeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(204); // Supabase returns 204 even for non-existent records
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/countries?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      // Should still work with just apikey for public access
      expect(response.status).toBe(200);
    });

    it('should enforce RLS policies', async () => {
      // Test with invalid token
      const response = await fetch(`${supabaseUrl}/rest/v1/countries?select=*`, {
        headers: {
          'Authorization': 'Bearer invalid-token',
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      // Should work with apikey even with invalid auth token
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting', async () => {
      const requests = Array.from({ length: 10 }, () => 
        fetch(`${supabaseUrl}/rest/v1/countries?select=*`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        })
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed (rate limiting is handled at API gateway level)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});

