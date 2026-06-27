import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  // Not implemented: position publishing is handled elsewhere; this endpoint is a stub.
  return new Response(
    JSON.stringify({
      error: 'Not implemented',
      error_ar: 'غير منفذ',
      message: 'Position publishing is not available through this endpoint.',
      message_ar: 'نشر الموقف غير متاح عبر هذه النقطة الطرفية.',
    }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
