import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface IntelligenceRequest {
  report_number?: string;
  title_en: string;
  title_ar: string;
  executive_summary_en: string;
  executive_summary_ar: string;
  analysis_en: string;
  analysis_ar: string;
  data_sources?: any[];
  confidence_level: 'low' | 'medium' | 'high' | 'verified';
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  analysis_type?: string[];
  key_findings?: any[];
  recommendations?: any[];
  related_countries?: string[];
  related_organizations?: string[];
  vector_embedding?: number[];
  status?: 'draft' | 'review' | 'approved' | 'published';
  author_id: string;
  reviewed_by?: string;
  approved_by?: string;
}

const STATE_TRANSITIONS: Record<string, string[]> = {
  'draft': ['review'],
  'review': ['approved', 'draft'],
  'approved': ['published']
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1] !== 'intelligence' ? pathParts[pathParts.length - 1] : null;
    const isSearch = pathParts.includes('search');
    const isSimilar = pathParts.includes('similar');
    const isTransition = pathParts.includes('transition');

    switch (req.method) {
      case 'GET': {
        if (isSearch) {
          const searchParams = url.searchParams;
          const query = searchParams.get('query');
          const classification = searchParams.get('classification');
          const confidenceLevel = searchParams.get('confidence_level');
          const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

          if (!query) {
            return new Response(
              JSON.stringify({ error: 'Search query required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          let searchQuery = supabaseClient
            .from('intelligence_reports')
            .select(`
              id,
              report_number,
              title_en,
              title_ar,
              executive_summary_en,
              executive_summary_ar,
              confidence_level,
              classification,
              status,
              created_at
            `)
            .or(`title_en.ilike.%${query}%,title_ar.ilike.%${query}%,executive_summary_en.ilike.%${query}%,executive_summary_ar.ilike.%${query}%,analysis_en.ilike.%${query}%,analysis_ar.ilike.%${query}%`);

          if (classification) {
            searchQuery = searchQuery.eq('classification', classification);
          }
          if (confidenceLevel) {
            searchQuery = searchQuery.eq('confidence_level', confidenceLevel);
          }

          searchQuery = searchQuery
            .eq('status', 'published')
            .limit(limit);

          const { data, error } = await searchQuery;

          if (error) throw error;

          return new Response(
            JSON.stringify({ results: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (isSimilar && id) {
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '5'), 20);
          
          const { data: sourceReport, error: sourceError } = await supabaseClient
            .from('intelligence_reports')
            .select('vector_embedding')
            .eq('id', id)
            .single();

          if (sourceError || !sourceReport || !sourceReport.vector_embedding) {
            return new Response(
              JSON.stringify({ error: 'Source report not found or has no embedding' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data, error } = await supabaseClient.rpc('match_intelligence_reports', {
            query_embedding: sourceReport.vector_embedding,
            match_threshold: 0.7,
            match_count: limit + 1
          });

          if (error) throw error;

          const similarReports = data?.filter((report: any) => report.id !== id) || [];

          return new Response(
            JSON.stringify({ similar_reports: similarReports.slice(0, limit) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (id) {
          const { data, error } = await supabaseClient
            .from('intelligence_reports')
            .select(`
              *,
              author:author_id(full_name, email),
              reviewer:reviewed_by(full_name),
              approver:approved_by(full_name)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;
          if (!data) {
            return new Response(
              JSON.stringify({ error: 'Intelligence report not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          delete data.vector_embedding;

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const searchParams = url.searchParams;
          const status = searchParams.get('status');
          const classification = searchParams.get('classification');
          const confidenceLevel = searchParams.get('confidence_level');
          const authorId = searchParams.get('author_id');
          const page = parseInt(searchParams.get('page') || '1');
          const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          let query = supabaseClient
            .from('intelligence_reports')
            .select(`
              id,
              report_number,
              title_en,
              title_ar,
              executive_summary_en,
              executive_summary_ar,
              confidence_level,
              classification,
              status,
              author:author_id(full_name),
              created_at,
              published_at
            `, { count: 'exact' });

          if (status) {
            query = query.eq('status', status);
          }
          if (classification) {
            query = query.eq('classification', classification);
          }
          if (confidenceLevel) {
            query = query.eq('confidence_level', confidenceLevel);
          }
          if (authorId) {
            query = query.eq('author_id', authorId);
          }

          query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          const { data, error, count } = await query;

          if (error) throw error;

          return new Response(
            JSON.stringify({
              data,
              pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil((count || 0) / limit)
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'POST': {
        if (isTransition && id) {
          const { target_state } = await req.json();
          
          const { data: currentReport, error: fetchError } = await supabaseClient
            .from('intelligence_reports')
            .select('status, confidence_level')
            .eq('id', id)
            .single();

          if (fetchError || !currentReport) {
            return new Response(
              JSON.stringify({ error: 'Intelligence report not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const allowedTransitions = STATE_TRANSITIONS[currentReport.status] || [];
          
          if (!allowedTransitions.includes(target_state)) {
            return new Response(
              JSON.stringify({ 
                error: `Invalid transition from ${currentReport.status} to ${target_state}`,
                allowed_transitions: allowedTransitions
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (target_state === 'published' && currentReport.confidence_level === 'verified') {
            const { data: checkApproval } = await supabaseClient
              .from('intelligence_reports')
              .select('approved_by')
              .eq('id', id)
              .single();
            
            if (!checkApproval?.approved_by) {
              return new Response(
                JSON.stringify({ error: 'Verified reports require approval before publishing' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          const updateData: any = { 
            status: target_state,
            updated_at: new Date().toISOString()
          };

          if (target_state === 'published') {
            updateData.published_at = new Date().toISOString();
          }

          const { data, error } = await supabaseClient
            .from('intelligence_reports')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify({
              message: `Report transitioned from ${currentReport.status} to ${target_state}`,
              data
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: IntelligenceRequest = await req.json();

        if (!body.title_en || !body.title_ar || !body.executive_summary_en || 
            !body.executive_summary_ar || !body.analysis_en || !body.analysis_ar ||
            !body.confidence_level || !body.author_id) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.confidence_level === 'verified' && !body.approved_by) {
          return new Response(
            JSON.stringify({ error: 'Verified confidence level requires approved_by field' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!body.report_number) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          
          const { count } = await supabaseClient
            .from('intelligence_reports')
            .select('*', { count: 'exact', head: true })
            .like('report_number', `INT-${year}-${month}-%`);
          
          const nextNumber = String((count || 0) + 1).padStart(4, '0');
          body.report_number = `INT-${year}-${month}-${nextNumber}`;
        }

        const reportData = {
          ...body,
          classification: body.classification || 'internal',
          status: body.status || 'draft'
        };

        delete reportData.vector_embedding;

        const { data, error } = await supabaseClient
          .from('intelligence_reports')
          .insert(reportData)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'Report with this number already exists' }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw error;
        }

        return new Response(
          JSON.stringify(data),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'PUT':
      case 'PATCH': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Intelligence report ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: Partial<IntelligenceRequest> = await req.json();

        if (body.confidence_level === 'verified' && !body.approved_by) {
          const { data: current } = await supabaseClient
            .from('intelligence_reports')
            .select('approved_by')
            .eq('id', id)
            .single();
          
          if (!current?.approved_by) {
            return new Response(
              JSON.stringify({ error: 'Verified confidence level requires approved_by field' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        delete body.vector_embedding;
        delete body.report_number;

        const { data, error } = await supabaseClient
          .from('intelligence_reports')
          .update(body)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Intelligence report not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'DELETE': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Intelligence report ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: report } = await supabaseClient
          .from('intelligence_reports')
          .select('status')
          .eq('id', id)
          .single();

        if (report && ['approved', 'published'].includes(report.status)) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete approved or published reports' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseClient
          .from('intelligence_reports')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: 'Intelligence report deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in intelligence function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});