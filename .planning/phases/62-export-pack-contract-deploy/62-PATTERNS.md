# Phase 62: Export Pack Contract & Deploy - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 7 (1 edge function + 4 frontend source files + 2 i18n files)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File                                         | Role                    | Data Flow        | Closest Analog                                                        | Match Quality                                                  |
| --------------------------------------------------------- | ----------------------- | ---------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `supabase/functions/dossier-export-pack/index.ts`         | service (edge function) | request-response | `supabase/functions/dossier-activity-timeline/index.ts`               | role-match (same serve shape, auth, CORS)                      |
| `frontend/src/components/dossier/ExportDossierDialog.tsx` | component (dialog)      | request-response | `frontend/src/components/dossier/AddToDossierDialogs.tsx`             | role-match (dialog pattern, token usage, error/loading states) |
| `frontend/src/services/dossier-export.service.ts`         | service (API client)    | request-response | itself — modification of existing file                                | exact                                                          |
| `frontend/src/types/dossier-export.types.ts`              | types                   | —                | itself — modification of existing file                                | exact                                                          |
| `frontend/src/hooks/useDossierExport.ts`                  | hook                    | request-response | itself — modification of existing file                                | exact                                                          |
| `frontend/src/i18n/en/dossier-export.json`                | config (i18n)           | —                | `frontend/src/i18n/en/dossier-export.json` (existing keys + new ones) | exact                                                          |
| `frontend/src/i18n/ar/dossier-export.json`                | config (i18n)           | —                | `frontend/src/i18n/ar/dossier-export.json` (existing keys + new ones) | exact                                                          |

---

## Pattern Assignments

### `supabase/functions/dossier-export-pack/index.ts` (edge function, request-response)

**Primary analog:** `supabase/functions/dossier-activity-timeline/index.ts`
**Secondary reference:** `supabase/functions/_shared/cors.ts` (CORS helper)

The file is a large modification (1281 lines). The key structural changes are:

- Replace `serve()` (Deno std) with `Deno.serve()` (native)
- Replace static `corsHeaders` wildcard with `getCorsHeaders(req)` for all non-OPTIONS responses
- Replace storage-upload + signed-URL response with direct HTML body response
- Fix 6 stale DB reads in `fetchDossierData` (per RESEARCH.md audit)
- Add per-section error tracking and `X-Failed-Sections` response header

**Imports pattern** (from `dossier-activity-timeline/index.ts` lines 10-11):

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
```

Note: `dossier-export-pack` must also import `getCorsHeaders` and `handleCorsPreflightRequest`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
```

**Serve pattern** (from `dossier-activity-timeline/index.ts` lines 42-46):

```typescript
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  // ...
})
```

For export-pack, use `getCorsHeaders(req)` on OPTIONS too (full upgrade):

```typescript
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }
  // ...
})
```

**Auth pattern — already correct in export-pack** (lines 1148-1178 of `dossier-export-pack/index.ts`):

```typescript
// Create Supabase client with user token in global headers
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: { headers: { Authorization: authHeader } },
  },
)
// Then explicitly pass token to getUser (the @2 + getUser(token) pattern):
const token = authHeader.replace('Bearer ', '')
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser(token)
```

This pattern is already in the file at lines 1148-1178. Preserve it exactly. The `dossier-activity-timeline` analog passes the token via `global.headers` instead, which also works — but the explicit `getUser(token)` call in export-pack is the project-preferred pattern (per MEMORY.md: "bare `getUser()` 401s on valid tokens").

**UUID validation pattern** (from `dossier-activity-timeline/index.ts` lines 114-126):

```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!uuidRegex.test(dossierId)) {
  return new Response(
    JSON.stringify({
      error: 'Invalid dossier_id format. Must be a valid UUID.',
      code: 'INVALID_REQUEST',
    }),
    { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
  )
}
```

Apply this to `dossier_id` validation in export-pack (currently missing).

**Direct HTML response body pattern** (new — replaces lines 1212-1262 of export-pack):

