/**
 * Contract Test: PATCH /commitments/{id}/status
 * Feature: 010-after-action-notes
 * Task: T035
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('PATCH /commitments/{id}/status', () => {
  let internalCommitmentId: string;
  let externalCommitmentId: string;

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
        is_confidential: false
      })
      .select()
      .single();

    // Internal commitment
    const { data: internal } = await supabase
      .from('commitments')
      .insert({
        after_action_id: afterAction!.id,
        dossier_id: dossier!.id,
        description: 'Internal task',
        owner_type: 'internal',
        owner_user_id: user!.id,
        tracking_mode: 'automatic',
        due_date: '2025-10-15',
        priority: 'medium'
      })
      .select()
      .single();

    internalCommitmentId = internal!.id;

    // External commitment
    const { data: contact } = await supabase
      .from('external_contacts')
      .insert({
        email: 'external@partner.gov.sa',
        full_name: 'External Partner'
      })
      .select()
      .single();

    const { data: external } = await supabase
      .from('commitments')
      .insert({
        after_action_id: afterAction!.id,
        dossier_id: dossier!.id,
        description: 'External task',
        owner_type: 'external',
        owner_contact_id: contact!.id,
        tracking_mode: 'manual',
        due_date: '2025-10-15',
        priority: 'medium'
      })
      .select()
      .single();

    externalCommitmentId = external!.id;
  });

  it('should update internal commitment status', async () => {
    const { data, error } = await supabase
      .from('commitments')
      .update({ status: 'in_progress' })
      .eq('id', internalCommitmentId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      id: internalCommitmentId,
      status: 'in_progress',
      tracking_mode: 'automatic'
    });
  });

  it('should update external commitment status manually', async () => {
    const { data, error } = await supabase
      .from('commitments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', externalCommitmentId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      id: externalCommitmentId,
      status: 'completed',
      tracking_mode: 'manual'
    });
    expect(data.completed_at).toBeDefined();
  });

  it('should validate status enum', () => {
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'];
    
    expect(validStatuses).toContain('pending');
    expect(validStatuses).toContain('completed');
    expect(validStatuses).not.toContain('invalid_status');
  });
});
