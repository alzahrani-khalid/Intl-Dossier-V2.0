# Data Model: Apply Gusto Design System to Mobile App

**Feature**: 021-apply-gusto-design
**Created**: 2025-10-13
**Platform**: Mobile (iOS/Android)
**Database**: WatermelonDB 0.28+ (SQLite)
**Sync Strategy**: Incremental sync with optimistic locking

## Overview

This document defines the WatermelonDB schema for the Intl-Dossier mobile application. The schema includes 11 core entities with relationships, sync metadata, and offline-first design patterns.

### Key Design Decisions

1. **Offline-First**: All entities stored locally in SQLite via WatermelonDB
2. **Incremental Sync**: Each entity has `_version`, `last_modified`, `synced_at` for conflict detection
3. **Optimistic Locking**: Version-based conflict resolution with server validation
4. **TTL Cleanup**: 90-day retention for synced offline data
5. **Lazy Loading**: Complex relationships use `@lazy` for performance
6. **Indexes**: All foreign keys indexed for query performance

## Schema Version

**Current Version**: 1
**Migration Strategy**: WatermelonDB `schemaMigrations` with addColumns/createTable

## Entity Relationships

```
Dossier 1:N Assignment
Dossier 1:N CalendarEntry
Dossier N:M Country (via dossier_countries junction)
Dossier N:M Organization (via dossier_organizations junction)
Dossier N:M Forum (via dossier_forums junction)
Dossier N:M Position (via position_dossier_links junction)
Dossier 1:N MOU
Dossier 1:N IntelligenceSignal
Assignment N:1 User (via assigned_to_id)
CalendarEntry N:1 User (via created_by_id)
IntakeTicket 1:1 Dossier (via dossier_id, nullable until approved)
Notification N:1 User (via user_id)
```

## 1. Dossier Entity

The core entity representing a diplomatic dossier (country, organization, forum).

### Table Schema

```typescript
tableSchema({
  name: 'dossiers',
  columns: [
    // Identification
    { name: 'server_id', type: 'string', isIndexed: true },  // UUID from server
    { name: 'dossier_type', type: 'string', isIndexed: true }, // 'country' | 'organization' | 'forum'
    { name: 'name_en', type: 'string' },
    { name: 'name_ar', type: 'string' },
    { name: 'code', type: 'string', isOptional: true },

    // Content
    { name: 'description_en', type: 'string', isOptional: true },
    { name: 'description_ar', type: 'string', isOptional: true },
    { name: 'status', type: 'string' }, // 'draft' | 'active' | 'archived' | 'pending'
    { name: 'priority', type: 'string', isOptional: true }, // 'high' | 'medium' | 'low'
    { name: 'tags', type: 'string', isOptional: true }, // JSON array of strings

    // Metadata
    { name: 'created_by_id', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' }, // Unix timestamp (ms)
    { name: 'updated_at', type: 'number' },

    // Sync metadata
    { name: '_version', type: 'number' }, // Optimistic locking version
    { name: 'last_modified', type: 'number' }, // Server timestamp
    { name: 'synced_at', type: 'number', isOptional: true }, // Last successful sync
    { name: 'is_deleted', type: 'boolean' }, // Soft delete flag
  ],
})
```

### Model Class

```typescript
import { Model, Q } from '@nozbe/watermelondb';
import { field, date, children, lazy } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export default class Dossier extends Model {
  static table = 'dossiers';

  static associations: Associations = {
    assignments: { type: 'has_many', foreignKey: 'dossier_id' },
    calendar_entries: { type: 'has_many', foreignKey: 'dossier_id' },
    mous: { type: 'has_many', foreignKey: 'dossier_id' },
    intelligence_signals: { type: 'has_many', foreignKey: 'dossier_id' },
  };

  // Identification
  @field('server_id') serverId!: string;
  @field('dossier_type') dossierType!: 'country' | 'organization' | 'forum';
  @field('name_en') nameEn!: string;
  @field('name_ar') nameAr!: string;
  @field('code') code?: string;

  // Content
  @field('description_en') descriptionEn?: string;
  @field('description_ar') descriptionAr?: string;
  @field('status') status!: 'draft' | 'active' | 'archived' | 'pending';
  @field('priority') priority?: 'high' | 'medium' | 'low';
  @field('tags') tagsJson?: string; // JSON.parse() to get string[]

  // Metadata
  @field('created_by_id') createdById?: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Sync metadata
  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  // Relationships
  @children('assignments') assignments!: Query<Assignment>;
  @children('calendar_entries') calendarEntries!: Query<CalendarEntry>;
  @children('mous') mous!: Query<MOU>;
  @children('intelligence_signals') intelligenceSignals!: Query<IntelligenceSignal>;

  // Lazy queries for many-to-many relationships
  @lazy countries = this.collections
    .get<DossierCountry>('dossier_countries')
    .query(Q.where('dossier_id', this.id));

  @lazy organizations = this.collections
    .get<DossierOrganization>('dossier_organizations')
    .query(Q.where('dossier_id', this.id));

  @lazy forums = this.collections
    .get<DossierForum>('dossier_forums')
    .query(Q.where('dossier_id', this.id));

  @lazy positions = this.collections
    .get<PositionDossierLink>('position_dossier_links')
    .query(Q.where('dossier_id', this.id));

  // Helper methods
  get tags(): string[] {
    return this.tagsJson ? JSON.parse(this.tagsJson) : [];
  }

  set tags(value: string[]) {
    this.tagsJson = JSON.stringify(value);
  }

  get displayName(): string {
    // Use Arabic name if current locale is 'ar', otherwise English
    const locale = i18n.language; // Assume i18next is available
    return locale === 'ar' ? this.nameAr : this.nameEn;
  }

  get isStale(): boolean {
    // Consider data stale if not synced in last 24 hours
    if (!this.syncedAt) return true;
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Date.now() - this.syncedAt > oneDayMs;
  }
}
```

