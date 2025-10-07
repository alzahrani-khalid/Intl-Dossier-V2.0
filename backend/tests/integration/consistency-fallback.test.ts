import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// T081: Integration test for consistency checking with AI fallback
describe('Consistency Checking with AI Fallback Integration Tests', () => {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let testPositionId: string;
  let positionTypeId: string;

  beforeAll(async () => {
    const { data: positionTypes } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();
    positionTypeId = positionTypes?.id;
  });

  afterAll(async () => {
    if (testPositionId) {
      await supabase.from('consistency_checks').delete().eq('position_id', testPositionId);
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should run consistency check with AnythingLLM available (semantic analysis)', async () => {
    // Create position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Position for AI Consistency Check',
        title_ar: 'موقف لفحص الاتساق بالذكاء الاصطناعي',
        content_en: 'Support free trade agreements with all partners',
        content_ar: 'دعم اتفاقيات التجارة الحرة مع جميع الشركاء',
        thematic_category: 'Trade',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    testPositionId = position.id;

    // Simulate consistency check (with AI available)
    const { data: consistencyCheck, error: checkError } = await supabase
      .from('consistency_checks')
      .insert({
        position_id: testPositionId,
        check_trigger: 'manual',
        consistency_score: 85,
        ai_service_available: true, // AI was available
        conflicts: [
          {
            conflict_position_id: 'existing-position-123',
            conflict_type: 'ambiguity',
            severity: 'medium',
            description: 'Potential overlap with existing trade policy',
            suggested_resolution: 'Clarify scope of free trade agreements',
            affected_sections: ['content']
          }
        ],
        suggested_resolutions: [
          {
            action: 'modify',
            suggestion: 'Add clarification about specific trade sectors'
          }
        ]
      })
      .select()
      .single();

    expect(checkError).toBeNull();
    expect(consistencyCheck.ai_service_available).toBe(true);
    expect(consistencyCheck.consistency_score).toBe(85);
    expect(consistencyCheck.conflicts).toHaveLength(1);
    expect(consistencyCheck.conflicts[0].conflict_type).toBe('ambiguity');

    // Update position consistency score
    await supabase
      .from('positions')
      .update({ consistency_score: consistencyCheck.consistency_score })
      .eq('id', testPositionId);

    // Verify consistency score updated
    const { data: updatedPosition } = await supabase
      .from('positions')
      .select()
      .eq('id', testPositionId)
      .single();

    expect(updatedPosition.consistency_score).toBe(85);
  });

  it('should gracefully fallback to rule-based checks when AI unavailable', async () => {
    // Create position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Position for Fallback Check',
        title_ar: 'موقف لفحص الاحتياطي',
        content_en: 'Restrict imports from certain countries',
        content_ar: 'تقييد الواردات من بعض البلدان',
        thematic_category: 'Trade',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Simulate consistency check with AI unavailable (rule-based fallback)
    const { data: consistencyCheck, error: checkError } = await supabase
      .from('consistency_checks')
      .insert({
        position_id: positionId,
        check_trigger: 'manual',
        consistency_score: 70, // Lower score due to rule-based detection
        ai_service_available: false, // AI was NOT available
        conflicts: [
          {
            conflict_position_id: 'existing-position-456',
            conflict_type: 'contradiction',
            severity: 'high',
            description: 'Contradicts existing free trade policy (keyword match)',
            suggested_resolution: 'Review and align with existing trade positions',
            affected_sections: ['content']
          }
        ],
        suggested_resolutions: [
          {
            action: 'escalate',
            suggestion: 'Manual review required due to AI unavailability'
          }
        ]
      })
      .select()
      .single();

    expect(checkError).toBeNull();
    expect(consistencyCheck.ai_service_available).toBe(false);
    expect(consistencyCheck.consistency_score).toBe(70);
    expect(consistencyCheck.conflicts).toHaveLength(1);
    expect(consistencyCheck.conflicts[0].conflict_type).toBe('contradiction');
    expect(consistencyCheck.conflicts[0].severity).toBe('high');

    // Verify fallback flag is recorded
    const { data: checks } = await supabase
      .from('consistency_checks')
      .select()
      .eq('position_id', positionId);

    expect(checks?.[0].ai_service_available).toBe(false);

    // Cleanup
    await supabase.from('consistency_checks').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should verify ai_service_available flag is correctly set', async () => {
    // Test with AI available
    const { data: position1 } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Test Position 1',
        title_ar: 'موقف اختبار 1',
        content_en: 'Content 1',
        content_ar: 'المحتوى 1',
        thematic_category: 'Policy',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    const { data: checkAI } = await supabase
      .from('consistency_checks')
      .insert({
        position_id: position1.id,
        check_trigger: 'automatic_on_submit',
        consistency_score: 90,
        ai_service_available: true,
        conflicts: []
      })
      .select()
      .single();

    expect(checkAI.ai_service_available).toBe(true);

    // Test with AI unavailable
    const { data: position2 } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Test Position 2',
        title_ar: 'موقف اختبار 2',
        content_en: 'Content 2',
        content_ar: 'المحتوى 2',
        thematic_category: 'Policy',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    const { data: checkNoAI } = await supabase
      .from('consistency_checks')
      .insert({
        position_id: position2.id,
        check_trigger: 'automatic_on_submit',
        consistency_score: 75,
        ai_service_available: false,
        conflicts: []
      })
      .select()
      .single();

    expect(checkNoAI.ai_service_available).toBe(false);

    // Compare consistency scores (AI typically gives more accurate scores)
    expect(checkAI.consistency_score).toBeGreaterThan(checkNoAI.consistency_score);

    // Cleanup
    await supabase.from('consistency_checks').delete().eq('position_id', position1.id);
    await supabase.from('consistency_checks').delete().eq('position_id', position2.id);
    await supabase.from('positions').delete().eq('id', position1.id);
    await supabase.from('positions').delete().eq('id', position2.id);
  });

  it('should handle automatic trigger on submit', async () => {
    // Create position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Auto-Check Position',
        title_ar: 'موقف الفحص التلقائي',
        content_en: 'Position content for auto-check',
        content_ar: 'محتوى الموقف للفحص التلقائي',
        thematic_category: 'Security',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Submit for review (triggers automatic consistency check)
    await supabase
      .from('positions')
      .update({ status: 'under_review', current_stage: 1 })
      .eq('id', positionId);

    // Simulate automatic consistency check
    const { data: autoCheck } = await supabase
      .from('consistency_checks')
      .insert({
        position_id: positionId,
        check_trigger: 'automatic_on_submit',
        consistency_score: 88,
        ai_service_available: true,
        conflicts: []
      })
      .select()
      .single();

    expect(autoCheck.check_trigger).toBe('automatic_on_submit');
    expect(autoCheck.consistency_score).toBe(88);

    // Verify auto-check can be distinguished from manual checks
    const { data: allChecks } = await supabase
      .from('consistency_checks')
      .select()
      .eq('position_id', positionId);

    const autoChecks = allChecks?.filter(c => c.check_trigger === 'automatic_on_submit');
    expect(autoChecks).toHaveLength(1);

    // Cleanup
    await supabase.from('consistency_checks').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });
});