```typescript
// After html string is generated:
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const dossierSlug = (data.dossier.name_en || 'dossier')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '-')
  .slice(0, 30)
const fileName = `briefing-pack-${dossierSlug}-${timestamp}.html`
const failedSectionsHeader = Object.keys(sectionErrors).join(',')

return new Response(html, {
  status: 200,
  headers: {
    ...getCorsHeaders(req),
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Disposition': `inline; filename="${fileName}"`,
    'Access-Control-Expose-Headers': 'X-Failed-Sections',
    ...(failedSectionsHeader ? { 'X-Failed-Sections': failedSectionsHeader } : {}),
  },
})
```

Note: The `Access-Control-Expose-Headers` header is required so the frontend fetch can read `X-Failed-Sections` (per RESEARCH.md open question 3). Add it on the HTML response only (it is not needed on error JSON responses).

**Per-section error tracking pattern** (new pattern — D-08):

```typescript
// At top of fetchDossierData, initialize error collector:
const sectionErrors: Record<string, string> = {}

// For each section query — wrap in try/catch, never throw:
let positions: any[] = []
try {
  const posLinksResult = await supabase
    .from('position_dossier_links')
    .select('position:positions(id, title_en, title_ar, status, created_at)')
    .eq('dossier_id', dossierId)
    .limit(20)
  if (posLinksResult.error) {
    sectionErrors['positions'] = posLinksResult.error.message
  } else {
    positions = ((posLinksResult.data || []) as any[])
      .map((link) => (Array.isArray(link.position) ? link.position[0] : link.position))
      .filter(Boolean)
  }
} catch (e) {
  sectionErrors['positions'] = e instanceof Error ? e.message : 'Unknown error'
}

// Return sectionErrors alongside data so generateHTMLDocument can render error blocks
return {
  dossier,
  relationships,
  positions,
  mous,
  commitments,
  events,
  contacts,
  activities,
  documents,
  sectionErrors,
}
```

**In-document section error block pattern** (new — passed to each section renderer):

```typescript
// In each section renderer (e.g., generatePositionsSection):
function generatePositionsSection(positions: any[], isRTL: boolean, error?: string): string {
  const title = isRTL ? 'المواقف ونقاط النقاش' : 'Positions & Talking Points'
  if (error) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <div class="section-error" style="padding:1rem;border:1px solid #ef4444;border-radius:4px;color:#ef4444;">
          <p>${isRTL ? 'تعذّر تحميل هذا القسم' : 'This section could not be generated'}</p>
        </div>
      </div>`
  }
  // ...normal render
}
```

**Stale-read fixes — canonical query patterns** (source: `frontend/src/services/dossier-overview.service.ts`):

Positions (lines 465-485 of dossier-overview.service.ts):

```typescript
// Replace stale positions query with junction join:
const { data: positionLinks } = await supabase
  .from('position_dossier_links')
  .select('position:positions(id, title_en, title_ar, status, created_at)')
  .eq('dossier_id', dossierId)
  .limit(20)

const positions = ((positionLinks || []) as any[])
  .map((link) => (Array.isArray(link.position) ? link.position[0] : link.position))
  .filter(Boolean)
// Also remove pos.classification from generatePositionsSection renderer
```

MoUs (lines 491-515 of dossier-overview.service.ts):

```typescript
// Replace stale mous query with signatory double-query:
const { data: mous1 } = await supabase
  .from('mous')
  .select('id, title, title_ar, lifecycle_state, created_at')
  .eq('signatory_1_dossier_id', dossierId)
  .is('deleted_at', null)

const { data: mous2 } = await supabase
  .from('mous')
  .select('id, title, title_ar, lifecycle_state, created_at')
  .eq('signatory_2_dossier_id', dossierId)
  .is('deleted_at', null)

