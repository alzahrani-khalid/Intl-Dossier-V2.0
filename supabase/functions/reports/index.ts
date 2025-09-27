import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface ReportRequest {
  type: 'countries' | 'organizations' | 'mous' | 'events' | 'intelligence' | 'comprehensive';
  format: 'pdf' | 'excel' | 'json';
  filters?: {
    date_from?: string;
    date_to?: string;
    country_ids?: string[];
    organization_ids?: string[];
    status?: string;
    classification?: string;
  };
  language?: 'en' | 'ar' | 'both';
  include_charts?: boolean;
  include_summary?: boolean;
}

interface ReportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result_url?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

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
    const jobId = pathParts[pathParts.length - 1] !== 'reports' ? pathParts[pathParts.length - 1] : null;
    const isStatus = pathParts.includes('status');
    const isDownload = pathParts.includes('download');

    switch (req.method) {
      case 'GET': {
        if (jobId && isStatus) {
          const mockJob: ReportJob = {
            id: jobId,
            status: 'completed',
            progress: 100,
            result_url: `/reports/${jobId}/download`,
            created_at: new Date(Date.now() - 60000).toISOString(),
            completed_at: new Date().toISOString()
          };

          return new Response(
            JSON.stringify(mockJob),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (jobId && isDownload) {
          const reportData = {
            report_id: jobId,
            generated_at: new Date().toISOString(),
            type: 'comprehensive',
            data: {
              summary: {
                total_countries: 195,
                total_organizations: 342,
                active_mous: 67,
                upcoming_events: 12,
                intelligence_reports: 234
              },
              details: []
            }
          };

          return new Response(
            JSON.stringify(reportData),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="report-${jobId}.json"`
              } 
            }
          );
        }

        const searchParams = url.searchParams;
        const type = searchParams.get('type');
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');

        let reportData: any = {
          generated_at: new Date().toISOString(),
          filters: {
            type,
            date_from: dateFrom,
            date_to: dateTo
          }
        };

        if (type === 'countries') {
          const { data, error } = await supabaseClient
            .from('countries')
            .select('*', { count: 'exact' })
            .eq('status', 'active');

          if (error) throw error;

          reportData.countries = data;
          reportData.summary = {
            total_active: data?.length || 0,
            by_region: data?.reduce((acc: any, country: any) => {
              acc[country.region] = (acc[country.region] || 0) + 1;
              return acc;
            }, {})
          };
        } else if (type === 'organizations') {
          const { data, error } = await supabaseClient
            .from('organizations')
            .select('*, country:countries(name_en)', { count: 'exact' });

          if (error) throw error;

          reportData.organizations = data;
          reportData.summary = {
            total: data?.length || 0,
            by_type: data?.reduce((acc: any, org: any) => {
              acc[org.type] = (acc[org.type] || 0) + 1;
              return acc;
            }, {}),
            by_status: data?.reduce((acc: any, org: any) => {
              acc[org.status] = (acc[org.status] || 0) + 1;
              return acc;
            }, {})
          };
        } else if (type === 'mous') {
          let query = supabaseClient
            .from('mous')
            .select('*, primary_party:primary_party_id(name_en), secondary_party:secondary_party_id(name_en)', { count: 'exact' });

          if (dateFrom) {
            query = query.gte('created_at', dateFrom);
          }
          if (dateTo) {
            query = query.lte('created_at', dateTo);
          }

          const { data, error } = await query;

          if (error) throw error;

          reportData.mous = data;
          reportData.summary = {
            total: data?.length || 0,
            by_workflow_state: data?.reduce((acc: any, mou: any) => {
              acc[mou.workflow_state] = (acc[mou.workflow_state] || 0) + 1;
              return acc;
            }, {}),
            expiring_soon: data?.filter((mou: any) => {
              if (!mou.expiry_date) return false;
              const thirtyDaysFromNow = new Date();
              thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
              return new Date(mou.expiry_date) <= thirtyDaysFromNow && 
                     new Date(mou.expiry_date) >= new Date();
            }).length || 0
          };
        } else if (type === 'events') {
          let query = supabaseClient
            .from('events')
            .select('*, organizer:organizer_id(name_en)', { count: 'exact' });

          if (dateFrom) {
            query = query.gte('start_datetime', dateFrom);
          }
          if (dateTo) {
            query = query.lte('start_datetime', dateTo);
          }

          const { data, error } = await query;

          if (error) throw error;

          reportData.events = data;
          reportData.summary = {
            total: data?.length || 0,
            by_type: data?.reduce((acc: any, event: any) => {
              acc[event.type] = (acc[event.type] || 0) + 1;
              return acc;
            }, {}),
            by_status: data?.reduce((acc: any, event: any) => {
              acc[event.status] = (acc[event.status] || 0) + 1;
              return acc;
            }, {}),
            virtual_events: data?.filter((e: any) => e.is_virtual).length || 0
          };
        } else if (type === 'intelligence') {
          const { data, error } = await supabaseClient
            .from('intelligence_reports')
            .select('id, report_number, title_en, confidence_level, classification, status, created_at', { count: 'exact' })
            .eq('status', 'published');

          if (error) throw error;

          reportData.intelligence_reports = data;
          reportData.summary = {
            total_published: data?.length || 0,
            by_confidence_level: data?.reduce((acc: any, report: any) => {
              acc[report.confidence_level] = (acc[report.confidence_level] || 0) + 1;
              return acc;
            }, {}),
            by_classification: data?.reduce((acc: any, report: any) => {
              acc[report.classification] = (acc[report.classification] || 0) + 1;
              return acc;
            }, {})
          };
        } else {
          const [countries, organizations, mous, events, intelligence] = await Promise.all([
            supabaseClient.from('countries').select('*', { count: 'exact', head: true }),
            supabaseClient.from('organizations').select('*', { count: 'exact', head: true }),
            supabaseClient.from('mous').select('*', { count: 'exact', head: true }),
            supabaseClient.from('events').select('*', { count: 'exact', head: true }),
            supabaseClient.from('intelligence_reports').select('*', { count: 'exact', head: true })
          ]);

          reportData.summary = {
            total_countries: countries.count || 0,
            total_organizations: organizations.count || 0,
            total_mous: mous.count || 0,
            total_events: events.count || 0,
            total_intelligence_reports: intelligence.count || 0
          };
        }

        return new Response(
          JSON.stringify(reportData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        const body: ReportRequest = await req.json();

        if (!body.type || !body.format) {
          return new Response(
            JSON.stringify({ error: 'Report type and format are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const jobId = crypto.randomUUID();
        const mockJob: ReportJob = {
          id: jobId,
          status: 'pending',
          progress: 0,
          created_at: new Date().toISOString()
        };

        setTimeout(async () => {
          console.log(`Processing report job ${jobId}`);
        }, 100);

        return new Response(
          JSON.stringify({
            job_id: jobId,
            status: 'pending',
            message: 'Report generation started',
            check_status_url: `/reports/${jobId}/status`
          }),
          { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in reports function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});