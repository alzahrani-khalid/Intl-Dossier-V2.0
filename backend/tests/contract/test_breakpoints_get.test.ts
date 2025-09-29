import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/breakpoints', () => {
  beforeAll(async () => {
    // Setup test database connection if needed
  });

  afterAll(async () => {
    // Cleanup test database if needed
  });

  it('should return 200 with breakpoint configuration', async () => {
    const response = await request(app)
      .get('/api/breakpoints')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('breakpoints');
    expect(Array.isArray(response.body.breakpoints)).toBe(true);
  });

  it('should return proper schema for breakpoints', async () => {
    const response = await request(app)
      .get('/api/breakpoints')
      .expect(200);

    expect(response.body.breakpoints.length).toBeGreaterThan(0);
    
    const breakpoint = response.body.breakpoints[0];
    expect(breakpoint).toHaveProperty('id');
    expect(breakpoint).toHaveProperty('name');
    expect(breakpoint).toHaveProperty('minWidth');
    expect(breakpoint).toHaveProperty('alias');
    expect(breakpoint).toHaveProperty('deviceType');
    
    expect(typeof breakpoint.minWidth).toBe('number');
    expect(['mobile', 'tablet', 'desktop', 'wide']).toContain(breakpoint.deviceType);
    
    if (breakpoint.orientation) {
      expect(['portrait', 'landscape', 'any']).toContain(breakpoint.orientation);
    }
    
    if (breakpoint.containerQueries !== undefined) {
      expect(typeof breakpoint.containerQueries).toBe('boolean');
    }
  });

  it('should include standard breakpoints', async () => {
    const response = await request(app)
      .get('/api/breakpoints')
      .expect(200);

    const breakpoints = response.body.breakpoints;
    const minWidths = breakpoints.map((bp: any) => bp.minWidth);
    
    // Check for standard responsive breakpoints
    expect(minWidths).toContain(320);  // Mobile
    expect(minWidths).toContain(768);  // Tablet
    expect(minWidths).toContain(1024); // Desktop
    expect(minWidths).toContain(1440); // Wide
  });

  it('should have proper device type classification', async () => {
    const response = await request(app)
      .get('/api/breakpoints')
      .expect(200);

    const breakpoints = response.body.breakpoints;
    
    // Find mobile breakpoint
    const mobile = breakpoints.find((bp: any) => bp.minWidth === 320);
    expect(mobile).toBeDefined();
    expect(mobile.deviceType).toBe('mobile');
    
    // Find tablet breakpoint
    const tablet = breakpoints.find((bp: any) => bp.minWidth === 768);
    expect(tablet).toBeDefined();
    expect(tablet.deviceType).toBe('tablet');
    
    // Find desktop breakpoint
    const desktop = breakpoints.find((bp: any) => bp.minWidth === 1024);
    expect(desktop).toBeDefined();
    expect(desktop.deviceType).toBe('desktop');
    
    // Find wide breakpoint
    const wide = breakpoints.find((bp: any) => bp.minWidth === 1440);
    expect(wide).toBeDefined();
    expect(wide.deviceType).toBe('wide');
  });

  it('should be sorted by minWidth ascending', async () => {
    const response = await request(app)
      .get('/api/breakpoints')
      .expect(200);

    const breakpoints = response.body.breakpoints;
    for (let i = 1; i < breakpoints.length; i++) {
      expect(breakpoints[i].minWidth).toBeGreaterThanOrEqual(breakpoints[i - 1].minWidth);
    }
  });

  it('should include aliases for breakpoints', async () => {
    const response = await request(app)
      .get('/api/breakpoints')
      .expect(200);

    const breakpoints = response.body.breakpoints;
    breakpoints.forEach((bp: any) => {
      expect(bp.alias).toBeDefined();
      expect(bp.alias.length).toBeGreaterThan(0);
      // Aliases should be short identifiers like 'sm', 'md', 'lg', 'xl'
      expect(bp.alias.length).toBeLessThanOrEqual(4);
    });
  });

  it('should have unique IDs for each breakpoint', async () => {
    const response = await request(app)
      .get('/api/breakpoints')
      .expect(200);

    const breakpoints = response.body.breakpoints;
    const ids = breakpoints.map((bp: any) => bp.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(ids.length);
  });
});