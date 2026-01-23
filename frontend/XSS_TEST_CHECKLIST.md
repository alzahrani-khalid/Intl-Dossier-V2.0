# XSS Testing Quick Checklist
## Task 012 - Security Verification

**⚠️ MANDATORY before production deployment**

## Quick Test (15 minutes)

### 1. Comments - Test 3 payloads:
- [ ] `<script>alert('XSS')</script>` → No alert, script stripped
- [ ] `<img src=x onerror=alert('XSS')>` → No alert, handler removed
- [ ] `<strong>Bold</strong> text` → Bold renders correctly ✅

### 2. Emails - Test 3 payloads:
- [ ] `<script>alert('XSS')</script>` → No alert, script stripped
- [ ] `<body onload=alert('XSS')>` → No alert, handler removed
- [ ] `<p>Paragraph<br>with breaks</p>` → Formatting works ✅

### 3. Search - Test 3 payloads:
- [ ] Search for: `<script>alert('XSS')</script>` → No alert
- [ ] Search for: `<a href='javascript:alert(1)'>link</a>` → No alert
- [ ] Search for: `diplomatic` → Highlights work ✅

### 4. Browser Console:
- [ ] No JavaScript errors
- [ ] No alert dialogs appeared
- [ ] No console warnings about sanitization

## Result:
- ⬜ **PASS** - All tests passed, safe to deploy
- ⬜ **FAIL** - See MANUAL_XSS_TESTING_GUIDE.md for full testing

**Tester**: _________________ **Date**: _________________