// Deduplicate:
const mouIds = new Set<string>()
const mous: any[] = []
;[...(mous1 || []), ...(mous2 || [])].forEach((m) => {
  if (!mouIds.has(m.id)) {
    mouIds.add(m.id)
    mous.push(m)
  }
})
// Also update renderer: m.title_en → m.title, m.status → m.lifecycle_state
```

Commitments (RESEARCH.md verified pattern):

```typescript
// Replace two-step work_item_dossiers + commitments with direct aa_commitments:
const { data: commitments } = await supabase
  .from('aa_commitments')
  .select('id, title, title_ar, status, priority, due_date, owner_user_id, created_at')
  .eq('dossier_id', dossierId)
  .is('is_deleted', false)
  .order('created_at', { ascending: false })
  .limit(20)
// Also update renderer: c.title_en → c.title, c.deadline → c.due_date
```

Calendar/Events (RESEARCH.md verified):

```typescript
// Replace stale start_datetime column:
const { data: events } = await supabase
  .from('calendar_entries')
  .select(
    'id, title_en, title_ar, entry_type, event_date, event_time, location, is_virtual, status',
  )
  .eq('dossier_id', dossierId)
  .gte('event_date', new Date().toISOString().split('T')[0])
  .order('event_date', { ascending: true })
  .limit(10)
// Also update renderer: e.start_datetime → e.event_date, e.event_type → e.entry_type,
// e.location_en/e.location_ar → e.location
```

Relationships (RESEARCH.md verified):

```typescript
// Remove stale .is('deleted_at', null) filter from both outgoing and incoming queries.
// Replace with .eq('status', 'active') for safety, or omit entirely.
supabase
  .from('dossier_relationships')
  .select('*, target_dossier:target_dossier_id(id, name_en, name_ar, type)')
  .eq('source_dossier_id', dossierId)
  .eq('status', 'active') // was: .is('deleted_at', null)
```

Contacts (renderer fix only, no query change):

```typescript
// generateContactsSection renderer: update field reads:
// c.name_ar → c.name (monolingual)
// c.title_en / c.title_ar → c.role
// c.organization_en / c.organization_ar → c.organization
```

Documents (safe fallback — RESEARCH.md Option B):

```typescript
// Return [] for documents section — entity_type/entity_id columns do not exist.
// D-08 "No documents found" text renders correctly for empty array.
const documents: any[] = []
// sectionErrors does NOT include 'documents' (not an error, just no data).
```

**Error response pattern** (copy from existing export-pack lines 1263-1280):

```typescript
} catch (error) {
  console.error('Export error:', error)
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message_en: error instanceof Error ? error.message : 'An unexpected error occurred',
        message_ar: 'حدث خطأ غير متوقع',
      },
    }),
    { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
  )
}
```

**Dead code to remove** (lines to delete from export-pack):

- Lines 10 (`import { serve }` from Deno std) — replaced by `Deno.serve()`
- Lines 12 (`import { corsHeaders }`) — replaced by `getCorsHeaders`
- Lines 1212-1215 (`btoa`/base64 encode block)
- Lines 1224-1244 (storage upload + serviceClient creation)
- Lines 1238-1243 (createSignedUrl call)
- `SUPABASE_SERVICE_ROLE_KEY` env read

---

### `frontend/src/components/dossier/ExportDossierDialog.tsx` (component, request-response)

**Analog:** `frontend/src/components/dossier/AddToDossierDialogs.tsx` (dialog shape, token usage)
**Self-analog:** existing `ExportDossierDialog.tsx` (preserve non-changed parts exactly)

This file is a targeted modification — not a rewrite. The structure (Dialog shell, progress state, error state, DialogFooter) stays. Changes are surgical.

**Imports pattern** (lines 1-42 of ExportDossierDialog.tsx — preserve all except `FileText`/`FileDown` swap as needed):

```typescript
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react'
// Remove: FileDown (no longer needed for format picker icons)
// Add: AlertTriangle for failed-sections warning
import type {
  ExportDossierDialogProps,
  ExportLanguage,
  ExportSectionConfig,
} from '@/types/dossier-export.types'
// Remove: DossierExportFormat import (type is now 'html' constant)
import { DEFAULT_EXPORT_SECTIONS } from '@/types/dossier-export.types'
import { useDossierExport } from '@/hooks/useDossierExport'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'
```

**Popup-blocker-safe new-tab pattern** (D-07 — replaces `handleExport` at lines 80-102):

```typescript
const handleExport = async () => {
  // MUST open window synchronously before any await (popup-blocker constraint)
  const newTab = window.open('', '_blank')

  try {
    const { html, failedSections } = await exportDossier(dossierId, {
      language,
      sections,
      includeCoverPage,
      includeTableOfContents,
      includePageNumbers: true,
    })

    if (newTab) {
      newTab.document.open()
      newTab.document.write(html)
      newTab.document.close()
    } else {
      // Fallback: blob download when popup blocked
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `briefing-pack-${dossierName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30)}.html`
      a.click()
      URL.revokeObjectURL(url)
    }

    // Show failed-sections warning but still auto-close
    setTimeout(
      () => {
        onClose()
        reset()
      },
      failedSections.length > 0 ? 3000 : 1500,
    )
    onSuccess?.({ success: true, failed_sections: failedSections })
  } catch (err) {
    newTab?.close()
    console.error('Export failed:', err)
  }
}
```

**Format picker removal** — delete lines 169-205 (the `<RadioGroup>` with pdf/docx cards). Replace with the info note only:

```tsx
{
  /* Format info note — D-03 */
}
;<div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--line-soft)] p-3">
  <p className="text-sm text-[var(--ink-mute)]">{t('format.html_info')}</p>
