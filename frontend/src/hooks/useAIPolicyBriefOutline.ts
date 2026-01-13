/**
 * useAIPolicyBriefOutline Hook
 *
 * Hook for generating AI-powered policy brief outlines with SSE streaming support.
 * Takes user inputs (topic, audience, key message) and generates a structured outline
 * with suggested sections and placeholder content.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface OutlineSection {
  id: string
  title_en: string
  title_ar: string
  placeholder_en: string
  placeholder_ar: string
  required: boolean
  order: number
}

export interface GeneratedOutline {
  id: string
  title_en: string
  title_ar: string
  summary_en: string
  summary_ar: string
  sections: OutlineSection[]
  targetAudience: string
  generatedAt: string
}

export interface OutlineGenerationParams {
  topic: string
  targetAudience: string
  keyMessage: string
  additionalContext?: string
  language?: 'en' | 'ar'
}

export interface UseAIPolicyBriefOutlineReturn {
  generate: (params: OutlineGenerationParams) => Promise<void>
  outline: GeneratedOutline | null
  streamingContent: string
  isGenerating: boolean
  progress: number
  error: string | null
  cancel: () => void
  retry: () => void
  reset: () => void
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

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
]

// Placeholder templates for different audiences
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
}

export function useAIPolicyBriefOutline(): UseAIPolicyBriefOutlineReturn {
  const [token, setToken] = useState<string | null>(null)
  const [outline, setOutline] = useState<GeneratedOutline | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastParamsRef = useRef<OutlineGenerationParams | null>(null)

  // Get the auth token from Supabase session
  useEffect(() => {
    const getToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setToken(session?.access_token || null)
    }
    getToken()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Generate placeholder content based on section and audience
  const generatePlaceholderContent = useCallback(
    (
      sectionId: string,
      topic: string,
      keyMessage: string,
      audience: string,
      isArabic: boolean,
    ): string => {
      const audienceFocus = AUDIENCE_PLACEHOLDERS[audience] || AUDIENCE_PLACEHOLDERS.general

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
      }

      const placeholder = placeholders[sectionId] || {
        en: `Add content related to "${topic}". ${audienceFocus.en}`,
        ar: `أضف محتوى متعلق بـ "${topic}". ${audienceFocus.ar}`,
      }

      return isArabic ? placeholder.ar : placeholder.en
    },
    [],
  )

  const generate = useCallback(
    async (params: OutlineGenerationParams) => {
      if (isGenerating) return

      // Get fresh token from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const currentToken = session?.access_token

      if (!currentToken) {
        setError('UNAUTHORIZED')
        return
      }

      lastParamsRef.current = params
      setIsGenerating(true)
      setError(null)
      setStreamingContent('')
      setProgress(0)
      setOutline(null)

      abortControllerRef.current = new AbortController()

      try {
        // Simulate progress while calling the API
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 5, 80))
        }, 200)

        const response = await fetch(`${API_BASE}/ai/policy-brief-outline/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            topic: params.topic,
            target_audience: params.targetAudience,
            key_message: params.keyMessage,
            additional_context: params.additionalContext,
            language: params.language || 'en',
          }),
          signal: abortControllerRef.current.signal,
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          // Check if it's a 404 - endpoint doesn't exist yet, use fallback
          if (response.status === 404) {
            // Generate outline locally as fallback
            setProgress(90)
            const fallbackOutline = generateFallbackOutline(params)
            setProgress(100)
            setOutline(fallbackOutline)
            return
          }

          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to generate outline')
        }

        const data = await response.json()
        setProgress(100)

        if (data.outline) {
          setOutline(data.outline)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('CANCELLED')
        } else if (err instanceof Error && err.message.includes('fetch')) {
          // Network error - use fallback
          console.warn('Network error, using fallback outline generation')
          const fallbackOutline = generateFallbackOutline(params)
          setProgress(100)
          setOutline(fallbackOutline)
          setError(null)
        } else {
          const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
          setError(errorMessage)
        }
      } finally {
        setIsGenerating(false)
        abortControllerRef.current = null
      }
    },
    [isGenerating],
  )

  // Fallback outline generation (client-side)
  const generateFallbackOutline = useCallback(
    (params: OutlineGenerationParams): GeneratedOutline => {
      const isArabic = params.language === 'ar'

      // Generate title based on topic
      const titleEn = `Policy Brief: ${params.topic.slice(0, 50)}${params.topic.length > 50 ? '...' : ''}`
      const titleAr = `موجز سياسي: ${params.topic.slice(0, 50)}${params.topic.length > 50 ? '...' : ''}`

      // Generate summary
      const summaryEn = `This policy brief addresses ${params.topic.toLowerCase()} for ${params.targetAudience}. The key message is: ${params.keyMessage}`
      const summaryAr = `يتناول هذا الموجز السياسي ${params.topic} للجمهور المستهدف. الرسالة الرئيسية هي: ${params.keyMessage}`

      // Generate sections with placeholders
      const sections: OutlineSection[] = DEFAULT_SECTIONS.map((section) => ({
        ...section,
        placeholder_en: generatePlaceholderContent(
          section.id,
          params.topic,
          params.keyMessage,
          params.targetAudience,
          false,
        ),
        placeholder_ar: generatePlaceholderContent(
          section.id,
          params.topic,
          params.keyMessage,
          params.targetAudience,
          true,
        ),
      }))

      return {
        id: `outline-${Date.now()}`,
        title_en: titleEn,
        title_ar: titleAr,
        summary_en: summaryEn,
        summary_ar: summaryAr,
        sections,
        targetAudience: params.targetAudience,
        generatedAt: new Date().toISOString(),
      }
    },
    [generatePlaceholderContent],
  )

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
  }, [])

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      generate(lastParamsRef.current)
    }
  }, [generate])

  const reset = useCallback(() => {
    setOutline(null)
    setStreamingContent('')
    setProgress(0)
    setError(null)
    lastParamsRef.current = null
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
  }, [])

  return {
    generate,
    outline,
    streamingContent,
    isGenerating,
    progress,
    error,
    cancel,
    retry,
    reset,
  }
}

export default useAIPolicyBriefOutline
