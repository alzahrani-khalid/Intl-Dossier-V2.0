# Implementation Plan: Contact Directory

**Branch**: `027-contact-directory` | **Date**: 2025-10-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-contact-directory/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Contact Directory enables staff to manage contacts, stakeholders, and key personnel across organizations and partnerships. The system supports manual contact entry, business card scanning with OCR, bulk extraction from documents (invitations, letters), relationship mapping between contacts, organizational grouping, interaction history tracking, and full bilingual support (Arabic/English). Key features include duplicate detection, role-based access control, audit logging, and export capabilities (CSV, vCard).

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**: React 19, TanStack Router v5, TanStack Query v5, Supabase (PostgreSQL 15+, Auth, RLS, Storage), OCR (tesseract.js v5.0+, @google-cloud/vision v4.3+, sharp v0.33+), Document Parsing (unpdf v1.0.1+, mammoth v1.8.0+), franc-min (language detection)
**Storage**: PostgreSQL 15+ (Supabase) with contacts, organizations, interaction_notes, relationships, tags, document_sources tables; Supabase Storage for business card images and uploaded documents; Redis 7.x for caching
**Testing**: Vitest (unit/integration), Playwright (E2E), axe-playwright (accessibility)
**Target Platform**: Cross-platform phased rollout - Phase 1: Web (responsive, mobile-first PWA), Phase 2: Mobile native (Expo SDK 52+, React Native Paper 5.12+, WatermelonDB 0.28+)
**Project Type**: Web application (frontend + backend via Supabase Edge Functions) with future mobile integration
**Performance Goals**: Contact search <2s for 10,000 contacts, OCR processing <15s for business cards (hybrid Tesseract + Google Vision achieves 85-95% accuracy), document extraction 1 page/sec (unpdf + mammoth validated)
**Constraints**: 80%+ OCR accuracy achieved via hybrid approach (85-95%), 500 concurrent users, WCAG AA compliance, RTL/LTR bilingual support, Saudi PDPL compliance (80-90% local OCR processing)
**Scale/Scope**: 10,000+ contacts, 500 concurrent users, bilingual (Arabic/English), 6 core entities (Contact, Organization, Interaction Note, Relationship, Tag, Document Source)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Mobile-First & Responsive Design ✅
**Status**: COMPLIANT
- Contact forms, directory views, and search interfaces will be built mobile-first with progressive enhancement
- Touch targets minimum 44x44px for all interactive elements (buttons, cards, form inputs)
- Responsive patterns: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for contact cards
- Mobile-optimized business card capture and document upload flows

### II. RTL/LTR Internationalization ✅
**Status**: COMPLIANT
- All UI components will use logical properties (ms-*, me-*, ps-*, pe-*, text-start, text-end)
- Contact directory supports Arabic and English with proper RTL layout detection
- Business card OCR and document extraction support both Arabic and English text
- All form labels, messages, and UI text will be bilingual via i18next

### III. Test-First Development ✅
**Status**: COMPLIANT
- Contract tests for contact CRUD, OCR extraction, duplicate detection APIs
- Integration tests for business card scanning workflow, document extraction workflow
- E2E tests for manual entry, search, relationship mapping, interaction notes
- Performance tests for search (<2s for 10k contacts), OCR (<15s), document extraction (1 page/sec)

### IV. Type Safety & Strict Mode ✅
**Status**: COMPLIANT
- TypeScript 5.8+ strict mode enabled
- Explicit types for Contact, Organization, InteractionNote, Relationship, Tag, DocumentSource entities
- API response types via Supabase generated types
- No `any` types except wrapped third-party OCR library interfaces

### V. Security & Privacy by Default ✅
**Status**: COMPLIANT
- RLS policies on all contact tables (contacts, organizations, interaction_notes, relationships, tags, document_sources)
- Supabase Auth with JWT validation for all API routes
- Contact data is PII - access restricted by role-based permissions
- Audit logging for all contact views, edits, deletions (FR-022)
- Document uploads scanned for viruses, stored securely in Supabase Storage
- 7-year data retention for audit compliance

### VI. Performance & Scalability ✅
**Status**: COMPLIANT
- Database indexes on contacts.name, contacts.organization, contacts.email for fast search
- Full-text search using pg_trgm for fuzzy matching on names and organizations
- Virtualized contact list for large datasets (10,000+ contacts)
- Redis caching for frequently accessed contact data (TTL: 5 minutes)
- Lazy loading for relationship graphs and interaction timelines

