/**
 * Onboarding Progress Edge Function
 *
 * Handles CRUD operations for user onboarding progress tracking.
 * Supports role-specific checklists with milestone achievements.
 *
 * Endpoints:
 * - GET /onboarding-progress - Get current user's progress
 * - POST /onboarding-progress - Create/update progress
 * - POST /onboarding-progress/item - Update single item progress
 * - POST /onboarding-progress/milestone - Add milestone achievement
 * - POST /onboarding-progress/dismiss - Dismiss onboarding
 * - POST /onboarding-progress/reset - Reset progress
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Role-specific checklist definitions
const roleChecklists: Record<string, { items: any[]; milestones: number[] }> = {
  admin: {
    items: [
      {
        id: 'admin_create_dossier',
        entityType: 'dossier',
        titleKey: 'onboarding.admin.createDossier.title',
        descriptionKey: 'onboarding.admin.createDossier.description',
        hintKey: 'onboarding.admin.createDossier.hint',
        route: '/dossiers/create',
        action: 'create',
        order: 1,
        isRequired: true,
        iconName: 'FolderOpen',
        estimatedMinutes: 5,
      },
      {
        id: 'admin_add_relationship',
        entityType: 'relationship',
        titleKey: 'onboarding.admin.addRelationship.title',
        descriptionKey: 'onboarding.admin.addRelationship.description',
        route: '/dossiers',
        action: 'create',
        order: 2,
        isRequired: true,
        iconName: 'GitBranch',
        estimatedMinutes: 3,
        prerequisites: ['admin_create_dossier'],
      },
      {
        id: 'admin_configure_notifications',
        entityType: 'notification',
        titleKey: 'onboarding.admin.configureNotifications.title',
        descriptionKey: 'onboarding.admin.configureNotifications.description',
        route: '/settings/notifications',
        action: 'configure',
        order: 3,
        isRequired: false,
        iconName: 'Bell',
        estimatedMinutes: 2,
      },
      {
        id: 'admin_create_engagement',
        entityType: 'engagement',
        titleKey: 'onboarding.admin.createEngagement.title',
        descriptionKey: 'onboarding.admin.createEngagement.description',
        route: '/engagements/create',
        action: 'create',
        order: 4,
        isRequired: true,
        iconName: 'Calendar',
        estimatedMinutes: 5,
      },
      {
        id: 'admin_upload_document',
        entityType: 'document',
        titleKey: 'onboarding.admin.uploadDocument.title',
        descriptionKey: 'onboarding.admin.uploadDocument.description',
        route: '/documents',
        action: 'create',
        order: 5,
        isRequired: false,
        iconName: 'FileText',
        estimatedMinutes: 2,
      },
      {
        id: 'admin_generate_brief',
        entityType: 'brief',
        titleKey: 'onboarding.admin.generateBrief.title',
        descriptionKey: 'onboarding.admin.generateBrief.description',
        route: '/briefs',
        action: 'create',
        order: 6,
        isRequired: false,
        iconName: 'FileCheck',
        estimatedMinutes: 3,
        prerequisites: ['admin_create_dossier'],
      },
    ],
    milestones: [25, 50, 75, 100],
  },
  editor: {
    items: [
      {
        id: 'editor_create_dossier',
        entityType: 'dossier',
        titleKey: 'onboarding.editor.createDossier.title',
        descriptionKey: 'onboarding.editor.createDossier.description',
        hintKey: 'onboarding.editor.createDossier.hint',
        route: '/dossiers/create',
        action: 'create',
        order: 1,
        isRequired: true,
        iconName: 'FolderOpen',
        estimatedMinutes: 5,
      },
      {
        id: 'editor_add_relationship',
        entityType: 'relationship',
        titleKey: 'onboarding.editor.addRelationship.title',
        descriptionKey: 'onboarding.editor.addRelationship.description',
        route: '/dossiers',
        action: 'create',
        order: 2,
        isRequired: true,
        iconName: 'GitBranch',
        estimatedMinutes: 3,
        prerequisites: ['editor_create_dossier'],
      },
      {
        id: 'editor_create_engagement',
        entityType: 'engagement',
        titleKey: 'onboarding.editor.createEngagement.title',
        descriptionKey: 'onboarding.editor.createEngagement.description',
        route: '/engagements/create',
        action: 'create',
        order: 3,
        isRequired: true,
        iconName: 'Calendar',
        estimatedMinutes: 5,
      },
      {
        id: 'editor_upload_document',
        entityType: 'document',
        titleKey: 'onboarding.editor.uploadDocument.title',
        descriptionKey: 'onboarding.editor.uploadDocument.description',
        route: '/documents',
        action: 'create',
        order: 4,
        isRequired: false,
        iconName: 'FileText',
        estimatedMinutes: 2,
      },
      {
        id: 'editor_configure_notifications',
        entityType: 'notification',
        titleKey: 'onboarding.editor.configureNotifications.title',
        descriptionKey: 'onboarding.editor.configureNotifications.description',
        route: '/settings/notifications',
        action: 'configure',
        order: 5,
        isRequired: false,
        iconName: 'Bell',
        estimatedMinutes: 2,
      },
    ],
    milestones: [25, 50, 75, 100],
  },
  viewer: {
    items: [
      {
        id: 'viewer_explore_dossiers',
        entityType: 'dossier',
        titleKey: 'onboarding.viewer.exploreDossiers.title',
        descriptionKey: 'onboarding.viewer.exploreDossiers.description',
        route: '/dossiers',
        action: 'explore',
        order: 1,
        isRequired: true,
        iconName: 'FolderOpen',
        estimatedMinutes: 3,
      },
      {
        id: 'viewer_view_engagements',
        entityType: 'engagement',
        titleKey: 'onboarding.viewer.viewEngagements.title',
        descriptionKey: 'onboarding.viewer.viewEngagements.description',
        route: '/engagements',
        action: 'explore',
        order: 2,
        isRequired: true,
        iconName: 'Calendar',
        estimatedMinutes: 3,
      },
      {
        id: 'viewer_configure_notifications',
        entityType: 'notification',
        titleKey: 'onboarding.viewer.configureNotifications.title',
        descriptionKey: 'onboarding.viewer.configureNotifications.description',
        route: '/settings/notifications',
        action: 'configure',
        order: 3,
        isRequired: false,
        iconName: 'Bell',
        estimatedMinutes: 2,
      },
    ],
    milestones: [50, 100],
  },
  analyst: {
    items: [
      {
        id: 'analyst_create_dossier',
        entityType: 'dossier',
        titleKey: 'onboarding.analyst.createDossier.title',
        descriptionKey: 'onboarding.analyst.createDossier.description',
        hintKey: 'onboarding.analyst.createDossier.hint',
        route: '/dossiers/create',
        action: 'create',
        order: 1,
        isRequired: true,
        iconName: 'FolderOpen',
        estimatedMinutes: 5,
      },
      {
        id: 'analyst_add_relationship',
        entityType: 'relationship',
        titleKey: 'onboarding.analyst.addRelationship.title',
        descriptionKey: 'onboarding.analyst.addRelationship.description',
        route: '/dossiers',
        action: 'create',
        order: 2,
        isRequired: true,
        iconName: 'GitBranch',
        estimatedMinutes: 3,
        prerequisites: ['analyst_create_dossier'],
      },
      {
        id: 'analyst_create_position',
        entityType: 'position',
        titleKey: 'onboarding.analyst.createPosition.title',
        descriptionKey: 'onboarding.analyst.createPosition.description',
        route: '/positions/create',
        action: 'create',
        order: 3,
        isRequired: true,
        iconName: 'FileSignature',
        estimatedMinutes: 5,
      },
      {
        id: 'analyst_generate_brief',
        entityType: 'brief',
        titleKey: 'onboarding.analyst.generateBrief.title',
        descriptionKey: 'onboarding.analyst.generateBrief.description',
        route: '/briefs',
        action: 'create',
        order: 4,
        isRequired: true,
        iconName: 'FileCheck',
        estimatedMinutes: 3,
        prerequisites: ['analyst_create_dossier'],
      },
      {
        id: 'analyst_upload_document',
        entityType: 'document',
        titleKey: 'onboarding.analyst.uploadDocument.title',
        descriptionKey: 'onboarding.analyst.uploadDocument.description',
        route: '/documents',
        action: 'create',
        order: 5,
        isRequired: false,
        iconName: 'FileText',
        estimatedMinutes: 2,
      },
    ],
    milestones: [25, 50, 75, 100],
  },
  manager: {
    items: [
      {
        id: 'manager_explore_dashboard',
        entityType: 'dossier',
        titleKey: 'onboarding.manager.exploreDashboard.title',
        descriptionKey: 'onboarding.manager.exploreDashboard.description',
        route: '/dashboard',
        action: 'explore',
        order: 1,
        isRequired: true,
        iconName: 'LayoutDashboard',
        estimatedMinutes: 3,
      },
      {
        id: 'manager_view_team_work',
        entityType: 'commitment',
        titleKey: 'onboarding.manager.viewTeamWork.title',
        descriptionKey: 'onboarding.manager.viewTeamWork.description',
        route: '/my-work',
        action: 'explore',
        order: 2,
        isRequired: true,
        iconName: 'Users',
        estimatedMinutes: 3,
      },
      {
        id: 'manager_create_engagement',
        entityType: 'engagement',
        titleKey: 'onboarding.manager.createEngagement.title',
        descriptionKey: 'onboarding.manager.createEngagement.description',
        route: '/engagements/create',
        action: 'create',
        order: 3,
        isRequired: true,
        iconName: 'Calendar',
        estimatedMinutes: 5,
      },
      {
        id: 'manager_configure_notifications',
        entityType: 'notification',
        titleKey: 'onboarding.manager.configureNotifications.title',
        descriptionKey: 'onboarding.manager.configureNotifications.description',
        route: '/settings/notifications',
        action: 'configure',
        order: 4,
        isRequired: false,
        iconName: 'Bell',
        estimatedMinutes: 2,
      },
    ],
    milestones: [25, 50, 75, 100],
  },
};

// Helper to get user role from database
async function getUserRole(supabase: any, userId: string): Promise<string> {
  const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();

  return user?.role || 'viewer';
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathname = url.pathname.replace('/onboarding-progress', '');

    // Handle GET - Get current user's progress
    if (req.method === 'GET') {
      const userRole = await getUserRole(supabase, user.id);
      const checklist = roleChecklists[userRole] || roleChecklists.viewer;

      // Get or create progress
      const { data: progress, error: progressError } = await supabase.rpc(
        'get_or_create_onboarding_progress',
        {
          p_user_id: user.id,
          p_role: userRole,
        }
      );

      if (progressError) {
        // If function doesn't exist, create initial progress manually
        const { data: existingProgress } = await supabase
          .from('user_onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!existingProgress) {
          const { data: newProgress, error: insertError } = await supabase
            .from('user_onboarding_progress')
            .insert({
              user_id: user.id,
              role: userRole,
              items_progress: {},
              milestones_achieved: [],
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                progress: {
                  userId: user.id,
                  role: userRole,
                  items: newProgress.items_progress || {},
                  milestones: newProgress.milestones_achieved || [],
                  isCompleted: newProgress.is_completed,
                  completedAt: newProgress.completed_at,
                  isDismissed: newProgress.is_dismissed,
                  dismissedAt: newProgress.dismissed_at,
                  updatedAt: newProgress.updated_at,
                  createdAt: newProgress.created_at,
                },
                checklist,
              },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              progress: {
                userId: user.id,
                role: userRole,
                items: existingProgress.items_progress || {},
                milestones: existingProgress.milestones_achieved || [],
                isCompleted: existingProgress.is_completed,
                completedAt: existingProgress.completed_at,
                isDismissed: existingProgress.is_dismissed,
                dismissedAt: existingProgress.dismissed_at,
                updatedAt: existingProgress.updated_at,
                createdAt: existingProgress.created_at,
              },
              checklist,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            progress: {
              userId: user.id,
              role: progress?.role || userRole,
              items: progress?.items_progress || {},
              milestones: progress?.milestones_achieved || [],
              isCompleted: progress?.is_completed || false,
              completedAt: progress?.completed_at,
              isDismissed: progress?.is_dismissed || false,
              dismissedAt: progress?.dismissed_at,
              updatedAt: progress?.updated_at,
              createdAt: progress?.created_at,
            },
            checklist,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle POST - Various update operations
    if (req.method === 'POST') {
      const body = await req.json();

      // Update single item progress
      if (pathname === '/item' || pathname === '') {
        const { itemId, action } = body;

        if (!itemId || !action) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing itemId or action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get current progress
        const { data: currentProgress } = await supabase
          .from('user_onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Build updated items_progress
        const itemsProgress = currentProgress?.items_progress || {};
        const now = new Date().toISOString();

        if (action === 'complete') {
          itemsProgress[itemId] = {
            itemId,
            isCompleted: true,
            completedAt: now,
            wasSkipped: false,
          };
        } else if (action === 'skip') {
          itemsProgress[itemId] = {
            itemId,
            isCompleted: false,
            wasSkipped: true,
            skippedAt: now,
          };
        } else if (action === 'uncomplete') {
          itemsProgress[itemId] = {
            itemId,
            isCompleted: false,
            wasSkipped: false,
          };
        }

        // Upsert progress
        const { data: updatedProgress, error: updateError } = await supabase
          .from('user_onboarding_progress')
          .upsert(
            {
              user_id: user.id,
              items_progress: itemsProgress,
              role: currentProgress?.role || 'viewer',
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              userId: user.id,
              role: updatedProgress.role,
              items: updatedProgress.items_progress,
              milestones: updatedProgress.milestones_achieved || [],
              isCompleted: updatedProgress.is_completed,
              isDismissed: updatedProgress.is_dismissed,
              updatedAt: updatedProgress.updated_at,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add milestone achievement
      if (pathname === '/milestone') {
        const { percentage } = body;

        const { data: currentProgress } = await supabase
          .from('user_onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const milestones = currentProgress?.milestones_achieved || [];

        // Check if milestone already achieved
        const alreadyAchieved = milestones.some((m: any) => m.percentage === percentage);

        if (!alreadyAchieved) {
          milestones.push({
            percentage,
            achievedAt: new Date().toISOString(),
            celebrationShown: false,
          });

          await supabase
            .from('user_onboarding_progress')
            .update({ milestones_achieved: milestones })
            .eq('user_id', user.id);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark celebration as shown
      if (pathname === '/celebration-shown') {
        const { percentage } = body;

        const { data: currentProgress } = await supabase
          .from('user_onboarding_progress')
          .select('milestones_achieved')
          .eq('user_id', user.id)
          .single();

        const milestones = (currentProgress?.milestones_achieved || []).map((m: any) =>
          m.percentage === percentage ? { ...m, celebrationShown: true } : m
        );

        await supabase
          .from('user_onboarding_progress')
          .update({ milestones_achieved: milestones })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Dismiss onboarding
      if (pathname === '/dismiss') {
        await supabase
          .from('user_onboarding_progress')
          .update({
            is_dismissed: true,
            dismissed_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Resume onboarding (after dismissal)
      if (pathname === '/resume') {
        await supabase
          .from('user_onboarding_progress')
          .update({
            is_dismissed: false,
            dismissed_at: null,
          })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reset progress
      if (pathname === '/reset') {
        await supabase
          .from('user_onboarding_progress')
          .update({
            items_progress: {},
            milestones_achieved: [],
            is_completed: false,
            completed_at: null,
            is_dismissed: false,
            dismissed_at: null,
          })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Complete onboarding
      if (pathname === '/complete') {
        await supabase
          .from('user_onboarding_progress')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in onboarding-progress function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
