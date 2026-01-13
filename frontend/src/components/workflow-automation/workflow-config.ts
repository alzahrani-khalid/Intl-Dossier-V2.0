/**
 * Workflow Automation Configuration
 * Static configuration data for triggers, actions, operators, and entity fields
 */

import type {
  TriggerTypeOption,
  ActionTypeOption,
  EntityTypeOption,
  ConditionOperatorOption,
  WorkflowTriggerType,
  WorkflowActionType,
  WorkflowEntityType,
  ConditionOperator,
} from '@/types/workflow-automation.types'

// =============================================================================
// Trigger Types Configuration
// =============================================================================

export const triggerTypes: TriggerTypeOption[] = [
  // Event Triggers
  {
    value: 'ticket_created',
    label_en: 'Ticket Created',
    label_ar: 'إنشاء تذكرة',
    description_en: 'When a new intake ticket is created',
    description_ar: 'عند إنشاء تذكرة استقبال جديدة',
    icon: 'Plus',
    category: 'event',
  },
  {
    value: 'ticket_updated',
    label_en: 'Ticket Updated',
    label_ar: 'تحديث تذكرة',
    description_en: 'When an intake ticket is updated',
    description_ar: 'عند تحديث تذكرة استقبال',
    icon: 'Edit',
    category: 'event',
  },
  {
    value: 'status_changed',
    label_en: 'Status Changed',
    label_ar: 'تغيير الحالة',
    description_en: 'When the status of an entity changes',
    description_ar: 'عند تغيير حالة كيان',
    icon: 'ArrowRightLeft',
    category: 'event',
  },
  {
    value: 'assignment_changed',
    label_en: 'Assignment Changed',
    label_ar: 'تغيير التعيين',
    description_en: 'When the assignee of an entity changes',
    description_ar: 'عند تغيير المعين لكيان',
    icon: 'UserCheck',
    category: 'event',
  },
  {
    value: 'priority_changed',
    label_en: 'Priority Changed',
    label_ar: 'تغيير الأولوية',
    description_en: 'When the priority of an entity changes',
    description_ar: 'عند تغيير أولوية كيان',
    icon: 'AlertTriangle',
    category: 'event',
  },
  {
    value: 'field_changed',
    label_en: 'Field Changed',
    label_ar: 'تغيير حقل',
    description_en: 'When a specific field value changes',
    description_ar: 'عند تغيير قيمة حقل محدد',
    icon: 'FileEdit',
    category: 'event',
  },
  {
    value: 'comment_added',
    label_en: 'Comment Added',
    label_ar: 'إضافة تعليق',
    description_en: 'When a new comment is added',
    description_ar: 'عند إضافة تعليق جديد',
    icon: 'MessageSquare',
    category: 'event',
  },
  {
    value: 'document_uploaded',
    label_en: 'Document Uploaded',
    label_ar: 'رفع مستند',
    description_en: 'When a document is uploaded',
    description_ar: 'عند رفع مستند',
    icon: 'Upload',
    category: 'event',
  },
  {
    value: 'engagement_created',
    label_en: 'Engagement Created',
    label_ar: 'إنشاء تفاعل',
    description_en: 'When a new engagement is created',
    description_ar: 'عند إنشاء تفاعل جديد',
    icon: 'Handshake',
    category: 'event',
  },
  {
    value: 'commitment_created',
    label_en: 'Commitment Created',
    label_ar: 'إنشاء التزام',
    description_en: 'When a new commitment is created',
    description_ar: 'عند إنشاء التزام جديد',
    icon: 'CheckSquare',
    category: 'event',
  },
  // Time-based Triggers
  {
    value: 'deadline_approaching',
    label_en: 'Deadline Approaching',
    label_ar: 'اقتراب الموعد النهائي',
    description_en: 'When a deadline is approaching',
    description_ar: 'عند اقتراب موعد نهائي',
    icon: 'Clock',
    category: 'time',
  },
  {
    value: 'deadline_overdue',
    label_en: 'Deadline Overdue',
    label_ar: 'تجاوز الموعد النهائي',
    description_en: 'When a deadline has passed',
    description_ar: 'عند تجاوز الموعد النهائي',
    icon: 'AlertCircle',
    category: 'time',
  },
  {
    value: 'commitment_due',
    label_en: 'Commitment Due',
    label_ar: 'استحقاق الالتزام',
    description_en: 'When a commitment deadline is reached',
    description_ar: 'عند الوصول إلى موعد استحقاق الالتزام',
    icon: 'CalendarClock',
    category: 'time',
  },
  {
    value: 'schedule_cron',
    label_en: 'Scheduled',
    label_ar: 'مجدول',
    description_en: 'Run on a schedule (cron expression)',
    description_ar: 'تشغيل وفق جدول زمني',
    icon: 'Calendar',
    category: 'time',
  },
  // Manual Trigger
  {
    value: 'manual',
    label_en: 'Manual',
    label_ar: 'يدوي',
    description_en: 'Triggered manually by user',
    description_ar: 'يتم تشغيله يدوياً بواسطة المستخدم',
    icon: 'Hand',
    category: 'manual',
  },
]

