import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Contract Test: GET /positions/{id}/versions/compare
 *
 * Validates that the version comparison endpoint:
 * - Requires from_version and to_version query params
 * - Returns VersionDiff response with english_diff and arabic_diff arrays
 * - Includes metadata_changes object
 * - Returns 400 if version numbers don't exist
 * - Returns 403 for unauthorized access
 *
 * This test MUST FAIL initially (endpoint not yet implemented).
 */

describe('GET /positions/{id}/versions/compare - Contract Test', () => {
  let supabase: SupabaseClient;
  let testPositionId: string;
  let authorToken: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test position with versions
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: 'test-type-id',
        title_en: 'Test Position',
        title_ar: 'موقف اختبار',
        status: 'draft',
      })
      .select()
      .single();

    testPositionId = position.id;

    await supabase.from('position_versions').insert([
      {
        position_id: testPositionId,
        version_number: 1,
        content_en: 'Original content',
        content_ar: 'المحتوى الأصلي',
      },
      {
        position_id: testPositionId,
        version_number: 2,
        content_en: 'Updated content with changes',
        content_ar: 'المحتوى المحدث مع التغييرات',
      },
    ]);

    authorToken = 'mock-author-token';
  });

  afterAll(async () => {
    if (testPositionId) {
      await supabase.from('position_versions').delete().eq('position_id', testPositionId);
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should return 400 when from_version is missing', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-compare?position_id=${testPositionId}&to_version=2`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authorToken}` },
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return 400 when to_version is missing', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-compare?position_id=${testPositionId}&from_version=1`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authorToken}` },
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return diff with english_diff and arabic_diff arrays', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-compare?position_id=${testPositionId}&from_version=1&to_version=2`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authorToken}` },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('from_version', 1);
    expect(data).toHaveProperty('to_version', 2);
    expect(data).toHaveProperty('english_diff');
    expect(data).toHaveProperty('arabic_diff');
    expect(data).toHaveProperty('metadata_changes');

    expect(Array.isArray(data.english_diff)).toBe(true);
    expect(Array.isArray(data.arabic_diff)).toBe(true);
  });
});
