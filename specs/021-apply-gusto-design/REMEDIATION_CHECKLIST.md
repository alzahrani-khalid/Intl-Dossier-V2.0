# Remediation Checklist for Feature 021-apply-gusto-design

**Date**: 2025-10-13
**Analysis Report**: See `/speckit.analyze` output
**Status**: ACTION REQUIRED - 13 findings identified (2 CRITICAL, 4 HIGH, 4 MEDIUM, 3 LOW)

---

## Executive Summary

The specification analysis identified **2 CRITICAL issues** that must be resolved before `/speckit.implement`:

1. **Test-First Principle Violation (C1)** - Constitution requires tests before implementation, but tasks.md has all tests at the end
2. **Missing Route Implementation (C2)** - Spec claims "full web route parity" (33 routes) but only ~20 routes have tasks

Additionally, 4 HIGH priority issues need resolution to prevent scope confusion and enable proper validation.

---

## 🔴 CRITICAL PRIORITY (Must Fix Before Implementation)

### ✅ C1: Fix Test-First Violation

**Status**: ✅ **COMPLETED**
**File**: `specs/021-apply-gusto-design/tasks-test-first.md` (NEW)
**Action**: A complete restructured tasks.md has been created with test-first phases

**What was done**:
- Created new file: `tasks-test-first.md` (255 tasks = 173 original + 82 new test tasks)
- Each user story split into sub-phases: XA (tests first), XB (implementation)
- Added verification steps (T0XXA tasks) to ensure tests fail before and pass after implementation
- Preserved all 173 original implementation tasks with updated phase numbers

**Next Steps**:
1. Review `tasks-test-first.md` structure
2. **Decision**: Replace `tasks.md` with `tasks-test-first.md` OR adjust incrementally
3. Update constitution compliance check in `plan.md` to reference test-first task structure

---

### ⚠️ C2: Resolve Missing Routes and Update Scope Claims

**Status**: ⏳ PENDING
**Impact**: 6 screen routes (Events, Engagements, Data Library, Reports, Admin, User Management) have requirements but no tasks

**Files to Edit**:

#### 1. `spec.md`

**Edit 1.1** - Update title (Line 1):
```diff
- # Feature Specification: Apply Gusto Design System to Mobile App with Full Web Route Parity
+ # Feature Specification: Apply Gusto Design System to Mobile App
```

**Edit 1.2** - Add scope clarification (after Line 7):
```diff
  **Input**: User description: "Apply Gusto design system..."

+ **Scope Note**: This feature implements 20 core mobile routes covering primary user workflows. Additional routes (Events, Engagements, Data Library, Reports, Admin Portal, User Management) are deferred to future phases - see "Out of Scope" section.
```

**Edit 1.3** - Expand Out of Scope section (Line 444, add at beginning):
```markdown
## Out of Scope

- **Events route (FR-025)** - Standalone events list/detail (distinct from calendar entries) - future phase
- **Engagements route (FR-026)** - Engagement management with after-action reviews - future phase
- **Data Library route (FR-029)** - Document repository management - future phase (basic document viewing covered in dossier details)
- **Reports route (FR-030)** - Report generation and viewing - future phase
- **Admin Portal route (FR-032)** - Full admin approval queue interface - future phase (basic admin functions in web only)
- **User Management route (FR-033)** - Comprehensive user administration - future phase (basic profile management covered in Profile tab)
```

#### 2. `plan.md`

**Edit 2.1** - Update summary (Line 12):
```diff
- ...and ensures full route parity with the web application (33 routes total).
+ ...and delivers 20 core mobile routes covering primary user workflows (dossiers, assignments, calendar, search, profile, intake, countries/organizations/forums, positions/MOUs, intelligence/monitoring).
```

**Edit 2.2** - Update scale/scope (Line 63):
```diff
- - 33 mobile routes (full web parity)
+ - 20 core mobile routes (primary workflows, additional 13 routes deferred to future phases)
```

#### 3. `tasks.md` OR `tasks-test-first.md`

