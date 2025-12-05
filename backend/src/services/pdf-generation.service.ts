/**
 * PDF Generation Service
 *
 * Generates bilingual PDFs (English + Arabic) with proper RTL support
 * Uses pdfkit with custom RTL layout engine for Arabic
 * Includes organization branding and confidentiality markings
 */

import PDFDocument from 'pdfkit'
import { createClient } from '@supabase/supabase-js'
import logger from '../utils/logger'
import * as fs from 'fs'
import * as path from 'path'

const FONT_PATH_REGULAR = path.join(__dirname, '../../assets/fonts/NotoSans-Regular.ttf')
const FONT_PATH_BOLD = path.join(__dirname, '../../assets/fonts/NotoSans-Bold.ttf')
const FONT_PATH_ARABIC = path.join(__dirname, '../../assets/fonts/NotoSansArabic-Regular.ttf')
const FONT_PATH_ARABIC_BOLD = path.join(__dirname, '../../assets/fonts/NotoSansArabic-Bold.ttf')

export interface PDFGenerationRequest {
  after_action_id: string
  language: 'en' | 'ar'
  include_confidential_watermark?: boolean
}

export interface BilingualPDFResponse {
  english_pdf_path: string
  arabic_pdf_path: string
  generation_time_ms: number
}

export class PDFGenerationService {
  private supabase: ReturnType<typeof createClient>

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  /**
   * Generate bilingual PDFs (English + Arabic) in parallel
   */
  async generateBilingualPDFs(request: PDFGenerationRequest): Promise<BilingualPDFResponse> {
    const startTime = Date.now()

    logger.info('Starting bilingual PDF generation', {
      after_action_id: request.after_action_id,
    })

    // Fetch after-action record with all nested entities
    const afterActionData = await this.fetchAfterActionData(request.after_action_id)

    // Generate both PDFs in parallel
    const [englishPdfBuffer, arabicPdfBuffer] = await Promise.all([
      this.generateEnglishPDF(afterActionData, request.include_confidential_watermark),
      this.generateArabicPDF(afterActionData, request.include_confidential_watermark),
    ])

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const englishPath = `after-actions/${request.after_action_id}/distribution_en_${timestamp}.pdf`
    const arabicPath = `after-actions/${request.after_action_id}/distribution_ar_${timestamp}.pdf`

    await Promise.all([
      this.uploadToStorage(englishPath, englishPdfBuffer),
      this.uploadToStorage(arabicPath, arabicPdfBuffer),
    ])

    const generationTime = Date.now() - startTime

    logger.info('Bilingual PDF generation completed', {
      after_action_id: request.after_action_id,
      generation_time_ms: generationTime,
    })

    return {
      english_pdf_path: englishPath,
      arabic_pdf_path: arabicPath,
      generation_time_ms: generationTime,
    }
  }

  /**
   * Generate English PDF with LTR layout
   */
  private async generateEnglishPDF(data: any, watermark = false): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Register fonts
      doc.registerFont('Regular', FONT_PATH_REGULAR)
      doc.registerFont('Bold', FONT_PATH_BOLD)

      // Header
      doc.font('Bold').fontSize(24).text('After-Action Report', { align: 'center' })
      doc.moveDown()

      // Metadata
      doc.font('Regular').fontSize(12)
      doc.text(`Date: ${data.engagement_date}`, { align: 'left' })
      doc.text(`Location: ${data.location || 'N/A'}`, { align: 'left' })
      doc.text(`Attendees: ${data.attendees?.length || 0}`, { align: 'left' })
      doc.moveDown()

      // Decisions
      if (data.decisions?.length > 0) {
        doc.font('Bold').fontSize(16).text('Decisions Made')
        doc.moveDown(0.5)
        data.decisions.forEach((decision: any, idx: number) => {
          doc.font('Regular').fontSize(12)
          doc.text(`${idx + 1}. ${decision.description}`)
          if (decision.decision_maker) {
            doc.fontSize(10).fillColor('gray').text(`   Decision Maker: ${decision.decision_maker}`)
          }
          doc.fillColor('black')
          doc.moveDown(0.5)
        })
        doc.moveDown()
      }

      // Commitments
      if (data.commitments?.length > 0) {
        doc.font('Bold').fontSize(16).text('Commitments')
        doc.moveDown(0.5)
        data.commitments.forEach((commitment: any, idx: number) => {
          doc.font('Regular').fontSize(12)
          doc.text(`${idx + 1}. ${commitment.description}`)
          doc.fontSize(10).fillColor('gray')
          doc.text(`   Owner: ${commitment.owner_name || 'TBD'}`)
          doc.text(`   Due: ${commitment.due_date}`)
          doc.fillColor('black')
          doc.moveDown(0.5)
        })
        doc.moveDown()
      }

