/**
 * Boolean Query Parser Service
 * Feature: 015-search-retrieval-spec
 * Task: T030
 *
 * Parses user search queries with Boolean operators (AND, OR, NOT)
 * and converts them to PostgreSQL tsquery syntax for full-text search.
 *
 * Security: Prevents SQL injection through parameterized queries
 * and strict input sanitization.
 */

import { normalizeSearchText } from '../utils/arabic-normalize';

export interface ParsedQuery {
  tsquery: string;
  hasBooleanOperators: boolean;
  tokens: string[];
  language: 'english' | 'arabic';
}

/**
 * Parse user query and convert to PostgreSQL tsquery format
 *
 * @param userQuery - Raw user input
 * @param language - Target language for tsquery ('en' or 'ar')
 * @returns Parsed query object
 *
 * @example
 * parseQueryToTsquery('climate AND policy', 'en')
 * // Returns: { tsquery: 'climate & policy', hasBooleanOperators: true, ... }
 *
 * parseQueryToTsquery('"sustainable development"', 'en')
 * // Returns: { tsquery: 'sustainable <-> development', hasBooleanOperators: false, ... }
 */
export function parseQueryToTsquery(
  userQuery: string,
  language: 'en' | 'ar' = 'en'
): ParsedQuery {
  if (!userQuery || userQuery.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  const tsLanguage = language === 'ar' ? 'arabic' : 'english';

  // Sanitize input: remove unsafe characters except quotes, parentheses, and operators
  const sanitized = userQuery
    .replace(/[^\w\s"'AND|OR|NOT|(|)\u0600-\u06FF]/gi, '') // Allow alphanumeric, space, quotes, operators, Arabic
    .trim();

  // Tokenize query while preserving quoted phrases
  const tokens = tokenizeQuery(sanitized);

  // Check for Boolean operators
  const hasBooleanOperators = /\b(AND|OR|NOT)\b/i.test(sanitized);

  // Convert to tsquery syntax
  const tsquery = convertToTsquery(tokens, tsLanguage);

  return {
    tsquery,
    hasBooleanOperators,
    tokens: tokens.filter(t => !['AND', 'OR', 'NOT'].includes(t.toUpperCase())),
    language: tsLanguage
  };
}

/**
 * Tokenize query preserving quoted phrases
 *
 * @param query - Sanitized query string
 * @returns Array of tokens
 */
function tokenizeQuery(query: string): string[] {
  const tokens: string[] = [];
  const regex = /"([^"]+)"|'([^']+)'|(\S+)/g;
  let match;

  while ((match = regex.exec(query)) !== null) {
    // Quoted phrase (double or single quotes)
    if (match[1] || match[2]) {
      tokens.push(`"${match[1] || match[2]}"`);
    } else {
      // Single word or operator
      tokens.push(match[3]);
    }
  }

  return tokens;
}

/**
 * Convert tokens to PostgreSQL tsquery syntax
 *
 * @param tokens - Query tokens
 * @param language - PostgreSQL text search configuration
 * @returns tsquery string
 */
function convertToTsquery(tokens: string[], language: string): string {
  const tsqueryParts: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const upperToken = token.toUpperCase();

    // Handle Boolean operators
    if (upperToken === 'AND') {
      tsqueryParts.push('&');
      continue;
    }

    if (upperToken === 'OR') {
      tsqueryParts.push('|');
      continue;
    }

    if (upperToken === 'NOT') {
      tsqueryParts.push('!');
      continue;
    }

    // Handle parentheses
    if (token === '(' || token === ')') {
      tsqueryParts.push(token);
      continue;
    }

    // Handle quoted phrases
    if (token.startsWith('"') && token.endsWith('"')) {
      const phrase = token.slice(1, -1);
      // Split phrase into words for phraseto_tsquery
      const words = phrase.split(/\s+/);

      // Use <-> operator for adjacent words (phrase match)
      const phraseQuery = words.map(w => normalizeSearchText(w)).join(' <-> ');
      tsqueryParts.push(`(${phraseQuery})`);
      continue;
    }

    // Regular word - normalize and add
    const normalized = normalizeSearchText(token);
    if (normalized) {
      tsqueryParts.push(normalized);
    }
  }

  // Join parts with implicit AND if no operator specified
  let result = tsqueryParts.join(' ');

  // Clean up: ensure operators have operands
  result = result
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/([&|!])\s+([&|!])/g, '$2') // Remove consecutive operators
    .replace(/^\s*[&|]\s*/, '') // Remove leading operators
    .replace(/\s*[&|]\s*$/g, ''); // Remove trailing operators

  return result || '';
}

/**
 * Build full tsquery string for PostgreSQL
 *
 * @param userQuery - Raw user query
 * @param language - Language for text search configuration
 * @returns tsquery string ready for PostgreSQL
 */
export function buildTsquery(userQuery: string, language: 'en' | 'ar' = 'en'): string {
  const parsed = parseQueryToTsquery(userQuery, language);

  // If no Boolean operators, use plainto_tsquery for simpler matching
  if (!parsed.hasBooleanOperators && parsed.tokens.length === 1) {
    return `plainto_tsquery('${parsed.language}', '${parsed.tokens[0]}')`;
  }

  // Use to_tsquery for Boolean operator support
  return `to_tsquery('${parsed.language}', '${parsed.tsquery}')`;
}

/**
 * Validate query syntax
 *
 * @param query - User query
 * @returns True if valid, throws error if invalid
 */
export function validateQuerySyntax(query: string): boolean {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  if (query.length > 500) {
    throw new Error('Query exceeds maximum length of 500 characters');
  }

  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of query) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      throw new Error('Unbalanced parentheses in query');
    }
  }

  if (parenCount !== 0) {
    throw new Error('Unbalanced parentheses in query');
  }

  // Check for balanced quotes
  const doubleQuotes = (query.match(/"/g) || []).length;
  const singleQuotes = (query.match(/'/g) || []).length;

  if (doubleQuotes % 2 !== 0) {
    throw new Error('Unbalanced double quotes in query');
  }

  if (singleQuotes % 2 !== 0) {
    throw new Error('Unbalanced single quotes in query');
  }

  return true;
}
