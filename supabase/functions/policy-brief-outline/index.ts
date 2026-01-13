/**
 * Policy Brief Outline Generation Edge Function
 *
 * Generates AI-powered policy brief outlines based on user inputs:
 * - topic: The main subject of the policy brief
 * - target_audience: Who the brief is for (policymakers, executives, technical, etc.)
 * - key_message: The main point or recommendation
 * - additional_context: Optional extra information
 * - language: 'en' or 'ar' for output language
 *
 * Returns a structured outline with sections and placeholder content.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Types
interface OutlineSection {
  id: string;
  title_en: string;
  title_ar: string;
  placeholder_en: string;
  placeholder_ar: string;
  required: boolean;
  order: number;
}

interface GeneratedOutline {
  id: string;
  title_en: string;
  title_ar: string;
  summary_en: string;
  summary_ar: string;
  sections: OutlineSection[];
  targetAudience: string;
  generatedAt: string;
}

interface RequestBody {
  topic: string;
  target_audience: string;
  key_message: string;
  additional_context?: string;
  language?: 'en' | 'ar';
}

// Default sections template based on standard policy brief structure
const DEFAULT_SECTIONS: Omit<OutlineSection, 'placeholder_en' | 'placeholder_ar'>[] = [
  {
    id: 'executive-summary',
    title_en: 'Executive Summary',
    title_ar: 'الملخص التنفيذي',
    required: true,
    order: 1,
  },
  {
    id: 'background',
    title_en: 'Background & Context',
    title_ar: 'الخلفية والسياق',
    required: true,
    order: 2,
  },
  {
    id: 'problem-statement',
    title_en: 'Problem Statement',
    title_ar: 'بيان المشكلة',
    required: true,
    order: 3,
  },
  {
    id: 'analysis',
    title_en: 'Analysis & Key Findings',
    title_ar: 'التحليل والنتائج الرئيسية',
    required: true,
    order: 4,
  },
  {
    id: 'policy-options',
    title_en: 'Policy Options',
    title_ar: 'الخيارات السياسية',
    required: false,
    order: 5,
  },
  {
    id: 'recommendations',
    title_en: 'Recommendations',
    title_ar: 'التوصيات',
    required: true,
    order: 6,
  },
  {
    id: 'implementation',
    title_en: 'Implementation Considerations',
    title_ar: 'اعتبارات التنفيذ',
    required: false,
    order: 7,
  },
  {
    id: 'conclusion',
    title_en: 'Conclusion',
    title_ar: 'الخاتمة',
    required: false,
    order: 8,
  },
];

// Audience-specific placeholder guidance
const AUDIENCE_PLACEHOLDERS: Record<string, { en: string; ar: string }> = {
  policymakers: {
    en: 'Focus on policy implications, actionable recommendations, and potential impact on governance.',
    ar: 'ركز على الآثار السياسية والتوصيات القابلة للتنفيذ والتأثير المحتمل على الحوكمة.',
  },
  executives: {
    en: 'Emphasize strategic implications, ROI considerations, and organizational impact.',
    ar: 'أكد على الآثار الاستراتيجية واعتبارات العائد على الاستثمار والتأثير التنظيمي.',
  },
  technical: {
    en: 'Include technical details, data analysis, and methodology explanations.',
    ar: 'قم بتضمين التفاصيل التقنية وتحليل البيانات وشرح المنهجية.',
  },
  general: {
    en: 'Use accessible language, provide context, and explain technical terms.',
    ar: 'استخدم لغة سهلة الفهم، وقدم السياق، واشرح المصطلحات التقنية.',
  },
  diplomatic: {
    en: 'Consider international relations, diplomatic sensitivities, and multilateral implications.',
    ar: 'ضع في الاعتبار العلاقات الدولية والحساسيات الدبلوماسية والآثار متعددة الأطراف.',
  },
};

// Generate placeholder content for a section
function generatePlaceholderContent(
  sectionId: string,
  topic: string,
  keyMessage: string,
  audience: string,
  isArabic: boolean
): string {
  const audienceFocus = AUDIENCE_PLACEHOLDERS[audience] || AUDIENCE_PLACEHOLDERS.general;

  const placeholders: Record<string, { en: string; ar: string }> = {
    'executive-summary': {
      en: `Provide a concise overview of "${topic}" addressing the key message: "${keyMessage}". ${audienceFocus.en} Limit to 150-200 words.`,
      ar: `قدم نظرة عامة موجزة عن "${topic}" تتناول الرسالة الرئيسية: "${keyMessage}". ${audienceFocus.ar} حدد بـ 150-200 كلمة.`,
    },
    background: {
      en: `Present the historical context and current situation related to "${topic}". Include relevant data, trends, and stakeholder perspectives. ${audienceFocus.en}`,
      ar: `قدم السياق التاريخي والوضع الحالي المتعلق بـ "${topic}". قم بتضمين البيانات والاتجاهات ووجهات نظر أصحاب المصلحة ذات الصلة. ${audienceFocus.ar}`,
    },
    'problem-statement': {
      en: `Clearly define the problem or challenge. Explain why this issue requires attention and what happens if no action is taken. ${audienceFocus.en}`,
      ar: `حدد المشكلة أو التحدي بوضوح. اشرح لماذا تتطلب هذه المسألة الاهتمام وما الذي سيحدث إذا لم يتم اتخاذ أي إجراء. ${audienceFocus.ar}`,
    },
    analysis: {
      en: `Analyze the key factors, causes, and effects. Support with evidence and data. Consider multiple perspectives and their implications. ${audienceFocus.en}`,
      ar: `حلل العوامل والأسباب والآثار الرئيسية. ادعم بالأدلة والبيانات. ضع في الاعتبار وجهات نظر متعددة وآثارها. ${audienceFocus.ar}`,
    },
    'policy-options': {
      en: `Present 2-3 policy alternatives. For each option, describe the approach, advantages, disadvantages, and feasibility. ${audienceFocus.en}`,
      ar: `قدم 2-3 بدائل سياسية. لكل خيار، صف النهج والمزايا والعيوب والجدوى. ${audienceFocus.ar}`,
    },
    recommendations: {
      en: `Provide specific, actionable recommendations based on your analysis. Explain how they address the problem and achieve the key message: "${keyMessage}". ${audienceFocus.en}`,
      ar: `قدم توصيات محددة وقابلة للتنفيذ بناءً على تحليلك. اشرح كيف تعالج المشكلة وتحقق الرسالة الرئيسية: "${keyMessage}". ${audienceFocus.ar}`,
    },
    implementation: {
      en: `Outline the steps, timeline, resources, and potential challenges for implementing the recommendations. ${audienceFocus.en}`,
      ar: `حدد الخطوات والجدول الزمني والموارد والتحديات المحتملة لتنفيذ التوصيات. ${audienceFocus.ar}`,
    },
    conclusion: {
      en: `Summarize the key points and reinforce the importance of taking action. End with a call to action aligned with your key message. ${audienceFocus.en}`,
      ar: `لخص النقاط الرئيسية وعزز أهمية اتخاذ الإجراءات. اختم بدعوة للعمل تتماشى مع رسالتك الرئيسية. ${audienceFocus.ar}`,
    },
  };

  const placeholder = placeholders[sectionId] || {
    en: `Add content related to "${topic}". ${audienceFocus.en}`,
    ar: `أضف محتوى متعلق بـ "${topic}". ${audienceFocus.ar}`,
  };

  return isArabic ? placeholder.ar : placeholder.en;
}

// Generate the outline
function generateOutline(params: RequestBody): GeneratedOutline {
  const { topic, target_audience, key_message, language = 'en' } = params;

  // Generate title
  const titleEn = `Policy Brief: ${topic.slice(0, 50)}${topic.length > 50 ? '...' : ''}`;
  const titleAr = `موجز سياسي: ${topic.slice(0, 50)}${topic.length > 50 ? '...' : ''}`;

  // Generate summary
  const summaryEn = `This policy brief addresses ${topic.toLowerCase()} for ${target_audience}. The key message is: ${key_message}`;
  const summaryAr = `يتناول هذا الموجز السياسي ${topic} للجمهور المستهدف. الرسالة الرئيسية هي: ${key_message}`;

  // Generate sections with placeholders
  const sections: OutlineSection[] = DEFAULT_SECTIONS.map((section) => ({
    ...section,
    placeholder_en: generatePlaceholderContent(
      section.id,
      topic,
      key_message,
      target_audience,
      false
    ),
    placeholder_ar: generatePlaceholderContent(
      section.id,
      topic,
      key_message,
      target_audience,
      true
    ),
  }));

  return {
    id: `outline-${Date.now()}`,
    title_en: titleEn,
    title_ar: titleAr,
    summary_en: summaryEn,
    summary_ar: summaryAr,
    sections,
    targetAudience: target_audience,
    generatedAt: new Date().toISOString(),
  };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: RequestBody = await req.json();

    // Validate required fields
    if (!body.topic || body.topic.length < 10) {
      return new Response(JSON.stringify({ error: 'Topic must be at least 10 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.target_audience) {
      return new Response(JSON.stringify({ error: 'Target audience is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.key_message || body.key_message.length < 20) {
      return new Response(JSON.stringify({ error: 'Key message must be at least 20 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate outline
    const outline = generateOutline(body);

    // Return the outline
    return new Response(JSON.stringify({ outline }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating outline:', error);

    return new Response(JSON.stringify({ error: 'Failed to generate outline' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
