import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface ReportSchedule {
  id: string;
  report_id: string;
  name: string;
  name_ar?: string;
  frequency: string;
  time: string;
  timezone: string;
  day_of_week?: number;
  day_of_month?: number;
  export_format: string;
  language: string;
  next_run_at: string;
  recipients: string[];
}

interface Recipient {
  id: string;
  user_id?: string;
  external_email?: string;
  external_name?: string;
  delivery_channels: string[];
  preferred_format: string;
  preferred_language: string;
  is_active: boolean;
}

interface DeliveryCondition {
  id: string;
  field_path: string;
  operator: string;
  value?: string;
  is_required: boolean;
  fail_message?: string;
  fail_message_ar?: string;
}

interface ReportData {
  [key: string]: unknown;
}

// Evaluate a single condition against report data
function evaluateCondition(
  condition: DeliveryCondition,
  data: ReportData
): { passed: boolean; actualValue: unknown } {
  const { field_path, operator, value } = condition;

  // Navigate to the field using dot notation
  const actualValue = field_path.split('.').reduce((obj: unknown, key: string) => {
    if (obj && typeof obj === 'object' && key in obj) {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }, data as unknown);

  let passed = false;

  switch (operator) {
    case 'equals':
      passed = String(actualValue) === value;
      break;
    case 'not_equals':
      passed = String(actualValue) !== value;
      break;
    case 'greater_than':
      passed = Number(actualValue) > Number(value);
      break;
    case 'less_than':
      passed = Number(actualValue) < Number(value);
      break;
    case 'contains':
      passed = String(actualValue).includes(value || '');
      break;
    case 'not_contains':
      passed = !String(actualValue).includes(value || '');
      break;
    case 'is_empty':
      passed =
        actualValue === null ||
        actualValue === undefined ||
        actualValue === '' ||
        (Array.isArray(actualValue) && actualValue.length === 0);
      break;
    case 'is_not_empty':
      passed =
        actualValue !== null &&
        actualValue !== undefined &&
        actualValue !== '' &&
        (!Array.isArray(actualValue) || actualValue.length > 0);
      break;
    default:
      passed = false;
  }

  return { passed, actualValue };
}

// Generate mock report data - in production, this would fetch real data
async function generateReportData(
  supabase: ReturnType<typeof createClient>,
  schedule: ReportSchedule
): Promise<ReportData> {
  // Fetch the custom report configuration
  const { data: report } = await supabase
    .from('custom_reports')
    .select('*')
    .eq('id', schedule.report_id)
    .single();

  if (!report) {
    throw new Error(`Report not found: ${schedule.report_id}`);
  }

  const config = report.configuration || {};

  // Generate summary data based on report type
  // In production, this would execute the actual report queries
  const reportData: ReportData = {
    report_name: report.name,
    report_name_ar: report.name_ar,
    generated_at: new Date().toISOString(),
    period: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    metrics: {
      total_count: 0,
      active_count: 0,
      completed_count: 0,
    },
    data: [],
  };

  // Fetch actual data based on configuration
  if (config.entity_types) {
    for (const entityType of config.entity_types) {
      const { count } = await supabase.from(entityType).select('*', { count: 'exact', head: true });

      reportData.metrics.total_count = (reportData.metrics.total_count as number) + (count || 0);
    }
  }

  return reportData;
}

// Queue email for delivery
async function queueEmailDelivery(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
  recipient: Recipient,
  schedule: ReportSchedule,
  reportData: ReportData,
  filePath?: string
): Promise<void> {
  const language = recipient.preferred_language || schedule.language || 'en';
  const isArabic = language === 'ar';

  // Get user email if user_id is set
  let email = recipient.external_email;
  let name = recipient.external_name;

  if (recipient.user_id) {
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', recipient.user_id)
      .single();

    if (user) {
      email = user.email;
      name = user.full_name || email;
    }
  }

  if (!email) {
    console.error('No email found for recipient:', recipient.id);
    return;
  }

  const subject = isArabic
    ? `تقرير مجدول: ${schedule.name_ar || schedule.name}`
    : `Scheduled Report: ${schedule.name}`;

  const bodyHtml = isArabic
    ? `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif;">
        <h2>تقرير مجدول</h2>
        <p>مرحباً ${name || ''},</p>
        <p>يرجى الاطلاع على التقرير المرفق: <strong>${schedule.name_ar || schedule.name}</strong></p>
        <p>تم إنشاء هذا التقرير في: ${new Date().toLocaleString('ar-SA')}</p>
        ${filePath ? '<p>التقرير مرفق بهذه الرسالة.</p>' : ''}
        <hr/>
        <p style="font-size: 12px; color: #666;">الهيئة العامة للإحصاء - نظام الملف الدولي</p>
      </div>`
    : `<div style="font-family: 'Segoe UI', Tahoma, sans-serif;">
        <h2>Scheduled Report</h2>
        <p>Hello ${name || ''},</p>
        <p>Please find attached the scheduled report: <strong>${schedule.name}</strong></p>
        <p>This report was generated on: ${new Date().toLocaleString('en-US')}</p>
        ${filePath ? '<p>The report is attached to this email.</p>' : ''}
        <hr/>
        <p style="font-size: 12px; color: #666;">General Authority for Statistics - International Dossier System</p>
      </div>`;

  // Insert into email queue
  await supabase.from('email_queue').insert({
    to_email: email,
    to_name: name,
    subject,
    body_html: bodyHtml,
    body_text: subject,
    language,
    status: 'pending',
    priority: 5,
  });

  // Log the delivery
  await supabase.from('report_delivery_log').insert({
    execution_id: executionId,
    recipient_id: recipient.id,
    channel: 'email',
    format: recipient.preferred_format || schedule.export_format,
    language,
    status: 'queued',
    file_path: filePath,
  });
}

// Process a single scheduled report
async function processSchedule(
  supabase: ReturnType<typeof createClient>,
  schedule: ReportSchedule
): Promise<{ success: boolean; error?: string }> {
  console.log(`Processing schedule: ${schedule.id} - ${schedule.name}`);

  // Create execution record
  const { data: execution, error: execError } = await supabase
    .from('report_executions')
    .insert({
      report_id: schedule.report_id,
      schedule_id: schedule.id,
      status: 'running',
      trigger_type: 'scheduled',
    })
    .select()
    .single();

  if (execError || !execution) {
    console.error('Failed to create execution record:', execError);
    return { success: false, error: execError?.message };
  }

  try {
    // Generate report data
    const reportData = await generateReportData(supabase, schedule);

    // Fetch delivery conditions
    const { data: conditions } = await supabase
      .from('report_delivery_conditions')
      .select('*')
      .eq('schedule_id', schedule.id)
      .eq('is_active', true)
      .order('evaluation_order');

    // Evaluate conditions
    let allConditionsMet = true;
    const conditionsResult: { condition_id: string; passed: boolean; value: unknown }[] = [];

    if (conditions && conditions.length > 0) {
      for (const condition of conditions) {
        const result = evaluateCondition(condition, reportData);
        conditionsResult.push({
          condition_id: condition.id,
          passed: result.passed,
          value: result.actualValue,
        });

        if (condition.is_required && !result.passed) {
          allConditionsMet = false;
          console.log(
            `Condition not met: ${condition.field_path} ${condition.operator} ${condition.value}`
          );
        }
      }
    }

    // Update execution with conditions result
    await supabase
      .from('report_executions')
      .update({
        conditions_met: allConditionsMet,
        conditions_result: { results: conditionsResult, all_passed: allConditionsMet },
      })
      .eq('id', execution.id);

    // If conditions not met, skip delivery
    if (!allConditionsMet) {
      await supabase
        .from('report_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          skipped_deliveries: 1,
        })
        .eq('id', execution.id);

      // Update next run time
      await supabase
        .rpc('calculate_report_next_run', {
          p_frequency: schedule.frequency,
          p_time: schedule.time,
          p_timezone: schedule.timezone,
          p_day_of_week: schedule.day_of_week,
          p_day_of_month: schedule.day_of_month,
        })
        .then(async ({ data: nextRun }) => {
          if (nextRun) {
            await supabase
              .from('report_schedules')
              .update({
                next_run_at: nextRun,
                last_run_at: new Date().toISOString(),
                last_run_status: 'completed',
              })
              .eq('id', schedule.id);
          }
        });

      return { success: true };
    }

    // Fetch recipients (from new table and legacy array)
    const { data: recipients } = await supabase
      .from('report_schedule_recipients')
      .select('*')
      .eq('schedule_id', schedule.id)
      .eq('is_active', true);

    const allRecipients: Recipient[] = recipients || [];

    // Add legacy recipients from the array field
    if (schedule.recipients && schedule.recipients.length > 0) {
      for (const email of schedule.recipients) {
        // Check if already in recipients list
        const exists = allRecipients.some((r) => r.external_email === email);
        if (!exists) {
          allRecipients.push({
            id: crypto.randomUUID(),
            external_email: email,
            delivery_channels: ['email'],
            preferred_format: schedule.export_format,
            preferred_language: schedule.language || 'en',
            is_active: true,
          });
        }
      }
    }

    // Update total recipients count
    await supabase
      .from('report_executions')
      .update({ total_recipients: allRecipients.length })
      .eq('id', execution.id);

    // TODO: Generate actual report file and upload to storage
    // For now, we'll just queue the emails without attachments
    const filePath = undefined; // Would be set after file generation

    // Process each recipient
    let successCount = 0;
    let failCount = 0;

    for (const recipient of allRecipients) {
      try {
        // Check which channels to use
        const channels = recipient.delivery_channels || ['email'];

        for (const channel of channels) {
          if (channel === 'email') {
            await queueEmailDelivery(
              supabase,
              execution.id,
              recipient,
              schedule,
              reportData,
              filePath
            );
            successCount++;
          }
          // TODO: Add support for in_app, slack, teams channels
        }
      } catch (err) {
        console.error(`Failed to process recipient ${recipient.id}:`, err);
        failCount++;
      }
    }

    // Update execution status
    await supabase
      .from('report_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        successful_deliveries: successCount,
        failed_deliveries: failCount,
      })
      .eq('id', execution.id);

    // Update schedule with next run time
    const { data: nextRun } = await supabase.rpc('calculate_report_next_run', {
      p_frequency: schedule.frequency,
      p_time: schedule.time,
      p_timezone: schedule.timezone,
      p_day_of_week: schedule.day_of_week,
      p_day_of_month: schedule.day_of_month,
    });

    await supabase
      .from('report_schedules')
      .update({
        next_run_at: nextRun,
        last_run_at: new Date().toISOString(),
        last_run_status: 'completed',
        consecutive_failures: 0,
      })
      .eq('id', schedule.id);

    return { success: true };
  } catch (err) {
    console.error(`Error processing schedule ${schedule.id}:`, err);

    // Update execution as failed
    await supabase
      .from('report_executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: err instanceof Error ? err.message : String(err),
      })
      .eq('id', execution.id);

    // Increment failure count
    await supabase
      .from('report_schedules')
      .update({
        consecutive_failures:
          (schedule as unknown as { consecutive_failures?: number }).consecutive_failures || 0 + 1,
        last_run_at: new Date().toISOString(),
        last_run_status: 'failed',
      })
      .eq('id', schedule.id);

    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // GET: Status check
    if (req.method === 'GET') {
      const { data: dueSchedules } = await supabase.rpc('get_due_report_schedules', {
        p_limit: 10,
      });

      return new Response(
        JSON.stringify({
          status: 'ok',
          due_schedules_count: dueSchedules?.length || 0,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // POST: Process due schedules or trigger specific schedule
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const scheduleId = body.schedule_id;
      const triggeredBy = body.triggered_by;

      let schedulesToProcess: ReportSchedule[] = [];

      if (scheduleId) {
        // Process specific schedule
        const { data: schedule } = await supabase
          .from('report_schedules')
          .select('*')
          .eq('id', scheduleId)
          .single();

        if (schedule) {
          schedulesToProcess = [schedule as ReportSchedule];
        }
      } else {
        // Process all due schedules
        const { data: dueSchedules } = await supabase.rpc('get_due_report_schedules', {
          p_limit: 50,
        });
        schedulesToProcess = (dueSchedules || []) as ReportSchedule[];
      }

      const results: { schedule_id: string; success: boolean; error?: string }[] = [];

      for (const schedule of schedulesToProcess) {
        const result = await processSchedule(supabase, schedule);
        results.push({
          schedule_id: schedule.id,
          ...result,
        });
      }

      return new Response(
        JSON.stringify({
          processed: results.length,
          results,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scheduled-report-processor:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
