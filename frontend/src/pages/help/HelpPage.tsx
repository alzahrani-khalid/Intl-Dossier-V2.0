import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Book,
  Video,
  FileText,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

/**
 * HelpPage Component
 *
 * Comprehensive help and documentation page with:
 * - Searchable FAQ
 * - Getting Started guide
 * - Video tutorials
 * - Documentation links
 * - Contact support options
 * - Mobile-first responsive design
 * - RTL support
 */
export function HelpPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');

  // FAQ data structure (replace with actual FAQ from backend)
  const faqCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Lightbulb,
      questions: [
        {
          question: 'How do I create my first dossier?',
          answer: 'Navigate to the Dossiers page from the sidebar, click the "Create New" button, select the dossier type (Country, Organization, Forum, etc.), and fill in the required information.',
        },
        {
          question: 'How do I navigate the dashboard?',
          answer: 'The dashboard provides an overview of your work. You can see recent activities, upcoming events, pending tasks, and key metrics. Use the sidebar to navigate to different sections.',
        },
        {
          question: 'What are the different user roles?',
          answer: 'The system has four main roles: Admin (full system access), Manager (team management), Staff (content creation/editing), and Viewer (read-only access).',
        },
      ],
    },
    {
      id: 'dossiers',
      title: 'Dossiers & Entities',
      icon: FileText,
      questions: [
        {
          question: 'What is a dossier?',
          answer: 'A dossier is a comprehensive record for diplomatic entities like countries, organizations, forums, engagements, themes, working groups, or persons. It centralizes all related information.',
        },
        {
          question: 'How do I link relationships between dossiers?',
          answer: 'Open a dossier, go to the Relationships tab, click "Add Relationship", select the target dossier, choose the relationship type, and save.',
        },
        {
          question: 'Can I add documents to a dossier?',
          answer: 'Yes! Navigate to the Documents tab within any dossier and click "Upload Document". You can attach files, add descriptions, and organize them by category.',
        },
      ],
    },
    {
      id: 'tasks',
      title: 'Tasks & Workflows',
      icon: CheckCircle2,
      questions: [
        {
          question: 'How do I view my assigned tasks?',
          answer: 'Click on "My Work" in the sidebar, then select "My Assignments" to see all tasks assigned to you. You can filter by status, priority, or due date.',
        },
        {
          question: 'What is the intake queue?',
          answer: 'The intake queue is where new requests and tickets are managed before being processed. Authorized users can review, assign, and process these items.',
        },
        {
          question: 'How do I escalate a task?',
          answer: 'Open the task details, click the "Actions" menu, and select "Escalate". Provide a reason and select the escalation level.',
        },
      ],
    },
    {
      id: 'calendar',
      title: 'Calendar & Events',
      icon: Book,
      questions: [
        {
          question: 'How do I create a calendar event?',
          answer: 'Navigate to the Calendar page, click on a date or the "New Event" button, fill in the event details, and optionally link it to relevant dossiers.',
        },
        {
          question: 'Can I link events to dossiers?',
          answer: 'Yes! When creating or editing an event, use the "Link to Dossier" field to associate the event with one or more dossiers.',
        },
      ],
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: AlertCircle,
      questions: [
        {
          question: 'I can\'t see certain menu items',
          answer: 'Some features are role-restricted. If you believe you should have access, contact your system administrator.',
        },
        {
          question: 'My changes aren\'t saving',
          answer: 'Check your internet connection and ensure all required fields are filled. If the problem persists, refresh the page and try again.',
        },
        {
          question: 'How do I reset my password?',
          answer: 'Click on your profile in the sidebar, select "Settings", then go to the "Security" tab. Click "Change Password" and follow the instructions.',
        },
      ],
    },
  ];

  const filteredCategories = faqCategories.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        !searchQuery ||
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2">
          Help & Documentation
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground text-start">
          Find answers, tutorials, and support for using the GASTAT Dossier System
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search
              className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`}
            />
            <Input
              type="search"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`min-h-11 ${isRTL ? 'pr-10' : 'pl-10'}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
          <TabsTrigger value="faq" className="min-h-10">
            <HelpCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="min-h-10">
            <Video className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span className="hidden sm:inline">Tutorials</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="min-h-10">
            <Book className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="min-h-10">
            <MessageCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No help articles found matching your search.
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex flex-row items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg text-start">{category.title}</CardTitle>
                        <CardDescription className="text-start">
                          {category.questions.length} article{category.questions.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((q, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-start text-sm sm:text-base">
                            {q.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm sm:text-base text-muted-foreground">
                            {q.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-start">Video Tutorials</CardTitle>
              <CardDescription className="text-start">
                Step-by-step video guides to help you get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-12 text-muted-foreground">
                Video tutorials coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-start">Documentation</CardTitle>
              <CardDescription className="text-start">
                Comprehensive guides and API documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className={`w-full justify-between min-h-11 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <span className="flex flex-row items-center gap-2">
                  <FileText className="h-4 w-4" />
                  User Guide
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className={`w-full justify-between min-h-11 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <span className="flex flex-row items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Administrator Guide
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className={`w-full justify-between min-h-11 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <span className="flex flex-row items-center gap-2">
                  <FileText className="h-4 w-4" />
                  API Documentation
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-start">Contact Support</CardTitle>
              <CardDescription className="text-start">
                Get help from our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-2">
                  <CardContent className="pt-6 text-center space-y-3">
                    <Mail className="h-8 w-8 mx-auto text-primary" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-muted-foreground">support@gastat.gov.sa</p>
                    </div>
                    <Button variant="outline" className="w-full min-h-10">
                      Send Email
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6 text-center space-y-3">
                    <Phone className="h-8 w-8 mx-auto text-primary" />
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-muted-foreground">+966 11 123 4567</p>
                    </div>
                    <Button variant="outline" className="w-full min-h-10">
                      Call Now
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  <strong>Support Hours:</strong> Sunday - Thursday, 8:00 AM - 4:00 PM (GMT+3)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
