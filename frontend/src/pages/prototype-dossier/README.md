# Dossier Prototype Dashboard

## Overview
This is a **prototype** dashboard page that demonstrates a dossier-inspired design using dark sidebar navigation and clean, professional layouts.

## Design Inspiration
- **Visual Style**: Real dossier/folder aesthetic
- **Navigation**: Two-tier sidebar (icon sidebar + content sidebar)
- **Color Scheme**: Black sidebar with white/neutral content area
- **Components**: Built with Kibo UI patterns and shadcn/ui components

## Key Features

### 1. **Dual Sidebar Navigation**
   - **Icon Sidebar** (72px): Dark black background with icon-only navigation
   - **Content Sidebar** (320px): White background with detailed navigation items
   - Collapsible sections with smooth animations
   - Active state indicators

### 2. **Dossier Overview Dashboard**
   - Statistics cards with trend indicators
   - Recent dossiers list with progress tracking
   - Upcoming deadlines panel
   - Classification badges (Confidential, Restricted, Internal)
   - Priority indicators (High, Medium, Low)

### 3. **Professional Design Elements**
   - Clean typography and spacing
   - Subtle shadows and borders
   - Color-coded status indicators
   - Progress bars for tracking
   - Date formatting
   - Expandable menu items

## Components Structure

```
prototype-dossier/
├── DossierSidebar.tsx       # Two-tier navigation sidebar
├── DossierPrototypePage.tsx # Main dashboard page
├── index.ts                 # Exports
└── README.md               # This file
```

## Usage

To view this prototype, add it to your router configuration:

```tsx
import { DossierPrototypePage } from '@/pages/prototype-dossier'

// Add to your routes
{
  path: '/prototype/dossier',
  element: <DossierPrototypePage />
}
```

## Design Patterns Used

### Colors
- **Black** (`bg-black`): Main icon sidebar
- **White** (`bg-white`): Content sidebar and cards
- **Neutral** (`bg-neutral-50/100/200`): Backgrounds, borders, muted elements
- **Semantic Colors**: Green (success), Amber (warning), Red (critical), Blue (info)

### Typography
- **Headings**: Bold, clear hierarchy
- **Body Text**: Medium weight, good contrast
- **Metadata**: Smaller, muted colors

### Spacing
- **Consistent padding**: p-4, p-6, p-8
- **Gap utilities**: gap-2, gap-3, gap-4, gap-6
- **Grid layouts**: Responsive grid-cols-*

## Integration with Existing Pages

This prototype is **completely separate** from existing pages and does not overwrite any current functionality. It can be:
- Used as a reference for design patterns
- Adapted for the main dashboard
- Extended with real data connections
- Modified to match specific requirements

## Next Steps

To integrate this design into your main application:

1. **Connect to Real Data**: Replace mock data with actual API calls
2. **Add Routing**: Implement proper TanStack Router navigation
3. **Add Interactivity**: Wire up click handlers, modals, and forms
4. **Internationalization**: Expand translation keys
5. **Accessibility**: Add ARIA labels and keyboard navigation
6. **Responsive Design**: Optimize for mobile and tablet views
7. **Dark Mode**: Add dark mode support using existing theme system

## Technology Stack

- **React 19**: Modern React with hooks
- **TypeScript**: Strict typing
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built components
- **Kibo UI**: Extended component library
- **Lucide Icons**: Icon library
- **i18next**: Internationalization

## Notes

- This is a **visual prototype** focused on design and layout
- Data is mocked for demonstration purposes
- All components use existing design system tokens
- Follows repository coding standards and naming conventions







