# Accessibility API

## Overview

Accessibility endpoints manage user-specific preferences for visual, motor, and cognitive accessibility features to ensure WCAG 2.1 Level AA compliance.

## Accessibility Preferences

### Get User Preferences

**Endpoint:** `GET /accessibility/preferences`

**Response (200 OK):**
```json
{
  "high_contrast": false,
  "large_text": true,
  "reduce_motion": false,
  "screen_reader": false,
  "keyboard_only": false,
  "focus_indicators": "default",
  "color_blind_mode": "none",
  "custom_css": null
}
```

### Update Preferences

**Endpoint:** `PUT /accessibility/preferences`

**Request Body:**
```json
{
  "high_contrast": true,
  "large_text": true,
  "reduce_motion": true,
  "screen_reader": false,
  "keyboard_only": false,
  "focus_indicators": "thick",
  "color_blind_mode": "deuteranopia",
  "custom_css": ".custom-class { font-size: 1.2em; }"
}
```

**Response (200 OK):**
```json
{
  "high_contrast": true,
  "large_text": true,
  "reduce_motion": true,
  "screen_reader": false,
  "keyboard_only": false,
  "focus_indicators": "thick",
  "color_blind_mode": "deuteranopia",
  "custom_css": ".custom-class { font-size: 1.2em; }"
}
```

## Preference Options

### Visual Preferences

#### High Contrast Mode
- **Values:** `true` | `false`
- **Effect:** Increases color contrast to WCAG AAA level
- **CSS Classes:** `.high-contrast`

#### Large Text
- **Values:** `true` | `false`
- **Effect:** Increases base font size by 20%
- **CSS Classes:** `.large-text`

#### Color Blind Modes
- **Values:** 
  - `none` - No color adjustment
  - `protanopia` - Red-blind filter
  - `deuteranopia` - Green-blind filter
  - `tritanopia` - Blue-blind filter
- **Effect:** Applies color filters for color vision deficiency

#### Focus Indicators
- **Values:**
  - `default` - Standard 2px outline
  - `thick` - 4px high-contrast outline
  - `high-contrast` - Thick outline with contrasting colors
- **Effect:** Modifies focus ring visibility

### Motion Preferences

#### Reduce Motion
- **Values:** `true` | `false`
- **Effect:** Disables animations and transitions
- **CSS Classes:** `.reduce-motion`
- **Media Query:** `prefers-reduced-motion: reduce`

### Interaction Preferences

#### Screen Reader Mode
- **Values:** `true` | `false`
- **Effect:** 
  - Enhances ARIA labels
  - Adds skip links
  - Improves semantic structure
  - Announces dynamic changes

#### Keyboard Only Navigation
- **Values:** `true` | `false`
- **Effect:**
  - Enables keyboard shortcuts
  - Shows keyboard hints
  - Improves tab order
  - Adds keyboard-only controls

### Custom Styling

#### Custom CSS
- **Type:** String (max 10KB)
- **Validation:** Safe CSS only (no JavaScript, imports, or external resources)
- **Effect:** Applied after all other styles

## Implementation Examples

### Frontend Integration

