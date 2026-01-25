/**
 * Diplomatic Relations Section (Feature 028 + 029 - User Story 1 + 4 - T023/T057, T059)
 *
 * Displays country-to-country diplomatic relations using React Flow network graph
 * with d3-force layout algorithm. Optimized for performance with memoization
 * and virtualization. Mobile-first with touch gestures and RTL support.
 *
 * Includes inline bilateral intelligence widget (Feature 029 - User Story 4 - T059)
 */

import { useTranslation } from 'react-i18next'
import { Globe2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { IntelligenceInsight } from '@/components/intelligence/IntelligenceInsight'
import { useIntelligence, useRefreshIntelligence } from '@/hooks/useIntelligence'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemo, useCallback, memo } from 'react'
import {
  ReactFlow,
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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import { supabase } from '@/lib/supabase-client'
import { Badge } from '@/components/ui/badge'

interface DiplomaticRelation {
  id: string
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: string
  effective_from: string | null
  effective_to: string | null
  metadata?: {
    status?: 'active' | 'historical' | 'terminated'
  }
}

interface RelatedCountry {
  id: string
  name_en: string
  name_ar: string
  extension: {
    iso_code_2: string
    region: string
  }
}

interface DiplomaticRelationsProps {
  dossierId: string
}

// Custom node component for countries (memoized for performance)
const CountryNode = memo(
  ({ data }: { data: { label: string; isoCode: string; relationCount: number } }) => (
    <div className="bg-card border-2 border-primary rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-md min-w-[80px] sm:min-w-[100px] hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs sm:text-sm font-mono text-muted-foreground">{data.isoCode}</div>
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
  ),
)
CountryNode.displayName = 'CountryNode'

const nodeTypes: NodeTypes = {
  country: CountryNode,
}

export function DiplomaticRelations({ dossierId }: DiplomaticRelationsProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Fetch bilateral intelligence for inline widget (Feature 029 - User Story 4 - T059)
  const {
    data: bilateralIntelligence,
    isLoading: isLoadingBilateral,
    error: bilateralError,
  } = useIntelligence({
    entity_id: dossierId,
    intelligence_type: 'bilateral',
  })

  // Refresh mutation for bilateral intelligence
  const { mutate: refreshBilateral, isPending: isRefreshingBilateral } = useRefreshIntelligence()

  const handleBilateralRefresh = () => {
    refreshBilateral({
      entity_id: dossierId,
      intelligence_types: ['bilateral'],
    })
  }

  // Fetch diplomatic relations and related countries
  const {
    data: relations,
    isLoading,
    error: relationsError,
  } = useQuery({
    queryKey: ['diplomatic-relations', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossier_relationships')
        .select(
          `
          id,
          source_dossier_id,
          target_dossier_id,
          relationship_type,
          effective_from,
          effective_to,
          metadata:relationship_metadata
        `,
        )
        .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`)
        .order('effective_from', { ascending: false })

      if (error) {
        console.error('Error fetching diplomatic relations:', error)
        return [] // Return empty array instead of throwing
      }
      return data as DiplomaticRelation[]
    },
    retry: false, // Don't retry on permission errors
  })

  const { data: countries } = useQuery({
    queryKey: ['related-countries', dossierId],
    queryFn: async () => {
      if (!relations || relations.length === 0) return []

      const countryIds = new Set<string>()
      // Include the current dossier
      countryIds.add(dossierId)
      // Include all related countries
      relations.forEach((rel) => {
        countryIds.add(rel.source_dossier_id)
        countryIds.add(rel.target_dossier_id)
      })

      const { data, error } = await supabase
        .from('dossiers')
        .select(
          `
          id,
          type,
          name_en,
          name_ar,
          countries(iso_code_2, region)
        `,
        )
        .in('id', Array.from(countryIds))

      if (error) throw error

      // Transform the data to match RelatedCountry interface
      // For non-country dossiers, provide default values
      return (data || []).map((d) => ({
        id: d.id,
        name_en: d.name_en,
        name_ar: d.name_ar,
        extension: {
          iso_code_2: d.countries?.[0]?.iso_code_2 || d.type?.substring(0, 2).toUpperCase() || '??',
          region: d.countries?.[0]?.region || d.type || 'Other',
        },
      })) as RelatedCountry[]
    },
    enabled: !!relations && relations.length > 0,
  })

  // Generate nodes and edges using d3-force layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!relations || !countries || relations.length === 0 || countries.length === 0) {
      return { nodes: [], edges: [] }
    }

    // Create node map
    const nodeMap = new Map<string, RelatedCountry>()
    countries.forEach((country) => nodeMap.set(country.id, country))

    // Create nodes array
    const nodesData = countries.map((country) => {
      const relationCount = relations.filter(
        (rel) => rel.source_dossier_id === country.id || rel.target_dossier_id === country.id,
      ).length

      return {
        id: country.id,
        type: 'country' as const,
        position: { x: 0, y: 0 }, // Will be calculated by d3-force
        data: {
          label: isRTL ? country.name_ar : country.name_en,
          isoCode: country.extension?.iso_code_2 || '',
          relationCount,
        },
      }
    })

    // Create edges array
    const edgesData = relations.map((rel) => {
      const isActive = !rel.effective_to || new Date(rel.effective_to) > new Date()

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
      }
    })

    // Apply d3-force layout (memoized calculation)
    const simulation = forceSimulation(nodesData as any)
      .force(
        'link',
        forceLink(edgesData)
          .id((d: any) => d.id)
          .distance(150),
      )
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(400, 300))
      .force('collide', forceCollide(80))
      .stop()

    // Run simulation synchronously
    for (let i = 0; i < 300; ++i) simulation.tick()

    // Apply RTL position mirroring if needed
    if (isRTL) {
      nodesData.forEach((node) => {
        node.position.x = 800 - node.position.x
      })
    }

    return { nodes: nodesData, edges: edgesData }
  }, [relations, countries, isRTL])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes/edges when data changes
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-16" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!relations || relations.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.country.diplomaticRelationsEmpty')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t('sections.country.diplomaticRelationsEmptyDescription')}
        </p>
      </div>
    )
  }

  // Network graph view + Bilateral Intelligence Widget
  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Bilateral Intelligence Widget (Feature 029 - User Story 4 - T059) */}
      <div className="w-full">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3">
          {t('intelligence.bilateral_insights', 'Bilateral Relationship Insights')}
        </h3>
        {isLoadingBilateral ? (
          <Skeleton className="h-48 w-full" />
        ) : bilateralIntelligence && bilateralIntelligence.data.length > 0 ? (
          <IntelligenceInsight
            intelligence={bilateralIntelligence.data[0]}
            onRefresh={handleBilateralRefresh}
            isRefreshing={isRefreshingBilateral}
            dossierType="countries"
            dossierId={dossierId}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg bg-muted/30">
            <Globe2 className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              {bilateralError
                ? t('intelligence.error_loading', 'Error loading intelligence')
                : t('intelligence.no_bilateral_data', 'No bilateral intelligence available')}
            </p>
          </div>
        )}
      </div>

      {/* Diplomatic Relations Network Graph */}
      <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] border rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as OnNodesChange}
          onEdgesChange={onEdgesChange as OnEdgesChange}
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
    </div>
  )
}
