# Dossier Prototype - Component Reference

## Quick Reference for Design Elements

### 🎨 Color Classes

#### Backgrounds
```tsx
// Main containers
bg-black           // Icon sidebar
bg-white          // Content sidebar, cards
bg-neutral-50     // Page background
bg-neutral-100    // Hover states, secondary backgrounds
bg-neutral-900    // Dark hover states

// Status-specific backgrounds
bg-blue-50        // Info/Review states
bg-amber-50       // Warning/Negotiation states
bg-red-50         // High priority states
bg-green-50       // Success/Upcoming states
```

#### Text Colors
```tsx
// Primary text
text-neutral-900  // Headings, important text
text-neutral-600  // Body text
text-neutral-400  // Muted text, icons

// Semantic colors
text-blue-800     // Info text
text-amber-600    // Warning text
text-red-700      // Error/high priority text
text-green-700    // Success text
```

#### Borders
```tsx
// Neutral borders
border-neutral-200   // Default border
border-neutral-300   // Hover border
border-neutral-800   // Dark sidebar border

// Status borders
border-blue-200     // Info
border-amber-200    // Warning
border-red-200      // High priority
border-green-200    // Success
```

### 📐 Layout Patterns

#### Two-Tier Sidebar
```tsx
<div className="flex h-screen">
  {/* Icon Sidebar */}
  <div className="w-[72px] bg-black">
    {/* Icon navigation */}
  </div>
  
  {/* Content Sidebar */}
  <div className="w-[320px] bg-white border-r">
    {/* Detailed navigation */}
  </div>
  
  {/* Main Content */}
  <div className="flex-1 overflow-auto bg-neutral-50">
    {/* Page content */}
  </div>
</div>
```

#### Stat Card
```tsx
<Card className="border-neutral-200 bg-white">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-lg bg-neutral-100">
        <Icon className="h-5 w-5 text-neutral-700" />
      </div>
      <div className="flex items-center gap-1 text-sm font-medium text-green-600">
        <TrendingUp className="h-4 w-4" />
        +4
      </div>
    </div>
    <p className="text-3xl font-bold text-neutral-900">64</p>
    <p className="text-sm text-neutral-600">Active Dossiers</p>
  </CardContent>
</Card>
```

#### Dossier Card
```tsx
<div className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 hover:shadow-sm transition-all">
  {/* Title & Priority */}
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1">
      <h3 className="font-semibold text-neutral-900 mb-1">
        Dossier Title
      </h3>
      <p className="text-sm text-neutral-600">Country</p>
    </div>
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
      High
    </Badge>
  </div>
  
  {/* Progress */}
  <div className="space-y-2 mb-3">
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-600">Progress</span>
      <span className="font-medium text-neutral-900">75%</span>
    </div>
    <Progress value={75} className="h-2" />
  </div>
  
  {/* Footer */}
  <div className="flex items-center justify-between text-sm">
    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
      Under Review
    </Badge>
    <div className="flex items-center gap-4 text-neutral-600">
      <span className="flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        Nov 15, 2025
      </span>
    </div>
  </div>
</div>
```

#### Deadline Card
```tsx
<div className="border-l-4 border-amber-400 bg-amber-50/50 rounded-r-lg p-4">
  <div className="flex items-start justify-between mb-2">
    <h4 className="font-semibold text-neutral-900 text-sm">
      Event Title
    </h4>
    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
      Critical
    </Badge>
  </div>
  <div className="flex items-center gap-2 text-sm text-neutral-600">
    <Calendar className="h-4 w-4" />
    Nov 12, 2025
  </div>
  <p className="text-xs text-neutral-500 mt-2">Deadline</p>
</div>
```

### 🎭 Badge Variants

#### Status Badges
```tsx
// Under Review
<Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
  Under Review
</Badge>

// Negotiation
<Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
  Negotiation
</Badge>

// Draft
<Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-neutral-200">
  Draft
</Badge>

// Critical
<Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
  Critical
</Badge>

// Upcoming
<Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
  Upcoming
</Badge>
```

#### Priority Badges
```tsx
// High Priority
<Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
  High
</Badge>

// Medium Priority
<Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
  Medium
</Badge>

// Low Priority
<Badge variant="outline" className="bg-neutral-50 text-neutral-700 border-neutral-200">
  Low
</Badge>
```

### 🔘 Button Patterns

#### Navigation Button
```tsx
<button className={cn(
  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left',
  isActive
    ? 'bg-neutral-100 text-neutral-900'
    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
)}>
  <div className="flex items-center gap-3 flex-1">
    <Icon className="h-5 w-5" />
    <span className="text-[15px] font-medium">Label</span>
  </div>
  {count && <span className="text-sm text-neutral-400">{count}</span>}
</button>
```

#### Icon Button (Sidebar)
```tsx
<button className={cn(
  'relative flex h-10 w-10 items-center justify-center rounded-md transition-colors',
  isActive
    ? 'bg-neutral-800 text-white'
    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
)}>
  <Icon className="h-5 w-5" />
</button>
```

