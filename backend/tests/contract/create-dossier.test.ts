/**
 * Contract Test: POST /dossiers (Create)
 * Task: T014
 * Status: MUST FAIL until T021 implemented
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient;
let authToken: string;
const createdDossierIds: string[] = [];

beforeAll(async () => {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // TODO: Authenticate test user
});

afterEach(async () => {
  // Cleanup created dossiers
  for (const id of createdDossierIds) {
    await supabase.from('dossiers').delete().eq('id', id);
  }
  createdDossierIds.length = 0;
});

describe('POST /dossiers - Create', () => {
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/dossiers-create`;

  describe('Request Body Validation', () => {
    it('should create dossier with required fields only', async () => {
      const payload = {
        name_en: 'New Test Dossier',
        name_ar: 'ملف اختبار جديد',
        type: 'theme',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data.id).toBeDefined();
      expect(data.name_en).toBe(payload.name_en);
      expect(data.name_ar).toBe(payload.name_ar);
      expect(data.type).toBe(payload.type);
      expect(data.sensitivity_level).toBe('low'); // Default value
      expect(data.status).toBe('active'); // Default value
      expect(data.version).toBe(1); // Initial version
      expect(data.archived).toBe(false);
      
      createdDossierIds.push(data.id);
    });

    it('should create dossier with all optional fields', async () => {
      const payload = {
        name_en: 'Comprehensive Test Dossier',
        name_ar: 'ملف اختبار شامل',
        type: 'organization',
        sensitivity_level: 'medium',
        summary_en: 'Detailed summary in English',
        summary_ar: 'ملخص مفصل بالعربية',
        tags: ['test', 'multilateral', 'development'],
        review_cadence: 'P90D', // ISO 8601 duration
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data.summary_en).toBe(payload.summary_en);
      expect(data.summary_ar).toBe(payload.summary_ar);
      expect(data.sensitivity_level).toBe(payload.sensitivity_level);
      expect(data.tags).toEqual(payload.tags);
      expect(data.review_cadence).toBeDefined();
      
      createdDossierIds.push(data.id);
    });

    it('should reject missing required field: name_en', async () => {
      const payload = {
        name_ar: 'ملف بدون اسم إنجليزي',
        type: 'theme',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.code).toBe('VALIDATION_ERROR');
      expect(error.error.message_en).toContain('name_en');
    });

    it('should reject missing required field: name_ar', async () => {
      const payload = {
        name_en: 'Dossier without Arabic name',
        type: 'theme',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.message_en).toContain('name_ar');
    });

    it('should reject missing required field: type', async () => {
      const payload = {
        name_en: 'Dossier without type',
        name_ar: 'ملف بدون نوع',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.message_en).toContain('type');
    });

    it('should reject invalid type enum value', async () => {
      const payload = {
        name_en: 'Invalid Type Dossier',
        name_ar: 'ملف نوع غير صالح',
        type: 'invalid_type',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.code).toBe('VALIDATION_ERROR');
      expect(error.error.message_en).toContain('type');
    });

    it('should reject invalid sensitivity_level enum value', async () => {
      const payload = {
        name_en: 'Invalid Sensitivity Dossier',
        name_ar: 'ملف حساسية غير صالحة',
        type: 'theme',
        sensitivity_level: 'critical',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(400);
    });

    it('should reject name_en exceeding max length (200 chars)', async () => {
      const payload = {
        name_en: 'A'.repeat(201),
        name_ar: 'ملف اختبار',
        type: 'theme',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.message_en).toContain('name_en');
      expect(error.error.message_en).toContain('200');
    });

    it('should reject tags array exceeding max items (20)', async () => {
      const payload = {
        name_en: 'Too Many Tags Dossier',
        name_ar: 'ملف بوسوم كثيرة',
        type: 'theme',
        tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.message_en).toContain('tags');
    });
  });

  describe('Response Schema', () => {
    it('should return created dossier with correct structure', async () => {
      const payload = {
        name_en: 'Structure Test Dossier',
        name_ar: 'ملف اختبار البنية',
        type: 'country',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      // All required fields
      expect(data.id).toBeDefined();
      expect(data.name_en).toBeDefined();
      expect(data.name_ar).toBeDefined();
      expect(data.type).toBeDefined();
      expect(data.status).toBeDefined();
      expect(data.sensitivity_level).toBeDefined();
      expect(data.version).toBe(1);
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();
      expect(data.archived).toBe(false);
      expect(data.tags).toBeDefined();
      expect(Array.isArray(data.tags)).toBe(true);
      
      // Timestamps should be valid ISO 8601
      expect(new Date(data.created_at).toISOString()).toBe(data.created_at);
      expect(new Date(data.updated_at).toISOString()).toBe(data.updated_at);
      
      createdDossierIds.push(data.id);
    });

    it('should return 201 Created status code', async () => {
      const payload = {
        name_en: 'Status Code Test',
        name_ar: 'اختبار رمز الحالة',
        type: 'theme',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(201);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      
      const data = await response.json();
      createdDossierIds.push(data.id);
    });
  });

  describe('Auto-Assignment', () => {
    it('should auto-assign creator as dossier owner', async () => {
      const payload = {
        name_en: 'Auto-Assignment Test',
        name_ar: 'اختبار التعيين التلقائي',
        type: 'organization',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(201);
      const dossier = await response.json();
      
      // Verify owner assignment in database
      const { data: owners } = await supabase
        .from('dossier_owners')
        .select('*')
        .eq('dossier_id', dossier.id);
      
      expect(owners).toBeDefined();
      expect(owners!.length).toBeGreaterThan(0);
      expect(owners![0].role_type).toBe('owner');
      
      createdDossierIds.push(dossier.id);
    });
  });

  describe('Authorization & Permissions', () => {
    it('should return 401 Unauthorized without auth token', async () => {
      const payload = {
        name_en: 'Unauthorized Test',
        name_ar: 'اختبار غير مصرح',
        type: 'theme',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error.code).toBe('UNAUTHORIZED');
      expect(error.error.message_en).toBeDefined();
      expect(error.error.message_ar).toBeDefined();
    });

    it('should allow authenticated users to create dossiers', async () => {
      const payload = {
        name_en: 'Authenticated Create Test',
        name_ar: 'اختبار إنشاء مصادق',
        type: 'forum',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      createdDossierIds.push(data.id);
    });
  });

  describe('Bilingual Support', () => {
    it('should store and return bilingual names correctly', async () => {
      const payload = {
        name_en: 'Bilingual Test Dossier',
        name_ar: 'ملف اختبار ثنائي اللغة',
        type: 'country',
        summary_en: 'English summary with special characters: @#$%',
        summary_ar: 'ملخص عربي مع أحرف خاصة: ١٢٣٤٥',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data.name_en).toBe(payload.name_en);
      expect(data.name_ar).toBe(payload.name_ar);
      expect(data.summary_en).toBe(payload.summary_en);
      expect(data.summary_ar).toBe(payload.summary_ar);
      
      createdDossierIds.push(data.id);
    });
  });

  describe('Error Messages', () => {
    it('should return bilingual error messages', async () => {
      const payload = {
        name_en: 'Error Message Test',
        // Missing name_ar
        type: 'theme',
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      
      expect(error.error).toBeDefined();
      expect(error.error.code).toBeDefined();
      expect(error.error.message_en).toBeDefined();
      expect(error.error.message_ar).toBeDefined();
      expect(typeof error.error.message_en).toBe('string');
      expect(typeof error.error.message_ar).toBe('string');
      expect(error.error.message_en.length).toBeGreaterThan(0);
      expect(error.error.message_ar.length).toBeGreaterThan(0);
    });
  });
});
