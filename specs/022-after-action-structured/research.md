# Research & Technology Decisions

**Feature**: After-Action Structured Documentation  
**Date**: 2025-01-14  
**Status**: Complete

## Overview

This document captures research findings and technology decisions for implementing structured after-action documentation with AI extraction and bilingual PDF generation across web and mobile platforms.

## Key Technology Decisions

### 1. AI Extraction Service

**Decision**: Use self-hosted AnythingLLM for meeting minutes extraction

**Rationale**:
- Already integrated in the project stack (CLAUDE.md confirms AnythingLLM usage)
- Self-hosted ensures data privacy for sensitive diplomatic meeting minutes
- Supports both Arabic and English text understanding
- Provides confidence scores for extracted entities
- Can handle synchronous (<5s) and asynchronous (>5s) processing modes

**Alternatives Considered**:
- OpenAI GPT-4: Rejected due to data residency concerns (confidential meeting minutes cannot be sent to external APIs)
- Google Vertex AI: Rejected due to lack of Arabic language optimization and external API dependency
- Custom NLP pipeline: Rejected due to high development cost and lower accuracy compared to LLM-based extraction

**Best Practices**:
- Implement prompt engineering to extract structured data (decisions, commitments, risks) with confidence scores
- Use async processing with polling for documents >500KB or >10 pages
- Cache extraction results in Redis (30-day TTL) to avoid re-processing same documents
- Validate AI outputs with business rules (e.g., due dates must be future dates, commitment owners must exist)
- Allow manual override of all AI-extracted fields before final submission

**Implementation Notes**:
- AnythingLLM API endpoint: Configure in environment variable `ANYTHINGL LM_API_URL`
- Prompt template: Store in `backend/src/services/ai-extraction.service.ts` with version control
- Extraction schema: Define TypeScript interfaces in `backend/src/types/ai-extraction.types.ts`
- Error handling: Retry logic (3 attempts) for transient failures, fallback to manual entry on persistent failures

---

### 2. Bilingual PDF Generation

**Decision**: Use pdfkit (server-side) with custom RTL layout engine for Arabic

**Rationale**:
- pdfkit is lightweight, battle-tested Node.js PDF library with full control over layout
- Supports Unicode fonts required for Arabic rendering
- Allows pixel-perfect control needed for RTL text flow and mirrored layouts
- Server-side generation ensures consistent output across platforms
- No client-side dependencies reduces mobile app bundle size

**Alternatives Considered**:
- react-pdf: Rejected due to limited RTL support and complexity of maintaining separate React components for PDFs
- Puppeteer PDF: Rejected due to high memory usage (Chromium instance) and slower generation times
- LaTeX: Rejected due to complexity and steep learning curve for team unfamiliar with LaTeX

**Best Practices**:
- Use Google Noto Sans Arabic font for proper Arabic glyph rendering
- Implement custom RTL layout manager to handle bidirectional text (mixed English/Arabic)
- Generate both languages in parallel using Promise.all() to reduce total time
- Cache generated PDFs in Supabase Storage with 24-hour signed URLs
- Add watermarks for confidential documents using semi-transparent overlays
- Include metadata footer: generation timestamp, document version, confidentiality level

**Implementation Notes**:
- Font files: Store in `backend/assets/fonts/` (Noto Sans, Noto Sans Arabic)
- Layout engine: Implement in `backend/src/services/pdf-generation.service.ts`
- Template: Use config object for organization branding (logo, colors, header/footer)
- File naming: `AfterAction_{DossierTitle}_{YYYYMMDD}_{EN|AR}.pdf`

---

### 3. Offline-First Mobile Architecture

**Decision**: Use WatermelonDB for local persistence with incremental sync to Supabase

**Rationale**:
- WatermelonDB designed for offline-first React Native apps with SQLite backend
- Supports incremental sync with timestamp-based queries (fetch only updated records)
- Observable queries automatically update UI when data changes (reactive pattern)
- Lazy loading reduces initial load time and memory usage
- Direct integration with Supabase via custom sync adapter

**Alternatives Considered**:
- Redux Persist + AsyncStorage: Rejected due to lack of query capabilities and poor performance with large datasets
- Realm: Rejected due to licensing concerns and MongoDB Atlas dependency
- PouchDB: Rejected due to poor React Native support and IndexedDB limitations on mobile

