# GASTAT Landing Page - Visual Preview Guide

## What You'll See

### Desktop View (1920px+)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sparkles] GASTAT                              [English/العربية] │ ← Header
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│          ██████  ████  ███████  ████  ████████                  │ ← Animated
│         ██       ██    ██       ██    ██                         │   gradient
│         ██  ███  ████  ███████  ████  ████████                  │   text
│         ██   ██  ██         ██  ██         ██                    │   (blue to
│          ██████  ████  ███████  ████  ████████                  │   purple)
│                                                                   │
│    GASTAT International Dossier System                          │ ← Hero
│    Live status of international commitments...                   │   title
│                                                                   │
│    ┌──────────────────┐  ┌──────────────────┐                  │
│    │   [→] Sign In    │  │    Sign Up       │                  │ ← CTA
│    └──────────────────┘  └──────────────────┘                  │   buttons
│                                                                   │
│    ┌─────────────────┐  ┌─────────────────┐                    │
│    │ [Globe] Country │  │ [Users] Orgs    │                    │ ← Features
│    │ Monitor bilat.  │  │ Track hier.     │                    │   (2x2 grid)
│    └─────────────────┘  └─────────────────┘                    │
│    ┌─────────────────┐  ┌─────────────────┐                    │
│    │ [Shield] Intel  │  │ [Zap] System    │                    │
│    │ Intelligence... │  │ Live status...  │                    │
│    └─────────────────┘  └─────────────────┘                    │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│    © 2025 GASTAT. GASTAT International Dossier System           │ ← Footer
└─────────────────────────────────────────────────────────────────┘

Background: Dark gradient (slate-950 → blue-950 → slate-900)
Animated orbs: Two floating gradient circles moving slowly
```

### Tablet View (768px)

```
┌─────────────────────────────────────┐
│ [Sparkles] GASTAT   [English/العربية] │
├─────────────────────────────────────┤
│                                       │
│      GASTAT International             │
│      Dossier System                   │
│                                       │
│      Live status of international     │
│      commitments...                   │
│                                       │
│   ┌────────────┐  ┌────────────┐    │
│   │ [→] Sign In│  │  Sign Up   │    │
│   └────────────┘  └────────────┘    │
│                                       │
│   ┌─────────────────┐                │
│   │ [Globe] Country │ ← 2 columns    │
│   │ Monitor...      │                │
│   └─────────────────┘                │
│   ┌─────────────────┐                │
│   │ [Users] Orgs    │                │
│   │ Track...        │                │
│   └─────────────────┘                │
│   ┌─────────────────┐                │
│   │ [Shield] Intel  │                │
│   └─────────────────┘                │
│   ┌─────────────────┐                │
│   │ [Zap] System    │                │
│   └─────────────────┘                │
│                                       │
├─────────────────────────────────────┤
│   © 2025 GASTAT. International...    │
└─────────────────────────────────────┘
```

### Mobile View (375px)

```
┌─────────────────────┐
│ [✨] GASTAT   [عربية]│ ← Compact header
├─────────────────────┤
│                     │
│    GASTAT           │ ← Smaller
│    International    │   heading
│    Dossier System   │
│                     │
│    Live status of   │
│    international... │
│                     │
│  ┌───────────────┐ │ ← Stacked
│  │  [→] Sign In  │ │   buttons
│  └───────────────┘ │
│  ┌───────────────┐ │
│  │    Sign Up    │ │
│  └───────────────┘ │
│                     │
│  ┌───────────────┐ │ ← Single
│  │ [Globe]       │ │   column
│  │ Countries     │ │   features
│  │ Monitor...    │ │
│  └───────────────┘ │
│  ┌───────────────┐ │
│  │ [Users]       │ │
│  │ Organizations │ │
│  └───────────────┘ │
│  ┌───────────────┐ │
│  │ [Shield]      │ │
│  │ Intelligence  │ │
│  └───────────────┘ │
│  ┌───────────────┐ │
│  │ [Zap]         │ │
│  │ System        │ │
│  └───────────────┘ │
│                     │
├─────────────────────┤
│  © 2025 GASTAT...  │
└─────────────────────┘
```

## Color Reference

### Background
```css
/* Main gradient */
background: linear-gradient(
  to bottom right,
  #020617,  /* slate-950 */
  #172554,  /* blue-950 */
  #0f172a   /* slate-900 */
);

/* Animated orbs */
orb1: rgba(59, 130, 246, 0.2)  /* blue-500/20 */
orb2: rgba(168, 85, 247, 0.2)  /* purple-500/20 */
```

### Text
```css
title: linear-gradient(
  to bottom right,
  #ffffff,    /* white */
  #dbeafe,    /* blue-100 */
  #93c5fd     /* blue-300 */
);

subtitle: rgba(219, 234, 254, 0.9)  /* blue-100/90 */
feature-text: rgba(219, 234, 254, 0.7)  /* blue-100/70 */
footer: rgba(219, 234, 254, 0.6)  /* blue-100/60 */
```

### Buttons
```css
/* Primary (Sign In) */
background: linear-gradient(
  to right,
  #3b82f6,  /* blue-500 */
  #9333ea   /* purple-600 */
);
shadow: rgba(59, 130, 246, 0.5);  /* blue-500/50 */

/* Hover */
background: linear-gradient(
  to right,
  #2563eb,  /* blue-600 */
  #7c3aed   /* purple-700 */
);
shadow: rgba(59, 130, 246, 0.6);  /* blue-500/60 */