// =============================================================================
// Action Types Configuration
// =============================================================================

export const actionTypes: ActionTypeOption[] = [
  // Notification Actions
  {
    value: 'notify_user',
    label_en: 'Notify User',
    label_ar: 'إشعار مستخدم',
    description_en: 'Send notification to a specific user',
    description_ar: 'إرسال إشعار لمستخدم محدد',
    icon: 'Bell',
    category: 'notification',
    configFields: [
      { name: 'user_id', label_en: 'User', label_ar: 'المستخدم', type: 'user', required: true },
      { name: 'template', label_en: 'Template', label_ar: 'القالب', type: 'template' },
    ],
  },
  {
    value: 'notify_role',
    label_en: 'Notify Role',
    label_ar: 'إشعار دور',
    description_en: 'Send notification to all users with a role',
    description_ar: 'إرسال إشعار لجميع المستخدمين بدور معين',
    icon: 'Users',
    category: 'notification',
    configFields: [
      { name: 'role', label_en: 'Role', label_ar: 'الدور', type: 'role', required: true },
      { name: 'template', label_en: 'Template', label_ar: 'القالب', type: 'template' },
    ],
  },
  {
    value: 'notify_assignee',
    label_en: 'Notify Assignee',
    label_ar: 'إشعار المعين',
    description_en: 'Send notification to the current assignee',
    description_ar: 'إرسال إشعار للمعين الحالي',
    icon: 'UserCheck',
    category: 'notification',
    configFields: [
      { name: 'template', label_en: 'Template', label_ar: 'القالب', type: 'template' },
    ],
  },
  {
    value: 'send_email',
    label_en: 'Send Email',
    label_ar: 'إرسال بريد إلكتروني',
    description_en: 'Send an email notification',
    description_ar: 'إرسال إشعار بريد إلكتروني',
    icon: 'Mail',
    category: 'notification',
    configFields: [
      {
        name: 'to',
        label_en: 'To',
        label_ar: 'إلى',
        type: 'text',
        required: true,
        placeholder_en: 'Email address',
        placeholder_ar: 'عنوان البريد',
      },
      { name: 'template', label_en: 'Template', label_ar: 'القالب', type: 'template' },
    ],
  },
  // Assignment Actions
  {
    value: 'assign_user',
    label_en: 'Assign User',
    label_ar: 'تعيين مستخدم',
    description_en: 'Assign the entity to a specific user',
    description_ar: 'تعيين الكيان لمستخدم محدد',
    icon: 'UserPlus',
    category: 'assignment',
    configFields: [
      { name: 'user_id', label_en: 'User', label_ar: 'المستخدم', type: 'user', required: true },
      {
        name: 'notify',
        label_en: 'Send notification',
        label_ar: 'إرسال إشعار',
        type: 'select',
        options: [
          { value: 'true', label_en: 'Yes', label_ar: 'نعم' },
          { value: 'false', label_en: 'No', label_ar: 'لا' },
        ],
      },
    ],
  },
  {
    value: 'assign_role',
    label_en: 'Assign by Role',
    label_ar: 'تعيين بالدور',
    description_en: 'Assign to a user with a specific role',
    description_ar: 'تعيين لمستخدم بدور محدد',
    icon: 'UserCog',
    category: 'assignment',
    configFields: [
      { name: 'role', label_en: 'Role', label_ar: 'الدور', type: 'role', required: true },
      {
        name: 'strategy',
        label_en: 'Strategy',
        label_ar: 'الاستراتيجية',
        type: 'select',
        options: [
          { value: 'round_robin', label_en: 'Round Robin', label_ar: 'دوري' },
          { value: 'least_busy', label_en: 'Least Busy', label_ar: 'الأقل انشغالاً' },
          { value: 'random', label_en: 'Random', label_ar: 'عشوائي' },
        ],
      },
    ],
  },
  // Update Actions
  {
    value: 'update_status',
    label_en: 'Update Status',
    label_ar: 'تحديث الحالة',
    description_en: 'Change the status of the entity',
    description_ar: 'تغيير حالة الكيان',
    icon: 'RefreshCw',
    category: 'update',
    configFields: [
      { name: 'status', label_en: 'Status', label_ar: 'الحالة', type: 'status', required: true },
    ],
  },
  {
    value: 'update_priority',
    label_en: 'Update Priority',
    label_ar: 'تحديث الأولوية',
    description_en: 'Change the priority of the entity',
    description_ar: 'تغيير أولوية الكيان',
    icon: 'ArrowUpCircle',
    category: 'update',
    configFields: [
      {
        name: 'priority',
        label_en: 'Priority',
        label_ar: 'الأولوية',
        type: 'priority',
        required: true,
      },
    ],
  },
  {
    value: 'update_field',
    label_en: 'Update Field',
    label_ar: 'تحديث حقل',
    description_en: 'Update a field value on the entity',
    description_ar: 'تحديث قيمة حقل في الكيان',
    icon: 'Edit3',
    category: 'update',
    configFields: [
      { name: 'field', label_en: 'Field', label_ar: 'الحقل', type: 'text', required: true },
      { name: 'value', label_en: 'Value', label_ar: 'القيمة', type: 'text', required: true },
    ],
  },
  {
    value: 'add_tag',
    label_en: 'Add Tag',
    label_ar: 'إضافة وسم',
    description_en: 'Add a tag to the entity',
    description_ar: 'إضافة وسم للكيان',
    icon: 'Tag',
    category: 'update',
    configFields: [
      { name: 'tag_id', label_en: 'Tag', label_ar: 'الوسم', type: 'tag', required: true },
    ],
  },
  {
    value: 'remove_tag',
    label_en: 'Remove Tag',
    label_ar: 'إزالة وسم',
    description_en: 'Remove a tag from the entity',
    description_ar: 'إزالة وسم من الكيان',
    icon: 'TagOff',
    category: 'update',
    configFields: [
      { name: 'tag_id', label_en: 'Tag', label_ar: 'الوسم', type: 'tag', required: true },
    ],
  },
  // Create Actions
  {
    value: 'create_task',
    label_en: 'Create Task',
    label_ar: 'إنشاء مهمة',
    description_en: 'Create a follow-up task',
    description_ar: 'إنشاء مهمة متابعة',
    icon: 'ListPlus',
    category: 'create',
    configFields: [
      {
        name: 'title',
        label_en: 'Title',
        label_ar: 'العنوان',
        type: 'text',
        required: true,
        placeholder_en: 'Task title (supports {{variables}})',
        placeholder_ar: 'عنوان المهمة',
      },
      {
        name: 'description',
        label_en: 'Description',
        label_ar: 'الوصف',
        type: 'text',
        placeholder_en: 'Task description',
        placeholder_ar: 'وصف المهمة',
      },
      { name: 'priority', label_en: 'Priority', label_ar: 'الأولوية', type: 'priority' },
      { name: 'assignee_id', label_en: 'Assignee', label_ar: 'المعين', type: 'user' },
    ],
  },
  {
    value: 'create_comment',
    label_en: 'Create Comment',
    label_ar: 'إنشاء تعليق',
    description_en: 'Add a system comment',
    description_ar: 'إضافة تعليق نظام',
    icon: 'MessageSquarePlus',
    category: 'create',
    configFields: [
      {
        name: 'text',
        label_en: 'Comment',
        label_ar: 'التعليق',
        type: 'text',
        required: true,
        placeholder_en: 'Comment text (supports {{variables}})',
        placeholder_ar: 'نص التعليق',
      },
    ],
  },
  // External Actions
  {
    value: 'call_webhook',
    label_en: 'Call Webhook',
    label_ar: 'استدعاء ويب هوك',
    description_en: 'Call an external webhook',
    description_ar: 'استدعاء ويب هوك خارجي',
    icon: 'Webhook',
    category: 'external',
    configFields: [
      {
        name: 'webhook_id',
        label_en: 'Webhook',
        label_ar: 'الويب هوك',
        type: 'webhook',
        required: true,
      },
    ],
  },
  // Control Actions
  {
    value: 'delay',
    label_en: 'Delay',
    label_ar: 'تأخير',
    description_en: 'Wait before executing next action',
    description_ar: 'الانتظار قبل تنفيذ الإجراء التالي',
    icon: 'Timer',
    category: 'control',
    configFields: [
      {
        name: 'minutes',
        label_en: 'Minutes',
        label_ar: 'الدقائق',
        type: 'number',
        required: true,
        placeholder_en: 'Minutes to wait',
        placeholder_ar: 'دقائق الانتظار',
      },
    ],
  },
]

