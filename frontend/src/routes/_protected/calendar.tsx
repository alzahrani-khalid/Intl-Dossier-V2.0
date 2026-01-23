import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { UnifiedCalendar } from '@/components/Calendar/UnifiedCalendar';

export const Route = createFileRoute('/_protected/calendar')({
 component: CalendarPage,
});

function CalendarPage() {
 const { t, i18n } = useTranslation('dossiers');
 const isRTL = i18n.language === 'ar';

 const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

 return (
 <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Page Header */}
 <div className="mb-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h1 className="flex items-center gap-2 text-start text-2xl font-bold sm:text-3xl">
 <CalendarIcon className="size-6 sm:size-7" />
 {t('calendar.page.title')}
 </h1>
 <p className="mt-1 text-start text-sm text-muted-foreground sm:text-base">
 {t('calendar.page.description')}
 </p>
 </div>

 <div className="flex gap-2">
 <Link to="/calendar/new">
 <Button className="w-full sm:w-auto">
 <Plus className="me-2 size-4" />
 {t('calendar.page.create_event')}
 </Button>
 </Link>
 </div>
 </div>
 </div>

 {/* View Mode Toggle */}
 <Card className="mb-6">
 <CardContent className="pt-6">
 <div className="flex items-center justify-center gap-2 sm:justify-start">
 <Button
 variant={viewMode === 'month' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setViewMode('month')}
 >
 {t('calendar.view_mode.month')}
 </Button>
 <Button
 variant={viewMode === 'week' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setViewMode('week')}
 >
 {t('calendar.view_mode.week')}
 </Button>
 <Button
 variant={viewMode === 'day' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setViewMode('day')}
 >
 {t('calendar.view_mode.day')}
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* Unified Calendar Component */}
 <UnifiedCalendar viewMode={viewMode} />
 </div>
 );
}
