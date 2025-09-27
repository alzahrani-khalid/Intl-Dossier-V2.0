# Data Model: Theme Selection System

**Date**: 2025-09-27  
**Feature**: Theme Selection System  
**Branch**: `006-i-need-you`

## Entity Definitions

### 1. UserPreference
**Description**: Stores user-specific theme, language, and display preferences  
**Storage**: Supabase PostgreSQL table with RLS policies

#### Attributes
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | Auto-generated |
| user_id | UUID | Yes | Foreign key to users table | References auth.users(id) |
| theme | String | Yes | Selected theme name | Enum: ['gastat', 'blueSky'] |
| color_mode | String | Yes | Light or dark mode | Enum: ['light', 'dark', 'system'] |
| language | String | Yes | Interface language | Enum: ['en', 'ar'] |
| created_at | Timestamp | Yes | Record creation time | Auto-generated |
| updated_at | Timestamp | Yes | Last update time | Auto-updated |

#### Indexes
- Primary: id
- Unique: user_id (one preference per user)
- Performance: (user_id, updated_at) for quick lookups

#### RLS Policies
- SELECT: Users can only read their own preferences
- INSERT: Users can only create their own preferences
- UPDATE: Users can only update their own preferences
- DELETE: Users cannot delete preferences (soft delete via updated_at)

### 2. ThemeConfiguration
**Description**: Runtime configuration for available themes  
**Storage**: Frontend constants/configuration file

#### Structure
```typescript
interface ThemeConfiguration {
  name: 'gastat' | 'blueSky';
  displayName: {
    en: string;
    ar: string;
  };
  cssVariables: {
    light: ThemeVariables;
    dark: ThemeVariables;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  radius: string;
}

interface ThemeVariables {
  // Colors
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  
  // Component-specific
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  
  // Sidebar
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  
  // Charts
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  
  // Shadows
  shadow2xs: string;
  shadowXs: string;
  shadowSm: string;
  shadow: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadow2xl: string;
}
```

### 3. LanguageConfiguration
**Description**: Language and localization settings  
**Storage**: Frontend i18n configuration

#### Structure
```typescript
interface LanguageConfiguration {
  code: 'en' | 'ar';
  name: {
    en: string;
    ar: string;
  };
  direction: 'ltr' | 'rtl';
  locale: string; // e.g., 'en-US', 'ar-SA'
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
  calendar: 'gregorian' | 'hijri';
}
```

### 4. TranslationBundle
**Description**: Translations for UI text  
**Storage**: JSON files in i18n directory

#### Structure
```typescript
interface TranslationBundle {
  common: {
    [key: string]: string;
  };
  navigation: {
    [key: string]: string;
  };
  settings: {
    theme: {
      title: string;
      gastat: string;
      blueSky: string;
      light: string;
      dark: string;
      system: string;
    };
    language: {
      title: string;
      english: string;
      arabic: string;
    };
  };
  accessibility: {
    themeChanged: string;
    languageChanged: string;
    darkModeEnabled: string;
    lightModeEnabled: string;
  };
  errors: {
    [key: string]: string;
  };
}
```

## State Management

### Local State (Frontend)
```typescript
interface ThemeState {
  // Current selections
  activeTheme: 'gastat' | 'blueSky';
  activeColorMode: 'light' | 'dark' | 'system';
  activeLanguage: 'en' | 'ar';
  
  // System preferences
  systemColorMode: 'light' | 'dark';
  browserLanguage: 'en' | 'ar' | null;
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  
  // Error state
  error: string | null;
}
```

### Persistence Layer
```typescript
interface PersistenceSchema {
  localStorage: {
    'theme-preference': {
      theme: string;
      colorMode: string;
      language: string;
      timestamp: number;
    };
  };
  
  supabase: {
    user_preferences: UserPreference;
  };
}
```

## Data Flow

### 1. Initial Load
```
1. Check localStorage for preferences
2. If found and < 24 hours old, apply immediately
3. Check system preferences (prefers-color-scheme, navigator.language)
4. If authenticated, fetch from Supabase
5. Merge preferences (Supabase > localStorage > system > defaults)
6. Apply final preferences to DOM
```

### 2. Preference Update
```
1. User selects new theme/mode/language
2. Apply immediately to DOM (optimistic update)
3. Save to localStorage
4. If authenticated, sync to Supabase (async)
5. Broadcast to other tabs/windows
6. Update success/error state
```

### 3. Cross-Tab Synchronization
```
1. Use BroadcastChannel API or storage events
2. Listen for preference changes from other tabs
3. Apply changes if timestamp is newer
4. Prevent circular updates with debouncing
```

## Validation Rules

### Theme Validation
- Must be one of: 'gastat', 'blueSky'
- Default to 'gastat' if invalid

### Color Mode Validation
- Must be one of: 'light', 'dark', 'system'
- Default to 'light' if invalid

### Language Validation
- Must be one of: 'en', 'ar'
- Default to 'en' if invalid

### Update Frequency
- Maximum 1 update per second per user
- Debounce rapid changes on frontend
- Rate limit API to 60 updates per minute

## Migration Strategy

### Database Migration
```sql
-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT NOT NULL CHECK (theme IN ('gastat', 'blueSky')),
  color_mode TEXT NOT NULL CHECK (color_mode IN ('light', 'dark', 'system')),
  language TEXT NOT NULL CHECK (language IN ('en', 'ar')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Default Data
```typescript
const DEFAULT_PREFERENCES = {
  theme: 'gastat',
  colorMode: 'light',
  language: 'en'
} as const;

const AVAILABLE_THEMES = [
  {
    name: 'gastat',
    displayName: { en: 'GASTAT', ar: 'الهيئة العامة للإحصاء' }
  },
  {
    name: 'blueSky',
    displayName: { en: 'Blue Sky', ar: 'السماء الزرقاء' }
  }
] as const;

const AVAILABLE_LANGUAGES = [
  {
    code: 'en',
    name: { en: 'English', ar: 'الإنجليزية' },
    direction: 'ltr'
  },
  {
    code: 'ar',
    name: { en: 'Arabic', ar: 'العربية' },
    direction: 'rtl'
  }
] as const;
```