/**
 * Integration Test: Boolean Operators
 *
 * From quickstart.md Step 2.3
 * This test MUST FAIL until query parser is implemented (T030, T033, T039)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunctionGet } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('Integration: Boolean Operators', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should support AND operator', async () => {
    const queryParams = {
      q: 'climate AND policy',
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.has_boolean_operators).toBe(true);

    // All results should contain both terms
    if (data.results.length > 0) {
      data.results.forEach((r: any) => {
        const text = `${r.title_en} ${r.snippet_en} ${r.title_ar} ${r.snippet_ar}`.toLowerCase();
        expect(text).toContain('climate');
        expect(text).toContain('policy');
      });
    }
  });

  it('should support OR operator', async () => {
    const queryParams = {
      q: 'climate OR weather',
      limit: '20'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.has_boolean_operators).toBe(true);

    // Results should contain at least one term
    if (data.results.length > 0) {
      data.results.forEach((r: any) => {
        const text = `${r.title_en} ${r.snippet_en}`.toLowerCase();
        const hasClimate = text.includes('climate');
        const hasWeather = text.includes('weather');
        expect(hasClimate || hasWeather).toBe(true);
      });
    }
  });

  it('should support complex Boolean expression with parentheses', async () => {
    const queryParams = {
      q: 'climate AND (policy OR treaty)',
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.original).toBe('climate AND (policy OR treaty)');
    expect(data.query.has_boolean_operators).toBe(true);

    // Results should have climate AND (policy OR treaty)
    if (data.results.length > 0) {
      data.results.forEach((r: any) => {
        const text = `${r.title_en} ${r.snippet_en}`.toLowerCase();
        expect(text).toContain('climate');
        const hasPolicyOrTreaty = text.includes('policy') || text.includes('treaty');
        expect(hasPolicyOrTreaty).toBe(true);
      });
    }
  });

  it('should support NOT operator', async () => {
    const queryParams = {
      q: 'climate NOT policy',
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.has_boolean_operators).toBe(true);

    // Results should have climate but NOT policy
    if (data.results.length > 0) {
      data.results.forEach((r: any) => {
        const text = `${r.title_en} ${r.snippet_en}`.toLowerCase();
        expect(text).toContain('climate');
        expect(text).not.toContain('policy');
      });
    }
  });
});