## 2. Assignment Entity

User assignments to dossiers with role-based access.

### Table Schema

```typescript
tableSchema({
  name: 'assignments',
  columns: [
    // Identification
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'dossier_id', type: 'string', isIndexed: true }, // FK to dossiers
    { name: 'assigned_to_id', type: 'string', isIndexed: true }, // User UUID

    // Assignment details
    { name: 'role', type: 'string' }, // 'country_analyst' | 'policy_officer' | 'manager' | 'viewer'
    { name: 'status', type: 'string' }, // 'active' | 'completed' | 'cancelled'
    { name: 'assigned_at', type: 'number' },
    { name: 'completed_at', type: 'number', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true },

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class Assignment extends Model {
  static table = 'assignments';

  static associations: Associations = {
    dossiers: { type: 'belongs_to', key: 'dossier_id' },
  };

  @field('server_id') serverId!: string;
  @field('dossier_id') dossierId!: string;
  @field('assigned_to_id') assignedToId!: string;

  @field('role') role!: 'country_analyst' | 'policy_officer' | 'manager' | 'viewer';
  @field('status') status!: 'active' | 'completed' | 'cancelled';
  @date('assigned_at') assignedAt!: Date;
  @date('completed_at') completedAt?: Date;
  @field('notes') notes?: string;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  @relation('dossiers', 'dossier_id') dossier!: Relation<Dossier>;

  get isActive(): boolean {
    return this.status === 'active';
  }
}
```

## 3. CalendarEntry Entity

Events, meetings, deadlines linked to dossiers.

### Table Schema

```typescript
tableSchema({
  name: 'calendar_entries',
  columns: [
    // Identification
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'dossier_id', type: 'string', isIndexed: true, isOptional: true }, // FK (optional for personal events)

    // Event details
    { name: 'title_en', type: 'string' },
    { name: 'title_ar', type: 'string' },
    { name: 'description_en', type: 'string', isOptional: true },
    { name: 'description_ar', type: 'string', isOptional: true },
    { name: 'event_type', type: 'string' }, // 'meeting' | 'deadline' | 'reminder' | 'milestone'
    { name: 'start_time', type: 'number' }, // Unix timestamp (ms)
    { name: 'end_time', type: 'number', isOptional: true },
    { name: 'location', type: 'string', isOptional: true },
    { name: 'attendees', type: 'string', isOptional: true }, // JSON array of user IDs

    // Status
    { name: 'status', type: 'string' }, // 'scheduled' | 'completed' | 'cancelled'
    { name: 'created_by_id', type: 'string' },
    { name: 'created_at', type: 'number' },

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class CalendarEntry extends Model {
  static table = 'calendar_entries';

  static associations: Associations = {
    dossiers: { type: 'belongs_to', key: 'dossier_id' },
  };

  @field('server_id') serverId!: string;
  @field('dossier_id') dossierId?: string;

  @field('title_en') titleEn!: string;
  @field('title_ar') titleAr!: string;
  @field('description_en') descriptionEn?: string;
  @field('description_ar') descriptionAr?: string;
  @field('event_type') eventType!: 'meeting' | 'deadline' | 'reminder' | 'milestone';
  @date('start_time') startTime!: Date;
  @date('end_time') endTime?: Date;
  @field('location') location?: string;
  @field('attendees') attendeesJson?: string;

  @field('status') status!: 'scheduled' | 'completed' | 'cancelled';
  @field('created_by_id') createdById!: string;
  @date('created_at') createdAt!: Date;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  @relation('dossiers', 'dossier_id') dossier?: Relation<Dossier>;

  get attendees(): string[] {
    return this.attendeesJson ? JSON.parse(this.attendeesJson) : [];
  }

  set attendees(value: string[]) {
    this.attendeesJson = JSON.stringify(value);
  }

  get displayTitle(): string {
    const locale = i18n.language;
    return locale === 'ar' ? this.titleAr : this.titleEn;
  }

  get isPast(): boolean {
    return this.startTime.getTime() < Date.now();
  }

  get isUpcoming(): boolean {
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const timeDiff = this.startTime.getTime() - Date.now();
    return timeDiff > 0 && timeDiff <= threeDaysMs;
  }
}
```

