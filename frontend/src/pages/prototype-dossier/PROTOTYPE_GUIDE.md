# Dossier Prototype - Quick Start Guide

## 🎯 Overview

This is a **fully functional prototype** of a dossier-inspired dashboard that demonstrates a professional, document-management aesthetic using Kibo UI components and patterns.

## 🚀 How to Access

### Option 1: Direct URL
Once the dev server is running, navigate to:
```
http://localhost:5173/prototype-dossier
```

### Option 2: Add to Navigation
Add a link to your main navigation component:

```tsx
import { Link } from '@tanstack/react-router'

<Link to="/prototype-dossier">
  Dossier Prototype
</Link>
```

## 🎨 Design Features

### 1. **Two-Tier Sidebar Navigation**

#### Icon Sidebar (Left, 72px)
- **Black background** for professional, serious appearance
- Icon-only navigation for space efficiency
- Hover states with smooth transitions
- Active state highlighting
- Represents main sections:
  - 📊 Dossiers
  - 📥 Inbox
  - 👥 Partners
  - 📚 Documents
  - 📈 Reports (Active)
  - ✈️ Missions
  - 👨‍👩‍👧‍👦 Teams

#### Content Sidebar (Right, 320px)
- **White background** for clean, readable interface
- Detailed navigation with labels and counts
- Expandable/collapsible sections
- Sub-navigation support
- Search-friendly structure

### 2. **Main Content Area**

#### Statistics Dashboard
Four key metric cards displaying:
- **Active Dossiers**: Total count with trend indicator
- **Pending Review**: Items awaiting action
- **Completed This Month**: Monthly progress
- **Team Members**: Active team size

Each card includes:
- Trend indicator (up/down arrows)
- Color-coded change values
- Icon representation
- Clean typography

#### Recent Dossiers List
Comprehensive dossier cards showing:
- **Title & Country**: Clear identification
- **Status Badge**: Current workflow state
  - Under Review (Blue)
  - Negotiation (Amber)
  - Draft (Gray)
- **Priority Badge**: Urgency level
  - High (Red)
  - Medium (Amber)
  - Low (Gray)
- **Progress Bar**: Visual completion indicator
- **Due Date**: Calendar integration
- **Classification Label**: Security level
  - Confidential
  - Restricted
  - Internal

#### Upcoming Deadlines Panel
Prioritized list of critical dates:
- Color-coded left border for visual scanning
- Event type indicators
- Status badges
- Formatted dates
- Compact, scannable layout

### 3. **Classification Footer**
- Dark background (black) for importance
- Amber warning icon
- Bold "CONFIDENTIAL" badge
- Security notice text

## 🎨 Color Palette

### Primary Colors
- **Black** (`#000000`): Icon sidebar, classification footer
- **White** (`#FFFFFF`): Content sidebar, cards
- **Neutral Gray** (`neutral-50` to `neutral-900`): Backgrounds, text, borders

### Semantic Colors
- **Blue** (`blue-*`): Information, links, Under Review status
- **Green** (`green-*`): Success, positive trends, Upcoming status
- **Amber** (`amber-*`): Warnings, Medium priority, Negotiation status
- **Red** (`red-*`): Errors, High priority, Critical status

## 📐 Layout Specifications

### Spacing System
- **Extra Small**: 0.5rem (8px) - gap-2
- **Small**: 0.75rem (12px) - gap-3
- **Medium**: 1rem (16px) - gap-4
- **Large**: 1.5rem (24px) - gap-6
- **Extra Large**: 2rem (32px) - gap-8

### Typography Scale
- **Hero**: 3xl (30px) - Main page titles
- **Heading**: 2xl (24px) - Section titles
- **Subheading**: xl (20px) - Card titles
- **Body**: base (16px) - Regular text
- **Caption**: sm (14px) - Metadata
- **Tiny**: xs (12px) - Labels, badges

### Border Radius
- **Small**: 0.375rem (6px) - Badges
- **Medium**: 0.5rem (8px) - Buttons, inputs
- **Large**: 0.75rem (12px) - Cards
- **Extra Large**: 1rem (16px) - Major containers

## 🔧 Technical Implementation

### Components Used
- **shadcn/ui**: Card, Button, Badge, Progress, ScrollArea, Separator
- **Lucide Icons**: All icons from lucide-react
- **Tailwind CSS**: Utility-first styling
- **React 19**: Latest React features
- **TypeScript**: Full type safety
- **i18next**: Internationalization ready

