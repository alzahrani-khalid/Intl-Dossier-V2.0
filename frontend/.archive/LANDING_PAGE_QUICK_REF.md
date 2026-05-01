# Landing Page Quick Reference Card

## 🎨 Design Checklist

### ✅ Visual Design

- [x] Dark gradient background (slate-950 → blue-950 → slate-900)
- [x] Animated floating gradient orbs
- [x] Glassmorphism effects (backdrop-blur)
- [x] Gradient text heading (white → blue-100 → blue-300)
- [x] Modern card design with hover effects

### ✅ Mobile-First Responsive

- [x] 320px+ (Base): Single column, stacked buttons
- [x] 640px+ (sm): Enhanced spacing, side-by-side buttons
- [x] 768px+ (md): Two-column feature grid
- [x] 1024px+ (lg): Full hero layout

### ✅ RTL Support

- [x] Direction detection (`isRTL = i18n.language === 'ar'`)
- [x] Logical properties (ms-_, me-_, ps-_, pe-_)
- [x] Icon flipping (ArrowRight rotates 180deg)
- [x] Text alignment (text-start)
- [x] `dir={isRTL ? 'rtl' : 'ltr'}` on container

### ✅ Accessibility

- [x] Semantic HTML (main, header, section, footer)
- [x] Touch targets ≥44x44px (min-h-11, min-w-11)
- [x] Focus indicators (ring-2 ring-blue-500)
- [x] Keyboard navigation
- [x] Screen reader friendly

### ✅ Animations

- [x] Framer Motion for all animations
- [x] GPU-accelerated (transform, opacity)
- [x] Staggered entry animations
- [x] Infinite background orb animations
- [x] Hover transitions

### ✅ Internationalization

- [x] useTranslation hook
- [x] All text uses t() function
- [x] Language switcher in header
- [x] Supports English and Arabic

## 📦 Component Hierarchy

```
HomePage
├── Header
│   ├── Logo (Sparkles icon + "GASTAT")
│   └── Language Switcher
├── Hero Section
│   ├── Title (gradient text)
│   ├── Subtitle
│   ├── CTA Buttons
│   │   ├── Sign In (primary)
│   │   └── Sign Up (secondary)
│   └── Features Grid (2x2)
│       ├── Countries
│       ├── Organizations
│       ├── Intelligence
│       └── System
└── Footer
    └── Copyright
```

## 🎯 Key Features

1. **Animated Background Orbs** (lines 96-122)
   - Two gradient circles
   - Infinite smooth animation
   - GPU-accelerated movement

2. **Hero Section** (lines 125-239)
   - Gradient text heading
   - Staggered fade-in animations
   - Mobile-first layout

3. **CTA Buttons** (lines 174-201)
   - Primary: Gradient with hover overlay
   - Secondary: Glass effect
   - Arrow flips in RTL mode

4. **Feature Cards** (lines 204-236)
   - Icon + title + description
   - Hover effects (scale, border, shadow)
   - 2x2 grid on md+, single column on mobile

## 🔧 Customization Points

### Change Colors

```tsx
// Background gradient (line 93)
className = 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900'

// Title gradient (line 165)
className = 'bg-gradient-to-br from-white via-blue-100 to-blue-300 bg-clip-text'

// Primary button (line 182)
className = 'bg-gradient-to-r from-blue-500 to-purple-600'

// Feature card borders (line 218)
className = 'border-white/10 hover:border-blue-500/50'
```

### Modify Animations

```tsx
// Animation duration and delay (lines 160-162)
transition={{ duration: 0.8, delay: 0.2 }}

// Orb animation (lines 100-108)
animate={{
  x: [0, 100, 0],
  y: [0, 50, 0],
}}
transition={{
  duration: 20,
  repeat: Infinity,
  ease: 'easeInOut',
}}
```

### Add/Remove Features

```tsx
// Features array (lines 68-89)
const features = [
  {
    icon: Globe2,
    titleKey: 'countries.title',
    descKey: 'countries.subtitle',
  },
  // Add more features here
]
```