**Edit 3.1** - Update summary (Line 519 in original tasks.md, Line 524 in tasks-test-first.md):
```diff
  **Suggested MVP Scope**: Phases 1-5 (User Stories 1-3) = 64 tasks
- **Full Feature Scope**: All phases = 173 tasks
+ **Full Feature Scope (20 core routes)**: All phases = 173 tasks
+ **Future Enhancement**: Additional 6 routes (Events, Engagements, Data Library, Reports, Admin, User Management) - estimated +50 tasks
```

---

## 🟡 HIGH PRIORITY (Fix Before Implementation)

### H1: Scope Mismatch (Title vs Implementation)

**Status**: ✅ COVERED BY C2 (see above)

---

### H2: OCR Scope Conflict

**Status**: ⏳ PENDING
**Impact**: Spec FR-034 includes OCR as requirement, plan.md marks it "future" - conflicting scope

**Files to Edit**:

#### 1. `spec.md`

**Edit 1** - Update Native Features section (Line 250-252):
```diff
- - **Camera**: Document scanning with auto-crop and perspective correction for uploading attachments to dossiers and intake tickets. OCR text extraction from scanned documents (Arabic and English). Photo capture for profile avatar.
+ - **Camera**: Document scanning with auto-crop and perspective correction for uploading attachments to dossiers and intake tickets. Photo capture for profile avatar. *(Note: OCR text extraction from scanned documents (Arabic and English) is planned for future enhancement - current MVP focuses on image capture and upload only)*
```

**Edit 2** - Add to Out of Scope section (Line 444, after the 6 routes):
```markdown
- OCR text extraction from camera-captured documents - future enhancement (manual text entry available as workaround)
```

#### 2. `plan.md`

**Edit** - Update Camera section (Line 398-400):
```diff
- - **Camera** (document scanning with OCR):
-   - **Document scanning**: ...Captured image processed with OCR to extract text (Arabic and English). User reviews extracted text, edits if needed, then uploads both image and text...
+ - **Camera** (document scanning):
+   - **Document scanning**: When uploading attachment to dossier or intake ticket, user can tap "Scan Document" to launch camera with auto-crop and perspective correction for clean image capture. Image is uploaded to server as attachment.
+   - **Future enhancement**: OCR text extraction (Arabic and English) using Tesseract.js or cloud OCR service (Google Cloud Vision API, Azure Computer Vision) will be added in subsequent phase to enable searchable document text.
```

---

### H3: Untestable Success Criteria

**Status**: ⏳ PENDING
**Impact**: SC-010 and SC-020 use qualitative terms without measurement methodology

**File to Edit**: `spec.md`

**Edit 1** - Update SC-010 (Line 405):
```diff
- - **SC-010**: 90% of users successfully complete primary task (view dossier, update assignment, check calendar) on first attempt without assistance
+ - **SC-010**: 90% of users successfully complete primary task (view dossier, update assignment, check calendar) on first attempt without assistance, measured via moderated usability testing with 10 participants (5 Arabic-speaking, 5 English-speaking) completing predefined task scenarios, with success defined as completing task within 2x optimal time without requesting help or making critical errors
```

**Edit 2** - Update SC-020 (Line 415):
```diff
- - **SC-020**: User satisfaction score >80% for mobile app usability and design consistency
+ - **SC-020**: User satisfaction score >80% for mobile app usability and design consistency, measured via System Usability Scale (SUS) survey administered to n≥30 representative users (covering all user roles: general users, analysts, intake officers, admins) after 2 weeks of regular app usage, with scores normalized to 0-100 scale where 80+ indicates "excellent" usability
```

---

### H4: Platform Scope Confusion

**Status**: ✅ COVERED BY C2 (title update removes "web route parity" claim)

---

## 🟠 MEDIUM PRIORITY (Improve Before Implementation)

### M1: Conflict Resolution UI Underspecified

**Status**: ⏳ PENDING
**Impact**: FR-078 mentions "view side-by-side" but no UI specification

**File to Edit**: `spec.md`