### 📊 Progress Indicators

#### Linear Progress
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-neutral-600">Progress</span>
    <span className="font-medium text-neutral-900">75%</span>
  </div>
  <Progress value={75} className="h-2" />
</div>
```

### 📈 Trend Indicators

#### Positive Trend
```tsx
<div className="flex items-center gap-1 text-sm font-medium text-green-600">
  <TrendingUp className="h-4 w-4" />
  +4
</div>
```

#### Negative Trend
```tsx
<div className="flex items-center gap-1 text-sm font-medium text-red-600">
  <TrendingDown className="h-4 w-4" />
  -8
</div>
```

### 🎯 Icon Sizes

```tsx
// Extra Small (Navigation, badges)
<Icon className="h-3 w-3" />

// Small (List items, inline)
<Icon className="h-4 w-4" />

// Medium (Buttons, cards)
<Icon className="h-5 w-5" />

// Large (Headers)
<Icon className="h-6 w-6" />

// Extra Large (Hero sections)
<Icon className="h-8 w-8" />
```

### 📱 Responsive Grid Patterns

```tsx
// Stats Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Stat cards */}
</div>

// Two-Column Layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div>
    {/* Sidebar content */}
  </div>
</div>
```

### 🎨 Shadow Utilities

```tsx
// Subtle shadow (cards)
className="shadow-sm"

// Standard shadow (hover states)
className="hover:shadow-sm"

// Medium shadow (elevated elements)
className="shadow-md"
```

### 🔄 Transition Patterns

```tsx
// Standard transition
className="transition-colors"

// All properties
className="transition-all"

// Custom duration
className="transition-all duration-300"
```

### 📝 Typography Scale

```tsx
// Heading hierarchy
<h1 className="text-3xl font-bold text-neutral-900">
<h2 className="text-2xl font-bold text-neutral-900">
<h3 className="text-xl font-semibold text-neutral-900">
<h4 className="text-lg font-semibold text-neutral-900">

// Body text
<p className="text-base text-neutral-600">
<p className="text-sm text-neutral-600">
<p className="text-xs text-neutral-500">

// Font weights
font-bold      // 700 - Headings
font-semibold  // 600 - Subheadings
font-medium    // 500 - Emphasis
font-normal    // 400 - Body
```

### 🌈 Classification Badges

```tsx
// Confidential (Black background)
<Badge variant="outline" className="border-amber-400 text-amber-400">
  CONFIDENTIAL
</Badge>

// Restricted
<Badge variant="outline" className="text-xs">
  Restricted
</Badge>

// Internal
<Badge variant="outline" className="text-xs">
  Internal
</Badge>
```

### 📦 Container Patterns

```tsx
// Page Container
<div className="container mx-auto p-8 max-w-7xl">

// Section Spacing
<div className="space-y-6">

// Card Padding
<CardContent className="p-6">

// Tight Padding
<CardContent className="p-4">
```

## 🎯 Usage Examples

### Complete Navigation Item
```tsx
<button
  onClick={() => setActiveItem(item.id)}
  className={cn(
    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left group',
    activeItem === item.id
      ? 'bg-neutral-100 text-neutral-900'
      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
  )}
>
  <div className="flex items-center gap-3 flex-1">
    <item.icon
      className={cn(
        'h-5 w-5',
        activeItem === item.id ? 'text-neutral-900' : 'text-neutral-400'
      )}
    />
    <span className="text-[15px] font-medium">{item.label}</span>
  </div>
  {item.count && (
    <span className="text-sm text-neutral-400">{item.count}</span>
  )}
</button>
```

### Complete Stat Card
```tsx
<Card className="border-neutral-200 bg-white">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-lg bg-neutral-100">
        <FileText className="h-5 w-5 text-neutral-700" />
      </div>
      <div className="flex items-center gap-1 text-sm font-medium text-green-600">
        <TrendingUp className="h-4 w-4" />
        +4
      </div>
    </div>
    <div>
      <p className="text-3xl font-bold text-neutral-900 mb-1">64</p>
      <p className="text-sm text-neutral-600">Active Dossiers</p>
    </div>
  </CardContent>
</Card>
```

## 🎨 Kibo UI Integration

This prototype is designed to work seamlessly with Kibo UI components. To add Kibo UI components:

```bash
npx shadcn@latest add color-picker --registry @kibo-ui
```

Available Kibo UI components that would enhance this prototype:
- `image-zoom` - For document previews
- `qr-code` - For quick sharing
- `dropzone` - For file uploads
- `marquee` - For announcements
- `code-block` - For technical details

## 📚 Resources

- **Lucide Icons**: https://lucide.dev/icons/
- **Tailwind Colors**: https://tailwindcss.com/docs/customizing-colors
- **shadcn/ui Components**: https://ui.shadcn.com/
- **Kibo UI Registry**: https://www.kibo-ui.com/components







