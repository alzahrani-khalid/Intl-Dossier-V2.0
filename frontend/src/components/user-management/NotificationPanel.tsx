/**
 * NotificationPanel Component
 * Feature: 019-user-management-access
 * Task: T088
 *
 * Displays real-time notifications for user management events:
 * - Delegation expiry warnings
 * - Role changes
 * - User deactivation/reactivation
 * - Access review reminders
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support for Arabic
 * - Real-time updates via Supabase Realtime
 * - Mark as read/unread
 * - Clear all notifications
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
 Sheet,
 SheetContent,
 SheetDescription,
 SheetHeader,
 SheetTitle,
 SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck, Trash2, AlertCircle, UserCog, Clock, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

interface Notification {
 id: string;
 user_id: string;
 type: 'delegation_expiry' | 'role_changed' | 'user_deactivated' | 'access_review' | 'user_created';
 message: string;
 metadata?: Record<string, unknown>;
 is_read: boolean;
 created_at: string;
}

// ============================================================================
// Notification Icon Helper
// ============================================================================

function getNotificationIcon(type: Notification['type']) {
 switch (type) {
 case 'delegation_expiry':
 return <Clock className="h-4 w-4 text-orange-500" />;
 case 'role_changed':
 return <UserCog className="h-4 w-4 text-blue-500" />;
 case 'user_deactivated':
 return <AlertCircle className="h-4 w-4 text-red-500" />;
 case 'access_review':
 return <Shield className="h-4 w-4 text-purple-500" />;
 case 'user_created':
 return <Check className="h-4 w-4 text-green-500" />;
 default:
 return <Bell className="h-4 w-4 text-muted-foreground" />;
 }
}

// ============================================================================
// Component
// ============================================================================

export function NotificationPanel() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const queryClient = useQueryClient();
 const [open, setOpen] = useState(false);

 // Fetch notifications
 const { data: notifications = [], isLoading } = useQuery<Notification[]>({
 queryKey: ['notifications'],
 queryFn: async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) throw new Error('Not authenticated');

 const { data, error } = await supabase
 .from('notifications')
 .select('*')
 .eq('user_id', user.id)
 .order('created_at', { ascending: false })
 .limit(50);

 if (error) throw error;
 return data as Notification[];
 },
 });

 // Subscribe to real-time notifications
 useEffect(() => {
 const channel = supabase
 .channel('notifications')
 .on(
 'postgres_changes',
 {
 event: 'INSERT',
 schema: 'public',
 table: 'notifications',
 },
 (payload) => {
 queryClient.invalidateQueries({ queryKey: ['notifications'] });
 }
 )
 .subscribe();

 return () => {
 supabase.removeChannel(channel);
 };
 }, [queryClient]);

 // Mark notification as read
 const markAsReadMutation = useMutation({
 mutationFn: async (notificationId: string) => {
 const { error } = await supabase
 .from('notifications')
 .update({ is_read: true })
 .eq('id', notificationId);

 if (error) throw error;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['notifications'] });
 },
 });

 // Mark all as read
 const markAllAsReadMutation = useMutation({
 mutationFn: async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) throw new Error('Not authenticated');

 const { error } = await supabase
 .from('notifications')
 .update({ is_read: true })
 .eq('user_id', user.id)
 .eq('is_read', false);

 if (error) throw error;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['notifications'] });
 },
 });

 // Clear all notifications
 const clearAllMutation = useMutation({
 mutationFn: async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) throw new Error('Not authenticated');

 const { error } = await supabase
 .from('notifications')
 .delete()
 .eq('user_id', user.id);

 if (error) throw error;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['notifications'] });
 },
 });

 const unreadCount = notifications.filter((n) => !n.is_read).length;

 return (
 <Sheet open={open} onOpenChange={setOpen}>
 <SheetTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className="relative "
 >
 <Bell className="h-5 w-5" />
 {unreadCount > 0 && (
 <Badge
 variant="destructive"
 className={`absolute -top-1 h-5 min-w-5 rounded-full p-0 text-xs ${
 isRTL ? '-start-1' : '-end-1'
 }`}
 >
 {unreadCount > 9 ? '9+' : unreadCount}
 </Badge>
 )}
 </Button>
 </SheetTrigger>
 <SheetContent
 side={isRTL ? 'left' : 'right'}
 className="w-full sm:max-w-md"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <SheetHeader>
 <SheetTitle className="text-start">
 {t('user_management.notifications')}
 </SheetTitle>
 <SheetDescription className="text-start">
 {t('user_management.notifications_description')}
 </SheetDescription>
 </SheetHeader>

 {/* Action Buttons */}
 <div className="flex gap-2 mt-4">
 <Button
 variant="outline"
 size="sm"
 className="h-9 px-3 text-xs sm:text-sm"
 onClick={() => markAllAsReadMutation.mutate()}
 disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
 >
 <CheckCheck className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('user_management.mark_all_read')}
 </Button>
 <Button
 variant="outline"
 size="sm"
 className="h-9 px-3 text-xs sm:text-sm"
 onClick={() => clearAllMutation.mutate()}
 disabled={notifications.length === 0 || clearAllMutation.isPending}
 >
 <Trash2 className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('user_management.clear_all')}
 </Button>
 </div>

 {/* Notifications List */}
 <ScrollArea className="h-[calc(100vh-200px)] mt-4">
 {isLoading ? (
 <div className="flex items-center justify-center py-12">
 <p className="text-sm text-muted-foreground">
 {t('common.loading')}
 </p>
 </div>
 ) : notifications.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12">
 <Bell className="h-12 w-12 text-muted-foreground mb-4" />
 <p className="text-sm text-muted-foreground">
 {t('user_management.no_notifications')}
 </p>
 </div>
 ) : (
 <div className="space-y-2">
 {notifications.map((notification) => (
 <div
 key={notification.id}
 className={`
 p-3 sm:p-4 rounded-lg border transition-colors
 ${notification.is_read ? 'bg-background' : 'bg-accent'}
 ${notification.is_read ? 'border-border' : 'border-primary/20'}
 `}
 onClick={() => {
 if (!notification.is_read) {
 markAsReadMutation.mutate(notification.id);
 }
 }}
 role="button"
 tabIndex={0}
 >
 <div className="flex gap-3">
 <div className="flex-shrink-0 mt-0.5">
 {getNotificationIcon(notification.type)}
 </div>
 <div className="flex-1 min-w-0">
 <p className={`text-sm text-start ${!notification.is_read ? 'font-medium' : ''}`}>
 {notification.message}
 </p>
 <p className="text-xs text-muted-foreground text-start mt-1">
 {formatDistanceToNow(new Date(notification.created_at), {
 addSuffix: true,
 })}
 </p>
 </div>
 {!notification.is_read && (
 <div className="flex-shrink-0">
 <div className="h-2 w-2 rounded-full bg-primary" />
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </ScrollArea>
 </SheetContent>
 </Sheet>
 );
}
