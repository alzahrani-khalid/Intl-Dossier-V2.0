# Phase 9: Lifecycle Engine - Research

**Researched:** 2026-03-29
**Domain:** Engagement lifecycle state machine, audit logging, intake promotion, forum session modeling
**Confidence:** HIGH

## Summary

Phase 9 introduces a lifecycle stage system for engagements with 6 stages (intake, preparation, briefing, execution, follow_up, closed). The implementation spans 4 layers: (1) database schema additions (new column on `engagement_dossiers`, new `lifecycle_transitions` table, new `forum_session` engagement type, new `lifecycle_stage` column on work items), (2) Supabase Edge Function extensions for transition and promotion APIs, (3) frontend types and repository functions, and (4) UI components (stepper bar, promotion dialog, forum session creator, transition timeline).

The existing codebase provides strong foundations. The `engagement_dossiers` extension table already follows a clean pattern where engagement-specific fields live alongside a base `dossiers` row. The `get_engagement_full` RPC function aggregates engagement + participants + agenda and can be extended to include lifecycle data. The `IntakeTicket` type already has `convertedToType`/`convertedToId` fields and a `converted` status value, providing ready scaffolding for the promotion flow.

**Primary recommendation:** Add `lifecycle_stage` as a new column on `engagement_dossiers` (not a separate table) with a CHECK constraint for the 6 valid values, defaulting to `'intake'`. Create a separate `lifecycle_transitions` audit table. Extend the existing `engagement-dossiers` Edge Function with lifecycle sub-resource routes. Build the stepper bar as a standalone component wrapped in `LtrIsolate` for consistent LTR rendering across languages.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Horizontal stepper bar showing all 6 stages (intake -> preparation -> briefing -> execution -> follow_up -> closed) with current stage highlighted and completed stages marked. CRM pipeline-style. Clickable to transition to any stage.
- **D-02:** System suggests the next logical stage but never blocks transitions. Users can skip forward or move backward freely.
- **D-03:** When skipping non-adjacent stages, an optional note field appears (suggested but not required). Normal sequential transitions need no note.
- **D-04:** `lifecycle_stage` is a NEW field, separate from existing `engagement_status`. Status = event status (planned/confirmed/in_progress/completed/postponed/cancelled). Stage = workflow position (intake/preparation/briefing/execution/follow_up/closed). Both serve different filtering needs and can vary independently.
- **D-05:** Hovering/tapping a completed stage on the stepper shows a tooltip with "Entered: [date]". No dates displayed directly on the bar.
- **D-06:** Confirmation dialog with field preview for intake promotion. User clicks "Promote to Engagement" on an intake ticket. Dialog shows mapped fields (title, description->objectives, dossier links) with editable overrides. User selects engagement_type and category. New engagement starts at "intake" lifecycle stage.
- **D-07:** After promotion, the intake ticket status becomes `converted`, `convertedToId` stores the new engagement ID. Ticket becomes read-only with a banner linking to the new engagement.
- **D-08:** Only engagement-type intake tickets are promotable in Phase 9.
- **D-09:** Each forum session is modeled as a child engagement with `engagement_type: 'forum_session'` (new type value). The parent forum dossier links to all its session-engagements via a `parent_forum_id` field on the engagement extension.
- **D-10:** Each session-engagement has its own independent lifecycle stepper, participants, agenda.
- **D-11:** New session creation from forum dossier page via "New Session" button. Pre-fills parent forum link and copies recurring details.
- **D-12:** Add optional `lifecycle_stage` field to work items, enabling stage-grouped display on kanban and engagement detail views.
- **D-13:** Lifecycle transitions stored in `lifecycle_transitions` table with: id, engagement_id, from_stage, to_stage, user_id, note (optional), timestamp, duration_in_stage_seconds (computed).
- **D-14:** History displayed as vertical timeline in collapsible panel/sidebar section on engagement detail page.
- **D-15:** Duration tracking enables future process analytics.

### Claude's Discretion

- Stepper bar responsive behavior on mobile (horizontal scroll vs compact mode vs vertical stack)
- Color palette for stage indicators (semantic colors per stage or single accent progression)
- Whether the promotion dialog uses a modal or a slide-over panel
- Exact field mapping logic between intake ticket types and engagement fields
- Whether `parent_forum_id` goes on the engagement extension table or the base dossier table
- Index strategy for lifecycle_transitions table (by engagement_id, by stage, by user)

