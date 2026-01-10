# Data Model: Dossier UI Polish Test Specifications

**Feature**: 034-dossier-ui-polish
**Date**: 2025-01-04
**Purpose**: Define test data structures and fixtures for UI polish testing

## Overview

This document specifies the test data requirements for validating RTL support, mobile responsiveness, and accessibility across all 6 dossier detail pages. Since this is a frontend-only polish feature, no database schema changes are required.

## Test Fixtures

### Dossier Types

Each dossier type requires test fixtures with specific characteristics for comprehensive testing.

#### 1. Country Dossier Fixture

```typescript
interface CountryTestFixture {
  // Required for RTL testing
  name_ar: string; // Arabic name for RTL display
  name_en: string; // English name for LTR display

  // Required for mobile testing
  longDescription: string; // Tests text wrapping on narrow screens
  manyRelationships: number; // Tests scrollable lists (10+)
  multipleDocuments: number; // Tests document grid stacking (5+)

  // Required for a11y testing
  hasActiveEngagements: boolean; // Tests status badges
  hasOverdueCommitments: boolean; // Tests warning indicators
}

// Sample fixture
const countryFixture = {
  name_ar: 'المملكة العربية السعودية',
  name_en: 'Kingdom of Saudi Arabia',
  longDescription:
    'A comprehensive description that spans multiple lines to test text wrapping behavior on mobile viewports and ensure content remains readable without horizontal scrolling...',
  manyRelationships: 15,
  multipleDocuments: 8,
  hasActiveEngagements: true,
  hasOverdueCommitments: true,
};
```

#### 2. Organization Dossier Fixture

```typescript
interface OrganizationTestFixture {
  name_ar: string;
  name_en: string;
  acronym: string; // Tests abbreviation display
  hierarchyDepth: number; // Tests org chart rendering (3+ levels)
  memberCount: number; // Tests member list scrolling (20+)
  hasLogo: boolean; // Tests image loading states
}

const organizationFixture = {
  name_ar: 'منظمة التعاون الإسلامي',
  name_en: 'Organisation of Islamic Cooperation',
  acronym: 'OIC',
  hierarchyDepth: 4,
  memberCount: 57,
  hasLogo: true,
};
```

#### 3. Person Dossier Fixture

```typescript
interface PersonTestFixture {
  fullName_ar: string;
  fullName_en: string;
  title_ar: string;
  title_en: string;
  positionsHeld: number; // Tests position list (5+)
  interactionCount: number; // Tests timeline scrolling (10+)
  hasProfilePhoto: boolean;
  hasBiography: boolean; // Tests long text sections
}

const personFixture = {
  fullName_ar: 'أحمد بن سعيد الدوسري',
  fullName_en: 'Ahmed bin Saeed Al-Dosari',
  title_ar: 'معالي الوزير',
  title_en: 'His Excellency the Minister',
  positionsHeld: 7,
  interactionCount: 25,
  hasProfilePhoto: true,
  hasBiography: true,
};
```

#### 4. Engagement Dossier Fixture

```typescript
interface EngagementTestFixture {
  title_ar: string;
  title_en: string;
  location_ar: string;
  location_en: string;
  participantCount: number; // Tests participant list (15+)
  documentCount: number; // Tests document section
  hasAgenda: boolean;
  hasOutcomes: boolean;
  dateRange: {
    // Tests date formatting
    start: string;
    end: string;
  };
}

const engagementFixture = {
  title_ar: 'القمة العربية الرابعة والثلاثون',
  title_en: '34th Arab League Summit',
  location_ar: 'الرياض، المملكة العربية السعودية',
  location_en: 'Riyadh, Kingdom of Saudi Arabia',
  participantCount: 22,
  documentCount: 12,
  hasAgenda: true,
  hasOutcomes: true,
  dateRange: {
    start: '2025-05-15',
    end: '2025-05-16',
  },
};
```

#### 5. Forum Dossier Fixture

```typescript
interface ForumTestFixture {
  name_ar: string;
  name_en: string;
  memberOrganizations: number; // Tests member grid (10+)
  workingGroupCount: number; // Tests nested lists (5+)
  hasMeetingSchedule: boolean;
  hasDecisionLogs: boolean;
}

const forumFixture = {
  name_ar: 'منتدى التعاون الإحصائي الخليجي',
  name_en: 'Gulf Statistical Cooperation Forum',
  memberOrganizations: 12,
  workingGroupCount: 6,
  hasMeetingSchedule: true,
  hasDecisionLogs: true,
};
```

#### 6. Working Group Dossier Fixture

```typescript
interface WorkingGroupTestFixture {
  name_ar: string;
  name_en: string;
  parentForum_ar: string;
  parentForum_en: string;
  deliverableCount: number; // Tests deliverable tracker (8+)
  memberCount: number; // Tests member cards (6+)
  hasDeadlines: boolean; // Tests deadline indicators
}

const workingGroupFixture = {
  name_ar: 'فريق عمل المؤشرات الاقتصادية',
  name_en: 'Economic Indicators Working Group',
  parentForum_ar: 'منتدى التعاون الإحصائي الخليجي',
  parentForum_en: 'Gulf Statistical Cooperation Forum',
  deliverableCount: 10,
  memberCount: 8,
  hasDeadlines: true,
};
```

