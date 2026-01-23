# Manual XSS Testing Guide
## Security Verification for Task 012 - XSS Vulnerability Fixes

**Test Date**: To be performed after deployment
**Tester**: Security team / QA engineer
**Risk Level**: HIGH - MANDATORY before production deployment
**Estimated Time**: 30-45 minutes

---

## Overview

This guide provides step-by-step instructions for manually testing XSS (Cross-Site Scripting) vulnerability fixes across the Intl-Dossier application. All tests should FAIL to execute malicious scripts (a PASS for security).

## Prerequisites

1. **Test Environment**:
   - Access to staging/development environment
   - Browser with DevTools (Chrome/Firefox recommended)
   - Test user account with appropriate permissions

2. **Test Data Requirements**:
   - Ability to create comments on dossiers
   - Ability to view/create email threads
   - Ability to perform searches

3. **Browser Setup**:
   - Open Browser DevTools (F12)
   - Navigate to Console tab
   - Keep Console open during all tests to detect any alert() executions

---

## Test Categories

### 1. Comment Component XSS Testing

**Target Component**: `CommentItem.tsx`
**Vulnerability Fixed**: Line 116 - `comment.content_html`
**Sanitization**: Uses `sanitizeHtml()` wrapper

#### Test Payloads:

| # | Payload | Expected Result |
|---|---------|----------------|
| 1.1 | `<script>alert('XSS-Comment-1')</script>` | Script tag stripped, no alert |
| 1.2 | `<img src=x onerror=alert('XSS-Comment-2')>` | onerror handler removed, broken image icon |
| 1.3 | `<div onclick="alert('XSS-Comment-3')">Click me</div>` | onclick handler removed, plain text |
| 1.4 | `<a href="javascript:alert('XSS-Comment-4')">Link</a>` | javascript: protocol blocked, safe link or removed |
| 1.5 | `<iframe src="https://evil.com"></iframe>` | iframe tag stripped completely |
| 1.6 | `<object data="data:text/html,<script>alert('XSS')</script>"></object>` | object tag stripped |
| 1.7 | `<svg onload=alert('XSS-Comment-7')>` | onload handler removed |

#### Test Procedure:

1. **Navigate** to any dossier detail page (country, organization, etc.)
2. **Scroll** to the comments section
3. **Create a new comment** with test payload 1.1:
   - Enter: `<script>alert('XSS-Comment-1')</script>`
   - Click "Post Comment" or equivalent
4. **Verify**:
   - ✅ NO alert dialog appears
   - ✅ Comment displays with script tags stripped (empty or "scriptalert('XSS-Comment-1')/script")
   - ✅ Browser console shows no errors
5. **Repeat** for payloads 1.2 through 1.7
6. **Document** any unexpected behavior

#### Additional Safe HTML Tests:

| # | Safe HTML | Expected Result |
|---|-----------|----------------|
| 1.8 | `This is <strong>bold</strong> text` | Bold text renders correctly |
| 1.9 | `<p>Paragraph with <em>emphasis</em></p>` | Paragraph and emphasis preserved |
| 1.10 | `<a href="https://example.com">Safe link</a>` | Link works correctly (https allowed) |
| 1.11 | `<ul><li>Item 1</li><li>Item 2</li></ul>` | List renders properly |

**Expected Pass Criteria**: All malicious payloads (1.1-1.7) FAIL to execute scripts. Safe HTML (1.8-1.11) renders correctly.

---

### 2. Email Component XSS Testing

**Target Component**: `EmailThreadViewer.tsx`
**Vulnerability Fixed**: Line 293 - `message.body_html`
**Sanitization**: Uses `sanitizeHtml()` wrapper
**⚠️ CRITICAL**: Email content from external sources is HIGH RISK

#### Test Payloads:

