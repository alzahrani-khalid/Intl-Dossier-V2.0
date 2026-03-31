/**
 * Elected Officials API Router
 *
 * CRITICAL: There is NO `elected_officials` table. Elected officials are rows
 * in the `persons` table with `person_subtype = 'elected_official'`.
 * The dossier type in the `dossiers` table is `person`, NOT `elected_official`.
 *
 * Uses search_persons_advanced and get_person_full RPC functions.
 */

import { Router } from 'express'
import { z } from 'zod'
import {
  validate,
  paginationSchema,
  idParamSchema,
  createBilingualError,
  getRequestLanguage,
} from '../utils/validation'
import { requireRole } from '../middleware/auth'
import { supabaseAdmin } from '../config/supabase'
import { logInfo, logError } from '../utils/logger'

const router = Router()

// Validation schemas
const electedOfficialFiltersSchema = z.object({
  search: z.string().optional(),
  office_type: z.string().optional(),
  party: z.string().optional(),
  is_current_term: z.coerce.boolean().optional(),
  country_id: z.string().uuid().optional(),
  ...paginationSchema.shape,
})

const createElectedOfficialSchema = z.object({
  name_en: z.string().min(2).max(200),
  name_ar: z.string().min(2).max(200).optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  photo_url: z.string().url().optional(),
  organization_id: z.string().uuid().optional(),
  nationality_country_id: z.string().uuid().optional(),
  biography_en: z.string().optional(),
  biography_ar: z.string().optional(),
  office_name_en: z.string().min(1),
  office_name_ar: z.string().optional(),
  office_type: z.enum([
    'head_of_state', 'head_of_government', 'cabinet_minister',
    'legislature_upper', 'legislature_lower', 'regional_executive',
    'regional_legislature', 'local_executive', 'local_legislature',
    'judiciary', 'ambassador', 'international_org', 'other',
  ]).optional(),
  district_en: z.string().optional(),
  district_ar: z.string().optional(),
  party_en: z.string().optional(),
  party_ar: z.string().optional(),
  party_abbreviation: z.string().optional(),
  party_ideology: z.enum([
    'conservative', 'liberal', 'centrist', 'socialist', 'green',
    'nationalist', 'libertarian', 'independent', 'other',
  ]).optional(),
  term_start: z.string().optional(),
  term_end: z.string().optional(),
  is_current_term: z.boolean().optional(),
  term_number: z.number().int().positive().optional(),
  committee_assignments: z.array(z.object({
    name_en: z.string(),
    name_ar: z.string(),
    role: z.string(),
    is_active: z.boolean(),
  })).optional(),
  country_id: z.string().uuid().optional(),
  email_official: z.string().email().optional(),
  email_personal: z.string().email().optional(),
  phone_office: z.string().optional(),
  phone_mobile: z.string().optional(),
  website_official: z.string().url().optional(),
  website_campaign: z.string().url().optional(),
  importance_level: z.number().int().min(1).max(5).optional(),
})

const updateElectedOfficialSchema = createElectedOfficialSchema.partial()

/**
 * @route GET /api/elected-officials
 * @desc List elected officials via search_persons_advanced RPC
 * @access Private
 */
router.get(
  '/',
  validate({ query: electedOfficialFiltersSchema }),
  async (req, res, next) => {
    try {
      const {
        search,
        office_type,
        party,
        is_current_term,
        country_id,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string | undefined>
      const userId = req.user?.id

      const pageNum = Math.max(1, parseInt(page ?? '1', 10))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10)))
      const offset = (pageNum - 1) * limitNum

      logInfo('Fetching elected officials', { filters: req.query, userId })

      const { data, error } = await supabaseAdmin.rpc('search_persons_advanced', {
        p_person_subtype: 'elected_official',
        p_search_term: search ?? null,
        p_office_type: office_type ?? null,
        p_party: party ?? null,
        p_is_current_term: is_current_term != null ? is_current_term === 'true' : null,
        p_country_id: country_id ?? null,
        p_limit: limitNum,
        p_offset: offset,
      })

      if (error != null) {
        logError('Failed to search elected officials', error as unknown as Error)
        return res.status(500).json({ error: error.message })
      }

      // Get total count for pagination
      const { count, error: countError } = await supabaseAdmin
        .from('persons')
        .select('id', { count: 'exact', head: true })
        .eq('person_subtype', 'elected_official')

      if (countError != null) {
        logError('Failed to count elected officials', countError as unknown as Error)
      }

      res.json({
        data: data ?? [],
        total: count ?? (data?.length ?? 0),
        page: pageNum,
        limit: limitNum,
      })
    } catch (error) {
      logError('Failed to fetch elected officials', error as Error)
      next(error)
    }
  },
)

