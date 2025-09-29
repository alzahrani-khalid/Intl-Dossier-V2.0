/**
 * Responsive user preference model for design compliance flows.
 * Mirrors UserPreference schema from the spec (responsive-compliance).
 */
export type ViewportView = 'mobile' | 'tablet' | 'desktop' | 'auto';

export interface ViewportPreference {
  preferredView?: ViewportView;
  /** Force the app to emulate the preferred viewport */
  forceViewport?: boolean;
  /** Zoom level multiplier (e.g., 1 = 100%, 1.25 = 125%) */
  zoomLevel?: number;
}

export type PreferenceTextSize = 'small' | 'medium' | 'large' | 'extra-large';
export type PreferenceLanguage = 'ar' | 'en';
export type PreferenceDirection = 'rtl' | 'ltr' | 'auto';
export type ComponentDensity = 'compact' | 'normal' | 'comfortable';

export interface UserPreference {
  viewportPreference?: ViewportPreference;
  themeId?: string;
  textSize?: PreferenceTextSize;
  reducedMotion?: boolean;
  highContrast?: boolean;
  language?: PreferenceLanguage;
  direction?: PreferenceDirection;
  componentDensity?: ComponentDensity;
}

/**
 * If needed by other modules: update payload shape.
 */
export type UserPreferenceUpdate = Partial<UserPreference>;

