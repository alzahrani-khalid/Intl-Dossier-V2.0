/**
 * Route: /positions/:id/versions
 * Version history and comparison page
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { VersionComparison } from '@/components/VersionComparison';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_protected/positions/$id/versions')({
  component: VersionHistoryPage,
});

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

async function fetchVersions(positionId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${API_BASE_URL}/positions-versions-list?id=${positionId}`, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch versions');
  }

  const data = await response.json();
  return data.versions || [];
}

function VersionHistoryPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const [selectedVersions, setSelectedVersions] = useState<[number | null, number | null]>([null, null]);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['positions', 'versions', id],
    queryFn: () => fetchVersions(id),
  });

  const handleVersionSelect = (versionNumber: number) => {
    if (selectedVersions[0] === null) {
      setSelectedVersions([versionNumber, null]);
    } else if (selectedVersions[1] === null && versionNumber !== selectedVersions[0]) {
      setSelectedVersions([selectedVersions[0], versionNumber]);
    } else {
      setSelectedVersions([versionNumber, null]);
    }
  };

  const canCompare = selectedVersions[0] !== null && selectedVersions[1] !== null;

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
        <div className="flex items-center gap-4">
          <Link to="/positions/$id" params={{ id }}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="me-2 h-4 w-4" />
              {t('common.back', 'Back')}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {t('positions.versions.title', 'Version History')}
          </h1>
        </div>

        {canCompare && (
          <Button onClick={() => {}}>
            <GitCompare className="me-2 h-4 w-4" />
            {t('positions.versions.compare', 'Compare Versions')}
          </Button>
        )}
      </div>

      {/* Version List */}
      {!canCompare && (
        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('positions.versions.selectTwo', 'Select two versions to compare')}
            </p>

            <div className="space-y-2">
              {versions?.map((version: any) => (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedVersions.includes(version.version_number)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleVersionSelect(version.version_number)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {t('positions.versions.version', 'Version')} {version.version_number}
                        </span>
                        {!version.superseded && (
                          <Badge variant="success">
                            {t('positions.versions.current', 'Current')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(version.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Version Comparison */}
      {canCompare && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('positions.versions.comparing', 'Comparing versions')}:
              </span>
              <Badge>{selectedVersions[0]}</Badge>
              <span className="text-sm text-muted-foreground">vs</span>
              <Badge>{selectedVersions[1]}</Badge>
            </div>
            <Button variant="outline" onClick={() => setSelectedVersions([null, null])}>
              {t('common.clear', 'Clear Selection')}
            </Button>
          </div>

          <VersionComparison
            positionId={id}
            fromVersion={Math.min(selectedVersions[0]!, selectedVersions[1]!)}
            toVersion={Math.max(selectedVersions[0]!, selectedVersions[1]!)}
          />
        </Card>
      )}
    </div>
  );
}
