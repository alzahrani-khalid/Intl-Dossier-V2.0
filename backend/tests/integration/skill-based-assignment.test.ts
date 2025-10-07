/**
 * Integration Test: Skill-Based Auto-Assignment
 *
 * Validates Scenario 1 from quickstart.md:
 * - Creates work item requiring specific skills
 * - Verifies staff with best skill match is assigned
 * - Validates weighted scoring algorithm (40pts skills, 30pts capacity, 20pts availability, 10pts unit)
 *
 * @see specs/013-assignment-engine-sla/quickstart.md#scenario-1
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Integration: Skill-Based Auto-Assignment', () => {
  let testOrgUnitId: string;
  let testSkillArabicId: string;
  let testSkillWritingId: string;
  let testStaff1Id: string; // Has Arabic + Writing skills
  let testStaff2Id: string; // Has Arabic skill only
  let testUser1Id: string;
  let testUser2Id: string;

  beforeAll(async () => {
    // Create test organizational unit
    const { data: orgUnit, error: orgError } = await supabase
      .from('organizational_units')
      .insert({
        name_ar: 'وحدة الترجمة الاختبارية',
        name_en: 'Test Translation Unit',
        unit_wip_limit: 20,
      })
      .select()
      .single();

    if (orgError) throw orgError;
    testOrgUnitId = orgUnit.id;

    // Create test skills
    const { data: skillArabic, error: skillError1 } = await supabase
      .from('skills')
      .insert({
        name_ar: 'ترجمة عربي-إنجليزي (اختبار)',
        name_en: 'Arabic-English Translation (Test)',
        category: 'languages',
      })
      .select()
      .single();

    if (skillError1) throw skillError1;
    testSkillArabicId = skillArabic.id;

    const { data: skillWriting, error: skillError2 } = await supabase
      .from('skills')
      .insert({
        name_ar: 'كتابة تقنية (اختبار)',
        name_en: 'Technical Writing (Test)',
        category: 'technical',
      })
      .select()
      .single();

    if (skillError2) throw skillError2;
    testSkillWritingId = skillWriting.id;

    // Create test users
    const { data: user1, error: userError1 } = await supabase.auth.admin.createUser({
      email: `test-translator-1-${Date.now()}@gastat.test`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError1) throw userError1;
    testUser1Id = user1.user.id;

    const { data: user2, error: userError2 } = await supabase.auth.admin.createUser({
      email: `test-translator-2-${Date.now()}@gastat.test`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError2) throw userError2;
    testUser2Id = user2.user.id;

    // Create test staff profiles
    const { data: staff1, error: staffError1 } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: testUser1Id,
        unit_id: testOrgUnitId,
        skills: [testSkillArabicId, testSkillWritingId], // 2 skills
        individual_wip_limit: 5,
        current_assignment_count: 0,
        availability_status: 'available',
        role: 'staff',
      })
      .select()
      .single();

    if (staffError1) throw staffError1;
    testStaff1Id = staff1.id;

    const { data: staff2, error: staffError2 } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: testUser2Id,
        unit_id: testOrgUnitId,
        skills: [testSkillArabicId], // 1 skill only
        individual_wip_limit: 5,
        current_assignment_count: 0,
        availability_status: 'available',
        role: 'staff',
      })
      .select()
      .single();

    if (staffError2) throw staffError2;
    testStaff2Id = staff2.id;
  });

  afterAll(async () => {
    // Clean up in reverse order to respect foreign keys
    await supabase.from('assignments').delete().eq('assignee_id', testUser1Id);
    await supabase.from('assignments').delete().eq('assignee_id', testUser2Id);
    await supabase.from('staff_profiles').delete().eq('id', testStaff1Id);
    await supabase.from('staff_profiles').delete().eq('id', testStaff2Id);
    await supabase.auth.admin.deleteUser(testUser1Id);
    await supabase.auth.admin.deleteUser(testUser2Id);
    await supabase.from('skills').delete().eq('id', testSkillArabicId);
    await supabase.from('skills').delete().eq('id', testSkillWritingId);
    await supabase.from('organizational_units').delete().eq('id', testOrgUnitId);
  });

  beforeEach(async () => {
    // Reset assignment counts before each test
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 0 })
      .in('id', [testStaff1Id, testStaff2Id]);

    // Delete any test assignments
    await supabase.from('assignments').delete().like('work_item_id', 'test-ticket-%');
    await supabase.from('assignment_queue').delete().like('work_item_id', 'test-ticket-%');
  });

  it('should assign work item to staff with best skill match', async () => {
    // Call auto-assignment endpoint
    const { data, error } = await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: `test-ticket-${Date.now()}`,
        work_item_type: 'ticket',
        required_skills: [testSkillArabicId],
        priority: 'normal',
      },
    });

    if (error) throw error;

    // Verify response
    expect(data).toBeDefined();
    expect(data.assignment_id).toBeDefined();
    expect(data.assignee_id).toBe(testUser1Id); // Staff 1 has more skills, higher score
    expect(data.status).toBe('assigned');
    expect(data.sla_deadline).toBeDefined();

    // Verify assignment created in database
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', data.assignment_id)
      .single();

    if (assignmentError) throw assignmentError;

    expect(assignment.assignee_id).toBe(testUser1Id);
    expect(assignment.priority).toBe('normal');
    expect(assignment.status).toBe('assigned');

    // Verify SLA deadline is 48 hours from now (normal priority ticket)
    const assignedAt = new Date(assignment.assigned_at);
    const slaDeadline = new Date(assignment.sla_deadline);
    const hoursDiff = (slaDeadline.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
    expect(hoursDiff).toBeCloseTo(48, 1); // Within 1 hour tolerance

    // Verify assignment count incremented
    const { data: updatedStaff } = await supabase
      .from('staff_profiles')
      .select('current_assignment_count')
      .eq('id', testStaff1Id)
      .single();

    expect(updatedStaff?.current_assignment_count).toBe(1);
  });

  it('should prefer staff with more matching skills (weighted scoring)', async () => {
    // Both staff have Arabic skill, but staff 1 also has Writing skill
    // Staff 1 should score higher even though both meet minimum requirements

    const { data, error } = await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: `test-ticket-scoring-${Date.now()}`,
        work_item_type: 'ticket',
        required_skills: [testSkillArabicId], // Only requires Arabic
        priority: 'normal',
      },
    });

    if (error) throw error;

    // Staff 1 should be chosen due to higher skill score (has additional writing skill)
    expect(data.assignee_id).toBe(testUser1Id);
  });

  it('should assign to staff with lower capacity utilization when skills equal', async () => {
    // Pre-assign 2 items to staff 1 (40% utilization)
    await supabase.from('staff_profiles').update({ current_assignment_count: 2 }).eq('id', testStaff1Id);

    // Pre-assign 1 item to staff 2 (20% utilization)
    await supabase.from('staff_profiles').update({ current_assignment_count: 1 }).eq('id', testStaff2Id);

    // Create work item requiring only Arabic skill (both staff qualified)
    const { data, error } = await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: `test-ticket-capacity-${Date.now()}`,
        work_item_type: 'ticket',
        required_skills: [testSkillArabicId],
        priority: 'normal',
      },
    });

    if (error) throw error;

    // Staff 2 should be chosen due to lower capacity utilization
    // Even though staff 1 has more skills, capacity weight (30pts) influences the decision
    expect(data.assignee_id).toBe(testUser2Id);
  });

  it('should disqualify unavailable staff from assignment', async () => {
    // Set staff 1 to unavailable
    await supabase
      .from('staff_profiles')
      .update({ availability_status: 'unavailable' })
      .eq('id', testStaff1Id);

    const { data, error } = await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: `test-ticket-unavailable-${Date.now()}`,
        work_item_type: 'ticket',
        required_skills: [testSkillArabicId],
        priority: 'normal',
      },
    });

    if (error) throw error;

    // Staff 2 should be assigned (staff 1 disqualified due to unavailability)
    expect(data.assignee_id).toBe(testUser2Id);

    // Reset availability for other tests
    await supabase
      .from('staff_profiles')
      .update({ availability_status: 'available' })
      .eq('id', testStaff1Id);
  });

  it('should calculate SLA deadlines correctly based on priority', async () => {
    const testCases = [
      { priority: 'urgent', expectedHours: 2.0 },
      { priority: 'high', expectedHours: 24.0 },
      { priority: 'normal', expectedHours: 48.0 },
    ];

    for (const testCase of testCases) {
      const { data, error } = await supabase.functions.invoke('assignments-auto-assign', {
        body: {
          work_item_id: `test-ticket-sla-${testCase.priority}-${Date.now()}`,
          work_item_type: 'ticket',
          required_skills: [testSkillArabicId],
          priority: testCase.priority,
        },
      });

      if (error) throw error;

      // Verify SLA deadline matches expected hours
      const { data: assignment } = await supabase
        .from('assignments')
        .select('assigned_at, sla_deadline')
        .eq('id', data.assignment_id)
        .single();

      const assignedAt = new Date(assignment!.assigned_at);
      const slaDeadline = new Date(assignment!.sla_deadline);
      const hoursDiff = (slaDeadline.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeCloseTo(testCase.expectedHours, 0.1);
    }
  });
});
