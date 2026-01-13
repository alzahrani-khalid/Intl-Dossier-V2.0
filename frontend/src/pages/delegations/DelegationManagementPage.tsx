/**
 * DelegationManagementPage Component
 * Main page for managing delegation permissions
 *
 * Features:
 * - View delegations I've granted (permissions I shared)
 * - View delegations I've received (permissions shared with me)
 * - Create new delegations
 * - Revoke existing delegations
 * - Filter by status (active, expired, revoked)
 * - Expiring soon notifications
 *
 * Mobile-first design with RTL support
 *
 * Feature: delegation-management
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DelegationList,
  CreateDelegationDialog,
  DelegationExpiryBanner,
} from '@/components/delegation'
import { useMyDelegations, useDelegationsExpiringSoon } from '@/hooks/use-delegation'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Shield,
  AlertTriangle,
} from 'lucide-react'

type TabValue = 'granted' | 'received'

export function DelegationManagementPage() {
  const { t, i18n } = useTranslation('delegation')
  const isRTL = i18n.language === 'ar'

  // State
  const [activeTab, setActiveTab] = useState<TabValue>('granted')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Fetch delegations
  const {
    data: delegations,
    isLoading,
    refetch,
  } = useMyDelegations({
    type: 'all',
    active_only: showActiveOnly,
  })

  // Fetch expiring delegations for badge
  const { data: expiringSoon } = useDelegationsExpiringSoon()

  // Fetch available users for delegation (simplified - in production, use search)
  const { data: usersData } = useQuery({
    queryKey: ['users-for-delegation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('is_active', true)
        .order('full_name')
        .limit(100)

      if (error) throw error
      return data || []
    },
    staleTime: 60000, // 1 minute
  })

  // Filter delegations by tab
  const filteredDelegations = useMemo(() => {
    if (!delegations) return []

    if (activeTab === 'granted') {
      return delegations.granted || []
    }
    return delegations.received || []
  }, [delegations, activeTab])

  // Stats
  const stats = useMemo(() => {
    if (!delegations) {
      return { granted: 0, received: 0, expiring: 0 }
    }
    return {
      granted: delegations.granted?.length || 0,
      received: delegations.received?.length || 0,
      expiring: expiringSoon?.total || 0,
    }
  }, [delegations, expiringSoon])

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Expiring Soon Banner */}
      <DelegationExpiryBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-start flex items-center gap-3">
            <Shield className={`h-7 w-7 sm:h-8 sm:w-8 ${isRTL ? 'ms-0' : 'me-0'}`} />
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-start mt-1">
            {t('description')}
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className={`w-full sm:w-auto min-h-11 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('actions.create')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              {t('list.granted')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{stats.granted}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              {t('list.received')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{stats.received}</p>
            )}
          </CardContent>
        </Card>

        <Card className={stats.expiring > 0 ? 'border-yellow-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              {stats.expiring > 0 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              {t('list.showExpiring')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className={`text-2xl font-bold ${stats.expiring > 0 ? 'text-yellow-600' : ''}`}>
                {stats.expiring}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">{t('list.title')}</CardTitle>

            {/* Active Only Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="active-only"
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
              />
              <Label htmlFor="active-only" className="text-sm cursor-pointer">
                {t('list.showActiveOnly')}
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabValue)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="granted"
                className={`flex items-center gap-2 min-h-10 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <ArrowUpFromLine className="h-4 w-4" />
                <span className="hidden sm:inline">{t('tabs.granted')}</span>
                <span className="sm:hidden">{t('tabs.granted')}</span>
                {stats.granted > 0 && (
                  <Badge variant="secondary" className="ms-1">
                    {stats.granted}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="received"
                className={`flex items-center gap-2 min-h-10 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <ArrowDownToLine className="h-4 w-4" />
                <span className="hidden sm:inline">{t('tabs.received')}</span>
                <span className="sm:hidden">{t('tabs.received')}</span>
                {stats.received > 0 && (
                  <Badge variant="secondary" className="ms-1">
                    {stats.received}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="granted" className="mt-0">
              <DelegationList
                delegations={filteredDelegations}
                type="granted"
                isLoading={isLoading}
                onRefresh={refetch}
              />
            </TabsContent>

            <TabsContent value="received" className="mt-0">
              <DelegationList
                delegations={filteredDelegations}
                type="received"
                isLoading={isLoading}
                onRefresh={refetch}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Delegation Dialog */}
      <CreateDelegationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
        users={usersData || []}
      />
    </div>
  )
}
