export interface ScalingPolicy {
  id: string;
  name: string;
  
  min_concurrent_users: number;
  max_requests_per_minute: number;
  
  min_instances: number;
  max_instances: number;
  
  cpu_threshold_percent: number;
  memory_threshold_percent: number;
  threshold_duration_minutes: number;
  
  max_limit_action: 'alert' | 'degrade' | 'reject';
  degraded_features: string[];
  
  maintain_session_affinity: boolean;
  
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ScalingPolicyInput {
  name: string;
  min_concurrent_users?: number;
  max_requests_per_minute?: number;
  min_instances?: number;
  max_instances?: number;
  cpu_threshold_percent?: number;
  memory_threshold_percent?: number;
  threshold_duration_minutes?: number;
  max_limit_action?: 'alert' | 'degrade' | 'reject';
  degraded_features?: string[];
  maintain_session_affinity?: boolean;
  enabled?: boolean;
}

export interface ScalingMetrics {
  current_instances: number;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  current_requests_per_minute: number;
  concurrent_users: number;
  threshold_exceeded_duration_minutes: number;
}

export class ScalingPolicyModel {
  static readonly DEFAULT_MIN_INSTANCES = 2;
  static readonly DEFAULT_MAX_INSTANCES = 20;
  static readonly DEFAULT_CPU_THRESHOLD = 70;
  static readonly DEFAULT_MEMORY_THRESHOLD = 80;
  static readonly DEFAULT_THRESHOLD_DURATION = 5;
  static readonly DEFAULT_MIN_CONCURRENT_USERS = 1000;
  static readonly DEFAULT_MAX_REQUESTS_PER_MINUTE = 10000;
  
  static validate(data: Partial<ScalingPolicyInput>): string[] {
    const errors: string[] = [];
    
    if (!data.name) {
      errors.push('Policy name is required');
    }
    
    if (data.min_instances !== undefined) {
      if (data.min_instances < 1) {
        errors.push('Minimum instances must be at least 1');
      }
    }
    
    if (data.max_instances !== undefined) {
      if (data.max_instances > 50) {
        errors.push('Maximum instances cannot exceed 50');
      }
      if (data.min_instances && data.max_instances <= data.min_instances) {
        errors.push('Maximum instances must be greater than minimum instances');
      }
    }
    
    if (data.cpu_threshold_percent !== undefined) {
      if (data.cpu_threshold_percent < 10 || data.cpu_threshold_percent > 95) {
        errors.push('CPU threshold must be between 10% and 95%');
      }
    }
    
    if (data.memory_threshold_percent !== undefined) {
      if (data.memory_threshold_percent < 10 || data.memory_threshold_percent > 95) {
        errors.push('Memory threshold must be between 10% and 95%');
      }
    }
    
    if (data.threshold_duration_minutes !== undefined) {
      if (data.threshold_duration_minutes < 1 || data.threshold_duration_minutes > 30) {
        errors.push('Threshold duration must be between 1 and 30 minutes');
      }
    }
    
    return errors;
  }
  
  static shouldScaleUp(policy: ScalingPolicy, metrics: ScalingMetrics): boolean {
    if (!policy.enabled) return false;
    if (metrics.current_instances >= policy.max_instances) return false;
    
    const cpuExceeded = metrics.cpu_usage_percent > policy.cpu_threshold_percent;
    const memoryExceeded = metrics.memory_usage_percent > policy.memory_threshold_percent;
    const durationMet = metrics.threshold_exceeded_duration_minutes >= policy.threshold_duration_minutes;
    
    return (cpuExceeded || memoryExceeded) && durationMet;
  }
  
  static shouldScaleDown(policy: ScalingPolicy, metrics: ScalingMetrics): boolean {
    if (!policy.enabled) return false;
    if (metrics.current_instances <= policy.min_instances) return false;
    
    const cpuLow = metrics.cpu_usage_percent < (policy.cpu_threshold_percent * 0.5);
    const memoryLow = metrics.memory_usage_percent < (policy.memory_threshold_percent * 0.5);
    const lowLoad = metrics.current_requests_per_minute < (policy.max_requests_per_minute * 0.3);
    
    return cpuLow && memoryLow && lowLoad;
  }
  
  static calculateDesiredInstances(policy: ScalingPolicy, metrics: ScalingMetrics): number {
    const loadFactor = Math.max(
      metrics.cpu_usage_percent / policy.cpu_threshold_percent,
      metrics.memory_usage_percent / policy.memory_threshold_percent,
      metrics.current_requests_per_minute / policy.max_requests_per_minute,
      metrics.concurrent_users / policy.min_concurrent_users
    );
    
    const desiredInstances = Math.ceil(metrics.current_instances * loadFactor);
    
    return Math.max(
      policy.min_instances,
      Math.min(policy.max_instances, desiredInstances)
    );
  }
  
  static isAtMaxCapacity(policy: ScalingPolicy, currentInstances: number): boolean {
    return currentInstances >= policy.max_instances;
  }
  
  static getDegradationActions(policy: ScalingPolicy): string[] {
    if (!this.isAtMaxCapacity(policy, policy.max_instances)) {
      return [];
    }
    
    switch (policy.max_limit_action) {
      case 'degrade':
        return policy.degraded_features;
      case 'reject':
        return ['reject_new_requests'];
      case 'alert':
      default:
        return ['send_alert'];
    }
  }
  
  static getScalingDecision(
    policy: ScalingPolicy, 
    metrics: ScalingMetrics
  ): { action: 'scale_up' | 'scale_down' | 'maintain' | 'degrade'; target_instances?: number; features_to_disable?: string[] } {
    if (this.shouldScaleUp(policy, metrics)) {
      if (metrics.current_instances >= policy.max_instances) {
        return {
          action: 'degrade',
          features_to_disable: this.getDegradationActions(policy)
        };
      }
      return {
        action: 'scale_up',
        target_instances: this.calculateDesiredInstances(policy, metrics)
      };
    }
    
    if (this.shouldScaleDown(policy, metrics)) {
      return {
        action: 'scale_down',
        target_instances: this.calculateDesiredInstances(policy, metrics)
      };
    }
    
    return { action: 'maintain' };
  }
}