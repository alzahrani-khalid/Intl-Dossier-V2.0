/**
 * AI Chat Hooks
 * @module hooks/useAIChat
 * @feature 033-ai-brief-generation
 *
 * React hooks for AI chat functionality with Server-Sent Events (SSE) streaming,
 * real-time message updates, tool call handling, and conversation management.
 *
 * @description
 * This module provides hooks for building AI chat interfaces with:
 * - SSE streaming for real-time AI responses
 * - Conversation history management with timestamps
 * - Tool call tracking and result display
 * - Citation and source tracking
 * - Error handling with retry capability
 * - Automatic authentication token management
 * - Abort controller for canceling in-flight requests
 *
 * The chat hook manages a stateful conversation with the AI, sending user messages
 * and receiving streamed responses with support for tool executions and citations.
 *
 * @example
 * // Basic chat usage
 * const { messages, sendMessage, isLoading } = useAIChat();
 * await sendMessage('Summarize the latest engagement with France');
 *
 * @example
 * // With streaming content display
 * const { currentStreamContent, currentToolCalls, isLoading } = useAIChat();
 * // currentStreamContent updates in real-time as AI responds
 * // currentToolCalls shows tools being executed
 *
 * @example
 * // Error handling and retry
 * const { error, retryLastMessage } = useAIChat();
 * if (error) {
 *   await retryLastMessage();
 * }
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/store/authStore'

/**
 * Chat message with role, content, and optional metadata
 */
export interface ChatMessage {
  /** Message role: user input, AI assistant response, or system message */
  role: 'user' | 'assistant' | 'system'
  /** Message text content */
  content: string
  /** Tool calls executed during message generation */
  toolCalls?: Array<{
    name: string
    input: Record<string, unknown>
    result?: unknown
  }>
  /** Citations and sources referenced in response */
  citations?: Array<{
    type: string
    id: string
    title: string
    snippet?: string
  }>
  /** Unique run ID for the AI interaction */
  runId?: string
  /** Message creation timestamp */
  timestamp: Date
}

/**
 * Return type for useAIChat hook
 */
export interface UseAIChatReturn {
  /** Conversation history */
  messages: ChatMessage[]
  /** Whether a message is currently being processed */
  isLoading: boolean
  /** Error message if request failed */
  error: string | null
  /** Real-time streaming content from AI (updates character-by-character) */
  currentStreamContent: string
  /** Tool calls currently being executed */
  currentToolCalls: Array<{
    name: string
    input: Record<string, unknown>
    result?: unknown
  }>
  /** Send a message to the AI */
  sendMessage: (content: string) => Promise<void>
  /** Clear conversation history and reset state */
  clearMessages: () => void
  /** Retry the last user message (useful after errors) */
  retryLastMessage: () => Promise<void>
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Hook for AI chat with SSE streaming and conversation management
 *
 * @description
 * Manages a stateful chat conversation with an AI assistant, handling:
 * - User message submission with conversation history context
 * - Server-Sent Events (SSE) streaming for real-time responses
 * - Tool call execution tracking and result display
 * - Citation and source extraction from responses
 * - Automatic Supabase authentication token refresh
 * - Request cancellation with AbortController
 * - Error handling with retry capability
 *
 * The hook maintains conversation history in state and appends new messages
 * as they're sent and received. Streaming responses update `currentStreamContent`
 * in real-time character-by-character before being finalized in the message history.
 *
 * @returns {UseAIChatReturn} Chat state and control functions
 *
 * @example
 * // Basic chat implementation
 * function ChatInterface() {
 *   const { messages, sendMessage, isLoading, error } = useAIChat();
 *
 *   const handleSend = async (text: string) => {
 *     await sendMessage(text);
 *   };
 *
 *   return (
 *     <div>
 *       {messages.map((msg) => (
 *         <div key={msg.timestamp.toISOString()}>
 *           <strong>{msg.role}:</strong> {msg.content}
 *         </div>
 *       ))}
 *       {isLoading && <Spinner />}
 *       {error && <ErrorMessage>{error}</ErrorMessage>}
 *     </div>
 *   );
 * }
 *
 * @example
 * // With streaming display
 * function StreamingChat() {
 *   const { currentStreamContent, currentToolCalls, isLoading } = useAIChat();
 *
 *   return (
 *     <div>
 *       {isLoading && (
 *         <>
 *           <div className="streaming-content">{currentStreamContent}</div>
 *           {currentToolCalls.map((tool) => (
 *             <ToolCallIndicator key={tool.name} tool={tool} />
 *           ))}
 *         </>
 *       )}
 *     </div>
 *   );
 * }
 *
 * @example
 * // With retry on error
 * function ChatWithRetry() {
 *   const { error, retryLastMessage, clearMessages } = useAIChat();
 *
 *   return (
 *     <div>
 *       {error && (
 *         <div>
 *           <p>Error: {error}</p>
 *           <button onClick={retryLastMessage}>Retry</button>
 *           <button onClick={clearMessages}>Clear & Start Over</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 */
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

  /**
   * Send a message to the AI and stream the response
   *
   * @description
   * Sends a user message to the AI chat endpoint with full conversation history.
   * The response is streamed via Server-Sent Events (SSE) and parsed in real-time
   * to update currentStreamContent and currentToolCalls. Once complete, the full
   * assistant message is appended to the conversation history.
   *
   * The function:
   * - Validates input (non-empty, not already loading)
   * - Adds user message to conversation history
   * - Sends request with conversation context and language preference
   * - Streams response chunks and updates UI in real-time
   * - Handles tool calls with input and results
   * - Finalizes response and adds to message history
   * - Manages errors and cleanup
   *
   * @param content - User message text to send
   * @returns Promise that resolves when streaming completes or rejects on error
   *
   * @example
   * await sendMessage('What are the key points from the last meeting?');
   */
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

  /**
   * Clear conversation history and reset chat state
   *
   * @description
   * Clears all messages, errors, and streaming state. If a request is in progress,
   * it will be aborted. Useful for starting a fresh conversation or cleaning up
   * after an error.
   *
   * @example
   * <button onClick={clearMessages}>Start New Conversation</button>
   */
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setCurrentStreamContent('')
    setCurrentToolCalls([])
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  /**
   * Retry the last user message after an error
   *
   * @description
   * Re-sends the most recent user message to the AI. Removes the failed assistant
   * response (if any) and the user message from history before re-sending, so the
   * conversation history remains clean. Useful for recovering from errors or timeouts.
   *
   * @returns Promise that resolves when retry completes
   *
   * @example
   * // Error recovery UI
   * {error && (
   *   <button onClick={retryLastMessage}>
   *     Retry Last Message
   *   </button>
   * )}
   */
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