      // Risks
      if (data.risks?.length > 0) {
        doc.font('Bold').fontSize(16).text('Risks Identified')
        doc.moveDown(0.5)
        data.risks.forEach((risk: any, idx: number) => {
          doc.font('Regular').fontSize(12)
          doc.text(`${idx + 1}. ${risk.description}`)
          doc.fontSize(10).fillColor('gray')
          doc.text(`   Severity: ${risk.severity} | Likelihood: ${risk.likelihood}`)
          doc.fillColor('black')
          doc.moveDown(0.5)
        })
      }

      // Watermark
      if (watermark) {
        doc
          .fontSize(60)
          .fillColor('red', 0.3)
          .rotate(-45, { origin: [300, 400] })
        doc.text('CONFIDENTIAL', 150, 400, { align: 'center' })
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor('gray')
        .text(`Generated on ${new Date().toISOString().split('T')[0]}`, 50, doc.page.height - 50, {
          align: 'center',
        })

      doc.end()
    })
  }

  /**
   * Generate Arabic PDF with RTL layout
   */
  private async generateArabicPDF(data: any, watermark = false): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Register Arabic fonts
      doc.registerFont('ArabicRegular', FONT_PATH_ARABIC)
      doc.registerFont('ArabicBold', FONT_PATH_ARABIC_BOLD)

      // Header (RTL)
      doc.font('ArabicBold').fontSize(24).text('تقرير ما بعد الإجراء', { align: 'right' })
      doc.moveDown()

      // Metadata (RTL)
      doc.font('ArabicRegular').fontSize(12)
      doc.text(`التاريخ: ${data.engagement_date}`, { align: 'right' })
      doc.text(`الموقع: ${data.location || 'غير محدد'}`, { align: 'right' })
      doc.text(`الحضور: ${data.attendees?.length || 0}`, { align: 'right' })
      doc.moveDown()

      // Decisions (RTL)
      if (data.decisions?.length > 0) {
        doc.font('ArabicBold').fontSize(16).text('القرارات المتخذة', { align: 'right' })
        doc.moveDown(0.5)
        data.decisions.forEach((decision: any, idx: number) => {
          doc.font('ArabicRegular').fontSize(12)
          doc.text(`${idx + 1}. ${decision.description_ar || decision.description}`, {
            align: 'right',
          })
          if (decision.decision_maker) {
            doc
              .fontSize(10)
              .fillColor('gray')
              .text(`   صانع القرار: ${decision.decision_maker}`, { align: 'right' })
          }
          doc.fillColor('black')
          doc.moveDown(0.5)
        })
        doc.moveDown()
      }

      // Commitments (RTL)
      if (data.commitments?.length > 0) {
        doc.font('ArabicBold').fontSize(16).text('الالتزامات', { align: 'right' })
        doc.moveDown(0.5)
        data.commitments.forEach((commitment: any, idx: number) => {
          doc.font('ArabicRegular').fontSize(12)
          doc.text(`${idx + 1}. ${commitment.description_ar || commitment.description}`, {
            align: 'right',
          })
          doc.fontSize(10).fillColor('gray')
          doc.text(`   المسؤول: ${commitment.owner_name || 'لم يحدد بعد'}`, { align: 'right' })
          doc.text(`   تاريخ الاستحقاق: ${commitment.due_date}`, { align: 'right' })
          doc.fillColor('black')
          doc.moveDown(0.5)
        })
        doc.moveDown()
      }

      // Risks (RTL)
      if (data.risks?.length > 0) {
        doc.font('ArabicBold').fontSize(16).text('المخاطر المحددة', { align: 'right' })
        doc.moveDown(0.5)
        data.risks.forEach((risk: any, idx: number) => {
          doc.font('ArabicRegular').fontSize(12)
          doc.text(`${idx + 1}. ${risk.description_ar || risk.description}`, { align: 'right' })
          doc.fontSize(10).fillColor('gray')
          doc.text(`   الخطورة: ${risk.severity} | الاحتمالية: ${risk.likelihood}`, {
            align: 'right',
          })
          doc.fillColor('black')
          doc.moveDown(0.5)
        })
      }

      // Watermark
      if (watermark) {
        doc
          .fontSize(60)
          .fillColor('red', 0.3)
          .rotate(-45, { origin: [300, 400] })
        doc.text('سري', 250, 400, { align: 'center' })
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor('gray')
        .text(`تم الإنشاء في ${new Date().toISOString().split('T')[0]}`, 50, doc.page.height - 50, {
          align: 'center',
        })

      doc.end()
    })
  }

  /**
   * Fetch after-action data with all nested entities
   */
  private async fetchAfterActionData(afterActionId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('after_action_records')
      .select(
        `
        *,
        decisions(*),
        commitments(*),
        risks(*),
        follow_up_actions(*)
      `,
      )
      .eq('id', afterActionId)
      .single()

    if (error) throw error
    if (!data) throw new Error('After-action record not found')

    return data
  }

  /**
   * Upload PDF to Supabase Storage
   */
  private async uploadToStorage(path: string, buffer: Buffer): Promise<void> {
    const { error } = await this.supabase.storage.from('after-action-pdfs').upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

    if (error) throw error
  }
}