**Best Practices**:
- Implement sync queue with retry logic (exponential backoff: 1s, 2s, 4s, 8s, 16s)
- Use optimistic UI updates (show changes immediately, roll back on sync failure)
- Batch sync operations to reduce network requests (sync all entities in single API call)
- Implement conflict resolution UI (side-by-side diff with "Keep Local" / "Keep Remote" / "Merge" options)
- Add sync status indicators (Synced, Pending, Failed) with last sync timestamp

**Implementation Notes**:
- Schema: Define in `mobile/src/database/schema/` with @model decorators
- Sync service: Implement in `mobile/src/services/sync.service.ts` with incremental sync logic
- Conflict resolution: Store conflict metadata in separate table for audit trail
- Background sync: Use expo-task-manager for periodic background sync (15-minute intervals)

---

### 4. Form Validation & State Management

**Decision**: Use React Hook Form + Zod for web, React Native Paper + Formik for mobile

**Rationale**:
- React Hook Form: Minimal re-renders, better performance for complex forms (10+ fields)
- Zod: Type-safe schema validation that generates TypeScript types automatically
- Formik: Mature solution for React Native with excellent touch handling
- React Native Paper: Material Design 3 components with built-in validation support

**Alternatives Considered**:
- Formik (web): Rejected due to more re-renders compared to React Hook Form
- Yup validation: Rejected in favor of Zod for better TypeScript integration
- Custom validation: Rejected due to reinventing the wheel and higher bug risk

**Best Practices**:
- Define validation schema once, share between client and server (Zod schema in shared types)
- Implement field-level validation (show errors on blur) + form-level validation (on submit)
- Auto-save drafts every 30 seconds to prevent data loss
- Show unsaved changes warning when navigating away (beforeunload event)
- Disable submit button during validation and API calls to prevent double submissions

**Implementation Notes**:
- Validation schema: `backend/src/types/after-action.types.ts` (shared with frontend via generated types)
- Web form: `frontend/src/components/after-action/AfterActionForm.tsx` with React Hook Form
- Mobile form: `mobile/src/screens/AfterAction/AfterActionCreateScreen.tsx` with Formik
- Auto-save: Use debounced save function (300ms delay) triggered by form field changes

---

### 5. Task Auto-Creation from Commitments

**Decision**: Server-side task creation in Supabase Edge Function triggered by after-action publish

**Rationale**:
- Server-side ensures atomicity (after-action + tasks created in single transaction)
- Edge Functions scale automatically without managing dedicated servers
- Rollback capability if task creation fails (transaction safety)
- Consistent logic regardless of client platform (web, mobile, API)

**Alternatives Considered**:
- Client-side creation: Rejected due to risk of partial failure (after-action created but tasks fail)
- Database triggers: Rejected due to limited error handling and debugging capabilities
- Background job queue: Rejected as overkill for synchronous operation (<2s expected)

