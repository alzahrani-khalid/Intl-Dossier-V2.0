import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDelegation } from '@/hooks/use-delegation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Plus,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  ArrowRight,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';

// Delegation form schema
const delegationFormSchema = z.object({
  granteeId: z.string().uuid('Invalid user ID'),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  expiresAt: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, 'Expiration date must be in the future'),
});

type DelegationFormValues = z.infer<typeof delegationFormSchema>;

interface DelegationManagerProps {
  userId: string;
  availablePermissions: string[];
  users: Array<{ id: string; username: string; full_name: string }>;
}

export function DelegationManager({
  userId,
  availablePermissions,
  users,
}: DelegationManagerProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'granted' | 'received'>('granted');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    createDelegation,
    revokeDelegation,
    validateDelegation,
    myDelegations,
  } = useDelegation(userId);

  const form = useForm<DelegationFormValues>({
    resolver: zodResolver(delegationFormSchema),
    defaultValues: {
      granteeId: '',
      permissions: [],
      reason: '',
      expiresAt: '',
    },
  });

  // Filter delegations by type
  const grantedDelegations = myDelegations.data?.filter(
    (d) => d.grantor_id === userId
  );
  const receivedDelegations = myDelegations.data?.filter(
    (d) => d.grantee_id === userId
  );

  // Handle form submission
  const onSubmit = async (values: DelegationFormValues) => {
    setValidationError(null);

    // Validate delegation first
    const validation = await validateDelegation.mutateAsync({
      grantorId: userId,
      granteeId: values.granteeId,
      permissions: values.permissions,
    });

    if (!validation.valid) {
      setValidationError(validation.reason || 'Delegation validation failed');
      return;
    }

    // Create delegation
    await createDelegation.mutateAsync({
      granteeId: values.granteeId,
      permissions: values.permissions,
      reason: values.reason,
      expiresAt: new Date(values.expiresAt).toISOString(),
    });

    setIsDialogOpen(false);
    form.reset();
  };

  // Handle revocation
  const handleRevoke = async (delegationId: string) => {
    if (confirm(t('delegation.confirmRevoke'))) {
      await revokeDelegation.mutateAsync(delegationId);
    }
  };

  // Get expiry warning days
  const getExpiryWarning = (expiresAt: string) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry;
  };

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-start">
            {t('delegation.title')}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-start mt-1">
            {t('delegation.description')}
          </p>
        </div>

        {/* Create Delegation Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-11 min-w-11 gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('delegation.create')}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-start text-xl sm:text-2xl">
                {t('delegation.createTitle')}
              </DialogTitle>
              <DialogDescription className="text-start">
                {t('delegation.createDescription')}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                {/* Grantee Selection */}
                <FormField
                  control={form.control}
                  name="granteeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-start block">
                        {t('delegation.grantee')}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-11">
                            <SelectValue placeholder={t('delegation.selectGrantee')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users
                            .filter((u) => u.id !== userId)
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name} (@{user.username})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-start">
                        {t('delegation.granteeHelp')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Permissions Selection */}
                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-start block">
                        {t('delegation.permissions')}
                      </FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availablePermissions.map((permission) => (
                          <label
                            key={permission}
                            className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-accent min-h-11"
                          >
                            <input
                              type="checkbox"
                              value={permission}
                              checked={field.value?.includes(permission)}
                              onChange={(e) => {
                                const value = e.target.value;
                                const newValue = e.target.checked
                                  ? [...(field.value || []), value]
                                  : field.value?.filter((v) => v !== value);
                                field.onChange(newValue);
                              }}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{permission}</span>
                          </label>
                        ))}
                      </div>
                      <FormDescription className="text-start">
                        {t('delegation.permissionsHelp')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-start block">
                        {t('delegation.reason')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('delegation.reasonPlaceholder')}
                          className="min-h-20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-start">
                        {t('delegation.reasonHelp')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiration Date */}
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-start block">
                        {t('delegation.expiresAt')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="min-h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-start">
                        {t('delegation.expiresAtHelp')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Validation Error */}
                {validationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-start ms-2">
                      {validationError}
                    </AlertDescription>
                  </Alert>
                )}

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="min-h-11 w-full sm:w-auto"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    className="min-h-11 w-full sm:w-auto"
                    disabled={createDelegation.isPending}
                  >
                    {createDelegation.isPending
                      ? t('delegation.creating')
                      : t('delegation.create')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delegation Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="granted" className="min-h-11 gap-2">
            <UserCheck className="h-4 w-4" />
            <span>{t('delegation.granted')}</span>
            {grantedDelegations && (
              <Badge variant="secondary" className="ms-2">
                {grantedDelegations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="received" className="min-h-11 gap-2">
            <UserX className="h-4 w-4" />
            <span>{t('delegation.received')}</span>
            {receivedDelegations && (
              <Badge variant="secondary" className="ms-2">
                {receivedDelegations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Granted Delegations */}
        <TabsContent value="granted" className="mt-0">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t('delegation.grantee')}</TableHead>
                    <TableHead className="text-start hidden sm:table-cell">
                      {t('delegation.permissions')}
                    </TableHead>
                    <TableHead className="text-start hidden md:table-cell">
                      {t('delegation.expiresAt')}
                    </TableHead>
                    <TableHead className="text-start">{t('delegation.status')}</TableHead>
                    <TableHead className="text-end">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myDelegations.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {t('common.loading')}
                      </TableCell>
                    </TableRow>
                  ) : grantedDelegations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {t('delegation.noGranted')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    grantedDelegations?.map((delegation) => {
                      const daysUntilExpiry = getExpiryWarning(delegation.expires_at);
                      const isExpiringSoon = daysUntilExpiry <= 7;

                      return (
                        <TableRow key={delegation.id}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {delegation.grantee?.full_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                @{delegation.grantee?.username}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {delegation.permissions?.slice(0, 2).map((perm) => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                              {delegation.permissions?.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{delegation.permissions.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(delegation.expires_at), 'PPp')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {delegation.status === 'active' ? (
                              <Badge
                                variant={isExpiringSoon ? 'destructive' : 'default'}
                                className="gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {isExpiringSoon
                                  ? t('delegation.expiringSoon', { days: daysUntilExpiry })
                                  : t('delegation.active')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                {t(`delegation.status.${delegation.status}`)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-end">
                            {delegation.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevoke(delegation.id)}
                                disabled={revokeDelegation.isPending}
                                className="min-h-9 min-w-9"
                              >
                                {t('delegation.revoke')}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Received Delegations */}
        <TabsContent value="received" className="mt-0">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t('delegation.grantor')}</TableHead>
                    <TableHead className="text-start hidden sm:table-cell">
                      {t('delegation.permissions')}
                    </TableHead>
                    <TableHead className="text-start hidden md:table-cell">
                      {t('delegation.expiresAt')}
                    </TableHead>
                    <TableHead className="text-start">{t('delegation.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myDelegations.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        {t('common.loading')}
                      </TableCell>
                    </TableRow>
                  ) : receivedDelegations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        {t('delegation.noReceived')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    receivedDelegations?.map((delegation) => {
                      const daysUntilExpiry = getExpiryWarning(delegation.expires_at);
                      const isExpiringSoon = daysUntilExpiry <= 7;

                      return (
                        <TableRow key={delegation.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {delegation.grantor?.full_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  @{delegation.grantor?.username}
                                </span>
                              </div>
                              <ArrowRight
                                className={`h-4 w-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {delegation.permissions?.slice(0, 2).map((perm) => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                              {delegation.permissions?.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{delegation.permissions.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(delegation.expires_at), 'PPp')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {delegation.status === 'active' ? (
                              <Badge
                                variant={isExpiringSoon ? 'destructive' : 'default'}
                                className="gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {isExpiringSoon
                                  ? t('delegation.expiringSoon', { days: daysUntilExpiry })
                                  : t('delegation.active')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                {t(`delegation.status.${delegation.status}`)}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