### File Structure
```
prototype-dossier/
├── DossierSidebar.tsx          # Two-tier navigation component
├── DossierPrototypePage.tsx    # Main dashboard page
├── index.ts                    # Barrel exports
├── README.md                   # Component documentation
└── PROTOTYPE_GUIDE.md          # This guide
```

### Route Configuration
```tsx
// Located at: src/routes/_protected/prototype-dossier.tsx
import { createFileRoute } from '@tanstack/react-router'
import { DossierPrototypePage } from '../../pages/prototype-dossier'

export const Route = createFileRoute('/_protected/prototype-dossier')({
  component: DossierPrototypePage,
})
```

## 🌐 Internationalization

Translation files are located at:
- **English**: `/frontend/public/locales/en/dossier.json`
- **Arabic**: `/frontend/public/locales/ar/dossier.json`

All text is translation-ready using i18next:
```tsx
const { t } = useTranslation()
t('dossier.nav.reports', 'Reports')
```

## 📱 Responsive Behavior

### Desktop (1280px+)
- Full two-tier sidebar visible
- 4-column stats grid
- 2-column layout for dossiers + deadlines

### Tablet (768px - 1279px)
- Collapsible sidebar
- 2-column stats grid
- Single column content

### Mobile (< 768px)
- Hidden sidebar with hamburger menu
- Single column stats
- Stacked content

## 🎯 Use Cases

### 1. **Design Reference**
Use this prototype as a visual guide for:
- Navigation patterns
- Card layouts
- Color schemes
- Typography hierarchy
- Spacing systems

### 2. **Component Extraction**
Individual components can be extracted and reused:
- `DossierSidebar` → Main navigation
- Stats cards → Dashboard widgets
- Dossier cards → List items
- Deadline cards → Alert panels

### 3. **Integration**
Replace mock data with real data sources:

```tsx
// Replace this:
const dossierStats = [...]

// With this:
const { data: dossierStats } = useQuery({
  queryKey: ['dossier-stats'],
  queryFn: fetchDossierStats
})
```

## 🔒 Security Considerations

This prototype demonstrates:
- Classification labels (Confidential, Restricted, Internal)
- Security notices in footer
- Access control placeholders
- Audit trail concepts

**Note**: This is UI only. Implement proper authentication and authorization in production.

## 🚦 Next Steps

### Immediate
1. ✅ View the prototype at `/prototype-dossier`
2. ✅ Explore navigation and interactions
3. ✅ Review component structure

### Short Term
1. Connect to real data APIs
2. Add user authentication checks
3. Implement CRUD operations
4. Add loading states
5. Add error boundaries

### Long Term
1. Replace existing dashboard
2. Extend to mobile app
3. Add advanced filtering
4. Implement real-time updates
5. Add collaborative features

## 📚 Related Documentation

- [Repository Guidelines](../../../CLAUDE.md)
- [Design System](../../DESIGN_SYSTEM.md)
- [Component Inventory](../../COMPONENT_INVENTORY.md)
- [Kibo UI Documentation](https://www.kibo-ui.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## 💡 Tips & Tricks

### Customizing Colors
Edit Tailwind config to match your brand:
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'dossier-dark': '#000000',
      'dossier-light': '#FFFFFF',
      // Add your custom colors
    }
  }
}
```

### Adding New Sections
Extend the sidebar navigation:
```tsx
const mainNavItems = [
  // ... existing items
  {
    id: 'analytics',
    icon: BarChart,
    label: t('dossier.nav.analytics', 'Analytics'),
  }
]
```

### Creating Custom Cards
Follow the pattern:
```tsx
<Card className="border-neutral-200 bg-white">
  <CardHeader className="border-b border-neutral-200">
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardContent className="p-6">
    {content}
  </CardContent>
</Card>
```

## ❓ FAQ

**Q: Can I use this in production?**
A: Yes, but connect to real data sources and add proper authentication first.

**Q: Is this mobile-friendly?**
A: The layout is responsive, but mobile optimization should be enhanced for production.

**Q: Can I modify the colors?**
A: Absolutely! All colors use Tailwind utilities and can be customized.

**Q: Does this support RTL?**
A: The components use logical properties and are RTL-ready with the existing i18n setup.

**Q: How do I add more dossiers?**
A: Replace the `recentDossiers` array with data from your API or state management.

## 🤝 Contributing

To improve this prototype:
1. Follow repository coding standards
2. Maintain TypeScript strict mode
3. Use existing design tokens
4. Add proper translations
5. Document new features

## 📄 License

This prototype is part of the Intl-DossierV2.0 project and follows the same license terms.







