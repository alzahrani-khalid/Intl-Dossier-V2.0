# Contact Relationships & Organizations - Usage Guide

## Quick Start

### 1. Creating a Relationship

```tsx
import { useCreateRelationship } from '@/hooks/useContactRelationships';

function MyComponent() {
  const createMutation = useCreateRelationship();

  const handleCreate = () => {
    createMutation.mutate({
      from_contact_id: 'contact-1-id',
      to_contact_id: 'contact-2-id',
      relationship_type: 'collaborates_with',
      notes: 'Works together on Project X',
      start_date: '2025-01-01',
    });
  };

  return <button onClick={handleCreate}>Create Relationship</button>;
}
```

### 2. Displaying Relationships

```tsx
import { useRelationships } from '@/hooks/useContactRelationships';
import { RelationshipGraph } from '@/components/relationships/RelationshipGraph';

function ContactNetworkView({ contactId }: { contactId: string }) {
  const { data: relationships = [], isLoading } = useRelationships(contactId);
  const { data: contact } = useContact(contactId);

  return (
    <RelationshipGraph
      contactId={contactId}
      relationships={relationships}
      contacts={[contact, ...relatedContacts]}
      isLoading={isLoading}
      height={500}
      onContactClick={(id) => navigate(`/contacts/${id}`)}
    />
  );
}
```

### 3. Relationship Form

```tsx
import { RelationshipForm } from '@/components/relationships/RelationshipForm';

function AddRelationshipDialog({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
        </DialogHeader>
        <RelationshipForm
          fromContactId={contactId}
          availableContacts={contacts}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### 4. Grouped Contact List

```tsx
import { ContactListGrouped } from '@/components/contacts/ContactList';

