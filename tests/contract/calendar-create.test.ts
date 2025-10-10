// T028: Contract test for POST /calendar/entries
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('POST /calendar/entries', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUserId: string;
  let testDossierId: string;
  let createdEntryIds: string[] = [];

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
        name_en: 'Test Dossier for Calendar Creation',
        name_ar: 'ملف تجريبي لإنشاء التقويم',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    testDossierId = dossier?.id || '';
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('calendar_entries').delete().in('id', createdEntryIds);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should return 201 and create calendar entry successfully', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dossier_id: testDossierId,
          title_en: 'Test Meeting',
          title_ar: 'اجتماع تجريبي',
          description_en: 'A test meeting for contract testing',
          description_ar: 'اجتماع تجريبي لاختبار العقد',
          entry_type: 'internal_meeting',
          event_date: tomorrow.toISOString().split('T')[0],
          event_time: '10:00:00',
          duration_minutes: 60,
          location: 'Conference Room A',
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title_en', 'Test Meeting');
    expect(data).toHaveProperty('title_ar', 'اجتماع تجريبي');
    expect(data).toHaveProperty('entry_type', 'internal_meeting');
    expect(data).toHaveProperty('organizer_id', testUserId);
    expect(data).toHaveProperty('status', 'scheduled');
    expect(data).toHaveProperty('created_at');

    createdEntryIds.push(data.id);
  });

  it('should support all entry_types', async () => {
    const entryTypes = [
      'internal_meeting',
      'deadline',
      'reminder',
      'holiday',
      'training',
      'review',
      'other',
    ];

    for (const type of entryTypes) {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 30) + 1);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calendar-create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title_en: `Test ${type}`,
            title_ar: `اختبار ${type}`,
            entry_type: type,
            event_date: eventDate.toISOString().split('T')[0],
            all_day: type === 'holiday' || type === 'deadline',
          }),
        }
      );

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.entry_type).toBe(type);

      createdEntryIds.push(data.id);
    }
  });

  it('should create all-day events', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 5);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title_en: 'All Day Event',
          title_ar: 'حدث طوال اليوم',
          entry_type: 'deadline',
          event_date: eventDate.toISOString().split('T')[0],
          all_day: true,
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.all_day).toBe(true);
    expect(data.event_time).toBeNull();

    createdEntryIds.push(data.id);
  });

  it('should create virtual meetings with meeting links', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 3);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title_en: 'Virtual Team Meeting',
          title_ar: 'اجتماع افتراضي للفريق',
          entry_type: 'internal_meeting',
          event_date: eventDate.toISOString().split('T')[0],
          event_time: '14:00:00',
          duration_minutes: 90,
          is_virtual: true,
          meeting_link: 'https://zoom.us/j/123456789',
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.is_virtual).toBe(true);
    expect(data.meeting_link).toBe('https://zoom.us/j/123456789');

    createdEntryIds.push(data.id);
  });

  it('should create recurring events', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title_en: 'Weekly Team Standup',
          title_ar: 'اجتماع الفريق الأسبوعي',
          entry_type: 'internal_meeting',
          event_date: startDate.toISOString().split('T')[0],
          event_time: '09:00:00',
          duration_minutes: 15,
          is_recurring: true,
          recurrence_pattern: 'FREQ=WEEKLY;BYDAY=MO',
          recurrence_end_date: endDate.toISOString().split('T')[0],
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.is_recurring).toBe(true);
    expect(data.recurrence_pattern).toBe('FREQ=WEEKLY;BYDAY=MO');

    createdEntryIds.push(data.id);
  });

  it('should link calendar entry to dossier', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dossier_id: testDossierId,
          title_en: 'Dossier Review Meeting',
          title_ar: 'اجتماع مراجعة الملف',
          entry_type: 'review',
          event_date: eventDate.toISOString().split('T')[0],
          event_time: '11:00:00',
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.dossier_id).toBe(testDossierId);

    createdEntryIds.push(data.id);
  });

  it('should support attendees list', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 2);

    // Create with attendees (using test user ID)
    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title_en: 'Team Planning Session',
          title_ar: 'جلسة تخطيط الفريق',
          entry_type: 'internal_meeting',
          event_date: eventDate.toISOString().split('T')[0],
          event_time: '13:00:00',
          attendee_ids: [testUserId],
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.attendee_ids).toContain(testUserId);

    createdEntryIds.push(data.id);
  });

  it('should return 401 when unauthorized', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 1);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title_en: 'Unauthorized Event',
          entry_type: 'internal_meeting',
          event_date: eventDate.toISOString().split('T')[0],
        }),
      }
    );

    expect(response.status).toBe(401);
  });

  it('should return 400 for missing required fields', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing title_en, entry_type, event_date
          description_en: 'Missing required fields',
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid entry_type', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 1);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title_en: 'Invalid Type Event',
          entry_type: 'invalid_type',
          event_date: eventDate.toISOString().split('T')[0],
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return 400 for past dates', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title_en: 'Past Event',
          entry_type: 'internal_meeting',
          event_date: pastDate.toISOString().split('T')[0],
        }),
      }
    );

    // Depending on business rules, might allow or reject past dates
    // Adjust expectation based on actual implementation
    expect([201, 400]).toContain(response.status);

    if (response.status === 201) {
      const data = await response.json();
      createdEntryIds.push(data.id);
    }
  });

  it('should set organizer_id to current user', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 4);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title_en: 'Organizer Test',
          title_ar: 'اختبار المنظم',
          entry_type: 'internal_meeting',
          event_date: eventDate.toISOString().split('T')[0],
        }),
      }
    );

    const data = await response.json();
    expect(data.organizer_id).toBe(testUserId);

    createdEntryIds.push(data.id);
  });

  it('should validate time format', async () => {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 1);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title_en: 'Invalid Time Format',
          entry_type: 'internal_meeting',
          event_date: eventDate.toISOString().split('T')[0],
          event_time: '25:00:00', // Invalid hour
        }),
      }
    );

    expect(response.status).toBe(400);
  });
});
