import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Contract Test: GET /positions/{id}/versions
 *
 * Validates that the version history endpoint:
 * - Returns array of Version schema objects
 * - Versions ordered by version_number DESC (newest first)
 * - Includes version metadata (author, created_at, superseded status)
 * - Returns 404 for non-existent position
 * - Returns 403 for unauthorized access
 *
 * This test MUST FAIL initially (endpoint not yet implemented).
 */

describe('GET /positions/{id}/versions - Contract Test', () => {
  let supabase: SupabaseClient;
  let testPositionId: string;
  let authorToken: string;
  let unauthorizedToken: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: 'test-type-id',
        title_en: 'Test Position with Versions',
        title_ar: 'موقف اختبار مع الإصدارات',
        content_en: 'Initial content',
        content_ar: 'المحتوى الأولي',
        status: 'draft',
        version: 3,
      })
      .select()
      .single();

    testPositionId = position.id;

    // Create 3 versions
    await supabase.from('position_versions').insert([
      {
        position_id: testPositionId,
        version_number: 1,
        content_en: 'Version 1 content',
        content_ar: 'محتوى الإصدار 1',
        full_snapshot: { title_en: 'V1 Title' },
        superseded: true,
      },
      {
        position_id: testPositionId,
        version_number: 2,
        content_en: 'Version 2 content',
        content_ar: 'محتوى الإصدار 2',
        full_snapshot: { title_en: 'V2 Title' },
        superseded: true,
      },
      {
        position_id: testPositionId,
        version_number: 3,
        content_en: 'Version 3 content',
        content_ar: 'محتوى الإصدار 3',
        full_snapshot: { title_en: 'V3 Title' },
        superseded: false,
      },
    ]);

    authorToken = 'mock-author-token';
    unauthorizedToken = 'mock-unauthorized-token';
  });

  afterAll(async () => {
    // Cleanup test data
    if (testPositionId) {
      await supabase
        .from('position_versions')
        .delete()
        .eq('position_id', testPositionId);

      await supabase
        .from('positions')
        .delete()
        .eq('id', testPositionId);
    }
  });

  it('should return 404 for non-existent position', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-list?position_id=00000000-0000-0000-0000-000000000000`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authorToken}`,
        },
      }
    );

    expect(response.status).toBe(404);
  });

  it('should return 403 for unauthorized access', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-list?position_id=${testPositionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${unauthorizedToken}`,
        },
      }
    );

    expect(response.status).toBe(403);
  });

  it('should return array of versions ordered by version_number DESC', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-list?position_id=${testPositionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authorToken}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // Validate response is an array
    expect(Array.isArray(data.versions)).toBe(true);
    expect(data.versions.length).toBe(3);

    // Validate ordering (newest first)
    expect(data.versions[0].version_number).toBe(3);
    expect(data.versions[1].version_number).toBe(2);
    expect(data.versions[2].version_number).toBe(1);
  });

  it('should include version metadata in response', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-list?position_id=${testPositionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authorToken}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    const version = data.versions[0];

    // Validate Version schema
    expect(version).toHaveProperty('id');
    expect(version).toHaveProperty('position_id', testPositionId);
    expect(version).toHaveProperty('version_number');
    expect(version).toHaveProperty('content_en');
    expect(version).toHaveProperty('content_ar');
    expect(version).toHaveProperty('full_snapshot');
    expect(version).toHaveProperty('author_id');
    expect(version).toHaveProperty('superseded');
    expect(version).toHaveProperty('created_at');
    expect(version).toHaveProperty('retention_until');
  });

  it('should mark current version as not superseded', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-list?position_id=${testPositionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authorToken}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // Current version (v3) should not be superseded
    const currentVersion = data.versions.find((v: any) => v.version_number === 3);
    expect(currentVersion.superseded).toBe(false);

    // Older versions should be superseded
    const olderVersion = data.versions.find((v: any) => v.version_number === 1);
    expect(olderVersion.superseded).toBe(true);
  });

  it('should support pagination with limit parameter', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-list?position_id=${testPositionId}&limit=2`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authorToken}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.versions.length).toBe(2);
    expect(data).toHaveProperty('total', 3);
    expect(data).toHaveProperty('has_more', true);
  });

  it('should support pagination with offset parameter', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-versions-list?position_id=${testPositionId}&offset=1&limit=2`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authorToken}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.versions.length).toBe(2);
    expect(data.versions[0].version_number).toBe(2);
    expect(data.versions[1].version_number).toBe(1);
  });
});
