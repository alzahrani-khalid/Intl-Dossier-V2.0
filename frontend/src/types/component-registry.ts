/**
 * Component registry entry describing a UI component source and metadata.
 * Mirrors the schema in specs/007-responsive-design-compliance/contracts/api-spec.yaml.
 */
export type ComponentSource = 'shadcn' | 'custom';

export type ComponentCategory =
  | 'layout'
  | 'form'
  | 'display'
  | 'feedback'
  | 'navigation'
  | 'overlay';

export interface ComponentRegistry {
  name: string;
  version: string;
  source: ComponentSource;
  category: ComponentCategory;
  /** Import path within the codebase (e.g., components/ui/button) */
  path: string;
  dependencies?: string[];
  documentation?: string;
}

