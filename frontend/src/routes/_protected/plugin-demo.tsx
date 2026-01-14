/**
 * Plugin System Demo Page
 *
 * Demonstrates the extensible plugin system for adding new entity types.
 */

import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FolderKanban, CheckCircle, XCircle, AlertCircle, Settings, RefreshCw } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Plugin system imports
import { pluginRegistry } from '@/lib/plugin-system/registry/plugin-registry'
import { projectPlugin } from '@/lib/plugin-system/plugins/project-plugin'
import type { EntityPlugin, ExtensionFieldDefinition } from '@/lib/plugin-system/types/plugin.types'

// Route definition
export const Route = createFileRoute('/_protected/plugin-demo')({
  component: PluginDemoPage,
})

// ============================================================================
// Component
// ============================================================================

function PluginDemoPage() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [isInitialized, setIsInitialized] = useState(false)
  const [plugins, setPlugins] = useState<EntityPlugin[]>([])
  const [entityTypes, setEntityTypes] = useState<string[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<EntityPlugin | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize plugin system
  useEffect(() => {
    initializePlugins()
  }, [])

  const initializePlugins = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Initialize registry if not already
      if (!pluginRegistry.isInitialized()) {
        await pluginRegistry.initialize()
      }

      // Register example plugin if not already registered
      if (!pluginRegistry.isRegistered('project')) {
        await pluginRegistry.register(projectPlugin)
      }

      // Update state
      setPlugins(pluginRegistry.getAllPlugins())
      setEntityTypes(pluginRegistry.getEntityTypes())
      setIsInitialized(true)

      // Select first plugin
      const allPlugins = pluginRegistry.getAllPlugins()
      if (allPlugins.length > 0) {
        setSelectedPlugin(allPlugins[0] || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize plugins')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    initializePlugins()
  }

  const togglePlugin = async (pluginId: string) => {
    try {
      if (pluginRegistry.isEnabled(pluginId)) {
        await pluginRegistry.disable(pluginId)
      } else {
        await pluginRegistry.enable(pluginId)
      }
      setPlugins(pluginRegistry.getAllPlugins())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle plugin')
    }
  }

  // Expose toggle function for future use
  void togglePlugin

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-start">
            {isRTL ? 'عرض نظام الإضافات' : 'Plugin System Demo'}
          </h1>
          <p className="text-muted-foreground text-start mt-1">
            {isRTL
              ? 'نظام إضافات قابل للتوسيع لإضافة أنواع كيانات جديدة بدون تعديل الكود الأساسي'
              : 'Extensible plugin architecture for adding new entity types without modifying core code'}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} className="min-h-11 min-w-11">
          <RefreshCw
            className={`h-4 w-4 ${isRTL ? 'ms-0 me-2' : 'me-2'} ${isLoading ? 'animate-spin' : ''}`}
          />
          {isRTL ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{isRTL ? 'خطأ' : 'Error'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isRTL ? 'حالة النظام' : 'System Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isInitialized ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-lg font-semibold">
                {isInitialized
                  ? isRTL
                    ? 'مُهيأ'
                    : 'Initialized'
                  : isRTL
                    ? 'غير مُهيأ'
                    : 'Not Initialized'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isRTL ? 'الإضافات المسجلة' : 'Registered Plugins'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{plugins.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isRTL ? 'أنواع الكيانات' : 'Entity Types'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{entityTypes.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isRTL ? 'الإضافات النشطة' : 'Active Plugins'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {plugins.filter((p) => pluginRegistry.isEnabled(p.manifest.id)).length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plugin List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {isRTL ? 'الإضافات المسجلة' : 'Registered Plugins'}
            </CardTitle>
            <CardDescription>
              {isRTL ? 'انقر على إضافة لعرض التفاصيل' : 'Click a plugin to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {plugins.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {isRTL ? 'لا توجد إضافات مسجلة' : 'No plugins registered'}
              </p>
            ) : (
              plugins.map((plugin) => (
                <div
                  key={plugin.manifest.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPlugin?.manifest.id === plugin.manifest.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedPlugin(plugin)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderKanban className={`h-5 w-5 text-${plugin.manifest.color}-500`} />
                      <span className="font-medium">
                        {isRTL ? plugin.manifest.name.ar : plugin.manifest.name.en}
                      </span>
                    </div>
                    <Badge
                      variant={
                        pluginRegistry.isEnabled(plugin.manifest.id) ? 'default' : 'secondary'
                      }
                    >
                      {pluginRegistry.isEnabled(plugin.manifest.id)
                        ? isRTL
                          ? 'نشط'
                          : 'Active'
                        : isRTL
                          ? 'معطل'
                          : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 text-start">
                    {isRTL ? plugin.manifest.description.ar : plugin.manifest.description.en}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Plugin Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedPlugin
                ? isRTL
                  ? selectedPlugin.manifest.name.ar
                  : selectedPlugin.manifest.name.en
                : isRTL
                  ? 'تفاصيل الإضافة'
                  : 'Plugin Details'}
            </CardTitle>
            {selectedPlugin && (
              <CardDescription>
                {isRTL ? 'الإصدار' : 'Version'}: {selectedPlugin.manifest.version} |{' '}
                {isRTL ? 'نوع الكيان' : 'Entity Type'}: {selectedPlugin.manifest.entityType}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!selectedPlugin ? (
              <p className="text-muted-foreground text-center py-8">
                {isRTL ? 'اختر إضافة لعرض التفاصيل' : 'Select a plugin to view details'}
              </p>
            ) : (
              <Tabs defaultValue="fields" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="fields">{isRTL ? 'الحقول' : 'Fields'}</TabsTrigger>
                  <TabsTrigger value="relationships">
                    {isRTL ? 'العلاقات' : 'Relationships'}
                  </TabsTrigger>
                  <TabsTrigger value="validation">{isRTL ? 'التحقق' : 'Validation'}</TabsTrigger>
                  <TabsTrigger value="permissions">
                    {isRTL ? 'الصلاحيات' : 'Permissions'}
                  </TabsTrigger>
                </TabsList>

                {/* Fields Tab */}
                <TabsContent value="fields" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>
                        <TableHead>{isRTL ? 'التسمية' : 'Label'}</TableHead>
                        <TableHead>{isRTL ? 'النوع' : 'Type'}</TableHead>
                        <TableHead>{isRTL ? 'مطلوب' : 'Required'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPlugin.manifest.extensionSchema.fields.map(
                        (field: ExtensionFieldDefinition) => (
                          <TableRow key={field.name}>
                            <TableCell className="font-mono text-sm">{field.name}</TableCell>
                            <TableCell>{isRTL ? field.label.ar : field.label.en}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{field.type}</Badge>
                            </TableCell>
                            <TableCell>
                              {field.required ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* Relationships Tab */}
                <TabsContent value="relationships" className="mt-4">
                  {selectedPlugin.relationships?.definitions?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isRTL ? 'النوع' : 'Type'}</TableHead>
                          <TableHead>{isRTL ? 'التسمية' : 'Label'}</TableHead>
                          <TableHead>{isRTL ? 'الأهداف' : 'Targets'}</TableHead>
                          <TableHead>{isRTL ? 'الكاردينالية' : 'Cardinality'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPlugin.relationships.definitions.map((rel) => (
                          <TableRow key={rel.type}>
                            <TableCell className="font-mono text-sm">{rel.type}</TableCell>
                            <TableCell>{isRTL ? rel.label.ar : rel.label.en}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rel.targetEntityTypes.map((t) => (
                                  <Badge key={t} variant="outline" className="text-xs">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{rel.cardinality}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      {isRTL ? 'لا توجد علاقات محددة' : 'No relationships defined'}
                    </p>
                  )}
                </TabsContent>

                {/* Validation Tab */}
                <TabsContent value="validation" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">
                        {isRTL ? 'قبل الإنشاء' : 'Before Create'}
                      </h4>
                      {selectedPlugin.validation?.beforeCreate ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">
                        {isRTL ? 'قبل التحديث' : 'Before Update'}
                      </h4>
                      {selectedPlugin.validation?.beforeUpdate ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">{isRTL ? 'قبل الحذف' : 'Before Delete'}</h4>
                      {selectedPlugin.validation?.beforeDelete ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {selectedPlugin.validation?.fieldValidators && (
                    <div>
                      <h4 className="font-medium mb-2">
                        {isRTL ? 'مدققات الحقول' : 'Field Validators'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(selectedPlugin.validation.fieldValidators).map((field) => (
                          <Badge key={field} variant="outline">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">
                        {isRTL ? 'الحد الأدنى للعرض' : 'Min View Clearance'}
                      </h4>
                      <span className="text-2xl font-bold">
                        {selectedPlugin.permissions?.minViewClearance ?? '-'}
                      </span>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">
                        {isRTL ? 'الحد الأدنى للتعديل' : 'Min Edit Clearance'}
                      </h4>
                      <span className="text-2xl font-bold">
                        {selectedPlugin.permissions?.minEditClearance ?? '-'}
                      </span>
                    </div>
                  </div>

                  {selectedPlugin.permissions?.additionalActions && (
                    <div>
                      <h4 className="font-medium mb-2">
                        {isRTL ? 'إجراءات إضافية' : 'Additional Actions'}
                      </h4>
                      <div className="space-y-2">
                        {selectedPlugin.permissions.additionalActions.map((action) => (
                          <div key={action.action} className="p-3 rounded-lg border">
                            <div className="font-medium">
                              {isRTL ? action.label.ar : action.label.en}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? action.description.ar : action.description.en}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Architecture Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'نظرة عامة على البنية' : 'Architecture Overview'}</CardTitle>
          <CardDescription>
            {isRTL
              ? 'كيف يعمل نظام الإضافات القابل للتوسيع'
              : 'How the extensible plugin system works'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <h4 className="font-semibold mb-2">
                1. {isRTL ? 'تعريف الإضافة' : 'Plugin Definition'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'تعريف نوع كيان جديد مع الحقول والعلاقات والتحقق والصلاحيات'
                  : 'Define new entity type with fields, relationships, validation, and permissions'}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <h4 className="font-semibold mb-2">2. {isRTL ? 'التسجيل' : 'Registration'}</h4>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'تسجيل الإضافة في السجل المركزي للنظام'
                  : 'Register plugin with the central registry'}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <h4 className="font-semibold mb-2">3. {isRTL ? 'الخطافات' : 'Hooks'}</h4>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'استخدام React hooks للتحقق والصلاحيات وعرض واجهة المستخدم'
                  : 'Use React hooks for validation, permissions, and UI rendering'}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <h4 className="font-semibold mb-2">4. {isRTL ? 'التكامل' : 'Integration'}</h4>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'يتكامل بسلاسة مع النظام الحالي دون تعديل الكود الأساسي'
                  : 'Seamlessly integrates with existing system without core code changes'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
