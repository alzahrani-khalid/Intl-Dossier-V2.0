import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface DesignTokenInput {
  id: string;
  category: 'color' | 'spacing' | 'typography' | 'border' | 'shadow' | 'animation' | 'breakpoint';
  name: string;
  value: string;
  cssVariable: string;
  fallback?: string;
  description?: string;
  deprecated?: boolean;
}

export async function createOrUpdateDesignToken(req: Request, res: Response) {
  try {
    const token: DesignTokenInput = req.body;
    
    if (!token.id || !token.category || !token.name || !token.value || !token.cssVariable) {
      return res.status(400).json({
        error: 'Missing required fields: id, category, name, value, cssVariable'
      });
    }
    
    const validCategories = ['color', 'spacing', 'typography', 'border', 'shadow', 'animation', 'breakpoint'];
    if (!validCategories.includes(token.category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }
    
    const tokenNamePattern = /^[a-z0-9-]+$/;
    if (!tokenNamePattern.test(token.id)) {
      return res.status(400).json({
        error: 'Token ID must contain only lowercase letters, numbers, and hyphens'
      });
    }
    
    const cssVariablePattern = /^--[a-z0-9-]+$/;
    if (!cssVariablePattern.test(token.cssVariable)) {
      return res.status(400).json({
        error: 'CSS variable must start with -- and contain only lowercase letters, numbers, and hyphens'
      });
    }
    
    const { data: existingToken } = await supabase
      .from('design_tokens')
      .select('id')
      .eq('id', token.id)
      .single();
    
    const tokenData = {
      ...token,
      updated_at: new Date().toISOString()
    };
    
    if (existingToken) {
      const { error } = await supabase
        .from('design_tokens')
        .update(tokenData)
        .eq('id', token.id);
      
      if (error) throw error;
      
      return res.status(200).json({
        message: 'Design token updated successfully',
        token: tokenData
      });
    } else {
      const { error } = await supabase
        .from('design_tokens')
        .insert({
          ...tokenData,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      return res.status(201).json({
        message: 'Design token created successfully',
        token: tokenData
      });
    }
  } catch (error) {
    console.error('Error creating/updating design token:', error);
    return res.status(500).json({
      error: 'Failed to create or update design token'
    });
  }
}