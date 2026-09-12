import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * The request body is untrusted: `type` and `format` arrive as arbitrary strings and are
 * resolved against the tables below before either reaches a query or a storage path.
 */
interface ReportRequest {
  type: string;
  format: string;
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

/** The data sets this function can really gather — the GET branch's own vocabulary. */
type ReportDataType =
  | 'countries'
  | 'organizations'
  | 'mous'
  | 'events'
  | 'intelligence'
  | 'comprehensive';

/**
 * Report ids the page sends, resolved onto the data types above. The RESOLVED constant —
 * never the raw request value — composes the storage object path, so no caller-supplied
 * text can steer where an artifact is written.
 */
const REPORT_TYPES: Record<string, ReportDataType> = {
  countries: 'countries',
  organizations: 'organizations',
  mous: 'mous',
  events: 'events',
  intelligence: 'intelligence',
  comprehensive: 'comprehensive',
  'country-overview': 'countries',
  'organization-profile': 'organizations',
  'mou-status': 'mous',
  'event-summary': 'events',
  'intelligence-digest': 'intelligence',
  'executive-dashboard': 'comprehensive',
};

/** Quote a CSV field that contains a comma, a quote or a line break; double inner quotes. */
function csvField(value: unknown): string {
  const raw =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];

  return [
    headers.map(csvField).join(','),
    ...rows.map((row) => headers.map((header) => csvField(row[header])).join(',')),
  ].join('\r\n');
}

/**
 * A report's tabular body: the record list the requested type produced, or — when the type
 * yields counts rather than rows (`comprehensive`) — the summary as metric/value pairs.
 */
function tabulate(reportData: Record<string, any>): Record<string, unknown>[] {
  const records = Object.values(reportData).find(
    (value) => Array.isArray(value) && value.length > 0
  );

  if (Array.isArray(records)) return records as Record<string, unknown>[];

  return Object.entries(reportData.summary ?? {}).map(([metric, value]) => ({ metric, value }));
}

/**
 * Formats this function really produces. Anything absent here is REFUSED (501) rather than
 * answered with a fabricated byte-stream: a report the server cannot build must stay
 * visibly unavailable to the client, never render as a finished one.
 */
const SERIALIZERS: Record<
  string,
  { ext: string; contentType: string; serialize: (data: Record<string, any>) => string }
> = {
  json: {
    ext: 'json',
    contentType: 'application/json',
    serialize: (data) => JSON.stringify(data, null, 2),
  },
  csv: {
    ext: 'csv',
    contentType: 'text/csv',
    serialize: (data) => toCsv(tabulate(data)),
  },
};

/**
 * Gather the real report payload for a type. Shared by the GET preview branch and the POST
 * artifact branch so both describe the same data — the POST does not re-implement it.
 */
