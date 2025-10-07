/**
 * Search Input Validation Middleware
 * Feature: 015-search-retrieval-spec
 * Task: T038
 *
 * Validates and sanitizes search requests:
 * - Query length <= 500 chars (truncate if longer)
 * - Entity type validation
 * - Limit/offset validation
 * - SQL injection prevention
 * - Boolean operator syntax validation
 * - Bilingual error messages
 */

import { Request, Response, NextFunction } from 'express';

const MAX_QUERY_LENGTH = 500;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const VALID_ENTITY_TYPES = [
  'all',
  'dossiers',
  'people',
  'engagements',
  'positions',
  'mous',
  'documents'
];

const ALLOWED_BOOLEAN_OPERATORS = ['AND', 'OR', 'NOT'];

export interface ValidationWarning {
  code: string;
  message_en: string;
  message_ar: string;
}

/**
 * Validation middleware for search requests
 */
export function validateSearchRequest(req: Request, res: Response, next: NextFunction): void {
  const warnings: ValidationWarning[] = [];

  // Validate query parameter
  if (!req.query.q && !req.query.query) {
    res.status(400).json({
      error: {
        code: 'MISSING_QUERY',
        message_en: 'Search query is required',
        message_ar: 'استعلام البحث مطلوب',
      }
    });
    return;
  }

  // Get and sanitize query
  let query = (req.query.q || req.query.query) as string;

  // Truncate if too long
  if (query.length > MAX_QUERY_LENGTH) {
    warnings.push({
      code: 'QUERY_TRUNCATED',
      message_en: `Query truncated to ${MAX_QUERY_LENGTH} characters`,
      message_ar: `تم اقتطاع الاستعلام إلى ${MAX_QUERY_LENGTH} حرفًا`,
    });
    query = query.substring(0, MAX_QUERY_LENGTH);
  }

  // Sanitize query - remove potentially harmful characters
  const sanitizedQuery = sanitizeQuery(query);

  // Validate Boolean operators if present
  if (containsBooleanOperators(sanitizedQuery)) {
    const operatorValidation = validateBooleanOperators(sanitizedQuery);
    if (!operatorValidation.valid) {
      res.status(400).json({
        error: {
          code: 'INVALID_BOOLEAN_SYNTAX',
          message_en: operatorValidation.message_en,
          message_ar: operatorValidation.message_ar,
        }
      });
      return;
    }
  }

  // Validate entity type
  const entityTypeParam = req.query.type || req.query.entity_type;
  let entityTypes: string[] = [];

  if (entityTypeParam) {
    const types = typeof entityTypeParam === 'string'
      ? entityTypeParam.split(',').map(t => t.trim())
      : [entityTypeParam as string];

    // Validate each type
    const invalidTypes = types.filter(type => !VALID_ENTITY_TYPES.includes(type));

    if (invalidTypes.length > 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_ENTITY_TYPE',
          message_en: `Invalid entity type(s): ${invalidTypes.join(', ')}. Valid types: ${VALID_ENTITY_TYPES.join(', ')}`,
          message_ar: `نوع كيان غير صالح: ${invalidTypes.join('، ')}. الأنواع الصالحة: ${VALID_ENTITY_TYPES.join('، ')}`,
        }
      });
      return;
    }

    entityTypes = types;
  }

  // Validate limit
  let limit = DEFAULT_LIMIT;
  if (req.query.limit) {
    const parsedLimit = parseInt(req.query.limit as string, 10);

    if (isNaN(parsedLimit)) {
      res.status(400).json({
        error: {
          code: 'INVALID_LIMIT',
          message_en: 'Limit must be a number',
          message_ar: 'يجب أن يكون الحد رقمًا',
        }
      });
      return;
    }

    if (parsedLimit < MIN_LIMIT || parsedLimit > MAX_LIMIT) {
      res.status(400).json({
        error: {
          code: 'LIMIT_OUT_OF_RANGE',
          message_en: `Limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}`,
          message_ar: `يجب أن يكون الحد بين ${MIN_LIMIT} و ${MAX_LIMIT}`,
        }
      });
      return;
    }

    limit = parsedLimit;
  }

  // Validate offset
  let offset = 0;
  if (req.query.offset) {
    const parsedOffset = parseInt(req.query.offset as string, 10);

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_OFFSET',
          message_en: 'Offset must be a non-negative number',
          message_ar: 'يجب أن يكون الإزاحة رقمًا غير سالب',
        }
      });
      return;
    }

    offset = parsedOffset;
  }

  // Validate language parameter
  if (req.query.lang && !['en', 'ar', 'both'].includes(req.query.lang as string)) {
    res.status(400).json({
      error: {
        code: 'INVALID_LANGUAGE',
        message_en: 'Language must be one of: en, ar, both',
        message_ar: 'يجب أن تكون اللغة واحدة من: en، ar، both',
      }
    });
    return;
  }

  // Attach validated parameters to request
  (req as any).validatedSearch = {
    query: sanitizedQuery,
    entityTypes,
    limit,
    offset,
    includeArchived: req.query.include_archived === 'true',
    language: req.query.lang || 'both',
    warnings
  };

  next();
}

/**
 * Sanitize query to prevent SQL injection
 */
