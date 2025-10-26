/**
 * Query Complexity Budget Validation Middleware
 *
 * Enforces query complexity limits to prevent expensive operations from
 * degrading system performance. Tracks and limits:
 * - Graph traversal depth (max 10 degrees)
 * - Search result pagination (max 1000 results per query)
 * - Relationship query fan-out (max 100 relationships per node)
 * - Calendar date range queries (max 1 year span)
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Query complexity limits configuration
 */
export const COMPLEXITY_LIMITS = {
  // Graph traversal limits
  MAX_GRAPH_DEPTH: 10,
  MAX_GRAPH_NODES: 1000,

  // Search limits
  MAX_SEARCH_RESULTS: 1000,
  MAX_SEARCH_TERMS: 20,

  // Relationship limits
  MAX_RELATIONSHIPS_PER_NODE: 100,
  MAX_RELATIONSHIP_TYPES: 50,

  // Calendar limits
  MAX_CALENDAR_DAYS: 365,
  MAX_EVENTS_PER_QUERY: 500,

  // General pagination limits
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
} as const;

/**
 * Complexity error with specific violation details
 */
export class ComplexityBudgetError extends Error {
  constructor(
    message: string,
    public readonly limit: number,
    public readonly actual: number,
    public readonly parameter: string
  ) {
    super(message);
    this.name = 'ComplexityBudgetError';
  }
}

/**
 * Validate graph traversal query complexity
 */
export function validateGraphQuery(params: {
  depth?: number;
  maxNodes?: number;
}): void {
  const { depth = 1, maxNodes = 100 } = params;

  if (depth > COMPLEXITY_LIMITS.MAX_GRAPH_DEPTH) {
    throw new ComplexityBudgetError(
      `Graph traversal depth ${depth} exceeds maximum allowed depth of ${COMPLEXITY_LIMITS.MAX_GRAPH_DEPTH}`,
      COMPLEXITY_LIMITS.MAX_GRAPH_DEPTH,
      depth,
      'depth'
    );
  }

  if (maxNodes > COMPLEXITY_LIMITS.MAX_GRAPH_NODES) {
    throw new ComplexityBudgetError(
      `Requested node limit ${maxNodes} exceeds maximum of ${COMPLEXITY_LIMITS.MAX_GRAPH_NODES}`,
      COMPLEXITY_LIMITS.MAX_GRAPH_NODES,
      maxNodes,
      'maxNodes'
    );
  }
}

/**
 * Validate search query complexity
 */
export function validateSearchQuery(params: {
  query?: string;
  limit?: number;
}): void {
  const { query = '', limit = COMPLEXITY_LIMITS.DEFAULT_PAGE_SIZE } = params;

  // Count search terms (split by spaces, remove empty strings)
  const terms = query.trim().split(/\s+/).filter(Boolean);

  if (terms.length > COMPLEXITY_LIMITS.MAX_SEARCH_TERMS) {
    throw new ComplexityBudgetError(
      `Search query contains ${terms.length} terms, exceeding maximum of ${COMPLEXITY_LIMITS.MAX_SEARCH_TERMS}`,
      COMPLEXITY_LIMITS.MAX_SEARCH_TERMS,
      terms.length,
      'searchTerms'
    );
  }

  if (limit > COMPLEXITY_LIMITS.MAX_SEARCH_RESULTS) {
    throw new ComplexityBudgetError(
      `Search result limit ${limit} exceeds maximum of ${COMPLEXITY_LIMITS.MAX_SEARCH_RESULTS}`,
      COMPLEXITY_LIMITS.MAX_SEARCH_RESULTS,
      limit,
      'limit'
    );
  }
}

/**
 * Validate relationship query complexity
 */
export function validateRelationshipQuery(params: {
  limit?: number;
  relationshipTypes?: string[];
}): void {
  const { limit = COMPLEXITY_LIMITS.DEFAULT_PAGE_SIZE, relationshipTypes = [] } = params;

  if (limit > COMPLEXITY_LIMITS.MAX_RELATIONSHIPS_PER_NODE) {
    throw new ComplexityBudgetError(
      `Relationship query limit ${limit} exceeds maximum of ${COMPLEXITY_LIMITS.MAX_RELATIONSHIPS_PER_NODE}`,
      COMPLEXITY_LIMITS.MAX_RELATIONSHIPS_PER_NODE,
      limit,
      'limit'
    );
  }

  if (relationshipTypes.length > COMPLEXITY_LIMITS.MAX_RELATIONSHIP_TYPES) {
    throw new ComplexityBudgetError(
      `Filtering by ${relationshipTypes.length} relationship types exceeds maximum of ${COMPLEXITY_LIMITS.MAX_RELATIONSHIP_TYPES}`,
      COMPLEXITY_LIMITS.MAX_RELATIONSHIP_TYPES,
      relationshipTypes.length,
      'relationshipTypes'
    );
  }
}

/**
 * Validate calendar query complexity
 */
