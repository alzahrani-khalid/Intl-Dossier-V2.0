# Follow-up: Add manual-brief create/persist endpoint + wire BriefGenerationPanel

Created: 2026-05-30
Origin: Wave 1 P0 honesty fix (`.planning/quick/260530-1wk-data-entry-p0-data-loss-fixes-attachment/PLAN.md`)
Branch context: `fix/data-entry-uiux-polish`

## Problem

Manual brief submission cannot persist. `BriefGenerationPanel.handleManualSubmit`
was a `console.warn` TODO — user input (summary, background, recommendations) was
silently dropped. No create/save-brief endpoint exists; all current brief endpoints
are AI-generation only.

Wave 1 rewrote `handleManualSubmit` to surface an honest notice
("Saving a manual brief isn't available yet — your text has not been saved.")
instead of pretending to save. The real persistence is deferred to this follow-up.

## Backend build required

1. Add a manual-brief create/persist path:
   - a dedicated create-brief endpoint, OR
   - a `briefs` insert with proper RLS (author = current user, scoped to the
     engagement/dossier).
2. Define the persisted shape (summary, background, recommendations + engagement/
   dossier linkage + author + timestamps).
3. Wire `BriefGenerationPanel.handleManualSubmit` to call the new endpoint:
   - on success, navigate to / open the saved brief (mirror `handleViewBrief`),
   - on failure, surface a real error.
4. Remove the honest `manualNotice` notice once persistence works.

## Touch points

- `frontend/src/components/ai/BriefGenerationPanel.tsx`
- brief hooks (`useGenerateBrief` and/or a new `useCreateManualBrief`)
- new manual-brief endpoint / `briefs` insert + RLS policy
