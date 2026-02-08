/**
 * Terminology Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for terminology glossary
 *
 * Methods:
 * - GET: List terms, search, or get single term with translations
 * - POST: Create new term
 * - PATCH: Update term (including approve)
 * - DELETE: Soft delete term
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface TerminologyRequest {
  term_en?: string;
  term_ar?: string;
  definition_en?: string;
  definition_ar?: string;
  domain?: 'diplomatic' | 'legal' | 'technical' | 'organizational';
  subdomain?: string;
  abbreviation_en?: string;
  abbreviation_ar?: string;
  synonyms_en?: string[];
  synonyms_ar?: string[];
  usage_notes?: string;
  source?: string;
  is_approved?: boolean;
  frequency_of_use?: 'rare' | 'common' | 'frequent';
  related_terms?: string[];
  parent_term_id?: string | null;
  tags?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers,
      });
    }

    // Initialize Supabase client with user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const url = new URL(req.url);

    // GET - List, search, or get single term
    if (req.method === 'GET') {
      const termId = url.searchParams.get('id');
      const searchQuery = url.searchParams.get('search');
      const mostUsed = url.searchParams.get('most_used') === 'true';

      // Get most used terms
      if (mostUsed) {
        const days = parseInt(url.searchParams.get('days') || '30');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Get usage counts
        const { data: usageData, error: usageError } = await supabase
          .from('term_usage_log')
          .select('terminology_id')
          .gte('used_at', cutoffDate.toISOString());

        if (usageError) {
          return new Response(JSON.stringify({ error: usageError.message }), {
            status: 500,
            headers,
          });
        }

        // Count by term
        const counts: Record<string, number> = {};
        (usageData || []).forEach((u) => {
          counts[u.terminology_id] = (counts[u.terminology_id] || 0) + 1;
        });

        // Get top terms
        const topTermIds = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([id]) => id);

        if (topTermIds.length === 0) {
          return new Response(JSON.stringify({ data: [] }), { status: 200, headers });
        }

        const { data: terms, error: termError } = await supabase
          .from('terminology')
          .select('id, term_en, term_ar, abbreviation_en, domain')
          .in('id', topTermIds);

        if (termError) {
          return new Response(JSON.stringify({ error: termError.message }), {
            status: 500,
            headers,
          });
        }

        const enrichedTerms = (terms || [])
          .map((t) => ({ ...t, usage_count: counts[t.id] || 0 }))
          .sort((a, b) => b.usage_count - a.usage_count);

        return new Response(JSON.stringify({ data: enrichedTerms }), { status: 200, headers });
      }

      // Search terms
      if (searchQuery && searchQuery.length >= 2) {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const domain = url.searchParams.get('domain');
        const queryLower = searchQuery.toLowerCase();

        let query = supabase
          .from('terminology')
          .select('*')
          .eq('is_active', true)
          .or(
            `term_en.ilike.%${searchQuery}%,term_ar.ilike.%${searchQuery}%,abbreviation_en.ilike.%${searchQuery}%,abbreviation_ar.ilike.%${searchQuery}%,definition_en.ilike.%${searchQuery}%,definition_ar.ilike.%${searchQuery}%`
          )
          .limit(limit);

        if (domain) {
          query = query.eq('domain', domain);
        }

        const { data, error } = await query;

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }

        // Calculate match scores
        const results = (data || [])
          .map((t) => {
            let score = 0;

            // Exact term match
            if (t.term_en?.toLowerCase() === queryLower) score += 100;
            if (t.term_ar === searchQuery) score += 100;

            // Term contains query
            if (t.term_en?.toLowerCase().includes(queryLower)) score += 50;
            if (t.term_ar?.includes(searchQuery)) score += 50;

            // Abbreviation match
            if (t.abbreviation_en?.toLowerCase() === queryLower) score += 80;
            if (t.abbreviation_ar === searchQuery) score += 80;

            // Definition match
            if (t.definition_en?.toLowerCase().includes(queryLower)) score += 20;
            if (t.definition_ar?.includes(searchQuery)) score += 20;

            return { ...t, match_score: score };
          })
          .sort((a, b) => b.match_score - a.match_score);

        return new Response(JSON.stringify({ data: results }), { status: 200, headers });
      }

      if (termId) {
        // Get single term with translations
        const { data: term, error } = await supabase
          .from('terminology')
          .select('*')
          .eq('id', termId)
          .eq('is_active', true)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Get translations
        const { data: translations } = await supabase
          .from('term_translations')
          .select('*')
          .eq('terminology_id', termId)
          .order('language_name', { ascending: true });

        // Get usage count
        const { count: usageCount } = await supabase
          .from('term_usage_log')
          .select('*', { count: 'exact', head: true })
          .eq('terminology_id', termId);

        // Get related terms
        let relatedTerms: any[] = [];
        if (term.related_terms && term.related_terms.length > 0) {
          const { data: related } = await supabase
            .from('terminology')
            .select('id, term_en, term_ar, abbreviation_en')
            .in('id', term.related_terms);

          relatedTerms = related || [];
        }

        return new Response(
          JSON.stringify({
            data: {
              ...term,
              translations: translations || [],
              related_terms_details: relatedTerms,
              usage_count: usageCount || 0,
            },
          }),
          { status: 200, headers }
        );
      }

      // List terms
      let query = supabase
        .from('terminology')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('term_en', { ascending: true });

      // Optional filters
      const domain = url.searchParams.get('domain');
      const subdomain = url.searchParams.get('subdomain');
      const isApproved = url.searchParams.get('is_approved');
      const frequency = url.searchParams.get('frequency');

      if (domain) {
        query = query.eq('domain', domain);
      }
      if (subdomain) {
        query = query.eq('subdomain', subdomain);
      }
      if (isApproved !== null) {
        query = query.eq('is_approved', isApproved === 'true');
      }
      if (frequency) {
        query = query.eq('frequency_of_use', frequency);
      }

      // Pagination
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('page_size') || '50');
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(
        JSON.stringify({
          data: data || [],
          total_count: count || 0,
          page,
          page_size: pageSize,
        }),
        { status: 200, headers }
      );
    }

    // POST - Create term
    if (req.method === 'POST') {
      const body: TerminologyRequest = await req.json();

      if (!body.term_en || !body.term_ar) {
        return new Response(JSON.stringify({ error: 'term_en and term_ar are required' }), {
          status: 400,
          headers,
        });
      }

      // Check for duplicate term in same domain
      const { data: existing } = await supabase
        .from('terminology')
        .select('id')
        .eq('term_en', body.term_en)
        .eq('domain', body.domain || 'diplomatic')
        .eq('is_active', true)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'A term with this name already exists in this domain' }),
          { status: 409, headers }
        );
      }

      const { data, error } = await supabase
        .from('terminology')
        .insert({
          term_en: body.term_en,
          term_ar: body.term_ar,
          definition_en: body.definition_en,
          definition_ar: body.definition_ar,
          domain: body.domain || 'diplomatic',
          subdomain: body.subdomain,
          abbreviation_en: body.abbreviation_en,
          abbreviation_ar: body.abbreviation_ar,
          synonyms_en: body.synonyms_en || [],
          synonyms_ar: body.synonyms_ar || [],
          usage_notes: body.usage_notes,
          source: body.source,
          is_approved: body.is_approved || false,
          is_active: true,
          frequency_of_use: body.frequency_of_use || 'common',
          related_terms: body.related_terms || [],
          parent_term_id: body.parent_term_id || null,
          tags: body.tags || [],
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update term
    if (req.method === 'PATCH') {
      const termId = url.searchParams.get('id');
      if (!termId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: TerminologyRequest = await req.json();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields
      if (body.term_en !== undefined) updateData.term_en = body.term_en;
      if (body.term_ar !== undefined) updateData.term_ar = body.term_ar;
      if (body.definition_en !== undefined) updateData.definition_en = body.definition_en;
      if (body.definition_ar !== undefined) updateData.definition_ar = body.definition_ar;
      if (body.domain !== undefined) updateData.domain = body.domain;
      if (body.subdomain !== undefined) updateData.subdomain = body.subdomain;
      if (body.abbreviation_en !== undefined) updateData.abbreviation_en = body.abbreviation_en;
      if (body.abbreviation_ar !== undefined) updateData.abbreviation_ar = body.abbreviation_ar;
      if (body.synonyms_en !== undefined) updateData.synonyms_en = body.synonyms_en;
      if (body.synonyms_ar !== undefined) updateData.synonyms_ar = body.synonyms_ar;
      if (body.usage_notes !== undefined) updateData.usage_notes = body.usage_notes;
      if (body.source !== undefined) updateData.source = body.source;
      if (body.is_approved !== undefined) {
        updateData.is_approved = body.is_approved;
        if (body.is_approved) {
          updateData.approved_by = user.id;
          updateData.approved_at = new Date().toISOString();
        }
      }
      if (body.frequency_of_use !== undefined) updateData.frequency_of_use = body.frequency_of_use;
      if (body.related_terms !== undefined) updateData.related_terms = body.related_terms;
      if (body.parent_term_id !== undefined) updateData.parent_term_id = body.parent_term_id;
      if (body.tags !== undefined) updateData.tags = body.tags;

      const { data, error } = await supabase
        .from('terminology')
        .update(updateData)
        .eq('id', termId)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers,
        });
      }

      return new Response(JSON.stringify({ data }), { status: 200, headers });
    }

    // DELETE - Soft delete term
    if (req.method === 'DELETE') {
      const termId = url.searchParams.get('id');
      if (!termId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('terminology')
        .update({ is_active: false })
        .eq('id', termId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
});
