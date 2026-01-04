/**
 * ChatMessage Component
 * Feature: 033-ai-brief-generation
 * Task: T035
 *
 * Component for displaying individual chat messages with:
 * - User/assistant styling
 * - Tool call cards
 * - Citations with deep links
 */

import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { User, Bot, ExternalLink } from 'lucide-react'
import { ToolResultCard } from './ToolResultCard'

export interface Citation {
  type: string
  id: string
  title: string
  snippet?: string
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
  result?: unknown
}

export interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCalls?: ToolCall[]
  citations?: Citation[]
  isStreaming?: boolean
  onCitationClick?: (type: string, id: string) => void
  className?: string
}

export function ChatMessage({
  role,
  content,
  toolCalls = [],
  citations = [],
  isStreaming = false,
  onCitationClick,
  className,
}: ChatMessageProps) {
  const { i18n } = useTranslation('ai-chat')
  const isRTL = i18n.language === 'ar'
  const isUser = role === 'user'

  return (
    <div
      className={cn('flex gap-3 p-4', isUser ? 'flex-row-reverse' : 'flex-row', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Avatar */}
      <Avatar className={cn('h-8 w-8 shrink-0', isUser ? 'bg-primary' : 'bg-muted')}>
        <AvatarFallback className={isUser ? 'text-primary-foreground' : ''}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={cn('flex-1 space-y-2 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        {/* Tool calls (before main response) */}
        {!isUser && toolCalls.length > 0 && (
          <div className="space-y-2">
            {toolCalls.map((toolCall, index) => (
              <ToolResultCard
                key={index}
                toolName={toolCall.name}
                input={toolCall.input}
                result={toolCall.result}
              />
            ))}
          </div>
        )}

        {/* Main message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md',
            isRTL && isUser && 'rounded-br-2xl rounded-bl-md',
            isRTL && !isUser && 'rounded-bl-2xl rounded-br-md',
          )}
        >
          <p className={cn('text-sm whitespace-pre-wrap', isStreaming && 'animate-pulse')}>
            {content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ms-1 bg-current animate-pulse" />
            )}
          </p>
        </div>

        {/* Citations */}
        {!isUser && citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {citations.map((citation, index) => (
              <Badge
                key={index}
                variant="outline"
                className={cn(
                  'text-xs cursor-pointer hover:bg-muted transition-colors',
                  'flex items-center gap-1 px-2 py-0.5',
                )}
                onClick={() => onCitationClick?.(citation.type, citation.id)}
              >
                <span className="capitalize">{citation.type}</span>
                <ExternalLink className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
