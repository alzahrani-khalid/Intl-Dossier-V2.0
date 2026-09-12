import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore: pdfkit is a CommonJS module without type declarations
import PDFDocument from 'npm:pdfkit@0.15.2';
// @ts-ignore: bidi-js ships no type declarations
import bidiFactory from 'npm:bidi-js@1.1.0';
import { Buffer } from 'node:buffer';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const bidi = bidiFactory();

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
  aa_commitments: Array<{
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

// Amiri covers Arabic (including Arabic-Indic digits) and Latin, so a single embedded
// TTF renders both locales; pdfkit subsets it into the PDF. Both URLs are pinned to the
// immutable commit of the Amiri 1.001 tag (7232342a); the raw/master ref 404s.
const ARABIC_FONT_URLS = [
  'https://cdn.jsdelivr.net/gh/aliftype/amiri@7232342a5a4bb934ce284039a4f55ac9ce4995a0/fonts/Amiri-Regular.ttf',
  'https://raw.githubusercontent.com/aliftype/amiri/7232342a5a4bb934ce284039a4f55ac9ce4995a0/fonts/Amiri-Regular.ttf',
];

let arabicFontPromise: Promise<Buffer> | null = null;

function loadArabicFont(): Promise<Buffer> {
  if (!arabicFontPromise) {
    arabicFontPromise = (async () => {
      let lastError: unknown = null;
      for (const url of ARABIC_FONT_URLS) {
        try {
          const res = await fetch(url);
          if (res.ok) return Buffer.from(await res.arrayBuffer());
          lastError = new Error(`font fetch answered ${res.status} for ${url}`);
        } catch (error) {
          lastError = error;
        }
      }
      arabicFontPromise = null;
      throw lastError instanceof Error ? lastError : new Error('Arabic font fetch failed');
    })();
  }
  return arabicFontPromise;
}

const ARABIC_CHAR_RE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

// Invisible bidi control characters emitted by Intl date formatting (e.g. the RLM
// runs inside ar-SA dates). They have no glyph in Amiri, so strip them before layout;
// bidi-js re-derives the ordering below. Isolate characters (U+2066..U+2069) are
// kept at this stage because the template wraps the ISO timestamp in a first-strong
// isolate to keep it intact inside RTL lines; ISOLATE_RE removes them from the
// reordered output instead.
const BIDI_CONTROL_RE = /[\u061C\u200E\u200F\u202A-\u202E]/g;
const ISOLATE_RE = /[\u2066-\u2069]/g;

// pdfkit/fontkit shapes each Arabic-script run and then reverses it internally
// (Arabic letters and Arabic-Indic digits alike), but keeps the run order of the
// input string. So: reorder the logical line to UAX#9 visual order with bidi-js,
// then hand pdfkit each Arabic-script token char-reversed so its internal flip
// lands the shaped glyphs in correct visual order — words right-to-left, digit
// runs reading left-to-right. Returns the visual string alongside: it is exactly
// the glyph sequence drawn on the page (and the measure used for the
// trailing-whitespace seam guard below).
function toVisualOrder(line: string): { visual: string; pdfkitInput: string } {
  const levels = bidi.getEmbeddingLevels(line, 'rtl');
  const visual = bidi.getReorderedString(line, levels).replace(ISOLATE_RE, '');
  const pdfkitInput = visual
    .split(/(\s+)/)
    .filter(part => part.length > 0)
    .map(part => (ARABIC_CHAR_RE.test(part) ? [...part].reverse().join('') : part))
    .join('');
  return { visual, pdfkitInput };
}

// Generate a structurally valid PDF (xref/trailer, embedded subset fonts). Arabic
// lines are reordered to UAX#9 visual order before drawing so the rendered page
// reads correctly (words right-to-left, Arabic-Indic digit runs left-to-right).
// Extraction carries no marked-content ActualText span: pdfkit's ToUnicode CMap
// maps every drawn glyph back to its logical code point, and each reader
// reassembles the logical line with its own bidi pass (verified for poppler
// pdftotext and Apple PDFKit).
async function generatePDFContent(
  record: AfterActionRecord,
  language: string,
  isConfidential: boolean
): Promise<Uint8Array> {
  const content = buildPDFContent(record, language, isConfidential);
  const arabicFont = await loadArabicFont();

  // deno-lint-ignore no-explicit-any
  const doc: any = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks: Uint8Array[] = [];
  doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
  const finished = new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
  });

  const fontSize = 10;
  const lineHeight = 14;
  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  let y = margin;
  doc.fontSize(fontSize);

  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/\s+$/, '').replace(BIDI_CONTROL_RE, '');
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    if (line.trim().length === 0) {
      y += lineHeight;
      continue;
    }
    if (ARABIC_CHAR_RE.test(line)) {
      doc.font(arabicFont);
      const ordered = toVisualOrder(line);
      // A trailing whitespace run at the visual end of the line keeps bidi-aware
      // text extractors from collapsing the last inter-word space at the line
      // seam (UAX#9 resets whitespace at the line end to the paragraph level).
      if (!/\s$/.test(ordered.visual)) {
        ordered.visual += '  ';
        ordered.pdfkitInput += '  ';
      }
      const width = doc.widthOfString(ordered.pdfkitInput);
      const x = Math.max(margin, pageWidth - margin - width);
      doc.text(ordered.pdfkitInput, x, y, { lineBreak: false });
    } else {
      doc.font('Helvetica');
      doc.text(line, margin, y, { lineBreak: false });
    }
    y += lineHeight;
  }

  doc.end();
  await finished;

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

function buildPDFContent(
  record: AfterActionRecord,
  language: string,
  isConfidential: boolean
): string {
  const isArabic = language === 'ar';

  let content = `After-Action Report
Direction: ${isArabic ? 'rtl' : 'ltr'}
Confidential: ${isConfidential ? 'Yes' : 'No'}

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
${record.aa_commitments.map((c, i) => `
${i + 1}. ${c.description}
   Priority: ${c.priority.toUpperCase()}
   Deadline: ${new Date(c.due_date).toLocaleDateString('en-US')}
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
${record.aa_commitments.map((c, i) => `
${i + 1}. ${c.description}
   الأولوية: ${translatePriority(c.priority)}
   الموعد النهائي: ${new Date(c.due_date).toLocaleDateString('ar-SA')}
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
تم الإنشاء: \u2066${new Date().toISOString()}\u2069
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
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
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
        aa_commitments(*),
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
