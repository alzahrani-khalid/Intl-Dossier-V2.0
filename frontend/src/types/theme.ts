/**
 * Theme variant definition for responsive/RTL-aware themes.
 * Mirrors ThemeVariant schema from the spec.
 */
export type TextDirection = 'ltr' | 'rtl';
export type ContrastLevel = 'normal' | 'high';
export type MotionPreference = 'normal' | 'reduced';

export interface ThemeVariant {
  id: string;
  name: string;
  /** Arbitrary token bag (e.g., CSS vars, scales). May be nested. */
  tokens?: Record<string, unknown>;
  direction: TextDirection;
  contrast?: ContrastLevel;
  motion?: MotionPreference;
  isDefault: boolean;
}

