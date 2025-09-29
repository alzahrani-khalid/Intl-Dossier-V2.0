/**
 * Breakpoint configuration for responsive behaviors.
 * Mirrors BreakpointConfig schema from the spec.
 */
export type BreakpointDeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';

export type BreakpointOrientation = 'portrait' | 'landscape' | 'any';

export interface BreakpointConfig {
  id: string;
  name: string;
  /** Minimum viewport width in pixels where this breakpoint becomes active */
  minWidth: number;
  /** Optional max width for this breakpoint in pixels */
  maxWidth?: number;
  /** Human-friendly alias (e.g., 'sm', 'md', 'lg', 'xl' or 'mobile') */
  alias: string;
  deviceType: BreakpointDeviceType;
  orientation?: BreakpointOrientation;
  /** Whether container queries are enabled at this breakpoint */
  containerQueries?: boolean;
}

