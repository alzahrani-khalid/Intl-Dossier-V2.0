# Requirements: Intl-Dossier v9.0 Platform Completion & Live Verification

**Defined:** 2026-07-06
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Feature Completion (honest-disables → real features)

- [x] **FEAT-01**: User can create a MoU from the MoUs page — a create form/route writing `mous` (`type`, `mou_category`, dates, parties, `lifecycle_state`); the disabled "Add MoU" button (`MousPage.tsx`) becomes live (closes C-3)
- [x] **FEAT-02**: Admin can create a user via a `/users/create` route implemented against the L1-hardened user-management edge functions (closes D-10 create half)
- [x] **FEAT-03**: Admin can open a user detail/management view at `/users/:id` (role, status, profile) from the users list (closes D-10 detail half)
- [x] **FEAT-04**: ConsistencyPanel is either wired to a real consistency-check query with working modify/accept/escalate/view actions, or formally retired (component + i18n keys deleted, decision recorded) — no permanently-dead UI remains (closes E-8)

### Linear Affordances (F23–F26, from DESIGN-REFINEMENT-PLAN-260704 §Phase 6)

- [ ] **AFF-01**: User can open a list row in a right-peek panel with prev/next paging without leaving the list (F23)
- [ ] **AFF-02**: User can use split Filter and Display popovers with live result counts on list pages (F24)
- [x] **AFF-03**: ⌘K command menu passes an audit — every advertised command works, missing high-value commands added, EN+AR (F25)
- [ ] **AFF-04**: Empty states across list pages and dossier tabs are rich (explain the surface + primary action), replacing bare "no data" text (F26)

### Security & Hygiene Tail

- [ ] **SEC-01**: `UserPicker.handleSearch` no longer interpolates user input into PostgREST filter strings — `.ilike()` builder or sanitized `,().` input (closes IN-04 / T-79-S2)
- [ ] **SEC-02**: Credential-hygiene sweep complete — no real secrets in tracked files; `TEST_USER_PASSWORD`-class values rotated or externalized; `.env.test.example` pattern enforced

### CI & Test-Debt Burn-Down

- [ ] **CI-01**: E2E suite green against the deployed app (stale-login/global-setup debt fixed; genuinely-broken specs repaired, not skipped) or explicitly quarantined with a tracked reason per spec
- [ ] **CI-02**: Integration test suite green (including the 2 pre-existing interaction-note backend failures)
- [ ] **CI-03**: a11y suites green — the intake-form `fixme` debt (button-name / aria-prohibited-attr / target-size) fixed and the 8 quarantined a11y specs restored
- [ ] **CI-04**: Visual-regression baselines regenerated post-flatten on the reference machine and the suite green
- [ ] **CI-05**: `test-rtl-smokes` promoted from advisory to a required branch-protection context on `main` (with a smoke-PR BLOCKED proof)

### CORS Edge-Function Migration

- [ ] **CORS-01**: `ALLOWED_ORIGINS` secret verified present and correct in staging + prod before any batch ships
- [ ] **CORS-02**: All ~171 handler-scope edge functions migrated off deprecated wildcard `corsHeaders` (batch A), deployed and smoke-checked
- [ ] **CORS-03**: All ~101 module-scope edge functions (including the 83 local `const corsHeaders = '*'`) migrated (batches B/C), deployed and smoke-checked; repo-wide grep for the deprecated pattern returns 0

### v7.0 Live Verification (deploy-gated closeout)

- [ ] **LIVE-01**: On-prem GPU/TEI stack stood up — vLLM (Gemma-4-12B) + TEI (BGE-M3) serving with health checks, reachable by the agent-runtime
- [ ] **LIVE-02**: EVAL-01/02/03 closed — the v7.0 eval harness runs against live inference and meets its CI thresholds
- [ ] **LIVE-03**: AGENT/INFRA live verification complete — copilot reads/HITL-writes under caller JWT against the live stack, clearance ceiling verified end-to-end

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Intelligence Feed Ingestion

- **FEED-01**: Automated feed ingestion into `intelligence_event` (v7.1)
- **FEED-02**: Quarantine posture for untrusted feed content (v7.1)

### Intelligence UI Gaps

- **GAP-2**: Graph/digest generative card renderers
- **GAP-3**: Retire legacy `dossiers-briefs-generate` path

### Design Ops

- **DESIGNOPS-01**: Figma/token sync tooling
- **DESIGNOPS-02**: Storybook visual diffing

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                                      | Reason                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `EMAIL_WEBHOOK_SECRET` provisioning + `email-inbound` deploy | Ops task requiring provider-side HMAC alignment — user/ops-only, not code       |
| Dossier edit surface (A-1/A-2)                               | Shipped via PRs #77/#78 (2026-06-28) including transactional RPC                |
| MFA secret at-rest encryption (D-19)                         | Shipped via PRs #79/#81 (2026-06-29), live on prod                              |
| Avatars bucket (D-9)                                         | Shipped via PR #74                                                              |
| AA nested-edit persistence (B-18)                            | Trimmed by decision — edit mode not wired anywhere; hardening shipped in PR #75 |
| Mobile native app / OAuth / real-time chat / video           | Standing exclusions from PROJECT.md                                             |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase    | Status   |
| ----------- | -------- | -------- |
| FEAT-01     | Phase 86 | Complete |
| FEAT-02     | Phase 86 | Complete |
| FEAT-03     | Phase 86 | Complete |
| FEAT-04     | Phase 86 | Complete |
| AFF-01      | Phase 87 | Pending  |
| AFF-02      | Phase 87 | Pending  |
| AFF-03      | Phase 87 | Complete |
| AFF-04      | Phase 87 | Pending  |
| SEC-01      | Phase 88 | Pending  |
| SEC-02      | Phase 88 | Pending  |
| CI-01       | Phase 89 | Pending  |
| CI-02       | Phase 89 | Pending  |
| CI-03       | Phase 89 | Pending  |
| CI-04       | Phase 89 | Pending  |
| CI-05       | Phase 89 | Pending  |
| CORS-01     | Phase 90 | Pending  |
| CORS-02     | Phase 90 | Pending  |
| CORS-03     | Phase 90 | Pending  |
| LIVE-01     | Phase 91 | Pending  |
| LIVE-02     | Phase 91 | Pending  |
| LIVE-03     | Phase 91 | Pending  |

**Coverage:**

- v1 requirements: 21 total
- Mapped to phases: 21 ✓
- Unmapped: 0

---

_Requirements defined: 2026-07-06_
_Last updated: 2026-07-06 — roadmap created; all 21 v1 requirements mapped to Phases 86-91_
