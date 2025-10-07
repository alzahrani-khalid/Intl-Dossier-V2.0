import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ANYTHINGLLM_API_URL = Deno.env.get('ANYTHINGLLM_API_URL') || 'http://anythingllm:3001';
const ANYTHINGLLM_API_KEY = Deno.env.get('ANYTHINGLLM_API_KEY') || '';
const AI_SYNC_THRESHOLD = parseInt(Deno.env.get('AI_SYNC_THRESHOLD') || '5', 10); // seconds

interface ExtractionRequest {
  file: File;
  language: 'en' | 'ar';
  mode: 'sync' | 'async' | 'auto';
}

interface ExtractionResult {
  mode: 'sync' | 'async';
  decisions: Array<{
    description: string;
    rationale?: string;
    decision_maker: string;
    decision_date: string;
    confidence: number;
  }>;
  commitments: Array<{
    description: string;
    owner: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }>;
  risks: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    likelihood: 'unlikely' | 'possible' | 'likely' | 'certain';
    mitigation_strategy?: string;
    confidence: number;
  }>;
}

// Estimate processing time based on file size
function estimateProcessingTime(fileSize: number, language: string): number {
  const baseTime = fileSize / (1024 * 100); // 100KB/sec baseline
  const langMultiplier = language === 'ar' ? 1.3 : 1.0; // Arabic is slower
  return baseTime * langMultiplier;
}

// Extract text from file based on mime type
async function extractTextFromFile(file: File): Promise<string> {
  const mimeType = file.type;

  if (mimeType === 'text/plain') {
    return await file.text();
  }

  // For PDF/DOCX, we would need additional libraries
  // For now, return the text content if it's plain text
  // In production, integrate with pdf-parse or similar
  return await file.text();
}

// Call AnythingLLM API for extraction
async function callAnythingLLM(text: string, language: string): Promise<ExtractionResult> {
  const prompt = `
System: Extract structured information from meeting notes as JSON.

Output format:
{
  "decisions": [{"description": string, "decision_maker": string, "confidence": 0-1}],
  "commitments": [{"description": string, "owner": string, "due_date": "YYYY-MM-DD", "confidence": 0-1}],
  "risks": [{"description": string, "severity": "low|medium|high|critical", "likelihood": "unlikely|possible|likely|certain", "confidence": 0-1}]
}

Examples:
Input: "Team decided to use PostgreSQL. John will research alternatives by Friday."
Output: {
  "decisions": [{"description": "Use PostgreSQL", "decision_maker": "Team", "confidence": 0.9}],
  "commitments": [{"description": "Research database alternatives", "owner": "John", "due_date": "2025-10-06", "confidence": 0.95, "priority": "medium"}]
}

Input: [Meeting minutes in ${language === 'ar' ? 'Arabic' : 'English'}]
${text}

Output (JSON only, no markdown):
`;

  try {
    const response = await fetch(`${ANYTHINGLLM_API_URL}/api/v1/workspace/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
      },
      body: JSON.stringify({
        message: prompt,
        mode: 'query',
      }),
    });

    if (!response.ok) {
      throw new Error(`AnythingLLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.text || data.response || '';

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AnythingLLM response');
    }

    const extracted = JSON.parse(jsonMatch[0]);

    return {
      mode: 'sync',
      decisions: extracted.decisions || [],
      commitments: extracted.commitments || [],
      risks: extracted.risks || [],
    };
  } catch (error) {
    console.error('AnythingLLM extraction error:', error);
    throw new Error('AI extraction failed. Please try manual entry.');
  }
}

// Create async extraction job
async function createExtractionJob(
  supabase: any,
  fileKey: string,
  language: string,
  estimatedTime: number
): Promise<string> {
  const { data, error } = await supabase
    .from('ai_extraction_jobs')
    .insert({
      file_key: fileKey,
      language,
      status: 'processing',
      estimated_time: estimatedTime,
      progress: 0,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create extraction job: ${error.message}`);
  }

  return data.id;
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

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const language = (formData.get('language') as string) || 'en';
    const mode = (formData.get('mode') as string) || 'auto';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'validation_error', message: 'File is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Estimate processing time
    const estimatedTime = estimateProcessingTime(file.size, language);
    const shouldSync = mode === 'sync' || (mode === 'auto' && estimatedTime < AI_SYNC_THRESHOLD);

    // Extract text from file
    const text = await extractTextFromFile(file);

    if (shouldSync) {
      // Sync mode: Extract immediately
      const result = await callAnythingLLM(text, language);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Async mode: Create job and process in background
      // First, upload file to storage for background processing
      const fileKey = `ai-extraction/${crypto.randomUUID()}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('private')
        .upload(fileKey, file);

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Create extraction job
      const jobId = await createExtractionJob(supabase, fileKey, language, Math.ceil(estimatedTime));

      // Process in background (fire and forget)
      processExtractionAsync(supabase, jobId, text, language).catch(console.error);

      return new Response(
        JSON.stringify({
          job_id: jobId,
          status: 'processing',
          estimated_time: Math.ceil(estimatedTime),
        }),
        {
          status: 202,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('AI extraction error:', error);

    return new Response(
      JSON.stringify({
        error: 'extraction_failed',
        message: error instanceof Error ? error.message : 'AI extraction failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Background async processing
async function processExtractionAsync(
  supabase: any,
  jobId: string,
  text: string,
  language: string
): Promise<void> {
  try {
    // Update progress to 30%
    await supabase
      .from('ai_extraction_jobs')
      .update({ progress: 30 })
      .eq('id', jobId);

    // Call AnythingLLM
    const result = await callAnythingLLM(text, language);

    // Update progress to 80%
    await supabase
      .from('ai_extraction_jobs')
      .update({ progress: 80 })
      .eq('id', jobId);

    // Save result
    await supabase
      .from('ai_extraction_jobs')
      .update({
        status: 'completed',
        progress: 100,
        result: JSON.stringify(result),
      })
      .eq('id', jobId);
  } catch (error) {
    console.error('Async extraction error:', error);

    // Mark job as failed
    await supabase
      .from('ai_extraction_jobs')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Extraction failed',
      })
      .eq('id', jobId);
  }
}