</div>
```

**Language picker — remove 'both' option** (modify lines 207-239):

```tsx
<RadioGroup
  value={language}
  onValueChange={(v) => setLanguage(v as ExportLanguage)}
  className="flex flex-wrap gap-3"
>
  {(['en', 'ar'] as ExportLanguage[]).map((lang) => (
    <Label
      key={lang}
      htmlFor={`lang-${lang}`}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-2 transition-colors',
        language === lang
          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
          : 'border-[var(--line)] hover:border-[var(--ink-faint)]',
      )}
    >
      <RadioGroupItem value={lang} id={`lang-${lang}`} className="sr-only" />
      <span className="text-sm">{lang === 'en' ? t('language.en') : t('language.ar')}</span>
    </Label>
  ))}
</RadioGroup>
```

**Default language init** (replaces `useState<ExportLanguage>('both')` at line 59):

```typescript
const { t, i18n } = useTranslation('dossier-export')
const [language, setLanguage] = useState<ExportLanguage>(i18n.language === 'ar' ? 'ar' : 'en')
```

**Failed-sections warning in success state** (add after existing success block at lines 148-155):

```tsx
{
  progress?.status === 'ready' && failedSections.length > 0 && (
    <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--warn)] bg-[var(--warn-soft)] p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--warn)]" />
      <span className="text-sm text-[var(--warn)]">
        {t('warning.failed_sections', { sections: failedSections.join(', ') })}
      </span>
    </div>
  )
}
```

`failedSections` is state managed in the hook and surfaced via `useDossierExport` return.

**Token/state pattern** (from `AddToDossierDialogs.tsx` lines 78-84 — existing pattern matches):

```typescript
// useTranslation with the namespace, useDirection for RTL — already in the file
const { t, i18n } = useTranslation('dossier-export')
const { isRTL } = useDirection()
```

---

### `frontend/src/services/dossier-export.service.ts` (service, request-response)

**Self-analog:** existing file — surgical modification.

**New `exportDossier` return type** (replaces lines 61-87):

```typescript
export interface ExportDossierResult {
  html: string
  failedSections: string[]
}

/**
 * Export a dossier — returns HTML string and list of sections that failed
 */
