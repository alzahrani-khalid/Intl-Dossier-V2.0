/**
 * Integration Test: Bilingual Search (Arabic)
 *
 * From quickstart.md Step 2.2
 * This test MUST FAIL until search service is implemented (T029, T033, T039)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunctionGet } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('Integration: Bilingual Search (Arabic)', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should search in Arabic and detect language', async () => {
    const queryParams = {
      q: 'مناخ', // "climate" in Arabic
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.language_detected).toBe('ar');
  });

  it('should return Arabic snippets with <mark> tags', async () => {
    const queryParams = {
      q: 'مناخ',
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.results.length > 0) {
      const resultWithArabicSnippet = data.results.find(
        (r: any) => r.snippet_ar && r.snippet_ar.includes('<mark>')
      );

      // At least one result should have highlighted Arabic snippet
      expect(resultWithArabicSnippet).toBeDefined();
    }
  });

  it('should return both Arabic and English titled results', async () => {
    const queryParams = {
      q: 'مناخ',
      limit: '20'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.results.length > 0) {
      // Should have bilingual results
      const hasArabicTitle = data.results.some((r: any) =>
        r.title_ar && r.title_ar.trim().length > 0
      );
      const hasEnglishTitle = data.results.some((r: any) =>
        r.title_en && r.title_en.trim().length > 0
      );

      expect(hasArabicTitle).toBe(true);
      expect(hasEnglishTitle).toBe(true);
    }
  });
});
