/**
 * Route: /admin/field-permissions
 * Field-Level Permissions Administration
 * Feature: granular-field-permissions
 *
 * Manage granular access control for entity fields based on user roles.
 * Includes inherited permissions from entity relationships and field-level audit trails.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import {
  Shield,
  FileText,
  Plus,
  Settings,
  History,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Lock,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User,
  Users,
  Building2,
} from 'lucide-react'
import {
  useFieldPermissions,
  useFieldDefinitions,
  useCreateFieldPermission,
  useUpdateFieldPermission,
  useDeleteFieldPermission,
  useFieldPermissionAudit,
} from '@/hooks/useFieldPermissions'
import type {
  FieldPermission,
  FieldDefinition,
  FieldPermissionEntityType,
  FieldPermissionScope,
  CreateFieldPermissionRequest,
  UpdateFieldPermissionRequest,
  FieldPermissionAudit,
  FieldCategory,
  FieldSensitivityLevel,
} from '@/types/field-permission.types'
import {
  ENTITY_TYPE_CONFIG,
  SCOPE_TYPE_CONFIG,
  FIELD_CATEGORY_CONFIG,
  SENSITIVITY_LEVEL_CONFIG,
} from '@/types/field-permission.types'

export const Route = createFileRoute('/_protected/admin/field-permissions')({
  component: FieldPermissionsPage,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    const role = user?.user_metadata?.role || user?.app_metadata?.role
    const isAdmin = role === 'admin' || role === 'super_admin'
    if (!isAdmin) {
      throw new Error('Admin access required')
    }
  },
})

// User roles
const USER_ROLES = [
  { value: 'super_admin', label_en: 'Super Admin', label_ar: 'المسؤول الفائق' },
  { value: 'admin', label_en: 'Admin', label_ar: 'المسؤول' },
  { value: 'manager', label_en: 'Manager', label_ar: 'المدير' },
  { value: 'analyst', label_en: 'Analyst', label_ar: 'المحلل' },
  { value: 'viewer', label_en: 'Viewer', label_ar: 'المشاهد' },
]

function FieldPermissionsPage() {
  const { t, i18n } = useTranslation('field-permissions')
  const isRTL = i18n.language === 'ar'

  // State
  const [activeTab, setActiveTab] = useState('permissions')
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<FieldPermission | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEntityType, setFilterEntityType] = useState<string>('')
  const [filterScopeType, setFilterScopeType] = useState<string>('')

  // Hooks
  const {
    data: permissions = [],
    isLoading: permissionsLoading,
    refetch: refetchPermissions,
  } = useFieldPermissions({
    entity_type: filterEntityType as FieldPermissionEntityType | undefined,
    scope_type: filterScopeType as FieldPermissionScope | undefined,
  })
  const { data: definitions = [], isLoading: definitionsLoading } = useFieldDefinitions({})
  const { data: auditData, isLoading: auditLoading } = useFieldPermissionAudit({ limit: 50 })
  const auditLogs = auditData?.data || []

  // Mutations
  const createPermission = useCreateFieldPermission()
  const updatePermission = useUpdateFieldPermission()
  const deletePermission = useDeleteFieldPermission()

  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return permissions
    const query = searchQuery.toLowerCase()
    return permissions.filter(
      (p) =>
        p.field_name.toLowerCase().includes(query) ||
        p.scope_value.toLowerCase().includes(query) ||
        p.entity_type.toLowerCase().includes(query) ||
        p.description_en?.toLowerCase().includes(query) ||
        p.description_ar?.toLowerCase().includes(query),
    )
  }, [permissions, searchQuery])

  // Definitions grouped by entity type
  const definitionsByEntity = useMemo(() => {
    const grouped: Record<string, FieldDefinition[]> = {}
    definitions.forEach((def) => {
      if (!grouped[def.entity_type]) {
        grouped[def.entity_type] = []
      }
      grouped[def.entity_type].push(def)
    })
    return grouped
  }, [definitions])

  // Statistics
  const stats = useMemo(() => {
    return {
      totalPermissions: permissions.length,
      activePermissions: permissions.filter((p) => p.is_active).length,
      rolePermissions: permissions.filter((p) => p.scope_type === 'role').length,
      userPermissions: permissions.filter((p) => p.scope_type === 'user').length,
      restrictedFields: permissions.filter((p) => !p.can_view || !p.can_edit).length,
    }
  }, [permissions])

  // Handle save permission
  const handleSavePermission = (data: CreateFieldPermissionRequest) => {
    if (selectedPermission) {
      updatePermission.mutate({
        id: selectedPermission.id,
        request: data as UpdateFieldPermissionRequest,
      })
    } else {
      createPermission.mutate(data)
    }
    setShowPermissionDialog(false)
    setSelectedPermission(null)
  }

  // Handle delete permission
  const handleDeletePermission = (id: string) => {
    if (confirm(t('permissions.delete_confirm'))) {
      deletePermission.mutate(id)
    }
  }

  // Get scope icon
  const getScopeIcon = (scope: FieldPermissionScope) => {
    switch (scope) {
      case 'role':
        return <Users className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      case 'team':
        return <Building2 className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  // Get sensitivity color
  const getSensitivityColor = (level: FieldSensitivityLevel) => {
    const config = SENSITIVITY_LEVEL_CONFIG.find((c) => c.value === level)
    return config?.color || 'text-gray-600'
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetchPermissions()}>
            <RefreshCw className="h-4 w-4 me-2" />
            {t('actions.refresh')}
          </Button>
          <Button onClick={() => setShowPermissionDialog(true)}>
            <Plus className="h-4 w-4 me-2" />
            {t('permissions.create')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPermissions}</p>
                <p className="text-sm text-muted-foreground">{t('tabs.permissions')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activePermissions}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rolePermissions}</p>
                <p className="text-sm text-muted-foreground">{t('scope_types.role')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.userPermissions}</p>
                <p className="text-sm text-muted-foreground">{t('scope_types.user')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.restrictedFields}</p>
                <p className="text-sm text-muted-foreground">Restricted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="permissions" className="gap-2 py-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.permissions')}</span>
          </TabsTrigger>
          <TabsTrigger value="definitions" className="gap-2 py-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.definitions')}</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 py-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.audit')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t('permissions.title')}</CardTitle>
                  <CardDescription>{t('permissions.description')}</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('filters.search', 'Search...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-10 w-full sm:w-64"
                    />
                  </div>

                  {/* Entity Type Filter */}
                  <Select
                    value={filterEntityType || 'all'}
                    onValueChange={(v) => setFilterEntityType(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder={t('filters.entity_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entity Types</SelectItem>
                      {ENTITY_TYPE_CONFIG.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {isRTL ? type.label_ar : type.label_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Scope Filter */}
                  <Select
                    value={filterScopeType || 'all'}
                    onValueChange={(v) => setFilterScopeType(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder={t('filters.scope_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scopes</SelectItem>
                      {SCOPE_TYPE_CONFIG.map((scope) => (
                        <SelectItem key={scope.value} value={scope.value}>
                          {isRTL ? scope.label_ar : scope.label_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredPermissions.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('permissions.empty')}</p>
                  <p className="text-muted-foreground mb-4">{t('permissions.empty_description')}</p>
                  <Button onClick={() => setShowPermissionDialog(true)}>
                    <Plus className="h-4 w-4 me-2" />
                    {t('permissions.create')}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('permissions.fields.scope_type')}</TableHead>
                      <TableHead>{t('permissions.fields.scope_value')}</TableHead>
                      <TableHead>{t('permissions.fields.entity_type')}</TableHead>
                      <TableHead>{t('permissions.fields.field_name')}</TableHead>
                      <TableHead className="text-center">
                        {t('permissions.fields.can_view')}
                      </TableHead>
                      <TableHead className="text-center">
                        {t('permissions.fields.can_edit')}
                      </TableHead>
                      <TableHead>{t('permissions.fields.is_active')}</TableHead>
                      <TableHead className="text-end">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getScopeIcon(permission.scope_type)}
                            <span className="capitalize">
                              {t(`scope_types.${permission.scope_type}`)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.scope_value}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {t(`entity_types.${permission.entity_type}`)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {permission.field_name}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.can_view ? (
                            <Eye className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-red-600 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.can_edit ? (
                            <Edit3 className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-600 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={permission.is_active ? 'default' : 'secondary'}>
                            {permission.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPermission(permission)
                                setShowPermissionDialog(true)
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePermission(permission.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Definitions Tab */}
        <TabsContent value="definitions">
          <Card>
            <CardHeader>
              <CardTitle>{t('definitions.title')}</CardTitle>
              <CardDescription>{t('definitions.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {definitionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : Object.keys(definitionsByEntity).length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('definitions.empty')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(definitionsByEntity).map(([entityType, fields]) => (
                    <div key={entityType} className="space-y-4">
                      <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t(`entity_types.${entityType}`)}
                        <Badge variant="secondary">{fields.length} fields</Badge>
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('definitions.fields.field_name')}</TableHead>
                            <TableHead>{t('definitions.fields.field_label_en')}</TableHead>
                            <TableHead>{t('definitions.fields.field_category')}</TableHead>
                            <TableHead>{t('definitions.fields.data_type')}</TableHead>
                            <TableHead>{t('definitions.fields.sensitivity_level')}</TableHead>
                            <TableHead>{t('definitions.fields.default_visible')}</TableHead>
                            <TableHead>{t('definitions.fields.default_editable')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {field.field_name}
                                </code>
                              </TableCell>
                              <TableCell>
                                {isRTL ? field.field_label_ar : field.field_label_en}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {t(`definitions.categories.${field.field_category}`)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground">
                                  {t(`definitions.data_types.${field.data_type}`)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={getSensitivityColor(field.sensitivity_level)}>
                                  {t(`definitions.sensitivity.${field.sensitivity_level}`)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {field.default_visible ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-red-600" />
                                )}
                              </TableCell>
                              <TableCell>
                                {field.default_editable ? (
                                  <Edit3 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Lock className="h-4 w-4 text-red-600" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t('audit.title')}
              </CardTitle>
              <CardDescription>{t('audit.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('audit.empty')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('audit.fields.action')}</TableHead>
                      <TableHead>{t('audit.fields.performed_by')}</TableHead>
                      <TableHead>{t('audit.fields.created_at')}</TableHead>
                      <TableHead>{t('audit.fields.old_values')}</TableHead>
                      <TableHead>{t('audit.fields.new_values')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge
                            variant={
                              log.action === 'create'
                                ? 'default'
                                : log.action === 'delete'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {t(`audit.actions.${log.action}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.performed_by_email || 'System'}</TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                        </TableCell>
                        <TableCell>
                          {log.old_values ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded block max-w-xs truncate">
                              {JSON.stringify(log.old_values).slice(0, 50)}...
                            </code>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {log.new_values ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded block max-w-xs truncate">
                              {JSON.stringify(log.new_values).slice(0, 50)}...
                            </code>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Permission Dialog */}
      <PermissionDialog
        open={showPermissionDialog}
        onOpenChange={(open) => {
          setShowPermissionDialog(open)
          if (!open) setSelectedPermission(null)
        }}
        permission={selectedPermission}
        definitions={definitions}
        onSave={handleSavePermission}
        isLoading={createPermission.isPending || updatePermission.isPending}
      />
    </div>
  )
}

// Permission Dialog Component
function PermissionDialog({
  open,
  onOpenChange,
  permission,
  definitions,
  onSave,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  permission: FieldPermission | null
  definitions: FieldDefinition[]
  onSave: (data: CreateFieldPermissionRequest) => void
  isLoading: boolean
}) {
  const { t, i18n } = useTranslation('field-permissions')
  const isRTL = i18n.language === 'ar'

  const [formData, setFormData] = useState<Partial<CreateFieldPermissionRequest>>({
    scope_type: 'role',
    can_view: true,
    can_edit: true,
    priority: 0,
  })

  // Reset form when permission changes
  useState(() => {
    if (permission) {
      setFormData({
        scope_type: permission.scope_type,
        scope_value: permission.scope_value,
        entity_type: permission.entity_type,
        entity_id: permission.entity_id || undefined,
        field_name: permission.field_name,
        can_view: permission.can_view,
        can_edit: permission.can_edit,
        priority: permission.priority,
        description_en: permission.description_en || undefined,
        description_ar: permission.description_ar || undefined,
      })
    } else {
      setFormData({
        scope_type: 'role',
        can_view: true,
        can_edit: true,
        priority: 0,
      })
    }
  })

  // Get fields for selected entity type
  const availableFields = definitions.filter((d) => d.entity_type === formData.entity_type)

  const handleSubmit = () => {
    if (
      !formData.scope_type ||
      !formData.scope_value ||
      !formData.entity_type ||
      !formData.field_name
    ) {
      return
    }
    onSave(formData as CreateFieldPermissionRequest)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{permission ? t('permissions.edit') : t('permissions.create')}</DialogTitle>
          <DialogDescription>{t('permissions.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Scope Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('permissions.fields.scope_type')}</Label>
              <Select
                value={formData.scope_type}
                onValueChange={(v) =>
                  setFormData({ ...formData, scope_type: v as FieldPermissionScope })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_TYPE_CONFIG.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      {isRTL ? scope.label_ar : scope.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t(`scope_descriptions.${formData.scope_type}`)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('permissions.fields.scope_value')}</Label>
              {formData.scope_type === 'role' ? (
                <Select
                  value={formData.scope_value}
                  onValueChange={(v) => setFormData({ ...formData, scope_value: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('permissions.placeholders.scope_value')} />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {isRTL ? role.label_ar : role.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder={t('permissions.placeholders.scope_value')}
                  value={formData.scope_value || ''}
                  onChange={(e) => setFormData({ ...formData, scope_value: e.target.value })}
                />
              )}
            </div>
          </div>

          <Separator />

          {/* Entity and Field Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('permissions.fields.entity_type')}</Label>
              <Select
                value={formData.entity_type}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    entity_type: v as FieldPermissionEntityType,
                    field_name: undefined, // Reset field when entity changes
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPE_CONFIG.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {isRTL ? type.label_ar : type.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('permissions.fields.field_name')}</Label>
              <Select
                value={formData.field_name}
                onValueChange={(v) => setFormData({ ...formData, field_name: v })}
                disabled={!formData.entity_type}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('permissions.placeholders.field_name')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="*">{t('permissions.help.all_fields')}</SelectItem>
                  {availableFields.map((field) => (
                    <SelectItem key={field.field_name} value={field.field_name}>
                      {field.field_name} ({isRTL ? field.field_label_ar : field.field_label_en})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Permissions Section */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="can-view"
                checked={formData.can_view}
                onCheckedChange={(checked) => setFormData({ ...formData, can_view: checked })}
              />
              <Label htmlFor="can-view" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {t('permissions.fields.can_view')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="can-edit"
                checked={formData.can_edit}
                onCheckedChange={(checked) => setFormData({ ...formData, can_edit: checked })}
              />
              <Label htmlFor="can-edit" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                {t('permissions.fields.can_edit')}
              </Label>
            </div>
            <div className="space-y-2">
              <Label>{t('permissions.fields.priority')}</Label>
              <Input
                type="number"
                value={formData.priority || 0}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <Separator />

          {/* Description Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('permissions.fields.description_en')}</Label>
              <Textarea
                placeholder="Enter description in English"
                value={formData.description_en || ''}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('permissions.fields.description_ar')}</Label>
              <Textarea
                placeholder="أدخل الوصف بالعربية"
                value={formData.description_ar || ''}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                dir="rtl"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                Saving...
              </>
            ) : (
              t('actions.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FieldPermissionsPage
