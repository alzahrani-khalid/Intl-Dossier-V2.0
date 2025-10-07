/**
 * Contract Test: POST /engagements
 * Feature: 010-after-action-notes
 * Task: T016
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('POST /engagements', () => {
  let testDossierId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test dossier and assign user
    const { data: { user } } = await supabase.auth.getUser();
    testUserId = user!.id;
    
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier', dossier_type: 'project', status: 'active' })
      .select()
      .single();
    testDossierId = dossier!.id;

    await supabase
      .from('dossier_owners')
      .insert({ dossier_id: testDossierId, user_id: testUserId });
  });

  it('should create engagement with valid request', async () => {
    const requestBody = {
      dossier_id: testDossierId,
      title: 'Q1 Kickoff Meeting',
      engagement_type: 'meeting',
      engagement_date: new Date().toISOString(),
      location: 'Conference Room A',
      description: 'Quarterly planning session'
    };

    const { data, error, status } = await supabase
      .from('engagements')
      .insert(requestBody)
      .select()
      .single();

    expect(status).toBe(201);
    expect(error).toBeNull();
    expect(data).toMatchObject({
      dossier_id: testDossierId,
      title: 'Q1 Kickoff Meeting',
      engagement_type: 'meeting'
    });
    expect(data.id).toBeDefined();
    expect(data.created_at).toBeDefined();
  });

  it('should reject invalid engagement type', async () => {
    const requestBody = {
      dossier_id: testDossierId,
      title: 'Test Meeting',
      engagement_type: 'invalid_type',
      engagement_date: new Date().toISOString()
    };

    const { error } = await supabase
      .from('engagements')
      .insert(requestBody);

    expect(error).toBeDefined();
    expect(error?.message).toContain('engagement_type');
  });

  it('should reject unauthorized dossier access', async () => {
    // Create a dossier not assigned to current user
    const { data: unownedDossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Unowned Dossier', dossier_type: 'project', status: 'active' })
      .select()
      .single();

    const requestBody = {
      dossier_id: unownedDossier!.id,
      title: 'Unauthorized Meeting',
      engagement_type: 'meeting',
      engagement_date: new Date().toISOString()
    };

    const { error } = await supabase
      .from('engagements')
      .insert(requestBody);

    // Should fail due to RLS policy
    expect(error).toBeDefined();
  });
});
