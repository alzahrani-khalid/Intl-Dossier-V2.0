/**
 * Route: /approvals
 * My Approvals dashboard - positions pending current user's approval
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from '@tanstack/react-router';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_protected/approvals/')({
 component: MyApprovalsPage,
});

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

async function fetchMyApprovals() {
 const { data: { session } } = await supabase.auth.getSession();

 // This would need a dedicated endpoint, but for now we'll filter positions
 const response = await fetch(`${API_BASE_URL}/positions-list?status=under_review`, {
 headers: {
 'Authorization': `Bearer ${session?.access_token}`,
 'Content-Type': 'application/json',
 },
 });

 if (!response.ok) {
 throw new Error('Failed to fetch approvals');
 }

 const data = await response.json();
 return data.data || [];
}

function MyApprovalsPage() {
 const { t } = useTranslation();
 const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

 const { data: positions, isLoading } = useQuery({
 queryKey: ['approvals', 'my', filter],
 queryFn: fetchMyApprovals,
 staleTime: 30 * 1000, // 30 seconds
 });

 if (isLoading) {
 return (
 <div className="container mx-auto py-6 space-y-4">
 <Skeleton className="h-8 w-64" />
 <Skeleton className="h-96" />
 </div>
 );
 }

 return (
 <div className="container mx-auto py-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">
 {t('approvals.myApprovals', 'My Approvals')}
 </h1>
 <p className="text-muted-foreground">
 {t('approvals.subtitle', 'Positions pending your review and approval')}
 </p>
 </div>

 <div className="flex gap-2">
 <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('all')}>
 {t('approvals.filter.all', 'All')}
 </Badge>
 <Badge variant={filter === 'pending' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('pending')}>
 {t('approvals.filter.pending', 'Pending')}
 </Badge>
 <Badge variant={filter === 'completed' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('completed')}>
 {t('approvals.filter.completed', 'Completed')}
 </Badge>
 </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card className="p-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
 <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
 </div>
 <div>
 <p className="text-2xl font-bold">{positions?.length || 0}</p>
 <p className="text-sm text-muted-foreground">
 {t('approvals.stats.pending', 'Pending')}
 </p>
 </div>
 </div>
 </Card>

 <Card className="p-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
 <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
 </div>
 <div>
 <p className="text-2xl font-bold">0</p>
 <p className="text-sm text-muted-foreground">
 {t('approvals.stats.approved', 'Approved This Month')}
 </p>
 </div>
 </div>
 </Card>

 <Card className="p-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
 <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
 </div>
 <div>
 <p className="text-2xl font-bold">0</p>
 <p className="text-sm text-muted-foreground">
 {t('approvals.stats.rejected', 'Returned for Revisions')}
 </p>
 </div>
 </div>
 </Card>
 </div>

 {/* Positions List */}
 <Card className="p-6">
 {positions && positions.length > 0 ? (
 <div className="space-y-4">
 {positions.map((position: any) => (
 <Link
 key={position.id}
 to="/positions/$id"
 params={{ id: position.id }}
 className="block p-4 border rounded-lg hover:border-primary transition-colors"
 >
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <h3 className="font-semibold">{position.title_en}</h3>
 <Badge variant="secondary">
 {t('approvals.stage', 'Stage')} {position.current_stage}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">{position.title_ar}</p>
 <p className="text-xs text-muted-foreground mt-2">
 {t('approvals.submittedBy', 'Submitted by')}: {position.author_id}
 </p>
 </div>

 <div className="flex flex-col items-end gap-2">
 <Badge>{position.thematic_category || t('approvals.uncategorized', 'Uncategorized')}</Badge>
 <span className="text-xs text-muted-foreground">
 {new Date(position.created_at).toLocaleDateString()}
 </span>
 </div>
 </div>
 </Link>
 ))}
 </div>
 ) : (
 <div className="text-center py-12">
 <p className="text-lg text-muted-foreground">
 {t('approvals.noPositions', 'No positions pending your approval')}
 </p>
 </div>
 )}
 </Card>
 </div>
 );
}
