/**
 * useAIChat Hook
 * @module domains/ai/hooks/useAIChat
 *
 * Hook for AI chat functionality with SSE streaming support,
 * message state management, tool call handling, and error handling.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/store/authStore'
import { chatWithAI } from '../repositories/ai.repository'
import type { ChatMessage, ToolCall, UseAIChatReturn } from '../types'

export type { ChatMessage, UseAIChatReturn }

export function useAIChat(): UseAIChatReturn {
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Get auth token from Supabase session
  useEffect(() => {
    const getToken = async (): Promise<void> => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setToken(session?.access_token || null)
    }
    void getToken()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null)
    })

    return (): void => subscription.unsubscribe()
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStreamContent, setCurrentStreamContent] = useState('')
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCall[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastUserMessageRef = useRef<string>('')
  const messagesRef = useRef<ChatMessage[]>([])

  // Keep messagesRef in sync with state
  messagesRef.current = messages

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !content.trim()) return

      lastUserMessageRef.current = content
      setIsLoading(true)
      setError(null)
      setCurrentStreamContent('')
      setCurrentToolCalls([])

      const userMessage: ChatMessage = {
        role: 'user',
        content,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      const conversationHistory = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      abortControllerRef.current = new AbortController()

      try {
        const response = await chatWithAI(
          {
            message: content,
            conversation_history: conversationHistory,
            language: document.documentElement.lang || 'en',
          },
          abortControllerRef.current.signal,
        )

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
                  setCurrentToolCalls((prev) => [...prev, toolCall])
                }
              } else if (data.type === 'content' && data.content) {
                fullContent += data.content
                setCurrentStreamContent(fullContent)
              } else if (data.type === 'done') {
                break
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Stream error')
              } else if (data.type === 'timeout') {
                setError('Response timed out. Please try again.')
              }
            } catch (_parseError) {
              // Ignore parse errors for partial chunks
            }
          }
        }

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
    [token, isLoading],
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
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1]?.role === 'assistant') {
          return prev.slice(0, -1)
        }
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
