/**
 * Design token definition used for responsive design and theming.
 * Mirrors the schema in specs/007-responsive-design-compliance/contracts/api-spec.yaml.
 */
export type DesignTokenCategory =
  | 'color'
  | 'spacing'
  | 'typography'
  | 'border'
  | 'shadow'
  | 'animation';

export interface DesignToken {
  id?: string;
  category: DesignTokenCategory;
  name: string;
  value: string;
  /** CSS custom property name, e.g. --color-primary */
  cssVariable: string;
  fallback?: string;
  description?: string;
  deprecated?: boolean;
}

