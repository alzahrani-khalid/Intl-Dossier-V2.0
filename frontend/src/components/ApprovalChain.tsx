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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Extract stages from config
  const stages = approvalChainConfig?.stages || [];

  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <AlertCircle className="h-5 w-5 me-2" />
        <span>{t('positions.approval.noChainConfigured')}</span>
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
                <div className="flex flex-col items-center min-w-[180px] flex-shrink-0">
                  {/* Stage indicator */}
                  <div className="flex flex-col items-center mb-3">
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
                      aria-label={`${t('positions.approval.stage')} ${stage.order}`}
                    >
                      {stageStatus === 'completed' ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : stageStatus === 'current' ? (
                        <Clock className="h-6 w-6" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </div>

                    {/* Stage number */}
                    <span className="text-xs font-medium text-muted-foreground mt-1">
                      {t('positions.approval.stage')} {stage.order}
                    </span>
                  </div>

                  {/* Stage details */}
                  <div className="text-center space-y-2 w-full">
                    {/* Role */}
                    <div className="font-medium text-sm break-words">
                      {stage.role}
                    </div>

                    {/* Approver info */}
                    {stage.approver_name && (
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
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
                                  className="border-green-600 text-green-700 text-xs gap-1"
                                >
                                  <Shield className="h-3 w-3" />
                                  {t('positions.approval.stepUpVerified')}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('positions.approval.stepUpVerifiedTooltip')}</p>
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
                                  <Users className="h-3 w-3" />
                                  <span>{t('positions.approval.delegated')}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {t('positions.approval.delegatedFrom', {
                                    name: lastApproval.delegated_from_name || lastApproval.delegated_from,
                                  })}
                                </p>
                                {lastApproval.delegated_until && (
                                  <p className="text-xs mt-1">
                                    {t('positions.approval.delegatedUntil', {
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
                                  <Users className="h-3 w-3" />
                                  <span>{t('positions.approval.reassigned')}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {t('positions.approval.reassignedBy', {
                                    name:
                                      lastApproval.reassigned_by_name ||
                                      lastApproval.reassigned_by,
                                  })}
                                </p>
                                {lastApproval.reassignment_reason && (
                                  <p className="text-xs mt-1 max-w-xs">
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
                                <div className="flex items-center justify-center gap-1 text-xs text-blue-600 cursor-help">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{t('positions.approval.hasComments')}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs whitespace-pre-wrap">
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
                                <div className="text-xs text-muted-foreground cursor-help">
                                  {t('positions.approval.multipleActions', {
                                    count: stageApprovals.length,
                                  })}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-2 max-w-xs">
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
                  <div className="flex items-center pt-6 flex-shrink-0">
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
        <div className="relative h-1 bg-gray-200 rounded-full mt-4 overflow-hidden">
          <div
            className="absolute top-0 h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${((currentStage - 1) / (stages.length - 1)) * 100}%`,
              [isRTL ? 'right' : 'left']: 0,
            }}
            role="progressbar"
            aria-valuenow={currentStage}
            aria-valuemin={1}
            aria-valuemax={stages.length}
            aria-label={t('positions.approval.progress', {
              current: currentStage,
              total: stages.length,
            })}
          />
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">
                {t('positions.approval.completed')}: {currentStage - 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">
                {t('positions.approval.remaining')}: {stages.length - currentStage + 1}
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
