# Modern Navigation System

A complete, production-ready navigation design system built with React 19, TypeScript, Tailwind CSS, and shadcn/ui components. Inspired by Material Design 3 Navigation Rail patterns and modern dashboard interfaces.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Components](#components)
- [Usage](#usage)
- [Theming](#theming)
- [Responsive Design](#responsive-design)
- [RTL Support](#rtl-support)
- [Customization](#customization)
- [Demo](#demo)

## 🎯 Overview

This navigation system implements a modern 3-column layout pattern:

1. **Icon Rail** (56px) - Vertical navigation with icon-only buttons
2. **Expanded Panel** (280px) - Detailed navigation with user profile, projects, status, history, and documents
3. **Content Area** (flexible) - Main application content

The system is fully responsive, supports dark/light modes, includes complete RTL support for Arabic, and features smooth animations throughout.

## ✨ Features

### Navigation
- ✅ Material Design 3 Navigation Rail (56px width)
- ✅ Collapsible expanded panel (280px width)
- ✅ Mobile hamburger menu with overlay
- ✅ Active state indicators (green vertical bar on icon rail)
- ✅ Tooltips on icon buttons (200ms delay)
- ✅ Badge support for notification counts

### User Experience
- ✅ Animated metric counters with ease-out cubic easing
- ✅ Trend indicators (up/down/neutral with arrows)
- ✅ Tabbed interfaces with active underline indicators
- ✅ Collapsible document tree with nested folders
- ✅ Search functionality in documents and tabs
- ✅ Smooth transitions and hover states

### Technical
- ✅ Full TypeScript support with strict typing
- ✅ Mobile-first responsive design (320px → 2560px)
- ✅ Complete RTL support using logical properties
- ✅ Dark/Light mode via CSS custom properties
- ✅ Accessibility compliant (WCAG AA)
- ✅ 60fps animations using requestAnimationFrame
- ✅ Touch-friendly (44x44px minimum touch targets)

## 🏗️ Architecture

```
modern-nav/
├── IconRail/                 # 56px vertical navigation
│   ├── IconButton.tsx       # Icon button with tooltip
│   ├── IconRail.tsx         # Icon rail container
│   └── index.ts
├── ExpandedPanel/           # 280px detailed navigation
│   ├── UserProfile.tsx      # User avatar + dropdown
│   ├── ProjectList.tsx      # Projects with badges
│   ├── StatusList.tsx       # Status items (New, Updates, etc.)
│   ├── HistoryList.tsx      # Recently Edited, Archive
│   ├── DocumentTree.tsx     # Collapsible nested folders
│   ├── ExpandedPanel.tsx    # Panel container
│   └── index.ts
├── Dashboard/               # Dashboard components
│   ├── MetricCard.tsx       # Animated metric display
│   ├── ExecutionsTabs.tsx   # Tabbed interface with search
│   └── index.ts
├── NavigationShell/         # Layout container
│   ├── NavigationShell.tsx  # 3-column layout
│   └── index.ts
├── README.md                # This file
└── index.ts                 # Main module exports
```

## 🧩 Components

### NavigationShell

The main container component that orchestrates the 3-column layout.

```tsx
import { NavigationShell } from '@/components/modern-nav';

function App() {
  return (
    <NavigationShell
      userName="John Doe"
      userEmail="user@example.com"
      onLogout={handleLogout}
      defaultPanelOpen={true}
    >
      <YourContentHere />
    </NavigationShell>
  );
}
```

**Props:**
- `userName?: string` - User's display name
- `userEmail?: string` - User's email address
- `userAvatar?: string` - User avatar URL
- `onLogout?: () => void` - Logout callback
- `children: ReactNode` - Content to render
- `iconRailItems?: IconRailItem[]` - Custom icon rail items
- `defaultPanelOpen?: boolean` - Initial panel state (default: true)
- `className?: string` - Custom CSS classes

### IconRail

Vertical navigation with icon-only buttons. Hidden on mobile, visible on tablet+.

```tsx
import { IconRail } from '@/components/modern-nav';
import { Home, Globe2, FileText } from 'lucide-react';

const items = [
  { id: 'dashboard', icon: Home, tooltipKey: 'Dashboard', path: '/dashboard' },
  { id: 'countries', icon: Globe2, tooltipKey: 'Countries', path: '/countries' },
  { id: 'reports', icon: FileText, tooltipKey: 'Reports', path: '/reports' },
];

<IconRail items={items} onTogglePanel={togglePanel} />
```

### ExpandedPanel

Detailed navigation panel with all sections. Collapsible on desktop, overlay on mobile.

```tsx
import { ExpandedPanel } from '@/components/modern-nav';

<ExpandedPanel
  isOpen={isPanelOpen}
  userName="John Doe"
  userEmail="user@example.com"
  onLogout={handleLogout}
/>
```

### MetricCard

Animated metric display with trend indicators.

```tsx
import { MetricCard } from '@/components/modern-nav';

<MetricCard
  label="Executions"
  value={340}
  trend={{ value: 23, direction: 'up' }}
  linkText="See Report"
  onLinkClick={() => navigate('/reports')}
  animationDuration={1500}
/>
```

**Trend Directions:**
- `up` - Green arrow up, positive indicator
- `down` - Orange/red arrow down, negative indicator
- `neutral` - Gray arrow right, no change

### ExecutionsTabs

Tabbed interface with search functionality.

```tsx
import { ExecutionsTabs } from '@/components/modern-nav';

<ExecutionsTabs title="Executions" />
```

### DocumentTree

Collapsible document tree with nested folders.

```tsx
import { DocumentTree } from '@/components/modern-nav';

const folders = [
  {
    id: 'system',
    label: "System Management's",
    count: 12,
    children: [
      {
        id: '2025',
        label: "2025 Update's",
        count: 2,
        children: [
          { id: 'hiring', label: 'Hiring Process', count: 4 },
        ],
      },
    ],
  },
];

<DocumentTree folders={folders} showSearch />
```

## 📖 Usage

### Basic Integration

1. **Import the NavigationShell:**

```tsx
import { NavigationShell } from '@/components/modern-nav';
```

2. **Wrap your content:**

```tsx
function App() {
  return (
    <NavigationShell
      userName="John Doe"
      userEmail="user@example.com"
      onLogout={() => console.log('Logout')}
    >
      <YourRouterOrContent />
    </NavigationShell>
  );
}
```

3. **Access the demo page:**

Navigate to `/modern-nav-demo` to see all components in action.

### Custom Icon Rail Items

```tsx
import { Home, Settings, Users, FileText } from 'lucide-react';

const customItems = [
  { id: 'home', icon: Home, tooltipKey: 'Home', path: '/' },
  { id: 'users', icon: Users, tooltipKey: 'Users', path: '/users', badge: 5 },
  { id: 'documents', icon: FileText, tooltipKey: 'Documents', path: '/documents' },
  { id: 'settings', icon: Settings, tooltipKey: 'Settings', path: '/settings' },
];

<NavigationShell iconRailItems={customItems}>
  {/* content */}
</NavigationShell>
```

### Individual Component Usage

You can also use components individually:

```tsx
import {
  MetricCard,
  ExecutionsTabs,
  DocumentTree,
} from '@/components/modern-nav';

function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MetricCard
        label="Total Users"
        value={1250}
        trend={{ value: 12, direction: 'up' }}
      />
      <ExecutionsTabs />
      <div className="lg:col-span-2">
        <DocumentTree showSearch />
      </div>
    </div>
  );
}
```

## 🎨 Theming

The navigation system uses CSS custom properties for theming, defined in `/frontend/src/styles/modern-nav-tokens.css`.

### Design Tokens

```css
/* Icon Rail Colors - Dark Mode */
--icon-rail-bg: hsl(220 15% 10%);              /* #1A1D26 */
--icon-rail-hover: hsl(220 15% 15%);           /* #23262F */
--icon-rail-active-indicator: hsl(139 53% 43%); /* #3BAA75 - Green */
--icon-rail-icon: hsl(220 10% 70%);            /* #B3B8C2 */
--icon-rail-icon-active: hsl(0 0% 100%);       /* #FFFFFF */

/* Panel Colors - Light Mode */
--panel-bg: hsl(240 10% 97%);                  /* #F7F9FA */
--panel-hover: hsl(240 10% 95%);               /* #F1F3F5 */
--panel-border: hsl(240 10% 90%);              /* #E5E7EB */
--panel-text: hsl(220 15% 20%);                /* #2C3138 */
--panel-text-muted: hsl(220 10% 50%);          /* #737A85 */
--panel-active-text: hsl(139 53% 43%);         /* #3BAA75 */

/* Badge Colors */
--badge-bg: hsl(220 13% 91%);                  /* #E5E7EB */
--badge-text: hsl(220 15% 30%);                /* #3F4654 */
--badge-primary: hsl(212 95% 51%);             /* #0A7FE5 - Blue */

/* Content Colors */
--content-bg: hsl(0 0% 100%);                  /* #FFFFFF */
--content-border: hsl(240 10% 90%);            /* #E5E7EB */
--content-text: hsl(220 15% 20%);              /* #2C3138 */
--content-text-muted: hsl(220 10% 50%);        /* #737A85 */

/* Indicator Colors */
--success-indicator: hsl(139 53% 43%);         /* #3BAA75 - Green */
--warning-indicator: hsl(35 91% 55%);          /* #F59E0B - Orange */

/* Spacing */
--icon-rail-width: 56px;
--panel-width: 280px;
--icon-size: 24px;
```

### Dark Mode Support

The system supports dark mode through CSS custom properties. To implement dark mode:

1. **Add dark mode variants to tokens:**

```css
@media (prefers-color-scheme: dark) {
  :root {
    --content-bg: hsl(220 15% 10%);
    --content-text: hsl(0 0% 100%);
    /* ... other dark mode colors */
  }
}
```

2. **Or use class-based approach:**

```css
.dark {
  --content-bg: hsl(220 15% 10%);
  --content-text: hsl(0 0% 100%);
  /* ... other dark mode colors */
}
```

### Custom Colors

To customize colors, override the CSS custom properties:

```css
/* In your custom CSS file */
:root {
  --icon-rail-active-indicator: hsl(212 95% 51%); /* Change to blue */
  --panel-active-text: hsl(212 95% 51%);
}
```

## 📱 Responsive Design

The navigation system is fully responsive with mobile-first approach:

### Breakpoints

- **Mobile** (<768px): Hamburger menu, full-screen overlay
- **Tablet** (768-1024px): Icon rail visible, panel collapsed by default
- **Desktop** (>1024px): Full 3-column layout, panel open by default

### Responsive Patterns

All components use mobile-first Tailwind utilities:

```tsx
// Base (mobile) → sm → md → lg → xl → 2xl
className="px-4 sm:px-6 lg:px-8"
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
className="text-sm sm:text-base md:text-lg"
className="gap-4 sm:gap-6 lg:gap-8"
```

### Touch Targets

All interactive elements meet WCAG AA guidelines:
- Minimum 44x44px touch targets
- 8px minimum spacing between elements
- Clear visual feedback on hover/active

## 🌍 RTL Support

Complete right-to-left (RTL) support for Arabic language using logical properties.

### RTL Detection

```tsx
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
const isRTL = i18n.language === 'ar';
```

### Logical Properties

**Never use:** `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`

**Always use:** `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`

```tsx
// ❌ Wrong
<div className="ml-4 pl-2 text-left" />

// ✅ Correct
<div className="ms-4 ps-2 text-start" />
```

### Directional Icons

Icons that indicate direction must be flipped in RTL:

```tsx
<ChevronRight className={isRTL ? 'rotate-180' : ''} />
<ArrowRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
```

### RTL Container

Set `dir` attribute on containers:

```tsx
<div dir={isRTL ? 'rtl' : 'ltr'}>
  {/* content */}
</div>
```

## 🔧 Customization

### Custom Icon Rail Items

```tsx
import { IconRailItem } from '@/components/modern-nav';

const customItems: IconRailItem[] = [
  {
    id: 'custom',
    icon: YourIcon,
    tooltipKey: 'Your Tooltip',
    path: '/custom-path',
    badge: 5,
  },
];
```

### Custom Document Folders

```tsx
import { DocumentFolder } from '@/components/modern-nav';

const customFolders: DocumentFolder[] = [
  {
    id: 'root',
    label: 'Root Folder',
    count: 10,
    children: [
      {
        id: 'child',
        label: 'Child Folder',
        count: 5,
      },
    ],
  },
];

<DocumentTree folders={customFolders} showSearch />
```

### Custom Metric Cards

```tsx
<MetricCard
  label="Custom Metric"
  value={999}
  trend={{ value: 15, direction: 'up' }}
  linkText="Custom Link"
  onLinkClick={() => handleClick()}
  animationDuration={2000}
  className="custom-class"
/>
```

### Custom Styling

Override component styles using Tailwind utilities:

```tsx
<NavigationShell className="custom-nav">
  <MetricCard className="bg-blue-500" />
</NavigationShell>
```

Or use CSS custom properties:

```css
.custom-nav {
  --icon-rail-bg: hsl(212 95% 51%);
  --panel-bg: hsl(220 20% 98%);
}
```

## 🎬 Demo

### Access the Demo Page

Navigate to `/modern-nav-demo` in your application to see the complete navigation system in action.

**Demo URL:** `http://localhost:3002/modern-nav-demo`

### What's Included in Demo

1. **Full 3-column layout**
   - Icon rail with all navigation items
   - Expanded panel with user profile, projects, status, history, documents
   - Content area with dashboard metrics

2. **Interactive components**
   - Animated metric cards (340, 12, 24)
   - Trend indicators (+23%, +8%, 2%)
   - Tabbed interface (Workflows, Permissions, Members)
   - Collapsible document tree

3. **Testing guides**
   - Responsive testing instructions
   - RTL testing guide
   - Dark mode testing steps

### Screenshots

**Desktop (1440px):**
- Full 3-column layout visible
- Icon rail on left (56px)
- Expanded panel in middle (280px)
- Content area on right

**Tablet (768px):**
- Icon rail visible
- Panel collapsed
- Content full width

**Mobile (375px):**
- Hamburger menu button
- Full-screen overlay for navigation
- Content occupies full screen

## 📝 License

Part of the Intl-DossierV2.0 project. See project root for license information.

## 🤝 Contributing

This is an internal component library. For modifications or improvements, please follow the project's contribution guidelines.

## 📞 Support

For issues or questions about the modern navigation system, please:
1. Check this documentation
2. Review the demo page at `/modern-nav-demo`
3. Inspect the component source code in `/frontend/src/components/modern-nav/`
4. Contact the development team

---

**Version:** 1.0.0
**Last Updated:** 2025-01-24
**Built with:** React 19, TypeScript 5.8+, Tailwind CSS, shadcn/ui
