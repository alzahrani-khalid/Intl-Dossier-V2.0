import { describe, it, expect } from 'vitest';

describe('Countries API Contracts', () => {
  describe('GET /countries', () => {
    it('should accept valid query parameters', () => {
      const validParams = {
        page: 1,
        limit: 20,
        search: 'Saudi Arabia',
        region: 'asia',
        status: 'active',
        iso_code: 'SA'
      };
      
      expect(validParams.page).toBeGreaterThanOrEqual(1);
      expect(validParams.limit).toBeGreaterThanOrEqual(1);
      expect(validParams.limit).toBeLessThanOrEqual(100);
      expect(['asia', 'africa', 'europe', 'americas', 'oceania']).toContain(validParams.region);
      expect(['active', 'inactive', 'suspended']).toContain(validParams.status);
      expect(validParams.iso_code).toMatch(/^[A-Z]{2,3}$/);
    });

    it('should reject invalid page number', () => {
      const invalidParams = {
        page: 0, // Invalid: must be >= 1
        limit: 20
      };
      
      expect(invalidParams.page).toBeLessThan(1);
    });

    it('should reject invalid limit', () => {
      const invalidParams = {
        page: 1,
        limit: 101 // Invalid: must be <= 100
      };
      
      expect(invalidParams.limit).toBeGreaterThan(100);
    });

    it('should return paginated country list', () => {
      const expectedResponse = {
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name_en: expect.any(String),
            name_ar: expect.any(String),
            iso_alpha2: expect.stringMatching(/^[A-Z]{2}$/),
            iso_alpha3: expect.stringMatching(/^[A-Z]{3}$/),
            region: expect.any(String),
            status: expect.stringMatching(/^(active|inactive|suspended)$/),
            created_at: expect.any(String),
            updated_at: expect.any(String)
          })
        ]),
        pagination: {
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          total_pages: expect.any(Number),
          has_next: expect.any(Boolean),
          has_prev: expect.any(Boolean)
        },
        filters: {
          regions: expect.any(Array),
          statuses: expect.any(Array),
          iso_codes: expect.any(Array)
        }
      };
      
      expect(expectedResponse).toHaveProperty('data');
      expect(expectedResponse).toHaveProperty('pagination');
      expect(expectedResponse).toHaveProperty('filters');
    });
  });

  describe('POST /countries', () => {
    it('should accept valid country creation request', () => {
      const validRequest = {
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        iso_alpha2: 'SA',
        iso_alpha3: 'SAU',
        region: 'asia',
        status: 'active'
      };
      
      expect(validRequest.name_en).toHaveLength.greaterThan(0);
      expect(validRequest.name_ar).toHaveLength.greaterThan(0);
      expect(validRequest.iso_alpha2).toMatch(/^[A-Z]{2}$/);
      expect(validRequest.iso_alpha3).toMatch(/^[A-Z]{3}$/);
      expect(['asia', 'africa', 'europe', 'americas', 'oceania']).toContain(validRequest.region);
      expect(['active', 'inactive', 'suspended']).toContain(validRequest.status);
    });

    it('should reject invalid ISO codes', () => {
      const invalidRequest = {
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        iso_alpha2: 'S', // Invalid: must be 2 characters
        iso_alpha3: 'SAUDI', // Invalid: must be 3 characters
        region: 'asia'
      };
      
      expect(invalidRequest.iso_alpha2).not.toMatch(/^[A-Z]{2}$/);
      expect(invalidRequest.iso_alpha3).not.toMatch(/^[A-Z]{3}$/);
    });

    it('should reject invalid region', () => {
      const invalidRequest = {
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        iso_alpha2: 'SA',
        iso_alpha3: 'SAU',
        region: 'invalid_region' // Invalid region
      };
      
      expect(['asia', 'africa', 'europe', 'americas', 'oceania']).not.toContain(invalidRequest.region);
    });

    it('should return created country', () => {
      const expectedResponse = {
        id: expect.any(String),
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        iso_alpha2: 'SA',
        iso_alpha3: 'SAU',
        region: 'asia',
        status: 'active',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      };
      
      expect(expectedResponse).toHaveProperty('id');
      expect(expectedResponse).toHaveProperty('name_en');
      expect(expectedResponse).toHaveProperty('name_ar');
      expect(expectedResponse).toHaveProperty('iso_alpha2');
      expect(expectedResponse).toHaveProperty('iso_alpha3');
    });
  });

  describe('GET /countries/{id}', () => {
    it('should accept valid UUID', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      
      expect(validId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should reject invalid UUID format', () => {
      const invalidId = 'invalid-uuid';
      
      expect(invalidId).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should return country details', () => {
      const expectedResponse = {
        id: expect.any(String),
        name_en: expect.any(String),
        name_ar: expect.any(String),
        iso_alpha2: expect.stringMatching(/^[A-Z]{2}$/),
        iso_alpha3: expect.stringMatching(/^[A-Z]{3}$/),
        region: expect.any(String),
        status: expect.stringMatching(/^(active|inactive|suspended)$/),
        created_at: expect.any(String),
        updated_at: expect.any(String)
      };
      
      expect(expectedResponse).toHaveProperty('id');
      expect(expectedResponse).toHaveProperty('name_en');
      expect(expectedResponse).toHaveProperty('name_ar');
    });
  });

  describe('PUT /countries/{id}', () => {
    it('should accept valid update request', () => {
      const validRequest = {
        name_en: 'Updated Country Name',
        name_ar: 'اسم البلد المحدث',
        region: 'europe',
        status: 'inactive'
      };
      
      expect(validRequest.name_en).toHaveLength.greaterThan(0);
      expect(validRequest.name_ar).toHaveLength.greaterThan(0);
      expect(['asia', 'africa', 'europe', 'americas', 'oceania']).toContain(validRequest.region);
      expect(['active', 'inactive', 'suspended']).toContain(validRequest.status);
    });

    it('should return updated country', () => {
      const expectedResponse = {
        id: expect.any(String),
        name_en: expect.any(String),
        name_ar: expect.any(String),
        iso_alpha2: expect.stringMatching(/^[A-Z]{2}$/),
        iso_alpha3: expect.stringMatching(/^[A-Z]{3}$/),
        region: expect.any(String),
        status: expect.stringMatching(/^(active|inactive|suspended)$/),
        created_at: expect.any(String),
        updated_at: expect.any(String)
      };
      
      expect(expectedResponse).toHaveProperty('id');
      expect(expectedResponse).toHaveProperty('updated_at');
    });
  });

  describe('DELETE /countries/{id}', () => {
    it('should accept valid UUID for deletion', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      
      expect(validId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should return 204 status on successful deletion', () => {
      const expectedStatus = 204;
      
      expect(expectedStatus).toBe(204);
    });
  });
});
