import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Search, UserPlus, Eye, CheckCircle, Loader2, Users, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type UserStatus = 'active' | 'inactive' | 'pending' | 'deactivated' | 'suspended'
type UserRole = 'admin' | 'manager' | 'staff' | 'viewer'
type UserType = 'employee' | 'contractor' | 'guest'

type User = {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  role: UserRole
  user_type: UserType
  status: UserStatus
  last_login_at?: string
  expires_at?: string
  mfa_enabled: boolean
}

/**
 * UsersListPage Component
 *
 * Main page for user management with:
 * - Search functionality (name, email, username)
 * - Multi-filter support (role, status, type)
 * - Pagination (10/25/50/100 per page)
 * - Responsive table with mobile card view
 * - RTL support for Arabic
 *
 * Mobile-first design with minimum 44x44px touch targets
 */
export function UsersListPage() {
  const { t, i18n } = useTranslation('user-management')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Fetch users from Supabase
  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['users', searchQuery, roleFilter, statusFilter, typeFilter, currentPage, pageSize],
    queryFn: async () => {
      // Build query
      let query = supabase
        .from('users')
        .select(
          'id, email, username, full_name, name_en, name_ar, role, is_active, mfa_enabled, last_login_at, department, avatar_url',
          { count: 'exact' },
        )
        .is('deleted_by', null)
        .order('created_at', { ascending: false })

      // Apply role filter
      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }

      // Apply status filter (map to is_active)
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'active') {
          query = query.eq('is_active', true)
        } else if (statusFilter === 'inactive' || statusFilter === 'deactivated') {
          query = query.eq('is_active', false)
        }
      }

      // Apply search filter
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`
        query = query.or(
          `email.ilike.${searchTerm},username.ilike.${searchTerm},full_name.ilike.${searchTerm},name_en.ilike.${searchTerm},name_ar.ilike.${searchTerm}`,
        )
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      // Map database fields to User type
      const users: User[] = (data || []).map((u) => ({
        id: u.id,
        username: u.username || u.email?.split('@')[0] || 'unknown',
        full_name: u.name_en || u.name_ar || u.full_name || u.email || 'Unknown User',
        email: u.email || '',
        avatar_url: u.avatar_url || undefined,
        role: (u.role as UserRole) || 'viewer',
        user_type: 'employee' as UserType, // Default since not stored in DB
        status: u.is_active ? 'active' : ('inactive' as UserStatus),
        last_login_at: u.last_login_at || undefined,
        mfa_enabled: u.mfa_enabled || false,
      }))

      return {
        users,
        total: count || 0,
        page: currentPage,
        pageSize,
      }
    },
  })

  const totalPages = Math.ceil((usersData?.total || 0) / pageSize)

  const getStatusBadgeVariant = (
    status: UserStatus,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'deactivated':
      case 'suspended':
        return 'destructive'
      case 'pending':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getRoleBadgeVariant = (role: UserRole): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'manager':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const handleViewUser = (userId: string) => {
    navigate({ to: `/users/${userId}` })
  }

  const handleCreateUser = () => {
    navigate({ to: '/users/create' })
  }

  if (isLoading) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('translation:loading', 'Loading...')}</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-medium">{t('errors.loadFailed')}</p>
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-start">{t('usersList.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground text-start mt-1">
            {t('usersList.showing', {
              from: (currentPage - 1) * pageSize + 1,
              to: Math.min(currentPage * pageSize, usersData?.total || 0),
              total: usersData?.total || 0,
            })}
          </p>
        </div>

        <Button
          onClick={handleCreateUser}
          className={`w-full sm:w-auto min-h-11 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <UserPlus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('userOnboarding.createUser')}
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="relative">
                <Search
                  className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`}
                />
                <Input
                  type="search"
                  placeholder={t('usersList.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`min-h-11 ${isRTL ? 'pr-10' : 'pl-10'}`}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="">
                  <SelectValue placeholder={t('usersList.filterByRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('usersList.showAll')}</SelectItem>
                  <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                  <SelectItem value="manager">{t('roles.manager')}</SelectItem>
                  <SelectItem value="staff">{t('roles.staff')}</SelectItem>
                  <SelectItem value="viewer">{t('roles.viewer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="">
                  <SelectValue placeholder={t('usersList.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('usersList.showAll')}</SelectItem>
                  <SelectItem value="active">{t('userStatus.active')}</SelectItem>
                  <SelectItem value="inactive">{t('userStatus.inactive')}</SelectItem>
                  <SelectItem value="pending">{t('userStatus.pending')}</SelectItem>
                  <SelectItem value="deactivated">{t('userStatus.deactivated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="">
                  <SelectValue placeholder={t('usersList.filterByType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('usersList.showAll')}</SelectItem>
                  <SelectItem value="employee">{t('userTypes.employee')}</SelectItem>
                  <SelectItem value="contractor">{t('userTypes.contractor')}</SelectItem>
                  <SelectItem value="guest">{t('userTypes.guest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table - Desktop */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('userProfile.username')}</TableHead>
                <TableHead className="text-start">{t('userProfile.fullName')}</TableHead>
                <TableHead className="text-start">{t('userProfile.email')}</TableHead>
                <TableHead className="text-start">{t('userProfile.role')}</TableHead>
                <TableHead className="text-start">{t('userProfile.userType')}</TableHead>
                <TableHead className="text-start">{t('userProfile.status')}</TableHead>
                <TableHead className="text-start">{t('userProfile.lastLoginAt')}</TableHead>
                <TableHead className="text-end">{t('usersList.actionsColumn')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData?.users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-row items-center gap-2">
                      {user.mfa_enabled && (
                        <CheckCircle
                          className="h-3 w-3 text-green-600"
                          title={t('userProfile.mfaEnabled')}
                        />
                      )}
                      {user.username}
                    </div>
                  </TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {t(`roles.${user.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t(`userTypes.${user.user_type}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {t(`userStatus.${user.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString(isRTL ? 'ar' : 'en')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewUser(user.id)}
                      className={isRTL ? 'flex-row-reverse' : ''}
                    >
                      <Eye className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {t('actions.viewDetails')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {usersData?.users?.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-row items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex flex-row items-center gap-2">
                    {user.mfa_enabled && (
                      <CheckCircle
                        className="h-3 w-3 text-green-600"
                        title={t('userProfile.mfaEnabled')}
                      />
                    )}
                    {user.full_name}
                  </CardTitle>
                  <CardDescription className="text-sm">@{user.username}</CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(user.status)} className="ms-2">
                  {t(`userStatus.${user.status}`)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Email */}
              <div className="text-sm text-muted-foreground">{user.email}</div>

              {/* Role & Type */}
              <div className="flex flex-row gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)}>{t(`roles.${user.role}`)}</Badge>
                <Badge variant="outline">{t(`userTypes.${user.user_type}`)}</Badge>
              </div>

              {/* Last Login */}
              <div className="text-sm text-muted-foreground">
                {t('userProfile.lastLoginAt')}:{' '}
                {user.last_login_at
                  ? new Date(user.last_login_at).toLocaleDateString(isRTL ? 'ar' : 'en')
                  : '-'}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewUser(user.id)}
                  className={`w-full min-h-9 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Eye className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('actions.viewDetails')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Page Size Selector */}
        <div className="flex flex-row items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('usersList.resultsPerPage')}:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pagination Controls */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
