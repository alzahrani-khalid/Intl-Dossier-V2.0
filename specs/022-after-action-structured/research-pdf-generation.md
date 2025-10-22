# Research: JavaScript/Node.js PDF Generation Libraries for Bilingual RTL Support

**Feature**: After-Action Structured Documentation
**Research Date**: 2025-01-14
**Researcher**: AI Assistant

## Requirements Summary

- RTL (right-to-left) text direction for Arabic
- Arabic font rendering with proper Unicode support
- Bilingual content (English + Arabic) in same PDF generation pass
- Professional formatting (headers, footers, tables, lists)
- Server-side generation (Node.js compatible)
- Performance: Generate PDFs <30s for 10-page document
- Distribution-ready formatting with organization branding

## Decision

**Recommended Library: Puppeteer (HTML-to-PDF approach)**

**Alternative for Production Scaling: Gotenberg (Dockerized Chromium API)**

## Rationale

### Why Puppeteer?

Puppeteer uses Chromium's rendering engine to convert HTML/CSS to PDF, providing **native browser-quality RTL support** that surpasses all pure JavaScript PDF libraries. Here's why it's the best choice:

#### 1. **Excellent RTL & Arabic Support** ✅
- Chromium's rendering engine has **full CSS support** for bidirectional text
- Described by developers as "close to zero tools that have a layout engine like CSS flexbox that works with text wrapping of mixed English-Arabic bidirectional text with custom fonts"
- Native support for `dir="rtl"`, CSS writing modes, and Unicode bidi algorithm
- No manual text reversal or custom BiDi implementations needed
- **Handles mixed language content perfectly** - English and Arabic in the same paragraph render correctly

#### 2. **Bilingual Content in Single Pass** ✅
- Generate both English and Arabic PDFs by rendering different HTML templates
- Can use CSS `@page` rules to mirror layouts for RTL
- Same codebase handles both languages - just swap HTML content and `dir` attribute
- Template-based approach makes it easy to maintain consistency across languages

#### 3. **Professional Formatting** ✅
- Full HTML/CSS capabilities: headers, footers, tables, lists, flexbox, grid
- CSS `@page` support for page numbers, running headers, and footers
- Organization branding via CSS (logos, colors, fonts, styles)
- Pixel-perfect control over layout and typography
- Support for modern CSS features (gradients, shadows, transforms)

#### 4. **Performance Meets Requirements** ✅
- **Unoptimized baseline**: 7-14 seconds for initial PDF generation
- **Optimized with browser reuse**: 1-2 seconds for regular PDFs (few pages with images)
- **Production-optimized**: p95 latency of 365ms with proper architecture
- **Benchmark data**: 3x faster than wkhtmltopdf
- **For 10-page document**: Easily achieves <30s requirement, typically 2-5 seconds with optimization

#### 5. **Node.js Native Integration** ✅
- Official npm package: `puppeteer` (31M+ weekly downloads)
- Excellent documentation and active community
- Works seamlessly with Express, Fastify, or any Node.js framework
- TypeScript support built-in

#### 6. **Arabic Font Rendering** ✅
- Chromium handles Arabic font ligatures and contextual forms automatically
- Load custom Arabic fonts via CSS `@font-face`
- Popular fonts like Amiri, Scheherazade, Cairo, IBM Plex Sans Arabic work perfectly
- No manual glyph processing needed

### Why Not Other Libraries?

- **PDFKit, pdf-lib**: No native RTL support, require complex workarounds that fail with mixed content
- **jsPDF**: Partial BiDi support - works for Arabic-only sentences but **fails with mixed Arabic-English** (words render in reverse)
- **pdfmake**: No native RTL, requires manual text reversal, multi-line text shows lines in reverse order
- **@react-pdf/renderer**: Open GitHub issue for RTL support - not production-ready for Arabic
- **WeasyPrint**: Known bugs with RTL (duplicate text, float issues) - explicitly not recommended