### Deferred Ideas (OUT OF SCOPE)

- Promotion for non-engagement intake types (position, mou_action, foresight)
- Process analytics dashboard (avg time per stage, bottleneck detection)
- Automated stage suggestions based on engagement dates/events
- Batch stage transitions (move multiple engagements at once)
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                     | Research Support                                                                                                                             |
| ------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| LIFE-01 | Engagements have a `lifecycle_stage` field with 6 stages                        | New column on `engagement_dossiers` table with CHECK constraint. Frontend `LifecycleStage` type following `EngagementStatus` pattern.        |
| LIFE-02 | User can transition between stages; system suggests advancing (guide, not gate) | Edge Function sub-resource route `POST /engagement-dossiers/:id/lifecycle-transition`. Stepper bar component with click-to-transition.       |
| LIFE-03 | User can skip stages or move backward                                           | No CHECK constraint on transition direction. Backend validates stage is valid but not direction. Optional note field when non-adjacent.      |
| LIFE-04 | User can promote approved intake to engagement at "intake" stage                | New Edge Function endpoint or extension. Uses existing `convertedToType`/`convertedToId` fields on IntakeTicket. Promotion dialog component. |
| LIFE-05 | Work items can optionally reference a lifecycle stage                           | New nullable `lifecycle_stage` column on tasks table (or via work_item metadata). Frontend type update + kanban grouping mode.               |
| LIFE-06 | Forums support recurring sessions with own lifecycle                            | New `forum_session` value in engagement_type CHECK. New `parent_forum_id` column on engagement_dossiers. Forum page "New Session" button.    |

</phase_requirements>

## Standard Stack

### Core (Already in Project)

| Library            | Version | Purpose                           | Why Standard                              |
| ------------------ | ------- | --------------------------------- | ----------------------------------------- |
| Supabase JS        | 2.39.0  | Database client in Edge Functions | Already used in all Edge Functions        |
| TanStack Query v5  | 5.x     | Server state management           | Already used for engagement data fetching |
| TanStack Router v5 | 5.x     | URL-driven routing                | Already used for engagement routes        |
| i18next            | 23.x    | Bilingual labels (en/ar)          | Already used for all UI text              |
| Tailwind CSS v4    | 4.x     | Styling                           | Already used project-wide                 |
| lucide-react       | latest  | Icons                             | Already used in EngagementDetailPage      |

### Supporting (Already in Project)

| Library                  | Version | Purpose                        | When to Use                         |
| ------------------------ | ------- | ------------------------------ | ----------------------------------- |
| class-variance-authority | 0.7.x   | Stepper bar variants           | Stage indicator styling with cva    |
| @radix-ui/react-tooltip  | latest  | Stage date tooltips on stepper | D-05: hover shows "Entered: [date]" |
| @radix-ui/react-dialog   | latest  | Promotion confirmation dialog  | D-06: field preview modal           |
| clsx + tailwind-merge    | latest  | Conditional class merging      | All component styling               |

### Alternatives Considered

| Instead of                     | Could Use                     | Tradeoff                                                                                                                             |
| ------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Custom stepper                 | react-step-wizard             | Custom is better here -- project already has HeroUI/shadcn patterns; external steppers rarely support RTL + bidirectional navigation |
| Separate lifecycle_stage table | Column on engagement_dossiers | Column is simpler, sufficient for 1:1 relationship. Separate table adds unnecessary JOIN.                                            |
| Express API route              | Supabase Edge Function        | Edge Functions are the established pattern for engagement CRUD. Stay consistent.                                                     |

## Architecture Patterns

### Recommended Project Structure

