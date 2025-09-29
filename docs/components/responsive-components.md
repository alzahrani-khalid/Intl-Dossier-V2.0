# Responsive Components Usage Guide

## Table of Contents
1. [ResponsiveCard](#responsivecard)
2. [ResponsiveTable](#responsivetable)
3. [ResponsiveNav](#responsivenav)
4. [ValidationBadge](#validationbadge)
5. [ResponsiveWrapper HOC](#responsivewrapper-hoc)
6. [Utility Components](#utility-components)

---

## ResponsiveCard

### Overview
A flexible card component that adapts its layout and content based on viewport size, with support for progressive disclosure on mobile devices.

### Import
```typescript
import { ResponsiveCard, ResponsiveCardGrid } from '@/components/responsive/responsive-card';
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `ReactNode` | - | Card title |
| `description` | `ReactNode` | - | Card description |
| `children` | `ReactNode` | - | Card content |
| `footer` | `ReactNode` | - | Card footer content |
| `className` | `string` | - | Additional CSS classes |
| `collapsible` | `boolean` | `false` | Enable collapse on mobile |
| `defaultCollapsed` | `boolean` | `false` | Initial collapsed state |
| `priority` | `'high' \| 'medium' \| 'low'` | `'medium'` | Visual priority |
| `showOnMobile` | `boolean` | `true` | Show card on mobile |
| `mobileLayout` | `'stack' \| 'inline'` | `'stack'` | Mobile content layout |

### Examples

#### Basic Card
```tsx
<ResponsiveCard 
  title="Statistics" 
  description="Monthly performance metrics"
>
  <div className="grid grid-cols-2 gap-4">
    <Stat label="Users" value="1,234" />
    <Stat label="Revenue" value="$45,678" />
  </div>
</ResponsiveCard>
```

#### Collapsible Card (Mobile)
```tsx
<ResponsiveCard 
  title="Detailed Report"
  collapsible={true}
  defaultCollapsed={true}
  priority="low"
>
  <ReportContent />
</ResponsiveCard>
```

#### Card Grid
```tsx
<ResponsiveCardGrid 
  columns={{ mobile: 1, tablet: 2, desktop: 3, wide: 4 }}
  gap="md"
>
  <ResponsiveCard title="Card 1">Content 1</ResponsiveCard>
  <ResponsiveCard title="Card 2">Content 2</ResponsiveCard>
  <ResponsiveCard title="Card 3">Content 3</ResponsiveCard>
</ResponsiveCardGrid>
```

#### With Footer Actions
```tsx
<ResponsiveCard 
  title="User Profile"
  footer={
    <div className="flex gap-2">
      <Button variant="outline" size="sm">Cancel</Button>
      <Button size="sm">Save</Button>
    </div>
  }
>
  <ProfileForm />
</ResponsiveCard>
```

---

## ResponsiveTable

### Overview
A table component that automatically transforms into cards or lists on mobile devices for better readability.

### Import
```typescript
import { ResponsiveTable, ResponsiveDataGrid } from '@/components/responsive/responsive-table';
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | - | Array of data items |
| `columns` | `ResponsiveTableColumn<T>[]` | - | Column configuration |
| `className` | `string` | - | Additional CSS classes |
| `mobileView` | `'card' \| 'list' \| 'table'` | `'card'` | Mobile display mode |
| `striped` | `boolean` | `false` | Striped rows |
| `hoverable` | `boolean` | `true` | Hover effects |
| `emptyMessage` | `string` | `'No data available'` | Empty state message |

### Column Configuration
```typescript
interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  accessor: (item: T) => ReactNode;
  priority?: 'high' | 'medium' | 'low';
  hideOnMobile?: boolean;
  mobileLabel?: string;
  align?: 'left' | 'center' | 'right';
}
```

### Examples

#### Basic Table
```tsx
const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
];

const columns = [
  {
    key: 'name',
    header: 'Name',
    accessor: (user) => user.name,
    priority: 'high'
  },
  {
    key: 'email',
    header: 'Email',
    accessor: (user) => user.email,
    hideOnMobile: true
  },
  {
    key: 'role',
    header: 'Role',
    accessor: (user) => <Badge>{user.role}</Badge>
  }
];

<ResponsiveTable 
  data={data} 
  columns={columns}
  mobileView="card"
/>
```

#### With Custom Mobile Labels
```tsx
const columns = [
  {
    key: 'amount',
    header: 'Transaction Amount',
    mobileLabel: 'Amount', // Shorter label for mobile
    accessor: (item) => `$${item.amount.toFixed(2)}`,
    align: 'right'
  }
];
```

#### List View on Mobile
```tsx
<ResponsiveTable 
  data={products} 
  columns={productColumns}
  mobileView="list"
  striped={true}
/>
```

---

## ResponsiveNav

### Overview
Navigation component with automatic mobile menu transformation and progressive disclosure.

### Import
```typescript
import { ResponsiveNav } from '@/components/responsive/responsive-nav';
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `NavItem[]` | - | Navigation items |
| `logo` | `ReactNode` | - | Logo component |
| `actions` | `ReactNode` | - | Action buttons |
| `className` | `string` | - | Additional CSS classes |
| `mobileBreakpoint` | `'sm' \| 'md' \| 'lg'` | `'md'` | Mobile menu breakpoint |
| `position` | `'top' \| 'bottom'` | `'top'` | Navigation position |

### NavItem Structure
```typescript
interface NavItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  badge?: string | number;
  children?: NavItem[];
  priority?: 'high' | 'medium' | 'low';
  hideOnMobile?: boolean;
}
```

### Examples

#### Basic Navigation
```tsx
const navItems = [
  { id: 'home', label: 'Home', href: '/', priority: 'high' },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'settings', label: 'Settings', href: '/settings', hideOnMobile: true }
];

<ResponsiveNav 
  items={navItems}
  logo={<Logo />}
  actions={<UserMenu />}
/>
```

#### With Icons and Badges
```tsx
const navItems = [
  { 
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="h-4 w-4" />,
    badge: 5,
    priority: 'high'
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: <Mail className="h-4 w-4" />,
    badge: 'New'
  }
];
```

#### Nested Navigation
```tsx
const navItems = [
  {
    id: 'products',
    label: 'Products',
    children: [
      { id: 'all', label: 'All Products', href: '/products' },
      { id: 'featured', label: 'Featured', href: '/products/featured' }
    ]
  }
];
```

#### Bottom Navigation (Mobile)
```tsx
<ResponsiveNav 
  items={bottomNavItems}
  position="bottom"
  mobileBreakpoint="lg"
/>
```

---

## ValidationBadge

### Overview
Visual indicator for component compliance status during development.

### Import
```typescript
import { ValidationBadge, ValidationSummary } from '@/components/validation/validation-badge';
```

### Props

#### ValidationBadge
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `componentName` | `string` | - | Component to validate |
| `showDetails` | `boolean` | `false` | Show error details |
| `className` | `string` | - | Additional CSS classes |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Badge size |
| `position` | `'inline' \| 'floating'` | `'inline'` | Badge position |

#### ValidationSummary
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `componentNames` | `string[]` | - | Components to summarize |
| `className` | `string` | - | Additional CSS classes |

### Examples

#### Basic Validation Badge
```tsx
<div className="relative">
  <MyComponent />
  <ValidationBadge 
    componentName="MyComponent" 
    position="floating"
  />
</div>
```

#### With Error Details
```tsx
<ValidationBadge 
  componentName="DataTable"
  showDetails={true}
  size="md"
/>
```

#### Validation Summary
```tsx
<ValidationSummary 
  componentNames={['Card', 'Table', 'Nav', 'Form']}
  className="mb-4"
/>
```

---

## ResponsiveWrapper HOC

### Overview
Higher-Order Component for adding responsive behavior to any component.

### Import
```typescript
import { withResponsive } from '@/components/responsive/responsive-wrapper';
```

### Usage
```typescript
const ResponsiveMyComponent = withResponsive(MyComponent, {
  componentName: 'MyComponent',
  validateCompliance: true,
  supportRTL: true,
  hideOn: ['mobile'],
  className: {
    mobile: 'p-2',
    tablet: 'p-4',
    desktop: 'p-6'
  }
});
```

### Options
| Option | Type | Description |
|--------|------|-------------|
| `componentName` | `string` | Component name for validation |
| `validateCompliance` | `boolean` | Enable validation |
| `mobileFirst` | `boolean` | Mobile-first approach |
| `supportRTL` | `boolean` | RTL support |
| `hideOn` | `Viewport[]` | Hide on viewports |
| `showOnly` | `Viewport[]` | Show only on viewports |
| `className` | `Record<Viewport, string>` | Viewport-specific classes |

### Examples

#### Make Component Responsive
```tsx
const ResponsiveChart = withResponsive(Chart, {
  componentName: 'Chart',
  hideOn: ['mobile'],
  className: {
    tablet: 'h-64',
    desktop: 'h-96',
    wide: 'h-[32rem]'
  }
});
```

#### Conditional Rendering
```tsx
const MobileOnlyAlert = withResponsive(Alert, {
  componentName: 'MobileAlert',
  showOnly: ['mobile', 'tablet']
});
```

---

## Utility Components

### ResponsiveContainer
Responsive container with max-width constraints.

```tsx
<ResponsiveContainer 
  maxWidth="lg" 
  padding="md"
  fluid={false}
>
  <Content />
</ResponsiveContainer>
```

### ConditionalWrapper
Conditionally wrap content based on viewport.

```tsx
<ConditionalWrapper
  condition="mobile"
  wrapper={children => <Card>{children}</Card>}
>
  <Content />
</ConditionalWrapper>
```

### ProgressiveDisclosure
Show summary on mobile with expandable details.

```tsx
<ProgressiveDisclosure
  summary={<h3>Quick Stats</h3>}
  details={<DetailedStatistics />}
  defaultOpen={false}
  enableOn={['mobile', 'tablet']}
/>
```

---

## Best Practices

### 1. Mobile-First Approach
Always design for mobile first, then enhance for larger screens:

```tsx
// Good
<div className="p-2 sm:p-4 md:p-6 lg:p-8">

// Avoid
<div className="p-8 sm:p-6 md:p-4 lg:p-2">
```

### 2. Progressive Disclosure
Hide complex details on mobile, show on demand:

```tsx
<ResponsiveCard collapsible={true} defaultCollapsed={true}>
  <ComplexDataVisualization />
</ResponsiveCard>
```

### 3. Priority-Based Content
Mark important content with high priority:

```tsx
const columns = [
  { key: 'name', priority: 'high', hideOnMobile: false },
  { key: 'details', priority: 'low', hideOnMobile: true }
];
```

### 4. Touch-Friendly Interactions
Ensure adequate touch targets on mobile:

```tsx
<Button className="min-h-[44px] min-w-[44px]">
  Tap Me
</Button>
```

### 5. Performance Optimization
Use React.memo for expensive components:

```tsx
const ExpensiveChart = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

const ResponsiveChart = withResponsive(ExpensiveChart, {
  componentName: 'ExpensiveChart'
});
```

### 6. Accessibility
Always provide ARIA labels and keyboard support:

```tsx
<button
  aria-label={isCollapsed ? 'Expand content' : 'Collapse content'}
  aria-expanded={!isCollapsed}
  onClick={toggle}
>
  {isCollapsed ? '▶' : '▼'}
</button>
```

### 7. RTL Support
Use logical properties for bidirectional layouts:

```tsx
// Good - works for both RTL and LTR
<div className="ms-4 me-4">

// Avoid - only works for LTR
<div className="ml-4 mr-4">
```

---

## Common Patterns

### Dashboard Layout
```tsx
<div className="min-h-screen">
  <ResponsiveNav items={navItems} position="top" />
  
  <ResponsiveContainer maxWidth="xl" padding="md">
    <ResponsiveCardGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
      <ResponsiveCard title="Metric 1" priority="high">
        <MetricDisplay />
      </ResponsiveCard>
      {/* More cards... */}
    </ResponsiveCardGrid>
    
    <ResponsiveTable 
      data={tableData} 
      columns={columns}
      mobileView="card"
      className="mt-6"
    />
  </ResponsiveContainer>
</div>
```

### Form Layout
```tsx
<ResponsiveCard title="User Settings">
  <form className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Input label="First Name" />
      <Input label="Last Name" />
    </div>
    
    <ResponsiveTable 
      data={preferences}
      columns={preferenceColumns}
      mobileView="list"
    />
    
    <div className="flex justify-end gap-2">
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </div>
  </form>
</ResponsiveCard>
```

### Data Visualization
```tsx
<ResponsiveCard 
  title="Analytics"
  collapsible={true}
  defaultCollapsed={false}
>
  <ConditionalWrapper
    condition="mobile"
    wrapper={children => (
      <div className="overflow-x-auto">{children}</div>
    )}
  >
    <Chart data={chartData} />
  </ConditionalWrapper>
</ResponsiveCard>
```

---

## Troubleshooting

### Component Not Responsive
```tsx
// Check 1: Ensure wrapped with provider
<DesignComplianceProvider>
  <YourComponent />
</DesignComplianceProvider>

// Check 2: Use responsive classes
<div className="text-sm sm:text-base md:text-lg">

// Check 3: Import responsive hooks
import { useResponsive } from '@/hooks/use-responsive';
```

### Validation Errors
```tsx
// Enable detailed validation
<ValidationBadge 
  componentName="MyComponent"
  showDetails={true}
/>

// Check console for specific errors
console.log('Validation errors:', lastValidation.errors);
```

### Mobile Menu Not Working
```tsx
// Ensure correct breakpoint
<ResponsiveNav 
  items={items}
  mobileBreakpoint="md" // Adjust as needed
/>

// Check z-index for overlays
.mobile-menu {
  z-index: 50; /* Ensure high enough */
}
```

### RTL Layout Issues
```tsx
// Use logical properties
<div className="ps-4 pe-4"> // Not pl-4 pr-4

// Set direction on root
<html dir="rtl" lang="ar">
```

---

*For more information, see the [Responsive Design Documentation](./responsive-design.md)*