export function validateCalendarQuery(params: {
  startDate: string | Date;
  endDate: string | Date;
  limit?: number;
}): void {
  const { startDate, endDate, limit = COMPLEXITY_LIMITS.DEFAULT_PAGE_SIZE } = params;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ComplexityBudgetError(
      'Invalid date format in calendar query',
      0,
      0,
      'dateFormat'
    );
  }

  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > COMPLEXITY_LIMITS.MAX_CALENDAR_DAYS) {
    throw new ComplexityBudgetError(
      `Calendar date range of ${daysDiff} days exceeds maximum of ${COMPLEXITY_LIMITS.MAX_CALENDAR_DAYS} days`,
      COMPLEXITY_LIMITS.MAX_CALENDAR_DAYS,
      daysDiff,
      'dateRange'
    );
  }

  if (daysDiff < 0) {
    throw new ComplexityBudgetError(
      'Calendar end date must be after start date',
      0,
      daysDiff,
      'dateRange'
    );
  }

  if (limit > COMPLEXITY_LIMITS.MAX_EVENTS_PER_QUERY) {
    throw new ComplexityBudgetError(
      `Calendar event limit ${limit} exceeds maximum of ${COMPLEXITY_LIMITS.MAX_EVENTS_PER_QUERY}`,
      COMPLEXITY_LIMITS.MAX_EVENTS_PER_QUERY,
      limit,
      'limit'
    );
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: {
  page?: number;
  pageSize?: number;
}): void {
  const { page = 1, pageSize = COMPLEXITY_LIMITS.DEFAULT_PAGE_SIZE } = params;

  if (page < 1) {
    throw new ComplexityBudgetError(
      'Page number must be at least 1',
      1,
      page,
      'page'
    );
  }

  if (pageSize > COMPLEXITY_LIMITS.MAX_PAGE_SIZE) {
    throw new ComplexityBudgetError(
      `Page size ${pageSize} exceeds maximum of ${COMPLEXITY_LIMITS.MAX_PAGE_SIZE}`,
      COMPLEXITY_LIMITS.MAX_PAGE_SIZE,
      pageSize,
      'pageSize'
    );
  }

  if (pageSize < 1) {
    throw new ComplexityBudgetError(
      'Page size must be at least 1',
      1,
      pageSize,
      'pageSize'
    );
  }
}

/**
 * Express middleware for complexity validation
 *
 * Usage:
 * ```typescript
 * router.get('/api/graph/traverse', complexityValidationMiddleware, handler);
 * ```
 */
export function complexityValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract query parameters
    const { query, body } = req;
    const params = { ...query, ...body };

    // Determine endpoint type and validate accordingly
    const path = req.path;

    if (path.includes('/graph')) {
      validateGraphQuery({
        depth: params.depth ? Number(params.depth) : undefined,
        maxNodes: params.maxNodes ? Number(params.maxNodes) : undefined,
      });
    } else if (path.includes('/search')) {
      validateSearchQuery({
        query: params.query as string,
        limit: params.limit ? Number(params.limit) : undefined,
      });
    } else if (path.includes('/relationship')) {
      validateRelationshipQuery({
        limit: params.limit ? Number(params.limit) : undefined,
        relationshipTypes: Array.isArray(params.relationshipTypes)
          ? params.relationshipTypes
          : undefined,
      });
    } else if (path.includes('/calendar')) {
      if (params.startDate && params.endDate) {
        validateCalendarQuery({
          startDate: params.startDate as string,
          endDate: params.endDate as string,
          limit: params.limit ? Number(params.limit) : undefined,
        });
      }
    }

    // General pagination validation for all endpoints
    if (params.page || params.pageSize) {
      validatePagination({
        page: params.page ? Number(params.page) : undefined,
        pageSize: params.pageSize ? Number(params.pageSize) : undefined,
      });
    }

    next();
  } catch (error) {
    if (error instanceof ComplexityBudgetError) {
      res.status(400).json({
        error: 'Query complexity budget exceeded',
        message: error.message,
        limit: error.limit,
        actual: error.actual,
        parameter: error.parameter,
      });
    } else {
      next(error);
    }
  }
}

/**
 * Sanitize and normalize limit parameter
 * Ensures limit is within bounds and provides default
 */
export function normalizeLimit(limit?: number | string): number {
  const numLimit = typeof limit === 'string' ? Number(limit) : limit;

  if (!numLimit || numLimit < 1) {
    return COMPLEXITY_LIMITS.DEFAULT_PAGE_SIZE;
  }

  return Math.min(numLimit, COMPLEXITY_LIMITS.MAX_PAGE_SIZE);
}

/**
 * Calculate query complexity score (0-100)
 * Higher scores indicate more expensive queries
 */
export function calculateComplexityScore(params: {
  depth?: number;
  nodeCount?: number;
  searchTerms?: number;
  relationshipCount?: number;
  dateRangeDays?: number;
}): number {
  let score = 0;

  // Graph depth contributes 0-40 points
  if (params.depth) {
    score += (params.depth / COMPLEXITY_LIMITS.MAX_GRAPH_DEPTH) * 40;
  }

  // Node count contributes 0-20 points
  if (params.nodeCount) {
    score += (params.nodeCount / COMPLEXITY_LIMITS.MAX_GRAPH_NODES) * 20;
  }

  // Search terms contribute 0-15 points
  if (params.searchTerms) {
    score += (params.searchTerms / COMPLEXITY_LIMITS.MAX_SEARCH_TERMS) * 15;
  }

  // Relationship count contributes 0-15 points
  if (params.relationshipCount) {
    score += (params.relationshipCount / COMPLEXITY_LIMITS.MAX_RELATIONSHIPS_PER_NODE) * 15;
  }

  // Date range contributes 0-10 points
  if (params.dateRangeDays) {
    score += (params.dateRangeDays / COMPLEXITY_LIMITS.MAX_CALENDAR_DAYS) * 10;
  }

  return Math.min(Math.round(score), 100);
}