**Edit** - Expand FR-078 (Line 374):
```diff
- - **FR-078**: System MUST detect sync conflicts when same record modified on web and mobile and prompt user to resolve with 3 options: keep mobile, use web, or view side-by-side comparison
+ - **FR-078**: System MUST detect sync conflicts when same record modified on web and mobile and prompt user to resolve with 3 options displayed in bottom sheet modal:
+   1. "Keep mobile changes" - Apply local modifications, discard server version
+   2. "Use web version" - Discard local modifications, accept server version
+   3. "View side-by-side" - Show field-level diff table with columns: Field Name, Mobile Value (left, blue highlight), Web Value (right, green highlight), radio button per field to select version, preview panel showing merged result, "Apply Selection" button
```

---

### M2: TTL Duration Missing from Requirement

**Status**: ⏳ PENDING
**Impact**: FR-059 mentions TTL but doesn't specify duration (plan has 90 days)

**File to Edit**: `spec.md`

**Edit** - Update FR-059 (Line 345):
```diff
- - **FR-059**: System MUST cache API responses in WatermelonDB for offline access with TTL-based invalidation
+ - **FR-059**: System MUST cache API responses in WatermelonDB for offline access with 90-day TTL-based invalidation (records older than 90 days purged automatically on app foreground)
```

---

### M3: Entity Count Unclear

**Status**: ⏳ PENDING
**Impact**: Spec says "11 key entities" but plan mentions "11 entities + 4 junction tables" - ambiguous

**File to Edit**: `spec.md`

**Edit** - Update Key Entities section (Line 377, add note at beginning):
```markdown
### Key Entities

**Data Model**: 11 primary entities + 4 junction tables for many-to-many relationships (see plan.md and data-model.md for full WatermelonDB schema)

- **User Profile**: ...
```

---

### M4: Typography Unit Ambiguity

**Status**: ⏳ PENDING
**Impact**: FR-003 uses "pt" but React Native Paper uses "sp" (scaled pixels)

**File to Edit**: `spec.md`

**Edit** - Update FR-003 (Line 272):
```diff
- - **FR-003**: System MUST implement Material Design 3 typography scale: displayLarge (32pt/700 weight) for screen titles, titleLarge (22pt/600) for card titles, titleMedium (18pt/500) for section headers, bodyLarge (16pt/400) for main content, bodyMedium (15pt/400) for secondary text, bodySmall (13pt/400) for captions, labelLarge (16pt/600) for buttons
+ - **FR-003**: System MUST implement Material Design 3 typography scale: displayLarge (32sp/700 weight) for screen titles, titleLarge (22sp/600) for card titles, titleMedium (18sp/500) for section headers, bodyLarge (16sp/400) for main content, bodyMedium (15sp/400) for secondary text, bodySmall (13sp/400) for captions, labelLarge (16sp/600) for buttons *(Note: "sp" refers to scaled pixels in React Native, equivalent to "pt" in design specs, supporting accessibility scaling)*
```

---

## 🟢 LOW PRIORITY (Optional Improvements)

### L1, L2, L3: Subjective Terms

**Status**: ⏳ OPTIONAL
**Impact**: Minor style improvements, can be addressed during implementation or ignored

**File to Edit**: `spec.md` (if desired)

**L1** - FR-001 (Line 269):
```diff
- - **FR-001**: ...subtle elevation (2-4dp shadow)...
+ - **FR-001**: ...Material Design elevation level 2-4 (2-4dp shadow)...
```

**L2** - FR-005 (Line 274):
```diff
- - **FR-005**: ...generous vertical spacing (24px between elements)...
+ - **FR-005**: ...ample 24px vertical spacing between elements...
```

**L3** - Assumption #14 (Line 432):
```diff
- 14. **Animation Performance**: ...mid-range devices (iPhone 11, Samsung Galaxy S10 equivalent)
+ 14. **Animation Performance**: ...mid-range devices (iPhone 11, Samsung Galaxy S10, Google Pixel 4, or devices with Snapdragon 855+ and 6GB+ RAM)
```

---

## 📋 Implementation Checklist

### Step 1: Critical Fixes (REQUIRED)

- [ ] **C1**: Review `tasks-test-first.md` - Decide if replacing `tasks.md` or adjusting incrementally
- [ ] **C1**: Update `plan.md` constitution compliance section to reference test-first task structure
- [ ] **C2**: Apply all spec.md edits (title, scope note, out of scope section)
- [ ] **C2**: Apply all plan.md edits (summary, scale/scope)
- [ ] **C2**: Apply tasks.md summary edit (future enhancement note)

