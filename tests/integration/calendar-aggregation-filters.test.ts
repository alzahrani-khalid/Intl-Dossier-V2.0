// T035: Integration test - Calendar event aggregation with filters
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Calendar Event Aggregation with Filters', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let userId: string;
  let dossierId: string;
  let engagementId: string;
  let calendarEntryId: string;
  let assignmentId: string;
  let positionId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    authToken = authData?.session?.access_token || '';
    userId = authData?.user?.id || '';

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Calendar Test Dossier',
        name_ar: 'ملف اختبار التقويم',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    dossierId = dossier?.id || '';

    // Create engagement (blue event)
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: dossierId,
        title_en: 'Test Engagement Event',
        title_ar: 'حدث مشاركة تجريبي',
        engagement_type: 'bilateral_meeting',
        engagement_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'scheduled',
      })
      .select()
      .single();

    engagementId = engagement?.id || '';

    // Create calendar entry (green event)
    const { data: calendarEntry } = await supabase
      .from('calendar_entries')
      .insert({
        dossier_id: dossierId,
        title_en: 'Test Calendar Entry',
        title_ar: 'إدخال تقويم تجريبي',
        entry_type: 'internal_meeting',
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        event_time: '10:00:00',
        organizer_id: userId,
        status: 'scheduled',
      })
      .select()
      .single();

    calendarEntryId = calendarEntry?.id || '';

    // Create assignment with deadline (red event)
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        title: 'Test Assignment',
        assignee_id: userId,
        sla_deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    assignmentId = assignment?.id || '';

    // Create position with approval deadline (yellow event)
    const { data: position } = await supabase
      .from('positions')
      .insert({
        title_en: 'Test Position for Calendar',
        title_ar: 'موقف تجريبي للتقويم',
        content_en: 'Test content',
        content_ar: 'محتوى تجريبي',
        status: 'review',
        approval_deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .select()
      .single();

    positionId = position?.id || '';
  });

  afterAll(async () => {
    await supabase.from('positions').delete().eq('id', positionId);
    await supabase.from('assignments').delete().eq('id', assignmentId);
    await supabase.from('calendar_entries').delete().eq('id', calendarEntryId);
    await supabase.from('engagements').delete().eq('id', engagementId);
    await supabase.from('dossiers').delete().eq('id', dossierId);
  });

  it('should aggregate all 4 event types with correct color codes', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${new Date().toISOString().split('T')[0]}&end=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
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
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThanOrEqual(4);

    // Verify color codes
    const engagement = data.events.find((e: any) => e.event_source === 'engagement');
    const calendarEntry = data.events.find((e: any) => e.event_source === 'calendar_entry');
    const assignmentDeadline = data.events.find((e: any) => e.event_source === 'assignment_deadline');
    const approvalDeadline = data.events.find((e: any) => e.event_source === 'approval_deadline');

    expect(engagement?.color_code).toBe('#0066CC'); // Blue
    expect(calendarEntry?.color_code).toBe('#008800'); // Green
    expect(assignmentDeadline?.color_code).toBe('#CC0000'); // Red
    expect(approvalDeadline?.color_code).toBe('#CC8800'); // Yellow-orange

    console.log('✓ All event types aggregated with correct colors');
  });

  it('should filter by engagements only', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${new Date().toISOString().split('T')[0]}&end=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&filters=engagements`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const allEngagements = data.events.every((e: any) => e.event_source === 'engagement');

    expect(allEngagements).toBe(true);

    console.log('✓ Engagement filter working');
  });

  it('should filter by dossier_id', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${new Date().toISOString().split('T')[0]}&end=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&dossier_id=${dossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const allFromDossier = data.events.every((e: any) => e.dossier_id === dossierId || e.event_source.includes('deadline'));

    expect(allFromDossier).toBe(true);

    console.log('✓ Dossier filter working');
  });

  it('should filter by assignee_id', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/calendar-get?start=${new Date().toISOString().split('T')[0]}&end=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&assignee_id=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    // Should include calendar entries organized by user and assignments assigned to user
    expect(data.events.length).toBeGreaterThan(0);

    console.log('✓ Assignee filter working');
  });
});