```
supabase/
  migrations/
    20260329000001_add_lifecycle_stage.sql          # LIFE-01: column + transitions table
    20260329000002_add_forum_session_support.sql     # LIFE-06: parent_forum_id + type
    20260329000003_add_work_item_lifecycle_stage.sql # LIFE-05: tasks.lifecycle_stage
  functions/
    engagement-dossiers/index.ts                    # EXTEND: lifecycle sub-resource

frontend/
  src/
    types/
      engagement.types.ts                           # EXTEND: LifecycleStage type
      lifecycle.types.ts                            # NEW: LifecycleTransition, PromotionRequest
      work-item.types.ts                            # EXTEND: lifecycle_stage field
    domains/
      engagements/
        repositories/engagements.repository.ts      # EXTEND: transition + promotion API calls
        hooks/useLifecycle.ts                       # NEW: useLifecycleTransition, useLifecycleHistory
    components/
      engagements/
        LifecycleStepperBar.tsx                     # NEW: LIFE-01, LIFE-02, LIFE-03 (D-01 to D-05)
        LifecycleTimeline.tsx                       # NEW: LIFE-06 audit trail (D-13, D-14)
        IntakePromotionDialog.tsx                   # NEW: LIFE-04 (D-06, D-07)
        ForumSessionCreator.tsx                     # NEW: LIFE-06 (D-09, D-10, D-11)
    pages/
      engagements/
        EngagementDetailPage.tsx                    # EXTEND: add stepper bar + lifecycle timeline
    routes/
      _protected/
        intake.tsx                                  # EXTEND: add promote button for engagement tickets
    public/
      locales/
        en/lifecycle.json                           # NEW: bilingual labels
        ar/lifecycle.json                           # NEW: bilingual labels
```

### Pattern 1: Lifecycle Stage as Column on Extension Table

**What:** Add `lifecycle_stage` directly to `engagement_dossiers` rather than a separate table.
**When to use:** 1:1 relationship between engagement and current stage. Only one stage is "current" at a time.
**Why:** Avoids unnecessary JOINs. The `get_engagement_full` RPC already returns `engagement_dossiers` data; no schema change needed for the read path.

```sql
-- Add to engagement_dossiers
ALTER TABLE engagement_dossiers
ADD COLUMN lifecycle_stage TEXT NOT NULL DEFAULT 'intake'
CHECK (lifecycle_stage IN ('intake', 'preparation', 'briefing', 'execution', 'follow_up', 'closed'));
```

### Pattern 2: Audit Trail as Separate Table with Computed Duration

**What:** `lifecycle_transitions` table stores every stage change with from/to, user, note, and duration computation.
**When to use:** Transition history is 1:many (one engagement, many transitions). Separate table is correct.

```sql
CREATE TABLE lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagement_dossiers(id) ON DELETE CASCADE,
  from_stage TEXT, -- NULL for initial stage assignment
  to_stage TEXT NOT NULL CHECK (to_stage IN ('intake','preparation','briefing','execution','follow_up','closed')),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT, -- Optional freeform text (D-03)
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_in_stage_seconds INTEGER, -- Computed from previous transition (D-15)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Pattern 3: Edge Function Sub-Resource for Lifecycle Operations

**What:** Extend the existing `engagement-dossiers` Edge Function with lifecycle-specific routes.
**When to use:** Follows the established pattern where `engagement-dossiers/:id/participants` and `engagement-dossiers/:id/agenda` are sub-resources.

```typescript
// In engagement-dossiers/index.ts, add new sub-resource:
if (id && subResource === 'lifecycle') {
  return handleLifecycle(req, supabaseClient, user, id, url)
}

// POST /engagement-dossiers/:id/lifecycle — transition stage
// GET /engagement-dossiers/:id/lifecycle — get transition history
```

### Pattern 4: Stepper Bar with LtrIsolate Wrapper

**What:** The lifecycle stepper always renders left-to-right (intake on left, closed on right) regardless of page direction.
**When to use:** Per STATE.md decision: "LifecycleBar needs LtrIsolate wrapper (progress indicators read left-to-right in all languages)."

```tsx
import { LtrIsolate } from '@/components/ui/ltr-isolate'

;<LtrIsolate className="w-full overflow-x-auto">
  <LifecycleStepperBar
    currentStage={engagement.lifecycle_stage}
    transitions={transitions}
    onTransition={handleTransition}
  />
</LtrIsolate>
```

### Pattern 5: Forum Session as Child Engagement

**What:** `forum_session` is a new value in `engagement_type`. Sessions link to parent forum via `parent_forum_id` on extension table.
**When to use:** Each session reuses ALL engagement infrastructure (participants, agenda, lifecycle, after-action).

```sql
-- Extend engagement_type CHECK
ALTER TABLE engagement_dossiers
DROP CONSTRAINT engagement_dossiers_engagement_type_check,
ADD CONSTRAINT engagement_dossiers_engagement_type_check CHECK (engagement_type IN (
  'bilateral_meeting', 'mission', 'delegation', 'summit', 'working_group',
  'roundtable', 'official_visit', 'consultation', 'forum_session', 'other'
));

