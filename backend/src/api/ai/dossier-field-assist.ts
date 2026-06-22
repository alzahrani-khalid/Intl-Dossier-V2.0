/**
 * Dossier Field Assist API Endpoint
 *
 * Generates bilingual (EN/AR) field values for dossier creation.
 *
 * Phase 74 (D3 / EVAL-04): the external-LLM generator is removed.
 * This endpoint now uses the deterministic, rule-based `generateFallbackFields`
 * extractor — zero-egress, no service-role. (AI-assisted entity extraction lives
 * in the on-prem copilot surfaces.)
 *
 * POST /api/ai/dossier-field-assist
 * {
 *   dossier_type: string
 *   description: string
 *   language?: 'en' | 'ar'
 * }
 */

import { Router, Request, Response } from 'express'
import logger from '../../utils/logger.js'

const router = Router()

// Valid dossier types
const VALID_DOSSIER_TYPES = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
] as const

type DossierType = (typeof VALID_DOSSIER_TYPES)[number]

interface GeneratedFields {
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  suggested_tags: string[]
}

// Type-specific context for better AI generation
const TYPE_CONTEXT: Record<DossierType, { en: string; ar: string; suggestedTags: string[] }> = {
  country: {
    en: 'a country dossier for tracking bilateral relations, diplomatic ties, and country-specific information',
    ar: 'ملف دولة لتتبع العلاقات الثنائية والروابط الدبلوماسية والمعلومات الخاصة بالدولة',
    suggestedTags: ['bilateral', 'diplomatic', 'relations'],
  },
  organization: {
    en: 'an organization dossier for tracking international bodies, agencies, or partner institutions',
    ar: 'ملف منظمة لتتبع الهيئات الدولية أو الوكالات أو المؤسسات الشريكة',
    suggestedTags: ['organization', 'partnership', 'institutional'],
  },
  forum: {
    en: 'a forum dossier for tracking multilateral conferences, summits, and recurring events',
    ar: 'ملف منتدى لتتبع المؤتمرات متعددة الأطراف والقمم والفعاليات المتكررة',
    suggestedTags: ['forum', 'multilateral', 'conference'],
  },
  engagement: {
    en: 'an engagement dossier for tracking specific meetings, visits, or diplomatic events',
    ar: 'ملف مشاركة لتتبع اجتماعات أو زيارات أو فعاليات دبلوماسية محددة',
    suggestedTags: ['engagement', 'meeting', 'event'],
  },
  topic: {
    en: 'a topic dossier for tracking policy areas, thematic briefs, or strategic initiatives',
    ar: 'ملف موضوع لتتبع مجالات السياسة أو الإحاطات الموضوعية أو المبادرات الاستراتيجية',
    suggestedTags: ['topic', 'policy', 'thematic'],
  },
  working_group: {
    en: 'a working group dossier for tracking committees, task forces, or collaborative bodies',
    ar: 'ملف مجموعة عمل لتتبع اللجان أو فرق العمل أو الهيئات التعاونية',
    suggestedTags: ['working-group', 'committee', 'coordination'],
  },
  person: {
    en: 'a person dossier for tracking VIPs, officials, or key stakeholders',
    ar: 'ملف شخص لتتبع كبار الشخصيات أو المسؤولين أو أصحاب المصلحة الرئيسيين',
    suggestedTags: ['person', 'contact', 'stakeholder'],
  },
}

/**
 * Generate fallback fields when AI is unavailable
 */
function generateFallbackFields(dossierType: DossierType, description: string): GeneratedFields {
  const context = TYPE_CONTEXT[dossierType]
  const isArabic = /[\u0600-\u06FF]/.test(description)

  // Extract a name from the description (first sentence or first 50 chars)
  const firstPart = description.split(/[.،!?]/)[0]?.trim() || description
  const nameBase = firstPart.length > 50 ? firstPart.slice(0, 47) + '...' : firstPart

  let name_en: string
  let name_ar: string
  let description_en: string
  let description_ar: string

  if (isArabic) {
    name_ar = nameBase
    name_en = nameBase // Use extracted name directly, no "Dossier" suffix
    description_ar = description.length > 200 ? description.slice(0, 197) + '...' : description
    description_en = description.length > 200 ? description.slice(0, 197) + '...' : description
  } else {
    name_en = nameBase
    name_ar = nameBase // Use extracted name directly, no "ملف" prefix
    description_en = description.length > 200 ? description.slice(0, 197) + '...' : description
    description_ar = description.length > 200 ? description.slice(0, 197) + '...' : description
  }

  // Extract potential tags from description
  const words = description.toLowerCase().split(/\s+/)
  const extractedTags = words
    .filter((word) => word.length > 4 && /^[a-z-]+$/.test(word))
    .slice(0, 2)

  const suggested_tags = [...context.suggestedTags, ...extractedTags].slice(0, 5)

  return {
    name_en,
    name_ar,
    description_en,
    description_ar,
    suggested_tags,
  }
}

/**
 * POST /api/ai/dossier-field-assist
 * Generate bilingual fields for dossier creation
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { dossier_type, description } = req.body
  const userId = req.user?.id

  if (!userId) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message_en: 'Authentication required',
        message_ar: 'المصادقة مطلوبة',
      },
    })
    return
  }

  // Validate dossier type
  if (!dossier_type || !VALID_DOSSIER_TYPES.includes(dossier_type)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message_en: `Invalid dossier_type. Must be one of: ${VALID_DOSSIER_TYPES.join(', ')}`,
        message_ar: `نوع الملف غير صالح. يجب أن يكون أحد: ${VALID_DOSSIER_TYPES.join(', ')}`,
      },
    })
    return
  }

  // Validate description
  if (!description || description.trim().length < 10) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message_en: 'Description must be at least 10 characters',
        message_ar: 'يجب أن يكون الوصف 10 أحرف على الأقل',
      },
    })
    return
  }

  try {
    // Deterministic rule-based field generation (zero-egress; Phase 74, D3).
    const fields = generateFallbackFields(dossier_type as DossierType, description)
    logger.info('Dossier field assist generated', { dossier_type, userId })
    res.json(fields)
  } catch (error) {
    logger.error('Dossier field assist failed', { error, dossier_type, userId })

    // Return fallback on any error
    const fallbackFields = generateFallbackFields(dossier_type as DossierType, description)
    res.json(fallbackFields)
  }
})

export default router
