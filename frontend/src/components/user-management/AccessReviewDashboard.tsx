import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenerateAccessReview, useAccessReviewsList, useAccessReviewSummary } from '@/hooks/use-access-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Clock, Users, UserX, ShieldAlert } from 'lucide-react';

/**
 * AccessReviewDashboard Component
 *
 * Displays access review management interface with:
 * - Review creation dialog
 * - Active/completed reviews list
 * - Findings summary cards
 * - Certification actions
 *
 * Mobile-first with RTL support
 */
export function AccessReviewDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewScope, setReviewScope] = useState('all_users');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const { mutate: generateReview, isPending: isGenerating } = useGenerateAccessReview();
  const { data: inProgressReviews, isLoading: loadingInProgress } = useAccessReviewsList('in_progress');
  const { data: completedReviews, isLoading: loadingCompleted } = useAccessReviewsList('completed');
  const summary = useAccessReviewSummary(selectedReviewId);

  const handleCreateReview = () => {
    generateReview(
      {
        review_name: reviewName,
        review_scope: reviewScope,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setReviewName('');
          setReviewScope('all_users');
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-start">{t('user_management.access_reviews')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground text-start mt-1">
            {t('user_management.access_review_description')}
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto min-h-11">
              {t('user_management.create_review')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-start">{t('user_management.create_access_review')}</DialogTitle>
              <DialogDescription className="text-start">
                {t('user_management.create_review_description')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="review-name" className="text-start">
                  {t('user_management.review_name')}
                </Label>
                <Input
                  id="review-name"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder={t('user_management.review_name_placeholder')}
                  className="min-h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="review-scope" className="text-start">
                  {t('user_management.review_scope')}
                </Label>
                <Select value={reviewScope} onValueChange={setReviewScope}>
                  <SelectTrigger id="review-scope" className="min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">{t('user_management.all_users')}</SelectItem>
                    <SelectItem value="admin">{t('user_management.admin_users')}</SelectItem>
                    <SelectItem value="editor">{t('user_management.editor_users')}</SelectItem>
                    <SelectItem value="guest">{t('user_management.guest_users')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="w-full sm:w-auto min-h-11"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreateReview}
                disabled={!reviewName || isGenerating}
                className="w-full sm:w-auto min-h-11"
              >
                {isGenerating ? t('common.creating') : t('common.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards (when review selected) */}
      {selectedReviewId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {t('user_management.total_findings')}
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalFindings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {t('user_management.inactive_users')}
                </CardTitle>
                <UserX className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.inactiveUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('user_management.inactive_90_days')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {t('user_management.excessive_permissions')}
                </CardTitle>
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.excessivePermissions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {t('user_management.certified_users')}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.certifiedUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('user_management.out_of')} {summary.totalFindings}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reviews List */}
      <Tabs defaultValue="in_progress" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="in_progress" className="min-h-11">
            <Clock className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('user_management.in_progress')} ({inProgressReviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="min-h-11">
            <CheckCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('user_management.completed')} ({completedReviews?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in_progress" className="mt-4">
          {loadingInProgress ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : inProgressReviews?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('user_management.no_active_reviews')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {inProgressReviews?.map((review) => (
                <Card
                  key={review.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedReviewId === review.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedReviewId(review.id)}
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-start text-lg">{review.review_name}</CardTitle>
                      <Badge variant="outline">
                        {t(`user_management.scope_${review.review_scope}`)}
                      </Badge>
                    </div>
                    <CardDescription className="text-start">
                      {t('user_management.reviewed_by')}: {review.reviewer?.full_name || review.reviewer?.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {t('user_management.started')}: {new Date(review.review_date).toLocaleDateString()}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {review.findings?.length || 0} {t('user_management.findings')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {loadingCompleted ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : completedReviews?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('user_management.no_completed_reviews')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedReviews?.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-start text-lg">{review.review_name}</CardTitle>
                      <Badge variant="secondary">
                        <CheckCircle className={`h-3 w-3 ${isRTL ? 'ms-1' : 'me-1'}`} />
                        {t('user_management.completed')}
                      </Badge>
                    </div>
                    <CardDescription className="text-start">
                      {t('user_management.reviewed_by')}: {review.reviewer?.full_name || review.reviewer?.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {t('user_management.completed_on')}: {new Date(review.completed_at).toLocaleDateString()}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {review.findings?.length || 0} {t('user_management.findings')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