### Step 2: High Priority Fixes (RECOMMENDED)

- [ ] **H2**: Apply spec.md OCR edits (Native Features section, Out of Scope)
- [ ] **H2**: Apply plan.md OCR edit (Camera section)
- [ ] **H3**: Apply spec.md success criteria edits (SC-010, SC-020)

### Step 3: Medium Priority Fixes (IMPROVE QUALITY)

- [ ] **M1**: Apply spec.md FR-078 expansion (conflict resolution UI detail)
- [ ] **M2**: Apply spec.md FR-059 edit (90-day TTL specification)
- [ ] **M3**: Apply spec.md Key Entities note (11 primary + 4 junction tables)
- [ ] **M4**: Apply spec.md FR-003 edit (pt → sp clarification)

### Step 4: Low Priority Fixes (OPTIONAL)

- [ ] **L1, L2, L3**: Apply spec.md style improvements if desired

### Step 5: Validation

- [ ] Run `/speckit.analyze` again to verify all CRITICAL and HIGH issues resolved
- [ ] Confirm test-first structure aligns with Constitution Principle III
- [ ] Verify scope claims (20 routes) match actual implementation (tasks coverage)
- [ ] Review with team before proceeding to `/speckit.implement`

---

## Files to Modify Summary

| File | Edits | Priority | Estimated Time |
|------|-------|----------|----------------|
| `spec.md` | 12 edits | CRITICAL + HIGH + MEDIUM | 30-45 min |
| `plan.md` | 3 edits | CRITICAL + HIGH | 10-15 min |
| `tasks.md` OR `tasks-test-first.md` | 1 edit + decision | CRITICAL | 5 min decision + 2-3 hours if restructuring |

**Total Estimated Time**:
- Critical + High only: ~45-60 minutes
- Critical + High + Medium: ~60-90 minutes
- Full remediation (including test-first restructuring): ~3-4 hours

---

## Decision Points

### Decision 1: Test-First Restructuring Approach

**Option A** (Recommended): Replace `tasks.md` with `tasks-test-first.md`
- ✅ Full constitution compliance immediately
- ✅ Clear test-first workflow for all user stories
- ⚠️ Requires team to adopt new task structure (255 tasks vs 173)

**Option B**: Keep original `tasks.md`, add test tasks incrementally
- ✅ Less disruptive to current workflow
- ⚠️ Violates constitution until all test tasks added
- ⚠️ Risk of forgetting tests for some user stories

**Recommendation**: Choose Option A - Constitution compliance is non-negotiable, and test-first structure prevents regression bugs.

---

### Decision 2: Scope Reduction Communication

**Question**: Should we formally notify stakeholders that 6 routes (Events, Engagements, Data Library, Reports, Admin, User Management) are deferred?

**Recommendation**: Yes - Update project status document or Slack channel with:
- "Feature 021 focused on 20 core mobile routes (MVP)"
- "6 advanced routes deferred to Phase 2 (estimated +50 tasks, 2-3 weeks additional effort)"
- Link to updated spec.md Out of Scope section

---

## Notes

- All file paths are relative to repo root: `specs/021-apply-gusto-design/`
- Changes are backward-compatible (no breaking changes to existing work)
- Test-first restructuring (`tasks-test-first.md`) is a NEW file - original `tasks.md` preserved
- Constitution violation (C1) is most critical - must be resolved before any implementation begins per Principle III
- Missing routes (C2) must be clarified to set accurate expectations with stakeholders

---

## Questions for User

1. **Test-First Decision**: Do you want to replace `tasks.md` with `tasks-test-first.md` immediately, or adopt incrementally?
2. **Scope Communication**: Should we notify stakeholders about the 6 deferred routes?
3. **OCR Scope**: Confirm OCR is truly out of scope for this phase (marked as future enhancement)?
4. **Medium Priority**: Do you want M1-M4 fixes applied, or defer to implementation phase?

---

**Next Command**: After edits applied, run `/speckit.analyze` again to verify remediation success.