## 4. Country Entity

Reference data for countries with static attributes.

### Table Schema

```typescript
tableSchema({
  name: 'countries',
  columns: [
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'name_en', type: 'string' },
    { name: 'name_ar', type: 'string' },
    { name: 'iso_code', type: 'string', isIndexed: true }, // ISO 3166-1 alpha-3
    { name: 'flag_emoji', type: 'string', isOptional: true },
    { name: 'region', type: 'string', isOptional: true }, // 'mena' | 'europe' | 'asia' | etc.

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class Country extends Model {
  static table = 'countries';

  @field('server_id') serverId!: string;
  @field('name_en') nameEn!: string;
  @field('name_ar') nameAr!: string;
  @field('iso_code') isoCode!: string;
  @field('flag_emoji') flagEmoji?: string;
  @field('region') region?: string;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  @lazy dossiers = this.collections
    .get<DossierCountry>('dossier_countries')
    .query(Q.where('country_id', this.id));

  get displayName(): string {
    const locale = i18n.language;
    const name = locale === 'ar' ? this.nameAr : this.nameEn;
    return this.flagEmoji ? `${this.flagEmoji} ${name}` : name;
  }
}
```

## 5. Organization Entity

Reference data for international organizations.

### Table Schema

```typescript
tableSchema({
  name: 'organizations',
  columns: [
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'name_en', type: 'string' },
    { name: 'name_ar', type: 'string' },
    { name: 'acronym', type: 'string', isOptional: true }, // e.g., "UN", "WTO"
    { name: 'org_type', type: 'string', isOptional: true }, // 'intergovernmental' | 'ngo' | etc.
    { name: 'headquarters', type: 'string', isOptional: true },

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class Organization extends Model {
  static table = 'organizations';

  @field('server_id') serverId!: string;
  @field('name_en') nameEn!: string;
  @field('name_ar') nameAr!: string;
  @field('acronym') acronym?: string;
  @field('org_type') orgType?: string;
  @field('headquarters') headquarters?: string;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  @lazy dossiers = this.collections
    .get<DossierOrganization>('dossier_organizations')
    .query(Q.where('organization_id', this.id));

  get displayName(): string {
    const locale = i18n.language;
    const name = locale === 'ar' ? this.nameAr : this.nameEn;
    return this.acronym ? `${name} (${this.acronym})` : name;
  }
}
```

## 6. Forum Entity

Reference data for international forums.

### Table Schema

```typescript
tableSchema({
  name: 'forums',
  columns: [
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'name_en', type: 'string' },
    { name: 'name_ar', type: 'string' },
    { name: 'forum_type', type: 'string', isOptional: true }, // 'summit' | 'conference' | etc.
    { name: 'frequency', type: 'string', isOptional: true }, // 'annual' | 'biennial' | etc.

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class Forum extends Model {
  static table = 'forums';

  @field('server_id') serverId!: string;
  @field('name_en') nameEn!: string;
  @field('name_ar') nameAr!: string;
  @field('forum_type') forumType?: string;
  @field('frequency') frequency?: string;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  @lazy dossiers = this.collections
    .get<DossierForum>('dossier_forums')
    .query(Q.where('forum_id', this.id));

  get displayName(): string {
    const locale = i18n.language;
    return locale === 'ar' ? this.nameAr : this.nameEn;
  }
}
```

## 7. Position Entity

Reference data for diplomatic positions within organizations.

### Table Schema

