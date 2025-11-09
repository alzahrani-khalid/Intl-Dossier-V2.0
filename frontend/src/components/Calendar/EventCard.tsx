// T095: EventCard component for individual event display
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';

interface EventCardProps {
 event: CalendarEvent;
 onClick?: () => void;
 className?: string;
}

export function EventCard({ event, onClick, className }: EventCardProps) {
 const { t, i18n } = useTranslation('calendar');
 const isRTL = i18n.language === 'ar';

 const getEventTypeColor = (type: string) => {
 const colors = {
 internal_meeting: 'bg-blue-500/10 text-blue-700 border-blue-200',
 deadline: 'bg-red-500/10 text-red-700 border-red-200',
 reminder: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
 holiday: 'bg-green-500/10 text-green-700 border-green-200',
 training: 'bg-purple-500/10 text-purple-700 border-purple-200',
 review: 'bg-orange-500/10 text-orange-700 border-orange-200',
 other: 'bg-gray-500/10 text-gray-700 border-gray-200',
 };
 return colors[type as keyof typeof colors] || colors.other;
 };

 const getStatusColor = (status: string) => {
 const colors = {
 scheduled: 'bg-blue-500/10 text-blue-700 border-blue-200',
 in_progress: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
 completed: 'bg-green-500/10 text-green-700 border-green-200',
 cancelled: 'bg-red-500/10 text-red-700 border-red-200',
 };
 return colors[status as keyof typeof colors] || colors.scheduled;
 };

 const formatDateTime = (dateStr: string) => {
 const date = new Date(dateStr);
 return {
 date: format(date, 'PPP'),
 time: format(date, 'p'),
 };
 };

 const startDateTime = formatDateTime(event.start_datetime);
 const endDateTime = event.end_datetime ? formatDateTime(event.end_datetime) : null;

 return (
 <Card
 className={cn(
 'hover:shadow-md transition-shadow cursor-pointer',
 className
 )}
 onClick={onClick}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <CardHeader className="pb-3">
 <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
 <div className="flex-1 min-w-0">
 <CardTitle className="text-base sm:text-lg mb-1 line-clamp-2">
 {isRTL ? (event.title_ar || event.title_en) : (event.title_en || event.title_ar)}
 </CardTitle>
 {event.description && (
 <CardDescription className="text-sm line-clamp-2">
 {isRTL ? (event.description_ar || event.description_en) : (event.description_en || event.description_ar)}
 </CardDescription>
 )}
 </div>
 <div className="flex gap-2 shrink-0">
 <Badge variant="outline" className={cn('text-xs', getEventTypeColor(event.entry_type))}>
 {t(`types.${event.entry_type}`)}
 </Badge>
 {event.status && (
 <Badge variant="outline" className={cn('text-xs', getStatusColor(event.status))}>
 {t(`status.${event.status}`)}
 </Badge>
 )}
 </div>
 </div>
 </CardHeader>

 <CardContent className="space-y-3">
 {/* Date and Time */}
 <div className="space-y-2">
 <div className="flex items-center gap-2 text-sm">
 <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
 <span className="text-muted-foreground">{startDateTime.date}</span>
 </div>
 <div className="flex items-center gap-2 text-sm">
 <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
 <span className="text-muted-foreground">
 {startDateTime.time}
 {endDateTime && <> - {endDateTime.time}</>}
 </span>
 </div>
 </div>

 {/* Location */}
 {event.location && (
 <div className="flex items-center gap-2 text-sm">
 <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
 <span className="text-muted-foreground truncate">
 {isRTL ? (event.location_ar || event.location_en) : (event.location_en || event.location_ar)}
 </span>
 </div>
 )}

 {/* Participants */}
 {event.participants && event.participants.length > 0 && (
 <div className="flex items-center gap-2 text-sm">
 <Users className="h-4 w-4 text-muted-foreground shrink-0" />
 <span className="text-muted-foreground">
 {t('participants_count', { count: event.participants.length })}
 </span>
 </div>
 )}

 {/* All Day Event */}
 {event.is_all_day && (
 <div className="flex items-center gap-2 text-sm">
 <AlertCircle className="h-4 w-4 text-primary shrink-0" />
 <span className="text-primary font-medium">{t('all_day_event')}</span>
 </div>
 )}

 {/* Linked Item */}
 {event.linked_item_type && event.linked_item_id && (
 <div className="pt-2 mt-2 border-t border-border">
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <span>{t('linked_to')}:</span>
 <Badge variant="secondary" className="text-xs">
 {t(`linked_item_type.${event.linked_item_type}`)}
 </Badge>
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 );
}
