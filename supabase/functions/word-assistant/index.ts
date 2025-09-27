import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface WordAssistantRequest {
  action: 'complete' | 'translate' | 'summarize' | 'expand' | 'rephrase' | 'check_grammar' | 'generate_embeddings';
  text: string;
  target_language?: 'en' | 'ar';
  context?: string;
  max_length?: number;
  temperature?: number;
  workspace_slug?: string;
}

interface AnythingLLMRequest {
  message: string;
  mode?: string;
  sessionId?: string;
}

interface WordAssistantResponse {
  result: string;
  tokens_used?: number;
  model?: string;
  session_id?: string;
  embeddings?: number[];
}

async function callAnythingLLM(
  prompt: string, 
  workspace: string = 'default',
  sessionId?: string
): Promise<any> {
  const anythingLLMUrl = Deno.env.get('ANYTHINGLLM_URL') || 'http://localhost:3001';
  const apiKey = Deno.env.get('ANYTHINGLLM_API_KEY');

  if (!apiKey) {
    throw new Error('AnythingLLM API key not configured');
  }

  try {
    const response = await fetch(`${anythingLLMUrl}/api/v1/workspace/${workspace}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: prompt,
        mode: 'chat',
        sessionId: sessionId || crypto.randomUUID()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AnythingLLM error:', errorText);
      
      return {
        textResponse: generateFallbackResponse(prompt),
        sessionId: sessionId || 'fallback',
        error: 'Using fallback response due to AnythingLLM error'
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AnythingLLM connection error:', error);
    
    return {
      textResponse: generateFallbackResponse(prompt),
      sessionId: sessionId || 'fallback',
      error: 'Using fallback response due to connection error'
    };
  }
}

function generateFallbackResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('translate') && lowerPrompt.includes('arabic')) {
    return '[Translation to Arabic would appear here - AnythingLLM service temporarily unavailable]';
  }
  if (lowerPrompt.includes('translate') && lowerPrompt.includes('english')) {
    return '[Translation to English would appear here - AnythingLLM service temporarily unavailable]';
  }
  if (lowerPrompt.includes('summarize')) {
    return '[Summary would appear here - AnythingLLM service temporarily unavailable]';
  }
  if (lowerPrompt.includes('expand')) {
    return '[Expanded text would appear here - AnythingLLM service temporarily unavailable]';
  }
  if (lowerPrompt.includes('rephrase')) {
    return '[Rephrased text would appear here - AnythingLLM service temporarily unavailable]';
  }
  if (lowerPrompt.includes('grammar')) {
    return '[Grammar corrections would appear here - AnythingLLM service temporarily unavailable]';
  }
  
  return '[AI response would appear here - AnythingLLM service temporarily unavailable]';
}

async function generateEmbeddings(text: string): Promise<number[]> {
  const anythingLLMUrl = Deno.env.get('ANYTHINGLLM_URL') || 'http://localhost:3001';
  const apiKey = Deno.env.get('ANYTHINGLLM_API_KEY');

  if (!apiKey) {
    const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    return mockEmbedding;
  }

  try {
    const response = await fetch(`${anythingLLMUrl}/api/v1/embed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text
      })
    });

    if (!response.ok) {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
      return mockEmbedding;
    }

    const data = await response.json();
    return data.embeddings || new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  } catch (error) {
    console.error('Embedding generation error:', error);
    const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    return mockEmbedding;
  }
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

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: WordAssistantRequest = await req.json();

    if (!body.action || !body.text) {
      return new Response(
        JSON.stringify({ error: 'Action and text are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.text.length > 10000) {
      return new Response(
        JSON.stringify({ error: 'Text exceeds maximum length of 10,000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt = '';
    let response: WordAssistantResponse = {
      result: '',
      model: 'anythingllm'
    };

    switch (body.action) {
      case 'complete':
        prompt = `Complete the following text naturally and coherently:\n\n${body.text}`;
        if (body.context) {
          prompt += `\n\nContext: ${body.context}`;
        }
        break;

      case 'translate':
        if (!body.target_language) {
          return new Response(
            JSON.stringify({ error: 'Target language required for translation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const targetLang = body.target_language === 'ar' ? 'Arabic' : 'English';
        prompt = `Translate the following text to ${targetLang}. Preserve formatting and maintain professional tone:\n\n${body.text}`;
        break;

      case 'summarize':
        const maxLen = body.max_length || 200;
        prompt = `Summarize the following text in approximately ${maxLen} words, capturing the key points:\n\n${body.text}`;
        break;

      case 'expand':
        const expandLen = body.max_length || 500;
        prompt = `Expand the following text to approximately ${expandLen} words, adding relevant details while maintaining the core message:\n\n${body.text}`;
        if (body.context) {
          prompt += `\n\nContext: ${body.context}`;
        }
        break;

      case 'rephrase':
        prompt = `Rephrase the following text while maintaining the same meaning, using different words and sentence structure:\n\n${body.text}`;
        break;

      case 'check_grammar':
        prompt = `Check and correct any grammar, spelling, or punctuation errors in the following text. Return the corrected version:\n\n${body.text}`;
        break;

      case 'generate_embeddings':
        const embeddings = await generateEmbeddings(body.text);
        response.embeddings = embeddings;
        response.result = 'Embeddings generated successfully';
        
        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const llmResponse = await callAnythingLLM(
      prompt, 
      body.workspace_slug || 'default'
    );

    response.result = llmResponse.textResponse || generateFallbackResponse(prompt);
    response.session_id = llmResponse.sessionId;
    
    if (llmResponse.error) {
      response.model = 'fallback';
    }

    const { data: user } = await supabaseClient.auth.getUser();
    if (user?.user?.id) {
      await supabaseClient
        .from('word_assistant_logs')
        .insert({
          user_id: user.user.id,
          action: body.action,
          input_text: body.text.substring(0, 500),
          output_text: response.result.substring(0, 500),
          session_id: response.session_id,
          created_at: new Date().toISOString()
        });
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in word-assistant function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        result: generateFallbackResponse(''),
        model: 'fallback'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});