async function gatherReportData(
  supabaseClient: any,
  type: string | null,
  dateFrom: string | null,
  dateTo: string | null
): Promise<Record<string, any>> {
  const reportData: any = {
    generated_at: new Date().toISOString(),
    filters: {
      type,
      date_from: dateFrom,
      date_to: dateTo
    }
  };

  // Every query below is written against the LIVE staging schema, derived 2026-08-16. The
  // shapes inherited from the GET branch referenced columns that do not exist — `countries.status`,
  // `countries.name_en`, `mous.primary_party_id`, `events.organizer_id`,
  // `intelligence_reports.report_number` / `.title_en` — so five of the six types answered 500,
  // and three more `reduce` keys (`org.type`, `mou.workflow_state`, `event.is_virtual`) silently
  // bucketed every row under `undefined`. A report cannot be real while its query is fictional.
  if (type === 'countries') {
    const { data, error } = await supabaseClient
      .from('countries')
      .select('*', { count: 'exact' });

    if (error) throw error;

    reportData.countries = data;
    reportData.summary = {
      total: data?.length || 0,
      by_region: data?.reduce((acc: any, country: any) => {
        acc[country.region] = (acc[country.region] || 0) + 1;
        return acc;
      }, {})
    };
  } else if (type === 'organizations') {
    const { data, error } = await supabaseClient
      .from('organizations')
      .select('*', { count: 'exact' });

    if (error) throw error;

    reportData.organizations = data;
    reportData.summary = {
      total: data?.length || 0,
      by_org_type: data?.reduce((acc: any, org: any) => {
        acc[org.org_type] = (acc[org.org_type] || 0) + 1;
        return acc;
      }, {})
    };
  } else if (type === 'mous') {
    let query = supabaseClient
      .from('mous')
      .select('*', { count: 'exact' });

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
      by_lifecycle_state: data?.reduce((acc: any, mou: any) => {
        acc[mou.lifecycle_state] = (acc[mou.lifecycle_state] || 0) + 1;
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
      .select('*', { count: 'exact' });

    if (dateFrom) {
      query = query.gte('start_time', dateFrom);
    }
    if (dateTo) {
      query = query.lte('start_time', dateTo);
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
      virtual_events: data?.filter((e: any) => e.virtual_link).length || 0
    };
  } else if (type === 'intelligence') {
    const { data, error } = await supabaseClient
      .from('intelligence_reports')
      .select('id, title, confidence_level, classification, status, created_at', { count: 'exact' })
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

  return reportData;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
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
        const reportData = await gatherReportData(
          supabaseClient,
          searchParams.get('type'),
          searchParams.get('date_from'),
          searchParams.get('date_to')
        );

        return new Response(
          JSON.stringify(reportData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        // House auth pattern: the client above carries the caller's JWT; assert the caller
        // really is authenticated before gathering data or writing an artifact.
        const {
          data: { user },
          error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: ReportRequest = await req.json();

        if (!body.type || !body.format) {
          return new Response(
            JSON.stringify({ error: 'Report type and format are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const dataType = REPORT_TYPES[body.type];
        if (!dataType) {
          return new Response(
            JSON.stringify({ error: { code: 'UNKNOWN_TYPE', message: 'Unknown report type' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const serializer = SERIALIZERS[body.format];
        if (!serializer) {
          // Nothing here renders a PDF or a spreadsheet. Refusing keeps the client's honest
          // unavailable state; answering anything else would fabricate a finished report.
          return new Response(
            JSON.stringify({
              error: {
                code: 'FORMAT_UNAVAILABLE',
                message: 'This report format is not available',
              },
            }),
            { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const reportData = await gatherReportData(
          supabaseClient,
          dataType,
          body.filters?.date_from ?? null,
          body.filters?.date_to ?? null
        );

        const bytes = new TextEncoder().encode(serializer.serialize(reportData));
        const filePath = `reports/${dataType}-${Date.now()}.${serializer.ext}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('private')
          .upload(filePath, bytes, {
            contentType: serializer.contentType,
            cacheControl: '3600',
          });

        if (uploadError) {
          throw new Error(`Report upload failed: ${uploadError.message}`);
        }

        const { data: urlData, error: urlError } = await supabaseClient.storage
          .from('private')
          .createSignedUrl(filePath, 86400); // 24 hours

        if (urlError || !urlData?.signedUrl) {
          throw new Error(`Failed to generate signed URL: ${urlError?.message}`);
        }

        // A completed report ALWAYS carries the url of an artifact that exists.
        return new Response(
          JSON.stringify({
            url: urlData.signedUrl,
            status: 'completed',
            type: dataType,
            format: body.format,
            bytes: bytes.byteLength,
            generated_at: reportData.generated_at,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    // Diagnostics go to the logs; the caller gets a generic envelope. A server message
    // (Postgres text, storage paths, keys) must never reach the user.
    console.error('Error in reports function:', error);
    return new Response(
      JSON.stringify({ error: { code: 'REPORT_FAILED', message: 'Report request failed' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
