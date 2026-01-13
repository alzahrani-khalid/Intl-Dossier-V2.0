/**
 * Document Versions Edge Function
 *
 * Handles document version history, comparison, and revert operations.
 * Supports:
 * - GET: List version history for a document
 * - POST: Compare two versions or revert to a version
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface VersionHistoryRequest {
  document_id: string;
  limit?: number;
  offset?: number;
}

interface CompareVersionsRequest {
  action: 'compare';
  document_id: string;
  version_a: number;
  version_b: number;
}

interface RevertVersionRequest {
  action: 'revert';
  document_id: string;
  target_version: number;
  reason?: string;
}

type PostRequest = CompareVersionsRequest | RevertVersionRequest;

/**
 * Compute a simple line-by-line diff between two texts
 */
function computeTextDiff(
  textA: string | null,
  textB: string | null
): {
  hunks: unknown[];
  stats: {
    additions: number;
    deletions: number;
    changes: number;
    totalLines: number;
    similarity: number;
  };
} {
  if (!textA || !textB) {
    return {
      hunks: [],
      stats: { additions: 0, deletions: 0, changes: 0, totalLines: 0, similarity: 0 },
    };
  }

  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const hunks: unknown[] = [];
  const diffLines: {
    type: string;
    lineNumberOld?: number;
    lineNumberNew?: number;
    content: string;
  }[] = [];

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  // Simple Myers diff algorithm simplified for line-by-line comparison
  const maxLen = Math.max(linesA.length, linesB.length);
  let lineNumA = 1;
  let lineNumB = 1;

  // Use longest common subsequence approach
  const lcs = computeLCS(linesA, linesB);
  let lcsIndex = 0;
  let i = 0;
  let j = 0;

  while (i < linesA.length || j < linesB.length) {
    if (lcsIndex < lcs.length && i < linesA.length && linesA[i] === lcs[lcsIndex]) {
      if (j < linesB.length && linesB[j] === lcs[lcsIndex]) {
        // Unchanged line
        diffLines.push({
          type: 'unchanged',
          lineNumberOld: lineNumA++,
          lineNumberNew: lineNumB++,
          content: linesA[i],
        });
        unchanged++;
        i++;
        j++;
        lcsIndex++;
      } else {
        // Line added in B
        diffLines.push({
          type: 'added',
          lineNumberNew: lineNumB++,
          content: linesB[j],
        });
        additions++;
        j++;
      }
    } else if (i < linesA.length) {
      // Line removed from A
      diffLines.push({
        type: 'removed',
        lineNumberOld: lineNumA++,
        content: linesA[i],
      });
      deletions++;
      i++;
    } else if (j < linesB.length) {
      // Line added in B
      diffLines.push({
        type: 'added',
        lineNumberNew: lineNumB++,
        content: linesB[j],
      });
      additions++;
      j++;
    }
  }

  // Group into hunks (continuous blocks of changes)
  let currentHunk: {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: typeof diffLines;
  } | null = null;

  for (const line of diffLines) {
    if (line.type !== 'unchanged') {
      if (!currentHunk) {
        currentHunk = {
          oldStart: line.lineNumberOld || 1,
          oldLines: 0,
          newStart: line.lineNumberNew || 1,
          newLines: 0,
          lines: [],
        };
      }
      currentHunk.lines.push(line);
      if (line.type === 'removed') currentHunk.oldLines++;
      if (line.type === 'added') currentHunk.newLines++;
    } else {
      if (currentHunk) {
        // Add some context
        currentHunk.lines.push(line);
        currentHunk.oldLines++;
        currentHunk.newLines++;

        // If we have 3+ unchanged lines, close the hunk
        const lastThree = currentHunk.lines.slice(-3);
        if (lastThree.every((l) => l.type === 'unchanged')) {
          hunks.push(currentHunk);
          currentHunk = null;
        }
      }
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  const totalLines = linesA.length + linesB.length;
  const similarity = totalLines > 0 ? Math.round((unchanged * 2 * 100) / totalLines) : 100;

  return {
    hunks,
    stats: {
      additions,
      deletions,
      changes: additions + deletions,
      totalLines: Math.max(linesA.length, linesB.length),
      similarity,
    },
  };
}

/**
 * Compute Longest Common Subsequence
 */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Get version history
      const url = new URL(req.url);
      const documentId = url.searchParams.get('document_id');
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      if (!documentId) {
        return new Response(JSON.stringify({ error: 'document_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Call the database function
      const { data, error } = await supabase.rpc('get_document_version_history', {
        p_document_id: documentId,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error fetching version history:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          versions: data || [],
          total: data?.length || 0,
          limit,
          offset,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'POST') {
      const body: PostRequest = await req.json();

      if (body.action === 'compare') {
        // Compare two versions
        const { document_id, version_a, version_b } = body;

        if (!document_id || !version_a || !version_b) {
          return new Response(
            JSON.stringify({ error: 'document_id, version_a, and version_b are required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Get comparison data from database
        const { data, error } = await supabase.rpc('compare_document_versions', {
          p_document_id: document_id,
          p_version_a: version_a,
          p_version_b: version_b,
        });

        if (error) {
          console.error('Error comparing versions:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const comparison = data?.[0];
        if (!comparison) {
          return new Response(JSON.stringify({ error: 'Versions not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Compute text diff if both versions have text content
        let diffResult = null;
        if (comparison.can_compare_text && comparison.text_a && comparison.text_b) {
          diffResult = computeTextDiff(comparison.text_a, comparison.text_b);
        }

        return new Response(
          JSON.stringify({
            versionA: comparison.version_a_info,
            versionB: comparison.version_b_info,
            canCompareText: comparison.can_compare_text,
            diffHunks: diffResult?.hunks || null,
            diffStats: diffResult?.stats || null,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (body.action === 'revert') {
        // Revert to a previous version
        const { document_id, target_version, reason } = body;

        if (!document_id || !target_version) {
          return new Response(
            JSON.stringify({ error: 'document_id and target_version are required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Call the revert function
        const { data, error } = await supabase.rpc('revert_document_to_version', {
          p_document_id: document_id,
          p_target_version: target_version,
          p_reason: reason || null,
        });

        if (error) {
          console.error('Error reverting version:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            newVersionId: data,
            message: `Successfully reverted to version ${target_version}`,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
