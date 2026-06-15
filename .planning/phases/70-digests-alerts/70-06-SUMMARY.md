---
phase: 70-digests-alerts
plan: 06
subsystem: frontend-digests-alerts
tags: [frontend, i18n, digests, alerts, tanstack-query, rtl]

requires:
  - phase: 70-digests-alerts
    plan: 04
    provides: channel adapters and delivery contracts
  - phase: 70-digests-alerts
    plan: 05
    provides: digest subscriptions, read_digests RPC, alert-rule table/API contract
provides:
  - registered intelligence-digests and intelligence-alerts i18n namespaces
  - caller-JWT digest and alert-rule hooks
  - Digests and Alerts hub tabs
  - digest card, reader, and subscription drawer surfaces
  - alert rule row and create/edit/delete drawer surfaces
affects: [frontend, intelligence-digests, intelligence-alerts]

key-files:
  created:
    - frontend/src/i18n/en/intelligence-digests.json
    - frontend/src/i18n/ar/intelligence-digests.json
    - frontend/src/i18n/en/intelligence-alerts.json
    - frontend/src/i18n/ar/intelligence-alerts.json
    - frontend/src/domains/signals/hooks/useDigests.ts
    - frontend/src/domains/signals/hooks/useAlertRules.ts
    - frontend/src/components/intelligence/DigestsTab.tsx
    - frontend/src/components/intelligence/DigestCard.tsx
    - frontend/src/components/intelligence/DigestReader.tsx
    - frontend/src/components/intelligence/DigestSubscribeDrawer.tsx
    - frontend/src/components/intelligence/AlertsTab.tsx
    - frontend/src/components/intelligence/AlertRuleRow.tsx
    - frontend/src/components/intelligence/AlertRuleForm.tsx
    - .planning/phases/70-digests-alerts/70-06-SUMMARY.md
  modified:
    - frontend/src/i18n/index.ts
    - frontend/src/domains/signals/index.ts
    - frontend/src/pages/intelligence/IntelligencePage.tsx

requirements-completed:
  - DIGEST-01
  - DIGEST-03
  - ALERT-01
  - ALERT-03

duration: 15 min
completed: 2026-06-15
---

# Phase 70 Plan 06: Frontend Surfaces Summary

**Built the Phase 70 Digests and Alerts frontend surfaces and extended the Intelligence hub to `Reports | Signals | Digests | Alerts`.**

## Performance

- **Started:** 2026-06-15T10:04:30Z
- **Completed:** 2026-06-15T10:19:45Z
- **Tasks:** 3 completed
- **Files modified:** 17

## Accomplishments

- Added EN/AR `intelligence-digests` and `intelligence-alerts` JSON namespaces and registered both in `frontend/src/i18n/index.ts`.
- Added `useDigests.ts` with:
  - `read_digests` SECURITY INVOKER RPC reads under the caller session
  - active subscription reads and subscribe/unsubscribe mutations
  - RLS-scoped dossier-name enrichment for digest/subscription rows
- Added `useAlertRules.ts` with:
  - owner-scoped alert rule reads
  - create/update/delete mutations against `intelligence_alert_rules`
  - in-app channel normalization and dossier-name enrichment
- Added digest UI:
  - `DigestsTab`
  - `DigestCard`
  - `DigestReader`
  - `DigestSubscribeDrawer`
- Added alerts UI:
  - `AlertsTab`
  - `AlertRuleRow`
  - `AlertRuleForm`
- Extended `IntelligencePage.tsx` from two tabs to four tabs in order: Reports, Signals, Digests, Alerts.

## Task Commits

1. **Implementation:** `9542951c` — i18n namespaces, hooks, digest components, alert components, and Intelligence hub tab wiring.

## Verification

- `pnpm --filter intake-frontend type-check`
  - exit `0`
- `pnpm --filter intake-frontend build`
  - exit `0`
- Commit hook `pnpm build`
  - exit `0`
- `grep -rn "text-blue-500\|text-red-500\|text-green-500\|#[0-9a-fA-F]" frontend/src/components/intelligence/`
  - `0` matches
- `grep -rn '" ml-\|" mr-\|" pl-\|" pr-' frontend/src/components/intelligence/`
  - `0` matches
- `grep -c "intelligence-digests\|intelligence-alerts" frontend/src/i18n/index.ts`
  - `9`
- `grep -c "clearance\|filtered" frontend/src/components/intelligence/DigestsTab.tsx frontend/src/components/intelligence/DigestCard.tsx`
  - `0` matches in both files

## Deviations from Plan

- The plan's verification command used `pnpm --filter intake-frontend typecheck`, but the frontend package exposes `type-check`; `typecheck` exists only as a root turbo script. Used `pnpm --filter intake-frontend type-check`.
- The live dossier type domain remains seven values: `country`, `organization`, `forum`, `engagement`, `topic`, `working_group`, `person`. The frontend alert/digest forms do not include `elected_official`.
- No standalone `GenerateDigestButton.tsx` was added in this wave. Plan 70-07 explicitly owns `GenerateDigestButton`, dossier-page route wiring, backend route mounting, and live UAT.
- `read_digests` does not return dossier names or structured item rows. The digest hook enriches dossier names via an RLS-scoped `dossiers` read, and the card/reader components parse JSON summaries when present while falling back to line-based summaries.
- No existing `DossierTypeSelector` component exists in this repo; `AlertRuleForm` uses a token-styled dossier-type select plus the existing filtered `DossierSelector`.
- The Digests hub subscribe button is disabled without a dossier context; dossier-header subscription entry points are owned by Plan 70-07.

## Self-Check: PASSED
