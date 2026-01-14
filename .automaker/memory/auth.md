---
tags: [auth]
summary: auth implementation decisions and patterns
relevantTo: [auth]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---

# auth

#### [Pattern] Scenario collaborators implemented with role-based access control (owner/editor/viewer) stored in `scenario_collaborators` table with RLS policies restricting read/update/delete by role and user_id. (2026-01-14)

- **Problem solved:** Multiple users need different permission levels on scenarios without building complex authorization service
- **Why this works:** RLS policies at database level enforce permissions regardless of how API is called. Separate collaborators table decouples sharing from core scenario data.
- **Trade-offs:** Extra table join required for every scenario query vs. cleaner separation of concerns and easier permission auditing. RLS adds query overhead but prevents accidental data leaks.
