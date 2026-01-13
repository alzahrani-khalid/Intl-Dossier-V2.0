/**
 * Activity Feed Filters Component
 *
 * Provides comprehensive filtering options for the activity feed:
 * - Entity type filter (multi-select)
 * - Action type filter (multi-select)
 * - Date range filter (presets + custom)
 * - User filter (actor)
 * - Search
 * - Followed entities only toggle
 *
 * Mobile-first and RTL-ready
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  X,
  ChevronDown,
  Filter,
  Calendar,
  User,
  Globe,
  Building2,
  UserRound,
  Handshake,
  Users,
  Briefcase,
  Palette,
  FileText,
  CalendarDays,
  Phone,
  CheckSquare,
  BookOpen,
  Target,
  Package,
  MapPin,
  Link,
  Brain,
  Ticket,
  Plus,
  Edit3,
  Trash2,
  MessageSquare,
  GitBranch,
  Upload,
  Download,
  Eye,
  Share2,
  UserPlus,
  AtSign,
  CheckCircle,
  XCircle,
  Archive,
  RotateCcw,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type {
  ActivityFilters,
  ActivityEntityType,
  ActivityActionType,
  DateRangePreset,
  ActivityFiltersProps,
} from '@/types/activity-feed.types'

// =============================================
// CONFIGURATION
// =============================================

const ENTITY_TYPE_CONFIG: Record<
  ActivityEntityType,
  { icon: typeof Globe; label_en: string; label_ar: string; color: string }
> = {
  country: { icon: Globe, label_en: 'Country', label_ar: 'دولة', color: 'text-blue-600' },
  organization: {
    icon: Building2,
    label_en: 'Organization',
    label_ar: 'منظمة',
    color: 'text-purple-600',
  },
  person: { icon: UserRound, label_en: 'Person', label_ar: 'شخص', color: 'text-green-600' },
  engagement: {
    icon: Handshake,
    label_en: 'Engagement',
    label_ar: 'ارتباط',
    color: 'text-orange-600',
  },
  forum: { icon: Users, label_en: 'Forum', label_ar: 'منتدى', color: 'text-cyan-600' },
  working_group: {
    icon: Briefcase,
    label_en: 'Working Group',
    label_ar: 'مجموعة عمل',
    color: 'text-indigo-600',
  },
  theme: { icon: Palette, label_en: 'Theme', label_ar: 'موضوع', color: 'text-pink-600' },
  mou: { icon: FileText, label_en: 'MoU', label_ar: 'مذكرة تفاهم', color: 'text-amber-600' },
  document: { icon: FileText, label_en: 'Document', label_ar: 'وثيقة', color: 'text-gray-600' },
  event: { icon: CalendarDays, label_en: 'Event', label_ar: 'حدث', color: 'text-red-600' },
  contact: { icon: Phone, label_en: 'Contact', label_ar: 'جهة اتصال', color: 'text-teal-600' },
  task: { icon: CheckSquare, label_en: 'Task', label_ar: 'مهمة', color: 'text-yellow-600' },
  brief: { icon: BookOpen, label_en: 'Brief', label_ar: 'موجز', color: 'text-violet-600' },
  commitment: { icon: Target, label_en: 'Commitment', label_ar: 'التزام', color: 'text-rose-600' },
  deliverable: {
    icon: Package,
    label_en: 'Deliverable',
    label_ar: 'مخرج',
    color: 'text-emerald-600',
  },
  position: { icon: MapPin, label_en: 'Position', label_ar: 'موقف', color: 'text-sky-600' },
  relationship: {
    icon: Link,
    label_en: 'Relationship',
    label_ar: 'علاقة',
    color: 'text-fuchsia-600',
  },
  intelligence: {
    icon: Brain,
    label_en: 'Intelligence',
    label_ar: 'استخبارات',
    color: 'text-slate-600',
  },
  intake_ticket: {
    icon: Ticket,
    label_en: 'Intake Ticket',
    label_ar: 'تذكرة',
    color: 'text-lime-600',
  },
}

const ACTION_TYPE_CONFIG: Record<
  ActivityActionType,
  { icon: typeof Plus; label_en: string; label_ar: string; color: string; bgColor: string }
> = {
  create: {
    icon: Plus,
    label_en: 'Create',
    label_ar: 'إنشاء',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  update: {
    icon: Edit3,
    label_en: 'Update',
    label_ar: 'تحديث',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  delete: {
    icon: Trash2,
    label_en: 'Delete',
    label_ar: 'حذف',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  comment: {
    icon: MessageSquare,
    label_en: 'Comment',
    label_ar: 'تعليق',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  status_change: {
    icon: GitBranch,
    label_en: 'Status Change',
    label_ar: 'تغيير الحالة',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  upload: {
    icon: Upload,
    label_en: 'Upload',
    label_ar: 'رفع',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  download: {
    icon: Download,
    label_en: 'Download',
    label_ar: 'تحميل',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  view: {
    icon: Eye,
    label_en: 'View',
    label_ar: 'عرض',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  share: {
    icon: Share2,
    label_en: 'Share',
    label_ar: 'مشاركة',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  assign: {
    icon: UserPlus,
    label_en: 'Assign',
    label_ar: 'تعيين',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  mention: {
    icon: AtSign,
    label_en: 'Mention',
    label_ar: 'إشارة',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  approval: {
    icon: CheckCircle,
    label_en: 'Approval',
    label_ar: 'موافقة',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  rejection: {
    icon: XCircle,
    label_en: 'Rejection',
    label_ar: 'رفض',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
  archive: {
    icon: Archive,
    label_en: 'Archive',
    label_ar: 'أرشفة',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  restore: {
    icon: RotateCcw,
    label_en: 'Restore',
    label_ar: 'استعادة',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
  },
}

const DATE_PRESETS: {
  value: DateRangePreset
  label_en: string
  label_ar: string
}[] = [
  { value: 'today', label_en: 'Today', label_ar: 'اليوم' },
  { value: 'yesterday', label_en: 'Yesterday', label_ar: 'أمس' },
  { value: 'last_7_days', label_en: 'Last 7 days', label_ar: 'آخر 7 أيام' },
  { value: 'last_30_days', label_en: 'Last 30 days', label_ar: 'آخر 30 يوم' },
  { value: 'last_90_days', label_en: 'Last 90 days', label_ar: 'آخر 90 يوم' },
  { value: 'this_month', label_en: 'This month', label_ar: 'هذا الشهر' },
  { value: 'last_month', label_en: 'Last month', label_ar: 'الشهر الماضي' },
  { value: 'custom', label_en: 'Custom range', label_ar: 'نطاق مخصص' },
]

// =============================================
// COMPONENT
// =============================================

export function ActivityFeedFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  showEntityTypes = true,
  showActionTypes = true,
  showDateRange = true,
  showUserFilter = false,
  showSearch = true,
  className,
}: ActivityFiltersProps) {
  const { t, i18n } = useTranslation('activity-feed')
  const isRTL = i18n.language === 'ar'

  const [searchValue, setSearchValue] = useState(filters.search || '')
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last_30_days')
  const [showCustomDates, setShowCustomDates] = useState(false)

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.entity_types?.length) count += filters.entity_types.length
    if (filters.action_types?.length) count += filters.action_types.length
    if (filters.date_from || filters.date_to) count += 1
    if (filters.actor_id) count += 1
    if (filters.search) count += 1
    if (filters.followed_only) count += 1
    return count
  }, [filters])

  // Handle search with debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      // Debounce search
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...filters, search: value || undefined })
      }, 500)
      return () => clearTimeout(timeoutId)
    },
    [filters, onFiltersChange],
  )

  // Toggle entity type
  const toggleEntityType = useCallback(
    (entityType: ActivityEntityType) => {
      const currentTypes = filters.entity_types || []
      const newTypes = currentTypes.includes(entityType)
        ? currentTypes.filter((t) => t !== entityType)
        : [...currentTypes, entityType]
      onFiltersChange({
        ...filters,
        entity_types: newTypes.length > 0 ? newTypes : undefined,
      })
    },
    [filters, onFiltersChange],
  )

  // Toggle action type
  const toggleActionType = useCallback(
    (actionType: ActivityActionType) => {
      const currentTypes = filters.action_types || []
      const newTypes = currentTypes.includes(actionType)
        ? currentTypes.filter((t) => t !== actionType)
        : [...currentTypes, actionType]
      onFiltersChange({
        ...filters,
        action_types: newTypes.length > 0 ? newTypes : undefined,
      })
    },
    [filters, onFiltersChange],
  )

  // Handle date preset change
  const handleDatePresetChange = useCallback(
    (preset: DateRangePreset) => {
      setDatePreset(preset)

      if (preset === 'custom') {
        setShowCustomDates(true)
        return
      }

      setShowCustomDates(false)

      const now = new Date()
      let from: Date | undefined
      let to: Date | undefined = now

      switch (preset) {
        case 'today':
          from = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'yesterday':
          from = new Date(now.setDate(now.getDate() - 1))
          from.setHours(0, 0, 0, 0)
          to = new Date(from)
          to.setHours(23, 59, 59, 999)
          break
        case 'last_7_days':
          from = new Date(now.setDate(now.getDate() - 7))
          break
        case 'last_30_days':
          from = new Date(now.setDate(now.getDate() - 30))
          break
        case 'last_90_days':
          from = new Date(now.setDate(now.getDate() - 90))
          break
        case 'this_month':
          from = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'last_month':
          from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          to = new Date(now.getFullYear(), now.getMonth(), 0)
          break
        default:
          break
      }

      onFiltersChange({
        ...filters,
        date_from: from?.toISOString(),
        date_to: to?.toISOString(),
      })
    },
    [filters, onFiltersChange],
  )

  // Toggle followed only
  const toggleFollowedOnly = useCallback(() => {
    onFiltersChange({
      ...filters,
      followed_only: !filters.followed_only,
    })
  }, [filters, onFiltersChange])

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search and Quick Actions Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        {showSearch && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isRTL ? 'بحث في النشاطات...' : 'Search activities...'}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="ps-10 pe-4 h-10"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                onClick={() => handleSearchChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Followed Only Toggle */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="followed-only" className="text-sm cursor-pointer">
              {isRTL ? 'المتابعة فقط' : 'Following only'}
            </Label>
            <Switch
              id="followed-only"
              checked={filters.followed_only || false}
              onCheckedChange={toggleFollowedOnly}
            />
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 me-1" />
              {isRTL ? 'مسح' : 'Clear'}
              <Badge variant="secondary" className="ms-1">
                {activeFilterCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Buttons Row */}
      <div className="flex flex-wrap gap-2">
        {/* Entity Types Filter */}
        {showEntityTypes && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Globe className="h-4 w-4 me-2" />
                {isRTL ? 'نوع الكيان' : 'Entity Type'}
                {filters.entity_types?.length ? (
                  <Badge variant="secondary" className="ms-2">
                    {filters.entity_types.length}
                  </Badge>
                ) : (
                  <ChevronDown className="h-4 w-4 ms-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ENTITY_TYPE_CONFIG).map(([type, config]) => {
                  const Icon = config.icon
                  const isSelected = filters.entity_types?.includes(type as ActivityEntityType)
                  return (
                    <Button
                      key={type}
                      variant={isSelected ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn('justify-start h-9', isSelected && 'bg-secondary')}
                      onClick={() => toggleEntityType(type as ActivityEntityType)}
                    >
                      <Icon className={cn('h-4 w-4 me-2', config.color)} />
                      <span className="truncate text-xs">
                        {isRTL ? config.label_ar : config.label_en}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Action Types Filter */}
        {showActionTypes && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 me-2" />
                {isRTL ? 'نوع الإجراء' : 'Action Type'}
                {filters.action_types?.length ? (
                  <Badge variant="secondary" className="ms-2">
                    {filters.action_types.length}
                  </Badge>
                ) : (
                  <ChevronDown className="h-4 w-4 ms-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ACTION_TYPE_CONFIG).map(([type, config]) => {
                  const Icon = config.icon
                  const isSelected = filters.action_types?.includes(type as ActivityActionType)
                  return (
                    <Button
                      key={type}
                      variant={isSelected ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn('justify-start h-9', isSelected && 'bg-secondary')}
                      onClick={() => toggleActionType(type as ActivityActionType)}
                    >
                      <Icon className={cn('h-4 w-4 me-2', config.color)} />
                      <span className="truncate text-xs">
                        {isRTL ? config.label_ar : config.label_en}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Date Range Filter */}
        {showDateRange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Calendar className="h-4 w-4 me-2" />
                {isRTL ? 'الفترة الزمنية' : 'Date Range'}
                {(filters.date_from || filters.date_to) && (
                  <Badge variant="secondary" className="ms-2">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                <Select
                  value={datePreset}
                  onValueChange={(value) => handleDatePresetChange(value as DateRangePreset)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isRTL ? 'اختر الفترة' : 'Select period'} />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {isRTL ? preset.label_ar : preset.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {showCustomDates && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">{isRTL ? 'من' : 'From'}</Label>
                      <Input
                        type="date"
                        value={filters.date_from ? filters.date_from.split('T')[0] : ''}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            date_from: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isRTL ? 'إلى' : 'To'}</Label>
                      <Input
                        type="date"
                        value={filters.date_to ? filters.date_to.split('T')[0] : ''}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            date_to: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                        className="h-9"
                      />
                    </div>
                  </div>
                )}

                {(filters.date_from || filters.date_to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        date_from: undefined,
                        date_to: undefined,
                      })
                    }
                  >
                    {isRTL ? 'مسح التاريخ' : 'Clear dates'}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* User Filter */}
        {showUserFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <User className="h-4 w-4 me-2" />
                {isRTL ? 'المستخدم' : 'User'}
                {filters.actor_id && (
                  <Badge variant="secondary" className="ms-2">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                <Input
                  placeholder={isRTL ? 'معرف المستخدم' : 'User ID'}
                  value={filters.actor_id || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      actor_id: e.target.value || undefined,
                    })
                  }
                  className="h-9"
                />
                {filters.actor_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        actor_id: undefined,
                      })
                    }
                  >
                    {isRTL ? 'مسح' : 'Clear'}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.entity_types?.length ||
        filters.action_types?.length ||
        filters.date_from ||
        filters.actor_id) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {filters.entity_types?.map((type) => {
            const config = ENTITY_TYPE_CONFIG[type]
            const Icon = config.icon
            return (
              <Badge key={`entity-${type}`} variant="secondary" className="gap-1 px-2 py-1">
                <Icon className={cn('h-3 w-3', config.color)} />
                {isRTL ? config.label_ar : config.label_en}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ms-1 hover:bg-transparent"
                  onClick={() => toggleEntityType(type)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
          {filters.action_types?.map((type) => {
            const config = ACTION_TYPE_CONFIG[type]
            const Icon = config.icon
            return (
              <Badge key={`action-${type}`} variant="secondary" className="gap-1 px-2 py-1">
                <Icon className={cn('h-3 w-3', config.color)} />
                {isRTL ? config.label_ar : config.label_en}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ms-1 hover:bg-transparent"
                  onClick={() => toggleActionType(type)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
          {filters.date_from && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              <Calendar className="h-3 w-3" />
              {new Date(filters.date_from).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
              {filters.date_to &&
                ` - ${new Date(filters.date_to).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}`}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ms-1 hover:bg-transparent"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    date_from: undefined,
                    date_to: undefined,
                  })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default ActivityFeedFilters
