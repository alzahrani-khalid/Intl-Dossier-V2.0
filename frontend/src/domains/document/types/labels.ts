/**
 * Document Context - Label Constants
 *
 * Bilingual label constants for document types, categories,
 * classifications, and other enumerated values.
 */

import type { DocumentStatus, DocumentClassification, DocumentCategory } from './document'
import type { DocumentChangeType } from './version'

/**
 * Labels for document status
 */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, { en: string; ar: string }> = {
  active: { en: 'Active', ar: 'نشط' },
  archived: { en: 'Archived', ar: 'مؤرشف' },
  draft: { en: 'Draft', ar: 'مسودة' },
  pending_review: { en: 'Pending Review', ar: 'قيد المراجعة' },
}

/**
 * Labels for document classification
 */
export const DOCUMENT_CLASSIFICATION_LABELS: Record<
  DocumentClassification,
  { en: string; ar: string }
> = {
  public: { en: 'Public', ar: 'عام' },
  internal: { en: 'Internal', ar: 'داخلي' },
  confidential: { en: 'Confidential', ar: 'سري' },
  restricted: { en: 'Restricted', ar: 'مقيد' },
  secret: { en: 'Secret', ar: 'سري للغاية' },
}

/**
 * Labels for document category
 */
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, { en: string; ar: string }> = {
  agreement: { en: 'Agreement', ar: 'اتفاقية' },
  report: { en: 'Report', ar: 'تقرير' },
  correspondence: { en: 'Correspondence', ar: 'مراسلات' },
  presentation: { en: 'Presentation', ar: 'عرض تقديمي' },
  minutes: { en: 'Minutes', ar: 'محضر اجتماع' },
  policy: { en: 'Policy', ar: 'سياسة' },
  legal: { en: 'Legal', ar: 'قانوني' },
  financial: { en: 'Financial', ar: 'مالي' },
  technical: { en: 'Technical', ar: 'فني' },
  other: { en: 'Other', ar: 'أخرى' },
}

/**
 * Labels for document change type
 */
export const DOCUMENT_CHANGE_TYPE_LABELS: Record<DocumentChangeType, { en: string; ar: string }> = {
  initial: { en: 'Initial Upload', ar: 'رفع أولي' },
  update: { en: 'Update', ar: 'تحديث' },
  major_revision: { en: 'Major Revision', ar: 'تعديل رئيسي' },
  minor_edit: { en: 'Minor Edit', ar: 'تعديل طفيف' },
  revert: { en: 'Revert', ar: 'استعادة' },
}

/**
 * Get label for document status
 */
export function getDocumentStatusLabel(status: DocumentStatus, language: 'en' | 'ar'): string {
  return DOCUMENT_STATUS_LABELS[status]?.[language] || status
}

/**
 * Get label for document classification
 */
export function getDocumentClassificationLabel(
  classification: DocumentClassification,
  language: 'en' | 'ar',
): string {
  return DOCUMENT_CLASSIFICATION_LABELS[classification]?.[language] || classification
}

/**
 * Get label for document category
 */
export function getDocumentCategoryLabel(
  category: DocumentCategory,
  language: 'en' | 'ar',
): string {
  return DOCUMENT_CATEGORY_LABELS[category]?.[language] || category
}

/**
 * Get label for document change type
 */
export function getDocumentChangeTypeLabel(
  changeType: DocumentChangeType,
  language: 'en' | 'ar',
): string {
  return DOCUMENT_CHANGE_TYPE_LABELS[changeType]?.[language] || changeType
}

/**
 * Classification color classes (for badges)
 */
export const CLASSIFICATION_COLORS: Record<DocumentClassification, string> = {
  public: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  internal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  confidential: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  restricted: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  secret: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

/**
 * Status color classes (for badges)
 */
export const STATUS_COLORS: Record<DocumentStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  draft: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}
