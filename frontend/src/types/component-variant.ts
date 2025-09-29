import type { BreakpointDeviceType } from './breakpoint';

/**
 * Accessibility metadata for a component variant.
 */
export interface VariantAccessibility {
  ariaLabel?: string;
  ariaLabelAr?: string;
  role?: string;
  focusable?: boolean;
}

/**
 * Describes a particular variant of a component (e.g., Button solid/sm).
 * Mirrors ComponentVariant schema from the spec.
 */
export type VariantSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ComponentVariant {
  id: string;
  componentName: string;
  /** e.g., 'solid', 'outline', 'ghost' */
  variant: string;
  size?: VariantSize;
  /** Arbitrary props applied to the component for this variant */
  props?: Record<string, unknown>;
  /** Optional className for Tailwind or utility classes */
  className?: string;
  rtlSupport: boolean;
  accessibility?: VariantAccessibility;
}

/**
 * Responsive variant definition: base configuration with breakpoint-specific overrides.
 * Useful when a component changes props/classes across device types.
 */
export interface ResponsiveVariant {
  base: ComponentVariant;
  /**
   * Optional overrides per device type. Only the provided fields are overridden.
   */
  overrides?: Partial<Record<BreakpointDeviceType, Partial<ComponentVariant>>>;
}

