import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, RefreshCw, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

type AssistantAction =
 | 'complete'
 | 'translate'
 | 'summarize'
 | 'expand'
 | 'rephrase'
 | 'check_grammar'
 | 'generate_embeddings'

interface SendMessagePayload {
 text: string
 action?: AssistantAction
 targetLanguage?: 'en' | 'ar'
}

interface WordAssistantResponse {
 result: string
 tokens_used?: number
 model?: string
 session_id?: string
 embeddings?: number[]
 error?: string
}

interface MutationContext {
 typingMessageId: string
}

export function WordAssistantPage() {
 const { t } = useTranslation()
 const [messages, setMessages] = useState<Message[]>([])
 const [input, setInput] = useState('')
 const [isConnected, setIsConnected] = useState(true)
 const messagesEndRef = useRef<HTMLDivElement>(null)
 const messagesRef = useRef<Message[]>([])

 const suggestedPrompts: SuggestedPrompt[] = [
 {
 icon: <FileText className="size-5" />,
 title: t('wordAssistant.prompts.briefTitle'),
 prompt: t('wordAssistant.prompts.briefPrompt')
 },
 {
 icon: <Sparkles className="size-5" />,
 title: t('wordAssistant.prompts.analysisTitle'),
 prompt: t('wordAssistant.prompts.analysisPrompt')
 },
 {
 icon: <FileText className="size-5" />,
 title: t('wordAssistant.prompts.summaryTitle'),
 prompt: t('wordAssistant.prompts.summaryPrompt')
 },
 {
 icon: <Bot className="size-5" />,
 title: t('wordAssistant.prompts.recommendationTitle'),
 prompt: t('wordAssistant.prompts.recommendationPrompt')
 }
 ]

 useEffect(() => {
 messagesRef.current = messages
 }, [messages])

const assistantMode = (import.meta.env.VITE_WORD_ASSISTANT_MODE || 'fallback') as
 | 'supabase'
 | 'fallback'

function generateLocalAssistantResponse(message: string, history: string): WordAssistantResponse {
 const parts = [
 '📝 *Draft Response*',
 `You asked: ${message}`,
 history
 ? `Context considered (${Math.min(history.length, 120)} chars shown): ${history.slice(-120)}`
 : 'No prior context provided.',
 'Suggested next steps:',
 '- Refine the prompt with specific objectives or data points.',
 '- Add any constraints such as audience, tone, or deadline.',
 '- When the AI service is available, re-run for a full draft.'
 ]

 return {
 result: parts.join('\n\n'),
 model: 'local-fallback'
 }
}

const sendMessageMutation = useMutation<WordAssistantResponse, Error, SendMessagePayload, MutationContext>({
 mutationFn: async ({ text, action = 'complete', targetLanguage }): Promise<WordAssistantResponse> => {
 const conversationHistory = messagesRef.current
 .filter(message => !message.isTyping)
 .map(message => `${message.role.toUpperCase()}: ${message.content}`)
 .join('\n')

 if (assistantMode !== 'supabase') {
 return generateLocalAssistantResponse(text, conversationHistory)
 }

 const payload: Record<string, unknown> = {
 action,
 text,
 max_length: 400
 }

 if (conversationHistory) {
 payload.context = conversationHistory
 }

 if (targetLanguage) {
 payload.target_language = targetLanguage
 }

 const { data, error } = await supabase.functions.invoke<WordAssistantResponse>('word-assistant', {
 body: payload
 })

 if (error) {
 throw error
 }

 if (!data) {
 throw new Error(t('wordAssistant.errorMessage'))
 }

 return data
 },
 onMutate: async ({ text }) => {
 const userMessage: Message = {
 id: crypto.randomUUID(),
 role: 'user',
 content: text,
 timestamp: new Date()
 }

 const typingMessage: Message = {
 id: crypto.randomUUID(),
 role: 'assistant',
 content: '',
 timestamp: new Date(),
 isTyping: true
 }

 setMessages(prev => {
 const next = [...prev, userMessage, typingMessage]
 messagesRef.current = next
 return next
 })

 return { typingMessageId: typingMessage.id }
 },
 onSuccess: (data, _variables, context) => {
 setIsConnected(true)
 setMessages(prev => {
 const withoutTyping = context
 ? prev.filter(message => message.id !== context.typingMessageId)
 : prev.filter(message => !message.isTyping)

 const assistantMessage: Message = {
 id: crypto.randomUUID(),
 role: 'assistant',
 content: data.result || t('wordAssistant.fallbackContent'),
 timestamp: new Date()
 }

 const next = [...withoutTyping, assistantMessage]
 messagesRef.current = next
 return next
 })
 },
 onError: (error, _variables, context) => {
 setIsConnected(false)
 setMessages(prev => {
 const withoutTyping = context
 ? prev.filter(message => message.id !== context.typingMessageId)
 : prev.filter(message => !message.isTyping)

 const assistantMessage: Message = {
 id: crypto.randomUUID(),
 role: 'assistant',
 content: t('wordAssistant.errorMessage'),
 timestamp: new Date()
 }

 const next = [...withoutTyping, assistantMessage]
 messagesRef.current = next
 return next
 })
 console.error('Word assistant error:', error)
 }
 })

 const handleSend = () => {
 if (!input.trim()) return
 sendMessageMutation.mutate({ text: input.trim(), action: 'complete' })
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

 // Lightweight connectivity check on mount
 useEffect(() => {
 let isMounted = true

 const checkConnection = async () => {
 if (assistantMode !== 'supabase') {
 if (isMounted) setIsConnected(true)
 return
 }

 try {
 const { error } = await supabase.functions.invoke<WordAssistantResponse>('word-assistant', {
 body: {
 action: 'check_grammar',
 text: 'health check'
 }
 })
 if (isMounted) {
 setIsConnected(!error)
 }
 } catch (err) {
 console.warn('Word assistant connectivity check failed:', err)
 if (isMounted) {
 setIsConnected(false)
 }
 }
 }

 checkConnection()

 return () => {
 isMounted = false
 }
 }, [assistantMode])

 return (
 <div className="container mx-auto h-[calc(100vh-8rem)] py-6">
 <div className="mb-6 flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">{t('navigation.wordAssistant')}</h1>
 <p className="mt-1 text-muted-foreground">{t('wordAssistant.description')}</p>
 </div>
 <div className="flex items-center gap-2">
 <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
 isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
 }`}>
 <div className={`size-2 rounded-full ${
 isConnected ? 'bg-green-600' : 'bg-red-600'
 }`} />
 {isConnected ? t('wordAssistant.connected') : t('wordAssistant.disconnected')}
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setMessages([])}
 >
 <RefreshCw className="me-2 size-4" />
 {t('wordAssistant.clearChat')}
 </Button>
 </div>
 </div>

 <div className="grid h-[calc(100%-5rem)] gap-6 md:grid-cols-4">
 <div className="md:col-span-3">
 <Card className="flex h-full flex-col">
 <CardContent className="flex-1 overflow-y-auto p-6">
 {messages.length === 0 ? (
 <div className="flex h-full flex-col items-center justify-center text-center">
 <Bot className="mb-4 size-16 text-muted-foreground" />
 <h2 className="mb-2 text-xl font-semibold">{t('wordAssistant.welcomeTitle')}</h2>
 <p className="max-w-md text-muted-foreground">
 {t('wordAssistant.welcomeMessage')}
 </p>
 <div className="mt-6 grid w-full max-w-2xl gap-3 md:grid-cols-2">
 {suggestedPrompts.map((prompt, i) => (
 <Card
 key={i}
 className="cursor-pointer transition-shadow hover:shadow-md"
 onClick={() => handlePromptClick(prompt.prompt)}
 >
 <CardContent className="p-4">
 <div className="flex items-center gap-3">
 <div className="text-primary">{prompt.icon}</div>
 <div className="text-start">
 <p className="text-sm font-medium">{prompt.title}</p>
 <p className="line-clamp-2 text-xs text-muted-foreground">
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
 <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
 <Bot className="size-5 text-primary" />
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
 <span className="size-2 animate-bounce rounded-full bg-current" />
 <span className="size-2 animate-bounce rounded-full bg-current delay-100" />
 <span className="size-2 animate-bounce rounded-full bg-current delay-200" />
 </div>
 ) : (
 <>
 <p className="whitespace-pre-wrap">{message.content}</p>
 <div className="border-current/10 mt-3 flex items-center gap-2 border-t pt-3">
 <span className="text-xs opacity-70">
 {format(message.timestamp, 'HH:mm')}
 </span>
 {message.role === 'assistant' && (
 <div className="ms-auto flex gap-1">
 <Button
 size="sm"
 variant="ghost"
 className="size-6 p-0"
 onClick={() => copyToClipboard(message.content)}
 >
 <Copy className="size-3" />
 </Button>
 <Button
 size="sm"
 variant="ghost"
 className="size-6 p-0"
 >
 <ThumbsUp className="size-3" />
 </Button>
 <Button
 size="sm"
 variant="ghost"
 className="size-6 p-0"
 >
 <ThumbsDown className="size-3" />
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
 <div className="order-2 flex size-8 items-center justify-center rounded-full bg-primary">
 <User className="size-5 text-primary-foreground" />
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
 <Send className="size-4" />
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
 <ul className="space-y-2 text-sm text-muted-foreground">
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
 <ul className="space-y-2 text-sm text-muted-foreground">
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