// =============================================================================
// Entity Types Configuration
// =============================================================================

export const entityTypes: EntityTypeOption[] = [
  {
    value: 'intake_ticket',
    label_en: 'Intake Ticket',
    label_ar: 'تذكرة استقبال',
    icon: 'Inbox',
    availableFields: [
      {
        name: 'status',
        label_en: 'Status',
        label_ar: 'الحالة',
        type: 'enum',
        operators: ['equals', 'not_equals', 'in_list', 'changed_to', 'changed_from'],
        enumValues: [
          { value: 'pending', label_en: 'Pending', label_ar: 'معلق' },
          { value: 'triaged', label_en: 'Triaged', label_ar: 'مفرز' },
          { value: 'in_progress', label_en: 'In Progress', label_ar: 'قيد التنفيذ' },
          { value: 'resolved', label_en: 'Resolved', label_ar: 'محلول' },
          { value: 'closed', label_en: 'Closed', label_ar: 'مغلق' },
        ],
      },
      {
        name: 'priority',
        label_en: 'Priority',
        label_ar: 'الأولوية',
        type: 'enum',
        operators: ['equals', 'not_equals', 'in_list', 'changed_to', 'changed_from'],
        enumValues: [
          { value: 'low', label_en: 'Low', label_ar: 'منخفضة' },
          { value: 'medium', label_en: 'Medium', label_ar: 'متوسطة' },
          { value: 'high', label_en: 'High', label_ar: 'عالية' },
          { value: 'urgent', label_en: 'Urgent', label_ar: 'عاجلة' },
        ],
      },
      {
        name: 'subject',
        label_en: 'Subject',
        label_ar: 'الموضوع',
        type: 'string',
        operators: [
          'equals',
          'not_equals',
          'contains',
          'not_contains',
          'starts_with',
          'ends_with',
          'is_empty',
          'is_not_empty',
        ],
      },
      {
        name: 'assignee_id',
        label_en: 'Assignee',
        label_ar: 'المعين',
        type: 'string',
        operators: ['equals', 'not_equals', 'is_empty', 'is_not_empty', 'has_changed'],
      },
      {
        name: 'request_type',
        label_en: 'Request Type',
        label_ar: 'نوع الطلب',
        type: 'string',
        operators: ['equals', 'not_equals', 'in_list'],
      },
    ],
  },
  {
    value: 'engagement',
    label_en: 'Engagement',
    label_ar: 'تفاعل',
    icon: 'Handshake',
    availableFields: [
      {
        name: 'status',
        label_en: 'Status',
        label_ar: 'الحالة',
        type: 'enum',
        operators: ['equals', 'not_equals', 'in_list', 'changed_to', 'changed_from'],
        enumValues: [
          { value: 'draft', label_en: 'Draft', label_ar: 'مسودة' },
          { value: 'scheduled', label_en: 'Scheduled', label_ar: 'مجدول' },
          { value: 'in_progress', label_en: 'In Progress', label_ar: 'قيد التنفيذ' },
          { value: 'completed', label_en: 'Completed', label_ar: 'مكتمل' },
          { value: 'cancelled', label_en: 'Cancelled', label_ar: 'ملغى' },
        ],
      },
      {
        name: 'engagement_type',
        label_en: 'Type',
        label_ar: 'النوع',
        type: 'string',
        operators: ['equals', 'not_equals', 'in_list'],
      },
      {
        name: 'title',
        label_en: 'Title',
        label_ar: 'العنوان',
        type: 'string',
        operators: ['contains', 'not_contains', 'starts_with', 'ends_with'],
      },
    ],
  },
  {
    value: 'commitment',
    label_en: 'Commitment',
    label_ar: 'التزام',
    icon: 'CheckSquare',
    availableFields: [
      {
        name: 'status',
        label_en: 'Status',
        label_ar: 'الحالة',
        type: 'enum',
        operators: ['equals', 'not_equals', 'in_list', 'changed_to', 'changed_from'],
        enumValues: [
          { value: 'pending', label_en: 'Pending', label_ar: 'معلق' },
          { value: 'in_progress', label_en: 'In Progress', label_ar: 'قيد التنفيذ' },
          { value: 'completed', label_en: 'Completed', label_ar: 'مكتمل' },
          { value: 'overdue', label_en: 'Overdue', label_ar: 'متأخر' },
        ],
      },
      {
        name: 'priority',
        label_en: 'Priority',
        label_ar: 'الأولوية',
        type: 'enum',
        operators: ['equals', 'not_equals', 'in_list'],
        enumValues: [
          { value: 'low', label_en: 'Low', label_ar: 'منخفضة' },
          { value: 'medium', label_en: 'Medium', label_ar: 'متوسطة' },
          { value: 'high', label_en: 'High', label_ar: 'عالية' },
          { value: 'urgent', label_en: 'Urgent', label_ar: 'عاجلة' },
        ],
      },
      {
        name: 'commitment_type',
        label_en: 'Type',
        label_ar: 'النوع',
        type: 'enum',
        operators: ['equals', 'not_equals'],
        enumValues: [
          { value: 'internal', label_en: 'Internal', label_ar: 'داخلي' },
          { value: 'external', label_en: 'External', label_ar: 'خارجي' },
        ],
      },
    ],
  },
  {
    value: 'task',
    label_en: 'Task',
    label_ar: 'مهمة',
    icon: 'CheckCircle',
    availableFields: [
      {
        name: 'status',
        label_en: 'Status',
        label_ar: 'الحالة',
        type: 'enum',
        operators: ['equals', 'not_equals', 'in_list', 'changed_to', 'changed_from'],
        enumValues: [
          { value: 'pending', label_en: 'Pending', label_ar: 'معلق' },
          { value: 'in_progress', label_en: 'In Progress', label_ar: 'قيد التنفيذ' },
          { value: 'review', label_en: 'Review', label_ar: 'مراجعة' },
          { value: 'completed', label_en: 'Completed', label_ar: 'مكتمل' },
          { value: 'cancelled', label_en: 'Cancelled', label_ar: 'ملغى' },
        ],
      },
      {
        name: 'priority',
        label_en: 'Priority',
        label_ar: 'الأولوية',
        type: 'enum',
        operators: ['equals', 'not_equals', 'in_list'],
        enumValues: [
          { value: 'low', label_en: 'Low', label_ar: 'منخفضة' },
          { value: 'medium', label_en: 'Medium', label_ar: 'متوسطة' },
          { value: 'high', label_en: 'High', label_ar: 'عالية' },
          { value: 'urgent', label_en: 'Urgent', label_ar: 'عاجلة' },
        ],
      },
      {
        name: 'title',
        label_en: 'Title',
        label_ar: 'العنوان',
        type: 'string',
        operators: ['contains', 'not_contains', 'starts_with', 'ends_with'],
      },
    ],
  },
  {
    value: 'dossier',
    label_en: 'Dossier',
    label_ar: 'ملف',
    icon: 'FolderOpen',
    availableFields: [
      {
        name: 'dossier_type',
        label_en: 'Type',
        label_ar: 'النوع',
        type: 'string',
        operators: ['equals', 'not_equals', 'in_list'],
      },
      {
        name: 'name_en',
        label_en: 'Name',
        label_ar: 'الاسم',
        type: 'string',
        operators: ['contains', 'not_contains', 'starts_with', 'ends_with'],
      },
    ],
  },
  {
    value: 'position',
    label_en: 'Position',
    label_ar: 'منصب',
    icon: 'Briefcase',
    availableFields: [
      {
        name: 'title_en',
        label_en: 'Title',
        label_ar: 'اللقب',
        type: 'string',
        operators: ['contains', 'not_contains', 'starts_with', 'ends_with'],
      },
    ],
  },
  {
    value: 'document',
    label_en: 'Document',
    label_ar: 'مستند',
    icon: 'FileText',
    availableFields: [
      {
        name: 'document_type',
        label_en: 'Type',
        label_ar: 'النوع',
        type: 'string',
        operators: ['equals', 'not_equals', 'in_list'],
      },
      {
        name: 'title',
        label_en: 'Title',
        label_ar: 'العنوان',
        type: 'string',
        operators: ['contains', 'not_contains', 'starts_with', 'ends_with'],
      },
    ],
  },
  {
    value: 'calendar_entry',
    label_en: 'Calendar Entry',
    label_ar: 'إدخال تقويم',
    icon: 'Calendar',
    availableFields: [
      {
        name: 'event_type',
        label_en: 'Event Type',
        label_ar: 'نوع الحدث',
        type: 'string',
        operators: ['equals', 'not_equals', 'in_list'],
      },
      {
        name: 'title',
        label_en: 'Title',
        label_ar: 'العنوان',
        type: 'string',
        operators: ['contains', 'not_contains', 'starts_with', 'ends_with'],
      },
    ],
  },
]

