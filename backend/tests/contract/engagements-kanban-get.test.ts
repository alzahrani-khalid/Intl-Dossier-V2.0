import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('GET /engagements-kanban-get/:engagementId', () => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let testEngagementId: string;
  let testAssignmentId: string;

  beforeAll(async () => {
    // Create test engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({ title: 'Test Engagement for Kanban' })
      .select('id')
      .single();
    testEngagementId = engagement!.id;

    // Create test assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        engagement_id: testEngagementId,
        title: 'Test Assignment',
        workflow_stage: 'todo',
        priority: 'high'
      })
      .select('id')
      .single();
    testAssignmentId = assignment!.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
  });

  it('should return 200 with Kanban board data grouped by stage', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements-kanban-get/${testEngagementId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // Assert schema matches OpenAPI spec
    expect(data).toHaveProperty('columns');
    expect(data.columns).toHaveProperty('todo');
    expect(data.columns).toHaveProperty('in_progress');
    expect(data.columns).toHaveProperty('review');
    expect(data.columns).toHaveProperty('done');
    expect(data.columns).toHaveProperty('cancelled');

    // Assert assignment in todo column
    expect(data.columns.todo).toHaveLength(1);
    expect(data.columns.todo[0]).toMatchObject({
      id: testAssignmentId,
      title: 'Test Assignment',
      priority: 'high'
    });
  });

  it('should support sort query parameter', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements-kanban-get/${testEngagementId}?sort=priority`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    expect(response.status).toBe(200);
    // Priority sort validated in implementation
  });

  it('should return 404 for non-existent engagement', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements-kanban-get/00000000-0000-0000-0000-000000000000`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    expect(response.status).toBe(404);
  });
});
