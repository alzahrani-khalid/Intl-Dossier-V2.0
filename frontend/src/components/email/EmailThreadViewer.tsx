import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  Mail,
  MailOpen,
  Reply,
  Forward,
  Paperclip,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'

interface EmailMessage {
  id: string
  thread_id: string
  message_id: string
  direction: 'inbound' | 'outbound'
  status: string
  subject: string
  body_text: string | null
  body_html: string | null
  from_email: string
  from_name: string | null
  to_emails: string[]
  cc_emails: string[]
  created_at: string
  sent_at: string | null
  opened_at: string | null
}

interface EmailThread {
  id: string
  thread_id: string
  subject: string
  ticket_id: string | null
  from_email: string
  from_name: string | null
  to_emails: string[]
  cc_emails: string[]
  message_count: number
  last_message_at: string
  last_message_direction: 'inbound' | 'outbound'
  created_at: string
  messages?: EmailMessage[]
}

interface EmailThreadViewerProps {
  ticketId: string
  onReply?: (threadId: string) => void
}

export function EmailThreadViewer({ ticketId, onReply }: EmailThreadViewerProps) {
  const { t, i18n } = useTranslation('email')
  const isRTL = i18n.language === 'ar'
  const locale = i18n.language === 'ar' ? ar : enUS

  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())

  // Fetch email threads for this ticket
  const { data: threads, isLoading } = useQuery({
    queryKey: ['emailThreads', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_threads')
        .select(
          `
          *,
          messages:email_messages(*)
        `,
        )
        .eq('ticket_id', ticketId)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      return data as EmailThread[]
    },
    enabled: !!ticketId,
  })

  const toggleMessage = (messageId: string) => {
    const newExpanded = new Set(expandedMessages)
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId)
    } else {
      newExpanded.add(messageId)
    }
    setExpandedMessages(newExpanded)
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      pending: { variant: 'secondary', label: t('status.pending') },
      queued: { variant: 'secondary', label: t('status.queued') },
      sent: { variant: 'default', label: t('status.sent') },
      delivered: { variant: 'default', label: t('status.delivered') },
      opened: { variant: 'default', label: t('status.opened') },
      bounced: { variant: 'destructive', label: t('status.bounced') },
      failed: { variant: 'destructive', label: t('status.failed') },
    }

    const config = statusConfig[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!threads || threads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Mail className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-center">{t('thread.noEmails')}</p>
          <p className="text-sm text-center mt-1">{t('thread.noEmailsDescription')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t('thread.emailThread')}
          <Badge variant="secondary">{threads.length}</Badge>
        </h3>
      </div>

      <ScrollArea className="h-[600px] pe-4">
        <div className="space-y-4">
          {threads.map((thread) => (
            <Card key={thread.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate text-start">
                      {thread.subject}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="truncate">{thread.from_name || thread.from_email}</span>
                      <span>-</span>
                      <span>
                        {formatDistanceToNow(new Date(thread.last_message_at), {
                          addSuffix: true,
                          locale,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {thread.message_count} {t('thread.messages')}
                    </Badge>
                    {onReply && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReply(thread.id)}
                        className="gap-1"
                      >
                        <Reply className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                        {t('thread.reply')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {thread.messages
                    ?.sort(
                      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                    )
                    .map((message, index) => (
                      <Collapsible
                        key={message.id}
                        open={
                          expandedMessages.has(message.id) ||
                          index === (thread.messages?.length || 0) - 1
                        }
                        onOpenChange={() => toggleMessage(message.id)}
                      >
                        <div
                          className={`rounded-lg border p-3 ${
                            message.direction === 'outbound'
                              ? 'bg-primary/5 border-primary/20'
                              : 'bg-muted/50'
                          }`}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src="" />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(message.from_name, message.from_email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 text-start">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">
                                      {message.from_name || message.from_email}
                                    </span>
                                    {message.direction === 'inbound' ? (
                                      <ArrowDownLeft className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                                    )}
                                    {getStatusBadge(message.status)}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(message.created_at), 'PPp', { locale })}
                                    {message.opened_at && (
                                      <>
                                        <span>-</span>
                                        <MailOpen className="h-3 w-3" />
                                        {t('thread.opened')}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {expandedMessages.has(message.id) ||
                                index === (thread.messages?.length || 0) - 1 ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <Separator className="my-3" />
                            <div className="space-y-2">
                              {/* To/CC recipients */}
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>
                                  <span className="font-medium">{t('thread.to')}:</span>{' '}
                                  {message.to_emails.join(', ')}
                                </p>
                                {message.cc_emails.length > 0 && (
                                  <p>
                                    <span className="font-medium">{t('thread.cc')}:</span>{' '}
                                    {message.cc_emails.join(', ')}
                                  </p>
                                )}
                              </div>

                              {/* Email body */}
                              <div className="mt-3 text-sm">
                                {message.body_html ? (
                                  <div
                                    className="prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: message.body_html }}
                                  />
                                ) : (
                                  <pre className="whitespace-pre-wrap font-sans">
                                    {message.body_text}
                                  </pre>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