// =============================================================================
// Condition Operators Configuration
// =============================================================================

export const conditionOperators: ConditionOperatorOption[] = [
  {
    value: 'equals',
    label_en: 'Equals',
    label_ar: 'يساوي',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'not_equals',
    label_en: 'Not Equals',
    label_ar: 'لا يساوي',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'contains',
    label_en: 'Contains',
    label_ar: 'يحتوي على',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'not_contains',
    label_en: 'Does Not Contain',
    label_ar: 'لا يحتوي على',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'starts_with',
    label_en: 'Starts With',
    label_ar: 'يبدأ بـ',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'ends_with',
    label_en: 'Ends With',
    label_ar: 'ينتهي بـ',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'greater_than',
    label_en: 'Greater Than',
    label_ar: 'أكبر من',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'less_than',
    label_en: 'Less Than',
    label_ar: 'أصغر من',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'greater_than_or_equal',
    label_en: 'Greater Than or Equal',
    label_ar: 'أكبر من أو يساوي',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'less_than_or_equal',
    label_en: 'Less Than or Equal',
    label_ar: 'أصغر من أو يساوي',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'is_empty',
    label_en: 'Is Empty',
    label_ar: 'فارغ',
    requiresValue: false,
    valueType: 'none',
  },
  {
    value: 'is_not_empty',
    label_en: 'Is Not Empty',
    label_ar: 'غير فارغ',
    requiresValue: false,
    valueType: 'none',
  },
  {
    value: 'in_list',
    label_en: 'In List',
    label_ar: 'في القائمة',
    requiresValue: true,
    valueType: 'list',
  },
  {
    value: 'not_in_list',
    label_en: 'Not In List',
    label_ar: 'ليس في القائمة',
    requiresValue: true,
    valueType: 'list',
  },
  {
    value: 'between',
    label_en: 'Between',
    label_ar: 'بين',
    requiresValue: true,
    valueType: 'range',
  },
  {
    value: 'changed_to',
    label_en: 'Changed To',
    label_ar: 'تغير إلى',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'changed_from',
    label_en: 'Changed From',
    label_ar: 'تغير من',
    requiresValue: true,
    valueType: 'single',
  },
  {
    value: 'has_changed',
    label_en: 'Has Changed',
    label_ar: 'تم تغييره',
    requiresValue: false,
    valueType: 'none',
  },
]