```typescript
tableSchema({
  name: 'positions',
  columns: [
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'title_en', type: 'string' },
    { name: 'title_ar', type: 'string' },
    { name: 'organization_id', type: 'string', isIndexed: true }, // FK to organizations
    { name: 'level', type: 'string', isOptional: true }, // 'executive' | 'managerial' | etc.

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class Position extends Model {
  static table = 'positions';

  static associations: Associations = {
    organizations: { type: 'belongs_to', key: 'organization_id' },
  };

  @field('server_id') serverId!: string;
  @field('title_en') titleEn!: string;
  @field('title_ar') titleAr!: string;
  @field('organization_id') organizationId!: string;
  @field('level') level?: string;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  @relation('organizations', 'organization_id') organization!: Relation<Organization>;

  @lazy dossiers = this.collections
    .get<PositionDossierLink>('position_dossier_links')
    .query(Q.where('position_id', this.id));

  get displayTitle(): string {
    const locale = i18n.language;
    return locale === 'ar' ? this.titleAr : this.titleEn;
  }
}
```

## 8. MOU Entity

Memoranda of Understanding linked to dossiers.

### Table Schema

```typescript
tableSchema({
  name: 'mous',
  columns: [
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'dossier_id', type: 'string', isIndexed: true }, // FK to dossiers
    { name: 'title_en', type: 'string' },
    { name: 'title_ar', type: 'string' },
    { name: 'signed_date', type: 'number', isOptional: true },
    { name: 'expiry_date', type: 'number', isOptional: true },
    { name: 'status', type: 'string' }, // 'draft' | 'signed' | 'expired' | 'cancelled'
    { name: 'document_url', type: 'string', isOptional: true },

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class MOU extends Model {
  static table = 'mous';

  static associations: Associations = {
    dossiers: { type: 'belongs_to', key: 'dossier_id' },
  };

  @field('server_id') serverId!: string;
  @field('dossier_id') dossierId!: string;
  @field('title_en') titleEn!: string;
  @field('title_ar') titleAr!: string;
  @date('signed_date') signedDate?: Date;
  @date('expiry_date') expiryDate?: Date;
  @field('status') status!: 'draft' | 'signed' | 'expired' | 'cancelled';
  @field('document_url') documentUrl?: string;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  @relation('dossiers', 'dossier_id') dossier!: Relation<Dossier>;

  get displayTitle(): string {
    const locale = i18n.language;
    return locale === 'ar' ? this.titleAr : this.titleEn;
  }

  get isExpired(): boolean {
    if (!this.expiryDate) return false;
    return this.expiryDate.getTime() < Date.now();
  }

  get isExpiringSoon(): boolean {
    if (!this.expiryDate) return false;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const timeDiff = this.expiryDate.getTime() - Date.now();
    return timeDiff > 0 && timeDiff <= thirtyDaysMs;
  }
}
```

## 9. IntelligenceSignal Entity

Intelligence signals/alerts linked to dossiers.

### Table Schema

```typescript
tableSchema({
  name: 'intelligence_signals',
  columns: [
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'dossier_id', type: 'string', isIndexed: true }, // FK to dossiers
    { name: 'title_en', type: 'string' },
    { name: 'title_ar', type: 'string' },
    { name: 'content_en', type: 'string', isOptional: true },
    { name: 'content_ar', type: 'string', isOptional: true },
    { name: 'signal_type', type: 'string' }, // 'alert' | 'report' | 'analysis'
    { name: 'severity', type: 'string', isOptional: true }, // 'critical' | 'high' | 'medium' | 'low'
    { name: 'source', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' },

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class IntelligenceSignal extends Model {
  static table = 'intelligence_signals';

  static associations: Associations = {
    dossiers: { type: 'belongs_to', key: 'dossier_id' },
  };

  @field('server_id') serverId!: string;
  @field('dossier_id') dossierId!: string;
  @field('title_en') titleEn!: string;
  @field('title_ar') titleAr!: string;
  @field('content_en') contentEn?: string;
  @field('content_ar') contentAr?: string;
  @field('signal_type') signalType!: 'alert' | 'report' | 'analysis';
  @field('severity') severity?: 'critical' | 'high' | 'medium' | 'low';
  @field('source') source?: string;
  @date('created_at') createdAt!: Date;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  @relation('dossiers', 'dossier_id') dossier!: Relation<Dossier>;

  get displayTitle(): string {
    const locale = i18n.language;
    return locale === 'ar' ? this.titleAr : this.titleEn;
  }

  get isCritical(): boolean {
    return this.severity === 'critical';
  }
}
```

## 10. IntakeTicket Entity

Intake queue tickets for new dossier requests.

### Table Schema