function sanitizeQuery(query: string): string {
  // Remove potentially harmful SQL characters
  // Keep alphanumeric, spaces, quotes, parentheses, and allowed operators
  return query
    .replace(/[;\\]/g, '') // Remove semicolons and backslashes
    .replace(/--/g, '')     // Remove SQL comment syntax
    .replace(/\/\*/g, '')   // Remove block comment start
    .replace(/\*\//g, '')   // Remove block comment end
    .trim();
}

/**
 * Check if query contains Boolean operators
 */
function containsBooleanOperators(query: string): boolean {
  return ALLOWED_BOOLEAN_OPERATORS.some(op =>
    query.toUpperCase().includes(` ${op} `)
  );
}

/**
 * Validate Boolean operator syntax
 */
function validateBooleanOperators(query: string): {
  valid: boolean;
  message_en?: string;
  message_ar?: string;
} {
  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of query) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return {
        valid: false,
        message_en: 'Unbalanced parentheses in Boolean expression',
        message_ar: 'أقواس غير متوازنة في التعبير المنطقي',
      };
    }
  }

  if (parenCount !== 0) {
    return {
      valid: false,
      message_en: 'Unbalanced parentheses in Boolean expression',
      message_ar: 'أقواس غير متوازنة في التعبير المنطقي',
    };
  }

  // Check for empty parentheses
  if (query.includes('()')) {
    return {
      valid: false,
      message_en: 'Empty parentheses in Boolean expression',
      message_ar: 'أقواس فارغة في التعبير المنطقي',
    };
  }

  // Check for operator at start or end
  for (const op of ALLOWED_BOOLEAN_OPERATORS) {
    if (query.trim().toUpperCase().startsWith(op + ' ')) {
      return {
        valid: false,
        message_en: `Boolean expression cannot start with operator: ${op}`,
        message_ar: `لا يمكن أن يبدأ التعبير المنطقي بمشغل: ${op}`,
      };
    }

    if (query.trim().toUpperCase().endsWith(' ' + op)) {
      return {
        valid: false,
        message_en: `Boolean expression cannot end with operator: ${op}`,
        message_ar: `لا يمكن أن ينتهي التعبير المنطقي بمشغل: ${op}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validation middleware for semantic search requests (POST)
 */
export function validateSemanticSearchRequest(req: Request, res: Response, next: NextFunction): void {
  const warnings: ValidationWarning[] = [];

  // Validate request body exists
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({
      error: {
        code: 'INVALID_REQUEST_BODY',
        message_en: 'Request body is required',
        message_ar: 'نص الطلب مطلوب',
      }
    });
    return;
  }

  // Validate query
  if (!req.body.query || typeof req.body.query !== 'string') {
    res.status(400).json({
      error: {
        code: 'MISSING_QUERY',
        message_en: 'Search query is required',
        message_ar: 'استعلام البحث مطلوب',
      }
    });
    return;
  }

  let query = req.body.query;

  // Truncate if too long
  if (query.length > MAX_QUERY_LENGTH) {
    warnings.push({
      code: 'QUERY_TRUNCATED',
      message_en: `Query truncated to ${MAX_QUERY_LENGTH} characters`,
      message_ar: `تم اقتطاع الاستعلام إلى ${MAX_QUERY_LENGTH} حرفًا`,
    });
    query = query.substring(0, MAX_QUERY_LENGTH);
  }

  // Validate entity types for semantic search
  const validSemanticTypes = ['positions', 'documents', 'briefs'];
  let entityTypes: string[] = validSemanticTypes;

  if (req.body.entity_types && Array.isArray(req.body.entity_types)) {
    const invalidTypes = req.body.entity_types.filter(
      (type: string) => !validSemanticTypes.includes(type)
    );

    if (invalidTypes.length > 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_ENTITY_TYPE',
          message_en: `Invalid entity type(s) for semantic search: ${invalidTypes.join(', ')}. Valid types: ${validSemanticTypes.join(', ')}`,
          message_ar: `نوع كيان غير صالح للبحث الدلالي: ${invalidTypes.join('، ')}. الأنواع الصالحة: ${validSemanticTypes.join('، ')}`,
        }
      });
      return;
    }

    entityTypes = req.body.entity_types;
  }

  // Validate similarity threshold
  let similarityThreshold = 0.6; // Default
  if (req.body.similarity_threshold !== undefined) {
    const threshold = parseFloat(req.body.similarity_threshold);

    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      res.status(400).json({
        error: {
          code: 'INVALID_SIMILARITY_THRESHOLD',
          message_en: 'Similarity threshold must be a number between 0 and 1',
          message_ar: 'يجب أن يكون عتبة التشابه رقمًا بين 0 و 1',
        }
      });
      return;
    }

    similarityThreshold = threshold;
  }

  // Validate limit
  let limit = DEFAULT_LIMIT;
  if (req.body.limit !== undefined) {
    const parsedLimit = parseInt(req.body.limit, 10);

    if (isNaN(parsedLimit) || parsedLimit < MIN_LIMIT || parsedLimit > MAX_LIMIT) {
      res.status(400).json({
        error: {
          code: 'LIMIT_OUT_OF_RANGE',
          message_en: `Limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}`,
          message_ar: `يجب أن يكون الحد بين ${MIN_LIMIT} و ${MAX_LIMIT}`,
        }
      });
      return;
    }

    limit = parsedLimit;
  }

  // Attach validated parameters to request
  (req as any).validatedSemanticSearch = {
    query,
    entityTypes,
    similarityThreshold,
    limit,
    includeKeywordResults: req.body.include_keyword_results === true,
    warnings
  };

  next();
}
