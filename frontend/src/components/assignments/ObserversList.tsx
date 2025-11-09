import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import type { Database } from '@/types/database';

type AssignmentObserver = Database['public']['Tables']['assignment_observers']['Row'];

interface ObserverWithDetails extends AssignmentObserver {
 user_name?: string;
 user_avatar?: string;
}

interface ObserversListProps {
 observers: ObserverWithDetails[];
}

export function ObserversList({
 observers,
}: ObserversListProps): JSX.Element {
 const { t, i18n } = useTranslation('assignments');
 const isRTL = i18n.language === 'ar';

 const formatTimestamp = (timestamp: string): string => {
 return new Intl.DateTimeFormat(i18n.language, {
 month: 'short',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 }).format(new Date(timestamp));
 };

 const getRoleBadgeVariant = (role: string): 'default' | 'secondary' => {
 return role === 'supervisor' ? 'default' : 'secondary';
 };

 return (
 <Card dir={isRTL ? 'rtl' : 'ltr'}>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Eye className="h-5 w-5" />
 {t('observers.title')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 {observers.length === 0 ? (
 <div className="text-center py-4 text-muted-foreground text-sm">
 {t('observers.empty')}
 </div>
 ) : (
 <div className="space-y-3">
 {observers.map((observer) => (
 <div
 key={observer.id}
 className="flex items-center gap-3 p-2 rounded-lg border bg-card"
 >
 <Avatar className="h-8 w-8">
 <AvatarImage
 src={observer.user_avatar}
 alt={observer.user_name || 'Observer'}
 />
 <AvatarFallback>
 {observer.user_name
 ?.split(' ')
 .map((n) => n[0])
 .join('')
 .toUpperCase() || '?'}
 </AvatarFallback>
 </Avatar>

 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate">
 {observer.user_name || t('observers.unknownUser')}
 </p>
 <p className="text-xs text-muted-foreground">
 {t('observers.addedAt', { time: formatTimestamp(observer.added_at) })}
 </p>
 </div>

 <Badge variant={getRoleBadgeVariant(observer.role)}>
 {t(`observers.role_${observer.role}`)}
 </Badge>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 );
}
