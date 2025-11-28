import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Upload,
  Users,
  AlertTriangle,
  ArrowRight,
  ListChecks,
  Target,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
} from 'lucide-react';

/**
 * CommitmentsHelpPage Component
 *
 * Comprehensive documentation for the Commitments Management feature.
 * Covers:
 * - What are commitments
 * - How to create, edit, delete commitments
 * - Status workflow and transitions
 * - Filtering and searching
 * - Evidence upload
 * - Owner types (internal vs external)
 * - Mobile-first responsive design
 * - RTL support for Arabic
 */
export function CommitmentsHelpPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header with Back Navigation */}
      <div className="mb-6">
        <Link to="/help">
          <Button variant="ghost" size="sm" className="mb-4 min-h-11">
            <ArrowLeft className={`size-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
            {isRTL ? 'العودة للمساعدة' : 'Back to Help'}
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2">
          {isRTL ? 'دليل إدارة الالتزامات' : 'Commitments Management Guide'}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground text-start">
          {isRTL
            ? 'تعلم كيفية إنشاء وتتبع وإدارة الالتزامات المرتبطة بملفاتك'
            : 'Learn how to create, track, and manage commitments linked to your dossiers'}
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickNavCard
          icon={Target}
          title={isRTL ? 'ما هو الالتزام؟' : 'What is a Commitment?'}
          description={isRTL ? 'فهم المفهوم الأساسي' : 'Understand the core concept'}
          onClick={() => setActiveSection('overview')}
          isRTL={isRTL}
        />
        <QuickNavCard
          icon={ListChecks}
          title={isRTL ? 'إنشاء وإدارة' : 'Create & Manage'}
          description={isRTL ? 'عمليات CRUD' : 'CRUD operations'}
          onClick={() => setActiveSection('crud')}
          isRTL={isRTL}
        />
        <QuickNavCard
          icon={Filter}
          title={isRTL ? 'التصفية والبحث' : 'Filter & Search'}
          description={isRTL ? 'البحث عن الالتزامات' : 'Find commitments'}
          onClick={() => setActiveSection('filtering')}
          isRTL={isRTL}
        />
        <QuickNavCard
          icon={Upload}
          title={isRTL ? 'رفع الأدلة' : 'Evidence Upload'}
          description={isRTL ? 'إثبات الإنجاز' : 'Proof of completion'}
          onClick={() => setActiveSection('evidence')}
          isRTL={isRTL}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 h-auto">
          <TabsTrigger value="overview" className="min-h-11 text-xs sm:text-sm">
            {isRTL ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="crud" className="min-h-11 text-xs sm:text-sm">
            {isRTL ? 'إنشاء وإدارة' : 'Create & Manage'}
          </TabsTrigger>
          <TabsTrigger value="filtering" className="min-h-11 text-xs sm:text-sm">
            {isRTL ? 'التصفية' : 'Filtering'}
          </TabsTrigger>
          <TabsTrigger value="evidence" className="min-h-11 text-xs sm:text-sm">
            {isRTL ? 'الأدلة' : 'Evidence'}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Target className="size-5 text-primary" />
                {isRTL ? 'ما هو الالتزام؟' : 'What is a Commitment?'}
              </CardTitle>
              <CardDescription className="text-start">
                {isRTL
                  ? 'الالتزام هو تعهد أو مهمة مرتبطة بملف دبلوماسي'
                  : 'A commitment is a tracked obligation or task linked to a diplomatic dossier'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm sm:text-base text-start">
                {isRTL
                  ? 'الالتزامات هي وعود أو مهام يجب إنجازها كجزء من إدارة العلاقات الدولية. يمكن أن تكون مهام داخلية يجب على فريقك إكمالها، أو التزامات خارجية تراقبها مع الشركاء.'
                  : 'Commitments are promises or tasks that need to be fulfilled as part of managing international relationships. They can be internal tasks your team must complete, or external obligations you monitor with partners.'}
              </p>

              {/* Commitment Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <AttributeCard
                  title={isRTL ? 'العنوان والوصف' : 'Title & Description'}
                  description={isRTL ? 'اسم قصير ووصف تفصيلي للالتزام' : 'Short name and detailed explanation'}
                  icon={FileText}
                  isRTL={isRTL}
                />
                <AttributeCard
                  title={isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}
                  description={isRTL ? 'الموعد النهائي للإنجاز' : 'Deadline for completion'}
                  icon={Clock}
                  isRTL={isRTL}
                />
                <AttributeCard
                  title={isRTL ? 'الأولوية' : 'Priority'}
                  description={isRTL ? 'منخفض، متوسط، عالي، حرج' : 'Low, Medium, High, Critical'}
                  icon={AlertTriangle}
                  isRTL={isRTL}
                />
                <AttributeCard
                  title={isRTL ? 'المالك' : 'Owner'}
                  description={isRTL ? 'داخلي (فريقك) أو خارجي (شريك)' : 'Internal (your team) or External (partner)'}
                  icon={Users}
                  isRTL={isRTL}
                />
              </div>

              <Separator className="my-6" />

              {/* Status Workflow */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-start">
                  {isRTL ? 'دورة حياة الحالة' : 'Status Lifecycle'}
                </h3>
                <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-4">
                  <StatusBadge status="pending" isRTL={isRTL} />
                  <ChevronRight className={`size-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
                  <StatusBadge status="in_progress" isRTL={isRTL} />
                  <ChevronRight className={`size-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
                  <StatusBadge status="completed" isRTL={isRTL} />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-start">
                  {isRTL
                    ? 'يمكن أيضًا إلغاء الالتزامات أو تصبح متأخرة تلقائيًا عند تجاوز تاريخ الاستحقاق'
                    : 'Commitments can also be cancelled, or become overdue automatically when past due date'}
                </p>
              </div>

              <Separator className="my-6" />

              {/* Owner Types */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-start">
                  {isRTL ? 'أنواع المالكين' : 'Owner Types'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Users className="size-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-start">
                            {isRTL ? 'داخلي' : 'Internal'}
                          </h4>
                          <p className="text-sm text-muted-foreground text-start">
                            {isRTL
                              ? 'أحد أعضاء فريقك مسؤول. يتم تتبعه تلقائيًا.'
                              : 'A team member is responsible. Tracked automatically.'}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {isRTL ? 'تتبع تلقائي' : 'Auto Tracking'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 dark:border-purple-800">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Users className="size-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-start">
                            {isRTL ? 'خارجي' : 'External'}
                          </h4>
                          <p className="text-sm text-muted-foreground text-start">
                            {isRTL
                              ? 'شريك أو جهة اتصال خارجية مسؤولة. تحتاج للمتابعة.'
                              : 'A partner or external contact is responsible. Needs follow-up.'}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {isRTL ? 'متابعة يدوية' : 'Manual Follow-up'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRUD Tab */}
        <TabsContent value="crud" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <ListChecks className="size-5 text-primary" />
                {isRTL ? 'إنشاء وإدارة الالتزامات' : 'Create & Manage Commitments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {/* Create */}
                <AccordionItem value="create">
                  <AccordionTrigger className="text-start">
                    <span className="flex items-center gap-2">
                      <Edit className="size-4 text-green-600" />
                      {isRTL ? 'إنشاء التزام جديد' : 'Create a New Commitment'}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <ol className={`list-decimal ${isRTL ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`}>
                      <li className="text-start">
                        {isRTL
                          ? 'افتح ملفًا تم تعيينك عليه'
                          : 'Open a dossier you are assigned to'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'انقر على زر "إضافة التزام"'
                          : 'Click the "Add Commitment" button'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'املأ النموذج: العنوان، الوصف، تاريخ الاستحقاق، الأولوية، المالك'
                          : 'Fill in the form: Title, Description, Due Date, Priority, Owner'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'اختر نوع المالك (داخلي أو خارجي)'
                          : 'Select owner type (Internal or External)'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'انقر على "حفظ" لإنشاء الالتزام'
                          : 'Click "Save" to create the commitment'}
                      </li>
                    </ol>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground text-start">
                          <strong>{isRTL ? 'نصيحة:' : 'Tip:'}</strong>{' '}
                          {isRTL
                            ? 'استخدم عناوين واضحة ومحددة لتسهيل التتبع لاحقًا'
                            : 'Use clear, specific titles to make tracking easier later'}
                        </p>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                {/* Edit */}
                <AccordionItem value="edit">
                  <AccordionTrigger className="text-start">
                    <span className="flex items-center gap-2">
                      <Edit className="size-4 text-blue-600" />
                      {isRTL ? 'تعديل التزام' : 'Edit a Commitment'}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <ol className={`list-decimal ${isRTL ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`}>
                      <li className="text-start">
                        {isRTL
                          ? 'افتح قائمة الالتزامات أو انتقل إلى الملف'
                          : 'Open the commitments list or navigate to the dossier'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'انقر على بطاقة الالتزام لفتح التفاصيل'
                          : 'Click on the commitment card to open details'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'انقر على زر "تعديل"'
                          : 'Click the "Edit" button'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'قم بتعديل الحقول المطلوبة'
                          : 'Modify the desired fields'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'انقر على "حفظ التغييرات"'
                          : 'Click "Save Changes"'}
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                {/* Status Update */}
                <AccordionItem value="status">
                  <AccordionTrigger className="text-start">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      {isRTL ? 'تحديث الحالة بسرعة' : 'Quick Status Update'}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm sm:text-base text-start">
                      {isRTL
                        ? 'يمكنك تحديث الحالة مباشرة من قائمة الالتزامات بدون فتح التفاصيل:'
                        : 'You can update status directly from the commitments list without opening details:'}
                    </p>
                    <ol className={`list-decimal ${isRTL ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`}>
                      <li className="text-start">
                        {isRTL
                          ? 'ابحث عن شارة الحالة على بطاقة الالتزام'
                          : 'Find the status badge on the commitment card'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'انقر على الشارة لفتح قائمة الحالات'
                          : 'Tap the badge to open the status dropdown'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'اختر الحالة الجديدة'
                          : 'Select the new status'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'سيتم التحديث فورًا!'
                          : 'Update happens immediately!'}
                      </li>
                    </ol>
                    <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                      <CardContent className="pt-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200 text-start">
                          <strong>{isRTL ? 'ملاحظة:' : 'Note:'}</strong>{' '}
                          {isRTL
                            ? 'لا يمكن إرجاع الحالة من "مكتمل" إلى "معلق" إلا للمسؤولين'
                            : 'Status cannot be reverted from "Completed" to "Pending" except by admins'}
                        </p>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                {/* Delete */}
                <AccordionItem value="delete">
                  <AccordionTrigger className="text-start">
                    <span className="flex items-center gap-2">
                      <Trash2 className="size-4 text-red-600" />
                      {isRTL ? 'إلغاء أو حذف التزام' : 'Cancel or Delete a Commitment'}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm sm:text-base text-start">
                      {isRTL
                        ? 'بدلاً من الحذف، نوصي بإلغاء الالتزامات للحفاظ على السجل:'
                        : 'Instead of deleting, we recommend cancelling commitments to preserve history:'}
                    </p>
                    <ol className={`list-decimal ${isRTL ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`}>
                      <li className="text-start">
                        {isRTL
                          ? 'افتح تفاصيل الالتزام'
                          : 'Open the commitment details'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'انقر على "إلغاء الالتزام"'
                          : 'Click "Cancel Commitment"'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'أضف سبب الإلغاء (اختياري)'
                          : 'Add a cancellation reason (optional)'}
                      </li>
                      <li className="text-start">
                        {isRTL
                          ? 'أكد الإلغاء'
                          : 'Confirm cancellation'}
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filtering Tab */}
        <TabsContent value="filtering" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Filter className="size-5 text-primary" />
                {isRTL ? 'التصفية والبحث' : 'Filtering & Searching'}
              </CardTitle>
              <CardDescription className="text-start">
                {isRTL
                  ? 'ابحث عن الالتزامات بسرعة باستخدام المرشحات'
                  : 'Find commitments quickly using filters'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filter Options */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-start">
                  {isRTL ? 'خيارات التصفية المتاحة' : 'Available Filter Options'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FilterOptionCard
                    title={isRTL ? 'الحالة' : 'Status'}
                    options={isRTL
                      ? ['معلق', 'قيد التنفيذ', 'مكتمل', 'ملغى', 'متأخر']
                      : ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Overdue']}
                    isRTL={isRTL}
                  />
                  <FilterOptionCard
                    title={isRTL ? 'الأولوية' : 'Priority'}
                    options={isRTL
                      ? ['منخفض', 'متوسط', 'عالي', 'حرج']
                      : ['Low', 'Medium', 'High', 'Critical']}
                    isRTL={isRTL}
                  />
                  <FilterOptionCard
                    title={isRTL ? 'نوع المالك' : 'Owner Type'}
                    options={isRTL ? ['داخلي', 'خارجي'] : ['Internal', 'External']}
                    isRTL={isRTL}
                  />
                  <FilterOptionCard
                    title={isRTL ? 'نطاق التاريخ' : 'Date Range'}
                    options={isRTL
                      ? ['من تاريخ', 'إلى تاريخ']
                      : ['From Date', 'To Date']}
                    isRTL={isRTL}
                  />
                </div>
              </div>

              <Separator />

              {/* URL Sharing */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-start">
                  {isRTL ? 'مشاركة عبر الرابط' : 'URL Sharing'}
                </h3>
                <p className="text-sm sm:text-base text-start mb-4">
                  {isRTL
                    ? 'المرشحات المطبقة يتم حفظها في عنوان URL. يمكنك نسخ الرابط ومشاركته مع الزملاء!'
                    : 'Applied filters are saved in the URL. You can copy and share the link with colleagues!'}
                </p>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <code className="text-xs sm:text-sm break-all">
                      /commitments?status=pending,in_progress&priority=high,critical&overdue=true
                    </code>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Filter Chips */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-start">
                  {isRTL ? 'شرائح المرشحات' : 'Filter Chips'}
                </h3>
                <p className="text-sm sm:text-base text-start mb-4">
                  {isRTL
                    ? 'المرشحات النشطة تظهر كشرائح فوق القائمة. انقر على X لإزالة مرشح معين.'
                    : 'Active filters appear as chips above the list. Click X to remove a specific filter.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {isRTL ? 'الحالة: معلق' : 'Status: Pending'}
                    <span className="ms-1 cursor-pointer">&times;</span>
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {isRTL ? 'الأولوية: عالي' : 'Priority: High'}
                    <span className="ms-1 cursor-pointer">&times;</span>
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {isRTL ? 'متأخر فقط' : 'Overdue Only'}
                    <span className="ms-1 cursor-pointer">&times;</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-start">
                <Upload className="size-5 text-primary" />
                {isRTL ? 'رفع الأدلة والإثباتات' : 'Evidence Upload'}
              </CardTitle>
              <CardDescription className="text-start">
                {isRTL
                  ? 'رفع المستندات كدليل على إنجاز الالتزام'
                  : 'Upload documents as proof of commitment completion'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* When to Upload */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-start">
                  {isRTL ? 'متى يجب الرفع؟' : 'When to Upload?'}
                </h3>
                <p className="text-sm sm:text-base text-start">
                  {isRTL
                    ? 'بعض الالتزامات تتطلب إثباتًا للإنجاز. ستظهر أيقونة رفع على البطاقة عندما يكون "الإثبات مطلوب" مفعلًا.'
                    : 'Some commitments require proof of completion. An upload icon appears on the card when "Proof Required" is enabled.'}
                </p>
              </div>

              <Separator />

              {/* Supported Formats */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-start">
                  {isRTL ? 'الصيغ المدعومة' : 'Supported Formats'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <FormatBadge format="PDF" color="red" />
                  <FormatBadge format="JPG" color="green" />
                  <FormatBadge format="PNG" color="blue" />
                  <FormatBadge format="DOCX" color="indigo" />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-start">
                  {isRTL
                    ? 'الحد الأقصى لحجم الملف: 10 ميجابايت'
                    : 'Maximum file size: 10MB'}
                </p>
              </div>

              <Separator />

              {/* Upload Steps */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-start">
                  {isRTL ? 'خطوات الرفع' : 'Upload Steps'}
                </h3>
                <ol className={`list-decimal ${isRTL ? 'list-inside' : 'ms-4'} space-y-2 text-sm sm:text-base`}>
                  <li className="text-start">
                    {isRTL
                      ? 'افتح تفاصيل الالتزام الذي يتطلب إثباتًا'
                      : 'Open the commitment details that requires proof'}
                  </li>
                  <li className="text-start">
                    {isRTL
                      ? 'انقر على زر "رفع دليل"'
                      : 'Click the "Upload Evidence" button'}
                  </li>
                  <li className="text-start">
                    {isRTL
                      ? 'على الجوال: اختر "التقاط صورة" أو "اختيار ملف"'
                      : 'On mobile: Choose "Take Photo" or "Choose File"'}
                  </li>
                  <li className="text-start">
                    {isRTL
                      ? 'انتظر اكتمال الرفع (ستظهر نسبة التقدم)'
                      : 'Wait for upload to complete (progress bar will show)'}
                  </li>
                  <li className="text-start">
                    {isRTL
                      ? 'سيتم تسجيل وقت الرفع تلقائيًا'
                      : 'Timestamp will be recorded automatically'}
                  </li>
                </ol>
              </div>

              <Separator />

              {/* Viewing Evidence */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-start">
                  {isRTL ? 'عرض الأدلة المرفوعة' : 'Viewing Uploaded Evidence'}
                </h3>
                <p className="text-sm sm:text-base text-start">
                  {isRTL
                    ? 'بعد الرفع، ستظهر الأدلة في تفاصيل الالتزام مع رابط تنزيل ووقت الرفع.'
                    : 'After upload, evidence appears in commitment details with a download link and upload timestamp.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links Footer */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-start">
                {isRTL ? 'هل تحتاج مساعدة إضافية؟' : 'Need more help?'}
              </h3>
              <p className="text-sm text-muted-foreground text-start">
                {isRTL
                  ? 'تواصل مع فريق الدعم أو عد إلى صفحة المساعدة الرئيسية'
                  : 'Contact support or go back to the main help page'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/help">
                <Button variant="outline" className="min-h-11">
                  {isRTL ? 'صفحة المساعدة' : 'Help Page'}
                </Button>
              </Link>
              <Link to="/commitments">
                <Button className="min-h-11">
                  {isRTL ? 'فتح الالتزامات' : 'Open Commitments'}
                  <ArrowRight className={`size-4 ${isRTL ? 'me-2 rotate-180' : 'ms-2'}`} />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components

function QuickNavCard({
  icon: Icon,
  title,
  description,
  onClick,
  isRTL
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  isRTL: boolean;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-start">{title}</h3>
            <p className="text-xs text-muted-foreground text-start">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AttributeCard({
  title,
  description,
  icon: Icon,
  isRTL
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  isRTL: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
      <Icon className="size-5 text-primary mt-0.5" />
      <div>
        <h4 className="font-medium text-sm text-start">{title}</h4>
        <p className="text-xs text-muted-foreground text-start">{description}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status, isRTL }: { status: string; isRTL: boolean }) {
  const statusConfig: Record<string, { label: string; arLabel: string; className: string }> = {
    pending: {
      label: 'Pending',
      arLabel: 'معلق',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    },
    in_progress: {
      label: 'In Progress',
      arLabel: 'قيد التنفيذ',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    completed: {
      label: 'Completed',
      arLabel: 'مكتمل',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge className={config.className}>
      {isRTL ? config.arLabel : config.label}
    </Badge>
  );
}

function FilterOptionCard({
  title,
  options,
  isRTL
}: {
  title: string;
  options: string[];
  isRTL: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <h4 className="font-medium text-sm mb-2 text-start">{title}</h4>
      <div className="flex flex-wrap gap-1">
        {options.map((option, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {option}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function FormatBadge({ format, color }: { format: string; color: string }) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  };

  return (
    <div className={`flex items-center justify-center p-4 rounded-lg ${colorClasses[color]}`}>
      <span className="font-mono font-bold">{format}</span>
    </div>
  );
}