-- Add parent forum reference
ALTER TABLE engagement_dossiers
ADD COLUMN parent_forum_id UUID REFERENCES dossiers(id) ON DELETE SET NULL;
```

### Anti-Patterns to Avoid

- **Separate lifecycle_stage table for current stage:** Adds unnecessary JOIN for every engagement read. Column on extension table is simpler and faster.
- **Transition validation (blocking non-sequential):** D-02 and D-03 explicitly state transitions are flexible. Never block direction.
- **Duplicating engagement infrastructure for forum sessions:** Sessions ARE engagements. Do not create parallel tables for session participants, session agendas, etc.
- **Using `textAlign: "right"` in stepper bar:** Per CLAUDE.md RTL Rule 3, this flips to LEFT with forceRTL. Use `writingDirection: "rtl"` or `LtrIsolate`.
- **Manual `.reverse()` on stage array:** Per CLAUDE.md RTL Rule 4, `forceRTL` handles direction. The stepper lives inside `LtrIsolate` so direction is forced LTR anyway.

## Don't Hand-Roll

| Problem                             | Don't Build                   | Use Instead                                                            | Why                                                                                                                            |
| ----------------------------------- | ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Tooltip on stepper stages           | Custom hover state            | `@radix-ui/react-tooltip` (already in project)                         | Handles positioning, a11y, keyboard focus, RTL                                                                                 |
| Confirmation dialog for promotion   | Custom modal logic            | `AlertDialog` from `@/components/ui/alert-dialog` (already in project) | Consistent with existing archive dialog pattern in EngagementDetailPage                                                        |
| UUID generation in migrations       | Custom ID logic               | `gen_random_uuid()`                                                    | Standard PostgreSQL pattern used in all project tables                                                                         |
| Duration computation                | Application-level calculation | SQL computed column or trigger                                         | `duration_in_stage_seconds` can be computed as `EXTRACT(EPOCH FROM (NEW.transitioned_at - prev.transitioned_at))` in a trigger |
| Date formatting in stepper tooltips | Manual Intl.DateTimeFormat    | Existing `formatDate` from EngagementDetailPage                        | Already handles ar-SA and en-US locales                                                                                        |

**Key insight:** The engagement detail page already has tooltip, dialog, date formatting, and RTL-aware patterns. Reuse them. The promotion dialog follows the exact same pattern as the archive AlertDialog already on the page.

## Common Pitfalls

### Pitfall 1: Forgetting to Extend get_engagement_full RPC

**What goes wrong:** Adding `lifecycle_stage` to `engagement_dossiers` but not updating the `get_engagement_full` RPC function. Frontend receives engagement data without the new field.
**Why it happens:** The RPC function explicitly selects `ed.*` which WILL include the new column, but the TypeScript types won't know about it until updated.
**How to avoid:** Update `EngagementExtension`, `EngagementDossier`, `EngagementFullProfile` types FIRST. Then verify the RPC output includes the field.
**Warning signs:** Frontend shows `undefined` for lifecycle_stage.

### Pitfall 2: CHECK Constraint Conflicts on ALTER TABLE

**What goes wrong:** Trying to add new values to `engagement_type` CHECK constraint without dropping the old one first.
**Why it happens:** PostgreSQL CHECK constraints are immutable. You must DROP then ADD.
**How to avoid:** Use `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT` pattern (shown in Architecture Patterns section).
**Warning signs:** Migration fails with "constraint already exists" error.

### Pitfall 3: Missing RLS on lifecycle_transitions Table

**What goes wrong:** New table without RLS policies allows any authenticated user to read/write any engagement's transitions.
**Why it happens:** Forgetting to add RLS when creating the table.
**How to avoid:** Always add `ALTER TABLE lifecycle_transitions ENABLE ROW LEVEL SECURITY` and policies. Follow the `engagement_participants` RLS pattern -- join through `engagement_dossiers` to `dossiers` for access check.
**Warning signs:** Users seeing transitions from engagements they shouldn't access.

### Pitfall 4: Stepper Bar Not Scrollable on Mobile

**What goes wrong:** 6 stages overflow on small screens (< 375px), labels get truncated or overlap.
**Why it happens:** Fixed-width stepper design without responsive consideration.
**How to avoid:** Use `overflow-x-auto` with `min-w-0` on the stepper container. On mobile (< 640px), show abbreviated labels or icon-only mode. Mobile-first design per CLAUDE.md.
**Warning signs:** Stages overlap or are unreachable by touch on mobile.

### Pitfall 5: Double-Counting Duration on Backward Transitions

**What goes wrong:** When a user moves from "execution" back to "preparation", the duration calculation for the current stage gets confused if using simple "last transition" logic.
**Why it happens:** Backward transitions mean the same stage can appear multiple times in history.
**How to avoid:** `duration_in_stage_seconds` should always be computed as the time since the previous transition (regardless of direction). It measures "how long were we in the FROM stage", not "total time in this stage."
**Warning signs:** Negative or impossibly large duration values.

### Pitfall 6: Intake Promotion Creating Orphaned Dossier on Failure

**What goes wrong:** Creating the base dossier succeeds but engagement extension insert fails, leaving an orphaned dossier row.
**Why it happens:** Two-step insert without transaction.
**How to avoid:** Use the same pattern as `createEngagement` in the Edge Function -- if extension insert fails, delete the base dossier. Or wrap in a Supabase RPC function for atomicity.
**Warning signs:** Dossier entries with no matching engagement_dossiers row.

## Code Examples

### Example 1: Migration for lifecycle_stage Column

```sql
-- Source: Pattern from existing engagement_dossiers migration
ALTER TABLE engagement_dossiers
ADD COLUMN lifecycle_stage TEXT NOT NULL DEFAULT 'intake'
CHECK (lifecycle_stage IN (
  'intake',
  'preparation',
  'briefing',
  'execution',
  'follow_up',
  'closed'
));

