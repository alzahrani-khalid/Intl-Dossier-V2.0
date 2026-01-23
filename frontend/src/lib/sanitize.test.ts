import { describe, it, expect } from 'vitest'
import {
  sanitizeHtml,
  sanitizeHighlightedText,
  containsDangerousHtml,
  stripHtml,
} from './sanitize'

describe('sanitizeHtml', () => {
  it('removes script tags and their content', () => {
    const malicious = '<p>Hello</p><script>alert("XSS")</script><p>World</p>'
    const result = sanitizeHtml(malicious)
    expect(result).not.toContain('<script')
    expect(result).not.toContain('alert')
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('strips event handlers from elements', () => {
    const malicious = '<div onclick="alert(\'XSS\')">Click me</div>'
    const result = sanitizeHtml(malicious)
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('alert')
    expect(result).toContain('Click me')
  })

  it('removes multiple types of event handlers', () => {
    const malicious = `
      <img src="x" onerror="alert('XSS')">
      <button onmouseover="steal()">Hover</button>
      <a href="#" onload="malicious()">Link</a>
    `
    const result = sanitizeHtml(malicious)
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('onmouseover')
    expect(result).not.toContain('onload')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('steal')
    expect(result).not.toContain('malicious()')
  })

  it('preserves safe HTML formatting tags', () => {
    const safe = '<p>Hello <strong>world</strong> with <em>emphasis</em></p>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('<p>')
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
    expect(result).toContain('Hello')
    expect(result).toContain('world')
    expect(result).toContain('emphasis')
  })

  it('preserves safe link tags with https protocol', () => {
    const safe = '<a href="https://example.com">Link</a>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('<a')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('Link')
  })

  it('preserves safe link tags with http protocol', () => {
    const safe = '<a href="http://example.com">Link</a>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('<a')
    expect(result).toContain('href="http://example.com"')
    expect(result).toContain('Link')
  })

  it('preserves mailto links', () => {
    const safe = '<a href="mailto:test@example.com">Email</a>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('<a')
    expect(result).toContain('mailto:test@example.com')
    expect(result).toContain('Email')
  })

  it('preserves tel links', () => {
    const safe = '<a href="tel:+1234567890">Call</a>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('<a')
    expect(result).toContain('tel:+1234567890')
    expect(result).toContain('Call')
  })

  it('removes javascript: protocol from links', () => {
    const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>'
    const result = sanitizeHtml(malicious)
    expect(result).not.toContain('javascript:')
    expect(result).not.toContain('alert')
    // Content should be preserved but not the href
    expect(result).toContain('Click')
  })

  it('removes data: protocol from links', () => {
    const malicious = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>'
    const result = sanitizeHtml(malicious)
    expect(result).not.toContain('data:text/html')
    expect(result).not.toContain('<script')
    expect(result).toContain('Click')
  })

  it('removes iframe tags', () => {
    const malicious = '<iframe src="evil.com"></iframe><p>Content</p>'
    const result = sanitizeHtml(malicious)
    expect(result).not.toContain('<iframe')
    expect(result).not.toContain('evil.com')
    expect(result).toContain('Content')
  })

  it('removes object and embed tags', () => {
    const malicious = '<object data="evil.swf"></object><embed src="bad.swf">'
    const result = sanitizeHtml(malicious)
    expect(result).not.toContain('<object')
    expect(result).not.toContain('<embed')
    expect(result).not.toContain('evil.swf')
    expect(result).not.toContain('bad.swf')
  })

  it('preserves list structures', () => {
    const safe = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>')
    expect(result).toContain('Item 1')
    expect(result).toContain('Item 2')
  })

  it('preserves heading tags', () => {
    const safe = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('<h1>')
    expect(result).toContain('<h2>')
    expect(result).toContain('<h3>')
    expect(result).toContain('Title')
    expect(result).toContain('Subtitle')
    expect(result).toContain('Section')
  })

  it('preserves code and pre tags', () => {
    const safe = '<pre><code>const x = 1;</code></pre>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('<pre>')
    expect(result).toContain('<code>')
    expect(result).toContain('const x = 1;')
  })

  it('preserves blockquote tags', () => {
    const safe = '<blockquote>Quote text</blockquote>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('<blockquote>')
    expect(result).toContain('Quote text')
  })

  it('preserves safe class attributes', () => {
    const safe = '<div class="container">Content</div>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('class="container"')
    expect(result).toContain('Content')
  })

  it('preserves safe id attributes', () => {
    const safe = '<div id="main">Content</div>'
    const result = sanitizeHtml(safe)
    expect(result).toContain('id="main"')
    expect(result).toContain('Content')
  })

  it('returns empty string for null input', () => {
    const result = sanitizeHtml(null)
    expect(result).toBe('')
  })

  it('returns empty string for undefined input', () => {
    const result = sanitizeHtml(undefined)
    expect(result).toBe('')
  })

  it('returns empty string for empty string input', () => {
    const result = sanitizeHtml('')
    expect(result).toBe('')
  })

  it('handles complex nested malicious content', () => {
    const malicious = `
      <div>
        <p>Safe content</p>
        <script>alert('XSS1')</script>
        <div onclick="alert('XSS2')">
          <strong>Bold</strong>
          <img src="x" onerror="alert('XSS3')">
        </div>
        <iframe src="evil.com"></iframe>
      </div>
    `
    const result = sanitizeHtml(malicious)
    expect(result).toContain('Safe content')
    expect(result).toContain('<strong>')
    expect(result).toContain('Bold')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('<iframe')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('evil.com')
  })
})

describe('sanitizeHighlightedText', () => {
  it('preserves mark tags for search highlighting', () => {
    const highlighted = 'This is <mark>highlighted</mark> text'
    const result = sanitizeHighlightedText(highlighted)
    expect(result).toContain('<mark>')
    expect(result).toContain('highlighted')
  })

  it('preserves span tags for highlighting', () => {
    const highlighted = 'Text with <span class="highlight">span</span>'
    const result = sanitizeHighlightedText(highlighted)
    expect(result).toContain('<span')
    expect(result).toContain('span')
  })

  it('preserves strong and em tags', () => {
    const highlighted = '<strong>Bold</strong> and <em>italic</em>'
    const result = sanitizeHighlightedText(highlighted)
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
    expect(result).toContain('Bold')
    expect(result).toContain('italic')
  })

  it('removes script tags from highlighted text', () => {
    const malicious = '<mark>Search</mark><script>alert("XSS")</script>'
    const result = sanitizeHighlightedText(malicious)
    expect(result).toContain('<mark>')
    expect(result).toContain('Search')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('alert')
  })

  it('removes event handlers from highlighted text', () => {
    const malicious = '<mark onclick="alert(\'XSS\')">Click</mark>'
    const result = sanitizeHighlightedText(malicious)
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('alert')
    expect(result).toContain('Click')
  })

  it('removes paragraph tags (not in allowlist)', () => {
    const input = '<p>Text</p><mark>Highlighted</mark>'
    const result = sanitizeHighlightedText(input)
    expect(result).not.toContain('<p>')
    expect(result).toContain('Text')
    expect(result).toContain('<mark>')
    expect(result).toContain('Highlighted')
  })

  it('removes link tags (not in allowlist)', () => {
    const input = '<a href="evil.com">Link</a><mark>Safe</mark>'
    const result = sanitizeHighlightedText(input)
    expect(result).not.toContain('<a')
    expect(result).not.toContain('href')
    expect(result).toContain('Link')
    expect(result).toContain('<mark>')
  })

  it('preserves class and id attributes', () => {
    const input = '<mark class="search-hit" id="result-1">Text</mark>'
    const result = sanitizeHighlightedText(input)
    expect(result).toContain('class="search-hit"')
    expect(result).toContain('id="result-1"')
  })

  it('returns empty string for null input', () => {
    const result = sanitizeHighlightedText(null)
    expect(result).toBe('')
  })

  it('returns empty string for undefined input', () => {
    const result = sanitizeHighlightedText(undefined)
    expect(result).toBe('')
  })

  it('returns empty string for empty string input', () => {
    const result = sanitizeHighlightedText('')
    expect(result).toBe('')
  })

  it('handles complex search result highlighting', () => {
    const input =
      'The <mark>keyword</mark> appears in <strong>bold</strong> and <em>italic</em> contexts'
    const result = sanitizeHighlightedText(input)
    expect(result).toContain('<mark>')
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
    expect(result).toContain('keyword')
    expect(result).toContain('bold')
    expect(result).toContain('italic')
  })
})

describe('containsDangerousHtml', () => {
  it('detects script tags', () => {
    const malicious = '<script>alert("XSS")</script>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects script tags case-insensitively', () => {
    const malicious = '<SCRIPT>alert("XSS")</SCRIPT>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects javascript: protocol', () => {
    const malicious = '<a href="javascript:alert(\'XSS\')">Link</a>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects javascript: protocol case-insensitively', () => {
    const malicious = '<a href="JavaScript:alert(\'XSS\')">Link</a>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects onclick event handler', () => {
    const malicious = '<div onclick="alert(\'XSS\')">Click</div>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects onerror event handler', () => {
    const malicious = '<img src="x" onerror="alert(\'XSS\')">'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects onload event handler', () => {
    const malicious = '<body onload="alert(\'XSS\')">'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects onmouseover event handler', () => {
    const malicious = '<div onmouseover="steal()">Hover</div>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects iframe tags', () => {
    const malicious = '<iframe src="evil.com"></iframe>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects object tags', () => {
    const malicious = '<object data="evil.swf"></object>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects embed tags', () => {
    const malicious = '<embed src="bad.swf">'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('detects data:text/html protocol', () => {
    const malicious = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Link</a>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })

  it('returns false for safe HTML', () => {
    const safe = '<p>Hello <strong>world</strong></p>'
    expect(containsDangerousHtml(safe)).toBe(false)
  })

  it('returns false for safe links', () => {
    const safe = '<a href="https://example.com">Link</a>'
    expect(containsDangerousHtml(safe)).toBe(false)
  })

  it('returns false for null input', () => {
    expect(containsDangerousHtml(null)).toBe(false)
  })

  it('returns false for undefined input', () => {
    expect(containsDangerousHtml(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(containsDangerousHtml('')).toBe(false)
  })

  it('detects multiple dangerous patterns', () => {
    const malicious = '<script>alert(1)</script><iframe src="x"></iframe><div onclick="bad()">Click</div>'
    expect(containsDangerousHtml(malicious)).toBe(true)
  })
})

describe('stripHtml', () => {
  it('removes all HTML tags and returns plain text', () => {
    const html = '<p>Hello <strong>world</strong></p>'
    const result = stripHtml(html)
    expect(result).toBe('Hello world')
    expect(result).not.toContain('<p>')
    expect(result).not.toContain('<strong>')
  })

  it('removes complex nested HTML', () => {
    const html = '<div><p>Text with <em>emphasis</em> and <strong>bold</strong></p></div>'
    const result = stripHtml(html)
    expect(result).toBe('Text with emphasis and bold')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })

  it('removes script tags and their content', () => {
    const html = '<p>Safe</p><script>alert("XSS")</script>'
    const result = stripHtml(html)
    expect(result).toContain('Safe')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('XSS')
    expect(result).not.toContain('<script')
  })

  it('removes links but keeps their text', () => {
    const html = '<a href="https://example.com">Click here</a>'
    const result = stripHtml(html)
    expect(result).toBe('Click here')
    expect(result).not.toContain('<a')
    expect(result).not.toContain('href')
  })

  it('removes list markup but keeps content', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    const result = stripHtml(html)
    expect(result).toContain('Item 1')
    expect(result).toContain('Item 2')
    expect(result).not.toContain('<ul>')
    expect(result).not.toContain('<li>')
  })

  it('handles HTML entities correctly', () => {
    const html = '<p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p>'
    const result = stripHtml(html)
    expect(result).toContain('<script>')
    expect(result).toContain('alert')
    expect(result).not.toContain('&lt;')
    expect(result).not.toContain('&quot;')
  })

  it('returns empty string for null input', () => {
    const result = stripHtml(null)
    expect(result).toBe('')
  })

  it('returns empty string for undefined input', () => {
    const result = stripHtml(undefined)
    expect(result).toBe('')
  })

  it('returns empty string for empty string input', () => {
    const result = stripHtml('')
    expect(result).toBe('')
  })

  it('preserves whitespace structure', () => {
    const html = '<p>Line 1</p><p>Line 2</p>'
    const result = stripHtml(html)
    expect(result).toContain('Line 1')
    expect(result).toContain('Line 2')
  })

  it('removes mark tags from search highlights', () => {
    const html = 'Text with <mark>highlighted</mark> content'
    const result = stripHtml(html)
    expect(result).toBe('Text with highlighted content')
    expect(result).not.toContain('<mark>')
  })

  it('handles deeply nested structures', () => {
    const html = '<div><section><article><p><span><strong>Text</strong></span></p></article></section></div>'
    const result = stripHtml(html)
    expect(result).toBe('Text')
    expect(result).not.toContain('<')
  })

  it('handles mixed content with malicious payloads', () => {
    const html = '<p>Safe</p><script>evil()</script><img onerror="bad()" src="x"><p>Content</p>'
    const result = stripHtml(html)
    expect(result).toContain('Safe')
    expect(result).toContain('Content')
    expect(result).not.toContain('evil')
    expect(result).not.toContain('bad')
    expect(result).not.toContain('<')
  })
})