/**
 * @route GET /api/elected-officials/:id
 * @desc Get single elected official via get_person_full RPC
 * @access Private
 */
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const userId = req.user?.id
      const lang = getRequestLanguage(req)

      logInfo('Fetching elected official detail', { id, userId })

      const { data, error } = await supabaseAdmin.rpc('get_person_full', {
        p_person_id: id,
      })

      if (error != null) {
        logError('Failed to fetch elected official', error as unknown as Error)
        return res.status(500).json({ error: error.message })
      }

      if (data == null) {
        return res.status(404).json({
          error: createBilingualError(
            'Elected official not found',
            '\u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0645\u0646\u062A\u062E\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F',
            lang,
          ),
        })
      }

      // Verify this is actually an elected official
      const personData = Array.isArray(data) ? data[0] : data
      if (personData?.person_subtype !== 'elected_official') {
        return res.status(404).json({
          error: createBilingualError(
            'Elected official not found',
            '\u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0645\u0646\u062A\u062E\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F',
            lang,
          ),
        })
      }

      res.json({ data: personData })
    } catch (error) {
      logError('Failed to fetch elected official', error as Error)
      next(error)
    }
  },
)

/**
 * @route POST /api/elected-officials
 * @desc Create new elected official (inserts dossier with type='person' + person row)
 * @access Admin only
 */
router.post(
  '/',
  requireRole(['admin']),
  validate({ body: createElectedOfficialSchema }),
  async (req, res, next) => {
    try {
      const body = req.body
      const userId = req.user?.id
      const lang = getRequestLanguage(req)

      logInfo('Creating elected official', { name: body.name_en, userId })

      // Step 1: Create dossier with type = 'person' (NOT 'elected_official')
      const { data: dossier, error: dossierError } = await supabaseAdmin
        .from('dossiers')
        .insert({
          type: 'person',
          name_en: body.name_en,
          name_ar: body.name_ar ?? body.name_en,
          description_en: body.description_en ?? null,
          description_ar: body.description_ar ?? null,
          status: 'active',
          created_by: userId,
        })
        .select()
        .single()

      if (dossierError != null) {
        logError('Failed to create dossier for elected official', dossierError as unknown as Error)
        return res.status(500).json({ error: dossierError.message })
      }

      // Step 2: Create person row with person_subtype = 'elected_official'
      const { data: person, error: personError } = await supabaseAdmin
        .from('persons')
        .insert({
          id: dossier.id,
          person_subtype: 'elected_official',
          title_en: body.title_en ?? null,
          title_ar: body.title_ar ?? null,
          photo_url: body.photo_url ?? null,
          organization_id: body.organization_id ?? null,
          nationality_country_id: body.nationality_country_id ?? null,
          biography_en: body.biography_en ?? null,
          biography_ar: body.biography_ar ?? null,
          importance_level: body.importance_level ?? null,
          office_name_en: body.office_name_en,
          office_name_ar: body.office_name_ar ?? null,
          office_type: body.office_type ?? null,
          district_en: body.district_en ?? null,
          district_ar: body.district_ar ?? null,
          party_en: body.party_en ?? null,
          party_ar: body.party_ar ?? null,
          party_abbreviation: body.party_abbreviation ?? null,
          party_ideology: body.party_ideology ?? null,
          term_start: body.term_start ?? null,
          term_end: body.term_end ?? null,
          is_current_term: body.is_current_term ?? true,
          term_number: body.term_number ?? null,
          committee_assignments: body.committee_assignments ?? [],
          country_id: body.country_id ?? null,
          email_official: body.email_official ?? null,
          email_personal: body.email_personal ?? null,
          phone_office: body.phone_office ?? null,
          phone_mobile: body.phone_mobile ?? null,
          website_official: body.website_official ?? null,
          website_campaign: body.website_campaign ?? null,
        })
        .select()
        .single()

      if (personError != null) {
        // Rollback dossier creation on person insert failure
        await supabaseAdmin.from('dossiers').delete().eq('id', dossier.id)
        logError('Failed to create person for elected official', personError as unknown as Error)
        return res.status(500).json({ error: personError.message })
      }

      logInfo('Elected official created successfully', { id: dossier.id })

      res.status(201).json({
        data: { ...dossier, ...person },
        message: createBilingualError(
          'Elected official created successfully',
          '\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0645\u0646\u062A\u062E\u0628 \u0628\u0646\u062C\u0627\u062D',
          lang,
        ),
      })
    } catch (error) {
      logError('Failed to create elected official', error as Error)
      next(error)
    }
  },
)

