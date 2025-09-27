import { Router } from 'express';
import { z } from 'zod';
import { BriefService } from '../services/BriefService';
import { VoiceService } from '../services/VoiceService';
import { IntelligenceService } from '../services/IntelligenceService';
import { validate, createBilingualError, getRequestLanguage } from '../utils/validation';
import { requirePermission } from '../middleware/auth';
import { logInfo, logError } from '../utils/logger';
import multer from 'multer';

const router = Router();
const briefService = new BriefService();
const voiceService = new VoiceService();
const intelligenceService = new IntelligenceService();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Validation schemas
const generateBriefSchema = z.object({
  type: z.enum(['meeting', 'country', 'organization', 'event', 'custom']),
  entityId: z.string().uuid().optional(),
  context: z.object({
    purpose: z.string().optional(),
    audience: z.enum(['minister', 'deputy', 'director', 'staff', 'public']).optional(),
    focusAreas: z.array(z.string()).optional(),
    language: z.enum(['en', 'ar', 'both']).default('en'),
    includeRecommendations: z.boolean().default(true),
    includeTalkingPoints: z.boolean().default(true),
    includeBackground: z.boolean().default(true),
    maxLength: z.enum(['short', 'medium', 'detailed']).default('medium')
  }).optional(),
  customPrompt: z.string().max(1000).optional(),
  templateId: z.string().uuid().optional()
});

const voiceCommandSchema = z.object({
  command: z.string().min(1).max(500),
  context: z.object({
    currentPage: z.string().optional(),
    selectedEntity: z.string().optional()
  }).optional(),
  language: z.enum(['en', 'ar']).default('en')
});

const suggestionRequestSchema = z.object({
  type: z.enum(['next_actions', 'opportunities', 'risks', 'improvements']),
  entityType: z.enum(['country', 'organization', 'mou', 'relationship']),
  entityId: z.string().uuid(),
  timeframe: z.enum(['immediate', 'short_term', 'long_term']).default('short_term')
});

const analysisRequestSchema = z.object({
  type: z.enum(['sentiment', 'summary', 'key_points', 'action_items']),
  text: z.string().min(10).max(10000),
  language: z.enum(['en', 'ar']).optional()
});

/**
 * @route POST /api/ai/briefs
 * @desc Generate AI brief
 * @access Private - requires permission
 */
