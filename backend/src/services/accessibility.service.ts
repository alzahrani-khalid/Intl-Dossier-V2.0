type Token = string;

export interface AccessibilityPrefs {
  high_contrast: boolean;
  large_text: boolean;
  reduce_motion: boolean;
  screen_reader: boolean;
  keyboard_only: boolean;
  focus_indicators: 'default' | 'enhanced' | 'none';
}

const defaults: AccessibilityPrefs = {
  high_contrast: false,
  large_text: false,
  reduce_motion: false,
  screen_reader: false,
  keyboard_only: false,
  focus_indicators: 'default'
};

const store = new Map<Token, AccessibilityPrefs>();

export class AccessibilityService {
  get(token: Token): AccessibilityPrefs { return store.get(token) || { ...defaults }; }
  set(token: Token, prefs: Partial<AccessibilityPrefs>): AccessibilityPrefs {
    const current = store.get(token) || { ...defaults };
    const next = { ...current, ...prefs };
    store.set(token, next);
    return next;
  }
}

export const accessibilityService = new AccessibilityService();

