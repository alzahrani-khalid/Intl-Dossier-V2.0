/**
 * Performance metric used in responsive design validation telemetry.
 * Mirrors PerformanceMetric schema from the spec.
 */
export type MetricType =
  | 'validation_time'
  | 'layout_shift'
  | 'resize_performance'
  | 'theme_switch'
  | 'component_render';

export type MetricUnit = 'ms' | 'px' | 'count' | 'percentage';

export interface PerformanceMetric {
  metricType: MetricType;
  value: number;
  unit: MetricUnit;
  /** Current viewport width (px) when the metric was captured */
  viewport: number;
  componentName?: string;
  pageUrl?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