```typescript
tableSchema({
  name: 'intake_tickets',
  columns: [
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'dossier_id', type: 'string', isIndexed: true, isOptional: true }, // FK (null until approved)
    { name: 'title_en', type: 'string' },
    { name: 'title_ar', type: 'string' },
    { name: 'description_en', type: 'string', isOptional: true },
    { name: 'description_ar', type: 'string', isOptional: true },
    { name: 'requested_by_id', type: 'string' },
    { name: 'status', type: 'string' }, // 'pending' | 'approved' | 'rejected' | 'cancelled'
    { name: 'priority', type: 'string', isOptional: true }, // 'urgent' | 'high' | 'normal' | 'low'
    { name: 'created_at', type: 'number' },
    { name: 'reviewed_at', type: 'number', isOptional: true },
    { name: 'reviewed_by_id', type: 'string', isOptional: true },

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class IntakeTicket extends Model {
  static table = 'intake_tickets';

  static associations: Associations = {
    dossiers: { type: 'belongs_to', key: 'dossier_id' },
  };

  @field('server_id') serverId!: string;
  @field('dossier_id') dossierId?: string;
  @field('title_en') titleEn!: string;
  @field('title_ar') titleAr!: string;
  @field('description_en') descriptionEn?: string;
  @field('description_ar') descriptionAr?: string;
  @field('requested_by_id') requestedById!: string;
  @field('status') status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
  @field('priority') priority?: 'urgent' | 'high' | 'normal' | 'low';
  @date('created_at') createdAt!: Date;
  @date('reviewed_at') reviewedAt?: Date;
  @field('reviewed_by_id') reviewedById?: string;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  @relation('dossiers', 'dossier_id') dossier?: Relation<Dossier>;

  get displayTitle(): string {
    const locale = i18n.language;
    return locale === 'ar' ? this.titleAr : this.titleEn;
  }

  get isPending(): boolean {
    return this.status === 'pending';
  }
}
```

## 11. Notification Entity

Push notifications for user alerts.

### Table Schema

```typescript
tableSchema({
  name: 'notifications',
  columns: [
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'user_id', type: 'string', isIndexed: true }, // FK to users
    { name: 'title_en', type: 'string' },
    { name: 'title_ar', type: 'string' },
    { name: 'body_en', type: 'string' },
    { name: 'body_ar', type: 'string' },
    { name: 'notification_type', type: 'string' }, // 'assignment' | 'calendar' | 'signal' | 'message' | 'system'
    { name: 'priority', type: 'string' }, // 'high' | 'normal' | 'low'
    { name: 'deep_link', type: 'string', isOptional: true }, // e.g., 'intldossier://dossiers/123'
    { name: 'is_read', type: 'boolean' },
    { name: 'read_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },

    // Sync metadata
    { name: '_version', type: 'number' },
    { name: 'last_modified', type: 'number' },
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'boolean' },
  ],
})
```

### Model Class

```typescript
export default class Notification extends Model {
  static table = 'notifications';

  @field('server_id') serverId!: string;
  @field('user_id') userId!: string;
  @field('title_en') titleEn!: string;
  @field('title_ar') titleAr!: string;
  @field('body_en') bodyEn!: string;
  @field('body_ar') bodyAr!: string;
  @field('notification_type') notificationType!: 'assignment' | 'calendar' | 'signal' | 'message' | 'system';
  @field('priority') priority!: 'high' | 'normal' | 'low';
  @field('deep_link') deepLink?: string;
  @field('is_read') isRead!: boolean;
  @date('read_at') readAt?: Date;
  @date('created_at') createdAt!: Date;

  @field('_version') version!: number;
  @field('last_modified') lastModified!: number;
  @field('synced_at') syncedAt?: number;
  @field('is_deleted') isDeleted!: boolean;

  get displayTitle(): string {
    const locale = i18n.language;
    return locale === 'ar' ? this.titleAr : this.titleEn;
  }

  get displayBody(): string {
    const locale = i18n.language;
    return locale === 'ar' ? this.bodyAr : this.bodyEn;
  }

  async markAsRead(): Promise<void> {
    await this.update(notification => {
      notification.isRead = true;
      notification.readAt = Date.now();
    });
  }
}
```

## Junction Tables (Many-to-Many Relationships)

### DossierCountry Junction

```typescript
tableSchema({
  name: 'dossier_countries',
  columns: [
    { name: 'dossier_id', type: 'string', isIndexed: true },
    { name: 'country_id', type: 'string', isIndexed: true },
    { name: 'created_at', type: 'number' },
  ],
})

export default class DossierCountry extends Model {
  static table = 'dossier_countries';

  static associations: Associations = {
    dossiers: { type: 'belongs_to', key: 'dossier_id' },
    countries: { type: 'belongs_to', key: 'country_id' },
  };

  @field('dossier_id') dossierId!: string;
  @field('country_id') countryId!: string;
  @date('created_at') createdAt!: Date;

  @relation('dossiers', 'dossier_id') dossier!: Relation<Dossier>;
  @relation('countries', 'country_id') country!: Relation<Country>;
}
```

### DossierOrganization Junction

