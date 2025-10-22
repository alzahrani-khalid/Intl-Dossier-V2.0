import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  Circle,
  Clock,
  ArrowRight,
  User,
  Shield,
  Users,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Approval Chain Component for Positions & Talking Points Lifecycle
 *
 * Features:
 * - Horizontal timeline visualization (1-10 configurable stages)
 * - Stage status indicators (pending, current, completed)
 * - Approver information display
 * - Action history per stage
 * - Step-up verification badges
 * - Delegation and reassignment indicators
 * - Responsive layout
 * - Bilingual support (EN/AR)
 *
 * @component
 * @example
 * ```tsx
 * <ApprovalChain
 *   approvalChainConfig={position.approval_chain_config}
 *   currentStage={position.current_stage}
 *   approvals={approvalHistory}
 *   status={position.status}
 * />
 * ```
 */

// Types
export interface ApprovalChainStage {
  order: number;
  role: string;
  approver_id?: string;
  approver_name?: string;
}

export interface ApprovalChainConfig {
  stages: ApprovalChainStage[];
}

export interface Approval {
  id: string;
  stage: number;
  approver_id: string;
  approver_name?: string;
  original_approver_id?: string;
  original_approver_name?: string;
  action: 'approve' | 'request_revisions' | 'delegate' | 'reassign';
  comments?: string;
  step_up_verified: boolean;
  step_up_challenge_id?: string;
  delegated_from?: string;
  delegated_from_name?: string;
  delegated_until?: string;
  reassigned_by?: string;
  reassigned_by_name?: string;
  reassignment_reason?: string;
  created_at: string;
}

export interface ApprovalChainProps {
  approvalChainConfig: ApprovalChainConfig;
  currentStage: number;
  approvals: Approval[];
  status: 'draft' | 'under_review' | 'approved' | 'published';
  className?: string;
}

/**
 * Get stage status based on current stage and position status
 */
function getStageStatus(
  stageOrder: number,
  currentStage: number,
  status: string
): 'completed' | 'current' | 'pending' {
  if (status === 'approved' || status === 'published') {
    return 'completed';
  }

  if (stageOrder < currentStage) {
    return 'completed';
  }

  if (stageOrder === currentStage) {
    return 'current';
  }

  return 'pending';
}

/**
 * Get approval actions for a specific stage
 */
function getStageApprovals(approvals: Approval[], stage: number): Approval[] {
  return approvals.filter((approval) => approval.stage === stage);
}

/**
 * Approval Chain Component
 */
