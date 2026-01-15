---
tags: [auth]
summary: auth implementation decisions and patterns
relevantTo: [auth]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 2
  referenced: 2
  successfulFeatures: 2
---

# auth

#### [Pattern] Scenario collaborators implemented with role-based access control (owner/editor/viewer) stored in `scenario_collaborators` table with RLS policies restricting read/update/delete by role and user_id. (2026-01-14)

- **Problem solved:** Multiple users need different permission levels on scenarios without building complex authorization service
- **Why this works:** RLS policies at database level enforce permissions regardless of how API is called. Separate collaborators table decouples sharing from core scenario data.
- **Trade-offs:** Extra table join required for every scenario query vs. cleaner separation of concerns and easier permission auditing. RLS adds query overhead but prevents accidental data leaks.

### Used two-tier default layout resolution: organization-specific default > system-wide default, with organization_id retrieved from auth.users raw_user_meta_data (2026-01-15)

- **Context:** Multi-tenant system needed to support organization-specific preview layouts while maintaining system defaults, with user org context stored in JWT metadata
- **Why:** Storing organization context in JWT metadata (raw_user_meta_data) avoids requiring a separate users table join on every preview layout query. Two-tier resolution allows orgs to customize while defaulting to system layouts. This matches typical SaaS patterns
- **Rejected:** Single default (system-only): Loses customization. Query organization from separate table: Adds join overhead on every request. Dynamic resolution at app-level: Moves auth logic to client
- **Trade-offs:** Easier: Org-specific customization without app logic. Harder: Requires JWT metadata to always contain organization_id; cache invalidation when org switches defaults
- **Breaking if changed:** Removing organization_id from JWT metadata will cause org-specific layouts to be ignored and always fall back to system defaults

### RLS policies check user_id against created_by field for ownership, but allow meeting organizer (host_user_id) different permissions than participants (2026-01-15)

- **Context:** Meeting agendas have multiple user roles - creator, organizer, presenter, participant - each needing different access levels
- **Why:** Organizer can modify agenda mid-meeting even if didn't create it; participants can only view if approved; creates clear permission hierarchy
- **Rejected:** Flat ownership model where only creator can edit would prevent organizer control
- **Trade-offs:** More complex RLS policies but aligns with meeting semantics; additional policy rows per entity
- **Breaking if changed:** Frontend assumes organizer (from current session) can always edit; queries filter by host_user_id not created_by