```typescript
tableSchema({
  name: 'dossier_organizations',
  columns: [
    { name: 'dossier_id', type: 'string', isIndexed: true },
    { name: 'organization_id', type: 'string', isIndexed: true },
    { name: 'created_at', type: 'number' },
  ],
})

export default class DossierOrganization extends Model {
  static table = 'dossier_organizations';

  static associations: Associations = {
    dossiers: { type: 'belongs_to', key: 'dossier_id' },
    organizations: { type: 'belongs_to', key: 'organization_id' },
  };

  @field('dossier_id') dossierId!: string;
  @field('organization_id') organizationId!: string;
  @date('created_at') createdAt!: Date;

  @relation('dossiers', 'dossier_id') dossier!: Relation<Dossier>;
  @relation('organizations', 'organization_id') organization!: Relation<Organization>;
}
```

### DossierForum Junction

```typescript
tableSchema({
  name: 'dossier_forums',
  columns: [
    { name: 'dossier_id', type: 'string', isIndexed: true },
    { name: 'forum_id', type: 'string', isIndexed: true },
    { name: 'created_at', type: 'number' },
  ],
})

export default class DossierForum extends Model {
  static table = 'dossier_forums';

  static associations: Associations = {
    dossiers: { type: 'belongs_to', key: 'dossier_id' },
    forums: { type: 'belongs_to', key: 'forum_id' },
  };

  @field('dossier_id') dossierId!: string;
  @field('forum_id') forumId!: string;
  @date('created_at') createdAt!: Date;

  @relation('dossiers', 'dossier_id') dossier!: Relation<Dossier>;
  @relation('forums', 'forum_id') forum!: Relation<Forum>;
}
```

### PositionDossierLink Junction

```typescript
tableSchema({
  name: 'position_dossier_links',
  columns: [
    { name: 'position_id', type: 'string', isIndexed: true },
    { name: 'dossier_id', type: 'string', isIndexed: true },
    { name: 'created_at', type: 'number' },
  ],
})

export default class PositionDossierLink extends Model {
  static table = 'position_dossier_links';

  static associations: Associations = {
    positions: { type: 'belongs_to', key: 'position_id' },
    dossiers: { type: 'belongs_to', key: 'dossier_id' },
  };

  @field('position_id') positionId!: string;
  @field('dossier_id') dossierId!: string;
  @date('created_at') createdAt!: Date;

  @relation('positions', 'position_id') position!: Relation<Position>;
  @relation('dossiers', 'dossier_id') dossier!: Relation<Dossier>;
}
```

## Database Initialization

### Schema Definition

```typescript
// mobile/src/database/schema.ts
import { appSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Core entities
    require('./schemas/dossiers').default,
    require('./schemas/assignments').default,
    require('./schemas/calendarEntries').default,
    require('./schemas/countries').default,
    require('./schemas/organizations').default,
    require('./schemas/forums').default,
    require('./schemas/positions').default,
    require('./schemas/mous').default,
    require('./schemas/intelligenceSignals').default,
    require('./schemas/intakeTickets').default,
    require('./schemas/notifications').default,

    // Junction tables
    require('./schemas/dossierCountries').default,
    require('./schemas/dossierOrganizations').default,
    require('./schemas/dossierForums').default,
    require('./schemas/positionDossierLinks').default,
  ],
});
```

### Database Instance

```typescript
// mobile/src/database/index.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { models } from './models';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, // Enable JSI for better performance
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: models,
});
```

### Model Registry

```typescript
// mobile/src/database/models.ts
import Dossier from './models/Dossier';
import Assignment from './models/Assignment';
import CalendarEntry from './models/CalendarEntry';
import Country from './models/Country';
import Organization from './models/Organization';
import Forum from './models/Forum';
import Position from './models/Position';
import MOU from './models/MOU';
import IntelligenceSignal from './models/IntelligenceSignal';
import IntakeTicket from './models/IntakeTicket';
import Notification from './models/Notification';
import DossierCountry from './models/DossierCountry';
import DossierOrganization from './models/DossierOrganization';
import DossierForum from './models/DossierForum';
import PositionDossierLink from './models/PositionDossierLink';

export const models = [
  Dossier,
  Assignment,
  CalendarEntry,
  Country,
  Organization,
  Forum,
  Position,
  MOU,
  IntelligenceSignal,
  IntakeTicket,
  Notification,
  DossierCountry,
  DossierOrganization,
  DossierForum,
  PositionDossierLink,
];
```

## Common Query Patterns

### Example: Fetch Active Dossiers for Current User