export function ApprovalChain({
  approvalChainConfig,
  currentStage,
  approvals,
  status,
  className,
}: ApprovalChainProps) {
  const { t, i18n } = useTranslation('positions');
  const isRTL = i18n.language === 'ar';

  // Extract stages from config
  const stages = approvalChainConfig?.stages || [];

  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <AlertCircle className="me-2 size-5" />
        <span>{t('approval.noChainConfigured')}</span>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Timeline container */}
      <div className="relative">
        {/* Stages */}
        <div className={cn(
          'flex items-start gap-2 overflow-x-auto pb-4',
          isRTL && 'flex-row-reverse'
        )}>
          {stages.map((stage, index) => {
            const stageStatus = getStageStatus(stage.order, currentStage, status);
            const stageApprovals = getStageApprovals(approvals, stage.order);
            const lastApproval = stageApprovals[stageApprovals.length - 1];
            const isLastStage = index === stages.length - 1;

            return (
              <React.Fragment key={stage.order}>
                {/* Stage item */}
                <div className="flex min-w-[180px] shrink-0 flex-col items-center">
                  {/* Stage indicator */}
                  <div className="mb-3 flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                        stageStatus === 'completed' &&
                          'bg-green-100 border-green-600 text-green-700',
                        stageStatus === 'current' &&
                          'bg-blue-100 border-blue-600 text-blue-700 ring-4 ring-blue-100',
                        stageStatus === 'pending' &&
                          'bg-gray-100 border-gray-300 text-gray-400'
                      )}
                      role="img"
                      aria-label={`${t('approval.stage')} ${stage.order}`}
                    >
                      {stageStatus === 'completed' ? (
                        <CheckCircle className="size-6" />
                      ) : stageStatus === 'current' ? (
                        <Clock className="size-6" />
                      ) : (
                        <Circle className="size-6" />
                      )}
                    </div>

                    {/* Stage number */}
                    <span className="mt-1 text-xs font-medium text-muted-foreground">
                      {t('approval.stage')} {stage.order}
                    </span>
                  </div>

                  {/* Stage details */}
                  <div className="w-full space-y-2 text-center">
                    {/* Role */}
                    <div className="break-words text-sm font-medium">
                      {stage.role}
                    </div>

                    {/* Approver info */}
                    {stage.approver_name && (
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <User className="size-3" />
                        <span className="truncate">{stage.approver_name}</span>
                      </div>
                    )}

                    {/* Action badges and info */}
                    {lastApproval && (
                      <div className="space-y-2">
                        {/* Action badge */}
                        <Badge
                          variant={
                            lastApproval.action === 'approve'
                              ? 'default'
                              : lastApproval.action === 'request_revisions'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {t(`positions.approval.actions.${lastApproval.action}`)}
                        </Badge>

                        {/* Step-up verification badge */}
                        {lastApproval.step_up_verified && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="gap-1 border-green-600 text-xs text-green-700"
                                >
                                  <Shield className="size-3" />
                                  {t('approval.stepUpVerified')}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('approval.stepUpVerifiedTooltip')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Delegation indicator */}
                        {lastApproval.delegated_from && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center gap-1 text-xs text-amber-600">
                                  <Users className="size-3" />
                                  <span>{t('approval.delegated')}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {t('approval.delegatedFrom', {
                                    name: lastApproval.delegated_from_name || lastApproval.delegated_from,
                                  })}
                                </p>
                                {lastApproval.delegated_until && (
                                  <p className="mt-1 text-xs">
                                    {t('approval.delegatedUntil', {
                                      date: new Date(lastApproval.delegated_until).toLocaleDateString(
                                        i18n.language
                                      ),
                                    })}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Reassignment indicator */}
                        {lastApproval.reassigned_by && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center gap-1 text-xs text-purple-600">
                                  <Users className="size-3" />
                                  <span>{t('approval.reassigned')}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {t('approval.reassignedBy', {
                                    name:
                                      lastApproval.reassigned_by_name ||
                                      lastApproval.reassigned_by,
                                  })}
                                </p>
                                {lastApproval.reassignment_reason && (
                                  <p className="mt-1 max-w-xs text-xs">
                                    {lastApproval.reassignment_reason}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Comments indicator */}
                        {lastApproval.comments && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex cursor-help items-center justify-center gap-1 text-xs text-blue-600">
                                  <MessageSquare className="size-3" />
                                  <span>{t('approval.hasComments')}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="whitespace-pre-wrap text-xs">
                                  {lastApproval.comments}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Timestamp */}
                        <div className="text-xs text-muted-foreground">
                          {new Date(lastApproval.created_at).toLocaleDateString(
                            i18n.language,
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </div>

                        {/* Multiple actions indicator */}
                        {stageApprovals.length > 1 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help text-xs text-muted-foreground">
                                  {t('approval.multipleActions', {
                                    count: stageApprovals.length,
                                  })}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs space-y-2">
                                  {stageApprovals.map((approval, idx) => (
                                    <div key={approval.id} className="text-xs">
                                      <div className="font-medium">
                                        {t(`positions.approval.actions.${approval.action}`)}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {approval.approver_name || approval.approver_id}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {new Date(approval.created_at).toLocaleString(
                                          i18n.language
                                        )}
                                      </div>
                                      {idx < stageApprovals.length - 1 && (
                                        <hr className="my-2" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector arrow */}
                {!isLastStage && (
                  <div className="flex shrink-0 items-center pt-6">
                    <ArrowRight
                      className={cn(
                        'h-5 w-5 text-muted-foreground',
                        isRTL && 'rotate-180'
                      )}
                      aria-hidden="true"
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className="absolute top-0 h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{
              width: `${((currentStage - 1) / (stages.length - 1)) * 100}%`,
              [isRTL ? 'right' : 'left']: 0,
            }}
            role="progressbar"
            aria-valuenow={currentStage}
            aria-valuemin={1}
            aria-valuemax={stages.length}
            aria-label={t('approval.progress', {
              current: currentStage,
              total: stages.length,
            })}
          />
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-green-600" />
              <span className="text-muted-foreground">
                {t('approval.completed')}: {currentStage - 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-blue-600" />
              <span className="text-muted-foreground">
                {t('approval.remaining')}: {stages.length - currentStage + 1}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <Badge
            variant={
              status === 'approved' || status === 'published'
                ? 'default'
                : status === 'under_review'
                ? 'secondary'
                : 'outline'
            }
          >
            {t(`positions.status.${status}`)}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default ApprovalChain;
