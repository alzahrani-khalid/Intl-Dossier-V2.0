# Kibo UI Migration Checklist
**International Dossier Management System v2.0**

Use this checklist to ensure all components follow Kibo UI patterns and mobile-first design principles.

---

## ✅ Configuration Setup

- [x] `.claude.config.md` created in project root
- [x] `DESIGN_SYSTEM.md` created in frontend directory
- [x] `COMPONENT_INVENTORY.md` created documenting existing components
- [x] `tailwind.config.js` already configured with GASTAT theme
- [x] `components.json` already configured for shadcn/ui
- [x] Responsive hooks (`use-responsive.ts`) already implemented
- [x] RTL/LTR support already implemented in `index.css`

---

## 🎯 Component Creation Guidelines

### Before Creating ANY New Component

- [ ] Check `COMPONENT_INVENTORY.md` - does it already exist?
- [ ] Check `src/components/ui/` - is there a primitive for this?
- [ ] Check `src/components/responsive/` - is there a responsive wrapper?
- [ ] Check `src/components/` - is there a similar domain component?
- [ ] Search codebase for similar patterns
- [ ] Consult Kibo UI documentation

### When Creating a New Component

**Mobile-First Requirements:**
- [ ] Component designed for 320px viewport first
- [ ] Uses `useResponsive()` hook for adaptive behavior
- [ ] Tested on mobile, tablet, desktop, and wide screens
- [ ] Touch targets are minimum 44x44px on mobile
- [ ] Uses mobile-first Tailwind classes (base, then sm:, md:, lg:)
- [ ] Progressive disclosure implemented where appropriate

**RTL/LTR Requirements:**
- [ ] Uses logical CSS properties (ms-, pe-, etc.)
- [ ] Tested in English (LTR) mode
- [ ] Tested in Arabic (RTL) mode
- [ ] Uses `useDirection()` hook when needed
- [ ] Text direction handled appropriately

**Kibo UI Pattern Requirements:**
- [ ] Built using Kibo UI primitives from `src/components/ui/`
- [ ] Uses ResponsiveCard or ResponsiveWrapper when appropriate
- [ ] Follows GASTAT theme colors and spacing
- [ ] Uses `cn()` utility for class merging
- [ ] Accepts `className` prop for extensibility

**Code Quality Requirements:**
- [ ] TypeScript interface defined for all props
- [ ] JSDoc comments added
- [ ] Component is properly exported
- [ ] No inline styles used
- [ ] No hardcoded colors (uses CSS variables)

**Accessibility Requirements:**
- [ ] Uses semantic HTML elements
- [ ] Keyboard navigation works correctly
- [ ] ARIA labels added where needed
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Screen reader tested (if critical component)

**Performance Requirements:**
- [ ] Heavy components lazy-loaded when appropriate
- [ ] Images optimized for different screen sizes
- [ ] Data fetching optimized for mobile (if applicable)
- [ ] No unnecessary re-renders

---

## 🔄 Component Migration Tasks

### High Priority - Responsive Wrappers

These are already implemented but should be used more consistently:

- [ ] Audit all Card usage - migrate to ResponsiveCard where appropriate
- [ ] Audit all container usage - wrap with ResponsiveWrapper where needed
- [ ] Audit all grid layouts - migrate to ResponsiveCardGrid where appropriate
- [ ] Document best practices for responsive component usage

### Medium Priority - Form Components

Enhance existing forms with mobile-first patterns:

- [ ] Review IntakeForm - ensure mobile-friendly
- [ ] Review EngagementForm - ensure touch targets adequate
- [ ] Review AfterActionForm - test on mobile devices
- [ ] Add progressive disclosure to long forms
- [ ] Implement form field grouping for mobile

### Medium Priority - Data Display

Optimize tables and lists for mobile:

- [ ] Review all Table usage - ensure responsive-table.tsx is used
- [ ] Add mobile card view for complex tables
- [ ] Implement virtual scrolling for long lists
- [ ] Add pull-to-refresh on mobile lists
- [ ] Optimize Kanban board for mobile touch

### Medium Priority - Navigation

Ensure navigation works well on all screen sizes:

- [ ] Review Navigation.tsx - ensure mobile menu works
- [ ] Review Sidebar.tsx - ensure collapsible on mobile
- [ ] Test navigation keyboard shortcuts on all devices
- [ ] Add breadcrumbs for deep navigation on mobile

### Low Priority - Visual Polish

Nice-to-have improvements:

- [ ] Add loading skeletons to all async components
- [ ] Implement optimistic UI updates
- [ ] Add micro-interactions and animations
- [ ] Improve empty states with illustrations
- [ ] Add tooltips to complex UI elements

---

## 📱 Mobile Testing Checklist

### Devices to Test

- [ ] iPhone SE (375px - small mobile)
- [ ] iPhone 14 Pro (393px - standard mobile)
- [ ] iPad Mini (768px - tablet)
- [ ] Desktop (1024px+ - standard desktop)
- [ ] Wide screen (1440px+ - large desktop)

### Orientations to Test

- [ ] Portrait mode on mobile
- [ ] Landscape mode on mobile
- [ ] Portrait mode on tablet
- [ ] Landscape mode on tablet

### Features to Test