/* Secondary (Sign Up) */
background: rgba(255, 255, 255, 0.05);  /* white/5 */
border: rgba(255, 255, 255, 0.2);  /* white/20 */
```

### Feature Cards
```css
background: rgba(255, 255, 255, 0.05);  /* white/5 */
border: rgba(255, 255, 255, 0.1);  /* white/10 */

/* Hover */
background: rgba(255, 255, 255, 0.1);  /* white/10 */
border: rgba(59, 130, 246, 0.5);  /* blue-500/50 */
shadow: rgba(59, 130, 246, 0.1);  /* blue-500/10 */

/* Icon background */
background: linear-gradient(
  to bottom right,
  rgba(59, 130, 246, 0.2),   /* blue-500/20 */
  rgba(147, 51, 234, 0.2)    /* purple-600/20 */
);
```

## Animation Timeline

```
0.0s: Page loads (background gradient and orbs start)
0.0s - 0.6s: Header logo slides in from start
0.0s - 0.6s: Language button slides in from end
0.2s - 1.0s: Hero title fades in with upward slide
0.4s - 1.2s: CTA buttons fade in with upward slide
0.6s - 1.4s: Feature grid container fades in
0.8s - 1.4s: Feature card 1 fades in
0.9s - 1.5s: Feature card 2 fades in
1.0s - 1.6s: Feature card 3 fades in
1.1s - 1.7s: Feature card 4 fades in
1.0s - 1.8s: Footer fades in
∞: Background orbs continue animating
```

## Interactive States

### Sign In Button (Primary)
- **Rest**: Blue-purple gradient, medium shadow
- **Hover**: Darker gradient overlay, larger shadow, arrow slides right (or left in RTL)
- **Focus**: Blue ring outline (2px, 2px offset)
- **Active**: Gradient shifts slightly

### Sign Up Button (Secondary)
- **Rest**: Glass effect (white/5, white/20 border)
- **Hover**: Increased background opacity (white/10)
- **Focus**: White ring outline (2px, 2px offset)
- **Active**: Further increased opacity

### Language Switcher
- **Rest**: Glass effect, compact
- **Hover**: Increased background opacity
- **Focus**: Blue ring outline
- **Active**: Language switches, entire page re-renders with new direction

### Feature Cards
- **Rest**: Subtle glass effect
- **Hover**:
  - Border changes to blue
  - Background opacity increases
  - Shadow appears
  - Icon scales up (1.1x)
- **Focus**: Not applicable (not interactive)

## RTL Transformation

### English (LTR)
```
[Logo] GASTAT                    [English]
         ↓
   [→] Sign In    [Sign Up]
         ↓
[Feature1] [Feature2]
[Feature3] [Feature4]
```

### Arabic (RTL)
```
[عربية]                    GASTAT [Logo]
         ↓
   [تسجيل]    [دخول ←]
         ↓
[Feature2] [Feature1]
[Feature4] [Feature3]
```

## Accessibility Features

### Keyboard Navigation
1. Tab to language switcher
2. Tab to Sign In button
3. Tab to Sign Up button
4. (Feature cards not focusable - display only)

### Screen Reader
1. Announces: "Main landmark"
2. Reads: "GASTAT International Dossier System" (h1)
3. Reads: Subtitle text
4. Announces: "Button, Sign In"
5. Announces: "Button, Sign Up"
6. Reads: Feature titles and descriptions (h3)
7. Reads: Footer text

### Focus Indicators
- All buttons: Blue ring (2px solid, 2px offset)
- Ring color: `#3b82f6` (blue-500)
- Ring offset color: Background color (slate-950)
- Visible in both light and dark modes

## Browser Compatibility

### Full Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Graceful Degradation
- **backdrop-blur**: Falls back to solid background
- **bg-clip-text**: Falls back to solid white text
- **Animations**: No animations on `prefers-reduced-motion`

## Performance Metrics

### Initial Load
- Time to Interactive: < 2s
- First Contentful Paint: < 1s
- Largest Contentful Paint: < 2.5s

### Animations
- Frame rate: 60fps (GPU-accelerated)
- Animation duration: 0.6s - 1s per element
- Stagger delay: 0.1s between feature cards

### Bundle Size
- No additional dependencies
- Uses existing Framer Motion
- Minimal CSS (Tailwind utilities)

## Testing URLs

### Local Development
```bash
# Start dev server
pnpm dev

# Visit
http://localhost:5173/
```

### Preview Build
```bash
# Build and preview
pnpm build
pnpm preview

# Visit
http://localhost:4173/
```

### Test Routes
- `/` - Landing page (this component)
- `/login` - Navigate from "Sign In" button
- `/register` - Navigate from "Sign Up" button
- `/dashboard` - Auto-redirect if authenticated

## Common Issues & Solutions

### Issue: Animations not smooth
**Solution**: Check GPU acceleration
```css
/* Add to motion.div if needed */
transform: translateZ(0);
will-change: transform;
```

### Issue: Gradient text not showing
**Solution**: Check browser support
```css
/* Fallback */
.gradient-text {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Issue: RTL layout broken
**Solution**: Check logical properties
```css
/* Use these */
margin-inline-start (ms-*)
margin-inline-end (me-*)
padding-inline-start (ps-*)
padding-inline-end (pe-*)

/* Not these */
margin-left (ml-*)
margin-right (mr-*)
```

### Issue: Touch targets too small
**Solution**: Check minimum size
```css
/* All interactive elements must have */
min-height: 44px;  /* min-h-11 */
min-width: 44px;   /* min-w-11 */
```
