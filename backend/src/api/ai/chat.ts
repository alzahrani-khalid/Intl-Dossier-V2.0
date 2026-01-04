/**
 * AI Chat API Endpoint (SSE)
 * Feature: 033-ai-brief-generation
 * Task: T031
 *
 * Server-Sent Events endpoint for AI chat:
 * - POST /api/ai/chat - Send a message and receive streaming response
 * - Supports tool calls with results
 * - Records all interactions for observability
 */

import { Router, Request, Response } from 'express'
import { chatAssistantAgent, ChatMessage } from '../../ai/agents/chat-assistant.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { isFeatureEnabled } from '../../ai/config.js'
import logger from '../../utils/logger.js'

const router = Router()

const CHAT_TIMEOUT_MS = 30000 // 30 seconds for chat responses

// Use the global Express.Request type which already has user property

// Middleware to check feature flag
const checkFeatureEnabled = (_req: Request, res: Response, next: () => void): void => {
  if (!isFeatureEnabled('chat')) {
    res.status(403).json({
      error: 'AI Chat is disabled',
      code: 'FEATURE_DISABLED',
    })
    return
  }
  next()
}

/**
 * POST /api/ai/chat
 * Send a message and receive streaming response via SSE
 */
router.post('/', checkFeatureEnabled, async (req: Request, res: Response): Promise<void> => {
  const { message, conversation_history, language = 'en' } = req.body
  const userId = req.user?.id
  const organizationId = req.user?.organization_id

  if (!userId || !organizationId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (!message || typeof message !== 'string') {
    res.status(400).json({
      error: 'Message is required',
      code: 'MISSING_MESSAGE',
    })
    return
  }

  // Parse conversation history
  const conversationHistory: ChatMessage[] = Array.isArray(conversation_history)
    ? conversation_history.map((m: { role: string; content: string }) => ({
        role: m.role as ChatMessage['role'],
        content: m.content,
      }))
    : []

  // Check if client wants streaming
  const acceptsSSE = req.headers.accept?.includes('text/event-stream')

  if (acceptsSSE) {
    // SSE streaming response
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    // Set timeout
    const timeout = setTimeout(() => {
      res.write(`data: ${JSON.stringify({ type: 'timeout', message: 'Response timed out' })}\n\n`)
      res.end()
    }, CHAT_TIMEOUT_MS)

    try {
      // Record the conversation start
      const runId = await recordChatStart(organizationId, userId, message)
      res.write(`data: ${JSON.stringify({ type: 'init', runId })}\n\n`)

      let fullContent = ''
      const toolCalls: Array<{ name: string; input: Record<string, unknown>; result?: unknown }> =
        []

      for await (const chunk of chatAssistantAgent.chatStream({
        message,
        conversationHistory,
        organizationId,
        userId,
        language,
      })) {
        // Handle tool calls
        if (chunk.type === 'tool_call' && chunk.toolName) {
          const toolCallData = {
            type: 'tool_call',
            name: chunk.toolName,
            input: chunk.toolInput,
            result: chunk.toolResult,
          }
          res.write(`data: ${JSON.stringify(toolCallData)}\n\n`)

          if (chunk.toolResult) {
            toolCalls.push({
              name: chunk.toolName,
              input: chunk.toolInput || {},
              result: chunk.toolResult,
            })
          }
          continue
        }

        // Handle content
        if (chunk.type === 'content' && chunk.content) {
          fullContent += chunk.content
          res.write(`data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`)
          continue
        }

        // Handle done
        if (chunk.type === 'done') {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          break
        }

        // Handle error
        if (chunk.type === 'error') {
          res.write(`data: ${JSON.stringify({ type: 'error', error: chunk.error })}\n\n`)
          break
        }
      }

      clearTimeout(timeout)

      // Record the conversation completion
      await recordChatComplete(runId, fullContent, toolCalls)

      res.end()
    } catch (error) {
      clearTimeout(timeout)
      logger.error('SSE chat failed', { error })
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Chat failed' })}\n\n`)
      res.end()
    }
  } else {
    // Non-streaming JSON response
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Chat timed out')), CHAT_TIMEOUT_MS)
      })

      const response = await Promise.race([
        chatAssistantAgent.chat({
          message,
          conversationHistory,
          organizationId,
          userId,
          language,
        }),
        timeoutPromise,
      ])

      res.json({
        success: true,
        data: {
          content: response.content,
          toolCalls: response.toolCalls,
          citations: response.citations,
          runId: response.runId,
        },
      })
    } catch (error) {
      logger.error('Chat failed', { error })

      if (error instanceof Error && error.message === 'Chat timed out') {
        res.status(408).json({
          error: 'Chat response timed out',
          code: 'TIMEOUT',
        })
        return
      }

      res.status(500).json({
        error: 'Chat failed',
        code: 'CHAT_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
})

/**
 * GET /api/ai/chat/history
 * Get chat history for the current user
 */
router.get('/history', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id
  const organizationId = req.user?.organization_id
  const { limit = '50', offset = '0' } = req.query

  if (!userId || !organizationId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { data, error, count } = await supabaseAdmin
      .from('ai_runs')
      .select('id, created_at, request_metadata, status', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('feature', 'chat')
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)

    if (error) {
      logger.error('Failed to get chat history', { error })
      res.status(500).json({
        error: 'Failed to get chat history',
        code: 'FETCH_FAILED',
      })
      return
    }

    res.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    })
  } catch (error) {
    logger.error('Failed to get chat history', { error })
    res.status(500).json({
      error: 'Failed to get chat history',
      code: 'FETCH_FAILED',
    })
  }
})

