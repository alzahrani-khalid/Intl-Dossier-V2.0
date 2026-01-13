/**
 * Entity Comments Edge Function
 *
 * Handles CRUD operations for the rich commenting system with:
 * - @mentions with notifications
 * - Threaded replies
 * - Markdown rendering
 * - Role-based visibility
 *
 * Endpoints:
 * GET    /entity-comments?entity_type=X&entity_id=Y - List comments
 * GET    /entity-comments/:id - Get single comment
 * GET    /entity-comments/:id/thread - Get comment thread
 * POST   /entity-comments - Create comment
 * PATCH  /entity-comments/:id - Update comment
 * DELETE /entity-comments/:id - Soft delete comment
 * POST   /entity-comments/:id/reactions - Toggle reaction
 * GET    /entity-comments/users/search?q=X - Search users for @mention
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface CreateCommentRequest {
  entity_type: string;
  entity_id: string;
  content: string;
  parent_id?: string;
  visibility?: 'public' | 'internal' | 'team' | 'private';
}

interface UpdateCommentRequest {
  content: string;
  visibility?: 'public' | 'internal' | 'team' | 'private';
}

interface ToggleReactionRequest {
  emoji: string;
}

interface MentionInfo {
  username: string;
  user_id: string;
  start_position: number;
  end_position: number;
}

// Allowed emojis for reactions
const ALLOWED_EMOJIS = ['👍', '👎', '❤️', '🎉', '😄', '😕', '🚀', '👀', '✅', '❓', '💡', '🔥'];

// Allowed entity types
const ALLOWED_ENTITY_TYPES = [
  'dossier',
  'country',
  'organization',
  'forum',
  'mou',
  'event',
  'position',
  'intake_ticket',
  'engagement',
  'working_group',
  'document',
  'brief',
];

// Simple markdown to HTML converter
function renderMarkdown(content: string): string {
  let html = content;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // @mentions - render as styled span
  html = html.replace(/@([a-zA-Z0-9_.-]+)/g, '<span class="mention" data-username="$1">@$1</span>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

// Extract mentions from content
function extractMentions(content: string): { username: string; start: number; end: number }[] {
  const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
  const mentions: { username: string; start: number; end: number }[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      username: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return mentions;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: { code: 'UNAUTHORIZED', message_en: 'Missing authorization header' },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message_en: 'Invalid token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const basePath = pathParts[0]; // 'entity-comments'
    const commentId = pathParts[1];
    const subPath = pathParts[2]; // 'thread', 'reactions', etc.

    // Route handling
    switch (req.method) {
      case 'GET': {
        // Search users for @mention
        if (commentId === 'users' && subPath === 'search') {
          const query = url.searchParams.get('q') || '';
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 20);

          if (query.length < 1) {
            return new Response(JSON.stringify({ users: [] }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { data: users, error } = await adminClient.rpc('search_users_for_mention', {
            p_search_term: query,
            p_limit: limit,
          });

          if (error) throw error;

          return new Response(JSON.stringify({ users: users || [] }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get comment thread
        if (commentId && subPath === 'thread') {
          const maxDepth = Math.min(parseInt(url.searchParams.get('max_depth') || '5'), 5);

          const { data: thread, error } = await supabase.rpc('get_comment_thread', {
            p_thread_root_id: commentId,
            p_max_depth: maxDepth,
          });

          if (error) throw error;

          return new Response(JSON.stringify({ thread: thread || [] }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get single comment
        if (commentId && !subPath) {
          const { data: comment, error } = await supabase
            .from('entity_comments_with_details')
            .select('*')
            .eq('id', commentId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              return new Response(
                JSON.stringify({ error: { code: 'NOT_FOUND', message_en: 'Comment not found' } }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            throw error;
          }

          return new Response(JSON.stringify({ comment }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // List comments for entity
        const entityType = url.searchParams.get('entity_type');
        const entityId = url.searchParams.get('entity_id');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const includeReplies = url.searchParams.get('include_replies') !== 'false';

        if (!entityType || !entityId) {
          return new Response(
            JSON.stringify({
              error: { code: 'BAD_REQUEST', message_en: 'entity_type and entity_id are required' },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!ALLOWED_ENTITY_TYPES.includes(entityType)) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message_en: 'Invalid entity_type' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: comments, error } = await supabase.rpc('get_entity_comments', {
          p_entity_type: entityType,
          p_entity_id: entityId,
          p_limit: limit,
          p_offset: offset,
          p_include_replies: includeReplies,
        });

        if (error) throw error;

        // Get total count
        const { count } = await supabase
          .from('entity_comments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .eq('is_deleted', false);

        return new Response(
          JSON.stringify({
            comments: comments || [],
            pagination: {
              offset,
              limit,
              total: count || 0,
              has_more: (count || 0) > offset + limit,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        // Toggle reaction
        if (commentId && subPath === 'reactions') {
          const body: ToggleReactionRequest = await req.json();
          const { emoji } = body;

          if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
            return new Response(
              JSON.stringify({
                error: {
                  code: 'BAD_REQUEST',
                  message_en: `Invalid emoji. Allowed: ${ALLOWED_EMOJIS.join(', ')}`,
                },
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Check if reaction exists
          const { data: existingReaction } = await supabase
            .from('entity_comment_reactions')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', user.id)
            .eq('emoji', emoji)
            .single();

          if (existingReaction) {
            // Remove reaction
            const { error } = await supabase
              .from('entity_comment_reactions')
              .delete()
              .eq('id', existingReaction.id);

            if (error) throw error;

            return new Response(JSON.stringify({ action: 'removed', emoji }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            // Add reaction
            const { data: reaction, error } = await supabase
              .from('entity_comment_reactions')
              .insert({
                comment_id: commentId,
                user_id: user.id,
                emoji,
              })
              .select()
              .single();

            if (error) throw error;

            // Create notification for comment author
            const { data: comment } = await supabase
              .from('entity_comments')
              .select('author_id, entity_type, entity_id')
              .eq('id', commentId)
              .single();

            if (comment && comment.author_id !== user.id) {
              await adminClient
                .from('entity_comment_notifications')
                .insert({
                  user_id: comment.author_id,
                  comment_id: commentId,
                  notification_type: 'reaction',
                  actor_id: user.id,
                  entity_type: comment.entity_type,
                  entity_id: comment.entity_id,
                })
                .onConflict('user_id,comment_id,notification_type,actor_id')
                .ignore();
            }

            return new Response(JSON.stringify({ action: 'added', emoji, reaction }), {
              status: 201,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Create comment
        const body: CreateCommentRequest = await req.json();
        const { entity_type, entity_id, content, parent_id, visibility = 'public' } = body;

        // Validation
        if (!entity_type || !entity_id || !content) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'BAD_REQUEST',
                message_en: 'entity_type, entity_id, and content are required',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!ALLOWED_ENTITY_TYPES.includes(entity_type)) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message_en: 'Invalid entity_type' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (content.length > 10000) {
          return new Response(
            JSON.stringify({
              error: { code: 'BAD_REQUEST', message_en: 'Content exceeds 10000 characters' },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Rate limiting: max 10 comments per minute per entity
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { count: recentCount } = await supabase
          .from('entity_comments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)
          .eq('author_id', user.id)
          .gte('created_at', oneMinuteAgo);

        if ((recentCount || 0) >= 10) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'RATE_LIMIT',
                message_en: 'Too many comments. Please wait before posting again.',
              },
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Render markdown
        const contentHtml = renderMarkdown(content);

        // Create comment
        const { data: comment, error: createError } = await supabase
          .from('entity_comments')
          .insert({
            entity_type,
            entity_id,
            content,
            content_html: contentHtml,
            parent_id: parent_id || null,
            author_id: user.id,
            visibility,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Process mentions
        const mentionMatches = extractMentions(content);
        const processedMentions: MentionInfo[] = [];

        for (const mention of mentionMatches) {
          // Find user by username or email
          const { data: mentionedUsers } = await adminClient.auth.admin.listUsers();
          const mentionedUser = mentionedUsers?.users.find(
            (u) =>
              u.user_metadata?.username === mention.username ||
              u.email?.split('@')[0] === mention.username
          );

          if (!mentionedUser) continue;

          // Create mention record
          await adminClient
            .from('entity_comment_mentions')
            .insert({
              comment_id: comment.id,
              mentioned_user_id: mentionedUser.id,
              start_position: mention.start,
              end_position: mention.end,
              mention_text: `@${mention.username}`,
              notification_sent: true,
              notification_sent_at: new Date().toISOString(),
            })
            .onConflict('comment_id,mentioned_user_id')
            .ignore();

          // Create notification
          await adminClient
            .from('entity_comment_notifications')
            .insert({
              user_id: mentionedUser.id,
              comment_id: comment.id,
              notification_type: 'mention',
              actor_id: user.id,
              entity_type,
              entity_id,
            })
            .onConflict('user_id,comment_id,notification_type,actor_id')
            .ignore();

          processedMentions.push({
            username: mention.username,
            user_id: mentionedUser.id,
            start_position: mention.start,
            end_position: mention.end,
          });
        }

        // If this is a reply, notify the parent comment author
        if (parent_id) {
          const { data: parentComment } = await supabase
            .from('entity_comments')
            .select('author_id, entity_type, entity_id')
            .eq('id', parent_id)
            .single();

          if (parentComment && parentComment.author_id !== user.id) {
            await adminClient
              .from('entity_comment_notifications')
              .insert({
                user_id: parentComment.author_id,
                comment_id: comment.id,
                notification_type: 'reply',
                actor_id: user.id,
                entity_type: parentComment.entity_type,
                entity_id: parentComment.entity_id,
              })
              .onConflict('user_id,comment_id,notification_type,actor_id')
              .ignore();
          }
        }

        // Return enriched comment
        return new Response(
          JSON.stringify({
            comment: {
              ...comment,
              author: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email,
                avatar: user.user_metadata?.avatar_url,
              },
              mentions: processedMentions,
              reactions: {},
              reply_count: 0,
            },
          }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'PATCH': {
        if (!commentId) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message_en: 'Comment ID required' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: UpdateCommentRequest = await req.json();
        const { content, visibility } = body;

        if (!content) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message_en: 'Content is required' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (content.length > 10000) {
          return new Response(
            JSON.stringify({
              error: { code: 'BAD_REQUEST', message_en: 'Content exceeds 10000 characters' },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify ownership
        const { data: existingComment } = await supabase
          .from('entity_comments')
          .select('author_id')
          .eq('id', commentId)
          .single();

        if (!existingComment) {
          return new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message_en: 'Comment not found' } }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (existingComment.author_id !== user.id) {
          return new Response(
            JSON.stringify({
              error: { code: 'FORBIDDEN', message_en: 'You can only edit your own comments' },
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update
        const contentHtml = renderMarkdown(content);
        const updateData: Record<string, unknown> = {
          content,
          content_html: contentHtml,
        };
        if (visibility) {
          updateData.visibility = visibility;
        }

        const { data: updatedComment, error } = await supabase
          .from('entity_comments')
          .update(updateData)
          .eq('id', commentId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ comment: updatedComment }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'DELETE': {
        if (!commentId) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message_en: 'Comment ID required' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify ownership
        const { data: existingComment } = await supabase
          .from('entity_comments')
          .select('author_id')
          .eq('id', commentId)
          .single();

        if (!existingComment) {
          return new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message_en: 'Comment not found' } }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (existingComment.author_id !== user.id) {
          return new Response(
            JSON.stringify({
              error: { code: 'FORBIDDEN', message_en: 'You can only delete your own comments' },
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Soft delete
        const { error } = await supabase
          .from('entity_comments')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
          })
          .eq('id', commentId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(
          JSON.stringify({
            error: { code: 'METHOD_NOT_ALLOWED', message_en: 'Method not allowed' },
          }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Entity Comments Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
