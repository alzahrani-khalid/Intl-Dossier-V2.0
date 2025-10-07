import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('PATCH /assignments-workflow-stage-update/:assignmentId', () => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let testAssignmentId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user and assignment
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-kanban@example.com',
      password: 'test123',
      email_confirm: true
    });
    testUserId = user.user!.id;

    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        title: 'Test Assignment',
        workflow_stage: 'todo',
        priority: 'medium'
      })
      .select('id')
      .single();
    testAssignmentId = assignment!.id;
  });

  afterAll(async () => {
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  it('should return 200 and update workflow stage', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/assignments-workflow-stage-update/${testAssignmentId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_stage: 'in_progress',
          triggered_by_user_id: testUserId
        })
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.assignment.workflow_stage).toBe('in_progress');
    expect(data.assignment.current_stage_sla_deadline).toBeDefined();
  });

  it('should return 403 for invalid role-based transition', async () => {
    // Reset to todo
    await supabase
      .from('assignments')
      .update({ workflow_stage: 'todo' })
      .eq('id', testAssignmentId);

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/assignments-workflow-stage-update/${testAssignmentId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_stage: 'done', // Skip stages (staff not allowed)
          triggered_by_user_id: testUserId
        })
      }
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.validation_error).toBeDefined();
  });

  it('should return 404 for non-existent assignment', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/assignments-workflow-stage-update/00000000-0000-0000-0000-000000000000`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_stage: 'in_progress',
          triggered_by_user_id: testUserId
        })
      }
    );

    expect(response.status).toBe(404);
  });
});
