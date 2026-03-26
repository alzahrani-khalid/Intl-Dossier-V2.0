/**
 * AI Domain Types
 * @module domains/ai/types
 */

import type { DossierType } from '@/services/dossier-api'

/** Tool call within a chat message */
export interface ToolCall {
  name: string
  input: Record<string, unknown>
  result?: unknown
}

/** Citation within a chat message */
export interface Citation {
  type: string
  id: string
  title: string
  snippet?: string
}

/** Chat message structure */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCalls?: ToolCall[]
  citations?: Citation[]
  runId?: string
  timestamp: Date
}

/** Return type for the AI chat hook */
export interface UseAIChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  currentStreamContent: string
  currentToolCalls: ToolCall[]
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  retryLastMessage: () => Promise<void>
}

/** Parameters for sending a chat message */
export interface ChatRequestParams {
  message: string
  conversation_history: Array<{ role: string; content: string }>
  language: string
}

/** Generated fields from AI field assistance */
export interface GeneratedFields {
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  suggested_tags: string[]
}

/** Parameters for field assist */
export interface FieldAssistParams {
  dossier_type: DossierType
  description: string
  language?: 'en' | 'ar'
}

/** Return type for the field assist hook */
export interface UseAIFieldAssistReturn {
  generate: (params: FieldAssistParams) => Promise<void>
  generatedFields: GeneratedFields | null
  isGenerating: boolean
  error: string | null
  retry: () => void
  reset: () => void
}

/** Parameters for brief generation */
export interface BriefGenerationParams {
  engagementId?: string
  dossierId?: string
  customPrompt?: string
  language?: 'en' | 'ar'
}

/** Brief content structure */
export interface BriefContent {
  id: string
  title: string
  executiveSummary: string
  background: string
  keyParticipants: Array<{
    name: string
    role: string
    relevance: string
  }>
  relevantPositions: Array<{
    title: string
    stance: string
    source: string
    sourceId: string
  }>
  activeCommitments: Array<{
    description: string
    status: string
    deadline?: string
    sourceId: string
  }>
  historicalContext: string
  talkingPoints: string[]
  recommendations: string
  citations: Array<{
    type: 'dossier' | 'position' | 'commitment' | 'engagement'
    id: string
    title: string
    snippet?: string
  }>
  status: 'generating' | 'completed' | 'partial' | 'failed'
}

/** Return type for the generate brief hook */
export interface UseGenerateBriefReturn {
  generate: (params: BriefGenerationParams) => Promise<void>
  brief: BriefContent | null
  streamingContent: string
  isGenerating: boolean
  progress: number
  error: string | null
  cancel: () => void
  retry: () => void
  reset: () => void
}