/**
 * GET /api/ai/chat/:runId/messages
 * Get messages for a specific chat run
 */
router.get('/:runId/messages', async (req: Request, res: Response): Promise<void> => {
  const { runId } = req.params
  const userId = req.user?.id
  const organizationId = req.user?.organization_id

  if (!userId || !organizationId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    // Verify run belongs to user
    const { data: run, error: runError } = await supabaseAdmin
      .from('ai_runs')
      .select('id')
      .eq('id', runId)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single()

    if (runError || !run) {
      res.status(404).json({
        error: 'Chat session not found',
        code: 'NOT_FOUND',
      })
      return
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('ai_messages')
      .select('*')
      .eq('run_id', runId)
      .order('sequence_number', { ascending: true })

    if (messagesError) {
      logger.error('Failed to get chat messages', { error: messagesError })
      res.status(500).json({
        error: 'Failed to get messages',
        code: 'FETCH_FAILED',
      })
      return
    }

    res.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    logger.error('Failed to get chat messages', { error })
    res.status(500).json({
      error: 'Failed to get messages',
      code: 'FETCH_FAILED',
    })
  }
})

// Helper functions for recording chat interactions

async function recordChatStart(
  organizationId: string,
  userId: string,
  message: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('ai_runs')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      feature: 'chat',
      provider: 'openai', // Will be updated based on actual provider used
      model: 'gpt-4o',
      status: 'running',
      started_at: new Date().toISOString(),
      request_metadata: { initial_message: message.substring(0, 500) },
    })
    .select('id')
    .single()

  if (error) {
    logger.error('Failed to record chat start', { error })
    return ''
  }

  return data.id
}

async function recordChatComplete(
  runId: string,
  response: string,
  toolCalls: Array<{ name: string; input: Record<string, unknown>; result?: unknown }>,
): Promise<void> {
  if (!runId) return

  try {
    // Update run status
    await supabaseAdmin
      .from('ai_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)

    // Record messages
    const messages = [
      {
        run_id: runId,
        role: 'assistant',
        content: response,
        sequence_number: 1,
      },
    ]

    // Add tool call records
    for (let i = 0; i < toolCalls.length; i++) {
      const toolCall = toolCalls[i]
      if (toolCall) {
        await supabaseAdmin.from('ai_tool_calls').insert({
          run_id: runId,
          tool_name: toolCall.name,
          tool_input: toolCall.input,
          tool_output: toolCall.result,
          status: 'success',
        })
      }
    }

    await supabaseAdmin.from('ai_messages').insert(messages)
  } catch (error) {
    logger.error('Failed to record chat completion', { error, runId })
  }
}

export default router
