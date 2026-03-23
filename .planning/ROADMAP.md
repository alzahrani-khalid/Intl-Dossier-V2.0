# Roadmap: Intl-Dossier v2.0 — Production Quality

## Overview

This milestone transforms the existing Intl-Dossier codebase from a working prototype into a production-ready application. The work is dependency-ordered: dead code removal reduces surface area, naming enforcement stabilizes structure, security closes critical gaps for diplomatic data, RTL/responsive passes make the bilingual UI reliable, architecture consolidation enforces the domain repository pattern, and performance optimization operates on the clean result. No new features — only hardening.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Dead Code & Toolchain** - Remove unused code/deps, unify ESLint, add pre-commit hooks
- [ ] **Phase 2: Naming & File Structure** - Enforce consistent naming conventions across monorepo
- [ ] **Phase 3: Security Hardening** - RLS audit, clearance middleware, Helmet/CSP, input validation, org isolation
- [ ] **Phase 4: RTL/LTR Consistency** - Single DirectionProvider, logical properties everywhere, theme switching
- [ ] **Phase 5: Responsive Design** - Full breakpoint audit, touch targets, mobile tables, navigation, forms
- [ ] **Phase 6: Architecture Consolidation** - Domain repositories for all 13 domains, service dedup, shared patterns
- [ ] **Phase 7: Performance Optimization** - Bundle budget, Core Web Vitals, query optimization, re-render elimination

## Phase Details

### Phase 1: Dead Code & Toolchain

**Goal**: Developers work on a clean codebase with automated quality gates preventing new violations
**Depends on**: Nothing (first phase)
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05
**Success Criteria** (what must be TRUE):

1. Knip report shows zero unused files, exports, and dependencies across the monorepo
2. A single ESLint 9 flat config at the root lints both frontend and backend with zero warnings
3. Every git commit automatically runs lint and format checks via husky + lint-staged
4. `pnpm build` succeeds with no unused dependency warnings after cleanup
5. All stack dependencies are at latest stable versions compatible with the toolchain
   **Plans**: 3 plans

Plans:

- [x] 01-01-PLAN.md — Consolidate ESLint/Prettier/Knip configs, delete 13 legacy files, fix ESLint violations
- [x] 01-02-PLAN.md — Run Knip cleanup, remove unused deps/files/exports, audit AI/ML tree, clean i18n keys
- [x] 01-03-PLAN.md — Wire pre-commit hooks (4 checks), update all deps to latest stable, verify build

### Phase 2: Naming & File Structure

**Goal**: Every file, function, component, and service follows one predictable naming convention per layer
**Depends on**: Phase 1
**Requirements**: ARCH-01
**Success Criteria** (what must be TRUE):

1. Backend services use kebab-case filenames exclusively (no PascalCase/camelCase service files remain)
2. Frontend components use PascalCase, hooks use camelCase, and UI primitives use kebab-case consistently
3. No two files in the same directory use different naming conventions for the same concept
   **Plans**: 3 plans

Plans:

- [x] 02-01-PLAN.md — Rename 18 kebab-case hooks to camelCase, rename 12 PascalCase component dirs to kebab-case
- [ ] 02-02-PLAN.md — Move 37 standalone component files into kebab-case subdirectories
- [ ] 02-03-PLAN.md — Rename 21 backend service/model files to kebab-case, add ESLint filename enforcement

### Phase 3: Security Hardening

**Goal**: The application enforces access control, validates all input, and follows OWASP best practices for handling classified diplomatic data
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
**Success Criteria** (what must be TRUE):

1. Every Supabase table has RLS policies verified via authenticated SDK calls (not SQL editor)
2. Clearance middleware enforces real role-based access — unauthorized users get 403 on restricted endpoints
3. Helmet is active with a strict CSP that whitelists only Supabase, Sentry, and AnythingLLM origins
4. Every API endpoint rejects malformed input with a structured validation error
5. Users only see data belonging to their organization — cross-org data is inaccessible
   **Plans**: TBD

Plans:

- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: RTL/LTR Consistency

**Goal**: Arabic and English users experience correct, glitch-free layouts in all theme and direction combinations
**Depends on**: Phase 2
**Requirements**: RTL-01, RTL-02, RTL-03, RTL-04, RTL-05
**Success Criteria** (what must be TRUE):

1. A single DirectionProvider at the document root controls `dir` — no per-component `dir` attributes remain
2. Zero physical CSS properties (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`) exist in the codebase
3. Switching between dark/light and AR/EN produces no visual bugs or layout shifts
4. React Flow graphs, Recharts, DnD-kit, and TanStack Table render correctly in RTL mode
5. Reusable RTL-aware patterns are extracted — no duplicate direction logic across components
   **Plans**: TBD
   **UI hint**: yes

Plans:

- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Responsive Design

**Goal**: Every page is fully usable on mobile, tablet, and desktop with proper touch targets and adaptive layouts
**Depends on**: Phase 4
**Requirements**: RESP-01, RESP-02, RESP-03, RESP-04, RESP-05
**Success Criteria** (what must be TRUE):

1. All pages render correctly at 320px, 640px, 768px, 1024px, and 1280px+ viewports
2. Every interactive element meets the 44x44px minimum touch target size
3. Data tables collapse to card layouts or enable horizontal scroll on viewports under 768px
4. Sidebar navigation collapses to a hamburger/drawer on mobile and tablet viewports
5. Forms and modals are fully usable on mobile — no overflow, proper keyboard handling
   **Plans**: TBD
   **UI hint**: yes

Plans:

- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Architecture Consolidation

**Goal**: All data flows through domain repositories with consistent patterns, eliminating raw API calls and duplicate services
**Depends on**: Phase 2
**Requirements**: ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):

1. Domain repositories exist for all 13+ backend API areas — no hooks call the API directly with raw fetch()
2. Each backend domain has exactly one service file — no PascalCase/kebab-case duplicate pairs remain
3. Shared patterns (CRUD operations, list/detail hooks, error handling) are extracted into reusable utilities across dossier types
   **Plans**: TBD

Plans:

- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Performance Optimization

**Goal**: The application meets production performance budgets with measurable Core Web Vitals compliance
**Depends on**: Phase 1, Phase 6
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):

1. Initial JS bundle is under 200KB gzipped (verified via bundle analyzer)
2. Core Web Vitals pass: LCP < 2.5s, INP < 200ms, CLS < 0.1 with Sentry RUM tracking active
3. No N+1 query patterns remain — slow Supabase queries have proper indexes
4. Key pages (dashboard, dossier list, dossier detail) show no unnecessary re-renders in React DevTools profiler
   **Plans**: TBD

Plans:

- [ ] 07-01: TBD
- [ ] 07-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

Note: Phase 3 (Security) depends only on Phase 1 and can run in parallel with Phase 2. Phase 6 (Architecture) depends only on Phase 2 and can run in parallel with Phases 4-5. In practice, sequential execution is recommended for a solo developer.

| Phase                         | Plans Complete | Status      | Completed |
| ----------------------------- | -------------- | ----------- | --------- |
| 1. Dead Code & Toolchain      | 3/3            | Complete    | -         |
| 2. Naming & File Structure    | 0/3            | Planning    | -         |
| 3. Security Hardening         | 0/3            | Not started | -         |
| 4. RTL/LTR Consistency        | 0/2            | Not started | -         |
| 5. Responsive Design          | 0/3            | Not started | -         |
| 6. Architecture Consolidation | 0/2            | Not started | -         |
| 7. Performance Optimization   | 0/2            | Not started | -         |
