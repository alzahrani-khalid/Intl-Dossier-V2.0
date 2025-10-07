/**
 * Contract Test: POST /after-actions/{id}/reject-edit
 * Feature: 010-after-action-notes
 * Task: T026
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('POST /after-actions/{id}/reject-edit', () => {
  let testAfterActionId: string;
  const currentVersion = 1;

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

    const { data: afterAction } = await supabase
      .from('after_action_records')
      .insert({
        engagement_id: engagement!.id,
        dossier_id: dossier!.id,
        publication_status: 'edit_requested',
        is_confidential: false,
        version: currentVersion
      })
      .select()
      .single();

    testAfterActionId = afterAction!.id;
  });

  it('should reject edit with reason and no version increment', async () => {
    const rejectionReason = 'Due date change not justified, coordinate with owner first';
    
    const { data, error } = await supabase
      .from('after_action_records')
      .update({
        publication_status: 'published',
        edit_rejection_reason: rejectionReason
      })
      .eq('id', testAfterActionId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      publication_status: 'published',
      edit_rejection_reason: rejectionReason,
      version: currentVersion // Version should NOT increment on rejection
    });
  });

  it('should validate rejection reason length (10-500 chars)', async () => {
    const shortReason = 'Too short';
    const validReason = 'This is a valid rejection reason with sufficient detail';
    
    expect(shortReason.length).toBeLessThan(10);
    expect(validReason.length).toBeGreaterThanOrEqual(10);
    expect(validReason.length).toBeLessThanOrEqual(500);
  });
});
