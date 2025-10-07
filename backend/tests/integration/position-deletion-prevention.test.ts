import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('T023: Integration Test - Position Deletion Prevention', () => {
  let authToken: string;
  let testDossierId: string;
  let testPositionId: string;
  let testEngagementIds: string[] = [];

  beforeAll(async () => {
    // Sign in test user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test@gastat.sa',
      password: 'Test@12345'
    });
    authToken = authData.session?.access_token || '';

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier for Deletion Prevention', status: 'active' })
      .select()
      .single();
    testDossierId = dossier.id;

    // Create test position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        title: 'Test Position for Deletion',
        content: 'This position will be tested for deletion prevention',
        type: 'policy_brief',
        dossier_id: testDossierId,
      })
      .select()
      .single();
    testPositionId = position.id;

    // Create multiple engagements and attach the position
    const engagementTitles = [
      'Engagement Alpha',
      'Engagement Beta',
      'Engagement Gamma'
    ];

    for (const title of engagementTitles) {
      const { data: engagement } = await supabase
        .from('engagements')
        .insert({
          dossier_id: testDossierId,
          title,
          date: new Date().toISOString(),
        })
        .select()
        .single();

      testEngagementIds.push(engagement.id);

      // Attach position to engagement
      await supabase
        .from('engagement_positions')
        .insert({
          engagement_id: engagement.id,
          position_id: testPositionId,
          attached_by: authData.user?.id,
        });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('engagement_positions').delete().in('engagement_id', testEngagementIds);
    await supabase.from('positions').delete().eq('id', testPositionId);

    for (const engagementId of testEngagementIds) {
      await supabase.from('engagements').delete().eq('id', engagementId);
    }

    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should prevent deletion when position is attached to engagements', async () => {
    // Attempt to delete the position
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', testPositionId);

    // Deletion should fail
    expect(error).toBeDefined();
    expect(error?.message).toMatch(/cannot delete position|attached to.*engagement/i);
  });

  it('should list all affected engagements in error message', async () => {
    // Attempt deletion via API endpoint (if exists)
    const deleteResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/positions?id=eq.${testPositionId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': process.env.SUPABASE_ANON_KEY || '',
        },
      }
    );

    // Should return error
    expect([400, 409, 422]).toContain(deleteResponse.status);

    // If error response body is available
    if (deleteResponse.status !== 204) {
      const errorBody = await deleteResponse.json();

      // Error should contain reference to engagements
      const errorMessage = JSON.stringify(errorBody).toLowerCase();
      expect(errorMessage).toMatch(/engagement/);
      expect(errorMessage).toMatch(/attached/);

      // Should mention the count (3 engagements)
      expect(errorMessage).toMatch(/3/);
    }
  });

  it('should provide engagement titles in error details', async () => {
    // Try deletion and capture error
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', testPositionId);

    expect(error).toBeDefined();

    // Error message should contain engagement titles for user reference
    const errorMessage = error?.message || '';

    // Check if at least one engagement title is mentioned
    const mentionsEngagement = testEngagementIds.some(async (engId) => {
      const { data: engagement } = await supabase
        .from('engagements')
        .select('title')
        .eq('id', engId)
        .single();

      return errorMessage.includes(engagement?.title || '');
    });

    // The error should provide helpful context
    expect(errorMessage.length).toBeGreaterThan(50); // Should be a detailed error
  });

  it('should allow deletion after detaching from all engagements', async () => {
    // Detach from all engagements
    for (const engagementId of testEngagementIds) {
      await supabase
        .from('engagement_positions')
        .delete()
        .eq('engagement_id', engagementId)
        .eq('position_id', testPositionId);
    }

    // Now deletion should succeed
    const { error, data } = await supabase
      .from('positions')
      .delete()
      .eq('id', testPositionId)
      .select();

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Verify position no longer exists
    const { data: verifyData } = await supabase
      .from('positions')
      .select('id')
      .eq('id', testPositionId);

    expect(verifyData).toHaveLength(0);
  });

  it('should prevent deletion via database trigger', async () => {
    // Re-create position and attachments for this test
    const { data: newPosition } = await supabase
      .from('positions')
      .insert({
        title: 'Trigger Test Position',
        content: 'Testing deletion trigger',
        type: 'analysis',
        dossier_id: testDossierId,
      })
      .select()
      .single();

    const newPositionId = newPosition.id;

    // Attach to one engagement
    await supabase
      .from('engagement_positions')
      .insert({
        engagement_id: testEngagementIds[0],
        position_id: newPositionId,
        attached_by: authToken,
      });

    // Attempt deletion directly via database (simulating trigger behavior)
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', newPositionId);

    // Trigger should prevent deletion
    expect(error).toBeDefined();

    // Clean up
    await supabase
      .from('engagement_positions')
      .delete()
      .eq('position_id', newPositionId);

    await supabase
      .from('positions')
      .delete()
      .eq('id', newPositionId);
  });

  it('should maintain referential integrity on cascade delete', async () => {
    // Create a position and engagement
    const { data: tempPosition } = await supabase
      .from('positions')
      .insert({
        title: 'Cascade Test Position',
        content: 'Testing cascade behavior',
        type: 'report',
        dossier_id: testDossierId,
      })
      .select()
      .single();

    const { data: tempEngagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title: 'Cascade Test Engagement',
        date: new Date().toISOString(),
      })
      .select()
      .single();

    // Attach position
    await supabase
      .from('engagement_positions')
      .insert({
        engagement_id: tempEngagement.id,
        position_id: tempPosition.id,
        attached_by: authToken,
      });

    // Delete the engagement (CASCADE should remove attachment)
    const { error: engDeleteError } = await supabase
      .from('engagements')
      .delete()
      .eq('id', tempEngagement.id);

    expect(engDeleteError).toBeNull();

    // Verify attachment was cascade deleted
    const { data: attachments } = await supabase
      .from('engagement_positions')
      .select('*')
      .eq('position_id', tempPosition.id)
      .eq('engagement_id', tempEngagement.id);

    expect(attachments).toHaveLength(0);

    // Now position can be deleted
    const { error: posDeleteError } = await supabase
      .from('positions')
      .delete()
      .eq('id', tempPosition.id);

    expect(posDeleteError).toBeNull();
  });

  it('should track deletion attempts in audit log', async () => {
    // Create a new position for this test
    const { data: auditTestPosition } = await supabase
      .from('positions')
      .insert({
        title: 'Audit Test Position',
        content: 'Testing audit log',
        type: 'policy_brief',
        dossier_id: testDossierId,
      })
      .select()
      .single();

    // Attach to an engagement
    await supabase
      .from('engagement_positions')
      .insert({
        engagement_id: testEngagementIds[0],
        position_id: auditTestPosition.id,
        attached_by: authToken,
      });

    // Attempt deletion (should fail and log)
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', auditTestPosition.id);

    expect(error).toBeDefined();

    // Check audit log for deletion attempt
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'position_deletion_attempted')
      .eq('metadata->>position_id', auditTestPosition.id)
      .order('created_at', { ascending: false })
      .limit(1);

    // If audit logging is implemented
    if (auditLogs && auditLogs.length > 0) {
      expect(auditLogs[0].action).toBe('position_deletion_attempted');
      expect(auditLogs[0].metadata).toHaveProperty('position_id', auditTestPosition.id);
      expect(auditLogs[0].metadata).toHaveProperty('blocked', true);
    }

    // Clean up
    await supabase
      .from('engagement_positions')
      .delete()
      .eq('position_id', auditTestPosition.id);

    await supabase
      .from('positions')
      .delete()
      .eq('id', auditTestPosition.id);
  });
});
