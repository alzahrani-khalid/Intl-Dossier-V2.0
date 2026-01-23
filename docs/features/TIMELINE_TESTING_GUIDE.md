# Timeline Testing Guide 🧪

Quick guide to test the new enhanced timeline implementation.

---

## 🚀 Quick Start

### 1. Start Development Server

```bash
cd /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0
pnpm dev
```

### 2. Navigate to Timeline

1. Open browser: http://localhost:5173
2. Log in to the application
3. Navigate to any dossier detail page:
   - Country dossier → Timeline tab
   - Organization dossier → Timeline section
   - Person dossier → Timeline section
   - Engagement dossier → Event Timeline section

---

## 📱 Mobile Testing (Chrome DevTools)

### iPhone SE (375px)

```
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select "iPhone SE" from device dropdown
4. Test:
   ✓ Timeline shows single column
   ✓ Cards are full width (minus padding)
   ✓ Icons are 44x44px (tap friendly)
   ✓ Text is readable
   ✓ Tap card opens modal
   ✓ Modal fills screen
   ✓ Close button works
```

### iPhone 12/13 (390px)

```
Select "iPhone 12 Pro" from device dropdown
Test same checklist as iPhone SE
```

### iPad (768px)

```
Select "iPad" from device dropdown
Test:
   ✓ Cards have more spacing
   ✓ Font sizes increase
   ✓ Two-column layout starting to show
```

---

## 💻 Desktop Testing

### 1. Standard Desktop (1920px)

```
1. Resize browser to full screen
2. Test:
   ✓ Timeline line centered
   ✓ Cards alternate left/right
   ✓ Even-indexed cards on left
   ✓ Odd-indexed cards on right
   ✓ Dates visible between card and icon
   ✓ Smooth hover effects
   ✓ Click opens modal (centered)
   ✓ Modal max-width ~900px
```

### 2. Laptop (1366px)

```
Resize browser to 1366px width
Test same checklist
```

---

## 🌐 RTL Testing (Arabic)

### Switch to Arabic

```
1. Click language switcher (top right)
2. Select "العربية" (Arabic)
3. Wait for page to reload with RTL layout
```

### Desktop RTL Tests

```
✓ Timeline line still centered
✓ Cards alternate BUT mirrored (right/left instead of left/right)
✓ Text alignment: right-aligned
✓ Icons: MapPin rotates 180°
✓ Dates: Arabic numerals (١٢٣٤)
✓ Modal: RTL layout
✓ Close button: Top left (mirrored)
✓ Badges: Right-aligned
```

### Mobile RTL Tests

```
✓ Timeline line on right side
✓ Icons on right side
✓ Cards aligned to left
✓ Text right-aligned
✓ Arabic font renders correctly
✓ Tap interactions work
```

---

## 🌓 Dark Mode Testing

### Switch to Dark Mode

```
1. Click theme toggle (top right)
2. Select "Dark" mode
```

### Visual Tests

```
✓ Background dark (#09090B or similar)
✓ Text white/off-white
✓ Cards have dark background
✓ Borders visible (subtle)
✓ Icons contrast well
✓ Shadows adjusted for dark
✓ Timeline line visible
✓ Modal dark background
✓ No flashing on theme switch
```

---

## 🎯 Interaction Testing

### Card Clicks

```
1. Click on any timeline card
   ✓ Modal opens with animation
   ✓ Backdrop appears (semi-transparent)
   ✓ Content loads completely
   ✓ Scrollable if content is long

2. Close modal:
   ✓ Click X button → closes
   ✓ Press Escape → closes
   ✓ Click outside → closes
   ✓ Animation smooth
```

### Icon Clicks

```
1. Click on timeline icon (dot)
   ✓ Same behavior as card click
   ✓ Modal opens
```

### Infinite Scroll

```
1. Scroll to bottom of timeline
   ✓ "Load More Events" button appears
   ✓ Click button → loads next page
   ✓ Loading indicator shows
   ✓ New events append to list
   ✓ No duplicates
   ✓ Smooth transition

2. Continue until end:
   ✓ "End of Timeline" message shows
   ✓ No load more button
```

---

## 🔍 Content Testing

### Event Details in Modal

```
✓ Title displays (English/Arabic)
✓ Date formatted correctly
✓ Time formatted correctly
✓ Description shows (full text)
✓ Priority badge visible
✓ Status badge visible
✓ Location info (if present)
✓ Virtual meeting link (if virtual)
✓ Participants list with avatars
✓ Attachments list with download icons
✓ Confidence score (intelligence events)
✓ "View Full Details" button (if navigation available)
```

### Card Preview