export async function exportDossier(request: DossierExportRequest): Promise<ExportDossierResult> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-export-pack`,
    { method: 'POST', headers, body: JSON.stringify(request) },
  )

  if (!response.ok) {
    // Edge returns JSON error envelope on 4xx/5xx
    const error = await response.json().catch(() => ({
      message: 'Export failed',
      code: 'EXPORT_FAILED',
    }))
    throw new DossierExportAPIError(
      error.message || 'Failed to export dossier',
      response.status,
      error.code || 'EXPORT_FAILED',
      error.details,
    )
  }

  // D-06: edge now returns text/html body, not JSON
  const html = await response.text()

  // D-08: read failed sections from custom response header
  const failedSectionsRaw = response.headers.get('X-Failed-Sections') || ''
  const failedSections = failedSectionsRaw ? failedSectionsRaw.split(',').filter(Boolean) : []

  return { html, failedSections }
}
```

**Dead code to remove:**

- Lines 92-118: entire `downloadExportedFile` function
- Line 127: `history: (dossierId: string) => ...` key from `dossierExportKeys`

**`getAuthHeaders` pattern** (lines 37-52 — preserve exactly, no change):

```typescript
async function getAuthHeaders(): Promise<Headers> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers = new Headers({
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  })
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  return headers
}
```

---

### `frontend/src/types/dossier-export.types.ts` (types)

**Self-analog:** existing file — targeted changes only.

**Changes summary** (surgical edits, not a rewrite):

```typescript
// Line 15 — change type:
// OLD: export type DossierExportFormat = 'pdf' | 'docx'
// NEW: (remove this type — format is now always 'html'; no need to export it)

// Line 20 — remove 'both':
// OLD: export type ExportLanguage = 'en' | 'ar' | 'both'
// NEW:
export type ExportLanguage = 'en' | 'ar'

// Lines 25-33 — remove 'uploading' variant:
// OLD: | 'idle' | 'preparing' | 'fetching' | 'generating' | 'uploading' | 'ready' | 'failed'
// NEW:
export type DossierExportStatus =
  | 'idle'
  | 'preparing'
  | 'fetching'
  | 'generating'
  | 'ready'
  | 'failed'

// Lines 144-147 — DossierExportConfig: remove format field:
// OLD: format: DossierExportFormat
// NEW: (remove field — format is no longer configurable)

// Lines 173-180 — DEFAULT_EXPORT_CONFIG:
// OLD: format: 'pdf', language: 'both'
// NEW: language: 'en'  (format field removed)
export const DEFAULT_EXPORT_CONFIG: DossierExportConfig = {
  language: 'en', // overridden at dialog level to match i18n.language
  sections: DEFAULT_EXPORT_SECTIONS,
  includeCoverPage: true,
  includeTableOfContents: true,
  includePageNumbers: true,
}

// Lines 211-234 — DossierExportResponse: replace with new shape:
export interface DossierExportResponse {
  /** Whether export succeeded */
  success: boolean
  /** Sections that could not be generated (D-08) */
  failed_sections?: string[]
  /** Error details if failed */
  error?: {
    code: string
    message_en: string
    message_ar: string
  }
}
// Remove: download_url, file_name, file_size, page_count, expires_at, content_base64, content_type

// Lines 253-269 — UseDossierExportReturn: update exportDossier signature:
export interface UseDossierExportReturn {
  exportDossier: (
    dossierId: string,
    config?: Partial<DossierExportConfig>,
  ) => Promise<{ html: string; failedSections: string[] }>
  quickExport: (dossierId: string) => Promise<{ html: string; failedSections: string[] }>
  // Remove: format parameter from quickExport (always html)
  progress: DossierExportProgress | null
  isExporting: boolean
  error: Error | null
  failedSections: string[] // NEW — exposed for dialog warning
  reset: () => void
}
```

---

### `frontend/src/hooks/useDossierExport.ts` (hook, request-response)

**Self-analog:** existing file — targeted rewrite of download block and dead stage removal.

**State additions** (after line 33):

```typescript
const [failedSections, setFailedSections] = useState<string[]>([])
```

**Dead imports to remove** (line 22):

