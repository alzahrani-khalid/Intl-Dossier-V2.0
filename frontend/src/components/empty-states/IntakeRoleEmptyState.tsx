/**
 * IntakeRoleEmptyState Component
 *
 * Displays role-specific empty state messages for the intake workflow.
 * Shows different guidance based on user role:
 * - Requester: How to submit new requests with examples
 * - Reviewer: Criteria for evaluation
 * - Assignee: How tasks will appear
 *
 * Mobile-first responsive design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import {
  Inbox,
  FileText,
  CheckCircle2,
  ClipboardList,
  Send,
  Search,
  Plus,
  ArrowRight,
  LucideIcon,
  Sparkles,
  Clock,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'

export type IntakeUserRole = 'requester' | 'reviewer' | 'assignee' | 'viewer'

export interface IntakeRoleEmptyStateProps {
  /** Override the detected user role */
  role?: IntakeUserRole
  /** Callback to create new request */
  onCreateRequest?: () => void
  /** Callback to view pending assignments */
  onViewAssignments?: () => void
  /** Callback to access review queue */
  onAccessReviewQueue?: () => void
  /** Callback to browse all tickets */
  onBrowseTickets?: () => void
  /** Additional CSS classes */
  className?: string
  /** Test ID for automated testing */
  testId?: string
}

interface QuickActionConfig {
  label: string
  description: string
  icon: LucideIcon
  onClick?: () => void
  variant: 'default' | 'outline' | 'secondary'
}

interface ExampleRequest {
  type: string
  title: string
  description: string
}

/**
 * Determines the user's intake role based on their profile role
 * Falls back to 'viewer' if no role matches
 */
function determineIntakeRole(userRole?: string): IntakeUserRole {
  if (!userRole) return 'viewer'

  const roleMap: Record<string, IntakeUserRole> = {
    // Users who primarily submit requests
    staff: 'requester',
    user: 'requester',
    analyst: 'requester',

    // Users who triage and review requests
    admin: 'reviewer',
    manager: 'reviewer',
    supervisor: 'reviewer',
    triage_officer: 'reviewer',

    // Users who are assigned to work on requests
    assignee: 'assignee',
    officer: 'assignee',
    specialist: 'assignee',
    team_member: 'assignee',
  }

  return roleMap[userRole.toLowerCase()] || 'viewer'
}

/**
 * IntakeRoleEmptyState displays contextual guidance based on user role
 * in the intake workflow system.
 */
