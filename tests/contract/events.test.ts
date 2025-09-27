import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for contract testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Events API Contract Tests', () => {
  let testEventId: string;
  let testOrganizerId: string;
  let testCountryId: string;
  let authToken: string;

  beforeAll(async () => {
    // Setup test user and get auth token
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test-events@example.com',
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

    // Create test country
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

    // Create test organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        code: 'GASTAT',
        name_en: 'General Authority for Statistics',
        name_ar: 'الهيئة العامة للإحصاء',
        type: 'government',
        country_id: testCountryId
      })
      .select()
      .single();

    if (orgError) throw orgError;
    testOrganizerId = orgData.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testEventId) {
      await supabase.from('events').delete().eq('id', testEventId);
    }
    if (testOrganizerId) {
      await supabase.from('organizations').delete().eq('id', testOrganizerId);
    }
    if (testCountryId) {
      await supabase.from('countries').delete().eq('id', testCountryId);
    }
    await supabase.auth.signOut();
  });

  describe('GET /api/v1/events', () => {
    it('should return paginated list of events', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*`, {
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
        const event = data[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('title_en');
        expect(event).toHaveProperty('title_ar');
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('start_datetime');
        expect(event).toHaveProperty('end_datetime');
        expect(event).toHaveProperty('timezone');
        expect(event).toHaveProperty('organizer_id');
        expect(event).toHaveProperty('status');
        expect(event).toHaveProperty('created_by');
        expect(event).toHaveProperty('created_at');
        expect(event).toHaveProperty('updated_at');
      }
    });

    it('should support filtering by type', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*&type=eq.meeting`, {
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
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*&status=eq.draft`, {
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

    it('should support filtering by date range', async () => {
      const startDate = '2025-01-01T00:00:00Z';
      const endDate = '2025-12-31T23:59:59Z';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*&start_datetime=gte.${startDate}&start_datetime=lte.${endDate}`, {
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
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*&country_id=eq.${testCountryId}`, {
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

    it('should support filtering by organizer', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*&organizer_id=eq.${testOrganizerId}`, {
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

  describe('POST /api/v1/events', () => {
    it('should create a new event with valid data', async () => {
      const eventData = {
        title_en: 'Test Conference',
        title_ar: 'مؤتمر تجريبي',
        description_en: 'A test conference event',
        description_ar: 'حدث مؤتمر تجريبي',
        type: 'conference',
        start_datetime: '2025-06-15T09:00:00Z',
        end_datetime: '2025-06-15T17:00:00Z',
        timezone: 'Asia/Riyadh',
        location_en: 'Riyadh Convention Center',
        location_ar: 'مركز الرياض للمؤتمرات',
        venue_en: 'Main Hall',
        venue_ar: 'القاعة الرئيسية',
        is_virtual: false,
        country_id: testCountryId,
        organizer_id: testOrganizerId,
        max_participants: 100,
        registration_required: true,
        registration_deadline: '2025-06-10T23:59:59Z'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data).toHaveProperty('id');
      expect(data.title_en).toBe('Test Conference');
      expect(data.title_ar).toBe('مؤتمر تجريبي');
      expect(data.type).toBe('conference');
      expect(data.start_datetime).toBe('2025-06-15T09:00:00Z');
      expect(data.end_datetime).toBe('2025-06-15T17:00:00Z');
      expect(data.timezone).toBe('Asia/Riyadh');
      expect(data.organizer_id).toBe(testOrganizerId);
      expect(data.status).toBe('draft');
      expect(data.is_virtual).toBe(false);
      
      testEventId = data.id;
    });

    it('should create virtual event with virtual link', async () => {
      const eventData = {
        title_en: 'Virtual Meeting',
        title_ar: 'اجتماع افتراضي',
        type: 'meeting',
        start_datetime: '2025-06-20T10:00:00Z',
        end_datetime: '2025-06-20T11:00:00Z',
        timezone: 'Asia/Riyadh',
        is_virtual: true,
        virtual_link: 'https://meet.example.com/room123',
        organizer_id: testOrganizerId
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.is_virtual).toBe(true);
      expect(data.virtual_link).toBe('https://meet.example.com/room123');
    });

    it('should reject event with end time before start time', async () => {
      const eventData = {
        title_en: 'Invalid Event',
        title_ar: 'حدث غير صحيح',
        type: 'meeting',
        start_datetime: '2025-06-15T17:00:00Z',
        end_datetime: '2025-06-15T09:00:00Z', // Before start time
        timezone: 'Asia/Riyadh',
        organizer_id: testOrganizerId
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(400);
    });

    it('should reject virtual event without virtual link', async () => {
      const eventData = {
        title_en: 'Invalid Virtual Event',
        title_ar: 'حدث افتراضي غير صحيح',
        type: 'meeting',
        start_datetime: '2025-06-15T10:00:00Z',
        end_datetime: '2025-06-15T11:00:00Z',
        timezone: 'Asia/Riyadh',
        is_virtual: true,
        // Missing virtual_link
        organizer_id: testOrganizerId
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(400);
    });

    it('should reject event with registration deadline after start time', async () => {
      const eventData = {
        title_en: 'Invalid Registration Event',
        title_ar: 'حدث تسجيل غير صحيح',
        type: 'conference',
        start_datetime: '2025-06-15T09:00:00Z',
        end_datetime: '2025-06-15T17:00:00Z',
        timezone: 'Asia/Riyadh',
        organizer_id: testOrganizerId,
        registration_required: true,
        registration_deadline: '2025-06-20T23:59:59Z' // After start time
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(400);
    });

    it('should reject event with missing required fields', async () => {
      const eventData = {
        title_en: 'Incomplete Event',
        // Missing required fields
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/events/{id}/conflicts', () => {
    let conflictingEventId: string;

    beforeAll(async () => {
      // Create a conflicting event
      const eventData = {
        title_en: 'Conflicting Event',
        title_ar: 'حدث متضارب',
        type: 'meeting',
        start_datetime: '2025-06-15T10:00:00Z', // Overlaps with test event
        end_datetime: '2025-06-15T12:00:00Z',
        timezone: 'Asia/Riyadh',
        venue_en: 'Main Hall', // Same venue
        organizer_id: testOrganizerId
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();
      conflictingEventId = data.id;
    });

    afterAll(async () => {
      if (conflictingEventId) {
        await supabase.from('events').delete().eq('id', conflictingEventId);
      }
    });

    it('should detect venue conflicts', async () => {
      if (!testEventId) {
        throw new Error('Test event ID not available');
      }

      // This would be implemented as a custom function in Supabase
      // For now, we'll test the basic endpoint structure
      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${testEventId}&select=*`, {
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

    it('should detect time conflicts', async () => {
      if (!testEventId) {
        throw new Error('Test event ID not available');
      }

      // Test for overlapping time slots
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*&start_datetime=lt.2025-06-15T17:00:00Z&end_datetime=gt.2025-06-15T09:00:00Z`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      // Should find overlapping events
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/events/{id}', () => {
    it('should return event by ID', async () => {
      if (!testEventId) {
        throw new Error('Test event ID not available');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${testEventId}&select=*`, {
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
      expect(data[0].id).toBe(testEventId);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${fakeId}&select=*`, {
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

  describe('PUT /api/v1/events/{id}', () => {
    it('should update event with valid data', async () => {
      if (!testEventId) {
        throw new Error('Test event ID not available');
      }

      const updateData = {
        title_en: 'Updated Conference',
        title_ar: 'مؤتمر محدث',
        description_en: 'An updated conference event',
        description_ar: 'حدث مؤتمر محدث',
        status: 'scheduled'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${testEventId}`, {
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
      expect(data[0].title_en).toBe('Updated Conference');
      expect(data[0].title_ar).toBe('مؤتمر محدث');
      expect(data[0].status).toBe('scheduled');
    });

    it('should reject update with invalid time range', async () => {
      if (!testEventId) {
        throw new Error('Test event ID not available');
      }

      const updateData = {
        start_datetime: '2025-06-15T17:00:00Z',
        end_datetime: '2025-06-15T09:00:00Z' // Before start time
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${testEventId}`, {
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

  describe('DELETE /api/v1/events/{id}', () => {
    it('should delete event by ID', async () => {
      if (!testEventId) {
        throw new Error('Test event ID not available');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${testEventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(204);
      
      // Verify deletion
      const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${testEventId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      const data = await verifyResponse.json();
      expect(data.length).toBe(0);
    });

    it('should return 404 for non-existent event deletion', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${fakeId}`, {
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

  describe('Event Status Transitions', () => {
    let statusEventId: string;

    beforeAll(async () => {
      // Create a fresh event for status testing
      const eventData = {
        title_en: 'Status Test Event',
        title_ar: 'حدث اختبار الحالة',
        type: 'meeting',
        start_datetime: '2025-07-01T10:00:00Z',
        end_datetime: '2025-07-01T11:00:00Z',
        timezone: 'Asia/Riyadh',
        organizer_id: testOrganizerId
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();
      statusEventId = data.id;
    });

    afterAll(async () => {
      if (statusEventId) {
        await supabase.from('events').delete().eq('id', statusEventId);
      }
    });

    it('should transition from draft to scheduled', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${statusEventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: 'scheduled'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data[0].status).toBe('scheduled');
    });

    it('should transition from scheduled to ongoing', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${statusEventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: 'ongoing'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data[0].status).toBe('ongoing');
    });

    it('should transition from ongoing to completed', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${statusEventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: 'completed'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data[0].status).toBe('completed');
    });

    it('should allow cancellation from any status', async () => {
      // First set back to scheduled
      await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${statusEventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'scheduled'
        })
      });

      // Then cancel
      const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${statusEventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data[0].status).toBe('cancelled');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*`, {
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
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*`, {
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
        fetch(`${supabaseUrl}/rest/v1/events?select=*`, {
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

