import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface DesignToken {
  id: string;
  category: 'color' | 'spacing' | 'typography' | 'border' | 'shadow' | 'animation' | 'breakpoint';
  name: string;
  value: string;
  cssVariable: string;
  fallback?: string;
  description?: string;
  deprecated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_TOKENS: DesignToken[] = [
  // Typography tokens
  { id: 'typography-xs', category: 'typography', name: 'Extra Small', value: '12px', cssVariable: '--text-xs', createdAt: new Date(), updatedAt: new Date() },
  { id: 'typography-sm', category: 'typography', name: 'Small', value: '14px', cssVariable: '--text-sm', createdAt: new Date(), updatedAt: new Date() },
  { id: 'typography-base', category: 'typography', name: 'Base', value: '16px', cssVariable: '--text-base', createdAt: new Date(), updatedAt: new Date() },
  { id: 'typography-lg', category: 'typography', name: 'Large', value: '20px', cssVariable: '--text-lg', createdAt: new Date(), updatedAt: new Date() },
  { id: 'typography-xl', category: 'typography', name: 'Extra Large', value: '24px', cssVariable: '--text-xl', createdAt: new Date(), updatedAt: new Date() },
  { id: 'typography-2xl', category: 'typography', name: '2X Large', value: '32px', cssVariable: '--text-2xl', createdAt: new Date(), updatedAt: new Date() },
  
  // Spacing tokens (ultra-thin)
  { id: 'spacing-xs', category: 'spacing', name: 'Extra Small', value: '0.25rem', cssVariable: '--spacing-xs', createdAt: new Date(), updatedAt: new Date() },
  { id: 'spacing-sm', category: 'spacing', name: 'Small', value: '0.5rem', cssVariable: '--spacing-sm', createdAt: new Date(), updatedAt: new Date() },
  { id: 'spacing-md', category: 'spacing', name: 'Medium', value: '0.75rem', cssVariable: '--spacing-md', createdAt: new Date(), updatedAt: new Date() },
  { id: 'spacing-lg', category: 'spacing', name: 'Large', value: '1rem', cssVariable: '--spacing-lg', createdAt: new Date(), updatedAt: new Date() },
  { id: 'spacing-xl', category: 'spacing', name: 'Extra Large', value: '1.5rem', cssVariable: '--spacing-xl', createdAt: new Date(), updatedAt: new Date() },
  
  // Border tokens (ultra-thin)
  { id: 'border-ultra', category: 'border', name: 'Ultra Thin', value: '0.5px', cssVariable: '--border-ultra', createdAt: new Date(), updatedAt: new Date() },
  { id: 'border-thin', category: 'border', name: 'Thin', value: '1px', cssVariable: '--border-thin', createdAt: new Date(), updatedAt: new Date() },
  { id: 'border-medium', category: 'border', name: 'Medium', value: '2px', cssVariable: '--border-medium', createdAt: new Date(), updatedAt: new Date() },
  
  // Breakpoint tokens
  { id: 'breakpoint-xs', category: 'breakpoint', name: 'Mobile', value: '320px', cssVariable: '--breakpoint-xs', createdAt: new Date(), updatedAt: new Date() },
  { id: 'breakpoint-sm', category: 'breakpoint', name: 'Tablet', value: '768px', cssVariable: '--breakpoint-sm', createdAt: new Date(), updatedAt: new Date() },
  { id: 'breakpoint-md', category: 'breakpoint', name: 'Desktop', value: '1024px', cssVariable: '--breakpoint-md', createdAt: new Date(), updatedAt: new Date() },
  { id: 'breakpoint-lg', category: 'breakpoint', name: 'Wide', value: '1440px', cssVariable: '--breakpoint-lg', createdAt: new Date(), updatedAt: new Date() },
];

export async function getDesignTokens(req: Request, res: Response) {
  try {
    const { category, theme } = req.query;
    
    let tokens = [...DEFAULT_TOKENS];
    
    if (category) {
      tokens = tokens.filter(t => t.category === category);
    }
    
    if (theme) {
      const { data: themeTokens } = await supabase
        .from('design_tokens')
        .select('*')
        .eq('theme', theme);
      
      if (themeTokens) {
        const themeMap = new Map(themeTokens.map(t => [t.id, t]));
        tokens = tokens.map(token => {
          const override = themeMap.get(token.id);
          return override ? { ...token, ...override } : token;
        });
      }
    }
    
    return res.json({
      tokens,
      count: tokens.length
    });
  } catch (error) {
    console.error('Error fetching design tokens:', error);
    return res.status(500).json({
      error: 'Failed to fetch design tokens'
    });
  }
}