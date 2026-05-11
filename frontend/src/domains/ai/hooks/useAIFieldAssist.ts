/**
 * useAIFieldAssist Hook
 * @module domains/ai/hooks/useAIFieldAssist
 *
 * Hook for AI-assisted field pre-filling when creating dossiers.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getFieldAssist } from '../repositories/ai.repository'
import type { DossierType } from '@/services/dossier-api'
import type { GeneratedFields, FieldAssistParams, UseAIFieldAssistReturn } from '../types'

export type { GeneratedFields, FieldAssistParams, UseAIFieldAssistReturn }

// Type labels for generating fallback content
const TYPE_LABELS: Record<DossierType, { en: string; ar: string }> = {
  country: { en: 'Country', ar: 'دولة' },
  organization: { en: 'Organization', ar: 'منظمة' },
  forum: { en: 'Forum', ar: 'منتدى' },
  engagement: { en: 'Engagement', ar: 'مشاركة' },
  topic: { en: 'Topic', ar: 'موضوع' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  person: { en: 'Person', ar: 'شخص' },
}

// Common tags by dossier type
const TYPE_TAGS: Record<DossierType, string[]> = {
  country: ['bilateral', 'diplomatic', 'relations'],
  organization: ['international', 'partnership', 'collaboration'],
  forum: ['multilateral', 'conference', 'summit'],
  engagement: ['meeting', 'coordination', 'event'],
  topic: ['policy', 'strategic', 'analysis'],
  working_group: ['committee', 'task-force', 'coordination'],
  person: ['contact', 'official', 'stakeholder'],
}

export function useAIFieldAssist(): UseAIFieldAssistReturn {
  const [generatedFields, setGeneratedFields] = useState<GeneratedFields | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastParamsRef = useRef<FieldAssistParams | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return (): void => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const extractNameFromDescription = useCallback(
    (description: string, type: DossierType): { name_en: string; name_ar: string } => {
      const firstSentence = (description.split(/[.،!?]/)[0] || '').trim()
      const name = firstSentence.length > 50 ? firstSentence.slice(0, 47) + '...' : firstSentence
      const isArabicText = /[\u0600-\u06FF]/.test(description)
      const typeLabel = TYPE_LABELS[type]

      if (isArabicText) {
        return { name_en: `${typeLabel.en}: ${name}`, name_ar: name }
      }
      return { name_en: name, name_ar: `${typeLabel.ar}: ${name}` }
    },
    [],
  )

  const generateFallback = useCallback(
    (params: FieldAssistParams): GeneratedFields => {
      const { dossier_type, description } = params
      const names = extractNameFromDescription(description, dossier_type)
      const typeLabel = TYPE_LABELS[dossier_type]
      const cleanDesc = description.trim()
      const isArabicText = /[\u0600-\u06FF]/.test(description)

      const descEn = isArabicText
        ? `${typeLabel.en} dossier for tracking and managing related information.`
        : cleanDesc.length > 200
          ? cleanDesc.slice(0, 197) + '...'
          : cleanDesc

      const descAr = isArabicText
        ? cleanDesc.length > 200
          ? cleanDesc.slice(0, 197) + '...'
          : cleanDesc
        : `ملف ${typeLabel.ar} لتتبع وإدارة المعلومات ذات الصلة.`

      const words = description.toLowerCase().split(/\s+/)
      const potentialTags = words
        .filter((word) => word.length > 4 && /^[a-z]+$/.test(word))
        .slice(0, 2)

      const suggestedTags = [...TYPE_TAGS[dossier_type], ...potentialTags].slice(0, 5)

      return {
        name_en: names.name_en,
        name_ar: names.name_ar,
        description_en: descEn,
        description_ar: descAr,
        suggested_tags: suggestedTags,
      }
    },
    [extractNameFromDescription],
  )

  const generate = useCallback(
    async (params: FieldAssistParams) => {
      if (isGenerating) return

      if (!params.description || params.description.trim().length < 10) {
        setError('Description must be at least 10 characters')
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setError('Please sign in to use AI assistance')
        return
      }

      lastParamsRef.current = params
      setIsGenerating(true)
      setError(null)
      setGeneratedFields(null)

      abortControllerRef.current = new AbortController()

      try {
        const response = await getFieldAssist(params, abortControllerRef.current.signal)

        if (!response.ok) {
          if (response.status === 401 || response.status === 404 || response.status === 503) {
            console.warn(`AI field assist error (${response.status}), using fallback`)
            const fallback = generateFallback(params)
            setGeneratedFields(fallback)
            return
          }

          const errorData = (await response.json().catch(() => ({}))) as {
            error?: { message_en?: string; message?: string }
          }
          const errObj = errorData.error
          throw new Error(
            errObj
              ? String(errObj.message_en || errObj.message || 'Failed to generate fields')
              : 'Failed to generate fields',
          )
        }

        const data = await response.json()

        if (data.name_en && data.name_ar) {
          setGeneratedFields({
            name_en: data.name_en,
            name_ar: data.name_ar,
            description_en: data.description_en || '',
            description_ar: data.description_ar || '',
            suggested_tags: data.suggested_tags || [],
          })
        } else {
          const fallback = generateFallback(params)
          setGeneratedFields(fallback)
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Generation cancelled')
        } else if (err instanceof Error && err.message.includes('fetch')) {
          console.warn('Network error, using fallback field generation')
          const fallback = generateFallback(params)
          setGeneratedFields(fallback)
          setError(null)
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
          setError(errorMessage)
          const fallback = generateFallback(params)
          setGeneratedFields(fallback)
        }
      } finally {
        setIsGenerating(false)
        abortControllerRef.current = null
      }
    },
    [isGenerating, generateFallback],
  )

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      void generate(lastParamsRef.current)
    }
  }, [generate])

  const reset = useCallback(() => {
    setGeneratedFields(null)
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
    generatedFields,
    isGenerating,
    error,
    retry,
    reset,
  }
}
