---
quick_id: 260530-w2
status: complete
completed: 2026-09-12
head_check: re-derived
---

# Wave 2 — completion summary

The nine task headings in `PLAN.md` were re-counted at HEAD. The checks below were re-run on
2026-09-12; counts are repository `git grep` counts unless the check explicitly tests a path.

## Tasks

| task | check run at HEAD | output | verdict |
| --- | --- | --- | --- |
| W2-A1 | `test -d frontend/src/components/after-action` | `after-action-dir=absent` | DONE |
| W2-A2 | `git grep -n 'flex-row-reverse' --` the live after-action form, decision, commitment, risk, and follow-up files | `flex-row-reverse=0` | DONE |
| W2-A3 | `git grep -c 'aria-required' --` the live form/editor/list trio | `AfterActionForm.tsx=1; CommitmentEditor.tsx=7; DecisionList.tsx=3` | DONE |
| W2-A4 | `test -f frontend/src/lib/format-date.ts`; `git grep -l 'import.*formatDayFirst' -- frontend/src`; `git grep -n "'PPP'" --` the four named display files | `format-date=exists; importers=107; named-PPP=0` | DONE |
| W2-B1 | `git grep -n 'rounded-field' -- frontend/src` | `rounded-field=0` | DONE |
| W2-B2 | `git grep -c 'aria-required' -- frontend/src/components/ui/form.tsx`; `git grep -c 'aria-label' -- frontend/src/components/work-creation/DossierPicker.tsx` | `form=1; DossierPicker=2` | DONE |
| W2-B3 | `git grep -n 'hover:shadow-lg' -- frontend/src/pages/dossiers/CreateDossierHub.tsx` | `hover-shadow=0` | DONE |
| W2-B4 | `test -f frontend/src/hooks/useUnsavedChangesGuard.ts`; `git grep -c 'useUnsavedChangesGuard' --` the briefing builder and after-action route | `guard=exists; BriefingBookBuilder=2; after-action route=2` | DONE |
| W2-B5 | `git ls-files frontend/src/components/engagements/EngagementBriefsSection.tsx`; `test -f frontend/src/domains/engagements/hooks/useEngagementBriefs.ts`; `git log --all --oneline --grep='pull request #37'` | `old-file=0; replacement=exists; 931240aac Merge pull request #37 ... fix/engagement-briefs-deploy-manual` (superseding PR #37) | SUPERSEDED |

W2-B5 is not an incomplete deletion: PR #37 rewired engagement briefs, and the planned component is
no longer tracked. The surviving domain hook is therefore the relevant HEAD implementation.
