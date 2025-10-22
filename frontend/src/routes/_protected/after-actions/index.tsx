import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { FileText, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

export const Route = createFileRoute('/_protected/after-actions/')({
  component: AfterActionsIndexPage,
});

function AfterActionsIndexPage() {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <FileText className="h-8 w-8" />
                After Action Records
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage engagement outcomes and commitments
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate({ to: '/engagements' })}
            >
              <Plus className="h-5 w-5" />
              Create After Action
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>After Actions</CardTitle>
            <CardDescription>
              After action records are created from engagement details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No after action records available. Create an engagement to get started.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
