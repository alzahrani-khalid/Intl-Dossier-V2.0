import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, RefreshCw, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

interface SuggestedPrompt {
  icon: React.ReactNode
  title: string
  prompt: string
}

export function WordAssistantPage() {
  const { t, i18n } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isRTL = i18n.language === 'ar'

  const suggestedPrompts: SuggestedPrompt[] = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: t('wordAssistant.prompts.briefTitle'),
      prompt: t('wordAssistant.prompts.briefPrompt')
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: t('wordAssistant.prompts.analysisTitle'),
      prompt: t('wordAssistant.prompts.analysisPrompt')
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: t('wordAssistant.prompts.summaryTitle'),
      prompt: t('wordAssistant.prompts.summaryPrompt')
    },
    {
      icon: <Bot className="h-5 w-5" />,
      title: t('wordAssistant.prompts.recommendationTitle'),
      prompt: t('wordAssistant.prompts.recommendationPrompt')
    }
  ]

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])

      // Add typing indicator
      const typingMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true
      }
      setMessages(prev => [...prev, typingMessage])

      // Call AnythingLLM via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('word-assistant', {
        body: {
          message,
          context: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      })

      if (error) {
        // Handle fallback
        if (!isConnected) {
          throw new Error(t('wordAssistant.offlineError'))
        }
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      // Remove typing indicator and add response
      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.isTyping)
        return [...withoutTyping, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]
      })
    },
    onError: (error) => {
      // Remove typing indicator
      setMessages(prev => prev.filter(m => !m.isTyping))
      
      // Add error message
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: t('wordAssistant.errorMessage'),
        timestamp: new Date()
      }])
    }
  })

  const handleSend = () => {
    if (!input.trim()) return
    sendMessageMutation.mutate(input)
    setInput('')
  }

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check AnythingLLM connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('word-assistant', {
          body: { healthCheck: true }
        })
        setIsConnected(!error)
      } catch {
        setIsConnected(false)
      }
    }
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('navigation.wordAssistant')}</h1>
          <p className="text-muted-foreground mt-1">{t('wordAssistant.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-600' : 'bg-red-600'
            }`} />
            {isConnected ? t('wordAssistant.connected') : t('wordAssistant.disconnected')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessages([])}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('wordAssistant.clearChat')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4 h-[calc(100%-5rem)]">
        <div className="md:col-span-3">
          <Card className="h-full flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">{t('wordAssistant.welcomeTitle')}</h2>
                  <p className="text-muted-foreground max-w-md">
                    {t('wordAssistant.welcomeMessage')}
                  </p>
                  <div className="grid gap-3 mt-6 md:grid-cols-2 w-full max-w-2xl">
                    {suggestedPrompts.map((prompt, i) => (
                      <Card
                        key={i}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handlePromptClick(prompt.prompt)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="text-primary">{prompt.icon}</div>
                            <div className="text-left">
                              <p className="font-medium text-sm">{prompt.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {prompt.prompt}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[70%] ${
                        message.role === 'user' ? 'order-1' : 'order-2'
                      }`}>
                        <Card className={`${
                          message.role === 'user' ? 'bg-primary text-primary-foreground' : ''
                        }`}>
                          <CardContent className="p-4">
                            {message.isTyping ? (
                              <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-current animate-bounce" />
                                <span className="w-2 h-2 rounded-full bg-current animate-bounce delay-100" />
                                <span className="w-2 h-2 rounded-full bg-current animate-bounce delay-200" />
                              </div>
                            ) : (
                              <>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-current/10">
                                  <span className="text-xs opacity-70">
                                    {format(message.timestamp, 'HH:mm')}
                                  </span>
                                  {message.role === 'assistant' && (
                                    <div className="flex gap-1 ml-auto">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(message.content)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                      >
                                        <ThumbsUp className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                      >
                                        <ThumbsDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center order-2">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardContent>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t('wordAssistant.inputPlaceholder')}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">{t('wordAssistant.capabilities')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• {t('wordAssistant.capability1')}</li>
                <li>• {t('wordAssistant.capability2')}</li>
                <li>• {t('wordAssistant.capability3')}</li>
                <li>• {t('wordAssistant.capability4')}</li>
                <li>• {t('wordAssistant.capability5')}</li>
                <li>• {t('wordAssistant.capability6')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('wordAssistant.tips')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• {t('wordAssistant.tip1')}</li>
                <li>• {t('wordAssistant.tip2')}</li>
                <li>• {t('wordAssistant.tip3')}</li>
                <li>• {t('wordAssistant.tip4')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}