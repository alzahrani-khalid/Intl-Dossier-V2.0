/**
 * WorkingGroupsPage - Full CRUD management for working groups
 *
 * Feature: working-groups-entity-management
 *
 * Mobile-first, RTL-compatible page for managing committees,
 * task forces, and collaborative working groups.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Users,
  Target,
  Calendar,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Archive,
  Eye,
  Building2,
  Clock,
  ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
  useWorkingGroups,
  useWorkingGroupStats,
  useCreateWorkingGroup,
  useUpdateWorkingGroup,
  useDeleteWorkingGroup,
} from '@/hooks/useWorkingGroups'
import type {
  WorkingGroup,
  WorkingGroupFilters,
  WorkingGroupCreateRequest,
  WorkingGroupUpdateRequest,
  WorkingGroupType,
  WorkingGroupStatus,
  MeetingFrequency,
} from '@/types/working-group.types'
import { WORKING_GROUP_TYPE_LABELS, MEETING_FREQUENCY_LABELS } from '@/types/working-group.types'

const WORKING_GROUP_TYPES: WorkingGroupType[] = [
  'committee',
  'task_force',
  'advisory_board',
  'technical_group',
  'steering_committee',
]

const WORKING_GROUP_STATUSES: WorkingGroupStatus[] = ['active', 'suspended', 'disbanded']

const MEETING_FREQUENCIES: MeetingFrequency[] = [
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'biannually',
  'annually',
  'as_needed',
]

export default function WorkingGroupsPage() {
  const { t, i18n } = useTranslation('working-groups')
  const isRTL = i18n.language === 'ar'

  // State
  const [filters, setFilters] = useState<WorkingGroupFilters>({
    page: 1,
    limit: 20,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [selectedWorkingGroup, setSelectedWorkingGroup] = useState<WorkingGroup | null>(null)
  const [formData, setFormData] = useState<WorkingGroupCreateRequest>({
    name_en: '',
    name_ar: '',
    wg_type: 'committee',
  })

  // Queries
  const { data, isLoading, isError, error } = useWorkingGroups({
    ...filters,
    search: searchTerm || undefined,
  })
  const { data: stats } = useWorkingGroupStats()

  // Mutations
  const createMutation = useCreateWorkingGroup()
  const updateMutation = useUpdateWorkingGroup()
  const deleteMutation = useDeleteWorkingGroup()

  // Handlers
  const handleCreateWorkingGroup = async () => {
    if (!formData.name_en.trim()) return

    await createMutation.mutateAsync(formData)
    setCreateDialogOpen(false)
    resetFormData()
  }

  const handleUpdateWorkingGroup = async () => {
    if (!selectedWorkingGroup || !formData.name_en.trim()) return

    await updateMutation.mutateAsync({
      id: selectedWorkingGroup.id,
      data: formData as WorkingGroupUpdateRequest,
    })
    setEditDialogOpen(false)
    setSelectedWorkingGroup(null)
    resetFormData()
  }

  const handleArchiveWorkingGroup = async () => {
    if (!selectedWorkingGroup) return

    await deleteMutation.mutateAsync(selectedWorkingGroup.id)
    setArchiveDialogOpen(false)
    setSelectedWorkingGroup(null)
  }

  const openEditDialog = (wg: WorkingGroup) => {
    setSelectedWorkingGroup(wg)
    setFormData({
      name_en: wg.name_en,
      name_ar: wg.name_ar,
      summary_en: wg.summary_en,
      summary_ar: wg.summary_ar,
      wg_type: wg.wg_type,
      wg_status: wg.wg_status,
      mandate_en: wg.mandate_en,
      mandate_ar: wg.mandate_ar,
      description_en: wg.description_en,
      description_ar: wg.description_ar,
      meeting_frequency: wg.meeting_frequency,
      established_date: wg.established_date,
    })
    setEditDialogOpen(true)
  }

  const openArchiveDialog = (wg: WorkingGroup) => {
    setSelectedWorkingGroup(wg)
    setArchiveDialogOpen(true)
  }

  const resetFormData = () => {
    setFormData({
      name_en: '',
      name_ar: '',
      wg_type: 'committee',
    })
  }

  const handleFilterChange = (key: keyof WorkingGroupFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1, // Reset page on filter change
    }))
  }

  // Computed values
  const workingGroups = data?.data || []
  const pagination = data?.pagination

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'disbanded':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="size-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">{t('errors.loadFailed')}</h2>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button
            className="w-full sm:w-auto min-h-11 gap-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="size-4" />
            {t('actions.add')}
          </Button>
        </div>
      </header>

      {/* Metrics Cards */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.activeGroups')}</CardTitle>
            <Target className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.active || 0}</p>
            <p className="text-xs text-muted-foreground">
              {t('metrics.totalGroups')}: {stats?.total || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.totalMembers')}</CardTitle>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalMembers || 0}</p>
            <p className="text-xs text-muted-foreground">{t('metrics.totalMembersHint')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.totalDeliverables')}</CardTitle>
            <CheckCircle2 className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalDeliverables || 0}</p>
            <p className="text-xs text-muted-foreground">
              {t('metrics.completedDeliverables')}: {stats?.completedDeliverables || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.upcomingMeetings')}</CardTitle>
            <Calendar className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalMeetings || 0}</p>
          </CardContent>
        </Card>
      </section>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10 min-h-11"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="size-4" />
                <span>{t('filters.title')}:</span>
              </div>

              {/* Status Filter */}
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full sm:w-40 min-h-11">
                  <SelectValue placeholder={t('filters.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                  <SelectItem value="archived">{t('status.archived')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select
                value={filters.wg_type || 'all'}
                onValueChange={(value) => handleFilterChange('wg_type', value)}
              >
                <SelectTrigger className="w-full sm:w-44 min-h-11">
                  <SelectValue placeholder={t('filters.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
                  {WORKING_GROUP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Groups Grid */}
      {workingGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t('empty.title')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('empty.description')}</p>
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="size-4 me-2" />
                {t('actions.add')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workingGroups.map((wg, index) => (
            <motion.div
              key={wg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      <h3 className="font-semibold text-base truncate">
                        {isRTL ? wg.name_ar : wg.name_en}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {isRTL ? wg.name_en : wg.name_ar}
                      </p>

                      {/* Type Badge */}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {t(`types.${wg.wg_type}`)}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(wg.wg_status)}`}>
                          {t(`status.${wg.wg_status}`)}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5" />
                          {wg.active_member_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" />
                          {wg.total_deliverables || 0}
                        </span>
                        {wg.lead_org_name_en && (
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="size-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {isRTL ? wg.lead_org_name_ar : wg.lead_org_name_en}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Next meeting / Updated */}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {new Date(wg.updated_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => openEditDialog(wg)}>
                          <Edit className="size-4 me-2" />
                          {t('actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openArchiveDialog(wg)}>
                          <Archive className="size-4 me-2" />
                          {t('actions.archive')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, (p.page || 1) - 1) }))}
            disabled={filters.page === 1}
            className="min-h-10"
          >
            <ChevronRight className={`size-4 ${isRTL ? '' : 'rotate-180'}`} />
          </Button>
          <span className="text-sm px-4">
            {filters.page || 1} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                page: Math.min(pagination.totalPages, (p.page || 1) + 1),
              }))
            }
            disabled={filters.page === pagination.totalPages}
            className="min-h-10"
          >
            <ChevronRight className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('createDialog.title')}</DialogTitle>
            <DialogDescription>{t('createDialog.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name EN */}
            <div className="space-y-2">
              <Label htmlFor="name_en">{t('form.nameEn')} *</Label>
              <Input
                id="name_en"
                placeholder={t('form.nameEnPlaceholder')}
                value={formData.name_en}
                onChange={(e) => setFormData((p) => ({ ...p, name_en: e.target.value }))}
              />
            </div>

            {/* Name AR */}
            <div className="space-y-2">
              <Label htmlFor="name_ar">{t('form.nameAr')}</Label>
              <Input
                id="name_ar"
                placeholder={t('form.nameArPlaceholder')}
                value={formData.name_ar || ''}
                onChange={(e) => setFormData((p) => ({ ...p, name_ar: e.target.value }))}
                dir="rtl"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>{t('form.type')} *</Label>
              <Select
                value={formData.wg_type}
                onValueChange={(value: WorkingGroupType) =>
                  setFormData((p) => ({ ...p, wg_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {WORKING_GROUP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Meeting Frequency */}
            <div className="space-y-2">
              <Label>{t('form.meetingFrequency')}</Label>
              <Select
                value={formData.meeting_frequency || ''}
                onValueChange={(value: MeetingFrequency) =>
                  setFormData((p) => ({ ...p, meeting_frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.meetingFrequencyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {t(`meetingFrequency.${freq}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary EN */}
            <div className="space-y-2">
              <Label htmlFor="summary_en">{t('form.summaryEn')}</Label>
              <Textarea
                id="summary_en"
                value={formData.summary_en || ''}
                onChange={(e) => setFormData((p) => ({ ...p, summary_en: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Mandate EN */}
            <div className="space-y-2">
              <Label htmlFor="mandate_en">{t('form.mandateEn')}</Label>
              <Textarea
                id="mandate_en"
                placeholder={t('form.mandateEnPlaceholder')}
                value={formData.mandate_en || ''}
                onChange={(e) => setFormData((p) => ({ ...p, mandate_en: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Established Date */}
            <div className="space-y-2">
              <Label htmlFor="established_date">{t('form.establishedDate')}</Label>
              <Input
                id="established_date"
                type="date"
                value={formData.established_date || ''}
                onChange={(e) => setFormData((p) => ({ ...p, established_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                resetFormData()
              }}
            >
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleCreateWorkingGroup}
              disabled={!formData.name_en.trim() || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="size-4 me-2 animate-spin" />}
              {t('form.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editDialog.title')}</DialogTitle>
            <DialogDescription>{t('editDialog.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name EN */}
            <div className="space-y-2">
              <Label htmlFor="edit_name_en">{t('form.nameEn')} *</Label>
              <Input
                id="edit_name_en"
                value={formData.name_en}
                onChange={(e) => setFormData((p) => ({ ...p, name_en: e.target.value }))}
              />
            </div>

            {/* Name AR */}
            <div className="space-y-2">
              <Label htmlFor="edit_name_ar">{t('form.nameAr')}</Label>
              <Input
                id="edit_name_ar"
                value={formData.name_ar || ''}
                onChange={(e) => setFormData((p) => ({ ...p, name_ar: e.target.value }))}
                dir="rtl"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>{t('form.type')} *</Label>
              <Select
                value={formData.wg_type}
                onValueChange={(value: WorkingGroupType) =>
                  setFormData((p) => ({ ...p, wg_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKING_GROUP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>{t('form.status')}</Label>
              <Select
                value={formData.wg_status || 'active'}
                onValueChange={(value: WorkingGroupStatus) =>
                  setFormData((p) => ({ ...p, wg_status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKING_GROUP_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Meeting Frequency */}
            <div className="space-y-2">
              <Label>{t('form.meetingFrequency')}</Label>
              <Select
                value={formData.meeting_frequency || ''}
                onValueChange={(value: MeetingFrequency) =>
                  setFormData((p) => ({ ...p, meeting_frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.meetingFrequencyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {t(`meetingFrequency.${freq}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="edit_summary_en">{t('form.summaryEn')}</Label>
              <Textarea
                id="edit_summary_en"
                value={formData.summary_en || ''}
                onChange={(e) => setFormData((p) => ({ ...p, summary_en: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Mandate */}
            <div className="space-y-2">
              <Label htmlFor="edit_mandate_en">{t('form.mandateEn')}</Label>
              <Textarea
                id="edit_mandate_en"
                value={formData.mandate_en || ''}
                onChange={(e) => setFormData((p) => ({ ...p, mandate_en: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setSelectedWorkingGroup(null)
                resetFormData()
              }}
            >
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleUpdateWorkingGroup}
              disabled={!formData.name_en.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="size-4 me-2 animate-spin" />}
              {t('form.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmations.archive')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmations.archiveDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveWorkingGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="size-4 me-2 animate-spin" />}
              {t('actions.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