```
✓ Title shows (truncated if long)
✓ Date visible
✓ Time visible
✓ Description truncated (2 lines)
✓ Priority badge
✓ Status badge
✓ Quick info icons (participants, attachments, location)
```

---

## ⌨️ Keyboard Navigation Testing

### Tab Navigation

```
1. Click in browser, press Tab repeatedly
   ✓ Focus moves to first event card
   ✓ Focus indicator visible (outline)
   ✓ Tab moves to next event
   ✓ Tab moves to "Load More" button
   ✓ Can tab through entire timeline
```

### Modal Keyboard

```
1. Tab to event, press Enter
   ✓ Modal opens
2. Press Escape
   ✓ Modal closes
3. Tab inside modal
   ✓ Focus moves to buttons
   ✓ Can activate links
   ✓ Focus stays in modal (trap)
```

---

## 🎨 Visual Regression Checks

### Spacing

```
✓ Cards have consistent spacing
✓ No overlapping elements
✓ Padding uniform
✓ Margins appropriate
```

### Typography

```
✓ Font sizes readable
✓ Line heights comfortable
✓ Font weights consistent
✓ No text overflow
```

### Colors

```
✓ Event type colors distinct
✓ Priority colors clear
✓ Status colors appropriate
✓ Contrast ratio sufficient (WCAG AA)
```

### Animations

```
✓ Modal fade-in smooth
✓ Card hover effects subtle
✓ Icon pulse (high priority) not distracting
✓ Page transitions smooth
✓ No janky animations
```

---

## 🐛 Common Issues to Check

### Layout Issues

```
❌ Cards overlapping → Check CSS z-index
❌ Timeline line misaligned → Check CSS positioning
❌ Icons off-center → Check flexbox alignment
❌ Text overflowing → Check line-clamp and truncate
```

### Functionality Issues

```
❌ Modal won't close → Check event handlers
❌ Infinite scroll not working → Check intersection observer
❌ RTL not mirroring → Check dir attribute and CSS
❌ Dark mode not applying → Check theme provider
```

### Performance Issues

```
❌ Slow initial load → Check bundle size
❌ Laggy scroll → Check animation performance
❌ Memory leak → Check for unmounted components
❌ Modal stuttering → Check Framer Motion config
```

---

## 📊 Performance Metrics

### Target Metrics

```
Initial Load: < 2 seconds (20 events)
Smooth Scroll: 60 FPS
Modal Open: < 300ms
Infinite Scroll: < 500ms
Bundle Size: < 50KB gzipped (added)
```

### How to Measure

#### Chrome DevTools Performance

```
1. Open DevTools → Performance tab
2. Click "Record"
3. Interact with timeline
4. Stop recording
5. Check:
   ✓ FPS chart (should be green/yellow, not red)
   ✓ Main thread activity
   ✓ Layout shift (should be minimal)
```

#### Lighthouse

```
1. Open DevTools → Lighthouse tab
2. Select "Performance" + "Accessibility"
3. Click "Generate report"
4. Target scores:
   ✓ Performance: > 90
   ✓ Accessibility: > 95
```

---

## ✅ Final Checklist

### Desktop (1920px, LTR, Light)

- [ ] Layout correct
- [ ] All interactions work
- [ ] Content displays properly
- [ ] Performance good

### Desktop (1920px, RTL, Dark)

- [ ] Layout mirrored
- [ ] All interactions work
- [ ] Content displays properly
- [ ] Theme applied

### Mobile (375px, LTR, Light)

- [ ] Layout single-column
- [ ] Touch targets adequate
- [ ] Content readable
- [ ] Performance good

### Mobile (375px, RTL, Dark)

- [ ] Layout mirrored
- [ ] Touch targets adequate
- [ ] Content readable
- [ ] Theme applied

### Edge Cases

- [ ] Empty timeline (no events)
- [ ] Error state (API failure)
- [ ] Loading state (skeleton)
- [ ] Single event
- [ ] 100+ events
- [ ] Very long event titles
- [ ] Missing event metadata
- [ ] No attachments
- [ ] No participants

---

## 🎉 Test Completion

When all tests pass:

1. ✅ Mark all checkboxes
2. 📸 Take screenshots (Desktop LTR, Desktop RTL, Mobile)
3. 📝 Document any issues found
4. 🚀 Ready for deployment!

---

## 🔗 Quick Links

- **Dev Server**: http://localhost:5173
- **Docs**: [ENHANCED_TIMELINE_IMPLEMENTATION.md](./ENHANCED_TIMELINE_IMPLEMENTATION.md)
- **Library Docs**: https://stephane-monnot.github.io/react-vertical-timeline/
- **Aceternity Cards**: https://ui.aceternity.com/components/expandable-card

---

**Happy Testing!** 🎊
