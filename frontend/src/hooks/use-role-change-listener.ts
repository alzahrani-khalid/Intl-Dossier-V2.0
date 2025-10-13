/**
 * Role Change Realtime Listener Hook
 * Listens for role changes via Supabase Realtime and handles session termination
 *
 * Features:
 * - Real-time role change notifications
 * - Automatic session termination on role change
 * - Force re-login on own role change
 * - Permission cache invalidation
 */

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface RoleChangePayload {
  user_id: string;
  old_role: string;
  new_role: string;
  changed_by: string;
  requires_approval: boolean;
  sessions_terminated: number;
}

/**
 * Hook to listen for role changes and handle session termination
 *
 * @param userId - Current user's ID to listen for role changes
 *
 * @example
 * useRoleChangeListener(currentUser.id);
 */
export function useRoleChangeListener(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleRoleChange = useCallback(
    (payload: { payload: RoleChangePayload }) => {
      const data = payload.payload;

      // Invalidate user permissions cache
      queryClient.invalidateQueries({ queryKey: ['user-permissions', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Check if this role change affects the current user
      if (data.user_id === userId) {
        // Show notification about role change
        toast({
          title: t('user_management.role_changed', 'Your role has been changed'),
          description: t(
            'user_management.role_change_notification',
            `Your role has been updated from ${data.old_role} to ${data.new_role}. You will be logged out in 5 seconds.`
          ),
          variant: 'default',
          duration: 5000,
        });

        // Force logout after 5 seconds
        setTimeout(() => {
          // Clear all local storage and session data
          localStorage.clear();
          sessionStorage.clear();

          // Sign out from Supabase
          supabase.auth.signOut().then(() => {
            // Redirect to login page
            window.location.href = '/login?reason=role_changed';
          });
        }, 5000);
      } else {
        // Another user's role changed - just invalidate cache
        if (!data.requires_approval) {
          toast({
            title: t('user_management.user_role_updated', 'User role updated'),
            description: t(
              'user_management.user_role_update_notification',
              `User role changed from ${data.old_role} to ${data.new_role}`
            ),
            variant: 'default',
            duration: 3000,
          });
        }
      }
    },
    [userId, queryClient, toast, t]
  );

  const handleAdminApproval = useCallback(
    (payload: {
      payload: {
        user_id: string;
        new_role: string;
        approved_by: string;
        approval_count: number;
      };
    }) => {
      const data = payload.payload;

      // Invalidate approvals and permissions cache
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions', data.user_id] });

      // If this is the second approval, the role change is applied
      if (data.approval_count === 2) {
        if (data.user_id === userId) {
          // Current user's admin role was approved
          toast({
            title: t('user_management.admin_role_approved', 'Admin role approved'),
            description: t(
              'user_management.admin_role_approved_notification',
              'Your admin role request has been approved. You will be logged out in 5 seconds.'
            ),
            variant: 'default',
            duration: 5000,
          });

          // Force logout after 5 seconds
          setTimeout(() => {
            localStorage.clear();
            sessionStorage.clear();
            supabase.auth.signOut().then(() => {
              window.location.href = '/login?reason=role_changed';
            });
          }, 5000);
        } else {
          toast({
            title: t('user_management.admin_approval_complete', 'Admin approval complete'),
            description: t(
              'user_management.admin_approval_complete_notification',
              `Admin role approved for user. Role change applied.`
            ),
            variant: 'default',
            duration: 3000,
          });
        }
      }
    },
    [userId, queryClient, toast, t]
  );

  useEffect(() => {
    if (!userId) return;

    // Subscribe to role change events
    const roleChangeChannel = supabase.channel('role-changes');

    roleChangeChannel
      .on('broadcast', { event: 'role:changed' }, handleRoleChange)
      .on('broadcast', { event: 'admin:approved' }, handleAdminApproval)
      .subscribe();

    // Also listen to postgres changes on the users table for current user
    const userChannel = supabase
      .channel(`user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'auth',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          // Check if role was changed
          const oldRole = (payload.old as any)?.raw_user_meta_data?.role;
          const newRole = (payload.new as any)?.raw_user_meta_data?.role;

          if (oldRole && newRole && oldRole !== newRole) {
            // Role changed - invalidate permissions and force logout
            queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });

            toast({
              title: t('user_management.role_changed', 'Your role has been changed'),
              description: t(
                'user_management.role_change_logout',
                'Your permissions have changed. You will be logged out in 5 seconds.'
              ),
              variant: 'default',
              duration: 5000,
            });

            setTimeout(() => {
              localStorage.clear();
              sessionStorage.clear();
              supabase.auth.signOut().then(() => {
                window.location.href = '/login?reason=role_changed';
              });
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roleChangeChannel);
      supabase.removeChannel(userChannel);
    };
  }, [userId, handleRoleChange, handleAdminApproval, queryClient, toast, t]);
}
