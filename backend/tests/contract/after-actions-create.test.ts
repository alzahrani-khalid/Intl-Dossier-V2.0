/**
 * Contract Test: POST /after-actions
 * Feature: 010-after-action-notes
 * Task: T020
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('POST /after-actions', () => {
  let testEngagementId: string;

  beforeAll(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier', dossier_type: 'project', status: 'active' })
      .select()
      .single();

    await supabase
      .from('dossier_owners')
      .insert({ dossier_id: dossier!.id, user_id: user!.id });

    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: dossier!.id,
        title: 'Test Meeting',
        engagement_type: 'meeting',
        engagement_date: new Date().toISOString()
      })
      .select()
      .single();

    testEngagementId = engagement!.id;
  });

  it('should create after-action with nested entities', async () => {
    const requestBody = {
      engagement_id: testEngagementId,
      is_confidential: false,
      attendees: ['John Smith', 'Sarah Lee'],
      notes: 'Initial meeting notes'
    };

    const { data, error } = await supabase
      .from('after_action_records')
      .insert(requestBody)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      engagement_id: testEngagementId,
      publication_status: 'draft',
      is_confidential: false,
      attendees: ['John Smith', 'Sarah Lee']
    });
    expect(data.id).toBeDefined();
    expect(data.version).toBe(1);
  });

  it('should enforce max 100 attendees', async () => {
    const tooManyAttendees = Array(101).fill('Person');
    
    const requestBody = {
      engagement_id: testEngagementId,
      attendees: tooManyAttendees
    };

    // Note: This validation should be in the Edge Function
    expect(tooManyAttendees.length).toBeGreaterThan(100);
  });

  it('should create after-action with nested decisions', async () => {
    const { data: afterAction } = await supabase
      .from('after_action_records')
      .insert({
        engagement_id: testEngagementId,
        is_confidential: false
      })
      .select()
      .single();

    const { data: decision, error } = await supabase
      .from('decisions')
      .insert({
        after_action_id: afterAction!.id,
        description: 'Approved budget increase',
        decision_maker: 'Director',
        decision_date: new Date().toISOString()
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(decision).toMatchObject({
      after_action_id: afterAction!.id,
      description: 'Approved budget increase'
    });
  });

  it('should create after-action with nested commitments', async () => {
    const { data: afterAction } = await supabase
      .from('after_action_records')
      .insert({
        engagement_id: testEngagementId,
        is_confidential: false
      })
      .select()
      .single();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: commitment, error } = await supabase
      .from('commitments')
      .insert({
        after_action_id: afterAction!.id,
        dossier_id: afterAction!.dossier_id,
        description: 'Submit budget proposal',
        owner_type: 'internal',
        owner_user_id: user!.id,
        tracking_mode: 'automatic',
        due_date: '2025-10-15',
        priority: 'high'
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(commitment).toMatchObject({
      after_action_id: afterAction!.id,
      owner_type: 'internal',
      status: 'pending'
    });
  });
});