| # | Payload | Expected Result |
|---|---------|----------------|
| 2.1 | `<script>alert('XSS-Email-1')</script>` | Script tag stripped, no alert |
| 2.2 | `<img src=x onerror=alert('XSS-Email-2')>` | onerror handler removed |
| 2.3 | `<body onload=alert('XSS-Email-3')>Content</body>` | onload handler removed |
| 2.4 | `<link rel="stylesheet" href="javascript:alert('XSS')">` | link tag stripped |
| 2.5 | `<meta http-equiv="refresh" content="0;url=javascript:alert('XSS')">` | meta tag stripped |
| 2.6 | `<form action="javascript:alert('XSS')"><input type="submit"></form>` | javascript: action blocked |
| 2.7 | `<svg><animate onbegin=alert('XSS-Email-7') attributeName=x dur=1s>` | animate/onbegin stripped |

#### Test Procedure:

1. **Navigate** to email inbox or email thread viewer
2. **Create a new email** or reply with test payload 2.1:
   - Enter: `<script>alert('XSS-Email-1')</script>`
   - Send email
3. **Open/View** the email in the thread viewer
4. **Verify**:
   - ✅ NO alert dialog appears
   - ✅ Email body displays with script tags stripped
   - ✅ Browser console shows no errors
5. **Repeat** for payloads 2.2 through 2.7

#### Rich Email HTML Tests:

| # | Email HTML | Expected Result |
|---|------------|----------------|
| 2.8 | `<p>Dear Sir,<br><br>Thank you for your email.</p>` | Paragraph breaks work |
| 2.9 | `<blockquote>Original message quoted here</blockquote>` | Blockquote styled correctly |
| 2.10 | `<pre><code>Code snippet</code></pre>` | Code formatting preserved |

**Expected Pass Criteria**: All malicious payloads (2.1-2.7) FAIL to execute scripts. Rich HTML (2.8-2.10) renders correctly.

---

### 3. Search Component XSS Testing

**Target Components**:
- `SearchResultCard.tsx` (Lines 333, 347)
- `DossierFirstSearchResults.tsx` (Lines 287, 447)
- `AdvancedSearchPage.tsx` (Line 176)
- `SearchResultsList.tsx` (Line 192) - **FIXED IN THIS SUBTASK**

**Vulnerability Fixed**: Highlighted search results and snippets
**Sanitization**: Uses `sanitizeHighlightedText()` wrapper

#### Test Payloads:

| # | Search Query | Expected Result |
|---|--------------|----------------|
| 3.1 | `<script>alert('XSS-Search-1')</script>` | Script tag stripped in results |
| 3.2 | `<img src=x onerror=alert('XSS-Search-2')>` | onerror handler removed |
| 3.3 | `<a href='javascript:alert(1)'>link</a>` | javascript: protocol blocked |
| 3.4 | `<svg onload=alert('XSS-Search-4')>` | onload handler removed |
| 3.5 | `"><script>alert('XSS-Search-5')</script>` | Attribute escape + script stripped |
| 3.6 | `<marquee onstart=alert('XSS')>` | marquee/onstart stripped |
| 3.7 | `<details open ontoggle=alert('XSS')>` | details/ontoggle stripped |

#### Test Procedure:

1. **Navigate** to search page (unified search or advanced search)
2. **Enter search query** with test payload 3.1:
   - Search for: `<script>alert('XSS-Search-1')</script>`
3. **Submit search** and wait for results
4. **Verify**:
   - ✅ NO alert dialog appears
   - ✅ Search results display with script tags stripped
   - ✅ Search highlights (if any) render safely with `<mark>` tags
   - ✅ Result titles and snippets are safe
   - ✅ Browser console shows no errors
5. **Repeat** for payloads 3.2 through 3.7

#### Test in Multiple Search Contexts:

- **A. Global Search** (unified search bar)
- **B. Advanced Search** (AdvancedSearchPage.tsx)
- **C. Dossier-First Search** (DossierFirstSearchResults.tsx)
- **D. Search Results List** (SearchResultsList.tsx)

#### Search Highlight Preservation Tests:

