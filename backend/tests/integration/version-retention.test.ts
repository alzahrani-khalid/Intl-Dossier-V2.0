import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// T080: Integration test for version comparison and retention
describe('Version Comparison and Retention Integration Tests', () => {
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
      await supabase.from('position_versions').delete().eq('position_id', testPositionId);
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should create new version on update', async () => {
    // Create position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Position for Versioning',
        title_ar: 'موقف للإصدارات',
        content_en: 'Original content version 1',
        content_ar: 'المحتوى الأصلي الإصدار 1',
        thematic_category: 'Policy',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    testPositionId = position.id;

    // Create version 1 record
    const { data: version1 } = await supabase
      .from('position_versions')
      .insert({
        position_id: testPositionId,
        version_number: 1,
        content_en: position.content_en,
        content_ar: position.content_ar,
        rationale_en: position.rationale_en,
        rationale_ar: position.rationale_ar,
        full_snapshot: position,
        superseded: false,
        retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    expect(version1.version_number).toBe(1);
    expect(version1.superseded).toBe(false);

    // Update position (creating version 2)
    const { data: updatedPosition } = await supabase
      .from('positions')
      .update({
        content_en: 'Updated content version 2',
        content_ar: 'المحتوى المحدث الإصدار 2',
        version: 2
      })
      .eq('id', testPositionId)
      .select()
      .single();

    expect(updatedPosition.version).toBe(2);

    // Mark version 1 as superseded
    await supabase
      .from('position_versions')
      .update({ superseded: true })
      .eq('position_id', testPositionId)
      .eq('version_number', 1);

    // Create version 2 record
    const { data: version2 } = await supabase
      .from('position_versions')
      .insert({
        position_id: testPositionId,
        version_number: 2,
        content_en: updatedPosition.content_en,
        content_ar: updatedPosition.content_ar,
        full_snapshot: updatedPosition,
        superseded: false,
        retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    expect(version2.version_number).toBe(2);
    expect(version2.superseded).toBe(false);

    // Verify version 1 is marked as superseded
    const { data: supersededVersion } = await supabase
      .from('position_versions')
      .select()
      .eq('position_id', testPositionId)
      .eq('version_number', 1)
      .single();

    expect(supersededVersion.superseded).toBe(true);

    // Verify we have 2 versions
    const { data: allVersions } = await supabase
      .from('position_versions')
      .select()
      .eq('position_id', testPositionId)
      .order('version_number', { ascending: true });

    expect(allVersions).toHaveLength(2);
  });

  it('should calculate 7-year retention_until correctly', async () => {
    // Create position
    const createdAt = new Date();
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Retention Test Position',
        title_ar: 'موقف اختبار الاحتفاظ',
        content_en: 'Content',
        content_ar: 'المحتوى',
        thematic_category: 'Security',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Create version with 7-year retention
    const retentionDate = new Date(createdAt);
    retentionDate.setFullYear(retentionDate.getFullYear() + 7);

    const { data: version } = await supabase
      .from('position_versions')
      .insert({
        position_id: positionId,
        version_number: 1,
        content_en: position.content_en,
        content_ar: position.content_ar,
        full_snapshot: position,
        superseded: false,
        retention_until: retentionDate.toISOString()
      })
      .select()
      .single();

    // Verify retention_until is exactly 7 years from created_at
    const versionCreated = new Date(version.created_at);
    const versionRetention = new Date(version.retention_until);
    const yearsDiff = (versionRetention.getTime() - versionCreated.getTime()) / (365 * 24 * 60 * 60 * 1000);

    expect(yearsDiff).toBeGreaterThanOrEqual(6.99); // Account for leap years
    expect(yearsDiff).toBeLessThanOrEqual(7.01);

    // Cleanup
    await supabase.from('position_versions').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should support version comparison diff generation', async () => {
    // Create position with version 1
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Diff Test Position',
        title_ar: 'موقف اختبار الفرق',
        content_en: 'Original text with some words',
        content_ar: 'نص أصلي مع بعض الكلمات',
        thematic_category: 'Trade',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Create version 1
    await supabase.from('position_versions').insert({
      position_id: positionId,
      version_number: 1,
      content_en: position.content_en,
      content_ar: position.content_ar,
      full_snapshot: position,
      superseded: false,
      retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Update to version 2 with changes
    await supabase
      .from('positions')
      .update({
        content_en: 'Modified text with additional words',
        content_ar: 'نص معدل مع كلمات إضافية',
        version: 2
      })
      .eq('id', positionId);

    // Mark version 1 as superseded
    await supabase
      .from('position_versions')
      .update({ superseded: true })
      .eq('position_id', positionId)
      .eq('version_number', 1);

    // Get updated position
    const { data: updatedPosition } = await supabase
      .from('positions')
      .select()
      .eq('id', positionId)
      .single();

    // Create version 2
    await supabase.from('position_versions').insert({
      position_id: positionId,
      version_number: 2,
      content_en: updatedPosition.content_en,
      content_ar: updatedPosition.content_ar,
      full_snapshot: updatedPosition,
      superseded: false,
      retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Retrieve both versions for comparison
    const { data: versions } = await supabase
      .from('position_versions')
      .select()
      .eq('position_id', positionId)
      .order('version_number', { ascending: true });

    expect(versions).toHaveLength(2);

    // Verify content changed
    expect(versions?.[0].content_en).toBe('Original text with some words');
    expect(versions?.[1].content_en).toBe('Modified text with additional words');

    // Verify Arabic content changed
    expect(versions?.[0].content_ar).toContain('أصلي');
    expect(versions?.[1].content_ar).toContain('معدل');

    // Cleanup
    await supabase.from('position_versions').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should test partitioning by created_at', async () => {
    // Create positions with different creation years (if partitioning is implemented)
    const currentYear = new Date().getFullYear();

    // Create position for current year
    const { data: position2025 } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Position 2025',
        title_ar: 'موقف 2025',
        content_en: 'Content 2025',
        content_ar: 'المحتوى 2025',
        thematic_category: 'Policy',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    // Create version in current year partition
    const { data: version2025 } = await supabase
      .from('position_versions')
      .insert({
        position_id: position2025.id,
        version_number: 1,
        content_en: position2025.content_en,
        content_ar: position2025.content_ar,
        full_snapshot: position2025,
        superseded: false,
        retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    // Verify version created
    expect(version2025.version_number).toBe(1);

    // Verify created_at is in current year
    const createdYear = new Date(version2025.created_at).getFullYear();
    expect(createdYear).toBe(currentYear);

    // Query versions by year (test partition query efficiency)
    const yearStart = new Date(currentYear, 0, 1).toISOString();
    const yearEnd = new Date(currentYear + 1, 0, 1).toISOString();

    const { data: versionsInYear } = await supabase
      .from('position_versions')
      .select()
      .gte('created_at', yearStart)
      .lt('created_at', yearEnd);

    expect(versionsInYear?.length).toBeGreaterThan(0);

    // Cleanup
    await supabase.from('position_versions').delete().eq('position_id', position2025.id);
    await supabase.from('positions').delete().eq('id', position2025.id);
  });
});