export function IntakeRoleEmptyState({
  role: overrideRole,
  onCreateRequest,
  onViewAssignments,
  onAccessReviewQueue,
  onBrowseTickets,
  className,
  testId = 'intake-role-empty-state',
}: IntakeRoleEmptyStateProps) {
  const { t, i18n } = useTranslation(['empty-states', 'intake', 'common'])
  const isRTL = i18n.language === 'ar'
  const { user } = useAuth()

  // Determine the user's role
  const detectedRole = determineIntakeRole(user?.role)
  const currentRole = overrideRole || detectedRole

  // Get role-specific icon
  const roleIcons: Record<IntakeUserRole, LucideIcon> = {
    requester: Send,
    reviewer: ClipboardList,
    assignee: UserCheck,
    viewer: Inbox,
  }

  const RoleIcon = roleIcons[currentRole]

  // Get role-specific content
  const roleContent = getRoleContent(currentRole, t)

  // Get example requests for requesters
  const exampleRequests = getExampleRequests(t)

  // Build quick actions based on role
  const quickActions = buildQuickActions(
    currentRole,
    t,
    onCreateRequest,
    onViewAssignments,
    onAccessReviewQueue,
    onBrowseTickets,
  )

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 sm:py-12 sm:px-6 lg:py-16',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid={testId}
    >
      {/* Icon and Badge */}
      <div className="relative mb-4 sm:mb-6">
        <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10">
          <RoleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
        </div>
        <Badge
          variant="secondary"
          className="absolute -bottom-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 text-xs whitespace-nowrap"
        >
          {roleContent.badge}
        </Badge>
      </div>

      {/* Title */}
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground text-center mb-2 sm:mb-3">
        {roleContent.title}
      </h2>

      {/* Description */}
      <p className="text-sm sm:text-base text-muted-foreground text-center max-w-lg mb-6 sm:mb-8">
        {roleContent.description}
      </p>

      {/* Role-Specific Content */}
      {currentRole === 'requester' && (
        <RequesterContent
          exampleRequests={exampleRequests}
          onCreateRequest={onCreateRequest}
          isRTL={isRTL}
          t={t}
        />
      )}

      {currentRole === 'reviewer' && (
        <ReviewerContent onAccessReviewQueue={onAccessReviewQueue} isRTL={isRTL} t={t} />
      )}

      {currentRole === 'assignee' && (
        <AssigneeContent onViewAssignments={onViewAssignments} isRTL={isRTL} t={t} />
      )}

      {currentRole === 'viewer' && (
        <ViewerContent onBrowseTickets={onBrowseTickets} isRTL={isRTL} t={t} />
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-6 sm:mt-8">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.onClick}
              className="min-h-11 min-w-11 px-4 sm:px-6 w-full sm:w-auto"
              disabled={!action.onClick}
            >
              <action.icon className={cn('w-4 h-4', isRTL ? 'ms-2' : 'me-2')} />
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Content component for requesters showing example requests
 */
function RequesterContent({
  exampleRequests,
  onCreateRequest,
  isRTL,
  t,
}: {
  exampleRequests: ExampleRequest[]
  onCreateRequest?: () => void
  isRTL: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
      {/* Examples Header */}
      <div className="flex items-center gap-2 justify-center">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-muted-foreground">
          {t('empty-states:intake.requester.examplesTitle')}
        </span>
      </div>

      {/* Example Request Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {exampleRequests.map((example, index) => (
          <Card
            key={index}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={onCreateRequest}
          >
            <CardContent className="p-3 sm:p-4">
              <Badge variant="outline" className="mb-2 text-xs">
                {example.type}
              </Badge>
              <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
                {example.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{example.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground/70 text-center italic">
        {t('empty-states:intake.requester.hint')}
      </p>
    </div>
  )
}

/**
 * Content component for reviewers showing evaluation criteria
 */
function ReviewerContent({
  onAccessReviewQueue,
  isRTL,
  t,
}: {
  onAccessReviewQueue?: () => void
  isRTL: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  const criteria = [
    {
      icon: Search,
      title: t('empty-states:intake.reviewer.criteria.completeness.title'),
      description: t('empty-states:intake.reviewer.criteria.completeness.description'),
    },
    {
      icon: Clock,
      title: t('empty-states:intake.reviewer.criteria.urgency.title'),
      description: t('empty-states:intake.reviewer.criteria.urgency.description'),
    },
    {
      icon: FileText,
      title: t('empty-states:intake.reviewer.criteria.classification.title'),
      description: t('empty-states:intake.reviewer.criteria.classification.description'),
    },
    {
      icon: UserCheck,
      title: t('empty-states:intake.reviewer.criteria.routing.title'),
      description: t('empty-states:intake.reviewer.criteria.routing.description'),
    },
  ]

  return (
    <div className="w-full max-w-2xl">
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {t('empty-states:intake.reviewer.criteriaTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {criteria.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hint */}
      <p className="text-xs text-muted-foreground/70 text-center italic mt-4">
        {t('empty-states:intake.reviewer.hint')}
      </p>
    </div>
  )
}

/**
 * Content component for assignees showing task expectations
 */
function AssigneeContent({
  onViewAssignments,
  isRTL,
  t,
}: {
  onViewAssignments?: () => void
  isRTL: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  const taskSteps = [
    {
      step: 1,
      title: t('empty-states:intake.assignee.steps.notification.title'),
      description: t('empty-states:intake.assignee.steps.notification.description'),
    },
    {
      step: 2,
      title: t('empty-states:intake.assignee.steps.review.title'),
      description: t('empty-states:intake.assignee.steps.review.description'),
    },
    {
      step: 3,
      title: t('empty-states:intake.assignee.steps.action.title'),
      description: t('empty-states:intake.assignee.steps.action.description'),
    },
    {
      step: 4,
      title: t('empty-states:intake.assignee.steps.complete.title'),
      description: t('empty-states:intake.assignee.steps.complete.description'),
    },
  ]

  return (
    <div className="w-full max-w-xl">
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            {t('empty-states:intake.assignee.workflowTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 sm:space-y-4">
            {taskSteps.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold flex-shrink-0">
                  {item.step}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hint */}
      <p className="text-xs text-muted-foreground/70 text-center italic mt-4">
        {t('empty-states:intake.assignee.hint')}
      </p>
    </div>
  )
}

/**
 * Content component for general viewers
 */
function ViewerContent({
  onBrowseTickets,
  isRTL,
  t,
}: {
  onBrowseTickets?: () => void
  isRTL: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <div className="w-full max-w-md text-center">
      <div className="p-4 sm:p-6 rounded-lg bg-muted/50">
        <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {t('empty-states:intake.viewer.description')}
        </p>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground/70 italic mt-4">
        {t('empty-states:intake.viewer.hint')}
      </p>
    </div>
  )
}

/**
 * Gets role-specific content strings
 */
function getRoleContent(role: IntakeUserRole, t: ReturnType<typeof useTranslation>['t']) {
  const content = {
    requester: {
      badge: t('empty-states:intake.requester.badge'),
      title: t('empty-states:intake.requester.title'),
      description: t('empty-states:intake.requester.description'),
    },
    reviewer: {
      badge: t('empty-states:intake.reviewer.badge'),
      title: t('empty-states:intake.reviewer.title'),
      description: t('empty-states:intake.reviewer.description'),
    },
    assignee: {
      badge: t('empty-states:intake.assignee.badge'),
      title: t('empty-states:intake.assignee.title'),
      description: t('empty-states:intake.assignee.description'),
    },
    viewer: {
      badge: t('empty-states:intake.viewer.badge'),
      title: t('empty-states:intake.viewer.title'),
      description: t('empty-states:intake.viewer.description'),
    },
  }

  return content[role]
}

/**
 * Gets example requests for requester role
 */
function getExampleRequests(t: ReturnType<typeof useTranslation>['t']): ExampleRequest[] {
  return [
    {
      type: t('intake:form.requestType.options.engagement'),
      title: t('empty-states:intake.requester.examples.engagement.title'),
      description: t('empty-states:intake.requester.examples.engagement.description'),
    },
    {
      type: t('intake:form.requestType.options.position'),
      title: t('empty-states:intake.requester.examples.position.title'),
      description: t('empty-states:intake.requester.examples.position.description'),
    },
    {
      type: t('intake:form.requestType.options.mou_action'),
      title: t('empty-states:intake.requester.examples.mou.title'),
      description: t('empty-states:intake.requester.examples.mou.description'),
    },
    {
      type: t('intake:form.requestType.options.foresight'),
      title: t('empty-states:intake.requester.examples.foresight.title'),
      description: t('empty-states:intake.requester.examples.foresight.description'),
    },
  ]
}

/**
 * Builds quick actions based on user role
 */
function buildQuickActions(
  role: IntakeUserRole,
  t: ReturnType<typeof useTranslation>['t'],
  onCreateRequest?: () => void,
  onViewAssignments?: () => void,
  onAccessReviewQueue?: () => void,
  onBrowseTickets?: () => void,
): QuickActionConfig[] {
  const actions: Record<IntakeUserRole, QuickActionConfig[]> = {
    requester: [
      {
        label: t('empty-states:intake.requester.actions.create'),
        description: t('empty-states:intake.requester.actions.createDescription'),
        icon: Plus,
        onClick: onCreateRequest,
        variant: 'default',
      },
      {
        label: t('empty-states:intake.requester.actions.viewStatus'),
        description: t('empty-states:intake.requester.actions.viewStatusDescription'),
        icon: Search,
        onClick: onBrowseTickets,
        variant: 'outline',
      },
    ],
    reviewer: [
      {
        label: t('empty-states:intake.reviewer.actions.accessQueue'),
        description: t('empty-states:intake.reviewer.actions.accessQueueDescription'),
        icon: ClipboardList,
        onClick: onAccessReviewQueue,
        variant: 'default',
      },
      {
        label: t('empty-states:intake.reviewer.actions.viewAll'),
        description: t('empty-states:intake.reviewer.actions.viewAllDescription'),
        icon: Search,
        onClick: onBrowseTickets,
        variant: 'outline',
      },
    ],
    assignee: [
      {
        label: t('empty-states:intake.assignee.actions.viewAssignments'),
        description: t('empty-states:intake.assignee.actions.viewAssignmentsDescription'),
        icon: CheckCircle2,
        onClick: onViewAssignments,
        variant: 'default',
      },
      {
        label: t('empty-states:intake.assignee.actions.browse'),
        description: t('empty-states:intake.assignee.actions.browseDescription'),
        icon: Search,
        onClick: onBrowseTickets,
        variant: 'outline',
      },
    ],
    viewer: [
      {
        label: t('empty-states:intake.viewer.actions.browse'),
        description: t('empty-states:intake.viewer.actions.browseDescription'),
        icon: Search,
        onClick: onBrowseTickets,
        variant: 'default',
      },
    ],
  }

  return actions[role]
}

export default IntakeRoleEmptyState
