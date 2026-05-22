# Phase 58: Tier-C Design-Token Suppression Full Clear — Pattern Map

**Mapped:** 2026-05-19
**Phase shape:** REFACTOR (modify-only; 0 new files in source — only modifications to 268 already-existing `.ts`/`.tsx` files, plus 1 NEW planning artifact `58-WAVE-MANIFEST.md`)
**Files analyzed:** 268 source modifications + 1 planning artifact
**Per-wave analog precedents identified:** 6 / 6 surface waves + 1 Wave-0 manifest convention

---

## File Classification

Phase 58 is mechanical refactor — files are grouped by **surface bucket** (the wave they belong to). Each surface's "role" is the swap-shape complexity tier (`leaf-tsx`, `lookup-table-ts`, `dialog-leaf`, `page-route`); each surface's "data flow" is the Tailwind-literal class it carries (`badge-state`, `category-color`, `dossier-type`, `interaction-status`).

| Wave | Surface bucket               | Role (swap-shape complexity)                                                                          | Data flow (literal kind)                                                          | Closest Tier-A analog                                                                                                                                                                              | Match quality                                                                                                                                                          |
| ---- | ---------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | `58-WAVE-MANIFEST.md`        | planning artifact (markdown table)                                                                    | manifest rows mapping `audit_slug → wave + flags`                                 | None (no prior wave-manifest in `.planning/phases/`)                                                                                                                                               | new-shape — convention defined in CONTEXT.md §"Specific Ideas"                                                                                                         |
| 1    | forms                        | leaf-tsx (state + warning + progress)                                                                 | `bg-X-100 / text-X-700 / border-X-200` triples + composite alert chrome           | `frontend/src/components/forms/FormCompletionProgress.tsx`                                                                                                                                         | EXACT (same dir, same role, same data flow)                                                                                                                            |
| 1    | forms (upload variant)       | leaf-tsx (drag-zone + file-list status)                                                               | drag-state + per-file status + error chrome                                       | `frontend/src/components/forms/UnifiedFileUpload.tsx`                                                                                                                                              | EXACT                                                                                                                                                                  |
| 2    | tables                       | leaf-tsx (table row + status badge + cell color)                                                      | row status, priority chip, cell tint                                              | `frontend/src/components/availability-polling/AvailabilityPollResults.tsx`                                                                                                                         | EXACT (table-shaped; uses `POLL_STATUS_COLORS` from types/)                                                                                                            |
| 2    | tables (lock/badge variants) | leaf-tsx (badge / banner)                                                                             | lock-state warning chrome                                                         | `frontend/src/components/collaboration/EditingLockIndicator.tsx`                                                                                                                                   | EXACT                                                                                                                                                                  |
| 3    | drawers-dialogs              | dialog-leaf (modal/dialog/drawer chrome)                                                              | composite chrome — bg-alert + border-alert + text-alert                           | `frontend/src/components/forms/UnifiedFileUpload.tsx` (dropzone alert states are isomorphic) + `frontend/src/components/collaboration/EditingLockIndicator.tsx` (banner variant)                   | ROLE-MATCH (no Tier-A `*Dialog.tsx` in 51 sweep — these two have the closest composite chrome shape)                                                                   |
| 4    | dossier-rail                 | leaf-tsx (rail content + dossier-type chip + activity timeline item)                                  | dossier-type color set (`country=blue`, `topic=purple`, …) + activity-state tints | `frontend/src/lib/semantic-colors.ts` (`dossierTypeColors`, `activityTypeColors`, `getDossierTypeBadgeClass`) + `frontend/src/components/dossier/DossierContextBadge.tsx` (already-clean consumer) | EXACT (the helper IS the canonical map; the rail consumes it)                                                                                                          |
| 5    | charts-residue               | leaf-tsx (filter chrome + non-chart leaves)                                                           | filter chrome + KPI tint (NOT chart graphics — those are Tier-B carved out)       | `frontend/src/components/sla-monitoring/SLAOverviewCards.tsx`                                                                                                                                      | EXACT (sibling in same dir; KPI/card pattern)                                                                                                                          |
| 6    | pages-routes-misc            | mixed: lookup-table-ts (22 `types/*.types.ts`) + page-route (18 routes + 33 pages) + long-tail leaves | per-route page chrome + type-level lookup-table color sets                        | `frontend/src/components/forms/FormCompletionProgress.tsx` (for in-component swaps) + `frontend/src/lib/semantic-colors.ts` (for lookup-table consolidation pattern)                               | ROLE-MATCH (no fully-clean `routes/_protected/*.tsx` since all 18 still carry Tier-C; FormCompletionProgress' swap shape is structurally identical to per-route swaps) |

**Heads-up — one prompt input was a target, not a precedent:**
The pattern-mapping prompt listed `frontend/src/components/forms/FormInput.tsx` as a Tier-A precedent. Verification (`grep -n "Phase 51 Tier-C" frontend/src/components/forms/FormInput.tsx`) shows it still carries five live Tier-C suppression annotations (lines 31, 35, 46, 57, 77) and is therefore a **Wave 1 swap TARGET, not a precedent**. The corresponding unit test `frontend/tests/unit/FormInput.test.tsx:111,119` is the D-14 same-PR test update flagged in `58-RESEARCH.md` §"Test-Grep Hits". The true Wave-1 precedents are `FormCompletionProgress.tsx` and `UnifiedFileUpload.tsx`.

---

## Pattern Assignments (per surface)

### Wave 0: `58-WAVE-MANIFEST.md` (planning artifact)

**Closest analog:** None — this is a new convention defined in `58-CONTEXT.md` §"Specific Ideas" lines 186. There is no prior wave-manifest precedent in `.planning/phases/55-designv2-main-merge-gate-enforcement/` (Phase 55 used per-plan `55-NN-PLAN.md` files without a global manifest) or `.planning/phases/57-phase-52-deviation-closure-d-19-d-23/` (Phase 57 used a single 4-plan sequence, no manifest).

**Convention to follow (from `58-CONTEXT.md` lines 186-187):**

```markdown
# Phase 58 Wave Manifest

| audit_slug                                          | file_path                                        | wave | surface           | raw_hex_count | palette_literal_count | blue_purple_collision | dark_variant_present | multi_literal_line | regen_targets                                   | test_grep_hits                | override_notes                                                |
| --------------------------------------------------- | ------------------------------------------------ | ---- | ----------------- | ------------: | --------------------: | :-------------------: | :------------------: | :----------------: | ----------------------------------------------- | ----------------------------- | ------------------------------------------------------------- |
| FormCompletionProgress                              | components/forms/FormCompletionProgress.tsx      | 1    | forms             |             … |                     … |          no           |         yes          |         no         | after-actions-page-visual,tailwind-remap-visual | —                             | —                                                             |
| FormInput                                           | components/forms/FormInput.tsx                   | 1    | forms             |             … |                     … |          no           |         yes          |         no         | after-actions-page-visual                       | tests/unit/FormInput.test.tsx | —                                                             |
| ActivityFeedFilters                                 | components/activity-feed/ActivityFeedFilters.tsx | 6    | pages-routes-misc |             … |                    49 |          YES          |         yes          |        yes         | activity-page-visual                            | —                             | D-07 collision: country=blue→accent, brief=violet→accent-soft |
| … (268 source rows + 1 row for the manifest itself) |
```

**Source data:** `51-DESIGN-AUDIT.md` §"Tier-C Disposition Table" provides `audit_slug`, `file_path`, `raw_hex_count`, `palette_literal_count`, `proposed_token_map` for all 271 rows. Wave 0 plan adds the additional 6 columns by deterministic grep/AST analysis (see `58-RESEARCH.md` §"Wave-Boundary Detection (Wave 0 manifest builder logic)" lines 411-436 for the bash bucketing script).

**Single Wave-0 commit message convention** (from `58-CONTEXT.md` line 187):

```
chore(58): commit Phase 58 wave manifest (271 files, 2336 nodes mapped to 6 surfaces)
```

---

### Wave 1: forms

**Analog:** `frontend/src/components/forms/FormCompletionProgress.tsx`
**Secondary analog:** `frontend/src/components/forms/UnifiedFileUpload.tsx`

**Imports pattern (Wave-1 swap-shape — confirms NO new imports needed):**

```tsx
// frontend/src/components/forms/FormCompletionProgress.tsx — lines 1-18
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  AlertCircle,
  CircleDot,
  Info,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import type { FormCompletionState } from '@/types/progressive-form.types'
import { useState } from 'react'
```

No semantic-color helper is imported here because the swaps are state-keyed (`text-success`, `text-danger`, `text-warning`, `text-info`, `text-muted-foreground`). The author chose to inline these — that is the canonical shape for status-driven leaf components.

**Core swap pattern — single status-tinted icon (D-09: text-\* drops dark variant):**

```tsx
// AFTER (lines 168-178)
// Status icon
const getStatusIcon = () => {
  if (canSubmit) {
    return <CheckCircle2 className="w-5 h-5 text-success" />
  }
  if (fieldsWithErrors.length > 0) {
    return <AlertCircle className="w-5 h-5 text-danger" />
  }
  if (emptyRequiredFields.length > 0) {
    return <AlertTriangle className="w-5 h-5 text-warning" />
  }
  return <CircleDot className="w-5 h-5 text-info" />
}

// BEFORE (the original Tier-C shape, e.g., the pre-swap FormInput.tsx:31-34 pattern):
//   {/* eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#FormCompletionProgress */}
//   <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
```

**Core swap pattern — bg/border with dark variant (D-08: PRESERVE + alpha bump):**

```tsx
// AFTER (lines 248-261)
{
  requiredFields > 0 && (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium',
        requiredPercentage === 100
          ? 'bg-success/10 text-success dark:bg-success/30 dark:text-success'
          : 'bg-danger/10 text-danger dark:bg-danger/30 dark:text-danger',
      )}
    >
      {/* ... */}
    </span>
  )
}

// MAPPING:
//   bg-green-100 dark:bg-green-900/30 → bg-success/10 dark:bg-success/30
//   text-green-700 dark:text-green-300 → text-success dark:text-success
//                                        ^^^ technically D-09 says DROP the dark variant
//                                        for text-*; this is the canonical Tier-A row but
//                                        Wave 1 SHOULD drop the redundant `dark:text-success`
//                                        per `58-RESEARCH.md` lines 250-256
```

**Composite chrome — upload-zone error/success states (D-08 alpha-bump + cn() conditionals):**

```tsx
// frontend/src/components/forms/UnifiedFileUpload.tsx — lines 181-191
className={cn(
  'relative flex items-center gap-3',
  'p-3 sm:p-4',
  'bg-white dark:bg-muted',
  'border border-line dark:border-line',
  'rounded-lg',
  'shadow-sm',
  uploadedFile.status === 'error' &&
    'border-danger/30 dark:border-danger bg-danger/10 dark:bg-danger/30',
  uploadedFile.status === 'success' && 'border-success/30 dark:border-success',
)}

// MAPPING: state-conditional class additions follow the same D-08 ladder:
//   border-red-300 → border-danger/30 (200→20, 300→30)
//   dark:border-red-700 → dark:border-danger (no alpha = full color)
//   bg-red-100 dark:bg-red-900/30 → bg-danger/10 dark:bg-danger/30
```

**Composite chrome — drag-zone (D-08 + dynamic state class application):**

```tsx
// frontend/src/components/forms/UnifiedFileUpload.tsx — lines 464-488
<div
  {...getRootProps()}
  className={cn(
    'relative overflow-hidden',
    'border-2 border-dashed rounded-lg',
    'transition-all duration-200',
    'cursor-pointer',
    !isDragActive && !displayError && 'border-line dark:border-line',
    isDragAccept && 'border-success bg-success/10 dark:bg-success/20',
    isDragReject && 'border-danger bg-danger/10 dark:bg-danger/20',
    /* ... */
    displayError && 'border-danger/30 dark:border-danger',
    /* ... */
  )}
>
```

**Annotation removal:** Each per-file commit deletes ALL `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<basename>` lines, both single-line and block forms (`/* eslint-disable no-restricted-syntax … */` … `/* eslint-enable */`). Then runs `pnpm lint frontend/src/<file>` per `D-04` and per-commit verification (must exit 0).

**Test-coupling (D-14 same-PR):**
`frontend/tests/unit/FormInput.test.tsx:111,119` asserts `toHaveClass('border-red-500')` and `toHaveClass('border-gray-300')`. After Wave 1's swap of `FormInput.tsx`, update those expectations to `toHaveClass('border-danger')` and `toHaveClass('border-line')` in the SAME commit.

---

### Wave 2: tables

**Analog:** `frontend/src/components/availability-polling/AvailabilityPollResults.tsx`
**Secondary analog:** `frontend/src/components/collaboration/EditingLockIndicator.tsx`

**Status-driven row-color pattern (D-09 — text-\* with NO dark variant):**

```tsx
// frontend/src/components/availability-polling/AvailabilityPollResults.tsx — lines 156-169
{
  isOrganizer && !isPollClosed && !isPollScheduled && (
    <span className={cn('font-medium', responseStats.canClose ? 'text-success' : 'text-warning')}>
      {responseStats.canClose
        ? t('results.canClose')
        : t('results.needMoreResponses', {
            count: responseStats.required - responseStats.responded,
          })}
    </span>
  )
}
```

**Badge variant — outline ring + colored text (D-09):**

```tsx
// frontend/src/components/availability-polling/AvailabilityPollResults.tsx — lines 222-229
{
  isSelected && (
    <Badge variant="outline" className="text-success border-success">
      {t('slots.selectedSlot')}
    </Badge>
  )
}
{
  isFirst && !isSelected && (
    <Badge variant="outline" className="text-warning border-warning">
      {t('slots.bestSlot')}
    </Badge>
  )
}
```

**Rank-badge with conditional tint (D-08 alpha + D-09 text):**

```tsx
// frontend/src/components/availability-polling/AvailabilityPollResults.tsx — lines 206-214
<div
  className={cn(
    'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
    isFirst ? 'bg-warning/10 text-warning dark:bg-warning/30' : 'bg-muted text-muted-foreground',
  )}
>
  #{optSlot.rank}
</div>
```

**Multi-status icon row (D-09 — all text-\* with no dark variant, even though source had `dark:text-X-300`):**

```tsx
// frontend/src/components/availability-polling/AvailabilityPollResults.tsx — lines 259-296
;<span className="flex items-center gap-0.5 text-success">
  <Check className="h-4 w-4" />
  {optSlot.available_count}
</span>
{
  /* ... */
}
;<span className="flex items-center gap-0.5 text-warning">
  <HelpCircle className="h-4 w-4" />
  {optSlot.maybe_count}
</span>
{
  /* ... */
}
;<span className="flex items-center gap-0.5 text-danger">
  <X className="h-4 w-4" />
  {optSlot.unavailable_count}
</span>
```

**Composite-chrome banner (Wave-2 list/table headers — D-08 bg + border + D-09 text):**

```tsx
// frontend/src/components/collaboration/EditingLockIndicator.tsx — lines 114-150 (BannerLock)
<div
  className={cn(
    'flex items-center gap-3 px-4 py-2 rounded-lg',
    'bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning',
    'text-warning dark:text-warning',
  )}
  role="alert"
>
  {/* ... */}
  <Lock className="h-5 w-5 text-warning dark:text-warning" />
  {/* ... */}
</div>
```

> **D-09 nuance:** the code above STILL carries `dark:text-warning` mirrors. These are no-ops (semantic ink tokens are mode-invariant via `buildTokens.ts:59-69`) but they survived Phase 51 Tier-A. Wave 2 commits MAY remove the redundant `dark:text-warning` mirrors to honor D-09 strictly — but doing so is a documentary cleanup, not a functional change. The PRIMARY mandate per D-04 is to swap raw palette literals; removing redundant dark mirrors on text-\* is a secondary tidy. Keep the change-surface minimal: drop `dark:text-X` mirrors that the swap introduces fresh, but do NOT chase pre-existing Tier-A `dark:text-X` mirrors that aren't part of a literal swap.

**Badge with composite chrome (table-cell badge):**

```tsx
// frontend/src/components/collaboration/EditingLockIndicator.tsx — lines 170-177 (BadgeLock)
<Badge
  variant="outline"
  className={cn(
    'gap-1.5 border-warning/30 dark:border-warning',
    'bg-warning/10 dark:bg-warning/20',
    'text-warning dark:text-warning',
  )}
>
```

---

### Wave 3: drawers-dialogs

**Primary analogs:** `frontend/src/components/forms/UnifiedFileUpload.tsx` (composite chrome states) + `frontend/src/components/collaboration/EditingLockIndicator.tsx` (banner + dialog button)
**No exact Tier-A `*Dialog.tsx` exists** in the Phase 51 sweep; the closest pre-cleared shape is the AlertDialog footer styling in `EditingLockIndicator.tsx`. Wave 3 swap-shape inherits from these two.

**Dialog button — semantic action color (D-09 + button utility):**

```tsx
// frontend/src/components/collaboration/EditingLockIndicator.tsx — lines 256-275
<AlertDialog open={showForceEditDialog} onOpenChange={setShowForceEditDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        {t('forceEditWarningTitle')}
      </AlertDialogTitle>
      {/* ... */}
    </AlertDialogHeader>
    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
      <AlertDialogCancel>{t('cancel', { ns: 'common' })}</AlertDialogCancel>
      <AlertDialogAction onClick={handleForceEditConfirm} className="bg-warning hover:bg-warning">
        {t('forceEditConfirm')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Composite alert chrome reused for dialog body:**
Use the `UnifiedFileUpload.tsx` `cn(...)` conditional pattern (lines 466-488) directly in dialog body styling — the alert/error/success state classes are identical between dropzone and dialog content.

**Wave-boundary tie-break (per `58-RESEARCH.md` lines 538-544):**
`components/bulk-actions/BulkActionPreviewDialog.tsx` straddles Wave 2 (dir is `bulk-actions/`, a tables surface) and Wave 3 (filename ends `Dialog.tsx`). **Filename pattern wins** → Wave 3. Manifest's `override_notes` column flags this.

---

### Wave 4: dossier-rail

**Primary analog (helper):** `frontend/src/lib/semantic-colors.ts` — `dossierTypeColors` (lines 37-73), `getDossierTypeBadgeClass()` (lines 83-86), `activityTypeColors` (lines 238-271), `activityActionColors` (lines 288-296), `interactionTypeColors` (lines 313-330)
**Primary analog (consumer / already-clean reference):** `frontend/src/components/dossier/DossierContextBadge.tsx`

**The helper IS the canonical map — DO NOT hand-roll a parallel map:**

```ts
// frontend/src/lib/semantic-colors.ts — lines 37-73 (REUSE; do NOT duplicate)
export const dossierTypeColors: Record<string, ColorSet> = {
  country: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  organization: {
    bg: 'bg-secondary',
    text: 'text-secondary-foreground', // ← D-07 collision target: purple→accent-soft via `secondary`
    border: 'border-secondary',
  },
  forum: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  engagement: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  topic: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
  working_group: { bg: 'bg-accent', text: 'text-accent-foreground', border: 'border-accent' },
  person: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
}
```

**Consumption pattern — Wave 4 swap shape (extract from `DossierContextBadge.tsx` already-clean reference):**

```tsx
// frontend/src/components/dossier/DossierContextBadge.tsx — lines 128-153 (no Tier-C suppressions; the consumer shape)
<Badge
  variant={isPrimary ? 'default' : 'secondary'}
  className={cn(
    'inline-flex items-center gap-1.5 font-normal max-w-full',
    sizeClasses[size],
    clickable && 'cursor-pointer hover:bg-opacity-80 transition-colors',
    className,
  )}
>
  {showIcon && (
    <DossierTypeIcon
      type={dossierType}
      size={size === 'lg' ? 'md' : size === 'sm' ? 'xs' : 'sm'}
      colored={!isPrimary}
      className={isPrimary ? 'text-primary-foreground' : undefined}
    />
  )}
  {/* ... */}
</Badge>
```

**Per-file Wave-4 swap shape — IF the Tier-C file has an inline `Record<DossierType, { bg, text, border }>` map**, REPLACE the inline map with `import { dossierTypeColors } from '@/lib/semantic-colors'` and consume it via `getDossierTypeBadgeClass(type)`. The new import line ELIMINATES the per-row Tier-C annotations the inline map carried. This is the highest-leverage swap shape in Wave 4.

**D-07 blue+purple collision rule — applied per `58-RESEARCH.md` Pattern 2 (lines 258-281):**

```tsx
// AFTER (D-07 collision rule applied):
country: { ..., color: 'text-accent' },              // blue → accent
organization: { ..., color: 'text-secondary-foreground' }, // purple → accent-ink (via secondary)
person: { ..., color: 'text-success' },              // green → success
theme: { ..., color: 'text-secondary-foreground' },  // pink (purple-family) → accent-ink
brief: { ..., color: 'text-secondary-foreground' },  // violet (purple-family) → accent-ink
```

**Files with confirmed collision (from `58-RESEARCH.md` "Blue+Purple Collision Files" lines 547-571) inside Wave 4 surface:**

- `components/dossier/DossierTypeGuide.tsx` (9 blue + 6 purple, 26 disables)
- `components/dossier/TopicDossierDetail.tsx` (6 blue + 9 purple)
- `components/dossier-timeline/DossierTimeline.tsx` (6 blue + 2 purple)
- `components/dossier/DossierTypeSelector.tsx` (3 blue + 2 purple)

---

### Wave 5: charts-residue

**Analog:** `frontend/src/components/sla-monitoring/SLAOverviewCards.tsx`

**Already-clean SLA card pattern (Wave-5 surface — filter/KPI/non-chart leaves only):**

```tsx
// frontend/src/components/sla-monitoring/SLAOverviewCards.tsx — lines 64-97
const cards = [
  {
    title: t('overview.complianceRate'),
    value: `${data.compliance_rate}%`,
    icon: <CheckCircle className="h-5 w-5 text-success" />,
    trend: complianceTrend,
    subtitle: complianceThreshold.label,
    subtitleColor: complianceThreshold.color,
    bgColor: complianceThreshold.bgColor,
  },
  {
    title: t('overview.totalItems'),
    value: data.total_items.toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
    icon: <Clock className="h-5 w-5 text-info" />,
    subtitle: t('overview.processed'),
    subtitleColor: 'text-muted-foreground',
  },
  {
    title: t('overview.atRisk'),
    value: data.at_risk_count.toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
    subtitle: t('overview.approachingDeadline'),
    subtitleColor: data.at_risk_count > 0 ? 'text-warning' : 'text-muted-foreground',
    bgColor: data.at_risk_count > 0 ? 'bg-warning/10' : undefined,
  },
  {
    title: t('overview.breached'),
    value: data.breached_count.toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
    icon: <XCircle className="h-5 w-5 text-danger" />,
    subtitle: t('overview.requiresAttention'),
    subtitleColor: data.breached_count > 0 ? 'text-danger' : 'text-muted-foreground',
    bgColor: data.breached_count > 0 ? 'bg-danger/10' : undefined,
  },
]
```

**Trend-tinted text (Wave 5 — conditional good/bad):**

```tsx
// frontend/src/components/sla-monitoring/SLAOverviewCards.tsx — lines 113-120
<div
  className={cn(
    'flex items-center text-xs font-medium',
    card.trend >= 0 ? 'text-success' : 'text-danger',
  )}
>
  {card.trend >= 0 ? (
    <TrendingUp className={cn('h-3 w-3', isRTL ? 'ms-1' : 'me-1')} />
  ) : (/* ... */)}
</div>
```

**Wave-5 boundary rule:** Only NON-chart leaves go through Phase 58. The Tier-B carve-out (`eslint.config.mjs:247-270`) protects chart graphics (Sparkline, RelationshipGraph, MiniRelationshipGraph, flag glyphs, bootstrap.js, signature-visuals). Wave-0 manifest must NOT claim any path matching the Tier-B carve-out regex.

---

### Wave 6: pages-routes-misc

**Catch-all wave — three sub-buckets, three sub-patterns:**

#### Sub-pattern 6a: `types/*.types.ts` (22 lookup-table files)

**Analog:** Pattern derived from `58-RESEARCH.md` Pattern 3 (lines 282-306) — `types/legislation.types.ts` 63-disable file.

```ts
// BEFORE (Tier-C suppression form):
//   bg: 'bg-gray-50 dark:bg-gray-900/20',
//   text: 'text-gray-700 dark:text-gray-300',
//   border: 'border-gray-200 dark:border-gray-700',
//   bg: 'bg-blue-50 dark:bg-blue-900/20',
//   text: 'text-blue-700 dark:text-blue-300',
//   border: 'border-blue-200 dark:border-blue-700',

// AFTER (Wave-6 swap — D-08 alpha-bump + D-09 text-drop):
bg: 'bg-muted/5 dark:bg-muted/20',                   // gray-50 → muted/5; dark:gray-900/20 → muted/20
text: 'text-muted-foreground',                        // text-gray-700 dark:text-gray-300 → text-muted-foreground (D-09 DROP)
border: 'border-line dark:border-line/70',           // gray-200 → border-line; dark:gray-700 → border-line/70 (alpha bump)
bg: 'bg-info/10 dark:bg-info/30',                    // blue-50 → info/10 (D-08 alpha bump); dark:blue-900/20 → info/30
text: 'text-info',                                    // text-blue-700 dark:text-blue-300 → text-info (D-09 DROP)
border: 'border-info/20 dark:border-info/80',        // border-blue-200 → info/20; dark:border-blue-700 → info/80 (D-08 ladder)
```

**These 22 files are the strongest codemod candidate.** They are pure lookup tables, mechanically uniform, with no business logic to preserve. The planner may evaluate a `jscodeshift` transform JUST for `types/*.types.ts` and hand-edit everything else.

#### Sub-pattern 6b: `routes/_protected/**` (18 files) + `pages/**` (33 files)

**Analog:** `frontend/src/components/forms/FormCompletionProgress.tsx` — page-route swap shape is structurally identical to in-component swap shape; the only difference is route components live under `routes/_protected/`. No new shape required.

#### Sub-pattern 6c: Long-tail unclaimed components (~98 leaves)

**Analog (per file):** Determined by file's role at swap time:

- Status-driven leaves → `FormCompletionProgress.tsx` shape
- Table-shaped leaves → `AvailabilityPollResults.tsx` shape
- Dialog-shaped leaves → `EditingLockIndicator.tsx` shape (already covered in Wave 3 by filename pattern)
- Dossier-type-consuming leaves → `semantic-colors.ts` helper reuse

**Wave-6 sub-bucketing for review tractability (from `58-RESEARCH.md` lines 508-514):** atomic-commit ordering inside the Wave-6 PR:

1. `types/*.types.ts` (22 files — Sub-pattern 6a, codemod candidate)
2. `hooks/ + domains/ + lib/ + router/` (6 files — sparse, hand-edit)
3. `routes/_protected/**` (18 files — Sub-pattern 6b)
4. `pages/**` (33 files — Sub-pattern 6b)
5. `components/calendar/** + commitments/** + remaining unclaimed components` (≈98 files — Sub-pattern 6c)

---

## Shared Patterns (apply across all waves)

### Shared Pattern 1: Annotation Removal (per-file, EVERY wave)

**Source:** `58-CONTEXT.md` §"Established Patterns" lines 157
**Apply to:** Every Tier-C file in every wave

For every literal swap, find ALL `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:` comments on the lines immediately above the swapped literals, and DELETE them. Block-form suppressions (`/* eslint-disable no-restricted-syntax -- Phase 51 Tier-C: … */` … `/* eslint-enable no-restricted-syntax */`) must also be deleted in their entirety.

**Verification per commit (D-04):**

```bash
pnpm lint frontend/src/<file>   # must exit 0
! grep -n "Phase 51 Tier-C" frontend/src/<file>   # must return nothing
```

If `pnpm lint` reports `Unused eslint-disable directive`, an annotation orphan exists — delete it before committing (Pitfall 7 in `58-RESEARCH.md` lines 397-400).

### Shared Pattern 2: Color-family → Token Map (D-05)

**Source:** `58-CONTEXT.md` D-05 (lines 45-51); `frontend/src/index.css` `@theme` block (lines 43-118)
**Apply to:** All waves

| Source family                                             | Token (text)                | Token (bg)     | Token (border)     |
| --------------------------------------------------------- | --------------------------- | -------------- | ------------------ |
| red / rose                                                | `text-danger`               | `bg-danger/N`  | `border-danger/N`  |
| amber / yellow / orange                                   | `text-warning`              | `bg-warning/N` | `border-warning/N` |
| green / emerald / lime                                    | `text-success`              | `bg-success/N` | `border-success/N` |
| blue (links/CTAs)                                         | `text-accent`               | `bg-accent/N`  | `border-accent/N`  |
| blue (badges/informational)                               | `text-info`                 | `bg-info/N`    | `border-info/N`    |
| sky / cyan / teal                                         | `text-info`                 | `bg-info/N`    | `border-info/N`    |
| gray / slate / zinc / neutral / stone                     | `text-muted-foreground`     | `bg-muted`     | `border-line`      |
| purple / violet / fuchsia / pink / indigo (no collision)  | `text-accent`               | `bg-accent/N`  | `border-accent/N`  |
| purple-family (D-07 collision: blue ALSO present in file) | `text-secondary-foreground` | `bg-secondary` | `border-secondary` |

### Shared Pattern 3: Dark-Variant Ladder (D-08 + D-09)

**Source:** `58-CONTEXT.md` D-08/D-09/D-10 (lines 56-60)
**Apply to:** Every literal swap

**D-08 — bg/border preserve dark variant with alpha bump:**

- Tailwind palette suffix 100→10, 200→20, 300→30, …, 900→90
- Dark-variant alpha bumped one tier up: `bg-X-100 dark:bg-X-900/30` → `bg-{semantic}/10 dark:bg-{semantic}/30`

**D-09 — text-\* drops dark variant entirely:**

- `text-X-700 dark:text-X-300` → `text-{semantic}` (NO `dark:` mirror)

**D-10 — NO net-new dark variants:**

- If source had NO `dark:` variant, the swap result has NO `dark:` variant
- If source HAD a `dark:` variant on `bg-*` or `border-*`, preserve it (with alpha bump per D-08)
- If source HAD a `dark:` variant on `text-*`, drop it (per D-09)

### Shared Pattern 4: Reuse `semantic-colors.ts` Helpers (DO NOT hand-roll)

**Source:** `frontend/src/lib/semantic-colors.ts`
**Apply to:** Any Tier-C file whose literal corresponds to a known semantic family

| Helper                                     | Use when                                                         |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `getDossierTypeBadgeClass(type)`           | dossier-type chip / badge in any wave                            |
| `getStatusBadgeClass(status)`              | status badge (`pending`/`in_progress`/`completed`/…) in any wave |
| `getPriorityBadgeClass(priority)`          | priority chip (`low`/`medium`/`high`/`urgent`)                   |
| `getActivityTypeBadgeClass(type)`          | activity timeline item (Wave 4 dossier-rail)                     |
| `getInteractionTypeBadgeClass(type)`       | interaction history badge                                        |
| `getActivityActionTextClass(action)`       | activity feed action color                                       |
| `statVariantStyles[variant]`               | KPI card variant (Wave 5 charts-residue)                         |
| `verifiedBadgeClass` / `pendingBadgeClass` | verification badges                                              |
| `briefSuccessColors` / `briefManualColors` | brief generation result alerts                                   |

**Pitfall 6 (`58-RESEARCH.md` lines 391-394):** Do NOT introduce a new inline `Record<.*, { bg, text, border }>` block in any Tier-C file. If the file's color set matches a helper, import + consume it. If the set differs, raise to planner before fabricating a parallel map.

### Shared Pattern 5: Per-Wave Visual Baseline Regen (D-12)

**Source:** `58-CONTEXT.md` D-12 (lines 70-72); `58-RESEARCH.md` "Visual-Spec Impact Map" lines 593-622
**Apply to:** Every wave PR

Per-wave regen targets (from `58-RESEARCH.md` lines 612-620):

| Wave                | `--update-snapshots` targets                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 0                   | none (manifest only)                                                                                                      |
| 1 forms             | `after-actions-page-visual`, `tailwind-remap-visual` (if exists)                                                          |
| 2 tables            | `list-pages-visual`, `tailwind-remap-visual`                                                                              |
| 3 drawers-dialogs   | `dossier-drawer-visual`, `calendar-visual`, `kanban-visual`, `tasks-page-visual`                                          |
| 4 dossier-rail      | `dossier-drawer-visual` (re-affirm), `dashboard-visual`                                                                   |
| 5 charts-residue    | `dashboard-visual`, `dashboard-widgets-visual`                                                                            |
| 6 pages-routes-misc | `activity-page-visual`, `briefs-page-visual`, `list-pages-visual` (re-affirm), `settings-page-visual`, `tasks-tab-visual` |

**LTR ≠ RTL byte-distinction check (Phase 57 D-22 invariant) — run after every regen:**

```bash
for snap_dir in frontend/tests/e2e/*-visual.spec.ts-snapshots/; do
  for variant in 1280 768; do
    ltr="${snap_dir}<name>-ltr-${variant}-chromium-darwin.png"
    rtl="${snap_dir}<name>-rtl-${variant}-chromium-darwin.png"
    if [[ -f "$ltr" && -f "$rtl" ]]; then
      if cmp -s "$ltr" "$rtl"; then
        echo "FAIL: $ltr and $rtl are byte-identical (D-22 violation)"; exit 1
      fi
    fi
  done
done
```

---

## Anti-Patterns to Avoid (cross-wave)

From `58-CONTEXT.md` §"Anti-patterns to avoid" lines 170-180 and `58-RESEARCH.md` §"Anti-Patterns to Avoid" lines 314-326.

1. **NEVER add new semantic tokens.** Banned by v6.4 OOS. Use `accent`, `accent-soft`, `accent-ink`, `secondary` for purple-family overrides; never `--purple` or `--violet`.
2. **NEVER touch the Tier-B carve-out (`eslint.config.mjs:247-270`).** Chart/flag/bootstrap/signature-visuals exceptions are intentional design statements (Phase 51 D-03/D-13). Touching them is OOS.
3. **NEVER touch `frontend/src/styles/list-pages.css`.** The `legacy-tailwind-token-bridge` block (lines 1113-1450) deliberately retains `[class~='text-red-600']`, `[class~='bg-blue-50']`, `[class~='border-gray-200']` selectors. `frontend/tests/unit/design-system/handoff-css-contract.test.ts:60-67` asserts these strings remain. The bridge is a CSS file (no JS Literals → ESLint Tier-C rule doesn't apply); leave byte-identical.
4. **NEVER touch `tools/eslint-fixtures/bad-design-token.tsx`.** Positive-failure fixture — ESLint MUST continue to error on it. The fixture lives outside `frontend/src/` (it's in `tools/eslint-fixtures/`).
5. **NEVER leave annotation orphans.** Every deleted `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:` must correspond to a swapped literal in the SAME commit. `pnpm lint` will report `Unused eslint-disable directive` on orphans.
6. **NEVER add NET-NEW dark variants** where source had none (D-10).
7. **NEVER drop a `dark:bg-*` or `dark:border-*` variant** that was present in the source. D-09 drops only `dark:text-*`; D-08 PRESERVES `dark:bg-*` / `dark:border-*` with alpha bump (Pitfall 2 in `58-RESEARCH.md` lines 364-368).
8. **NEVER do snapshot regen in a separate PR.** D-12 mandates same-PR regen so evidence is self-contained.
9. **NEVER claim a file in two waves.** Wave-0 manifest assigns every file to EXACTLY ONE wave (D-03). On wave-boundary collisions (e.g., `bulk-actions/BulkActionPreviewDialog.tsx`), filename-pattern wins → Wave 3.
10. **NEVER use `--no-verify`** on commits/merge. Signing/hooks intact per repo convention.
11. **NEVER `git push --force` to main.** Branch protection blocks; not needed in Phase 58.
12. **NEVER introduce a parallel `Record<.*, ColorSet>` map.** Reuse `semantic-colors.ts` helpers (Pitfall 6).
13. **NEVER add a `dark:text-X` mirror to a text-\* swap result.** D-09 explicitly drops it. (The pre-existing `dark:text-warning` mirrors in `EditingLockIndicator.tsx` from the Phase 51 Tier-A sweep are pre-existing — Wave 2 may tidy them, but the swap itself never INTRODUCES one fresh.)

---

## No-Analog Cases (use RESEARCH.md patterns instead of an existing file)

| File                                                               | Reason                                                                                                             | Pattern source                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `58-WAVE-MANIFEST.md`                                              | No prior wave-manifest in `.planning/phases/`                                                                      | `58-CONTEXT.md` §"Specific Ideas" line 186 — manifest column list                                                                                                                                                                                            |
| `components/dossiers/CustomNodes.tsx` (68 disables)                | React-Flow node renderer; sits OUTSIDE Tier-B carve-out by oversight (per `58-RESEARCH.md` Open Q1, lines 628-631) | Treat as in-scope; apply D-05/D-06/D-07/D-08/D-09 mechanical mapping; flag in manifest's `override_notes` column for chromatic regression watching. If a chromatic regression appears, append `## Deferred` note to manifest and refer to a follow-up phase. |
| `routes/_protected/**` (18 files, Wave 6)                          | All 18 still carry Tier-C suppressions; no clean precedent in this dir                                             | Use `FormCompletionProgress.tsx` swap shape (structurally identical to in-route swap; routes are just file-level page components)                                                                                                                            |
| Multi-literal-per-line cases (~91 lines per 51-VERIFICATION delta) | Pattern recognized but per-line; not a standalone analog file                                                      | `58-RESEARCH.md` Pattern 3 (lines 282-306) + Pitfall 1 (lines 358-362). Manifest's `multi_literal_line` column flags these; per-commit `pnpm lint <file>` exit-0 check is the safety net.                                                                    |

---

## Pattern-Mapping Metadata

**Analog search scope:**

- `frontend/src/components/forms/` (Wave 1)
- `frontend/src/components/availability-polling/`, `frontend/src/components/collaboration/` (Wave 2)
- `frontend/src/components/forms/`, `frontend/src/components/collaboration/` (Wave 3 — no exact Dialog precedent exists)
- `frontend/src/components/dossier/`, `frontend/src/lib/` (Wave 4)
- `frontend/src/components/sla-monitoring/` (Wave 5)
- `frontend/src/components/forms/`, `frontend/src/types/`, `frontend/src/lib/` (Wave 6)
- `.planning/phases/55-*`, `.planning/phases/57-*` (Wave 0 manifest precedent — none found)

**Files read for pattern extraction:**

1. `frontend/src/components/forms/FormCompletionProgress.tsx` (374 lines, full)
2. `frontend/src/components/forms/UnifiedFileUpload.tsx` (707 lines, full)
3. `frontend/src/components/collaboration/EditingLockIndicator.tsx` (299 lines, full)
4. `frontend/src/components/availability-polling/AvailabilityPollResults.tsx` (lines 1-320)
5. `frontend/src/components/dossier/DossierContextBadge.tsx` (181 lines, full)
6. `frontend/src/components/sla-monitoring/SLAOverviewCards.tsx` (lines 1-120)
7. `frontend/src/lib/semantic-colors.ts` (442 lines, full)
8. `frontend/src/index.css` (lines 1-130, `@theme` block)
9. `frontend/src/components/forms/FormInput.tsx` (lines 1-40 — to verify it is a target, not a precedent)
10. `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-CONTEXT.md` (212 lines, full)
11. `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-RESEARCH.md` (lines 1-700, targeted)

**Pattern extraction date:** 2026-05-19

---

## PATTERN MAPPING COMPLETE

**Phase:** 58 - Tier-C Design-Token Suppression Full Clear
**Files classified:** 268 source modifications + 1 planning artifact (Wave-0 manifest) = 269 total
**Analogs found:** 6 / 6 surface waves matched with exact or role-match Tier-A precedents; 1 / 1 wave-manifest convention defined from CONTEXT.md (no prior precedent existed)

### Coverage

- Surfaces with EXACT Tier-A analog (in-codebase precedent file): 5 (Waves 1, 2, 4, 5, plus Wave 6 sub-pattern 6a via `types/legislation.types.ts` shape from RESEARCH)
- Surfaces with ROLE-MATCH analog (composite chrome from two Tier-A leaves): 2 (Waves 3 drawers-dialogs, Wave 6 routes/pages)
- Surfaces with no analog (convention-defined): 1 (Wave 0 manifest)

### Key Patterns Identified

- All Tier-A swaps follow D-05 family→token mapping consistently (`bg-amber-100 dark:bg-amber-900/30` → `bg-warning/10 dark:bg-warning/30`, `text-red-700 dark:text-red-300` → `text-danger`).
- `frontend/src/lib/semantic-colors.ts` is the canonical map for all dossier-type / status / priority / activity / interaction color decisions; Wave PRs MUST reuse helpers and MUST NOT introduce parallel `Record<.., ColorSet>` blocks.
- D-08 (preserve+alpha-bump bg/border dark variants) and D-09 (drop text-\* dark variants) are applied per-literal at swap time; no NET-NEW dark variants per D-10.
- Test-coupling (D-14) only affects 1 actionable test (`tests/unit/FormInput.test.tsx`) — Wave 1 PR is the only one that must update a test in the same commit.
- Wave-boundary collisions (e.g., `BulkActionPreviewDialog.tsx`, Wave 2 dir vs Wave 3 filename) resolved by "filename pattern wins" → Wave 3; manifest's `override_notes` documents the choice.

### File Created

`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/phases/58-tier-c-design-token-suppression-full-clear/58-PATTERNS.md`

### Ready for Planning

Pattern mapping complete. Planner can now reference per-wave analog patterns in 7 PLAN.md files (`58-00-wave-manifest-PLAN.md`, `58-01-wave-1-forms-PLAN.md`, …, `58-06-wave-6-pages-routes-misc-PLAN.md`).
