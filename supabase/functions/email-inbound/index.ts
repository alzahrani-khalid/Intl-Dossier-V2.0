import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Email Inbound Processing Edge Function
 *
 * Handles incoming emails from email service webhooks (SendGrid, Mailgun, etc.)
 * Supports:
 * - Email-to-ticket conversion for new emails
 * - Thread tracking for replies
 * - Comment creation from email replies
 * - Attachment processing
 */

interface InboundEmailPayload {
  // Common email headers
  from: string;
  from_name?: string;
  to: string | string[];
  cc?: string | string[];
  subject: string;

  // Content
  text?: string;
  html?: string;

  // Threading headers
  message_id: string;
  in_reply_to?: string;
  references?: string;

  // Attachments
  attachments?: Array<{
    filename: string;
    content_type: string;
    content: string; // Base64 encoded
    size: number;
  }>;

  // Metadata
  spam_score?: number;
  spam_status?: string;
  headers?: Record<string, string>;
  raw_email?: string;
}

// Extract ticket number from subject line
function extractTicketNumber(subject: string): string | null {
  const match = subject.match(/\[?(TKT-\d{4}-\d{6})\]?/i);
  return match ? match[1].toUpperCase() : null;
}

// Extract email address from "Name <email>" format
function parseEmailAddress(email: string): { email: string; name?: string } {
  const match = email.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim() || undefined,
      email: match[2].trim().toLowerCase(),
    };
  }
  return { email: email.trim().toLowerCase() };
}

// Normalize array of emails
function normalizeEmails(emails: string | string[] | undefined): string[] {
  if (!emails) return [];
  const list = Array.isArray(emails) ? emails : [emails];
  return list.map((e) => parseEmailAddress(e).email);
}

