// T027: Contract test for GET /calendar (unified)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('GET /calendar (unified)', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUserId: string;
  let testDossierId: string;
  let calendarEntryIds: string[] = [];

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
        name_en: 'Test Dossier for Calendar',
        name_ar: 'ملف تجريبي للتقويم',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    testDossierId = dossier?.id || '';

    // Create test calendar entries
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: entries } = await supabase
      .from('calendar_entries')
      .insert([
        {
          dossier_id: testDossierId,
          title_en: 'Internal Meeting',
          title_ar: 'اجتماع داخلي',
          entry_type: 'internal_meeting',
          event_date: today.toISOString().split('T')[0],
          event_time: '10:00:00',
          organizer_id: testUserId,
          status: 'scheduled',
        },
        {
          dossier_id: testDossierId,
          title_en: 'Project Deadline',
          title_ar: 'موعد نهائي للمشروع',
          entry_type: 'deadline',
          event_date: tomorrow.toISOString().split('T')[0],
          all_day: true,
          organizer_id: testUserId,
          status: 'scheduled',
        },
        {
          title_en: 'Training Session',
          title_ar: 'جلسة تدريب',
          entry_type: 'training',
          event_date: nextWeek.toISOString().split('T')[0],
          event_time: '14:00:00',
          duration_minutes: 120,
          organizer_id: testUserId,
          status: 'scheduled',
        },
      ])
      .select();

    if (entries) {
      calendarEntryIds = entries.map(e => e.id);
    }
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('calendar_entries').delete().in('id', calendarEntryIds);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should return 200 with unified calendar events', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('events');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.total_count).toBeGreaterThanOrEqual(3);
  });

  it('should include both engagements and calendar entries', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    // Events should have source field indicating type
    const hasCalendarEntries = data.events.some((e: any) => e.source === 'calendar_entry');
    expect(hasCalendarEntries).toBe(true);
  });

  it('should filter by entry_type', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}&entry_type=deadline`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    const calendarEvents = data.events.filter((e: any) => e.source === 'calendar_entry');
    expect(calendarEvents.every((e: any) => e.entry_type === 'deadline')).toBe(true);
  });

  it('should filter by dossier_id', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}&dossier_id=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    const dossierEvents = data.events.filter((e: any) => e.dossier_id);
    expect(dossierEvents.every((e: any) => e.dossier_id === testDossierId)).toBe(true);
  });

  it('should order events by date ascending', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.events.length > 1) {
      const dates = data.events.map((e: any) => new Date(e.event_date).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i + 1]);
      }
    }
  });

  it('should return 401 when unauthorized', async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(401);
  });

  it('should return 400 for missing date range', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(400);
  });

  it('should support pagination', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}&limit=2&offset=0`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.events.length).toBeLessThanOrEqual(2);
  });

  it('should include bilingual fields', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.events.length > 0) {
      const event = data.events[0];
      // Should have either title_en/title_ar or engagement title fields
      expect(event).toHaveProperty('title_en');
    }
  });

  it('should exclude cancelled events by default', async () => {
    // Create cancelled event
    const { data: cancelledEntry } = await supabase
      .from('calendar_entries')
      .insert({
        title_en: 'Cancelled Meeting',
        title_ar: 'اجتماع ملغى',
        entry_type: 'internal_meeting',
        event_date: new Date().toISOString().split('T')[0],
        organizer_id: testUserId,
        status: 'cancelled',
      })
      .select()
      .single();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const cancelledEvents = data.events.filter((e: any) => e.status === 'cancelled');
    expect(cancelledEvents.length).toBe(0);

    // Cleanup
    if (cancelledEntry) {
      await supabase.from('calendar_entries').delete().eq('id', cancelledEntry.id);
    }
  });
});
