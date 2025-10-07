import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// PDF generation would use @react-pdf/renderer
// For Deno Edge Functions, we'll use a different approach or call an external service
// This is a placeholder implementation that would work with a PDF generation service

interface AfterActionRecord {
  id: string;
  engagement_id: string;
  is_confidential: boolean;
  attendees: string[];
  notes: string | null;
  decisions: Array<{
    description: string;
    rationale?: string;
    decision_maker: string;
    decision_date: string;
  }>;
  commitments: Array<{
    description: string;
    priority: string;
    status: string;
    owner_type: string;
    due_date: string;
  }>;
  risks: Array<{
    description: string;
    severity: string;
    likelihood: string;
    mitigation_strategy?: string;
  }>;
  follow_up_actions: Array<{
    description: string;
    assigned_to?: string;
    target_date?: string;
    completed: boolean;
  }>;
  created_at: string;
  published_at?: string;
}

interface PDFGenerationRequest {
  mfa_token?: string;
  language: 'en' | 'ar' | 'both';
}

// Verify step-up MFA for confidential records
async function verifyStepUpMFA(supabase: any, token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId: token,
    });

    if (error) {
      console.error('MFA verification error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('MFA verification exception:', error);
    return false;
  }
}

// Generate PDF content (this would call @react-pdf/renderer or similar in production)
async function generatePDFContent(
  record: AfterActionRecord,
  language: string,
  isConfidential: boolean
): Promise<Uint8Array> {
  // In a real implementation, this would use @react-pdf/renderer
  // For now, we'll create a simple text-based PDF structure

  const content = buildPDFContent(record, language, isConfidential);

  // Convert to PDF bytes (simplified - in production use proper PDF library)
  const encoder = new TextEncoder();
  return encoder.encode(content);
}

function buildPDFContent(
  record: AfterActionRecord,
  language: string,
  isConfidential: boolean
): string {
  const isArabic = language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';

  let content = `
%PDF-1.4
% After-Action Report
% Direction: ${dir}
% Confidential: ${isConfidential ? 'Yes' : 'No'}

`;

  if (language === 'both' || language === 'en') {
    content += buildEnglishSection(record, isConfidential);
  }

  if (language === 'both' || language === 'ar') {
    content += buildArabicSection(record, isConfidential);
  }

  return content;
}

function buildEnglishSection(record: AfterActionRecord, isConfidential: boolean): string {
  let section = `
=== AFTER-ACTION REPORT ===
${isConfidential ? '*** CONFIDENTIAL ***' : ''}

Date: ${new Date(record.published_at || record.created_at).toLocaleDateString('en-US')}

ATTENDEES:
${record.attendees.map(a => `- ${a}`).join('\n')}

DECISIONS:
${record.decisions.map((d, i) => `
${i + 1}. ${d.description}
   Decision Maker: ${d.decision_maker}
   Date: ${new Date(d.decision_date).toLocaleDateString('en-US')}
   ${d.rationale ? `Rationale: ${d.rationale}` : ''}
`).join('\n')}

COMMITMENTS:
${record.commitments.map((c, i) => `
${i + 1}. ${c.description}
   Priority: ${c.priority.toUpperCase()}
   Due Date: ${new Date(c.due_date).toLocaleDateString('en-US')}
   Status: ${c.status.replace('_', ' ').toUpperCase()}
`).join('\n')}

RISKS:
${record.risks.map((r, i) => `
${i + 1}. ${r.description}
   Severity: ${r.severity.toUpperCase()}
   Likelihood: ${r.likelihood.toUpperCase()}
   ${r.mitigation_strategy ? `Mitigation: ${r.mitigation_strategy}` : ''}
`).join('\n')}

FOLLOW-UP ACTIONS:
${record.follow_up_actions.map((f, i) => `
${i + 1}. ${f.description}
   ${f.assigned_to ? `Assigned To: ${f.assigned_to}` : ''}
   ${f.target_date ? `Target Date: ${new Date(f.target_date).toLocaleDateString('en-US')}` : ''}
   Status: ${f.completed ? 'COMPLETED' : 'PENDING'}
`).join('\n')}

${record.notes ? `\nNOTES:\n${record.notes}` : ''}

---
Generated: ${new Date().toISOString()}
${isConfidential ? '\n*** CONFIDENTIAL - DO NOT DISTRIBUTE ***' : ''}
`;

  return section;
}