/**
 * @route PATCH /api/elected-officials/:id
 * @desc Update elected official (updates dossier + person row)
 * @access Admin only
 */
router.patch(
  '/:id',
  requireRole(['admin']),
  validate({ params: idParamSchema, body: updateElectedOfficialSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const body = req.body
      const userId = req.user?.id
      const lang = getRequestLanguage(req)

      logInfo('Updating elected official', { id, userId })

      // Verify the person exists and is an elected official
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('persons')
        .select('id, person_subtype')
        .eq('id', id)
        .eq('person_subtype', 'elected_official')
        .single()

      if (checkError != null || existing == null) {
        return res.status(404).json({
          error: createBilingualError(
            'Elected official not found',
            '\u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0645\u0646\u062A\u062E\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F',
            lang,
          ),
        })
      }

      // Update dossier fields if provided
      const dossierFields: Record<string, unknown> = {}
      if (body.name_en != null) dossierFields.name_en = body.name_en
      if (body.name_ar != null) dossierFields.name_ar = body.name_ar
      if (body.description_en != null) dossierFields.description_en = body.description_en
      if (body.description_ar != null) dossierFields.description_ar = body.description_ar

      if (Object.keys(dossierFields).length > 0) {
        dossierFields.updated_by = userId
        const { error: dossierError } = await supabaseAdmin
          .from('dossiers')
          .update(dossierFields)
          .eq('id', id)

        if (dossierError != null) {
          logError('Failed to update dossier for elected official', dossierError as unknown as Error)
          return res.status(500).json({ error: dossierError.message })
        }
      }

      // Update person fields
      const personFields: Record<string, unknown> = {}
      const personFieldNames = [
        'title_en', 'title_ar', 'photo_url', 'organization_id',
        'nationality_country_id', 'biography_en', 'biography_ar',
        'importance_level', 'office_name_en', 'office_name_ar',
        'office_type', 'district_en', 'district_ar', 'party_en',
        'party_ar', 'party_abbreviation', 'party_ideology',
        'term_start', 'term_end', 'is_current_term', 'term_number',
        'committee_assignments', 'country_id', 'email_official',
        'email_personal', 'phone_office', 'phone_mobile',
        'website_official', 'website_campaign',
      ]
      for (const field of personFieldNames) {
        if (body[field] !== undefined) {
          personFields[field] = body[field]
        }
      }

      if (Object.keys(personFields).length > 0) {
        const { error: personError } = await supabaseAdmin
          .from('persons')
          .update(personFields)
          .eq('id', id)

        if (personError != null) {
          logError('Failed to update person for elected official', personError as unknown as Error)
          return res.status(500).json({ error: personError.message })
        }
      }

      // Fetch updated data
      const { data: updated } = await supabaseAdmin.rpc('get_person_full', {
        p_person_id: id,
      })

      logInfo('Elected official updated successfully', { id })

      const updatedData = Array.isArray(updated) ? updated[0] : updated
      res.json({
        data: updatedData,
        message: createBilingualError(
          'Elected official updated successfully',
          '\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0645\u0646\u062A\u062E\u0628 \u0628\u0646\u062C\u0627\u062D',
          lang,
        ),
      })
    } catch (error) {
      logError('Failed to update elected official', error as Error)
      next(error)
    }
  },
)

export default router
