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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="mb-2"
        >
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180 ms-2' : 'me-2'}`} />
          {t('calendar.new_event.back_to_calendar')}
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-start">
          {t('calendar.new_event.title')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 text-start">
          {t('calendar.new_event.description')}
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg text-start">
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
