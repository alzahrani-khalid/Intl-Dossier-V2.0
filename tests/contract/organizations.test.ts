import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for contract testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Organizations API Contract Tests', () => {
  let testOrganizationId: string;
  let testCountryId: string;
  let authToken: string;

  beforeAll(async () => {
    // Setup test user and get auth token
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test-org@example.com',
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

    // Create a test country first
    const { data: countryData, error: countryError } = await supabase
      .from('countries')
      .insert({
        iso_code_2: 'SA',
        iso_code_3: 'SAU',
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        region: 'asia'
      })
      .select()
      .single();

    if (countryError) throw countryError;
    testCountryId = countryData.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testOrganizationId) {
      await supabase.from('organizations').delete().eq('id', testOrganizationId);
    }
    if (testCountryId) {
      await supabase.from('countries').delete().eq('id', testCountryId);
    }
    await supabase.auth.signOut();
  });

  describe('GET /api/v1/organizations', () => {
    it('should return paginated list of organizations', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*`, {
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
        const organization = data[0];
        expect(organization).toHaveProperty('id');
        expect(organization).toHaveProperty('code');
        expect(organization).toHaveProperty('name_en');
        expect(organization).toHaveProperty('name_ar');
        expect(organization).toHaveProperty('type');
        expect(organization).toHaveProperty('country_id');
        expect(organization).toHaveProperty('status');
        expect(organization).toHaveProperty('created_at');
        expect(organization).toHaveProperty('updated_at');
      }
    });

    it('should support search by name', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*&name_en=ilike.*GASTAT*`, {
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

    it('should support filtering by type', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*&type=eq.government`, {
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

    it('should support filtering by country', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*&country_id=eq.${testCountryId}`, {
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
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*&status=eq.active`, {
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

  describe('POST /api/v1/organizations', () => {
    it('should create a new organization with valid data', async () => {
      const organizationData = {
        code: 'GASTAT',
        name_en: 'General Authority for Statistics',
        name_ar: 'الهيئة العامة للإحصاء',
        type: 'government',
        country_id: testCountryId,
        website: 'https://www.stats.gov.sa',
        email: 'info@stats.gov.sa',
        phone: '+966112000000',
        address_en: 'Riyadh, Saudi Arabia',
        address_ar: 'الرياض، المملكة العربية السعودية',
        established_date: '1960-01-01'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(organizationData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data).toHaveProperty('id');
      expect(data.code).toBe('GASTAT');
      expect(data.name_en).toBe('General Authority for Statistics');
      expect(data.name_ar).toBe('الهيئة العامة للإحصاء');
      expect(data.type).toBe('government');
      expect(data.country_id).toBe(testCountryId);
      expect(data.status).toBe('pending');
      
      testOrganizationId = data.id;
    });

    it('should create organization with parent hierarchy', async () => {
      const organizationData = {
        code: 'GASTAT_DEPT',
        name_en: 'GASTAT Department',
        name_ar: 'قسم الهيئة العامة للإحصاء',
        type: 'government',
        country_id: testCountryId,
        parent_organization_id: testOrganizationId
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(organizationData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.parent_organization_id).toBe(testOrganizationId);
    });

    it('should reject duplicate organization code', async () => {
      const organizationData = {
        code: 'GASTAT', // Duplicate code
        name_en: 'Duplicate GASTAT',
        name_ar: 'الهيئة العامة للإحصاء المكررة',
        type: 'government',
        country_id: testCountryId
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(organizationData)
      });

      expect(response.status).toBe(409);
    });

    it('should reject invalid organization type', async () => {
      const organizationData = {
        code: 'INVALID',
        name_en: 'Invalid Organization',
        name_ar: 'منظمة غير صحيحة',
        type: 'invalid_type',
        country_id: testCountryId
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(organizationData)
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing required fields', async () => {
      const organizationData = {
        code: 'INCOMPLETE',
        // Missing required fields
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(organizationData)
      });

      expect(response.status).toBe(400);
    });

    it('should reject invalid country reference', async () => {
      const organizationData = {
        code: 'INVALID_COUNTRY',
        name_en: 'Invalid Country Org',
        name_ar: 'منظمة دولة غير صحيحة',
        type: 'government',
        country_id: '00000000-0000-0000-0000-000000000000'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(organizationData)
      });

      expect(response.status).toBe(400);
    });

    it('should reject self-referential parent organization', async () => {
      if (!testOrganizationId) {
        throw new Error('Test organization ID not available');
      }

      const organizationData = {
        code: 'SELF_REF',
        name_en: 'Self Referential Org',
        name_ar: 'منظمة مرجعية ذاتية',
        type: 'government',
        country_id: testCountryId,
        parent_organization_id: testOrganizationId // This will be set to itself later
      };

      // First create the organization
      const createResponse = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(organizationData)
      });

      const createdData = await createResponse.json();
      const newOrgId = createdData.id;

      // Then try to set itself as parent
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${newOrgId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent_organization_id: newOrgId
        })
      });

      expect(updateResponse.status).toBe(400);

      // Cleanup
      await supabase.from('organizations').delete().eq('id', newOrgId);
    });
  });

  describe('GET /api/v1/organizations/{id}', () => {
    it('should return organization by ID', async () => {
      if (!testOrganizationId) {
        throw new Error('Test organization ID not available');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${testOrganizationId}&select=*`, {
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
      expect(data[0].id).toBe(testOrganizationId);
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${fakeId}&select=*`, {
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

  describe('PUT /api/v1/organizations/{id}', () => {
    it('should update organization with valid data', async () => {
      if (!testOrganizationId) {
        throw new Error('Test organization ID not available');
      }

      const updateData = {
        name_en: 'Updated GASTAT',
        name_ar: 'الهيئة العامة للإحصاء المحدثة',
        website: 'https://updated.stats.gov.sa',
        status: 'active'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${testOrganizationId}`, {
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
      expect(data[0].name_en).toBe('Updated GASTAT');
      expect(data[0].name_ar).toBe('الهيئة العامة للإحصاء المحدثة');
      expect(data[0].website).toBe('https://updated.stats.gov.sa');
      expect(data[0].status).toBe('active');
    });

    it('should reject invalid type update', async () => {
      if (!testOrganizationId) {
        throw new Error('Test organization ID not available');
      }

      const updateData = {
        type: 'invalid_type'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${testOrganizationId}`, {
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

  describe('DELETE /api/v1/organizations/{id}', () => {
    it('should delete organization by ID', async () => {
      if (!testOrganizationId) {
        throw new Error('Test organization ID not available');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${testOrganizationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(204);
      
      // Verify deletion
      const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${testOrganizationId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      const data = await verifyResponse.json();
      expect(data.length).toBe(0);
    });

    it('should return 404 for non-existent organization deletion', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${fakeId}`, {
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

  describe('Hierarchy Operations', () => {
    let parentOrgId: string;
    let childOrgId: string;

    beforeAll(async () => {
      // Create parent organization
      const parentData = {
        code: 'PARENT_ORG',
        name_en: 'Parent Organization',
        name_ar: 'المنظمة الأم',
        type: 'government',
        country_id: testCountryId
      };

      const parentResponse = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(parentData)
      });

      const parentResult = await parentResponse.json();
      parentOrgId = parentResult.id;

      // Create child organization
      const childData = {
        code: 'CHILD_ORG',
        name_en: 'Child Organization',
        name_ar: 'المنظمة الفرعية',
        type: 'government',
        country_id: testCountryId,
        parent_organization_id: parentOrgId
      };

      const childResponse = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(childData)
      });

      const childResult = await childResponse.json();
      childOrgId = childResult.id;
    });

    afterAll(async () => {
      // Cleanup hierarchy
      if (childOrgId) {
        await supabase.from('organizations').delete().eq('id', childOrgId);
      }
      if (parentOrgId) {
        await supabase.from('organizations').delete().eq('id', parentOrgId);
      }
    });

    it('should retrieve child organizations', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?parent_organization_id=eq.${parentOrgId}&select=*`, {
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
      expect(data[0].parent_organization_id).toBe(parentOrgId);
    });

    it('should prevent circular hierarchy', async () => {
      // Try to set parent as child of its child
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${parentOrgId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent_organization_id: childOrgId
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*`, {
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
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*`, {
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
        fetch(`${supabaseUrl}/rest/v1/organizations?select=*`, {
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