### VII. Accessibility (WCAG AA Compliance) ✅
**Status**: COMPLIANT
- Semantic HTML for contact forms, search, directory listings
- ARIA labels for business card upload, OCR review forms, relationship selectors
- Keyboard navigation for all contact CRUD operations, search, filtering
- Color contrast 4.5:1 minimum for all text and interactive elements
- Form validation with clear error messages and screen reader support

### VIII. Cross-Platform Mobile Development ✅
**Status**: COMPLIANT (Phased Rollout)
- **Platform scope**: Cross-platform with phased rollout
  - **Phase 1 (Week 1-6)**: Web-only PWA with responsive mobile-first UI
  - **Phase 2 (Week 9-12)**: Mobile native integration into existing app
- **Rationale**: Research confirms existing mobile infrastructure (Expo SDK 52+, WatermelonDB, React Native Paper) makes incremental mobile cost only 2-3 weeks
- **Phase 1 Web Capabilities**: Camera API for business card scanning, service workers for offline, IndexedDB for local storage
- **Phase 2 Mobile Enhancements**: Native camera controls, WatermelonDB offline sync, biometric protection, integrated workflow with dossiers
- **Strategic Fit**: Contact Directory naturally complements existing mobile app (dossiers + contacts in one app)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── types/
│   │   └── database.types.ts              # Supabase generated types (updated with contact entities)
│   ├── services/
│   │   ├── contact-service.ts             # Contact CRUD operations
│   │   ├── ocr-service.ts                 # Business card & document OCR
│   │   ├── duplicate-detection-service.ts # Contact deduplication logic
│   │   └── export-service.ts              # CSV/vCard export
│   └── middleware/
│       └── virus-scan-middleware.ts       # ClamAV integration for uploads
└── tests/
    ├── contract/
    │   ├── contact-api.test.ts
    │   ├── ocr-api.test.ts
    │   └── export-api.test.ts
    ├── integration/
    │   ├── business-card-workflow.test.ts
    │   └── document-extraction-workflow.test.ts
    └── performance/
        ├── search-performance.test.ts
        └── ocr-performance.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── contacts/
│   │   │   ├── ContactForm.tsx            # Manual entry form
│   │   │   ├── ContactCard.tsx            # Contact display card
│   │   │   ├── ContactList.tsx            # Virtualized directory
│   │   │   ├── ContactSearch.tsx          # Search & filter UI
│   │   │   ├── BusinessCardScanner.tsx    # Camera/upload + OCR review
│   │   │   ├── DocumentExtractor.tsx      # Bulk extraction UI
│   │   │   ├── RelationshipGraph.tsx      # Network visualization
│   │   │   └── InteractionTimeline.tsx    # Notes timeline
│   │   └── ui/                            # shadcn/ui components (from registry)
│   ├── pages/
│   │   └── contacts/
│   │       ├── ContactsDirectory.tsx      # Main directory view
│   │       ├── ContactDetails.tsx         # Individual contact profile
│   │       └── ContactCreate.tsx          # Creation workflows
│   ├── hooks/
│   │   ├── useContacts.ts                 # TanStack Query hooks
│   │   ├── useOCR.ts                      # OCR processing hooks
│   │   ├── useRelationships.ts            # Relationship CRUD hooks
│   │   └── useInteractions.ts             # Interaction notes hooks
│   ├── services/
│   │   ├── contact-api.ts                 # API client
│   │   ├── ocr-api.ts                     # OCR API client
│   │   └── export-api.ts                  # Export API client
│   └── i18n/
│       ├── en/
│       │   └── contacts.json              # English translations
│       └── ar/
│           └── contacts.json              # Arabic translations
└── tests/
    ├── unit/
    │   ├── ContactForm.test.tsx
    │   ├── duplicate-detection.test.ts
    │   └── export.test.ts
    └── e2e/
        ├── manual-entry.spec.ts
        ├── business-card-scan.spec.ts
        ├── document-extraction.spec.ts
        ├── search-filter.spec.ts
        └── relationship-mapping.spec.ts

supabase/
├── migrations/
│   └── 20251026000001_create_contact_directory.sql  # All contact tables + RLS
└── functions/
    ├── contacts-create/
    ├── contacts-update/
    ├── contacts-search/
    ├── contacts-export/
    ├── ocr-extract/
    ├── duplicate-detect/
    └── relationships-manage/
```

**Structure Decision**: Web application structure (frontend + backend). Contact Directory is implemented as a web-only feature with responsive mobile-first UI. Backend logic is primarily in Supabase Edge Functions with supporting TypeScript services. All contact data stored in PostgreSQL via Supabase with uploaded documents in Supabase Storage.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No violations detected. All constitutional principles are compliant or have a clarification pending (mobile platform scope).