router.post(
  '/briefs',
  requirePermission(['generate_brief']),
  validate({ body: generateBriefSchema }),
  async (req, res, next) => {
    try {
      const briefRequest = req.body;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      logInfo('Generating AI brief', { briefRequest, userId });

      const brief = await briefService.generateBrief(
        briefRequest,
        userId!
      );

      res.json({
        data: brief,
        message: createBilingualError(
          'Brief generated successfully',
          'تم إنشاء الملخص بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to generate brief', error as Error);
      next(error);
    }
  }
);

/**
 * @route GET /api/ai/briefs
 * @desc Get user's generated briefs
 * @access Private
 */
router.get('/briefs', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { type, entityId, limit = 10 } = req.query;

    const briefs = await briefService.getUserBriefs(userId!);

    res.json({
      data: briefs,
      total: briefs.length
    });
  } catch (error) {
    logError('Failed to fetch briefs', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/ai/briefs/:id
 * @desc Get specific brief
 * @access Private
 */
router.get('/briefs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const brief = await briefService.getBriefById(id);

    if (!brief) {
      const lang = getRequestLanguage(req);
      return res.status(404).json({
        error: createBilingualError(
          'Brief not found',
          'الملخص غير موجود',
          lang
        )
      });
    }

    res.json(brief);
  } catch (error) {
    logError('Failed to fetch brief', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/ai/voice/transcribe
 * @desc Transcribe audio to text
 * @access Private
 */
router.post(
  '/voice/transcribe',
  upload.single('audio'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        const lang = getRequestLanguage(req);
        return res.status(400).json({
          error: createBilingualError(
            'Audio file is required',
            'ملف الصوت مطلوب',
            lang
          )
        });
      }

      const language = req.body.language || 'en';

      logInfo('Transcribing audio', {
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        language
      });

      const transcription = await voiceService.transcribeAudio(
        req.file.buffer,
        language
      );

      res.json({
        text: transcription.text,
        confidence: transcription.confidence,
        language: transcription.language
      });
    } catch (error) {
      logError('Failed to transcribe audio', error as Error);
      next(error);
    }
  }
);

/**
 * @route POST /api/ai/voice/command
 * @desc Process voice command
 * @access Private
 */
router.post(
  '/voice/command',
  validate({ body: voiceCommandSchema }),
  async (req, res, next) => {
    try {
      const { command, context, language } = req.body;
      const userId = req.user?.id;

      logInfo('Processing voice command', { command, context, userId });

      const result = await voiceService.processCommand(command);

      res.json({
        action: result.action,
        parameters: (result as any).parameters || {},
        confidence: (result as any).confidence || 1.0,
        response: result.response
      });
    } catch (error) {
      logError('Failed to process voice command', error as Error);
      next(error);
    }
  }
);

/**
 * @route POST /api/ai/suggestions
 * @desc Get AI suggestions
 * @access Private
 */
router.post(
  '/suggestions',
  validate({ body: suggestionRequestSchema }),
  async (req, res, next) => {
    try {
      const suggestionRequest = req.body;
      const userId = req.user?.id;

      logInfo('Generating AI suggestions', { suggestionRequest, userId });

      const suggestions = await intelligenceService.generateSuggestions(suggestionRequest);

      res.json({
        suggestions,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      logError('Failed to generate suggestions', error as Error);
      next(error);
    }
  }
);

/**
 * @route POST /api/ai/analyze
 * @desc Analyze text with AI
 * @access Private
 */
router.post(
  '/analyze',
  validate({ body: analysisRequestSchema }),
  async (req, res, next) => {
    try {
      const { type, text, language } = req.body;

      logInfo('Analyzing text', { type, textLength: text.length, language });

      let result;

      switch (type) {
        case 'sentiment':
          result = await intelligenceService.analyzeSentiment(text);
          break;
        case 'summary':
          result = await intelligenceService.summarizeText(text);
          break;
        case 'key_points':
          result = await intelligenceService.extractKeyPoints(text);
          break;
        case 'action_items':
          result = await intelligenceService.extractActionItems(text);
          break;
        default:
          throw new Error('Invalid analysis type');
      }

      res.json({
        type,
        result,
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      logError('Failed to analyze text', error as Error);
      next(error);
    }
  }
);

/**
 * @route GET /api/ai/templates
 * @desc Get available brief templates
 * @access Private
 */
router.get('/templates', async (req, res, next) => {
  try {
    const templates = await briefService.getTemplates();

    res.json({
      data: templates,
      total: templates.length
    });
  } catch (error) {
    logError('Failed to fetch templates', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/ai/templates
 * @desc Create custom brief template
 * @access Private - requires permission
 */
router.post(
  '/templates',
  requirePermission(['manage_templates']),
  validate({
    body: z.object({
      name: z.string().min(3).max(100),
      description: z.string().optional(),
      type: z.enum(['meeting', 'country', 'organization', 'event', 'custom']),
      structure: z.object({
        sections: z.array(z.string()),
        includeGraphics: z.boolean().default(false),
        includeStatistics: z.boolean().default(true)
      }),
      prompt: z.string().max(2000)
    })
  }),
  async (req, res, next) => {
    try {
      const templateData = req.body;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      const template = await briefService.createTemplate({
        ...templateData,
        createdBy: userId
      });

      res.status(201).json({
        data: template,
        message: createBilingualError(
          'Template created successfully',
          'تم إنشاء القالب بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to create template', error as Error);
      next(error);
    }
  }
);

/**
 * @route POST /api/ai/feedback
 * @desc Submit feedback on AI-generated content
 * @access Private
 */
router.post(
  '/feedback',
  validate({
    body: z.object({
      contentId: z.string().uuid(),
      contentType: z.enum(['brief', 'suggestion', 'analysis', 'transcription']),
      rating: z.number().min(1).max(5),
      feedback: z.string().optional(),
      improvements: z.string().optional()
    })
  }),
  async (req, res, next) => {
    try {
      const feedbackData = req.body;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      // Store feedback for improving AI models
      await intelligenceService.storeFeedback({
        ...feedbackData,
        userId
      });

      res.json({
        message: createBilingualError(
          'Thank you for your feedback',
          'شكراً لك على ملاحظاتك',
          lang
        )
      });
    } catch (error) {
      logError('Failed to submit feedback', error as Error);
      next(error);
    }
  }
);

export default router;