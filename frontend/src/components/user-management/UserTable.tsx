import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoreVertical, UserX, UserCheck, Shield, User as UserIcon } from 'lucide-react';
import { useDeactivateUser, useReactivateUser } from '@/hooks/use-user-deactivation';
import { OrphanedItemsSummary } from '@/services/user-management-api';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  user_type: 'employee' | 'guest';
  status: 'active' | 'inactive' | 'deactivated';
  last_login_at?: string;
  expires_at?: string;
}

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
}

interface DeactivateDialogState {
  open: boolean;
  user: User | null;
  reason: string;
  orphanedItems?: OrphanedItemsSummary;
}

interface ReactivateDialogState {
  open: boolean;
  user: User | null;
  securityReviewApproval: string;
  reason: string;
}

/**
 * User Management Table Component
 *
 * Mobile-first, RTL-compatible table for user management
 * Features:
 * - User status indicators (active/inactive/deactivated)
 * - Role badges (admin/editor/viewer)
 * - User type indicators (employee/guest)
 * - Deactivate/reactivate actions
 * - Orphaned items summary on deactivation
 * - Responsive layout with proper touch targets
 */
export function UserTable({ users, isLoading }: UserTableProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [deactivateDialog, setDeactivateDialog] = useState<DeactivateDialogState>({
    open: false,
    user: null,
    reason: '',
  });

  const [reactivateDialog, setReactivateDialog] = useState<ReactivateDialogState>({
    open: false,
    user: null,
    securityReviewApproval: '',
    reason: '',
  });

  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();

  const handleDeactivateClick = (user: User) => {
    setDeactivateDialog({
      open: true,
      user,
      reason: '',
    });
  };

  const handleDeactivateConfirm = () => {
    if (!deactivateDialog.user) return;

    deactivateMutation.mutate(
      {
        userId: deactivateDialog.user.id,
        reason: deactivateDialog.reason,
      },
      {
        onSuccess: (data) => {
          setDeactivateDialog({ open: false, user: null, reason: '', orphanedItems: data.orphanedItems });
        },
      }
    );
  };

  const handleReactivateClick = (user: User) => {
    setReactivateDialog({
      open: true,
      user,
      securityReviewApproval: '',
      reason: '',
    });
  };

  const handleReactivateConfirm = () => {
    if (!reactivateDialog.user) return;

    reactivateMutation.mutate(
      {
        userId: reactivateDialog.user.id,
        securityReviewApproval: reactivateDialog.securityReviewApproval || undefined,
        reason: reactivateDialog.reason,
      },
      {
        onSuccess: () => {
          setReactivateDialog({ open: false, user: null, securityReviewApproval: '', reason: '' });
        },
      }
    );
  };

  const getStatusBadge = (status: User['status']) => {
    const variants = {
      active: { variant: 'default' as const, label: t('userManagement.status.active') },
      inactive: { variant: 'secondary' as const, label: t('userManagement.status.inactive') },
      deactivated: { variant: 'destructive' as const, label: t('userManagement.status.deactivated') },
    };

    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getRoleBadge = (role: User['role']) => {
    const variants = {
      admin: { icon: Shield, label: t('userManagement.roles.admin'), className: 'bg-red-100 text-red-800' },
      editor: { icon: UserIcon, label: t('userManagement.roles.editor'), className: 'bg-blue-100 text-blue-800' },
      viewer: { icon: UserIcon, label: t('userManagement.roles.viewer'), className: 'bg-gray-100 text-gray-800' },
    };

    const { icon: Icon, label, className } = variants[role];
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 me-1" />
        {label}
      </Badge>
    );
  };

  const getUserTypeBadge = (userType: User['user_type']) => {
    return userType === 'guest' ? (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
        {t('userManagement.userType.guest')}
      </Badge>
    ) : null;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <>
      {/* Mobile-first responsive table */}
      <div className="w-full overflow-x-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start min-w-[200px]">{t('userManagement.table.user')}</TableHead>
              <TableHead className="text-start min-w-[120px]">{t('userManagement.table.role')}</TableHead>
              <TableHead className="text-start min-w-[100px]">{t('userManagement.table.status')}</TableHead>
              <TableHead className="text-start min-w-[150px]">{t('userManagement.table.lastLogin')}</TableHead>
              <TableHead className="text-end min-w-[80px]">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="font-medium text-sm">{user.full_name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    {getUserTypeBadge(user.user_type)}
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell className="text-sm">
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleString(i18n.language)
                    : t('common.never')}
                </TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="min-h-11 min-w-11">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                      {user.status !== 'deactivated' ? (
                        <DropdownMenuItem
                          onClick={() => handleDeactivateClick(user)}
                          className="text-destructive"
                        >
                          <UserX className="h-4 w-4 me-2" />
                          {t('userManagement.actions.deactivate')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleReactivateClick(user)}>
                          <UserCheck className="h-4 w-4 me-2" />
                          {t('userManagement.actions.reactivate')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={deactivateDialog.open}
        onOpenChange={(open) => setDeactivateDialog({ ...deactivateDialog, open })}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-start text-lg">
              {t('userManagement.deactivation.confirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-start text-sm">
              {t('userManagement.deactivation.confirmDescription', {
                user: deactivateDialog.user?.full_name,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="deactivate-reason" className="text-start text-sm">
                {t('userManagement.deactivation.reason')}
              </Label>
              <Textarea
                id="deactivate-reason"
                value={deactivateDialog.reason}
                onChange={(e) => setDeactivateDialog({ ...deactivateDialog, reason: e.target.value })}
                placeholder={t('userManagement.deactivation.reasonPlaceholder')}
                className="min-h-20"
              />
            </div>

            {deactivateDialog.orphanedItems && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="font-semibold mb-2">{t('userManagement.deactivation.orphanedItems')}</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>{t('userManagement.deactivation.dossiers', { count: deactivateDialog.orphanedItems.dossiers })}</li>
                  <li>{t('userManagement.deactivation.delegations', { count: deactivateDialog.orphanedItems.delegations })}</li>
                  <li>{t('userManagement.deactivation.approvals', { count: deactivateDialog.orphanedItems.approvals })}</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeactivateDialog({ open: false, user: null, reason: '' })}
              className="w-full sm:w-auto min-h-11"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateConfirm}
              disabled={deactivateMutation.isPending}
              className="w-full sm:w-auto min-h-11"
            >
              {deactivateMutation.isPending ? t('common.processing') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <Dialog
        open={reactivateDialog.open}
        onOpenChange={(open) => setReactivateDialog({ ...reactivateDialog, open })}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-start text-lg">
              {t('userManagement.reactivation.confirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-start text-sm">
              {t('userManagement.reactivation.confirmDescription', {
                user: reactivateDialog.user?.full_name,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {reactivateDialog.user?.role === 'admin' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="security-review" className="text-start text-sm">
                  {t('userManagement.reactivation.securityReviewApproval')}
                </Label>
                <Input
                  id="security-review"
                  value={reactivateDialog.securityReviewApproval}
                  onChange={(e) =>
                    setReactivateDialog({ ...reactivateDialog, securityReviewApproval: e.target.value })
                  }
                  placeholder={t('userManagement.reactivation.approvalPlaceholder')}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="reactivate-reason" className="text-start text-sm">
                {t('userManagement.reactivation.reason')}
              </Label>
              <Textarea
                id="reactivate-reason"
                value={reactivateDialog.reason}
                onChange={(e) => setReactivateDialog({ ...reactivateDialog, reason: e.target.value })}
                placeholder={t('userManagement.reactivation.reasonPlaceholder')}
                className="min-h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setReactivateDialog({ open: false, user: null, securityReviewApproval: '', reason: '' })
              }
              className="w-full sm:w-auto min-h-11"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleReactivateConfirm}
              disabled={reactivateMutation.isPending}
              className="w-full sm:w-auto min-h-11"
            >
              {reactivateMutation.isPending ? t('common.processing') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