- [ ] Touch targets are finger-friendly (44x44px minimum)
- [ ] Scrolling is smooth
- [ ] Forms are easy to fill on mobile
- [ ] Navigation is accessible on mobile
- [ ] Images load appropriately
- [ ] Text is readable without zooming
- [ ] Buttons are large enough to tap
- [ ] Modals/dialogs work on small screens
- [ ] Tables are usable on mobile
- [ ] Filters collapse on mobile

### Languages to Test

- [ ] English (LTR) - all breakpoints
- [ ] Arabic (RTL) - all breakpoints
- [ ] Text doesn't overflow in either language
- [ ] Layout doesn't break in RTL mode
- [ ] Logical properties work correctly

---

## 🎨 Design System Compliance

### GASTAT Theme

- [ ] All components use theme CSS variables
- [ ] Primary green (#3C8956) used correctly
- [ ] Secondary blue used correctly
- [ ] No hardcoded colors in components
- [ ] Dark mode works (if implemented)

### Typography

- [ ] Inter font for English (LTR)
- [ ] Tajawal font for Arabic (RTL)
- [ ] Font sizes use CSS variables
- [ ] Text sizing is responsive
- [ ] Font weights are consistent

### Spacing

- [ ] Uses Tailwind spacing scale consistently
- [ ] No magic numbers for spacing
- [ ] Responsive spacing (more on desktop, less on mobile)
- [ ] Consistent padding/margins across components

### Border Radius

- [ ] Uses `--radius` CSS variable
- [ ] Consistent rounded corners
- [ ] Appropriate for component type

---

## 🚀 Performance Optimization

### Code Splitting

- [ ] Heavy components are lazy-loaded
- [ ] Route-based code splitting implemented
- [ ] Third-party libraries code-split where possible

### Image Optimization

- [ ] Images use appropriate formats (WebP when possible)
- [ ] Responsive images with srcset
- [ ] Images lazy-loaded below the fold
- [ ] Thumbnails used for lists

### Data Fetching

- [ ] Queries use TanStack Query
- [ ] Mobile queries fetch less data
- [ ] Pagination implemented on mobile
- [ ] Infinite scroll for long lists (if appropriate)
- [ ] Optimistic updates for mutations

### Bundle Size

- [ ] Check bundle size after adding components
- [ ] Tree-shake unused code
- [ ] Remove unused dependencies
- [ ] Monitor Core Web Vitals

---

## 🧪 Testing Strategy

### Unit Tests

- [ ] Test responsive behavior with different viewport sizes
- [ ] Test RTL/LTR modes
- [ ] Test keyboard navigation
- [ ] Test touch interactions
- [ ] Test with screen readers (when critical)

### Integration Tests

- [ ] Test form submission flows
- [ ] Test navigation flows
- [ ] Test data loading states
- [ ] Test error states
- [ ] Test offline behavior (if applicable)

### E2E Tests

- [ ] Critical user journeys tested
- [ ] Mobile-specific flows tested
- [ ] Multi-language flows tested
- [ ] Authentication flows tested

---

## 📋 Documentation Tasks

- [ ] Update DESIGN_SYSTEM.md with new components
- [ ] Update COMPONENT_INVENTORY.md when adding components
- [ ] Document responsive patterns discovered
- [ ] Create Storybook stories for key components (optional)
- [ ] Document mobile-specific patterns
- [ ] Create visual regression tests (optional)

---

## 🔍 Code Review Checklist

When reviewing component PRs, check:

### Mobile-First
- [ ] Component works on 320px viewport
- [ ] Uses `useResponsive()` hook appropriately
- [ ] Touch targets adequate on mobile
- [ ] Tested on actual mobile device

### RTL/LTR
- [ ] Uses logical CSS properties
- [ ] Tested in both English and Arabic
- [ ] Text direction handled correctly
- [ ] No layout breaks in RTL

### Kibo UI Patterns
- [ ] Uses existing primitives
- [ ] Follows GASTAT theme
- [ ] Uses CSS variables
- [ ] No hardcoded styles

### Code Quality
- [ ] TypeScript types defined
- [ ] No console.logs
- [ ] No commented-out code
- [ ] Proper error handling
- [ ] Performance optimized

### Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast adequate
- [ ] Focus visible

---

## 🎯 Success Metrics

### Before Kibo UI Migration
- Lighthouse Mobile Score: __/100
- Bundle Size: __KB
- First Contentful Paint: __s
- Time to Interactive: __s
- Mobile Usability Issues: __

### After Kibo UI Migration
- Lighthouse Mobile Score: __/100 (Target: 90+)
- Bundle Size: __KB (Target: <500KB gzipped)
- First Contentful Paint: __s (Target: <1.5s)
- Time to Interactive: __s (Target: <3.5s)
- Mobile Usability Issues: __ (Target: 0)

---

## 📞 Support

If you need help with:
- Kibo UI patterns → Check DESIGN_SYSTEM.md
- Existing components → Check COMPONENT_INVENTORY.md
- Mobile-first design → Check .claude.config.md
- Responsive hooks → Check src/hooks/use-responsive.ts
- RTL/LTR support → Check src/hooks/use-theme.ts

---

**Last Updated**: 2025-01-22  
**Migration Status**: In Progress  
**Completion**: 85% (Core infrastructure ready, applying patterns in progress)