```typescript
// Remove: downloadExportedFile import
import { exportDossier as exportDossierApi } from '@/services/dossier-export.service'
```

**New main export function** (replaces lines 54-166 — the try block):

```typescript
const exportDossier = useCallback(
  async (
    dossierId: string,
    config?: Partial<DossierExportConfig>,
  ): Promise<{ html: string; failedSections: string[] }> => {
    setIsExporting(true)
    setError(null)
    setFailedSections([])
    onStart?.()

    const fullConfig: DossierExportConfig = {
      ...DEFAULT_EXPORT_CONFIG,
      ...config,
      sections: config?.sections || DEFAULT_EXPORT_CONFIG.sections,
    }

    try {
      updateProgress({
        status: 'preparing',
        progress: 10,
        message_en: 'Preparing export...',
        message_ar: 'جارٍ إعداد التصدير...',
      })
      updateProgress({
        status: 'fetching',
        progress: 30,
        message_en: 'Fetching dossier data...',
        message_ar: 'جارٍ جلب بيانات الملف...',
      })
      updateProgress({
        status: 'generating',
        progress: 60,
        message_en: 'Generating briefing pack...',
        message_ar: 'جارٍ إنشاء حزمة الإحاطة...',
      })

      // D-06: service now returns { html, failedSections } — not a JSON success envelope
      const { html, failedSections: sections } = await exportDossierApi({
        dossier_id: dossierId,
        config: fullConfig,
      })

      setFailedSections(sections)

      updateProgress({
        status: 'ready',
        progress: 100,
        message_en: 'Export complete!',
        message_ar: 'اكتمل التصدير!',
      })

      const response: DossierExportResponse = { success: true, failed_sections: sections }
      onSuccess?.(response)

      return { html, failedSections: sections }
    } catch (err) {
      const exportError = err instanceof Error ? err : new Error('Export failed')
      setError(exportError)
      updateProgress({
        status: 'failed',
        progress: 0,
        message_en: exportError.message,
        message_ar: 'فشل التصدير',
      })
      onError?.(exportError)
      throw exportError
    } finally {
      setIsExporting(false)
    }
  },
  [onStart, onSuccess, onError, updateProgress],
)
```

**Reset function update** (line 180-183):

```typescript
const reset = useCallback(() => {
  setIsExporting(false)
  setProgress(null)
  setError(null)
  setFailedSections([]) // NEW
}, [])
```

**Return object update**:

```typescript
return { exportDossier, quickExport, progress, isExporting, error, failedSections, reset }
```

**Dead code to remove:**

- Lines 119-139: the `downloadExportedFile` / `content_base64` decode block
- Lines 101-107: the `'uploading'` progress stage update
- Line 172-176: `quickExport` second parameter `format` (always html now)

---

### `frontend/src/i18n/en/dossier-export.json` (i18n config)

**Self-analog:** existing file — add new keys, remove dead keys.

**Keys to add:**

```json
{
  "format": {
    "html": "HTML Document",
    "html_info": "This export produces a print-ready HTML briefing pack. To save as PDF, use your browser's print dialog."
  },
  "sections": {
    "failed": "This section could not be generated"
  },
  "warning": {
    "failed_sections": "Some sections could not be generated: {{sections}}"
  },
  "success": "Export complete. The briefing pack has opened in a new tab."
}
```

**Keys to remove:** `format.pdf`, `format.docx`, `language.both`, `progress.uploading`

**Keys to keep unchanged:** `title`, `description`, `language.label`, `language.en`, `language.ar`, `options.*`, `sections.label`, `sections.<type>` (all 10 section names), `advanced.*`, `progress.preparing`, `progress.fetching`, `progress.generating`, `progress.ready`, `error`, `export`, `exporting`, `cancel`, `quickExport`, `quickExportTooltip`, `type.*`

**Namespace registration:** Already registered at line 345 of `frontend/src/i18n/index.ts`. No change needed.

---

### `frontend/src/i18n/ar/dossier-export.json` (i18n config)

**Self-analog:** existing AR file — mirror EN changes exactly.

