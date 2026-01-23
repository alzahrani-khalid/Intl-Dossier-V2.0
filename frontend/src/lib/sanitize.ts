/**
 * HTML Sanitization Utilities
 *
 * Provides safe HTML rendering using DOMPurify with allowlist-based configuration.
 * Use these functions to prevent XSS attacks when rendering user-generated or
 * external HTML content.
 */

import DOMPurify from 'isomorphic-dompurify'

// ============================================================================
// Configuration
// ============================================================================

/**
 * Allowlist of safe HTML tags for general content
 * Excludes scripts, iframes, and other dangerous elements
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'a',
  'ul',
  'ol',
  'li',
  'span',
  'div',
  'mark',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'code',
  'pre',
]

/**
 * Allowlist of safe HTML attributes
 * Only allows href for links, and safe attributes like class and id
 */
const ALLOWED_ATTR = ['href', 'class', 'id', 'title', 'target', 'rel']

/**
 * Allowlist for URL protocols - only allow safe protocols
 */
const ALLOWED_URI_REGEXP = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i

/**
 * Minimal allowlist for highlighted search results
 * Only allows mark and span tags for highlighting
 */
const HIGHLIGHT_ALLOWED_TAGS = ['mark', 'span', 'strong', 'em']

/**
 * DOMPurify configuration for general HTML sanitization
 */
const SANITIZE_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOWED_URI_REGEXP,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
  KEEP_CONTENT: true,
  RETURN_TRUSTED_TYPE: false,
}

/**
 * DOMPurify configuration for highlighted text (search results)
 */
const HIGHLIGHT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: HIGHLIGHT_ALLOWED_TAGS,
  ALLOWED_ATTR: ['class', 'id'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
  KEEP_CONTENT: true,
  RETURN_TRUSTED_TYPE: false,
}

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitizes HTML content to prevent XSS attacks
 *
 * Uses DOMPurify with an allowlist approach to strip dangerous elements
 * while preserving safe HTML formatting.
 *
 * @param dirty - Untrusted HTML string (from user input, external sources, etc.)
 * @returns Sanitized HTML string safe for rendering with dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * // Sanitize user-generated content
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.content_html) }} />
 *
 * // Sanitize email content from external sources
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.body_html) }} />
 * ```
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) {
    return ''
  }

  return DOMPurify.sanitize(dirty, SANITIZE_CONFIG)
}

/**
 * Sanitizes highlighted text for search results
 *
 * More restrictive than sanitizeHtml() - only allows mark, span, strong, and em
 * tags for highlighting search terms. Use this for search snippets and titles.
 *
 * @param dirty - HTML string with search highlighting (e.g., with <mark> tags)
 * @returns Sanitized HTML string with only highlighting tags preserved
 *
 * @example
 * ```tsx
 * // Sanitize search result snippets
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHighlightedText(result.snippet) }} />
 *
 * // Sanitize highlighted titles
 * <h3 dangerouslySetInnerHTML={{ __html: sanitizeHighlightedText(result.title) }} />
 * ```
 */
export function sanitizeHighlightedText(dirty: string | null | undefined): string {
  if (!dirty) {
    return ''
  }

  return DOMPurify.sanitize(dirty, HIGHLIGHT_CONFIG)
}

/**
 * Checks if a string contains potentially dangerous HTML
 *
 * Useful for logging or auditing purposes. Returns true if the input
 * contains scripts, event handlers, or other dangerous patterns.
 *
 * @param html - HTML string to check
 * @returns True if dangerous patterns are detected
 *
 * @example
 * ```ts
 * if (containsDangerousHtml(userInput)) {
 *   console.warn('Attempted XSS detected:', userInput)
 * }
 * ```
 */
export function containsDangerousHtml(html: string | null | undefined): boolean {
  if (!html) {
    return false
  }

  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=, onerror=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
  ]

  return dangerousPatterns.some((pattern) => pattern.test(html))
}

/**
 * Strips all HTML tags from a string
 *
 * Use this when you want plain text only (e.g., for meta descriptions,
 * notification messages, or places where HTML is not allowed).
 *
 * @param html - HTML string to strip
 * @returns Plain text with all HTML tags removed
 *
 * @example
 * ```ts
 * const plainText = stripHtml('<p>Hello <strong>world</strong></p>')
 * // Returns: "Hello world"
 * ```
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) {
    return ''
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  })
}
