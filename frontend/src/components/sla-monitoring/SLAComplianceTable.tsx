/**
 * SLA Compliance Table Component
 * Feature: sla-monitoring
 *
 * Displays SLA compliance breakdown by type and assignee with RTL support
 */

import { useTranslation } from 'react-i18next'
import { ChevronRight, AlertTriangle, CheckCircle, XCircle, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { SLAComplianceByType, SLAComplianceByAssignee } from '@/types/sla.types'
import { getComplianceThreshold, formatSLADuration, formatSLADurationAr } from '@/types/sla.types'
import { cn } from '@/lib/utils'

interface SLAComplianceTableProps {
  typeData?: SLAComplianceByType[]
  assigneeData?: SLAComplianceByAssignee[]
  isLoading?: boolean
  className?: string
}

export function SLAComplianceTable({
  typeData,
  assigneeData,
  isLoading,
  className,
}: SLAComplianceTableProps) {
  const { t, i18n } = useTranslation('sla')
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  const ComplianceBadge = ({ rate }: { rate: number }) => {
    const threshold = getComplianceThreshold(rate)
    return (
      <Badge variant="outline" className={cn(threshold.color, threshold.bgColor)}>
        {rate}%
      </Badge>
    )
  }

  const formatDuration = (minutes: number) =>
    isRTL ? formatSLADurationAr(minutes) : formatSLADuration(minutes)

  return (
    <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('tables.complianceBreakdown')}</CardTitle>
        <CardDescription>{t('tables.complianceBreakdownDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="type" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="type">{t('tables.byType')}</TabsTrigger>
            <TabsTrigger value="assignee">{t('tables.byAssignee')}</TabsTrigger>
          </TabsList>

          <TabsContent value="type">
            {typeData && typeData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t('tables.requestType')}</TableHead>
                      <TableHead className="text-center">{t('tables.total')}</TableHead>
                      <TableHead className="text-center">{t('tables.met')}</TableHead>
                      <TableHead className="text-center">{t('tables.breached')}</TableHead>
                      <TableHead className="text-center">{t('tables.compliance')}</TableHead>
                      <TableHead className="text-end">{t('tables.avgTime')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeData.map((row) => (
                      <TableRow key={row.request_type}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <ChevronRight
                              className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')}
                            />
                            {t(`types.${row.request_type}`, row.request_type)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.total_items.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {row.met_count.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            {row.breached_count.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <ComplianceBadge rate={row.compliance_rate} />
                        </TableCell>
                        <TableCell className="text-end">
                          {formatDuration(row.avg_resolution_minutes)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                {t('tables.noDataByType')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignee">
            {assigneeData && assigneeData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t('tables.assignee')}</TableHead>
                      <TableHead className="text-center">{t('tables.total')}</TableHead>
                      <TableHead className="text-center">{t('tables.compliance')}</TableHead>
                      <TableHead className="text-center min-w-[120px]">
                        {t('tables.progress')}
                      </TableHead>
                      <TableHead className="text-center">{t('tables.atRisk')}</TableHead>
                      <TableHead className="text-end">{t('tables.avgTime')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assigneeData.map((row) => (
                      <TableRow key={row.assignee_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {isRTL
                                  ? row.assignee_name_ar || row.assignee_name
                                  : row.assignee_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.total_items.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                        </TableCell>
                        <TableCell className="text-center">
                          <ComplianceBadge rate={row.compliance_rate} />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <Progress value={row.compliance_rate} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-12">
                              {row.met_count}/{row.total_items}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.currently_at_risk > 0 ? (
                            <span className="flex items-center justify-center gap-1 text-yellow-600">
                              <AlertTriangle className="h-4 w-4" />
                              {row.currently_at_risk}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-end">
                          {formatDuration(row.avg_resolution_minutes)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                {t('tables.noDataByAssignee')}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