function buildArabicSection(record: AfterActionRecord, isConfidential: boolean): string {
  let section = `
=== تقرير ما بعد الإجراء ===
${isConfidential ? '*** سري ***' : ''}

التاريخ: ${new Date(record.published_at || record.created_at).toLocaleDateString('ar-SA')}

الحاضرون:
${record.attendees.map(a => `- ${a}`).join('\n')}

القرارات:
${record.decisions.map((d, i) => `
${i + 1}. ${d.description}
   صانع القرار: ${d.decision_maker}
   التاريخ: ${new Date(d.decision_date).toLocaleDateString('ar-SA')}
   ${d.rationale ? `المبرر: ${d.rationale}` : ''}
`).join('\n')}

الالتزامات:
${record.commitments.map((c, i) => `
${i + 1}. ${c.description}
   الأولوية: ${translatePriority(c.priority)}
   تاريخ الاستحقاق: ${new Date(c.due_date).toLocaleDateString('ar-SA')}
   الحالة: ${translateStatus(c.status)}
`).join('\n')}

المخاطر:
${record.risks.map((r, i) => `
${i + 1}. ${r.description}
   الشدة: ${translateSeverity(r.severity)}
   الاحتمالية: ${translateLikelihood(r.likelihood)}
   ${r.mitigation_strategy ? `التخفيف: ${r.mitigation_strategy}` : ''}
`).join('\n')}

إجراءات المتابعة:
${record.follow_up_actions.map((f, i) => `
${i + 1}. ${f.description}
   ${f.assigned_to ? `المكلف: ${f.assigned_to}` : ''}
   ${f.target_date ? `التاريخ المستهدف: ${new Date(f.target_date).toLocaleDateString('ar-SA')}` : ''}
   الحالة: ${f.completed ? 'مكتمل' : 'معلق'}
`).join('\n')}

${record.notes ? `\nملاحظات:\n${record.notes}` : ''}

---
تم الإنشاء: ${new Date().toISOString()}
${isConfidential ? '\n*** سري - عدم التوزيع ***' : ''}
`;

  return section;
}

function translatePriority(priority: string): string {
  const map: Record<string, string> = {
    low: 'منخفض',
    medium: 'متوسط',
    high: 'عالي',
    critical: 'حرج',
  };
  return map[priority] || priority;
}

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'معلق',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغى',
    overdue: 'متأخر',
  };
  return map[status] || status;
}

function translateSeverity(severity: string): string {
  const map: Record<string, string> = {
    low: 'منخفض',
    medium: 'متوسط',
    high: 'عالي',
    critical: 'حرج',
  };
  return map[severity] || severity;
}

function translateLikelihood(likelihood: string): string {
  const map: Record<string, string> = {
    unlikely: 'غير محتمل',
    possible: 'ممكن',
    likely: 'محتمل',
    certain: 'مؤكد',
  };
  return map[likelihood] || likelihood;
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

    // Extract after-action ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const afterActionIndex = pathParts.findIndex(part => part === 'after-actions');
    const afterActionId = pathParts[afterActionIndex + 1];

    if (!afterActionId) {
      return new Response(
        JSON.stringify({ error: 'validation_error', message: 'After-action ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: PDFGenerationRequest = await req.json().catch(() => ({ language: 'both' }));
    const language = body.language || 'both';
    const mfaToken = body.mfa_token;

    // Fetch after-action record with all related data
    const { data: record, error: fetchError } = await supabase
      .from('after_action_records')
      .select(`
        *,
        decisions(*),
        commitments(*),
        risks(*),
        follow_up_actions(*)
      `)
      .eq('id', afterActionId)
      .single();

    if (fetchError || !record) {
      return new Response(
        JSON.stringify({ error: 'not_found', message: 'After-action record not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if record is published
    if (record.publication_status !== 'published') {
      return new Response(
        JSON.stringify({ error: 'invalid_status', message: 'Only published records can generate PDFs' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check step-up MFA if confidential
    if (record.is_confidential) {
      if (!mfaToken) {
        return new Response(
          JSON.stringify({
            error: 'step_up_required',
            message: 'This record is confidential. MFA verification required.',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const mfaValid = await verifyStepUpMFA(supabase, mfaToken);
      if (!mfaValid) {
        return new Response(
          JSON.stringify({
            error: 'invalid_mfa',
            message: 'Invalid MFA token',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generate PDF
    const pdfBytes = await generatePDFContent(record, language, record.is_confidential);

    // Upload PDF to Supabase Storage
    const fileName = `after-action-${afterActionId}-${Date.now()}.pdf`;
    const filePath = `pdfs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('private')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`PDF upload failed: ${uploadError.message}`);
    }

    // Generate signed URL (24-hour expiry)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('private')
      .createSignedUrl(filePath, 86400); // 24 hours

    if (urlError || !urlData) {
      throw new Error(`Failed to generate signed URL: ${urlError?.message}`);
    }

    return new Response(
      JSON.stringify({
        pdf_url: urlData.signedUrl,
        generated_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('PDF generation error:', error);

    return new Response(
      JSON.stringify({
        error: 'pdf_generation_failed',
        message: error instanceof Error ? error.message : 'PDF generation failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