```typescript
import { Q } from '@nozbe/watermelondb';
import { database } from '@/database';
import { useAuth } from '@/hooks/useAuth';

export async function fetchMyActiveDossiers() {
  const { user } = useAuth();

  const assignments = await database
    .get<Assignment>('assignments')
    .query(
      Q.where('assigned_to_id', user.id),
      Q.where('status', 'active'),
      Q.where('is_deleted', false)
    )
    .fetch();

  const dossierIds = assignments.map(a => a.dossierId);

  const dossiers = await database
    .get<Dossier>('dossiers')
    .query(
      Q.where('id', Q.oneOf(dossierIds)),
      Q.where('is_deleted', false),
      Q.sortBy('updated_at', Q.desc)
    )
    .fetch();

  return dossiers;
}
```

### Example: Fetch Upcoming Calendar Events

```typescript
export async function fetchUpcomingEvents(daysAhead: number = 7) {
  const now = Date.now();
  const endTime = now + (daysAhead * 24 * 60 * 60 * 1000);

  const events = await database
    .get<CalendarEntry>('calendar_entries')
    .query(
      Q.where('start_time', Q.gte(now)),
      Q.where('start_time', Q.lte(endTime)),
      Q.where('status', 'scheduled'),
      Q.where('is_deleted', false),
      Q.sortBy('start_time', Q.asc)
    )
    .fetch();

  return events;
}
```

### Example: Search Dossiers with Full-Text Search

```typescript
export async function searchDossiers(query: string, locale: string = 'en') {
  const nameField = locale === 'ar' ? 'name_ar' : 'name_en';

  const dossiers = await database
    .get<Dossier>('dossiers')
    .query(
      Q.where(nameField, Q.like(`%${Q.sanitizeLikeString(query)}%`)),
      Q.where('is_deleted', false),
      Q.sortBy('updated_at', Q.desc),
      Q.take(20) // Limit to 20 results
    )
    .fetch();

  return dossiers;
}
```

## Sync Metadata Usage

### Last Sync Timestamp

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getLastSyncTimestamp(): Promise<number | null> {
  const timestamp = await AsyncStorage.getItem('last_sync_timestamp');
  return timestamp ? parseInt(timestamp, 10) : null;
}

export async function setLastSyncTimestamp(timestamp: number): Promise<void> {
  await AsyncStorage.setItem('last_sync_timestamp', timestamp.toString());
}
```

### TTL Cleanup (90-day retention)

```typescript
export async function cleanupStaleData(): Promise<void> {
  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

  await database.write(async () => {
    // Find all records not synced in 90 days
    const staleRecords = await database
      .get<Dossier>('dossiers')
      .query(
        Q.where('synced_at', Q.lt(ninetyDaysAgo)),
        Q.where('is_deleted', false)
      )
      .fetch();

    // Soft delete
    for (const record of staleRecords) {
      await record.update(r => {
        r.isDeleted = true;
      });
    }
  });

  console.log(`Cleaned up ${staleRecords.length} stale records`);
}
```

## Performance Optimizations

### Batch Operations

```typescript
export async function batchCreateDossiers(dossiersData: DossierData[]): Promise<void> {
  await database.write(async () => {
    const dossiersCollection = database.get<Dossier>('dossiers');

    const batch = dossiersData.map(data =>
      dossiersCollection.prepareCreate(dossier => {
        dossier.serverId = data.id;
        dossier.dossierType = data.type;
        dossier.nameEn = data.name_en;
        dossier.nameAr = data.name_ar;
        dossier.status = data.status;
        dossier.version = data._version;
        dossier.lastModified = data.last_modified;
        dossier.syncedAt = Date.now();
        dossier.isDeleted = false;
      })
    );

    await database.batch(...batch);
  });
}
```

### Observe Changes (Reactive Queries)

```typescript
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { useState, useEffect } from 'react';

export function useMyDossiers() {
  const database = useDatabase();
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);

  useEffect(() => {
    const subscription = database
      .get<Assignment>('assignments')
      .query(
        Q.where('assigned_to_id', user.id),
        Q.where('status', 'active')
      )
      .observeWithColumns(['status', 'is_deleted'])
      .subscribe(async (assignments) => {
        const dossierIds = assignments.map(a => a.dossierId);
        const fetchedDossiers = await database
          .get<Dossier>('dossiers')
          .query(Q.where('id', Q.oneOf(dossierIds)))
          .fetch();

        setDossiers(fetchedDossiers);
      });

    return () => subscription.unsubscribe();
  }, [database, user.id]);

  return dossiers;
}
```

## Migration Strategy

### Schema Migrations

```typescript
// mobile/src/database/migrations.ts
import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // Example: Add 'priority' column to dossiers in schema version 2
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'dossiers',
          columns: [
            { name: 'priority', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    // Example: Add 'notifications' table in schema version 3
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'notifications',
          columns: [
            { name: 'server_id', type: 'string', isIndexed: true },
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'title_en', type: 'string' },
            { name: 'title_ar', type: 'string' },
            { name: 'body_en', type: 'string' },
            { name: 'body_ar', type: 'string' },
            { name: 'notification_type', type: 'string' },
            { name: 'priority', type: 'string' },
            { name: 'deep_link', type: 'string', isOptional: true },
            { name: 'is_read', type: 'boolean' },
            { name: 'read_at', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: '_version', type: 'number' },
            { name: 'last_modified', type: 'number' },
            { name: 'synced_at', type: 'number', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
      ],
    },
  ],
});
```

## Testing Strategy

### Unit Tests for Models

```typescript
// __tests__/models/Dossier.test.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '@/database/schema';
import { models } from '@/database/models';
import Dossier from '@/database/models/Dossier';

