/**
 * Meeting Minutes Demo Page
 * Feature: meeting-minutes-capture
 *
 * Demo page for testing meeting minutes functionality.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Plus, Users, CheckSquare, Sparkles, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MeetingMinutesList, ActionItemsList, AttendeesList } from '@/components/meeting-minutes'
import type {
  MeetingActionItem,
  MeetingAttendee,
  ActionItemStatus,
  AttendanceStatus,
} from '@/types/meeting-minutes.types'

export const Route = createFileRoute('/_protected/meeting-minutes-demo')({
  component: MeetingMinutesDemo,
})

// Sample data for demo
const sampleAttendees: MeetingAttendee[] = [
  {
    id: '1',
    meeting_minutes_id: 'demo',
    attendee_type: 'user',
    name_en: 'Dr. Ahmed Al-Rashid',
    name_ar: 'د. أحمد الراشد',
    email: 'ahmed@example.com',
    title_en: 'Director',
    title_ar: 'مدير',
    organization_name_en: 'Ministry of Foreign Affairs',
    organization_name_ar: 'وزارة الخارجية',
    role: 'chair',
    attendance_status: 'present',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    meeting_minutes_id: 'demo',
    attendee_type: 'user',
    name_en: 'Sarah Johnson',
    name_ar: 'سارة جونسون',
    email: 'sarah@example.com',
    title_en: 'Senior Analyst',
    title_ar: 'محللة أولى',
    organization_name_en: 'Economic Research Institute',
    organization_name_ar: 'معهد البحوث الاقتصادية',
    role: 'presenter',
    attendance_status: 'present',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    meeting_minutes_id: 'demo',
    attendee_type: 'external_contact',
    name_en: 'Mohammed Al-Fahad',
    name_ar: 'محمد الفهد',
    email: 'mohammed@example.com',
    organization_name_en: 'OPEC',
    organization_name_ar: 'أوبك',
    role: 'attendee',
    attendance_status: 'remote',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    meeting_minutes_id: 'demo',
    attendee_type: 'user',
    name_en: 'Fatima Al-Saud',
    name_ar: 'فاطمة آل سعود',
    role: 'secretary',
    attendance_status: 'present',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const sampleActionItems: MeetingActionItem[] = [
  {
    id: '1',
    meeting_minutes_id: 'demo',
    title_en: 'Prepare quarterly economic report',
    title_ar: 'إعداد تقرير اقتصادي ربع سنوي',
    description_en:
      'Compile and analyze Q4 economic indicators and prepare comprehensive report for stakeholders.',
    assignee_type: 'user',
    assignee_name_en: 'Sarah Johnson',
    assignee_name_ar: 'سارة جونسون',
    priority: 'high',
    status: 'in_progress',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ai_extracted: false,
    auto_created_work_item: false,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    meeting_minutes_id: 'demo',
    title_en: 'Schedule follow-up meeting with OPEC delegation',
    title_ar: 'جدولة اجتماع متابعة مع وفد أوبك',
    assignee_type: 'user',
    assignee_name_en: 'Dr. Ahmed Al-Rashid',
    assignee_name_ar: 'د. أحمد الراشد',
    priority: 'medium',
    status: 'pending',
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    ai_extracted: true,
    ai_confidence: 0.87,
    source_text: 'Dr. Ahmed will schedule a follow-up meeting with the OPEC delegation next month.',
    auto_created_work_item: false,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    meeting_minutes_id: 'demo',
    title_en: 'Review and approve draft MOU',
    title_ar: 'مراجعة واعتماد مسودة مذكرة التفاهم',
    priority: 'urgent',
    status: 'pending',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    ai_extracted: true,
    ai_confidence: 0.92,
    linked_commitment_id: 'commitment-123',
    auto_created_work_item: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    meeting_minutes_id: 'demo',
    title_en: 'Send meeting notes to all participants',
    title_ar: 'إرسال ملاحظات الاجتماع لجميع المشاركين',
    assignee_type: 'user',
    assignee_name_en: 'Fatima Al-Saud',
    assignee_name_ar: 'فاطمة آل سعود',
    priority: 'low',
    status: 'completed',
    ai_extracted: false,
    auto_created_work_item: false,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function MeetingMinutesDemo() {
  const { t, i18n } = useTranslation('meeting-minutes')
  const isRTL = i18n.language === 'ar'

  const [attendees, setAttendees] = useState<MeetingAttendee[]>(sampleAttendees)
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>(sampleActionItems)
  const [extractText, setExtractText] = useState('')
  const [activeTab, setActiveTab] = useState('list')

  const handleUpdateAttendance = (attendee: MeetingAttendee, status: AttendanceStatus) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === attendee.id ? { ...a, attendance_status: status } : a)),
    )
  }

  const handleUpdateActionStatus = (item: MeetingActionItem, status: ActionItemStatus) => {
    setActionItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : undefined,
            }
          : i,
      ),
    )
  }

  const handleConvertToCommitment = (item: MeetingActionItem) => {
    // Demo: Mark as linked to commitment
    setActionItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, linked_commitment_id: `commitment-${Date.now()}`, auto_created_work_item: true }
          : i,
      ),
    )
    alert(t('messages.convertedToCommitment'))
  }

  const handleExtractActionItems = () => {
    if (!extractText.trim()) return

    // Simple extraction demo
    const lines = extractText.split('\n').filter((line) => line.trim())
    const newItems: MeetingActionItem[] = lines.map((line, index) => ({
      id: `extracted-${Date.now()}-${index}`,
      meeting_minutes_id: 'demo',
      title_en: line.trim(),
      priority: 'medium',
      status: 'pending',
      ai_extracted: true,
      ai_confidence: 0.75,
      source_text: extractText,
      auto_created_work_item: false,
      sort_order: actionItems.length + index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    setActionItems((prev) => [...prev, ...newItems])
    setExtractText('')
    alert(t('ai.extractionComplete', { count: newItems.length }))
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{attendees.length}</p>
                <p className="text-xs text-muted-foreground">{t('stats.attendees')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{actionItems.length}</p>
                <p className="text-xs text-muted-foreground">{t('stats.actionItems')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {actionItems.filter((i) => i.ai_extracted).length}
                </p>
                <p className="text-xs text-muted-foreground">{t('actionItems.aiExtracted')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mic className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">{t('stats.voiceMemos')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="list" className="min-h-10">
            {t('title')}
          </TabsTrigger>
          <TabsTrigger value="attendees" className="min-h-10">
            {t('attendees.title')}
          </TabsTrigger>
          <TabsTrigger value="actions" className="min-h-10">
            {t('actionItems.title')}
          </TabsTrigger>
          <TabsTrigger value="ai" className="min-h-10">
            {t('ai.title')}
          </TabsTrigger>
        </TabsList>

        {/* Meeting Minutes List Tab */}
        <TabsContent value="list">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <MeetingMinutesList
                onCreateNew={() => alert('Create new meeting minutes')}
                onSelectMinutes={(minutes) => alert(`Selected: ${minutes.title_en}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendees Tab */}
        <TabsContent value="attendees">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <AttendeesList
                attendees={attendees}
                minutesId="demo"
                onAddAttendee={() => alert('Add attendee modal')}
                onEditAttendee={(attendee) => alert(`Edit: ${attendee.name_en}`)}
                onRemoveAttendee={(attendee) => {
                  setAttendees((prev) => prev.filter((a) => a.id !== attendee.id))
                }}
                onUpdateAttendance={handleUpdateAttendance}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="actions">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <ActionItemsList
                items={actionItems}
                minutesId="demo"
                dossierId="demo-dossier"
                onAddItem={() => alert('Add action item modal')}
                onEditItem={(item) => alert(`Edit: ${item.title_en}`)}
                onDeleteItem={(item) => {
                  setActionItems((prev) => prev.filter((i) => i.id !== item.id))
                }}
                onUpdateStatus={handleUpdateActionStatus}
                onConvertToCommitment={handleConvertToCommitment}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Features Tab */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                {t('ai.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Extract Action Items */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{t('ai.extractActionItems')}</h4>
                <p className="text-sm text-muted-foreground">
                  Enter meeting notes or transcript text to extract action items automatically.
                </p>
                <Textarea
                  value={extractText}
                  onChange={(e) => setExtractText(e.target.value)}
                  placeholder="Enter meeting notes here...

Example:
- John will prepare the budget report by Friday
- Sarah needs to schedule a follow-up meeting
- Team should review the draft proposal"
                  className="min-h-[150px]"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleExtractActionItems}
                    disabled={!extractText.trim()}
                    className="min-h-11"
                  >
                    <Sparkles className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                    {t('ai.extractActionItems')}
                  </Button>
                  <Button variant="outline" className="min-h-11">
                    <Sparkles className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                    {t('ai.generateSummary')}
                  </Button>
                </div>
              </div>

              {/* AI Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">How AI Extraction Works</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Paste meeting notes or voice transcript text</li>
                  <li>AI identifies action items, assignees, and deadlines</li>
                  <li>Review extracted items and convert to commitments/tasks</li>
                  <li>AI confidence score indicates extraction reliability</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