CREATE INDEX idx_engagement_dossiers_lifecycle_stage
  ON engagement_dossiers(lifecycle_stage);

COMMENT ON COLUMN engagement_dossiers.lifecycle_stage IS
  'Workflow position of the engagement. Separate from engagement_status (event status).';
```

### Example 2: lifecycle_transitions Table

```sql
-- Source: Pattern from engagement_participants + AuditLogEntry in intake types
CREATE TABLE lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagement_dossiers(id) ON DELETE CASCADE,
  from_stage TEXT CHECK (from_stage IS NULL OR from_stage IN (
    'intake','preparation','briefing','execution','follow_up','closed'
  )),
  to_stage TEXT NOT NULL CHECK (to_stage IN (
    'intake','preparation','briefing','execution','follow_up','closed'
  )),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT,
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_in_stage_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lifecycle_transitions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_lifecycle_transitions_engagement
  ON lifecycle_transitions(engagement_id, transitioned_at DESC);
CREATE INDEX idx_lifecycle_transitions_stage
  ON lifecycle_transitions(to_stage, transitioned_at DESC);

-- RLS: Follow engagement_participants pattern
CREATE POLICY "Users can view lifecycle transitions"
  ON lifecycle_transitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM engagement_dossiers ed
      JOIN dossiers d ON d.id = ed.id
      WHERE ed.id = lifecycle_transitions.engagement_id
      AND d.status != 'archived'
    )
  );

CREATE POLICY "Authenticated users can create transitions"
  ON lifecycle_transitions FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

### Example 3: TypeScript LifecycleStage Type

```typescript
// Source: Pattern from EngagementStatus in engagement.types.ts
export const LIFECYCLE_STAGES = [
  'intake',
  'preparation',
  'briefing',
  'execution',
  'follow_up',
  'closed',
] as const
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number]

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, { en: string; ar: string }> = {
  intake: { en: 'Intake', ar: 'الاستقبال' },
  preparation: { en: 'Preparation', ar: 'التحضير' },
  briefing: { en: 'Briefing', ar: 'الإحاطة' },
  execution: { en: 'Execution', ar: 'التنفيذ' },
  follow_up: { en: 'Follow Up', ar: 'المتابعة' },
  closed: { en: 'Closed', ar: 'مغلق' },
}

export interface LifecycleTransition {
  id: string
  engagement_id: string
  from_stage: LifecycleStage | null
  to_stage: LifecycleStage
  user_id: string
  user_name?: string
  note?: string
  transitioned_at: string
  duration_in_stage_seconds?: number
}
```

### Example 4: LifecycleStepperBar Component Structure

