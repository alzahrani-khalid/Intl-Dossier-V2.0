import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { body } from 'express-validator';
import multer from 'multer';
import { pipeline } from '@xenova/transformers';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

let whisperModel: any = null;

// Initialize Whisper model
async function initializeWhisper() {
  if (!whisperModel) {
    whisperModel = await pipeline(
      'automatic-speech-recognition',
      'openai/whisper-base',
      { quantized: true }
    );
  }
  return whisperModel;
}

// Command patterns for different actions
const COMMAND_PATTERNS = {
  // Arabic commands
  'افتح': { action: 'open', type: 'navigation' },
  'اعرض': { action: 'show', type: 'navigation' },
  'ابحث عن': { action: 'search', type: 'query' },
  'أنشئ': { action: 'create', type: 'action' },
  'احفظ': { action: 'save', type: 'action' },
  'أرسل': { action: 'send', type: 'action' },
  'حدث': { action: 'update', type: 'action' },
  'احذف': { action: 'delete', type: 'action' },
  
  // English commands
  'open': { action: 'open', type: 'navigation' },
  'show': { action: 'show', type: 'navigation' },
  'search for': { action: 'search', type: 'query' },
  'find': { action: 'search', type: 'query' },
  'create': { action: 'create', type: 'action' },
  'save': { action: 'save', type: 'action' },
  'send': { action: 'send', type: 'action' },
  'update': { action: 'update', type: 'action' },
  'delete': { action: 'delete', type: 'action' },
};

// Entity extraction patterns
const ENTITY_PATTERNS = {
  // Arabic entities
  'ملف': 'dossier',
  'دولة': 'country',
  'منظمة': 'organization',
  'مذكرة تفاهم': 'mou',
  'وثيقة': 'document',
  'تقرير': 'report',
  'موجز': 'brief',
  
  // English entities
  'dossier': 'dossier',
  'country': 'country',
  'organization': 'organization',
  'mou': 'mou',
  'memorandum': 'mou',
  'document': 'document',
  'report': 'report',
  'brief': 'brief',
};

/**
 * @route POST /api/ai/voice/transcribe
 * @desc Transcribe audio to text
 * @access Private
 */
