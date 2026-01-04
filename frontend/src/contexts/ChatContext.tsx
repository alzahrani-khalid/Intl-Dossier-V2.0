/**
 * ChatContext Provider
 * Feature: 033-ai-brief-generation
 * Task: T039
 *
 * Global chat context for:
 * - Chat state persistence across navigation
 * - Open/close state management
 * - Session persistence
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface ChatContextState {
  isOpen: boolean
  isExpanded: boolean
  sessionId: string | null
  lastActivity: Date | null
}

export interface ChatContextValue extends ChatContextState {
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  setExpanded: (expanded: boolean) => void
  setSessionId: (id: string | null) => void
  updateLastActivity: () => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)

  const openChat = useCallback(() => {
    setIsOpen(true)
    setLastActivity(new Date())
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setLastActivity(new Date())
      }
      return !prev
    })
  }, [])

  const setExpanded = useCallback((expanded: boolean) => {
    setIsExpanded(expanded)
  }, [])

  const handleSetSessionId = useCallback((id: string | null) => {
    setSessionId(id)
  }, [])

  const updateLastActivity = useCallback(() => {
    setLastActivity(new Date())
  }, [])

  const value: ChatContextValue = {
    isOpen,
    isExpanded,
    sessionId,
    lastActivity,
    openChat,
    closeChat,
    toggleChat,
    setExpanded,
    setSessionId: handleSetSessionId,
    updateLastActivity,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

export default ChatContext
