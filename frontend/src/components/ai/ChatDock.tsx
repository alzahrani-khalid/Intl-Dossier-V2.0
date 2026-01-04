/**
 * ChatDock Component
 * Feature: 033-ai-brief-generation
 * Task: T034
 *
 * Persistent chat dock component with:
 * - FAB (Floating Action Button) to open/close
 * - Expandable panel
 * - Message history
 * - Tool result display
 * - RTL support
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { MessageCircle, X, Minimize2, Maximize2, Trash2, Sparkles } from 'lucide-react'
import { ChatMessage, type Citation, type ToolCall } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useAIChat } from '@/hooks/useAIChat'

export interface ChatDockProps {
  onCitationClick?: (type: string, id: string) => void
  className?: string
}

export function ChatDock({ onCitationClick, className }: ChatDockProps) {
  const { t, i18n } = useTranslation('ai-chat')
  const isRTL = i18n.language === 'ar'
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isLoading,
    currentStreamContent,
    currentToolCalls,
    sendMessage,
    clearMessages,
  } = useAIChat()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentStreamContent])

  const handleSend = async (content: string) => {
    await sendMessage(content)
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsExpanded(false)
    }
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={cn('fixed z-50', isRTL ? 'left-4' : 'right-4', 'bottom-4', className)}>
      {/* Chat Panel */}
      {isOpen && (
        <Card
          className={cn(
            'mb-4 flex flex-col shadow-xl border',
            'transition-all duration-300 ease-in-out',
            isExpanded ? 'w-[480px] h-[600px]' : 'w-[360px] h-[480px]',
            'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]',
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <CardHeader className="py-3 px-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  {t('title', 'AI Assistant')}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearMessages}
                  title={t('clearChat', 'Clear chat')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleExpanded}
                  title={isExpanded ? t('minimize', 'Minimize') : t('expand', 'Expand')}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleOpen}
                  title={t('close', 'Close')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="min-h-full">
              {messages.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {t('welcomeTitle', 'How can I help you?')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[250px]">
                    {t(
                      'welcomeMessage',
                      'Ask me about dossiers, commitments, engagements, or any other information in the system.',
                    )}
                  </p>
                  <div className="mt-6 space-y-2 w-full max-w-[280px]">
                    <SuggestionButton
                      onClick={() => handleSend('What are our active commitments?')}
                      isRTL={isRTL}
                    >
                      {t('suggestion1', 'What are our active commitments?')}
                    </SuggestionButton>
                    <SuggestionButton
                      onClick={() => handleSend('Find dossiers about trade agreements')}
                      isRTL={isRTL}
                    >
                      {t('suggestion2', 'Find dossiers about trade agreements')}
                    </SuggestionButton>
                    <SuggestionButton
                      onClick={() => handleSend('Show recent engagements')}
                      isRTL={isRTL}
                    >
                      {t('suggestion3', 'Show recent engagements')}
                    </SuggestionButton>
                  </div>
                </div>
              ) : (
                <div className="pb-4">
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={index}
                      role={message.role as 'user' | 'assistant'}
                      content={message.content}
                      toolCalls={message.toolCalls as ToolCall[]}
                      citations={message.citations as Citation[]}
                      onCitationClick={onCitationClick}
                    />
                  ))}

                  {/* Streaming message */}
                  {isLoading && (
                    <ChatMessage
                      role="assistant"
                      content={currentStreamContent || ''}
                      toolCalls={currentToolCalls as ToolCall[]}
                      isStreaming={true}
                    />
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            placeholder={t('inputPlaceholder', 'Ask a question...')}
          />
        </Card>
      )}

      {/* FAB Button */}
      <Button
        onClick={toggleOpen}
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg',
          'transition-all duration-300',
          'hover:scale-105 active:scale-95',
          isOpen && 'bg-muted text-muted-foreground hover:bg-muted',
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  )
}

interface SuggestionButtonProps {
  children: React.ReactNode
  onClick: () => void
  isRTL: boolean
}

function SuggestionButton({ children, onClick, isRTL }: SuggestionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-start text-sm px-3 py-2 rounded-lg',
        'bg-muted/50 hover:bg-muted transition-colors',
        'text-muted-foreground hover:text-foreground',
        isRTL && 'text-end',
      )}
    >
      {children}
    </button>
  )
}

export default ChatDock
