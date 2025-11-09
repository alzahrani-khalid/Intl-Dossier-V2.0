/**
 * Relationships Section Component (Feature 028 - T059)
 *
 * Displays dossier-to-dossier relationships with optional network graph visualization.
 * Reusable across all 6 dossier types. Mobile-first with touch gestures and RTL support.
 *
 * @example
 * ```tsx
 * <Relationships dossierId={dossier.id} visualizationMode="list" />
 * <Relationships dossierId={dossier.id} visualizationMode="graph" />
 * ```
 */

import { useTranslation } from 'react-i18next';
import { Network, Link2, Calendar, ArrowRight, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, memo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { supabase } from '@/lib/supabase-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Relationship {
  id: string;
  source_dossier_id: string;
  target_dossier_id: string;
  relationship_type: string;
  effective_from: string | null;
  effective_to: string | null;
  metadata?: Record<string, any>;
  source_dossier?: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
  };
  target_dossier?: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
  };
}

interface RelationshipsProps {
  dossierId: string;
  /**
   * Visualization mode: 'list' (default) or 'graph' (React Flow network)
   */
  visualizationMode?: 'list' | 'graph' | 'both';
  /**
   * Optional filter by relationship type
   */
  relationshipTypeFilter?: string;
  /**
   * Optional CSS class for container
   */
  className?: string;
}

// Custom node component for related dossiers (memoized for performance)
const DossierNode = memo(
  ({ data }: { data: { label: string; type: string; relationCount: number } }) => (
    <div className="bg-card border-2 border-primary rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-md min-w-[80px] sm:min-w-[100px] hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center gap-1">
        <Badge variant="outline" className="text-xs">
          {data.type}
        </Badge>
        <div className="text-sm sm:text-base font-semibold text-foreground text-center">
          {data.label}
        </div>
        {data.relationCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {data.relationCount}
          </Badge>
        )}
      </div>
    </div>
  )
);
DossierNode.displayName = 'DossierNode';

const nodeTypes: NodeTypes = {
  dossier: DossierNode,
};

/**
 * Format date in localized format
 */
