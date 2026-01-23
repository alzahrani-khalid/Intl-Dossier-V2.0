import { useTranslation } from 'react-i18next';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { CalendarEntryForm } from '@/components/Calendar/CalendarEntryForm';

export const Route = createFileRoute('/_protected/calendar/new')({
 component: NewCalendarEntryPage,
});

function NewCalendarEntryPage() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const navigate = useNavigate();

 const handleSuccess = () => {
 navigate({ to: '/calendar' });
 };

 const handleCancel = () => {
 navigate({ to: '/calendar' });
 };

 return (
 <div className="container mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Breadcrumb */}
 <div className="mb-6">
 <Button
 variant="ghost"
 size="sm"
 onClick={handleCancel}
 className="mb-2"
 >
 <ArrowLeft className={`size-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
 {t('calendar.new_event.back_to_calendar')}
 </Button>
 <h1 className="text-start text-2xl font-bold sm:text-3xl">
 {t('calendar.new_event.title')}
 </h1>
 <p className="mt-1 text-start text-sm text-muted-foreground sm:text-base">
 {t('calendar.new_event.description')}
 </p>
 </div>

 {/* Form Card */}
 <Card>
 <CardHeader>
 <CardTitle className="text-start text-base sm:text-lg">
 {t('calendar.new_event.form_title')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <CalendarEntryForm
 onSuccess={handleSuccess}
 onCancel={handleCancel}
 />
 </CardContent>
 </Card>
 </div>
 );
}
