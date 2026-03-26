# Requirements: Intl-Dossier v2.0 — Production Quality

**Defined:** 2026-03-23
**Core Value:** Production-ready codebase — clean, consistent, secure, performant, fully responsive with proper RTL/LTR theming

## v1 Requirements

Requirements for production quality milestone. Each maps to roadmap phases.

### Dead Code & Tooling

- [x] **TOOL-01**: Knip scan removes all unused files, exports, and dependencies across monorepo
- [x] **TOOL-02**: ESLint 9 flat config consolidates root/frontend/backend into single config with workspace overrides
- [x] **TOOL-03**: husky + lint-staged enforces lint/format rules on every commit automatically
- [x] **TOOL-04**: All unused npm dependencies removed (verified by Knip report showing zero unused)
- [x] **TOOL-05**: All stack dependencies updated to latest stable versions compatible with current toolchain

### Security Hardening

- [x] **SEC-01**: Every Supabase table has RLS policies verified via live audit (not SQL editor which bypasses RLS)
- [x] **SEC-02**: Clearance middleware replaced from placeholder stub to real role-based access control
- [x] **SEC-03**: Helmet configured with strict Content Security Policy headers appropriate for the app
- [x] **SEC-04**: All API endpoints validate and sanitize input (express-validator on every route)
- [x] **SEC-05**: Organization isolation implemented (users only see data for their org)
- [x] **SEC-06**: Auth edge cases handled (expired tokens, concurrent sessions, password reset flows)

### RTL/LTR Theming

- [x] **RTL-01**: Single DirectionProvider at document root replaces all per-component `dir={isRTL}` scattered across codebase
- [x] **RTL-02**: Zero physical CSS properties remain — all `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right` replaced with logical equivalents
- [x] **RTL-03**: Theme switching (dark/light/system + AR/EN language) works without visual bugs or layout shifts
- [x] **RTL-04**: Third-party components (React Flow, Recharts, DnD-kit, TanStack Table) render correctly in RTL mode
- [x] **RTL-05**: Reusable RTL-aware component patterns extracted (no duplicate RTL logic across components)

### Responsive Design

- [x] **RESP-01**: All pages tested and fixed across 5 breakpoints (320px, 640px, 768px, 1024px, 1280px+)
- [x] **RESP-02**: All interactive elements meet 44x44px minimum touch target size
- [x] **RESP-03**: Data tables collapse to cards or horizontal scroll on mobile viewports
- [x] **RESP-04**: Navigation (sidebar + header) adapts properly for mobile and tablet with proper hamburger/drawer pattern
- [x] **RESP-05**: Forms and modals are fully usable on mobile (no overflow, proper keyboard handling)

### Performance

- [ ] **PERF-01**: Initial JS bundle under 200KB gzipped (measured via bundle analyzer)
- [ ] **PERF-02**: Core Web Vitals pass: LCP <2.5s, INP <200ms, CLS <0.1 with Sentry RUM tracking enabled
- [x] **PERF-03**: Slow Supabase queries identified and optimized (proper indexes, no N+1 patterns)
- [x] **PERF-04**: Unnecessary React re-renders eliminated (verified via React DevTools profiler on key pages)

### Architecture Consolidation

- [x] **ARCH-01**: Consistent naming conventions enforced across monorepo (files, functions, components, services)
- [x] **ARCH-02**: Frontend domain repositories created for all 13+ domains (hooks use repo layer, not direct API calls)
- [x] **ARCH-03**: Backend duplicate services consolidated (single service per domain, no PascalCase/kebab-case variants)
- [x] **ARCH-04**: Shared patterns extracted into reusable components and hooks (DRY across dossier types)

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Accessibility

- **A11Y-01**: WCAG 2.2 AA compliance audit across all pages
- **A11Y-02**: Focus management on route changes (SPA-specific)
- **A11Y-03**: Arabic screen reader testing with NVDA/VoiceOver
- **A11Y-04**: Keyboard navigation works for all interactive elements

### CI/CD Enforcement

- **CI-01**: GitHub Actions pipeline runs lint, typecheck, test on every PR
- **CI-02**: Bundle size check fails PR if budget exceeded
- **CI-03**: Lighthouse CI runs on staging deploys

## Out of Scope

| Feature                       | Reason                                                           |
| ----------------------------- | ---------------------------------------------------------------- |
| New dossier types or features | Quality first, features later — this milestone is hardening only |
| Mobile native app             | Cancelled (code preserved in git history)                        |
| Notification system           | Feature work, not hardening                                      |
| Duplicate detection           | Feature work, not hardening                                      |
| OAuth/social login            | Email/password sufficient for current phase                      |
| Real-time chat                | High complexity, not core to dossier management                  |
| Database schema changes       | Focus is code quality, not data model changes                    |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| TOOL-01     | Phase 1 | Complete |
| TOOL-02     | Phase 1 | Complete |
| TOOL-03     | Phase 1 | Complete |
| TOOL-04     | Phase 1 | Complete |
| TOOL-05     | Phase 1 | Complete |
| SEC-01      | Phase 3 | Complete |
| SEC-02      | Phase 3 | Complete |
| SEC-03      | Phase 3 | Complete |
| SEC-04      | Phase 3 | Complete |
| SEC-05      | Phase 3 | Complete |
| SEC-06      | Phase 3 | Complete |
| RTL-01      | Phase 4 | Complete |
| RTL-02      | Phase 4 | Complete |
| RTL-03      | Phase 4 | Complete |
| RTL-04      | Phase 4 | Complete |
| RTL-05      | Phase 4 | Complete |
| RESP-01     | Phase 5 | Complete |
| RESP-02     | Phase 5 | Complete |
| RESP-03     | Phase 5 | Complete |
| RESP-04     | Phase 5 | Complete |
| RESP-05     | Phase 5 | Complete |
| PERF-01     | Phase 7 | Pending |
| PERF-02     | Phase 7 | Pending |
| PERF-03     | Phase 7 | Complete |
| PERF-04     | Phase 7 | Complete |
| ARCH-01     | Phase 2 | Complete |
| ARCH-02     | Phase 6 | Complete |
| ARCH-03     | Phase 6 | Complete |
| ARCH-04     | Phase 6 | Complete |

**Coverage:**

- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---

_Requirements defined: 2026-03-23_
_Last updated: 2026-03-23 after roadmap creation_