```tsx
// Source: D-01 through D-05 decisions + LtrIsolate pattern
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LIFECYCLE_STAGES, LIFECYCLE_STAGE_LABELS } from '@/types/lifecycle.types'
import type { LifecycleStage, LifecycleTransition } from '@/types/lifecycle.types'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { cn } from '@/lib/utils'

interface LifecycleStepperBarProps {
  currentStage: LifecycleStage
  transitions: LifecycleTransition[]
  onTransition: (toStage: LifecycleStage, note?: string) => void
  disabled?: boolean
}

export function LifecycleStepperBar({
  currentStage,
  transitions,
  onTransition,
  disabled = false,
}: LifecycleStepperBarProps): ReactElement {
  const { isRTL } = useDirection()
  const { t } = useTranslation('lifecycle')
  const currentIndex = LIFECYCLE_STAGES.indexOf(currentStage)

  // Find when each stage was entered (for tooltip)
  const stageEntryDates = new Map<string, string>()
  for (const tr of transitions) {
    if (!stageEntryDates.has(tr.to_stage)) {
      stageEntryDates.set(tr.to_stage, tr.transitioned_at)
    }
  }

  return (
    <LtrIsolate className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-[480px] gap-1">
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isNonAdjacent = Math.abs(idx - currentIndex) > 1
          const entryDate = stageEntryDates.get(stage)

          return (
            <Tooltip key={stage}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (!disabled && stage !== currentStage) {
                      // Non-adjacent: prompt for optional note (D-03)
                      if (isNonAdjacent) {
                        // Show note prompt...
                      }
                      onTransition(stage)
                    }
                  }}
                  className={cn(
                    'flex-1 h-10 min-h-11 min-w-11 rounded-md text-xs sm:text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isCompleted && 'bg-green-500/15 text-green-700 border border-green-300',
                    isCurrent && 'bg-primary/15 text-primary border-2 border-primary',
                    !isCompleted &&
                      !isCurrent &&
                      'bg-muted text-muted-foreground border border-border',
                    !disabled && 'cursor-pointer hover:opacity-80',
                  )}
                  disabled={disabled}
                >
                  {isRTL ? LIFECYCLE_STAGE_LABELS[stage].ar : LIFECYCLE_STAGE_LABELS[stage].en}
                </button>
              </TooltipTrigger>
              {entryDate && (
                <TooltipContent>
                  {t('stepper.entered', 'Entered')}: {formatDate(entryDate)}
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </div>
    </LtrIsolate>
  )
}
```

### Example 5: Intake Promotion API Call Pattern

```typescript
// Source: Pattern from createEngagement in engagements.repository.ts
export interface IntakePromotionRequest {
  intake_ticket_id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  engagement_type: EngagementType
  engagement_category: EngagementCategory
  start_date?: string
  end_date?: string
  dossier_links?: string[] // IDs from intake ticket's linked dossiers
}

export async function promoteIntakeToEngagement(
  data: IntakePromotionRequest,
): Promise<EngagementFullProfile> {
  return apiPost<EngagementFullProfile>('/intake-promotion', data)
}
```

### Example 6: Edge Function Lifecycle Transition Handler

