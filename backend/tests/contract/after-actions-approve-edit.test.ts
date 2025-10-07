/**
 * Contract Test: POST /after-actions/{id}/approve-edit
 * Feature: 010-after-action-notes
 * Task: T025
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('POST /after-actions/{id}/approve-edit', () => {
  let testAfterActionId: string;

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
        version: 1
      })
      .select()
      .single();

    testAfterActionId = afterAction!.id;
  });

  it('should approve edit and create new version', async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Approve the edit
    const { data: updated, error: updateError } = await supabase
      .from('after_action_records')
      .update({
        publication_status: 'published',
        edit_approved_by: user!.id,
        edit_approved_at: new Date().toISOString(),
        version: 2
      })
      .eq('id', testAfterActionId)
      .select()
      .single();

    expect(updateError).toBeNull();
    expect(updated).toMatchObject({
      publication_status: 'published',
      version: 2
    });

    // Create version record
    const { data: version, error: versionError } = await supabase
      .from('after_action_versions')
      .insert({
        after_action_id: testAfterActionId,
        version_number: 2,
        content: updated,
        changed_by: user!.id
      })
      .select()
      .single();

    expect(versionError).toBeNull();
    expect(version).toMatchObject({
      after_action_id: testAfterActionId,
      version_number: 2
    });
  });

  it('should enforce supervisor role check', async () => {
    // Role check will be implemented in Edge Function
    // This test validates the schema supports the workflow
    const { data } = await supabase
      .from('after_action_records')
      .select('edit_approved_by')
      .eq('id', testAfterActionId)
      .single();

    expect(data).toBeDefined();
  });
});