function formatDate(dateString: string | null, locale: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Shared Relationships Section Component
 *
 * Displays relationships for any dossier type with list and graph views
 */
export function Relationships({
  dossierId,
  visualizationMode = 'both',
  relationshipTypeFilter,
  className = '',
}: RelationshipsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const [viewMode, setViewMode] = useState<'list' | 'graph'>(
    visualizationMode === 'both' ? 'list' : visualizationMode
  );

  // Fetch relationships with related dossier info
  const { data: relationships, isLoading } = useQuery({
    queryKey: ['relationships', dossierId, relationshipTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('dossier_relationships')
        .select(
          `
          id,
          source_dossier_id,
          target_dossier_id,
          relationship_type,
          effective_from,
          effective_to,
          metadata:relationship_metadata,
          source_dossier:dossiers!source_dossier_id(id, type, name_en, name_ar),
          target_dossier:dossiers!target_dossier_id(id, type, name_en, name_ar)
        `
        )
        .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`);

      if (relationshipTypeFilter) {
        query = query.eq('relationship_type', relationshipTypeFilter);
      }

      const { data, error } = await query.order('effective_from', { ascending: false });

      if (error) throw error;
      return data as Relationship[];
    },
  });

  // Extract unique dossiers for graph view
  const uniqueDossiers = useMemo(() => {
    if (!relationships) return [];

    const dossierMap = new Map<string, { id: string; type: string; name: string }>();

    relationships.forEach((rel) => {
      if (rel.source_dossier && !dossierMap.has(rel.source_dossier.id)) {
        dossierMap.set(rel.source_dossier.id, {
          id: rel.source_dossier.id,
          type: rel.source_dossier.type,
          name: isRTL ? rel.source_dossier.name_ar : rel.source_dossier.name_en,
        });
      }
      if (rel.target_dossier && !dossierMap.has(rel.target_dossier.id)) {
        dossierMap.set(rel.target_dossier.id, {
          id: rel.target_dossier.id,
          type: rel.target_dossier.type,
          name: isRTL ? rel.target_dossier.name_ar : rel.target_dossier.name_en,
        });
      }
    });

    return Array.from(dossierMap.values());
  }, [relationships, isRTL]);

  // Generate nodes and edges for graph view
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!relationships || relationships.length === 0 || uniqueDossiers.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Count relationships per dossier
    const relationCounts = new Map<string, number>();
    relationships.forEach((rel) => {
      relationCounts.set(rel.source_dossier_id, (relationCounts.get(rel.source_dossier_id) || 0) + 1);
      relationCounts.set(rel.target_dossier_id, (relationCounts.get(rel.target_dossier_id) || 0) + 1);
    });

    // Create nodes
    const nodesData = uniqueDossiers.map((dossier) => ({
      id: dossier.id,
      type: 'dossier' as const,
      position: { x: 0, y: 0 }, // Will be calculated by d3-force
      data: {
        label: dossier.name,
        type: dossier.type,
        relationCount: relationCounts.get(dossier.id) || 0,
      },
    }));

    // Create edges
    const edgesData = relationships.map((rel) => {
      const isActive = !rel.effective_to || new Date(rel.effective_to) > new Date();

      return {
        id: rel.id,
        source: rel.source_dossier_id,
        target: rel.target_dossier_id,
        label: rel.relationship_type,
        type: 'default' as const,
        animated: isActive,
        style: {
          stroke: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
        },
      };
    });

    // Apply d3-force layout
    const simulation = forceSimulation(nodesData as any)
      .force('link', forceLink(edgesData).id((d: any) => d.id).distance(150))
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(400, 300))
      .force('collide', forceCollide(80))
      .stop();

    // Run simulation synchronously
    for (let i = 0; i < 300; ++i) simulation.tick();

    // Apply RTL position mirroring if needed
    if (isRTL) {
      nodesData.forEach((node) => {
        node.position.x = 800 - node.position.x;
      });
    }

    return { nodes: nodesData, edges: edgesData };
  }, [relationships, uniqueDossiers, isRTL]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when data changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 sm:py-16 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!relationships || relationships.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-8 sm:py-12 text-center ${className}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('section.relationshipsEmpty')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t('section.relationshipsEmptyDescription')}
        </p>

        <Button variant="outline" size="sm">
          <Link2 className="h-4 w-4 me-2" />
          {t('actions.addRelationship')}
        </Button>
      </div>
    );
  }

  // Render view tabs if 'both' mode
  const showTabs = visualizationMode === 'both';

  return (
    <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      {showTabs ? (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'graph')}>
          <TabsList className="mb-4">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              {t('views.list')}
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              {t('views.graph')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <RelationshipsList relationships={relationships} isRTL={isRTL} />
          </TabsContent>

          <TabsContent value="graph">
            <RelationshipsGraph
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              isRTL={isRTL}
            />
          </TabsContent>
        </Tabs>
      ) : viewMode === 'list' ? (
        <RelationshipsList relationships={relationships} isRTL={isRTL} />
      ) : (
        <RelationshipsGraph
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}

/**
 * List view of relationships
 */
function RelationshipsList({ relationships, isRTL }: { relationships: Relationship[]; isRTL: boolean }) {
  const { t, i18n } = useTranslation('dossier');

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4">
      {relationships.map((rel) => {
        const isActive = !rel.effective_to || new Date(rel.effective_to) > new Date();
        const relatedDossier =
          rel.source_dossier?.id !== rel.source_dossier_id ? rel.source_dossier : rel.target_dossier;

        if (!relatedDossier) return null;

        return (
          <Card key={rel.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                      {rel.relationship_type}
                    </Badge>
                    {!isActive && (
                      <Badge variant="outline" className="text-xs">
                        {t('status.historical')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">
                      {isRTL ? relatedDossier.name_ar : relatedDossier.name_en}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {relatedDossier.type}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                    {rel.effective_from && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{formatDate(rel.effective_from, i18n.language)}</span>
                      </div>
                    )}
                    {rel.effective_to && (
                      <>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{formatDate(rel.effective_to, i18n.language)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="self-start sm:self-center">
                  <Eye className="h-4 w-4 me-2" />
                  {t('actions.view')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Graph view of relationships using React Flow
 */
function RelationshipsGraph({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  isRTL,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  nodeTypes: NodeTypes;
  isRTL: boolean;
}) {
  return (
    <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition={isRTL ? 'top-left' : 'top-right'}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
        }}
        onlyRenderVisibleElements={true}
      >
        <Background color="hsl(var(--muted-foreground))" gap={16} />
        <Controls position={isRTL ? 'top-left' : 'top-right'} />
        <MiniMap
          position={isRTL ? 'bottom-right' : 'bottom-left'}
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--muted) / 0.5)"
        />
      </ReactFlow>
    </div>
  );
}
