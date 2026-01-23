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
 <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
 <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="space-y-1">
 <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
 <FileText className="size-8" />
 After Action Records
 </h1>
 <p className="text-gray-500 dark:text-gray-400">
 Manage engagement outcomes and commitments
 </p>
 </div>
 <Button
 className="gap-2"
 onClick={() => navigate({ to: '/engagements' })}
 >
 <Plus className="size-5" />
 Create After Action
 </Button>
 </div>
 </div>
 </div>

 <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
 <Card>
 <CardHeader>
 <CardTitle>After Actions</CardTitle>
 <CardDescription>
 After action records are created from engagement details.
 </CardDescription>
 </CardHeader>
 <CardContent>
 <p className="py-8 text-center text-gray-600 dark:text-gray-400">
 No after action records available. Create an engagement to get started.
 </p>
 </CardContent>
 </Card>
 </main>
 </div>
 );
}