**Keys to add:**

```json
{
  "format": {
    "html": "مستند HTML",
    "html_info": "يُنتج هذا التصدير حزمة إحاطة HTML جاهزة للطباعة. لحفظها كـ PDF، استخدم مربع حوار الطباعة في المتصفح."
  },
  "sections": {
    "failed": "تعذّر تحميل هذا القسم"
  },
  "warning": {
    "failed_sections": "تعذّر إنشاء بعض الأقسام: {{sections}}"
  },
  "success": "اكتمل التصدير. فُتحت حزمة الإحاطة في علامة تبويب جديدة."
}
```

**Keys to remove:** `format.pdf`, `format.docx`, `language.both`, `progress.uploading`

---

## Shared Patterns

### CORS Pattern (apply to edge function)

**Source:** `supabase/functions/_shared/cors.ts` lines 63-91
**Apply to:** `dossier-export-pack/index.ts` — all non-OPTIONS responses

```typescript
// Import (replaces static corsHeaders import):
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

// OPTIONS handler:
if (req.method === 'OPTIONS') {
  return handleCorsPreflightRequest(req)
}

// All other responses — use spread:
headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
// or for HTML:
headers: { ...getCorsHeaders(req), 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Expose-Headers': 'X-Failed-Sections' }
```

### Auth Pattern (edge function — already in export-pack, preserve)

**Source:** `supabase/functions/dossier-export-pack/index.ts` lines 1148-1178
**Pattern:** Create client with user token in global headers → `getUser(token)` explicitly

```typescript
const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
const token = authHeader.replace('Bearer ', '')
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser(token)
```

### Error Handling Pattern (frontend service + hook)

**Source:** `frontend/src/services/dossier-export.service.ts` lines 19-31 (DossierExportAPIError class)
**Apply to:** preserve the custom error class; hook should narrow `err instanceof DossierExportAPIError` before `instanceof Error`

### Dialog State Machine Pattern

**Source:** `frontend/src/components/dossier/ExportDossierDialog.tsx` lines 136-163
**Apply to:** preserve the three-panel conditional render (progress / success / error / config) — only modify the content inside each panel

```tsx
{isExporting && progress && (/* progress panel */)}
{progress?.status === 'ready' && (/* success panel */)}
{error && (/* error panel */)}
{!isExporting && progress?.status !== 'ready' && (/* config panel */)}
```

### Token Design Pattern

**Source:** `frontend/src/components/dossier/ExportDossierDialog.tsx` lines 128-133
**Apply to:** preserve token-based color usage throughout — no raw hex, no Tailwind color literals

```tsx
className = 'border border-[var(--line)] bg-[var(--line-soft)]'
className = 'text-[var(--accent)]'
className = 'border-[var(--ok)] bg-[var(--ok-soft)] text-[var(--ok)]'
className = 'border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]'
// For failed-sections warning (new):
className = 'border-[var(--warn)] bg-[var(--warn-soft)] text-[var(--warn)]'
```

### i18n Namespace Pattern

**Source:** `frontend/src/i18n/index.ts` lines 177-178, 345, 472
**Apply to:** `dossier-export` namespace is already registered in both EN and AR bundles. Do not add imports or registration lines — only edit the JSON files.

---

## No Analog Found

No files in this phase lack an analog. All 7 files are either self-modifications or have a direct role-match in the codebase.

---

## Metadata

**Analog search scope:** `supabase/functions/`, `frontend/src/components/dossier/`, `frontend/src/services/`, `frontend/src/hooks/`, `frontend/src/types/`, `frontend/src/i18n/`
**Files scanned:** 12 (dossier-activity-timeline, positions-dossiers-create, \_shared/cors.ts, ExportDossierDialog, AddToDossierDialogs, dossier-export.service.ts, useDossierExport.ts, dossier-export.types.ts, dossier-export.json EN+AR, dossier-overview.service.ts, i18n/index.ts)
**Pattern extraction date:** 2026-06-11
