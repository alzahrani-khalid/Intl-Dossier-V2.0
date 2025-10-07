import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ExtractionJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: string;
  error?: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract job ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.length - 1];

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'validation_error', message: 'Job ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch job from database
    const { data: job, error: fetchError } = await supabase
      .from('ai_extraction_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return new Response(
        JSON.stringify({ error: 'not_found', message: 'Extraction job not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build response based on job status
    let response: any;

    switch (job.status) {
      case 'processing':
        response = {
          status: 'processing',
          progress: job.progress || 0,
        };
        break;

      case 'completed':
        response = {
          status: 'completed',
          result: JSON.parse(job.result || '{}'),
        };
        break;

      case 'failed':
        response = {
          status: 'failed',
          error: job.error || 'Extraction failed',
        };
        break;

      default:
        response = {
          status: 'processing',
          progress: 0,
        };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get extraction status error:', error);

    return new Response(
      JSON.stringify({
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Failed to get extraction status',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
