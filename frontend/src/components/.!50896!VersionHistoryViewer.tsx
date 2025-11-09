import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from '@/components/ui/dialog';
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { History, Eye, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import * as diff from 'deep-diff';

interface Version {
 id: string;
 version_number: number;
 content: Record<string, any>;
 change_summary?: string;
 changed_by: {
 id: string;
 name: string;
 email: string;
 };
 changed_at: Date;
}

interface VersionHistoryViewerProps {
 afterActionId: string;
 currentVersion?: number;
 disabled?: boolean;
 className?: string;
}

type DiffKind = 'N' | 'D' | 'E' | 'A';

interface DiffItem {
 kind: DiffKind;
 path: (string | number)[];
 lhs?: any;
 rhs?: any;
 index?: number;
 item?: any;
}

export function VersionHistoryViewer({
 afterActionId,
 currentVersion,
 disabled = false,
 className,
}: VersionHistoryViewerProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const [open, setOpen] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [versions, setVersions] = useState<Version[]>([]);
 const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null);
 const [showDiff, setShowDiff] = useState(false);

 const loadVersions = async () => {
 setLoading(true);
 setError(null);

 try {
 const response = await fetch(`/api/after-actions/${afterActionId}/versions`);

 if (!response.ok) {
 throw new Error(t('afterActions.versions.loadFailed'));
 }

 const data = await response.json();
 setVersions(data.versions || []);
 } catch (err) {
 setError(err instanceof Error ? err.message : t('afterActions.versions.loadFailed'));
 } finally {
 setLoading(false);
 }
 };

 const handleViewDiff = (version1: number, version2: number) => {
 setSelectedVersions([version1, version2]);
 setShowDiff(true);
 };

 const getDiffChanges = (): DiffItem[] => {
 if (!selectedVersions) return [];

 const [v1, v2] = selectedVersions;
 const version1 = versions.find((v) => v.version_number === v1);
 const version2 = versions.find((v) => v.version_number === v2);

 if (!version1 || !version2) return [];

 return (diff.diff(version1.content, version2.content) || []) as DiffItem[];
 };

 const renderDiffValue = (value: any): string => {
 if (value === null || value === undefined) return 'null';
 if (typeof value === 'object') return JSON.stringify(value, null, 2);
 return String(value);
 };

 const getDiffColor = (kind: DiffKind) => {
 switch (kind) {
 case 'N':
 return 'text-green-600 bg-green-50';
 case 'D':
 return 'text-red-600 bg-red-50';
 case 'E':
 return 'text-yellow-600 bg-yellow-50';
 case 'A':
 return 'text-blue-600 bg-blue-50';
 default:
 return '';
 }
 };

 const getDiffLabel = (kind: DiffKind) => {
 switch (kind) {
 case 'N':
 return t('afterActions.versions.added');
 case 'D':
 return t('afterActions.versions.deleted');
 case 'E':
 return t('afterActions.versions.modified');
 case 'A':
 return t('afterActions.versions.arrayChange');
 default:
 return '';
 }
 };

 const formatPath = (path: (string | number)[]): string => {
