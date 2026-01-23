import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: positions-delegate
 * POST /positions/{id}/delegate
 *
 * Delegates editing rights for a position to another user
 * Original author retains ownership, but delegate can edit
 * Only the author can delegate, and only for draft positions
 */

interface DelegateRequest {
  position_id: string;
  delegate_to_user_id: string;
  delegation_reason?: string;
  expires_at?: string; // Optional expiration date for delegation
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        error_ar: 'الطريقة غير مسموح بها',
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: DelegateRequest = await req.json();

    if (!body.position_id) {
      return new Response(
        JSON.stringify({
          error: 'position_id is required',
          error_ar: 'معرف الموقف مطلوب',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.delegate_to_user_id) {
      return new Response(
        JSON.stringify({
          error: 'delegate_to_user_id is required',
          error_ar: 'معرف المستخدم المفوض إليه مطلوب',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          error_ar: 'رأس التفويض مفقود',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          error_ar: 'غير مصرح',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cannot delegate to yourself
    if (body.delegate_to_user_id === user.id) {
      return new Response(
        JSON.stringify({
          error: 'Cannot delegate to yourself',
          error_ar: 'لا يمكنك تفويض نفسك',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the position
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .select('*')
      .eq('id', body.position_id)
      .single();

    if (positionError || !position) {
      return new Response(
        JSON.stringify({
          error: 'Position not found',
          error_ar: 'الموقف غير موجود',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only author can delegate
    if (position.author_id !== user.id) {
      return new Response(
        JSON.stringify({
          error: 'Only the author can delegate editing rights',
          error_ar: 'فقط المؤلف يمكنه تفويض حقوق التحرير',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only draft positions can be delegated
    if (position.status !== 'draft') {
      return new Response(
        JSON.stringify({
          error: 'Can only delegate positions in draft status',
          error_ar: 'يمكن تفويض المواقف في حالة المسودة فقط',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify delegate user exists
    const { data: delegateUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', body.delegate_to_user_id)
      .single();

    if (userError || !delegateUser) {
      return new Response(
        JSON.stringify({
          error: 'Delegate user not found',
          error_ar: 'المستخدم المفوض إليه غير موجود',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing delegation
    const { data: existingDelegation } = await supabase
      .from('position_delegations')
      .select('id')
      .eq('position_id', body.position_id)
      .eq('delegate_id', body.delegate_to_user_id)
      .eq('status', 'active')
      .single();

    if (existingDelegation) {
      return new Response(
        JSON.stringify({
          error: 'User already has delegation for this position',
          error_ar: 'المستخدم لديه تفويض بالفعل لهذا الموقف',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create delegation record
    const { data: delegation, error: delegationError } = await supabase
      .from('position_delegations')
      .insert({
        position_id: body.position_id,
        delegator_id: user.id,
        delegate_id: body.delegate_to_user_id,
        reason: body.delegation_reason || null,
        expires_at: body.expires_at || null,
        status: 'active',
      })
      .select()
      .single();

    if (delegationError) {
      // If table doesn't exist, create a simpler response
      if (delegationError.code === '42P01') {
        // Table doesn't exist - store in position metadata instead
        const currentDelegates = position.delegates || [];
        const newDelegates = [
          ...currentDelegates,
          {
            user_id: body.delegate_to_user_id,
            delegated_by: user.id,
            delegated_at: new Date().toISOString(),
            reason: body.delegation_reason || null,
            expires_at: body.expires_at || null,
          },
        ];

        const { data: updatedPosition, error: updateError } = await supabase
          .from('positions')
          .update({ delegates: newDelegates })
          .eq('id', body.position_id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating position delegates:', updateError);
          return new Response(
            JSON.stringify({
              error: 'Failed to create delegation',
              error_ar: 'فشل في إنشاء التفويض',
              details: updateError.message,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            position_id: body.position_id,
            delegate_id: body.delegate_to_user_id,
            delegated_at: new Date().toISOString(),
            expires_at: body.expires_at || null,
            message: 'Delegation created successfully',
            message_ar: 'تم إنشاء التفويض بنجاح',
          }),
          {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('Error creating delegation:', delegationError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create delegation',
          error_ar: 'فشل في إنشاء التفويض',
          details: delegationError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ...delegation,
        message: 'Delegation created successfully',
        message_ar: 'تم إنشاء التفويض بنجاح',
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        error_ar: 'خطأ داخلي في الخادم',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
