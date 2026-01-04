/**
 * ChatInput Component
 * Feature: 033-ai-brief-generation
 * Task: T036
 *
 * Chat input component with:
 * - Text input with auto-resize
 * - Send button
 * - Keyboard handling (Enter to send, Shift+Enter for newline)
 * - RTL support
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Send, Loader2 } from 'lucide-react'

export interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder,
  className,
}: ChatInputProps) {
  const { t, i18n } = useTranslation('ai-chat')
  const isRTL = i18n.language === 'ar'
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !disabled && !isLoading) {
      onSend(trimmedMessage)
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn('flex items-end gap-2 p-3 border-t bg-background', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t('inputPlaceholder', 'Ask a question...')}
        disabled={disabled || isLoading}
        className={cn(
          'min-h-[44px] max-h-[150px] resize-none py-3',
          'rounded-2xl border-muted-foreground/20',
          'focus-visible:ring-1 focus-visible:ring-primary',
          isRTL && 'text-right',
        )}
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || isLoading || !message.trim()}
        size="icon"
        className={cn(
          'h-11 w-11 shrink-0 rounded-full',
          'transition-all duration-200',
          message.trim() ? 'bg-primary' : 'bg-muted',
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className={cn('h-5 w-5', isRTL && 'rotate-180')} />
        )}
      </Button>
    </div>
  )
}

export default ChatInput
