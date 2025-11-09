import { useTranslation } from 'react-i18next';
import { FileText, Briefcase, Ticket, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';

type WorkItemType = 'dossier' | 'position' | 'ticket';

interface WorkItem {
 type: WorkItemType;
 id: string;
 title: string;
}

interface LinkedItemsListProps {
 items: WorkItem[];
 emptyMessage?: string;
}

export function LinkedItemsList({
 items,
 emptyMessage,
}: LinkedItemsListProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const getIcon = (type: WorkItemType) => {
 const className = "size-4 sm:size-5";
 switch (type) {
 case 'dossier':
 return <FileText className={className} />;
 case 'position':
 return <Briefcase className={className} />;
 case 'ticket':
 return <Ticket className={className} />;
 }
 };

 const getLink = (item: WorkItem) => {
 switch (item.type) {
 case 'dossier':
 return `/dossiers/${item.id}`;
 case 'position':
 return `/positions/${item.id}`;
 case 'ticket':
 return `/intake-tickets/${item.id}`;
 }
 };

 const getTypeLabel = (type: WorkItemType) => {
 switch (type) {
 case 'dossier':
 return t('tasks.dossier');
 case 'position':
 return t('tasks.position');
 case 'ticket':
 return t('tasks.ticket');
 }
 };

 if (items.length === 0) {
 return (
 <div
 className="rounded-lg border border-dashed p-6 text-center"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <p className="text-sm text-muted-foreground">
 {emptyMessage || t('tasks.noLinkedItems')}
 </p>
 </div>
 );
 }

 return (
 <div
 className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {items.map((item) => (
 <Link
 key={`${item.type}-${item.id}`}
 to={getLink(item)}
 className="group"
 >
 <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
 <CardContent className="flex flex-col gap-3 p-4">
 {/* Icon and type */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="rounded-full bg-muted p-2">
 {getIcon(item.type)}
 </div>
 <span className="text-xs text-muted-foreground sm:text-sm">
 {getTypeLabel(item.type)}
 </span>
 </div>
 <ExternalLink className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
 </div>

 {/* Title */}
 <h3 className="text-sm font-medium text-start line-clamp-2 sm:text-base">
 {item.title}
 </h3>
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 );
}
