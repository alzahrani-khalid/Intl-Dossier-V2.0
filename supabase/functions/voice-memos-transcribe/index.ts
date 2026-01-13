/**
 * Voice Memos Transcription Edge Function
 * Processes voice memos in the transcription queue using OpenAI Whisper API
 * Can be triggered by webhook, cron, or manually
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  confidence: number;
}

interface WhisperResponse {
  text: string;
  language: string;
  duration: number;
  segments?: {
    id: number;
    start: number;
    end: number;
    text: string;
    avg_logprob: number;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for background processing
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    const body = await req.json().catch(() => ({}));
    const voiceMemoId = body.voice_memo_id;
    const batchSize = body.batch_size || 5;

    let memoIdsToProcess: string[] = [];

    // If specific memo ID provided, process just that one
    if (voiceMemoId) {
      memoIdsToProcess = [voiceMemoId];
    } else {
      // Get pending items from transcription queue
      const { data: queueItems, error: queueError } = await supabaseClient
        .from('transcription_queue')
        .select('voice_memo_id')
        .eq('status', 'pending')
        .lt('attempts', 3)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (queueError) {
        throw queueError;
      }

      memoIdsToProcess = queueItems?.map((item) => item.voice_memo_id) || [];
    }

    if (memoIdsToProcess.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending transcriptions', processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const memoId of memoIdsToProcess) {
      try {
        // Update queue status to processing
        await supabaseClient
          .from('transcription_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            attempts: supabaseClient.rpc('increment_attempts', { memo_id: memoId }),
          })
          .eq('voice_memo_id', memoId);

        // Update voice memo status
        await supabaseClient
          .from('voice_memos')
          .update({
            status: 'transcribing',
            transcription_started_at: new Date().toISOString(),
          })
          .eq('id', memoId);

        // Get voice memo details
        const { data: voiceMemo, error: memoError } = await supabaseClient
          .from('voice_memos')
          .select('*')
          .eq('id', memoId)
          .single();

        if (memoError || !voiceMemo) {
          throw new Error(`Voice memo not found: ${memoId}`);
        }

        // Download audio file from storage
        const { data: audioData, error: downloadError } = await supabaseClient.storage
          .from(voiceMemo.storage_bucket)
          .download(voiceMemo.storage_path);

        if (downloadError || !audioData) {
          throw new Error(`Failed to download audio: ${downloadError?.message}`);
        }

        // Prepare form data for Whisper API
        const formData = new FormData();
        formData.append('file', audioData, {
          filename: 'audio.m4a',
          type: voiceMemo.mime_type,
        });
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'verbose_json');
        formData.append('timestamp_granularities[]', 'segment');

        // If transcription language hint is set, use it
        if (voiceMemo.transcription_language && voiceMemo.transcription_language !== 'auto') {
          formData.append('language', voiceMemo.transcription_language);
        }

        // Call OpenAI Whisper API
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: formData,
        });

        if (!whisperResponse.ok) {
          const errorText = await whisperResponse.text();
          throw new Error(`Whisper API error: ${errorText}`);
        }

        const whisperResult: WhisperResponse = await whisperResponse.json();

        // Process segments into our format
        const segments: TranscriptionSegment[] =
          whisperResult.segments?.map((seg, index) => ({
            id: `seg_${index}`,
            start: seg.start,
            end: seg.end,
            text: seg.text.trim(),
            confidence: Math.exp(seg.avg_logprob), // Convert log probability to confidence
          })) || [];

        // Calculate overall confidence
        const avgConfidence =
          segments.length > 0
            ? segments.reduce((sum, seg) => sum + seg.confidence, 0) / segments.length
            : 0.9;

        // Update voice memo with transcription
        const { error: updateError } = await supabaseClient
          .from('voice_memos')
          .update({
            status: 'completed',
            transcription: whisperResult.text,
            transcription_confidence: Math.min(avgConfidence, 1),
            transcription_language: whisperResult.language || 'en',
            transcription_segments: segments,
            transcription_metadata: {
              model: 'whisper-1',
              language: whisperResult.language,
              languageConfidence: 0.95,
              duration: whisperResult.duration,
              processingTime:
                Date.now() - new Date(voiceMemo.transcription_started_at || Date.now()).getTime(),
              wordCount: whisperResult.text.split(/\s+/).length,
              segments,
            },
            transcription_completed_at: new Date().toISOString(),
          })
          .eq('id', memoId);

        if (updateError) {
          throw updateError;
        }

        // Update queue status to completed
        await supabaseClient
          .from('transcription_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('voice_memo_id', memoId);

        results.push({
          voice_memo_id: memoId,
          status: 'completed',
          transcription_length: whisperResult.text.length,
          segments_count: segments.length,
        });
      } catch (error) {
        console.error(`Error processing memo ${memoId}:`, error);

        // Update voice memo status to failed
        await supabaseClient
          .from('voice_memos')
          .update({
            status: 'failed',
            transcription_error: error.message,
          })
          .eq('id', memoId);

        // Update queue status
        const { data: queueItem } = await supabaseClient
          .from('transcription_queue')
          .select('attempts, max_attempts')
          .eq('voice_memo_id', memoId)
          .single();

        const newStatus =
          (queueItem?.attempts || 0) >= (queueItem?.max_attempts || 3) ? 'failed' : 'pending';

        await supabaseClient
          .from('transcription_queue')
          .update({
            status: newStatus,
            error_message: error.message,
          })
          .eq('voice_memo_id', memoId);

        results.push({
          voice_memo_id: memoId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in voice-memos-transcribe:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
