// T049: RelationshipGraph component with React Flow
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import ReactFlow, {
 Background,
 Controls,
 Node,
 Edge,
 useNodesState,
 useEdgesState,
 MarkerType,
 Position,
 BackgroundVariant,
 ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useRelationshipsForDossier } from '@/hooks/useRelationships';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { CenterNode, RelatedNode } from './CustomNodes';
import { CustomEdge } from './CustomEdges';

interface RelationshipGraphProps {
 dossierId: string;
 dossierName?: string;
}

// Define custom node types OUTSIDE component to prevent recreation on every render
// This fixes the React Flow warning and ensures nodes render correctly
const nodeTypes = {
 centerNode: CenterNode,
 relatedNode: RelatedNode,
};

// Define custom edge types OUTSIDE component
const edgeTypes = {
 customEdge: CustomEdge,
};

export function RelationshipGraph({ dossierId, dossierName = 'Current Dossier' }: RelationshipGraphProps) {
 const { t, i18n } = useTranslation('dossiers');
 const navigate = useNavigate();
 const isRTL = i18n.language === 'ar';

 const [relationshipTypeFilter, setRelationshipTypeFilter] = useState<string | undefined>(undefined);

 const { data: relationshipsData, isLoading, error } = useRelationshipsForDossier(dossierId);
 const relationships = relationshipsData?.relationships || [];

 // Transform relationships to React Flow nodes and edges
 const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
 if (!relationships || relationships.length === 0) {
 return { nodes: [], edges: [] };
 }

 const nodes: Node[] = [];
 const edges: Edge[] = [];
 const nodeMap = new Map<string, boolean>();

 // Center node (current dossier) - Custom component with stats
 nodes.push({
 id: dossierId,
 type: 'centerNode',
 data: {
 label: dossierName,
 isCenter: true,
 description: 'Central hub for bilateral and multilateral relationships',
 stats: {
 mous: 12,
 positions: 8,
 engagements: 24,
 health_score: 85,
 },
 },
 position: { x: 600, y: 400 },
 sourcePosition: isRTL ? Position.Left : Position.Right,
 targetPosition: isRTL ? Position.Right : Position.Left,
 });
 nodeMap.set(dossierId, true);

 // Calculate positions in a circle around the center - Increased radius for better spread
 const radius = 500;
 const angleStep = (2 * Math.PI) / relationships.length;

 relationships.forEach((rel, index) => {
 const angle = index * angleStep;
 const x = 600 + radius * Math.cos(angle);
 const y = 400 + radius * Math.sin(angle);

 // Mock stats for related nodes (in production, fetch from dossier data)
 const mockStats = {
 mous: Math.floor(Math.random() * 10) + 1,
 engagements: Math.floor(Math.random() * 15) + 5,
 health_score: Math.floor(Math.random() * 30) + 60,
 };

 // Add target dossier node if not current dossier - Custom component with stats
 if (rel.target_dossier && rel.target_dossier.id !== dossierId && !nodeMap.has(rel.target_dossier.id)) {
 nodes.push({
 id: rel.target_dossier.id,
 type: 'relatedNode',
 data: {
 label: isRTL ? rel.target_dossier.name_ar : rel.target_dossier.name_en,
 referenceType: rel.target_dossier.type as 'country' | 'organization' | 'forum',
 description: `Key ${rel.target_dossier.type} partner with active collaboration`,
 stats: mockStats,
 },
 position: { x: isRTL ? 1200 - x : x, y },
 sourcePosition: isRTL ? Position.Left : Position.Right,
 targetPosition: isRTL ? Position.Right : Position.Left,
 });
 nodeMap.set(rel.target_dossier.id, true);
 }

 // Add source dossier node if not current dossier - Custom component with stats
 if (rel.source_dossier && rel.source_dossier.id !== dossierId && !nodeMap.has(rel.source_dossier.id)) {
 nodes.push({
 id: rel.source_dossier.id,
 type: 'relatedNode',
 data: {
 label: isRTL ? rel.source_dossier.name_ar : rel.source_dossier.name_en,
 referenceType: rel.source_dossier.type as 'country' | 'organization' | 'forum',
 description: `Key ${rel.source_dossier.type} partner with active collaboration`,
 stats: mockStats,
 },
 position: { x: isRTL ? 1200 - x : x, y },
 sourcePosition: isRTL ? Position.Left : Position.Right,
 targetPosition: isRTL ? Position.Right : Position.Left,
 });
 nodeMap.set(rel.source_dossier.id, true);
 }

 // Create edge with custom component
 // Default color since relationship_strength doesn't exist in new schema
 const edgeColor = '#3b82f6'; // Default blue color

 edges.push({
 id: `${rel.source_dossier_id}-${rel.target_dossier_id}-${rel.relationship_type}`,
 source: rel.source_dossier_id,
 target: rel.target_dossier_id,
 type: 'customEdge',
 data: {
 label: t(`relationships.types.${rel.relationship_type}`) || rel.relationship_type,
 strength: 'primary', // Default strength since it doesn't exist in new schema
 },
 markerEnd: {
 type: MarkerType.ArrowClosed,
 color: edgeColor,
 width: 20,
 height: 20,
 },
 });
 });

 return { nodes, edges };
 }, [relationships, dossierId, dossierName, isRTL]); // t is stable from i18next

 const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
 const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
 const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

 // Track the last synced relationship count to prevent infinite loops
 const lastSyncedCount = useRef<number>(-1);

 // Sync nodes and edges state when relationships data changes
 // useNodesState/useEdgesState don't automatically update when their initial values change
 useEffect(() => {
 if (lastSyncedCount.current !== relationships.length) {
 setNodes(initialNodes);
 setEdges(initialEdges);
 lastSyncedCount.current = relationships.length;
 }
 }, [relationships.length, initialNodes, initialEdges]);

 // Fit view when instance becomes available
 useEffect(() => {
 if (reactFlowInstance && initialNodes.length > 0) {
 // Small delay to ensure nodes are rendered
 setTimeout(() => {
 reactFlowInstance.fitView({
 padding: 0.2,
 includeHiddenNodes: false,
 duration: 400,
 });
 }, 100);
 }
 }, [reactFlowInstance, initialNodes.length]); // Only re-fit when instance is ready or node count changes

 // Create a stable key for ReactFlow to force remount on data changes
 const graphKey = useMemo(() =>
 `${dossierId}-${relationships.length}-${relationshipTypeFilter || 'all'}-${isRTL}`,
 [dossierId, relationships.length, relationshipTypeFilter, isRTL]
 );

 // Handle node click - navigate to related dossier
 const onNodeClick = useCallback(
 (event: React.MouseEvent, node: Node) => {
 if (node.id !== dossierId) {
 navigate({ to: `/dossiers/${node.id}` });
 }
 },
 [dossierId, navigate]
 );

 // Handle React Flow initialization
 const onInit = useCallback((instance: ReactFlowInstance) => {
 setReactFlowInstance(instance);
 }, []);

 if (isLoading) {
 return (
 <Card className="p-12 text-center">
 <div className="flex flex-col items-center gap-4">
 <Loader2 className="h-10 w-10 animate-spin text-primary" />
 <p className="text-muted-foreground animate-pulse">{t('loading')}</p>
 </div>
 </Card>
 );
 }

 if (error) {
 return (
 <Card className="p-12 text-center bg-destructive/10 border-destructive/20">
 <div className="flex flex-col items-center gap-3">
 <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
 <span className="text-2xl">⚠️</span>
 </div>
 <p className="text-destructive font-medium">{t('relationships.errors.loadFailed')}</p>
 </div>
 </Card>
 );
 }

 if (!relationships.length) {
 return (
 <Card className="p-12 text-center bg-muted/30">
 <div className="flex flex-col items-center gap-3">
 <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
 <span className="text-3xl">🔗</span>
 </div>
 <p className="text-muted-foreground text-lg">{t('relationships.no_relationships')}</p>
 </div>
 </Card>
 );
 }

 return (
 <div className="flex flex-col gap-4 sm:gap-6" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Filter Controls - Theme aware */}
 <Card className="p-4 sm:p-6 bg-accent/10 border-accent/20">
 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
 <label className="text-sm font-semibold text-foreground min-w-fit">
 {t('relationships.filter_by_type')}
 </label>
 <Select value={relationshipTypeFilter} onValueChange={(value) => setRelationshipTypeFilter(value === 'all' ? undefined : value)}>
 <SelectTrigger className="w-full sm:w-72 bg-card border-border focus:ring-2 focus:ring-ring">
 <SelectValue placeholder={t('relationships.all_types')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('relationships.all_types')}</SelectItem>
 <SelectItem value="member_of">{t('relationships.types.member_of')}</SelectItem>
 <SelectItem value="participates_in">{t('relationships.types.participates_in')}</SelectItem>
 <SelectItem value="collaborates_with">{t('relationships.types.collaborates_with')}</SelectItem>
 <SelectItem value="monitors">{t('relationships.types.monitors')}</SelectItem>
 <SelectItem value="is_member">{t('relationships.types.is_member')}</SelectItem>
 <SelectItem value="hosts">{t('relationships.types.hosts')}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </Card>

 {/* Network Graph - Enhanced Responsive with Larger Card Nodes - Theme aware */}
 <Card className="h-[700px] sm:h-[800px] md:h-[900px] overflow-hidden shadow-xl border-2 border-border">
 <ReactFlow
 key={graphKey}
 nodes={nodes}
 edges={edges}
 onNodesChange={onNodesChange}
 onEdgesChange={onEdgesChange}
 onNodeClick={onNodeClick}
 onInit={onInit}
 nodeTypes={nodeTypes}
 edgeTypes={edgeTypes}
 fitView
 fitViewOptions={{
 padding: 0.2,
 includeHiddenNodes: false,
 }}
 attributionPosition={isRTL ? 'bottom-left' : 'bottom-right'}
 minZoom={0.1}
 maxZoom={1.0}
 defaultEdgeOptions={{
 animated: false,
 }}
 proOptions={{ hideAttribution: true }}
 >
 <Background
 variant={BackgroundVariant.Dots}
 gap={20}
 size={1.5}
 color="hsl(var(--border))"
 className="bg-background"
 />
 <Controls
 className="bg-card/90 backdrop-blur-sm shadow-xl border-2 border-border rounded-xl"
 showInteractive={false}
 />
 </ReactFlow>
 </Card>

 </div>
 );
}