describe('Dossier Model', () => {
  let database: Database;

  beforeEach(() => {
    const adapter = new SQLiteAdapter({
      schema,
      jsi: false, // Disable JSI for tests
    });

    database = new Database({
      adapter,
      modelClasses: models,
    });
  });

  it('should create a dossier with all required fields', async () => {
    const dossier = await database.write(async () => {
      return await database.get<Dossier>('dossiers').create(d => {
        d.serverId = 'test-uuid-123';
        d.dossierType = 'country';
        d.nameEn = 'Test Country';
        d.nameAr = 'دولة اختبار';
        d.status = 'active';
        d.version = 1;
        d.lastModified = Date.now();
        d.isDeleted = false;
      });
    });

    expect(dossier.serverId).toBe('test-uuid-123');
    expect(dossier.dossierType).toBe('country');
    expect(dossier.nameEn).toBe('Test Country');
    expect(dossier.status).toBe('active');
  });

  it('should return correct display name based on locale', async () => {
    const dossier = await database.write(async () => {
      return await database.get<Dossier>('dossiers').create(d => {
        d.serverId = 'test-uuid-123';
        d.dossierType = 'country';
        d.nameEn = 'Saudi Arabia';
        d.nameAr = 'المملكة العربية السعودية';
        d.status = 'active';
        d.version = 1;
        d.lastModified = Date.now();
        d.isDeleted = false;
      });
    });

    // Mock i18n language
    jest.mock('react-i18next', () => ({
      useTranslation: () => ({
        i18n: { language: 'ar' },
      }),
    }));

    expect(dossier.displayName).toBe('المملكة العربية السعودية');
  });

  it('should detect stale data correctly', async () => {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);

    const freshDossier = await database.write(async () => {
      return await database.get<Dossier>('dossiers').create(d => {
        d.serverId = 'fresh-123';
        d.dossierType = 'country';
        d.nameEn = 'Fresh Dossier';
        d.nameAr = 'ملف جديد';
        d.status = 'active';
        d.version = 1;
        d.lastModified = Date.now();
        d.syncedAt = oneDayAgo; // Synced 1 day ago
        d.isDeleted = false;
      });
    });

    const staleDossier = await database.write(async () => {
      return await database.get<Dossier>('dossiers').create(d => {
        d.serverId = 'stale-456';
        d.dossierType = 'country';
        d.nameEn = 'Stale Dossier';
        d.nameAr = 'ملف قديم';
        d.status = 'active';
        d.version = 1;
        d.lastModified = Date.now();
        d.syncedAt = twoDaysAgo; // Synced 2 days ago
        d.isDeleted = false;
      });
    });

    expect(freshDossier.isStale).toBe(false);
    expect(staleDossier.isStale).toBe(true);
  });
});
```

## Next Steps

1. **Generate API Contracts** (`contracts/sync-api.md`, `contracts/notifications.md`, `contracts/biometric.md`)
2. **Create Quickstart Guide** (`quickstart.md`) with Expo development setup
3. **Update Agent Context** (run `.specify/scripts/bash/update-agent-context.sh claude`)
4. **Implement Sync Service** (use incremental sync pattern from research.md)
5. **Build UI Components** (React Native Paper with Gusto theme from research.md)
6. **Set Up Testing** (Jest + RNTL for unit tests, Maestro for E2E)

## References

- [WatermelonDB Documentation](https://watermelondb.dev/docs)
- [WatermelonDB Schema API](https://watermelondb.dev/docs/Schema)
- [WatermelonDB Sync Protocol](https://watermelondb.dev/docs/Sync/Intro)
- [React Native Paper Theming](https://callstack.github.io/react-native-paper/docs/guides/theming)
- Feature Specification: `specs/021-apply-gusto-design/spec.md`
- Research Findings: `specs/021-apply-gusto-design/research.md`