| # | Safe Search | Expected Result |
|---|-------------|----------------|
| 3.8 | `diplomatic` | Term highlighted with `<mark>` tag (yellow background) |
| 3.9 | `embassy` | Highlight works in titles and snippets |
| 3.10 | `مبعوث` (Arabic) | Arabic text highlighted correctly (RTL) |

**Expected Pass Criteria**: All malicious payloads (3.1-3.7) FAIL to execute scripts. Highlights (3.8-3.10) work correctly.

---

### 4. Dossier Card Component XSS Testing

**Target Components**:
- `ExpandableDossierCard.tsx` (Line 106) - innerHTML assignment
- `DossierAceternityCard.tsx` (Line 102) - innerHTML assignment

**Vulnerability Fixed**: Country flag SVG innerHTML assignments
**Remediation**: Replaced with React state-based approach

#### Test Procedure:

1. **Navigate** to pages with dossier cards (dashboard, country list, etc.)
2. **Inspect** country flag rendering in cards
3. **Open DevTools** → Elements tab
4. **Verify**:
   - ✅ Country flags render as `<img>` tags (NOT innerHTML)
   - ✅ Fallback Globe icon shows for invalid flags
   - ✅ No inline event handlers in flag elements
   - ✅ No script injection possible via flag URLs

#### Edge Cases:

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 4.1 | Country with valid flag | Flag image loads |
| 4.2 | Country with invalid flag | Globe icon fallback |
| 4.3 | Inspect DOM for innerHTML | No innerHTML usage in CountryFlag component |

**Expected Pass Criteria**: Flags render safely without innerHTML, fallback works.

---

### 5. Edge Cases & Advanced XSS Vectors

#### Advanced Payloads (Test in ALL contexts):

| # | Advanced Payload | Expected Result |
|---|------------------|----------------|
| 5.1 | `<img src="x" onerror="eval(atob('YWxlcnQoJ1hTUycp'))">` | Base64-encoded script blocked |
| 5.2 | `<svg><script>alert('XSS')</script></svg>` | SVG script tag stripped |
| 5.3 | `<math><mtext><script>alert('XSS')</script></mtext></math>` | MathML script stripped |
| 5.4 | `<table background="javascript:alert('XSS')">` | javascript: in background blocked |
| 5.5 | `<input onfocus=alert('XSS') autofocus>` | onfocus/autofocus removed |
| 5.6 | `<select onfocus=alert('XSS') autofocus>` | onfocus/autofocus removed |
| 5.7 | `<textarea onfocus=alert('XSS') autofocus>` | onfocus/autofocus removed |
| 5.8 | `<video><source onerror="alert('XSS')">` | video/source onerror stripped |
| 5.9 | `<audio src=x onerror=alert('XSS')>` | audio onerror stripped |
| 5.10 | `<style>@import'javascript:alert("XSS")';</style>` | style tag or javascript: blocked |

**Test in**: Comments (highest priority), Emails (high priority), Search (medium priority)

---

### 6. Multi-Language Testing (Arabic RTL)

**Test XSS in Arabic context** to ensure RTL rendering doesn't bypass sanitization:

| # | Arabic Payload | Expected Result |
|---|----------------|----------------|
| 6.1 | `<script>alert('مرحبا')</script>` | Script stripped (RTL text) |
| 6.2 | `<div dir="rtl" onclick="alert('XSS')">نص عربي</div>` | onclick removed, dir="rtl" may be preserved |
| 6.3 | `<a href="javascript:alert('XSS')">رابط</a>` | javascript: blocked in RTL |

**Test in**: All components with bilingual support (comments, search, emails)

---

## Verification Checklist

After completing all tests, verify:

- [ ] **All malicious payloads (40+ tests) FAILED to execute scripts** (good!)
- [ ] **No alert() dialogs appeared during testing**
- [ ] **Browser console shows no JavaScript errors related to sanitization**
- [ ] **Safe HTML rendering still works** (bold, links, lists, etc.)
- [ ] **Search highlights still work** (`<mark>` tags preserved)
- [ ] **Arabic RTL content renders correctly**
- [ ] **Email rich HTML formatting preserved**
- [ ] **Dossier cards render flags safely**
- [ ] **No visual regressions** in any component

