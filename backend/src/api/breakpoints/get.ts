import { Request, Response } from 'express';

export interface BreakpointConfig {
  id: string;
  name: string;
  minWidth: number;
  maxWidth?: number;
  alias: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'wide';
  orientation?: 'portrait' | 'landscape' | 'any';
  containerQueries?: boolean;
  priority: number;
}

const SYSTEM_BREAKPOINTS: BreakpointConfig[] = [
  {
    id: 'xs',
    name: 'Mobile',
    minWidth: 320,
    maxWidth: 767,
    alias: 'xs',
    deviceType: 'mobile',
    orientation: 'any',
    containerQueries: true,
    priority: 1,
  },
  {
    id: 'sm',
    name: 'Tablet',
    minWidth: 768,
    maxWidth: 1023,
    alias: 'sm',
    deviceType: 'tablet',
    orientation: 'any',
    containerQueries: true,
    priority: 2,
  },
  {
    id: 'md',
    name: 'Desktop',
    minWidth: 1024,
    maxWidth: 1439,
    alias: 'md',
    deviceType: 'desktop',
    orientation: 'any',
    containerQueries: true,
    priority: 3,
  },
  {
    id: 'lg',
    name: 'Wide Screen',
    minWidth: 1440,
    alias: 'lg',
    deviceType: 'wide',
    orientation: 'landscape',
    containerQueries: true,
    priority: 4,
  }
];

export async function getBreakpoints(req: Request, res: Response) {
  try {
    return res.json({
      breakpoints: SYSTEM_BREAKPOINTS,
      count: SYSTEM_BREAKPOINTS.length,
      cssVariables: {
        '--breakpoint-xs': '320px',
        '--breakpoint-sm': '768px',
        '--breakpoint-md': '1024px',
        '--breakpoint-lg': '1440px',
      }
    });
  } catch (error) {
    console.error('Error fetching breakpoints:', error);
    return res.status(500).json({
      error: 'Failed to fetch breakpoints'
    });
  }
}