# Quickstart: Theme Selection System

**Date**: 2025-09-27  
**Feature**: Theme Selection System  
**Branch**: `006-i-need-you`

## Prerequisites

- Node.js 18+ and npm installed
- Supabase project configured with authentication
- Docker and Docker Compose installed
- Modern browser with JavaScript enabled

## Setup Instructions

### 1. Install Dependencies

```bash
# From repository root
npm install

# Install required packages if not already present
npm install i18next react-i18next i18next-browser-languagedetector
npm install @tanstack/react-query @tanstack/react-router
npm install tailwindcss @tailwindcss/rtl
```

### 2. Database Setup

Run the migration to create the user_preferences table:

```sql
-- Execute in Supabase SQL Editor or via migration
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT NOT NULL CHECK (theme IN ('gastat', 'blueSky')),
  color_mode TEXT NOT NULL CHECK (color_mode IN ('light', 'dark', 'system')),
  language TEXT NOT NULL CHECK (language IN ('en', 'ar')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and create policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences 
  USING (auth.uid() = user_id);
```

### 3. Environment Configuration

Ensure your `.env` file includes:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DEFAULT_THEME=gastat
VITE_DEFAULT_LANGUAGE=en
VITE_DEFAULT_COLOR_MODE=light
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev

# In another terminal, run tests
npm run test:watch
```

## Testing the Feature

### Test 1: Default Theme Application
**Objective**: Verify GASTAT theme loads by default for new users

1. Open the application in an incognito/private browser window
2. **Expected**: GASTAT theme in light mode with English language
3. Inspect CSS variables in DevTools:
   ```css
   :root {
     --primary: 139.6552 52.7273% 43.1373%; /* GASTAT green */
   }
   ```

### Test 2: Theme Switching
**Objective**: Verify theme changes apply immediately

1. Click the theme selector in the header/settings
2. Select "Blue Sky" theme
3. **Expected**: 
   - All colors update to Blue Sky palette
   - Font changes from Plus Jakarta Sans to Open Sans
   - No page reload occurs
4. Verify CSS variables updated:
   ```css
   :root {
     --primary: 203.8863 88.2845% 53.1373%; /* Blue Sky blue */
   }
   ```

### Test 3: Dark Mode Toggle
**Objective**: Verify dark mode works for both themes

1. With GASTAT theme active, toggle dark mode
2. **Expected**: Dark background (#220.0000 14.7541% 11.9608%)
3. Switch to Blue Sky theme
4. Toggle dark mode
5. **Expected**: Pure black background (#0 0% 0%)

### Test 4: Language Switching (RTL/LTR)
**Objective**: Verify bilingual support and RTL layout

1. Click language selector
2. Switch from English to Arabic (العربية)
3. **Expected**:
   - Entire interface flips to RTL layout
   - All text displays in Arabic
   - Navigation moves to right side
   - Form fields align right
4. Verify HTML attributes:
   ```html
   <html lang="ar" dir="rtl">
   ```

### Test 5: Preference Persistence
**Objective**: Verify preferences survive page refresh

1. Set: Blue Sky theme, Dark mode, Arabic language
2. Refresh the page (F5)
3. **Expected**: All preferences restored
4. Check localStorage:
   ```javascript
   localStorage.getItem('theme-preference')
   // Should contain: {"theme":"blueSky","colorMode":"dark","language":"ar"}
   ```

### Test 6: Cross-Tab Synchronization
**Objective**: Verify preferences sync across tabs

1. Open application in two browser tabs
2. In Tab 1: Change to Blue Sky theme
3. **Expected**: Tab 2 updates to Blue Sky automatically
4. In Tab 2: Switch to Arabic
5. **Expected**: Tab 1 switches to Arabic and RTL

### Test 7: System Preference Respect
**Objective**: Verify system dark mode preference

1. Clear localStorage and cookies
2. Set OS to dark mode
3. Open application
4. **Expected**: Application loads in dark mode
5. Explicitly set light mode in app
6. **Expected**: Override system preference

### Test 8: Accessibility Compliance
**Objective**: Verify theme selector is accessible

1. Navigate to theme selector using Tab key
2. Press Enter to open dropdown
3. Use arrow keys to navigate options
4. Press Enter to select
5. **Expected**: 
   - Focus indicators visible
   - Screen reader announces changes
   - All controls keyboard accessible

### Test 9: Error Handling
**Objective**: Verify graceful fallback

1. Disable localStorage in browser settings
2. Try changing theme
3. **Expected**: 
   - Theme changes apply
   - Warning message about persistence
   - No application crash

### Test 10: Performance
**Objective**: Verify instant theme switching

1. Open Performance tab in DevTools
2. Start recording
3. Switch themes rapidly 10 times
4. **Expected**:
   - Each switch < 100ms
   - No layout shifts
   - No memory leaks

## Validation Checklist

### Functional Requirements
- [ ] FR-001: Theme selector shows GASTAT and Blue Sky options
- [ ] FR-002: Dark and light modes work for both themes
- [ ] FR-003: Language switches between English and Arabic
- [ ] FR-004: RTL layout applies when Arabic selected
- [ ] FR-005: Preferences persist across sessions
- [ ] FR-006: GASTAT light English is default
- [ ] FR-007: Theme switcher accessible from main interface
- [ ] FR-008: Changes apply without page reload
- [ ] FR-009: Text remains readable in all combinations
- [ ] FR-010: All UI text translated
- [ ] FR-011: Fonts change with themes
- [ ] FR-012: System dark mode respected on first visit

### Technical Validation
- [ ] TypeScript strict mode passes
- [ ] No console errors during theme switching
- [ ] RLS policies enforce user isolation
- [ ] API rate limiting works (60 req/min)
- [ ] Translations load correctly
- [ ] CSS variables update properly

### Accessibility Validation
- [ ] WCAG 2.1 AA contrast ratios met
- [ ] Keyboard navigation complete
- [ ] Screen reader announces changes
- [ ] Focus indicators visible
- [ ] ARIA labels in both languages

## Common Issues & Solutions

### Issue: Theme doesn't persist
**Solution**: Check localStorage is enabled and Supabase connection is active

### Issue: RTL layout broken
**Solution**: Ensure Tailwind RTL plugin is configured and `dir` attribute is set

### Issue: Translations not loading
**Solution**: Verify i18n configuration and translation file paths

### Issue: Dark mode not respecting system
**Solution**: Check `prefers-color-scheme` media query implementation

### Issue: Slow theme switching
**Solution**: Ensure CSS variables are used, not component re-renders

## Success Criteria

The feature is considered complete when:

1. All 10 test scenarios pass
2. All functional requirements are validated
3. No TypeScript errors
4. Accessibility audit passes
5. Performance metrics met (<100ms switch time)
6. Both languages fully translated
7. All themes render correctly in both color modes

## Next Steps

After validation:
1. Run full E2E test suite
2. Perform accessibility audit
3. Test on multiple browsers
4. Verify Docker deployment
5. Update user documentation
6. Plan user onboarding flow