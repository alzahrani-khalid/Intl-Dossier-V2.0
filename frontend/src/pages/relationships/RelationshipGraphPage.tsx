// T083: RelationshipGraphPage - Full-page Graph Visualization
// User Story 3: Traverse Entity Relationships as Graph
// Main page for exploring dossier relationships with graph and list views
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { GraphVisualization } from '@/components/relationships/GraphVisualization';
import { RelationshipNavigator } from '@/components/relationships/RelationshipNavigator';
import { Network, List, AlertCircle, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Graph data interface
interface GraphData {
  start_dossier_id: string;
  start_dossier: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
    status: string;
  };
  max_degrees: number;
  relationship_type_filter: string;
  nodes: Array<{
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
    status: string;
    degree: number;
    path: string[];
  }>;
  edges: Array<{
    source_id: string;
    target_id: string;
    relationship_type: string;
  }>;
  stats: {
    node_count: number;
    edge_count: number;
    max_degree: number;
    query_time_ms: number;
    performance_warning: string | null;
  };
}

// Fetch graph data from Edge Function
async function fetchGraphData(
  startDossierId: string,
  maxDegrees: number,
  relationshipType?: string
): Promise<GraphData> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams({
    startDossierId,
    maxDegrees: maxDegrees.toString(),
  });

  if (relationshipType && relationshipType !== 'all') {
    params.append('relationshipType', relationshipType);
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/graph-traversal?${params}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch graph data');
  }

  return response.json();
}

export function RelationshipGraphPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  // Get query parameters
  const search = useSearch({ strict: false });
  const startDossierId = (search as any)?.dossierId as string | undefined;

  // State
  const [maxDegrees, setMaxDegrees] = useState(2);
  const [relationshipType, setRelationshipType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'graph' | 'list'>('graph');

  // Fetch graph data
  const {
    data: graphData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['graph-traversal', startDossierId, maxDegrees, relationshipType],
    queryFn: () => fetchGraphData(startDossierId!, maxDegrees, relationshipType),
    enabled: !!startDossierId,
    staleTime: 30000, // Cache for 30 seconds
  });

  const handleNodeSelect = (nodeId: string) => {
    navigate({
      to: '/dossiers/$dossierId',
      params: { dossierId: nodeId },
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!startDossierId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('graph.noDossier', 'No dossier selected. Please select a dossier to view its relationship graph.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {t('graph.title', 'Relationship Graph')}
        </h1>
        <p className="text-muted-foreground">
          {t('graph.description', 'Explore connections between entities')}
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="maxDegrees" className="mb-2 block">
                {t('graph.maxDegrees', 'Degrees of Separation')}
              </Label>
              <Select
                value={maxDegrees.toString()}
                onValueChange={(value) => setMaxDegrees(parseInt(value))}
              >
                <SelectTrigger id="maxDegrees">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1° {t('graph.degree', 'degree')}</SelectItem>
                  <SelectItem value="2">2° {t('graph.degrees', 'degrees')}</SelectItem>
                  <SelectItem value="3">3° {t('graph.degrees', 'degrees')}</SelectItem>
                  <SelectItem value="4">4° {t('graph.degrees', 'degrees')}</SelectItem>
                  <SelectItem value="5">5° {t('graph.degrees', 'degrees')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="relationshipType" className="mb-2 block">
                {t('graph.relationshipType', 'Relationship Type')}
              </Label>
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger id="relationshipType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('graph.allTypes', 'All Types')}</SelectItem>
                  <SelectItem value="member_of">{t('relationship.memberOf', 'Member Of')}</SelectItem>
                  <SelectItem value="partner">{t('relationship.partner', 'Partner')}</SelectItem>
                  <SelectItem value="parent_org">{t('relationship.parentOrg', 'Parent Organization')}</SelectItem>
                  <SelectItem value="hosted_by">{t('relationship.hostedBy', 'Hosted By')}</SelectItem>
                  <SelectItem value="participant">{t('relationship.participant', 'Participant')}</SelectItem>
                  <SelectItem value="signatory">{t('relationship.signatory', 'Signatory')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleRefresh} variant="outline" className="w-full">
                <Settings className="h-4 w-4 me-2" />
                {t('graph.refresh', 'Refresh')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          {graphData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{graphData.stats.node_count}</div>
                  <div className="text-xs text-muted-foreground">{t('graph.nodes', 'Entities')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{graphData.stats.edge_count}</div>
                  <div className="text-xs text-muted-foreground">{t('graph.edges', 'Relationships')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{graphData.stats.max_degree}°</div>
                  <div className="text-xs text-muted-foreground">{t('graph.maxDegree', 'Max Degree')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{graphData.stats.query_time_ms}ms</div>
                  <div className="text-xs text-muted-foreground">{t('graph.queryTime', 'Query Time')}</div>
                </div>
              </div>

              {graphData.stats.performance_warning && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{graphData.stats.performance_warning}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('graph.error', 'Failed to load graph data')}: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[600px] w-full" />
          </CardContent>
        </Card>
      )}

      {/* Graph Visualization */}
      {graphData && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'graph' | 'list')}>
          <TabsList className="mb-4">
            <TabsTrigger value="graph" className="gap-2">
              <Network className="h-4 w-4" />
              {t('graph.graphView', 'Graph View')}
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              {t('graph.listView', 'List View')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="graph">
            <GraphVisualization
              nodes={[graphData.start_dossier, ...graphData.nodes]}
              edges={graphData.edges}
              onNodeClick={handleNodeSelect}
              height="calc(100vh - 500px)"
              showMiniMap
              showControls
            />
          </TabsContent>

          <TabsContent value="list">
            <RelationshipNavigator
              nodes={[graphData.start_dossier, ...graphData.nodes]}
              startDossierId={startDossierId}
              onNodeSelect={handleNodeSelect}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
