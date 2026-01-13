/**
 * Collaborative Editing Edge Function
 *
 * Handles real-time collaborative editing operations:
 * - Edit sessions (join/leave, cursor tracking)
 * - Suggestions (create, accept, reject)
 * - Track changes (create, accept, reject, bulk operations)
 * - Inline comments (create, update, resolve, delete)
 * - Collaborators (add, update, remove)
 * - Document locking
 *
 * Endpoints:
 * POST   /collaborative-editing/sessions/join - Join editing session
 * POST   /collaborative-editing/sessions/leave - Leave editing session
 * POST   /collaborative-editing/sessions/cursor - Update cursor position
 * GET    /collaborative-editing/:documentId/editors - Get active editors
 * GET    /collaborative-editing/:documentId/summary - Get collaboration summary
 *
 * GET    /collaborative-editing/:documentId/suggestions - List suggestions
 * POST   /collaborative-editing/:documentId/suggestions - Create suggestion
 * POST   /collaborative-editing/suggestions/:id/resolve - Accept/reject suggestion
 *
 * GET    /collaborative-editing/:documentId/changes - List track changes
 * POST   /collaborative-editing/:documentId/changes - Create track change
 * POST   /collaborative-editing/changes/:id/resolve - Accept/reject change
 * POST   /collaborative-editing/changes/group/:groupId/resolve - Accept/reject change group
 * POST   /collaborative-editing/:documentId/changes/accept-all - Accept all changes
 * POST   /collaborative-editing/:documentId/changes/reject-all - Reject all changes
 *
 * GET    /collaborative-editing/:documentId/comments - List inline comments
 * POST   /collaborative-editing/:documentId/comments - Create inline comment
 * PATCH  /collaborative-editing/comments/:id - Update inline comment
 * POST   /collaborative-editing/comments/:id/resolve - Resolve inline comment
 * DELETE /collaborative-editing/comments/:id - Delete inline comment
 *
 * GET    /collaborative-editing/:documentId/collaborators - List collaborators
 * POST   /collaborative-editing/:documentId/collaborators - Add collaborator
 * PATCH  /collaborative-editing/collaborators/:id - Update collaborator
 * DELETE /collaborative-editing/collaborators/:id - Remove collaborator
 *
 * POST   /collaborative-editing/:documentId/lock - Lock document
 * POST   /collaborative-editing/:documentId/unlock - Unlock document
 * PATCH  /collaborative-editing/:documentId/settings - Update settings
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface JoinSessionRequest {
  document_id: string;
  document_version_id?: string;
}

interface UpdateCursorRequest {
  session_id: string;
  cursor_position: {
    line: number;
    column: number;
    selection?: {
      start: { line: number; column: number };
      end: { line: number; column: number };
    };
  };
  viewport?: {
    scrollTop: number;
    scrollLeft: number;
    visibleRange: { start: number; end: number };
  };
}

interface CreateSuggestionRequest {
  document_version_id?: string;
  start_position: { line: number; column: number; offset: number };
  end_position: { line: number; column: number; offset: number };
  original_text: string;
  suggested_text: string;
  change_type: 'insertion' | 'deletion' | 'replacement' | 'formatting';
  comment?: string;
}

interface ResolveSuggestionRequest {
  accept: boolean;
  comment?: string;
}

interface CreateTrackChangeRequest {
  document_version_id?: string;
  session_id?: string;
  start_position: { line: number; column: number; offset: number };
  end_position: { line: number; column: number; offset: number };
  original_text?: string;
  new_text?: string;
  change_type: 'insertion' | 'deletion' | 'replacement' | 'formatting';
  change_group_id?: string;
  sequence_number?: number;
}

interface ResolveChangeRequest {
  accept: boolean;
}

interface CreateInlineCommentRequest {
  document_version_id?: string;
  anchor_start: { line: number; column: number; offset: number };
  anchor_end: { line: number; column: number; offset: number };
  highlighted_text: string;
  content: string;
  parent_id?: string;
  mentioned_users?: string[];
}

interface UpdateInlineCommentRequest {
  content: string;
  mentioned_users?: string[];
}

interface ResolveInlineCommentRequest {
  status: 'resolved' | 'dismissed' | 'open';
}

interface AddCollaboratorRequest {
  user_id: string;
  can_edit?: boolean;
  can_suggest?: boolean;
  can_comment?: boolean;
  can_resolve?: boolean;
  can_manage?: boolean;
  expires_at?: string;
}

interface UpdateCollaboratorRequest {
  can_edit?: boolean;
  can_suggest?: boolean;
  can_comment?: boolean;
  can_resolve?: boolean;
  can_manage?: boolean;
  expires_at?: string;
  is_active?: boolean;
}

interface LockDocumentRequest {
  reason?: string;
}

interface UpdateSettingsRequest {
  track_changes_enabled?: boolean;
  suggestions_enabled?: boolean;
}

// Simple markdown to HTML converter
function renderMarkdown(content: string): string {
  let html = content;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // @mentions
  html = html.replace(/@([a-zA-Z0-9_.-]+)/g, '<span class="mention" data-username="$1">@$1</span>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

// URL pattern matching
function matchRoute(
  pathname: string,
  method: string
): { handler: string; params: Record<string, string> } | null {
  const routes: Array<{
    pattern: RegExp;
    method: string;
    handler: string;
    paramNames: string[];
  }> = [
    // Sessions
    {
      pattern: /^\/collaborative-editing\/sessions\/join$/,
      method: 'POST',
      handler: 'joinSession',
      paramNames: [],
    },
    {
      pattern: /^\/collaborative-editing\/sessions\/leave$/,
      method: 'POST',
      handler: 'leaveSession',
      paramNames: [],
    },
    {
      pattern: /^\/collaborative-editing\/sessions\/cursor$/,
      method: 'POST',
      handler: 'updateCursor',
      paramNames: [],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/editors$/,
      method: 'GET',
      handler: 'getActiveEditors',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/summary$/,
      method: 'GET',
      handler: 'getSummary',
      paramNames: ['documentId'],
    },

    // Suggestions
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/suggestions$/,
      method: 'GET',
      handler: 'listSuggestions',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/suggestions$/,
      method: 'POST',
      handler: 'createSuggestion',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/suggestions\/([^/]+)\/resolve$/,
      method: 'POST',
      handler: 'resolveSuggestion',
      paramNames: ['suggestionId'],
    },

    // Track Changes
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/changes$/,
      method: 'GET',
      handler: 'listChanges',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/changes$/,
      method: 'POST',
      handler: 'createChange',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/changes\/([^/]+)\/resolve$/,
      method: 'POST',
      handler: 'resolveChange',
      paramNames: ['changeId'],
    },
    {
      pattern: /^\/collaborative-editing\/changes\/group\/([^/]+)\/resolve$/,
      method: 'POST',
      handler: 'resolveChangeGroup',
      paramNames: ['groupId'],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/changes\/accept-all$/,
      method: 'POST',
      handler: 'acceptAllChanges',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/changes\/reject-all$/,
      method: 'POST',
      handler: 'rejectAllChanges',
      paramNames: ['documentId'],
    },

    // Inline Comments
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/comments$/,
      method: 'GET',
      handler: 'listComments',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/comments$/,
      method: 'POST',
      handler: 'createComment',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/comments\/([^/]+)$/,
      method: 'PATCH',
      handler: 'updateComment',
      paramNames: ['commentId'],
    },
    {
      pattern: /^\/collaborative-editing\/comments\/([^/]+)\/resolve$/,
      method: 'POST',
      handler: 'resolveComment',
      paramNames: ['commentId'],
    },
    {
      pattern: /^\/collaborative-editing\/comments\/([^/]+)$/,
      method: 'DELETE',
      handler: 'deleteComment',
      paramNames: ['commentId'],
    },

    // Collaborators
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/collaborators$/,
      method: 'GET',
      handler: 'listCollaborators',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/collaborators$/,
      method: 'POST',
      handler: 'addCollaborator',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/collaborators\/([^/]+)$/,
      method: 'PATCH',
      handler: 'updateCollaborator',
      paramNames: ['collaboratorId'],
    },
    {
      pattern: /^\/collaborative-editing\/collaborators\/([^/]+)$/,
      method: 'DELETE',
      handler: 'removeCollaborator',
      paramNames: ['collaboratorId'],
    },

    // Document lock/settings
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/lock$/,
      method: 'POST',
      handler: 'lockDocument',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/unlock$/,
      method: 'POST',
      handler: 'unlockDocument',
      paramNames: ['documentId'],
    },
    {
      pattern: /^\/collaborative-editing\/([^/]+)\/settings$/,
      method: 'PATCH',
      handler: 'updateSettings',
      paramNames: ['documentId'],
    },
  ];

  for (const route of routes) {
    if (route.method !== method) continue;

    const match = pathname.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      return { handler: route.handler, params };
    }
  }

  return null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Match route
    const routeMatch = matchRoute(pathname, req.method);
    if (!routeMatch) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { handler, params } = routeMatch;
    let result: unknown;

    // Route handlers
    switch (handler) {
      // ========== SESSION HANDLERS ==========
      case 'joinSession': {
        const body: JoinSessionRequest = await req.json();
        const { data, error } = await supabase.rpc('join_edit_session', {
          p_document_id: body.document_id,
          p_document_version_id: body.document_version_id,
        });
        if (error) throw error;
        result = data;
        break;
      }

      case 'leaveSession': {
        const body = await req.json();
        const { error } = await supabase.rpc('leave_edit_session', {
          p_session_id: body.session_id,
        });
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'updateCursor': {
        const body: UpdateCursorRequest = await req.json();
        const { error } = await supabase.rpc('update_cursor_position', {
          p_session_id: body.session_id,
          p_cursor_position: body.cursor_position,
          p_viewport: body.viewport,
        });
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'getActiveEditors': {
        const { data, error } = await supabase.rpc('get_active_editors', {
          p_document_id: params.documentId,
        });
        if (error) throw error;
        result = data;
        break;
      }

      case 'getSummary': {
        const { data, error } = await supabase.rpc('get_collaboration_summary', {
          p_document_id: params.documentId,
        });
        if (error) throw error;
        result = data?.[0] || null;
        break;
      }

      // ========== SUGGESTION HANDLERS ==========
      case 'listSuggestions': {
        const status = url.searchParams.get('status') as
          | 'pending'
          | 'accepted'
          | 'rejected'
          | 'resolved'
          | null;
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const { data, error } = await supabase.rpc('get_document_suggestions', {
          p_document_id: params.documentId,
          p_status: status,
          p_limit: limit,
          p_offset: offset,
        });
        if (error) throw error;
        result = data;
        break;
      }

      case 'createSuggestion': {
        const body: CreateSuggestionRequest = await req.json();
        const { data, error } = await supabase
          .from('document_suggestions')
          .insert({
            document_id: params.documentId,
            document_version_id: body.document_version_id,
            author_id: user.id,
            start_position: body.start_position,
            end_position: body.end_position,
            original_text: body.original_text,
            suggested_text: body.suggested_text,
            change_type: body.change_type,
            comment: body.comment,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'resolveSuggestion': {
        const body: ResolveSuggestionRequest = await req.json();
        const { data, error } = await supabase.rpc('resolve_suggestion', {
          p_suggestion_id: params.suggestionId,
          p_accept: body.accept,
          p_comment: body.comment,
        });
        if (error) throw error;
        result = data;
        break;
      }

      // ========== TRACK CHANGE HANDLERS ==========
      case 'listChanges': {
        const showPendingOnly = url.searchParams.get('pending_only') === 'true';
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const { data, error } = await supabase.rpc('get_document_track_changes', {
          p_document_id: params.documentId,
          p_show_pending_only: showPendingOnly,
          p_limit: limit,
          p_offset: offset,
        });
        if (error) throw error;
        result = data;
        break;
      }

      case 'createChange': {
        const body: CreateTrackChangeRequest = await req.json();
        const { data, error } = await supabase
          .from('document_track_changes')
          .insert({
            document_id: params.documentId,
            document_version_id: body.document_version_id,
            author_id: user.id,
            session_id: body.session_id,
            start_position: body.start_position,
            end_position: body.end_position,
            original_text: body.original_text,
            new_text: body.new_text,
            change_type: body.change_type,
            change_group_id: body.change_group_id,
            sequence_number: body.sequence_number,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'resolveChange': {
        const body: ResolveChangeRequest = await req.json();
        const { data, error } = await supabase.rpc('resolve_track_change', {
          p_change_id: params.changeId,
          p_accept: body.accept,
        });
        if (error) throw error;
        result = data;
        break;
      }

      case 'resolveChangeGroup': {
        const body: ResolveChangeRequest = await req.json();
        const { data, error } = await supabase.rpc('resolve_change_group', {
          p_group_id: params.groupId,
          p_accept: body.accept,
        });
        if (error) throw error;
        result = { affected_count: data };
        break;
      }

      case 'acceptAllChanges': {
        const { data, error } = await supabase
          .from('document_track_changes')
          .update({
            is_accepted: true,
            accepted_by: user.id,
            accepted_at: new Date().toISOString(),
          })
          .eq('document_id', params.documentId)
          .is('is_accepted', null)
          .select();
        if (error) throw error;
        result = { affected_count: data?.length || 0 };
        break;
      }

      case 'rejectAllChanges': {
        const { data, error } = await supabase
          .from('document_track_changes')
          .update({
            is_accepted: false,
            accepted_by: user.id,
            accepted_at: new Date().toISOString(),
          })
          .eq('document_id', params.documentId)
          .is('is_accepted', null)
          .select();
        if (error) throw error;
        result = { affected_count: data?.length || 0 };
        break;
      }

      // ========== INLINE COMMENT HANDLERS ==========
      case 'listComments': {
        const status = url.searchParams.get('status') as 'open' | 'resolved' | 'dismissed' | null;
        const threadRootId = url.searchParams.get('thread_root_id');

        const { data, error } = await supabase.rpc('get_document_inline_comments', {
          p_document_id: params.documentId,
          p_status: status,
          p_thread_root_id: threadRootId,
        });
        if (error) throw error;
        result = data;
        break;
      }

      case 'createComment': {
        const body: CreateInlineCommentRequest = await req.json();
        const contentHtml = renderMarkdown(body.content);

        const { data, error } = await supabase
          .from('document_inline_comments')
          .insert({
            document_id: params.documentId,
            document_version_id: body.document_version_id,
            author_id: user.id,
            anchor_start: body.anchor_start,
            anchor_end: body.anchor_end,
            highlighted_text: body.highlighted_text,
            content: body.content,
            content_html: contentHtml,
            parent_id: body.parent_id,
            mentioned_users: body.mentioned_users || [],
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'updateComment': {
        const body: UpdateInlineCommentRequest = await req.json();
        const contentHtml = renderMarkdown(body.content);

        const { data, error } = await supabase
          .from('document_inline_comments')
          .update({
            content: body.content,
            content_html: contentHtml,
            mentioned_users: body.mentioned_users,
            is_edited: true,
            edited_at: new Date().toISOString(),
            edit_count: supabase.rpc('increment_edit_count'),
          })
          .eq('id', params.commentId)
          .eq('author_id', user.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'resolveComment': {
        const body: ResolveInlineCommentRequest = await req.json();
        const { data, error } = await supabase.rpc('resolve_inline_comment', {
          p_comment_id: params.commentId,
          p_status: body.status,
        });
        if (error) throw error;
        result = data;
        break;
      }

      case 'deleteComment': {
        const { data, error } = await supabase
          .from('document_inline_comments')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
          })
          .eq('id', params.commentId)
          .eq('author_id', user.id)
          .select()
          .single();
        if (error) throw error;
        result = { success: true };
        break;
      }

      // ========== COLLABORATOR HANDLERS ==========
      case 'listCollaborators': {
        const { data, error } = await supabase
          .from('document_collaborators')
          .select(
            `
            *,
            user:user_id (
              id,
              email,
              raw_user_meta_data
            ),
            invited_by_user:invited_by (
              id,
              email,
              raw_user_meta_data
            )
          `
          )
          .eq('document_id', params.documentId)
          .eq('is_active', true);
        if (error) throw error;
        result = data;
        break;
      }

      case 'addCollaborator': {
        const body: AddCollaboratorRequest = await req.json();
        const { data, error } = await supabase
          .from('document_collaborators')
          .insert({
            document_id: params.documentId,
            user_id: body.user_id,
            can_edit: body.can_edit ?? false,
            can_suggest: body.can_suggest ?? true,
            can_comment: body.can_comment ?? true,
            can_resolve: body.can_resolve ?? false,
            can_manage: body.can_manage ?? false,
            invited_by: user.id,
            expires_at: body.expires_at,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'updateCollaborator': {
        const body: UpdateCollaboratorRequest = await req.json();
        const updateData: Record<string, unknown> = {};
        if (body.can_edit !== undefined) updateData.can_edit = body.can_edit;
        if (body.can_suggest !== undefined) updateData.can_suggest = body.can_suggest;
        if (body.can_comment !== undefined) updateData.can_comment = body.can_comment;
        if (body.can_resolve !== undefined) updateData.can_resolve = body.can_resolve;
        if (body.can_manage !== undefined) updateData.can_manage = body.can_manage;
        if (body.expires_at !== undefined) updateData.expires_at = body.expires_at;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        const { data, error } = await supabase
          .from('document_collaborators')
          .update(updateData)
          .eq('id', params.collaboratorId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'removeCollaborator': {
        const { error } = await supabase
          .from('document_collaborators')
          .update({ is_active: false })
          .eq('id', params.collaboratorId);
        if (error) throw error;
        result = { success: true };
        break;
      }

      // ========== DOCUMENT LOCK/SETTINGS HANDLERS ==========
      case 'lockDocument': {
        const body: LockDocumentRequest = await req.json();

        // Upsert collaborative state
        const { data, error } = await supabase
          .from('document_collaborative_state')
          .upsert(
            {
              document_id: params.documentId,
              is_locked: true,
              locked_by: user.id,
              locked_at: new Date().toISOString(),
              lock_reason: body.reason,
            },
            {
              onConflict: 'document_id',
            }
          )
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'unlockDocument': {
        const { data, error } = await supabase
          .from('document_collaborative_state')
          .update({
            is_locked: false,
            locked_by: null,
            locked_at: null,
            lock_reason: null,
          })
          .eq('document_id', params.documentId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'updateSettings': {
        const body: UpdateSettingsRequest = await req.json();
        const updateData: Record<string, unknown> = {};
        if (body.track_changes_enabled !== undefined) {
          updateData.track_changes_enabled = body.track_changes_enabled;
        }
        if (body.suggestions_enabled !== undefined) {
          updateData.suggestions_enabled = body.suggestions_enabled;
        }

        // Upsert collaborative state
        const { data, error } = await supabase
          .from('document_collaborative_state')
          .upsert(
            {
              document_id: params.documentId,
              ...updateData,
            },
            {
              onConflict: 'document_id',
            }
          )
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Handler not found' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