```typescript
// Source: Pattern from handleParticipants in engagement-dossiers Edge Function
async function handleLifecycle(
  req: Request,
  supabaseClient: any,
  user: any,
  engagementId: string,
  url: URL,
) {
  switch (req.method) {
    case 'GET':
      return getTransitionHistory(supabaseClient, engagementId)
    case 'POST':
      return transitionStage(req, supabaseClient, user, engagementId)
    default:
      return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', 'not allowed')
  }
}

async function transitionStage(req: Request, supabaseClient: any, user: any, engagementId: string) {
  const { to_stage, note } = await req.json()

  // Get current stage
  const { data: engagement } = await supabaseClient
    .from('engagement_dossiers')
    .select('lifecycle_stage')
    .eq('id', engagementId)
    .single()

  if (!engagement) return errorResponse(404, 'NOT_FOUND', 'Not found', 'not found')

  const from_stage = engagement.lifecycle_stage

  // Get previous transition for duration calculation
  const { data: prevTransition } = await supabaseClient
    .from('lifecycle_transitions')
    .select('transitioned_at')
    .eq('engagement_id', engagementId)
    .order('transitioned_at', { ascending: false })
    .limit(1)
    .single()

  const duration = prevTransition
    ? Math.floor((Date.now() - new Date(prevTransition.transitioned_at).getTime()) / 1000)
    : null

  // Insert transition record
  await supabaseClient.from('lifecycle_transitions').insert({
    engagement_id: engagementId,
    from_stage,
    to_stage,
    user_id: user.id,
    note: note || null,
    duration_in_stage_seconds: duration,
  })

  // Update current stage
  await supabaseClient
    .from('engagement_dossiers')
    .update({ lifecycle_stage: to_stage })
    .eq('id', engagementId)

  // Return updated engagement
  const { data: fullData } = await supabaseClient.rpc('get_engagement_full', {
    p_engagement_id: engagementId,
  })

  return new Response(JSON.stringify(fullData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

## State of the Art

| Old Approach                     | Current Approach                                           | When Changed         | Impact                                      |
| -------------------------------- | ---------------------------------------------------------- | -------------------- | ------------------------------------------- |
| Rigid state machines (JIRA-like) | Flexible lifecycle (guide not gate)                        | D-02, D-03 decisions | No transition validation needed server-side |
| Separate status and stage        | `engagement_status` (event) + `lifecycle_stage` (workflow) | D-04 decision        | Both fields coexist independently           |
| Standalone forum sessions        | Session as child engagement                                | D-09 decision        | Reuse all engagement infrastructure         |

**Deprecated/outdated:**

- The old `engagements` table (from pre-dossier architecture) still exists but is not used by engagement_dossiers. The RPC function `resolve_dossier_context` references it -- may need cleanup but is OUT OF SCOPE for Phase 9.

## Open Questions

1. **Where exactly should `parent_forum_id` live?**
   - What we know: D-09 says child engagement links to parent forum. Options: (a) on `engagement_dossiers` extension table, (b) as a `dossier_relationships` entry
   - What's unclear: Whether the base `dossier_relationships` table is sufficient or a direct FK is cleaner
   - Recommendation: Put `parent_forum_id UUID REFERENCES dossiers(id)` on `engagement_dossiers`. Direct FK is simpler, faster for queries ("get all sessions for this forum"), and follows the `host_country_id` / `host_organization_id` pattern already on the table.

2. **Work item lifecycle_stage column location**
   - What we know: WorkItem has `engagement_id` already (via metadata or direct field). D-12 wants optional `lifecycle_stage`.
   - What's unclear: Whether to add `lifecycle_stage` to the `tasks` table, `commitments` table, AND `intake_tickets` table separately, or to use work_item metadata.
   - Recommendation: Add `lifecycle_stage TEXT` (nullable, with same CHECK constraint) to `tasks` table only. Commitments and intake tickets don't have kanban stage-grouped display need. If needed later, can extend. This minimizes migration scope.

3. **Mobile stepper behavior**
   - What we know: 6 stages need to fit on 320px+ screens
   - Recommendation: Horizontal scrollable on mobile (`overflow-x-auto` with `min-w-[480px]`). Show full text on sm+ screens. Use abbreviated labels (icons only) as fallback only if text overflow is severe. Touch targets stay 44px minimum per CLAUDE.md.

## Project Constraints (from CLAUDE.md)

- **RTL-First:** All new components must use RTL-safe patterns. Stepper bar uses `LtrIsolate` wrapper (per STATE.md decision). No `textAlign: "right"`, no `.reverse()`, use `writingDirection: "rtl"` for Arabic text.
- **Mobile-First:** Start with 320px base layout, scale up with sm/md/lg breakpoints. Touch targets min 44x44px.
- **Logical Properties:** Use `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end` in Tailwind. Never `ml-*`, `mr-*`, `text-left`, `text-right`.
- **HeroUI v3 Priority:** Check HeroUI v3 for components first, then Aceternity, then Kibo-UI, then shadcn.
- **No Semicolons:** Project uses `"semi": false`.
- **Explicit Return Types:** Required on all functions.
- **No `any`:** Error-level ESLint rule.
- **Bilingual Fields:** All user-facing text needs `_en` and `_ar` variants.
- **Supabase MCP for Migrations:** Use Supabase MCP to apply migrations.
- **200KB Bundle Budget:** All new components must be lazy-loaded per STATE.md.

## Validation Architecture

### Test Framework

| Property           | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Framework          | Vitest 1.x                                                                         |
| Config file        | `vitest.config.ts` (root), `frontend/vitest.config.ts`, `backend/vitest.config.ts` |
| Quick run command  | `pnpm test -- --run`                                                               |
| Full suite command | `pnpm test`                                                                        |

### Phase Requirements to Test Map

| Req ID  | Behavior                             | Test Type   | Automated Command                                                       | File Exists? |
| ------- | ------------------------------------ | ----------- | ----------------------------------------------------------------------- | ------------ |
| LIFE-01 | lifecycle_stage field on engagements | integration | `pnpm vitest run tests/integration/lifecycle-stage.test.ts -x`          | Wave 0       |
| LIFE-02 | Stage transition (any direction)     | unit        | `pnpm vitest run tests/unit/services/LifecycleTransition.test.ts -x`    | Wave 0       |
| LIFE-03 | Skip/backward transitions allowed    | unit        | `pnpm vitest run tests/unit/services/LifecycleTransition.test.ts -x`    | Wave 0       |
| LIFE-04 | Intake promotion to engagement       | integration | `pnpm vitest run tests/integration/intake-promotion.test.ts -x`         | Wave 0       |
| LIFE-05 | Work item lifecycle_stage reference  | unit        | `pnpm vitest run tests/unit/services/WorkItemLifecycleStage.test.ts -x` | Wave 0       |
| LIFE-06 | Forum sessions as child engagements  | integration | `pnpm vitest run tests/integration/forum-session-lifecycle.test.ts -x`  | Wave 0       |

### Sampling Rate

- **Per task commit:** `pnpm vitest run --run`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/services/LifecycleTransition.test.ts` -- covers LIFE-02, LIFE-03 (transition logic)
- [ ] `tests/integration/lifecycle-stage.test.ts` -- covers LIFE-01 (field exists, defaults work)
- [ ] `tests/integration/intake-promotion.test.ts` -- covers LIFE-04 (promotion creates engagement at intake stage)
- [ ] `tests/unit/services/WorkItemLifecycleStage.test.ts` -- covers LIFE-05 (optional field behavior)
- [ ] `tests/integration/forum-session-lifecycle.test.ts` -- covers LIFE-06 (child engagement creation, independent lifecycle)
- [ ] Framework install: None needed -- Vitest already configured

