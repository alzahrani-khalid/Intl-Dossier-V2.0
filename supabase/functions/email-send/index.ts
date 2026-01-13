import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Email Send Edge Function
 *
 * Processes the email queue and sends emails via configured provider
 * Supports:
 * - Template-based emails with variable substitution
 * - Bilingual support (EN/AR)
 * - Retry logic with exponential backoff
 * - Unsubscribe link generation
 * - Tracking (opens, clicks)
 */

interface EmailProvider {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// SendGrid Provider
class SendGridProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = Deno.env.get('SENDGRID_API_KEY') ?? '';
    this.fromEmail = Deno.env.get('EMAIL_FROM_ADDRESS') ?? 'noreply@stats.gov.sa';
    this.fromName = Deno.env.get('EMAIL_FROM_NAME') ?? 'International Dossier System';
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to, name: options.toName }],
            },
          ],
          from: { email: this.fromEmail, name: this.fromName },
          reply_to: options.replyTo ? { email: options.replyTo } : undefined,
          subject: options.subject,
          content: [
            options.text ? { type: 'text/plain', value: options.text } : null,
            { type: 'text/html', value: options.html },
          ].filter(Boolean),
          headers: options.headers,
          tracking_settings: {
            open_tracking: { enable: options.trackOpens ?? true },
            click_tracking: { enable: options.trackClicks ?? true },
          },
        }),
      });

      if (response.ok) {
        const messageId = response.headers.get('X-Message-Id');
        return { success: true, messageId: messageId ?? undefined };
      } else {
        const errorBody = await response.text();
        return { success: false, error: `SendGrid error: ${response.status} - ${errorBody}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Resend Provider (alternative)
class ResendProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    this.fromEmail = Deno.env.get('EMAIL_FROM_ADDRESS') ?? 'noreply@stats.gov.sa';
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
          headers: options.headers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, messageId: data.id };
      } else {
        return { success: false, error: data.message || 'Resend error' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Get configured email provider
function getEmailProvider(): EmailProvider {
  const provider = Deno.env.get('EMAIL_PROVIDER') ?? 'sendgrid';
  switch (provider.toLowerCase()) {
    case 'resend':
      return new ResendProvider();
    case 'sendgrid':
    default:
      return new SendGridProvider();
  }
}

// Replace template variables
function replaceTemplateVariables(template: string, data: Record<string, any>): string {
  let result = template;

  // Simple variable replacement: {{variable_name}}
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }

  // Handle conditional blocks: {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    return data[varName] ? content : '';
  });

  return result;
}

// Calculate exponential backoff delay
function getBackoffDelay(attempts: number): number {
  // Base delay of 1 minute, exponentially increasing with some jitter
  const baseDelay = 60000; // 1 minute
  const maxDelay = 3600000; // 1 hour
  const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
  // Add jitter (0-25% of delay)
  return delay + Math.random() * delay * 0.25;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const emailProvider = getEmailProvider();
    const now = new Date();
    const results: Array<{ id: string; status: string; error?: string }> = [];

    // Determine operation mode
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') ?? 'process_queue';

    if (mode === 'send_single') {
      // Send a single email immediately (for testing or urgent emails)
      const body = await req.json();

      if (!body.to || !body.subject || !body.html) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await emailProvider.send({
        to: body.to,
        toName: body.to_name,
        subject: body.subject,
        html: body.html,
        text: body.text,
        replyTo: body.reply_to,
        headers: body.headers,
      });

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process queue mode - fetch pending emails
    const batchSize = parseInt(url.searchParams.get('batch_size') ?? '10');

    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('next_attempt_at', now.toISOString())
      .lt('attempts', supabaseClient.rpc('get_column', { column: 'max_attempts' }))
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({
          status: 'completed',
          processed: 0,
          message: 'No pending emails in queue',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Process each email
    for (const email of pendingEmails) {
      try {
        // Update status to queued
        await supabaseClient
          .from('email_queue')
          .update({ status: 'queued', updated_at: now.toISOString() })
          .eq('id', email.id);

        // Apply template data if using a template
        let subject = email.subject;
        let bodyHtml = email.body_html;
        let bodyText = email.body_text;

        if (email.template_data && Object.keys(email.template_data).length > 0) {
          subject = replaceTemplateVariables(subject, email.template_data);
          bodyHtml = replaceTemplateVariables(bodyHtml, email.template_data);
          if (bodyText) {
            bodyText = replaceTemplateVariables(bodyText, email.template_data);
          }
        }

        // Generate unsubscribe token and add to email
        let unsubscribeUrl = '';
        if (email.user_id) {
          const { data: tokenData } = await supabaseClient.rpc('generate_unsubscribe_token', {
            p_user_id: email.user_id,
            p_type: email.template_type ?? 'all',
          });

          if (tokenData) {
            unsubscribeUrl = `${Deno.env.get('APP_URL')}/unsubscribe?token=${tokenData}`;

            // Add unsubscribe link to email footer
            bodyHtml = bodyHtml.replace(
              '</body>',
              `<div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #666;">
                  <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> |
                  <a href="${unsubscribeUrl}" style="color: #666;">إلغاء الاشتراك</a>
                </p>
              </div></body>`
            );
          }
        }

        // Add reply-to header for ticket-related emails
        let replyTo: string | undefined;
        let headers: Record<string, string> = {};

        if (email.ticket_id) {
          // Get ticket number for threading
          const { data: ticket } = await supabaseClient
            .from('intake_tickets')
            .select('ticket_number')
            .eq('id', email.ticket_id)
            .single();

          if (ticket) {
            // Set reply-to address that includes ticket reference
            const replyAddress = Deno.env.get('EMAIL_REPLY_TO_ADDRESS') ?? 'support@stats.gov.sa';
            replyTo = `${ticket.ticket_number}+${replyAddress}`;

            // Add threading headers
            headers['X-Ticket-Number'] = ticket.ticket_number;
            headers['X-Ticket-ID'] = email.ticket_id;
          }
        }

        // Send the email
        const sendResult = await emailProvider.send({
          to: email.to_email,
          toName: email.to_name,
          subject,
          html: bodyHtml,
          text: bodyText,
          replyTo,
          headers,
          trackOpens: true,
          trackClicks: true,
        });

        if (sendResult.success) {
          // Update to sent status
          await supabaseClient
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: now.toISOString(),
              external_id: sendResult.messageId,
              updated_at: now.toISOString(),
            })
            .eq('id', email.id);

          results.push({ id: email.id, status: 'sent' });
        } else {
          // Handle failure
          const newAttempts = email.attempts + 1;
          const nextAttemptAt = new Date(now.getTime() + getBackoffDelay(newAttempts));

          await supabaseClient
            .from('email_queue')
            .update({
              status: newAttempts >= email.max_attempts ? 'failed' : 'pending',
              attempts: newAttempts,
              next_attempt_at: nextAttemptAt.toISOString(),
              last_error: sendResult.error,
              updated_at: now.toISOString(),
            })
            .eq('id', email.id);

          results.push({ id: email.id, status: 'failed', error: sendResult.error });
        }
      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError);

        // Mark as failed
        await supabaseClient
          .from('email_queue')
          .update({
            status: 'failed',
            last_error: emailError instanceof Error ? emailError.message : 'Unknown error',
            updated_at: now.toISOString(),
          })
          .eq('id', email.id);

        results.push({
          id: email.id,
          status: 'error',
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    // Return summary
    const sent = results.filter((r) => r.status === 'sent').length;
    const failed = results.filter((r) => r.status !== 'sent').length;

    return new Response(
      JSON.stringify({
        status: 'completed',
        processed: results.length,
        sent,
        failed,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