```typescript
// Fetch and apply accessibility preferences
class AccessibilityManager {
  private preferences: AccessibilityPreferences;
  
  async loadPreferences() {
    const response = await fetch('/accessibility/preferences', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    this.preferences = await response.json();
    this.applyPreferences();
  }
  
  applyPreferences() {
    const body = document.body;
    
    // Visual preferences
    body.classList.toggle('high-contrast', this.preferences.high_contrast);
    body.classList.toggle('large-text', this.preferences.large_text);
    body.classList.toggle('reduce-motion', this.preferences.reduce_motion);
    
    // Focus indicators
    this.applyFocusIndicators(this.preferences.focus_indicators);
    
    // Color blind mode
    this.applyColorBlindFilter(this.preferences.color_blind_mode);
    
    // Screen reader optimizations
    if (this.preferences.screen_reader) {
      this.enhanceForScreenReader();
    }
    
    // Keyboard navigation
    if (this.preferences.keyboard_only) {
      this.enableKeyboardEnhancements();
    }
    
    // Custom CSS
    if (this.preferences.custom_css) {
      this.applyCustomCSS(this.preferences.custom_css);
    }
  }
  
  private applyFocusIndicators(style: string) {
    const styles = {
      default: '2px solid currentColor',
      thick: '4px solid currentColor',
      'high-contrast': '4px solid #ff0 !important'
    };
    
    const styleElement = document.getElementById('focus-style') || 
      document.createElement('style');
    styleElement.id = 'focus-style';
    styleElement.textContent = `
      *:focus {
        outline: ${styles[style]};
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  private applyColorBlindFilter(mode: string) {
    const filters = {
      none: '',
      protanopia: 'url(#protanopia-filter)',
      deuteranopia: 'url(#deuteranopia-filter)',
      tritanopia: 'url(#tritanopia-filter)'
    };
    
    document.documentElement.style.filter = filters[mode];
  }
  
  private enhanceForScreenReader() {
    // Add skip links
    this.addSkipLinks();
    
    // Enhance ARIA labels
    this.enhanceAriaLabels();
    
    // Add live regions for dynamic content
    this.setupLiveRegions();
  }
  
  private enableKeyboardEnhancements() {
    // Add keyboard shortcuts overlay
    this.addKeyboardShortcuts();
    
    // Enhance tab navigation
    this.improveTabOrder();
    
    // Add keyboard-only controls
    this.addKeyboardControls();
  }
}
```

### Preference Settings UI

```tsx
// React component for accessibility settings
const AccessibilitySettings: React.FC = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>();
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadPreferences();
  }, []);
  
  const loadPreferences = async () => {
    const response = await fetch('/accessibility/preferences', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setPreferences(await response.json());
  };
  
  const savePreferences = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/accessibility/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        // Apply preferences immediately
        applyPreferences(preferences);
        showNotification('Preferences saved successfully');
      }
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="accessibility-settings">
      <h2>Accessibility Settings</h2>
      
      <section>
        <h3>Visual</h3>
        
        <label>
          <input
            type="checkbox"
            checked={preferences?.high_contrast}
            onChange={e => setPreferences({
              ...preferences,
              high_contrast: e.target.checked
            })}
          />
          High Contrast Mode
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={preferences?.large_text}
            onChange={e => setPreferences({
              ...preferences,
              large_text: e.target.checked
            })}
          />
          Large Text
        </label>
        
        <label>
          Color Blind Mode
          <select
            value={preferences?.color_blind_mode}
            onChange={e => setPreferences({
              ...preferences,
              color_blind_mode: e.target.value
            })}
          >
            <option value="none">None</option>
            <option value="protanopia">Protanopia (Red-blind)</option>
            <option value="deuteranopia">Deuteranopia (Green-blind)</option>
            <option value="tritanopia">Tritanopia (Blue-blind)</option>
          </select>
        </label>
      </section>
      
      <section>
        <h3>Motion</h3>
        
        <label>
          <input
            type="checkbox"
            checked={preferences?.reduce_motion}
            onChange={e => setPreferences({
              ...preferences,
              reduce_motion: e.target.checked
            })}
          />
          Reduce Motion
        </label>
      </section>
      
      <section>
        <h3>Interaction</h3>
        
        <label>
          <input
            type="checkbox"
            checked={preferences?.screen_reader}
            onChange={e => setPreferences({
              ...preferences,
              screen_reader: e.target.checked
            })}
          />
          Optimize for Screen Readers
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={preferences?.keyboard_only}
            onChange={e => setPreferences({
              ...preferences,
              keyboard_only: e.target.checked
            })}
          />
          Keyboard-Only Navigation
        </label>
      </section>
      
      <button onClick={savePreferences} disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};
```

### CSS Implementation

```css
/* High contrast mode */
.high-contrast {
  --bg-color: #000;
  --text-color: #fff;
  --border-color: #fff;
  --link-color: #ff0;
  --focus-color: #0ff;
}

.high-contrast * {
  background-color: var(--bg-color) !important;
  color: var(--text-color) !important;
  border-color: var(--border-color) !important;
}

/* Large text mode */
.large-text {
  font-size: 120%;
}

.large-text h1 { font-size: 2.4em; }
.large-text h2 { font-size: 2em; }
.large-text h3 { font-size: 1.6em; }

/* Reduce motion */
.reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus indicators */
.focus-thick *:focus {
  outline: 4px solid currentColor !important;
  outline-offset: 2px !important;
}

