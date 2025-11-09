# Component Interfaces: Type-Specific Dossier Pages

**Feature**: 028-type-specific-dossier-pages
**Date**: 2025-10-28

---

## Component Architecture

### Shared Layout Wrapper

**Component**: `DossierDetailLayout`

**Purpose**: Provides consistent header, breadcrumbs, and sidebar across all type-specific detail pages

**Props**:
```typescript
interface DossierDetailLayoutProps {
  dossier: Dossier;
  children: ReactNode;
  gridClassName?: string; // Type-specific grid override
}
```

---

### Compound Section Components

**Component**: `DossierSection`

**Purpose**: Namespace for type-specific collapsible sections

**Exports**:
- `DossierSection.GeographicContext` - Country geographic data
- `DossierSection.Timeline` - Engagement/person timeline
- `DossierSection.Profile` - Person/organization profile
- `DossierSection.Relationships` - Shared relationships graph
- `DossierSection.OrgChart` - Organization hierarchy
- `DossierSection.Participants` - Engagement/forum participants
- `DossierSection.Documents` - Shared documents list

**Example Interface**:
```typescript
interface GeographicContextProps {
  country: CountryExtension;
}

interface TimelineProps {
  events: Event[];
}

interface RelationshipsProps {
  dossierId: string;
}
```

---

### Collapsible Section

**Component**: `CollapsibleSection`

**Purpose**: Accessible accordion with session-persisted collapse state

**Props**:
```typescript
interface CollapsibleSectionProps {
  id: string;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}
```

**ARIA Attributes**:
- `role="button"` on header
- `aria-expanded="true|false"`
- `aria-controls="panel-{id}"`
- `role="region"` on panel
- `aria-labelledby="header-{id}"`

---

### Dossiers Hub

**Component**: `DossiersHub`

**Purpose**: Central navigation with BentoGrid displaying all dossier types

**Data Requirements**:
```typescript
interface DossierTypeCard {
  type: DossierType;
  icon: LucideIcon;
  priority: 'P1' | 'P2' | 'P3';
  gridClass: string; // Tailwind col-span classes
  count: number;
}
```

---

**Status**: ✅ **Component Contracts Complete**
