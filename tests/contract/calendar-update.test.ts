// T029: Contract test for PATCH /calendar/{eventType}/{eventId}
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('PATCH /calendar/{eventType}/{eventId}', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUserId: string;
  let testDossierId: string;
  let testEngagementId: string;
  let testCalendarEntryId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    if (authError || !authData.session) {
      throw new Error(`Auth failed: ${authError?.message}`);
    }

    authToken = authData.session.access_token;
    testUserId = authData.user.id;

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Test Dossier for Calendar Reschedule',
        name_ar: 'ملف تجريبي لإعادة جدولة التقويم',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    testDossierId = dossier?.id || '';

    // Create test engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title_en: 'Test Engagement for Reschedule',
        title_ar: 'مشاركة تجريبية لإعادة الجدولة',
        engagement_type: 'bilateral_meeting',
        engagement_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'scheduled',
      })
      .select()
      .single();

    testEngagementId = engagement?.id || '';

    // Create test calendar entry
    const { data: calendarEntry } = await supabase
      .from('calendar_entries')
      .insert({
        dossier_id: testDossierId,
        title_en: 'Test Calendar Entry for Reschedule',
        title_ar: 'إدخال تقويم تجريبي لإعادة الجدولة',
        entry_type: 'internal_meeting',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        event_time: '10:00:00',
        organizer_id: testUserId,
        status: 'scheduled',
      })
      .select()
      .single();

    testCalendarEntryId = calendarEntry?.id || '';
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('engagements').delete().eq('id', testEngagementId);
    await supabase.from('calendar_entries').delete().eq('id', testCalendarEntryId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  describe('Engagement Reschedule', () => {
    it('should return 200 and reschedule engagement successfully', async () => {
      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'engagement',
            event_id: testEngagementId,
            event_date: newDate,
          }),
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('id', testEngagementId);
      expect(data).toHaveProperty('engagement_date', newDate);
    });

    it('should return 401 when unauthorized', async () => {
      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'engagement',
            event_id: testEngagementId,
            event_date: newDate,
          }),
        }
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent engagement', async () => {
      const invalidId = '00000000-0000-0000-0000-000000000000';
      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'engagement',
            event_id: invalidId,
            event_date: newDate,
          }),
        }
      );

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'engagement',
            event_id: testEngagementId,
            event_date: 'invalid-date',
          }),
        }
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Calendar Entry Reschedule', () => {
    it('should return 200 and reschedule calendar entry successfully', async () => {
      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const newTime = '14:30:00';

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'calendar_entry',
            event_id: testCalendarEntryId,
            event_date: newDate,
            event_time: newTime,
          }),
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('id', testCalendarEntryId);
      expect(data).toHaveProperty('event_date', newDate);
      expect(data).toHaveProperty('event_time', newTime);
    });

    it('should allow rescheduling date only (time unchanged)', async () => {
      const newDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'calendar_entry',
            event_id: testCalendarEntryId,
            event_date: newDate,
            // event_time not provided - should keep existing time
          }),
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('event_date', newDate);
      expect(data).toHaveProperty('event_time'); // Should still have a time value
    });

    it('should return 403 when user is not organizer', async () => {
      // Sign in as different user
      const { data: otherUser } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword',
      });

      if (!otherUser?.session) {
        // Skip test if we can't create another user
        return;
      }

      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${otherUser.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'calendar_entry',
            event_id: testCalendarEntryId,
            event_date: newDate,
          }),
        }
      );

      expect(response.status).toBe(403);

      // Sign back in as original test user
      await supabase.auth.signInWithPassword({
        email: 'kazahrani@stats.gov.sa',
        password: 'itisme',
      });
    });

    it('should return 404 for non-existent calendar entry', async () => {
      const invalidId = '00000000-0000-0000-0000-000000000000';
      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'calendar_entry',
            event_id: invalidId,
            event_date: newDate,
          }),
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Event Type Validation', () => {
    it('should return 400 for invalid event_type', async () => {
      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'invalid_type',
            event_id: testEngagementId,
            event_date: newDate,
          }),
        }
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 when event_date is missing', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'engagement',
            event_id: testEngagementId,
            // event_date missing
          }),
        }
      );

      expect(response.status).toBe(400);
    });

    it('should validate time format for calendar entries', async () => {
      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'calendar_entry',
            event_id: testCalendarEntryId,
            event_date: newDate,
            event_time: '25:00:00', // Invalid hour
          }),
        }
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Business Logic', () => {
    it('should update updated_at timestamp', async () => {
      const newDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get current updated_at
      const { data: beforeUpdate } = await supabase
        .from('calendar_entries')
        .select('updated_at')
        .eq('id', testCalendarEntryId)
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'calendar_entry',
            event_id: testCalendarEntryId,
            event_date: newDate,
          }),
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(new Date(data.updated_at).getTime()).toBeGreaterThan(
        new Date(beforeUpdate?.updated_at || 0).getTime()
      );
    });

    it('should preserve other fields when rescheduling', async () => {
      const newDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get current entry details
      const { data: beforeUpdate } = await supabase
        .from('calendar_entries')
        .select('*')
        .eq('id', testCalendarEntryId)
        .single();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'calendar_entry',
            event_id: testCalendarEntryId,
            event_date: newDate,
          }),
        }
      );

      const data = await response.json();

      // Verify other fields are unchanged
      expect(data.title_en).toBe(beforeUpdate?.title_en);
      expect(data.title_ar).toBe(beforeUpdate?.title_ar);
      expect(data.entry_type).toBe(beforeUpdate?.entry_type);
      expect(data.organizer_id).toBe(beforeUpdate?.organizer_id);
      expect(data.dossier_id).toBe(beforeUpdate?.dossier_id);
    });
  });
});