**Best Practices**:
- Use Supabase RPC function for atomic multi-row inserts (after_action + N tasks)
- Validate commitment owners exist before creating tasks (foreign key constraint)
- Send notifications asynchronously after task creation (don't block response)
- Log task creation failures with after_action_id for manual recovery
- Return created task IDs in response for client-side cache invalidation

**Implementation Notes**:
- Edge Function: `backend/src/api/after-action/publish.ts`
- Task creation service: `backend/src/services/task-creation.service.ts`
- Notification dispatch: Queue notifications in separate table, process via Edge Function cron job
- Error recovery: Admin dashboard to list failed task creations and retry

---

### 6. Attachment Handling & Virus Scanning

**Decision**: Use Supabase Storage with ClamAV virus scanning via Supabase Edge Function

**Rationale**:
- Supabase Storage provides S3-compatible object storage with RLS policies
- ClamAV open-source antivirus with regularly updated virus definitions
- Scanning via Edge Function allows asynchronous processing without blocking uploads
- Signed URLs (24-hour expiry) provide secure access without exposing storage tokens

**Alternatives Considered**:
- Client-side scanning: Rejected due to security risk (malicious clients can bypass)
- AWS S3 + Lambda: Rejected to avoid vendor lock-in and additional infrastructure
- VirusTotal API: Rejected due to external dependency and rate limits

**Best Practices**:
- Stream large files to avoid memory issues (use multipart upload for files >50MB)
- Set max file size limit at Edge Function level (100MB per file, 10 files per after-action)
- Quarantine infected files in separate bucket with restrictive access
- Notify uploader immediately on infection detection with removal instructions
- Schedule periodic re-scans of old files (weekly) to catch newly-identified threats

**Implementation Notes**:
- ClamAV installation: Run clamd daemon on Supabase infrastructure (Docker container)
- Edge Function: `backend/src/api/attachments/scan.ts` triggered on Storage insert
- Quarantine bucket: `after-action-quarantine` with admin-only access
- Status tracking: `attachments` table with `scan_status` enum (pending, clean, infected, failed)

---

### 7. Edit Approval Workflow

**Decision**: State machine pattern with version snapshots for audit trail

**Rationale**:
- State machine ensures valid transitions (draft → published → edit_pending → published)
- Version snapshots enable rollback and historical comparison
- Approval workflow requires supervisor involvement (compliance requirement)
- Audit trail satisfies 7-year retention policy

**Alternatives Considered**:
- Git-like diff system: Rejected due to complexity and lack of structured field-level diffs
- Event sourcing: Rejected as overkill for simple state transitions
- Optimistic locking only: Rejected due to lack of approval workflow

**Best Practices**:
- Store full record snapshot (not just diffs) for each version to enable rollback
- Implement field-level change detection (highlight changed fields in approval UI)
- Use pessimistic locking during edit (lock record while edit request is pending)
- Send realtime notifications to all active viewers when version changes
- Enforce business rules: only creator can request edit, only supervisor can approve

**Implementation Notes**:
- State machine: Implement in `backend/src/services/after-action-workflow.service.ts`
- Snapshot storage: `version_snapshots` table with JSONB column for full record content
- Diff calculation: Compare current vs. previous snapshot, return field-level changes
- Realtime: Use Supabase Realtime channels for version change notifications

---

### 8. External Contact Management

**Decision**: Separate external_contacts table with email uniqueness constraint

**Rationale**:
- External contacts don't have user accounts, so separate table prevents null foreign keys
- Email uniqueness prevents duplicate contacts and enables contact search
- Cached locally on mobile for offline commitment assignment
- Manual status tracking acknowledges limitation of automated tracking for external users

**Alternatives Considered**:
- Unified users + external_contacts table: Rejected due to schema complexity (many nullable fields)
- Invite external users to create accounts: Rejected due to UX friction and low adoption expected
- No external contact support: Rejected as requirement from spec (User Story 5)

**Best Practices**:
- Validate email format and suggest corrections before creating contact (typo detection)
- Search existing contacts by name/email before allowing new creation (prevent duplicates)
- Track contact creation source (which after-action first mentioned this contact)
- Allow bulk import of external contacts from CSV (for large conferences)
- Respect contact preferences (opt-out of email notifications)

**Implementation Notes**:
- Schema: `external_contacts` table with unique index on email (case-insensitive)
- Search API: Full-text search on name + email using pg_trgm extension
- Email validation: Use regex + DNS MX record check for domain validation
- Notification opt-out: Honor `email_enabled` boolean flag when sending emails

---

## Summary

All technology decisions align with project constitution and existing tech stack. No new dependencies require approval. Implementation can proceed to Phase 1 (Design).

**Total New Dependencies**: None (all chosen technologies already in project stack)

**Estimated Implementation Complexity**: Medium-High
- Backend: 15 Edge Functions + 4 services = ~2500 LOC
- Frontend Web: 9 components + 4 pages + 3 hooks = ~2000 LOC  
- Mobile: 4 screens + 4 components + 2 services + 4 schemas = ~1500 LOC
- Tests: ~1500 LOC
- Database: 8 tables + 1 RLS policy migration

**Risk Mitigation**:
- AI extraction may have lower accuracy for Arabic minutes → Provide manual override for all fields
- PDF RTL layout is complex → Allocate extra time for testing with diverse Arabic content
- Offline sync conflicts may confuse users → Implement clear, user-friendly conflict resolution UI
- Large attachments may cause mobile storage issues → Implement storage quota monitoring and cleanup

**Next Steps**: Proceed to Phase 1 to generate data-model.md and API contracts.