## Environment Availability

| Dependency         | Required By      | Available        | Version         | Fallback                |
| ------------------ | ---------------- | ---------------- | --------------- | ----------------------- |
| Supabase (staging) | All migrations   | Yes              | PostgreSQL 17.6 | --                      |
| pnpm               | All builds       | Yes              | 10.29.1+        | --                      |
| Node.js            | Backend/frontend | Yes              | 20.19.0+        | --                      |
| Deno               | Edge Functions   | Via Supabase CLI | --              | Deploy via Supabase MCP |

**Missing dependencies with no fallback:** None.

## Sources

### Primary (HIGH confidence)

- `supabase/migrations/20260110000006_create_engagement_dossiers.sql` -- engagement schema, RLS patterns, RPC function
- `supabase/functions/engagement-dossiers/index.ts` -- Edge Function CRUD pattern, sub-resource routing
- `frontend/src/types/engagement.types.ts` -- EngagementStatus, labels, type patterns
- `frontend/src/types/intake.ts` -- IntakeTicket with convertedToType/convertedToId
- `frontend/src/types/work-item.types.ts` -- WorkItem with engagement_id
- `frontend/src/pages/engagements/EngagementDetailPage.tsx` -- Current UI structure, tab pattern
- `frontend/src/components/ui/ltr-isolate.tsx` -- LtrIsolate wrapper pattern
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` -- API client pattern
- `.planning/phases/09-lifecycle-engine/09-CONTEXT.md` -- All locked decisions D-01 through D-15

### Secondary (MEDIUM confidence)

- `supabase/migrations/20260116500001_create_work_item_dossiers.sql` -- Junction table pattern, RLS with polymorphic types
- `backend/src/api/index.ts` -- Backend API router structure (confirms engagement CRUD is via Edge Functions, not Express)
- `frontend/src/types/forum.types.ts` -- Forum extension pattern with number_of_sessions

### Tertiary (LOW confidence)

- Arabic translations for lifecycle stage labels -- translations provided are best-effort, should be reviewed by Arabic speaker

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already in project, no new dependencies
- Architecture: HIGH -- follows established patterns (extension tables, Edge Functions, sub-resource routing)
- Pitfalls: HIGH -- identified from actual codebase patterns and existing bugs
- RTL/Mobile: HIGH -- LtrIsolate pattern confirmed in codebase, mobile-first patterns established

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days -- stable domain, no external dependency changes expected)