.focus-high-contrast *:focus {
  outline: 4px solid #ff0 !important;
  outline-offset: 4px !important;
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.5) !important;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip links */
.skip-links {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-links:focus {
  top: 0;
}
```

### Color Blind Filters (SVG)

```html
<!-- Add to document for color blind filters -->
<svg style="display: none;">
  <defs>
    <!-- Protanopia filter -->
    <filter id="protanopia-filter">
      <feColorMatrix type="matrix" values="
        0.567, 0.433, 0, 0, 0
        0.558, 0.442, 0, 0, 0
        0, 0.242, 0.758, 0, 0
        0, 0, 0, 1, 0"/>
    </filter>
    
    <!-- Deuteranopia filter -->
    <filter id="deuteranopia-filter">
      <feColorMatrix type="matrix" values="
        0.625, 0.375, 0, 0, 0
        0.7, 0.3, 0, 0, 0
        0, 0.3, 0.7, 0, 0
        0, 0, 0, 1, 0"/>
    </filter>
    
    <!-- Tritanopia filter -->
    <filter id="tritanopia-filter">
      <feColorMatrix type="matrix" values="
        0.95, 0.05, 0, 0, 0
        0, 0.433, 0.567, 0, 0
        0, 0.475, 0.525, 0, 0
        0, 0, 0, 1, 0"/>
    </filter>
  </defs>
</svg>
```

## Keyboard Navigation

### Keyboard Shortcuts

```typescript
// Global keyboard shortcuts
const keyboardShortcuts = {
  'Alt+1': 'Skip to main content',
  'Alt+2': 'Skip to navigation',
  'Alt+3': 'Skip to search',
  'Alt+H': 'Go to home',
  'Alt+S': 'Focus search',
  'Alt+A': 'Open accessibility settings',
  'Esc': 'Close modal/dropdown',
  '?': 'Show keyboard shortcuts help'
};

// Register keyboard handlers
document.addEventListener('keydown', (e) => {
  const key = getKeyCombo(e);
  
  switch(key) {
    case 'Alt+1':
      document.getElementById('main-content')?.focus();
      break;
    case 'Alt+2':
      document.getElementById('navigation')?.focus();
      break;
    case 'Alt+A':
      openAccessibilitySettings();
      break;
    case '?':
      if (!isInputFocused()) {
        showKeyboardHelp();
      }
      break;
  }
});
```

## ARIA Implementation

### Dynamic Content Updates

```typescript
// Live region for announcements
const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const liveRegion = document.getElementById('live-region') ||
    createLiveRegion(priority);
  
  liveRegion.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
};

const createLiveRegion = (priority: string) => {
  const region = document.createElement('div');
  region.id = 'live-region';
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  document.body.appendChild(region);
  return region;
};
```

## Testing Accessibility

### Automated Testing

```typescript
// Jest + axe-core testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should support keyboard navigation', () => {
    const { getByRole } = render(<Navigation />);
    const firstLink = getByRole('link', { name: 'Home' });
    
    firstLink.focus();
    expect(document.activeElement).toBe(firstLink);
    
    fireEvent.keyDown(firstLink, { key: 'Tab' });
    expect(document.activeElement).toBe(
      getByRole('link', { name: 'About' })
    );
  });
  
  it('should have proper ARIA labels', () => {
    const { getByLabelText } = render(<SearchForm />);
    expect(getByLabelText('Search')).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

- [ ] Navigate entire page using only keyboard
- [ ] All interactive elements reachable via Tab
- [ ] Focus indicators clearly visible
- [ ] Escape key closes modals/dropdowns
- [ ] Screen reader announces all content correctly
- [ ] Color contrast meets WCAG AA (4.5:1 normal, 3:1 large)
- [ ] No information conveyed by color alone
- [ ] Forms have proper labels and error messages
- [ ] Images have appropriate alt text
- [ ] Videos have captions/transcripts

## Performance Impact

### Metrics

| Feature | Load Time Impact | Runtime Impact |
|---------|-----------------|----------------|
| High Contrast | 0ms | 5ms repaint |
| Large Text | 0ms | 10ms reflow |
| Reduce Motion | 0ms | -50ms (faster) |
| Screen Reader | 2ms | 0ms |
| Color Blind Filter | 0ms | 15ms render |
| Custom CSS | 1-5ms | Varies |

### Optimization

```typescript
// Lazy load accessibility features
const loadAccessibilityFeature = async (feature: string) => {
  switch(feature) {
    case 'colorBlind':
      await import('./colorBlindFilters');
      break;
    case 'screenReader':
      await import('./screenReaderEnhancements');
      break;
    case 'keyboard':
      await import('./keyboardNavigation');
      break;
  }
};

// Only load when needed
if (preferences.color_blind_mode !== 'none') {
  loadAccessibilityFeature('colorBlind');
}
```

---

*For accessibility support, contact: accessibility@gastat.gov.sa*