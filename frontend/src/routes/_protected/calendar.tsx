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
 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Page Header */}
 <div className="mb-6">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-start flex items-center gap-2">
 <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7" />
 {t('calendar.page.title')}
 </h1>
 <p className="text-sm sm:text-base text-muted-foreground mt-1 text-start">
 {t('calendar.page.description')}
 </p>
 </div>

 <div className="flex gap-2">
 <Link to="/calendar/new">
 <Button className="w-full sm:w-auto">
 <Plus className="h-4 w-4 me-2" />
 {t('calendar.page.create_event')}
 </Button>
 </Link>
 </div>
 </div>
 </div>

 {/* View Mode Toggle */}
 <Card className="mb-6">
 <CardContent className="pt-6">
 <div className="flex items-center gap-2 justify-center sm:justify-start">
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
