/**
 * WebSocket Chat Endpoint for Mobile
 * Feature: 033-ai-brief-generation
 * Task: T032
 *
 * WebSocket endpoint for AI chat (mobile clients):
 * - Bidirectional streaming
 * - Session persistence
 * - Reconnection support
 */

import { WebSocket, WebSocketServer } from 'ws'
import { Server as HttpServer } from 'http'
import { chatAssistantAgent, ChatMessage } from '../../ai/agents/chat-assistant.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { isFeatureEnabled } from '../../ai/config.js'
import logger from '../../utils/logger.js'

interface WsMessage {
  type: 'auth' | 'message' | 'ping'
  token?: string
  content?: string
  conversationHistory?: ChatMessage[]
  language?: 'en' | 'ar'
}

interface AuthenticatedSocket extends WebSocket {
  userId?: string
  organizationId?: string
  isAuthenticated?: boolean
  lastActivity?: number
}

const PING_INTERVAL = 30000 // 30 seconds
const INACTIVITY_TIMEOUT = 300000 // 5 minutes

export function setupWebSocketChat(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: '/api/ai/ws-chat',
  })

  // Ping interval to keep connections alive
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedSocket) => {
      if (!ws.isAuthenticated) return

      // Check for inactivity
      if (ws.lastActivity && Date.now() - ws.lastActivity > INACTIVITY_TIMEOUT) {
        ws.terminate()
        return
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      }
    })
  }, PING_INTERVAL)

  wss.on('close', () => {
    clearInterval(pingInterval)
  })

  wss.on('connection', (ws: AuthenticatedSocket) => {
    ws.isAuthenticated = false
    ws.lastActivity = Date.now()

    logger.info('WebSocket connection established')

    ws.on('message', async (data: Buffer) => {
      ws.lastActivity = Date.now()

      try {
        const message: WsMessage = JSON.parse(data.toString())

        switch (message.type) {
          case 'auth':
            await handleAuth(ws, message.token)
            break

          case 'message':
            if (!ws.isAuthenticated) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  error: 'Not authenticated',
                  code: 'UNAUTHORIZED',
                }),
              )
              return
            }
            await handleMessage(ws, message)
            break

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }))
            break

          default:
            ws.send(
              JSON.stringify({
                type: 'error',
                error: 'Unknown message type',
                code: 'UNKNOWN_TYPE',
              }),
            )
        }
      } catch (error) {
        logger.error('WebSocket message handling failed', { error })
        ws.send(
          JSON.stringify({
            type: 'error',
            error: 'Invalid message format',
            code: 'INVALID_FORMAT',
          }),
        )
      }
    })

    ws.on('pong', () => {
      ws.lastActivity = Date.now()
    })

    ws.on('close', () => {
      logger.info('WebSocket connection closed', { userId: ws.userId })
    })

    ws.on('error', (error) => {
      logger.error('WebSocket error', { error, userId: ws.userId })
    })

    // Send initial connection acknowledgment
    ws.send(
      JSON.stringify({
        type: 'connected',
        message: 'Connected to AI Chat WebSocket',
      }),
    )
  })

  logger.info('WebSocket chat server initialized')
  return wss
}

async function handleAuth(ws: AuthenticatedSocket, token?: string): Promise<void> {
  if (!token) {
    ws.send(
      JSON.stringify({
        type: 'auth_error',
        error: 'Token required',
        code: 'TOKEN_REQUIRED',
      }),
    )
    return
  }

  try {
    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      ws.send(
        JSON.stringify({
          type: 'auth_error',
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
        }),
      )
      return
    }

    // Get user's organization
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('left_at', null)
      .single()

    if (membershipError || !membership) {
      ws.send(
        JSON.stringify({
          type: 'auth_error',
          error: 'User not in any organization',
          code: 'NO_ORGANIZATION',
        }),
      )
      return
    }

    // Check if chat feature is enabled
    if (!isFeatureEnabled('chat')) {
      ws.send(
        JSON.stringify({
          type: 'auth_error',
          error: 'AI Chat is disabled',
          code: 'FEATURE_DISABLED',
        }),
      )
      return
    }

    ws.userId = user.id
    ws.organizationId = membership.organization_id
    ws.isAuthenticated = true

    ws.send(
      JSON.stringify({
        type: 'auth_success',
        userId: user.id,
        organizationId: membership.organization_id,
      }),
    )

    logger.info('WebSocket authenticated', { userId: user.id })
  } catch (error) {
    logger.error('WebSocket auth failed', { error })
    ws.send(
      JSON.stringify({
        type: 'auth_error',
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
      }),
    )
  }
}

