export interface RateLimitPolicy {
  id: string;
  name: string;
  description?: string;
  
  requests_per_minute: number;
  burst_capacity: number;
  
  applies_to: 'authenticated' | 'anonymous' | 'role';
  role_id?: string;
  
  endpoint_type: 'api' | 'upload' | 'report' | 'all';
  
  retry_after_seconds: number;
  
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RateLimitPolicyInput {
  name: string;
  description?: string;
  requests_per_minute: number;
  burst_capacity: number;
  applies_to: 'authenticated' | 'anonymous' | 'role';
  role_id?: string;
  endpoint_type: 'api' | 'upload' | 'report' | 'all';
  retry_after_seconds?: number;
  enabled?: boolean;
}

export interface TokenBucketState {
  tokens: number;
  last_refill: Date;
}

export class RateLimitPolicyModel {
  static readonly DEFAULT_AUTHENTICATED_LIMIT = 300;
  static readonly DEFAULT_ANONYMOUS_LIMIT = 50;
  static readonly DEFAULT_BURST_CAPACITY = 50;
  static readonly DEFAULT_RETRY_AFTER = 60;
  
  static validate(data: Partial<RateLimitPolicyInput>): string[] {
    const errors: string[] = [];
    
    if (!data.name) {
      errors.push('Policy name is required');
    }
    
    if (!data.requests_per_minute || data.requests_per_minute <= 0) {
      errors.push('Requests per minute must be greater than 0');
    }
    
    if (data.burst_capacity !== undefined) {
      if (data.burst_capacity < 0) {
        errors.push('Burst capacity must be non-negative');
      }
      if (data.requests_per_minute && data.burst_capacity > data.requests_per_minute) {
        errors.push('Burst capacity must not exceed requests per minute');
      }
    }
    
    if (data.retry_after_seconds !== undefined) {
      if (data.retry_after_seconds < 1 || data.retry_after_seconds > 3600) {
        errors.push('Retry after seconds must be between 1 and 3600');
      }
    }
    
    if (data.applies_to === 'role' && !data.role_id) {
      errors.push('Role ID is required when applies_to is "role"');
    }
    
    return errors;
  }
  
  static calculateTokensToAdd(
    policy: RateLimitPolicy,
    lastRefill: Date,
    now: Date = new Date()
  ): number {
    const timeDiffMs = now.getTime() - lastRefill.getTime();
    const timeDiffMinutes = timeDiffMs / 60000;
    
    const tokensToAdd = Math.floor(policy.requests_per_minute * timeDiffMinutes);
    return Math.min(tokensToAdd, policy.burst_capacity);
  }
  
  static consumeTokens(
    state: TokenBucketState,
    policy: RateLimitPolicy,
    tokensRequested: number = 1
  ): { allowed: boolean; tokens_remaining: number; retry_after?: number } {
    const now = new Date();
    const tokensToAdd = this.calculateTokensToAdd(policy, state.last_refill, now);
    
    state.tokens = Math.min(state.tokens + tokensToAdd, policy.burst_capacity);
    state.last_refill = now;
    
    if (state.tokens >= tokensRequested) {
      state.tokens -= tokensRequested;
      return { 
        allowed: true, 
        tokens_remaining: state.tokens 
      };
    }
    
    const tokensNeeded = tokensRequested - state.tokens;
    const minutesUntilRefill = Math.ceil(tokensNeeded / policy.requests_per_minute);
    
    return {
      allowed: false,
      tokens_remaining: state.tokens,
      retry_after: Math.min(minutesUntilRefill * 60, policy.retry_after_seconds)
    };
  }
  
  static getDefaultPolicy(userType: 'authenticated' | 'anonymous'): Partial<RateLimitPolicyInput> {
    return {
      requests_per_minute: userType === 'authenticated' 
        ? this.DEFAULT_AUTHENTICATED_LIMIT 
        : this.DEFAULT_ANONYMOUS_LIMIT,
      burst_capacity: userType === 'authenticated'
        ? this.DEFAULT_BURST_CAPACITY
        : 10,
      applies_to: userType,
      endpoint_type: 'all',
      retry_after_seconds: this.DEFAULT_RETRY_AFTER,
      enabled: true
    };
  }
  
  static getCacheKey(userId?: string, ip?: string, endpoint?: string): string {
    const parts = ['rate_limit'];
    
    if (userId) {
      parts.push('user', userId);
    } else if (ip) {
      parts.push('ip', ip);
    }
    
    if (endpoint) {
      parts.push('endpoint', endpoint);
    }
    
    return parts.join(':');
  }
}