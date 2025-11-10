import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface DiffItem {
 type: 'added' | 'removed' | 'unchanged';
 text: string;
}

interface VersionDiff {
 from_version: number;
 to_version: number;
 english_diff: DiffItem[];
 arabic_diff: DiffItem[];
 metadata_changes: Record<string, { old: any; new: any }>;
}

interface Version {
 version_number: number;
 created_at: string;
 created_by: string;
 change_summary?: string;
}

interface VersionComparisonProps {
 positionId: string;
 availableVersions?: Version[];
 defaultFromVersion?: number;
 defaultToVersion?: number;
 className?: string;
}

export function VersionComparison({
 positionId,
 availableVersions = [],
 defaultFromVersion,
 defaultToVersion,
 className,
}: VersionComparisonProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const [fromVersion, setFromVersion] = useState<number | undefined>(defaultFromVersion);
 const [toVersion, setToVersion] = useState<number | undefined>(defaultToVersion);

 // Fetch version comparison data
 const {
 data: versionDiff,
 isLoading,
 error,
 refetch,
 } = useQuery<VersionDiff>({
 queryKey: ['positions', positionId, 'compare', fromVersion, toVersion],
 queryFn: async () => {
 if (!fromVersion || !toVersion) {
 throw new Error('Both versions must be selected');
 }

 const {
 data: { session },
 } = await supabase.auth.getSession();

 if (!session) {
 throw new Error('No active session');
 }

 const response = await fetch(
 `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/positions-versions-compare`,
 {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${session.access_token}`,
 },
 body: JSON.stringify({
 position_id: positionId,
 from_version: fromVersion,
 to_version: toVersion,
 }),
 }
 );

 if (!response.ok) {
 const errorData = await response.json();
 throw new Error(errorData.error || 'Failed to fetch version comparison');
 }

 return response.json();
 },
 enabled: !!fromVersion && !!toVersion && fromVersion !== toVersion,
 });

 const handleCompare = () => {
 if (fromVersion && toVersion && fromVersion !== toVersion) {
 refetch();
 }
 };

 const renderDiffText = (diff: DiffItem[], rtl: boolean = false) => {
 return (
 <div
 className={cn('text-sm leading-relaxed whitespace-pre-wrap', rtl && 'text-end')}
 dir={rtl ? 'rtl' : 'ltr'}
 >
 {diff.map((item, index) => {
 if (item.type === 'added') {
 return (
 <span
 key={index}
 className="rounded bg-green-100 px-0.5 text-green-900"
 aria-label={t('positions.versionComparison.added')}
 >
 {item.text}
 </span>
 );
 }

 if (item.type === 'removed') {
 return (
 <span
 key={index}
 className="rounded bg-red-100 px-0.5 text-red-900 line-through"
 aria-label={t('positions.versionComparison.removed')}
 >
 {item.text}
 </span>
 );
 }

 return (
 <span key={index} className="text-gray-700">
 {item.text}
 </span>
 );
 })}
 </div>
 );
 };

 const renderMetadataValue = (value: any): string => {
 if (value === null || value === undefined) return t('common.none');
 if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
 if (typeof value === 'object') return JSON.stringify(value);
 return String(value);
 };

 return (
 <div className={cn('space-y-6', className)}>
 {/* Version Selectors */}
 <Card>
 <CardHeader>
 <CardTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
 {t('positions.versionComparison.title')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className={cn('flex items-center gap-4', isRTL && 'flex-row-reverse')}>
 <div className="flex-1">
 <label
 className={cn('block text-sm font-medium mb-2', isRTL && 'text-end')}
 htmlFor="from-version"
 >
 {t('positions.versionComparison.fromVersion')}
 </label>
 <Select
 value={fromVersion?.toString()}
 onValueChange={(value) => setFromVersion(parseInt(value))}
 >
 <SelectTrigger id="from-version" className="w-full">
 <SelectValue placeholder={t('positions.versionComparison.selectVersion')} />
 </SelectTrigger>
 <SelectContent>
 {availableVersions.map((version) => (
 <SelectItem
 key={version.version_number}
 value={version.version_number.toString()}
 disabled={version.version_number === toVersion}
 >
 v{version.version_number}
 {version.change_summary && ` - ${version.change_summary}`}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <ArrowRight className="mt-6 size-5 shrink-0 text-muted-foreground" />

 <div className="flex-1">
 <label
 className={cn('block text-sm font-medium mb-2', isRTL && 'text-end')}
 htmlFor="to-version"
 >
 {t('positions.versionComparison.toVersion')}
 </label>
 <Select
 value={toVersion?.toString()}
 onValueChange={(value) => setToVersion(parseInt(value))}
 >
 <SelectTrigger id="to-version" className="w-full">
 <SelectValue placeholder={t('positions.versionComparison.selectVersion')} />
 </SelectTrigger>
 <SelectContent>
 {availableVersions.map((version) => (
 <SelectItem
 key={version.version_number}
 value={version.version_number.toString()}
 disabled={version.version_number === fromVersion}
 >
 v{version.version_number}
 {version.change_summary && ` - ${version.change_summary}`}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <Button
 onClick={handleCompare}
 disabled={
 !fromVersion || !toVersion || fromVersion === toVersion || isLoading
 }
 className="mt-6"
 >
 {isLoading ? (
 <Loader2 className="size-4 animate-spin" />
 ) : (
 t('positions.versionComparison.compare')
 )}
 </Button>
 </div>

 {fromVersion === toVersion && fromVersion && (
 <Alert className="mt-4">
 <AlertCircle className="size-4" />
 <AlertDescription>
 {t('positions.versionComparison.sameVersionError')}
 </AlertDescription>
 </Alert>
 )}
 </CardContent>
 </Card>

 {/* Loading State */}
 {isLoading && (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="size-8 animate-spin text-primary" />
 </div>
 )}

 {/* Error State */}
 {error && (
 <Alert variant="destructive">
 <AlertCircle className="size-4" />
 <AlertDescription>
 {error instanceof Error ? error.message : t('positions.versionComparison.error')}
 </AlertDescription>
 </Alert>
 )}

 {/* Diff Display */}
 {versionDiff && !isLoading && (
 <div className="space-y-6">
 {/* Side-by-Side Content Comparison */}
 <Card>
 <CardHeader>
 <CardTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
 {t('positions.versionComparison.contentChanges')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 {/* English Diff (Left) */}
 <div className="space-y-2">
 <div className="mb-3 flex items-center gap-2">
 <h3 className="text-sm font-semibold">
 {t('positions.versionComparison.englishVersion')}
 </h3>
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1">
 <span className="size-3 rounded border border-green-300 bg-green-100" />
 {t('positions.versionComparison.added')}
 </span>
 <span className="inline-flex items-center gap-1">
 <span className="size-3 rounded border border-red-300 bg-red-100" />
 {t('positions.versionComparison.removed')}
 </span>
 </div>
 </div>
 <div className="min-h-[200px] rounded-md border bg-gray-50 p-4">
 {versionDiff.english_diff.length > 0 ? (
 renderDiffText(versionDiff.english_diff, false)
 ) : (
 <p className="text-sm text-muted-foreground">
 {t('positions.versionComparison.noChanges')}
 </p>
 )}
 </div>
 </div>

 {/* Arabic Diff (Right) */}
 <div className="space-y-2">
 <div className="mb-3 flex items-center justify-end gap-2">
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1">
 <span className="size-3 rounded border border-red-300 bg-red-100" />
 {t('positions.versionComparison.removed')}
 </span>
 <span className="inline-flex items-center gap-1">
 <span className="size-3 rounded border border-green-300 bg-green-100" />
 {t('positions.versionComparison.added')}
 </span>
 </div>
 <h3 className="text-sm font-semibold">
 {t('positions.versionComparison.arabicVersion')}
 </h3>
 </div>
 <div className="min-h-[200px] rounded-md border bg-gray-50 p-4" dir="rtl">
 {versionDiff.arabic_diff.length > 0 ? (
 renderDiffText(versionDiff.arabic_diff, true)
 ) : (
 <p className="text-end text-sm text-muted-foreground">
 {t('positions.versionComparison.noChanges')}
 </p>
 )}
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Metadata Changes */}
 {Object.keys(versionDiff.metadata_changes).length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle
 className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}
 >
 {t('positions.versionComparison.metadataChanges')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead className={cn(isRTL && 'text-end')}>
 {t('positions.versionComparison.field')}
 </TableHead>
 <TableHead className={cn(isRTL && 'text-end')}>
 {t('positions.versionComparison.oldValue')}
 </TableHead>
 <TableHead className={cn(isRTL && 'text-end')}>
 {t('positions.versionComparison.newValue')}
 </TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {Object.entries(versionDiff.metadata_changes).map(([field, change]) => (
 <TableRow key={field}>
 <TableCell className={cn('font-medium', isRTL && 'text-end')}>
 {t(`positions.fields.${field}`, field)}
 </TableCell>
 <TableCell className={cn(isRTL && 'text-end')}>
 <span className="text-red-600">
 {renderMetadataValue(change.old)}
 </span>
 </TableCell>
 <TableCell className={cn(isRTL && 'text-end')}>
 <span className="text-green-600">
 {renderMetadataValue(change.new)}
 </span>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>
 )}

 {/* No Changes Message */}
 {versionDiff.english_diff.length === 0 &&
 versionDiff.arabic_diff.length === 0 &&
 Object.keys(versionDiff.metadata_changes).length === 0 && (
 <Alert>
 <AlertCircle className="size-4" />
 <AlertDescription>
 {t('positions.versionComparison.noChangesBetweenVersions')}
 </AlertDescription>
 </Alert>
 )}
 </div>
 )}
 </div>
 );
}