// =============================================================================
// Helper Functions
// =============================================================================

export function getTriggerTypeOption(value: WorkflowTriggerType): TriggerTypeOption | undefined {
  return triggerTypes.find((t) => t.value === value)
}

export function getActionTypeOption(value: WorkflowActionType): ActionTypeOption | undefined {
  return actionTypes.find((a) => a.value === value)
}

export function getEntityTypeOption(value: WorkflowEntityType): EntityTypeOption | undefined {
  return entityTypes.find((e) => e.value === value)
}

export function getConditionOperatorOption(
  value: ConditionOperator,
): ConditionOperatorOption | undefined {
  return conditionOperators.find((o) => o.value === value)
}

export function getTriggersByCategory(category: 'event' | 'time' | 'manual'): TriggerTypeOption[] {
  return triggerTypes.filter((t) => t.category === category)
}

export function getActionsByCategory(category: string): ActionTypeOption[] {
  return actionTypes.filter((a) => a.category === category)
}

export function getEntityFields(entityType: WorkflowEntityType) {
  return entityTypes.find((e) => e.value === entityType)?.availableFields || []
}

export function getFieldOperators(
  entityType: WorkflowEntityType,
  fieldName: string,
): ConditionOperatorOption[] {
  const entity = entityTypes.find((e) => e.value === entityType)
  const field = entity?.availableFields.find((f) => f.name === fieldName)
  if (!field) return conditionOperators
  return conditionOperators.filter((o) => field.operators.includes(o.value))
}
