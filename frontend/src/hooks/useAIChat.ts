/**
 * useAIChat Hook
 * Feature: 033-ai-brief-generation
 * Task: T038
 *
 * Hook for AI chat functionality with:
 * - SSE streaming support
 * - Message state management
 * - Tool call handling
 * - Error handling and retry
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/store/authStore'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCalls?: Array<{
    name: string
    input: Record<string, unknown>
    result?: unknown
  }>
  citations?: Array<{
    type: string
    id: string
    title: string
    snippet?: string
  }>
  runId?: string
  timestamp: Date
}

export interface UseAIChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  currentStreamContent: string
  currentToolCalls: Array<{
    name: string
    input: Record<string, unknown>
    result?: unknown
  }>
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  retryLastMessage: () => Promise<void>
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function useAIChat(): UseAIChatReturn {
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Get auth token from Supabase session
  useEffect(() => {
    const getToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setToken(session?.access_token || null)
    }
    getToken()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null)
    })

    return () => subscription.unsubscribe()
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStreamContent, setCurrentStreamContent] = useState('')
  const [currentToolCalls, setCurrentToolCalls] = useState<
    Array<{
      name: string
      input: Record<string, unknown>
      result?: unknown
    }>
  >([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastUserMessageRef = useRef<string>('')

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !content.trim()) return

      lastUserMessageRef.current = content
      setIsLoading(true)
      setError(null)
      setCurrentStreamContent('')
      setCurrentToolCalls([])

      // Add user message to history
      const userMessage: ChatMessage = {
        role: 'user',
        content,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Prepare conversation history for API
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(`${API_BASE}/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: content,
            conversation_history: conversationHistory,
            language: document.documentElement.lang || 'en',
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Chat request failed')
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let fullContent = ''
        let runId = ''
        const toolCalls: ChatMessage['toolCalls'] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue

            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'init' && data.runId) {
                runId = data.runId
              } else if (data.type === 'tool_call' && data.name) {
                const toolCall = {
                  name: data.name,
                  input: data.input || {},
                  result: data.result,
                }

                if (data.result) {
                  // Update existing tool call with result
                  setCurrentToolCalls((prev) => {
                    const idx = prev.findIndex((t) => t.name === data.name)
                    if (idx >= 0) {
                      const updated = [...prev]
                      updated[idx] = toolCall
                      return updated
                    }
                    return [...prev, toolCall]
                  })
                  toolCalls.push(toolCall)
                } else {
                  // New tool call starting
                  setCurrentToolCalls((prev) => [...prev, toolCall])
                }
              } else if (data.type === 'content' && data.content) {
                fullContent += data.content
                setCurrentStreamContent(fullContent)
              } else if (data.type === 'done') {
                // Stream complete
                break
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Stream error')
              } else if (data.type === 'timeout') {
                setError('Response timed out. Please try again.')
              }
            } catch (parseError) {
              // Ignore parse errors for partial chunks
            }
          }
        }

        // Add assistant message to history
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: fullContent,
          toolCalls,
          runId,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setCurrentStreamContent('')
        setCurrentToolCalls([])
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Request cancelled')
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [token, messages, isLoading],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setCurrentStreamContent('')
    setCurrentToolCalls([])
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessageRef.current) {
      // Remove last assistant message if it exists
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1]?.role === 'assistant') {
          return prev.slice(0, -1)
        }
        // Also remove the last user message since sendMessage will add it again
        if (prev.length > 0 && prev[prev.length - 1]?.role === 'user') {
          return prev.slice(0, -1)
        }
        return prev
      })
      await sendMessage(lastUserMessageRef.current)
    }
  }, [sendMessage])

  return {
    messages,
    isLoading,
    error,
    currentStreamContent,
    currentToolCalls,
    sendMessage,
    clearMessages,
    retryLastMessage,
  }
}

export default useAIChat
