// T082: RelationshipNavigator Component for Browsing Relationships
// User Story 3: Traverse Entity Relationships as Graph
// Provides filterable list view of relationships with degree navigation
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Search, ChevronRight, Filter } from 'lucide-react'

// Node data structure
interface NodeData {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
  degree: number
  path: string[]
}

// Props interface
interface RelationshipNavigatorProps {
  nodes: NodeData[]
  startDossierId: string
  onNodeSelect?: (nodeId: string) => void
}

export function RelationshipNavigator({
  nodes,
  startDossierId,
  onNodeSelect,
}: RelationshipNavigatorProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [searchQuery, setSearchQuery] = useState('')
  const [degreeFilter, setDegreeFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Get unique node types for filter
  const nodeTypes = [...new Set(nodes.map((n) => n.type))]

  // Get max degree for filter options
  const maxDegree = Math.max(...nodes.map((n) => n.degree))

  // Filter nodes based on search and filters
  const filteredNodes = nodes.filter((node) => {
    if (node.id === startDossierId) return false // Exclude starting node

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesEn = node.name_en.toLowerCase().includes(query)
      const matchesAr = node.name_ar.toLowerCase().includes(query)
      if (!matchesEn && !matchesAr) return false
    }

    // Degree filter
    if (degreeFilter !== 'all' && node.degree !== parseInt(degreeFilter)) {
      return false
    }

    // Type filter
    if (typeFilter !== 'all' && node.type !== typeFilter) {
      return false
    }

    return true
  })

  // Group nodes by degree
  const nodesByDegree = filteredNodes.reduce(
    (acc, node) => {
      const degree = node.degree
      if (!acc[degree]) {
        acc[degree] = []
      }
      acc[degree].push(node)
      return acc
    },
    {} as Record<number, NodeData[]>,
  )

  const handleNodeClick = (nodeId: string) => {
    if (onNodeSelect) {
      onNodeSelect(nodeId)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="size-5" />
          {t('relationship.navigator.title', 'Relationship Navigator')}
        </CardTitle>
        <CardDescription>
          {t(
            'relationship.navigator.description',
            'Browse and filter connected entities by degree and type',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative">
            <Search
              className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-3 size-4 text-muted-foreground`}
            />
            <Input
              placeholder={t('relationship.navigator.search', 'Search entities...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isRTL ? 'pe-9' : 'ps-9'}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('relationship.navigator.degree', 'Degree')}
              </label>
              <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('relationship.navigator.allDegrees', 'All Degrees')}
                  </SelectItem>
                  {Array.from({ length: maxDegree }, (_, i) => i + 1).map((degree) => (
                    <SelectItem key={degree} value={degree.toString()}>
                      {degree}° {t('relationship.navigator.separation', 'separation')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('relationship.navigator.type', 'Entity Type')}
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('relationship.navigator.allTypes', 'All Types')}
                  </SelectItem>
                  {nodeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`dossier.type.${type}`, type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {t('relationship.navigator.results', {
            count: filteredNodes.length,
            defaultValue: '{{count}} entities found',
          })}
        </div>

        {/* Nodes List */}
        <ScrollArea className="h-[400px]">
          {Object.keys(nodesByDegree)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((degree) => (
              <div key={degree} className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-sm font-semibold">
                    {degree}° {t('relationship.navigator.separation', 'Separation')}
                  </Badge>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-2">
                  {nodesByDegree[parseInt(degree)].map((node) => {
                    const name = isRTL ? node.name_ar : node.name_en

                    return (
                      <Button
                        key={node.id}
                        variant="ghost"
                        className="h-auto w-full justify-start p-3 hover:bg-accent"
                        onClick={() => handleNodeClick(node.id)}
                      >
                        <div className="flex w-full items-center gap-3">
                          <div className="flex-1 text-start">
                            <div className="mb-1 font-medium">{name}</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {t(`dossier.type.${node.type}`, node.type)}
                              </Badge>
                              <Badge
                                variant={node.status === 'active' ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {t(`dossier.status.${node.status}`, node.status)}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight
                            className={`size-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}

          {filteredNodes.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              {t('relationship.navigator.noResults', 'No entities match your filters')}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
