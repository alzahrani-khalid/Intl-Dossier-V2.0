import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive, useBreakpoint, useMediaQuery, BREAKPOINTS } from '../../../src/hooks/use-responsive';

describe('useResponsive', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  const setWindowSize = (width: number, height: number = 768) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  };

  it('should detect mobile viewport correctly', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      setWindowSize(320);
    });

    expect(result.current.viewport).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isWide).toBe(false);
    expect(result.current.breakpoint).toBe('xs');
  });

  it('should detect tablet viewport correctly', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      setWindowSize(768);
    });

    expect(result.current.viewport).toBe('tablet');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isWide).toBe(false);
    expect(result.current.breakpoint).toBe('sm');
  });

  it('should detect desktop viewport correctly', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      setWindowSize(1024);
    });

    expect(result.current.viewport).toBe('desktop');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isWide).toBe(false);
    expect(result.current.breakpoint).toBe('md');
  });

  it('should detect wide viewport correctly', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      setWindowSize(1440);
    });

    expect(result.current.viewport).toBe('wide');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isWide).toBe(true);
    expect(result.current.breakpoint).toBe('lg');
  });

  it('should update on window resize', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      setWindowSize(320);
    });
    expect(result.current.viewport).toBe('mobile');

    act(() => {
      setWindowSize(1024);
    });
    expect(result.current.viewport).toBe('desktop');
  });

  it('should provide correct breakpoint values', () => {
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.breakpoints).toEqual(BREAKPOINTS);
    expect(result.current.breakpoints.xs).toBe(320);
    expect(result.current.breakpoints.sm).toBe(768);
    expect(result.current.breakpoints.md).toBe(1024);
    expect(result.current.breakpoints.lg).toBe(1440);
  });

  it('should handle orientation change', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      setWindowSize(768, 1024);
      window.dispatchEvent(new Event('orientationchange'));
    });

    expect(result.current.width).toBe(768);
    expect(result.current.height).toBe(1024);
  });
});

describe('useBreakpoint', () => {
  it('should return true when viewport is at or above breakpoint', () => {
    const { result: responsiveResult } = renderHook(() => useResponsive());
    
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      window.dispatchEvent(new Event('resize'));
    });

    const { result: breakpointResult } = renderHook(() => useBreakpoint('md'));
    expect(breakpointResult.current).toBe(true);

    const { result: smallBreakpointResult } = renderHook(() => useBreakpoint('sm'));
    expect(smallBreakpointResult.current).toBe(true);
  });

  it('should return false when viewport is below breakpoint', () => {
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      window.dispatchEvent(new Event('resize'));
    });

    const { result } = renderHook(() => useBreakpoint('md'));
    expect(result.current).toBe(false);
  });
});

describe('useMediaQuery', () => {
  let matchMediaMock: vi.SpyInstance;

  beforeEach(() => {
    matchMediaMock = vi.spyOn(window, 'matchMedia');
  });

  afterEach(() => {
    matchMediaMock.mockRestore();
  });

  it('should match media query correctly', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query === '(min-width: 768px)',
      media: query,
      addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      },
      removeEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      },
    }));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);

    const { result: falseResult } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(falseResult.current).toBe(false);
  });

  it('should update when media query changes', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    let currentMatches = false;

    matchMediaMock.mockImplementation((query: string) => ({
      matches: currentMatches,
      media: query,
      addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      },
      removeEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      },
    }));

    const { result, rerender } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      currentMatches = true;
      listeners.forEach(listener => 
        listener({ matches: true, media: '(min-width: 768px)' } as MediaQueryListEvent)
      );
    });

    expect(result.current).toBe(true);
  });

  it('should handle legacy addListener API', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];

    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addListener: (listener: (e: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      },
      removeListener: (listener: (e: MediaQueryListEvent) => void) => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      },
    }));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach(listener => 
        listener({ matches: true, media: '(min-width: 768px)' } as MediaQueryListEvent)
      );
    });

    expect(result.current).toBe(true);
  });

  it('should clean up listeners on unmount', () => {
    const removeEventListenerSpy = vi.fn();
    
    matchMediaMock.mockImplementation(() => ({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerSpy,
    }));

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});

describe('Edge Cases', () => {
  it('should handle boundary viewport widths', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.viewport).toBe('mobile');

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.viewport).toBe('tablet');

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1023,
      });
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.viewport).toBe('tablet');

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.viewport).toBe('desktop');
  });

  it('should handle SSR environment', () => {
    const windowSpy = vi.spyOn(global, 'window', 'get');
    windowSpy.mockImplementation(() => undefined as any);

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.viewport).toBe('desktop');
    expect(result.current.width).toBe(1024);
    expect(result.current.matches('(min-width: 768px)')).toBe(false);

    windowSpy.mockRestore();
  });
});