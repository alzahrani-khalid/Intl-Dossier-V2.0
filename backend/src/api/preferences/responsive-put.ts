import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface UserPreferenceUpdate {
  viewportPreference?: {
    preferredView?: 'mobile' | 'tablet' | 'desktop' | 'auto';
    forceViewport?: boolean;
    zoomLevel?: number;
    scrollBehavior?: 'smooth' | 'instant';
  };
  themeId?: string;
  textSize?: 'small' | 'medium' | 'large' | 'extra-large';
  reducedMotion?: boolean;
  highContrast?: boolean;
  language?: 'ar' | 'en';
  direction?: 'rtl' | 'ltr' | 'auto';
  componentDensity?: 'compact' | 'normal' | 'comfortable';
}

export async function updateResponsivePreferences(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    const updates: UserPreferenceUpdate = req.body;
    
    // Validate zoom level if provided
    if (updates.viewportPreference?.zoomLevel !== undefined) {
      const zoom = updates.viewportPreference.zoomLevel;
      if (zoom < 50 || zoom > 200) {
        return res.status(400).json({
          error: 'Zoom level must be between 50 and 200'
        });
      }
    }
    
    // Validate text size
    const validTextSizes = ['small', 'medium', 'large', 'extra-large'];
    if (updates.textSize && !validTextSizes.includes(updates.textSize)) {
      return res.status(400).json({
        error: `Invalid text size. Must be one of: ${validTextSizes.join(', ')}`
      });
    }
    
    // Validate component density
    const validDensities = ['compact', 'normal', 'comfortable'];
    if (updates.componentDensity && !validDensities.includes(updates.componentDensity)) {
      return res.status(400).json({
        error: `Invalid component density. Must be one of: ${validDensities.join(', ')}`
      });
    }
    
    // Prepare database update
    const dbUpdate = {
      user_id: userId,
      viewport_preference: updates.viewportPreference,
      theme_id: updates.themeId,
      text_size: updates.textSize,
      reduced_motion: updates.reducedMotion,
      high_contrast: updates.highContrast,
      language: updates.language,
      direction: updates.direction,
      component_density: updates.componentDensity,
      updated_at: new Date().toISOString(),
    };
    
    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    
    let result;
    if (existing) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update(dbUpdate)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert(dbUpdate)
        .select()
        .single();
    }
    
    if (result.error) {
      throw result.error;
    }
    
    // Format response
    const updatedPreferences = {
      userId: result.data.user_id,
      viewportPreference: result.data.viewport_preference,
      themeId: result.data.theme_id,
      textSize: result.data.text_size,
      reducedMotion: result.data.reduced_motion,
      highContrast: result.data.high_contrast,
      language: result.data.language,
      direction: result.data.direction,
      componentDensity: result.data.component_density,
      updatedAt: new Date(result.data.updated_at),
    };
    
    return res.json({
      message: 'Preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating responsive preferences:', error);
    return res.status(500).json({
      error: 'Failed to update preferences'
    });
  }
}