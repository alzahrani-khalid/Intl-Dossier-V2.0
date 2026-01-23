/**
 * Modular Monolith Demo Component
 *
 * Demonstrates the modular monolith architecture with clear module boundaries
 * and inter-module communication through defined interfaces.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, X, Loader2, Activity, FileText, Network, Brain, Zap } from 'lucide-react'

import { getModuleRegistry, getEventBus, generateCorrelationId } from '@/modules/core'
import type {
  IDocumentModule,
  IRelationshipModule,
  IAIModule,
  ModuleHealthStatus,
} from '@/modules/core/contracts'
import type { ModuleRequestContext, ModuleId } from '@/modules/core/types'
import { documentModule } from '@/modules/documents'
import { relationshipModule } from '@/modules/relationships'
import { aiModule } from '@/modules/ai'

// ============================================================================
// Component
// ============================================================================

export function ModularMonolithDemo() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [modulesInitialized, setModulesInitialized] = useState(false)
  const [healthStatus, setHealthStatus] = useState<ModuleHealthStatus[]>([])
  const [events, setEvents] = useState<Array<{ type: string; timestamp: string; source: string }>>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize modules
  useEffect(() => {
    const initModules = async () => {
      try {
        setLoading(true)
        const registry = getModuleRegistry()

        // Check if already registered
        if (!registry.has('documents')) {
          registry.register(documentModule)
        }
        if (!registry.has('relationships')) {
          registry.register(relationshipModule)
        }
        if (!registry.has('ai')) {
          registry.register(aiModule)
        }

        // Initialize if not already done
        const statuses = registry.getAllStatuses()
        const allReady = Array.from(statuses.values()).every((s) => s === 'ready')

        if (!allReady) {
          await registry.initializeAll()
        }

        setModulesInitialized(true)

        // Get health status
        const health = await registry.getHealthStatus()
        setHealthStatus(health)

        // Subscribe to all events for demo
        const eventBus = getEventBus()
        eventBus.subscribeAll((event) => {
          setEvents((prev) => [
            { type: event.type, timestamp: event.timestamp, source: event.source },
            ...prev.slice(0, 9), // Keep last 10 events
          ])
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize modules')
      } finally {
        setLoading(false)
      }
    }

    initModules()
  }, [])

  // Create request context helper
  const createContext = (): ModuleRequestContext => ({
    userId: 'demo-user',
    locale: i18n.language as 'en' | 'ar',
    correlationId: generateCorrelationId(),
    tenantId: 'demo-tenant',
  })

  // Demo: Get documents for an entity
  const handleGetLinkedDocuments = async () => {
    const registry = getModuleRegistry()
    const docs = registry.get<IDocumentModule>('documents')

    const result = await docs.getLinkedDocuments(
      { moduleId: 'engagements' as ModuleId, entityType: 'dossier', entityId: 'demo-entity' },
      createContext(),
    )

    if (result.success) {
      console.log('Linked documents:', result.data)
    } else {
      console.error('Error:', result.error.message)
    }
  }

  // Demo: Get relationships for an entity
  const handleGetRelationships = async () => {
    const registry = getModuleRegistry()
    const rels = registry.get<IRelationshipModule>('relationships')

    const result = await rels.getRelationshipsForEntity(
      { moduleId: 'engagements' as ModuleId, entityType: 'dossier', entityId: 'demo-entity' },
      createContext(),
    )

    if (result.success) {
      console.log('Relationships:', result.data)
    } else {
      console.error('Error:', result.error.message)
    }
  }

  // Demo: Generate AI brief
  const handleGenerateBrief = async () => {
    const registry = getModuleRegistry()
    const ai = registry.get<IAIModule>('ai')

    const result = await ai.generateBrief(
      { moduleId: 'engagements' as ModuleId, entityType: 'dossier', entityId: 'demo-entity' },
      {
        includeDocuments: true,
        includeRelationships: true,
        language: i18n.language as 'en' | 'ar',
      },
      createContext(),
    )

    if (result.success) {
      console.log('Generated brief:', result.data)
    } else {
      console.error('Error:', result.error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="ms-2 text-muted-foreground">
          {isRTL ? 'جاري تهيئة الوحدات...' : 'Initializing modules...'}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive" dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="pt-6">
          <div className="flex items-center text-destructive">
            <X className="me-2 size-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-start text-2xl font-bold sm:text-3xl">
              {isRTL ? 'عرض البنية المعيارية' : 'Modular Monolith Demo'}
            </h1>
            <p className="text-start text-muted-foreground">
              {isRTL
                ? 'يوضح هذا العرض كيفية تواصل الوحدات من خلال واجهات محددة'
                : 'Demonstrates how modules communicate through defined interfaces'}
            </p>
          </div>
          <Badge
            variant={modulesInitialized ? 'default' : 'secondary'}
            className="flex items-center gap-1"
            data-testid="modules-status-badge"
          >
            {modulesInitialized ? (
              <>
                <Check className="size-3" />
                {isRTL ? 'جاهز' : 'Ready'}
              </>
            ) : (
              <>
                <Loader2 className="size-3 animate-spin" />
                {isRTL ? 'جاري التهيئة' : 'Initializing'}
              </>
            )}
          </Badge>
        </div>

        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="size-4" />
              <span className="hidden sm:inline">{isRTL ? 'حالة الصحة' : 'Health'}</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Zap className="size-4" />
              <span className="hidden sm:inline">{isRTL ? 'الوحدات' : 'Modules'}</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Activity className="size-4" />
              <span className="hidden sm:inline">{isRTL ? 'الأحداث' : 'Events'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Health Status Tab */}
          <TabsContent value="health" className="space-y-4">
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="module-health-cards"
            >
              {healthStatus.map((status) => (
                <Card key={status.module} data-testid={`health-card-${status.module}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {getModuleIcon(status.module)}
                        {getModuleDisplayName(status.module, isRTL)}
                      </CardTitle>
                      <Badge
                        variant={
                          status.status === 'healthy'
                            ? 'default'
                            : status.status === 'degraded'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {status.status}
                      </Badge>
                    </div>
                    <CardDescription>v{status.details?.version || '1.0.0'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      {isRTL ? 'آخر فحص: ' : 'Last check: '}
                      {new Date(status.timestamp).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Module Interactions Tab */}
          <TabsContent value="modules" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="size-5" />
                    {isRTL ? 'وحدة المستندات' : 'Documents Module'}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? 'إدارة المستندات والروابط' : 'Document management and linking'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGetLinkedDocuments}
                    className="w-full"
                    variant="outline"
                    data-testid="btn-get-documents"
                  >
                    {isRTL ? 'جلب المستندات المرتبطة' : 'Get Linked Documents'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Network className="size-5" />
                    {isRTL ? 'وحدة العلاقات' : 'Relationships Module'}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? 'شبكة العلاقات والصحة' : 'Relationship network and health'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGetRelationships}
                    className="w-full"
                    variant="outline"
                    data-testid="btn-get-relationships"
                  >
                    {isRTL ? 'جلب العلاقات' : 'Get Relationships'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="size-5" />
                    {isRTL ? 'وحدة الذكاء الاصطناعي' : 'AI Module'}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? 'التحليل والتوصيات الذكية' : 'Smart analysis and recommendations'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateBrief}
                    className="w-full"
                    variant="outline"
                    data-testid="btn-generate-brief"
                  >
                    {isRTL ? 'إنشاء ملخص ذكي' : 'Generate AI Brief'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'سجل الأحداث' : 'Event Log'}</CardTitle>
                <CardDescription>
                  {isRTL ? 'آخر 10 أحداث من ناقل الأحداث' : 'Last 10 events from the event bus'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {isRTL ? 'لا توجد أحداث بعد' : 'No events yet'}
                  </div>
                ) : (
                  <div className="space-y-2" data-testid="event-log">
                    {events.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md bg-muted p-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{event.source}</Badge>
                          <span className="font-medium">{event.type}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Helper functions
function getModuleIcon(moduleId: string) {
  switch (moduleId) {
    case 'documents':
      return <FileText className="size-4" />
    case 'relationships':
      return <Network className="size-4" />
    case 'ai':
      return <Brain className="size-4" />
    default:
      return <Zap className="size-4" />
  }
}

function getModuleDisplayName(moduleId: string, isRTL: boolean) {
  const names: Record<string, { en: string; ar: string }> = {
    documents: { en: 'Documents', ar: 'المستندات' },
    relationships: { en: 'Relationships', ar: 'العلاقات' },
    ai: { en: 'AI', ar: 'الذكاء الاصطناعي' },
  }
  return names[moduleId]?.[isRTL ? 'ar' : 'en'] || moduleId
}

export default ModularMonolithDemo