// Strip quoted reply content from email body
function stripQuotedContent(text: string): string {
  // Common patterns for quoted replies
  const patterns = [
    /^>.*$/gm, // Lines starting with >
    /^On .* wrote:[\s\S]*/m, // "On ... wrote:" pattern
    /^-{3,}Original Message-{3,}[\s\S]*/im, // Original message separator
    /^From:.*[\s\S]*$/m, // From: header in reply
    /\n\n[-_]{2,}\n[\s\S]*/m, // Signature separator
  ];

  let cleaned = text;
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

// Generate thread ID from message headers
function generateThreadId(messageId: string, inReplyTo?: string, references?: string): string {
  // Use the first message ID in the chain as the thread ID
  if (references) {
    const refs = references.split(/\s+/);
    if (refs.length > 0) return refs[0];
  }
  if (inReplyTo) return inReplyTo;
  return messageId;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify webhook signature (depends on email provider)
    const webhookSecret = Deno.env.get('EMAIL_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature =
        req.headers.get('X-Webhook-Signature') ||
        req.headers.get('X-SendGrid-Signature') ||
        req.headers.get('X-Mailgun-Signature');
      // TODO: Implement signature verification based on provider
    }

    // Create admin client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const body: InboundEmailPayload = await req.json();

    // Validate required fields
    if (!body.from || !body.subject || !body.message_id) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Missing required fields: from, subject, message_id',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check spam score
    if (body.spam_score && body.spam_score > 5) {
      console.log('Email marked as spam, score:', body.spam_score);
      return new Response(
        JSON.stringify({
          status: 'rejected',
          reason: 'spam',
          spam_score: body.spam_score,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse sender information
    const sender = parseEmailAddress(body.from);
    const toEmails = normalizeEmails(body.to);
    const ccEmails = normalizeEmails(body.cc);

    // Generate thread ID
    const threadId = generateThreadId(body.message_id, body.in_reply_to, body.references);

    // Check if this is a reply to an existing ticket
    const ticketNumber = extractTicketNumber(body.subject);
    let existingThread = null;
    let existingTicket = null;

    // Try to find existing thread
    const { data: thread } = await supabaseClient
      .from('email_threads')
      .select('*, intake_tickets(*)')
      .eq('thread_id', threadId)
      .single();

    if (thread) {
      existingThread = thread;
      existingTicket = thread.intake_tickets;
    } else if (ticketNumber) {
      // Try to find ticket by number
      const { data: ticket } = await supabaseClient
        .from('intake_tickets')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single();

      if (ticket) {
        existingTicket = ticket;

        // Check for existing thread linked to this ticket
        const { data: linkedThread } = await supabaseClient
          .from('email_threads')
          .select('*')
          .eq('ticket_id', ticket.id)
          .single();

        existingThread = linkedThread;
      }
    }

    // Extract clean content
    const emailContent = body.text
      ? stripQuotedContent(body.text)
      : body.html
        ? body.html.replace(/<[^>]*>/g, ' ').trim()
        : '';

    // Process based on whether this is a new email or reply
    if (existingTicket) {
      // This is a reply to an existing ticket

      // Create or update thread
      if (!existingThread) {
        const { data: newThread, error: threadError } = await supabaseClient
          .from('email_threads')
          .insert({
            thread_id: threadId,
            subject: body.subject,
            ticket_id: existingTicket.id,
            from_email: sender.email,
            from_name: sender.name || body.from_name,
            to_emails: toEmails,
            cc_emails: ccEmails,
            message_count: 1,
            last_message_at: new Date().toISOString(),
            last_message_direction: 'inbound',
            is_processed: true,
          })
          .select()
          .single();

        if (threadError) {
          console.error('Error creating thread:', threadError);
          throw threadError;
        }
        existingThread = newThread;
      }

      // Create email message record
      const { data: emailMessage, error: messageError } = await supabaseClient
        .from('email_messages')
        .insert({
          thread_id: existingThread.id,
          message_id: body.message_id,
          in_reply_to: body.in_reply_to,
          references_ids: body.references?.split(/\s+/) || [],
          direction: 'inbound',
          status: 'delivered',
          subject: body.subject,
          body_text: body.text,
          body_html: body.html,
          from_email: sender.email,
          from_name: sender.name || body.from_name,
          to_emails: toEmails,
          cc_emails: ccEmails,
          headers: body.headers || {},
          raw_email: body.raw_email,
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error creating email message:', messageError);
        throw messageError;
      }

      // Find user by email if exists
      const { data: user } = await supabaseClient
        .from('users')
        .select('id')
        .eq('email', sender.email)
        .single();

      // Create ticket comment from email
      const { data: comment, error: commentError } = await supabaseClient
        .from('ticket_comments')
        .insert({
          ticket_id: existingTicket.id,
          user_id: user?.id || null,
          external_email: user ? null : sender.email,
          external_name: user ? null : sender.name || body.from_name,
          content: emailContent,
          source: 'email',
          email_message_id: emailMessage.id,
          is_internal: false,
          is_system: false,
        })
        .select()
        .single();

      if (commentError) {
        console.error('Error creating comment:', commentError);
        throw commentError;
      }

      // Update ticket's updated_at
      await supabaseClient
        .from('intake_tickets')
        .update({
          updated_at: new Date().toISOString(),
          updated_by: user?.id || existingTicket.created_by,
        })
        .eq('id', existingTicket.id);

      // Queue notification to assignee (if different from sender)
      if (existingTicket.assigned_to) {
        const { data: assignee } = await supabaseClient
          .from('users')
          .select('id, email')
          .eq('id', existingTicket.assigned_to)
          .single();

        if (assignee && assignee.email !== sender.email) {
          await supabaseClient.rpc('queue_email_notification', {
            p_user_id: assignee.id,
            p_template_type: 'comment_added',
            p_template_data: {
              ticket_number: existingTicket.ticket_number,
              ticket_title: existingTicket.title,
              commenter_name: sender.name || sender.email,
              comment_preview: emailContent.substring(0, 200),
              ticket_url: `${Deno.env.get('APP_URL')}/intake/${existingTicket.id}`,
            },
            p_ticket_id: existingTicket.id,
            p_priority: 5,
          });
        }
      }

      return new Response(
        JSON.stringify({
          status: 'processed',
          action: 'comment_added',
          ticket_id: existingTicket.id,
          ticket_number: existingTicket.ticket_number,
          comment_id: comment.id,
          thread_id: existingThread.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // This is a new email - create a new ticket

      // Find user by email if exists
      const { data: user } = await supabaseClient
        .from('users')
        .select('id')
        .eq('email', sender.email)
        .single();

      // Generate ticket number
      const now = new Date();
      const year = now.getFullYear();

      const { data: lastTicket } = await supabaseClient
        .from('intake_tickets')
        .select('ticket_number')
        .like('ticket_number', `TKT-${year}-%`)
        .order('ticket_number', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastTicket) {
        const match = lastTicket.ticket_number.match(/TKT-\d{4}-(\d{6})/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const newTicketNumber = `TKT-${year}-${nextNumber.toString().padStart(6, '0')}`;

      // Create the ticket
      const { data: newTicket, error: ticketError } = await supabaseClient
        .from('intake_tickets')
        .insert({
          ticket_number: newTicketNumber,
          request_type: 'engagement', // Default type for email-created tickets
          title: body.subject.substring(0, 200),
          description: emailContent,
          source: 'email',
          status: 'submitted',
          priority: 'medium',
          urgency: 'medium',
          sensitivity: 'internal',
          created_by: user?.id || null,
          submitted_at: now.toISOString(),
          client_metadata: {
            source: 'email',
            from_email: sender.email,
            from_name: sender.name,
            message_id: body.message_id,
          },
        })
        .select()
        .single();

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        throw ticketError;
      }

      // Create email thread
      const { data: newThread, error: threadError } = await supabaseClient
        .from('email_threads')
        .insert({
          thread_id: threadId,
          subject: body.subject,
          ticket_id: newTicket.id,
          from_email: sender.email,
          from_name: sender.name || body.from_name,
          to_emails: toEmails,
          cc_emails: ccEmails,
          message_count: 1,
          last_message_at: now.toISOString(),
          last_message_direction: 'inbound',
          is_processed: true,
        })
        .select()
        .single();

      if (threadError) {
        console.error('Error creating thread:', threadError);
        throw threadError;
      }

      // Create email message record
      const { error: messageError } = await supabaseClient.from('email_messages').insert({
        thread_id: newThread.id,
        message_id: body.message_id,
        in_reply_to: body.in_reply_to,
        references_ids: body.references?.split(/\s+/) || [],
        direction: 'inbound',
        status: 'delivered',
        subject: body.subject,
        body_text: body.text,
        body_html: body.html,
        from_email: sender.email,
        from_name: sender.name || body.from_name,
        to_emails: toEmails,
        cc_emails: ccEmails,
        headers: body.headers || {},
        raw_email: body.raw_email,
      });

      if (messageError) {
        console.error('Error creating email message:', messageError);
        throw messageError;
      }

      // Process attachments
      if (body.attachments && body.attachments.length > 0) {
        for (const attachment of body.attachments) {
          try {
            // Decode base64 content
            const content = Uint8Array.from(atob(attachment.content), (c) => c.charCodeAt(0));

            // Upload to storage
            const filePath = `tickets/${newTicket.id}/${crypto.randomUUID()}-${attachment.filename}`;
            const { error: uploadError } = await supabaseClient.storage
              .from('intake-attachments')
              .upload(filePath, content, {
                contentType: attachment.content_type,
              });

            if (!uploadError) {
              // Create attachment record
              await supabaseClient.from('intake_attachments').insert({
                ticket_id: newTicket.id,
                file_name: attachment.filename,
                file_path: filePath,
                file_size: attachment.size,
                file_type: attachment.content_type,
                uploaded_by: user?.id || null,
              });
            }
          } catch (attachError) {
            console.error('Error processing attachment:', attachError);
          }
        }
      }

      // Send auto-reply confirmation
      await supabaseClient.rpc('queue_email_notification', {
        p_user_id: user?.id,
        p_template_type: 'ticket_created',
        p_template_data: {
          ticket_number: newTicketNumber,
          ticket_title: newTicket.title,
          request_type: 'Email Request',
          priority: 'Medium',
          user_name: sender.name || sender.email.split('@')[0],
          ticket_url: `${Deno.env.get('APP_URL')}/intake/${newTicket.id}`,
        },
        p_ticket_id: newTicket.id,
        p_priority: 3,
      });

      // Update thread to mark auto-reply sent
      await supabaseClient
        .from('email_threads')
        .update({
          auto_reply_sent: true,
          auto_reply_sent_at: now.toISOString(),
        })
        .eq('id', newThread.id);

      return new Response(
        JSON.stringify({
          status: 'processed',
          action: 'ticket_created',
          ticket_id: newTicket.id,
          ticket_number: newTicketNumber,
          thread_id: newThread.id,
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
