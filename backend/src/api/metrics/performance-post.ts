import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface PerformanceMetric {
  metricType: 'validation_time' | 'layout_shift' | 'resize_performance' | 'theme_switch' | 'component_render';
  value: number;
  unit: 'ms' | 'px' | 'count' | 'percentage';
  viewport: number;
  componentName?: string;
  pageUrl?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export async function recordPerformanceMetric(req: Request, res: Response) {
  try {
    const metric: PerformanceMetric = req.body;
    
    // Validate required fields
    if (!metric.metricType || metric.value === undefined || !metric.unit || !metric.viewport || !metric.sessionId) {
      return res.status(400).json({
        error: 'Missing required fields: metricType, value, unit, viewport, sessionId'
      });
    }
    
    // Validate metric type
    const validMetricTypes = ['validation_time', 'layout_shift', 'resize_performance', 'theme_switch', 'component_render'];
    if (!validMetricTypes.includes(metric.metricType)) {
      return res.status(400).json({
        error: `Invalid metric type. Must be one of: ${validMetricTypes.join(', ')}`
      });
    }
    
    // Validate unit
    const validUnits = ['ms', 'px', 'count', 'percentage'];
    if (!validUnits.includes(metric.unit)) {
      return res.status(400).json({
        error: `Invalid unit. Must be one of: ${validUnits.join(', ')}`
      });
    }
    
    // Validate viewport
    if (metric.viewport < 320 || metric.viewport > 7680) {
      return res.status(400).json({
        error: 'Viewport must be between 320 and 7680 pixels'
      });
    }
    
    // Store metric
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        metric_type: metric.metricType,
        value: metric.value,
        unit: metric.unit,
        viewport: metric.viewport,
        component_name: metric.componentName,
        page_url: metric.pageUrl,
        session_id: metric.sessionId,
        metadata: metric.metadata,
        timestamp: new Date().toISOString(),
      });
    
    if (error) {
      throw error;
    }
    
    // Check for performance issues
    const warnings = [];
    
    if (metric.metricType === 'validation_time' && metric.unit === 'ms' && metric.value > 500) {
      warnings.push(`Validation time exceeded 500ms limit: ${metric.value}ms`);
    }
    
    if (metric.metricType === 'layout_shift' && metric.value > 0.1) {
      warnings.push(`Layout shift exceeds recommended threshold: ${metric.value}`);
    }
    
    if (metric.metricType === 'component_render' && metric.unit === 'ms' && metric.value > 100) {
      warnings.push(`Component render time exceeds 100ms: ${metric.value}ms`);
    }
    
    return res.status(201).json({
      message: 'Performance metric recorded successfully',
      warnings,
      metric: {
        ...metric,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error recording performance metric:', error);
    return res.status(500).json({
      error: 'Failed to record performance metric'
    });
  }
}