router.post(
  '/transcribe',
  authenticate,
  upload.single('audio'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Audio file required'
        });
      }

      // Initialize Whisper if needed
      const model = await initializeWhisper();

      // Transcribe audio
      const result = await model(req.file.buffer, {
        language: req.body.language || 'ar', // Default to Arabic
        task: 'transcribe',
        return_timestamps: true
      });

      res.json({
        success: true,
        data: {
          text: result.text,
          language: req.body.language || 'ar',
          confidence: result.confidence || 0.95,
          timestamps: result.chunks || []
        }
      });
    } catch (error: any) {
      console.error('Transcription error:', error);
      res.status(500).json({
        success: false,
        error: 'Transcription failed',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/voice/command
 * @desc Process voice command
 * @access Private
 */
router.post(
  '/command',
  authenticate,
  upload.single('audio'),
  [
    body('text').optional().notEmpty().withMessage('Text required if no audio'),
    body('language').optional().isIn(['ar', 'en']).withMessage('Invalid language'),
    body('confirm').optional().isBoolean()
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      let text = req.body.text;
      let confidence = 1.0;

      // If audio provided, transcribe it first
      if (req.file) {
        const model = await initializeWhisper();
        const result = await model(req.file.buffer, {
          language: req.body.language || 'ar',
          task: 'transcribe'
        });
        text = result.text;
        confidence = result.confidence || 0.95;
      }

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'No text or audio provided'
        });
      }

      // Parse command
      const command = parseVoiceCommand(text);

      // Check if confirmation needed for critical actions
      if (command.action === 'delete' && !req.body.confirm) {
        return res.json({
          success: true,
          data: {
            command,
            confidence,
            requires_confirmation: true,
            message: req.body.language === 'ar' 
              ? 'هل تريد تأكيد عملية الحذف؟'
              : 'Please confirm the delete action'
          }
        });
      }

      // Execute command based on type
      const result = await executeVoiceCommand(command, req.user?.id);

      res.json({
        success: true,
        data: {
          command,
          confidence,
          result,
          executed: true
        }
      });
    } catch (error: any) {
      console.error('Command processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Command processing failed',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/voice/validate
 * @desc Validate voice command interpretation
 * @access Private
 */
router.post(
  '/validate',
  authenticate,
  [
    body('text').notEmpty().withMessage('Text required'),
    body('expected_action').optional().isString(),
    body('language').optional().isIn(['ar', 'en'])
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { text, expected_action, language } = req.body;
      
      // Parse command
      const command = parseVoiceCommand(text);
      
      // Validate against expected action if provided
      const is_valid = !expected_action || command.action === expected_action;
      
      res.json({
        success: true,
        data: {
          text,
          parsed_command: command,
          is_valid,
          confidence: command.confidence || 0.8,
          suggestions: getSuggestions(text, language || 'en')
        }
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
 * @route GET /api/ai/voice/commands
 * @desc Get list of available voice commands
 * @access Private
 */
router.get(
  '/commands',
  authenticate,
  async (req: Request, res: Response) => {
    const language = req.query.language as string || 'en';
    
    const commands = language === 'ar' ? {
      navigation: [
        { command: 'افتح [اسم الملف]', description: 'فتح ملف دولة أو منظمة' },
        { command: 'اعرض [النوع]', description: 'عرض قائمة (مذكرات التفاهم، الوثائق، إلخ)' },
      ],
      search: [
        { command: 'ابحث عن [الكلمة]', description: 'البحث في النظام' },
      ],
      actions: [
        { command: 'أنشئ [النوع]', description: 'إنشاء عنصر جديد' },
        { command: 'احفظ', description: 'حفظ التغييرات' },
        { command: 'أرسل [إلى]', description: 'إرسال وثيقة أو تقرير' },
        { command: 'حدث [العنصر]', description: 'تحديث معلومات' },
        { command: 'احذف [العنصر]', description: 'حذف عنصر (يتطلب تأكيد)' },
      ]
    } : {
      navigation: [
        { command: 'open [name]', description: 'Open a country or organization dossier' },
        { command: 'show [type]', description: 'Show list (MoUs, documents, etc.)' },
      ],
      search: [
        { command: 'search for [term]', description: 'Search the system' },
        { command: 'find [item]', description: 'Find specific item' },
      ],
      actions: [
        { command: 'create [type]', description: 'Create new item' },
        { command: 'save', description: 'Save changes' },
        { command: 'send [to]', description: 'Send document or report' },
        { command: 'update [item]', description: 'Update information' },
        { command: 'delete [item]', description: 'Delete item (requires confirmation)' },
      ]
    };

    res.json({
      success: true,
      data: commands
    });
  }
);

// Helper function to parse voice commands
function parseVoiceCommand(text: string): any {
  const lowerText = text.toLowerCase().trim();
  
  let action = null;
  let type = null;
  let entity = null;
  let target = null;
  
  // Find command action
  for (const [pattern, info] of Object.entries(COMMAND_PATTERNS)) {
    if (lowerText.includes(pattern)) {
      action = info.action;
      type = info.type;
      break;
    }
  }
  
  // Extract entity
  for (const [pattern, entityType] of Object.entries(ENTITY_PATTERNS)) {
    if (lowerText.includes(pattern)) {
      entity = entityType;
      break;
    }
  }
  
  // Extract target (text after command and entity)
  if (action) {
    const parts = lowerText.split(action);
    if (parts.length > 1) {
      target = parts[1].trim();
      if (entity && target.includes(entity)) {
        target = target.replace(entity, '').trim();
      }
    }
  }
  
  return {
    original_text: text,
    action,
    type,
    entity,
    target,
    confidence: action ? 0.9 : 0.3
  };
}

// Helper function to execute voice commands
async function executeVoiceCommand(command: any, userId?: string): Promise<any> {
  // This would integrate with your actual services
  // Placeholder implementation
  
  switch (command.action) {
    case 'open':
      return {
        action: 'navigate',
        url: `/dossiers/${command.entity}/${command.target}`,
        message: `Opening ${command.entity} ${command.target}`
      };
      
    case 'search':
      return {
        action: 'search',
        query: command.target,
        entity_filter: command.entity,
        message: `Searching for ${command.target}`
      };
      
    case 'create':
      return {
        action: 'create',
        entity_type: command.entity,
        message: `Creating new ${command.entity}`
      };
      
    default:
      return {
        action: 'unknown',
        message: 'Command not recognized'
      };
  }
}

// Helper function to get command suggestions
function getSuggestions(text: string, language: string): string[] {
  const suggestions = [];
  const lowerText = text.toLowerCase();
  
  if (language === 'ar') {
    if (lowerText.includes('فتح')) suggestions.push('افتح ملف السعودية');
    if (lowerText.includes('بحث')) suggestions.push('ابحث عن مذكرات التفاهم');
    if (lowerText.includes('إنشاء')) suggestions.push('أنشئ تقرير جديد');
  } else {
    if (lowerText.includes('open')) suggestions.push('open Saudi Arabia dossier');
    if (lowerText.includes('search')) suggestions.push('search for active MoUs');
    if (lowerText.includes('create')) suggestions.push('create new brief');
  }
  
  return suggestions;
}

export default router;