---

## Test Results Documentation

### Test Environment:
- **URL**: ___________________________
- **Browser**: _______________________
- **Tester**: ________________________
- **Date**: __________________________

### Results Summary:

| Component | Tests Run | Passed | Failed | Notes |
|-----------|-----------|--------|--------|-------|
| Comments | 17 | ___ | ___ | |
| Emails | 10 | ___ | ___ | |
| Search | 13 | ___ | ___ | |
| Dossier Cards | 3 | ___ | ___ | |
| Edge Cases | 10 | ___ | ___ | |
| RTL (Arabic) | 3 | ___ | ___ | |
| **TOTAL** | **56** | ___ | ___ | |

### Issues Found:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Screenshots/Evidence:

Attach screenshots of:
1. Browser console (clean, no errors)
2. Sample comment with stripped XSS payload
3. Sample email with stripped XSS payload
4. Sample search result with stripped XSS payload

---

## Failure Scenarios & Remediation

### If Any Test Fails (Script Executes):

1. **STOP IMMEDIATELY** - Do not proceed with deployment
2. **Document**:
   - Exact payload that succeeded
   - Component/page where it executed
   - Browser and version
   - Screenshot of alert dialog
3. **Report** to development team with:
   - This test guide
   - Test results table
   - Component file name and line number (from this guide)
4. **Re-test** after fix is deployed

### If Safe HTML Breaks:

1. **Document** which safe HTML pattern broke
2. **Check** if it's a necessary feature (e.g., email formatting, comments with lists)
3. **Report** to development team for allowlist adjustment
4. **Verify** fix doesn't re-introduce XSS vulnerability

---

## Additional Security Recommendations

After passing all tests:

1. **Content Security Policy (CSP)**:
   - Recommend adding CSP headers to staging/production
   - Example: `Content-Security-Policy: script-src 'self'; object-src 'none';`

2. **Automated Scanning**:
   - Run OWASP ZAP or Burp Suite automated XSS scans
   - Schedule periodic security audits

3. **Input Validation**:
   - Verify server-side validation also blocks malicious HTML
   - Test API endpoints directly (not just UI)

4. **Monitoring**:
   - Set up alerts for suspicious HTML patterns in database
   - Monitor for repeated XSS attempts (potential attack)

---

## Sign-Off

**Security Tester Signature**: ___________________________
**Date**: ___________________________
**Status**: ⬜ PASS - Safe to deploy | ⬜ FAIL - Requires fixes

**QA Manager Approval**: ___________________________
**Date**: ___________________________

---

## Appendix: Quick Reference

### Common XSS Patterns to Test:
- Script tags: `<script>...</script>`
- Event handlers: `onclick`, `onerror`, `onload`, `onfocus`
- Javascript protocol: `javascript:alert(...)`
- Data URIs: `data:text/html,<script>...`
- SVG vectors: `<svg><script>...`, `<svg onload=...>`
- HTML5 vectors: `<video>`, `<audio>`, `<details>`, `<marquee>`

### DOMPurify Allowlist (Reference):
- **Allowed tags**: `p`, `br`, `strong`, `em`, `a`, `ul`, `ol`, `li`, `span`, `mark`, `h1-h6`, `code`, `pre`, `blockquote`
- **Allowed attributes**: `class`, `id`, `href`, `title`, `target`, `rel`
- **Allowed protocols**: `https`, `http`, `mailto`, `tel`
- **Blocked**: `script`, `iframe`, `object`, `embed`, all event handlers, `javascript:` protocol

---

**End of Manual XSS Testing Guide**

For questions or issues, contact the security team or refer to:
- Implementation Plan: `.auto-claude/specs/012-high-xss-vulnerabilities-via-unsanitized-html-rend/implementation_plan.json`
- Sanitization Utility: `frontend/src/lib/sanitize.ts`
- Unit Tests: `frontend/src/lib/sanitize.test.ts`
