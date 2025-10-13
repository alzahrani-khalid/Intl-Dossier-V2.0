import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  CheckCircle,
  Shield,
  Clock,
  Mail,
  User,
  Calendar,
  Globe,
  Lock,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { getUserPermissions } from '@/services/user-management-api';

type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';
type UserType = 'employee' | 'contractor' | 'guest';
type UserStatus = 'active' | 'inactive' | 'pending' | 'deactivated' | 'suspended';

type UserDetail = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  user_type: UserType;
  status: UserStatus;
  mfa_enabled: boolean;
  last_login_at?: string;
  last_login_ip?: string;
  expires_at?: string;
  created_at: string;
  preferences?: {
    language?: string;
    timezone?: string;
  };
};

type Permission = {
  resource: string;
  actions: string[];
  source: 'role' | 'delegation';
  granted_by?: string;
  valid_from?: string;
  valid_until?: string;
};

type Session = {
  id: string;
  created_at: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
};

/**
 * UserDetailPage Component
 *
 * Detailed view of a user showing:
 * - Overview: Profile information, status, MFA status
 * - Permissions: Role-based + delegated permissions
 * - Activity: Login history, active sessions
 * - Audit Log: Recent actions
 *
 * Mobile-responsive with RTL support
 */
export function UserDetailPage() {
  const { userId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('user-management');
  const isRTL = i18n.language === 'ar';

  // Fetch user details
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const mockUser: UserDetail = {
        id: userId || '1',
        username: 'admin_user',
        full_name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        user_type: 'employee',
        status: 'active',
        mfa_enabled: true,
        last_login_at: new Date().toISOString(),
        last_login_ip: '192.168.1.1',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        preferences: {
          language: 'en',
          timezone: 'UTC',
        },
      };
      return mockUser;
    },
    enabled: !!userId,
  });

  // Fetch user permissions
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => getUserPermissions(userId!),
    enabled: !!userId,
  });

  // Fetch active sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['user-sessions', userId],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const mockSessions: Session[] = [
        {
          id: '1',
          created_at: new Date().toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          last_activity: new Date().toISOString(),
        },
      ];
      return mockSessions;
    },
    enabled: !!userId,
  });

  const getStatusBadgeVariant = (status: UserStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'deactivated':
      case 'suspended':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center py-12 text-muted-foreground">
          {t('common:common.loading')}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center py-12 text-muted-foreground">
          {t('errors.userNotFound')}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/users' })}
          className={`w-fit ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
          {t('common:common.back')}
        </Button>

        {/* User Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Avatar */}
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback className="text-xl">{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-start flex flex-row items-center gap-2">
                      {user.full_name}
                      {user.mfa_enabled && (
                        <CheckCircle className="h-5 w-5 text-green-600" title={t('userProfile.mfaEnabled')} />
                      )}
                    </h1>
                    <p className="text-base text-muted-foreground text-start mt-1">
                      @{user.username}
                    </p>
                  </div>

                  <div className="flex flex-row gap-2">
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {t(`userStatus.${user.status}`)}
                    </Badge>
                    <Badge variant="outline">
                      {t(`userTypes.${user.user_type}`)}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Quick Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className={`flex flex-row items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>

                  <div className={`flex flex-row items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{t(`roles.${user.role}`)}</span>
                  </div>

                  {user.last_login_at && (
                    <div className={`flex flex-row items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(user.last_login_at).toLocaleString(isRTL ? 'ar' : 'en')}
                      </span>
                    </div>
                  )}

                  {user.preferences?.language && (
                    <div className={`flex flex-row items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.preferences.language.toUpperCase()}</span>
                    </div>
                  )}

                  {user.expires_at && (
                    <div className={`flex flex-row items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-600">
                        {t('userProfile.expiresAt')}: {new Date(user.expires_at).toLocaleDateString(isRTL ? 'ar' : 'en')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permissions">{t('userDetail.permissionSummary')}</TabsTrigger>
          <TabsTrigger value="activity">{t('userDetail.activityHistory')}</TabsTrigger>
          <TabsTrigger value="sessions">{t('userDetail.sessions')}</TabsTrigger>
        </TabsList>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Role Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-start flex flex-row items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('userDetail.rolePermissions')}
                </CardTitle>
                <CardDescription className="text-start">
                  {t('roles.' + user.role)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPermissions ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('common:common.loading')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {permissions?.role_permissions?.map((permission: Permission, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="font-medium text-sm mb-1">{permission.resource}</div>
                        <div className="flex flex-wrap gap-1">
                          {permission.actions.map((action) => (
                            <Badge key={action} variant="secondary" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )) || <div className="text-sm text-muted-foreground">{t('common:common.noData')}</div>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delegated Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-start flex flex-row items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('userDetail.delegatedPermissions')}
                </CardTitle>
                <CardDescription className="text-start">
                  {t('delegation.received')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPermissions ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('common:common.loading')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {permissions?.delegated_permissions?.map((permission: Permission, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="font-medium text-sm mb-1">{permission.resource}</div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {permission.actions.map((action) => (
                            <Badge key={action} variant="secondary" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                        {permission.granted_by && (
                          <div className="text-xs text-muted-foreground">
                            {t('userDetail.grantedBy', { grantor: permission.granted_by })}
                          </div>
                        )}
                        {permission.valid_until && (
                          <div className="text-xs text-muted-foreground">
                            {t('userDetail.validPeriod', {
                              from: new Date(permission.valid_from!).toLocaleDateString(isRTL ? 'ar' : 'en'),
                              until: new Date(permission.valid_until).toLocaleDateString(isRTL ? 'ar' : 'en'),
                            })}
                          </div>
                        )}
                      </div>
                    )) || <div className="text-sm text-muted-foreground">{t('common:common.noData')}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-start flex flex-row items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('userDetail.activityHistory')}
              </CardTitle>
              <CardDescription className="text-start">
                Recent login history and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.last_login_at && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{t('userProfile.lastLoginAt')}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.last_login_at).toLocaleString(isRTL ? 'ar' : 'en')}
                      </div>
                    </div>
                    {user.last_login_ip && (
                      <Badge variant="outline">{user.last_login_ip}</Badge>
                    )}
                  </div>
                )}
                {!user.last_login_at && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('common:common.noData')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-start flex flex-row items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('userDetail.sessions')}
              </CardTitle>
              <CardDescription className="text-start">
                Active sessions for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="text-center py-4 text-muted-foreground">
                  {t('common:common.loading')}
                </div>
              ) : sessions && sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{session.ip_address}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {session.user_agent}
                          </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-1">
                          <div className="text-xs text-muted-foreground">
                            {t('userProfile.lastLoginAt')}
                          </div>
                          <div className="text-sm">
                            {new Date(session.last_activity).toLocaleString(isRTL ? 'ar' : 'en')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('userDetail.noActiveSessions')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