function OrganizationView() {
  const { data: contacts = [] } = useContacts();
  const { data: tags = [] } = useTags();

  return (
    <ContactListGrouped
      contacts={contacts}
      tags={tags}
      onContactClick={(contact) => navigate(`/contacts/${contact.id}`)}
    />
  );
}
```

## API Reference

### Hooks

#### `useRelationships(contactId: string)`

Fetches all relationships for a contact.

**Returns**:

```ts
{
  data: RelationshipResponse[];
  isLoading: boolean;
  error: RelationshipAPIError | null;
}
```

#### `useRelationshipStats(contactId: string)`

Gets relationship count statistics by type.

**Returns**:

```ts
{
  data: {
    total: number;
    by_type: Record<RelationshipType, number>;
  }
  isLoading: boolean;
}
```

#### `useCreateRelationship()`

Creates a new relationship.

**Returns**:

```ts
{
  mutate: (input: CreateRelationshipInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  error: RelationshipAPIError | null;
}
```

#### `useDeleteRelationship()`

Deletes a relationship with optimistic updates.

**Returns**:

```ts
{
  mutate: (relationshipId: string) => void;
  isPending: boolean;
}
```

### Components

#### `<RelationshipGraph />`

**Props**:

```ts
{
  contactId: string;              // Center contact
  relationships: RelationshipResponse[];
  contacts: Contact[];            // All contacts in network
  onContactClick?: (id: string) => void;
  onRelationshipClick?: (id: string) => void;
  isLoading?: boolean;
  height?: string | number;       // Default: 500
  className?: string;
}
```

**Features**:

- Circular layout
- RTL-aware
- Zoom/pan controls
- Animated edges
- Color-coded by type

#### `<RelationshipForm />`

**Props**:

```ts
{
  fromContactId: string;
  toContactId?: string;          // Optional pre-selection
  availableContacts?: Array<{
    id: string;
    full_name: string;
  }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**Features**:

- 5 relationship types
- Date range support
- Notes field
- Form validation
- Mobile-first layout

#### `<ContactListGrouped />`

**Props**:

```ts
{
  contacts: ContactResponse[];
  tags?: Array<{ id: string; name: string; color?: string }>;
  onContactClick?: (contact: ContactResponse) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
}
```

**Features**:

- Groups by organization
- Collapsible sections
- Contact count badges
- Alphabetically sorted
- "No Organization" at end

## Types

### Relationship Types

```ts
type RelationshipType =
  | 'reports_to' // Hierarchical reporting
  | 'collaborates_with' // Working together
  | 'partner' // Business partnership
  | 'colleague' // Same organization
  | 'other'; // Other relationship
```

### CreateRelationshipInput

```ts
interface CreateRelationshipInput {
  from_contact_id: string;
  to_contact_id: string;
  relationship_type: RelationshipType;
  notes?: string;
  start_date?: string; // ISO 8601 format
  end_date?: string; // ISO 8601 format
}
```

### RelationshipResponse

```ts
interface RelationshipResponse {
  id: string;
  from_contact_id: string;
  to_contact_id: string;
  relationship_type: RelationshipType;
  notes?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  from_contact?: {
    id: string;
    full_name: string;
    position?: string;
    organization_id?: string;
  };
  to_contact?: {
    id: string;
    full_name: string;
    position?: string;
    organization_id?: string;
  };
}
```

## Styling

### Relationship Colors

Use these colors for consistency:

```ts
const RELATIONSHIP_COLORS = {
  reports_to: '#ef4444', // red
  collaborates_with: '#3b82f6', // blue
  partner: '#10b981', // green
  colleague: '#f59e0b', // amber
  other: '#6b7280', // gray
};
```

### Mobile-First Classes

```tsx
// Buttons
className = 'h-11 sm:h-10'; // 44px mobile → 40px desktop

// Layout
className = 'flex-col sm:flex-row'; // Stack mobile → Row desktop
className = 'gap-4 sm:gap-6'; // Progressive spacing

// Grid
className = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

// Text
className = 'text-sm sm:text-base';
```

### RTL Support

```tsx
// Always use logical properties
className="ms-2"    // NOT ml-2
className="me-2"    // NOT mr-2
className="ps-4"    // NOT pl-4
className="pe-4"    // NOT pr-4
className="text-start"  // NOT text-left
className="text-end"    // NOT text-right

// Detect RTL
const { i18n } = useTranslation();
const isRTL = i18n.language === 'ar';

// Apply direction
<div dir={isRTL ? 'rtl' : 'ltr'}>

// Flip icons
<ChevronRight className={isRTL ? 'rotate-180' : ''} />
```

## Error Handling

```tsx
import { RelationshipAPIError } from '@/services/contact-relationship-api';

try {
  const relationship = await createRelationship(input);
} catch (error) {
  if (error instanceof RelationshipAPIError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Details:', error.details);
  }
}
```

## Performance Tips

1. **Use Virtualization**: For large contact lists, use `ContactList` (virtualized) instead of `ContactListGrid`

2. **Optimize Queries**: Relationships are cached automatically by TanStack Query

3. **Lazy Load Graph**: Only load RelationshipGraph when dialog opens

4. **Memoize Grouped Data**: ContactListGrouped uses `useMemo` internally

5. **Debounce Search**: When filtering contacts, debounce input to reduce API calls

## Common Patterns

### Adding Relationship from Contact Card

```tsx
<ContactCard
  contact={contact}
  onRelationshipAdd={() => {
    setSelectedContact(contact);
    setShowRelationshipDialog(true);
  }}
/>
```

### Filtering by Relationship Type

```tsx
const collaborators = relationships.filter((r) => r.relationship_type === 'collaborates_with');
```

### Calculating Network Size

```tsx
const { data: stats } = useRelationshipStats(contactId);
const networkSize = stats?.total || 0;
```

### Viewing Two-Hop Network

```tsx
// Get contact's relationships
const { data: firstHop } = useRelationships(contactId);

// Get relationships of connected contacts
const secondHopQueries = firstHop.map((rel) => useRelationships(rel.to_contact_id));
```

## Troubleshooting

### Graph Not Rendering

- Check if `@xyflow/react` is installed
- Ensure container has explicit height
- Verify relationships array is not empty
- Check browser console for errors

### Optimistic Update Not Working

- Ensure queryClient is properly configured
- Check that contact IDs are valid
- Verify cache keys match

### RTL Issues

- Always use logical properties
- Test in Arabic language mode
- Verify `dir` attribute is set
- Check icon rotation

### Mobile Layout Problems

- Start with mobile styles (no breakpoint)
- Add progressive breakpoints
- Test on 375px viewport
- Use touch-friendly sizes (44px minimum)

## Examples

See implementation examples in:

- `/frontend/src/pages/contacts/ContactDetails.tsx` - Full integration
- `/frontend/src/components/relationships/RelationshipGraph.tsx` - Network visualization
- `/frontend/src/components/relationships/RelationshipForm.tsx` - Form handling
- `/frontend/src/components/contacts/ContactList.tsx` - Grouped view

## Support

For questions or issues:

1. Check this usage guide
2. Review CONTACT_RELATIONSHIPS_IMPLEMENTATION.md
3. Examine existing component implementations
4. Consult project CLAUDE.md for mobile-first/RTL requirements
