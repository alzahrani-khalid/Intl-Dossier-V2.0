import { Router } from 'express';
import { z } from 'zod';
import { DocumentService } from '../services/DocumentService';
import { validate, idParamSchema, createBilingualError, getRequestLanguage } from '../utils/validation';
import { requirePermission } from '../middleware/auth';
import { logInfo, logError } from '../utils/logger';
import multer from 'multer';

const router = Router();
const documentService = new DocumentService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/gif'
    ];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

const documentMetadataSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  type: z.enum(['agreement', 'report', 'brief', 'correspondence', 'presentation', 'other']),
  classification: z.enum(['public', 'internal', 'confidential', 'secret']).default('internal'),
  tags: z.array(z.string()).optional(),
  relatedEntities: z.array(z.object({
    type: z.enum(['country', 'organization', 'mou', 'event']),
    id: z.string().uuid()
  })).optional()
});

// GET /api/documents
router.get('/', async (req, res, next) => {
  try {
    const filters = req.query;
    const documents = await documentService.findAll(filters);
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// POST /api/documents - Upload document
router.post('/', requirePermission(['upload_document']), upload.single('file'),
  validate({ body: documentMetadataSchema }),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const document = await documentService.upload(req.file, {
        file: req.file,
        metadata: req.body,
        uploadedBy: req.user?.id
      });

      res.status(201).json({ data: document });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/documents/:id
router.get('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const document = await documentService.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:id
router.delete('/:id', requirePermission(['delete_document']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      await documentService.delete(req.params.id);
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
