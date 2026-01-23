import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Book,
  FileText,
  Mail,
  Phone,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Target,
  ChevronRight,
  Users,
  Calendar,
  LayoutDashboard,
  Globe,
  Briefcase,
  ListTodo,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

/**
 * HelpPage Component - Redesigned
 *
 * Modern help center with:
 * - Hero section with search
 * - Feature guides navigation grid
 * - Quick FAQ section
 * - Contact support cards
 * - Mobile-first responsive design
 * - RTL support for Arabic
 */
export function HelpPage() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [searchQuery, setSearchQuery] = useState('')

  // Feature guides configuration - easy to add new guides
  const featureGuides = [
    {
      id: 'commitments',
      title: isRTL ? 'إدارة الالتزامات' : 'Commitments',
      description: isRTL
        ? 'إنشاء وتتبع الالتزامات المرتبطة بالملفات'
        : 'Create and track dossier obligations',
      icon: Target,
      href: '/help/commitments',
      color: 'bg-blue-500',
      badge: isRTL ? 'جديد' : 'New',
    },
    {
      id: 'dossiers',
      title: isRTL ? 'الملفات' : 'Dossiers',
      description: isRTL ? 'إدارة ملفات الدول والمنظمات' : 'Manage country & organization files',
      icon: FileText,
      href: '/help/dossiers',
      color: 'bg-emerald-500',
      comingSoon: true,
    },
    {
      id: 'tasks',
      title: isRTL ? 'المهام' : 'Tasks & Workflows',
      description: isRTL ? 'إدارة المهام وسير العمل' : 'Manage assignments and workflows',
      icon: ListTodo,
      href: '/help/tasks',
      color: 'bg-orange-500',
      comingSoon: true,
    },
    {
      id: 'calendar',
      title: isRTL ? 'التقويم' : 'Calendar',
      description: isRTL ? 'جدولة وتتبع الأحداث' : 'Schedule and track events',
      icon: Calendar,
      href: '/help/calendar',
      color: 'bg-purple-500',
      comingSoon: true,
    },
    {
      id: 'contacts',
      title: isRTL ? 'جهات الاتصال' : 'Contacts',
      description: isRTL ? 'إدارة جهات الاتصال الخارجية' : 'Manage external contacts',
      icon: Users,
      href: '/help/contacts',
      color: 'bg-pink-500',
      comingSoon: true,
    },
    {
      id: 'analytics',
      title: isRTL ? 'التحليلات' : 'Analytics',
      description: isRTL ? 'عرض التقارير والإحصائيات' : 'View reports and statistics',
      icon: LayoutDashboard,
      href: '/help/analytics',
      color: 'bg-cyan-500',
      comingSoon: true,
    },
  ]

  // Quick FAQ items
  const quickFAQ = [
    {
      id: 'getting-started',
      question: isRTL ? 'كيف أبدأ باستخدام النظام؟' : 'How do I get started?',
      answer: isRTL
        ? 'ابدأ بإنشاء ملف جديد من صفحة الملفات، ثم أضف المعلومات والالتزامات والمستندات المرتبطة.'
        : 'Start by creating a new dossier from the Dossiers page, then add related information, commitments, and documents.',
      icon: Lightbulb,
    },
    {
      id: 'roles',
      question: isRTL ? 'ما هي الأدوار المتاحة؟' : 'What user roles are available?',
      answer: isRTL
        ? 'هناك أربعة أدوار رئيسية: مدير النظام (وصول كامل)، المدير (إدارة الفريق)، الموظف (إنشاء/تعديل)، والمشاهد (قراءة فقط).'
        : 'Four main roles: Admin (full access), Manager (team management), Staff (create/edit), and Viewer (read-only).',
      icon: Users,
    },
    {
      id: 'dossier',
      question: isRTL ? 'ما هو الملف؟' : 'What is a dossier?',
      answer: isRTL
        ? 'الملف هو سجل شامل للكيانات الدبلوماسية مثل الدول والمنظمات والمنتديات. يجمع جميع المعلومات ذات الصلة في مكان واحد.'
        : 'A dossier is a comprehensive record for diplomatic entities like countries, organizations, and forums. It centralizes all related information.',
      icon: FileText,
    },
    {
      id: 'commitment',
      question: isRTL ? 'ما هو الالتزام؟' : 'What is a commitment?',
      answer: isRTL
        ? 'الالتزام هو تعهد أو مهمة مرتبطة بملف. يمكن أن يكون مهمة داخلية أو التزام خارجي يحتاج للمتابعة.'
        : 'A commitment is a tracked obligation linked to a dossier. It can be an internal task or external obligation requiring follow-up.',
      icon: Target,
    },
    {
      id: 'password',
      question: isRTL ? 'كيف أعيد تعيين كلمة المرور؟' : 'How do I reset my password?',
      answer: isRTL
        ? 'انقر على ملفك الشخصي، اختر "الإعدادات"، ثم انتقل إلى تبويب "الأمان" وانقر على "تغيير كلمة المرور".'
        : 'Click your profile, select "Settings", go to the "Security" tab, and click "Change Password".',
      icon: AlertCircle,
    },
  ]

  // Filter FAQ based on search
  const filteredFAQ = quickFAQ.filter(
    (item) =>
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Hero Section */}
      <div className="border-b bg-primary/5">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
              <Sparkles className="size-4" />
              <span className="text-sm font-medium">{isRTL ? 'مركز المساعدة' : 'Help Center'}</span>
            </div>
            <h1 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              {isRTL ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              {isRTL
                ? 'ابحث في المقالات أو تصفح الأدلة أدناه'
                : 'Search articles or browse guides below'}
            </p>

            {/* Search Bar */}
            <div className="relative mx-auto max-w-xl">
              <Search
                className={`absolute top-1/2 size-5 -translate-y-1/2 text-muted-foreground ${isRTL ? 'end-4' : 'start-4'}`}
              />
              <Input
                type="search"
                placeholder={isRTL ? 'ابحث عن المساعدة...' : 'Search for help...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-14 rounded-full border-2 text-lg ${isRTL ? 'pe-12 ps-4' : 'pe-4 ps-12'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Feature Guides Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-start text-2xl font-bold">
                {isRTL ? 'أدلة الميزات' : 'Feature Guides'}
              </h2>
              <p className="text-start text-muted-foreground">
                {isRTL ? 'تعلم كيفية استخدام كل ميزة' : 'Learn how to use each feature'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {featureGuides.map((guide) => (
              <FeatureGuideCard key={guide.id} guide={guide} isRTL={isRTL} />
            ))}
          </div>
        </section>

        <Separator className="my-8" />

        {/* Two Column Layout: FAQ + Support */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* FAQ Section - Takes 2 columns */}
          <section className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-2">
              <HelpCircle className="size-6 text-primary" />
              <h2 className="text-start text-2xl font-bold">
                {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
              </h2>
            </div>

            {filteredFAQ.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {isRTL ? 'لم يتم العثور على نتائج' : 'No results found matching your search'}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFAQ.map((item, index) => {
                      const Icon = item.icon
                      return (
                        <AccordionItem key={item.id} value={item.id}>
                          <AccordionTrigger className="text-start hover:no-underline">
                            <span className="flex items-center gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="size-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium sm:text-base">
                                {item.question}
                              </span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="ps-11 text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* View All FAQ Link */}
            <div className="mt-4 text-center">
              <Button variant="ghost" className="gap-2">
                {isRTL ? 'عرض جميع الأسئلة' : 'View all questions'}
                <ArrowRight className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </section>

          {/* Support Section - Takes 1 column */}
          <section>
            <div className="mb-6 flex items-center gap-2">
              <Phone className="size-6 text-primary" />
              <h2 className="text-start text-2xl font-bold">
                {isRTL ? 'تواصل معنا' : 'Contact Support'}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Email Support Card */}
              <Card className="border-2 transition-colors hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
                      <Mail className="size-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-start font-semibold">
                        {isRTL ? 'البريد الإلكتروني' : 'Email Support'}
                      </h3>
                      <p className="truncate text-start text-sm text-muted-foreground">
                        support@gastat.gov.sa
                      </p>
                      <Button variant="link" className="mt-1 h-auto p-0">
                        {isRTL ? 'إرسال رسالة' : 'Send message'}
                        <ChevronRight className={`ms-1 size-4 ${isRTL ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phone Support Card */}
              <Card className="border-2 transition-colors hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900">
                      <Phone className="size-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-start font-semibold">
                        {isRTL ? 'الدعم الهاتفي' : 'Phone Support'}
                      </h3>
                      <p className="text-start text-sm text-muted-foreground" dir="ltr">
                        +966 11 123 4567
                      </p>
                      <Button variant="link" className="mt-1 h-auto p-0">
                        {isRTL ? 'اتصل الآن' : 'Call now'}
                        <ChevronRight className={`ms-1 size-4 ${isRTL ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Hours */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="mb-1 text-sm font-medium">
                      {isRTL ? 'ساعات العمل' : 'Support Hours'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'الأحد - الخميس' : 'Sunday - Thursday'}
                    </p>
                    <p className="text-sm text-muted-foreground">8:00 AM - 4:00 PM (GMT+3)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <Separator className="my-8" />

        {/* Additional Resources */}
        <section>
          <h2 className="mb-6 text-start text-2xl font-bold">
            {isRTL ? 'موارد إضافية' : 'Additional Resources'}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ResourceCard
              icon={Book}
              title={isRTL ? 'دليل المستخدم' : 'User Guide'}
              description={isRTL ? 'دليل شامل للنظام' : 'Comprehensive system guide'}
              isRTL={isRTL}
            />
            <ResourceCard
              icon={Briefcase}
              title={isRTL ? 'دليل المدير' : 'Admin Guide'}
              description={isRTL ? 'إدارة النظام والمستخدمين' : 'System & user management'}
              isRTL={isRTL}
            />
            <ResourceCard
              icon={Globe}
              title={isRTL ? 'توثيق API' : 'API Documentation'}
              description={isRTL ? 'للمطورين والتكامل' : 'For developers & integration'}
              isRTL={isRTL}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

// Feature Guide Card Component
function FeatureGuideCard({
  guide,
  isRTL,
}: {
  guide: {
    id: string
    title: string
    description: string
    icon: React.ElementType
    href: string
    color: string
    badge?: string
    comingSoon?: boolean
  }
  isRTL: boolean
}) {
  const Icon = guide.icon

  const cardContent = (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 ${
        guide.comingSoon
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-primary/50 hover:shadow-lg'
      }`}
    >
      {/* Color accent bar */}
      <div className={`absolute top-0 ${isRTL ? 'end-0' : 'start-0'} h-full w-1 ${guide.color}`} />

      <CardContent className="ps-5 pt-6">
        <div className="flex items-start gap-4">
          <div
            className={`size-12 rounded-xl ${guide.color} flex shrink-0 items-center justify-center bg-opacity-10 transition-transform group-hover:scale-110`}
          >
            <Icon className={`size-6 ${guide.color.replace('bg-', 'text-')}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-start font-semibold">{guide.title}</h3>
              {guide.badge && (
                <Badge variant="secondary" className="text-xs">
                  {guide.badge}
                </Badge>
              )}
              {guide.comingSoon && (
                <Badge variant="outline" className="text-xs">
                  {isRTL ? 'قريبًا' : 'Coming Soon'}
                </Badge>
              )}
            </div>
            <p className="line-clamp-2 text-start text-sm text-muted-foreground">
              {guide.description}
            </p>
          </div>
          {!guide.comingSoon && (
            <ChevronRight
              className={`size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary ${
                isRTL ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (guide.comingSoon) {
    return cardContent
  }

  return <Link to={guide.href}>{cardContent}</Link>
}

// Resource Card Component
function ResourceCard({
  icon: Icon,
  title,
  description,
  isRTL,
}: {
  icon: React.ElementType
  title: string
  description: string
  isRTL: boolean
}) {
  return (
    <Card className="group cursor-pointer transition-shadow hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
            <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-start text-sm font-medium">{title}</h3>
            <p className="text-start text-xs text-muted-foreground">{description}</p>
          </div>
          <ExternalLink className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
