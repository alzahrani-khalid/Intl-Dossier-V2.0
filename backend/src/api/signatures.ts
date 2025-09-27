import { Router, Request, Response, NextFunction } from 'express';
import { SignatureService } from '../services/SignatureService';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
let signatureService: SignatureService;

export function initializeSignaturesRouter(
  supabaseUrl: string,
  supabaseKey: string,
  docusignConfig?: any,
  pkiConfig?: any
): Router {
  signatureService = new SignatureService(
    supabaseUrl,
    supabaseKey,
    docusignConfig,
    pkiConfig
  );
  return router;
}

/**
 * @route POST /api/mous/:id/signature
 * @desc Create a signature request for an MoU
 * @access Private
 */
router.post(
  '/mous/:id/signature',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid MoU ID required'),
    body('document_id').isUUID().withMessage('Valid document ID required'),
    body('provider').isIn(['docusign', 'pki']).withMessage('Invalid provider'),
    body('signatories').isArray({ min: 1 }).withMessage('At least one signatory required'),
    body('signatories.*.contact_id').isUUID().withMessage('Valid contact ID required'),
    body('signatories.*.order').optional().isInt({ min: 0 }),
    body('workflow').optional().isIn(['parallel', 'sequential']),
    body('expires_at').isISO8601().withMessage('Expiry date required')
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signatureRequest = await signatureService.createSignatureRequest({
        mou_id: req.params.id,
        ...req.body
      });

      res.status(201).json({
        success: true,
        data: signatureRequest,
        message: 'Signature request created successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/signatures/:id/send
 * @desc Send signature request to signatories
 * @access Private
 */
router.post(
  '/:id/send',
  authenticate,
  [param('id').isUUID().withMessage('Valid signature request ID required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const sent = await signatureService.sendForSignature(req.params.id, userId);

      res.json({
        success: true,
        data: sent,
        message: 'Signature request sent successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/signatures/:id/status
 * @desc Get signature request status
 * @access Private
 */
router.get(
  '/:id/status',
  authenticate,
  [param('id').isUUID().withMessage('Valid signature request ID required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const signatureRequest = await signatureService.getSignatureRequest(req.params.id);

      res.json({
        success: true,
        data: {
          id: signatureRequest.id,
          status: signatureRequest.status,
          signatories: signatureRequest.signatories,
          expires_at: signatureRequest.expires_at,
          completed_at: signatureRequest.completed_at
        }
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/signatures/:id/verify
 * @desc Verify a digital signature
 * @access Private
 */
router.post(
  '/:id/verify',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid signature request ID required'),
    body('signature_data').notEmpty().withMessage('Signature data required')
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const verification = await signatureService.verifySignature(
        req.params.id,
        req.body.signature_data
      );

      res.json({
        success: true,
        data: verification
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/signatures/:id/status
 * @desc Update signature status (webhook endpoint)
 * @access Private/Webhook
 */
router.put(
  '/:id/status',
  // Note: In production, validate webhook signature instead of user auth
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await signatureService.updateSignatureStatus(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        data: updated,
        message: 'Signature status updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/signatures/mou/:mouId
 * @desc Get all signature requests for an MoU
 * @access Private
 */
router.get(
  '/mou/:mouId',
  authenticate,
  [param('mouId').isUUID().withMessage('Valid MoU ID required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const requests = await signatureService.getSignatureRequestsByMoU(
        req.params.mouId
      );

      res.json({
        success: true,
        data: requests,
        meta: {
          total: requests.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/signatures/check-expired
 * @desc Check and update expired signature requests
 * @access Private/Admin
 */
router.post(
  '/check-expired',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      await signatureService.checkExpiredRequests();

      res.json({
        success: true,
        message: 'Expired signature requests processed'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

export default router;