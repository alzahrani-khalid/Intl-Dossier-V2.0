---
tags: [security]
summary: security implementation decisions and patterns
relevantTo: [security]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 1
  referenced: 1
  successfulFeatures: 1
---

# security

#### [Pattern] Row Level Security (RLS) enabled on event tables: authenticated users can SELECT any events, but writes go through SECURITY DEFINER functions (2026-01-13)

- **Problem solved:** Event log contains sensitive information (who accessed what, when, payload details) but also audit trail needed for compliance
- **Why this works:** SECURITY DEFINER functions (append_event, create_snapshot) run as superuser, so INSERT/UPDATE permissions bypass RLS. This enforces: (1) only server-side logic can write events, (2) clients cannot inject events directly (even if they compromise JWT), (3) event structure validated in function before write. SELECT \* FROM events works for authenticated users (audit right), but they cannot fake events - attempting INSERT as client fails even with valid JWT
- **Trade-offs:** Requires SECURITY DEFINER wrapping all writes (more boilerplate), but: clients cannot forge events even if they compromise session, audit trail is tamper-proof, easier to add write restrictions (just change one function, not multiple policies)

#### [Pattern] Implemented dual-layer access verification: RLS policies at database + membership validation at application layer (2026-01-13)

- **Problem solved:** Tenant isolation requires defense-in-depth to prevent both accidental data leakage and exploitation of application bugs
- **Why this works:** RLS alone depends on correct context setting (middleware). Application layer check catches tenant context corruption or bypass. Membership verification before RLS reduces unnecessary database work
- **Trade-offs:** Gained: defense-in-depth security. Lost: redundant checks add latency and complexity

### RLS policies check both (user_id = auth.uid()) AND share table existence for read access, making shares a required authorization path (2026-01-13)

- **Context:** Needed to prevent users from seeing other users' saved searches unless explicitly shared
- **Why:** Two-layer check (ownership OR valid share) prevents both unauthorized access and orphaned share records from granting access. Makes sharing the primary authorization mechanism for non-owners
- **Rejected:** Single ownership check - would make sharing just for metadata, not actual access control; OR-only logic - would allow accessing searches through other means
- **Trade-offs:** Slightly stricter access model (can't share without valid share record) but clearer intent and audit trail
- **Breaking if changed:** Removing the share table requirement would turn sharing into documentation-only feature, losing access control guarantees

#### [Pattern] RLS policies on field_history table restrict access to entity creator/owner (2026-01-13)

- **Problem solved:** Field history contains sensitive audit data and change tracking - must prevent unauthorized access
- **Why this works:** Database-level security (RLS) cannot be bypassed by application code bugs. Enforces access control at storage layer where it matters most
- **Trade-offs:** Requires understanding RLS mechanics and PostgreSQL policy syntax, but gains non-bypassable security

#### [Pattern] RLS policies enforce organization-level access (user can only see meetings/attendees/action items in their organization) using auth.uid() and join to org table (2026-01-13)

- **Problem solved:** Multi-tenant system where data must be isolated by organization - users shouldn't see other org's meetings
- **Why this works:** RLS at row level is more secure than application-level filtering. Database can't accidentally expose data if app logic has bug. Single source of truth for access control
- **Trade-offs:** RLS policies are harder to test and debug. Query performance slightly slower due to extra JOIN conditions. Security guarantee worth the cost

### Storing generated_by: user.id in report records instead of relying on RLS policies alone for ownership tracking (2026-01-14)

- **Context:** Stakeholder analysis reports need to track which user created them for audit and permission verification
- **Why:** Provides explicit audit trail independent of RLS evaluation; enables admin queries for finding reports by creator without RLS context; redundancy ensures ownership remains queryable if RLS policies change
- **Rejected:** Relying solely on RLS policies with no generated_by field
- **Trade-offs:** Slight denormalization and storage overhead; clearer audit trail and ownership semantics; decouples access control from data provenance
- **Breaking if changed:** Removing generated_by field removes explicit owner tracking but RLS still enforces access; losing user.id context makes audit logs incomplete

### Store form data in client-side IndexedDB without encryption, with automatic 7-day expiration (2026-01-14)

- **Context:** Drafts are temporary, user-owned data that should not persist indefinitely
- **Why:** Client-side storage acceptable for temporary session data; 7-day TTL prevents accumulation of stale drafts that consume space and could contain outdated info. Encryption would add complexity for minimal gain (user controls device security)
- **Rejected:** Indefinite storage (data bloat, privacy risk if device compromised), server-side draft storage (unnecessary complexity for temporary data)
- **Trade-offs:** 7-day TTL means very old drafts are lost (acceptable - user should complete form) but prevents accidental recovery of truly old data
- **Breaking if changed:** Removing TTL causes storage bloat and privacy issues; extending beyond 30 days violates GDPR data minimization; moving to backend requires authentication/ownership validation

#### [Gotcha] RLS policies must explicitly allow users to see granted permissions even if not in granted_to list - requires OR condition with foreign key join (2026-01-14)

- **Situation:** User A requests permission from User B. Query needs: can see own requests OR can see requests where granted_to includes their role. Initial attempt only checked granted_to.
- **Root cause:** Without OR condition, users can't see what permissions they have access to - only what they directly granted. The granted_to is populated on approval, so users need visibility of the chain that led to their access.
- **How to avoid:** Easier: explicit access control shows full permission chain. Harder: more complex RLS policy with OR and JOIN, harder to audit all access paths