## Test Scenarios Data

### RTL-Specific Test Data

```typescript
const rtlTestData = {
  // Bidirectional text (Arabic with English)
  mixedText: 'تقرير GDP للربع الأول 2025', // "GDP Report Q1 2025" in Arabic with English acronym

  // Numbers that should not flip
  percentages: '٪45', // Arabic percentage
  dates: '15/05/2025', // Date format

  // Long Arabic text for wrapping
  paragraph:
    'هذا النص الطويل باللغة العربية مصمم لاختبار التفاف النص في التخطيطات المتجاوبة. يجب أن يتم عرضه بشكل صحيح من اليمين إلى اليسار دون أي مشاكل في المحاذاة أو القطع.',
};
```

### Mobile-Specific Test Data

```typescript
const mobileTestData = {
  // Very long content that tests horizontal overflow
  longTitle:
    'International Statistical Cooperation Forum for Economic Development and Trade Statistics Harmonization',

  // Table data that requires horizontal scroll
  wideTable: {
    columns: [
      'Name',
      'Organization',
      'Position',
      'Department',
      'Contact',
      'Status',
      'Last Activity',
    ],
    rows: 10,
  },

  // Card grid that should stack on mobile
  cardGrid: {
    items: 6,
    minWidth: '250px',
  },
};
```

### Accessibility Test Data

```typescript
const a11yTestData = {
  // Required ARIA labels
  ariaLabels: {
    expandSection: 'Expand {sectionName}',
    collapseSection: 'Collapse {sectionName}',
    closeModal: 'Close dialog',
    pagination: 'Page {current} of {total}',
    sortColumn: 'Sort by {columnName}',
  },

  // Status announcements
  liveRegions: {
    loading: 'Loading {resourceName}...',
    loaded: '{resourceName} loaded successfully',
    error: 'Error loading {resourceName}',
    empty: 'No {resourceName} found',
  },

  // Form field associations
  formFields: {
    hasLabels: true,
    hasDescriptions: true,
    hasErrorMessages: true,
  },
};
```

## Mock API Responses

### Country Detail Mock

```json
{
  "id": "test-country-123",
  "type": "country",
  "name_en": "Kingdom of Saudi Arabia",
  "name_ar": "المملكة العربية السعودية",
  "iso_code": "SA",
  "region": "Middle East",
  "relationships": [
    { "id": "rel-1", "type": "bilateral", "partner_id": "country-456", "status": "active" }
  ],
  "engagements": [
    { "id": "eng-1", "title_en": "Summit Meeting", "title_ar": "قمة", "date": "2025-05-15" }
  ],
  "documents": [
    { "id": "doc-1", "title_en": "MoU Document", "title_ar": "وثيقة مذكرة تفاهم", "type": "pdf" }
  ],
  "stats": {
    "total_engagements": 45,
    "active_commitments": 12,
    "overdue_commitments": 2
  }
}
```

## Test Environment Configuration

### Playwright Fixtures

```typescript
// fixtures/dossier-fixtures.ts
import { test as base } from '@playwright/test';

type DossierFixtures = {
  countryDossier: CountryTestFixture;
  organizationDossier: OrganizationTestFixture;
  personDossier: PersonTestFixture;
  engagementDossier: EngagementTestFixture;
  forumDossier: ForumTestFixture;
  workingGroupDossier: WorkingGroupTestFixture;
};

export const test = base.extend<DossierFixtures>({
  countryDossier: async ({}, use) => {
    await use(countryFixture);
  },
  // ... other fixtures
});
```

### Test Database Seeding

For E2E tests that require actual database records:

```sql
-- Create test dossiers for each type
INSERT INTO dossiers (id, type, name_en, name_ar, created_at)
VALUES
  ('test-country-001', 'country', 'Test Country', 'دولة اختبار', NOW()),
  ('test-org-001', 'organization', 'Test Organization', 'منظمة اختبار', NOW()),
  ('test-person-001', 'person', 'Test Person', 'شخص اختبار', NOW()),
  ('test-engagement-001', 'engagement', 'Test Engagement', 'مشاركة اختبار', NOW()),
  ('test-forum-001', 'forum', 'Test Forum', 'منتدى اختبار', NOW()),
  ('test-wg-001', 'working_group', 'Test Working Group', 'فريق عمل اختبار', NOW());
```

## Summary

| Dossier Type  | RTL Fields              | Mobile Challenges                | A11y Focus          |
| ------------- | ----------------------- | -------------------------------- | ------------------- |
| Country       | name, description       | Map component, relationship grid | Status badges       |
| Organization  | name, hierarchy         | Org chart, member list           | Tree navigation     |
| Person        | name, title, bio        | Profile layout, position list    | Image alt text      |
| Engagement    | title, location, agenda | Participant list, date range     | Event timeline      |
| Forum         | name, members           | Member grid, schedule            | Meeting calendar    |
| Working Group | name, deliverables      | Deliverable tracker              | Progress indicators |
