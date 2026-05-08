import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { SignatureService } from '../services/signature.service'
import { authenticate } from '../middleware/auth'
import { validate } from '../utils/validation'

const router = Router()
let signatureService: SignatureService

export function initializeSignaturesRouter(
  supabaseUrl: string,
  supabaseKey: string,
  docusignConfig?: any,
  pkiConfig?: any,
): Router {
  signatureService = new SignatureService(supabaseUrl, supabaseKey, docusignConfig, pkiConfig)
  return router
}

// Validation schemas
const uuidParamSchema = z.object({
  id: z.string().uuid(),
})

const mouIdParamSchema = z.object({
  mouId: z.string().uuid(),
})

const createSignatureBodySchema = z.object({
  document_id: z.string().uuid(),
  provider: z.enum(['docusign', 'pki']),
  signatories: z
    .array(
      z.object({
        contact_id: z.string().uuid(),
        order: z.number().int().min(0).optional(),
      }),
    )
    .min(1),
  workflow: z.enum(['parallel', 'sequential']).optional(),
  expires_at: z.string().datetime(),
})

const verifyBodySchema = z.object({
  signature_data: z.string().min(1),
})

const updateStatusBodySchema = z.object({
  status: z.string().min(1),
  signatory_id: z.string().uuid().optional(),
  signed_at: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * @route POST /api/mous/:id/signature
 * @desc Create a signature request for an MoU
 * @access Private
 */
router.post(
  '/mous/:id/signature',
  authenticate,
  validate({ params: uuidParamSchema, body: createSignatureBodySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const signatureRequest = await signatureService.createSignatureRequest({
        mou_id: req.params.id as string,
        ...req.body,
      })

      return res.status(201).json({
        success: true,
        data: signatureRequest,
        message: 'Signature request created successfully',
      })
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route POST /api/signatures/:id/send
 * @desc Send signature request to signatories
 * @access Private
 */
router.post(
  '/:id/send',
  authenticate,
  validate({ params: uuidParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const sent = await signatureService.sendForSignature(req.params.id as string, userId)

      return res.json({
        success: true,
        data: sent,
        message: 'Signature request sent successfully',
      })
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route GET /api/signatures/:id/status
 * @desc Get signature request status
 * @access Private
 */
router.get(
  '/:id/status',
  authenticate,
  validate({ params: uuidParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const signatureRequest = await signatureService.getSignatureRequest(req.params.id as string)

      return res.json({
        success: true,
        data: {
          id: signatureRequest.id,
          status: signatureRequest.status,
          signatories: signatureRequest.signatories,
          expires_at: signatureRequest.expires_at,
          completed_at: signatureRequest.completed_at,
        },
      })
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route POST /api/signatures/:id/verify
 * @desc Verify a digital signature
 * @access Private
 */
router.post(
  '/:id/verify',
  authenticate,
  validate({ params: uuidParamSchema, body: verifyBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const verification = await signatureService.verifySignature(
        req.params.id as string,
        req.body.signature_data,
      )

      return res.json({
        success: true,
        data: verification,
      })
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route PUT /api/signatures/:id/status
 * @desc Update signature status (webhook endpoint)
 * @access Private/Webhook
 */
router.put(
  '/:id/status',
  // Note: In production, validate webhook signature instead of user auth
  validate({ params: uuidParamSchema, body: updateStatusBodySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const updated = await signatureService.updateSignatureStatus(
        req.params.id as string,
        req.body,
      )

      return res.json({
        success: true,
        data: updated,
        message: 'Signature status updated successfully',
      })
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route GET /api/signatures/mou/:mouId
 * @desc Get all signature requests for an MoU
 * @access Private
 */
router.get(
  '/mou/:mouId',
  authenticate,
  validate({ params: mouIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const requests = await signatureService.getSignatureRequestsByMoU(req.params.mouId as string)

      return res.json({
        success: true,
        data: requests,
        meta: {
          total: requests.length,
        },
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route POST /api/signatures/check-expired
 * @desc Check and update expired signature requests
 * @access Private/Admin
 */
router.post('/check-expired', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    await signatureService.checkExpiredRequests()

    return res.json({
      success: true,
      message: 'Expired signature requests processed',
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

export default router
