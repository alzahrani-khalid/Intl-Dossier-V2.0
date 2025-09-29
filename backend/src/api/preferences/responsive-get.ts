import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface UserPreference {
  userId: string;
  viewportPreference?: {
    preferredView: 'mobile' | 'tablet' | 'desktop' | 'auto';
    forceViewport?: boolean;
    zoomLevel?: number;
    scrollBehavior: 'smooth' | 'instant';
  };
  themeId?: string;
  textSize: 'small' | 'medium' | 'large' | 'extra-large';
  reducedMotion: boolean;
  highContrast: boolean;
  language: 'ar' | 'en';
  direction: 'rtl' | 'ltr' | 'auto';
  componentDensity: 'compact' | 'normal' | 'comfortable';
  updatedAt: Date;
}

const DEFAULT_PREFERENCES: Omit<UserPreference, 'userId'> = {
  viewportPreference: {
    preferredView: 'auto',
    forceViewport: false,
    zoomLevel: 100,
    scrollBehavior: 'smooth',
  },
  textSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  language: 'en',
  direction: 'auto',
  componentDensity: 'normal',
  updatedAt: new Date(),
};

export async function getResponsivePreferences(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (!preferences) {
      return res.json({
        ...DEFAULT_PREFERENCES,
        userId,
      });
    }
    
    const userPreferences: UserPreference = {
      userId: preferences.user_id,
      viewportPreference: preferences.viewport_preference || DEFAULT_PREFERENCES.viewportPreference,
      themeId: preferences.theme_id,
      textSize: preferences.text_size || DEFAULT_PREFERENCES.textSize,
      reducedMotion: preferences.reduced_motion ?? DEFAULT_PREFERENCES.reducedMotion,
      highContrast: preferences.high_contrast ?? DEFAULT_PREFERENCES.highContrast,
      language: preferences.language || DEFAULT_PREFERENCES.language,
      direction: preferences.direction || DEFAULT_PREFERENCES.direction,
      componentDensity: preferences.component_density || DEFAULT_PREFERENCES.componentDensity,
      updatedAt: new Date(preferences.updated_at),
    };
    
    return res.json(userPreferences);
  } catch (error) {
    console.error('Error fetching responsive preferences:', error);
    return res.status(500).json({
      error: 'Failed to fetch preferences'
    });
  }
}