async function handleMessage(ws: AuthenticatedSocket, message: WsMessage): Promise<void> {
  if (!ws.userId || !ws.organizationId) {
    ws.send(
      JSON.stringify({
        type: 'error',
        error: 'Not authenticated',
        code: 'UNAUTHORIZED',
      }),
    )
    return
  }

  if (!message.content) {
    ws.send(
      JSON.stringify({
        type: 'error',
        error: 'Message content required',
        code: 'MISSING_CONTENT',
      }),
    )
    return
  }

  const conversationHistory = message.conversationHistory || []
  const language = message.language || 'en'

  // Record chat start
  const runId = await recordChatStart(ws.organizationId, ws.userId, message.content)

  // Send acknowledgment
  ws.send(
    JSON.stringify({
      type: 'message_received',
      runId,
    }),
  )

  let fullContent = ''
  const toolCalls: Array<{ name: string; input: Record<string, unknown>; result?: unknown }> = []

  try {
    for await (const chunk of chatAssistantAgent.chatStream({
      message: message.content,
      conversationHistory,
      organizationId: ws.organizationId,
      userId: ws.userId,
      language,
    })) {
      // Handle tool calls
      if (chunk.type === 'tool_call' && chunk.toolName) {
        ws.send(
          JSON.stringify({
            type: 'tool_call',
            name: chunk.toolName,
            input: chunk.toolInput,
            result: chunk.toolResult,
          }),
        )

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
        ws.send(
          JSON.stringify({
            type: 'content',
            content: chunk.content,
          }),
        )
        continue
      }

      // Handle done
      if (chunk.type === 'done') {
        ws.send(JSON.stringify({ type: 'done', runId }))
        break
      }

      // Handle error
      if (chunk.type === 'error') {
        ws.send(
          JSON.stringify({
            type: 'error',
            error: chunk.error,
            code: 'STREAM_ERROR',
          }),
        )
        break
      }
    }

    // Record completion
    await recordChatComplete(runId, fullContent, toolCalls)
  } catch (error) {
    logger.error('WebSocket chat stream failed', { error, userId: ws.userId })
    ws.send(
      JSON.stringify({
        type: 'error',
        error: 'Chat stream failed',
        code: 'STREAM_FAILED',
      }),
    )

    // Record failure
    if (runId) {
      await supabaseAdmin
        .from('ai_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', runId)
    }
  }
}

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
      provider: 'openai',
      model: 'gpt-4o',
      status: 'running',
      started_at: new Date().toISOString(),
      request_metadata: {
        initial_message: message.substring(0, 500),
        source: 'websocket',
      },
    })
    .select('id')
    .single()

  if (error) {
    logger.error('Failed to record WS chat start', { error })
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
    await supabaseAdmin
      .from('ai_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)

    // Record tool calls
    for (const toolCall of toolCalls) {
      await supabaseAdmin.from('ai_tool_calls').insert({
        run_id: runId,
        tool_name: toolCall.name,
        tool_input: toolCall.input,
        tool_output: toolCall.result,
        status: 'success',
      })
    }

    // Record assistant message
    await supabaseAdmin.from('ai_messages').insert({
      run_id: runId,
      role: 'assistant',
      content: response,
      sequence_number: 1,
    })
  } catch (error) {
    logger.error('Failed to record WS chat completion', { error, runId })
  }
}

export default setupWebSocketChat