### Gotenberg as Alternative for Scaling

**Gotenberg** is a Docker-based API that wraps Chromium (same engine as Puppeteer):

**Advantages**:
- Same RTL/Arabic capabilities as Puppeteer
- Easier horizontal scaling (spin up multiple containers)
- Stateless API design - better for microservices architecture
- Offloads browser management to isolated containers
- HTTP API - language-agnostic (can call from any service)

**When to Choose Gotenberg**:
- High-volume PDF generation (>100 PDFs/hour)
- Microservices architecture
- Need to generate PDFs from multiple services/languages
- Want to isolate PDF generation from main application

**When to Choose Puppeteer**:
- Simpler deployment (no Docker requirement)
- Moderate volume (<100 PDFs/hour)
- Monolithic Node.js application
- Need tighter integration with application logic

## Alternatives Considered

### 1. PDFKit
- **Status**: Not Recommended ❌
- **RTL Support**: No native RTL support. Open GitHub issue (#219) since 2014.
- **Workarounds**:
  - Manual text reversal with `.split(' ').reverse().join(' ')` - **incorrect for Arabic**
  - Using `{features: ['rtla']}` font feature - limited success
  - TwitterCldr's BiDi algorithm - adds complexity
- **Arabic Fonts**: Requires manual font registration (`registerFont`)
- **Verdict**: Unsuitable for bilingual Arabic/English content without significant custom development

### 2. pdf-lib
- **Status**: Not Recommended ❌
- **RTL Support**: Open GitHub issue (#657) from 2020 requesting RTL examples - no native support
- **Arabic Rendering**: Can display Arabic characters with appropriate fonts but **no directional support**
- **Use Case**: Good for programmatic PDF manipulation (filling forms, merging PDFs) but not for RTL content generation
- **Verdict**: Not suitable for this use case

### 3. jsPDF
- **Status**: Limited - Not Recommended ❌
- **RTL Support**: Implements BiDi algorithm but **only partially**
- **Strengths**:
  - Works well for Arabic-only sentences
  - Supports Arabic fonts via font converter
- **Critical Limitation**:
  - **Mixed language content fails**: "عربى hello اشخاص" renders words in reverse direction
  - This is a **deal-breaker** for bilingual documents
- **Verdict**: Unsuitable for documents with mixed Arabic and English content

### 4. pdfmake
- **Status**: Not Recommended ❌
- **RTL Support**: No native RTL support. Must use custom fonts + manual text reversal
- **Issues**:
  - Letters written in wrong order (LTR)
  - Requires text reversal function
  - **Multi-line text shows lines in reverse order** (bottom to top)
  - Setting `alignment: 'right'` doesn't fix directional issues
- **Workaround**: `pdfmake-arabic` npm package exists but last updated 6 years ago
- **Verdict**: Too many workarounds, unreliable for production use

### 5. Playwright PDF Generation
- **Status**: Viable Alternative ⚠️
- **RTL Support**: Identical to Puppeteer (uses Chromium engine)
- **Differences**:
  - More modern API design
  - Multi-browser support (though PDF only works in Chromium)
  - Slightly slower than Puppeteer for Chrome-only tasks
  - Better TypeScript experience
- **Performance**: 4.5 seconds average vs Puppeteer's 4.8 seconds (negligible difference)
- **Verdict**: Good alternative if already using Playwright for testing, but Puppeteer is more established for PDF generation specifically

### 6. wkhtmltopdf
- **Status**: Not Recommended - Deprecated ⚠️
- **RTL Support**: WebKit renders RTL correctly with proper HTML structure
- **Arabic Support**: Works with `<meta charset="UTF-8">` and `dir="rtl"`
- **Critical Issues**:
  - **Project is deprecated and unmaintained**
  - Uses old Qt WebKit (doesn't support modern CSS)
  - 3x slower than Puppeteer
- **Verdict**: Avoid due to deprecation and poor performance

### 7. Gotenberg
- **Status**: Recommended Alternative ✅
- **RTL Support**: Same as Puppeteer (uses Chromium)
- **Architecture**: Docker-based stateless API
- **Strengths**:
  - Horizontal scaling (multiple containers)
  - Language-agnostic HTTP API
  - Isolated browser management
- **Limitations**:
  - Requires Docker infrastructure
  - Single Chromium instance per container (lock mechanism prevents parallel operations)
  - 2-3s overhead for LibreOffice conversions (not applicable for HTML-to-PDF)
- **Verdict**: Best choice for high-volume, microservices architectures

### 8. Prince XML
- **Status**: Viable but Commercial 💰
- **RTL Support**: Full CSS support, likely works well with `dir="rtl"`
- **Arabic Support**: Professional-grade rendering
- **Strengths**:
  - Excellent CSS support
  - Professional quality output
  - Good for complex documents
- **Limitations**:
  - **Commercial license required** (expensive for enterprise)
  - Requires CLI or API integration
  - Less community support than open-source alternatives
- **Verdict**: Good if budget allows, but Puppeteer provides similar quality for free

### 9. WeasyPrint
- **Status**: Not Recommended - Known RTL Bugs ❌
- **RTL Support**: Has **documented bugs** with RTL:
  - Duplicate Arabic text in output (GitHub issue #1686)
  - Floated elements not visible in RTL (GitHub issue #1110)
- **Architecture**: Python-based (not Node.js native)
- **Verdict**: Explicitly avoid due to known RTL issues

### 10. @react-pdf/renderer
- **Status**: Not Recommended ❌
- **RTL Support**: Open GitHub issue (#1571) - not fully implemented
- **Arabic Issues**: Users report direction problems with Arabic/Persian text
- **Node.js Support**: Works server-side (Node.js 18, 20, 21)
- **Verdict**: Wait until RTL support is officially implemented

## Implementation Notes

### Puppeteer Setup

#### 1. Installation
```bash
npm install puppeteer
# For production, use puppeteer-core + Chrome installed separately
npm install puppeteer-core
```

#### 2. Basic Implementation Pattern
```typescript
import puppeteer from 'puppeteer';

// Launch browser once at application start (reuse for performance)
let browser: puppeteer.Browser;

async function initBrowser() {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

async function generateBilingualPDF(data: AfterActionRecord): Promise<{ enPdf: Buffer, arPdf: Buffer }> {
  const page = await browser.newPage();

  try {
    // Generate English PDF
    const htmlContentEN = renderEnglishTemplate(data);
    await page.setContent(htmlContentEN, { waitUntil: 'networkidle0' });
    const enPdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Header</div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      margin: { top: '80px', bottom: '80px', left: '50px', right: '50px' }
    });

    // Generate Arabic PDF
    const htmlContentAR = renderArabicTemplate(data);
    await page.setContent(htmlContentAR, { waitUntil: 'networkidle0' });
    const arPdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">رأس الصفحة</div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> من <span class="totalPages"></span></div>',
      margin: { top: '80px', bottom: '80px', left: '50px', right: '50px' }
    });

    return { enPdf, arPdf };
  } finally {
    await page.close();
  }
}
```

#### 3. HTML Template Structure for Arabic
```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap');

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      direction: rtl;
      text-align: start; /* start = right in RTL */
      margin: 0;
      padding: 20mm;
    }

    h1, h2, h3 {
      font-weight: 700;
      margin-top: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      direction: rtl;
    }

    td, th {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: start;
    }

    @page {
      size: A4;
      margin: 20mm;
    }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <table>
    <tr>
      <th>الوصف</th>
      <th>المسؤول</th>
      <th>تاريخ الاستحقاق</th>
    </tr>
    <!-- Dynamic content -->
  </table>
</body>
</html>
```

#### 4. Performance Optimization Strategies

**Critical Optimizations**:
1. **Browser Reuse**: Launch browser once at app start, call `newPage()` for each PDF
   - Saves 3-5 seconds per generation
2. **Use `setContent()` instead of `goto()`**: Load HTML directly instead of navigating to URL
   - Saves 1-2 seconds per generation
3. **Limit Concurrency**: Process max (CPU cores - 1) PDFs simultaneously
   - Prevents resource exhaustion
4. **Pre-warm on Cold Start**: For serverless (AWS Lambda), pre-warm instances
   - Reduces cold start from 5s to <1s

**Example Optimized Setup**:
```typescript
// Singleton browser instance
class PDFGenerator {
  private browser: puppeteer.Browser | null = null;
  private queue: Array<() => Promise<void>> = [];
  private activeGenerations = 0;
  private readonly MAX_CONCURRENT = Math.max(1, os.cpus().length - 1);

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Prevents memory issues in Docker
      ]
    });
  }

  async generatePDF(htmlContent: string): Promise<Buffer> {
    if (this.activeGenerations >= this.MAX_CONCURRENT) {
      // Queue the request
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    this.activeGenerations++;
    try {
      const page = await this.browser!.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      await page.close();
      return pdf;
    } finally {
      this.activeGenerations--;
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        next();
      }
    }
  }
}

// Initialize at app start
const pdfGenerator = new PDFGenerator();
await pdfGenerator.init();
```

#### 5. Arabic Font Configuration

**Recommended Arabic Fonts**:
- **IBM Plex Sans Arabic**: Modern, professional, excellent readability (Google Fonts)
- **Cairo**: Geometric sans-serif, clean for headings (Google Fonts)
- **Amiri**: Traditional Naskh style, excellent for formal documents (Google Fonts)
- **Scheherazade New**: Readable, Unicode-compliant (Google Fonts)

**Loading Fonts**:
```css
/* Option 1: Google Fonts (requires internet) */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap');

/* Option 2: Self-hosted (offline-capable) */
@font-face {
  font-family: 'IBM Plex Sans Arabic';
  src: url('data:font/ttf;base64,...') format('truetype');
  font-weight: 400;
  font-style: normal;
}
```

**For Production**: Embed fonts as base64 in CSS for offline generation and faster loading.

#### 6. Handling Mixed Content (English + Arabic)

HTML naturally handles bidirectional text:
```html
<p dir="ltr">
  This is English text followed by Arabic:
  <span dir="rtl">هذا نص عربي</span> and back to English.
</p>

<!-- Better approach: Let Unicode handle it -->
<p>
  This is English text followed by Arabic: هذا نص عربي and back to English.
</p>
<!-- Browsers automatically detect text direction per word -->
```

#### 7. Error Handling & Resilience

```typescript
async function generatePDFWithRetry(
  htmlContent: string,
  maxRetries = 3
): Promise<Buffer> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const page = await browser.newPage();

      // Set timeout
      page.setDefaultTimeout(30000); // 30 seconds

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        timeout: 30000
      });

      await page.close();
      return pdf;

    } catch (error) {
      lastError = error as Error;
      console.error(`PDF generation attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }

  throw new Error(`PDF generation failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

### Gotenberg Setup (Alternative)

#### 1. Docker Compose Setup
```yaml
version: '3'
services:
  gotenberg:
    image: gotenberg/gotenberg:8
    ports:
      - "3000:3000"
    environment:
      - CHROMIUM_MAX_QUEUE_SIZE=100
      - CHROMIUM_TIMEOUT=30s
    restart: unless-stopped
```

#### 2. Node.js Client Implementation
```typescript
import FormData from 'form-data';
import fetch from 'node-fetch';

async function generatePDFViaGotenberg(
  htmlContent: string
): Promise<Buffer> {
  const form = new FormData();

  // Add HTML file
  form.append('files', Buffer.from(htmlContent), {
    filename: 'index.html',
    contentType: 'text/html'
  });

  // Send request to Gotenberg
  const response = await fetch('http://localhost:3000/forms/chromium/convert/html', {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  });

  if (!response.ok) {
    throw new Error(`Gotenberg returned ${response.status}: ${await response.text()}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
```

#### 3. Scaling Strategy
- Run multiple Gotenberg containers behind a load balancer
- Each container handles ~10-20 concurrent requests
- Scale horizontally based on queue size
- Monitor with Prometheus/Grafana

## Performance Expectations

### Can It Meet <30s for 10 Pages?

**YES** - Easily achievable with proper implementation.

### Performance Breakdown

| Scenario | Expected Time | Notes |
|----------|--------------|-------|
| **Unoptimized Puppeteer** | 7-14s | First run with browser launch |
| **Optimized Puppeteer (browser reuse)** | 1-2s | Regular PDFs with images |
| **Production-optimized** | 0.3-1s | With pre-warming, caching |
| **10-page document (typical)** | 2-5s | Well within 30s requirement |
| **10-page document (complex tables/images)** | 5-10s | Still comfortable margin |
| **Cold start (serverless)** | 5-8s | First invocation after idle |

### Optimization Impact

```
Unoptimized baseline:          14s ██████████████
Browser reuse:                  2s ██
Pre-warming + caching:        0.5s █
```

**Savings**: 96% reduction from baseline to optimized (14s → 0.5s)

### Real-World Benchmarks

From research findings:
- **Puppeteer is 3x faster than wkhtmltopdf** (industry standard)
- Production system achieved **p95 latency of 365ms** with proper architecture
- Regular PDF with images: **1-2 seconds** (confirmed by multiple sources)
- Large PDFs (300MB): **<2 minutes** (extreme edge case)

### Gotenberg Performance

- **Per-container throughput**: 10-20 concurrent requests
- **Single conversion**: 2-3s (including Chromium startup per request)
- **Scaling**: Linear with container count
- **Recommendation**: Start with 2-3 containers, scale based on load

### Performance Tips for 10-Page Documents

1. **Optimize HTML/CSS**:
   - Minimize external resources
   - Inline critical CSS
   - Compress images before embedding
   - Use web-safe fonts or embed fonts

2. **Puppeteer Configuration**:
   ```typescript
   await page.setContent(html, {
     waitUntil: 'networkidle0', // Wait for all resources
     timeout: 30000
   });
   ```

3. **Monitor & Alert**:
   - Log generation times
   - Alert if >15s (half of 30s threshold)
   - Investigate slow outliers

4. **Caching Strategy** (if applicable):
   - Cache generated PDFs for immutable records
   - Invalidate cache on record updates
   - Store in S3/R2 with signed URLs

### Expected Performance for This Feature

Given requirements (10 pages, bilingual, professional formatting):

- **First generation (cold start)**: 5-8 seconds
- **Subsequent generations**: 2-4 seconds per language
- **Both languages (sequential)**: 4-8 seconds total
- **Peak load (100 concurrent users)**: Scale with queue management
- **99th percentile**: <10 seconds (with monitoring)

**Verdict**: Comfortably meets <30s requirement with 3-6x margin of safety.

## Risk Mitigation

### Potential Issues & Solutions

#### 1. Memory Leaks
**Risk**: Chromium instances not properly closed
**Solution**:
- Use `try/finally` to ensure `page.close()` always executes
- Monitor memory usage with PM2 or similar
- Implement health check endpoint that restarts browser if memory exceeds threshold

#### 2. Font Loading Failures
**Risk**: External fonts fail to load (network issues)
**Solution**:
- Embed fonts as base64 in CSS (self-contained)
- Implement font loading timeout with fallback to system fonts
- Test offline generation capability

#### 3. Timeout on Complex Documents
**Risk**: 30s timeout exceeded for very complex layouts
**Solution**:
- Set generous timeout (30s) on `page.pdf()`
- Optimize HTML (reduce DOM complexity)
- Profile slow templates and optimize
- Consider pagination for extremely large documents

#### 4. Concurrent Load Spikes
**Risk**: 100 simultaneous PDF requests overwhelm server
**Solution**:
- Implement queue with max concurrency = CPU cores - 1
- Return estimated wait time to users
- Consider async generation with notifications for large batches
- Scale horizontally with Gotenberg if needed

#### 5. Arabic Font Rendering Issues
**Risk**: Fonts don't render correctly in production environment
**Solution**:
- Test with multiple Arabic fonts during development
- Include fallback fonts: `font-family: 'IBM Plex Sans Arabic', 'Arial', sans-serif;`
- Verify font files are accessible in production environment
- Add smoke test that generates Arabic PDF and validates output

## Recommended Technology Stack

### For Immediate Implementation (MVP)

```
Puppeteer + Express + Node.js 18 LTS
```

**Reasoning**:
- Simplest deployment
- No Docker requirement
- Direct integration with existing Node.js backend
- Fastest time to market

### For Production Scale (High Volume)

```
Gotenberg (Docker) + Node.js HTTP Client + Kubernetes/Docker Swarm
```

**Reasoning**:
- Horizontal scaling
- Isolated failures (container crashes don't affect main app)
- Language-agnostic (can call from any service)
- Better resource management

### Deployment Architecture

```
┌─────────────────┐
│  Express API    │
│  (Node.js)      │
└────────┬────────┘
         │
         ├─── MVP: Puppeteer (in-process)
         │
         └─── Production: HTTP → Gotenberg (Docker)
                                     │
                                     ├─── Container 1
                                     ├─── Container 2
                                     └─── Container N
```

## Next Steps

1. **Prototype**: Build proof-of-concept with Puppeteer + single Arabic PDF
2. **Template Design**: Create HTML/CSS templates for English and Arabic versions
3. **Font Selection**: Choose and test Arabic fonts (recommend IBM Plex Sans Arabic)
4. **Performance Testing**: Benchmark 10-page document generation on target infrastructure
5. **Integration**: Connect to AnythingLLM for AI-extracted data → HTML rendering
6. **Error Handling**: Implement retry logic, timeout handling, and monitoring
7. **Scaling Decision**: Based on load testing, decide between Puppeteer (MVP) or Gotenberg (scale)

## References

- [Puppeteer Official Documentation](https://pptr.dev/)
- [Puppeteer PDF Generation Guide](https://pptr.dev/guides/pdf-generation)
- [Gotenberg Official Documentation](https://gotenberg.dev/)
- [CSS Writing Modes (RTL Support)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Writing_Modes)
- [Google Fonts - Arabic](https://fonts.google.com/?subset=arabic)
- [Unicode Bidirectional Algorithm](https://unicode.org/reports/tr9/)
- [Puppeteer Performance Optimization](https://www.codepasta.com/2024/04/19/optimizing-puppeteer-pdf-generation)
- GitHub Issues Referenced:
  - PDFKit RTL: [#219](https://github.com/foliojs/pdfkit/issues/219)
  - pdf-lib RTL: [#657](https://github.com/Hopding/pdf-lib/issues/657)
  - @react-pdf/renderer RTL: [#1571](https://github.com/diegomura/react-pdf/issues/1571)
  - jsPDF RTL: [#2178](https://github.com/parallax/jsPDF/issues/2178)
  - pdfmake RTL: [#184](https://github.com/bpampuch/pdfmake/issues/184)
  - WeasyPrint RTL Bugs: [#1686](https://github.com/Kozea/WeasyPrint/issues/1686), [#1110](https://github.com/Kozea/WeasyPrint/issues/1110)

---

**Conclusion**: Puppeteer provides the most reliable, performant, and maintainable solution for generating bilingual Arabic/English PDFs with proper RTL support. It meets all requirements including the <30s performance target with significant margin. For immediate implementation, use Puppeteer directly. For high-volume production, consider migrating to Gotenberg for easier horizontal scaling.