### Update Translations

```json
// frontend/public/locales/en/translation.json
{
  "common": {
    "appTitle": "Your Custom Title"
  },
  "dashboard": {
    "subtitle": "Your custom subtitle"
  }
}
```

## 🐛 Troubleshooting

| Issue                   | Solution                                     |
| ----------------------- | -------------------------------------------- |
| Animations jerky        | Add `transform: translateZ(0)` to motion.div |
| Gradient text invisible | Check browser support for `bg-clip-text`     |
| RTL layout wrong        | Use logical properties (ms-_, me-_)          |
| Touch targets small     | Ensure min-h-11 min-w-11 on buttons          |
| White flash on load     | Add dark background to html/body             |

## 📱 Responsive Breakpoints

| Breakpoint | Width   | Layout                         |
| ---------- | ------- | ------------------------------ |
| Base       | 320px+  | Single column, stacked buttons |
| sm         | 640px+  | Side-by-side buttons           |
| md         | 768px+  | 2-column feature grid          |
| lg         | 1024px+ | Larger typography              |
| xl         | 1280px+ | Max width container            |
| 2xl        | 1536px+ | Extra spacing                  |

## 🎨 Color Palette

### Background

- `slate-950` - #020617
- `blue-950` - #172554
- `slate-900` - #0f172a

### Accents

- `blue-500` - #3b82f6
- `purple-600` - #9333ea
- `blue-100` - #dbeafe
- `blue-300` - #93c5fd

### Text

- `white` - #ffffff
- `blue-100/90` - rgba(219, 234, 254, 0.9)
- `blue-100/70` - rgba(219, 234, 254, 0.7)
- `blue-100/60` - rgba(219, 234, 254, 0.6)

## 📝 Translation Keys

| Key                 | English                             | Arabic                        |
| ------------------- | ----------------------------------- | ----------------------------- |
| common.appTitle     | GASTAT International Dossier System | نظام الملف الدولي - الهيئة... |
| dashboard.subtitle  | Live status of international...     | الحالة المباشرة للالتزامات... |
| auth.signIn         | Sign In                             | دخول                          |
| auth.signUp         | Sign Up                             | تسجيل                         |
| countries.title     | Countries                           | الدول                         |
| organizations.title | Organizations                       | المنظمات                      |
| intelligence.title  | Intelligence Reports                | التقارير الاستخباراتية        |

## ⚡ Performance Tips

1. **Optimize animations**: Use transform and opacity only
2. **Reduce motion**: Respect `prefers-reduced-motion`
3. **Lazy load**: Component loads on route access
4. **Code split**: Automatic via Vite and TanStack Router
5. **GPU acceleration**: Animations use hardware acceleration

## 🚀 Quick Start

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if needed)
pnpm install

# Start dev server
pnpm dev

# Visit landing page
open http://localhost:5173/
```

## 🎯 Testing Checklist

- [ ] View at 375px (mobile)
- [ ] View at 768px (tablet)
- [ ] View at 1920px (desktop)
- [ ] Switch to Arabic (RTL)
- [ ] Tab through buttons
- [ ] Click Sign In (navigates to /login)
- [ ] Click Sign Up (navigates to /register)
- [ ] Check animations smooth
- [ ] Test on Chrome, Firefox, Safari

## 📚 Documentation Files

1. **LANDING_PAGE_REDESIGN.md** - Comprehensive overview
2. **LANDING_PAGE_PREVIEW.md** - Visual preview guide
3. **LANDING_PAGE_QUICK_REF.md** - This quick reference

## 🔗 Useful Links

- Aceternity UI: https://ui.aceternity.com
- Framer Motion: https://www.framer.com/motion
- Lucide Icons: https://lucide.dev
- Tailwind CSS: https://tailwindcss.com

## 💡 Next Steps

1. Review the landing page in browser
2. Test RTL mode with Arabic
3. Test on mobile device
4. Consider adding Aceternity components:
   - Aurora background
   - Sparkles effect
   - Typewriter effect
   - Moving border button
