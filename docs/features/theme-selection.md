# Theme Selection System

## Overview

The GASTAT International Dossier System provides a comprehensive theme selection system that allows users to customize their visual experience. The system supports multiple themes, dark/light mode switching, and full bilingual support with RTL/LTR layouts.

## Features

### 🎨 Visual Themes
- **GASTAT Theme**: Official GASTAT branding with teal and amber accents
- **Blue Sky Theme**: Modern blue color scheme for alternative styling

### 🌓 Color Modes
- **Light Mode**: Optimized for daytime use with light backgrounds
- **Dark Mode**: Reduced eye strain for low-light environments

### 🌍 Language Support
- **English**: Full LTR (Left-to-Right) layout
- **Arabic**: Complete RTL (Right-to-Left) layout with proper text alignment

### 💾 Preference Persistence
- **Local Storage**: Instant preference saving for offline capability
- **Cloud Sync**: Cross-device synchronization via Supabase
- **Cross-Tab Sync**: Real-time updates across browser tabs

## How to Use

### Changing Theme

1. **Locate the Theme Selector**: Find the palette icon (🎨) in the application header
2. **Open Theme Menu**: Click on the theme selector button
3. **Choose Theme**: Select either "GASTAT" or "Blue Sky" from the dropdown
4. **Automatic Application**: The theme applies instantly without page reload

### Switching Color Mode

1. **Find Color Mode Toggle**: Look for the sun/moon icon next to the theme selector
2. **Click to Toggle**: 
   - Sun icon (☀️) = Currently in light mode, click for dark
   - Moon icon (🌙) = Currently in dark mode, click for light
3. **Instant Switch**: The color mode changes immediately

### Changing Language

1. **Locate Language Switcher**: Find the globe icon (🌐) in the header
2. **Open Language Menu**: Click on the language switcher
3. **Select Language**:
   - 🇬🇧 English
   - 🇸🇦 العربية (Arabic)
4. **Layout Adjustment**: The interface automatically adjusts for RTL/LTR

## Keyboard Shortcuts

### Navigation
- **Tab**: Navigate between theme controls
- **Enter/Space**: Activate selected control
- **Escape**: Close dropdown menus
- **Arrow Keys**: Navigate within dropdown menus

### Quick Actions
- **Alt + T**: Open theme selector (Windows/Linux)
- **Cmd + T**: Open theme selector (macOS)
- **Alt + L**: Toggle language
- **Alt + D**: Toggle dark/light mode

## Accessibility Features

### Screen Reader Support
- All controls have descriptive ARIA labels
- Theme changes are announced to screen readers
- Proper role attributes for all interactive elements

### Keyboard Navigation
- Full keyboard accessibility for all theme controls
- Focus indicators for better visibility
- Logical tab order throughout the interface

### High Contrast
- Both themes maintain WCAG 2.1 AA compliance
- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text

## Technical Details

### Performance
- **Theme Switching**: < 100ms response time
- **Zero JavaScript Overhead**: CSS variable-based implementation
- **Efficient Caching**: Preferences cached locally for instant loading

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Storage Limits
- Local Storage: 5MB (more than sufficient for preferences)
- Preference Size: ~200 bytes per user

## Troubleshooting

### Theme Not Persisting

**Problem**: Theme reverts to default after page refresh

**Solutions**:
1. Check if cookies/localStorage are enabled in browser settings
2. Ensure you're logged in for cloud sync to work
3. Try clearing browser cache and reloading

### RTL Layout Issues

**Problem**: Some elements not properly aligned in Arabic

**Solutions**:
1. Ensure browser supports CSS logical properties
2. Update to latest browser version
3. Report specific issues to development team

### Color Mode Not Switching

**Problem**: Dark/light mode toggle not working

**Solutions**:
1. Check browser console for errors
2. Disable browser extensions that might interfere
3. Try incognito/private mode to rule out extensions

### Cross-Tab Sync Not Working

**Problem**: Theme changes don't reflect in other tabs

**Solutions**:
1. Ensure BroadcastChannel API is supported (check browser compatibility)
2. Verify tabs are on the same domain
3. Check if browser is in private/incognito mode (may restrict features)

## Best Practices

### For Optimal Experience
1. **Use Modern Browsers**: Keep your browser updated for best performance
2. **Enable JavaScript**: Required for theme switching functionality
3. **Allow Local Storage**: Needed for preference persistence
4. **Stay Logged In**: Ensures cross-device synchronization

### Accessibility Considerations
1. **Respect User Preferences**: System color mode is detected and applied by default
2. **Test Both Modes**: Ensure content is readable in both light and dark modes
3. **Use Semantic HTML**: Helps screen readers understand the interface

## API Reference

### User Preferences Endpoint

```typescript
// GET /api/preferences/{userId}
interface UserPreference {
  theme: 'gastat' | 'blue-sky';
  colorMode: 'light' | 'dark';
  language: 'en' | 'ar';
  updatedAt: string;
}

// PUT /api/preferences/{userId}
interface UpdatePreferenceRequest {
  theme?: 'gastat' | 'blue-sky';
  colorMode?: 'light' | 'dark';
  language?: 'en' | 'ar';
}
```

### React Hooks

```typescript
// Theme Hook
const { theme, setTheme, colorMode, setColorMode } = useTheme();

// Language Hook  
const { language, setLanguage, direction, t } = useLanguage();
```

### CSS Variables

```css
/* Theme colors available as CSS variables */
--primary: /* Theme primary color */
--secondary: /* Theme secondary color */
--accent: /* Theme accent color */
--background: /* Background color based on mode */
--foreground: /* Text color based on mode */
```

## Feedback and Support

### Reporting Issues
1. Use the in-app feedback button
2. Include browser version and OS
3. Provide steps to reproduce the issue
4. Attach screenshots if applicable

### Feature Requests
- Contact the development team with enhancement ideas
- Participate in user testing sessions
- Vote on proposed features in the roadmap

## Version History

### v1.0.0 (Current)
- Initial theme selection system
- GASTAT and Blue Sky themes
- Dark/light mode support
- English/Arabic language support
- Cross-tab synchronization
- Accessibility compliance

### Planned Features
- Additional theme presets
- Custom theme creation
- Theme scheduling (auto dark mode at night)
- More language options
- Enhanced animation controls