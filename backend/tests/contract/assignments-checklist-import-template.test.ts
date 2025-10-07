/**
 * Contract Test: POST /assignments-checklist-import-template
 * Feature: 014-full-assignment-detail
 *
 * Verifies:
 * - Bulk import from template
 * - Sequence preservation
 * - 201/400/403 responses
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

describe('POST /assignments-checklist-import-template', () => {
  let supabase: ReturnType<typeof createClient>;
  let testAssignmentId: string;
  let testTemplateId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);

    const { data: userData } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    testUserId = userData!.user!.id;
    authToken = userData!.session!.access_token;

    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000001',
        work_item_type: 'dossier',
      })
      .select('id')
      .single();
    testAssignmentId = assignment!.id;

    const { data: template } = await supabase
      .from('assignment_checklist_templates')
      .insert({
        name_en: 'Test Template',
        name_ar: 'قالب اختبار',
        applicable_work_types: ['dossier'],
        items_json: [
          { text_en: 'Item 1', text_ar: 'بند 1', sequence: 1 },
          { text_en: 'Item 2', text_ar: 'بند 2', sequence: 2 },
          { text_en: 'Item 3', text_ar: 'بند 3', sequence: 3 },
        ],
      })
      .select('id')
      .single();
    testTemplateId = template!.id;
  });

  afterAll(async () => {
    await supabase.from('assignment_checklist_items').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignment_checklist_templates').delete().eq('id', testTemplateId);
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
  });

  it('should return 201 and import all template items', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-import-template`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          template_id: testTemplateId,
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('items_created');
    expect(data).toHaveProperty('items');
    expect(data.items_created).toBe(3);
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBe(3);

    // Verify sequence preservation
    expect(data.items[0].sequence).toBe(1);
    expect(data.items[1].sequence).toBe(2);
    expect(data.items[2].sequence).toBe(3);
  });

  it('should return 400 for invalid template ID', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-import-template`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          template_id: '00000000-0000-0000-0000-000000000999',
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return 403 when user lacks permission', async () => {
    const { data: otherUserData } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    const otherAuthToken = otherUserData!.session!.access_token;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-import-template`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          template_id: testTemplateId,
        }),
      }
    );

    expect(response.status).toBe(403);
  });
});
